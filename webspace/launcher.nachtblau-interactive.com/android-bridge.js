/**
 * Android-Bridge für launcher.nachtblau-interactive.com
 * Gleiche Katalog-/Content-Quelle wie Web — Platform: android
 */
(function initAndroidBridge() {
  const PLATFORM = 'android';
  const REMOTE_HUB = 'https://launcher.nachtblau-interactive.com/';
  const UNLOCKS_KEY = 'nachtblau_hub_unlocks';

  function defaultCategories() {
    return [
      { id: 'all', label: 'Alle', icon: '◈' },
      { id: 'games', label: 'Spiele', icon: '▶', match: { type: 'game' } },
      {
        id: 'symbiose',
        label: 'Symbiose',
        icon: '📖',
        match: { type: ['book', 'gallery'] },
        subcategories: [
          { id: 'all', label: 'Alle' },
          { id: 'book', label: 'Bücher', match: { type: 'book' } },
          { id: 'gallery', label: 'Galerie', match: { type: 'gallery' } },
        ],
      },
    ];
  }

  async function loadUnlocks() {
    try {
      return JSON.parse(localStorage.getItem(UNLOCKS_KEY) || '{"products":{}}');
    } catch {
      return { products: {} };
    }
  }

  async function saveUnlocks(data) {
    localStorage.setItem(UNLOCKS_KEY, JSON.stringify(data));
  }

  async function isUnlocked(productId) {
    const data = await loadUnlocks();
    return !!data.products?.[productId];
  }

  async function unlockProduct(productId) {
    const data = await loadUnlocks();
    data.products = data.products || {};
    data.products[productId] = { unlockedAt: Date.now() };
    await saveUnlocks(data);
  }

  async function loadJson(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Konfiguration nicht gefunden: ${path}`);
    return res.json();
  }

  function pageBase() {
    return `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, '')}`;
  }


  function playSpec(game) {
    return game?.[PLATFORM] || game?.web || null;
  }

  function buildPayPalUrl({ email, amount, itemName, currency, productId, returnKind }) {
    const returnUrl = new URL(window.location.href);
    returnUrl.searchParams.set('paid', returnKind || 'book');
    returnUrl.searchParams.set('product', productId);
    returnUrl.searchParams.delete('cancelled');

    const cancelUrl = new URL(window.location.href);
    cancelUrl.searchParams.set('cancelled', '1');
    cancelUrl.searchParams.set('product', productId);
    cancelUrl.searchParams.delete('paid');

    const params = new URLSearchParams({
      cmd: '_xclick',
      business: email,
      item_name: itemName,
      amount: Number(amount).toFixed(2),
      currency_code: currency || 'EUR',
      return: returnUrl.toString(),
      cancel_return: cancelUrl.toString(),
      no_note: '1',
      charset: 'utf-8',
    });
    return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
  }

  function cleanReturnUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete('paid');
    url.searchParams.delete('cancelled');
    url.searchParams.delete('product');
    window.history.replaceState({}, '', url.pathname + url.search);
  }

  async function handleReturnParams() {
    const params = new URLSearchParams(window.location.search);
    const paid = params.get('paid');
    const cancelled = params.get('cancelled');
    const productId = params.get('product') || 'symbiose-band1';

    if (cancelled) {
      cleanReturnUrl();
      return { success: false, message: 'Zahlung abgebrochen.', productId };
    }

    if (!paid) return null;

    const kind = paid === 'tip' ? 'tip' : 'book';
    if (kind === 'book') {
      await unlockProduct(productId);
      cleanReturnUrl();
      return {
        success: true,
        kind: 'book',
        productId,
        message: productId === 'symbiose-illustrations'
          ? 'Illustrationen freigeschaltet!'
          : 'Band 1 freigeschaltet — viel Spaß beim Lesen!',
      };
    }

    cleanReturnUrl();
    return { success: true, kind: 'tip', message: 'Danke für dein Trinkgeld!' };
  }

  async function gamesConfigPath() {
    const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    return local ? 'config/games.local.json' : 'config/games.json';
  }

  window.launcher = {
    getConfig: async () => {
      const [gamesConfig, monetization] = await Promise.all([
        loadJson(await gamesConfigPath()),
        loadJson('config/monetization.json'),
      ]);

      const games = gamesConfig.games.map((g) => {
          const isPaidContent = g.type === 'book' || g.type === 'gallery';
          const spec = playSpec(g);
          const hasPlay = !!(spec?.playUrl);
          return {
            ...g,
            installInfo: {
              installed: hasPlay || isPaidContent,
              details: spec?.note || spec?.label || (isPaidContent ? 'Kostenlos' : 'Nicht verfügbar'),
            },
            unlocked: true,
          };
        });

      return {
        studio: gamesConfig.studio,
        site: gamesConfig.site,
        categories: gamesConfig.categories || defaultCategories(),
        games,
        platform: PLATFORM,
        monetization,
      };
    },

    getPreviewUrl: async (gameId) => {
      const config = await window.launcher.getConfig();
      const game = config.games.find((g) => g.id === gameId);
      if (!game) return { mode: 'cover', hint: 'Nicht gefunden' };
      if (game.type === 'book' || game.type === 'gallery') return { mode: game.type };
      if (playSpec(game)?.playUrl) {
        return { mode: 'cover', hint: PLATFORM === 'android'
          ? 'Spiel starten — öffnet im Hub'
          : 'Spiel starten — öffnet in eigenem Fenster' };
      }
      return { mode: 'cover', hint: `Keine ${PLATFORM}-Version verfügbar` };
    },

    getBook: async (productId) => {
      if (productId === 'symbiose-illustrations') {
        const manifest = await loadJson('config/symbiose-illustrations.json');
        const items = (manifest.items || []).map((item) => ({
          id: item.id,
          title: item.title,
          caption: item.caption || '',
          src: item.file ? `assets/symbiose/illustrations/${item.file}` : '',
          width: item.width,
          height: item.height,
        }));
        return {
          meta: {
            title: manifest.title || 'Illustrationen — Symbiose Band 1',
            band: 1,
            author: 'NachtBlau Publishing',
            tagline: 'Galerie · Band 1',
            description: manifest.description || '',
          },
          preview: `<p>${manifest.description || 'Poster, Manga-Panels und Charakter-Referenzen aus Veridia.'}</p>`,
          gallery: items,
          unlocked: true,
          isGallery: true,
        };
      }

      const book = await loadJson('config/symbiose-band1.json');
      return {
        meta: {
          title: book.title,
          band: book.band,
          author: book.author,
          tagline: book.tagline,
          description: book.description,
        },
        preview: book.preview,
        chapters: book.chapters,
        unlocked: true,
        isGallery: false,
      };
    },

    launchGame: async (gameId) => {
      const config = await window.launcher.getConfig();
      const game = config.games.find((g) => g.id === gameId);
      if (!game) throw new Error('Eintrag nicht gefunden');
      if (game.type === 'book' || game.type === 'gallery') return { mode: game.type, id: gameId };
      const url = playSpec(game)?.playUrl;
      if (!url) throw new Error(`Keine ${PLATFORM}-Version verfügbar`);

      const absUrl = /^https?:\/\//i.test(url) ? url : new URL(url, pageBase()).href;

      if (PLATFORM === 'android') {
        window.location.href = absUrl;
        return { mode: 'navigate', url: absUrl };
      }

      const windowName = `nachtblau_${gameId}`;
      const features = [
        'popup=yes',
        'width=1280',
        'height=800',
        'menubar=no',
        'toolbar=no',
        'location=yes',
        'status=no',
        'resizable=yes',
        'scrollbars=yes',
      ].join(',');

      const gameWindow = window.open(absUrl, windowName, features);
      if (gameWindow) {
        try { gameWindow.opener = null; } catch (_) { /* ignore */ }
        gameWindow.focus();
        return { mode: 'window', url: absUrl };
      }

      const tab = window.open(absUrl, '_blank', 'noopener,noreferrer');
      if (!tab) {
        window.location.href = absUrl;
        return { mode: 'navigate', url: absUrl };
      }
      return { mode: 'tab', url: absUrl };
    },

    updateGame: async (gameId) => {
      try {
        const res = await fetch(`${REMOTE_HUB}config/games.json`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const remote = await res.json();
        const remoteGame = remote.games?.find((g) => g.id === gameId);
        const local = (await window.launcher.getConfig()).games.find((g) => g.id === gameId);
        if (!remoteGame) return { success: false, error: 'Titel remote nicht gefunden' };
        const same = remoteGame.version === local?.version;
        return {
          success: true,
          updated: !same,
          version: remoteGame.version,
          message: same
            ? `${PLATFORM}: bereits aktuell (v${remoteGame.version})`
            : `${PLATFORM}: Update verfügbar — Hub neu laden (v${remoteGame.version})`,
          remoteHub: REMOTE_HUB,
        };
      } catch (err) {
        return { success: false, error: err.message || String(err) };
      }
    },
    openFolder: async () => {},
    openUrl: (url) => { window.open(url, '_blank', 'noopener'); },

    createPayPalUrl: async ({ kind, productId, amount, itemName }) => {
      const mon = await loadJson('config/monetization.json');
      return buildPayPalUrl({
        email: mon.paypalEmail,
        amount,
        itemName,
        currency: mon.currency,
        productId,
        returnKind: kind === 'tip' ? 'tip' : 'book',
      });
    },

    confirmUnlock: async (productId) => {
      await unlockProduct(productId);
      return { success: true };
    },

    onUpdateProgress: () => () => {},

    onPaymentResult: (cb) => {
      handleReturnParams().then((result) => {
        if (result) cb(result);
      });
      return () => {};
    },
  };
})();
