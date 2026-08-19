import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const PORT = 3001;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

process.on('uncaughtException', (err) => {
  console.warn('[Server] Suppressed uncaught exception:', err.message);
});

const server = http.createServer((req, res) => {
  req.on('error', (err) => {
    console.warn('[Server] Req error:', err.message);
  });
  res.on('error', (err) => {
    console.warn('[Server] Res error:', err.message);
  });

  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || !reqPath) reqPath = 'index.html';

  const relPath = reqPath.replace(/^[/\\]+/, '');
  const filePath = path.join(rootDir, relPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.on('error', (streamErr) => {
      console.warn('[Server] Stream error:', streamErr.message);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end();
      }
    });
    stream.pipe(res);
  });
});

server.on('error', (err) => {
  console.warn('[Server] Server error:', err.message);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Test server running at http://127.0.0.1:${PORT}`);
});
