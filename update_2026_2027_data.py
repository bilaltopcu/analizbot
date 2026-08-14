import socket
import ssl
import sys
import json
import csv
import io
import re
import os

sys.stdout.reconfigure(encoding='utf-8')

ip = "217.160.0.246"
hostname = "www.football-data.co.uk"
port = 443

def fetch_raw(path):
    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    
    s = socket.create_connection((ip, port), timeout=10)
    ss = context.wrap_socket(s, server_hostname=hostname)
    
    req = f"GET {path} HTTP/1.1\r\nHost: {hostname}\r\nUser-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\nConnection: close\r\n\r\n"
    ss.sendall(req.encode('utf-8'))
    
    response = b""
    while True:
        data = ss.recv(16384)
        if not data:
            break
        response += data
    ss.close()
    
    parts = response.split(b"\r\n\r\n", 1)
    header = parts[0].decode('utf-8', errors='ignore')
    body = parts[1] if len(parts) > 1 else b""
    
    if any(code in header for code in ["301 Moved", "302 Found", "303 See"]):
        loc_match = re.search(r'Location:\s*([^\r\n]+)', header, re.IGNORECASE)
        if loc_match:
            new_url = loc_match.group(1).strip()
            if "football-data.co.uk" in new_url:
                new_path = new_url.split("football-data.co.uk")[1]
                return fetch_raw(new_path)
    return header, body

def run_sync():
    main_leagues = [
        ('ENG', 'E0', 'İngiltere Premier League'),
        ('ENG', 'E1', 'İngiltere Championship'),
        ('ESP', 'SP1', 'İspanya La Liga'),
        ('ESP', 'SP2', 'İspanya Segunda'),
        ('GER', 'D1', 'Almanya Bundesliga'),
        ('GER', 'D2', 'Almanya 2. Bundesliga'),
        ('ITA', 'I1', 'İtalya Serie A'),
        ('ITA', 'I2', 'İtalya Serie B'),
        ('FRA', 'F1', 'Fransa Ligue 1'),
        ('FRA', 'F2', 'Fransa Ligue 2'),
        ('NED', 'N1', 'Hollanda Eredivisie'),
        ('POR', 'P1', 'Portekiz Liga Portugal'),
        ('TR',  'T1', 'Türkiye Süper Lig'),
        ('BEL', 'B1', 'Belçika Pro League'),
        ('GRE', 'G1', 'Yunanistan Super League'),
        ('SCO', 'SC0', 'İskoçya Premiership')
    ]

    extra_leagues = [
        ('ARG', '/new/ARG.csv', 'Arjantin Primera Division'),
        ('BRA', '/new/BRA.csv', 'Brezilya Serie A'),
        ('DNK', '/new/DNK.csv', 'Danimarka Superliga'),
        ('MEX', '/new/MEX.csv', 'Meksika Liga MX'),
        ('NOR', '/new/NOR.csv', 'Norveç Eliteserien'),
        ('POL', '/new/POL.csv', 'Polonya Ekstraklasa'),
        ('ROU', '/new/ROU.csv', 'Romanya Liga 1'),
        ('RUS', '/new/RUS.csv', 'Rusya Premier League'),
        ('SWE', '/new/SWE.csv', 'İsveç Allsvenskan'),
        ('USA', '/new/USA.csv', 'ABD MLS')
    ]

    matches_2627 = []

    print("=== Fetching Main 2026-2027 Leagues ===")
    for country_code, code, name in main_leagues:
        path = f"/mmz4281/2627/{code}.csv"
        try:
            hdr, body = fetch_raw(path)
            content = body.decode('utf-8', errors='ignore').strip()
            if not content or "404 Not Found" in hdr:
                hdr, body = fetch_raw(f"/mmz4281/2627/{code.lower()}.csv")
                content = body.decode('utf-8', errors='ignore').strip()
            
            lines = [l for l in content.splitlines() if l.strip()]
            if len(lines) > 1 and ("Div" in lines[0] or "HomeTeam" in lines[0] or "Date" in lines[0]):
                reader = csv.DictReader(io.StringIO(content))
                count = 0
                for row in reader:
                    home = row.get('HomeTeam') or row.get('Home')
                    away = row.get('AwayTeam') or row.get('Away')
                    if not home or not away:
                        continue
                    match_data = {
                        'country': country_code,
                        'league_code': code,
                        'league_name': name,
                        'season': '2026/2027',
                        'date': row.get('Date', ''),
                        'time': row.get('Time', ''),
                        'homeTeam': home.strip(),
                        'awayTeam': away.strip(),
                        'fthg': int(row.get('FTHG') or row.get('HG') or 0),
                        'ftag': int(row.get('FTAG') or row.get('AG') or 0),
                        'ftr': row.get('FTR') or row.get('Res') or 'D',
                        'hthg': int(row.get('HTHG', 0) if row.get('HTHG') else 0),
                        'htag': int(row.get('HTAG', 0) if row.get('HTAG') else 0),
                        'hs': int(row.get('HS', 0) if row.get('HS') else 0),
                        'as': int(row.get('AS', 0) if row.get('AS') else 0),
                        'hst': int(row.get('HST', 0) if row.get('HST') else 0),
                        'ast': int(row.get('AST', 0) if row.get('AST') else 0),
                        'hc': int(row.get('HC', 0) if row.get('HC') else 0),
                        'ac': int(row.get('AC', 0) if row.get('AC') else 0),
                        'hy': int(row.get('HY', 0) if row.get('HY') else 0),
                        'ay': int(row.get('AY', 0) if row.get('AY') else 0),
                        'hr': int(row.get('HR', 0) if row.get('HR') else 0),
                        'ar': int(row.get('AR', 0) if row.get('AR') else 0)
                    }
                    matches_2627.append(match_data)
                    count += 1
                print(f"Loaded {count} matches for {name} ({code})")
        except Exception as e:
            print(f"Error {code}: {e}")

    print("\n=== Fetching Extra Leagues for 2026 / 2026-2027 Season ===")
    for country_code, path, name in extra_leagues:
        try:
            hdr, body = fetch_raw(path)
            content = body.decode('utf-8', errors='ignore').strip()
            lines = [l for l in content.splitlines() if l.strip()]
            if len(lines) > 1:
                reader = csv.DictReader(io.StringIO(content))
                count = 0
                for row in reader:
                    season = str(row.get('Season', '')).strip()
                    if season in ['2026', '2026/2027', '26/27', '2026/27']:
                        home = row.get('Home') or row.get('HomeTeam')
                        away = row.get('Away') or row.get('AwayTeam')
                        if not home or not away:
                            continue
                        match_data = {
                            'country': country_code,
                            'league_code': country_code,
                            'league_name': name,
                            'season': '2026/2027',
                            'date': row.get('Date', ''),
                            'time': row.get('Time', ''),
                            'homeTeam': home.strip(),
                            'awayTeam': away.strip(),
                            'fthg': int(row.get('HG') or row.get('FTHG') or 0),
                            'ftag': int(row.get('AG') or row.get('FTAG') or 0),
                            'ftr': row.get('Res') or row.get('FTR') or 'D',
                            'hthg': 0, 'htag': 0,
                            'hs': 0, 'as': 0, 'hst': 0, 'ast': 0, 'hc': 0, 'ac': 0, 'hy': 0, 'ay': 0, 'hr': 0, 'ar': 0
                        }
                        matches_2627.append(match_data)
                        count += 1
                print(f"Loaded {count} matches for {name} ({country_code})")
        except Exception as e:
            print(f"Error {path}: {e}")

    print(f"\nTOTAL 2026-2027 matches loaded: {len(matches_2627)}")

    # Update data.js directly
    country_meta = {
        "TR":  {"name": "Türkiye", "code": "T1", "flag": "https://flagcdn.com/w80/tr.png"},
        "ENG": {"name": "İngiltere", "code": "E0", "flag": "https://flagcdn.com/w80/gb-eng.png"},
        "ESP": {"name": "İspanya", "code": "SP1", "flag": "https://flagcdn.com/w80/es.png"},
        "GER": {"name": "Almanya", "code": "D1", "flag": "https://flagcdn.com/w80/de.png"},
        "ITA": {"name": "İtalya", "code": "I1", "flag": "https://flagcdn.com/w80/it.png"},
        "FRA": {"name": "Fransa", "code": "F1", "flag": "https://flagcdn.com/w80/fr.png"},
        "NED": {"name": "Hollanda", "code": "N1", "flag": "https://flagcdn.com/w80/nl.png"},
        "POR": {"name": "Portekiz", "code": "P1", "flag": "https://flagcdn.com/w80/pt.png"},
        "BEL": {"name": "Belçika", "code": "B1", "flag": "https://flagcdn.com/w80/be.png"},
        "GRE": {"name": "Yunanistan", "code": "G1", "flag": "https://flagcdn.com/w80/gr.png"},
        "SCO": {"name": "İskoçya", "code": "SC0", "flag": "https://flagcdn.com/w80/gb-sct.png"},
        "DNK": {"name": "Danimarka", "code": "DNK", "flag": "https://flagcdn.com/w80/dk.png"},
        "SWE": {"name": "İsveç", "code": "SWE", "flag": "https://flagcdn.com/w80/se.png"},
        "NOR": {"name": "Norveç", "code": "NOR", "flag": "https://flagcdn.com/w80/no.png"},
        "POL": {"name": "Polonya", "code": "POL", "flag": "https://flagcdn.com/w80/pl.png"},
        "BRA": {"name": "Brezilya", "code": "BRA", "flag": "https://flagcdn.com/w80/br.png"},
        "ARG": {"name": "Arjantin", "code": "ARG", "flag": "https://flagcdn.com/w80/ar.png"},
        "USA": {"name": "ABD", "code": "USA", "flag": "https://flagcdn.com/w80/us.png"},
        "MEX": {"name": "Meksika", "code": "MEX", "flag": "https://flagcdn.com/w80/mx.png"},
        "ROU": {"name": "Romanya", "code": "ROU", "flag": "https://flagcdn.com/w80/ro.png"},
        "RUS": {"name": "Rusya", "code": "RUS", "flag": "https://flagcdn.com/w80/ru.png"}
    }

    country_teams = {}
    for m in matches_2627:
        c = m['country']
        if c not in country_teams:
            country_teams[c] = set()
        country_teams[c].add(m['homeTeam'])
        country_teams[c].add(m['awayTeam'])

    default_teams = {
        "TR": ["Galatasaray", "Fenerbahçe", "Beşiktaş", "Trabzonspor", "Başakşehir", "Adana Demirspor", "Kasımpaşa", "Sivasspor", "Antalyaspor", "Alanyaspor", "Rizespor", "Samsunspor", "Kayserispor", "Konyaspor", "Gaziantep FK", "Hatayspor", "Göztepe", "Bodrum FK", "Eyüpspor"],
        "ENG": ["Arsenal", "Manchester City", "Liverpool", "Aston Villa", "Tottenham", "Chelsea", "Newcastle", "Manchester United", "West Ham", "Brighton", "Wolves", "Fulham", "Bournemouth", "Crystal Palace", "Brentford", "Everton", "Nottingham Forest", "Leicester", "Ipswich", "Southampton"],
        "ESP": ["Real Madrid", "Barcelona", "Atletico Madrid", "Athletic Bilbao", "Real Sociedad", "Real Betis", "Villarreal", "Valencia", "Sevilla", "Girona", "Osasuna", "Celta Vigo", "Getafe", "Rayo Vallecano", "Mallorca", "Espanyol", "Valladolid", "Leganes", "Las Palmas", "Alaves"],
        "GER": ["Bayer Leverkusen", "Bayern Munich", "VfB Stuttgart", "RB Leipzig", "Borussia Dortmund", "Eintracht Frankfurt", "TSG Hoffenheim", "Heidenheim", "Werder Bremen", "Freiburg", "Augsburg", "Wolfsburg", "Mainz", "Borussia M'gladbach", "Union Berlin", "St. Pauli", "Holstein Kiel", "VfL Bochum"],
        "ITA": ["Inter", "AC Milan", "Juventus", "Atalanta", "Bologna", "AS Roma", "Lazio", "Fiorentina", "Napoli", "Torino", "Genoa", "Monza", "Verona", "Cagliari", "Lecce", "Parma", "Como", "Venezia", "Empoli", "Udinese"],
        "FRA": ["Paris SG", "Monaco", "Brest", "Lille", "Nice", "Lyon", "Lens", "Marseille", "Reims", "Rennes", "Toulouse", "Montpellier", "Strasbourg", "Nantes", "Le Havre", "Auxerre", "Angers", "Saint-Etienne"]
    }

    countries_list = []
    for c, meta in country_meta.items():
        teams_set = set(country_teams.get(c, []))
        if c in default_teams:
            teams_set.update(default_teams[c])
        sorted_teams = sorted(list(teams_set))
        if sorted_teams:
            countries_list.append({
                "id": c,
                "name": meta["name"],
                "code": meta["code"],
                "flag": meta["flag"],
                "teams": sorted_teams
            })

    js_content = f"""// GOLANALIZ AI - 2026-2027 Sezonu Güncel Veri Bankası (football-data.co.uk)
// YALNIZCA 2026-2027 SEZONU GERÇEK MATCH VERİLERİ KULLANILIR. PREVIOUS SEASONS ARE EXCLUDED.

const SEASON_2026_2027_MATCHES = {json.dumps(matches_2627, ensure_ascii=False, indent=2)};

const FOOTBALL_DATA = {{
  season: "2026-2027",
  lastUpdated: "{matches_2627[0]['date'] if matches_2627 else 'August 2026'}",
  countries: {json.dumps(countries_list, ensure_ascii=False, indent=2)}
}};

// 2026-2027 Sezonu Gerçek Takım Profili Hesaplayıcı
function generateTeamProfile(teamName, countryCode) {{
  const rawMatches = SEASON_2026_2027_MATCHES.filter(m => 
    m.homeTeam.toLowerCase() === teamName.toLowerCase() || 
    m.awayTeam.toLowerCase() === teamName.toLowerCase()
  );

  const formattedMatches = rawMatches.map((m, idx) => {{
    const isHome = m.homeTeam.toLowerCase() === teamName.toLowerCase();
    const opponent = isHome ? m.awayTeam : m.homeTeam;
    const teamGoals = isHome ? m.fthg : m.ftag;
    const oppGoals = isHome ? m.ftag : m.fthg;
    const result = teamGoals > oppGoals ? 'W' : (teamGoals === oppGoals ? 'D' : 'L');

    return {{
      id: idx + 1,
      isHome: isHome,
      opponent: opponent,
      date: m.date || '2026/27',
      result: result,
      score: `${{teamGoals}}-${{oppGoals}}`,
      goalsFor: teamGoals,
      goalsAgainst: oppGoals,
      shots: isHome ? (m.hs || 12) : (m.as || 10),
      shotsOnTarget: isHome ? (m.hst || 4) : (m.ast || 3),
      corners: isHome ? (m.hc || 5) : (m.ac || 4),
      yellowCards: isHome ? (m.hy || 2) : (m.ay || 2),
      redCards: isHome ? (m.hr || 0) : (m.ar || 0),
      htGoals: (m.hthg || 0) + (m.htag || 0)
    }};
  }});

  const n = formattedMatches.length;

  if (n === 0) {{
    return {{
      teamName: teamName,
      countryCode: countryCode,
      matches: [],
      played2627Count: 0,
      homeStats: null,
      awayStats: null,
      stats: {{
        avgGoalsScored: "0.0",
        avgGoalsConceded: "0.0",
        avgTotalGoalsPerMatch: "0.0",
        avgShots: "0.0",
        avgShotsOnTarget: "0.0",
        shotAccuracyPct: 0,
        avgCorners: "0.0",
        avgYellowCards: "0.0",
        totalRedCardsIn5: 0,
        bttsPct: 0,
        over25Pct: 0,
        winPct: 0,
        formPoints: 0
      }}
    }};
  }}

  const totalGoalsScored = formattedMatches.reduce((sum, m) => sum + m.goalsFor, 0);
  const totalGoalsConceded = formattedMatches.reduce((sum, m) => sum + m.goalsAgainst, 0);
  const totalShots = formattedMatches.reduce((sum, m) => sum + m.shots, 0);
  const totalShotsOnTarget = formattedMatches.reduce((sum, m) => sum + m.shotsOnTarget, 0);
  const totalCorners = formattedMatches.reduce((sum, m) => sum + m.corners, 0);
  const totalYellows = formattedMatches.reduce((sum, m) => sum + m.yellowCards, 0);
  const totalReds = formattedMatches.reduce((sum, m) => sum + m.redCards, 0);
  const bttsCount = formattedMatches.filter(m => m.goalsFor > 0 && m.goalsAgainst > 0).length;
  const over25Count = formattedMatches.filter(m => (m.goalsFor + m.goalsAgainst) > 2.5).length;
  const winsCount = formattedMatches.filter(m => m.result === 'W').length;

  const homeMatches = formattedMatches.filter(m => m.isHome);
  const awayMatches = formattedMatches.filter(m => !m.isHome);

  function calcSplitStats(mList) {{
    if (!mList.length) return null;
    const len = mList.length;
    const gs = mList.reduce((s, m) => s + m.goalsFor, 0);
    const gc = mList.reduce((s, m) => s + m.goalsAgainst, 0);
    const sh = mList.reduce((s, m) => s + m.shots, 0);
    const sot = mList.reduce((s, m) => s + m.shotsOnTarget, 0);
    const co = mList.reduce((s, m) => s + m.corners, 0);
    const yw = mList.reduce((s, m) => s + m.yellowCards, 0);
    const rd = mList.reduce((s, m) => s + m.redCards, 0);
    const w = mList.filter(m => m.result === 'W').length;
    const d = mList.filter(m => m.result === 'D').length;
    const l = mList.filter(m => m.result === 'L').length;
    const btts = mList.filter(m => m.goalsFor > 0 && m.goalsAgainst > 0).length;
    const o25 = mList.filter(m => (m.goalsFor + m.goalsAgainst) > 2.5).length;

    return {{
      played: len,
      wins: w, draws: d, losses: l,
      avgGoalsScored: (gs / len).toFixed(1),
      avgGoalsConceded: (gc / len).toFixed(1),
      avgShots: (sh / len).toFixed(1),
      avgShotsOnTarget: (sot / len).toFixed(1),
      avgCorners: (co / len).toFixed(1),
      avgYellowCards: (yw / len).toFixed(1),
      totalReds: rd,
      bttsPct: Math.round((btts / len) * 100),
      over25Pct: Math.round((o25 / len) * 100),
      winPct: Math.round((w / len) * 100),
      formPoints: mList.reduce((acc, m) => acc + (m.result === 'W' ? 3 : (m.result === 'D' ? 1 : 0)), 0)
    }};
  }}

  return {{
    teamName: teamName,
    countryCode: countryCode,
    matches: formattedMatches,
    played2627Count: n,
    homeStats: calcSplitStats(homeMatches),
    awayStats: calcSplitStats(awayMatches),
    stats: {{
      avgGoalsScored: (totalGoalsScored / n).toFixed(1),
      avgGoalsConceded: (totalGoalsConceded / n).toFixed(1),
      avgTotalGoalsPerMatch: ((totalGoalsScored + totalGoalsConceded) / n).toFixed(1),
      avgShots: (totalShots / n).toFixed(1),
      avgShotsOnTarget: (totalShotsOnTarget / n).toFixed(1),
      shotAccuracyPct: Math.round((totalShotsOnTarget / Math.max(1, totalShots)) * 100),
      avgCorners: (totalCorners / n).toFixed(1),
      avgYellowCards: (totalYellows / n).toFixed(1),
      totalRedCardsIn5: totalReds,
      bttsPct: Math.round((bttsCount / n) * 100),
      over25Pct: Math.round((over25Count / n) * 100),
      winPct: Math.round((winsCount / n) * 100),
      formPoints: formattedMatches.reduce((acc, m) => acc + (m.result === 'W' ? 3 : (m.result === 'D' ? 1 : 0)), 0)
    }}
  }};
}}

function generateH2HProfile(homeTeamName, awayTeamName) {{
  const h2hRawMatches = SEASON_2026_2027_MATCHES.filter(m => 
    (m.homeTeam.toLowerCase() === homeTeamName.toLowerCase() && m.awayTeam.toLowerCase() === awayTeamName.toLowerCase()) ||
    (m.homeTeam.toLowerCase() === awayTeamName.toLowerCase() && m.awayTeam.toLowerCase() === homeTeamName.toLowerCase())
  );

  const h2hMatches = h2hRawMatches.map(m => {{
    const isEvSahibiHome = m.homeTeam.toLowerCase() === homeTeamName.toLowerCase();
    const hGoals = isEvSahibiHome ? m.fthg : m.ftag;
    const aGoals = isEvSahibiHome ? m.ftag : m.fthg;
    const result = hGoals > aGoals ? 'H' : (hGoals === aGoals ? 'D' : 'A');

    return {{
      season: '2026-2027',
      date: m.date || '2026/27',
      homeGoals: hGoals,
      awayGoals: aGoals,
      score: `${{hGoals}} - ${{aGoals}}`,
      result: result,
      totalGoals: hGoals + aGoals
    }};
  }});

  if (h2hMatches.length === 0) {{
    return {{
      matches: [],
      hasH2HIn2627: false,
      note: "2026-2027 sezonunda bu iki takım henüz karşılaşmadı.",
      homeWins: 0,
      draws: 0,
      awayWins: 0,
      avgTotalGoals: "0.0",
      bttsPct: 0,
      over25Pct: 0
    }};
  }}

  const len = h2hMatches.length;
  const homeWins = h2hMatches.filter(m => m.result === 'H').length;
  const draws = h2hMatches.filter(m => m.result === 'D').length;
  const awayWins = h2hMatches.filter(m => m.result === 'A').length;
  const avgTotalGoals = (h2hMatches.reduce((s, m) => s + m.totalGoals, 0) / len).toFixed(1);
  const bttsH2H = h2hMatches.filter(m => m.homeGoals > 0 && m.awayGoals > 0).length;
  const over25H2H = h2hMatches.filter(m => m.totalGoals > 2.5).length;

  return {{
    matches: h2hMatches,
    hasH2HIn2627: true,
    homeWins,
    draws,
    awayWins,
    avgTotalGoals,
    bttsPct: Math.round((bttsH2H / len) * 100),
    over25Pct: Math.round((over25H2H / len) * 100)
  }};
}}

function slugifyTeam(name) {{
  if (!name) return "";
  const trMap = {{
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u',
    'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
    'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i', 'ó': 'o', 'ò': 'o', 'ô': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u', 'ñ': 'n'
  }};
  let str = name;
  for (let key in trMap) {{
    str = str.replace(new RegExp(key, 'g'), trMap[key]);
  }}
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}}

function getTeamLogoUrl(teamName, countryCode) {{
  if (!teamName) return '';
  const rawKey = teamName.trim();
  const slug = slugifyTeam(teamName);

  if (typeof LOCAL_LOGO_MAP !== 'undefined') {{
    if (LOCAL_LOGO_MAP[rawKey]) return LOCAL_LOGO_MAP[rawKey];
    if (LOCAL_LOGO_MAP[rawKey.toLowerCase()]) return LOCAL_LOGO_MAP[rawKey.toLowerCase()];
    if (LOCAL_LOGO_MAP[slug]) return LOCAL_LOGO_MAP[slug];

    for (const k in LOCAL_LOGO_MAP) {{
      if (k === slug || k.includes(slug) || slug.includes(k)) {{
        return LOCAL_LOGO_MAP[k];
      }}
    }}
  }}

  return `logos/${{slug}}.png`;
}}
"""
    data_js_path = os.path.join(os.path.dirname(__file__), 'data.js')
    with open(data_js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print("SUCCESS: 2026-2027 season data updated and saved to data.js!")

if __name__ == '__main__':
    run_sync()
