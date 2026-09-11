import os
import json
import re
import sys
from datetime import datetime


sys.stdout.reconfigure(encoding='utf-8')

def slugify(name):
    if not name:
        return ""
    tr_map = {
        'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i',
        'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u',
        'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
        'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i', 'ó': 'o', 'ò': 'o', 'ô': 'o',
        'ú': 'u', 'ù': 'u', 'û': 'u', 'ñ': 'n', 'ø': 'o', 'Ø': 'o', 'å': 'a', 'Å': 'a',
        'æ': 'ae', 'Æ': 'ae', 'ß': 'ss'
    }
    s = name.strip()
    for k, v in tr_map.items():
        s = s.replace(k, v)
    return re.sub(r'[^a-z0-9]', '', s.lower())

def run():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    matches_file = os.path.join(base_dir, 'matches_2026_2027.json')
    adv_file = os.path.join(base_dir, 'advanced_team_stats.json')
    data_js_file = os.path.join(base_dir, 'data.js')

    with open(matches_file, 'r', encoding='utf-8') as f:
        matches = json.load(f)

    with open(adv_file, 'r', encoding='utf-8') as f:
        adv_stats = json.load(f)

    country_meta = {
        "TR": {"name": "Türkiye", "code": "TR", "flag": "🇹🇷"},
        "ENG": {"name": "İngiltere", "code": "ENG", "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿"},
        "ESP": {"name": "İspanya", "code": "ESP", "flag": "🇪🇸"},
        "GER": {"name": "Almanya", "code": "GER", "flag": "🇩🇪"},
        "ITA": {"name": "İtalya", "code": "ITA", "flag": "🇮🇹"},
        "FRA": {"name": "Fransa", "code": "FRA", "flag": "🇫🇷"},
        "NED": {"name": "Hollanda", "code": "NED", "flag": "🇳🇱"},
        "POR": {"name": "Portekiz", "code": "POR", "flag": "🇵🇹"},
        "BEL": {"name": "Belçika", "code": "BEL", "flag": "🇧🇪"},
        "GRE": {"name": "Yunanistan", "code": "GRE", "flag": "🇬🇷"},
        "SCO": {"name": "İskoçya", "code": "SCO", "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"},
        "DNK": {"name": "Danimarka", "code": "DNK", "flag": "🇩🇰"},
        "SWE": {"name": "İsveç", "code": "SWE", "flag": "🇸🇪"},
        "NOR": {"name": "Norveç", "code": "NOR", "flag": "🇳🇴"},
        "POL": {"name": "Polonya", "code": "POL", "flag": "🇵🇱"},
        "BRA": {"name": "Brezilya", "code": "BRA", "flag": "🇧🇷"},
        "ARG": {"name": "Arjantin", "code": "ARG", "flag": "🇦🇷"},
        "USA": {"name": "ABD", "code": "USA", "flag": "🇺🇸"},
        "MEX": {"name": "Meksika", "code": "MEX", "flag": "🇲🇽"},
        "ROU": {"name": "Romanya", "code": "ROU", "flag": "🇷🇴"},
        "RUS": {"name": "Rusya", "code": "RUS", "flag": "🇷🇺"},
        "AUT": {"name": "Avusturya", "code": "AUT", "flag": "🇦🇹"},
        "CHN": {"name": "Çin", "code": "CHN", "flag": "🇨🇳"},
        "FIN": {"name": "Finlandiya", "code": "FIN", "flag": "🇫🇮"},
        "IRL": {"name": "İrlanda", "code": "IRL", "flag": "🇮🇪"},
        "JPN": {"name": "Japonya", "code": "JPN", "flag": "🇯🇵"},
        "SWZ": {"name": "İsviçre", "code": "SWZ", "flag": "🇨🇭"}
    }

    country_teams = {c: set() for c in country_meta}
    team_matches_index = {}

    canonical_teams = {
        # England
        'Man City': 'Manchester City',
        'Man United': 'Manchester United',
        "Nott'm Forest": 'Nottingham Forest',
        'Sheffield Wed': 'Sheffield Wednesday',
        'Sheffield Weds': 'Sheffield Wednesday',
        'Bradford City': 'Bradford',
        'Wolves': 'Wolverhampton',
        # Spain
        'Ath Bilbao': 'Athletic Bilbao',
        'Ath Madrid': 'Atletico Madrid',
        'Atl. Madrid': 'Atletico Madrid',
        'Betis': 'Real Betis',
        'Celta': 'Celta Vigo',
        'Espanol': 'Espanyol',
        'La Coruna': 'Dep. A Coruna',
        'Sociedad': 'Real Sociedad',
        'Vallecano': 'Rayo Vallecano',
        'Sp Gijon': 'Sporting Gijon',
        # Germany
        'Dortmund': 'Borussia Dortmund',
        'Leverkusen': 'Bayer Leverkusen',
        'Hoffenheim': 'TSG Hoffenheim',
        "M'gladbach": "Borussia M'gladbach",
        'Ein Frankfurt': 'Eintracht Frankfurt',
        'Stuttgart': 'VfB Stuttgart',
        'Bochum': 'VfL Bochum',
        'St. Pauli': 'St Pauli',
        # Italy
        'Milan': 'AC Milan',
        'Roma': 'AS Roma',
        # France
        'St Etienne': 'Saint-Etienne',
        'Paris SG': 'Paris Saint-Germain',
        'Paris': 'Paris Saint-Germain',
        # Portugal
        'Sp Braga': 'Sporting Braga',
        'Sp Lisbon': 'Sporting CP',
        # Mexico
        'U.A.N.L.- Tigres': 'Tigres UANL',
        'U.N.A.M.- Pumas': 'UNAM Pumas',
        # Romania
        'Din. Bucuresti': 'Dinamo Bucuresti',
    }

    alias_slug_map = {
        'mancity': 'manchestercity', 'manunited': 'manchesterunited',
        'nottmforest': 'nottinghamforest', 'athbilbao': 'athleticbilbao',
        'athmadrid': 'atleticomadrid', 'atlmadrid': 'atleticomadrid',
        'sociedad': 'realsociedad', 'vallecano': 'rayovallecano',
        'spgijon': 'sportinggijon', 'spbraga': 'sportingbraga',
        'splisbon': 'sportingcp', 'preussenmunster': 'preussenmunster',
        'sheffieldwed': 'sheffieldwednesday', 'sheffieldweds': 'sheffieldwednesday',
        'bradfordcity': 'bradford',
        'psg': 'parissaintgermain', 'paris': 'parissaintgermain', 'parissg': 'parissaintgermain',
        'wolves': 'wolverhampton', 'espanol': 'espanyol',
        'celta': 'celtavigo', 'betis': 'realbetis', 'lacoruna': 'depacoruna',
        'stuttgart': 'vfbstuttgart', 'bochum': 'vflbochum',
        'dortmund': 'borussiadortmund',
        'mgladbach': 'borussiamgladbach', 'einfrankfurt': 'eintrachtfrankfurt',
        'leverkusen': 'bayerleverkusen', 'hoffenheim': 'tsghoffenheim',
        'milan': 'acmilan', 'roma': 'asroma',
        'intermilan': 'inter', 'stetienne': 'saintetienne',
        'uanltigres': 'tigresuanl', 'unampumas': 'unampumas',
        'dinbucuresti': 'dinamobucuresti'
    }

    fin_teams = {'AC Oulu', 'Ekenas', 'Gnistan', 'HJK', 'Haka', 'Ilves', 'Inter Turku', 'Jaro', 'KTP', 'KuPS', 'Lahti', 'Mariehamn', 'SJK', 'TPS', 'VPS'}

    for m in matches:
        c = m.get('country')
        ht_orig = m.get('homeTeam')
        at_orig = m.get('awayTeam')
        if not ht_orig or not at_orig:
            continue

        ht = canonical_teams.get(ht_orig, ht_orig)
        at = canonical_teams.get(at_orig, at_orig)

        # Fix Finnish matches incorrectly labeled as USA
        if c == 'USA' and (ht in fin_teams or at in fin_teams):
            c = 'FIN'

        if c in country_teams:
            country_teams[c].add(ht)
            country_teams[c].add(at)

        h_slug = slugify(ht)
        a_slug = slugify(at)

        # Ultra compact match tuple:
        # [0:season, 1:date, 2:homeTeam, 3:awayTeam, 4:fthg, 5:ftag, 6:hs, 7:as, 8:hst, 9:ast, 10:hc, 11:ac, 12:hy, 13:ay, 14:hr, 15:ar, 16:hthg, 17:htag]
        compact_m = [
            m.get('season', '2025/2026'),
            m.get('date', ''),
            ht,
            at,
            m.get('fthg', 0),
            m.get('ftag', 0),
            m.get('hs', 0),
            m.get('as', 0),
            m.get('hst', 0),
            m.get('ast', 0),
            m.get('hc', 0),
            m.get('ac', 0),
            m.get('hy', 0),
            m.get('ay', 0),
            m.get('hr', 0),
            m.get('ar', 0),
            m.get('hthg', 0),
            m.get('htag', 0)
        ]

        def norm_team(s):
            sl = slugify(s)
            return alias_slug_map.get(sl, sl)

        def add_unique_match(slug_key, m_tuple):
            if slug_key not in team_matches_index:
                team_matches_index[slug_key] = []
            m_date = m_tuple[1]
            m_score = (m_tuple[4], m_tuple[5])
            m_norm_ht = norm_team(m_tuple[2])
            m_norm_at = norm_team(m_tuple[3])
            for ex in team_matches_index[slug_key]:
                if ex[1] == m_date and (ex[4], ex[5]) == m_score:
                    ex_ht = norm_team(ex[2])
                    ex_at = norm_team(ex[3])
                    if (ex_ht == m_norm_ht and ex_at == m_norm_at) or (ex_ht == m_norm_at and ex_at == m_norm_ht):
                        return
            team_matches_index[slug_key].append(m_tuple)

        add_unique_match(h_slug, compact_m)
        add_unique_match(a_slug, compact_m)

    def parse_d(d_str):
        if not d_str:
            return (0, 0, 0)
        try:
            parts = d_str.split('/')
            if len(parts) == 3:
                return (int(parts[2]), int(parts[1]), int(parts[0]))
            parts = d_str.split('-')
            if len(parts) == 3:
                return (int(parts[0]), int(parts[1]), int(parts[2]))
        except Exception:
            pass
        return (0, 0, 0)

    for slug in team_matches_index:
        # En eski mactan en yeni maca dogru kronolojik sirala
        team_matches_index[slug].sort(key=lambda x: parse_d(x[1]))
        # En son oynanan 25 maci sakla (2026/2027 maclari her zaman en sonda yer alir)
        team_matches_index[slug] = team_matches_index[slug][-25:]

    # Tüm alias slug'larını kanonik maç listesine bağla (O(1) erişim ve çift yönlü uyumluluk)
    for alias_k, can_k in alias_slug_map.items():
        if can_k in team_matches_index:
            if alias_k not in team_matches_index or len(team_matches_index[alias_k]) < len(team_matches_index[can_k]):
                team_matches_index[alias_k] = team_matches_index[can_k]

    # Advanced Stats'tan takımları topla (kanonik isimlerle)
    for slug, s in adv_stats.items():
        c = s.get('country')
        raw_tn = s.get('teamName')
        if not raw_tn:
            continue
        canon_tn = canonical_teams.get(raw_tn, raw_tn)
        if c in country_teams and canon_tn:
            country_teams[c].add(canon_tn)

    countries_list = []
    total_teams_count = 0
    for c, meta in country_meta.items():
        sorted_teams = sorted(list(country_teams[c]))
        total_teams_count += len(sorted_teams)
        countries_list.append({
            "id": c,
            "name": meta["name"],
            "code": meta["code"],
            "flag": f"flags/{c.lower()}.png",
            "flagUrl": f"flags/{c.lower()}.png",
            "flagEmoji": meta["flag"],
            "teams": sorted_teams
        })

    js_content = f"""// GOLANALIZ AI - Ultra Hızlı Kompakt Veri Bankası
const FOOTBALL_DATA = {{
  season: "2025-2027",
  lastUpdated: "{datetime.now().strftime('%d/%m/%Y %H:%M')} (2025/26 & 2026/27 Sezonları)",
  countries: {json.dumps(countries_list, ensure_ascii=False, separators=(',', ':'))}

}};

// Pre-Indexed Fast Match Map (O(1) Access, Ultra-Compact Tuple Format)
const TEAM_MATCHES_INDEX = {json.dumps(team_matches_index, ensure_ascii=False, separators=(',', ':'))};

function matchTeamNames(name1, name2) {{
  if (!name1 || !name2) return false;
  const s1 = slugifyTeam(name1);
  const s2 = slugifyTeam(name2);
  if (s1 === s2) return true;
  const aliases = {json.dumps(alias_slug_map, ensure_ascii=False, separators=(',', ':'))};
  const c1 = aliases[s1] || s1;
  const c2 = aliases[s2] || s2;
  return c1 === c2;
}}

function slugifyTeam(name) {{
  if (!name) return '';
  const trMap = {{
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u',
    'ß': 'ss', 'ä': 'a', 'ö': 'o', 'ü': 'u', 'é': 'e', 'è': 'e'
  }};
  let str = name.trim();
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

// O(1) Ultra Hızlı Takım Profili Oluşturucu
function generateTeamProfile(teamName, countryCode) {{
  const slug = slugifyTeam(teamName);
  let rawList = TEAM_MATCHES_INDEX[slug] || [];

  if (rawList.length === 0) {{
    for (const k in TEAM_MATCHES_INDEX) {{
      if (k.includes(slug) || slug.includes(k)) {{
        rawList = TEAM_MATCHES_INDEX[k];
        break;
      }}
    }}
  }}

  // Son maclar (tum mevcut maclari dondur, boylece form strip ve 2026-2027 filtreleri eksiksiz calisir)
  const rawMatches = rawList;
  const recent5Raw = rawList.slice(-5);
  const dataSeasonLabel = '2026-2027 Sezonu';

  function formatMatch(m, idx) {{
    const isHome = matchTeamNames(m[2], teamName);
    const opponent = isHome ? m[3] : m[2];
    const teamGoals = isHome ? m[4] : m[5];
    const oppGoals  = isHome ? m[5] : m[4];
    const result = teamGoals > oppGoals ? 'W' : (teamGoals === oppGoals ? 'D' : 'L');
    const hasStatsData   = (m[6] !== null && m[6] !== undefined && m[7] !== null && m[7] !== undefined);
    const hasCornersData = (m[10] !== null && m[10] !== undefined && m[11] !== null && m[11] !== undefined);
    const hasCardsData   = (m[12] !== null && m[12] !== undefined && m[13] !== null && m[13] !== undefined);
    return {{
      id: idx + 1,
      season: m[0] || '2025/2026',
      isHome,
      opponent,
      date: m[1] || '',
      result,
      score: `${{teamGoals}}-${{oppGoals}}`,
      goalsFor: teamGoals,
      goalsAgainst: oppGoals,
      shots: hasStatsData ? (isHome ? m[6] : m[7]) : null,
      shotsOnTarget: hasStatsData ? (isHome ? m[8] : m[9]) : null,
      corners: hasCornersData ? (isHome ? m[10] : m[11]) : null,
      yellowCards: hasCardsData ? (isHome ? m[12] : m[13]) : null,
      redCards: isHome ? (m[14] || 0) : (m[15] || 0),
      htGoals: (m[16] || 0) + (m[17] || 0),
      hasStatsData, hasCornersData, hasCardsData
    }};
  }}

  const formattedMatches = rawMatches.map((m, idx) => formatMatch(m, idx));
  const n = formattedMatches.length;

  if (n === 0) {{
    return {{
      teamName, countryCode, matches: [],
      played2627Count: 0, playedCount: 0,
      dataSeasonLabel: '—',
      hasEnoughData: false,
      cornersReliable: false, cardsReliable: false, shotsReliable: false,
      homeStats: null, awayStats: null,
      stats: {{
        avgGoalsScored: null, avgGoalsConceded: null, avgTotalGoalsPerMatch: null,
        avgShots: null, avgShotsOnTarget: null, shotAccuracyPct: null,
        avgCorners: null, avgYellowCards: null, totalRedCardsIn5: 0,
        bttsPct: null, over25Pct: null, winPct: null, formPoints: 0,
        cornersReliable: false, cardsReliable: false, shotsReliable: false,
        hasEnoughData: false
      }}
    }};
  }}

  const shotsMatches  = formattedMatches.filter(m => m.hasStatsData && m.shots !== null);
  const cornerMatches = formattedMatches.filter(m => m.hasCornersData && m.corners !== null);
  const cardMatches   = formattedMatches.filter(m => m.hasCardsData && m.yellowCards !== null);

  const totalGoalsScored = formattedMatches.reduce((s,m) => s + m.goalsFor, 0);
  const totalGoalsConceded = formattedMatches.reduce((s,m) => s + m.goalsAgainst, 0);
  const avgGoalsScored = parseFloat((totalGoalsScored / n).toFixed(2));
  const avgGoalsConceded = parseFloat((totalGoalsConceded / n).toFixed(2));
  const avgTotalGoalsPerMatch = parseFloat(((totalGoalsScored + totalGoalsConceded) / n).toFixed(2));

  const totalShots = shotsMatches.reduce((s,m) => s + (m.shots || 0), 0);
  const totalShotsOnTarget = shotsMatches.reduce((s,m) => s + (m.shotsOnTarget || 0), 0);
  const avgShots = shotsMatches.length >= 3 ? parseFloat((totalShots / shotsMatches.length).toFixed(1)) : null;
  const avgShotsOnTarget = shotsMatches.length >= 3 ? parseFloat((totalShotsOnTarget / shotsMatches.length).toFixed(1)) : null;
  const shotAccuracyPct = (totalShots > 0 && avgShotsOnTarget !== null) ? Math.round((totalShotsOnTarget / totalShots) * 100) : null;

  const totalCorners = cornerMatches.reduce((s,m) => s + (m.corners || 0), 0);
  const avgCorners = cornerMatches.length >= 3 ? parseFloat((totalCorners / cornerMatches.length).toFixed(1)) : null;

  const totalYellowCards = cardMatches.reduce((s,m) => s + (m.yellowCards || 0), 0);
  const avgYellowCards = cardMatches.length >= 3 ? parseFloat((totalYellowCards / cardMatches.length).toFixed(1)) : null;
  const last5 = formattedMatches.slice(-5);
  const totalRedCardsIn5 = last5.reduce((s,m) => s + (m.redCards || 0), 0);

  const bttsCount = formattedMatches.filter(m => m.goalsFor > 0 && m.goalsAgainst > 0).length;
  const bttsPct = Math.round((bttsCount / n) * 100);

  const over25Count = formattedMatches.filter(m => (m.goalsFor + m.goalsAgainst) > 2.5).length;
  const over25Pct = Math.round((over25Count / n) * 100);

  const s2627Matches = formattedMatches.filter(m => 
    m.season === '2026/2027' || (m.season && m.season.includes('2026') && m.season.includes('2027'))
  );
  const sampleForWin = s2627Matches.length >= 1 ? s2627Matches : formattedMatches.slice(-5);
  const winCount = sampleForWin.filter(m => m.result === 'W').length;
  const winPct = Math.round((winCount / (sampleForWin.length || 1)) * 100);

  let formPoints = 0;
  last5.forEach(m => {{
    if (m.result === 'W') formPoints += 3;
    else if (m.result === 'D') formPoints += 1;
  }});

  const played2627Count = formattedMatches.filter(m => (m.season || '').includes('2026') || (m.season || '').includes('2027')).length;

  const advObj = (typeof ADVANCED_TEAM_STATS !== 'undefined') ? (ADVANCED_TEAM_STATS[slug] || ADVANCED_TEAM_STATS[teamName.toLowerCase().replace(/[^a-z0-9]/g, '')]) : null;

  const statsObj = {{
    avgGoalsScored, avgGoalsConceded, avgTotalGoalsPerMatch,
    avgShots: (avgShots !== null ? avgShots : (advObj && advObj.overall ? advObj.overall.avgShots : null)),
    avgShotsOnTarget: (avgShotsOnTarget !== null ? avgShotsOnTarget : (advObj && advObj.overall ? advObj.overall.avgShotsOnTarget : null)),
    shotAccuracyPct,
    avgCorners: (avgCorners !== null ? avgCorners : (advObj && advObj.overall ? advObj.overall.avgCorners : null)),
    avgYellowCards: (avgYellowCards !== null ? avgYellowCards : (advObj && advObj.overall ? advObj.overall.avgYellowCards : null)),
    totalRedCardsIn5,
    bttsPct, over25Pct, winPct, formPoints,
    cornersReliable: cornerMatches.length >= 3 || (advObj && advObj.overall && advObj.overall.cornersReliable),
    cardsReliable: cardMatches.length >= 3 || (advObj && advObj.overall && advObj.overall.cardsReliable),
    shotsReliable: shotsMatches.length >= 3 || (advObj && advObj.overall && advObj.overall.shotsReliable),
    hasEnoughData: n >= 3,
    xg_per90: advObj ? advObj.xg_per90 : null,
    xga_per90: advObj ? advObj.xga_per90 : null,
    weightedAvgGoalsScored: advObj && advObj.overall ? advObj.overall.avgGoalsScored : null,
    weightedAvgGoalsConceded: advObj && advObj.overall ? advObj.overall.avgGoalsConceded : null
  }};

  return {{
    teamName, countryCode,
    matches: formattedMatches,
    played2627Count,
    playedCount: n,
    dataSeasonLabel,
    hasEnoughData: n >= 3,
    cornersReliable: statsObj.cornersReliable,
    cardsReliable: statsObj.cardsReliable,
    shotsReliable: statsObj.shotsReliable,
    stats: statsObj
  }};
}}

// O(1) Ultra Hızlı H2H Profili Oluşturucu (Filtering team1 recent matches)
function generateH2HProfile(team1, team2) {{
  const s1 = slugifyTeam(team1);
  const rawList = (TEAM_MATCHES_INDEX[s1] || []).filter(m => matchTeamNames(m[2], team2) || matchTeamNames(m[3], team2));

  if (rawList.length === 0) {{
    return {{ hasH2H: false, matches: [], homeWins: 0, draws: 0, awayWins: 0, totalGoals: 0, avgGoals: 0, bttsCount: 0, over25Count: 0 }};
  }}

  let homeWins = 0, draws = 0, awayWins = 0, totalGoals = 0, bttsCount = 0, over25Count = 0;
  const formattedMatches = rawList.map(m => {{
    const isHome = matchTeamNames(m[2], team1);
    const t1Goals = isHome ? m[4] : m[5];
    const t2Goals = isHome ? m[5] : m[4];
    const sumG = t1Goals + t2Goals;
    totalGoals += sumG;
    if (t1Goals > t2Goals) homeWins++;
    else if (t1Goals === t2Goals) draws++;
    else awayWins++;

    if (t1Goals > 0 && t2Goals > 0) bttsCount++;
    if (sumG > 2.5) over25Count++;

    return {{
      date: m[1] || '',
      season: m[0] || '',
      homeTeam: m[2],
      awayTeam: m[3],
      homeGoals: m[4],
      awayGoals: m[5],
      score: `${{m[4]}}-${{m[5]}}`
    }};
  }});

  return {{
    hasH2H: true,
    matches: formattedMatches,
    homeWins, draws, awayWins,
    totalGoals,
    avgGoals: parseFloat((totalGoals / formattedMatches.length).toFixed(2)),
    bttsCount,
    over25Count
  }};
}}

if (typeof window !== 'undefined') {{
  window.FOOTBALL_DATA = FOOTBALL_DATA;
}}

if (typeof module !== 'undefined' && module.exports) {{
  module.exports = {{ FOOTBALL_DATA, TEAM_MATCHES_INDEX, matchTeamNames, slugifyTeam, getTeamLogoUrl, generateTeamProfile, generateH2HProfile }};
}}
"""

    with open(data_js_file, 'w', encoding='utf-8') as f:
        f.write(js_content)

    sz_mb = os.path.getsize(data_js_file) / (1024*1024)
    sz_kb = os.path.getsize(data_js_file) / 1024
    print(f"[BAŞARILI] Ultra Hızlı Kompakt data.js üretildi! Boyut: {sz_mb:.2f} MB ({sz_kb:.0f} KB)")

if __name__ == '__main__':
    run()
