import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "site");
const port = Number(process.env.PORT ?? 4173);
const types = {
  ".avif": "image/avif", ".css": "text/css; charset=utf-8", ".gif": "image/gif",
  ".html": "text/html; charset=utf-8", ".ico": "image/x-icon", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".json": "application/json; charset=utf-8", ".png": "image/png",
  ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".webp": "image/webp",
  ".woff": "font/woff", ".woff2": "font/woff2"
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
    const decoded = decodeURIComponent(url.pathname);
    const candidate = path.resolve(root, `.${decoded}`);
    if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) throw new Error("Invalid path");
    let file = candidate;
    const info = await stat(file).catch(() => null);
    if (info?.isDirectory()) file = path.join(file, "index.html");
    const fileInfo = await stat(file);
    if (!fileInfo.isFile()) throw new Error("Not a file");
    response.writeHead(200, { "Content-Type": types[path.extname(file).toLowerCase()] ?? "application/octet-stream" });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Static demo: http://127.0.0.1:${port}`);
});
