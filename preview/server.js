// Minimal zero-dependency static server for the preview (no build step, no SWC).
// Hardened: never crashes the process on a bad request.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 8080;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

// Never let a stray error take the whole server down.
process.on("uncaughtException", (e) => console.error("uncaught:", e && e.message));
process.on("unhandledRejection", (e) => console.error("unhandled:", e && e.message));

function safeEnd(res, code, body) {
  try {
    if (!res.headersSent) res.writeHead(code, { "Content-Type": "text/html" });
    res.end(body || "");
  } catch (_) {
    /* ignore */
  }
}

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    const filePath = path.join(ROOT, path.normalize(urlPath));
    if (!filePath.startsWith(ROOT)) return safeEnd(res, 403, "Forbidden");

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) return safeEnd(res, 404, "<h1>404</h1>");
      try {
        const ext = path.extname(filePath).toLowerCase();
        const type = TYPES[ext] || "application/octet-stream";
        const total = stat.size;
        let start = 0;
        let end = total - 1;
        let status = 200;
        const headers = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "no-store" };

        const range = req.headers.range;
        if (range) {
          const m = /bytes=(\d*)-(\d*)/.exec(range);
          if (m) {
            if (m[1]) start = parseInt(m[1], 10);
            if (m[2]) end = parseInt(m[2], 10);
          }
        }
        if (!(start >= 0)) start = 0;
        if (!(end < total)) end = total - 1;
        // invalid/unsatisfiable range → just serve the whole file
        if (start > end || start >= total) {
          start = 0;
          end = total - 1;
          status = 200;
        } else if (range) {
          status = 206;
          headers["Content-Range"] = `bytes ${start}-${end}/${total}`;
        }
        headers["Content-Length"] = end - start + 1;
        res.writeHead(status, headers);
        if (req.method === "HEAD") return res.end();

        const stream = fs.createReadStream(filePath, { start, end });
        stream.on("error", () => { try { res.end(); } catch (_) {} });
        res.on("close", () => stream.destroy());
        stream.pipe(res);
      } catch (e) {
        safeEnd(res, 500, "");
      }
    });
  } catch (e) {
    safeEnd(res, 500, "");
  }
});

server.on("clientError", (err, socket) => {
  try { socket.end("HTTP/1.1 400 Bad Request\r\n\r\n"); } catch (_) {}
});

server.listen(PORT, () => console.log(`David Zachary preview — http://localhost:${PORT}`));
