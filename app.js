// Application State & Control Engine
document.addEventListener("DOMContentLoaded", () => {
  let selectedCountry = null;
  let homeTeamName = null;
  let awayTeamName = null;
  let homeProfile = null;
  let awayProfile = null;
  let currentPossibleBets = [];
  let selectedMatchMode = "league"; // 'league' or 'cup'
  let selectedCupFormat = "single"; // 'single', 'two_legged', 'final'

  // Match Mode & Cup Elements
  const btnModeLeague = document.getElementById("btnModeLeague");
  const btnModeCup = document.getElementById("btnModeCup");
  const cupFormatWrapper = document.getElementById("cupFormatWrapper");
  const cupAnalysisSection = document.getElementById("cupAnalysisSection");
  const cupDashboardGrid = document.getElementById("cupDashboardGrid");
  const cupSubtitle = document.getElementById("cupSubtitle");

  // DOM Elements
  const countryDropdown = document.getElementById("countryDropdown");
  const countryDropdownTrigger = document.getElementById("countryDropdownTrigger");
  const countryDropdownMenu = document.getElementById("countryDropdownMenu");
  const countryTriggerLogo = document.getElementById("countryTriggerLogo");
  const countryTriggerLabel = document.getElementById("countryTriggerLabel");
  const countrySearchInput = document.getElementById("countrySearchInput");
  const countryOptionsList = document.getElementById("countryOptionsList");
  const countryStepWrapper = document.getElementById("countryStepWrapper");
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
  const aiOddsValue = document.getElementById("aiOddsValue");
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

  // Coupon State
  let couponItems_data = [];
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

  // AI Performance Dashboard Elements
  const btnPerformanceModal = document.getElementById('btnPerformanceModal');
  const headerWinRateVal = document.getElementById('headerWinRateVal');
  const performanceModal = document.getElementById('performanceModal');
  const performanceModalClose = document.getElementById('performanceModalClose');
  const perfModalWinRate = document.getElementById('perfModalWinRate');

  // Show auth message
  function showAuthMessage(el, msg, isError) {
    el.textContent = msg;
    el.className = `auth-message ${isError ? 'error' : 'success'}`;
    el.classList.remove('hidden');
    setTimeout(() => { if (!isError) el.classList.add('hidden'); }, 4000);
  }

  // Update header based on auth state
  function updateAuthUI() {
    if (!authLoggedOut && !authLoggedIn) return;
    if (typeof AuthManager !== 'undefined' && AuthManager.isLoggedIn()) {
      if (authLoggedOut) authLoggedOut.classList.add('hidden');
      if (authLoggedIn) authLoggedIn.classList.remove('hidden');
      if (headerUserEmail) headerUserEmail.textContent = AuthManager.getCurrentUser();
      updateMyBetsCount();
    } else {
      if (authLoggedOut) authLoggedOut.classList.remove('hidden');
      if (authLoggedIn) authLoggedIn.classList.add('hidden');
    }
  }

  function updateMyBetsCount() {
    if (!myBetsCountBadge || typeof AuthManager === 'undefined') return;
    const count = AuthManager.getMyBets().length;
    myBetsCountBadge.textContent = count;
    if (count > 0) {
      myBetsCountBadge.classList.remove('hidden');
    } else {
      myBetsCountBadge.classList.add('hidden');
    }
  }

  // Open auth modal
  if (headerLoginBtn && authModal) {
    headerLoginBtn.addEventListener('click', () => {
      authModal.classList.remove('hidden');
      if (loginMessage) loginMessage.classList.add('hidden');
      if (registerMessage) registerMessage.classList.add('hidden');
    });
  }

  // Close auth modal
  if (authModalClose && authModal) {
    authModalClose.addEventListener('click', () => authModal.classList.add('hidden'));
    authModal.addEventListener('click', (e) => { if (e.target === authModal) authModal.classList.add('hidden'); });
  }

  // Auth tab switching
  if (authTabLogin && authTabRegister) {
    authTabLogin.addEventListener('click', () => {
      authTabLogin.classList.add('active');
      authTabRegister.classList.remove('active');
      if (loginForm) loginForm.classList.remove('hidden');
      if (registerForm) registerForm.classList.add('hidden');
    });
    authTabRegister.addEventListener('click', () => {
      authTabRegister.classList.add('active');
      authTabLogin.classList.remove('active');
      if (registerForm) registerForm.classList.remove('hidden');
      if (loginForm) loginForm.classList.add('hidden');
    });
  }

  // Login submit
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const result = AuthManager.login(email, password);
      if (result.success) {
        showAuthMessage(loginMessage, result.message, false);
        setTimeout(() => {
          if (authModal) authModal.classList.add('hidden');
          updateAuthUI();
          refreshFavoriteStars();
        }, 800);
      } else {
        showAuthMessage(loginMessage, result.message, true);
      }
    });
  }

  // Register submit
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      const confirm = document.getElementById('registerPasswordConfirm').value;
      const result = AuthManager.register(email, password, confirm);
      if (result.success) {
        showAuthMessage(registerMessage, result.message, false);
        setTimeout(() => {
          if (authModal) authModal.classList.add('hidden');
          updateAuthUI();
          refreshFavoriteStars();
        }, 800);
      } else {
        showAuthMessage(registerMessage, result.message, true);
      }
    });
  }

  // Logout
  if (headerLogoutBtn) {
    headerLogoutBtn.addEventListener('click', () => {
      AuthManager.logout();
      updateAuthUI();
      refreshFavoriteStars();
    });
  }

  // Favorites modal
  if (headerFavoritesBtn && favoritesModal) {
    headerFavoritesBtn.addEventListener('click', () => {
      renderFavoritesModal();
      favoritesModal.classList.remove('hidden');
    });
  }
  if (favoritesModalClose && favoritesModal) {
    favoritesModalClose.addEventListener('click', () => favoritesModal.classList.add('hidden'));
    favoritesModal.addEventListener('click', (e) => { if (e.target === favoritesModal) favoritesModal.classList.add('hidden'); });
  }

  // My Bets modal
  if (headerMyBetsBtn && myBetsOverlay) {
    headerMyBetsBtn.addEventListener('click', () => {
      renderMyBetsModal();
      myBetsOverlay.classList.remove('hidden');
    });
  }
  if (myBetsModalClose && myBetsOverlay) {
    myBetsModalClose.addEventListener('click', () => myBetsOverlay.classList.add('hidden'));
    myBetsOverlay.addEventListener('click', (e) => { if (e.target === myBetsOverlay) myBetsOverlay.classList.add('hidden'); });
  }

  if (clearAllMyBets) {
    clearAllMyBets.addEventListener('click', () => {
      if (confirm('Tüm kayıtlı bahislerinizi silmek istediğinize emin misiniz?')) {
        AuthManager.clearAllBets();
        renderMyBetsModal();
        updateMyBetsCount();
      }
    });
  }

  // =============================================
  // AI Performance & Audit Dashboard Logic
  // =============================================
  // AI Performance & Verified Win Rate Logic
  // =============================================
  function updatePerformanceBadgeUI() {
    if (typeof PredictionTracker === 'undefined') return;
    const metrics = PredictionTracker.getPerformanceMetrics();

    if (headerWinRateVal) {
      headerWinRateVal.textContent = `%${metrics.winRate}`;
    }

    const adPromoWinRate = document.getElementById('adPromoWinRate');
    if (adPromoWinRate) {
      adPromoWinRate.textContent = `%${metrics.winRate}`;
    }
  }

  function initPerformanceDashboard() {
    // 1. Yeni maç sonuçları geldiyse beklemedeki tahminleri anında denetle ve sonuçlandır
    if (typeof PredictionTracker !== 'undefined') {
      PredictionTracker.auditPendingPredictions();
    }

    // 2. Arayüz rozetlerini güncelle
    updatePerformanceBadgeUI();

    if (btnPerformanceModal && performanceModal) {
      btnPerformanceModal.addEventListener('click', () => {
        if (typeof PredictionTracker !== 'undefined') {
          PredictionTracker.auditPendingPredictions();
        }
        renderPerformanceModal();
        performanceModal.classList.remove('hidden');
      });
    }

    if (performanceModalClose && performanceModal) {
      performanceModalClose.addEventListener('click', () => {
        performanceModal.classList.add('hidden');
      });
      performanceModal.addEventListener('click', (e) => {
        if (e.target === performanceModal) performanceModal.classList.add('hidden');
      });
    }
  }

  function renderPerformanceModal() {
    if (typeof PredictionTracker === 'undefined') return;
    const metrics = PredictionTracker.getPerformanceMetrics();

    if (perfModalWinRate) perfModalWinRate.textContent = `%${metrics.winRate}`;
  }

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
      const isFav = typeof AuthManager !== 'undefined' && AuthManager.isFavorite(team);
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

  // Gelişmiş logo URL çözümleyici - data.js'deki versiyonu override eder
  // Kırık resim yerine SVG fallback döndürür
  window.getTeamLogoUrl = function(teamName, countryCode) {
    if (!teamName) return createFallbackSvgDataUrl('?');
    const rawKey = teamName.trim();

    // slugify fonksiyonu (data.js'dekiyle aynı mantık)
    function _slug(name) {
      if (!name) return '';
      const trMap = {
        '\u00e7':'c','\u00c7':'c','\u011f':'g','\u011e':'g','\u0131':'i','\u0049':'i','\u0130':'i',
        '\u00f6':'o','\u00d6':'o','\u015f':'s','\u015e':'s','\u00fc':'u','\u00dc':'u',
        '\u00e1':'a','\u00e0':'a','\u00e4':'a','\u00e2':'a','\u00e9':'e','\u00e8':'e',
        '\u00eb':'e','\u00ea':'e','\u00ed':'i','\u00ec':'i','\u00ef':'i','\u00ee':'i',
        '\u00f3':'o','\u00f2':'o','\u00f4':'o','\u00fa':'u','\u00f9':'u','\u00fb':'u','\u00f1':'n'
      };
      let s = name;
      for (const k in trMap) s = s.replace(new RegExp(k, 'g'), trMap[k]);
      return s.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    const slug = _slug(rawKey);

    if (typeof LOCAL_LOGO_MAP !== 'undefined') {
      // 1) Tam eşleşme
      if (LOCAL_LOGO_MAP[rawKey]) return LOCAL_LOGO_MAP[rawKey];
      if (LOCAL_LOGO_MAP[rawKey.toLowerCase()]) return LOCAL_LOGO_MAP[rawKey.toLowerCase()];
      // 2) Slug eşleşmesi
      if (LOCAL_LOGO_MAP[slug]) return LOCAL_LOGO_MAP[slug];
      // 3) Kısmi eşleşme - gereksiz false positive'leri önlemek için min uzunluk kontrolü
      if (slug.length >= 5) {
        for (const k in LOCAL_LOGO_MAP) {
          const kSlug = _slug(k);
          if (kSlug === slug) return LOCAL_LOGO_MAP[k];
          if (slug.length >= 6 && kSlug.length >= 5 &&
              Math.abs(kSlug.length - slug.length) <= 4 &&
              (kSlug.includes(slug) || slug.includes(kSlug))) {
            return LOCAL_LOGO_MAP[k];
          }
        }
      }
    }

    // 4) Fallback: dosya yolunu dene ama onerror ile SVG badge göster
    // Burada her zaman bir dosya yolu döndürüyoruz; onerror HTML elementlerinde halledilir
    return `logos/${slug}.png`;
  };



  // 1. Render Country Dropdown Options
  function initCountryDropdown() {
    if (!countryOptionsList) return;
    countryOptionsList.innerHTML = "";

    FOOTBALL_DATA.countries.forEach(country => {
      const item = document.createElement("div");
      item.className = "dropdown-option-item";
      item.dataset.id = country.id;

      item.innerHTML = `
        <img src="${country.flag}" alt="${country.name}" class="option-logo" onerror="this.onerror=null; this.src='flags/${country.id.toLowerCase()}.png';">
        <span class="option-name">${country.name}</span>
      `;

      item.addEventListener("click", (e) => {
        e.stopPropagation();
        selectCountryOption(country);
      });

      countryOptionsList.appendChild(item);
    });

    // Do not preselect a country so team selection stays hidden until user chooses a country
    teamsSelectionWrapper.classList.add("hidden");
  }

  function selectCountryOption(country) {
    selectedCountry = country;
    homeTeamName = null;
    awayTeamName = null;

    countryTriggerLabel.textContent = country.name;
    countryTriggerLogo.innerHTML = `<img src="${country.flag}" alt="${country.name}" style="width:24px;height:16px;object-fit:cover;" onerror="this.onerror=null; this.src='flags/${country.id.toLowerCase()}.png';">`;

    if (countryDropdown) countryDropdown.classList.remove("open");
    if (countryDropdownMenu) countryDropdownMenu.classList.add("hidden");

    resetDropdownSearch("country");

    // Populate Home & Away Dropdowns
    populateDropdownOptions("home", country);
    populateDropdownOptions("away", country);

    resetDropdownTrigger("home");
    resetDropdownTrigger("away");

    resetDropdownSearch("home");
    resetDropdownSearch("away");

    teamsSelectionWrapper.classList.remove("hidden");
    resultsSection.classList.add("hidden");
    compareBtn.disabled = true;
  }

  // Country Dropdown Event Listeners
  if (countryDropdownTrigger) {
    countryDropdownTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (homeDropdown) {
        homeDropdown.classList.remove("open");
        homeDropdownMenu.classList.add("hidden");
      }
      if (awayDropdown) {
        awayDropdown.classList.remove("open");
        awayDropdownMenu.classList.add("hidden");
      }

      countryDropdown.classList.toggle("open");
      countryDropdownMenu.classList.toggle("hidden");
      if (!countryDropdownMenu.classList.contains("hidden")) {
        resetDropdownSearch("country");
        countrySearchInput.focus();
      }
    });
  }

  if (countryDropdownMenu) {
    countryDropdownMenu.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  if (homeDropdownMenu) {
    homeDropdownMenu.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  if (awayDropdownMenu) {
    awayDropdownMenu.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  if (countrySearchInput) {
    countrySearchInput.addEventListener("focus", () => resetDropdownSearch("country"));
    countrySearchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      if (countryOptionsList) countryOptionsList.scrollTop = 0;
      const items = countryOptionsList.querySelectorAll(".dropdown-option-item");
      items.forEach(item => {
        const name = item.querySelector(".option-name")?.textContent.toLowerCase() || "";
        item.style.display = name.includes(q) ? "flex" : "none";
      });
    });
  }

  // Helper to retrieve all teams across all countries with their country details
  function getAllTeamsUnified() {
    const list = [];
    const seen = new Set();
    if (typeof FOOTBALL_DATA !== "undefined" && FOOTBALL_DATA.countries) {
      FOOTBALL_DATA.countries.forEach(c => {
        (c.teams || []).forEach(teamName => {
          if (!seen.has(teamName) && hasTeamData(teamName)) {
            seen.add(teamName);
            list.push({
              teamName,
              countryCode: c.code,
              countryName: c.name,
              countryFlag: c.flag,
              countryEmoji: c.flagEmoji || ""
            });
          }
        });
      });
    }
    list.sort((a, b) => a.teamName.localeCompare(b.teamName, 'tr'));
    return list;
  }

  function getTeamCountryCode(teamName) {
    if (!teamName || typeof FOOTBALL_DATA === "undefined" || !FOOTBALL_DATA.countries) return "";
    for (const c of FOOTBALL_DATA.countries) {
      if ((c.teams || []).includes(teamName)) return c.code;
    }
    return "";
  }

  // =============================================
  // Match Mode (Lig vs Kupa) & Cup System Engine
  // =============================================
  if (btnModeLeague) {
    btnModeLeague.addEventListener("click", () => {
      selectedMatchMode = "league";
      btnModeLeague.classList.add("active");
      if (btnModeCup) btnModeCup.classList.remove("active");
      if (cupFormatWrapper) cupFormatWrapper.classList.add("hidden");
      if (countryStepWrapper) countryStepWrapper.classList.remove("hidden");

      // Reset team selection for league mode
      homeTeamName = null;
      awayTeamName = null;
      resetDropdownTrigger("home");
      resetDropdownTrigger("away");
      resetDropdownSearch("home");
      resetDropdownSearch("away");
      if (selectedCountry) {
        populateDropdownOptions("home", selectedCountry);
        populateDropdownOptions("away", selectedCountry);
        teamsSelectionWrapper.classList.remove("hidden");
      } else {
        teamsSelectionWrapper.classList.add("hidden");
      }
      resultsSection.classList.add("hidden");
      compareBtn.disabled = true;
    });
  }

  if (btnModeCup) {
    btnModeCup.addEventListener("click", () => {
      selectedMatchMode = "cup";
      btnModeCup.classList.add("active");
      if (btnModeLeague) btnModeLeague.classList.remove("active");
      if (cupFormatWrapper) cupFormatWrapper.classList.remove("hidden");
      if (countryStepWrapper) countryStepWrapper.classList.add("hidden");

      // Reveal teams wrapper directly & populate ALL teams from ALL countries
      teamsSelectionWrapper.classList.remove("hidden");
      homeTeamName = null;
      awayTeamName = null;
      populateDropdownOptions("home", null);
      populateDropdownOptions("away", null);
      resetDropdownTrigger("home");
      resetDropdownTrigger("away");
      resetDropdownSearch("home");
      resetDropdownSearch("away");
      resultsSection.classList.add("hidden");
      compareBtn.disabled = true;
    });
  }

  const cupPillBtns = document.querySelectorAll(".cup-pill-btn");
  cupPillBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      cupPillBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedCupFormat = btn.dataset.format || "single";
      if (homeProfile && awayProfile && !resultsSection.classList.contains("hidden")) {
        renderComparisonResults();
      }
    });
  });

  // Cup Match Dynamics Calculator
  function calculateCupDynamics(hProfile, aProfile, format) {
    const hStats = hProfile.stats;
    const aStats = aProfile.stats;

    const hWin = hStats.winPct || 0;
    const aWin = aStats.winPct || 0;
    const hAttack = parseFloat(hStats.avgGoalsScored) || 1.2;
    const aAttack = parseFloat(aStats.avgGoalsScored) || 1.0;
    const hDef = parseFloat(hStats.avgGoalsConceded) || 1.2;
    const aDef = parseFloat(aStats.avgGoalsConceded) || 1.2;

    let homeAdvantage = 0.15;
    if (format === "final") homeAdvantage = 0.0;
    else if (format === "two_legged") homeAdvantage = 0.10;

    const homePower = hAttack * 0.4 + (2 - hDef) * 0.3 + (hWin / 100) * 0.3 + homeAdvantage;
    const awayPower = aAttack * 0.4 + (2 - aDef) * 0.3 + (aWin / 100) * 0.3;

    const totalPower = homePower + awayPower || 1;
    let homeQualifyPct = Math.round((homePower / totalPower) * 100);
    homeQualifyPct = Math.min(88, Math.max(12, homeQualifyPct));
    let awayQualifyPct = 100 - homeQualifyPct;

    const closeTeams = Math.abs(homePower - awayPower) < 0.25;
    const lowScoring = hAttack < 1.3 && aAttack < 1.3;
    let extraTimeProb = 22;
    if (closeTeams) extraTimeProb += 14;
    if (lowScoring) extraTimeProb += 10;
    if (format === "single") extraTimeProb += 5;
    extraTimeProb = Math.min(48, Math.max(15, extraTimeProb));

    const penaltyProb = Math.round(extraTimeProb * 0.55);

    let upsetIndex = "DÜŞÜK";
    let upsetBadgeClass = "";
    if (Math.abs(homeQualifyPct - 50) < 12) {
      upsetIndex = "YÜKSEK (Dengeli Eşleşme)";
      upsetBadgeClass = "high";
    } else if (homeQualifyPct > 75 || awayQualifyPct > 75) {
      upsetIndex = "ORTA (Favori Baskısı & Rotasyon Riski)";
    } else {
      upsetIndex = "DENGELİ";
    }

    const expCards = (parseFloat(hStats.avgYellowCards || 0) + parseFloat(aStats.avgYellowCards || 0)) * 1.15;

    return {
      homeQualifyPct,
      awayQualifyPct,
      extraTimeProb,
      penaltyProb,
      upsetIndex,
      upsetBadgeClass,
      expCards: expCards.toFixed(1),
      formatText: format === "single" ? "Tek Maç Eleme (Nakavt)" : (format === "two_legged" ? "Çift Maçlı Eleme (Rövanşlı)" : "Kupa Finali (Nötr Saha)")
    };
  }

  function renderCupAnalysisSection() {
    if (!cupAnalysisSection || !cupDashboardGrid || !homeProfile || !awayProfile) return;

    if (selectedMatchMode !== "cup") {
      cupAnalysisSection.classList.add("hidden");
      return;
    }

    const cupData = calculateCupDynamics(homeProfile, awayProfile, selectedCupFormat);

    if (cupSubtitle) {
      cupSubtitle.textContent = `${homeProfile.teamName} vs ${awayProfile.teamName} — ${cupData.formatText} Dinamikleri`;
    }

    cupDashboardGrid.innerHTML = `
      <div class="cup-stat-card">
        <div class="cup-card-title"><i class="fa-solid fa-crown"></i> TURU ATLAMA FAVORİSİ</div>
        <div class="qualify-meter-wrapper">
          <div class="qualify-labels">
            <span style="color:#10b981;">${homeProfile.teamName} %${cupData.homeQualifyPct}</span>
            <span style="color:#ef4444;">${awayProfile.teamName} %${cupData.awayQualifyPct}</span>
          </div>
          <div class="qualify-track">
            <div class="qualify-bar-home" style="width:${cupData.homeQualifyPct}%;"></div>
            <div class="qualify-bar-away" style="width:${cupData.awayQualifyPct}%;"></div>
          </div>
        </div>
        <div class="cup-desc-text">İç/dış saha formu, hücum-savunma direnci ve turnuva formatı bazlı hesaplanan turu geçme ihtimali.</div>
      </div>

      <div class="cup-stat-card">
        <div class="cup-card-title"><i class="fa-solid fa-clock"></i> 90 DAKİKA EŞİTLİK & UZATMA RİSKİ</div>
        <div class="cup-risk-pills">
          <span class="cup-risk-badge ${cupData.extraTimeProb > 32 ? 'high' : ''}"><i class="fa-solid fa-hourglass-half"></i> Uzatma İhtimali: %${cupData.extraTimeProb}</span>
          <span class="cup-risk-badge"><i class="fa-solid fa-bullseye"></i> Penaltılar: %${cupData.penaltyProb}</span>
        </div>
        <div class="cup-desc-text">Normal sürenin (90 dk) beraberlikle sonlanıp maçın uzatmalara veya penaltı atışlarına uzama riski.</div>
      </div>

      <div class="cup-stat-card">
        <div class="cup-card-title"><i class="fa-solid fa-bolt"></i> KUPA SERTLİĞİ & ROTASYON İNDEKSİ</div>
        <div class="cup-risk-pills">
          <span class="cup-risk-badge ${cupData.upsetBadgeClass}"><i class="fa-solid fa-triangle-exclamation"></i> Sürpriz Riski: ${cupData.upsetIndex}</span>
          <span class="cup-risk-badge"><i class="fa-solid fa-square-full" style="color:#f59e0b;"></i> Beklenen Kart: ${cupData.expCards} Adet</span>
        </div>
        <div class="cup-desc-text">Kupa maçlarındaki yüksek faul/kart katsayısı ve kadro rotasyon sürpriz indeks katsayısı.</div>
      </div>
    `;

    cupAnalysisSection.classList.remove("hidden");
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

  function hasTeamData(teamName) {
    if (!teamName) return false;
    if (typeof generateTeamProfile === "function") {
      try {
        const prof = generateTeamProfile(teamName, "");
        return prof && prof.playedCount > 0;
      } catch (e) {
        return true;
      }
    }
    return true;
  }

  // Populate Custom Logo Options inside Dropdown List
  function populateDropdownOptions(type, country) {
    const list = type === "home" ? homeOptionsList : awayOptionsList;
    list.innerHTML = "";

    const isCupMode = selectedMatchMode === "cup" || !country;
    const rawTeams = isCupMode ? getAllTeamsUnified() : (country.teams || []).map(t => ({
      teamName: t,
      countryCode: country.code,
      countryName: country.name,
      countryFlag: country.flag,
      countryEmoji: country.flagEmoji || ""
    }));

    const teamsList = rawTeams.filter(t => hasTeamData(t.teamName));

    teamsList.forEach(t => {
      const teamName = t.teamName;
      const cCode = t.countryCode || (country ? country.code : "");
      const cName = t.countryName || (country ? country.name : "");
      const cEmoji = t.countryEmoji || "";

      const item = document.createElement("div");
      item.className = "dropdown-option-item";
      item.dataset.team = teamName;

      const logoUrl = getTeamLogoUrl(teamName, cCode);
      const fallbackUrl = createFallbackSvgDataUrl(teamName);
      const isFav = typeof AuthManager !== 'undefined' && AuthManager.isFavorite(teamName);

      const countryBadge = isCupMode && cName ? `<small class="country-badge-sm">${cEmoji || cName}</small>` : "";

      item.innerHTML = `
        <img src="${logoUrl}" alt="${teamName}" class="option-logo" onerror="this.onerror=null; this.src='${fallbackUrl}';">
        <span class="option-name">${teamName}${countryBadge}</span>
        <button class="fav-star-btn ${isFav ? 'is-favorite' : ''}" data-team="${teamName}" data-country-code="${cCode}" data-country-name="${cName}" title="Favorilere Ekle/Çıkar">
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
        if (typeof AuthManager !== 'undefined') {
          AuthManager.toggleFavorite(teamName, cCode, cName);
          refreshFavoriteStars();
        }
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
      resetDropdownSearch("home");
    } else {
      awayTeamName = teamName;
      awayTriggerLabel.textContent = teamName;
      awayTriggerLogo.innerHTML = `<img src="${logoUrl}" alt="${teamName}" style="width:28px;height:28px;object-fit:contain;" onerror="this.onerror=null; this.src='${fallbackUrl}';">`;
      awayDropdown.classList.remove("open");
      awayDropdownMenu.classList.add("hidden");
      resetDropdownSearch("away");
    }

    checkCanCompare();
  }

  // Toggle Dropdown Menu
  if (homeDropdownTrigger) {
    homeDropdownTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (countryDropdown) {
        countryDropdown.classList.remove("open");
        countryDropdownMenu.classList.add("hidden");
      }
      if (awayDropdown) {
        awayDropdown.classList.remove("open");
        awayDropdownMenu.classList.add("hidden");
      }

      homeDropdown.classList.toggle("open");
      homeDropdownMenu.classList.toggle("hidden");
      if (!homeDropdownMenu.classList.contains("hidden")) {
        resetDropdownSearch("home");
        homeSearchInput.focus();
      }
    });
  }

  if (awayDropdownTrigger) {
    awayDropdownTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (countryDropdown) {
        countryDropdown.classList.remove("open");
        countryDropdownMenu.classList.add("hidden");
      }
      if (homeDropdown) {
        homeDropdown.classList.remove("open");
        homeDropdownMenu.classList.add("hidden");
      }

      awayDropdown.classList.toggle("open");
      awayDropdownMenu.classList.toggle("hidden");
      if (!awayDropdownMenu.classList.contains("hidden")) {
        resetDropdownSearch("away");
        awaySearchInput.focus();
      }
    });
  }

  // Search Filter in Dropdowns
  if (homeSearchInput) {
    homeSearchInput.addEventListener("focus", () => resetDropdownSearch("home"));
    homeSearchInput.addEventListener("input", (e) => filterOptions("home", e.target.value));
  }
  if (awaySearchInput) {
    awaySearchInput.addEventListener("focus", () => resetDropdownSearch("away"));
    awaySearchInput.addEventListener("input", (e) => filterOptions("away", e.target.value));
  }

  function filterOptions(type, query) {
    const list = type === "home" ? homeOptionsList : awayOptionsList;
    if (!list) return;
    list.scrollTop = 0;
    const items = list.querySelectorAll(".dropdown-option-item");
    const q = query.toLowerCase();

    items.forEach(item => {
      const name = (item.dataset.team || "").toLowerCase();
      item.style.display = name.includes(q) ? "flex" : "none";
    });
  }

  function resetDropdownSearch(type) {
    if (type === "country") {
      if (countrySearchInput) countrySearchInput.value = "";
      if (countryOptionsList) {
        countryOptionsList.scrollTop = 0;
        const items = countryOptionsList.querySelectorAll(".dropdown-option-item");
        items.forEach(item => item.style.display = "flex");
      }
      if (countryDropdownMenu) countryDropdownMenu.scrollTop = 0;
    } else if (type === "home" || type === "away") {
      const input = type === "home" ? homeSearchInput : awaySearchInput;
      const list = type === "home" ? homeOptionsList : awayOptionsList;
      const menu = type === "home" ? homeDropdownMenu : awayDropdownMenu;
      if (input) input.value = "";
      if (list) {
        list.scrollTop = 0;
        const items = list.querySelectorAll(".dropdown-option-item");
        items.forEach(item => item.style.display = "flex");
      }
      if (menu) menu.scrollTop = 0;
    }
  }

  // Close dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (countryDropdown && !countryDropdown.contains(e.target)) {
      countryDropdown.classList.remove("open");
      countryDropdownMenu.classList.add("hidden");
      if (countryOptionsList) countryOptionsList.scrollTop = 0;
    }
    if (homeDropdown && !homeDropdown.contains(e.target)) {
      homeDropdown.classList.remove("open");
      homeDropdownMenu.classList.add("hidden");
      if (homeOptionsList) homeOptionsList.scrollTop = 0;
    }
    if (awayDropdown && !awayDropdown.contains(e.target)) {
      awayDropdown.classList.remove("open");
      awayDropdownMenu.classList.add("hidden");
      if (awayOptionsList) awayOptionsList.scrollTop = 0;
    }
  });

  function checkCanCompare() {
    compareBtn.disabled = !(homeTeamName && awayTeamName && homeTeamName !== awayTeamName);
  }

  function getEffectiveCountryCode(teamName) {
    if (selectedMatchMode === "cup" || !selectedCountry) {
      return getTeamCountryCode(teamName);
    }
    return selectedCountry.code || getTeamCountryCode(teamName);
  }

  // 2. Compare Button Trigger
  compareBtn.addEventListener("click", () => {
    try {
      const homeCode = getEffectiveCountryCode(homeTeamName);
      const awayCode = getEffectiveCountryCode(awayTeamName);
      homeProfile = generateTeamProfile(homeTeamName, homeCode);
      awayProfile = generateTeamProfile(awayTeamName, awayCode);


      renderComparisonResults();
      resultsSection.classList.remove("hidden");
      aiResultCard.classList.add("hidden");
      poissonSection.classList.add("hidden");
      resultsSection.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("[GOLANALIZ] Karşılaştırma hatası:", err);
      resultsSection.classList.remove("hidden");
      resultsSection.scrollIntoView({ behavior: "smooth" });
    }
  });

  // Render Comparison Dashboard
  function renderComparisonResults() {
    // Banner Data
    bannerHomeName.textContent = homeProfile.teamName;
    bannerAwayName.textContent = awayProfile.teamName;

    if (selectedMatchMode === "cup") {
      const formatLabel = selectedCupFormat === "single" ? "TEK MAÇ ELEME" : (selectedCupFormat === "two_legged" ? "RÖVANŞLI ELEME" : "KUPA FİNALİ");
      bannerLeagueName.textContent = `🏆 KUPA MAÇI (${formatLabel})`;
    } else {
      bannerLeagueName.textContent = selectedCountry ? selectedCountry.name.toUpperCase() : "";
    }

    const homeCode = getEffectiveCountryCode(homeProfile.teamName);
    const awayCode = getEffectiveCountryCode(awayProfile.teamName);

    const homeLogoUrl = getTeamLogoUrl(homeProfile.teamName, homeCode);
    const awayLogoUrl = getTeamLogoUrl(awayProfile.teamName, awayCode);

    bannerHomeLogo.src = homeLogoUrl;
    bannerAwayLogo.src = awayLogoUrl;

    bannerHomeLogo.onerror = () => { bannerHomeLogo.onerror = null; bannerHomeLogo.src = createFallbackSvgDataUrl(homeProfile.teamName); };
    bannerAwayLogo.onerror = () => { bannerAwayLogo.onerror = null; bannerAwayLogo.src = createFallbackSvgDataUrl(awayProfile.teamName); };

    // Form Strips (Sadece 2026-2027 Sezonu - Maksimum 5 Maç)
    renderFormStrip(homeFormStrip, homeProfile.matches);
    renderFormStrip(awayFormStrip, awayProfile.matches);

    // Detailed Stats Rows (2026-2027 Sezonu Ayrıntılı İstatistik Karşılaştırması)
    renderStatsList();

    // Render Expected Metrics Table (Bu Karşılaşma İçin Beklenen İstatistikler Tablosu)
    renderExpectedMetricsSection();


    // Cup Analysis Dashboard (Only active when Cup Mode is selected)
    renderCupAnalysisSection();

    // Generate Possible Bets
    generatePossibleBets();
  }

  function renderFormStrip(container, matches) {
    container.innerHTML = "";
    // Sadece 2026-2027 sezonuna ait maçları filtrele
    const season2627 = (matches || []).filter(m => 
      m.season === '2026/2027' || (m.season && m.season.includes('2026') && m.season.includes('2027'))
    );
    const matchesToShow = season2627.length > 0 ? season2627 : (matches || []).filter(m => m.season === '2026/2027');
    // En fazla 5 maç (yeni maç eklendiğinde en eski maç düşer)
    const last5 = matchesToShow.slice(-5);
    if (last5.length === 0) {
      container.innerHTML = `<span style="font-size:11px;color:var(--text-muted);font-weight:500;">2026-2027 sezonunda henüz maç yok</span>`;
      return;
    }
    last5.forEach(m => {
      const badge = document.createElement("span");
      badge.className = `form-badge ${m.result}`;
      badge.textContent = m.result;
      badge.title = `${m.isHome ? 'Ev' : 'Dep'} (${m.date || '2026-2027'}): ${m.score} vs ${m.opponent}`;
      container.appendChild(badge);
    });
  }

  // ── Researched Expected Corners (xCorners) Engine ──
  // Takımların korner kazanma ve verme dinamikleri, şut baskısı ve saha avantajı ile modellenir
  function calculateResearchedCorners(hProf, aProf) {
    if (!hProf || !aProf) return null;
    const h = hProf.stats || {};
    const a = aProf.stats || {};
    const leagueAvgTeamCorner = 4.85;

    function getTeamCornerMetrics(teamName, isHomeTeam, fallbackAvg) {
      const slug = (typeof slugifyTeam === 'function') ? slugifyTeam(teamName) : teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchIndex = (typeof TEAM_MATCHES_INDEX !== 'undefined') ? TEAM_MATCHES_INDEX : {};
      const matches = matchIndex[slug] || [];
      
      let wonVenue = [], concVenue = [];
      let wonAll = [], concAll = [];
      let shotsVenue = [], shotsAll = [];

      matches.forEach(m => {
        const isH = (typeof matchTeamNames === 'function') ? matchTeamNames(m[2], teamName) : (m[2] === teamName);
        const hc = m[10], ac = m[11], hs = m[6], as = m[7];
        if (hc !== null && ac !== null && !isNaN(hc) && !isNaN(ac)) {
          const w = isH ? hc : ac;
          const c = isH ? ac : hc;
          wonAll.push(w);
          concAll.push(c);
          if (isHomeTeam && isH) {
            wonVenue.push(w);
            concVenue.push(c);
          } else if (!isHomeTeam && !isH) {
            wonVenue.push(w);
            concVenue.push(c);
          }
        }
        if (hs !== null && as !== null && !isNaN(hs) && !isNaN(as)) {
          const s = isH ? hs : as;
          shotsAll.push(s);
          if (isHomeTeam && isH) shotsVenue.push(s);
          else if (!isHomeTeam && !isH) shotsVenue.push(s);
        }
      });

      const avgCalc = (arr, defVal) => arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : defVal;
      const baseAvg = parseFloat(fallbackAvg) || leagueAvgTeamCorner;
      const avgWonAll = avgCalc(wonAll, baseAvg);
      const avgConcAll = avgCalc(concAll, leagueAvgTeamCorner);
      const avgWonVenue = avgCalc(wonVenue, avgWonAll);
      const avgConcVenue = avgCalc(concVenue, avgConcAll);
      const avgShots = avgCalc(shotsVenue.length ? shotsVenue : shotsAll, 12.0);

      // Empirical Bayes regresyonu: Aşırı uçları lig ortalamasına regrese eder
      const sampleWeightWon = wonAll.length / (wonAll.length + 8);
      const sampleWeightConc = concAll.length / (concAll.length + 8);
      
      const regressedWon = (avgWonAll * sampleWeightWon) + (leagueAvgTeamCorner * (1 - sampleWeightWon));
      const regressedConc = (avgConcAll * sampleWeightConc) + (leagueAvgTeamCorner * (1 - sampleWeightConc));
      
      const finalWon = (avgWonVenue * 0.60) + (regressedWon * 0.40);
      const finalConc = (avgConcVenue * 0.60) + (regressedConc * 0.40);

      return {
        finalWon,
        finalConc,
        avgWonAll: parseFloat(avgWonAll.toFixed(1)),
        avgConcAll: parseFloat(avgConcAll.toFixed(1)),
        avgShots
      };
    }

    const hC = getTeamCornerMetrics(hProf.teamName, true, h.avgCorners);
    const aC = getTeamCornerMetrics(aProf.teamName, false, a.avgCorners);

    // Şut yoğunluğu çarpanı (daha fazla şut = daha çok engellenen top ve korner)
    const hShotPressure = Math.min(1.18, Math.max(0.85, Math.pow(hC.avgShots / 12.0, 0.30)));
    const aShotPressure = Math.min(1.18, Math.max(0.85, Math.pow(aC.avgShots / 11.5, 0.30)));

    // İç saha baskı faktörü
    const homeAdvantage = 1.06;
    const awayAdvantage = 0.94;

    // Researched Expected Corners (xCorners)
    let lambdaHome = ( (hC.finalWon / leagueAvgTeamCorner) * (aC.finalConc / leagueAvgTeamCorner) * leagueAvgTeamCorner ) * homeAdvantage * hShotPressure;
    let lambdaAway = ( (aC.finalWon / leagueAvgTeamCorner) * (hC.finalConc / leagueAvgTeamCorner) * leagueAvgTeamCorner ) * awayAdvantage * aShotPressure;

    lambdaHome = parseFloat(Math.min(9.2, Math.max(2.0, lambdaHome)).toFixed(1));
    lambdaAway = parseFloat(Math.min(8.8, Math.max(1.8, lambdaAway)).toFixed(1));
    const totalCorners = parseFloat((lambdaHome + lambdaAway).toFixed(1));
    const iyCorners = parseFloat((totalCorners * 0.45).toFixed(1));

    // Poisson kümülatif fonksiyonu
    function calcCornerPoissonCdf(l, k) {
      if (l <= 0) return 1;
      let s = 0, term = Math.exp(-l);
      s += term;
      for (let i = 1; i <= k; i++) {
        term *= (l / i);
        s += term;
      }
      return s;
    }

    const pOver85  = Math.min(96, Math.max(5, Math.round((1 - calcCornerPoissonCdf(totalCorners, 8)) * 100)));
    const pOver95  = Math.min(94, Math.max(4, Math.round((1 - calcCornerPoissonCdf(totalCorners, 9)) * 100)));
    const pOver105 = Math.min(90, Math.max(3, Math.round((1 - calcCornerPoissonCdf(totalCorners, 10)) * 100)));
    const pUnder85 = 100 - pOver85;
    const pUnder95 = 100 - pOver95;

    const cornerHomePct = Math.min(85, Math.max(15, Math.round((lambdaHome / totalCorners) * 100)));
    const cornerAwayPct = 100 - cornerHomePct;

    let cornerBadge = "8.5 Barajı";
    let cornerBadgeClass = "exp-badge-cyan";
    if (totalCorners >= 10.2) {
      cornerBadge = "9.5 & 10.5 Üst Potansiyeli";
      cornerBadgeClass = "exp-badge-emerald";
    } else if (totalCorners >= 9.0) {
      cornerBadge = "8.5 / 9.5 Üst Eğilimi";
      cornerBadgeClass = "exp-badge-cyan";
    } else if (totalCorners < 7.8) {
      cornerBadge = "8.5 Alt Eğilimli";
      cornerBadgeClass = "exp-badge-amber";
    }

    return {
      expHome: lambdaHome,
      expAway: lambdaAway,
      totalCorners,
      iyCorners,
      pOver85,
      pOver95,
      pOver105,
      pUnder85,
      pUnder95,
      cornerHomePct,
      cornerAwayPct,
      cornerBadge,
      cornerBadgeClass,
      hRawAvg: hC.avgWonAll,
      aRawAvg: aC.avgWonAll
    };
  }

  // ── Render Expected Metrics Section (Bu Karşılaşma İçin Beklenen İstatistikler) ──
  function renderExpectedMetricsSection() {
    const container = document.getElementById("expectedTableContainer") || document.getElementById("expectedCardsGrid");
    if (!container || !homeProfile || !awayProfile) return;

    const probs = calculateMatchProbabilities();
    if (!probs) return;

    const h = homeProfile.stats || {};
    const a = awayProfile.stats || {};

    // 1. Beklenen Şut & İsabetli Şut
    const hShots = parseFloat(h.avgShots) || 13.5;
    const aShots = parseFloat(a.avgShots) || 12.5;
    const totalExpShots = parseFloat((hShots + aShots).toFixed(1));

    const hSot = parseFloat(h.avgShotsOnTarget) || 4.5;
    const aSot = parseFloat(a.avgShotsOnTarget) || 4.2;
    const totalExpSot = parseFloat((hSot + aSot).toFixed(1));

    // 2. Beklenen Gol (xG)
    const homeXg = typeof probs.xG_home === 'number' ? probs.xG_home : (parseFloat(probs.lambda) || 1.45);
    const awayXg = typeof probs.xG_away === 'number' ? probs.xG_away : (parseFloat(probs.mu) || 1.15);
    const totalXg = typeof probs.totalExpGoals === 'number' ? probs.totalExpGoals : parseFloat((homeXg + awayXg).toFixed(2));
    const iyHomeXg = parseFloat((homeXg * 0.45).toFixed(2));
    const iyAwayXg = parseFloat((awayXg * 0.45).toFixed(2));
    const iyTotalXg = parseFloat((totalXg * 0.45).toFixed(2));

    // 3. Beklenen Korner (Araştırılmış Model)
    const cornerRes = calculateResearchedCorners(homeProfile, awayProfile) || {
      expHome: parseFloat(h.avgCorners || 4.8),
      expAway: parseFloat(a.avgCorners || 4.4),
      totalCorners: parseFloat((parseFloat(h.avgCorners || 4.8) + parseFloat(a.avgCorners || 4.4)).toFixed(1)),
      iyCorners: 4.2
    };
    const iyHomeCorners = parseFloat((cornerRes.expHome * 0.45).toFixed(1));
    const iyAwayCorners = parseFloat((cornerRes.expAway * 0.45).toFixed(1));

    // 4. Beklenen Kart
    const isCup = selectedMatchMode === "cup";
    const cardMultiplier = isCup ? (selectedCupFormat === "single" || selectedCupFormat === "final" ? 1.20 : 1.12) : 1.0;
    const hCardAvg = parseFloat((parseFloat(h.avgYellowCards || 1.9) * cardMultiplier).toFixed(1));
    const aCardAvg = parseFloat((parseFloat(a.avgYellowCards || 1.9) * cardMultiplier).toFixed(1));
    const totalCards = parseFloat((hCardAvg + aCardAvg).toFixed(1));

    // 5. Beklenen Faul
    const hFouls = parseFloat((parseFloat(h.avgFouls || 11.5) * cardMultiplier).toFixed(1));
    const aFouls = parseFloat((parseFloat(a.avgFouls || 12.0) * cardMultiplier).toFixed(1));
    const totalFouls = parseFloat((hFouls + aFouls).toFixed(1));

    // 6. En Olası Skor
    let likelyScore = "2 - 1";
    let likelyPct = "12.5";
    if (probs.topScores && probs.topScores.length > 0) {
      likelyScore = probs.topScores[0].label;
      likelyPct = (probs.topScores[0].prob * 100).toFixed(1);
    } else if (probs.mostLikelyScore) {
      likelyScore = probs.mostLikelyScore;
    }

    const rows = [
      {
        homeDisplay: `${hShots} Şut`,
        title: `🎯 Beklenen Şut (Toplam: ${totalExpShots})`,
        awayDisplay: `${aShots} Şut`
      },
      {
        homeDisplay: `${hSot} İsabet`,
        title: `🎯 Beklenen İsabetli Şut (Toplam: ${totalExpSot})`,
        awayDisplay: `${aSot} İsabet`
      },
      {
        homeDisplay: `${homeXg} xG`,
        title: `⚽ Beklenen Gol (Toplam: ${totalXg} xG)`,
        awayDisplay: `${awayXg} xG`
      },
      {
        homeDisplay: `${iyHomeXg} xG`,
        title: `🕐 İlk Yarı Beklenen Gol (İY xG)`,
        awayDisplay: `${iyAwayXg} xG`
      },
      {
        homeDisplay: `${cornerRes.expHome} Korner`,
        title: `🚩 Beklenen Korner (xCorners)`,
        awayDisplay: `${cornerRes.expAway} Korner`
      },
      {
        homeDisplay: `${iyHomeCorners} Korner`,
        title: `⏱️ İlk Yarı Beklenen Korner`,
        awayDisplay: `${iyAwayCorners} Korner`
      },
      {
        homeDisplay: `${hCardAvg} Kart`,
        title: `🟨 Sarı Kart Beklentisi`,
        awayDisplay: `${aCardAvg} Kart`
      },
      {
        homeDisplay: `${hFouls} Faul`,
        title: `⚡ Beklenen Faul`,
        awayDisplay: `${aFouls} Faul`
      },
      {
        homeDisplay: `%${probs.homeCleanSheetPct || 33}`,
        title: `🛡️ Kalesini Gole Kapatma (Clean Sheet)`,
        awayDisplay: `%${probs.awayCleanSheetPct || 33}`
      },
      {
        homeDisplay: `%${probs.pBTTS}`,
        title: `⚡ KG Var (Karşılıklı Gol) Oranı`,
        awayDisplay: `%${probs.pBTTSNo}`
      },
      {
        homeDisplay: `%${probs.pOver25}`,
        title: `📈 2.5 Üst Gol Oranı`,
        awayDisplay: `%${probs.pUnder25}`
      },
      {
        homeDisplay: `%${probs.pHomeWin}`,
        title: `🏆 En Olası Skor: ${likelyScore}`,
        awayDisplay: `%${probs.pAwayWin}`
      }
    ];

    container.innerHTML = rows.map(r => `
      <div class="stat-row">
        <div class="stat-label-bar">
          <span class="home-val">${r.homeDisplay}</span>
          <span class="stat-title">${r.title}</span>
          <span class="away-val">${r.awayDisplay}</span>
        </div>
      </div>
    `).join("");
  }

  // Render Line-by-Line Stats

  function renderStatsList() {
    if (!statsList || !homeProfile || !awayProfile) return;
    const hStats = homeProfile.stats;
    const aStats = awayProfile.stats;
    const probs = calculateMatchProbabilities();

    const hSeasonLabel = homeProfile.dataSeasonLabel || '2026-2027 Sezonu';
    const aSeasonLabel = awayProfile.dataSeasonLabel || '2026-2027 Sezonu';
    const seasonLabel = (hSeasonLabel === aSeasonLabel) ? hSeasonLabel : `${hSeasonLabel} / ${aSeasonLabel}`;

    statsList.innerHTML = "";

    const seasonInfo = document.createElement("div");
    seasonInfo.style.cssText = "font-size:11px;color:var(--accent-cyan);text-align:center;margin-bottom:10px;opacity:0.85;letter-spacing:0.04em;font-weight:600;";
    seasonInfo.textContent = `📊 İstatistikler: ${seasonLabel} Verilerine Göre`;
    statsList.appendChild(seasonInfo);

    const cornersNote = (!homeProfile.cornersReliable || !awayProfile.cornersReliable) ? ' (tahmini)' : '';
    const cardsNote   = (!homeProfile.cardsReliable   || !awayProfile.cardsReliable)   ? ' (tahmini)' : '';

    function fmtVal(v, prefix = "", suffix = "") {
      if (v === null || v === undefined || v === "" || isNaN(v)) return "—";
      return `${prefix}${v}${suffix}`;
    }

    function fmtShotsOnTarget(avgSot, accuracyPct) {
      if (avgSot === null || avgSot === undefined || isNaN(avgSot)) return "—";
      const accStr = (accuracyPct !== null && accuracyPct !== undefined && !isNaN(accuracyPct)) ? ` (%${accuracyPct})` : "";
      return `${avgSot}${accStr}`;
    }

    const metrics = [
      { title:"⚽ Atılan Gol Ortalaması",
        homeDisplay: fmtVal(hStats.avgGoalsScored, "", " Gol/Maç"),
        awayDisplay: fmtVal(aStats.avgGoalsScored, "", " Gol/Maç"),
        rawHome: parseFloat(hStats.avgGoalsScored) || 0,
        rawAway: parseFloat(aStats.avgGoalsScored) || 0 },
      { title:"🥅 Yenilen Gol Ortalaması",
        homeDisplay: fmtVal(hStats.avgGoalsConceded, "", " Gol/Maç"),
        awayDisplay: fmtVal(aStats.avgGoalsConceded, "", " Gol/Maç"),
        rawHome: parseFloat(hStats.avgGoalsConceded) || 0,
        rawAway: parseFloat(aStats.avgGoalsConceded) || 0 },
      { title:"🎯 Toplam Şut Ortalaması",
        homeDisplay: fmtVal(hStats.avgShots, "", " Şut"),
        awayDisplay: fmtVal(aStats.avgShots, "", " Şut"),
        rawHome: parseFloat(hStats.avgShots) || 0,
        rawAway: parseFloat(aStats.avgShots) || 0 },
      { title:"🎯 İsabetli Şut & İsabet Oranı",
        homeDisplay: fmtShotsOnTarget(hStats.avgShotsOnTarget, hStats.shotAccuracyPct),
        awayDisplay: fmtShotsOnTarget(aStats.avgShotsOnTarget, aStats.shotAccuracyPct),
        rawHome: parseFloat(hStats.avgShotsOnTarget) || 0,
        rawAway: parseFloat(aStats.avgShotsOnTarget) || 0 },
      { title:`🚩 Korner Ortalaması${cornersNote}`,
        homeDisplay: fmtVal(hStats.avgCorners, "", " Korner"),
        awayDisplay: fmtVal(aStats.avgCorners, "", " Korner"),
        rawHome: parseFloat(hStats.avgCorners) || 0,
        rawAway: parseFloat(aStats.avgCorners) || 0 },
      ...(probs && probs.cornerData ? [{
        title: "🚩 Beklenen Korner (xCorners)",
        homeDisplay: `${probs.cornerData.expHome} Korner`,
        awayDisplay: `${probs.cornerData.expAway} Korner`,
        rawHome: probs.cornerData.expHome,
        rawAway: probs.cornerData.expAway
      }] : []),
      { title:`🟨 Sarı Kart Ortalaması${cardsNote}`,
        homeDisplay: fmtVal(hStats.avgYellowCards, "", " Kart/Maç"),
        awayDisplay: fmtVal(aStats.avgYellowCards, "", " Kart/Maç"),
        rawHome: parseFloat(hStats.avgYellowCards) || 0,
        rawAway: parseFloat(aStats.avgYellowCards) || 0 },
      { title:"🟥 Kırmızı Kart (Toplam)",
        homeDisplay: fmtVal(hStats.totalRedCardsIn5, "", " Adet"),
        awayDisplay: fmtVal(aStats.totalRedCardsIn5, "", " Adet"),
        rawHome: parseFloat(hStats.totalRedCardsIn5) || 0,
        rawAway: parseFloat(aStats.totalRedCardsIn5) || 0 },
      { title:"⚡ KG Var (Karşılıklı Gol) Oranı",
        homeDisplay: fmtVal(hStats.bttsPct, "%"),
        awayDisplay: fmtVal(aStats.bttsPct, "%"),
        rawHome: parseFloat(hStats.bttsPct) || 0,
        rawAway: parseFloat(aStats.bttsPct) || 0 },
      { title:"📈 2.5 Üst Gol Oranı",
        homeDisplay: fmtVal(hStats.over25Pct, "%"),
        awayDisplay: fmtVal(aStats.over25Pct, "%"),
        rawHome: parseFloat(hStats.over25Pct) || 0,
        rawAway: parseFloat(aStats.over25Pct) || 0 },
      { title:"🏆 Galibiyet Oranı",
        homeDisplay: fmtVal(hStats.winPct, "%"),
        awayDisplay: fmtVal(aStats.winPct, "%"),
        rawHome: parseFloat(hStats.winPct) || 0,
        rawAway: parseFloat(aStats.winPct) || 0 },
      // Engine 6.0: 4 Yeni Derin Araştırma Metriği
      { title:"🛡️ Kalesini Gole Kapatma (Clean Sheet)",
        homeDisplay: fmtVal(hStats.cleanSheetPct, "%"),
        awayDisplay: fmtVal(aStats.cleanSheetPct, "%"),
        rawHome: parseFloat(hStats.cleanSheetPct) || 0,
        rawAway: parseFloat(aStats.cleanSheetPct) || 0 },
      { title:"⚡ Faul Ortalaması",
        homeDisplay: fmtVal(hStats.avgFouls, "", " Faul"),
        awayDisplay: fmtVal(aStats.avgFouls, "", " Faul"),
        rawHome: parseFloat(hStats.avgFouls) || 0,
        rawAway: parseFloat(aStats.avgFouls) || 0 },
      { title:"🕐 İlk Yarıda Gol Olma (İY 0.5 Üst)",
        homeDisplay: fmtVal(hStats.htOver05Pct, "%"),
        awayDisplay: fmtVal(aStats.htOver05Pct, "%"),
        rawHome: parseFloat(hStats.htOver05Pct) || 0,
        rawAway: parseFloat(aStats.htOver05Pct) || 0 },
      { title:"📊 xG Farkı (xG - xGA)",
        homeDisplay: (hStats.xg_diff != null ? (hStats.xg_diff > 0 ? `+${hStats.xg_diff}` : `${hStats.xg_diff}`) : (hStats.xg_per90 && hStats.xga_per90 ? (hStats.xg_per90 - hStats.xga_per90).toFixed(2) : "—")),
        awayDisplay: (aStats.xg_diff != null ? (aStats.xg_diff > 0 ? `+${aStats.xg_diff}` : `${aStats.xg_diff}`) : (aStats.xg_per90 && aStats.xga_per90 ? (aStats.xg_per90 - aStats.xga_per90).toFixed(2) : "—")),
        rawHome: Math.max(0, 5 + (parseFloat(hStats.xg_diff) || 0)),
        rawAway: Math.max(0, 5 + (parseFloat(aStats.xg_diff) || 0)) }
    ];

    metrics.forEach(m => {
      const hNum  = (m.rawHome !== undefined && !isNaN(m.rawHome)) ? m.rawHome : 0;
      const aNum  = (m.rawAway !== undefined && !isNaN(m.rawAway)) ? m.rawAway : 0;
      const total = (hNum + aNum);
      let hPct = 50, aPct = 50;
      if (total > 0) {
        hPct = Math.round((hNum / total) * 100);
        aPct = 100 - hPct;
      }
      const row = document.createElement("div");
      row.className = "stat-row";
      row.innerHTML = `
        <div class="stat-label-bar">
          <span class="home-val">${m.homeDisplay}</span>
          <span class="stat-title">${m.title}</span>
          <span class="away-val">${m.awayDisplay}</span>
        </div>
        <div class="stat-progress-container">
          <div class="stat-progress-bar home" style="width:${hPct}%;"></div>
          <div class="stat-progress-bar away" style="width:${aPct}%;"></div>
        </div>`;
      statsList.appendChild(row);
    });
  }

  // 3. AI Prediction Button Trigger
  aiPredictBtn.addEventListener("click", () => {
    generateAIPrediction();
    generatePoissonMatrix();
    aiResultCard.classList.remove("hidden");
    poissonSection.classList.remove("hidden");
    const explanationBox = aiResultCard.querySelector(".ai-explanation-box");
    if (explanationBox) explanationBox.style.display = "block";
    aiResultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  // ── Engine 6.0: Venue-Specific Performance Blend ──
  // Overall stats (40%) + venue-specific stats (60%) for accurate predictions
  function calculateDixonColesProbabilities(hProfile, aProfile) {
    if (!hProfile || !aProfile) return null;
    const h = hProfile.stats;
    const a = aProfile.stats;

    // Weighted goals & xG metrics
    const hGoalScored = h.weightedAvgGoalsScored || parseFloat(h.avgGoalsScored) || 1.2;
    const hGoalConceded = h.weightedAvgGoalsConceded || parseFloat(h.avgGoalsConceded) || 1.2;
    const aGoalScored = a.weightedAvgGoalsScored || parseFloat(a.avgGoalsScored) || 1.0;
    const aGoalConceded = a.weightedAvgGoalsConceded || parseFloat(a.avgGoalsConceded) || 1.2;

    const hXg = h.xg_per90 || hGoalScored;
    const hXga = h.xga_per90 || hGoalConceded;
    const aXg = a.xg_per90 || aGoalScored;
    const aXga = a.xga_per90 || aGoalConceded;

    // Engine 6.0: Venue-specific blending
    const vH = hProfile.venueHomeStats; // Home team's home-only stats
    const vA = aProfile.venueAwayStats; // Away team's away-only stats

    let hAttack, hDefense, aAttack, aDefense;

    if (vH && vH.avgGoalsScored != null) {
      // Blend: 40% overall + 60% venue-specific
      const hOverallAtk = (hGoalScored * 0.5) + (hXg * 0.5);
      const hVenueAtk = vH.avgGoalsScored;
      hAttack = (hOverallAtk * 0.40) + (hVenueAtk * 0.60);
      const hOverallDef = (hGoalConceded * 0.5) + (hXga * 0.5);
      const hVenueDef = vH.avgGoalsConceded || hOverallDef;
      hDefense = (hOverallDef * 0.40) + (hVenueDef * 0.60);
    } else {
      hAttack = (hGoalScored * 0.5) + (hXg * 0.5);
      hDefense = (hGoalConceded * 0.5) + (hXga * 0.5);
    }

    if (vA && vA.avgGoalsScored != null) {
      const aOverallAtk = (aGoalScored * 0.5) + (aXg * 0.5);
      const aVenueAtk = vA.avgGoalsScored;
      aAttack = (aOverallAtk * 0.40) + (aVenueAtk * 0.60);
      const aOverallDef = (aGoalConceded * 0.5) + (aXga * 0.5);
      const aVenueDef = vA.avgGoalsConceded || aOverallDef;
      aDefense = (aOverallDef * 0.40) + (aVenueDef * 0.60);
    } else {
      aAttack = (aGoalScored * 0.5) + (aXg * 0.5);
      aDefense = (aGoalConceded * 0.5) + (aXga * 0.5);
    }

    const leagueAvg = 1.35;
    const isCupFinal = selectedMatchMode === "cup" && selectedCupFormat === "final";
    const homeAdvantage = isCupFinal ? 1.0 : 1.12;

    let lambda = Math.max(0.25, (hAttack / leagueAvg) * (aDefense / leagueAvg) * leagueAvg * homeAdvantage);
    let mu     = Math.max(0.20, (aAttack / leagueAvg) * (hDefense / leagueAvg) * leagueAvg);

    // Dixon-Coles tau parameter adjustment for low-scoring games (0-0, 1-0, 0-1, 1-1)
    const rho = -0.12;
    function tau(x, y, l, m) {
      if (x === 0 && y === 0) return Math.max(0.1, 1.0 - (l * m * rho));
      if (x === 1 && y === 0) return 1.0 + (m * rho);
      if (x === 0 && y === 1) return 1.0 + (l * rho);
      if (x === 1 && y === 1) return 1.0 - rho;
      return 1.0;
    }

    function poisson(l, k) {
      let logProb = -l + k * Math.log(l);
      let logFact = 0;
      for (let i = 1; i <= k; i++) logFact += Math.log(i);
      return Math.exp(logProb - logFact);
    }

    // Generate 6x6 score matrix
    const matrix = [];
    let sumProb = 0;
    for (let x = 0; x <= 5; x++) {
      matrix[x] = [];
      for (let y = 0; y <= 5; y++) {
        const p = poisson(lambda, x) * poisson(mu, y) * tau(x, y, lambda, mu);
        const pClamped = Math.max(0, p);
        matrix[x][y] = pClamped;
        sumProb += pClamped;
      }
    }

    // Normalize probabilities
    if (sumProb > 0) {
      for (let x = 0; x <= 5; x++) {
        for (let y = 0; y <= 5; y++) {
          matrix[x][y] /= sumProb;
        }
      }
    }

    let pHomeWin = 0, pDraw = 0, pAwayWin = 0;
    let pOver15 = 0, pOver25 = 0, pOver35 = 0, pUnder25 = 0;
    let pBTTS = 0, pBTTSNo = 0;
    let pHome15 = 0, pAway15 = 0;

    const scorelines = [];
    for (let x = 0; x <= 5; x++) {
      for (let y = 0; y <= 5; y++) {
        const p = matrix[x][y];
        scorelines.push({ hg: x, ag: y, prob: p, label: `${x}-${y}` });

        if (x > y) pHomeWin += p;
        else if (x === y) pDraw += p;
        else pAwayWin += p;

        if (x + y > 1.5) pOver15 += p;
        if (x + y > 2.5) pOver25 += p;
        if (x + y > 3.5) pOver35 += p;
        if (x + y < 2.5) pUnder25 += p;

        if (x > 0 && y > 0) pBTTS += p;
        else pBTTSNo += p;

        if (x >= 2) pHome15 += p;
        if (y >= 2) pAway15 += p;
      }
    }

    scorelines.sort((a, b) => b.prob - a.prob);

    // Half Time (IY) probabilities
    const iyLambda = lambda * 0.45;
    const iyMu = mu * 0.45;
    let pIYHome = 0, pIYDraw = 0, pIYAway = 0, pIYOver05 = 0, pIYOver15 = 0;
    let sumIYProb = 0;
    const iyMatrix = [];

    for (let x = 0; x <= 3; x++) {
      iyMatrix[x] = [];
      for (let y = 0; y <= 3; y++) {
        const p = poisson(iyLambda, x) * poisson(iyMu, y) * tau(x, y, iyLambda, iyMu);
        const pClamped = Math.max(0, p);
        iyMatrix[x][y] = pClamped;
        sumIYProb += pClamped;
      }
    }

    if (sumIYProb > 0) {
      for (let x = 0; x <= 3; x++) {
        for (let y = 0; y <= 3; y++) {
          iyMatrix[x][y] /= sumIYProb;
          const p = iyMatrix[x][y];
          if (x > y) pIYHome += p;
          else if (x === y) pIYDraw += p;
          else pIYAway += p;

          if (x + y > 0.5) pIYOver05 += p;
          if (x + y > 1.5) pIYOver15 += p;
        }
      }
    }

    const p1X = pHomeWin + pDraw;
    const pX2 = pAwayWin + pDraw;
    const p12 = pHomeWin + pAwayWin;

    return {
      lambda: parseFloat(lambda.toFixed(2)),
      mu: parseFloat(mu.toFixed(2)),
      totalExpGoals: parseFloat((lambda + mu).toFixed(2)),
      matrix,
      scorelines,
      topScores: scorelines.slice(0, 9),
      mostLikelyScore: scorelines[0].label,
      pHomeWin: Math.round(pHomeWin * 100),
      pDraw: Math.round(pDraw * 100),
      pAwayWin: Math.round(pAwayWin * 100),
      p1X: Math.round(p1X * 100),
      pX2: Math.round(pX2 * 100),
      p12: Math.round(p12 * 100),
      pOver15: Math.round(pOver15 * 100),
      pOver25: Math.round(pOver25 * 100),
      pOver35: Math.round(pOver35 * 100),
      pUnder25: Math.round(pUnder25 * 100),
      pBTTS: Math.round(pBTTS * 100),
      pBTTSNo: Math.round(pBTTSNo * 100),
      pHome15: Math.round(pHome15 * 100),
      pAway15: Math.round(pAway15 * 100),
      pIYHome: Math.round(pIYHome * 100),
      pIYDraw: Math.round(pIYDraw * 100),
      pIYAway: Math.round(pIYAway * 100),
      pIYOver05: Math.round(pIYOver05 * 100),
      pIYOver15: Math.round(pIYOver15 * 100)
    };
  }

  // Calculate Fair Odds and Expected Value (EV)
  function calcEVandOdds(probPct, defaultOddsFactor = 0.94) {
    const probRatio = Math.max(0.01, Math.min(0.99, probPct / 100));
    const fairOdds = parseFloat((1 / probRatio).toFixed(2));
    const marketOdds = parseFloat(Math.max(1.12, Math.min(12.0, (1 / probRatio) * defaultOddsFactor)).toFixed(2));
    const ev = parseFloat(((probRatio * marketOdds) - 1).toFixed(3));
    const evPct = Math.round(ev * 100);
    const isValueBet = evPct >= 4;
    return { fairOdds, marketOdds, ev, evPct, isValueBet };
  }

  function calcPoissonCumulative(lambda, k) {
    if (lambda <= 0) return 1;
    let sum = 0;
    let term = Math.exp(-lambda);
    sum += term;
    for (let i = 1; i <= k; i++) {
      term *= (lambda / i);
      sum += term;
    }
    return sum;
  }

  function generatePoissonMatrix() {
    if (!homeProfile || !awayProfile) return;
    const quantData = calculateDixonColesProbabilities(homeProfile, awayProfile);
    if (!quantData) return;

    const top9 = quantData.topScores;
    const maxProb = top9[0].prob || 0.01;

    poissonGrid.innerHTML = '';
    top9.forEach((sc, idx) => {
      const pct = Math.round(sc.prob * 100 * 10) / 10;
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

    poissonLikelyRow.innerHTML = `
      <div class="poisson-likely-label">En Olası Dixon-Coles Skorları:</div>
      ${top9.slice(0, 3).map((sc, i) => `
        <div class="poisson-likely-pill rank-pill-${i}">
          <span class="likely-score">${sc.label}</span>
          <span class="likely-pct">%${Math.round(sc.prob * 1000) / 10}</span>
        </div>
      `).join('')}
    `;
  }

  // Engine 6.0: Calculate match probabilities with deep research metrics
  function calculateMatchProbabilities() {
    if (!homeProfile || !awayProfile) return null;
    const quant = calculateDixonColesProbabilities(homeProfile, awayProfile);
    if (!quant) return null;

    const h = homeProfile.stats;
    const a = awayProfile.stats;

    const cornerRes = calculateResearchedCorners(homeProfile, awayProfile);
    const expCorners = cornerRes ? cornerRes.totalCorners.toFixed(1) : (parseFloat(h.avgCorners || 4.8) + parseFloat(a.avgCorners || 4.8)).toFixed(1);
    const expCards   = (parseFloat(h.avgYellowCards || 1.9) + parseFloat(a.avgYellowCards || 1.9)).toFixed(1);
    const expFouls   = (parseFloat(h.avgFouls || 0) + parseFloat(a.avgFouls || 0)).toFixed(1);

    // Venue-specific win percentages
    const vH = homeProfile.venueHomeStats;
    const vA = awayProfile.venueAwayStats;
    const homeVenueWinPct = vH ? (vH.winPct || h.winPct || 0) : (h.winPct || 0);
    const awayVenueWinPct = vA ? (vA.winPct || a.winPct || 0) : (a.winPct || 0);

    const hAdv = {
      wWinPct: h.winPct || 0,
      venueWinPct: homeVenueWinPct,
      momentum: ((h.formPoints || 0) - 7.5) / 7.5
    };
    const aAdv = {
      wWinPct: a.winPct || 0,
      venueWinPct: awayVenueWinPct,
      momentum: ((a.formPoints || 0) - 7.5) / 7.5
    };

    // Engine 6.0: Form trend (improving/declining)
    function calcFormTrend(matches) {
      if (!matches || matches.length < 4) return 0;
      const recent2 = matches.slice(-2);
      const older2 = matches.slice(-4, -2);
      const recentPts = recent2.reduce((s, m) => s + (m.result === 'W' ? 3 : m.result === 'D' ? 1 : 0), 0);
      const olderPts = older2.reduce((s, m) => s + (m.result === 'W' ? 3 : m.result === 'D' ? 1 : 0), 0);
      return recentPts - olderPts; // positive = improving, negative = declining
    }

    return {
      ...quant,
      xG_home: quant.lambda,
      xG_away: quant.mu,
      expCorners,
      cornerData: cornerRes,
      expCards,
      expFouls,
      hAdv,
      aAdv,
      // Engine 6.0 deep metrics
      homeCleanSheetPct: h.cleanSheetPct || 0,
      awayCleanSheetPct: a.cleanSheetPct || 0,
      homeHtGoalPct: h.htOver05Pct || 0,
      awayHtGoalPct: a.htOver05Pct || 0,
      homeFouls: parseFloat(h.avgFouls || 0),
      awayFouls: parseFloat(a.avgFouls || 0),
      homeImpliedProb: h.impliedWinProb || null,
      awayImpliedProb: a.impliedWinProb || null,
      homeFormTrend: calcFormTrend(homeProfile.matches),
      awayFormTrend: calcFormTrend(awayProfile.matches),
      homeXgDiff: h.xg_diff || 0,
      awayXgDiff: a.xg_diff || 0
    };
  }

  // =============================================
  // Gemini 3.8 Flash Client Caching & Fast Stream Engine
  // =============================================
  const clientAiAnalysisCache = new Map();
  let currentAiAbortController = null;
  let aiTypewriterTimer = null;

  function fastStreamText(element, fullText, onDone) {
    if (aiTypewriterTimer) {
      clearInterval(aiTypewriterTimer);
      aiTypewriterTimer = null;
    }
    if (!element) return;
    element.textContent = '';
    let idx = 0;
    const chars = Array.from(fullText);
    aiTypewriterTimer = setInterval(() => {
      if (idx < chars.length) {
        // Render 3-4 chars per tick for ultra-responsive, snappy feel (~12ms)
        const chunk = chars.slice(idx, idx + 4).join('');
        element.textContent += chunk;
        idx += 4;
      } else {
        clearInterval(aiTypewriterTimer);
        aiTypewriterTimer = null;
        if (typeof onDone === 'function') onDone();
      }
    }, 12);
  }

  // AI Prediction Engine 6.0: Multi-Factor Research Score + Category-First Signal Picker
  // Her bahis adayı 6 bağımsız araştırma faktörü ile puanlanır
  function generateAIPrediction() {
    if (!homeProfile || !awayProfile) return;

    const probs = calculateMatchProbabilities();
    if (!probs) return;

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

    const aiExpGoalsSummary = document.getElementById("aiExpGoalsSummary");
    const aiExpCornersSummary = document.getElementById("aiExpCornersSummary");
    const aiExpCardsSummary = document.getElementById("aiExpCardsSummary");
    if (aiExpGoalsSummary) aiExpGoalsSummary.textContent = `${probs.totalExpGoals || (probs.xG_home + probs.xG_away).toFixed(2)} xG`;
    if (aiExpCornersSummary) aiExpCornersSummary.textContent = `${probs.expCorners} Korner`;
    if (aiExpCardsSummary) aiExpCardsSummary.textContent = `${probs.expCards} Kart`;

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

    // Engine 6.0: New deep analysis variables
    const homeFouls      = parseFloat(hStats.avgFouls || 0);
    const awayFouls      = parseFloat(aStats.avgFouls || 0);
    const totalFouls     = homeFouls + awayFouls;
    const homeCleanSheet = hStats.cleanSheetPct || 0;
    const awayCleanSheet = aStats.cleanSheetPct || 0;
    const homeHtGoalPct  = hStats.htOver05Pct || 0;
    const awayHtGoalPct  = aStats.htOver05Pct || 0;
    const homeFormTrend  = probs.homeFormTrend || 0;
    const awayFormTrend  = probs.awayFormTrend || 0;

    // Ortalamalar
    const totalCornersExp = parseFloat(probs.expCorners);
    const totalCardsExp   = parseFloat(probs.expCards);
    const avgBttsCombined = (homeBtts + awayBtts) / 2;
    const avgOver25Comb   = (homeOver25 + awayOver25) / 2;
    const homeEdge        = probs.pHomeWin - probs.pAwayWin;
    const awayEdge        = probs.pAwayWin - probs.pHomeWin;

    // Engine 6.0: Multi-Factor Research Score Calculator
    // 6 factors: Dixon-Coles Prob (25%), Form Trend (20%), Venue Performance (20%),
    // Market Alignment (15%), Category History (10%), Supporting Stats Count (10%)
    const categoryHistoryWeight = { kart: 0.93, taraf: 0.74, korner: 0.64, gol: 0.56 };

    function calcResearchScore(candidate) {
      const f1 = Math.min(100, (candidate.pct / 80) * 100) * 0.25; // Dixon-Coles
      // Form trend: positive is good for the pick
      const trendVal = candidate.category === 'taraf'
        ? (candidate.title.includes('1') ? homeFormTrend : awayFormTrend)
        : (homeFormTrend + awayFormTrend) / 2;
      const f2 = Math.min(100, 50 + trendVal * 10) * 0.20; // Form trend
      // Venue performance
      const venueScore = candidate.category === 'taraf'
        ? (candidate.title.includes('1') ? (hAdv.venueWinPct || hAdv.wWinPct) : (aAdv.venueWinPct || aAdv.wWinPct))
        : Math.max(hAdv.venueWinPct || 0, aAdv.venueWinPct || 0);
      const f3 = Math.min(100, venueScore * 1.3) * 0.20; // Venue
      // Market alignment (if implied prob exists)
      const impliedH = probs.homeImpliedProb;
      const impliedA = probs.awayImpliedProb;
      let f4 = 50 * 0.15; // default neutral
      if (impliedH && impliedA) {
        const modelP = candidate.pct / 100;
        const diffFromMarket = Math.abs(modelP - (candidate.title.includes('1') ? impliedH : candidate.title.includes('2') ? impliedA : 0.5));
        f4 = Math.min(100, 100 - diffFromMarket * 200) * 0.15;
      }
      const f5 = (categoryHistoryWeight[candidate.category] || 0.60) * 100 * 0.10; // Category history
      const f6 = Math.min(100, (candidate.supportingFactors || 2) * 20) * 0.10; // Supporting stats count
      return Math.round(f1 + f2 + f3 + f4 + f5 + f6);
    }

    // ────────────────────────────────────────────────────────
    // ADAY HAVUZU: Her kategoriden adaylar (Engine 6.0 filtreleriyle)
    // ────────────────────────────────────────────────────────
    const candidates = [];

    // ── KATEGORI 1: KART BAHİSLERİ (Engine 6.0: Faul Entegrasyonu) ──
    if (cardsReliable) {
      // Engine 6.0: Kupa maçlarında kart çarpanı
      const cupCardMultiplier = selectedMatchMode === "cup" ? 1.15 : 1.0;
      const adjustedCardsExp = totalCardsExp * cupCardMultiplier;
      // Faul bonus: yüksek faul ortalaması (≥13 toplam) kart sinyalini güçlendirir
      const foulBonus = totalFouls >= 13 ? (totalFouls - 12) * 3 : 0;

      if (adjustedCardsExp >= 4.5 && homeCards >= 1.8 && awayCards >= 1.8) {
        let sf = 2; // supporting factors count
        if (totalFouls >= 13) sf++;
        if (selectedMatchMode === "cup") sf++;
        const pct = Math.min(87, Math.round(adjustedCardsExp * 14));
        const pros = [`Toplam kart ort. ${(homeCards+awayCards).toFixed(1)}`];
        const cons = [];
        if (totalFouls >= 13) pros.push(`Yüksek faul temposu (${totalFouls.toFixed(0)})`);
        if (selectedMatchMode === "cup") pros.push('Kupa maçı tansiyon çarpanı');
        if (homeCards < 2.0 || awayCards < 2.0) cons.push('Bir takımın kart ortalaması 2.0 altında');
        candidates.push({
          category: "kart",
          title: "TOPLAM SARI KART 4.5 ÜST",
          pct, odds: 1.95,
          signal: (adjustedCardsExp - 4.0) * 10 + (homeCards + awayCards - 3.5) * 6 + foulBonus,
          supportingFactors: sf,
          pros, cons,
          reason: `${homeProfile.teamName} (${homeCards}) ve ${awayProfile.teamName} (${awayCards}) toplam ${(homeCards+awayCards).toFixed(1)} kart ort.${totalFouls >= 13 ? ` Faul temposu yüksek (${totalFouls.toFixed(0)}).` : ''} ⚠️ Hakem profili kontrol edilmelidir.`
        });
      }
      if (adjustedCardsExp >= 3.8 && homeCards >= 1.5 && awayCards >= 1.5) {
        let sf = 2;
        if (totalFouls >= 12) sf++;
        const pct = Math.min(87, Math.round(adjustedCardsExp * 16));
        const pros = [`Kart beklentisi ${adjustedCardsExp.toFixed(1)}`];
        const cons = [];
        if (totalFouls >= 12) pros.push(`Faul ortalaması (${totalFouls.toFixed(0)})`);
        if (adjustedCardsExp < 4.0) cons.push('Beklenti 4.0 altında, sınıra yakın');
        candidates.push({
          category: "kart",
          title: "TOPLAM SARI KART 3.5 ÜST",
          pct, odds: 1.72,
          signal: (adjustedCardsExp - 3.0) * 8 + (homeCards + awayCards - 3.0) * 5 + foulBonus,
          supportingFactors: sf,
          pros, cons,
          reason: `Toplam kart beklentisi ${adjustedCardsExp.toFixed(1)}.${totalFouls >= 12 ? ` Faul yoğunluğu (${totalFouls.toFixed(0)}) sinyali destekliyor.` : ''}`
        });
      }
      if (adjustedCardsExp < 3.2) {
        const pLow = Math.min(82, Math.round((4.0 - adjustedCardsExp) * 20));
        const pros = [`Düşük kart ort. (${(homeCards+awayCards).toFixed(1)})`];
        const cons = [];
        if (totalFouls >= 10) cons.push(`Faul ortalaması orta seviyede (${totalFouls.toFixed(0)})`);
        if (selectedMatchMode === "cup") cons.push('Kupa maçları tansiyon artırabilir');
        candidates.push({
          category: "kart",
          title: "TOPLAM SARI KART 3.5 ALT",
          pct: pLow, odds: 1.80,
          signal: (3.5 - adjustedCardsExp) * 12,
          supportingFactors: totalFouls < 10 ? 3 : 2,
          pros, cons,
          reason: `Takımların kart ortalaması düşük (${homeCards} + ${awayCards} = ${(homeCards+awayCards).toFixed(1)}). ${totalFouls < 10 ? 'Düşük faul temposu destekliyor.' : ''}`
        });
      }
    }

    // ── KATEGORI 2: KORNER BAHİSLERİ (Engine 6.0: Researched Corners) ──
    const cData = probs.cornerData;
    if (cornersReliable) {
      if (totalCornersExp >= 9.8) {
        const pct = cData ? cData.pOver95 : Math.min(84, Math.round(totalCornersExp * 7.5));
        candidates.push({
          category: "korner",
          title: "TOPLAM KORNER 9.5 ÜST",
          pct, odds: 1.90,
          signal: (totalCornersExp - 9.0) * 18 + (homeCorners + awayCorners - 9.0) * 12,
          supportingFactors: 4,
          pros: [`Beklenen korner: ${totalCornersExp}`, `Kanat temposu ve şut baskısı`, `Poisson 9.5Ü: %${pct}`],
          cons: [totalCornersExp < 10.2 ? '10.0 sınırına yakın' : ''],
          reason: `Takımların korner kazanma ve savunma dinamikleri araştırmasına göre beklenen korner ${totalCornersExp} (Ev ${cData ? cData.expHome : homeCorners} / Dep ${cData ? cData.expAway : awayCorners}). 9.5 Üst için güçlü istatistiksel sinyal.`
        });
      } else if (totalCornersExp >= 8.8) {
        const pct = cData ? cData.pOver85 : Math.min(80, Math.round(totalCornersExp * 8.0));
        candidates.push({
          category: "korner",
          title: "TOPLAM KORNER 8.5 ÜST",
          pct, odds: 1.75,
          signal: (totalCornersExp - 8.0) * 16,
          supportingFactors: 3,
          pros: [`Toplam korner beklentisi ${totalCornersExp}`, 'Kanat organizasyonları aktif', `8.5Ü Olasılığı %${pct}`],
          cons: [],
          reason: `Maç başına araştırılan beklenen korner ${totalCornersExp} (Ev ${cData ? cData.expHome : homeCorners} / Dep ${cData ? cData.expAway : awayCorners}) — 8.5 Üst için değer sunuyor.`
        });
      } else if (totalCornersExp < 8.5) {
        const pLow = cData ? cData.pUnder85 : Math.min(78, Math.round((9.5 - totalCornersExp) * 10));
        candidates.push({
          category: "korner",
          title: "TOPLAM KORNER 8.5 ALT",
          pct: pLow, odds: 1.75,
          signal: (8.5 - totalCornersExp) * 14,
          supportingFactors: 3,
          pros: [`Düşük korner beklentisi (${totalCornersExp})`, 'Merkezi oyun tercihi', `8.5A Olasılığı %${pLow}`],
          cons: [totalCornersExp > 8.0 ? '8.5 sınırına yakın' : ''],
          reason: `İki takımın kontrollü kanat organizasyonları ve korner savunmaları araştırmasına göre beklenen korner ${totalCornersExp}. 8.5 Alt potansiyeli yüksek.`
        });
      }
    }

    // ── KATEGORI 3: GOL BAHİSLERİ (Engine 6.0: Sıkılaştırılmış Filtreler + Clean Sheet) ──
    // 2.5 Üst — Eşikler yükseltildi: %58+, xG ≥ 2.50, avgOver25 ≥ 52%, hücum gücü kontrolü
    const over25Signal = (avgOver25Comb - 45) * 0.7 + (totalXG - 2.0) * 18 + (probs.pOver25 - 50) * 0.6;
    if (probs.pOver25 >= 58 && totalXG >= 2.50 && avgOver25Comb >= 52 && homeAttack >= 1.10 && awayAttack >= 0.95) {
      let sf = 3;
      const pros = [`xG toplamı ${totalXG.toFixed(2)}`, `2.5Ü ort. %${avgOver25Comb}`];
      const cons = [];
      if (homeCleanSheet >= 40 || awayCleanSheet >= 40) { cons.push(`Yüksek clean sheet (Ev %${homeCleanSheet} / Dep %${awayCleanSheet})`); }
      else { sf++; pros.push('Düşük clean sheet oranları'); }
      if (homeFormTrend > 0 || awayFormTrend > 0) { sf++; pros.push('Yükselen form trendi'); }
      candidates.push({
        category: "gol",
        title: "TOPLAM GOL 2.5 ÜST",
        pct: probs.pOver25,
        odds: parseFloat(Math.max(1.68, Math.min(2.10, (100/probs.pOver25)*0.94)).toFixed(2)),
        signal: Math.min(100, Math.max(0, over25Signal)),
        supportingFactors: sf,
        pros, cons,
        reason: `xG toplamı ${totalXG.toFixed(2)}, 2.5Ü ort. %${avgOver25Comb}. ${homeProfile.teamName} ${hStats.avgGoalsScored} / ${awayProfile.teamName} ${aStats.avgGoalsScored} gol ort. ile gollü maç beklentisi güçlü.`
      });
    }
    // 2.5 Alt — Eşikler: %56+, xG ≤ 2.20, avgOver25 ≤ 48%, clean sheet desteği
    const pUnder25 = 100 - probs.pOver25;
    const under25Signal = (65 - avgOver25Comb) * 0.8 + (2.8 - totalXG) * 15 + (pUnder25 - 50) * 0.5;
    if (pUnder25 >= 56 && totalXG <= 2.20 && avgOver25Comb <= 48) {
      let sf = 3;
      const pros = [`Düşük xG (${totalXG.toFixed(2)})`, `2.5Ü ort. sadece %${avgOver25Comb}`];
      const cons = [];
      if (homeCleanSheet >= 20 && awayCleanSheet >= 20) { sf++; pros.push(`Güçlü savunmalar (CS: Ev %${homeCleanSheet} / Dep %${awayCleanSheet})`); }
      if (homeAttack >= 1.5 || awayAttack >= 1.5) cons.push(`Bir tarafın gol ortalaması yüksek`);
      candidates.push({
        category: "gol",
        title: "TOPLAM GOL 2.5 ALT",
        pct: pUnder25,
        odds: parseFloat(Math.max(1.68, Math.min(2.10, (100/pUnder25)*0.94)).toFixed(2)),
        signal: Math.min(100, Math.max(0, under25Signal)),
        supportingFactors: sf,
        pros, cons,
        reason: `Savunma odaklı maç. xG ${totalXG.toFixed(2)}, clean sheet oranları Ev %${homeCleanSheet} / Dep %${awayCleanSheet}. Düşük skor tahmini.`
      });
    }
    // KG Var — Eşikler: %58+, avgBtts ≥ 52%, clean sheet ≤ 45%
    const bttsSignal = (avgBttsCombined - 42) * 0.9 + (homeAttack > 1.0 ? 14 : 0) + (awayAttack > 0.9 ? 12 : 0)
      + (homeDef > 1.1 ? 8 : 0) + (awayDef > 1.0 ? 8 : 0) + (probs.pBTTS - 50) * 0.7;
    if (probs.pBTTS >= 58 && avgBttsCombined >= 52 && homeAttack > 0.95 && awayAttack > 0.85 && homeCleanSheet <= 45 && awayCleanSheet <= 45) {
      let sf = 3;
      const pros = [`KG Var ort. %${avgBttsCombined}`, `Her iki taraf gol üretebilir`];
      const cons = [];
      if (homeCleanSheet >= 30) cons.push(`Ev sahibi CS %${homeCleanSheet}`);
      if (awayCleanSheet >= 30) cons.push(`Deplasman CS %${awayCleanSheet}`);
      if (homeAttack >= 1.2 && awayAttack >= 1.0) { sf++; pros.push('Her iki hücum potansiyeli güçlü'); }
      candidates.push({
        category: "gol",
        title: "KARŞILIKLI GOL VAR (KG VAR)",
        pct: probs.pBTTS,
        odds: parseFloat(Math.max(1.62, Math.min(1.92, (100/probs.pBTTS)*0.94)).toFixed(2)),
        signal: Math.min(100, Math.max(0, bttsSignal)),
        supportingFactors: sf,
        pros, cons,
        reason: `KG Var ort. %${avgBttsCombined}. ${homeProfile.teamName} %${homeBtts} / ${awayProfile.teamName} %${awayBtts}. Clean sheet düşük (Ev %${homeCleanSheet} / Dep %${awayCleanSheet}).`
      });
    }
    // KG Yok — Clean sheet desteği eklendi
    const pBttsNo = 100 - probs.pBTTS;
    const bttsNoSignal = (55 - avgBttsCombined) * 0.9 + (homeDef < 1.0 ? 12 : 0) + (awayDef < 0.95 ? 12 : 0) + (pBttsNo - 45) * 0.6;
    if (pBttsNo >= 50 && avgBttsCombined <= 50 && !(homeAttack > 1.5 && awayAttack > 1.3)) {
      let sf = 2;
      const pros = [`KG Yok ort. %${100 - Math.round(avgBttsCombined)}`];
      const cons = [];
      if (homeCleanSheet >= 30) { sf++; pros.push(`Ev sahibi CS %${homeCleanSheet}`); }
      if (awayCleanSheet >= 30) { sf++; pros.push(`Deplasman CS %${awayCleanSheet}`); }
      if (homeAttack >= 1.3) cons.push(`Ev sahibi gol ort. yüksek (${homeAttack.toFixed(1)})`);
      candidates.push({
        category: "gol",
        title: "KARŞILIKLI GOL YOK (KG YOK)",
        pct: pBttsNo,
        odds: parseFloat(Math.max(1.55, Math.min(1.85, (100/pBttsNo)*0.94)).toFixed(2)),
        signal: Math.min(100, Math.max(0, bttsNoSignal)),
        supportingFactors: sf,
        pros, cons,
        reason: `En az bir taraf gol bulamayabilir. Clean sheet: Ev %${homeCleanSheet} / Dep %${awayCleanSheet}. KG Yok geçmişi güçlü.`
      });
    }
    // 3.5 Üst
    if (probs.pOver35 >= 28 && totalXG >= 3.0 && homeAttack >= 1.5 && awayAttack >= 1.3) {
      const sig = (totalXG - 2.8) * 20 + (avgOver25Comb - 50) * 0.8 + (probs.pOver35 - 25) * 0.8;
      const pros = [`xG ${totalXG.toFixed(2)}`, `Yüksek hücum gücü`];
      const cons = [];
      if (homeCleanSheet >= 30 || awayCleanSheet >= 30) cons.push('Yüksek clean sheet riski');
      candidates.push({
        category: "gol",
        title: "TOPLAM GOL 3.5 ÜST",
        pct: probs.pOver35,
        odds: parseFloat(Math.max(1.95, Math.min(2.80, (100/probs.pOver35)*0.94)).toFixed(2)),
        signal: Math.min(100, Math.max(0, sig)),
        supportingFactors: 3,
        pros, cons,
        reason: `Hücum ağırlıklı maç. xG ${totalXG.toFixed(2)}, ev sahibi ${homeAttack.toFixed(1)} / deplasman ${awayAttack.toFixed(1)} gol ort. ile 4+ gol potansiyeli.`
      });
    }
    // Ev takımı 1.5 Üst
    const home15 = Math.round((1 - Math.exp(-probs.xG_home) * (1 + probs.xG_home)) * 100);
    if (probs.xG_home >= 1.55 && home15 >= 53 && homeAttack >= 1.2) {
      const pros = [`xG ${probs.xG_home}`, `Gol ort. ${hStats.avgGoalsScored}`];
      const cons = [];
      if (awayCleanSheet >= 35) cons.push(`Deplasman CS %${awayCleanSheet}`);
      candidates.push({
        category: "gol",
        title: `${homeProfile.teamName.toUpperCase()} 1.5 GOL ÜSTÜ`,
        pct: Math.min(82, Math.max(53, home15)),
        odds: parseFloat(Math.max(1.65, Math.min(2.15, (100/Math.max(50,home15))*0.93)).toFixed(2)),
        signal: (homeAttack - 1.0)*30 + (probs.xG_home - 1.2)*22 + (home15-48)*0.6 + homeMom*12,
        supportingFactors: awayCleanSheet < 30 ? 4 : 3,
        pros, cons,
        reason: `${homeProfile.teamName} iç sahada xG ${probs.xG_home}, gol ort. ${hStats.avgGoalsScored}. Rakip CS %${awayCleanSheet}.`
      });
    }
    // Deplasman 1.5 Üst
    const away15 = Math.round((1 - Math.exp(-probs.xG_away) * (1 + probs.xG_away)) * 100);
    if (probs.xG_away >= 1.45 && away15 >= 50 && awayAttack >= 1.1 && awayEdge >= -5) {
      const pros = [`xG ${probs.xG_away}`, `Gol ort. ${aStats.avgGoalsScored}`];
      const cons = [];
      if (homeCleanSheet >= 35) cons.push(`Ev sahibi CS %${homeCleanSheet}`);
      candidates.push({
        category: "gol",
        title: `${awayProfile.teamName.toUpperCase()} 1.5 GOL ÜSTÜ`,
        pct: Math.min(80, Math.max(50, away15)),
        odds: parseFloat(Math.max(1.75, Math.min(2.40, (100/Math.max(44,away15))*0.93)).toFixed(2)),
        signal: (awayAttack - 0.9)*28 + (probs.xG_away - 1.1)*20 + (away15-46)*0.6 + awayMom*12,
        supportingFactors: homeCleanSheet < 30 ? 4 : 3,
        pros, cons,
        reason: `${awayProfile.teamName} deplasmanda xG ${probs.xG_away}, gol ort. ${aStats.avgGoalsScored}. Rakip CS %${homeCleanSheet}.`
      });
    }

    // ── KATEGORI 4: MAÇ TARAF BAHİSLERİ (Engine 6.0: Venue + Form Trend + Implied Prob) ──
    // Ev sahibi favori
    const homeVenuePct = hAdv.venueWinPct || hAdv.wWinPct;
    if (homeEdge >= 14 && probs.xG_home >= probs.xG_away + 0.15 && homeVenuePct >= 42) {
      let sf = 3;
      const pros = [`İç saha galibiyeti %${homeVenuePct}`, `xG üstünlüğü (${probs.xG_home} vs ${probs.xG_away})`];
      const cons = [];
      if (homeMom > 0) { sf++; pros.push('Pozitif form momentumu'); }
      if (homeFormTrend > 0) { sf++; pros.push('Yükselen form trendi'); }
      if (awayCleanSheet >= 35) cons.push(`Deplasman clean sheet %${awayCleanSheet}`);
      const sig = homeEdge * 0.6 + (homeVenuePct - 40)*0.4 + homeMom*15 + (homeFormTrend > 0 ? 8 : 0);
      const estOdds = parseFloat(Math.max(1.62, Math.min(2.20, (100/probs.pHomeWin)*0.94)).toFixed(2));
      candidates.push({
        category: "taraf",
        title: `MAÇ SONUCU 1 (${homeProfile.teamName.toUpperCase()} KAZANIR)`,
        pct: probs.pHomeWin, odds: estOdds,
        signal: Math.min(100, sig),
        supportingFactors: sf,
        pros, cons,
        reason: `${hSeason} sezonu: ${homeProfile.teamName} iç sahada %${homeVenuePct} galibiyet ve ${probs.xG_home} xG üstünlüğüyle net favori.`
      });
    }
    // Deplasman favori
    const awayVenuePct = aAdv.venueWinPct || aAdv.wWinPct;
    if (awayEdge >= 10 && probs.xG_away >= probs.xG_home + 0.15 && awayVenuePct >= 38) {
      let sf = 3;
      const pros = [`Deplasman galibiyeti %${awayVenuePct}`, `xG üstünlüğü (${probs.xG_away} vs ${probs.xG_home})`];
      const cons = [];
      if (awayMom > 0) { sf++; pros.push('Pozitif deplasman ivmesi'); }
      if (awayFormTrend > 0) { sf++; pros.push('Yükselen form trendi'); }
      if (homeCleanSheet >= 35) cons.push(`Ev sahibi clean sheet %${homeCleanSheet}`);
      const sig = awayEdge * 0.6 + (awayVenuePct - 38)*0.4 + awayMom*15 + (awayFormTrend > 0 ? 8 : 0);
      const estOdds = parseFloat(Math.max(1.72, Math.min(2.60, (100/probs.pAwayWin)*0.94)).toFixed(2));
      candidates.push({
        category: "taraf",
        title: `MAÇ SONUCU 2 (${awayProfile.teamName.toUpperCase()} KAZANIR)`,
        pct: probs.pAwayWin, odds: estOdds,
        signal: Math.min(100, sig),
        supportingFactors: sf,
        pros, cons,
        reason: `${aSeason} sezonu: ${awayProfile.teamName} deplasmanda %${awayVenuePct} galibiyet ve ${probs.xG_away} xG ile güçlü aday.`
      });
    }
    // 1-X Çifte Şans
    if (probs.pHomeWin >= 35 && probs.p1X >= 62 && homeEdge >= -5 && probs.pAwayWin <= 36) {
      candidates.push({
        category: "taraf",
        title: `ÇİFTE ŞANS 1-X (${homeProfile.teamName.toUpperCase()} KAZANIR VEYA BERABERLİK)`,
        pct: probs.p1X, odds: 1.38,
        signal: (probs.p1X - 58)*0.9 + homeEdge*0.3,
        supportingFactors: 4,
        pros: [`Ev sahibi yenilmeme %${probs.p1X}`, 'İç saha direnci'],
        cons: [],
        reason: `${homeProfile.teamName} iç saha avantajı; ev sahibi ya da beraberlik olasılığı %${probs.p1X} ile güvenli tercih.`
      });
    }
    // X-2 Çifte Şans
    if (probs.pAwayWin >= 32 && probs.pX2 >= 60 && awayEdge >= -5 && probs.pHomeWin <= 38) {
      candidates.push({
        category: "taraf",
        title: `ÇİFTE ŞANS X-2 (${awayProfile.teamName.toUpperCase()} KAZANIR VEYA BERABERLİK)`,
        pct: probs.pX2, odds: 1.45,
        signal: (probs.pX2 - 56)*0.9 + awayEdge*0.3,
        supportingFactors: 4,
        pros: [`Deplasman yenilmeme %${probs.pX2}`, 'Deplasman direnci'],
        cons: [],
        reason: `${awayProfile.teamName} deplasman direnci; deplasman ya da beraberlik olasılığı %${probs.pX2}.`
      });
    }

    // ── FALLBACK: Hiçbir sinyal tetiklenmediyse ──
    if (candidates.length === 0) {
      if (probs.pHomeWin >= probs.pAwayWin + 8) {
        candidates.push({ category:"taraf", title:`MAÇ SONUCU 1 (${homeProfile.teamName.toUpperCase()} KAZANIR)`,
          pct:probs.pHomeWin, odds:parseFloat(Math.max(1.62, Math.min(2.20,(100/probs.pHomeWin)*0.94)).toFixed(2)),
          signal:28, supportingFactors: 2, pros: ['Simülasyon favorisi'], cons: ['Sıkı sınırları karşılamıyor'],
          reason:`${homeProfile.teamName} simülasyon sonuçlarına göre en güçlü galibiyet adayı (%${probs.pHomeWin}).` });
      } else if (probs.pAwayWin >= probs.pHomeWin + 8) {
        candidates.push({ category:"taraf", title:`MAÇ SONUCU 2 (${awayProfile.teamName.toUpperCase()} KAZANIR)`,
          pct:probs.pAwayWin, odds:parseFloat(Math.max(1.72, Math.min(2.55,(100/probs.pAwayWin)*0.94)).toFixed(2)),
          signal:28, supportingFactors: 2, pros: ['Simülasyon favorisi'], cons: ['Sıkı sınırları karşılamıyor'],
          reason:`${awayProfile.teamName} simülasyon sonuçlarına göre en güçlü deplasman adayı (%${probs.pAwayWin}).` });
      } else if (probs.pOver25 >= 55) {
        candidates.push({ category:"gol", title:"TOPLAM GOL 2.5 ÜST", pct:probs.pOver25,
          odds:parseFloat(Math.max(1.68,Math.min(2.10,(100/probs.pOver25)*0.94)).toFixed(2)),
          signal:26, supportingFactors: 2, pros: [`xG toplamı ${totalXG.toFixed(2)}`], cons: ['Dengeli tempo'],
          reason:`xG toplamı ${totalXG.toFixed(2)} ile gollü karşılaşma bekleniyor.` });
      } else {
        candidates.push({ category:"gol", title:"TOPLAM GOL 2.5 ALT", pct:100-probs.pOver25,
          odds:1.80, signal:24, supportingFactors: 2, pros: ['Dengeli güç'], cons: ['Düşük hücum temposu'],
          reason:"Dengeli güç, kontrollü oyun — 2.5 Alt öne çıkıyor." });
      }
    }

    // Engine 6.0: Calculate Research Score for each candidate & Composite Rank
    candidates.forEach(c => {
      c.researchScore = calcResearchScore(c);
      // Composite score: 65% Research Score + 35% Signal Strength
      c.compositeScore = Math.round((c.researchScore * 0.65) + ((c.signal || 50) * 0.35));
    });

    // En yüksek composite skora göre sırala
    candidates.sort((a, b) => b.compositeScore - a.compositeScore);
    const bestPick = candidates[0];
    currentAIPick = bestPick;

    const evData = calcEVandOdds(bestPick.pct);

    const aiBetTitle        = document.getElementById("aiBetTitle");
    const aiConfidenceValue = document.getElementById("aiConfidenceValue");
    const aiExplanationText = document.getElementById("aiExplanationText");
    const aiExplanationTitle= document.getElementById("aiExplanationTitle");
    const aiOddsValue       = document.getElementById("aiOddsValue");
    const aiFairOddsValue   = document.getElementById("aiFairOddsValue");
    const aiValueBadge      = document.getElementById("aiValueBadge");
    const aiModelBadge      = document.getElementById("aiModelBadge");
    const geminiTacticalDetails = document.getElementById("geminiTacticalDetails");
    const geminiTacticalText    = document.getElementById("geminiTacticalText");
    const geminiRiskText        = document.getElementById("geminiRiskText");
    const aiBankoConfidence = document.getElementById("aiBankoConfidence");
    const aiBankoReason     = document.getElementById("aiBankoReason");

    if (aiBetTitle)        aiBetTitle.textContent        = bestPick.title;
    if (aiConfidenceValue) aiConfidenceValue.textContent = `%${bestPick.pct}`;
    if (aiBankoConfidence) aiBankoConfidence.textContent = `%${bestPick.pct} GÜVEN`;
    if (aiExplanationText) aiExplanationText.textContent = bestPick.reason;
    if (aiBankoReason)     aiBankoReason.textContent     = bestPick.reason;
    if (aiOddsValue)       aiOddsValue.textContent       = bestPick.odds ? bestPick.odds.toFixed(2) : evData.marketOdds;
    if (aiFairOddsValue)   aiFairOddsValue.textContent   = evData.fairOdds;

    if (aiValueBadge) {
      if (evData.isValueBet) {
        aiValueBadge.classList.remove("hidden");
        aiValueBadge.innerHTML = `<i class="fa-solid fa-bolt"></i> Değerli Bahis (+${evData.evPct}% EV)`;
      } else {
        aiValueBadge.classList.add("hidden");
      }
    }

    if (aiMainProbVal) aiMainProbVal.textContent = `%${bestPick.pct}`;

    if (typeof updateAIPickCouponBtnState === "function") {
      updateAIPickCouponBtnState();
    }

    // Auto-record prediction to Live Registry (starts as PENDING until score arrives)
    if (typeof PredictionTracker !== 'undefined' && homeProfile && awayProfile) {
      PredictionTracker.recordPrediction({
        homeTeam: homeProfile.teamName,
        awayTeam: awayProfile.teamName,
        league: bannerLeagueName ? bannerLeagueName.textContent : 'Lig Maçı',
        country: selectedCountry ? selectedCountry.name : '',
        prediction: bestPick.title,
        category: bestPick.category,
        categoryLabel: bestPick.category === 'kart' ? 'Kart Bahsi' : (bestPick.category === 'korner' ? 'Korner Bahsi' : (bestPick.category === 'taraf' ? 'Taraf Bahsi' : 'Gol Bahsi')),
        odds: bestPick.odds || evData.marketOdds,
        confidence: bestPick.pct,
        reason: bestPick.reason
      });
      updatePerformanceBadgeUI();
    }

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
    // Taktik grid — Research Score ve derin analiz metrikleri
    const catIcon = { kart:"🟨", korner:"🚩", gol:"⚽", taraf:"🏆" }[bestPick.category] || "📊";
    if (aiTacticalGrid) {
      const rScore = bestPick.researchScore || 70;
      const rScoreClass = rScore >= 75 ? 'score-strong' : (rScore >= 60 ? 'score-medium' : 'score-risky');
      const rScoreLabel = rScore >= 75 ? 'GÜÇLÜ ÖNERİ' : (rScore >= 60 ? 'DENGELİ' : 'RİSKLİ');

      aiTacticalGrid.innerHTML = `
        <div class="tactical-card">
          <div class="tactical-card-title"><i class="fa-solid fa-bullseye"></i> Gol Beklentisi (xG)</div>
          <div class="tactical-card-val">Ev ${probs.xG_home} - ${probs.xG_away} Dep</div>
          <div class="tactical-card-desc">Dixon-Coles Simülasyonu</div>
        </div>
        <div class="tactical-card">
          <div class="tactical-card-title"><i class="fa-solid fa-microscope"></i> Research Score</div>
          <div class="tactical-card-val"><span class="research-score-badge ${rScoreClass}">%${rScore}</span></div>
          <div class="tactical-card-desc">${rScoreLabel} (${bestPick.supportingFactors || 3} Faktör Onaylı)</div>
        </div>
        <div class="tactical-card">
          <div class="tactical-card-title"><i class="fa-solid fa-gauge-high"></i> Maç Dinamikleri</div>
          <div class="tactical-card-val">${probs.expCorners} K / ${probs.expCards} Kart</div>
          <div class="tactical-card-desc">${totalFouls > 0 ? `Faul Temposu: ${totalFouls.toFixed(0)}` : 'Saha İçi Tansiyon'}</div>
        </div>`;
    }

    // =============================================
    // Gemini 3.8 Flash AI Deep Analysis (High-Speed & Streaming)
    // =============================================
    // 1. Heuristic instant tactical preview (0ms delay) - Engine 6.0 deep research
    const prosText = bestPick.pros && bestPick.pros.length ? ` Destekleyen Faktörler: ${bestPick.pros.join(', ')}.` : '';
    const instantTacticalText = `${homeProfile.teamName} iç saha performansı (${hAdv.venueWinPct ? `%${hAdv.venueWinPct} galibiyet, ` : ''}${hStats.avgShots || 12.5} şut/maç) karşısında ${awayProfile.teamName} (${aAdv.venueWinPct ? `dış saha %${aAdv.venueWinPct} galibiyet, ` : ''}${probs.xG_away} xG) direnci test edilecektir.${prosText}`;
    const csText = (homeCleanSheet > 0 || awayCleanSheet > 0) ? ` Clean sheet oranları (Ev %${homeCleanSheet} / Dep %${awayCleanSheet}).` : '';
    const instantRiskText = `Toplam beklenen kart ${probs.expCards || '3.8'}, korner ${probs.expCorners || '9.2'}${totalFouls > 0 ? ` ve faul ${totalFouls.toFixed(0)}` : ''}.${csText} ${bestPick.cons && bestPick.cons.filter(Boolean).length ? `Risk: ${bestPick.cons.filter(Boolean).join(', ')}.` : 'Hakem kararları ve ilk gol dakikası ana risk unsurlarıdır.'}`;

    if (geminiTacticalDetails) geminiTacticalDetails.classList.remove('hidden');
    if (geminiTacticalText) geminiTacticalText.textContent = instantTacticalText;
    if (geminiRiskText) geminiRiskText.textContent = instantRiskText;

    const cacheKey = `${homeProfile.teamName}__${awayProfile.teamName}__${bestPick.title}`;

    function applyAiAnalysis(modelName, analysis, stream = true) {
      let displayName = 'Gemini 3.8 Flash AI';
      if (modelName) {
        if (modelName.includes('3.8')) displayName = 'Gemini 3.8 Flash AI';
        else if (modelName.includes('3.7')) displayName = 'Gemini 3.7 Flash AI';
        else if (modelName.includes('3.1')) displayName = 'Gemini 3.1 Flash Lite AI';
        else if (modelName.includes('3.6')) displayName = 'Gemini 3.6 Flash AI';
        else displayName = `Gemini AI (${modelName})`;
      }

      if (aiModelBadge) {
        aiModelBadge.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${displayName}`;
        aiModelBadge.style.background = 'rgba(147, 51, 234, 0.25)';
      }
      if (aiExplanationTitle) {
        aiExplanationTitle.textContent = `${displayName} Derin Maç Analiz Raporu`;
      }

      const mainText = analysis.bestBetRationale || analysis.matchAnalysisSummary || bestPick.reason;
      if (stream && typeof fastStreamText === 'function') {
        fastStreamText(aiExplanationText, mainText);
      } else {
        if (aiExplanationText) aiExplanationText.textContent = mainText;
      }

      if (geminiTacticalDetails) geminiTacticalDetails.classList.remove('hidden');
      if (geminiTacticalText && analysis.tacticalScenario) {
        geminiTacticalText.textContent = analysis.tacticalScenario;
      }
      if (geminiRiskText && analysis.riskAssessment) {
        geminiRiskText.textContent = analysis.riskAssessment;
      }
    }

    // If already in client cache, apply instantly with 0 network latency!
    if (clientAiAnalysisCache.has(cacheKey)) {
      const cached = clientAiAnalysisCache.get(cacheKey);
      applyAiAnalysis(cached.model, cached.analysis, false);
      return;
    }

    // Show initial rationale with smooth streaming tag
    if (aiExplanationText) {
      aiExplanationText.innerHTML = `${bestPick.reason} <span class="ai-stream-tag"><i class="fa-solid fa-circle-notch fa-spin"></i> Gemini 3.8 Flash AI derinleştiriyor...</span>`;
    }

    // Engine 6.0: Enhanced payload with all deep research fields
    const payload = {
      homeTeam: homeProfile.teamName,
      awayTeam: awayProfile.teamName,
      country: selectedCountry ? selectedCountry.name : 'Genel',
      xG_home: probs.xG_home,
      xG_away: probs.xG_away,
      pHomeWin: probs.pHomeWin,
      pDraw: probs.pDraw,
      pAwayWin: probs.pAwayWin,
      pOver25: probs.pOver25,
      pBTTS: probs.pBTTS,
      homeGoalsScored: hStats.avgGoalsScored,
      homeGoalsConceded: hStats.avgGoalsConceded,
      awayGoalsScored: aStats.avgGoalsScored,
      awayGoalsConceded: aStats.avgGoalsConceded,
      expCorners: probs.expCorners,
      expCards: probs.expCards,
      homeCleanSheet: homeCleanSheet,
      awayCleanSheet: awayCleanSheet,
      homeHtGoalPct: homeHtGoalPct,
      awayHtGoalPct: awayHtGoalPct,
      homeFouls: homeFouls,
      awayFouls: awayFouls,
      homeVenueWinPct: hAdv.venueWinPct,
      awayVenueWinPct: aAdv.venueWinPct,
      researchScore: bestPick.researchScore,
      suggestedBet: bestPick.title,
      confidence: bestPick.pct
    };

    if (currentAiAbortController) {
      currentAiAbortController.abort();
    }
    currentAiAbortController = new AbortController();

    fetch('/api/gemini-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: currentAiAbortController.signal
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.success && data.analysis) {
        clientAiAnalysisCache.set(cacheKey, { model: data.model, analysis: data.analysis });
        applyAiAnalysis(data.model, data.analysis, true);
      } else {
        // Fallback to local engine
        if (aiModelBadge) {
          aiModelBadge.innerHTML = `<i class="fa-solid fa-calculator"></i> Engine 6.0 (Yerel)`;
          aiModelBadge.style.background = 'rgba(59, 130, 246, 0.2)';
        }
        if (aiExplanationTitle) {
          aiExplanationTitle.textContent = 'Engine 6.0 AI Analiz Raporu & Gerekçesi';
        }
        if (aiExplanationText) {
          aiExplanationText.textContent = bestPick.reason;
        }
      }
    })
    .catch(err => {
      if (err.name === 'AbortError') return;
      console.warn('[Gemini Frontend Fetch Fallback]', err);
      if (aiModelBadge) {
        aiModelBadge.innerHTML = `<i class="fa-solid fa-calculator"></i> Engine 6.0 (Yerel)`;
      }
      if (aiExplanationTitle) {
        aiExplanationTitle.textContent = 'Engine 6.0 AI Analiz Raporu & Gerekçesi';
      }
      if (aiExplanationText) {
        aiExplanationText.textContent = bestPick.reason;
      }
    });

  }

  function generatePossibleBets() {
    if (!homeProfile || !awayProfile) return;
    const h = homeProfile.stats;
    const a = awayProfile.stats;

    const quant = calculateDixonColesProbabilities(homeProfile, awayProfile);
    if (!quant) return;

    const expCorners = parseFloat((parseFloat(h.avgCorners || 0) + parseFloat(a.avgCorners || 0)).toFixed(1));
    const expCards = parseFloat((parseFloat(h.avgYellowCards || 0) + parseFloat(a.avgYellowCards || 0)).toFixed(1));
    const totalFouls = parseFloat(h.avgFouls || 0) + parseFloat(a.avgFouls || 0);
    const homeCleanSheet = h.cleanSheetPct || 0;
    const awayCleanSheet = a.cleanSheetPct || 0;

    function makeBet(cat, name, pct, reason) {
      const evData = calcEVandOdds(pct);
      const categoryWeight = { kart: 0.93, taraf: 0.74, korner: 0.64, gol: 0.56, iyms: 0.70 };
      const f1 = Math.min(100, (pct / 80) * 100) * 0.40;
      const f2 = (categoryWeight[cat] || 0.60) * 100 * 0.35;
      const f3 = (evData.isValueBet ? 100 : 55) * 0.25;
      const researchScore = Math.round(f1 + f2 + f3);

      return {
        category: cat,
        name: name,
        pct: pct,
        odds: evData.marketOdds,
        fairOdds: evData.fairOdds,
        evPct: evData.evPct,
        isValueBet: evData.isValueBet,
        researchScore,
        reason: reason
      };
    }

    currentPossibleBets = [
      makeBet("gol", "Karşılıklı Gol Var (KG Var)", quant.pBTTS, `Dixon-Coles matrisinde iki takımın da gol atma ihtimali %${quant.pBTTS}. (Adil Oran: ${calcEVandOdds(quant.pBTTS).fairOdds})`),
      makeBet("gol", "Karşılıklı Gol Yok (KG Yok)", quant.pBTTSNo, `En az bir takımın kalesini gole kapatma veya skor üretememe olasılığı %${quant.pBTTSNo}.`),
      makeBet("gol", "Toplam Gol 1.5 Üst", quant.pOver15, `Karşılaşmada en az 2 gol çıkma ihtimali %${quant.pOver15}.`),
      makeBet("gol", "Toplam Gol 2.5 Üst", quant.pOver25, `Dixon-Coles beklenen gol toplamı (${quant.totalExpGoals}) ile 2.5 Üst olasılığı %${quant.pOver25}.`),
      makeBet("gol", "Toplam Gol 2.5 Alt", quant.pUnder25, `Düşük tempolu skor senaryosunda 2.5 Alt kalma olasılığı %${quant.pUnder25}.`),
      makeBet("gol", `${homeProfile.teamName} 1.5 Gol Üstü`, quant.pHome15, `${homeProfile.teamName} takımının en az 2 gol atma olasılığı %${quant.pHome15}.`),
      makeBet("gol", `${awayProfile.teamName} 1.5 Gol Üstü`, quant.pAway15, `${awayProfile.teamName} takımının en az 2 gol atma olasılığı %${quant.pAway15}.`),
      makeBet("taraf", `Maç Sonucu 1 (${homeProfile.teamName})`, quant.pHomeWin, `Dixon-Coles ve zaman ağırlıklı form ile ev sahibi galibiyeti %${quant.pHomeWin}.`),
      makeBet("taraf", `Maç Sonucu 2 (${awayProfile.teamName})`, quant.pAwayWin, `Deplasman ekibinin zafer olasılığı %${quant.pAwayWin}.`),
      makeBet("taraf", `Çifte Şans 1-X (${homeProfile.teamName})`, quant.p1X, `Ev sahibinin sahadan puanla ayrılma olasılığı %${quant.p1X}.`),
      makeBet("taraf", `Çifte Şans X-2 (${awayProfile.teamName})`, quant.pX2, `Deplasman ekibinin yenilmeme olasılığı %${quant.pX2}.`),
      makeBet("iyms", "İlk Yarı 0.5 Gol Üstü", quant.pIYOver05, `İlk 45 dakikada en az 1 gol olma ihtimali %${quant.pIYOver05}.`),
      makeBet("iyms", "İlk Yarı Beraberlik (İY X)", quant.pIYDraw, `İlk yarının eşitlikle tamamlanma olasılığı %${quant.pIYDraw}.`),
      makeBet("iyms", `İlk Yarı 1 (${homeProfile.teamName})`, quant.pIYHome, `Ev sahibinin ilk yarıyı önde kapatma olasılığı %${quant.pIYHome}.`)
    ];

    if (homeProfile.cardsReliable && awayProfile.cardsReliable && h.avgYellowCards !== null && a.avgYellowCards !== null) {
      const p35U = Math.round(Math.min(0.95, Math.max(0.05, 1 - calcPoissonCumulative(expCards, 3))) * 100);
      const p35A = Math.round(Math.min(0.95, Math.max(0.05, calcPoissonCumulative(expCards, 3))) * 100);
      const p45U = Math.round(Math.min(0.95, Math.max(0.05, 1 - calcPoissonCumulative(expCards, 4))) * 100);
      const p45A = Math.round(Math.min(0.95, Math.max(0.05, calcPoissonCumulative(expCards, 4))) * 100);

      currentPossibleBets.push(
        makeBet("kart", "Toplam Sarı Kart 3.5 Üst", p35U, `İki takımın toplam kart beklentisi ${expCards}. Poisson 3.5 Üst %${p35U}. ⚠️ Hakem profili & maç tansiyonu kontrol edilmelidir.`),
        makeBet("kart", "Toplam Sarı Kart 3.5 Alt", p35A, `İki takımın toplam kart beklentisi ${expCards}. Poisson 3.5 Alt %${p35A}.`),
        makeBet("kart", "Toplam Sarı Kart 4.5 Üst", p45U, `Toplam kart beklentisi ${expCards}. 4.5 Üst %${p45U}. ⚠️ Hakem profili & maç tansiyonu kontrol edilmelidir.`),
        makeBet("kart", "Toplam Sarı Kart 4.5 Alt", p45A, `Disiplin istatistiklerine göre 4.5 Alt %${p45A}.`)
      );
    }

    if (homeProfile.cornersReliable && awayProfile.cornersReliable && h.avgCorners !== null && a.avgCorners !== null) {
      const cRes = calculateResearchedCorners(homeProfile, awayProfile);
      const p85U = cRes ? cRes.pOver85 : Math.min(95, Math.max(45, Math.round(expCorners * 9.2)));
      const p95U = cRes ? cRes.pOver95 : Math.min(90, Math.max(35, Math.round(expCorners * 8.2)));
      const p85A = cRes ? cRes.pUnder85 : (100 - p85U);
      currentPossibleBets.push(
        makeBet("korner", "Toplam Korner 8.5 Üst", p85U, `Detaylı korner modellemesine göre toplam beklenen korner ${expCorners}. 8.5 Üst olasılığı %${p85U}.`),
        makeBet("korner", "Toplam Korner 9.5 Üst", p95U, `Kanat hücumları ve şut temposu araştırmasıyla 9.5 Üst olasılığı %${p95U}.`)
      );
      if (p85A >= 55) {
        currentPossibleBets.push(
          makeBet("korner", "Toplam Korner 8.5 Alt", p85A, `Kontrollü kanat savunmaları ve düşük korner beklentisi (${expCorners}). 8.5 Alt olasılığı %${p85A}.`)
        );
      }
    }

    if (selectedMatchMode === "cup") {
      const cupData = calculateCupDynamics(homeProfile, awayProfile, selectedCupFormat);
      currentPossibleBets.push(
        makeBet("taraf", `Turu Atlar (${homeProfile.teamName})`, cupData.homeQualifyPct, `${homeProfile.teamName} turu atlama olasılığı %${cupData.homeQualifyPct}.`),
        makeBet("taraf", `Turu Atlar (${awayProfile.teamName})`, cupData.awayQualifyPct, `${awayProfile.teamName} turu atlama olasılığı %${cupData.awayQualifyPct}.`)
      );
    }

    currentPossibleBets = currentPossibleBets.filter(b => b.pct >= 55);
    // Sort by Research Score first, then pct
    currentPossibleBets.sort((a, b) => ((b.researchScore || 0) * 0.6 + b.pct * 0.4) - ((a.researchScore || 0) * 0.6 + a.pct * 0.4));

    renderBetsGrid("all");
  }

  function renderBetsGrid(filter) {
    betsGrid.innerHTML = "";

    const filtered = filter === "all" 
      ? currentPossibleBets 
      : currentPossibleBets.filter(b => b.category === filter);

    if (filtered.length === 0) {
      let noDataMsg = "Bu kategoride yüksek güvenilirlikli bahis bulunamadı.";
      if (filter === "kart" && (!homeProfile.cardsReliable || !awayProfile.cardsReliable || homeProfile.stats.avgYellowCards === null || awayProfile.stats.avgYellowCards === null)) {
        noDataMsg = "Takımların sarı kart verisi bulunmadığından bu karşılaşma için kart bahsi sunulmamaktadır.";
      } else if (filter === "korner" && (!homeProfile.cornersReliable || !awayProfile.cornersReliable || homeProfile.stats.avgCorners === null || awayProfile.stats.avgCorners === null)) {
        noDataMsg = "Takımların korner verisi bulunmadığından bu karşılaşma için korner bahsi sunulmamaktadır.";
      }
      betsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #94a3b8;">
          <i class="fa-solid fa-circle-info" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
          ${noDataMsg}
        </div>
      `;
      return;
    }

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
      const isSaved = typeof AuthManager !== 'undefined' && AuthManager.getMyBets().some(b => b.betId === betId);

      card.innerHTML = `
        <div>
          <div class="bet-card-top">
            <span class="bet-category cat-${bet.category}">${bet.category}</span>
            ${bet.isValueBet && bet.evPct > 0 ? `<span class="ev-tag"><i class="fa-solid fa-bolt"></i> +${bet.evPct}% EV</span>` : ''}
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
              <i class="fa-solid fa-bookmark"></i>
              ${isSaved ? 'Kaydedildi' : 'Bahislerime Kaydet'}
            </button>
          </div>
        </div>
      `;

      // Coupon add/remove toggle button
      const addBtn = card.querySelector('.btn-add-coupon');
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = decodeURIComponent(addBtn.dataset.betname);
        const pct = parseInt(addBtn.dataset.pct);
        const cat = addBtn.dataset.cat;
        toggleCouponItem({ name, pct, category: cat });
      });

      // My Bets toggle save/remove button
      const saveBtn = card.querySelector('.btn-save-mybet');
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof AuthManager === 'undefined') return;
        const name = decodeURIComponent(saveBtn.dataset.betname);
        const pct = parseInt(saveBtn.dataset.pct);
        const cat = saveBtn.dataset.cat;
        const currentBetId = `${homeTeamName}_${awayTeamName}_${name}`;
        const alreadySaved = AuthManager.getMyBets().some(b => b.betId === currentBetId);

        if (alreadySaved) {
          AuthManager.removeBet(currentBetId);
          saveBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Bahislerime Kaydet';
          saveBtn.classList.remove('is-saved');
        } else {
          AuthManager.addBet({
            homeTeam: homeTeamName,
            awayTeam: awayTeamName,
            country: selectedCountry ? selectedCountry.name : '',
            betName: name,
            pct: pct,
            category: cat
          });
          saveBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Kaydedildi';
          saveBtn.classList.add('is-saved');
        }
        updateMyBetsCount();
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
  initCountryDropdown();
  updateAuthUI();
  initPerformanceDashboard();
});
