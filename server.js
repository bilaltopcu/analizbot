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

// Matches by Date in-memory index
let matchesByDateCache = null;
function getMatchesByDate(dateStr) {
  if (!matchesByDateCache) {
    matchesByDateCache = new Map();
    const jsonPath = path.join(__dirname, 'matches_2026_2027.json');
    if (fs.existsSync(jsonPath)) {
      try {
        const raw = fs.readFileSync(jsonPath, 'utf8');
        const allMatches = JSON.parse(raw);
        allMatches.forEach(m => {
          const d = (m.date || '').trim();
          if (d) {
            if (!matchesByDateCache.has(d)) {
              matchesByDateCache.set(d, []);
            }
            matchesByDateCache.get(d).push(m);
          }
        });
        console.log(`[Matches DB Indexed] Loaded ${matchesByDateCache.size} unique dates.`);
      } catch (e) {
        console.error('[Matches DB Index Error]', e.message);
      }
    }
  }
  return matchesByDateCache ? (matchesByDateCache.get(dateStr) || []) : [];
}

// Football-Data.org In-Memory Multi-Date Cache (protect against rate-limits)
const footballDataDateCache = new Map();

function getNextDayISO(isoDateStr) {
  try {
    const parts = isoDateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    dt.setUTCDate(dt.getUTCDate() + 1);
    return dt.toISOString().slice(0, 10);
  } catch (_) {
    return isoDateStr;
  }
}

function fetchFootballDataOrgForDate(apiKey, isoDateStr) {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    const todayISO = new Date().toISOString().slice(0, 10);
    const targetISO = (!isoDateStr || isoDateStr.trim() === '') ? todayISO : isoDateStr.trim();
    const isToday = (targetISO === todayISO);

    // Dynamic TTL:
    // Today: 60s (live scores update)
    // Future: 30 mins (scheduled fixtures)
    // Past: 24 hours (finished matches)
    let ttl = 60 * 1000;
    if (targetISO > todayISO) {
      ttl = 30 * 60 * 1000;
    } else if (targetISO < todayISO) {
      ttl = 24 * 60 * 60 * 1000;
    }

    const cached = footballDataDateCache.get(targetISO);
    if (cached && (now - cached.timestamp < ttl)) {
      return resolve(cached.data);
    }

    let apiPath = '/v4/matches';
    if (!isToday) {
      const nextDayISO = getNextDayISO(targetISO);
      apiPath = `/v4/matches?dateFrom=${targetISO}&dateTo=${nextDayISO}`;
    }

    const options = {
      hostname: 'api.football-data.org',
      port: 443,
      path: apiPath,
      method: 'GET',
      headers: {
        'X-Auth-Token': apiKey,
        'User-Agent': 'GolAnaliz-AI/1.0'
      },
      timeout: 8000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            footballDataDateCache.set(targetISO, {
              timestamp: Date.now(),
              data: parsed
            });
            resolve(parsed);
          } catch (e) {
            reject(new Error('JSON parse error: ' + e.message));
          }
        } else {
          // If rate limited (429) or error, fallback to expired cache if available
          if (cached && cached.data) {
            console.warn(`[Football-Data.org API] Status ${res.statusCode}, serving cached data for ${targetISO}`);
            return resolve(cached.data);
          }
          reject(new Error(`Football-Data.org status ${res.statusCode}: ${data.slice(0, 100)}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      if (cached && cached.data) return resolve(cached.data);
      reject(new Error('Football-Data.org timeout'));
    });

    req.on('error', (err) => {
      if (cached && cached.data) return resolve(cached.data);
      reject(err);
    });

    req.end();
  });
}

function fetchFootballDataOrg(apiKey) {
  const todayISO = new Date().toISOString().slice(0, 10);
  return fetchFootballDataOrgForDate(apiKey, todayISO);
}

function callSingleModel(model, promptText, apiKey, useThinkingZero) {
  return new Promise((resolve) => {
    const config = {
      temperature: 0.3,
      maxOutputTokens: 600,
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

  // Football-Data.org Today & Live Matches Endpoint
  if (pathname === '/api/today-matches' || pathname === '/api/live-matches') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Token');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const apiKey = process.env.FOOTBALL_DATA_ORG_KEY || '2e2da80d56aa4afdb1cdb1098cd48591';
    fetchFootballDataOrg(apiKey)
      .then(data => {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=UTF-8',
          'Cache-Control': 'public, max-age=60'
        });
        res.end(JSON.stringify({
          success: true,
          count: data?.matches?.length || 0,
          cachedAt: Date.now(),
          matches: data?.matches || []
        }));
      })
      .catch(err => {
        res.writeHead(502, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      });
    return;
  }

  // Matches by Specific Date Endpoint (Historical DB + Live API for ANY DATE)
  if (pathname === '/api/matches-by-date') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const queryDate = reqUrl.searchParams.get('date') || ''; // e.g. "13/09/2026" or "2026-09-13"
    let dFormatted = queryDate.trim();
    let isoDateStr = '';

    if (dFormatted.includes('-')) {
      const parts = dFormatted.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          isoDateStr = dFormatted;
          dFormatted = `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
        } else {
          // DD-MM-YYYY
          dFormatted = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
          isoDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    } else if (dFormatted.includes('/')) {
      const parts = dFormatted.split('/');
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          // DD/MM/YYYY
          isoDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }

    if (!dFormatted) {
      const dNow = new Date();
      isoDateStr = dNow.toISOString().slice(0, 10);
      const day = String(dNow.getDate()).padStart(2, '0');
      const mon = String(dNow.getMonth() + 1).padStart(2, '0');
      dFormatted = `${day}/${mon}/${dNow.getFullYear()}`;
    }

    const apiKey = process.env.FOOTBALL_DATA_ORG_KEY || '2e2da80d56aa4afdb1cdb1098cd48591';
    const dbMatches = getMatchesByDate(dFormatted);

    fetchFootballDataOrgForDate(apiKey, isoDateStr)
      .then(apiData => {
        const apiMatches = apiData?.matches || [];

        if (apiMatches.length === 0 && dbMatches.length === 0) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
          return res.end(JSON.stringify({
            success: true,
            date: dFormatted,
            source: 'none',
            count: 0,
            matches: []
          }));
        }

        // Deduplication & merge: Keep API match if present, append DB matches not covered by API
        const mergedMatches = [...apiMatches];
        const apiTeamPairs = new Set();
        apiMatches.forEach(m => {
          const h = (m.homeTeam?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const a = (m.awayTeam?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (h && a) apiTeamPairs.add(`${h}_${a}`);
        });

        dbMatches.forEach(dbM => {
          const h = (dbM.home || dbM.homeTeam || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const a = (dbM.away || dbM.awayTeam || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!apiTeamPairs.has(`${h}_${a}`)) {
            mergedMatches.push(dbM);
          }
        });

        let source = 'api';
        if (apiMatches.length > 0 && dbMatches.length > 0) source = 'api+db';
        else if (apiMatches.length === 0 && dbMatches.length > 0) source = 'db';

        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({
          success: true,
          date: dFormatted,
          source,
          count: mergedMatches.length,
          matches: mergedMatches
        }));
      })
      .catch(err => {
        console.warn(`[API matches-by-date] Error fetching API for ${isoDateStr}:`, err.message);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({
          success: true,
          date: dFormatted,
          source: 'db',
          count: dbMatches.length,
          matches: dbMatches
        }));
      });
    return;
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

  // Telegram Webhook Endpoint
  if (pathname === '/api/telegram-webhook' || pathname === '/api/telegram') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const update = JSON.parse(body || '{}');
          const { handleTelegramUpdate } = require('./telegram_bot');
          await handleTelegramUpdate(update);
        } catch (_) {}
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'TELEGRAM_WEBHOOK_ACTIVE' }));
    }
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

        const promptText = `Sen uzman bir futbol analisti, istatistikçi ve bahis araştırmacısısın. Aşağıdaki maç istatistiklerini ve Dixon-Coles Poisson simülasyon çıktılarını EN DERİNİNE KADAR araştırarak profesyonel bir taktiksel analiz, detaylı bahis gerekçelendirmesi ve risk değerlendirmesi üret.

MAÇ BİLGİLERİ:
- Ev Sahibi: ${payload.homeTeam || 'Ev Sahibi'}
- Deplasman: ${payload.awayTeam || 'Deplasman'}
- Ülke / Lig: ${payload.country || 'Genel'}

Sayısal & İstatistiksel Veriler (Dixon-Coles Simulation Engine 6.0):
- Beklenen Goller (xG): Ev ${payload.xG_home || 1.2} - Dep ${payload.xG_away || 1.0}
- Olasılıklar: Ev Galibiyeti %${payload.pHomeWin || 40}, Beraberlik %${payload.pDraw || 30}, Dep Galibiyeti %${payload.pAwayWin || 30}
- 2.5 Üst Olasılığı: %${payload.pOver25 || 50} | KG Var Olasılığı: %${payload.pBTTS || 50}
- Ev Sahibi Gol (Attığı/Yediği): ${payload.homeGoalsScored || '1.5'} / ${payload.homeGoalsConceded || '1.0'}
- Deplasman Gol (Attığı/Yediği): ${payload.awayGoalsScored || '1.2'} / ${payload.awayGoalsConceded || '1.3'}
- Beklenen Korner: ${payload.expCorners || '9.5'} | Beklenen Sarı Kart: ${payload.expCards || '4.2'}
- Clean Sheet Oranları: Ev %${payload.homeCleanSheet || '—'} / Dep %${payload.awayCleanSheet || '—'}
- İlk Yarı Gol Oranları: Ev %${payload.homeHtGoalPct || '—'} / Dep %${payload.awayHtGoalPct || '—'}
- Faul Ortalamaları: Ev ${payload.homeFouls || '—'} / Dep ${payload.awayFouls || '—'}
- İç Saha Galibiyet: %${payload.homeVenueWinPct || '—'} | Deplasman Galibiyet: %${payload.awayVenueWinPct || '—'}
- Research Score: ${payload.researchScore || '—'}/100
- Önerilen Bahis: ${payload.suggestedBet || 'KG Var'} (Güven: %${payload.confidence || 75})

GÖREV:
Her bahis önerisini en detayına kadar araştır. Destekleyen ve karşıt faktörleri ayrı ayrı listele. Aşağıdaki JSON formatında Türkçe yanıt döndür. Başka hiçbir açıklama metni ekleme.
JSON Şeması:
{
  "tacticalScenario": "Maçın muhtemel taktiksel akışı, tempo, baskı yönü ve saha içi dinamikleri hakkında 3-4 cümlelik derinlemesine analiz.",
  "bestBetRationale": "Seçilen bahsin istatistiksel ve taktiksel nedenleri, destekleyen 3-4 faktör ve neden bu bahsin değerli olduğu (2-3 cümle).",
  "riskAssessment": "Maçın dikkat edilmesi gereken temel risk faktörleri, karşıt istatistikler ve sürpriz senaryoları (2 cümle).",
  "confidenceScore": 85,
  "matchAnalysisSummary": "Genel sonuç özeti, maçın gidişat tahmini ve alternatif senaryo."
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
  // 24/7 Telegram Bot Servisi
  try {
    const { startTelegramBot } = require('./telegram_bot');
    startTelegramBot();
  } catch (err) {
    console.error('[Telegram Bot Başlatma Uyarısı]', err.message);
  }
});

