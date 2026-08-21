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
    
    s = socket.create_connection((ip, port), timeout=15)
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
        ('SCO', 'SC3', 'İskoçya League Two')
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
        ('USA', '/new/USA.csv', 'ABD MLS'),
        ('AUT', '/new/AUT.csv', 'Avusturya Bundesliga'),
        ('CHN', '/new/CHN.csv', 'Çin Süper Ligi'),
        ('FIN', '/new/FIN.csv', 'Finlandiya Veikkausliiga'),
        ('IRL', '/new/IRL.csv', 'İrlanda Premier Division'),
        ('JPN', '/new/JPN.csv', 'Japonya J-League'),
        ('SWZ', '/new/SWZ.csv', 'İsviçre Super League')
    ]

    all_matches = []
    seen_match_keys = set()

    def get_match_key(m):
        return f"{m['country']}_{m['homeTeam'].lower()}_{m['awayTeam'].lower()}_{m['date']}"

    seasons_to_fetch = [
        ('2526', '2025/2026'),
        ('2627', '2026/2027')
    ]

    print("=== Fetching Main Leagues for 2025-2026 & 2026-2027 ===")
    for season_code, season_label in seasons_to_fetch:
        for country_code, code, name in main_leagues:
            path = f"/mmz4281/{season_code}/{code}.csv"
            try:
                hdr, body = fetch_raw(path)
                content = body.decode('utf-8', errors='ignore').strip()
                if not content or "404 Not Found" in hdr:
                    hdr, body = fetch_raw(f"/mmz4281/{season_code}/{code.lower()}.csv")
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
                        fthg_raw = row.get('FTHG') if row.get('FTHG') is not None else row.get('HG')
                        ftag_raw = row.get('FTAG') if row.get('FTAG') is not None else row.get('AG')
                        if fthg_raw is None or ftag_raw is None or str(fthg_raw).strip() == '' or str(ftag_raw).strip() == '':
                            continue
                        
                        match_data = {
                            'country': country_code,
                            'league_code': code,
                            'league_name': name,
                            'season': season_label,
                            'date': row.get('Date', ''),
                            'time': row.get('Time', ''),
                            'homeTeam': home.strip(),
                            'awayTeam': away.strip(),
                            'fthg': int(fthg_raw),
                            'ftag': int(ftag_raw),
                            'ftr': row.get('FTR') or row.get('Res') or ('H' if int(fthg_raw) > int(ftag_raw) else ('A' if int(fthg_raw) < int(ftag_raw) else 'D')),
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
                        key = get_match_key(match_data)
                        if key not in seen_match_keys:
                            seen_match_keys.add(key)
                            all_matches.append(match_data)
                            count += 1
                    if count > 0:
                        print(f"Loaded {count} matches for {name} ({code}) [{season_label}]")
            except Exception as e:
                print(f"Error {code} ({season_label}): {e}")

    print("\n=== Fetching Extra Leagues for 2025-2026 & 2026-2027 Seasons ===")
    for country_code, path, name in extra_leagues:
        try:
            hdr, body = fetch_raw(path)
            content = body.decode('utf-8-sig', errors='ignore').strip()
            lines = [l for l in content.splitlines() if l.strip()]
            if len(lines) > 1:
                reader = csv.DictReader(io.StringIO(content))
                count = 0
                for row in reader:
                    season_val = str(row.get('Season', '')).strip()
                    if season_val in ['2025', '2025/2026', '25/26', '2025/26', '2026', '2026/2027', '26/27', '2026/27']:
                        home = row.get('Home') or row.get('HomeTeam')
                        away = row.get('Away') or row.get('AwayTeam')
                        if not home or not away:
                            continue
                        hg = row.get('HG') if row.get('HG') is not None else row.get('FTHG')
                        ag = row.get('AG') if row.get('AG') is not None else row.get('FTAG')
                        if hg is None or ag is None or str(hg).strip() == '' or str(ag).strip() == '':
                            continue
                        
                        season_label = '2025/2026' if ('2025' in season_val or '25' in season_val) else '2026/2027'
                        fthg_val = int(hg)
                        ftag_val = int(ag)
                        res_val = row.get('Res') or row.get('FTR') or ('H' if fthg_val > ftag_val else ('A' if fthg_val < ftag_val else 'D'))
                        
                        match_data = {
                            'country': country_code,
                            'league_code': country_code,
                            'league_name': name,
                            'season': season_label,
                            'date': row.get('Date', ''),
                            'time': row.get('Time', ''),
                            'homeTeam': home.strip(),
                            'awayTeam': away.strip(),
                            'fthg': fthg_val,
                            'ftag': ftag_val,
                            'ftr': res_val,
                            'hthg': 0, 'htag': 0,
                            'hs': 0, 'as': 0, 'hst': 0, 'ast': 0, 'hc': 0, 'ac': 0, 'hy': 0, 'ay': 0, 'hr': 0, 'ar': 0
                        }
                        key = get_match_key(match_data)
                        if key not in seen_match_keys:
                            seen_match_keys.add(key)
                            all_matches.append(match_data)
                            count += 1
                if count > 0:
                    print(f"Loaded {count} matches for {name} ({country_code})")
        except Exception as e:
            print(f"Error {path}: {e}")

    # Fetch Latest_Results.csv to ensure real-time 2026-2027 live updates are incorporated
    print("\n=== Fetching Latest Real-Time Results (/new/Latest_Results.csv) ===")
    country_name_to_code = {
        "argentina": "ARG", "brazil": "BRA", "denmark": "DNK", "mexico": "MEX",
        "norway": "NOR", "poland": "POL", "romania": "ROU", "russia": "RUS",
        "sweden": "SWE", "usa": "USA", "austria": "AUT", "china": "CHN",
        "finland": "FIN", "ireland": "IRL", "japan": "JPN", "switzerland": "SWZ",
        "turkey": "TR", "england": "ENG", "spain": "ESP", "germany": "GER",
        "italy": "ITA", "france": "FRA", "netherlands": "NED", "portugal": "P1",
        "belgium": "BEL", "greece": "GRE", "scotland": "SCO"
    }
    try:
        hdr, body = fetch_raw('/new/Latest_Results.csv')
        content = body.decode('utf-8-sig', errors='ignore').strip()
        lines = [l for l in content.splitlines() if l.strip()]
        if len(lines) > 1:
            reader = csv.DictReader(io.StringIO(content))
            latest_count = 0
            for row in reader:
                home = row.get('Home') or row.get('HomeTeam')
                away = row.get('Away') or row.get('AwayTeam')
                hg = row.get('HG') if row.get('HG') is not None else row.get('FTHG')
                ag = row.get('AG') if row.get('AG') is not None else row.get('FTAG')
                if not home or not away or hg is None or ag is None or str(hg).strip() == '' or str(ag).strip() == '':
                    continue
                
                c_name = str(row.get('Country', '')).strip().lower()
                c_code = country_name_to_code.get(c_name, "ARG")
                fthg_val = int(hg)
                ftag_val = int(ag)
                res_val = row.get('Res') or row.get('FTR') or ('H' if fthg_val > ftag_val else ('A' if fthg_val < ftag_val else 'D'))
                
                match_data = {
                    'country': c_code,
                    'league_code': c_code,
                    'league_name': str(row.get('League', f"{c_code} League")).strip(),
                    'season': '2026/2027',
                    'date': row.get('Date', ''),
                    'time': row.get('Time', ''),
                    'homeTeam': home.strip(),
                    'awayTeam': away.strip(),
                    'fthg': fthg_val,
                    'ftag': ftag_val,
                    'ftr': res_val,
                    'hthg': 0, 'htag': 0,
                    'hs': 0, 'as': 0, 'hst': 0, 'ast': 0, 'hc': 0, 'ac': 0, 'hy': 0, 'ay': 0, 'hr': 0, 'ar': 0
                }
                key = get_match_key(match_data)
                if key not in seen_match_keys:
                    seen_match_keys.add(key)
                    all_matches.append(match_data)
                    latest_count += 1
            print(f"Incorporated {latest_count} additional latest matches from Latest_Results.csv")
    except Exception as e:
        print(f"Error fetching Latest_Results: {e}")

    TEAM_CANONICAL = {
        # Turkey (TR)
        "Besiktas": "Beşiktaş",
        "Buyuksehyr": "Başakşehir",
        "Basaksehir": "Başakşehir",
        "Eyupspor": "Eyüpspor",
        "Fenerbahce": "Fenerbahçe",
        "Gaziantep": "Gaziantep FK",
        "Goztep": "Göztepe",
        "Goztepe": "Göztepe",
        "Kasimpasa": "Kasımpaşa",
        "Genclerbirligi": "Gençlerbirliği",
        "Karagumruk": "Fatih Karagümrük",
        "Fatih Karagümrük": "Fatih Karagümrük",

        # England (ENG)
        "Man City": "Manchester City",
        "Man United": "Manchester United",
        "Nott'm Forest": "Nottingham Forest",

        # Spain (ESP)
        "Ath Bilbao": "Athletic Bilbao",
        "Ath Madrid": "Atletico Madrid",
        "Betis": "Real Betis",
        "Celta": "Celta Vigo",
        "Espanol": "Espanyol",
        "Sociedad": "Real Sociedad",
        "Sociedad B": "Real Sociedad B",
        "Vallecano": "Rayo Vallecano",

        # Germany (GER)
        "Ein Frankfurt": "Eintracht Frankfurt",
        "Dortmund": "Borussia Dortmund",
        "Leverkusen": "Bayer Leverkusen",
        "M'gladbach": "Borussia M'gladbach",
        "Bochum": "VfL Bochum",
        "Hoffenheim": "TSG Hoffenheim",
        "St Pauli": "St. Pauli",
        "Stuttgart": "VfB Stuttgart",
        "Preußen Münster": "Preußen Münster",

        # Italy (ITA)
        "Milan": "AC Milan",
        "Roma": "AS Roma",

        # France (FRA)
        "St Etienne": "Saint-Etienne",

        # Romania (ROU)
        "Din. Bucuresti": "Dinamo Bucuresti"
    }

    PORTUGUESE_TEAMS = {
        'Academico Viseu', 'Alverca', 'Arouca', 'Benfica', 'Casa Pia', 'Estoril', 
        'Estrela', 'Famalicao', 'Gil Vicente', 'Guimaraes', 'Maritimo', 'Moreirense', 
        'Nacional', 'Porto', 'Rio Ave', 'Santa Clara', 'Sp Braga', 'Sp Lisbon', 'Tondela', 'AVS'
    }

    SCOTTISH_TEAMS = {
        'Aberdeen', 'Airdrie Utd', 'Alloa', 'Annan Athletic', 'Arbroath', 'Ayr', 
        'Celtic', 'Clyde', 'Cove Rangers', 'Dumbarton', 'Dundee', 'Dundee United', 
        'Dunfermline', 'East Fife', 'East Kilbride', 'Edinburgh City', 'Elgin', 
        'Falkirk', 'Forfar', 'Hamilton', 'Hearts', 'Hibernian', 'Inverness C', 
        'Kelty Hearts', 'Kilmarnock', 'Livingston', 'Montrose', 'Morton', 
        'Motherwell', 'Partick', 'Peterhead', 'Queen of Sth', 'Queens Park', 
        'Raith Rvs', 'Rangers', 'Ross County', 'Spartans', 'St Johnstone', 
        'St Mirren', 'Stenhousemuir', 'Stirling', 'Stranraer'
    }

    cleaned_matches = []
    seen_match_keys = set()
    for m in all_matches:
        h = TEAM_CANONICAL.get(m['homeTeam'], m['homeTeam'])
        a = TEAM_CANONICAL.get(m['awayTeam'], m['awayTeam'])
        c = m['country']
        if c == 'ESP':
            if h in PORTUGUESE_TEAMS or a in PORTUGUESE_TEAMS:
                c = 'POR'
                m['league_code'] = 'P1'
                m['league_name'] = 'Portekiz Liga Portugal'
            elif h in SCOTTISH_TEAMS or a in SCOTTISH_TEAMS:
                c = 'SCO'
                m['league_code'] = 'SC0'
                m['league_name'] = 'İskoçya Premiership'
        m['homeTeam'] = h
        m['awayTeam'] = a
        m['country'] = c
        key = get_match_key(m)
        if key not in seen_match_keys:
            seen_match_keys.add(key)
            cleaned_matches.append(m)

    all_matches = cleaned_matches
    print(f"\nTOTAL unique matches loaded for 2025-2026 & 2026-2027: {len(all_matches)}")

    # Update data.js and matches_2026_2027.json
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
        "RUS": {"name": "Rusya", "code": "RUS", "flag": "https://flagcdn.com/w80/ru.png"},
        "AUT": {"name": "Avusturya", "code": "AUT", "flag": "https://flagcdn.com/w80/at.png"},
        "CHN": {"name": "Çin", "code": "CHN", "flag": "https://flagcdn.com/w80/cn.png"},
        "FIN": {"name": "Finlandiya", "code": "FIN", "flag": "https://flagcdn.com/w80/fi.png"},
        "IRL": {"name": "İrlanda", "code": "IRL", "flag": "https://flagcdn.com/w80/ie.png"},
        "JPN": {"name": "Japonya", "code": "JPN", "flag": "https://flagcdn.com/w80/jp.png"},
        "SWZ": {"name": "İsviçre", "code": "SWZ", "flag": "https://flagcdn.com/w80/ch.png"}
    }

    country_teams = {}
    for m in all_matches:
        c = m['country']
        if c not in country_teams:
            country_teams[c] = set()
        country_teams[c].add(m['homeTeam'])
        country_teams[c].add(m['awayTeam'])

    default_teams = {
        "TR": [
            "Galatasaray", "Fenerbahçe", "Beşiktaş", "Trabzonspor", "Başakşehir", "Samsunspor", "Eyüpspor", 
            "Kasımpaşa", "Çaykur Rizespor", "Sivasspor", "Antalyaspor", "Gaziantep FK", "Konyaspor", "Alanyaspor", 
            "Kayserispor", "Bodrum FK", "Göztepe", "Hatayspor", "Adana Demirspor",
            "MKE Ankaragücü", "Fatih Karagümrük", "İstanbulspor", "Pendikspor", "Sakaryaspor", "Kocaelispor", 
            "Çorum FK", "Gençlerbirliği", "Bandırmaspor", "Boluspor", "Ümraniyespor", "Manisa FK", "Erzurumspor FK", 
            "Şanlıurfaspor", "Ankara Keçiörengücü", "Iğdır FK", "Amedspor", "Esenler Erokspor", "Adanaspor", "Yeni Malatyaspor",
            "Bursaspor", "Altay", "Giresunspor", "GMG Kastamonuspor", "Batman Petrolspor", "Sarıyer", "24Erzincanspor", 
            "Altınordu", "Menemen FK", "İskenderunspor", "Fethiyespor", "Bucaspor 1928", "1461 Trabzon", "Karacabey Belediyespor", 
            "Isparta 32 Spor", "Kırklarelispor", "Beyoğlu Yeni Çarşı", "Ankaraspor", "Vanspor FK", "Çimentaş Elazığspor", 
            "Motolux 68 Aksarayspor", "Serik Belediyespor", "Eskişehirspor", "Denizlispor", "Karşıyaka", "Balıkesirspor", 
            "Akhisarspor", "Orduspor", "Zonguldak Kömürspor", "Düzcespor", "Uşakspor", "Mardin 1969 Spor", "Silivrispor", 
            "Bornova 1877", "Erbaaspor", "Arnavutköy Bld.", "Somaspor", "Nazillispor", "Karaman FK", "Diyarbekirspor", 
            "İnegölspor", "Afyonspor", "Adana 01 FK", "Kepezspor"
        ],
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
        
        final_teams = set()
        for t in teams_set:
            final_teams.add(TEAM_CANONICAL.get(t, t))
        
        sorted_teams = sorted(list(final_teams))
        if sorted_teams:
            countries_list.append({
                "id": c,
                "name": meta["name"],
                "code": meta["code"],
                "flag": meta["flag"],
                "teams": sorted_teams
            })

    js_content = f"""// GOLANALIZ AI - 2025-2026 ve 2026-2027 Sezonları Güncel Veri Bankası (football-data.co.uk)
// 2025-2026 VE 2026-2027 SEZONLARINA AİT GERÇEK MAÇ VERİLERİ BİRLİKTE KULLANILIR.

const ALL_MATCHES = {json.dumps(all_matches, ensure_ascii=False, indent=2)};
const SEASON_2026_2027_MATCHES = ALL_MATCHES; // Backwards compatibility alias

const FOOTBALL_DATA = {{
  season: "2025-2027",
  lastUpdated: "{all_matches[0]['date'] if all_matches else 'August 2026'} (2025/26 & 2026/27 Sezonları)",
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

// Takım Profili Hesaplayıcı (2026-2027 öncelikli, yetersiz veri durumunda 2025-2026 fallback)
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

  const shotsReliable   = shotsMatches.length  >= 3;
  const cornersReliable = cornerMatches.length >= 3;
  const cardsReliable   = cardMatches.length   >= 3;
  const hasEnoughData   = n >= 3;

  const avgShotsVal    = shotsReliable   ? (totalShots / shotsMatches.length)    : null;
  const avgSoTVal      = shotsReliable   ? (totalSoT   / shotsMatches.length)    : null;
  const avgCornersVal  = cornersReliable ? (totalCorners / cornerMatches.length) : null;
  const avgYellowsVal  = cardsReliable   ? (totalYellows / cardMatches.length)   : null;

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
      avgShots:         shL.length>=2 ? (sh/shL.length).toFixed(1) : null,
      avgShotsOnTarget: shL.length>=2 ? (sot/shL.length).toFixed(1): null,
      avgCorners:       coL.length>=2 ? (co/coL.length).toFixed(1) : null,
      avgYellowCards:   ywL.length>=2 ? (yw/ywL.length).toFixed(1) : null,
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
      totalRedCardsIn5:  totalReds,
      bttsPct:     Math.round((bttsCount  / n)*100),
      over25Pct:   Math.round((over25Count/ n)*100),
      winPct:      Math.round((winsCount  / n)*100),
      formPoints:  formattedMatches.reduce((acc,m)=>acc+(m.result==='W'?3:(m.result==='D'?1:0)),0),
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
      hasH2H: false,
      note: "2025-2027 sezonlarında bu iki takım henüz karşılaşmadı.",
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
    hasH2H: true,
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
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_js_path = os.path.join(base_dir, 'data.js')
    with open(data_js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    matches_json_path = os.path.join(base_dir, 'matches_2026_2027.json')
    with open(matches_json_path, 'w', encoding='utf-8') as f:
        json.dump(all_matches, f, ensure_ascii=False, indent=2)

    print("SUCCESS: 2025-2026 & 2026-2027 seasons data updated and saved to data.js & matches_2026_2027.json!")

    # FootyStats & FBref Advanced Pipeline Sync
    try:
        from scraper_footystats_fbref import run as run_advanced_stats
        print("\n--- FootyStats & FBref İleri Düzey İstatistikler Güncelleniyor ---")
        run_advanced_stats()
    except Exception as e:
        print(f"FootyStats/FBref sync warning: {e}")

if __name__ == '__main__':
    run_sync()
