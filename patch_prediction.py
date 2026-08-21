
NEW_FUNCTION = r"""  // AI Prediction Engine 4.0: Data-Driven Signal-Based Best Bet Picker
  function generateAIPrediction() {
    if (!homeProfile || !awayProfile) return;

    const probs = calculateMatchProbabilities();
    const hAdv = probs.hAdv;
    const aAdv = probs.aAdv;
    const hStats = homeProfile.stats;
    const aStats = awayProfile.stats;

    const aiXgValue = document.getElementById("aiXgValue");
    const aiTacticalGrid = document.getElementById("aiTacticalGrid");
    const aiMainProbVal = document.getElementById("aiMainProbVal");

    if (aiXgValue) aiXgValue.textContent = `Ev ${probs.xG_home} - ${probs.xG_away} Dep`;

    // STEP 1: Key signals from real match data
    const totalXG = probs.xG_home + probs.xG_away;
    const homeAttack  = parseFloat(hStats.avgGoalsScored)   || 1.2;
    const awayAttack  = parseFloat(aStats.avgGoalsScored)   || 1.0;
    const homeDef     = parseFloat(hStats.avgGoalsConceded) || 1.2;
    const awayDef     = parseFloat(aStats.avgGoalsConceded) || 1.2;
    const homeBtts    = hStats.bttsPct;
    const awayBtts    = aStats.bttsPct;
    const homeOver25  = hStats.over25Pct;
    const awayOver25  = aStats.over25Pct;
    const homeWinPct  = hStats.winPct;
    const awayWinPct  = aStats.winPct;
    const homeMom     = hAdv.momentum;
    const awayMom     = aAdv.momentum;

    const homeStrength = (homeAttack * 0.40) + ((2 - homeDef) * 0.30) + (homeWinPct / 100 * 0.30);
    const awayStrength = (awayAttack * 0.40) + ((2 - awayDef) * 0.30) + (awayWinPct / 100 * 0.30);
    const strengthDiff = homeStrength - awayStrength;
    const avgGoalsCombined = (homeOver25 + awayOver25) / 2;
    const avgBttsCombined  = (homeBtts + awayBtts) / 2;
    const highScoringMatch = homeAttack > 1.5 && awayAttack > 1.3;
    const homeEdge = probs.pHomeWin - probs.pAwayWin;
    const awayEdge = probs.pAwayWin - probs.pHomeWin;

    // STEP 2: Build signal-weighted candidate pool
    const signals = [];

    // A: Belirgin ev sahibi favori
    if (homeEdge >= 18 && probs.xG_home >= probs.xG_away + 0.22 && hAdv.wWinPct >= 45) {
      const signal = homeEdge * 0.6 + (hAdv.wWinPct - 40) * 0.4 + (homeMom * 15);
      const estOdds = parseFloat(Math.max(1.62, Math.min(2.20, (100 / probs.pHomeWin) * 0.94)).toFixed(2));
      signals.push({ title: `MAÇ SONUCU 1 (${homeProfile.teamName.toUpperCase()} KAZANIR)`, pct: probs.pHomeWin, odds: estOdds, signal: Math.min(100, signal),
        reason: `${homeProfile.teamName} iç sahada %${hAdv.wWinPct} galibiyet oranı, xG üstünlüğü (${probs.xG_home} - ${probs.xG_away}) ve ${homeMom >= 0 ? 'yükselen' : 'dengeli'} formla net galibiyet favori.` });
    }

    // B: Belirgin deplasman favori
    if (awayEdge >= 14 && probs.xG_away >= probs.xG_home + 0.22 && aAdv.wWinPct >= 42) {
      const signal = awayEdge * 0.6 + (aAdv.wWinPct - 38) * 0.4 + (awayMom * 15);
      const estOdds = parseFloat(Math.max(1.72, Math.min(2.60, (100 / probs.pAwayWin) * 0.94)).toFixed(2));
      signals.push({ title: `MAÇ SONUCU 2 (${awayProfile.teamName.toUpperCase()} KAZANIR)`, pct: probs.pAwayWin, odds: estOdds, signal: Math.min(100, signal),
        reason: `${awayProfile.teamName} deplasmanda %${aAdv.wWinPct} galibiyet oranı ve üstün xG (${probs.xG_away} - ${probs.xG_home}) ile güçlü deplasman adayı.` });
    }

    // C: 1-X Çifte Şans
    if (probs.pHomeWin >= 38 && probs.p1X >= 65 && strengthDiff >= 0.05 && probs.pAwayWin <= 32) {
      const signal = (probs.p1X - 60) * 0.9 + (strengthDiff * 20);
      signals.push({ title: `ÇİFTE ŞANS 1-X (${homeProfile.teamName.toUpperCase()} KAZANIR VEYA BERABERLİK)`, pct: probs.p1X, odds: 1.38, signal: Math.min(100, signal),
        reason: `${homeProfile.teamName} iç saha avantajı; ev sahibi ya da beraberlik ile sonuçlanması %${probs.p1X} olasılıkla güvenli tercih.` });
    }

    // D: X-2 Çifte Şans
    if (probs.pAwayWin >= 34 && probs.pX2 >= 60 && strengthDiff <= -0.05 && probs.pHomeWin <= 36) {
      const signal = (probs.pX2 - 58) * 0.9 + (Math.abs(strengthDiff) * 20);
      signals.push({ title: `ÇİFTE ŞANS X-2 (${awayProfile.teamName.toUpperCase()} KAZANIR VEYA BERABERLİK)`, pct: probs.pX2, odds: 1.45, signal: Math.min(100, signal),
        reason: `${awayProfile.teamName} deplasman direnci; deplasman ya da beraberlik ile sonuçlanma olasılığı %${probs.pX2}.` });
    }

    // E: Toplam Gol 2.5 Üst
    const over25Signal = (avgGoalsCombined - 45) * 0.7 + (totalXG - 2.0) * 18 + (probs.pOver25 - 50) * 0.5;
    if (probs.pOver25 >= 54 && totalXG >= 2.35 && avgGoalsCombined >= 48) {
      signals.push({ title: "TOPLAM GOL 2.5 ÜST", pct: probs.pOver25,
        odds: parseFloat(Math.max(1.68, Math.min(2.10, (100 / probs.pOver25) * 0.94)).toFixed(2)),
        signal: Math.min(100, Math.max(0, over25Signal)),
        reason: `Ev ${hStats.avgGoalsScored} / Dep ${aStats.avgGoalsScored} gol ortalaması ve xG toplamı (${totalXG.toFixed(2)}) ile yüksek gol beklentisi.` });
    }

    // F: Toplam Gol 2.5 Alt
    const pUnder25 = 100 - probs.pOver25;
    const under25Signal = (65 - avgGoalsCombined) * 0.8 + (2.8 - totalXG) * 15 + (pUnder25 - 50) * 0.5;
    if (pUnder25 >= 52 && totalXG <= 2.40 && avgGoalsCombined <= 52) {
      signals.push({ title: "TOPLAM GOL 2.5 ALT", pct: pUnder25,
        odds: parseFloat(Math.max(1.68, Math.min(2.10, (100 / pUnder25) * 0.94)).toFixed(2)),
        signal: Math.min(100, Math.max(0, under25Signal)),
        reason: `${homeProfile.teamName} (${hStats.avgGoalsConceded} yenilen ort.) ve ${awayProfile.teamName} savunma sağlamlığı; maç düşük skorlu geçebilir.` });
    }

    // G: Karşılıklı Gol Var
    const bttsSignal = (avgBttsCombined - 42) * 0.8 + (homeAttack > 1.0 ? 12 : 0) + (awayAttack > 0.9 ? 10 : 0)
      + (homeDef > 1.1 ? 8 : 0) + (awayDef > 1.0 ? 8 : 0) + (probs.pBTTS - 48) * 0.6;
    if (probs.pBTTS >= 52 && avgBttsCombined >= 46 && homeAttack > 0.95 && awayAttack > 0.85) {
      signals.push({ title: "KARŞILIKLI GOL VAR (KG VAR)", pct: probs.pBTTS,
        odds: parseFloat(Math.max(1.62, Math.min(1.92, (100 / probs.pBTTS) * 0.94)).toFixed(2)),
        signal: Math.min(100, Math.max(0, bttsSignal)),
        reason: `${homeProfile.teamName} (%${homeBtts} KG Var) ve ${awayProfile.teamName} (%${awayBtts} KG Var) istatistikleri her iki tarafın da kaleye gitme eğilimini destekliyor.` });
    }

    // H: Karşılıklı Gol Yok
    const pBttsNo = 100 - probs.pBTTS;
    const bttsNoSignal = (50 - avgBttsCombined) * 0.9 + (homeDef < 1.0 ? 10 : 0) + (awayDef < 0.95 ? 10 : 0) + (pBttsNo - 45) * 0.5;
    if (pBttsNo >= 50 && avgBttsCombined <= 52 && !highScoringMatch) {
      signals.push({ title: "KARŞILIKLI GOL YOK (KG YOK)", pct: pBttsNo,
        odds: parseFloat(Math.max(1.55, Math.min(1.85, (100 / pBttsNo) * 0.94)).toFixed(2)),
        signal: Math.min(100, Math.max(0, bttsNoSignal)),
        reason: `${homeProfile.teamName} (%${100 - homeBtts} KG Yok) veya ${awayProfile.teamName} (%${100 - awayBtts} KG Yok) istatistikleri en az birinin gol atamayacağını gösteriyor.` });
    }

    // I: Ev sahibi 1.5 gol üstü
    const home15Prob = Math.round((1 - Math.exp(-probs.xG_home) * (1 + probs.xG_home)) * 100);
    const homeGoalSignal = (homeAttack - 1.0) * 30 + (probs.xG_home - 1.2) * 22 + (home15Prob - 48) * 0.6 + (homeMom * 12);
    if (probs.xG_home >= 1.55 && home15Prob >= 53 && homeAttack >= 1.2 && (probs.pHomeWin + probs.pDraw) >= 55) {
      signals.push({ title: `${homeProfile.teamName.toUpperCase()} 1.5 GOL ÜSTÜ`,
        pct: Math.min(82, Math.max(53, home15Prob)),
        odds: parseFloat(Math.max(1.65, Math.min(2.15, (100 / Math.max(50, home15Prob)) * 0.93)).toFixed(2)),
        signal: Math.min(100, Math.max(0, homeGoalSignal)),
        reason: `${homeProfile.teamName} iç sahada ${probs.xG_home} xG gol beklentisi ve sezon ortalaması ${hStats.avgGoalsScored} ile 2+ gol potansiyeli.` });
    }

    // J: Deplasman 1.5 gol üstü
    const away15Prob = Math.round((1 - Math.exp(-probs.xG_away) * (1 + probs.xG_away)) * 100);
    const awayGoalSignal = (awayAttack - 0.9) * 28 + (probs.xG_away - 1.1) * 20 + (away15Prob - 46) * 0.6 + (awayMom * 12);
    if (probs.xG_away >= 1.45 && away15Prob >= 50 && awayAttack >= 1.1 && awayEdge >= -5) {
      signals.push({ title: `${awayProfile.teamName.toUpperCase()} 1.5 GOL ÜSTÜ`,
        pct: Math.min(80, Math.max(50, away15Prob)),
        odds: parseFloat(Math.max(1.75, Math.min(2.40, (100 / Math.max(44, away15Prob)) * 0.93)).toFixed(2)),
        signal: Math.min(100, Math.max(0, awayGoalSignal)),
        reason: `${awayProfile.teamName} ${probs.xG_away} xG deplasman beklentisi ve ${aStats.avgGoalsScored} sezon ortalamasıyla en az 2 gol potansiyeli.` });
    }

    // K: 3.5 Üst (her iki takım çok gollü)
    const over35Signal = (totalXG - 2.8) * 20 + (avgGoalsCombined - 50) * 0.8 + (probs.pOver35 - 28) * 0.7;
    if (probs.pOver35 >= 30 && totalXG >= 3.0 && homeAttack >= 1.5 && awayAttack >= 1.3) {
      signals.push({ title: "TOPLAM GOL 3.5 ÜST", pct: probs.pOver35,
        odds: parseFloat(Math.max(1.95, Math.min(2.80, (100 / probs.pOver35) * 0.94)).toFixed(2)),
        signal: Math.min(100, Math.max(0, over35Signal)),
        reason: `Çok gollü iki hücum takımı; xG toplamı ${totalXG.toFixed(2)}, iki tarafın sezon gol ortalaması yüksek.` });
    }

    // STEP 3: Fallback
    if (signals.length === 0) {
      if (probs.pHomeWin >= probs.pAwayWin + 10) {
        signals.push({ title: `MAÇ SONUCU 1 (${homeProfile.teamName.toUpperCase()} KAZANIR)`, pct: probs.pHomeWin,
          odds: parseFloat(Math.max(1.62, Math.min(2.20, (100 / probs.pHomeWin) * 0.94)).toFixed(2)), signal: 30,
          reason: `Simülasyon sonuçlarına göre ${homeProfile.teamName} iç sahada en güçlü galibiyet adayı (%${probs.pHomeWin}).` });
      } else if (probs.pAwayWin >= probs.pHomeWin + 10) {
        signals.push({ title: `MAÇ SONUCU 2 (${awayProfile.teamName.toUpperCase()} KAZANIR)`, pct: probs.pAwayWin,
          odds: parseFloat(Math.max(1.72, Math.min(2.55, (100 / probs.pAwayWin) * 0.94)).toFixed(2)), signal: 30,
          reason: `Simülasyon sonuçlarına göre ${awayProfile.teamName} deplasmanda en güçlü galibiyet adayı (%${probs.pAwayWin}).` });
      } else if (probs.pOver25 >= 55) {
        signals.push({ title: "TOPLAM GOL 2.5 ÜST", pct: probs.pOver25,
          odds: parseFloat(Math.max(1.68, Math.min(2.10, (100 / probs.pOver25) * 0.94)).toFixed(2)), signal: 28,
          reason: `xG toplamı ${totalXG.toFixed(2)} ile gollü geçmesi beklenen karşılaşma.` });
      } else {
        signals.push({ title: "TOPLAM GOL 2.5 ALT", pct: 100 - probs.pOver25, odds: 1.80, signal: 25,
          reason: "Dengeli güç ve düşük tempo simülasyonunda 2.5 Alt ihtimali öne çıkıyor." });
      }
    }

    signals.sort((a, b) => b.signal - a.signal);
    const bestPick = signals[0];
    currentAIPick = bestPick;

    const aiBetTitle = document.getElementById("aiBetTitle");
    const aiBankoConfidence = document.getElementById("aiBankoConfidence");
    const aiBankoReason = document.getElementById("aiBankoReason");
    if (aiBetTitle) aiBetTitle.textContent = bestPick.title;
    if (aiBankoConfidence) aiBankoConfidence.textContent = `%${bestPick.pct} GÜVEN`;
    if (aiBankoReason) aiBankoReason.textContent = bestPick.reason;
    if (aiMainProbVal) aiMainProbVal.textContent = `%${bestPick.pct}`;

    updateAIPickCouponBtnState();

    function calcPoisson(lambda, k) {
      let f = 1;
      for (let i = 2; i <= k; i++) f *= i;
      return (Math.pow(lambda, k) * Math.exp(-lambda)) / f;
    }

    function getConsistentScorePrediction(betStr, probsObj) {
      const isUnder25 = betStr.includes("2.5 ALT");
      const isOver35  = betStr.includes("3.5 ÜST");
      const isOver25  = betStr.includes("2.5 ÜST");
      const isHomeWin = betStr.includes("SONUCU 1") || betStr.includes("1-X");
      const isAwayWin = betStr.includes("SONUCU 2") || betStr.includes("X-2");
      const isBtts    = betStr.includes("KG VAR") && !betStr.includes("YOK");

      let goalMode = "auto";
      if (isUnder25) goalMode = "under25";
      else if (isOver35) goalMode = "over35";
      else if (isOver25) goalMode = "over25";
      else if (probsObj.pOver25 < 46 || (probsObj.xG_home + probsObj.xG_away) < 2.2) goalMode = "under25";
      else if (probsObj.pOver25 >= 60 || (probsObj.xG_home + probsObj.xG_away) >= 2.8) goalMode = "over25";

      let bestScore = "", maxProb = -1;
      for (let hg = 0; hg <= 5; hg++) {
        for (let ag = 0; ag <= 5; ag++) {
          const tg = hg + ag;
          if (goalMode === "under25" && tg > 2) continue;
          if (goalMode === "over25" && tg < 3) continue;
          if (goalMode === "over35" && tg < 4) continue;
          if (isBtts && (hg === 0 || ag === 0)) continue;
          let prob = calcPoisson(probsObj.xG_home, hg) * calcPoisson(probsObj.xG_away, ag);
          if (isHomeWin) { if (hg > ag) prob *= 1.4; else if (hg === ag) prob *= 0.8; else prob *= 0.3; }
          if (isAwayWin) { if (ag > hg) prob *= 1.4; else if (hg === ag) prob *= 0.8; else prob *= 0.3; }
          if (prob > maxProb) { maxProb = prob; bestScore = `${hg} - ${ag}`; }
        }
      }
      if (!bestScore) {
        let hg = Math.round(probsObj.xG_home), ag = Math.round(probsObj.xG_away);
        if (goalMode === "under25" && hg + ag > 2) { if (hg > ag) { hg = 1; ag = 0; } else if (ag > hg) { hg = 0; ag = 1; } else { hg = 1; ag = 1; } }
        else if ((goalMode === "over25" || goalMode === "over35") && hg + ag < 3) { if (hg >= ag) { hg = 2; ag = 1; } else { hg = 1; ag = 2; } }
        bestScore = `${hg} - ${ag}`;
      }
      return bestScore;
    }

    const scorePred = getConsistentScorePrediction(bestPick.title, probs);
    const aiScorePrediction = document.getElementById("aiScorePrediction");
    if (aiScorePrediction) aiScorePrediction.textContent = scorePred;

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
          <div class="tactical-card-val">${signalBar}/100</div>
          <div class="tactical-card-desc">İstatistiksel Üstünlük</div>
        </div>
        <div class="tactical-card">
          <div class="tactical-card-title"><i class="fa-solid fa-flag"></i> Beklenen Korner / Kart</div>
          <div class="tactical-card-val">${probs.expCorners} K / ${probs.expCards} Kart</div>
          <div class="tactical-card-desc">Maç Temposu</div>
        </div>
      `;
    }
  }

"""

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '  // AI Prediction Engine 3.0: Single High-Odds Value Prediction'
end_marker = '  // 4. Generate Possible Bets'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print(f'ERROR: markers not found. start={start_idx}, end={end_idx}')
else:
    new_content = content[:start_idx] + NEW_FUNCTION + content[end_idx:]
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('SUCCESS: generateAIPrediction replaced')
    print(f'Old size: {len(content)}, New size: {len(new_content)}')
