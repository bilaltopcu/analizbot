// Futbol Analiz Veri Bankası - Yalnızca Ülke Adları ve Bayrakları
const FOOTBALL_DATA = {
  countries: [
    {
      id: "TR",
      name: "Türkiye",
      code: "T1",
      flag: "https://flagcdn.com/w80/tr.png",
      teams: [
        "Galatasaray", "Fenerbahçe", "Beşiktaş", "Trabzonspor", "Başakşehir",
        "Adana Demirspor", "Kasımpaşa", "Sivasspor", "Antalyaspor", "Alanyaspor",
        "Rizespor", "Samsunspor", "Kayserispor", "Konyaspor", "Gaziantep FK",
        "Hatayspor", "Göztepe", "Bodrum FK", "Eyüpspor"
      ]
    },
    {
      id: "ENG",
      name: "İngiltere",
      code: "E0",
      flag: "https://flagcdn.com/w80/gb-eng.png",
      teams: [
        "Arsenal", "Manchester City", "Liverpool", "Aston Villa", "Tottenham",
        "Chelsea", "Newcastle", "Manchester United", "West Ham", "Brighton",
        "Wolves", "Fulham", "Bournemouth", "Crystal Palace", "Brentford",
        "Everton", "Nottingham Forest", "Leicester", "Ipswich", "Southampton",
        "Leeds", "Burnley", "Sunderland", "Sheffield Utd", "West Brom",
        "Middlesbrough", "Norwich", "Coventry", "Watford", "Blackburn"
      ]
    },
    {
      id: "ESP",
      name: "İspanya",
      code: "SP1",
      flag: "https://flagcdn.com/w80/es.png",
      teams: [
        "Real Madrid", "Barcelona", "Atletico Madrid", "Athletic Bilbao", "Real Sociedad",
        "Real Betis", "Villarreal", "Valencia", "Sevilla", "Girona",
        "Osasuna", "Celta Vigo", "Getafe", "Rayo Vallecano", "Mallorca",
        "Espanyol", "Valladolid", "Leganes", "Las Palmas", "Alaves"
      ]
    },
    {
      id: "GER",
      name: "Almanya",
      code: "D1",
      flag: "https://flagcdn.com/w80/de.png",
      teams: [
        "Bayer Leverkusen", "Bayern Munich", "VfB Stuttgart", "RB Leipzig", "Borussia Dortmund",
        "Eintracht Frankfurt", "TSG Hoffenheim", "Heidenheim", "Werder Bremen", "Freiburg",
        "Augsburg", "Wolfsburg", "Mainz", "Borussia M'gladbach", "Union Berlin",
        "St. Pauli", "Holstein Kiel", "VfL Bochum"
      ]
    },
    {
      id: "ITA",
      name: "İtalya",
      code: "I1",
      flag: "https://flagcdn.com/w80/it.png",
      teams: [
        "Inter", "AC Milan", "Juventus", "Atalanta", "Bologna",
        "AS Roma", "Lazio", "Fiorentina", "Napoli", "Torino",
        "Genoa", "Monza", "Verona", "Cagliari", "Lecce",
        "Parma", "Como", "Venezia", "Empoli", "Udinese"
      ]
    },
    {
      id: "FRA",
      name: "Fransa",
      code: "F1",
      flag: "https://flagcdn.com/w80/fr.png",
      teams: [
        "Paris SG", "Monaco", "Brest", "Lille", "Nice",
        "Lyon", "Lens", "Marseille", "Reims", "Rennes",
        "Toulouse", "Montpellier", "Strasbourg", "Nantes", "Le Havre",
        "Auxerre", "Angers", "Saint-Etienne"
      ]
    },
    {
      id: "NED",
      name: "Hollanda",
      code: "N1",
      flag: "https://flagcdn.com/w80/nl.png",
      teams: [
        "PSV Eindhoven", "Feyenoord", "Twente", "AZ Alkmaar", "Ajax",
        "Go Ahead Eagles", "Utrecht", "Sparta Rotterdam", "Heerenveen", "PEC Zwolle",
        "Fortuna Sittard", "NEC Nijmegen", "Groningen", "Willem II", "Heracles"
      ]
    },
    {
      id: "POR",
      name: "Portekiz",
      code: "P1",
      flag: "https://flagcdn.com/w80/pt.png",
      teams: [
        "Sporting CP", "Benfica", "Porto", "Braga", "Vitoria Guimaraes",
        "Arouca", "Moreirense", "Rio Ave", "Famalicao", "Gil Vicente",
        "Estoril", "Boavista", "Casa Pia", "Santa Clara", "Farense"
      ]
    },
    {
      id: "BEL",
      name: "Belçika",
      code: "B1",
      flag: "https://flagcdn.com/w80/be.png",
      teams: [
        "Club Brugge", "Union St. Gilloise", "Anderlecht", "Genk", "Gent",
        "Antwerp", "Cercle Brugge", "Mechelen", "Standard Liege", "Westerlo",
        "Charleroi", "Sint-Truiden", "KV Kortrijk", "OH Leuven"
      ]
    },
    {
      id: "SCO",
      name: "İskoçya",
      code: "SC0",
      flag: "https://flagcdn.com/w80/gb-sct.png",
      teams: [
        "Celtic", "Rangers", "Hearts", "Kilmarnock", "St. Mirren",
        "Dundee", "Aberdeen", "Hibernian", "Motherwell", "St. Johnstone",
        "Ross County", "Dundee Utd"
      ]
    },
    {
      id: "GRE",
      name: "Yunanistan",
      code: "G1",
      flag: "https://flagcdn.com/w80/gr.png",
      teams: [
        "PAOK", "AEK Athens", "Olympiacos", "Panathinaikos", "Aris",
        "Atromitos", "OFI Crete", "Asteras Tripolis", "Lamia", "Volos", "Panserraikos"
      ]
    },
    {
      id: "AUT",
      name: "Avusturya",
      code: "AUT",
      flag: "https://flagcdn.com/w80/at.png",
      teams: [
        "Sturm Graz", "Red Bull Salzburg", "LASK", "Rapid Vienna", "Austria Vienna",
        "TSV Hartberg", "Wolfsberger AC", "SCR Altach", "SK Austria Klagenfurt"
      ]
    },
    {
      id: "SWZ",
      name: "İsviçre",
      code: "SWZ",
      flag: "https://flagcdn.com/w80/ch.png",
      teams: [
        "Young Boys", "Lugano", "Servette", "FC Zurich", "FC St. Gallen",
        "FC Basel", "FC Winterthur", "FC Luzern", "Grasshoppers", "Yverdon"
      ]
    },
    {
      id: "DNK",
      name: "Danimarka",
      code: "DNK",
      flag: "https://flagcdn.com/w80/dk.png",
      teams: [
        "FC Midtjylland", "Brondby IF", "FC Copenhagen", "FC Nordsjaelland", "AGF Aarhus",
        "Silkeborg IF", "Viborg FF", "Randers FC", "Lyngby BK", "Vejle Boldklub"
      ]
    },
    {
      id: "SWE",
      name: "İsveç",
      code: "SWE",
      flag: "https://flagcdn.com/w80/se.png",
      teams: [
        "Malmo FF", "Hammarby", "AIK", "Djurgarden", "Elfsborg",
        "BK Hacken", "GAIS", "Mjallby AIF", "IFK Norrkoping", "IFK Goteborg"
      ]
    },
    {
      id: "NOR",
      name: "Norveç",
      code: "NOR",
      flag: "https://flagcdn.com/w80/no.png",
      teams: [
        "Bodo/Glimt", "Brann", "Viking", "Molde", "Rosenborg",
        "Fredrikstad", "KFUM Oslo", "Tromso", "Sarpsborg 08", "Lillestrom"
      ]
    },
    {
      id: "POL",
      name: "Polonya",
      code: "POL",
      flag: "https://flagcdn.com/w80/pl.png",
      teams: [
        "Jagiellonia Bialystok", "Slask Wroclaw", "Legia Warsaw", "Lech Poznan", "Gornik Zabrze",
        "Rakow Czestochowa", "Pogon Szczecin", "Widzew Lodz", "Cracovia", "Piast Gliwice"
      ]
    },
    {
      id: "BRA",
      name: "Brezilya",
      code: "BRA",
      flag: "https://flagcdn.com/w80/br.png",
      teams: [
        "Palmeiras", "Flamengo", "Botafogo", "Fortaleza", "Sao Paulo",
        "Bahia", "Cruzeiro", "Internacional", "Atletico-MG", "Vasco da Gama",
        "Fluminense", "Gremio", "Corinthians", "Red Bull Bragantino", "Juventude"
      ]
    },
    {
      id: "ARG",
      name: "Arjantin",
      code: "ARG",
      flag: "https://flagcdn.com/w80/ar.png",
      teams: [
        "River Plate", "Boca Juniors", "Racing Club", "Talleres", "Velez Sarsfield",
        "Estudiantes", "Godoy Cruz", "San Lorenzo", "Independiente", "Huracan",
        "Lanús", "Argentinos Juniors", "Defensa y Justicia", "Rosario Central"
      ]
    },
    {
      id: "KSA",
      name: "Suudi Arabistan",
      code: "KSA",
      flag: "https://flagcdn.com/w80/sa.png",
      teams: [
        "Al-Hilal", "Al-Nassr", "Al-Ahli", "Al-Ittihad", "Al-Taawoun",
        "Al-Ettifaq", "Al-Fateh", "Al-Shabab", "Al-Fayha", "Al-Khaleej"
      ]
    },
    {
      id: "USA",
      name: "ABD",
      code: "USA",
      flag: "https://flagcdn.com/w80/us.png",
      teams: [
        "Inter Miami", "Columbus Crew", "FC Cincinnati", "LA Galaxy", "Los Angeles FC",
        "Real Salt Lake", "Colorado Rapids", "Seattle Sounders", "New York Red Bulls", "Houston Dynamo"
      ]
    }
  ]
};

// Seeded generator for highly realistic match data based on team identity
function generateTeamProfile(teamName, countryCode) {
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const normHash = Math.abs(hash);

  // Top tier team detection
  const topTeams = [
    "Galatasaray", "Fenerbahçe", "Beşiktaş", "Trabzonspor",
    "Arsenal", "Manchester City", "Liverpool", "Real Madrid", "Barcelona", "Atletico Madrid",
    "Bayern Munich", "Bayer Leverkusen", "Inter", "AC Milan", "Juventus", "AS Roma",
    "Paris SG", "PSV Eindhoven", "Ajax", "Sporting CP", "Benfica", "Porto", "Celtic", "Rangers",
    "Al-Hilal", "Al-Nassr", "Inter Miami", "Palmeiras", "Flamengo", "River Plate", "Boca Juniors"
  ];
  const isTopTier = topTeams.includes(teamName);

  const baseGoalsScored = isTopTier ? 2.3 + (normHash % 8) / 10 : 1.1 + (normHash % 10) / 10;
  const baseGoalsConceded = isTopTier ? 0.7 + (normHash % 5) / 10 : 1.5 + (normHash % 8) / 10;
  const baseShots = isTopTier ? 15.4 + (normHash % 5) : 10.2 + (normHash % 5);
  const baseShotsOnTarget = isTopTier ? 6.2 + (normHash % 3) : 3.8 + (normHash % 3);
  const baseCorners = isTopTier ? 6.4 + (normHash % 4) : 4.2 + (normHash % 4);
  const baseYellowCards = 1.8 + (normHash % 25) / 10;
  const baseRedCardProb = (normHash % 100) < 25 ? 1 : 0;

  // Generate last 5 matches
  const matches = [];
  const opponents = ["Rakip A", "Rakip B", "Rakip C", "Rakip D", "Rakip E"];
  
  for (let i = 0; i < 5; i++) {
    const isHome = i % 2 === 0;
    const variation = ((normHash + i * 17) % 5) - 2; // -2 to +2
    // Home advantage: top teams score more at home, concede less
    const homeBonus = isHome ? (isTopTier ? 0.5 : 0.3) : -(isTopTier ? 0.2 : 0.3);
    const goalsFor = Math.max(0, Math.round(baseGoalsScored + (variation * 0.4) + homeBonus));
    const goalsAgainst = Math.max(0, Math.round(baseGoalsConceded - (variation * 0.3) - (isHome ? 0.2 : -0.2)));
    const shots = Math.max(5, Math.round(baseShots + variation * 1.5 + (isHome ? 2 : -1)));
    const shotsOnTarget = Math.min(shots, Math.max(2, Math.round(baseShotsOnTarget + variation * 0.8)));
    const corners = Math.max(2, Math.round(baseCorners + variation * 1.2 + (isHome ? 1 : -0.5)));
    const yellowCards = Math.max(0, Math.round(baseYellowCards + (i % 2 === 0 ? 1 : -0.5)));
    const redCards = (i === 2 && baseRedCardProb === 1) ? 1 : 0;

    matches.push({
      id: i + 1,
      isHome: isHome,
      opponent: opponents[i],
      result: goalsFor > goalsAgainst ? 'W' : (goalsFor === goalsAgainst ? 'D' : 'L'),
      score: `${goalsFor}-${goalsAgainst}`,
      goalsFor: goalsFor,
      goalsAgainst: goalsAgainst,
      shots: shots,
      shotsOnTarget: shotsOnTarget,
      corners: corners,
      yellowCards: yellowCards,
      redCards: redCards,
      htGoals: Math.floor(goalsFor / 2) + Math.floor(goalsAgainst / 2)
    });
  }

  // Calculate overall averages & metrics
  const totalGoalsScored = matches.reduce((sum, m) => sum + m.goalsFor, 0);
  const totalGoalsConceded = matches.reduce((sum, m) => sum + m.goalsAgainst, 0);
  const totalShots = matches.reduce((sum, m) => sum + m.shots, 0);
  const totalShotsOnTarget = matches.reduce((sum, m) => sum + m.shotsOnTarget, 0);
  const totalCorners = matches.reduce((sum, m) => sum + m.corners, 0);
  const totalYellows = matches.reduce((sum, m) => sum + m.yellowCards, 0);
  const totalReds = matches.reduce((sum, m) => sum + m.redCards, 0);
  const bttsCount = matches.filter(m => m.goalsFor > 0 && m.goalsAgainst > 0).length;
  const over25Count = matches.filter(m => (m.goalsFor + m.goalsAgainst) > 2.5).length;
  const winsCount = matches.filter(m => m.result === 'W').length;

  // --- Ev / Deplasman Ayrıştırılmış İstatistikler ---
  const homeMatches = matches.filter(m => m.isHome);
  const awayMatches = matches.filter(m => !m.isHome);

  function calcSplitStats(mList) {
    if (!mList.length) return null;
    const n = mList.length;
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
    return {
      played: n,
      wins: w, draws: d, losses: l,
      avgGoalsScored: (gs / n).toFixed(1),
      avgGoalsConceded: (gc / n).toFixed(1),
      avgShots: (sh / n).toFixed(1),
      avgShotsOnTarget: (sot / n).toFixed(1),
      avgCorners: (co / n).toFixed(1),
      avgYellowCards: (yw / n).toFixed(1),
      totalReds: rd,
      bttsPct: Math.round((btts / n) * 100),
      over25Pct: Math.round((o25 / n) * 100),
      winPct: Math.round((w / n) * 100),
      formPoints: mList.reduce((acc, m) => acc + (m.result === 'W' ? 3 : (m.result === 'D' ? 1 : 0)), 0)
    };
  }

  return {
    teamName: teamName,
    countryCode: countryCode,
    matches: matches,
    homeStats: calcSplitStats(homeMatches),
    awayStats: calcSplitStats(awayMatches),
    stats: {
      avgGoalsScored: (totalGoalsScored / 5).toFixed(1),
      avgGoalsConceded: (totalGoalsConceded / 5).toFixed(1),
      avgTotalGoalsPerMatch: ((totalGoalsScored + totalGoalsConceded) / 5).toFixed(1),
      avgShots: (totalShots / 5).toFixed(1),
      avgShotsOnTarget: (totalShotsOnTarget / 5).toFixed(1),
      shotAccuracyPct: Math.round((totalShotsOnTarget / Math.max(1, totalShots)) * 100),
      avgCorners: (totalCorners / 5).toFixed(1),
      avgYellowCards: (totalYellows / 5).toFixed(1),
      totalRedCardsIn5: totalReds,
      bttsPct: Math.round((bttsCount / 5) * 100),
      over25Pct: Math.round((over25Count / 5) * 100),
      winPct: Math.round((winsCount / 5) * 100),
      formPoints: matches.reduce((acc, m) => acc + (m.result === 'W' ? 3 : (m.result === 'D' ? 1 : 0)), 0)
    }
  };
}

// Head-to-Head Profile Generator (simüle edilmiş, seed-tabanlı)
function generateH2HProfile(homeTeamName, awayTeamName) {
  // Deterministic seed from both team names combined
  const combined = homeTeamName + '|' + awayTeamName;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  const normHash = Math.abs(hash);

  // H2H son 5 karşılaşma
  const h2hMatches = [];
  const seasons = ['24/25', '23/24', '23/24', '22/23', '22/23'];

  for (let i = 0; i < 5; i++) {
    const varSeed = (normHash + i * 31) % 100;
    let homeGoals, awayGoals;
    // Weight toward draws & close matches (realistic H2H tendency)
    if (varSeed < 30) { homeGoals = 1; awayGoals = 1; }
    else if (varSeed < 50) { homeGoals = 2; awayGoals = 1; }
    else if (varSeed < 65) { homeGoals = 1; awayGoals = 0; }
    else if (varSeed < 75) { homeGoals = 0; awayGoals = 1; }
    else if (varSeed < 85) { homeGoals = 2; awayGoals = 0; }
    else if (varSeed < 92) { homeGoals = 2; awayGoals = 2; }
    else { homeGoals = 3; awayGoals = 1; }

    const result = homeGoals > awayGoals ? 'H' : (homeGoals === awayGoals ? 'D' : 'A');
    h2hMatches.push({
      season: seasons[i],
      homeGoals,
      awayGoals,
      score: `${homeGoals} - ${awayGoals}`,
      result, // H=home win, D=draw, A=away win
      totalGoals: homeGoals + awayGoals
    });
  }

  const homeWins = h2hMatches.filter(m => m.result === 'H').length;
  const draws = h2hMatches.filter(m => m.result === 'D').length;
  const awayWins = h2hMatches.filter(m => m.result === 'A').length;
  const avgTotalGoals = (h2hMatches.reduce((s, m) => s + m.totalGoals, 0) / 5).toFixed(1);
  const bttsH2H = h2hMatches.filter(m => m.homeGoals > 0 && m.awayGoals > 0).length;
  const over25H2H = h2hMatches.filter(m => m.totalGoals > 2.5).length;

  return {
    matches: h2hMatches,
    homeWins,
    draws,
    awayWins,
    avgTotalGoals,
    bttsPct: Math.round((bttsH2H / 5) * 100),
    over25Pct: Math.round((over25H2H / 5) * 100)
  };
}

// Turkish & International Character Slugifier
function slugifyTeam(name) {
  if (!name) return "";
  const trMap = {
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u',
    'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
    'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i', 'ó': 'o', 'ò': 'o', 'ô': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u', 'ñ': 'n'
  };
  let str = name;
  for (let key in trMap) {
    str = str.replace(new RegExp(key, 'g'), trMap[key]);
  }
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Local Logo Resolver with Turkish & International Character Support
function getTeamLogoUrl(teamName, countryCode) {
  if (!teamName) return '';
  const rawKey = teamName.trim();
  const slug = slugifyTeam(teamName);

  if (typeof LOCAL_LOGO_MAP !== 'undefined') {
    if (LOCAL_LOGO_MAP[rawKey]) return LOCAL_LOGO_MAP[rawKey];
    if (LOCAL_LOGO_MAP[rawKey.toLowerCase()]) return LOCAL_LOGO_MAP[rawKey.toLowerCase()];
    if (LOCAL_LOGO_MAP[slug]) return LOCAL_LOGO_MAP[slug];

    // Fuzzy lookup
    for (const k in LOCAL_LOGO_MAP) {
      if (k === slug || k.includes(slug) || slug.includes(k)) {
        return LOCAL_LOGO_MAP[k];
      }
    }
  }

  return `logos/${slug}.png`;
}
