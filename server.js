const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Prevent process crashes on network/socket glitches
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception Guard]', err.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection Guard]', reason);
});

// Load .env file automatically
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  });
}

const PORT = process.env.PORT || 3000;

// AI In-Memory Analysis Cache for instant sub-millisecond responses
const aiAnalysisCache = new Map();
const MAX_CACHE_SIZE = 300;

function callSingleModel(model, promptText, apiKey, useThinkingZero) {
  return new Promise((resolve) => {
    const config = {
      temperature: 0.3,
      maxOutputTokens: 320,
      responseMimeType: "application/json"
    };
    if (useThinkingZero) {
      config.thinkingConfig = { thinkingBudget: 0 };
    }

    const postData = JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: config
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 4500
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            const textResponse = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              const cleanText = textResponse.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
              resolve({ success: true, model, data: JSON.parse(cleanText) });
            } else {
              resolve({ success: false, model, status: res.statusCode, error: 'Empty text parts' });
            }
          } catch (e) {
            resolve({ success: false, model, status: res.statusCode, error: 'JSON parse error: ' + e.message });
          }
        } else {
          resolve({ success: false, model, status: res.statusCode, error: data.slice(0, 120) });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, model, status: 408, error: 'Request timeout' });
    });

    req.on('error', (e) => {
      resolve({ success: false, model, status: 500, error: e.message });
    });

    req.write(postData);
    req.end();
  });
}

async function callGeminiApi(promptText, apiKey) {
  const preferredModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const modelCascade = [
    preferredModel,
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.7-flash',
    'gemini-3.6-flash'
  ];
  const uniqueModels = [...new Set(modelCascade)];

  for (const m of uniqueModels) {
    // Try first with thinkingBudget: 0 to eliminate thinking token latency
    let res = await callSingleModel(m, promptText, apiKey, true);
    if (!res.success && res.status === 400) {
      // Model does not support thinkingBudget 0, retry immediately without it
      res = await callSingleModel(m, promptText, apiKey, false);
    }
    if (res.success && res.data) {
      return { analysis: res.data, model: m };
    }
  }
  return null;
}


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
let isSyncing = false;

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

  // Support HEAD requests for UptimeRobot / Ping Monitors
  if (req.method === 'HEAD' && (pathname === '/ping' || pathname === '/health' || pathname === '/')) {
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'close'
    });
    return res.end();
  }

  // UptimeRobot / Health Check Endpoints (Zero-overhead keep-alive)
  if (pathname === '/ping') {
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'close'
    });
    return res.end('OK');
  }

  if (pathname === '/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'close'
    });
    return res.end(JSON.stringify({ status: 'UP', service: 'golanaliz-ai', timestamp: new Date().toISOString() }));
  }

  if (pathname === '/api/sync-2026-2027' || pathname === '/api/sync-data') {
    res.writeHead(200, { 
      'Content-Type': 'application/json; charset=UTF-8',
      'Access-Control-Allow-Origin': '*'
    });

    if (isSyncing) {
      return res.end(JSON.stringify({ 
        status: 'ALREADY_RUNNING', 
        message: 'Veri güncelleme zaten arka planda devam ediyor.' 
      }));
    }

    isSyncing = true;
    res.end(JSON.stringify({ 
      status: 'STARTED', 
      message: 'Veri güncelleme işlemi arka planda başlatıldı.' 
    }));

    FILE_CACHE.clear(); // Clear cache on sync
    const { exec } = require('child_process');
    const cmd = process.platform === 'win32' 
      ? 'python update_2026_2027_data.py' 
      : 'python3 update_2026_2027_data.py || python update_2026_2027_data.py';

    exec(cmd, (error, stdout, stderr) => {
      isSyncing = false;
      if (error) {
        console.error('[Sync Error]', error.message);
      } else {
        console.log('[Sync Success] Veriler başarıyla güncellendi.');
        FILE_CACHE.clear();
      }
    });
    return;
  }

  // Live Prediction Record Endpoint
  if (pathname === '/api/record-prediction') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Method not allowed' }));
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const item = JSON.parse(body || '{}');
        const regPath = path.join(__dirname, 'predictions_registry.json');
        let reg = [];
        if (fs.existsSync(regPath)) {
          try { reg = JSON.parse(fs.readFileSync(regPath, 'utf8')); } catch (_) { reg = []; }
        }
        const idx = reg.findIndex(p => 
          p.status === 'PENDING' &&
          (p.homeTeam || '').toLowerCase() === (item.homeTeam || '').toLowerCase() &&
          (p.awayTeam || '').toLowerCase() === (item.awayTeam || '').toLowerCase()
        );
        if (idx !== -1) {
          reg[idx] = item;
        } else {
          reg.unshift(item);
        }
        if (reg.length > 500) reg = reg.slice(0, 500);
        fs.writeFileSync(regPath, JSON.stringify(reg, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: reg.length }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Gemini Pro AI Deep Analysis Endpoint
  if (pathname === '/api/gemini-analyze') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Method not allowed' }));
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
          return res.end(JSON.stringify({
            success: false,
            fallback: true,
            message: 'GEMINI_API_KEY çevre değişkeni bulunamadı. Yerel motor kullanılıyor.'
          }));
        }

        const cacheKey = `${payload.homeTeam || ''}__${payload.awayTeam || ''}__${payload.suggestedBet || ''}`;
        if (aiAnalysisCache.has(cacheKey)) {
          const cached = aiAnalysisCache.get(cacheKey);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
          return res.end(JSON.stringify({
            success: true,
            fallback: false,
            cached: true,
            model: cached.model,
            analysis: cached.analysis
          }));
        }

        const promptText = `Sen uzman bir futbol analisti ve spor istatistikçisisin. Aşağıdaki maç istatistiklerini ve Dixon-Coles Poisson simülasyon çıktılarını inceleyerek profesyonel bir taktiksel analiz ve bahis gerekçelendirmesi üret.

MAÇ BİLGİLERİ:
- Ev Sahibi: ${payload.homeTeam || 'Ev Sahibi'}
- Deplasman: ${payload.awayTeam || 'Deplasman'}
- Ülke / Lig: ${payload.country || 'Genel'}

Sayısal & İstatistiksel Veriler (Dixon-Coles Simulation Engine 5.0):
- Beklenen Goller (xG): Ev Sahibi ${payload.xG_home || 1.2} - Deplasman ${payload.xG_away || 1.0}
- Olasılıklar: Ev Galibiyeti %${payload.pHomeWin || 40}, Beraberlik %${payload.pDraw || 30}, Deplasman Galibiyeti %${payload.pAwayWin || 30}
- 2.5 Üst Olasılığı: %${payload.pOver25 || 50} | KG Var Olasılığı: %${payload.pBTTS || 50}
- Ev Sahibi Ort. Gol (Attığı/Yediği): ${payload.homeGoalsScored || '1.5'} / ${payload.homeGoalsConceded || '1.0'}
- Deplasman Ort. Gol (Attığı/Yediği): ${payload.awayGoalsScored || '1.2'} / ${payload.awayGoalsConceded || '1.3'}
- Beklenen Toplam Korner: ${payload.expCorners || '9.5'} | Beklenen Toplam Sarı Kart: ${payload.expCards || '4.2'}
- Önerilen Ön İstatistiksel Bahis: ${payload.suggestedBet || 'KG Var'} (Güven: %${payload.confidence || 75})

GÖREV:
Aşağıdaki JSON formatında Türkçe yanıt döndür. Başka hiçbir açıklama metni ekleme.
JSON Şeması:
{
  "tacticalScenario": "Maçın muhtemel taktiksel akışı, tempo ve saha içi dinamikleri hakkında 2 cümlelik net analiz.",
  "bestBetRationale": "Seçilen en uygun bahsin istatistiksel ve taktiksel nedenleri (1-2 cümle).",
  "riskAssessment": "Maçın dikkat edilmesi gereken temel risk faktörleri (1 cümle).",
  "confidenceScore": 85,
  "matchAnalysisSummary": "Genel sonuç özeti ve maçın gidişat tahmini."
}`;

        const geminiResult = await callGeminiApi(promptText, apiKey);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        if (geminiResult && geminiResult.analysis) {
          if (aiAnalysisCache.size >= MAX_CACHE_SIZE) {
            const firstKey = aiAnalysisCache.keys().next().value;
            aiAnalysisCache.delete(firstKey);
          }
          aiAnalysisCache.set(cacheKey, {
            model: geminiResult.model,
            analysis: geminiResult.analysis
          });

          res.end(JSON.stringify({
            success: true,
            fallback: false,
            model: geminiResult.model,
            analysis: geminiResult.analysis
          }));
        } else {
          res.end(JSON.stringify({
            success: false,
            fallback: true,
            message: 'Gemini API yanıt üretemedi, yerel motora geçildi.'
          }));
        }

      } catch (err) {
        console.error('[Gemini Route Error]', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ success: false, fallback: true, error: err.message }));
      }
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
  const isDataOrCode = fileData.contentType.includes('html') ||
                       fileData.contentType.includes('javascript') ||
                       fileData.contentType.includes('json');

  const cacheControl = isDataOrCode ? 'no-cache, must-revalidate' : 'public, max-age=86400';

  const headers = {
    'Content-Type': fileData.contentType,
    'ETag': fileData.etag,
    'Cache-Control': cacheControl
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

server.on('clientError', (err, socket) => {
  if (err.code === 'ECONNRESET' || !socket.writable) return;
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.on('error', (err) => {
  console.error('[Server Error Guard]', err.message);
});

server.listen(PORT, () => {
  console.log(`[AnalizBot] Ultra Hızlı & GZIP Sıkıştırmalı Sunucu ${PORT} portunda aktif!`);
});

