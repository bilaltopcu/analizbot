// ==========================================================================
// GOLANALIZ AI - Progressive Web App (PWA) Install Manager
// ==========================================================================

(function() {
  'use strict';

  let deferredPrompt = null;
  const DISMISS_KEY = 'golanaliz_pwa_dismissed';
  const DISMISS_HOURS = 48; // 2 gun sonra tekrar oner

  // ─── Otomatik Cihaz & Model Adaptasyon Motoru ───
  const isStandalone = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  };

  const isIOS = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  const isAndroid = () => {
    return /android/.test(window.navigator.userAgent.toLowerCase());
  };

  function detectAndApplyDeviceClasses() {
    const docEl = document.documentElement;
    const body = document.body;
    const ua = navigator.userAgent.toLowerCase();
    
    const ios = isIOS();
    const android = isAndroid();
    const standalone = isStandalone();

    const width = window.innerWidth || docEl.clientWidth;
    const height = window.innerHeight || docEl.clientHeight;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Tablet tespiti (iPad, Android Tablet, veya dokunmatik 641-1024px)
    const isTabletDevice = (
      /ipad/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
      (android && !/mobile/.test(ua)) ||
      (isTouch && width >= 641 && width <= 1024)
    );

    // Telefon tespiti
    const isMobileDevice = !isTabletDevice && (width <= 640 || (/iphone|ipod|mobile/.test(ua) && width <= 768));

    // Class guncelleme
    docEl.classList.remove('device-mobile', 'device-tablet', 'device-desktop', 'platform-ios', 'platform-android', 'display-standalone');
    if (body) body.classList.remove('device-mobile', 'device-tablet', 'device-desktop', 'platform-ios', 'platform-android', 'display-standalone');

    let deviceType = 'desktop';
    if (isMobileDevice) {
      deviceType = 'mobile';
      docEl.classList.add('device-mobile');
      if (body) body.classList.add('device-mobile');
    } else if (isTabletDevice) {
      deviceType = 'tablet';
      docEl.classList.add('device-tablet');
      if (body) body.classList.add('device-tablet');
    } else {
      docEl.classList.add('device-desktop');
      if (body) body.classList.add('device-desktop');
    }

    if (ios) {
      docEl.classList.add('platform-ios');
      if (body) body.classList.add('platform-ios');
      docEl.setAttribute('data-platform', 'ios');
    } else if (android) {
      docEl.classList.add('platform-android');
      if (body) body.classList.add('platform-android');
      docEl.setAttribute('data-platform', 'android');
    } else {
      docEl.setAttribute('data-platform', 'other');
    }

    if (standalone) {
      docEl.classList.add('display-standalone');
      if (body) body.classList.add('display-standalone');
      docEl.setAttribute('data-display-mode', 'standalone');
    } else {
      docEl.setAttribute('data-display-mode', 'browser');
    }

    docEl.setAttribute('data-device', deviceType);
    docEl.setAttribute('data-screen-w', width.toString());
    docEl.setAttribute('data-screen-h', height.toString());
  }

  // Ilk yukleme aninda calistir
  detectAndApplyDeviceClasses();
  window.addEventListener('resize', detectAndApplyDeviceClasses);
  window.addEventListener('orientationchange', () => setTimeout(detectAndApplyDeviceClasses, 150));

  // ─── Mobil Cihazlarda Büyütme/Küçültme (Pinch-to-zoom & Double-tap zoom) Engelleme ───
  function preventMobileZoom() {
    // 1. Çoklu parmak (pinch zoom) engelleme
    document.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    // 2. iOS Safari gesture zoom engelleme
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault();
    }, { passive: false });
    document.addEventListener('gesturechange', (e) => {
      e.preventDefault();
    }, { passive: false });
    document.addEventListener('gestureend', (e) => {
      e.preventDefault();
    }, { passive: false });

    // 3. Hızlı çift dokunarak büyütme (double tap zoom) engelleme
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        const tag = e.target ? e.target.tagName : '';
        if (!['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].includes(tag)) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    }, { passive: false });
  }

  preventMobileZoom();


  const isDismissedRecently = () => {
    try {
      const dismissedTime = localStorage.getItem(DISMISS_KEY);
      if (!dismissedTime) return false;
      const hoursPassed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60);
      return hoursPassed < DISMISS_HOURS;
    } catch (e) {
      return false;
    }
  };

  const setDismissed = () => {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch (e) {}
  };

  // UI Referanslari
  function getElements() {
    return {
      modal: document.getElementById('pwaInstallModal'),
      closeBtn: document.getElementById('pwaModalClose'),
      headerBtn: document.getElementById('pwaHeaderInstallBtn'),
      installBtn: document.getElementById('pwaInstallBtn'),
      dismissBtn: document.getElementById('pwaDismissBtn'),
      androidArea: document.getElementById('pwaActionAndroid'),
      iosArea: document.getElementById('pwaActionIOS'),
      iosGotItBtn: document.getElementById('pwaIosGotItBtn')
    };
  }

  function showModal() {
    const els = getElements();
    if (!els.modal) return;

    // Platforma gore arayuzu goster
    if (isIOS()) {
      if (els.androidArea) els.androidArea.classList.add('hidden');
      if (els.iosArea) els.iosArea.classList.remove('hidden');
    } else {
      if (els.androidArea) els.androidArea.classList.remove('hidden');
      if (els.iosArea) els.iosArea.classList.add('hidden');
    }

    els.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function hideModal(setDismissCookie) {
    if (typeof setDismissCookie === 'undefined') setDismissCookie = true;
    const els = getElements();
    if (!els.modal) return;
    els.modal.classList.add('hidden');
    document.body.style.overflow = '';
    if (setDismissCookie) {
      setDismissed();
    }
  }

  function showToast(message, type) {
    if (!type) type = 'success';
    let toast = document.getElementById('pwaNotificationToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pwaNotificationToast';
      toast.className = 'pwa-toast';
      document.body.appendChild(toast);
    }
    const iconClass = type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
    toast.innerHTML = '<i class="fa-solid ' + iconClass + '"></i> <span>' + message + '</span>';
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 4500);
  }

  async function triggerInstall() {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          showToast('Uygulama telefonunuza başarıyla yükleniyor!', 'success');
          hideModal(false);
        } else {
          hideModal(true);
        }
        deferredPrompt = null;
      } catch (err) {
        console.warn('[PWA] Prompt hatası:', err);
      }
    } else {
      if (!isIOS()) {
        showToast('Tarayıcınızın menüsünden (3 nokta ⋮) "Uygulamayı Yükle" veya "Ana Ekrana Ekle"yi seçebilirsiniz.', 'info');
      }
    }
  }

  // ─── Tam Ekran (Fullscreen) Yöneticisi ───
  function initFullscreenManager() {
    const btn = document.getElementById('fullscreenToggleBtn');
    if (!btn) return;
    const icon = document.getElementById('fullscreenIcon');
    const label = document.getElementById('fullscreenLabel');

    const isFullscreen = () => {
      return !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
    };

    const updateUI = () => {
      const fs = isFullscreen();
      if (fs) {
        btn.classList.add('is-fullscreen');
        if (icon) icon.className = 'fa-solid fa-compress';
        if (label) label.textContent = 'Normal';
        btn.setAttribute('title', 'Tam Ekrandan Çık');
      } else {
        btn.classList.remove('is-fullscreen');
        if (icon) icon.className = 'fa-solid fa-expand';
        if (label) label.textContent = 'Tam Ekran';
        btn.setAttribute('title', 'Tam Ekrana Geç');
      }
    };

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        if (!isFullscreen()) {
          const docEl = document.documentElement;
          if (docEl.requestFullscreen) {
            await docEl.requestFullscreen();
          } else if (docEl.webkitRequestFullscreen) {
            await docEl.webkitRequestFullscreen();
          } else if (docEl.mozRequestFullScreen) {
            await docEl.mozRequestFullScreen();
          } else if (docEl.msRequestFullscreen) {
            await docEl.msRequestFullscreen();
          } else {
            // iOS Safari veya Fullscreen API destegi olmayan ortamlar
            if (isIOS() && !isStandalone()) {
              showModal();
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
        } else {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            await document.mozCancelFullScreen();
          } else if (document.msExitFullscreen) {
            await document.msExitFullscreen();
          }
        }
      } catch (err) {
        console.warn('[Fullscreen] Hatası:', err);
      }
      setTimeout(updateUI, 120);
    });

    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
      document.addEventListener(evt, updateUI);
    });

    updateUI();
  }

  // Baslangic Kurulumu
  function initPWA() {
    const els = getElements();

    // Tam ekran kontrolcusunu her durumda baslat
    initFullscreenManager();

    // Zaten yukluyse veya standalone moddaysa butonlari ve pop-up'i gizle
    if (isStandalone()) {
      if (els.headerBtn) els.headerBtn.style.display = 'none';
      return;
    }

    // Header butonu gorunur olsun
    if (els.headerBtn) {
      els.headerBtn.classList.remove('hidden');
      els.headerBtn.addEventListener('click', () => {
        showModal();
      });
    }

    // Modal Kapatma
    if (els.closeBtn) {
      els.closeBtn.addEventListener('click', () => hideModal(true));
    }
    if (els.dismissBtn) {
      els.dismissBtn.addEventListener('click', () => hideModal(true));
    }
    if (els.iosGotItBtn) {
      els.iosGotItBtn.addEventListener('click', () => hideModal(true));
    }

    // Modal disina tiklayinca kapat
    if (els.modal) {
      els.modal.addEventListener('click', (e) => {
        if (e.target === els.modal) {
          hideModal(true);
        }
      });
    }

    // Yukleme Butonu
    if (els.installBtn) {
      els.installBtn.addEventListener('click', triggerInstall);
    }

    // Otomatik Pop-up: Ilk giriste veya 48 saat sonra 2.5 saniye sonra goster
    if (!isDismissedRecently()) {
      setTimeout(() => {
        if (!isStandalone()) {
          showModal();
        }
      }, 2500);
    }
  }

  // Chrome / Android PWA beforeinstallprompt yakalama
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const els = getElements();
    if (els.headerBtn && !isStandalone()) {
      els.headerBtn.classList.remove('hidden');
    }
  });

  // Uygulama yuklendiginde
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideModal(false);
    const els = getElements();
    if (els.headerBtn) {
      els.headerBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Yüklendi</span>';
      els.headerBtn.classList.add('installed');
      setTimeout(() => {
        els.headerBtn.style.display = 'none';
      }, 3000);
    }
    showToast('🎉 Harika! GOLANALIZ AI ana ekranınıza başarıyla eklendi.', 'success');
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPWA);
  } else {
    initPWA();
  }
})();