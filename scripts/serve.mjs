import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';

const ROOT = process.argv[2] || 'dist';
const PORT = Number(process.argv[3] || 8080);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.mp3': 'audio/mpeg',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pathname === '/') pathname = '/home';
  let file = normalize(join(ROOT, pathname));
  if (!file.startsWith(normalize(ROOT))) {
    res.writeHead(403).end();
    return;
  }
  if (!extname(file) && !existsSync(file)) file = `${file}.html`;
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(ROOT, 'home.html');
  const isHtml = !extname(file) || extname(file) === '.html';
  res.writeHead(200, {
    'Content-Type': isHtml ? 'text/html; charset=utf-8' : MIME[extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => console.log(`serving ${ROOT} @ http://localhost:${PORT}`));