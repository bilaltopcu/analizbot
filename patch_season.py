"""
Patch script: 
1. update_2026_2027_data.py => generateTeamProfile'i 2026-2027 öncelikli yapar
2. app.js => renderStatsList ve generateAIPrediction'i kategori bazlı yapar
"""

import re

# ─────────────────────────────────────────────────────────────
# 1) update_2026_2027_data.py: generateTeamProfile fonksiyonu
# ─────────────────────────────────────────────────────────────
NEW_GENTEAM = r"""// Takım Profili Hesaplayıcı (2026-2027 öncelikli, yetersiz veri durumunda 2025-2026 fallback)
function generateTeamProfile(teamName, countryCode) {{
  const allRaw = ALL_MATCHES.filter(m =>
    matchTeamNames(m.homeTeam, teamName) ||
    matchTeamNames(m.awayTeam, teamName)
  );

  // 2026-2027 sezonu maçları önce dene
  const raw2627 = allRaw.filter(m => m.season === '2026/2027');
  // Yeterli 2026-2027 verisi varsa (>=4 maç) sadece onu kullan, yoksa tümünü
  const MIN_MATCHES = 4;
  const useOnly2627 = raw2627.length >= MIN_MATCHES;
  const rawMatches = useOnly2627 ? raw2627 : allRaw;
  const dataSeasonLabel = useOnly2627 ? '2026/2027' : '2025-2027';

  function formatMatch(m, idx) {{
    const isHome = matchTeamNames(m.homeTeam, teamName);
    const opponent = isHome ? m.awayTeam : m.homeTeam;
    const teamGoals = isHome ? m.fthg : m.ftag;
    const oppGoals  = isHome ? m.ftag  : m.fthg;
    const result = teamGoals > oppGoals ? 'W' : (teamGoals === oppGoals ? 'D' : 'L');
    const hasStatsData   = (m.hs > 0 || m.as > 0 || m.hst > 0 || m.ast > 0);
    const hasCornersData = (m.hc > 0 || m.ac > 0);
    const hasCardsData   = (m.hy > 0 || m.ay > 0 || m.hr > 0 || m.ar > 0);
    return {{
      id: idx + 1,
      season: m.season || '2025/2026',
      isHome,
      opponent,
      date: m.date || '',
      result,
      score: `${{teamGoals}}-${{oppGoals}}`,
      goalsFor: teamGoals,
      goalsAgainst: oppGoals,
      shots:        hasStatsData   ? (isHome ? m.hs  : m.as)  : null,
      shotsOnTarget:hasStatsData   ? (isHome ? m.hst : m.ast) : null,
      corners:      hasCornersData ? (isHome ? m.hc  : m.ac)  : null,
      yellowCards:  hasCardsData   ? (isHome ? m.hy  : m.ay)  : null,
      redCards: isHome ? (m.hr || 0) : (m.ar || 0),
      htGoals: (m.hthg || 0) + (m.htag || 0),
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
      homeStats: null, awayStats: null,
      stats: {{
        avgGoalsScored:'0.0', avgGoalsConceded:'0.0', avgTotalGoalsPerMatch:'0.0',
        avgShots:'0.0', avgShotsOnTarget:'0.0', shotAccuracyPct:0,
        avgCorners:'0.0', avgYellowCards:'0.0', totalRedCardsIn5:0,
        bttsPct:0, over25Pct:0, winPct:0, formPoints:0,
        cornersReliable: false, cardsReliable: false
      }}
    }};
  }}

  // Sadece gerçek verisi olan maçlardan ortalama hesapla
  const shotsMatches  = formattedMatches.filter(m => m.hasStatsData   && m.shots       !== null);
  const cornerMatches = formattedMatches.filter(m => m.hasCornersData && m.corners     !== null);
  const cardMatches   = formattedMatches.filter(m => m.hasCardsData   && m.yellowCards !== null);

  const totalGoalsScored   = formattedMatches.reduce((s,m) => s + m.goalsFor,    0);
  const totalGoalsConceded = formattedMatches.reduce((s,m) => s + m.goalsAgainst,0);
  const totalShots         = shotsMatches.reduce ((s,m) => s + m.shots,       0);
  const totalSoT           = shotsMatches.reduce ((s,m) => s + m.shotsOnTarget,0);
  const totalCorners       = cornerMatches.reduce((s,m) => s + m.corners,     0);
  const totalYellows       = cardMatches.reduce  ((s,m) => s + m.yellowCards,  0);
  const totalReds          = formattedMatches.reduce((s,m) => s + m.redCards,  0);

  const bttsCount  = formattedMatches.filter(m => m.goalsFor > 0 && m.goalsAgainst > 0).length;
  const over25Count= formattedMatches.filter(m => (m.goalsFor + m.goalsAgainst) > 2.5).length;
  const winsCount  = formattedMatches.filter(m => m.result === 'W').length;

  const cornersReliable = cornerMatches.length >= 3;
  const cardsReliable   = cardMatches.length   >= 3;

  const avgShotsVal    = shotsMatches.length  >= 3 ? totalShots   / shotsMatches.length  : 11.5;
  const avgSoTVal      = shotsMatches.length  >= 3 ? totalSoT     / shotsMatches.length  : 4.0;
  const avgCornersVal  = cornersReliable       ? totalCorners / cornerMatches.length : 4.8;
  const avgYellowsVal  = cardsReliable         ? totalYellows / cardMatches.length   : 1.9;

  const homeMatches = formattedMatches.filter(m => m.isHome);
  const awayMatches = formattedMatches.filter(m => !m.isHome);

  function calcSplitStats(mList) {{
    if (!mList.length) return null;
    const len = mList.length;
    const gs = mList.reduce((s,m) => s + m.goalsFor,    0);
    const gc = mList.reduce((s,m) => s + m.goalsAgainst,0);
    const shL= mList.filter(m => m.hasStatsData   && m.shots       !== null);
    const coL= mList.filter(m => m.hasCornersData && m.corners     !== null);
    const ywL= mList.filter(m => m.hasCardsData   && m.yellowCards !== null);
    const sh = shL.reduce((s,m) => s + m.shots,       0);
    const sot= shL.reduce((s,m) => s + m.shotsOnTarget,0);
    const co = coL.reduce((s,m) => s + m.corners,     0);
    const yw = ywL.reduce((s,m) => s + m.yellowCards,  0);
    const rd = mList.reduce((s,m) => s + m.redCards,  0);
    const w  = mList.filter(m => m.result==='W').length;
    const d  = mList.filter(m => m.result==='D').length;
    const l  = mList.filter(m => m.result==='L').length;
    const btts = mList.filter(m => m.goalsFor>0 && m.goalsAgainst>0).length;
    const o25  = mList.filter(m => (m.goalsFor+m.goalsAgainst)>2.5).length;
    return {{
      played:len, wins:w, draws:d, losses:l,
      avgGoalsScored: (gs/len).toFixed(1),
      avgGoalsConceded:(gc/len).toFixed(1),
      avgShots:         (shL.length>=2 ? sh/shL.length : 11.5).toFixed(1),
      avgShotsOnTarget: (shL.length>=2 ? sot/shL.length: 4.0 ).toFixed(1),
      avgCorners:       (coL.length>=2 ? co/coL.length : 4.8 ).toFixed(1),
      avgYellowCards:   (ywL.length>=2 ? yw/ywL.length : 1.9 ).toFixed(1),
      totalReds:rd,
      bttsPct:  Math.round((btts/len)*100),
      over25Pct:Math.round((o25 /len)*100),
      winPct:   Math.round((w   /len)*100),
      formPoints: mList.reduce((acc,m) => acc+(m.result==='W'?3:(m.result==='D'?1:0)),0)
    }};
  }}

  return {{
    teamName, countryCode,
    matches: formattedMatches,
    played2627Count: raw2627.length,
    playedCount: n,
    dataSeasonLabel,          // Hangi sezondan veri kullanıldı
    cornersReliable,
    cardsReliable,
    homeStats: calcSplitStats(homeMatches),
    awayStats: calcSplitStats(awayMatches),
    stats: {{
      avgGoalsScored:       (totalGoalsScored   / n).toFixed(1),
      avgGoalsConceded:     (totalGoalsConceded / n).toFixed(1),
      avgTotalGoalsPerMatch:((totalGoalsScored + totalGoalsConceded) / n).toFixed(1),
      avgShots:          avgShotsVal.toFixed(1),
      avgShotsOnTarget:  avgSoTVal.toFixed(1),
      shotAccuracyPct:   avgShotsVal > 0 ? Math.round((avgSoTVal / avgShotsVal)*100) : 35,
      avgCorners:        avgCornersVal.toFixed(1),
      avgYellowCards:    avgYellowsVal.toFixed(1),
      totalRedCardsIn5:  totalReds,
      bttsPct:     Math.round((bttsCount  / n)*100),
      over25Pct:   Math.round((over25Count/ n)*100),
      winPct:      Math.round((winsCount  / n)*100),
      formPoints:  formattedMatches.reduce((acc,m)=>acc+(m.result==='W'?3:(m.result==='D'?1:0)),0),
      cornersReliable,
      cardsReliable
    }}
  }};
}}
"""

with open('update_2026_2027_data.py', 'r', encoding='utf-8') as f:
    py_content = f.read()

old_start = py_content.find('// 2025-2027 Sezonları Orijinal Takım Profili Hesaplayıcı\nfunction generateTeamProfile')
old_end   = py_content.find('\nfunction generateH2HProfile')
if old_start == -1 or old_end == -1:
    print(f'ERROR: py markers not found. start={old_start}, end={old_end}')
else:
    py_content = py_content[:old_start] + NEW_GENTEAM + '\n' + py_content[old_end:]
    with open('update_2026_2027_data.py', 'w', encoding='utf-8') as f:
        f.write(py_content)
    print('SUCCESS: update_2026_2027_data.py generateTeamProfile replaced')

print('Done step 1')
