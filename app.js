// Application State & Control Engine
document.addEventListener("DOMContentLoaded", () => {
  let selectedCountry = null;
  let homeTeamName = null;
  let awayTeamName = null;
  let homeProfile = null;
  let awayProfile = null;
  let currentPossibleBets = [];

  // DOM Elements
  const countryGrid = document.getElementById("countryGrid");
  const teamsSelectionWrapper = document.getElementById("teamsSelectionWrapper");
  const compareBtn = document.getElementById("compareBtn");

  // Home Custom Dropdown Elements
  const homeDropdown = document.getElementById("homeDropdown");
  const homeDropdownTrigger = document.getElementById("homeDropdownTrigger");
  const homeDropdownMenu = document.getElementById("homeDropdownMenu");
  const homeTriggerLogo = document.getElementById("homeTriggerLogo");
  const homeTriggerLabel = document.getElementById("homeTriggerLabel");
  const homeSearchInput = document.getElementById("homeSearchInput");
  const homeOptionsList = document.getElementById("homeOptionsList");

  // Away Custom Dropdown Elements
  const awayDropdown = document.getElementById("awayDropdown");
  const awayDropdownTrigger = document.getElementById("awayDropdownTrigger");
  const awayDropdownMenu = document.getElementById("awayDropdownMenu");
  const awayTriggerLogo = document.getElementById("awayTriggerLogo");
  const awayTriggerLabel = document.getElementById("awayTriggerLabel");
  const awaySearchInput = document.getElementById("awaySearchInput");
  const awayOptionsList = document.getElementById("awayOptionsList");

  // Results Section Elements
  const resultsSection = document.getElementById("resultsSection");
  const bannerHomeName = document.getElementById("bannerHomeName");
  const bannerAwayName = document.getElementById("bannerAwayName");
  const bannerHomeLogo = document.getElementById("bannerHomeLogo");
  const bannerAwayLogo = document.getElementById("bannerAwayLogo");
  const homeFormStrip = document.getElementById("homeFormStrip");
  const awayFormStrip = document.getElementById("awayFormStrip");
  const bannerLeagueName = document.getElementById("bannerLeagueName");

  const statsList = document.getElementById("statsList");
  const aiPredictBtn = document.getElementById("aiPredictBtn");
  const aiResultCard = document.getElementById("aiResultCard");
  const aiConfidenceValue = document.getElementById("aiConfidenceValue");
  const aiBetTitle = document.getElementById("aiBetTitle");
  const aiScorePrediction = document.getElementById("aiScorePrediction");
  const aiExplanationText = document.getElementById("aiExplanationText");

  const betsGrid = document.getElementById("betsGrid");
  const marketTabs = document.getElementById("marketTabs");

  // New feature elements
  const poissonSection = document.getElementById("poissonSection");
  const poissonGrid = document.getElementById("poissonGrid");
  const poissonLikelyRow = document.getElementById("poissonLikelyRow");
  const downloadAnalysisBtn = document.getElementById("downloadAnalysisBtn");
  const couponPanel = document.getElementById("couponPanel");
  const couponBody = document.getElementById("couponBody");
  const couponItems = document.getElementById("couponItems");
  const couponSummary = document.getElementById("couponSummary");
  const couponCountBadge = document.getElementById("couponCountBadge");
  const couponClearBtn = document.getElementById("couponClearBtn");
  const couponCloseBtn = document.getElementById("couponCloseBtn");
  const couponToggleBody = document.getElementById("couponToggleBody");
  const couponFloatBtn = document.getElementById("couponFloatBtn");
  const couponFloatCount = document.getElementById("couponFloatCount");

  // H2H 2026-2027 Elements
  const h2hSection = document.getElementById("h2hSection");
  const h2hMatchesList = document.getElementById("h2hMatchesList");
  const h2hStatsRow = document.getElementById("h2hStatsRow");
  const h2hSubtitle = document.getElementById("h2hSubtitle");

  // Coupon State
  let couponItems_data = [];
  let h2hProfile = null;
  let couponBodyOpen = true;

  // =============================================
  // Auth UI Management
  // =============================================
  const authModal = document.getElementById('authModal');
  const authModalClose = document.getElementById('authModalClose');
  const headerLoginBtn = document.getElementById('headerLoginBtn');
  const authLoggedOut = document.getElementById('authLoggedOut');
  const authLoggedIn = document.getElementById('authLoggedIn');
  const headerUserEmail = document.getElementById('headerUserEmail');
  const headerLogoutBtn = document.getElementById('headerLogoutBtn');
  const headerFavoritesBtn = document.getElementById('headerFavoritesBtn');
  const headerMyBetsBtn = document.getElementById('headerMyBetsBtn');
  const myBetsCountBadge = document.getElementById('myBetsCountBadge');

  const authTabLogin = document.getElementById('authTabLogin');
  const authTabRegister = document.getElementById('authTabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginMessage = document.getElementById('loginMessage');
  const registerMessage = document.getElementById('registerMessage');

  const favoritesModal = document.getElementById('favoritesModal');
  const favoritesModalClose = document.getElementById('favoritesModalClose');
  const favoritesList = document.getElementById('favoritesList');
  const favoritesEmpty = document.getElementById('favoritesEmpty');

  const myBetsOverlay = document.getElementById('myBetsOverlay');
  const myBetsModalClose = document.getElementById('myBetsModalClose');
  const myBetsGroups = document.getElementById('myBetsGroups');
  const myBetsEmpty = document.getElementById('myBetsEmpty');
  const clearAllMyBets = document.getElementById('clearAllMyBets');

  // Show auth message
  function showAuthMessage(el, msg, isError) {
    el.textContent = msg;
    el.className = `auth-message ${isError ? 'error' : 'success'}`;
    el.classList.remove('hidden');
    setTimeout(() => { if (!isError) el.classList.add('hidden'); }, 4000);
  }

  // Update header based on auth state
  function updateAuthUI() {
    if (AuthManager.isLoggedIn()) {
      authLoggedOut.classList.add('hidden');
      authLoggedIn.classList.remove('hidden');
      headerUserEmail.textContent = AuthManager.getCurrentUser();
      updateMyBetsCount();
    } else {
      authLoggedOut.classList.remove('hidden');
      authLoggedIn.classList.add('hidden');
    }
  }

  function updateMyBetsCount() {
    const count = AuthManager.getMyBets().length;
    myBetsCountBadge.textContent = count;
    if (count > 0) {
      myBetsCountBadge.classList.remove('hidden');
    } else {
      myBetsCountBadge.classList.add('hidden');
    }
  }

  // Open auth modal
  headerLoginBtn.addEventListener('click', () => {
    authModal.classList.remove('hidden');
    loginMessage.classList.add('hidden');
    registerMessage.classList.add('hidden');
  });

  // Close auth modal
  authModalClose.addEventListener('click', () => authModal.classList.add('hidden'));
  authModal.addEventListener('click', (e) => { if (e.target === authModal) authModal.classList.add('hidden'); });

  // Auth tab switching
  authTabLogin.addEventListener('click', () => {
    authTabLogin.classList.add('active');
    authTabRegister.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  });
  authTabRegister.addEventListener('click', () => {
    authTabRegister.classList.add('active');
    authTabLogin.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });

  // Login submit
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const result = AuthManager.login(email, password);
    if (result.success) {
      showAuthMessage(loginMessage, result.message, false);
      setTimeout(() => {
        authModal.classList.add('hidden');
        updateAuthUI();
        refreshFavoriteStars();
      }, 800);
    } else {
      showAuthMessage(loginMessage, result.message, true);
    }
  });

  // Register submit
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerPasswordConfirm').value;
    const result = AuthManager.register(email, password, confirm);
    if (result.success) {
      showAuthMessage(registerMessage, result.message, false);
      setTimeout(() => {
        authModal.classList.add('hidden');
        updateAuthUI();
        refreshFavoriteStars();
      }, 800);
    } else {
      showAuthMessage(registerMessage, result.message, true);
    }
  });

  // Logout
  headerLogoutBtn.addEventListener('click', () => {
    AuthManager.logout();
    updateAuthUI();
    refreshFavoriteStars();
  });

  // Favorites modal
  headerFavoritesBtn.addEventListener('click', () => {
    renderFavoritesModal();
    favoritesModal.classList.remove('hidden');
  });
  favoritesModalClose.addEventListener('click', () => favoritesModal.classList.add('hidden'));
  favoritesModal.addEventListener('click', (e) => { if (e.target === favoritesModal) favoritesModal.classList.add('hidden'); });

  // My Bets modal
  headerMyBetsBtn.addEventListener('click', () => {
    renderMyBetsModal();
    myBetsOverlay.classList.remove('hidden');
  });
  myBetsModalClose.addEventListener('click', () => myBetsOverlay.classList.add('hidden'));
  myBetsOverlay.addEventListener('click', (e) => { if (e.target === myBetsOverlay) myBetsOverlay.classList.add('hidden'); });

  // Clear all my bets
  clearAllMyBets.addEventListener('click', () => {
    AuthManager.clearAllBets();
    renderMyBetsModal();
    updateMyBetsCount();
  });

  // =============================================
  // Favorites Modal Renderer
  // =============================================
  function renderFavoritesModal() {
    const favs = AuthManager.getFavorites();
    favoritesList.innerHTML = '';

    if (favs.length === 0) {
      favoritesEmpty.classList.remove('hidden');
      return;
    }
    favoritesEmpty.classList.add('hidden');

    favs.forEach(fav => {
      const logoUrl = getTeamLogoUrl(fav.name, fav.countryCode);
      const fallbackUrl = createFallbackSvgDataUrl(fav.name);
      const item = document.createElement('div');
      item.className = 'favorite-item';
      item.innerHTML = `
        <div class="favorite-item-info">
          <img src="${logoUrl}" alt="${fav.name}" class="favorite-logo" onerror="this.onerror=null; this.src='${fallbackUrl}';">
          <div>
            <span class="favorite-team-name">${fav.name}</span>
            <span class="favorite-country">${fav.countryName || ''}</span>
          </div>
        </div>
        <button class="favorite-remove-btn" title="Favorilerden Kaldır">
          <i class="fa-solid fa-star"></i>
        </button>
      `;
      item.querySelector('.favorite-remove-btn').addEventListener('click', () => {
        AuthManager.removeFavorite(fav.name);
        renderFavoritesModal();
        refreshFavoriteStars();
      });
      favoritesList.appendChild(item);
    });
  }

  // =============================================
  // My Bets Modal Renderer
  // =============================================
  function renderMyBetsModal() {
    const grouped = AuthManager.getMyBetsGrouped();
    const keys = Object.keys(grouped);
    myBetsGroups.innerHTML = '';

    if (keys.length === 0) {
      myBetsEmpty.classList.remove('hidden');
      clearAllMyBets.classList.add('hidden');
      return;
    }
    myBetsEmpty.classList.add('hidden');
    clearAllMyBets.classList.remove('hidden');

    keys.forEach(matchKey => {
      const group = grouped[matchKey];
      const homeLogoUrl = getTeamLogoUrl(group.homeTeam, '');
      const awayLogoUrl = getTeamLogoUrl(group.awayTeam, '');
      const homeFallback = createFallbackSvgDataUrl(group.homeTeam);
      const awayFallback = createFallbackSvgDataUrl(group.awayTeam);

      const groupEl = document.createElement('div');
      groupEl.className = 'mybets-match-group';
      groupEl.innerHTML = `
        <div class="mybets-match-header">
          <div class="mybets-match-teams">
            <img src="${homeLogoUrl}" alt="${group.homeTeam}" class="mybets-team-logo" onerror="this.onerror=null; this.src='${homeFallback}';">
            <span class="mybets-team-name">${group.homeTeam}</span>
            <span class="mybets-vs">VS</span>
            <span class="mybets-team-name">${group.awayTeam}</span>
            <img src="${awayLogoUrl}" alt="${group.awayTeam}" class="mybets-team-logo" onerror="this.onerror=null; this.src='${awayFallback}';">
          </div>
          <span class="mybets-match-country">${group.country || ''}</span>
        </div>
        <div class="mybets-bet-items"></div>
      `;

      const itemsContainer = groupEl.querySelector('.mybets-bet-items');
      group.bets.forEach(bet => {
        const betEl = document.createElement('div');
        betEl.className = 'mybets-bet-item';
        betEl.innerHTML = `
          <div class="mybets-bet-info">
            <span class="bet-category cat-${bet.category}">${bet.category}</span>
            <span class="mybets-bet-name">${bet.betName}</span>
          </div>
          <div class="mybets-bet-right">
            <span class="mybets-bet-pct">%${bet.pct}</span>
            <button class="mybets-remove-btn" title="Kaldır"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `;
        betEl.querySelector('.mybets-remove-btn').addEventListener('click', () => {
          AuthManager.removeBet(bet.betId);
          renderMyBetsModal();
          updateMyBetsCount();
        });
        itemsContainer.appendChild(betEl);
      });

      myBetsGroups.appendChild(groupEl);
    });
  }

  // Refresh all favorite stars in dropdown (called after login/logout/toggle)
  function refreshFavoriteStars() {
    document.querySelectorAll('.fav-star-btn').forEach(btn => {
      const team = btn.dataset.team;
      const isFav = AuthManager.isLoggedIn() && AuthManager.isFavorite(team);
      btn.innerHTML = isFav
        ? '<i class="fa-solid fa-star"></i>'
        : '<i class="fa-regular fa-star"></i>';
      btn.classList.toggle('is-favorite', isFav);
    });
  }


  // Helper to generate SVG badge data URL for teams without physical png
  function createFallbackSvgDataUrl(teamName) {
    const initials = teamName.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#7928ca"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#g)"/>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Outfit, sans-serif" font-weight="900" font-size="22">${initials}</text>
    </svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  // 1. Render Country Cards (ONLY Country Name and Flag - NO League Text)
  function initCountryGrid() {
    countryGrid.innerHTML = "";
    FOOTBALL_DATA.countries.forEach(country => {
      const card = document.createElement("div");
      card.className = "country-card";
      card.dataset.id = country.id;

      card.innerHTML = `
        <img src="${country.flag}" alt="${country.name}" class="country-flag" onerror="this.src='https://via.placeholder.com/32?text=${country.id}'">
        <div class="country-info">
          <strong class="country-name">${country.name}</strong>
        </div>
      `;

      card.addEventListener("click", () => selectCountry(country));
      countryGrid.appendChild(card);
    });
  }

  // Select Country Logic
  function selectCountry(country) {
    selectedCountry = country;
    homeTeamName = null;
    awayTeamName = null;

    // Highlight Active Card
    document.querySelectorAll(".country-card").forEach(c => c.classList.remove("active"));
    const activeCard = document.querySelector(`.country-card[data-id="${country.id}"]`);
    if (activeCard) activeCard.classList.add("active");

    // Populate Custom Dropdowns with Logos
    populateDropdownOptions("home", country);
    populateDropdownOptions("away", country);

    // Reset Triggers
    resetDropdownTrigger("home");
    resetDropdownTrigger("away");

    // Reveal Team Selection Section
    teamsSelectionWrapper.classList.remove("hidden");
    teamsSelectionWrapper.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Reset Results
    resultsSection.classList.add("hidden");
    compareBtn.disabled = true;
  }

  function resetDropdownTrigger(type) {
    if (type === "home") {
      homeTriggerLabel.textContent = "Ev Sahibi Takımı Seçin...";
      homeTriggerLogo.innerHTML = `<i class="fa-solid fa-shield-halved fallback-icon"></i>`;
    } else {
      awayTriggerLabel.textContent = "Deplasman Takımını Seçin...";
      awayTriggerLogo.innerHTML = `<i class="fa-solid fa-shield-halved fallback-icon"></i>`;
    }
  }

  // Populate Custom Logo Options inside Dropdown List
  function populateDropdownOptions(type, country) {
    const list = type === "home" ? homeOptionsList : awayOptionsList;
    list.innerHTML = "";

    country.teams.forEach(teamName => {
      const item = document.createElement("div");
      item.className = "dropdown-option-item";
      item.dataset.team = teamName;

      const logoUrl = getTeamLogoUrl(teamName, country.code);
      const fallbackUrl = createFallbackSvgDataUrl(teamName);

      const isFav = AuthManager.isLoggedIn() && AuthManager.isFavorite(teamName);

      item.innerHTML = `
        <img src="${logoUrl}" alt="${teamName}" class="option-logo" onerror="this.onerror=null; this.src='${fallbackUrl}';">
        <span class="option-name">${teamName}</span>
        <button class="fav-star-btn ${isFav ? 'is-favorite' : ''}" data-team="${teamName}" data-country-code="${country.code}" data-country-name="${country.name}" title="Favorilere Ekle/Çıkar">
          <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-star"></i>
        </button>
      `;

      // Team selection click (excluding star button)
      item.addEventListener("click", (e) => {
        if (e.target.closest('.fav-star-btn')) return;
        e.stopPropagation();
        selectTeamOption(type, teamName, logoUrl);
      });

      // Star button click
      const starBtn = item.querySelector('.fav-star-btn');
      starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!AuthManager.isLoggedIn()) {
          authModal.classList.remove('hidden');
          return;
        }
        AuthManager.toggleFavorite(teamName, country.code, country.name);
        refreshFavoriteStars();
      });

      list.appendChild(item);
    });
  }

  function selectTeamOption(type, teamName, logoUrl) {
    const fallbackUrl = createFallbackSvgDataUrl(teamName);
    
    if (type === "home") {
      homeTeamName = teamName;
      homeTriggerLabel.textContent = teamName;
      homeTriggerLogo.innerHTML = `<img src="${logoUrl}" alt="${teamName}" style="width:28px;height:28px;object-fit:contain;" onerror="this.onerror=null; this.src='${fallbackUrl}';">`;
      homeDropdown.classList.remove("open");
      homeDropdownMenu.classList.add("hidden");
    } else {
      awayTeamName = teamName;
      awayTriggerLabel.textContent = teamName;
      awayTriggerLogo.innerHTML = `<img src="${logoUrl}" alt="${teamName}" style="width:28px;height:28px;object-fit:contain;" onerror="this.onerror=null; this.src='${fallbackUrl}';">`;
      awayDropdown.classList.remove("open");
      awayDropdownMenu.classList.add("hidden");
    }

    checkCanCompare();
  }

  // Toggle Dropdown Menu
  homeDropdownTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    awayDropdown.classList.remove("open");
    awayDropdownMenu.classList.add("hidden");

    homeDropdown.classList.toggle("open");
    homeDropdownMenu.classList.toggle("hidden");
    if (!homeDropdownMenu.classList.contains("hidden")) {
      homeSearchInput.focus();
    }
  });

  awayDropdownTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    homeDropdown.classList.remove("open");
    homeDropdownMenu.classList.add("hidden");

    awayDropdown.classList.toggle("open");
    awayDropdownMenu.classList.toggle("hidden");
    if (!awayDropdownMenu.classList.contains("hidden")) {
      awaySearchInput.focus();
    }
  });

  // Search Filter in Dropdowns
  homeSearchInput.addEventListener("input", (e) => filterOptions("home", e.target.value));
  awaySearchInput.addEventListener("input", (e) => filterOptions("away", e.target.value));

  function filterOptions(type, query) {
    const list = type === "home" ? homeOptionsList : awayOptionsList;
    const items = list.querySelectorAll(".dropdown-option-item");
    const q = query.toLowerCase();

    items.forEach(item => {
      const name = item.dataset.team.toLowerCase();
      item.style.display = name.includes(q) ? "flex" : "none";
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (!homeDropdown.contains(e.target)) {
      homeDropdown.classList.remove("open");
      homeDropdownMenu.classList.add("hidden");
    }
    if (!awayDropdown.contains(e.target)) {
      awayDropdown.classList.remove("open");
      awayDropdownMenu.classList.add("hidden");
    }
  });

  function checkCanCompare() {
    compareBtn.disabled = !(homeTeamName && awayTeamName && homeTeamName !== awayTeamName);
  }

  // 2. Compare Button Trigger
  compareBtn.addEventListener("click", () => {
    homeProfile = generateTeamProfile(homeTeamName, selectedCountry.code);
    awayProfile = generateTeamProfile(awayTeamName, selectedCountry.code);
    h2hProfile = generateH2HProfile(homeTeamName, awayTeamName);

    renderComparisonResults();
    resultsSection.classList.remove("hidden");
    aiResultCard.classList.add("hidden");
    poissonSection.classList.add("hidden");
    resultsSection.scrollIntoView({ behavior: "smooth" });
  });

  // Render Comparison Dashboard
  function renderComparisonResults() {
    // Banner Data
    bannerHomeName.textContent = homeProfile.teamName;
    bannerAwayName.textContent = awayProfile.teamName;
    bannerLeagueName.textContent = selectedCountry.name.toUpperCase();

    const homeLogoUrl = getTeamLogoUrl(homeProfile.teamName, selectedCountry.code);
    const awayLogoUrl = getTeamLogoUrl(awayProfile.teamName, selectedCountry.code);

    bannerHomeLogo.src = homeLogoUrl;
    bannerAwayLogo.src = awayLogoUrl;

    bannerHomeLogo.onerror = () => { bannerHomeLogo.src = createFallbackSvgDataUrl(homeProfile.teamName); };
    bannerAwayLogo.onerror = () => { bannerAwayLogo.src = createFallbackSvgDataUrl(awayProfile.teamName); };

    // Form Strips
    renderFormStrip(homeFormStrip, homeProfile.matches);
    renderFormStrip(awayFormStrip, awayProfile.matches);

    // Detailed Stats Rows
    renderStatsList();

    // H2H Section
    renderH2HSection();

    // Generate Possible Bets
    generatePossibleBets();
  }

  function renderFormStrip(container, matches) {
    container.innerHTML = "";
    if (!matches || matches.length === 0) {
      container.innerHTML = `<span style="font-size:11px;color:var(--text-muted);">2026-2027 maç kaydı yok</span>`;
      return;
    }
    matches.forEach(m => {
      const badge = document.createElement("span");
      badge.className = `form-badge ${m.result}`;
      badge.textContent = m.result;
      badge.title = `${m.isHome ? 'Ev' : 'Dep'} (${m.date || '2026/27'}): ${m.score} vs ${m.opponent}`;
      container.appendChild(badge);
    });
  }

  // Render 2026-2027 H2H Section
  function renderH2HSection() {
    if (!h2hProfile || !h2hMatchesList || !h2hStatsRow) return;

    if (!h2hProfile.hasH2HIn2627 || h2hProfile.matches.length === 0) {
      if (h2hSubtitle) h2hSubtitle.textContent = "2026-2027 sezonunda bu iki takım henüz birbiriyle karşılaşmadı.";
      h2hMatchesList.innerHTML = `
        <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border-glass); border-radius: 8px;">
          <i class="fa-solid fa-circle-info" style="color: var(--accent-cyan); margin-right: 6px;"></i>
          2026-2027 Sezonunda doğrudan H2H müsabakası henüz oynanmamıştır.
        </div>
      `;
      h2hStatsRow.innerHTML = "";
      return;
    }

    if (h2hSubtitle) h2hSubtitle.textContent = `2026-2027 Sezonunda Toplam ${h2hProfile.matches.length} Müsabaka Oynandı`;

    h2hMatchesList.innerHTML = "";
    h2hProfile.matches.forEach(m => {
      const row = document.createElement("div");
      row.className = "h2h-match-row";
      
      let resText = "Berabere";
      let resClass = "h2h-draw";
      if (m.result === 'H') { resText = `${homeProfile.teamName} Kazandı`; resClass = "h2h-home-win"; }
      else if (m.result === 'A') { resText = `${awayProfile.teamName} Kazandı`; resClass = "h2h-away-win"; }

      row.innerHTML = `
        <div class="h2h-season">${m.date || '26/27'}</div>
        <div class="h2h-home-label">${homeProfile.teamName}</div>
        <div class="h2h-score-bubble ${resClass}">${m.score}</div>
        <div class="h2h-away-label">${awayProfile.teamName}</div>
        <div class="h2h-result-pill ${resClass}">${resText}</div>
      `;
      h2hMatchesList.appendChild(row);
    });

    h2hStatsRow.innerHTML = `
      <div class="h2h-stat-item">
        <div class="h2h-stat-val" style="color: var(--accent-cyan);">${h2hProfile.homeWins}</div>
        <div class="h2h-stat-lbl">${homeProfile.teamName} Galibiyet</div>
      </div>
      <div class="h2h-stat-item">
        <div class="h2h-stat-val" style="color: var(--accent-amber);">${h2hProfile.draws}</div>
        <div class="h2h-stat-lbl">Beraberlik</div>
      </div>
      <div class="h2h-stat-item">
        <div class="h2h-stat-val" style="color: var(--accent-crimson);">${h2hProfile.awayWins}</div>
        <div class="h2h-stat-lbl">${awayProfile.teamName} Galibiyet</div>
      </div>
      <div class="h2h-stat-item">
        <div class="h2h-stat-val">${h2hProfile.avgTotalGoals}</div>
        <div class="h2h-stat-lbl">Ortalama Gol</div>
      </div>
      <div class="h2h-stat-item">
        <div class="h2h-stat-val">%${h2hProfile.bttsPct}</div>
        <div class="h2h-stat-lbl">2026/27 H2H KG Var</div>
      </div>
      <div class="h2h-stat-item">
        <div class="h2h-stat-val">%${h2hProfile.over25Pct}</div>
        <div class="h2h-stat-lbl">2026/27 H2H 2.5 Üst</div>
      </div>
    `;
  }

  // Render Line-by-Line Stats
  function renderStatsList() {
    const hStats = homeProfile.stats;
    const aStats = awayProfile.stats;

    const metrics = [
      {
        title: "2026-2027 Sezonu Atılan Gol Ortalaması",
        homeVal: hStats.avgGoalsScored,
        awayVal: aStats.avgGoalsScored,
        unit: " Gol/Maç"
      },
      {
        title: "2026-2027 Sezonu Yenilen Gol Ortalaması",
        homeVal: hStats.avgGoalsConceded,
        awayVal: aStats.avgGoalsConceded,
        unit: " Gol/Maç"
      },
      {
        title: "2026-2027 Toplam Şut Ortalaması",
        homeVal: hStats.avgShots,
        awayVal: aStats.avgShots,
        unit: " Şut"
      },
      {
        title: "İsabetli Şut Ortalaması & İsabet Oranı",
        homeVal: `${hStats.avgShotsOnTarget} (%${hStats.shotAccuracyPct})`,
        awayVal: `${aStats.avgShotsOnTarget} (%${aStats.shotAccuracyPct})`,
        rawHome: parseFloat(hStats.avgShotsOnTarget),
        rawAway: parseFloat(aStats.avgShotsOnTarget)
      },
      {
        title: "2026-2027 Toplam Korner Ortalaması",
        homeVal: hStats.avgCorners,
        awayVal: aStats.avgCorners,
        unit: " Korner"
      },
      {
        title: "2026-2027 Toplam Sarı Kart Ortalaması",
        homeVal: hStats.avgYellowCards,
        awayVal: aStats.avgYellowCards,
        unit: " Kart/Maç"
      },
      {
        title: "2026-2027 Sezonundaki Kırmızı Kart Sayısı",
        homeVal: hStats.totalRedCardsIn5,
        awayVal: aStats.totalRedCardsIn5,
        unit: " Adet"
      },
      {
        title: "Karşılıklı Gol Var (KG Var) Yüzdesi",
        homeVal: `%${hStats.bttsPct}`,
        awayVal: `%${aStats.bttsPct}`,
        rawHome: hStats.bttsPct,
        rawAway: aStats.bttsPct
      },
      {
        title: "2.5 Üst Gol Yüzdesi",
        homeVal: `%${hStats.over25Pct}`,
        awayVal: `%${aStats.over25Pct}`,
        rawHome: hStats.over25Pct,
        rawAway: aStats.over25Pct
      }
    ];

    statsList.innerHTML = "";
    metrics.forEach(m => {
      const hNum = m.rawHome !== undefined ? m.rawHome : parseFloat(m.homeVal);
      const aNum = m.rawAway !== undefined ? m.rawAway : parseFloat(m.awayVal);
      const total = (hNum + aNum) || 1;
      const hPct = Math.round((hNum / total) * 100);
      const aPct = 100 - hPct;

      const row = document.createElement("div");
      row.className = "stat-row";
      row.innerHTML = `
        <div class="stat-label-bar">
          <span class="home-val">${m.homeVal}${m.unit || ''}</span>
          <span class="stat-title">${m.title}</span>
          <span class="away-val">${m.awayVal}${m.unit || ''}</span>
        </div>
        <div class="stat-progress-track">
          <div class="home-fill" style="width: ${hPct}%"></div>
          <div class="away-fill" style="width: ${aPct}%"></div>
        </div>
      `;
      statsList.appendChild(row);
    });
  }

  // 3. AI Prediction Button Trigger
  aiPredictBtn.addEventListener("click", () => {
    generateAIPrediction();
    generatePoissonMatrix();
    aiResultCard.classList.remove("hidden");
    poissonSection.classList.remove("hidden");
    aiResultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  // =============================================
  // Poisson Distribution Score Matrix
  // =============================================
  function poissonProbability(lambda, k) {
    // P(X=k) = e^(-lambda) * lambda^k / k!
    let logProb = -lambda + k * Math.log(lambda);
    let logFactorial = 0;
    for (let i = 1; i <= k; i++) logFactorial += Math.log(i);
    return Math.exp(logProb - logFactorial);
  }

  function generatePoissonMatrix() {
    const h = homeProfile.stats;
    const a = awayProfile.stats;

    // Expected goals (λ) using attack/defence strength
    const lambdaHome = (parseFloat(h.avgGoalsScored) + parseFloat(a.avgGoalsConceded)) / 2;
    const lambdaAway = (parseFloat(a.avgGoalsScored) + parseFloat(h.avgGoalsConceded)) / 2;

    const maxGoals = 5;
    const scorelines = [];

    for (let hg = 0; hg <= maxGoals; hg++) {
      for (let ag = 0; ag <= maxGoals; ag++) {
        const prob = poissonProbability(lambdaHome, hg) * poissonProbability(lambdaAway, ag);
        scorelines.push({ hg, ag, prob, label: `${hg}-${ag}` });
      }
    }

    scorelines.sort((a, b) => b.prob - a.prob);
    const top9 = scorelines.slice(0, 9);
    const maxProb = top9[0].prob;

    // Render grid (top 9)
    poissonGrid.innerHTML = '';
    top9.forEach((sc, idx) => {
      const pct = Math.round(sc.prob * 100 * 10) / 10; // 1 decimal
      const intensity = sc.prob / maxProb;
      const card = document.createElement('div');
      card.className = `poisson-card rank-${idx}`;
      card.style.setProperty('--intensity', intensity);
      card.innerHTML = `
        <div class="poisson-rank">#${idx + 1}</div>
        <div class="poisson-score">${sc.label}</div>
        <div class="poisson-pct">%${pct}</div>
        <div class="poisson-bar-wrap">
          <div class="poisson-bar" style="width:${Math.round(intensity * 100)}%"></div>
        </div>
      `;
      poissonGrid.appendChild(card);
    });

    // Most likely scoreline pills (top 3)
    poissonLikelyRow.innerHTML = `
      <div class="poisson-likely-label">En Olası Skorlar:</div>
      ${top9.slice(0, 3).map((sc, i) => `
        <div class="poisson-likely-pill rank-pill-${i}">
          <span class="likely-score">${sc.label}</span>
          <span class="likely-pct">%${Math.round(sc.prob * 1000) / 10}</span>
        </div>
      `).join('')}
    `;
  }

  function generateAIPrediction() {
    const h = homeProfile.stats;
    const a = awayProfile.stats;

    const expHomeGoals = (parseFloat(h.avgGoalsScored) + parseFloat(a.avgGoalsConceded)) / 2;
    const expAwayGoals = (parseFloat(a.avgGoalsScored) + parseFloat(h.avgGoalsConceded)) / 2;
    const totalExpGoals = expHomeGoals + expAwayGoals;

    const expCorners = parseFloat(h.avgCorners) + parseFloat(a.avgCorners);
    const expCards = parseFloat(h.avgYellowCards) + parseFloat(a.avgYellowCards);
    const avgBtts = (h.bttsPct + a.bttsPct) / 2;

    let bestBet = "";
    let confidence = 85;
    let scorePred = "";
    let explanation = "";

    // Mathematical decision tree for unique match bets
    if (avgBtts >= 65 && totalExpGoals >= 2.4) {
      bestBet = "KG VAR & 2.5 GOL ÜSTÜ";
      confidence = Math.min(94, Math.round(avgBtts * 1.05));
      scorePred = `${Math.max(1, Math.round(expHomeGoals))} - ${Math.max(1, Math.round(expAwayGoals))}`;
      explanation = `2026-2027 Sezonunda ev sahibi ${homeProfile.teamName} (Maç başı gol ort.: ${h.avgGoalsScored}) ve Deplasman ${awayProfile.teamName} (Maç başı gol ort.: ${a.avgGoalsScored}) yüksek bir hücum performansı sergilemektedir. İki takımın 2026-2027 sezonu KG Var oranı %${avgBtts.toFixed(0)} seviyesindedir. Tempolu ve karşılıklı gollerin olacağı 2.5 Üst bir müsabaka beklenmektedir.`;
    } else if (expCards >= 4.6) {
      bestBet = "ÜST 4.5 SARI KART";
      confidence = Math.min(92, Math.round(expCards * 16));
      scorePred = expHomeGoals > expAwayGoals ? "2 - 1" : "1 - 1";
      explanation = `2026-2027 Sezonu verilerine göre her iki takımın kart ortalaması oldukça yüksektir. Ev sahibi maç başına ortalama ${h.avgYellowCards}, deplasman ise ${a.avgYellowCards} sarı kart görmektedir. Toplam beklenen kart sayısı ${expCards.toFixed(1)} olup yüksek tempolu ve sert bir karşılaşma öngörülmektedir.`;
    } else if (h.winPct >= 60 && parseFloat(h.avgGoalsScored) > 1.8) {
      bestBet = `MAÇ SONUCU 1 (${homeProfile.teamName.toUpperCase()} KAZANIR)`;
      confidence = Math.min(90, h.winPct + 15);
      scorePred = "2 - 0";
      explanation = `2026-2027 Sezonunda ${homeProfile.teamName} kendi sahasında %${h.winPct} galibiyet oranına ve maç başına ${h.avgShotsOnTarget} isabetli şut ortalamasına sahip. Deplasman ekibinin savunma zaafları göz önüne alındığında ev sahibi galibiyeti öne çıkmaktadır.`;
    } else if (expCorners >= 9.8) {
      bestBet = "ÜST 9.5 KORNER";
      confidence = Math.min(91, Math.round(expCorners * 8.8));
      scorePred = "2 - 1";
      explanation = `2026-2027 Sezonu verilerinde ev sahibi ortalama ${h.avgCorners}, deplasman ise ${a.avgCorners} korner kullanmaktadır. Toplam ${expCorners.toFixed(1)} korner beklentisi ile korner bahsi en yüksek olasılıktır.`;
    } else {
      bestBet = "TOPLAM GOL 2.5 ALT";
      confidence = 82;
      scorePred = "1 - 0";
      explanation = `2026-2027 Sezonundaki maç performanslarına göre iki takımın da gol ortalaması düşük seyretmektedir (Ev ort.: ${h.avgGoalsScored}, Dep ort.: ${a.avgGoalsScored}). Katı savunma ve dengeli mücadele nedeniyle 2.5 Alt bahsi öne çıkmaktadır.`;
    }

    aiBetTitle.textContent = bestBet;
    aiConfidenceValue.textContent = `%${confidence}`;
    aiScorePrediction.textContent = scorePred;
    aiExplanationText.textContent = explanation;
  }

  // 4. Generate Possible Bets (Olası Bahisler)
  function generatePossibleBets() {
    const h = homeProfile.stats;
    const a = awayProfile.stats;

    const expHomeGoals = (parseFloat(h.avgGoalsScored) + parseFloat(a.avgGoalsConceded)) / 2;
    const expAwayGoals = (parseFloat(a.avgGoalsScored) + parseFloat(h.avgGoalsConceded)) / 2;
    const totalGoalsExp = expHomeGoals + expAwayGoals;
    const expCorners = parseFloat(h.avgCorners) + parseFloat(a.avgCorners);
    const expCards = parseFloat(h.avgYellowCards) + parseFloat(a.avgYellowCards);

    // H2H boost adjustments
    const h2hBttsBoost = h2hProfile ? Math.round((h2hProfile.bttsPct - 50) / 10) : 0;
    const h2hOver25Boost = h2hProfile ? Math.round((h2hProfile.over25Pct - 50) / 10) : 0;

    currentPossibleBets = [
      {
        category: "gol",
        name: "Karşılıklı Gol Var (KG Var)",
        pct: Math.min(95, Math.max(35, Math.round((h.bttsPct + a.bttsPct) / 2) + h2hBttsBoost)),
        reason: `Ev sahibi son 5 maçın %${h.bttsPct}'inde, deplasman %${a.bttsPct}'inde karşılıklı gol buldu.${h2hProfile ? ` H2H KG Var: %${h2hProfile.bttsPct}.` : ''}`
      },
      {
        category: "gol",
        name: "Toplam Gol 1.5 Üst",
        pct: Math.min(98, Math.max(50, Math.round(totalGoalsExp * 32))),
        reason: `Maç başı beklenen toplam gol sayısı ${totalGoalsExp.toFixed(1)}.`
      },
      {
        category: "gol",
        name: "Toplam Gol 2.5 Üst",
        pct: Math.min(94, Math.max(25, Math.round((h.over25Pct + a.over25Pct) / 2) + h2hOver25Boost)),
        reason: `Ev sahibi %${h.over25Pct}, deplasman %${a.over25Pct} oranında 2.5 Üst bitirdi.${h2hProfile ? ` H2H 2.5 Üst: %${h2hProfile.over25Pct}.` : ''}`
      },
      {
        category: "kart",
        name: "Toplam Sarı Kart 3.5 Üst",
        pct: Math.min(96, Math.max(40, Math.round(expCards * 18.5))),
        reason: `İki takımın son 5 maç toplam sarı kart ortalaması ${expCards.toFixed(1)}.`
      },
      {
        category: "kart",
        name: "Toplam Sarı Kart 4.5 Üst",
        pct: Math.min(92, Math.max(30, Math.round(expCards * 14.5))),
        reason: `Takımların agresiflik indeksi yüksek seviyede.`
      },
      {
        category: "korner",
        name: "Toplam Korner 8.5 Üst",
        pct: Math.min(95, Math.max(45, Math.round(expCorners * 9.2))),
        reason: `Toplam beklenen korner sayısı ${expCorners.toFixed(1)}.`
      },
      {
        category: "korner",
        name: "Toplam Korner 9.5 Üst",
        pct: Math.min(90, Math.max(35, Math.round(expCorners * 8.2))),
        reason: `Kanat hücumları ve yüksek şut temposu.`
      },
      {
        category: "taraf",
        name: `Çifte Şans 1-X (${homeProfile.teamName})`,
        pct: Math.min(95, Math.max(40, Math.round(h.winPct + 35))),
        reason: `Ev sahibi son 5 maçta %${h.winPct} galibiyet oranına sahip.`
      },
      {
        category: "taraf",
        name: `Maç Sonucu 1 (${homeProfile.teamName})`,
        pct: Math.min(88, Math.max(30, Math.round(h.winPct * 1.15))),
        reason: `Saha mekanı avantajı ile yüksek iç saha performansı.`
      },
      {
        category: "taraf",
        name: `Çifte Şans X-2 (${awayProfile.teamName})`,
        pct: Math.min(92, Math.max(35, Math.round(a.winPct + 30))),
        reason: `Deplasman ekibinin son 5 maçlık direnç seviyesi.`
      }
    ];

    // Sort by probability percentage descending
    currentPossibleBets.sort((a, b) => b.pct - a.pct);

    renderBetsGrid("all");
  }

  function renderBetsGrid(filter) {
    betsGrid.innerHTML = "";

    const filtered = filter === "all" 
      ? currentPossibleBets 
      : currentPossibleBets.filter(b => b.category === filter);

    filtered.forEach(bet => {
      const card = document.createElement("div");
      card.className = "bet-card";

      let statusClass = "prob-high";
      let fillClass = "prob-high-fill";
      if (bet.pct < 65) {
        statusClass = "prob-low";
        fillClass = "prob-low-fill";
      } else if (bet.pct < 80) {
        statusClass = "prob-med";
        fillClass = "prob-med-fill";
      }

      const isInCoupon = couponItems_data.some(c => c.name === bet.name);

      // Check if already saved in MyBets
      const betId = `${homeTeamName}_${awayTeamName}_${bet.name}`;
      const isSaved = AuthManager.isLoggedIn() && AuthManager.getMyBets().some(b => b.betId === betId);

      card.innerHTML = `
        <div>
          <div class="bet-card-top">
            <span class="bet-category cat-${bet.category}">${bet.category}</span>
            <span class="probability-badge ${statusClass}">%${bet.pct}</span>
          </div>
          <div class="bet-name">${bet.name}</div>
        </div>

        <div>
          <div class="probability-bar-track">
            <div class="probability-bar-fill ${fillClass}" style="width: ${bet.pct}%"></div>
          </div>
          <div class="bet-reason">${bet.reason}</div>
          <div class="bet-card-actions">
            <button class="btn-add-coupon ${isInCoupon ? 'in-coupon' : ''}" data-betname="${encodeURIComponent(bet.name)}" data-pct="${bet.pct}" data-cat="${bet.category}">
              <i class="fa-solid ${isInCoupon ? 'fa-check' : 'fa-plus'}"></i>
              ${isInCoupon ? 'Kuponda' : 'Kupona Ekle'}
            </button>
            <button class="btn-save-mybet ${isSaved ? 'is-saved' : ''}" data-betname="${encodeURIComponent(bet.name)}" data-pct="${bet.pct}" data-cat="${bet.category}">
              <i class="fa-solid ${isSaved ? 'fa-bookmark' : 'fa-bookmark'}"></i>
              ${isSaved ? 'Kaydedildi' : 'Bahislerime Kaydet'}
            </button>
          </div>
        </div>
      `;

      // Coupon add button
      const addBtn = card.querySelector('.btn-add-coupon');
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = decodeURIComponent(addBtn.dataset.betname);
        const pct = parseInt(addBtn.dataset.pct);
        const cat = addBtn.dataset.cat;
        toggleCouponItem({ name, pct, category: cat });
      });

      // My Bets save button
      const saveBtn = card.querySelector('.btn-save-mybet');
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!AuthManager.isLoggedIn()) {
          authModal.classList.remove('hidden');
          return;
        }
        const name = decodeURIComponent(saveBtn.dataset.betname);
        const pct = parseInt(saveBtn.dataset.pct);
        const cat = saveBtn.dataset.cat;
        const result = AuthManager.addBet({
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          country: selectedCountry ? selectedCountry.name : '',
          betName: name,
          pct: pct,
          category: cat
        });
        if (result.success) {
          saveBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Kaydedildi';
          saveBtn.classList.add('is-saved');
          updateMyBetsCount();
        }
      });

      betsGrid.appendChild(card);
    });
  }

  // Market Filter Tabs Event Listeners
  marketTabs.addEventListener("click", (e) => {
    if (e.target.classList.contains("tab-btn")) {
      document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
      e.target.classList.add("active");
      const filter = e.target.dataset.filter;
      renderBetsGrid(filter);
    }
  });

  // =============================================
  // Coupon Manager
  // =============================================
  function toggleCouponItem(bet) {
    const idx = couponItems_data.findIndex(c => c.name === bet.name);
    if (idx !== -1) {
      couponItems_data.splice(idx, 1);
    } else {
      couponItems_data.push(bet);
    }
    renderCouponPanel();
    renderBetsGrid(document.querySelector('.tab-btn.active')?.dataset.filter || 'all');
  }

  function renderCouponPanel() {
    const count = couponItems_data.length;
    couponCountBadge.textContent = count;
    couponFloatCount.textContent = count;

    if (count === 0) {
      couponPanel.classList.add('hidden');
      couponFloatBtn.classList.add('hidden');
      return;
    }

    couponPanel.classList.remove('hidden');
    couponFloatBtn.classList.remove('hidden');

    // Render items
    couponItems.innerHTML = '';
    couponItems_data.forEach((bet, i) => {
      const item = document.createElement('div');
      item.className = 'coupon-item';
      item.innerHTML = `
        <div class="coupon-item-info">
          <span class="coupon-cat cat-${bet.category}">${bet.category}</span>
          <span class="coupon-item-name">${bet.name}</span>
        </div>
        <div class="coupon-item-right">
          <span class="coupon-item-pct">%${bet.pct}</span>
          <button class="coupon-remove-btn" data-idx="${i}"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `;
      item.querySelector('.coupon-remove-btn').addEventListener('click', () => {
        couponItems_data.splice(i, 1);
        renderCouponPanel();
        renderBetsGrid(document.querySelector('.tab-btn.active')?.dataset.filter || 'all');
      });
      couponItems.appendChild(item);
    });

    // Summary
    const avgPct = Math.round(couponItems_data.reduce((s, b) => s + b.pct, 0) / count);
    const minPct = Math.min(...couponItems_data.map(b => b.pct));
    couponSummary.innerHTML = `
      <div class="coupon-summary-row">
        <span>Ortalama Güven:</span><strong>%${avgPct}</strong>
      </div>
      <div class="coupon-summary-row">
        <span>En Düşük:</span><strong>%${minPct}</strong>
      </div>
      <div class="coupon-summary-row">
        <span>Seçim Sayısı:</span><strong>${count} Bahis</strong>
      </div>
    `;
  }

  // Coupon close / toggle body
  couponCloseBtn.addEventListener('click', () => {
    couponPanel.classList.add('hidden');
    couponFloatBtn.classList.remove('hidden');
  });

  couponFloatBtn.addEventListener('click', () => {
    couponPanel.classList.remove('hidden');
    couponFloatBtn.classList.add('hidden');
  });

  couponToggleBody.addEventListener('click', () => {
    couponBodyOpen = !couponBodyOpen;
    couponBody.style.display = couponBodyOpen ? 'block' : 'none';
    document.getElementById('couponChevron').className = `fa-solid fa-chevron-${couponBodyOpen ? 'up' : 'down'}`;
  });

  couponClearBtn.addEventListener('click', () => {
    couponItems_data = [];
    renderCouponPanel();
    renderBetsGrid(document.querySelector('.tab-btn.active')?.dataset.filter || 'all');
  });

  // =============================================
  // Download / Share Analysis Card
  // =============================================
  downloadAnalysisBtn.addEventListener('click', () => {
    const shareArea = document.getElementById('aiCardShareArea');
    if (!shareArea || typeof html2canvas === 'undefined') {
      alert('html2canvas yüklenemedi, lütfen internet bağlantınızı kontrol edin.');
      return;
    }

    downloadAnalysisBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Hazırlanıyor...';
    downloadAnalysisBtn.disabled = true;

    // Temporarily show it fully (no overflow clip)
    html2canvas(shareArea, {
      backgroundColor: '#0f172a',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false
    }).then(canvas => {
      const link = document.createElement('a');
      const matchLabel = `${homeProfile.teamName}_vs_${awayProfile.teamName}`.replace(/[^a-zA-Z0-9_]/g, '_');
      link.download = `GOLANALIZ_${matchLabel}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      downloadAnalysisBtn.innerHTML = '<i class="fa-solid fa-check"></i> İndirildi!';
      setTimeout(() => {
        downloadAnalysisBtn.innerHTML = '<i class="fa-solid fa-share-nodes"></i> Analiz Kartını İndir / Paylaş';
        downloadAnalysisBtn.disabled = false;
      }, 2500);
    }).catch(err => {
      console.error('html2canvas error:', err);
      downloadAnalysisBtn.innerHTML = '<i class="fa-solid fa-share-nodes"></i> Analiz Kartını İndir / Paylaş';
      downloadAnalysisBtn.disabled = false;
    });
  });

  // Initialize
  initCountryGrid();
  updateAuthUI();
});
