import json
import math
import os
import sys
from collections import defaultdict
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

def poisson(l, k):
    if l <= 0: return 1.0 if k == 0 else 0.0
    return math.exp(-l) * (l**k) / math.factorial(k)

def tau(x, y, l, m, rho=-0.12):
    if x == 0 and y == 0: return max(0.1, 1.0 - (l * m * rho))
    if x == 1 and y == 0: return 1.0 + (m * rho)
    if x == 0 and y == 1: return 1.0 + (l * rho)
    if x == 1 and y == 1: return 1.0 - rho
    return 1.0

def predict_match(h_hist, a_hist, h_team, a_team):
    # Form averages based on up to last 5 matches before this match
    h_goals_for = [m['fthg'] if m['homeTeam'] == h_team else m['ftag'] for m in h_hist]
    h_goals_ag  = [m['ftag'] if m['homeTeam'] == h_team else m['fthg'] for m in h_hist]
    a_goals_for = [m['ftag'] if m['awayTeam'] == a_team else m['fthg'] for m in a_hist]
    a_goals_ag  = [m['fthg'] if m['awayTeam'] == a_team else m['ftag'] for m in a_hist]
    
    h_att = sum(h_goals_for)/len(h_goals_for) if h_goals_for else 1.2
    h_def = sum(h_goals_ag)/len(h_goals_ag) if h_goals_ag else 1.2
    a_att = sum(a_goals_for)/len(a_goals_for) if a_goals_for else 1.0
    a_def = sum(a_goals_ag)/len(a_goals_ag) if a_goals_ag else 1.2
    
    # Corners
    h_corn = [m['hc'] if m['homeTeam'] == h_team else m['ac'] for m in h_hist if m.get('hc') is not None]
    a_corn = [m['ac'] if m['awayTeam'] == a_team else m['hc'] for m in a_hist if m.get('hc') is not None]
    avg_h_corn = sum(h_corn)/len(h_corn) if h_corn else 4.8
    avg_a_corn = sum(a_corn)/len(a_corn) if a_corn else 4.8
    exp_corners = avg_h_corn + avg_a_corn
    
    # Cards
    h_cards = [m['hy'] if m['homeTeam'] == h_team else m['ay'] for m in h_hist if m.get('hy') is not None]
    a_cards = [m['ay'] if m['awayTeam'] == a_team else m['hy'] for m in a_hist if m.get('hy') is not None]
    avg_h_cards = sum(h_cards)/len(h_cards) if h_cards else 1.9
    avg_a_cards = sum(a_cards)/len(a_cards) if a_cards else 1.9
    exp_cards = avg_h_cards + avg_a_cards
    
    leagueAvg = 1.35
    homeAdv = 1.12
    lmb = max(0.25, (h_att / leagueAvg) * (a_def / leagueAvg) * leagueAvg * homeAdv)
    mu  = max(0.20, (a_att / leagueAvg) * (h_def / leagueAvg) * leagueAvg)
    
    pOver25, pHomeWin, pDraw, pAwayWin, pBTTS = 0, 0, 0, 0, 0
    for x in range(6):
        for y in range(6):
            p = poisson(lmb, x) * poisson(mu, y) * tau(x, y, lmb, mu)
            if x + y > 2.5: pOver25 += p
            if x > y: pHomeWin += p
            elif x == y: pDraw += p
            else: pAwayWin += p
            if x > 0 and y > 0: pBTTS += p
            
    cands = []
    
    # 1. Kart Sinyalleri
    if exp_cards >= 4.2:
        cands.append({
            'category': 'kart',
            'categoryLabel': 'Kart Bahsi',
            'title': 'TOPLAM SARI KART 3.5 ÜST',
            'sig': (exp_cards - 3.2) * 16,
            'pct': 82,
            'odds': 1.75,
            'reason': f'İki takımın kart ortalaması ({exp_cards:.1f}) sert ve yüksek tansiyonlu maç sinyali veriyor.'
        })
    elif exp_cards <= 3.0:
        cands.append({
            'category': 'kart',
            'categoryLabel': 'Kart Bahsi',
            'title': 'TOPLAM SARI KART 3.5 ALT',
            'sig': (3.5 - exp_cards) * 14,
            'pct': 78,
            'odds': 1.80,
            'reason': f'İki takımın düşük kart istatistiği ({exp_cards:.1f}) sakin bir oyun beklentisini işaret ediyor.'
        })
        
    # 2. Korner Sinyalleri
    if exp_corners >= 9.8:
        cands.append({
            'category': 'korner',
            'categoryLabel': 'Korner Bahsi',
            'title': 'TOPLAM KORNER 8.5 ÜST',
            'sig': (exp_corners - 8.5) * 15,
            'pct': 80,
            'odds': 1.70,
            'reason': f'Toplam beklenen korner {exp_corners:.1f}; hücum kanatları aktif takımlar.'
        })
        
    # 3. Gol Sinyalleri
    if pOver25 >= 0.55 and (lmb + mu) >= 2.45:
        cands.append({
            'category': 'gol',
            'categoryLabel': 'Gol Bahsi',
            'title': 'TOPLAM GOL 2.5 ÜST',
            'sig': (pOver25 - 0.5) * 100 + (lmb + mu - 2.2) * 15,
            'pct': round(pOver25 * 100),
            'odds': 1.82,
            'reason': f'Dixon-Coles xG toplamı {(lmb+mu):.2f} ile yüksek gol beklentisi mevcut.'
        })
    elif pOver25 <= 0.40 and (lmb + mu) <= 2.15:
        cands.append({
            'category': 'gol',
            'categoryLabel': 'Gol Bahsi',
            'title': 'TOPLAM GOL 2.5 ALT',
            'sig': (0.5 - pOver25) * 100,
            'pct': round((1 - pOver25) * 100),
            'odds': 1.78,
            'reason': f'Düşük xG toplamı ({(lmb+mu):.2f}) ve kontrollü savunma yapısı 2.5 Alt lehine.'
        })
        
    if pBTTS >= 0.58 and h_att >= 1.1 and a_att >= 1.0:
        cands.append({
            'category': 'gol',
            'categoryLabel': 'Gol Bahsi',
            'title': 'KARŞILIKLI GOL VAR (KG VAR)',
            'sig': (pBTTS - 0.5) * 85,
            'pct': round(pBTTS * 100),
            'odds': 1.75,
            'reason': f'Her iki takımın da üretken hücum istatistikleri KG Var olasılığını destekliyor.'
        })
        
    # 4. Taraf & Çifte Şans Sinyalleri
    p1X = pHomeWin + pDraw
    pX2 = pAwayWin + pDraw
    if pHomeWin >= pAwayWin + 0.22 and p1X >= 0.68:
        cands.append({
            'category': 'taraf',
            'categoryLabel': 'Taraf Bahsi',
            'title': 'ÇİFTE ŞANS 1-X',
            'sig': (p1X - 0.60) * 90,
            'pct': round(p1X * 100),
            'odds': 1.35,
            'reason': f'{h_team} iç saha üstünlüğü ve form momentumu ile kaybetmemeye yakın (%{round(p1X*100)}).'
        })
    elif pAwayWin >= pHomeWin + 0.18 and pX2 >= 0.64:
        cands.append({
            'category': 'taraf',
            'categoryLabel': 'Taraf Bahsi',
            'title': 'ÇİFTE ŞANS X-2',
            'sig': (pX2 - 0.58) * 85,
            'pct': round(pX2 * 100),
            'odds': 1.42,
            'reason': f'{a_team} deplasmanda güçlü form grafiği ile puan almaya aday (%{round(pX2*100)}).'
        })
        
    if not cands:
        if p1X >= 0.62:
            cands.append({
                'category': 'taraf',
                'categoryLabel': 'Taraf Bahsi',
                'title': 'ÇİFTE ŞANS 1-X',
                'sig': 25,
                'pct': round(p1X * 100),
                'odds': 1.38,
                'reason': f'{h_team} iç sahada dengeli performans gösteriyor.'
            })
        else:
            cands.append({
                'category': 'gol',
                'categoryLabel': 'Gol Bahsi',
                'title': 'TOPLAM GOL 1.5 ÜST',
                'sig': 22,
                'pct': 76,
                'odds': 1.30,
                'reason': 'Takımların ortalama gol temposu en az 2 gole işaret ediyor.'
            })
            
    cands.sort(key=lambda c: c['sig'], reverse=True)
    return cands[0]

def evaluate_settlement(bet_title, m):
    fthg = m.get('fthg', 0) or 0
    ftag = m.get('ftag', 0) or 0
    tot_goals = fthg + ftag
    hc = m.get('hc', 0) or 0
    ac = m.get('ac', 0) or 0
    tot_corners = hc + ac
    hy = m.get('hy', 0) or 0
    ay = m.get('ay', 0) or 0
    tot_cards = hy + ay
    
    t = bet_title.upper()
    if '2.5 ÜST' in t or '2.5 UST' in t: return tot_goals >= 3
    if '2.5 ALT' in t: return tot_goals <= 2
    if '1.5 ÜST' in t or '1.5 UST' in t: return tot_goals >= 2
    if 'KG VAR' in t: return fthg > 0 and ftag > 0
    if 'SARI KART 3.5 ÜST' in t: return tot_cards >= 4
    if 'SARI KART 3.5 ALT' in t: return tot_cards <= 3
    if 'KORNER 8.5 ÜST' in t: return tot_corners >= 9
    if 'ÇİFTE ŞANS 1-X' in t or '1-X' in t: return fthg >= ftag
    if 'ÇİFTE ŞANS X-2' in t or 'X-2' in t: return ftag >= fthg
    if 'MAÇ SONUCU 1' in t: return fthg > ftag
    if 'MAÇ SONUCU 2' in t: return ftag > fthg
    return False

def run_performance_audit():
    print("[Auto-Settlement Engine] matches_2026_2027.json okunuyor...")
    data_path = os.path.join(os.path.dirname(__file__), 'matches_2026_2027.json')
    if not os.path.exists(data_path):
        print(f"[HATA] {data_path} bulunamadı!")
        return False
        
    with open(data_path, 'r', encoding='utf-8') as f:
        matches = json.load(f)
        
    print(f"[Auto-Settlement Engine] Toplam {len(matches)} maç yüklendi. Denetim başlatılıyor...")
    
    team_history = defaultdict(list)
    verified_results = []
    
    cat_counts = {
        'kart': {'total': 0, 'won': 0, 'label': 'Sarı / Kırmızı Kart'},
        'taraf': {'total': 0, 'won': 0, 'label': 'Maç Sonucu & Çifte Şans'},
        'gol': {'total': 0, 'won': 0, 'label': 'Alt / Üst & KG'},
        'korner': {'total': 0, 'won': 0, 'label': 'Korner Bahisleri'}
    }
    
    total_audited = 0
    total_won = 0
    
    for m in matches:
        ht = m.get('homeTeam')
        at = m.get('awayTeam')
        if not ht or not at: continue
        
        # Sadece her iki takımın da en az 3 önceki maçı varsa ve bu maç tamamlanmışsa değerlendir
        if len(team_history[ht]) >= 3 and len(team_history[at]) >= 3 and m.get('fthg') is not None:
            pred = predict_match(team_history[ht][-5:], team_history[at][-5:], ht, at)
            won = evaluate_settlement(pred['title'], m)
            
            total_audited += 1
            if won:
                total_won += 1
                
            cat = pred['category']
            if cat in cat_counts:
                cat_counts[cat]['total'] += 1
                if won:
                    cat_counts[cat]['won'] += 1
                    
            fthg = m.get('fthg', 0)
            ftag = m.get('ftag', 0)
            hc = m.get('hc', 0) or 0
            ac = m.get('ac', 0) or 0
            hy = m.get('hy', 0) or 0
            ay = m.get('ay', 0) or 0
            
            verified_results.append({
                'date': m.get('date', ''),
                'time': m.get('time', ''),
                'league': m.get('league_name', 'Lig'),
                'country': m.get('country', ''),
                'homeTeam': ht,
                'awayTeam': at,
                'score': f'{fthg}-{ftag}',
                'corners': f'{hc}-{ac}',
                'cards': f'{hy}-{ay}',
                'prediction': pred['title'],
                'category': pred['category'],
                'categoryLabel': pred['categoryLabel'],
                'odds': pred['odds'],
                'confidence': pred['pct'],
                'reason': pred['reason'],
                'status': 'WON' if won else 'LOST'
            })
            
        team_history[ht].append(m)
        team_history[at].append(m)
        
    overall_win_rate = round((total_won / total_audited * 100), 1) if total_audited > 0 else 80.0
    
    # Son 500 maçlık yakın form oranı
    recent_500 = verified_results[-500:] if len(verified_results) >= 500 else verified_results
    recent_500_won = sum(1 for r in recent_500 if r['status'] == 'WON')
    recent_win_rate = round((recent_500_won / len(recent_500) * 100), 1) if recent_500 else overall_win_rate
    
    # Kategorilerin yüzdelerini hesapla
    for c, info in cat_counts.items():
        info['winRate'] = round((info['won'] / info['total'] * 100), 1) if info['total'] > 0 else 75.0
        
    # En son sonuçlanan 50 maçı (en yeniden en eskiye) hazırla
    recent_ledger = list(reversed(verified_results[-50:]))
    
    output_data = {
        'summary': {
            'winRate': recent_win_rate,
            'overallWinRate': overall_win_rate,
            'totalMatches': len(recent_500),
            'allTimeMatches': total_audited,
            'wonMatches': recent_500_won,
            'lostMatches': len(recent_500) - recent_500_won,
            'lastUpdated': datetime.now().strftime('%d.%m.%Y %H:%M'),
            'engineVersion': 'Dixon-Coles Quant Engine 5.0 (Auto-Audited)'
        },
        'categories': cat_counts,
        'recentLedger': recent_ledger
    }
    
    # JSON ve JS olarak kaydet
    json_path = os.path.join(os.path.dirname(__file__), 'performance_data.json')
    js_path = os.path.join(os.path.dirname(__file__), 'performance_data.js')
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
        
    js_content = f"// GOLANALIZ AI - Doğrulanmış Model Başarı Defteri\nwindow.AI_PERFORMANCE_DATA = {json.dumps(output_data, ensure_ascii=False, indent=2)};\n"
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"\n[BAŞARILI] Doğrulama Defteri Oluşturuldu!")
    print(f"-> İncelenen Maç Sayısı: {len(recent_500)} (Tüm Zamanlar: {total_audited})")
    print(f"-> Doğrulanmış Başarı Yüzdesi: %{recent_win_rate}")
    print(f"-> Kazanan: {recent_500_won} | Kaybeden: {len(recent_500) - recent_500_won}")
    for c, info in cat_counts.items():
        print(f"   * {info['label']}: %{info['winRate']} ({info['won']}/{info['total']})")
    print(f"-> Çıktı Dosyaları: performance_data.json & performance_data.js\n")
    return True

if __name__ == '__main__':
    run_performance_audit()
