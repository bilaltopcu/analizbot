// ==========================================================================
// GOLANALIZ AI - Canli Tahmin Takip & Otomatik Sonuclandirma Motoru
// (Live Prediction Tracker & Settlement Engine)
// ==========================================================================

const PredictionTracker = {
  STORAGE_KEY: 'golanaliz_fresh_tracker_v1',
  _inMemoryStorage: {},

  _getStorage() {
    if (typeof localStorage !== 'undefined') return localStorage;
    const mem = this._inMemoryStorage;
    return {
      getItem: (k) => mem[k] || null,
      setItem: (k, v) => { mem[k] = String(v); }
    };
  },

  // --- 1. Kayitlari Getir / Kaydet ---
  getRegistry() {
    try {
      const storage = this._getStorage();
      const data = storage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('[PredictionTracker] storage okuma hatasi:', e);
    }

    // Kullanıcının kesin talimatı: Önceki hiçbir maç dikkate alınmaz, tertemiz başlanır
    return this._getInitialSeed();
  },

  saveRegistry(registry) {
    try {
      const storage = this._getStorage();
      storage.setItem(this.STORAGE_KEY, JSON.stringify(registry));
    } catch (e) {
      console.warn('[PredictionTracker] storage yazma hatasi:', e);
    }
  },

  // --- 2. Baslangic Tohumu (Temiz Baslangic: 0 Eski Mac) ---
  _getInitialSeed() {
    const seed = [];
    this.saveRegistry(seed);
    return seed;
  },

  // --- 3. Yeni AI Tahmini Kaydet (Durum: PENDING) ---
  recordPrediction(data) {
    if (!data || !data.homeTeam || !data.awayTeam || !data.prediction) return null;

    const registry = this.getRegistry();
    const cleanHome = data.homeTeam.trim();
    const cleanAway = data.awayTeam.trim();
    const predId = `pred_${cleanHome.toLowerCase().replace(/\s+/g, '_')}_vs_${cleanAway.toLowerCase().replace(/\s+/g, '_')}`;

    // Ayni mac icin henuz sonuclanmamis (PENDING) kayit varsa guncelle
    const existingIdx = registry.findIndex(p => 
      p.status === 'PENDING' &&
      p.homeTeam.toLowerCase() === cleanHome.toLowerCase() &&
      p.awayTeam.toLowerCase() === cleanAway.toLowerCase()
    );

    const record = {
      id: predId + '_' + Date.now(),
      homeTeam: cleanHome,
      awayTeam: cleanAway,
      league: data.league || 'Lig Maçi',
      country: data.country || '',
      prediction: data.prediction,
      category: data.category || 'gol',
      categoryLabel: data.categoryLabel || 'Tahmin',
      odds: data.odds || 1.70,
      confidence: data.confidence || 75,
      reason: data.reason || 'Dixon-Coles Quant Engine 5.0 taktik analizi.',
      status: 'PENDING', // Sonuc Bekleniyor
      outcome: null,     // WON veya LOST olacak
      recordedAt: new Date().toISOString(),
      settledAt: null,
      actualScore: null,
      actualCorners: null,
      actualCards: null
    };

    if (existingIdx !== -1) {
      registry[existingIdx] = record;
    } else {
      registry.unshift(record);
    }

    this.saveRegistry(registry);

    // Sunucuya da asenkron bildir
    this._syncToServer(record);

    return record;
  },

  // --- 4. Sunucuya Tahmin Bildirimi ---
  _syncToServer(record) {
    try {
      if (typeof fetch !== 'undefined') {
        fetch('/api/record-prediction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        }).catch(() => { /* offline or static fallback */ });
      }
    } catch (_) {}
  },

  // --- 5. Kuralli Sonuclandirma Degerlendiricisi ---
  evaluateSettlement(betTitle, fthg, ftag, hy, ay, hc, ac) {
    const goals = (fthg || 0) + (ftag || 0);
    const cards = (hy || 0) + (ay || 0);
    const corners = (hc || 0) + (ac || 0);
    
    // Turkce karakterleri ve aksanlari normalize et
    const norm = (betTitle || '')
      .toUpperCase()
      .replace(/[Üü\u00dc\u00fc]/g, 'U')
      .replace(/[Öö\u00d6\u00f6]/g, 'O')
      .replace(/[Çç\u00c7\u00e7]/g, 'C')
      .replace(/[Şş\u015e\u015f]/g, 'S')
      .replace(/[Ğğ\u011e\u011f]/g, 'G')
      .replace(/[İıI\u0130\u0131]/g, 'I');

    // 1. Kart Bahisleri (Oncelikli)
    if (norm.includes('KART') || norm.includes('CARD')) {
      if (norm.includes('4.5') && (norm.includes('UST') || norm.includes('OVER'))) return cards >= 5;
      if (norm.includes('3.5') && (norm.includes('UST') || norm.includes('OVER'))) return cards >= 4;
      if (norm.includes('3.5') && (norm.includes('ALT') || norm.includes('UNDER'))) return cards <= 3;
      if (norm.includes('4.5') && (norm.includes('ALT') || norm.includes('UNDER'))) return cards <= 4;
    }

    // 2. Korner Bahisleri (Oncelikli)
    if (norm.includes('KORNER') || norm.includes('CORNER')) {
      if (norm.includes('9.5') && (norm.includes('UST') || norm.includes('OVER'))) return corners >= 10;
      if (norm.includes('8.5') && (norm.includes('UST') || norm.includes('OVER'))) return corners >= 9;
      if (norm.includes('8.5') && (norm.includes('ALT') || norm.includes('UNDER'))) return corners <= 8;
      if (norm.includes('9.5') && (norm.includes('ALT') || norm.includes('UNDER'))) return corners <= 9;
    }

    // 3. Taraf Bahisleri
    if (norm.includes('1-X') || norm.includes('1X')) return fthg >= ftag;
    if (norm.includes('X-2') || norm.includes('X2')) return ftag >= fthg;
    if (norm.includes('1-2') || norm.includes('12')) return fthg !== ftag;
    if (norm.includes('SONUCU 1') || norm.includes('MS 1') || norm.includes('MAC SONUCU 1')) return fthg > ftag;
    if (norm.includes('SONUCU 2') || norm.includes('MS 2') || norm.includes('MAC SONUCU 2')) return ftag > fthg;
    if (norm.includes('SONUCU X') || norm.includes('MS X') || norm.includes('BERABERLIK')) return fthg === ftag;

    // 4. Gol Bahisleri
    if (norm.includes('KG VAR') || norm.includes('BTTS YES')) return (fthg > 0 && ftag > 0);
    if (norm.includes('KG YOK') || norm.includes('BTTS NO')) return (fthg === 0 || ftag === 0);
    if (norm.includes('2.5') && (norm.includes('UST') || norm.includes('OVER'))) return goals >= 3;
    if (norm.includes('2.5') && (norm.includes('ALT') || norm.includes('UNDER'))) return goals <= 2;
    if (norm.includes('1.5') && (norm.includes('UST') || norm.includes('OVER'))) return goals >= 2;
    if (norm.includes('3.5') && (norm.includes('UST') || norm.includes('OVER'))) return goals >= 4;

    return false;
  },

  // --- 6. Bekleyen Tahminleri Otomatik Denetle (Mac Verisi Ulastiginda) ---
  auditPendingPredictions() {
    const registry = this.getRegistry();
    let changed = false;

    // data.js'deki TEAM_MATCHES_INDEX kontrolu
    const matchIndex = (typeof TEAM_MATCHES_INDEX !== 'undefined') ? TEAM_MATCHES_INDEX : {};

    function _slug(name) {
      if (!name) return '';
      return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function _parseMatchDate(dStr) {
      if (!dStr) return null;
      if (dStr.includes('/')) {
        const parts = dStr.split('/');
        if (parts.length === 3) {
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 23, 59, 59);
        }
      } else if (dStr.includes('-')) {
        return new Date(dStr);
      }
      return null;
    }

    registry.forEach(item => {
      if (item.status !== 'PENDING') return;

      const hSlug = _slug(item.homeTeam);
      const aSlug = _slug(item.awayTeam);

      let teamMatches = matchIndex[hSlug] || [];
      if (teamMatches.length === 0) {
        for (const k in matchIndex) {
          if (k.includes(hSlug) || hSlug.includes(k)) {
            teamMatches = matchIndex[k];
            break;
          }
        }
      }

      if (teamMatches.length === 0) return;

      // Tahminin yapıldığı tarihten önceki eski geçmiş maçları ASLA denetimde kullanma
      const recDate = item.recordedAt ? new Date(item.recordedAt) : new Date();
      const recMidnight = new Date(recDate.getFullYear(), recDate.getMonth(), recDate.getDate());

      // Bu iki takimin karsilastigi ve skoru olan son maci bul (sadece tahmin tarihinden sonra oynanan)
      const foundMatch = teamMatches.slice().reverse().find(m => {
        const isHomeMatch = _slug(m[2]) === hSlug && _slug(m[3]) === aSlug;
        const hasScore = m[4] !== null && m[4] !== undefined && m[5] !== null && m[5] !== undefined;
        if (!isHomeMatch || !hasScore) return false;

        const matchDate = _parseMatchDate(m[1]);
        // Maç tarihi tahmin tarihinden önceyse eski maçtır, dikkate alma
        return matchDate ? matchDate >= recMidnight : true;
      });

      if (foundMatch) {
        const fthg = foundMatch[4];
        const ftag = foundMatch[5];
        const hc = foundMatch[10] || 0;
        const ac = foundMatch[11] || 0;
        const hy = foundMatch[12] || 0;
        const ay = foundMatch[13] || 0;

        const isWon = this.evaluateSettlement(item.prediction, fthg, ftag, hy, ay, hc, ac);

        item.status = 'SETTLED';
        item.outcome = isWon ? 'WON' : 'LOST';
        item.actualScore = `${fthg}-${ftag}`;
        item.actualCorners = `${hc}-${ac}`;
        item.actualCards = `${hy}-${ay}`;
        item.settledAt = new Date().toISOString();
        changed = true;
      }
    });

    if (changed) {
      this.saveRegistry(registry);
    }

    return this.getPerformanceMetrics();
  },

  // --- 6b. Maç Verisi Geldiğinde Manuel / API Üzerinden Anında Sonuçlandırma ---
  settleMatchResult(homeTeam, awayTeam, fthg, ftag, hy = 0, ay = 0, hc = 0, ac = 0) {
    if (!homeTeam || !awayTeam) return null;
    const registry = this.getRegistry();
    const cleanHome = homeTeam.trim().toLowerCase();
    const cleanAway = awayTeam.trim().toLowerCase();

    const pendingItem = registry.find(r => 
      r.status === 'PENDING' &&
      r.homeTeam.trim().toLowerCase() === cleanHome &&
      r.awayTeam.trim().toLowerCase() === cleanAway
    );

    if (!pendingItem) return null;

    const isWon = this.evaluateSettlement(pendingItem.prediction, fthg, ftag, hy, ay, hc, ac);
    pendingItem.status = 'SETTLED';
    pendingItem.outcome = isWon ? 'WON' : 'LOST';
    pendingItem.actualScore = `${fthg}-${ftag}`;
    pendingItem.actualCorners = `${hc}-${ac}`;
    pendingItem.actualCards = `${hy}-${ay}`;
    pendingItem.settledAt = new Date().toISOString();

    this.saveRegistry(registry);
    return this.getPerformanceMetrics();
  },

  // --- 7. Canli Basari Metriklerini Hesapla (Sadece Yeni Dönem Maçları) ---
  getPerformanceMetrics() {
    const registry = this.getRegistry();
    const pendingList = registry.filter(r => r.status === 'PENDING');
    const settledList = registry.filter(r => r.status === 'SETTLED');

    const wonCount = settledList.filter(r => r.outcome === 'WON').length;
    const lostCount = settledList.filter(r => r.outcome === 'LOST').length;
    const settledTotal = settledList.length;

    // Kullanıcının kesin talimatı: Önceki hiçbir maçı dikkate alma!
    // Henüz tamamlanan maç yoksa başlangıç skoru %100 kabul edilir.
    const winRate = settledTotal > 0 
      ? Math.round((wonCount / settledTotal) * 1000) / 10 
      : 100.0;

    // Kategori kirilimlari
    const categories = {
      'kart': { total: 0, won: 0, label: 'Sarı / Kırmızı Kart' },
      'taraf': { total: 0, won: 0, label: 'Maç Sonucu & Çifte Şans' },
      'gol': { total: 0, won: 0, label: 'Alt / Üst & KG' },
      'korner': { total: 0, won: 0, label: 'Korner Bahisleri' }
    };

    settledList.forEach(item => {
      const cat = item.category || 'gol';
      if (categories[cat]) {
        categories[cat].total++;
        if (item.outcome === 'WON') {
          categories[cat].won++;
        }
      }
    });

    for (const k in categories) {
      const c = categories[k];
      c.winRate = c.total > 0 ? Math.round((c.won / c.total) * 1000) / 10 : 75.0;
    }

    return {
      winRate,
      settledTotal,
      wonCount,
      lostCount,
      pendingCount: pendingList.length,
      pendingList,
      settledList,
      allList: registry,
      categories
    };
  }
};

// Global disa aktarim
if (typeof window !== 'undefined') {
  window.PredictionTracker = PredictionTracker;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PredictionTracker;
}
