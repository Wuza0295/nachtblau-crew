/**
 * Android-Bridge für den NachtBlau Hub (Capacitor / WebView).
 * Gleiche API wie site-bridge.js / linux-bridge.js — gleicher UI-Stand.
 */
(function initAndroidBridge() {
  window.NACHTBLAU_MAINTENANCE = {
    active: true,
    message:
      "Server vorübergehend nicht verfügbar – Wartungsarbeiten. Der Minecraft-/Spiele-Server ist derzeit offline.",
  };

  const UNLOCKS_KEY = "nachtblau_hub_unlocks";
  const Native = window.NachtBlauNative || null;

  function defaultCategories() {
    return [
      { id: "all", label: "Alle", icon: "◈" },
      { id: "games", label: "Spiele", icon: "▶", match: { type: "game" } },
      {
        id: "symbiose",
        label: "Symbiose",
        icon: "📖",
        match: { type: ["book", "gallery"] },
        subcategories: [
          { id: "all", label: "Alle" },
          { id: "book", label: "Bücher", match: { type: "book" } },
          { id: "gallery", label: "Galerie", match: { type: "gallery" } },
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
    return `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, "")}`;
  }

  function buildPayPalUrl({ email, amount, itemName, currency, productId, returnKind }) {
    const returnUrl = new URL(window.location.href);
    returnUrl.searchParams.set("paid", returnKind || "book");
    returnUrl.searchParams.set("product", productId);
    returnUrl.searchParams.delete("cancelled");

    const cancelUrl = new URL(window.location.href);
    cancelUrl.searchParams.set("cancelled", "1");
    cancelUrl.searchParams.set("product", productId);
    cancelUrl.searchParams.delete("paid");

    const params = new URLSearchParams({
      cmd: "_xclick",
      business: email,
      item_name: itemName,
      amount: Number(amount).toFixed(2),
      currency_code: currency || "EUR",
      return: returnUrl.toString(),
      cancel_return: cancelUrl.toString(),
      no_note: "1",
      charset: "utf-8",
    });
    return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
  }

  function cleanReturnUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete("paid");
    url.searchParams.delete("cancelled");
    url.searchParams.delete("product");
    window.history.replaceState({}, "", url.pathname + url.search);
  }

  async function handleReturnParams() {
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    const cancelled = params.get("cancelled");
    const productId = params.get("product") || "symbiose-band1";

    if (cancelled) {
      cleanReturnUrl();
      return { success: false, message: "Zahlung abgebrochen.", productId };
    }
    if (!paid) return null;

    const kind = paid === "tip" ? "tip" : "book";
    if (kind === "book") {
      await unlockProduct(productId);
      cleanReturnUrl();
      return {
        success: true,
        kind: "book",
        productId,
        message:
          productId === "symbiose-illustrations"
            ? "Illustrationen freigeschaltet!"
            : "Band 1 freigeschaltet — viel Spaß beim Lesen!",
      };
    }
    cleanReturnUrl();
    return { success: true, kind: "tip", message: "Danke für dein Trinkgeld!" };
  }

  window.launcher = {
    getConfig: async () => {
      const [gamesConfig, monetization] = await Promise.all([
        loadJson("config/games.json"),
        loadJson("config/monetization.json"),
      ]);

      const games = gamesConfig.games.map((g) => {
        const isPaidContent = g.type === "book" || g.type === "gallery";
        const hasPlay = !!(g.web?.playUrl);
        return {
          ...g,
          installInfo: {
            installed: hasPlay || isPaidContent,
            details: g.web?.note || g.web?.label || (isPaidContent ? "Kostenlos" : "In-App"),
          },
          unlocked: true,
        };
      });

      return {
        studio: gamesConfig.studio,
        site: gamesConfig.site,
        categories: gamesConfig.categories || defaultCategories(),
        games,
        platform: "android",
        monetization,
      };
    },

    getPreviewUrl: async (gameId) => {
      const config = await window.launcher.getConfig();
      const game = config.games.find((g) => g.id === gameId);
      if (!game) return { mode: "cover", hint: "Nicht gefunden" };
      if (game.type === "book" || game.type === "gallery") return { mode: game.type };
      if (game.web?.playUrl) {
        return { mode: "cover", hint: "Spiel starten — öffnet in der App" };
      }
      return { mode: "cover", hint: "Keine Version verfügbar" };
    },

    getBook: async (productId) => {
      if (productId === "symbiose-illustrations") {
        const manifest = await loadJson("config/symbiose-illustrations.json");
        const items = (manifest.items || []).map((item) => ({
          id: item.id,
          title: item.title,
          caption: item.caption || "",
          src: item.file ? `assets/symbiose/illustrations/${item.file}` : "",
          width: item.width,
          height: item.height,
        }));
        return {
          meta: {
            title: manifest.title || "Illustrationen — Symbiose Band 1",
            band: 1,
            author: "NachtBlau Publishing",
            tagline: "Galerie · Band 1",
            description: manifest.description || "",
          },
          preview: `<p>${manifest.description || "Poster, Manga-Panels und Charakter-Referenzen aus Veridia."}</p>`,
          gallery: items,
          unlocked: true,
          isGallery: true,
        };
      }

      const book = await loadJson("config/symbiose-band1.json");
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
      if (!game) throw new Error("Eintrag nicht gefunden");
      if (game.type === "book" || game.type === "gallery") return { mode: game.type, id: gameId };
      const url = game.web?.playUrl;
      if (!url) throw new Error("Keine spielbare Version verfügbar");

      const absUrl = /^https?:\/\//i.test(url) ? url : new URL(url, pageBase()).href;
      if (Native?.openGame) {
        Native.openGame(absUrl, gameId);
        return { mode: "native", url: absUrl };
      }
      // Same-WebView navigation keeps offline assets working
      window.location.href = absUrl;
      return { mode: "navigate", url: absUrl };
    },

    updateGame: async () => ({
      success: false,
      error: "Inhalt kommt synchron vom Webspace — pnpm hub:sync / hub:pull.",
    }),
    openFolder: async () => {},

    openUrl: (url) => {
      if (Native?.openExternal) Native.openExternal(url);
      else window.open(url, "_blank", "noopener");
    },

    createPayPalUrl: async ({ kind, productId, amount, itemName }) => {
      const mon = await loadJson("config/monetization.json");
      return buildPayPalUrl({
        email: mon.paypalEmail,
        amount,
        itemName,
        currency: mon.currency,
        productId,
        returnKind: kind === "tip" ? "tip" : "book",
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

  const label = document.getElementById("platform-label");
  if (label) label.textContent = "Android App";
})();
