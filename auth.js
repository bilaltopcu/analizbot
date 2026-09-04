// ==========================================================================
// GOLANALIZ AI - Authentication & User Data Manager
// ==========================================================================

const AuthManager = {
  USERS_KEY: 'golanaliz_users',
  SESSION_KEY: 'golanaliz_session',

  // --- Helpers ---
  _getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY)) || {};
    } catch { return {}; }
  },

  _saveUsers(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  },

  // Simple hash for client-side password storage (NOT production-grade)
  _hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
  },

  _validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // --- Registration ---
  register(email, password, passwordConfirm) {
    email = email.trim().toLowerCase();

    if (!email || !password) {
      return { success: false, message: 'E-posta ve şifre gerekli.' };
    }
    if (!this._validateEmail(email)) {
      return { success: false, message: 'Geçerli bir e-posta adresi girin.' };
    }
    if (password.length < 6) {
      return { success: false, message: 'Şifre en az 6 karakter olmalıdır.' };
    }
    if (password !== passwordConfirm) {
      return { success: false, message: 'Şifreler eşleşmiyor.' };
    }

    const users = this._getUsers();
    if (users[email]) {
      return { success: false, message: 'Bu e-posta adresi zaten kayıtlı.' };
    }

    users[email] = {
      passwordHash: this._hashPassword(password),
      createdAt: new Date().toISOString(),
      favorites: [],
      myBets: []
    };

    this._saveUsers(users);
    this._setSession(email);
    return { success: true, message: 'Kayıt başarılı! Hoş geldiniz.' };
  },

  // --- Login ---
  login(email, password) {
    email = email.trim().toLowerCase();

    if (!email || !password) {
      return { success: false, message: 'E-posta ve şifre gerekli.' };
    }

    const users = this._getUsers();
    const user = users[email];

    if (!user) {
      return { success: false, message: 'Bu e-posta adresi ile kayıtlı hesap bulunamadı.' };
    }
    if (user.passwordHash !== this._hashPassword(password)) {
      return { success: false, message: 'Şifre hatalı. Lütfen tekrar deneyin.' };
    }

    this._setSession(email);
    return { success: true, message: 'Giriş başarılı!' };
  },

  // --- Session ---
  _setSession(email) {
    sessionStorage.setItem(this.SESSION_KEY, email);
  },

  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
  },

  getCurrentUser() {
    return sessionStorage.getItem(this.SESSION_KEY) || null;
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  // --- User Data Access ---
  _getUserData() {
    const email = this.getCurrentUser();
    if (!email) {
      try {
        return JSON.parse(localStorage.getItem('golanaliz_guest_data')) || { favorites: [], myBets: [] };
      } catch {
        return { favorites: [], myBets: [] };
      }
    }
    const users = this._getUsers();
    return users[email] || null;
  },

  _updateUserData(updateFn) {
    const email = this.getCurrentUser();
    if (!email) {
      let data;
      try {
        data = JSON.parse(localStorage.getItem('golanaliz_guest_data')) || { favorites: [], myBets: [] };
      } catch {
        data = { favorites: [], myBets: [] };
      }
      updateFn(data);
      localStorage.setItem('golanaliz_guest_data', JSON.stringify(data));
      return true;
    }
    const users = this._getUsers();
    if (!users[email]) return false;
    updateFn(users[email]);
    this._saveUsers(users);
    return true;
  },

  // --- Favorites ---
  getFavorites() {
    const data = this._getUserData();
    return data ? data.favorites || [] : [];
  },

  isFavorite(teamName) {
    return this.getFavorites().some(f => f.name === teamName);
  },

  toggleFavorite(teamName, countryCode, countryName) {
    return this._updateUserData(user => {
      if (!user.favorites) user.favorites = [];
      const idx = user.favorites.findIndex(f => f.name === teamName);
      if (idx !== -1) {
        user.favorites.splice(idx, 1);
      } else {
        user.favorites.push({
          name: teamName,
          countryCode: countryCode,
          countryName: countryName,
          addedAt: new Date().toISOString()
        });
      }
    }) ? { success: true } : { success: false, message: 'Bir hata oluştu.' };
  },

  removeFavorite(teamName) {
    return this._updateUserData(user => {
      if (!user.favorites) return;
      user.favorites = user.favorites.filter(f => f.name !== teamName);
    });
  },

  // --- My Bets ---
  getMyBets() {
    const data = this._getUserData();
    return data ? data.myBets || [] : [];
  },

  addBet(betData) {
    // betData: { homeTeam, awayTeam, country, betName, pct, category, betId }
    const betId = `${betData.homeTeam}_${betData.awayTeam}_${betData.betName}`;

    const myBets = this.getMyBets();
    if (myBets.some(b => b.betId === betId)) {
      return { success: false, message: 'Bu bahis zaten Bahislerim listesinde.' };
    }

    this._updateUserData(user => {
      if (!user.myBets) user.myBets = [];
      user.myBets.push({
        ...betData,
        betId: betId,
        savedAt: new Date().toISOString()
      });
    });

    return { success: true, message: 'Bahis başarıyla kaydedildi!' };
  },

  removeBet(betId) {
    return this._updateUserData(user => {
      if (!user.myBets) return;
      user.myBets = user.myBets.filter(b => b.betId !== betId);
    });
  },

  clearAllBets() {
    return this._updateUserData(user => {
      user.myBets = [];
    });
  },

  // Group bets by match
  getMyBetsGrouped() {
    const bets = this.getMyBets();
    const groups = {};
    bets.forEach(bet => {
      const matchKey = `${bet.homeTeam} vs ${bet.awayTeam}`;
      if (!groups[matchKey]) {
        groups[matchKey] = {
          homeTeam: bet.homeTeam,
          awayTeam: bet.awayTeam,
          country: bet.country,
          bets: []
        };
      }
      groups[matchKey].bets.push(bet);
    });
    return groups;
  }
};
