import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..", "site");
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(absolute);
    else files.push(absolute);
  }
}

await walk(root);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const broken = [];

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, "utf8");
  const references = [...html.matchAll(/\b(?:href|src|poster)=["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const reference of references) {
    if (/^(?:[a-z]+:|#|\/\/)/i.test(reference)) continue;
    const clean = decodeURIComponent(reference.split(/[?#]/)[0]);
    if (!clean) continue;
    let target = path.resolve(path.dirname(htmlFile), clean);
    if (!target.startsWith(root)) {
      broken.push({ page: path.relative(root, htmlFile), reference, reason: "outside site directory" });
      continue;
    }
    if (clean.endsWith("/")) target = path.join(target, "index.html");
    try {
      await access(target);
    } catch {
      broken.push({ page: path.relative(root, htmlFile), reference, target: path.relative(root, target) });
    }
  }
}

if (broken.length) {
  console.error(JSON.stringify(broken.slice(0, 100), null, 2));
  process.exitCode = 1;
} else {
  console.log(`Checked ${htmlFiles.length} pages: all local links and assets resolve.`);
}
