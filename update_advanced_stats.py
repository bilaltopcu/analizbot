import os
import json
import re
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

base_dir = r'c:\Users\Zelal Topçu\OneDrive\Masaüstü\analizbot'
matches_path = os.path.join(base_dir, 'matches_2026_2027.json')
adv_path = os.path.join(base_dir, 'advanced_team_stats.json')

with open(matches_path, 'r', encoding='utf-8') as f:
    all_matches = json.load(f)

def slugify(name):
    if not name: return ""
    tr_map = {
        'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i',
        'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u',
        'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'é': 'e', 'è': 'e',
        'ë': 'e', 'ê': 'e', 'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
        'ó': 'o', 'ò': 'o', 'ô': 'o', 'ú': 'u', 'ù': 'u', 'û': 'u', 'ñ': 'n',
    }
    s = name.strip()
    for k, v in tr_map.items(): s = s.replace(k, v)
    return re.sub(r'[^a-z0-9]', '', s.lower())

team_map = {}
for m in all_matches:
    home = m['homeTeam']
    away = m['awayTeam']
    country = m.get('country', '')
    league = m.get('league_name', '')
    for team, is_home in [(home, True), (away, False)]:
        slug = slugify(team)
        if not slug: continue
        if slug not in team_map:
            team_map[slug] = {
                'name': team,
                'country': country,
                'league': league,
                'matches': [],
            }
        team_map[slug]['matches'].append({
            'season': m.get('season', ''),
            'date': m.get('date', ''),
            'isHome': is_home,
            'opponent': away if is_home else home,
            'goalsFor': m['fthg'] if is_home else m['ftag'],
            'goalsAgainst': m['ftag'] if is_home else m['fthg'],
            'htGoalsFor': m.get('hthg', 0) if is_home else m.get('htag', 0),
            'htGoalsAgainst': m.get('htag', 0) if is_home else m.get('hthg', 0),
            'shots': m.get('hs', 0) if is_home else m.get('as', 0),
            'shotsOnTarget': m.get('hst', 0) if is_home else m.get('ast', 0),
            'corners': m.get('hc', 0) if is_home else m.get('ac', 0),
            'yellowCards': m.get('hy', 0) if is_home else m.get('ay', 0),
            'redCards': m.get('hr', 0) if is_home else m.get('ar', 0),
            'fouls': m.get('hf', 0) if is_home else m.get('af', 0),
            'oddsWin': m.get('b365h' if is_home else 'b365a'),
            'oddsDraw': m.get('b365d'),
            'oddsLose': m.get('b365a' if is_home else 'b365h'),
            'b365_over25': m.get('b365_over25'),
        })

advanced_stats = {}
for slug, data in team_map.items():
    matches = data['matches']
    n = len(matches)
    if n == 0: continue
    use = matches[-5:]
    use_label = f"Son {len(use)} Maç"

    def calc_stats(mlist):
        if not mlist: return None
        n_ = len(mlist)
        gf = sum(m['goalsFor'] for m in mlist)
        ga = sum(m['goalsAgainst'] for m in mlist)
        sh = [m for m in mlist if m['shots'] > 0]
        co = [m for m in mlist if m['corners'] > 0]
        ca = [m for m in mlist if m['yellowCards'] > 0 or m['redCards'] > 0]
        fo = [m for m in mlist if m['fouls'] > 0]
        wins = sum(1 for m in mlist if m['goalsFor'] > m['goalsAgainst'])
        draws = sum(1 for m in mlist if m['goalsFor'] == m['goalsAgainst'])
        losses = sum(1 for m in mlist if m['goalsFor'] < m['goalsAgainst'])
        btts = sum(1 for m in mlist if m['goalsFor'] > 0 and m['goalsAgainst'] > 0)
        over25 = sum(1 for m in mlist if m['goalsFor'] + m['goalsAgainst'] > 2.5)
        ht_over05 = sum(1 for m in mlist if (m.get('htGoalsFor', 0) + m.get('htGoalsAgainst', 0)) > 0.5)
        cs = sum(1 for m in mlist if m['goalsAgainst'] == 0)
        form_pts = sum(3 if m['goalsFor'] > m['goalsAgainst'] else (1 if m['goalsFor'] == m['goalsAgainst'] else 0) for m in mlist)
        last5 = mlist[-5:]
        last5_form = ''.join('W' if m['goalsFor'] > m['goalsAgainst'] else ('D' if m['goalsFor'] == m['goalsAgainst'] else 'L') for m in last5)
        odds_list = [m['oddsWin'] for m in mlist if m.get('oddsWin')]
        over25_odds = [m['b365_over25'] for m in mlist if m.get('b365_over25')]

        return {
            'played': n_,
            'wins': wins, 'draws': draws, 'losses': losses,
            'avgGoalsScored': round(gf / n_, 2),
            'avgGoalsConceded': round(ga / n_, 2),
            'avgTotalGoals': round((gf + ga) / n_, 2),
            'avgShots': round(sum(m['shots'] for m in sh) / len(sh), 2) if sh else None,
            'avgShotsOnTarget': round(sum(m['shotsOnTarget'] for m in sh) / len(sh), 2) if sh else None,
            'avgCorners': round(sum(m['corners'] for m in co) / len(co), 2) if co else None,
            'avgYellowCards': round(sum(m['yellowCards'] for m in ca) / len(ca), 2) if ca else None,
            'avgRedCards': round(sum(m['redCards'] for m in mlist) / n_, 2),
            'avgFouls': round(sum(m['fouls'] for m in fo) / len(fo), 2) if fo else None,
            'bttsPct': round(btts / n_ * 100),
            'over25Pct': round(over25 / n_ * 100),
            'htOver05Pct': round(ht_over05 / n_ * 100),
            'cleanSheetPct': round(cs / n_ * 100),
            'winPct': round(wins / n_ * 100),
            'formPoints': form_pts,
            'last5Form': last5_form,
            'shotsReliable': len(sh) >= 3,
            'cornersReliable': len(co) >= 3,
            'cardsReliable': len(ca) >= 3,
            'avgWinOdds': round(sum(odds_list) / len(odds_list), 2) if odds_list else None,
            'avgOver25Odds': round(sum(over25_odds) / len(over25_odds), 2) if over25_odds else None,
            'impliedWinProb': round(100 / (sum(odds_list) / len(odds_list)), 1) if odds_list else None,
        }

    overall = calc_stats(use)
    home_matches = [m for m in use if m['isHome']]
    away_matches = [m for m in use if not m['isHome']]
    home_s = calc_stats(home_matches)
    away_s = calc_stats(away_matches)

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

    xga_est = round(overall['avgGoalsConceded'] * 0.95 + 0.10, 2) if overall else 1.25
    xga_est = max(0.35, xga_est)

    poss_est = round(min(68.0, max(32.0, 50.0 + (overall['avgShots'] - 11.5) * 1.4)), 1) if (overall and overall.get('avgShots')) else 50.0

    advanced_stats[slug] = {
        'teamName': data['name'],
        'country': data['country'],
        'league': data['league'],
        'dataLabel': use_label,
        'totalMatches': n,
        'lastUpdated': datetime.now().strftime('%Y-%m-%d %H:%M'),
        'xg_per90': xg_est,
        'xga_per90': xga_est,
        'xg_diff': round(xg_est - xga_est, 2),
        'possession': poss_est,
        'overall': overall,
        'homeStats': home_s,
        'awayStats': away_s,
        'matchesPlayed': overall['played'] if overall else n,
        'cleanSheetPct': overall['cleanSheetPct'] if overall else 0,
        'bttsPct': overall['bttsPct'] if overall else 0,
        'over25Pct': overall['over25Pct'] if overall else 0,
        'last5Form': overall['last5Form'] if overall else '',
        'source': 'football-data.co.uk 2026/2027 Live',
    }

print(f'{len(advanced_stats)} takım için gelişmiş istatistikler hesaplandı.')
with open(adv_path, 'w', encoding='utf-8') as f:
    json.dump(advanced_stats, f, ensure_ascii=False, indent=2)

js_content = f"// GOLANALIZ AI - Takım Bazlı İstatistikler\nconst ADVANCED_TEAM_STATS = {json.dumps(advanced_stats, ensure_ascii=False)};\nif (typeof window !== 'undefined') window.ADVANCED_TEAM_STATS = ADVANCED_TEAM_STATS;\n"
with open(os.path.join(base_dir, 'advanced_stats.js'), 'w', encoding='utf-8') as f:
    f.write(js_content)

print('advanced_team_stats.json ve advanced_stats.js güncellendi!')
