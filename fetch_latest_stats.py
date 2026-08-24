"""
GOLANALIZ AI - football-data.co.uk Güncel Veri Çekici
======================================================
Bu script football-data.co.uk'dan en güncel maç istatistiklerini çeker ve
analiz sistemine (data.js, matches_2026_2027.json, advanced_team_stats.json) entegre eder.

Çekilen veriler:
  - Maç sonuçları (FTHG, FTAG, FTR)
  - İlk yarı sonuçları (HTHG, HTAG, HTR)
  - Şut ve isabetli şut (HS, AS, HST, AST)
  - Korner (HC, AC)
  - Sarı/Kırmızı kartlar (HY, AY, HR, AR)
  - Faul sayıları (HF, AF)
  - Hakem bilgisi (Referee)
  - Bahis oranları (B365, MaxOdds, AvgOdds)
  - Alt/üst 2.5 oranları (B365>2.5, B365<2.5)

Çalıştırma: python fetch_latest_stats.py
"""

import socket
import ssl
import sys
import json
import csv
import io
import re
import os
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

# ─── Bağlantı Ayarları ───────────────────────────────────────────────────────
IP       = "217.160.0.246"
HOSTNAME = "www.football-data.co.uk"
PORT     = 443

# ─── Lig Konfigürasyonu ──────────────────────────────────────────────────────
MAIN_LEAGUES = [
    ('ENG', 'E0', 'İngiltere Premier League'),
    ('ENG', 'E1', 'İngiltere Championship'),
    ('ENG', 'E2', 'İngiltere League One'),
    ('ENG', 'E3', 'İngiltere League Two'),
    ('ENG', 'EC', 'İngiltere National League'),
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
    ('SCO', 'SC0', 'İskoçya Premiership'),
    ('SCO', 'SC1', 'İskoçya Championship'),
    ('SCO', 'SC2', 'İskoçya League One'),
    ('SCO', 'SC3', 'İskoçya League Two'),
]

EXTRA_LEAGUES = [
    ('ARG', '/new/ARG.csv', 'Arjantin Primera Division'),
    ('BRA', '/new/BRA.csv', 'Brezilya Serie A'),
    ('DNK', '/new/DNK.csv', 'Danimarka Superliga'),
    ('MEX', '/new/MEX.csv', 'Meksika Liga MX'),
    ('NOR', '/new/NOR.csv', 'Norveç Eliteserien'),
    ('POL', '/new/POL.csv', 'Polonya Ekstraklasa'),
    ('ROU', '/new/ROU.csv', 'Romanya Liga 1'),
    ('RUS', '/new/RUS.csv', 'Rusya Premier League'),
    ('SWE', '/new/SWE.csv', 'İsveç Allsvenskan'),
    ('USA', '/new/USA.csv', 'ABD MLS'),
    ('AUT', '/new/AUT.csv', 'Avusturya Bundesliga'),
    ('CHN', '/new/CHN.csv', 'Çin Süper Ligi'),
    ('FIN', '/new/FIN.csv', 'Finlandiya Veikkausliiga'),
    ('IRL', '/new/IRL.csv', 'İrlanda Premier Division'),
    ('JPN', '/new/JPN.csv', 'Japonya J-League'),
    ('SWZ', '/new/SWZ.csv', 'İsviçre Super League'),
]

SEASONS_TO_FETCH = [
    ('2526', '2025/2026'),
    ('2627', '2026/2027'),
]

COUNTRY_NAME_TO_CODE = {
    "argentina": "ARG", "brazil": "BRA", "denmark": "DNK", "mexico": "MEX",
    "norway": "NOR", "poland": "POL", "romania": "ROU", "russia": "RUS",
    "sweden": "SWE", "usa": "USA", "austria": "AUT", "china": "CHN",
    "finland": "FIN", "ireland": "IRL", "japan": "JPN", "switzerland": "SWZ",
    "turkey": "TR", "england": "ENG", "spain": "ESP", "germany": "GER",
    "italy": "ITA", "france": "FRA", "netherlands": "NED", "portugal": "POR",
    "belgium": "BEL", "greece": "GRE", "scotland": "SCO",
}

TEAM_CANONICAL = {
    # Türkiye
    "Besiktas": "Beşiktaş", "Buyuksehyr": "Başakşehir", "Basaksehir": "Başakşehir",
    "Eyupspor": "Eyüpspor", "Fenerbahce": "Fenerbahçe", "Gaziantep": "Gaziantep FK",
    "Goztep": "Göztepe", "Goztepe": "Göztepe", "Kasimpasa": "Kasımpaşa",
    "Genclerbirligi": "Gençlerbirliği", "Karagumruk": "Fatih Karagümrük",
    # İngiltere
    "Man City": "Manchester City", "Man United": "Manchester United",
    "Nott'm Forest": "Nottingham Forest",
    # İspanya
    "Ath Bilbao": "Athletic Bilbao", "Ath Madrid": "Atletico Madrid",
    "Betis": "Real Betis", "Celta": "Celta Vigo", "Espanol": "Espanyol",
    "Sociedad": "Real Sociedad", "Vallecano": "Rayo Vallecano",
    # Almanya
    "Ein Frankfurt": "Eintracht Frankfurt", "Dortmund": "Borussia Dortmund",
    "Leverkusen": "Bayer Leverkusen", "M'gladbach": "Borussia M'gladbach",
    "Bochum": "VfL Bochum", "Hoffenheim": "TSG Hoffenheim",
    "St Pauli": "St. Pauli", "Stuttgart": "VfB Stuttgart",
    # İtalya
    "Milan": "AC Milan", "Roma": "AS Roma",
    # Fransa
    "St Etienne": "Saint-Etienne",
    # Romanya
    "Din. Bucuresti": "Dinamo Bucuresti",
}

COUNTRY_META = {
    "TR":  {"name": "Türkiye",   "code": "T1",   "flag": "https://flagcdn.com/w80/tr.png"},
    "ENG": {"name": "İngiltere", "code": "E0",   "flag": "https://flagcdn.com/w80/gb-eng.png"},
    "ESP": {"name": "İspanya",   "code": "SP1",  "flag": "https://flagcdn.com/w80/es.png"},
    "GER": {"name": "Almanya",   "code": "D1",   "flag": "https://flagcdn.com/w80/de.png"},
    "ITA": {"name": "İtalya",    "code": "I1",   "flag": "https://flagcdn.com/w80/it.png"},
    "FRA": {"name": "Fransa",    "code": "F1",   "flag": "https://flagcdn.com/w80/fr.png"},
    "NED": {"name": "Hollanda",  "code": "N1",   "flag": "https://flagcdn.com/w80/nl.png"},
    "POR": {"name": "Portekiz",  "code": "P1",   "flag": "https://flagcdn.com/w80/pt.png"},
    "BEL": {"name": "Belçika",   "code": "B1",   "flag": "https://flagcdn.com/w80/be.png"},
    "GRE": {"name": "Yunanistan","code": "G1",   "flag": "https://flagcdn.com/w80/gr.png"},
    "SCO": {"name": "İskoçya",   "code": "SC0",  "flag": "https://flagcdn.com/w80/gb-sct.png"},
    "DNK": {"name": "Danimarka", "code": "DNK",  "flag": "https://flagcdn.com/w80/dk.png"},
    "SWE": {"name": "İsveç",     "code": "SWE",  "flag": "https://flagcdn.com/w80/se.png"},
    "NOR": {"name": "Norveç",    "code": "NOR",  "flag": "https://flagcdn.com/w80/no.png"},
    "POL": {"name": "Polonya",   "code": "POL",  "flag": "https://flagcdn.com/w80/pl.png"},
    "BRA": {"name": "Brezilya",  "code": "BRA",  "flag": "https://flagcdn.com/w80/br.png"},
    "ARG": {"name": "Arjantin",  "code": "ARG",  "flag": "https://flagcdn.com/w80/ar.png"},
    "USA": {"name": "ABD",       "code": "USA",  "flag": "https://flagcdn.com/w80/us.png"},
    "MEX": {"name": "Meksika",   "code": "MEX",  "flag": "https://flagcdn.com/w80/mx.png"},
    "ROU": {"name": "Romanya",   "code": "ROU",  "flag": "https://flagcdn.com/w80/ro.png"},
    "RUS": {"name": "Rusya",     "code": "RUS",  "flag": "https://flagcdn.com/w80/ru.png"},
    "AUT": {"name": "Avusturya", "code": "AUT",  "flag": "https://flagcdn.com/w80/at.png"},
    "CHN": {"name": "Çin",       "code": "CHN",  "flag": "https://flagcdn.com/w80/cn.png"},
    "FIN": {"name": "Finlandiya","code": "FIN",  "flag": "https://flagcdn.com/w80/fi.png"},
    "IRL": {"name": "İrlanda",   "code": "IRL",  "flag": "https://flagcdn.com/w80/ie.png"},
    "JPN": {"name": "Japonya",   "code": "JPN",  "flag": "https://flagcdn.com/w80/jp.png"},
    "SWZ": {"name": "İsviçre",   "code": "SWZ",  "flag": "https://flagcdn.com/w80/ch.png"},
}

DEFAULT_TEAMS = {
    "TR": [
        "Galatasaray", "Fenerbahçe", "Beşiktaş", "Trabzonspor", "Başakşehir",
        "Samsunspor", "Eyüpspor", "Kasımpaşa", "Çaykur Rizespor", "Sivasspor",
        "Antalyaspor", "Gaziantep FK", "Konyaspor", "Alanyaspor", "Kayserispor",
        "Bodrum FK", "Göztepe", "Hatayspor", "Adana Demirspor", "MKE Ankaragücü",
        "Fatih Karagümrük",
    ],
    "ENG": [
        "Arsenal", "Manchester City", "Liverpool", "Aston Villa", "Tottenham",
        "Chelsea", "Newcastle", "Manchester United", "West Ham", "Brighton",
        "Wolves", "Fulham", "Bournemouth", "Crystal Palace", "Brentford",
        "Everton", "Nottingham Forest", "Leicester", "Ipswich", "Southampton",
        "Leeds",
    ],
    "ESP": [
        "Real Madrid", "Barcelona", "Atletico Madrid", "Athletic Bilbao",
        "Real Sociedad", "Real Betis", "Villarreal", "Valencia", "Sevilla",
        "Girona", "Osasuna", "Celta Vigo", "Getafe", "Rayo Vallecano",
        "Mallorca", "Espanyol", "Valladolid", "Leganes", "Las Palmas", "Alaves",
    ],
    "GER": [
        "Bayer Leverkusen", "Bayern Munich", "VfB Stuttgart", "RB Leipzig",
        "Borussia Dortmund", "Eintracht Frankfurt", "TSG Hoffenheim",
        "Heidenheim", "Werder Bremen", "Freiburg", "Augsburg", "Wolfsburg",
        "Mainz", "Borussia M'gladbach", "Union Berlin", "St. Pauli",
        "Holstein Kiel", "VfL Bochum",
    ],
    "ITA": [
        "Inter", "AC Milan", "Juventus", "Atalanta", "Bologna", "AS Roma",
        "Lazio", "Fiorentina", "Napoli", "Torino", "Genoa", "Monza",
        "Verona", "Cagliari", "Lecce", "Parma", "Como", "Venezia",
        "Empoli", "Udinese",
    ],
    "FRA": [
        "Paris SG", "Monaco", "Brest", "Lille", "Nice", "Lyon", "Lens",
        "Marseille", "Reims", "Rennes", "Toulouse", "Montpellier",
        "Strasbourg", "Nantes", "Le Havre", "Auxerre", "Angers", "Saint-Etienne",
    ],
}


# ─── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────

def fetch_raw(path: str) -> tuple[str, bytes]:
    """football-data.co.uk'dan ham HTTP isteği yapar."""
    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    s = socket.create_connection((IP, PORT), timeout=20)
    ss = context.wrap_socket(s, server_hostname=HOSTNAME)
    req = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {HOSTNAME}\r\n"
        f"User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n"
        f"Connection: close\r\n\r\n"
    )
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

    # Yönlendirme takibi
    if any(code in header for code in ["301 Moved", "302 Found", "303 See"]):
        loc_match = re.search(r'Location:\s*([^\r\n]+)', header, re.IGNORECASE)
        if loc_match:
            new_url = loc_match.group(1).strip()
            if "football-data.co.uk" in new_url:
                new_path = new_url.split("football-data.co.uk")[1]
                return fetch_raw(new_path)
    return header, body


def safe_int(val, default: int = 0) -> int:
    """Güvenli int dönüşümü."""
    if val is None:
        return default
    s = str(val).strip()
    if not s:
        return default
    try:
        return int(float(s))
    except (ValueError, TypeError):
        return default


def safe_float(val, default=None):
    """Güvenli float dönüşümü."""
    if val is None:
        return default
    s = str(val).strip()
    if not s:
        return default
    try:
        f = float(s)
        return round(f, 2) if f > 0 else default
    except (ValueError, TypeError):
        return default


def get_match_key(m: dict) -> str:
    return f"{m['country']}_{m['homeTeam'].lower()}_{m['awayTeam'].lower()}_{m['date']}"


def slugify(name: str) -> str:
    """Takım adını slug'a çevirir."""
    if not name:
        return ""
    tr_map = {
        'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i',
        'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u',
        'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'é': 'e', 'è': 'e',
        'ë': 'e', 'ê': 'e', 'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
        'ó': 'o', 'ò': 'o', 'ô': 'o', 'ú': 'u', 'ù': 'u', 'û': 'u', 'ñ': 'n',
    }
    s = name.strip()
    for k, v in tr_map.items():
        s = s.replace(k, v)
    return re.sub(r'[^a-z0-9]', '', s.lower())


def parse_main_league_row(row: dict, country_code: str, league_code: str,
                           league_name: str, season_label: str) -> dict | None:
    """Ana lig CSV satırını maç verisine dönüştürür."""
    home = (row.get('HomeTeam') or row.get('Home', '')).strip()
    away = (row.get('AwayTeam') or row.get('Away', '')).strip()
    if not home or not away:
        return None

    fthg_raw = row.get('FTHG') or row.get('HG')
    ftag_raw = row.get('FTAG') or row.get('AG')
    if not fthg_raw or not ftag_raw or str(fthg_raw).strip() == '' or str(ftag_raw).strip() == '':
        return None

    fthg = int(fthg_raw)
    ftag = int(ftag_raw)

    return {
        'country': country_code,
        'league_code': league_code,
        'league_name': league_name,
        'season': season_label,
        'date': row.get('Date', ''),
        'time': row.get('Time', ''),
        'homeTeam': home,
        'awayTeam': away,
        'referee': (row.get('Referee') or '').strip(),
        # Maç sonuçları
        'fthg': fthg,
        'ftag': ftag,
        'ftr': (row.get('FTR') or row.get('Res') or
                ('H' if fthg > ftag else ('A' if fthg < ftag else 'D'))),
        # İlk yarı
        'hthg': safe_int(row.get('HTHG')),
        'htag': safe_int(row.get('HTAG')),
        'htr':  (row.get('HTR') or '').strip(),
        # Şut
        'hs':  safe_int(row.get('HS')),
        'as':  safe_int(row.get('AS')),
        'hst': safe_int(row.get('HST')),
        'ast': safe_int(row.get('AST')),
        # Korner
        'hc': safe_int(row.get('HC')),
        'ac': safe_int(row.get('AC')),
        # Kart
        'hy': safe_int(row.get('HY')),
        'ay': safe_int(row.get('AY')),
        'hr': safe_int(row.get('HR')),
        'ar': safe_int(row.get('AR')),
        # Faul
        'hf': safe_int(row.get('HF')),
        'af': safe_int(row.get('AF')),
        # Bahis oranları (1X2)
        'b365h': safe_float(row.get('B365H')),
        'b365d': safe_float(row.get('B365D')),
        'b365a': safe_float(row.get('B365A')),
        'maxh':  safe_float(row.get('MaxH')),
        'maxd':  safe_float(row.get('MaxD')),
        'maxa':  safe_float(row.get('MaxA')),
        'avgh':  safe_float(row.get('AvgH')),
        'avgd':  safe_float(row.get('AvgD')),
        'avga':  safe_float(row.get('AvgA')),
        # Alt/Üst 2.5 oranları
        'b365_over25':  safe_float(row.get('B365>2.5')),
        'b365_under25': safe_float(row.get('B365<2.5')),
        'max_over25':   safe_float(row.get('Max>2.5')),
        'avg_over25':   safe_float(row.get('Avg>2.5')),
    }


# ─── Takım İstatistik Hesaplayıcı ────────────────────────────────────────────

def compute_team_advanced_stats(all_matches: list) -> dict:
    """
    Tüm maçlardan takım bazlı gelişmiş istatistikler üretir.
    Her takım için son form, ev/deplasman ayrımı, bahis oranı ortalamalarını hesaplar.
    """
    # Takım → Maç listesi haritası
    team_map: dict[str, list] = {}

    for m in all_matches:
        home = TEAM_CANONICAL.get(m['homeTeam'], m['homeTeam'])
        away = TEAM_CANONICAL.get(m['awayTeam'], m['awayTeam'])
        country = m['country']
        league = m['league_name']

        for team, is_home in [(home, True), (away, False)]:
            slug = slugify(team)
            if not slug:
                continue
            if slug not in team_map:
                team_map[slug] = {
                    'name': team,
                    'country': country,
                    'league': league,
                    'matches': [],
                }
            team_map[slug]['matches'].append({
                'season':      m.get('season', ''),
                'date':        m.get('date', ''),
                'isHome':      is_home,
                'opponent':    away if is_home else home,
                'goalsFor':    m['fthg'] if is_home else m['ftag'],
                'goalsAgainst':m['ftag'] if is_home else m['fthg'],
                'htGoalsFor':  m.get('hthg', 0) if is_home else m.get('htag', 0),
                'htGoalsAgainst': m.get('htag', 0) if is_home else m.get('hthg', 0),
                'shots':       m.get('hs', 0) if is_home else m.get('as', 0),
                'shotsOnTarget': m.get('hst', 0) if is_home else m.get('ast', 0),
                'corners':     m.get('hc', 0) if is_home else m.get('ac', 0),
                'yellowCards': m.get('hy', 0) if is_home else m.get('ay', 0),
                'redCards':    m.get('hr', 0) if is_home else m.get('ar', 0),
                'fouls':       m.get('hf', 0) if is_home else m.get('af', 0),
                # Bahis oranları (takımın kazanma oranı)
                'oddsWin':   m.get('b365h' if is_home else 'b365a'),
                'oddsDraw':  m.get('b365d'),
                'oddsLose':  m.get('b365a' if is_home else 'b365h'),
                'maxOddsWin':m.get('maxh' if is_home else 'maxa'),
                'avgOddsWin':m.get('avgh' if is_home else 'avga'),
                'b365_over25': m.get('b365_over25'),
                'b365_under25':m.get('b365_under25'),
            })

    # İstatistik özeti çıkar
    advanced_stats = {}

    for slug, data in team_map.items():
        matches = data['matches']
        n = len(matches)
        if n == 0:
            continue

        # Sadece son 5 maç baz alınır (veya 5'ten azsa oynanan tüm maçlar)
        use = matches[-5:]
        use_label = f"Son {len(use)} Maç"

        # Genel hesaplar
        def calc_stats(mlist):
            if not mlist:
                return None
            n_ = len(mlist)
            gf  = sum(m['goalsFor'] for m in mlist)
            ga  = sum(m['goalsAgainst'] for m in mlist)
            sh  = [m for m in mlist if m['shots'] > 0]
            co  = [m for m in mlist if m['corners'] > 0]
            ca  = [m for m in mlist if m['yellowCards'] > 0 or m['redCards'] > 0]
            fo  = [m for m in mlist if m['fouls'] > 0]
            wins = sum(1 for m in mlist if m['goalsFor'] > m['goalsAgainst'])
            draws = sum(1 for m in mlist if m['goalsFor'] == m['goalsAgainst'])
            losses = sum(1 for m in mlist if m['goalsFor'] < m['goalsAgainst'])
            btts = sum(1 for m in mlist if m['goalsFor'] > 0 and m['goalsAgainst'] > 0)
            over25 = sum(1 for m in mlist if m['goalsFor'] + m['goalsAgainst'] > 2.5)
            ht_over05 = sum(1 for m in mlist if m['htGoalsFor'] + m['htGoalsAgainst'] > 0.5)
            cs = sum(1 for m in mlist if m['goalsAgainst'] == 0)
            form_pts = sum(3 if m['goalsFor'] > m['goalsAgainst']
                           else (1 if m['goalsFor'] == m['goalsAgainst'] else 0)
                           for m in mlist)
            # Son 5 maç formu
            last5 = mlist[-5:]
            last5_form = ''.join(
                'W' if m['goalsFor'] > m['goalsAgainst']
                else ('D' if m['goalsFor'] == m['goalsAgainst'] else 'L')
                for m in last5
            )
            # Bahis ortalamalar
            odds_list = [m['oddsWin'] for m in mlist if m['oddsWin']]
            over25_odds = [m['b365_over25'] for m in mlist if m['b365_over25']]

            return {
                'played': n_,
                'wins': wins, 'draws': draws, 'losses': losses,
                'avgGoalsScored':    round(gf / n_, 2),
                'avgGoalsConceded':  round(ga / n_, 2),
                'avgTotalGoals':     round((gf + ga) / n_, 2),
                'avgShots':          round(sum(m['shots'] for m in sh) / len(sh), 2) if sh else None,
                'avgShotsOnTarget':  round(sum(m['shotsOnTarget'] for m in sh) / len(sh), 2) if sh else None,
                'avgCorners':        round(sum(m['corners'] for m in co) / len(co), 2) if co else None,
                'avgYellowCards':    round(sum(m['yellowCards'] for m in ca) / len(ca), 2) if ca else None,
                'avgRedCards':       round(sum(m['redCards'] for m in mlist) / n_, 2),
                'avgFouls':          round(sum(m['fouls'] for m in fo) / len(fo), 2) if fo else None,
                'bttsPct':           round(btts / n_ * 100),
                'over25Pct':         round(over25 / n_ * 100),
                'htOver05Pct':       round(ht_over05 / n_ * 100),
                'cleanSheetPct':     round(cs / n_ * 100),
                'winPct':            round(wins / n_ * 100),
                'formPoints':        form_pts,
                'last5Form':         last5_form,
                'shotsReliable':     len(sh) >= 3,
                'cornersReliable':   len(co) >= 3,
                'cardsReliable':     len(ca) >= 3,
                # Bahis verileri
                'avgWinOdds':        round(sum(odds_list) / len(odds_list), 2) if odds_list else None,
                'avgOver25Odds':     round(sum(over25_odds) / len(over25_odds), 2) if over25_odds else None,
                'impliedWinProb':    round(100 / (sum(odds_list) / len(odds_list)), 1) if odds_list else None,
            }

        home_matches = [m for m in use if m['isHome']]
        away_matches = [m for m in use if not m['isHome']]

        overall = calc_stats(use)
        home_s = calc_stats(home_matches)
        away_s = calc_stats(away_matches)

        # xG tahmini (şutlara dayalı)
        if overall and overall.get('avgShots') and overall.get('avgShotsOnTarget'):
            avg_sh = overall['avgShots']
            avg_sot = overall['avgShotsOnTarget']
            avg_gf = overall['avgGoalsScored']
            xg_est = round((avg_sot * 0.32) + ((avg_sh - avg_sot) * 0.05) + (avg_gf * 0.40), 2)
            xg_est = max(0.40, xg_est)
        elif overall:
            xg_est = round(overall['avgGoalsScored'] * 0.95 + 0.10, 2)
            xg_est = max(0.40, xg_est)
        else:
            xg_est = 1.35

        if overall:
            xga_est = round(overall['avgGoalsConceded'] * 0.95 + 0.10, 2)
            xga_est = max(0.35, xga_est)
        else:
            xga_est = 1.25

        # Possession tahmini
        if overall and overall.get('avgShots'):
            poss_est = round(min(68.0, max(32.0, 50.0 + (overall['avgShots'] - 11.5) * 1.4)), 1)
        else:
            poss_est = 50.0

        advanced_stats[slug] = {
            'teamName':      data['name'],
            'country':       data['country'],
            'league':        data['league'],
            'dataLabel':     use_label,
            'totalMatches':  n,
            'lastUpdated':   datetime.now().strftime('%Y-%m-%d %H:%M'),
            # xG tahminleri
            'xg_per90':      xg_est,
            'xga_per90':     xga_est,
            'xg_diff':       round(xg_est - xga_est, 2),
            'possession':    poss_est,
            # Genel
            'overall':       overall,
            'homeStats':     home_s,
            'awayStats':     away_s,
            # Uyumluluk (eski sistemle)
            'matchesPlayed': overall['played'] if overall else n,
            'cleanSheetPct': overall['cleanSheetPct'] if overall else 0,
            'bttsPct':       overall['bttsPct'] if overall else 0,
            'over25Pct':     overall['over25Pct'] if overall else 0,
            'last5Form':     overall['last5Form'] if overall else '',
            'source':        'football-data.co.uk Live',
        }

    return advanced_stats


# ─── Ana İşlev ───────────────────────────────────────────────────────────────

def run_sync():
    print("=" * 65, flush=True)
    print("GOLANALIZ AI - football-data.co.uk Güncel Veri Entegrasyonu", flush=True)
    print(f"Tarih: {datetime.now().strftime('%d/%m/%Y %H:%M')}", flush=True)
    print("=" * 65, flush=True)

    all_matches: list = []
    seen_keys: set = set()

    # ── 1. Ana Ligler (2025/2026 ve 2026/2027) ────────────────────────────
    print("\n=== Ana Ligler Çekiliyor ===", flush=True)
    for season_code, season_label in SEASONS_TO_FETCH:
        for country_code, code, name in MAIN_LEAGUES:
            path = f"/mmz4281/{season_code}/{code}.csv"
            try:
                hdr, body = fetch_raw(path)
                content = body.decode('utf-8', errors='ignore').strip()
                if not content or "404 Not Found" in hdr or "300 Multiple" in hdr:
                    # Küçük harfle dene
                    hdr, body = fetch_raw(f"/mmz4281/{season_code}/{code.lower()}.csv")
                    content = body.decode('utf-8', errors='ignore').strip()

                lines = [l for l in content.splitlines() if l.strip()]
                if len(lines) < 2 or "HomeTeam" not in lines[0] and "Date" not in lines[0]:
                    continue

                reader = csv.DictReader(io.StringIO(content))
                count = 0
                for row in reader:
                    match_data = parse_main_league_row(row, country_code, code, name, season_label)
                    if match_data:
                        key = get_match_key(match_data)
                        if key not in seen_keys:
                            seen_keys.add(key)
                            all_matches.append(match_data)
                            count += 1
                if count > 0:
                    print(f"  ✓ [{season_label}] {name} ({code}): {count} maç", flush=True)
            except Exception as e:
                pass  # Henüz yayınlanmamış sezonlar hata verebilir

    # ── 2. Ek Ligler (Brezilya, Arjantin, vb.) ───────────────────────────
    print("\n=== Ek Ligler Çekiliyor ===", flush=True)
    for country_code, path, name in EXTRA_LEAGUES:
        try:
            hdr, body = fetch_raw(path)
            content = body.decode('utf-8-sig', errors='ignore').strip()
            lines = [l for l in content.splitlines() if l.strip()]
            if len(lines) < 2:
                continue

            reader = csv.DictReader(io.StringIO(content))
            count = 0
            for row in reader:
                season_val = str(row.get('Season', '')).strip()
                if season_val not in ['2025', '2025/2026', '25/26', '2025/26',
                                      '2026', '2026/2027', '26/27', '2026/27']:
                    continue
                home = (row.get('Home') or row.get('HomeTeam', '')).strip()
                away = (row.get('Away') or row.get('AwayTeam', '')).strip()
                if not home or not away:
                    continue
                hg = row.get('HG') or row.get('FTHG')
                ag = row.get('AG') or row.get('FTAG')
                if not hg or not ag or str(hg).strip() == '' or str(ag).strip() == '':
                    continue

                sl = '2026/2027' if ('2026' in season_val or '26' in season_val) else '2025/2026'
                fthg_v, ftag_v = int(hg), int(ag)
                res_v = row.get('Res') or row.get('FTR') or \
                        ('H' if fthg_v > ftag_v else ('A' if fthg_v < ftag_v else 'D'))

                match_data = {
                    'country': country_code, 'league_code': country_code,
                    'league_name': name, 'season': sl,
                    'date': row.get('Date', ''), 'time': row.get('Time', ''),
                    'homeTeam': home, 'awayTeam': away,
                    'referee': '',
                    'fthg': fthg_v, 'ftag': ftag_v, 'ftr': res_v,
                    'hthg': 0, 'htag': 0, 'htr': '',
                    'hs': 0, 'as': 0, 'hst': 0, 'ast': 0,
                    'hc': 0, 'ac': 0,
                    'hy': 0, 'ay': 0, 'hr': 0, 'ar': 0,
                    'hf': 0, 'af': 0,
                    'b365h': safe_float(row.get('B365H') or row.get('PSCH')),
                    'b365d': safe_float(row.get('B365D') or row.get('PSCD')),
                    'b365a': safe_float(row.get('B365A') or row.get('PSCA')),
                    'maxh': safe_float(row.get('MaxH') or row.get('MaxCH')),
                    'maxd': safe_float(row.get('MaxD') or row.get('MaxCD')),
                    'maxa': safe_float(row.get('MaxA') or row.get('MaxCA')),
                    'avgh': safe_float(row.get('AvgH') or row.get('AvgCH')),
                    'avgd': safe_float(row.get('AvgD') or row.get('AvgCD')),
                    'avga': safe_float(row.get('AvgA') or row.get('AvgCA')),
                    'b365_over25': None, 'b365_under25': None,
                    'max_over25': None, 'avg_over25': None,
                }
                key = get_match_key(match_data)
                if key not in seen_keys:
                    seen_keys.add(key)
                    all_matches.append(match_data)
                    count += 1
            if count > 0:
                print(f"  ✓ {name}: {count} maç", flush=True)
        except Exception as e:
            pass

    # ── 3. Latest_Results.csv (Gerçek Zamanlı) ────────────────────────────
    print("\n=== Gerçek Zamanlı Sonuçlar (Latest_Results.csv) ===", flush=True)
    try:
        hdr, body = fetch_raw('/new/Latest_Results.csv')
        content = body.decode('utf-8-sig', errors='ignore').strip()
        lines = [l for l in content.splitlines() if l.strip()]
        if len(lines) > 1:
            reader = csv.DictReader(io.StringIO(content))
            latest_count = 0
            for row in reader:
                home = (row.get('Home') or row.get('HomeTeam', '')).strip()
                away = (row.get('Away') or row.get('AwayTeam', '')).strip()
                hg   = row.get('HG') or row.get('FTHG')
                ag   = row.get('AG') or row.get('FTAG')
                if not home or not away or not hg or not ag:
                    continue
                if str(hg).strip() == '' or str(ag).strip() == '':
                    continue

                c_name = str(row.get('Country', '')).strip().lower()
                c_code = COUNTRY_NAME_TO_CODE.get(c_name, 'ARG')
                fthg_v, ftag_v = int(hg), int(ag)
                res_v = row.get('Res') or row.get('FTR') or \
                        ('H' if fthg_v > ftag_v else ('A' if fthg_v < ftag_v else 'D'))

                match_data = {
                    'country': c_code, 'league_code': c_code,
                    'league_name': str(row.get('League', f'{c_code} League')).strip(),
                    'season': '2026/2027',
                    'date': row.get('Date', ''), 'time': row.get('Time', ''),
                    'homeTeam': home, 'awayTeam': away,
                    'referee': '',
                    'fthg': fthg_v, 'ftag': ftag_v, 'ftr': res_v,
                    'hthg': 0, 'htag': 0, 'htr': '',
                    'hs': 0, 'as': 0, 'hst': 0, 'ast': 0,
                    'hc': 0, 'ac': 0,
                    'hy': 0, 'ay': 0, 'hr': 0, 'ar': 0,
                    'hf': 0, 'af': 0,
                    'b365h': safe_float(row.get('B365CH') or row.get('B365H')),
                    'b365d': safe_float(row.get('B365CD') or row.get('B365D')),
                    'b365a': safe_float(row.get('B365CA') or row.get('B365A')),
                    'maxh': safe_float(row.get('MaxCH') or row.get('MaxH')),
                    'maxd': safe_float(row.get('MaxCD') or row.get('MaxD')),
                    'maxa': safe_float(row.get('MaxCA') or row.get('MaxA')),
                    'avgh': safe_float(row.get('AvgCH') or row.get('AvgH')),
                    'avgd': safe_float(row.get('AvgCD') or row.get('AvgD')),
                    'avga': safe_float(row.get('AvgCA') or row.get('AvgA')),
                    'b365_over25': None, 'b365_under25': None,
                    'max_over25': None, 'avg_over25': None,
                }
                key = get_match_key(match_data)
                if key not in seen_keys:
                    seen_keys.add(key)
                    all_matches.append(match_data)
                    latest_count += 1
            print(f"  ✓ Latest_Results: {latest_count} ek maç eklendi", flush=True)
    except Exception as e:
        print(f"  ✗ Latest_Results hatası: {e}", flush=True)

    # ── 4. Takım Adı Normalizasyonu ────────────────────────────────────────
    cleaned = []
    seen_keys2: set = set()
    for m in all_matches:
        m['homeTeam'] = TEAM_CANONICAL.get(m['homeTeam'], m['homeTeam'])
        m['awayTeam'] = TEAM_CANONICAL.get(m['awayTeam'], m['awayTeam'])
        key = get_match_key(m)
        if key not in seen_keys2:
            seen_keys2.add(key)
            cleaned.append(m)
    all_matches = cleaned

    print(f"\nToplam benzersiz maç: {len(all_matches)}", flush=True)

    # ── 5. Ülke-Takım Listesi ─────────────────────────────────────────────
    country_teams: dict[str, set] = {}
    for m in all_matches:
        c = m['country']
        if c not in country_teams:
            country_teams[c] = set()
        country_teams[c].add(m['homeTeam'])
        country_teams[c].add(m['awayTeam'])

    countries_list = []
    for c, meta in COUNTRY_META.items():
        teams_set = set(country_teams.get(c, []))
        final_teams = {TEAM_CANONICAL.get(t, t) for t in teams_set}
        sorted_teams = sorted(list(final_teams))
        if sorted_teams:
            countries_list.append({
                "id": c, "name": meta["name"], "code": meta["code"],
                "flag": meta["flag"], "teams": sorted_teams,
            })

    # ── 6. Gelişmiş Takım İstatistikleri ──────────────────────────────────
    print("\n=== Takım İstatistikleri Hesaplanıyor ===", flush=True)
    advanced_stats = compute_team_advanced_stats(all_matches)
    print(f"  ✓ {len(advanced_stats)} takım için istatistikler hazır", flush=True)

    # ── 7. Dosyaları Kaydet ────────────────────────────────────────────────
    base_dir = os.path.dirname(os.path.abspath(__file__))
    last_date = all_matches[0]['date'] if all_matches else 'Ağustos 2026'

    # data.js
    js_content = f"""// GOLANALIZ AI - 2025-2026 ve 2026-2027 Sezonları Güncel Veri Bankası
// Kaynak: football-data.co.uk | Güncelleme: {datetime.now().strftime('%d/%m/%Y %H:%M')}

const ALL_MATCHES = {json.dumps(all_matches, ensure_ascii=False, indent=2)};
const SEASON_2026_2027_MATCHES = ALL_MATCHES;

const FOOTBALL_DATA = {{
  season: "2025-2027",
  lastUpdated: "{last_date} (2025/26 & 2026/27 Sezonları)",
  countries: {json.dumps(countries_list, ensure_ascii=False, indent=2)}
}};

function matchTeamNames(name1, name2) {{
  if (!name1 || !name2) return false;
  const s1 = slugifyTeam(name1);
  const s2 = slugifyTeam(name2);
  if (s1 === s2) return true;
  if (s1.length >= 4 && s2.length >= 4 && (s1.includes(s2) || s2.includes(s1))) return true;
  return false;
}}

// Takım Profili Hesaplayıcı (Son 5 Maç)
function generateTeamProfile(teamName, countryCode) {{
  const allRaw = ALL_MATCHES.filter(m =>
    matchTeamNames(m.homeTeam, teamName) ||
    matchTeamNames(m.awayTeam, teamName)
  );

  const rawMatches = allRaw.slice(-5);
  const dataSeasonLabel = `Son ${{rawMatches.length}} Maç`;

  function formatMatch(m, idx) {{
    const isHome = matchTeamNames(m.homeTeam, teamName);
    const opponent = isHome ? m.awayTeam : m.homeTeam;
    const teamGoals = isHome ? m.fthg : m.ftag;
    const oppGoals  = isHome ? m.ftag  : m.fthg;
    const result = teamGoals > oppGoals ? 'W' : (teamGoals === oppGoals ? 'D' : 'L');
    const hasStatsData   = (m.hs > 0 || m.as > 0 || m.hst > 0 || m.ast > 0);
    const hasCornersData = (m.hc > 0 || m.ac > 0);
    const hasCardsData   = (m.hy > 0 || m.ay > 0 || m.hr > 0 || m.ar > 0);
    const hasFoulData    = (m.hf > 0 || m.af > 0);
    const hasOddsData    = !!(m.b365h || m.b365a);
    const winOdds  = isHome ? m.b365h : m.b365a;
    const drawOdds = m.b365d;
    const loseOdds = isHome ? m.b365a : m.b365h;
    return {{
      id: idx + 1,
      season: m.season || '2025/2026',
      isHome,
      opponent,
      date: m.date || '',
      referee: m.referee || '',
      result,
      score: `${{teamGoals}}-${{oppGoals}}`,
      goalsFor: teamGoals,
      goalsAgainst: oppGoals,
      htGoalsFor:     isHome ? (m.hthg || 0) : (m.htag || 0),
      htGoalsAgainst: isHome ? (m.htag || 0) : (m.hthg || 0),
      shots:        hasStatsData   ? (isHome ? m.hs  : m.as)  : null,
      shotsOnTarget:hasStatsData   ? (isHome ? m.hst : m.ast) : null,
      corners:      hasCornersData ? (isHome ? m.hc  : m.ac)  : null,
      yellowCards:  hasCardsData   ? (isHome ? m.hy  : m.ay)  : null,
      redCards:     isHome ? (m.hr || 0) : (m.ar || 0),
      fouls:        hasFoulData    ? (isHome ? m.hf  : m.af)  : null,
      htGoals: (m.hthg || 0) + (m.htag || 0),
      hasStatsData, hasCornersData, hasCardsData, hasFoulData, hasOddsData,
      // Bahis oranları
      winOdds:  hasOddsData ? winOdds  : null,
      drawOdds: hasOddsData ? drawOdds : null,
      loseOdds: hasOddsData ? loseOdds : null,
      over25Odds:  m.b365_over25  || null,
      under25Odds: m.b365_under25 || null,
      impliedWinProb: (hasOddsData && winOdds > 0) ? Math.round(100 / winOdds) : null,
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
        avgFouls: null,
        bttsPct: null, over25Pct: null, winPct: null, formPoints: 0, last5Form: '',
        cornersReliable: false, cardsReliable: false, shotsReliable: false,
        hasEnoughData: false
      }}
    }};
  }}

  const shotsMatches  = formattedMatches.filter(m => m.hasStatsData   && m.shots       !== null);
  const cornerMatches = formattedMatches.filter(m => m.hasCornersData && m.corners     !== null);
  const cardMatches   = formattedMatches.filter(m => m.hasCardsData   && m.yellowCards !== null);
  const foulMatches   = formattedMatches.filter(m => m.hasFoulData    && m.fouls       !== null);
  const oddsMatches   = formattedMatches.filter(m => m.hasOddsData    && m.winOdds     !== null);

  const totalGoalsScored   = formattedMatches.reduce((s,m) => s + m.goalsFor,    0);
  const totalGoalsConceded = formattedMatches.reduce((s,m) => s + m.goalsAgainst,0);
  const totalShots         = shotsMatches.reduce ((s,m) => s + m.shots,       0);
  const totalSoT           = shotsMatches.reduce ((s,m) => s + m.shotsOnTarget,0);
  const totalCorners       = cornerMatches.reduce((s,m) => s + m.corners,     0);
  const totalYellows       = cardMatches.reduce  ((s,m) => s + m.yellowCards,  0);
  const totalReds          = formattedMatches.reduce((s,m) => s + m.redCards,  0);
  const totalFouls         = foulMatches.reduce  ((s,m) => s + m.fouls,        0);
  const totalWinOdds       = oddsMatches.reduce  ((s,m) => s + m.winOdds,      0);

  const bttsCount  = formattedMatches.filter(m => m.goalsFor > 0 && m.goalsAgainst > 0).length;
  const over25Count= formattedMatches.filter(m => (m.goalsFor + m.goalsAgainst) > 2.5).length;
  const winsCount  = formattedMatches.filter(m => m.result === 'W').length;
  const drawCount  = formattedMatches.filter(m => m.result === 'D').length;
  const htOver05   = formattedMatches.filter(m => m.htGoalsFor + m.htGoalsAgainst > 0.5).length;
  const csCount    = formattedMatches.filter(m => m.goalsAgainst === 0).length;

  const shotsReliable   = shotsMatches.length  >= 3;
  const cornersReliable = cornerMatches.length >= 3;
  const cardsReliable   = cardMatches.length   >= 3;
  const hasEnoughData   = n >= 3;

  const avgShotsVal    = shotsReliable   ? (totalShots / shotsMatches.length)    : null;
  const avgSoTVal      = shotsReliable   ? (totalSoT   / shotsMatches.length)    : null;
  const avgCornersVal  = cornersReliable ? (totalCorners / cornerMatches.length) : null;
  const avgYellowsVal  = cardsReliable   ? (totalYellows / cardMatches.length)   : null;
  const avgFoulsVal    = foulMatches.length >= 3 ? (totalFouls / foulMatches.length) : null;
  const avgWinOddsVal  = oddsMatches.length >= 3 ? (totalWinOdds / oddsMatches.length) : null;

  // Son 5 maç formu
  const last5 = formattedMatches.slice(-5);
  const last5Form = last5.map(m => m.result).join('');

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
    const foL= mList.filter(m => m.hasFoulData    && m.fouls       !== null);
    const sh = shL.reduce((s,m) => s + m.shots,       0);
    const sot= shL.reduce((s,m) => s + m.shotsOnTarget,0);
    const co = coL.reduce((s,m) => s + m.corners,     0);
    const yw = ywL.reduce((s,m) => s + m.yellowCards,  0);
    const rd = mList.reduce((s,m) => s + m.redCards,  0);
    const fo = foL.reduce((s,m) => s + m.fouls,        0);
    const w  = mList.filter(m => m.result==='W').length;
    const d  = mList.filter(m => m.result==='D').length;
    const l  = mList.filter(m => m.result==='L').length;
    const btts = mList.filter(m => m.goalsFor>0 && m.goalsAgainst>0).length;
    const o25  = mList.filter(m => (m.goalsFor+m.goalsAgainst)>2.5).length;
    const ht05 = mList.filter(m => m.htGoalsFor+m.htGoalsAgainst>0.5).length;
    const cs   = mList.filter(m => m.goalsAgainst===0).length;
    return {{
      played:len, wins:w, draws:d, losses:l,
      avgGoalsScored: (gs/len).toFixed(1),
      avgGoalsConceded:(gc/len).toFixed(1),
      avgShots:         shL.length>=2 ? (sh/shL.length).toFixed(1) : null,
      avgShotsOnTarget: shL.length>=2 ? (sot/shL.length).toFixed(1): null,
      avgCorners:       coL.length>=2 ? (co/coL.length).toFixed(1) : null,
      avgYellowCards:   ywL.length>=2 ? (yw/ywL.length).toFixed(1) : null,
      avgFouls:         foL.length>=2 ? (fo/foL.length).toFixed(1) : null,
      totalReds:rd,
      bttsPct:    Math.round((btts/len)*100),
      over25Pct:  Math.round((o25 /len)*100),
      htOver05Pct:Math.round((ht05/len)*100),
      csPercent:  Math.round((cs  /len)*100),
      winPct:     Math.round((w   /len)*100),
      formPoints: mList.reduce((acc,m) => acc+(m.result==='W'?3:(m.result==='D'?1:0)),0)
    }};
  }}

  return {{
    teamName, countryCode,
    matches: formattedMatches,
    played2627Count: raw2627.length,
    playedCount: n,
    dataSeasonLabel,
    hasEnoughData,
    cornersReliable,
    cardsReliable,
    shotsReliable,
    homeStats: calcSplitStats(homeMatches),
    awayStats: calcSplitStats(awayMatches),
    stats: {{
      avgGoalsScored:       (totalGoalsScored   / n).toFixed(1),
      avgGoalsConceded:     (totalGoalsConceded / n).toFixed(1),
      avgTotalGoalsPerMatch:((totalGoalsScored + totalGoalsConceded) / n).toFixed(1),
      avgShots:          avgShotsVal !== null ? avgShotsVal.toFixed(1) : null,
      avgShotsOnTarget:  avgSoTVal   !== null ? avgSoTVal.toFixed(1)   : null,
      shotAccuracyPct:   (avgShotsVal && avgShotsVal > 0 && avgSoTVal !== null) ? Math.round((avgSoTVal / avgShotsVal)*100) : null,
      avgCorners:        avgCornersVal !== null ? avgCornersVal.toFixed(1) : null,
      avgYellowCards:    avgYellowsVal !== null ? avgYellowsVal.toFixed(1) : null,
      avgFouls:          avgFoulsVal   !== null ? avgFoulsVal.toFixed(1)   : null,
      totalRedCardsIn5:  totalReds,
      bttsPct:      Math.round((bttsCount  / n)*100),
      over25Pct:    Math.round((over25Count/ n)*100),
      htOver05Pct:  Math.round((htOver05   / n)*100),
      csPercent:    Math.round((csCount    / n)*100),
      winPct:       Math.round((winsCount  / n)*100),
      drawPct:      Math.round((drawCount  / n)*100),
      formPoints:   formattedMatches.reduce((acc,m)=>acc+(m.result==='W'?3:(m.result==='D'?1:0)),0),
      last5Form:    last5Form,
      // Bahis verileri
      avgWinOdds:     avgWinOddsVal !== null ? avgWinOddsVal.toFixed(2) : null,
      impliedWinProb: (avgWinOddsVal && avgWinOddsVal > 0) ? Math.round(100 / avgWinOddsVal) : null,
      cornersReliable,
      cardsReliable,
      shotsReliable,
      hasEnoughData
    }}
  }};
}}


function generateH2HProfile(homeTeamName, awayTeamName) {{
  const h2hRawMatches = ALL_MATCHES.filter(m =>
    (matchTeamNames(m.homeTeam, homeTeamName) && matchTeamNames(m.awayTeam, awayTeamName)) ||
    (matchTeamNames(m.homeTeam, awayTeamName) && matchTeamNames(m.awayTeam, homeTeamName))
  );

  const h2hMatches = h2hRawMatches.map(m => {{
    const isEvSahibiHome = matchTeamNames(m.homeTeam, homeTeamName);
    const hGoals = isEvSahibiHome ? m.fthg : m.ftag;
    const aGoals = isEvSahibiHome ? m.ftag : m.fthg;
    const result = hGoals > aGoals ? 'H' : (hGoals === aGoals ? 'D' : 'A');
    return {{
      season: m.season || '2025/2026',
      date: m.date || '2025-2027',
      referee: m.referee || '',
      homeGoals: hGoals,
      awayGoals: aGoals,
      score: `${{hGoals}} - ${{aGoals}}`,
      result: result,
      totalGoals: hGoals + aGoals,
      htHomeGoals: isEvSahibiHome ? (m.hthg||0) : (m.htag||0),
      htAwayGoals: isEvSahibiHome ? (m.htag||0) : (m.hthg||0),
    }};
  }});

  if (h2hMatches.length === 0) {{
    return {{
      matches: [], hasH2HIn2627: false, hasH2H: false,
      note: "2025-2027 sezonlarında bu iki takım henüz karşılaşmadı.",
      homeWins: 0, draws: 0, awayWins: 0,
      avgTotalGoals: "0.0", bttsPct: 0, over25Pct: 0
    }};
  }}

  const len = h2hMatches.length;
  const homeWins = h2hMatches.filter(m => m.result === 'H').length;
  const draws    = h2hMatches.filter(m => m.result === 'D').length;
  const awayWins = h2hMatches.filter(m => m.result === 'A').length;
  const avgTotalGoals = (h2hMatches.reduce((s, m) => s + m.totalGoals, 0) / len).toFixed(1);
  const bttsH2H  = h2hMatches.filter(m => m.homeGoals > 0 && m.awayGoals > 0).length;
  const over25H2H= h2hMatches.filter(m => m.totalGoals > 2.5).length;

  return {{
    matches: h2hMatches, hasH2HIn2627: true, hasH2H: true,
    homeWins, draws, awayWins, avgTotalGoals,
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

    data_js_path = os.path.join(base_dir, 'data.js')
    with open(data_js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print(f"\n  ✓ data.js yazıldı ({os.path.getsize(data_js_path) // 1024} KB)", flush=True)

    # matches_2026_2027.json
    matches_json_path = os.path.join(base_dir, 'matches_2026_2027.json')
    with open(matches_json_path, 'w', encoding='utf-8') as f:
        json.dump(all_matches, f, ensure_ascii=False, indent=2)
    print(f"  ✓ matches_2026_2027.json yazıldı ({os.path.getsize(matches_json_path) // 1024} KB)", flush=True)

    # advanced_team_stats.json
    stats_json_path = os.path.join(base_dir, 'advanced_team_stats.json')
    with open(stats_json_path, 'w', encoding='utf-8') as f:
        json.dump(advanced_stats, f, ensure_ascii=False, indent=2)
    print(f"  ✓ advanced_team_stats.json yazıldı ({os.path.getsize(stats_json_path) // 1024} KB)", flush=True)

    # advanced_stats.js
    stats_js_path = os.path.join(base_dir, 'advanced_stats.js')
    with open(stats_js_path, 'w', encoding='utf-8') as f:
        f.write("// GOLANALIZ AI - Gelişmiş Takım İstatistikleri | Kaynak: football-data.co.uk\n")
        f.write(f"// Güncelleme: {datetime.now().strftime('%d/%m/%Y %H:%M')}\n")
        f.write("var ADVANCED_TEAM_STATS = " + json.dumps(advanced_stats, ensure_ascii=False, indent=2) + ";\n")
        f.write("if (typeof window !== 'undefined') { window.ADVANCED_TEAM_STATS = ADVANCED_TEAM_STATS; }\n")
        f.write("if (typeof module !== 'undefined' && module.exports) { module.exports = ADVANCED_TEAM_STATS; }\n")
    print(f"  ✓ advanced_stats.js yazıldı ({os.path.getsize(stats_js_path) // 1024} KB)", flush=True)

    print("\n" + "=" * 65, flush=True)
    print(f"[TAMAMLANDI] {len(all_matches)} maç | {len(advanced_stats)} takım", flush=True)
    print(f"Yeni veri: Hakem, Faul, Bahis oranları, İlk yarı, Son form", flush=True)
    print("=" * 65, flush=True)


if __name__ == '__main__':
    run_sync()
