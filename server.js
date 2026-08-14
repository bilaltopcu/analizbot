const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Normalize URL
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;

  // Support HEAD requests for UptimeRobot
  if (req.method === 'HEAD' && (pathname === '/ping' || pathname === '/health' || pathname === '/')) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end();
  }

  // UptimeRobot / Health Check Endpoints
  if (pathname === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end('OK');
  }

  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
    return res.end(JSON.stringify({ status: 'UP', timestamp: new Date().toISOString() }));
  }

  if (pathname === '/api/sync-2026-2027') {
    const { exec } = require('child_process');
    exec('python update_2026_2027_data.py', (error, stdout, stderr) => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
      if (error) {
        return res.end(JSON.stringify({ status: 'ERROR', message: error.message }));
      }
      return res.end(JSON.stringify({ status: 'SUCCESS', message: '2026-2027 sezonu verileri football-data.co.uk üzerinden güncellendi!' }));
    });
    return;
  }

  // Safe file path resolution
  let relativePath = pathname === '/' ? 'index.html' : pathname;
  let filePath = path.join(__dirname, relativePath);

  // Security: Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for Single Page App routing
      filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    if (req.method === 'HEAD') {
      res.writeHead(200, { 'Content-Type': contentType });
      return res.end();
    }

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`[AnalizBot] Sunucu ${PORT} portunda aktif! UptimeRobot pingleme noktası: /ping`);
});
