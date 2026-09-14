const https = require('https');
const fs = require('fs');
const path = require('path');

let cachedDb = null;
function getLocalMatches(dateStr) {
  if (!cachedDb) {
    try {
      const p = path.join(process.cwd(), 'matches_2026_2027.json');
      if (fs.existsSync(p)) {
        cachedDb = JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    } catch (_) {}
  }
  if (!cachedDb) return [];
  return cachedDb.filter(m => (m.date || '').trim() === dateStr);
}

// CollectAPI Turkish League In-Memory Cache (10 minutes TTL)
let collectApiTurkishMatchesCache = null;
let collectApiTurkishMatchesTimestamp = 0;
const COLLECT_API_CACHE_TTL = 10 * 60 * 1000;

function fetchCollectApiLeague(token, leagueKey) {
  return new Promise((resolve) => {
    if (!token) return resolve([]);
    const options = {
      hostname: 'api.collectapi.com',
      port: 443,
      path: `/football/results?league=${encodeURIComponent(leagueKey)}`,
      method: 'GET',
      headers: {
        'authorization': token,
        'content-type': 'application/json',
        'User-Agent': 'GolAnaliz-AI/1.0'
      },
      timeout: 7000
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            const items = Array.isArray(parsed) ? parsed : (parsed.result || []);
            resolve(items);
          } catch (_) { resolve([]); }
        } else {
          resolve([]);
        }
      });
    });
    req.on('timeout', () => { req.destroy(); resolve([]); });
    req.on('error', () => { resolve([]); });
    req.end();
  });
}

async function fetchAllCollectApiTurkishMatches() {
  const now = Date.now();
  if (collectApiTurkishMatchesCache && (now - collectApiTurkishMatchesTimestamp < COLLECT_API_CACHE_TTL)) {
    return collectApiTurkishMatchesCache;
  }
  const token = process.env.COLLECT_API_KEY || 'apikey 67KcmfCpyR6OJC8iW38y5y:0QzvnVbNgdbCXkQApQXS3O';
  if (!token) return [];

  try {
    const superLigRaw = await fetchCollectApiLeague(token, 'super-lig');
    // Pause 1200ms to respect CollectAPI 1 req/sec rate limit
    await new Promise(r => setTimeout(r, 1200));
    const tff1Raw = await fetchCollectApiLeague(token, 'tff-1-lig');

    const formattedMatches = [];

    const processItems = (items, leagueName, compCode) => {
      if (!Array.isArray(items)) return;
      items.forEach(m => {
        if (!m || !m.home || !m.away) return;
        let dFormatted = '';
        let timeFormatted = '';
        if (m.date) {
          try {
            const dt = new Date(m.date);
            if (!isNaN(dt.getTime())) {
              const day = String(dt.getDate()).padStart(2, '0');
              const mon = String(dt.getMonth() + 1).padStart(2, '0');
              const yr = dt.getFullYear();
              dFormatted = `${day}/${mon}/${yr}`;
              timeFormatted = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
            }
          } catch (_) {}
        }

        let homeScore = '-';
        let awayScore = '-';
        let isFinished = false;
        if (m.skor && m.skor.includes('-')) {
          const parts = m.skor.split('-').map(s => s.trim());
          if (parts[0] !== '' && parts[1] !== '' && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
            homeScore = parseInt(parts[0], 10);
            awayScore = parseInt(parts[1], 10);
            isFinished = true;
          }
        }

        formattedMatches.push({
          id: `collect_${m.date || dFormatted}_${m.home}_${m.away}`,
          utcDate: m.date || '',
          date: dFormatted,
          time: timeFormatted || '17:00',
          homeTeam: { name: m.home },
          awayTeam: { name: m.away },
          home: m.home,
          away: m.away,
          country: 'TR',
          countryCode: 'TR',
          league_name: leagueName,
          league_code: compCode,
          competition: {
            name: leagueName,
            code: compCode
          },
          fthg: isFinished ? homeScore : null,
          ftag: isFinished ? awayScore : null,
          score: {
            fullTime: {
              home: homeScore,
              away: awayScore
            }
          },
          status: isFinished ? 'FINISHED' : 'SCHEDULED',
          source: 'collectapi'
        });
      });
    };

    processItems(superLigRaw, 'Türkiye Süper Lig', 'T1');
    processItems(tff1Raw, 'Türkiye 1. Lig', 'T2');

    if (formattedMatches.length > 0) {
      collectApiTurkishMatchesCache = formattedMatches;
      collectApiTurkishMatchesTimestamp = Date.now();
    }
    return collectApiTurkishMatchesCache || [];
  } catch (err) {
    return collectApiTurkishMatchesCache || [];
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    if (res.status) return res.status(204).end();
    res.writeHead(204);
    return res.end();
  }

  const queryDate = (req.query && req.query.date) ? req.query.date : '';
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

  const dbMatches = getLocalMatches(dFormatted);
  const apiKey = process.env.FOOTBALL_DATA_ORG_KEY || '2e2da80d56aa4afdb1cdb1098cd48591';

  let apiMatches = [];
  try {
    const dt = new Date(isoDateStr);
    dt.setUTCDate(dt.getUTCDate() + 1);
    const nextDayISO = dt.toISOString().slice(0, 10);
    const apiPath = `/v4/matches?dateFrom=${isoDateStr}&dateTo=${nextDayISO}`;

    const apiRes = await new Promise((resolve) => {
      const r = https.get({
        hostname: 'api.football-data.org',
        path: apiPath,
        headers: { 'X-Auth-Token': apiKey, 'User-Agent': 'GolAnaliz-AI/1.0' },
        timeout: 5000
      }, (resStream) => {
        let raw = '';
        resStream.on('data', chunk => raw += chunk);
        resStream.on('end', () => {
          try {
            if (resStream.statusCode >= 200 && resStream.statusCode < 300) {
              resolve(JSON.parse(raw));
            } else {
              resolve(null);
            }
          } catch (_) { resolve(null); }
        });
      });
      r.on('error', () => resolve(null));
      r.on('timeout', () => { r.destroy(); resolve(null); });
    });

    if (apiRes && Array.isArray(apiRes.matches)) {
      apiMatches = apiRes.matches;
    }
  } catch (_) {}

  let collectMatches = [];
  try {
    const allCollect = await fetchAllCollectApiTurkishMatches();
    collectMatches = (allCollect || []).filter(m => (m.date || '').trim() === dFormatted);
  } catch (_) {}

  const mergedMatches = [...apiMatches];
  const apiPairs = new Set();
  apiMatches.forEach(m => {
    const h = (m.homeTeam?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const a = (m.awayTeam?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (h && a) apiPairs.add(`${h}_${a}`);
  });

  collectMatches.forEach(colM => {
    const h = (colM.home || colM.homeTeam?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const a = (colM.away || colM.awayTeam?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!apiPairs.has(`${h}_${a}`)) {
      mergedMatches.push(colM);
      apiPairs.add(`${h}_${a}`);
    }
  });

  dbMatches.forEach(dbM => {
    const h = (dbM.home || dbM.homeTeam || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const a = (dbM.away || dbM.awayTeam || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!apiPairs.has(`${h}_${a}`)) {
      mergedMatches.push(dbM);
    }
  });

  let source = 'api';
  const hasLive = (apiMatches.length > 0 || collectMatches.length > 0);
  const hasDb = dbMatches.length > 0;
  if (hasLive && hasDb) source = 'api+db';
  else if (hasLive) source = 'api';
  else if (hasDb) source = 'db';
  else source = 'none';

  const payload = {
    success: true,
    date: dFormatted,
    source,
    count: mergedMatches.length,
    matches: mergedMatches
  };

  if (res.status && typeof res.status === 'function') {
    return res.status(200).json(payload);
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
    return res.end(JSON.stringify(payload));
  }
};
