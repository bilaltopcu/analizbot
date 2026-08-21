"""
Patch app.js:
1. renderStatsList: sezon etiketiyle güncelle
2. generateAIPrediction: kategori bazlı (kart/korner/gol/taraf) en güçlü sinyali seç
"""

RENDER_STATS_NEW = r"""  // Render Line-by-Line Stats
  function renderStatsList() {
    if (!statsList || !homeProfile || !awayProfile) return;
    const hStats = homeProfile.stats;
    const aStats = awayProfile.stats;

    const hSeasonLabel = homeProfile.dataSeasonLabel || '2026-2027';
    const aSeasonLabel = awayProfile.dataSeasonLabel || '2026-2027';
    const seasonLabel = (hSeasonLabel === aSeasonLabel) ? hSeasonLabel : `${hSeasonLabel} / ${aSeasonLabel}`;

    statsList.innerHTML = "";

    const seasonInfo = document.createElement("div");
    seasonInfo.style.cssText = "font-size:11px;color:var(--accent-cyan);text-align:center;margin-bottom:10px;opacity:0.85;letter-spacing:0.04em;font-weight:600;";
    seasonInfo.textContent = `📊 İstatistikler: ${seasonLabel} Sezonu Verilerine Göre`;
    statsList.appendChild(seasonInfo);

    const cornersNote = (!homeProfile.cornersReliable || !awayProfile.cornersReliable) ? ' (tahmini)' : '';
    const cardsNote   = (!homeProfile.cardsReliable   || !awayProfile.cardsReliable)   ? ' (tahmini)' : '';

    const metrics = [
      { title:"⚽ Atılan Gol Ortalaması",      homeVal:hStats.avgGoalsScored,    awayVal:aStats.avgGoalsScored,    unit:" Gol/Maç" },
      { title:"🥅 Yenilen Gol Ortalaması",      homeVal:hStats.avgGoalsConceded,  awayVal:aStats.avgGoalsConceded,  unit:" Gol/Maç" },
      { title:"🎯 Toplam Şut Ortalaması",        homeVal:hStats.avgShots,          awayVal:aStats.avgShots,          unit:" Şut" },
      { title:"🎯 İsabetli Şut & İsabet Oranı",
        homeVal:`${hStats.avgShotsOnTarget} (%${hStats.shotAccuracyPct})`,
        awayVal:`${aStats.avgShotsOnTarget} (%${aStats.shotAccuracyPct})`,
        rawHome:parseFloat(hStats.avgShotsOnTarget), rawAway:parseFloat(aStats.avgShotsOnTarget) },
      { title:`🚩 Korner Ortalaması${cornersNote}`,homeVal:hStats.avgCorners,       awayVal:aStats.avgCorners,        unit:" Korner" },
      { title:`🟨 Sarı Kart Ortalaması${cardsNote}`,homeVal:hStats.avgYellowCards,  awayVal:aStats.avgYellowCards,    unit:" Kart/Maç" },
      { title:"🟥 Kırmızı Kart (Toplam)",        homeVal:hStats.totalRedCardsIn5,  awayVal:aStats.totalRedCardsIn5,  unit:" Adet" },
      { title:"⚡ KG Var (Karşılıklı Gol) Oranı",
        homeVal:`%${hStats.bttsPct}`, awayVal:`%${aStats.bttsPct}`,
        rawHome:hStats.bttsPct, rawAway:aStats.bttsPct },
      { title:"📈 2.5 Üst Gol Oranı",
        homeVal:`%${hStats.over25Pct}`, awayVal:`%${aStats.over25Pct}`,
        rawHome:hStats.over25Pct, rawAway:aStats.over25Pct },
      { title:"🏆 Galibiyet Oranı",
        homeVal:`%${hStats.winPct}`, awayVal:`%${aStats.winPct}`,
        rawHome:hStats.winPct, rawAway:aStats.winPct }
    ];

    metrics.forEach(m => {
      const hNum  = m.rawHome !== undefined ? m.rawHome : parseFloat(m.homeVal);
      const aNum  = m.rawAway !== undefined ? m.rawAway : parseFloat(m.awayVal);
      const total = (hNum + aNum) || 1;
      const hPct  = Math.round((hNum / total) * 100);
      const aPct  = 100 - hPct;
      const row   = document.createElement("div");
      row.className = "stat-row";
      row.innerHTML = `
        <div class="stat-label-bar">
          <span class="home-val">${m.homeVal}${m.unit||''}</span>
          <span class="stat-title">${m.title}</span>
          <span class="away-val">${m.awayVal}${m.unit||''}</span>
        </div>
        <div class="stat-progress-container">
          <div class="stat-progress-bar home" style="width:${hPct}%;"></div>
          <div class="stat-progress-bar away" style="width:${aPct}%;"></div>
        </div>`;
      statsList.appendChild(row);
    });
  }

"""

AI_PRED_NEW = r"""  // AI Prediction Engine 5.0: Category-First Signal Picker
  // Hangi kategori en güçlü sinyali veriyorsa (kart/korner/gol/taraf) onu seç
  function generateAIPrediction() {
    if (!homeProfile || !awayProfile) return;

    const probs   = calculateMatchProbabilities();
    const hAdv    = probs.hAdv;
    const aAdv    = probs.aAdv;
    const hStats  = homeProfile.stats;
    const aStats  = awayProfile.stats;
    const hSeason = homeProfile.dataSeasonLabel || '2026-2027';
    const aSeason = awayProfile.dataSeasonLabel || '2026-2027';

    const aiXgValue     = document.getElementById("aiXgValue");
    const aiTacticalGrid= document.getElementById("aiTacticalGrid");
    const aiMainProbVal = document.getElementById("aiMainProbVal");
    if (aiXgValue) aiXgValue.textContent = `Ev ${probs.xG_home} - ${probs.xG_away} Dep`;

    const totalXG        = probs.xG_home + probs.xG_away;
    const homeAttack     = parseFloat(hStats.avgGoalsScored)   || 1.2;
    const awayAttack     = parseFloat(aStats.avgGoalsScored)   || 1.0;
    const homeDef        = parseFloat(hStats.avgGoalsConceded) || 1.2;
    const awayDef        = parseFloat(aStats.avgGoalsConceded) || 1.2;
    const homeCorners    = parseFloat(hStats.avgCorners)       || 4.8;
    const awayCorners    = parseFloat(aStats.avgCorners)       || 4.8;
    const homeCards      = parseFloat(hStats.avgYellowCards)   || 1.9;
    const awayCards      = parseFloat(aStats.avgYellowCards)   || 1.9;
    const homeBtts       = hStats.bttsPct;
    const awayBtts       = aStats.bttsPct;
    const homeOver25     = hStats.over25Pct;
    const awayOver25     = aStats.over25Pct;
    const homeWinPct     = hStats.winPct;
    const awayWinPct     = aStats.winPct;
    const homeMom        = hAdv.momentum;
    const awayMom        = aAdv.momentum;
    const cornersReliable= homeProfile.cornersReliable && awayProfile.cornersReliable;
    const cardsReliable  = homeProfile.cardsReliable   && awayProfile.cardsReliable;

    // Ortalamalar
    const totalCornersExp = parseFloat(probs.expCorners);
    const totalCardsExp   = parseFloat(probs.expCards);
    const avgBttsCombined = (homeBtts + awayBtts) / 2;
    const avgOver25Comb   = (homeOver25 + awayOver25) / 2;
    const homeEdge        = probs.pHomeWin - probs.pAwayWin;
    const awayEdge        = probs.pAwayWin - probs.pHomeWin;

    // ────────────────────────────────────────────────────────
    // ADAY HAVUZU: Her kategoriden adaylar
    // ────────────────────────────────────────────────────────
    const candidates = [];

    // ── KATEGORI 1: KART BAHİSLERİ ──
    if (cardsReliable) {
      // Toplam kart belirgin yüksekse VE her iki takım da en az 1.8 ortalamaya sahipse
      if (totalCardsExp >= 4.5 && homeCards >= 1.8 && awayCards >= 1.8) {
        const pct = Math.min(85, Math.round(totalCardsExp * 14));
        candidates.push({
          category: "kart",
          title: "TOPLAM SARI KART 4.5 ÜST",
          pct, odds: 1.95,
          signal: (totalCardsExp - 4.0) * 10 + (homeCards + awayCards - 3.5) * 6,
          reason: `${homeProfile.teamName} (${homeCards}) ve ${awayProfile.teamName} (${awayCards}) toplam ${(homeCards+awayCards).toFixed(1)} sarı kart ortalamasına sahip. ⚠️ Hakem profili & maç tansiyonu kontrol edilmelidir.`
        });
      }
      if (totalCardsExp >= 3.8 && homeCards >= 1.5 && awayCards >= 1.5) {
        const pct = Math.min(85, Math.round(totalCardsExp * 16));
        candidates.push({
          category: "kart",
          title: "TOPLAM SARI KART 3.5 ÜST",
          pct, odds: 1.72,
          signal: (totalCardsExp - 3.0) * 8 + (homeCards + awayCards - 3.0) * 5,
          reason: `İki takımın toplam kart ortalaması ${(homeCards+awayCards).toFixed(1)}. 3.5 üst eğilimi mevcut. ⚠️ Hakem profili & maç tansiyonu kontrol edilmelidir.`
        });
      }
      // Kart düşükse ALT
      if (totalCardsExp < 3.2) {
        const pLow = Math.min(82, Math.round((4.0 - totalCardsExp) * 20));
        candidates.push({
          category: "kart",
          title: "TOPLAM SARI KART 3.5 ALT",
          pct: pLow, odds: 1.80,
          signal: (3.5 - totalCardsExp) * 12,
          reason: `Takımların kart ortalaması düşük (${homeCards} + ${awayCards} = ${(homeCards+awayCards).toFixed(1)}). Sakin maç beklentisi.`
        });
      }
    }

    // ── KATEGORI 2: KORNER BAHİSLERİ ──
    if (cornersReliable) {
      if (totalCornersExp >= 10.0) {
        const pct = Math.min(84, Math.round(totalCornersExp * 7.5));
        candidates.push({
          category: "korner",
          title: "TOPLAM KORNER 9.5 ÜST",
          pct, odds: 1.90,
          signal: (totalCornersExp - 9.0) * 18 + (homeCorners + awayCorners - 9.0) * 12,
          reason: `${homeProfile.teamName} ${homeCorners} + ${awayProfile.teamName} ${awayCorners} korner ortalamasıyla toplam ${totalCornersExp} beklenen korner. 9.5 üst için net sinyal.`
        });
      } else if (totalCornersExp >= 9.0) {
        const pct = Math.min(80, Math.round(totalCornersExp * 8.0));
        candidates.push({
          category: "korner",
          title: "TOPLAM KORNER 8.5 ÜST",
          pct, odds: 1.75,
          signal: (totalCornersExp - 8.0) * 16,
          reason: `Maç başına beklenen korner sayısı ${totalCornersExp} — 8.5 üst için iyi görünüm.`
        });
      } else if (totalCornersExp < 8.5) {
        const pLow = Math.min(78, Math.round((9.5 - totalCornersExp) * 10));
        candidates.push({
          category: "korner",
          title: "TOPLAM KORNER 8.5 ALT",
          pct: pLow, odds: 1.75,
          signal: (8.5 - totalCornersExp) * 14,
          reason: `İki takımın ortalama kornerleri düşük (${homeCorners} + ${awayCorners}). Defansif/kontrollü maç beklentisi.`
        });
      }
    }

    // ── KATEGORI 3: GOL BAHİSLERİ ──
    // 2.5 Üst
    const over25Signal = (avgOver25Comb - 45) * 0.7 + (totalXG - 2.0) * 18 + (probs.pOver25 - 50) * 0.6;
    if (probs.pOver25 >= 54 && totalXG >= 2.35 && avgOver25Comb >= 48) {
      candidates.push({
        category: "gol",
        title: "TOPLAM GOL 2.5 ÜST",
        pct: probs.pOver25,
        odds: parseFloat(Math.max(1.68, Math.min(2.10, (100/probs.pOver25)*0.94)).toFixed(2)),
        signal: Math.min(100, Math.max(0, over25Signal)),
        reason: `${hSeason} sezonu: Ev ${hStats.avgGoalsScored} / Dep ${aStats.avgGoalsScored} gol ortalaması. xG toplamı ${totalXG.toFixed(2)} ile yüksek gol beklentisi.`
      });
    }
    // 2.5 Alt
    const pUnder25 = 100 - probs.pOver25;
    const under25Signal = (65 - avgOver25Comb) * 0.8 + (2.8 - totalXG) * 15 + (pUnder25 - 50) * 0.5;
    if (pUnder25 >= 52 && totalXG <= 2.40 && avgOver25Comb <= 52) {
      candidates.push({
        category: "gol",
        title: "TOPLAM GOL 2.5 ALT",
        pct: pUnder25,
        odds: parseFloat(Math.max(1.68, Math.min(2.10, (100/pUnder25)*0.94)).toFixed(2)),
        signal: Math.min(100, Math.max(0, under25Signal)),
        reason: `Savunma ağırlıklı karşılaşma; ${homeProfile.teamName} (${hStats.avgGoalsConceded} yenilen) ve ${awayProfile.teamName} düşük gol beklentisiyle düşük skorlu öngörülüyor.`
      });
    }
    // KG Var
    const bttsSignal = (avgBttsCombined - 42) * 0.9 + (homeAttack > 1.0 ? 14 : 0) + (awayAttack > 0.9 ? 12 : 0)
      + (homeDef > 1.1 ? 8 : 0) + (awayDef > 1.0 ? 8 : 0) + (probs.pBTTS - 50) * 0.7;
    if (probs.pBTTS >= 54 && avgBttsCombined >= 48 && homeAttack > 0.95 && awayAttack > 0.85) {
      candidates.push({
        category: "gol",
        title: "KARŞILIKLI GOL VAR (KG VAR)",
        pct: probs.pBTTS,
        odds: parseFloat(Math.max(1.62, Math.min(1.92, (100/probs.pBTTS)*0.94)).toFixed(2)),
        signal: Math.min(100, Math.max(0, bttsSignal)),
        reason: `${homeProfile.teamName} %${homeBtts} / ${awayProfile.teamName} %${awayBtts} KG Var oranları ve gol üretkenliği her iki tarafın kaleye gideceğine işaret ediyor.`
      });
    }
    // KG Yok
    const pBttsNo = 100 - probs.pBTTS;
    const bttsNoSignal = (55 - avgBttsCombined) * 0.9 + (homeDef < 1.0 ? 12 : 0) + (awayDef < 0.95 ? 12 : 0) + (pBttsNo - 45) * 0.6;
    if (pBttsNo >= 50 && avgBttsCombined <= 50 && !(homeAttack > 1.5 && awayAttack > 1.3)) {
      candidates.push({
        category: "gol",
        title: "KARŞILIKLI GOL YOK (KG YOK)",
        pct: pBttsNo,
        odds: parseFloat(Math.max(1.55, Math.min(1.85, (100/pBttsNo)*0.94)).toFixed(2)),
        signal: Math.min(100, Math.max(0, bttsNoSignal)),
        reason: `${homeProfile.teamName} %${100-homeBtts} / ${awayProfile.teamName} %${100-awayBtts} KG Yok oranı. En az bir taraf gol bulamayabilir.`
      });
    }
    // 3.5 Üst
    if (probs.pOver35 >= 28 && totalXG >= 3.0 && homeAttack >= 1.5 && awayAttack >= 1.3) {
      const sig = (totalXG - 2.8) * 20 + (avgOver25Comb - 50) * 0.8 + (probs.pOver35 - 25) * 0.8;
      candidates.push({
        category: "gol",
        title: "TOPLAM GOL 3.5 ÜST",
        pct: probs.pOver35,
        odds: parseFloat(Math.max(1.95, Math.min(2.80, (100/probs.pOver35)*0.94)).toFixed(2)),
        signal: Math.min(100, Math.max(0, sig)),
        reason: `Hücum ağırlıklı karşılaşma. xG toplamı ${totalXG.toFixed(2)} ile 4+ gollü geçme ihtimali yüksek.`
      });
    }
    // Ev takımı 1.5 Üst
    const home15 = Math.round((1 - Math.exp(-probs.xG_home) * (1 + probs.xG_home)) * 100);
    if (probs.xG_home >= 1.55 && home15 >= 53 && homeAttack >= 1.2) {
      candidates.push({
        category: "gol",
        title: `${homeProfile.teamName.toUpperCase()} 1.5 GOL ÜSTÜ`,
        pct: Math.min(82, Math.max(53, home15)),
        odds: parseFloat(Math.max(1.65, Math.min(2.15, (100/Math.max(50,home15))*0.93)).toFixed(2)),
        signal: (homeAttack - 1.0)*30 + (probs.xG_home - 1.2)*22 + (home15-48)*0.6 + homeMom*12,
        reason: `${homeProfile.teamName} iç sahada ${probs.xG_home} xG ve ${hStats.avgGoalsScored} sezon ortalamasıyla 2+ gol potansiyeli taşıyor.`
      });
    }
    // Deplasman 1.5 Üst
    const away15 = Math.round((1 - Math.exp(-probs.xG_away) * (1 + probs.xG_away)) * 100);
    if (probs.xG_away >= 1.45 && away15 >= 50 && awayAttack >= 1.1 && awayEdge >= -5) {
      candidates.push({
        category: "gol",
        title: `${awayProfile.teamName.toUpperCase()} 1.5 GOL ÜSTÜ`,
        pct: Math.min(80, Math.max(50, away15)),
        odds: parseFloat(Math.max(1.75, Math.min(2.40, (100/Math.max(44,away15))*0.93)).toFixed(2)),
        signal: (awayAttack - 0.9)*28 + (probs.xG_away - 1.1)*20 + (away15-46)*0.6 + awayMom*12,
        reason: `${awayProfile.teamName} deplasmanda ${probs.xG_away} xG ile ${aStats.avgGoalsScored} gol ortalamasını destekliyor.`
      });
    }

    // ── KATEGORI 4: MAÇ TARAF BAHİSLERİ ──
    // Ev sahibi favori
    if (homeEdge >= 16 && probs.xG_home >= probs.xG_away + 0.20 && hAdv.wWinPct >= 44) {
      const sig = homeEdge * 0.6 + (hAdv.wWinPct - 40)*0.4 + homeMom*15;
      const estOdds = parseFloat(Math.max(1.62, Math.min(2.20, (100/probs.pHomeWin)*0.94)).toFixed(2));
      candidates.push({
        category: "taraf",
        title: `MAÇ SONUCU 1 (${homeProfile.teamName.toUpperCase()} KAZANIR)`,
        pct: probs.pHomeWin, odds: estOdds,
        signal: Math.min(100, sig),
        reason: `${hSeason} sezonu: ${homeProfile.teamName} iç sahada %${hAdv.wWinPct} galibiyet oranı ve ${probs.xG_home} xG üstünlüğüyle net favori.`
      });
    }
    // Deplasman favori
    if (awayEdge >= 12 && probs.xG_away >= probs.xG_home + 0.20 && aAdv.wWinPct >= 40) {
      const sig = awayEdge * 0.6 + (aAdv.wWinPct - 38)*0.4 + awayMom*15;
      const estOdds = parseFloat(Math.max(1.72, Math.min(2.60, (100/probs.pAwayWin)*0.94)).toFixed(2));
      candidates.push({
        category: "taraf",
        title: `MAÇ SONUCU 2 (${awayProfile.teamName.toUpperCase()} KAZANIR)`,
        pct: probs.pAwayWin, odds: estOdds,
        signal: Math.min(100, sig),
        reason: `${aSeason} sezonu: ${awayProfile.teamName} deplasmanda %${aAdv.wWinPct} galibiyet oranı ve ${probs.xG_away} xG ile güçlü aday.`
      });
    }
    // 1-X Çifte Şans
    if (probs.pHomeWin >= 36 && probs.p1X >= 63 && homeEdge >= 0 && probs.pAwayWin <= 34) {
      candidates.push({
        category: "taraf",
        title: `ÇİFTE ŞANS 1-X (${homeProfile.teamName.toUpperCase()} KAZANIR VEYA BERABERLİK)`,
        pct: probs.p1X, odds: 1.38,
        signal: (probs.p1X - 58)*0.9 + homeEdge*0.3,
        reason: `${homeProfile.teamName} iç saha avantajı; ev sahibi ya da beraberlik ile sonuçlanması %${probs.p1X} olasılıkla güvenli tercih.`
      });
    }
    // X-2 Çifte Şans
    if (probs.pAwayWin >= 32 && probs.pX2 >= 60 && awayEdge >= 0 && probs.pHomeWin <= 36) {
      candidates.push({
        category: "taraf",
        title: `ÇİFTE ŞANS X-2 (${awayProfile.teamName.toUpperCase()} KAZANIR VEYA BERABERLİK)`,
        pct: probs.pX2, odds: 1.45,
        signal: (probs.pX2 - 56)*0.9 + awayEdge*0.3,
        reason: `${awayProfile.teamName} deplasman direnci; deplasman ya da beraberlik olasılığı %${probs.pX2}.`
      });
    }

    // ── FALLBACK: Hiçbir sinyal tetiklenmediyse ──
    if (candidates.length === 0) {
      if (probs.pHomeWin >= probs.pAwayWin + 8) {
        candidates.push({ category:"taraf", title:`MAÇ SONUCU 1 (${homeProfile.teamName.toUpperCase()} KAZANIR)`,
          pct:probs.pHomeWin, odds:parseFloat(Math.max(1.62, Math.min(2.20,(100/probs.pHomeWin)*0.94)).toFixed(2)),
          signal:28, reason:`${homeProfile.teamName} simulasyon sonuçlarına göre en güçlü galibiyet adayı (%${probs.pHomeWin}).` });
      } else if (probs.pAwayWin >= probs.pHomeWin + 8) {
        candidates.push({ category:"taraf", title:`MAÇ SONUCU 2 (${awayProfile.teamName.toUpperCase()} KAZANIR)`,
          pct:probs.pAwayWin, odds:parseFloat(Math.max(1.72, Math.min(2.55,(100/probs.pAwayWin)*0.94)).toFixed(2)),
          signal:28, reason:`${awayProfile.teamName} simulasyon sonuçlarına göre en güçlü deplasman adayı (%${probs.pAwayWin}).` });
      } else if (probs.pOver25 >= 55) {
        candidates.push({ category:"gol", title:"TOPLAM GOL 2.5 ÜST", pct:probs.pOver25,
          odds:parseFloat(Math.max(1.68,Math.min(2.10,(100/probs.pOver25)*0.94)).toFixed(2)),
          signal:26, reason:`xG toplamı ${totalXG.toFixed(2)} ile gollü karşılaşma bekleniyor.` });
      } else {
        candidates.push({ category:"gol", title:"TOPLAM GOL 2.5 ALT", pct:100-probs.pOver25,
          odds:1.80, signal:24, reason:"Dengeli güç, düşük tempo — 2.5 Alt öne çıkıyor." });
      }
    }

    // En yüksek sinyal değerine sahip adayı seç
    candidates.sort((a, b) => b.signal - a.signal);
    const bestPick = candidates[0];
    currentAIPick = bestPick;

    const aiBetTitle      = document.getElementById("aiBetTitle");
    const aiBankoConfidence=document.getElementById("aiBankoConfidence");
    const aiBankoReason   = document.getElementById("aiBankoReason");
    if (aiBetTitle)       aiBetTitle.textContent       = bestPick.title;
    if (aiBankoConfidence) aiBankoConfidence.textContent= `%${bestPick.pct} GÜVEN`;
    if (aiBankoReason)    aiBankoReason.textContent    = bestPick.reason;
    if (aiMainProbVal)    aiMainProbVal.textContent     = `%${bestPick.pct}`;

    updateAIPickCouponBtnState();

    // Skor tahmini (Poisson tutarlı)
    function calcPoisson(lambda, k) {
      let f = 1;
      for (let i = 2; i <= k; i++) f *= i;
      return (Math.pow(lambda, k) * Math.exp(-lambda)) / f;
    }
    function getConsistentScore(betStr, probsObj) {
      const isUnder25 = betStr.includes("2.5 ALT");
      const isOver35  = betStr.includes("3.5 ÜST");
      const isOver25  = betStr.includes("2.5 ÜST") || betStr.includes("KG VAR");
      const isHomeWin = betStr.includes("SONUCU 1") || betStr.includes("1-X");
      const isAwayWin = betStr.includes("SONUCU 2") || betStr.includes("X-2");
      const isBtts    = betStr.includes("KG VAR") && !betStr.includes("YOK");

      let goalMode = "auto";
      if (isUnder25) goalMode = "under25";
      else if (isOver35) goalMode = "over35";
      else if (isOver25) goalMode = "over25";
      else if (probsObj.pOver25 < 46 || (probsObj.xG_home+probsObj.xG_away) < 2.2) goalMode = "under25";
      else if (probsObj.pOver25 >= 60 || (probsObj.xG_home+probsObj.xG_away) >= 2.8) goalMode = "over25";

      let bestScore = "", maxProb = -1;
      for (let hg = 0; hg <= 5; hg++) {
        for (let ag = 0; ag <= 5; ag++) {
          const tg = hg + ag;
          if (goalMode === "under25" && tg > 2) continue;
          if (goalMode === "over25"  && tg < 3) continue;
          if (goalMode === "over35"  && tg < 4) continue;
          if (isBtts && (hg === 0 || ag === 0)) continue;
          let prob = calcPoisson(probsObj.xG_home, hg) * calcPoisson(probsObj.xG_away, ag);
          if (isHomeWin) { if (hg > ag) prob *= 1.4; else if (hg === ag) prob *= 0.8; else prob *= 0.3; }
          if (isAwayWin) { if (ag > hg) prob *= 1.4; else if (hg === ag) prob *= 0.8; else prob *= 0.3; }
          if (prob > maxProb) { maxProb = prob; bestScore = `${hg} - ${ag}`; }
        }
      }
      if (!bestScore) {
        let hg = Math.round(probsObj.xG_home), ag = Math.round(probsObj.xG_away);
        if (goalMode === "under25" && hg+ag > 2) { if (hg>ag){hg=1;ag=0;}else if(ag>hg){hg=0;ag=1;}else{hg=1;ag=1;} }
        else if ((goalMode==="over25"||goalMode==="over35") && hg+ag < 3) { if(hg>=ag){hg=2;ag=1;}else{hg=1;ag=2;} }
        bestScore = `${hg} - ${ag}`;
      }
      return bestScore;
    }

    const scorePred = getConsistentScore(bestPick.title, probs);
    const aiScorePrediction = document.getElementById("aiScorePrediction");
    if (aiScorePrediction) aiScorePrediction.textContent = scorePred;

    // Taktik grid — kategori etiketi ekle
    const catIcon = { kart:"🟨", korner:"🚩", gol:"⚽", taraf:"🏆" }[bestPick.category] || "📊";
    if (aiTacticalGrid) {
      const signalBar = Math.round(bestPick.signal || 50);
      aiTacticalGrid.innerHTML = `
        <div class="tactical-card">
          <div class="tactical-card-title"><i class="fa-solid fa-bullseye"></i> Gol Beklentisi (xG)</div>
          <div class="tactical-card-val">Ev ${probs.xG_home} - ${probs.xG_away} Dep</div>
          <div class="tactical-card-desc">Dixon-Coles Simülasyonu</div>
        </div>
        <div class="tactical-card">
          <div class="tactical-card-title"><i class="fa-solid fa-signal"></i> Sinyal Gücü</div>
          <div class="tactical-card-val">${catIcon} ${signalBar}/100</div>
          <div class="tactical-card-desc">Kategori: ${bestPick.category.toUpperCase()}</div>
        </div>
        <div class="tactical-card">
          <div class="tactical-card-title"><i class="fa-solid fa-flag"></i> Beklenen Korner / Kart</div>
          <div class="tactical-card-val">${probs.expCorners} K / ${probs.expCards} Kart</div>
          <div class="tactical-card-desc">Maç Temposu</div>
        </div>`;
    }
  }

"""

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1) renderStatsList replace
rs_start = content.find('  // Render Line-by-Line Stats')
rs_end   = content.find('  // 3. AI Prediction Button Trigger')
if rs_start == -1 or rs_end == -1:
    print(f'ERROR renderStatsList: start={rs_start}, end={rs_end}')
else:
    content = content[:rs_start] + RENDER_STATS_NEW + content[rs_end:]
    print('OK: renderStatsList replaced')

# 2) generateAIPrediction replace
ai_start = content.find('  function generateAIPrediction() {')
ai_end   = content.find('  function generatePossibleBets() {')
if ai_start == -1 or ai_end == -1:
    print(f'ERROR generateAIPrediction: start={ai_start}, end={ai_end}')
else:
    content = content[:ai_start] + AI_PRED_NEW + content[ai_end:]
    print('OK: generateAIPrediction replaced')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Done. File size: {len(content)} chars')
