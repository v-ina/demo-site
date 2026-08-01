import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const source = new URL(process.argv[2] ?? "http://localhost:3000/");
const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "site");
const snapshotVersion = Date.now().toString(36);
const pageQueue = [new URL("/", source)];
const queuedPages = new Set(["/"]);
const savedAssets = new Map();
const failedAssets = [];
const pageResults = [];

const excludedPrefixes = ["/admin", "/auth", "/api", "/_next"];
const assetExtensions = new Set([
  ".avif", ".css", ".gif", ".ico", ".jpeg", ".jpg", ".json", ".png",
  ".svg", ".webp", ".woff", ".woff2", ".xml", ".txt"
]);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

function normalizePagePath(url) {
  let pathname = decodeURIComponent(url.pathname).replace(/\/{2,}/g, "/");
  if (pathname !== "/") pathname = pathname.replace(/\/$/, "");
  return pathname || "/";
}

function isPublicPage(url) {
  if (url.origin !== source.origin) return false;
  const pathname = normalizePagePath(url);
  if (excludedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false;
  }
  const extension = path.posix.extname(pathname).toLowerCase();
  return !extension || !assetExtensions.has(extension);
}

function pageFile(pathname) {
  const clean = pathname === "/" ? "" : pathname.replace(/^\//, "");
  return path.join(output, clean, "index.html");
}

function pageDirectory(pathname) {
  return pathname === "/" ? "" : pathname.replace(/^\//, "");
}

function relativeUrl(fromDirectory, toPath) {
  const relative = path.posix.relative(fromDirectory || ".", toPath || ".");
  return relative || ".";
}

function extensionFor(contentType, pathname) {
  const known = {
    "image/avif": ".avif",
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
    "font/woff": ".woff",
    "font/woff2": ".woff2",
    "text/css": ".css"
  };
  return known[contentType?.split(";")[0]] ?? path.posix.extname(pathname) ?? "";
}

function assetOutputPath(url, contentType = "") {
  if (url.pathname === "/_next/image" || url.search) {
    const digest = createHash("sha256").update(url.pathname + url.search).digest("hex").slice(0, 20);
    return `_snapshot_assets/${digest}${extensionFor(contentType, url.pathname) || ".bin"}`;
  }
  const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  return pathname || `_snapshot_assets/${createHash("sha256").update(url.href).digest("hex").slice(0, 20)}`;
}

async function replaceAsync(input, expression, replacer) {
  const matches = [...input.matchAll(expression)];
  if (!matches.length) return input;
  const replacements = await Promise.all(matches.map((match) => replacer(...match)));
  let result = "";
  let cursor = 0;
  matches.forEach((match, index) => {
    result += input.slice(cursor, match.index) + replacements[index];
    cursor = match.index + match[0].length;
  });
  return result + input.slice(cursor);
}

async function saveAsset(rawUrl, baseUrl) {
  let url;
  try {
    const decodedUrl = rawUrl
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'");
    url = new URL(decodedUrl, baseUrl);
    if (url.pathname === "/_next/image") {
      const original = url.searchParams.get("url");
      if (original) url = new URL(original, source);
    }
  } catch {
    return null;
  }
  if (url.origin !== source.origin || url.protocol !== source.protocol) return null;
  url.hash = "";
  if (savedAssets.has(url.href)) return savedAssets.get(url.href);

  const pending = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get("content-type") ?? "";
      const relativePath = assetOutputPath(url, contentType);
      const destination = path.join(output, ...relativePath.split("/"));
      await mkdir(path.dirname(destination), { recursive: true });

      if (contentType.startsWith("text/css")) {
        let css = await response.text();
        css = await replaceAsync(css, /url\(\s*(["']?)([^"')]+)\1\s*\)/g, async (whole, quote, value) => {
          if (/^(data:|blob:|#)/i.test(value)) return whole;
          const nested = await saveAsset(value, url);
          if (!nested) return whole;
          const cssDirectory = path.posix.dirname(relativePath);
          return `url(${quote}${relativeUrl(cssDirectory, nested)}${quote})`;
        });
        await writeFile(destination, css, "utf8");
      } else {
        await writeFile(destination, Buffer.from(await response.arrayBuffer()));
      }
      return relativePath;
    } catch (error) {
      failedAssets.push({ url: url.href, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  })();

  savedAssets.set(url.href, pending);
  return pending;
}

function rewritePageLink(rawUrl, currentPath) {
  if (/^(#|mailto:|tel:|sms:|javascript:)/i.test(rawUrl)) return rawUrl;
  let url;
  try {
    url = new URL(rawUrl, new URL(currentPath, source));
  } catch {
    return rawUrl;
  }
  if (!isPublicPage(url)) return rawUrl;

  const pathname = normalizePagePath(url);
  if (!queuedPages.has(pathname)) {
    queuedPages.add(pathname);
    pageQueue.push(new URL(pathname, source));
  }

  if (pathname === currentPath && url.hash) return url.hash;
  const targetDirectory = pageDirectory(pathname);
  let relative = relativeUrl(pageDirectory(currentPath), targetDirectory);
  if (relative === ".") relative = "./";
  else if (!relative.endsWith("/")) relative += "/";
  return `${relative}${url.search}${url.hash}`;
}

async function rewriteAssetReference(rawUrl, currentPath, baseUrl) {
  if (/^(data:|blob:|#)/i.test(rawUrl)) return rawUrl;
  const saved = await saveAsset(rawUrl, baseUrl);
  if (!saved) return rawUrl;
  const rewritten = relativeUrl(pageDirectory(currentPath), saved);
  return saved.endsWith(".css") ? `${rewritten}?v=${snapshotVersion}` : rewritten;
}

async function transformHtml(html, pageUrl) {
  const currentPath = normalizePagePath(pageUrl);

  html = html.replace(/<script\b(?![^>]*type=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<link\b[^>]*(?:rel=["'](?:modulepreload|preload)["'][^>]*as=["']script["']|as=["']script["'][^>]*rel=["'](?:modulepreload|preload)["'])[^>]*>/gi, "");
  html = html.replace(/<meta\s+name=["']robots["'][^>]*>/gi, "");
  html = html.replace(/<head>/i, '<head><meta name="robots" content="noindex,nofollow,noarchive">');

  html = await replaceAsync(html, /\b(href)=(['"])(.*?)\2/gi, async (whole, attribute, quote, value) => {
    const elementStart = html.lastIndexOf("<", whole.index);
    void elementStart;
    if (/^(#|mailto:|tel:|sms:|javascript:|https?:\/\/)/i.test(value)) {
      if (value.startsWith(source.origin)) return `${attribute}=${quote}${rewritePageLink(value, currentPath)}${quote}`;
      return whole;
    }
    const absolute = new URL(value, pageUrl);
    if (isPublicPage(absolute)) {
      return `${attribute}=${quote}${rewritePageLink(value, currentPath)}${quote}`;
    }
    const rewritten = await rewriteAssetReference(value, currentPath, pageUrl);
    return `${attribute}=${quote}${rewritten}${quote}`;
  });

  html = await replaceAsync(html, /\b(src|poster)=(['"])(.*?)\2/gi, async (whole, attribute, quote, value) => {
    const rewritten = await rewriteAssetReference(value, currentPath, pageUrl);
    return `${attribute}=${quote}${rewritten}${quote}`;
  });

  html = await replaceAsync(html, /\b(srcset)=(['"])(.*?)\2/gi, async (whole, attribute, quote, value) => {
    const entries = await Promise.all(value.split(",").map(async (entry) => {
      const [url, ...descriptor] = entry.trim().split(/\s+/);
      const rewritten = await rewriteAssetReference(url, currentPath, pageUrl);
      return [rewritten, ...descriptor].join(" ");
    }));
    return `${attribute}=${quote}${entries.join(", ")}${quote}`;
  });

  html = html.replace(/<form\b([^>]*)>/gi, '<form$1 action="#" onsubmit="event.preventDefault(); alert(&quot;Version de démonstration : le formulaire n\'est pas envoyé.&quot;);">');
  html = html.replace(/<\/body>/i, '<script>document.documentElement.dataset.staticDemo="true";</script></body>');
  return html;
}

while (pageQueue.length) {
  const pageUrl = pageQueue.shift();
  const pathname = normalizePagePath(pageUrl);
  try {
    const response = await fetch(pageUrl, { headers: { accept: "text/html" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) throw new Error(`Unexpected content type: ${contentType}`);
    const html = await transformHtml(await response.text(), pageUrl);
    const destination = pageFile(pathname);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, html, "utf8");
    pageResults.push({ path: pathname, status: "saved" });
    console.log(`page  ${pathname}`);
  } catch (error) {
    pageResults.push({ path: pathname, status: "failed", error: error instanceof Error ? error.message : String(error) });
    console.error(`skip  ${pathname}: ${error instanceof Error ? error.message : error}`);
  }
}

await Promise.all(savedAssets.values());
await writeFile(path.join(output, ".nojekyll"), "", "utf8");
await writeFile(
  path.join(output, "snapshot-report.json"),
  JSON.stringify({ source: source.href, generatedAt: new Date().toISOString(), pages: pageResults, failedAssets }, null, 2),
  "utf8"
);

const failures = pageResults.filter((page) => page.status === "failed");
console.log(`\nSaved ${pageResults.length - failures.length} pages and ${savedAssets.size - failedAssets.length} assets.`);
if (failures.length || failedAssets.length) {
  console.log(`Review site/snapshot-report.json (${failures.length} page failures, ${failedAssets.length} asset failures).`);
}
