import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const rootDir = resolve(".");
const startPort = 5173;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const serveFile = (filePath, res) => {
  const type = contentTypes[extname(filePath)] ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  createReadStream(filePath).pipe(res);
};

const send404 = (res) => {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
};

const resolvePath = async (urlPath) => {
  const requestedPath = urlPath === "/" ? "/index.html" : urlPath;
  const absolutePath = resolve(rootDir, `.${requestedPath}`);

  if (!absolutePath.startsWith(rootDir)) {
    return null;
  }

  try {
    const stats = await stat(absolutePath);
    if (stats.isDirectory()) {
      const indexPath = join(absolutePath, "index.html");
      await access(indexPath);
      return indexPath;
    }

    return absolutePath;
  } catch {
    return null;
  }
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const safePath = normalize(decodeURIComponent(url.pathname));
  const filePath = await resolvePath(safePath);

  if (!filePath) {
    send404(res);
    return;
  }

  serveFile(filePath, res);
});

const listen = (port) =>
  new Promise((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(port, "127.0.0.1", () => {
      server.removeListener("error", rejectPromise);
      resolvePromise(port);
    });
  });

const start = async () => {
  for (let port = startPort; port < startPort + 20; port += 1) {
    try {
      const activePort = await listen(port);
      console.log(`Vue app running at http://127.0.0.1:${activePort}`);
      return;
    } catch (error) {
      if (error.code !== "EADDRINUSE") {
        throw error;
      }
    }
  }

  throw new Error("No open port found between 5173 and 5192.");
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
