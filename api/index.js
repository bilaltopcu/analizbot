const https = require('https');
const fs = require('fs');
const path = require('path');

// Prevent crashes
process.on('uncaughtException', (err) => {
  console.error('[Vercel API Uncaught Exception]', err.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Vercel API Unhandled Rejection]', reason);
});

// Cache
const aiAnalysisCache = new Map();
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

    let ttl = 60 * 1000;
    if (targetISO > todayISO) ttl = 30 * 60 * 1000;
    else if (targetISO < todayISO) ttl = 24 * 60 * 60 * 1000;

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
        'User-Agent': 'GolAnaliz-AI-Vercel/1.0'
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
            footballDataDateCache.set(targetISO, { timestamp: Date.now(), data: parsed });
            resolve(parsed);
          } catch (e) {
            reject(new Error('JSON parse error: ' + e.message));
          }
        } else {
          if (cached && cached.data) return resolve(cached.data);
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
      timeout: 5000
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

    req.on('timeout', () => { req.destroy(); resolve({ success: false, model, status: 408 }); });
    req.on('error', (e) => { resolve({ success: false, model, status: 500, error: e.message }); });
    req.write(postData);
    req.end();
  });
}

async function callGeminiApi(promptText, apiKey) {
  const modelCascade = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'];
  for (const m of modelCascade) {
    let res = await callSingleModel(m, promptText, apiKey, true);
    if (!res.success && res.status === 400) {
      res = await callSingleModel(m, promptText, apiKey, false);
    }
    if (res.success && res.data) {
      return { analysis: res.data, model: m };
    }
  }
  return null;
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Token');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const reqUrl = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;

  if (pathname === '/ping' || pathname.endsWith('/ping')) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    return res.end('OK');
  }

  if (pathname === '/health' || pathname.endsWith('/health')) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    return res.end(JSON.stringify({ status: 'UP', service: 'golanaliz-ai-vercel', timestamp: new Date().toISOString() }));
  }

  if (pathname.includes('/api/today-matches') || pathname.includes('/api/live-matches')) {
    const apiKey = process.env.FOOTBALL_DATA_ORG_KEY || '2e2da80d56aa4afdb1cdb1098cd48591';
    const todayISO = new Date().toISOString().slice(0, 10);
    try {
      const data = await fetchFootballDataOrgForDate(apiKey, todayISO);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.end(JSON.stringify({
        success: true,
        count: data?.matches?.length || 0,
        cachedAt: Date.now(),
        matches: data?.matches || []
      }));
    } catch (err) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
      return res.end(JSON.stringify({ success: false, error: err.message, matches: [] }));
    }
  }

  if (pathname.includes('/api/matches-by-date')) {
    const queryDate = reqUrl.searchParams.get('date') || '';
    let dFormatted = queryDate.trim();
    let isoDateStr = '';

    if (dFormatted.includes('-')) {
      const parts = dFormatted.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          isoDateStr = dFormatted;
          dFormatted = `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
        } else {
          dFormatted = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
          isoDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    } else if (dFormatted.includes('/')) {
      const parts = dFormatted.split('/');
      if (parts.length === 3 && parts[2].length === 4) {
        isoDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
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
    try {
      const apiData = await fetchFootballDataOrgForDate(apiKey, isoDateStr);
      const apiMatches = apiData?.matches || [];

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
      res.setHeader('Cache-Control', 'public, max-age=120');
      return res.end(JSON.stringify({
        success: true,
        date: dFormatted,
        source: 'api',
        count: apiMatches.length,
        matches: apiMatches
      }));
    } catch (err) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
      return res.end(JSON.stringify({
        success: true,
        date: dFormatted,
        source: 'none',
        count: 0,
        matches: []
      }));
    }
  }

  if (pathname.includes('/api/gemini-analyze')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const apiKey = process.env.GEMINI_API_KEY;

        const cacheKey = `${payload.homeTeam || ''}__${payload.awayTeam || ''}__${payload.suggestedBet || ''}`;
        if (aiAnalysisCache.has(cacheKey)) {
          const cached = aiAnalysisCache.get(cacheKey);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=UTF-8');
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
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        if (geminiResult && geminiResult.analysis) {
          aiAnalysisCache.set(cacheKey, { model: geminiResult.model, analysis: geminiResult.analysis });
          return res.end(JSON.stringify({
            success: true,
            fallback: false,
            model: geminiResult.model,
            analysis: geminiResult.analysis
          }));
        } else {
          return res.end(JSON.stringify({
            success: false,
            fallback: true,
            message: 'Gemini API yanıt üretemedi, yerel motora geçildi.'
          }));
        }
      } catch (err) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        return res.end(JSON.stringify({ success: false, fallback: true, error: err.message }));
      }
    });
    return;
  }

  // Unknown API route
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
};
