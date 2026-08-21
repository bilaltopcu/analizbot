const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.webmanifest': 'application/manifest+json; charset=UTF-8',
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

// In-Memory Fast Cache for Static Assets
const FILE_CACHE = new Map();

function getCachedOrReadFile(filePath, callback) {
  const stat = fs.statSync(filePath, { throwIfNoEntry: false });
  if (!stat || !stat.isFile()) {
    return callback(new Error('File not found'), null);
  }

  // Bypass cache if in development mode or force fresh read
  const cached = FILE_CACHE.get(filePath);
  if (cached && cached.mtime === stat.mtimeMs) {
    return callback(null, cached);
  }

  fs.readFile(filePath, (err, rawContent) => {
    if (err) return callback(err, null);

    const ext = path.extname(filePath).toLowerCase();
    const isCompressible = ['.html', '.js', '.css', '.json', '.svg'].includes(ext);

    if (isCompressible) {
      zlib.gzip(rawContent, { level: 6 }, (gzipErr, gzipBuffer) => {
        const item = {
          raw: rawContent,
          gzip: gzipErr ? null : gzipBuffer,
          mtime: stat.mtimeMs,
          etag: `"${stat.mtimeMs.toString(16)}-${stat.size.toString(16)}"`,
          contentType: MIME_TYPES[ext] || 'application/octet-stream'
        };
        FILE_CACHE.set(filePath, item);
        callback(null, item);
      });
    } else {
      const item = {
        raw: rawContent,
        gzip: null,
        mtime: stat.mtimeMs,
        etag: `"${stat.mtimeMs.toString(16)}-${stat.size.toString(16)}"`,
        contentType: MIME_TYPES[ext] || 'application/octet-stream'
      };
      FILE_CACHE.set(filePath, item);
      callback(null, item);
    }
  });
}

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

  if (pathname === '/api/sync-2026-2027' || pathname === '/api/sync-data') {
    FILE_CACHE.clear(); // Clear cache on sync
    const { exec } = require('child_process');
    exec('python update_2026_2027_data.py', (error, stdout, stderr) => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
      if (error) {
        return res.end(JSON.stringify({ status: 'ERROR', message: error.message }));
      }
      return res.end(JSON.stringify({ status: 'SUCCESS', message: 'Veriler güncellendi!' }));
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

  getCachedOrReadFile(filePath, (err, fileData) => {
    if (err || !fileData) {
      // Fallback to index.html for Single Page App
      filePath = path.join(__dirname, 'index.html');
      return getCachedOrReadFile(filePath, (idxErr, idxData) => {
        if (idxErr || !idxData) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('404 Not Found');
        }
        serveAsset(req, res, idxData);
      });
    }

    serveAsset(req, res, fileData);
  });
});

function serveAsset(req, res, fileData) {
  // HTTP ETag / 304 Cache Check
  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch && ifNoneMatch === fileData.etag) {
    res.writeHead(304);
    return res.end();
  }

  const acceptEncoding = req.headers['accept-encoding'] || '';
  const headers = {
    'Content-Type': fileData.contentType,
    'ETag': fileData.etag,
    'Cache-Control': 'public, max-age=3600'
  };

  if (fileData.gzip && acceptEncoding.includes('gzip')) {
    headers['Content-Encoding'] = 'gzip';
    headers['Vary'] = 'Accept-Encoding';
    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();
    return res.end(fileData.gzip);
  }

  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  res.end(fileData.raw);
}

server.listen(PORT, () => {
  console.log(`[AnalizBot] Ultra Hızlı & GZIP Sıkıştırmalı Sunucu ${PORT} portunda aktif!`);
});
