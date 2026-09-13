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

  const mergedMatches = [...apiMatches];
  const apiPairs = new Set();
  apiMatches.forEach(m => {
    const h = (m.homeTeam?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const a = (m.awayTeam?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (h && a) apiPairs.add(`${h}_${a}`);
  });

  dbMatches.forEach(dbM => {
    const h = (dbM.home || dbM.homeTeam || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const a = (dbM.away || dbM.awayTeam || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!apiPairs.has(`${h}_${a}`)) {
      mergedMatches.push(dbM);
    }
  });

  let source = 'api';
  if (apiMatches.length > 0 && dbMatches.length > 0) source = 'api+db';
  else if (apiMatches.length === 0 && dbMatches.length > 0) source = 'db';
  else if (apiMatches.length === 0 && dbMatches.length === 0) source = 'none';

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
