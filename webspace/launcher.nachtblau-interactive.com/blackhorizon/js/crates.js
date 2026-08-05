/* Belohnungs-Kisten — ingame / Event, transparenter Drop-Pool */
window.BH = window.BH || {};

BH.Crates = {
  PITY_RARE: 10,
  PITY_LEGENDARY: 1000,
  DUPLICATE_CREDIT_MULT: 0.5,
  MAX_INVENTORY: 200,
  ALPHA_LEGENDARY_PCT: 0.01,
  BETA_LEGENDARY_PCT: 0.015,
  HORIZON_LEGENDARY_PCT: 0.008,
  LEGENDARY_WEAPON_DUP_VALUE: 8500,
  EPIC_WEAPON_DUP_VALUE: 3200,

  SEASON2_DROP_BONUS_PCT: 0.01,

  TYPES: {
    front: {
      id: "front",
      name: "FRONT-KISTE",
      icon: "📦",
      color: "#4ade80",
      dailyCap: 5,
      desc: "Nach jedem Match — kosmetische Belohnungen aus der Front.",
      source: "match",
    },
    horizon: {
      id: "horizon",
      name: "HORIZONT",
      icon: "🌌",
      color: "#38bdf8",
      dailyCap: null,
      desc: "Event-Exklusiv Saison 2 — Schwarzer Horizont · +0,01 % Drop vs. Credits.",
      source: "event",
      eventId: "horizon_event",
      season: 2,
    },
    alpha: {
      id: "alpha",
      name: "ALPHA-KISTE",
      icon: "🔷",
      color: "#f97316",
      dailyCap: null,
      desc: "Alpha-Exklusiv — voller Kosmetik-Pool inkl. Clan, Operatoren & Legendary-Waffen (0,01 %). Pity: Legendary-Waffe spätestens nach 1.000 Kisten.",
      source: "event",
      eventId: "alpha_event",
    },
    beta: {
      id: "beta",
      name: "BETA-KISTE",
      icon: "🔹",
      color: "#6366f1",
      dailyCap: null,
      desc: "Beta-Exklusiv — Prototyp-Operatoren, Beta-Legendary-Waffen & Kosmetik (0,015 %).",
      source: "event",
      eventId: "beta_event",
      season: 2,
    },
  },

  EVENT_SHOP: [
    {
      id: "horizon_event",
      crateType: "horizon",
      name: "SCHWARZER HORIZONT",
      badge: "EVENT · S2",
      season: 2,
      icon: "🌌",
      desc: "Saison 2 — Horizont-Exklusiv & Premium-Spielzeit. Exklusiv-Items: +0,01 % Drop-Chance vs. Credits. Max. 200 Kisten.",
      packs: [
        { qty: 1, price: 400 },
        { qty: 5, price: 1850 },
        { qty: 25, price: 8500 },
      ],
    },
    {
      id: "alpha_event",
      crateType: "alpha",
      name: "ALPHA",
      badge: "ALPHA · LEGENDARY",
      icon: "🔷",
      desc: "Alpha-Kiste — kompletter Kosmetik-Pool, Clan-Items, Operatoren, Premium (Epic) & 3 Legendary-Waffen (0,01 %). Pity Legendary: 1.000 Kisten. Max. 200 Kisten.",
      packs: [
        { qty: 1, price: 450 },
        { qty: 5, price: 2100 },
        { qty: 25, price: 9500 },
      ],
    },
    {
      id: "beta_event",
      crateType: "beta",
      name: "BETA",
      badge: "BETA · PROTOTYP",
      season: 2,
      icon: "🔹",
      desc: "Beta-Kiste — VEIL, ATLAS, EMBER, Beta-Exklusiv-Kosmetik & 3 Legendary-Waffen (0,015 %). Max. 200 Kisten.",
      packs: [
        { qty: 1, price: 380 },
        { qty: 5, price: 1750 },
        { qty: 25, price: 8000 },
      ],
    },
  ],

  /* Nur in Event-Kisten — nicht im normalen Shop kaufbar */
  EXCLUSIVE: {
    horizon: {
      camos: [
        { id: "hz_rift", name: "Horizont-Riss", color: 0x1e1b4b, price: 450 },
        { id: "hz_nacht", name: "Nachtjagd", color: 0x0f172a, price: 450 },
        { id: "hz_asche", name: "Aschestrom", color: 0x292524, price: 480 },
        { id: "hz_phantom", name: "Phantom-Nebel", color: 0x1e293b, price: 500 },
        { id: "hz_zero", name: "Zero-Stahl", color: 0x334155, price: 520 },
        { id: "hz_tower", name: "Turm-Schatten", color: 0x134e4a, price: 650 },
        { id: "hz_wraith", name: "Wraith-Tarn", color: 0x0c1222, price: 720 },
        { id: "hz_prime", name: "Schwarzer Horizont Prime", color: 0x38bdf8, price: 950 },
        { id: "hz_eclipse", name: "Eclipse Gold", color: 0xb45309, price: 1100 },
      ],
      colors: [
        { id: "hz_cyan", name: "Horizont-Cyan", css: "#38bdf8", price: 150 },
        { id: "hz_gold", name: "Horizont-Gold", css: "#ffd24d", price: 180 },
        { id: "hz_ice", name: "Zero-Eis", css: "#bae6fd", price: 200 },
      ],
      sprays: [
        { id: "hz_burst", name: "Horizont-Burst", icon: "🌌", price: 450 },
        { id: "hz_tower_mark", name: "Turm-Markierung", icon: "🏙", price: 700 },
        { id: "hz_wraith", name: "Wraith-Spray", icon: "👤", price: 550 },
        { id: "hz_phoenix", name: "Phönix-Aufstieg", icon: "🔥", price: 650 },
        { id: "hz_hardcore", name: "Hardcore-Siegel", icon: "💀", price: 580 },
        { id: "hz_lift", name: "Lift-Zone", icon: "🛗", price: 480 },
      ],
      emblems: [
        { id: "hz_ops", name: "Horizont Ops", icon: "🌑", price: 600 },
        { id: "wraith_mark", name: "Wraith-Mark", icon: "👤", price: 750 },
        { id: "spectre_mark", name: "Spectre-Mark", icon: "👁", price: 780 },
        { id: "phoenix_sigil", name: "Phönix-Siegel", icon: "🔥", price: 820 },
        { id: "hardcore_hz", name: "Hardcore Horizont", icon: "💀", price: 640 },
      ],
      titles: [
        { id: "hz_walker", name: "Horizontläufer", price: 750 },
        { id: "schwarzer_horizont", name: "Schwarzer Horizont", price: 900 },
        { id: "turmjaeger", name: "Turmjäger", price: 680 },
        { id: "nachtfalke_elite", name: "Nachtfalke Elite", price: 720 },
        { id: "zero_runner", name: "Zero-Runner", price: 760 },
        { id: "phoenix_rise", name: "Phönix-Aufstieg", price: 880 },
      ],
      charms: [
        { id: "hz_ch", name: "Horizont-Anker", icon: "🌌", price: 420 },
        { id: "tower_ch", name: "Turm-Signal", icon: "🏙", price: 520 },
        { id: "wraith_ch", name: "Wraith-Charm", icon: "👤", price: 540 },
        { id: "phoenix_ch", name: "Phönix-Feder", icon: "🔥", price: 560 },
        { id: "lift_ch", name: "Lift-Charm", icon: "🛗", price: 460 },
      ],
      crosshairs: [
        { id: "hz_x", name: "Horizont-Punkt", glyph: "◎", price: 320 },
        { id: "hz_sharp", name: "Zero-Scharf", glyph: "✛", price: 380 },
        { id: "hz_phantom", name: "Phantom-Kreuz", glyph: "⊕", price: 420 },
      ],
      callingCards: [
        { id: "hz_card", name: "Schwarzer Horizont", icon: "🌌", style: "cc-horizon", price: 800 },
        { id: "hz_wraith_card", name: "Wraith Protocol", icon: "👤", style: "cc-hz-wraith", price: 850 },
        { id: "hz_tower_card", name: "Tower Zero", icon: "🏙", style: "cc-hz-tower", price: 900 },
        { id: "hz_phoenix_card", name: "Phoenix Rising", icon: "🔥", style: "cc-hz-phoenix", price: 950 },
      ],
    },
    alpha: {
      camos: [
        { id: "clan_iron", name: "Eisenfront", color: 0x334155, price: 550, poolRarity: "uncommon" },
        { id: "clan_gold", name: "Clan-Gold", color: 0xb45309, price: 850, poolRarity: "rare" },
        { id: "clan_elite", name: "Elite-Front", color: 0x1e293b, price: 1100, poolRarity: "epic" },
      ],
      colors: [
        { id: "clan_crimson", name: "Clan-Karmesin", css: "#dc2626", price: 150, poolRarity: "common" },
        { id: "clan_steel", name: "Stahl-Grau", css: "#64748b", price: 150, poolRarity: "common" },
        { id: "clan_royal", name: "Königsblau", css: "#2563eb", price: 200, poolRarity: "uncommon" },
      ],
      sprays: [
        { id: "clan_tag", name: "Clan-Tag", icon: "⚔", price: 450, poolRarity: "common" },
        { id: "clan_rally", name: "Rally-Spray", icon: "📣", price: 550, poolRarity: "uncommon" },
        { id: "clan_victory", name: "Clan-Sieg", icon: "🏆", price: 700, poolRarity: "rare" },
        { id: "clan_match", name: "Match-Sieger", icon: "🎖", price: 900, poolRarity: "epic" },
      ],
      emblems: [
        { id: "clan_banner", name: "Clan-Banner", icon: "⚔", price: 500, poolRarity: "uncommon" },
        { id: "clan_war", name: "Kriegshelm", icon: "🪖", price: 650, poolRarity: "uncommon" },
        { id: "clan_crown", name: "Anführer-Krone", icon: "👑", price: 800, poolRarity: "rare" },
        { id: "clan_match_em", name: "Match-Siegel", icon: "🏆", price: 950, poolRarity: "epic" },
        { id: "clan_treasury", name: "Schatzkammer", icon: "🏰", price: 750, poolRarity: "rare" },
      ],
      titles: [
        { id: "clan_brother", name: "Bruder im Clan", price: 600, poolRarity: "uncommon" },
        { id: "clan_officer", name: "Clan-Offizier", price: 750, poolRarity: "rare" },
        { id: "clan_warlord", name: "Clan-Kriegsherr", price: 950, poolRarity: "epic" },
        { id: "clan_legend", name: "Clan-Legende", price: 1200, poolRarity: "epic" },
      ],
      charms: [
        { id: "clan_ch", name: "Clan-Dogtag", icon: "⚔", price: 480, poolRarity: "uncommon" },
        { id: "clan_tower", name: "Turm-Wächter", icon: "🏰", price: 620, poolRarity: "rare" },
      ],
      crosshairs: [
        { id: "clan_x", name: "Clan-Kreuz", glyph: "⊹", price: 340, poolRarity: "uncommon" },
        { id: "clan_sight", name: "Squad-Visier", glyph: "⌖", price: 520, poolRarity: "rare" },
      ],
      callingCards: [
        { id: "clan_card", name: "Clan Protocol", icon: "⚔", style: "cc-clan", price: 750, poolRarity: "rare" },
        { id: "clan_elite_card", name: "Elite Squad", icon: "👑", style: "cc-clan-elite", price: 950, poolRarity: "epic" },
      ],
    },
    beta: {
      camos: [
        { id: "beta_pulse", name: "Beta-Puls", color: 0x06b6d4, price: 520, poolRarity: "uncommon" },
        { id: "beta_void", name: "Beta-Void", color: 0x312e81, price: 580, poolRarity: "uncommon" },
        { id: "beta_storm", name: "Sturmzelle", color: 0x22d3ee, price: 720, poolRarity: "rare" },
        { id: "beta_grav", name: "Graviton", color: 0xc026d3, price: 950, poolRarity: "epic" },
      ],
      colors: [
        { id: "beta_cyan", name: "Beta-Cyan", css: "#22d3ee", price: 150, poolRarity: "common" },
        { id: "beta_vio", name: "Beta-Violett", css: "#a855f7", price: 180, poolRarity: "uncommon" },
      ],
      sprays: [
        { id: "beta_sig", name: "Beta-Siegel", icon: "🔹", price: 450, poolRarity: "common" },
        { id: "void_mark", name: "Void-Mark", icon: "🌑", price: 550, poolRarity: "uncommon" },
        { id: "proto", name: "Prototyp", icon: "⚡", price: 520, poolRarity: "uncommon" },
        { id: "beta_strike", name: "Beta-Strike", icon: "💠", price: 680, poolRarity: "rare" },
      ],
      emblems: [
        { id: "beta_ops", name: "Beta Ops", icon: "🔹", price: 550, poolRarity: "uncommon" },
        { id: "void_sigil", name: "Void-Siegel", icon: "🌌", price: 720, poolRarity: "rare" },
        { id: "storm_mark", name: "Sturm-Mark", icon: "⚡", price: 800, poolRarity: "epic" },
      ],
      titles: [
        { id: "beta_runner", name: "Beta-Runner", price: 650, poolRarity: "uncommon" },
        { id: "void_walker", name: "Void-Walker", price: 820, poolRarity: "rare" },
        { id: "proto_master", name: "Prototyp-Meister", price: 950, poolRarity: "epic" },
      ],
      charms: [
        { id: "beta_ch", name: "Beta-Anker", icon: "🔹", price: 420, poolRarity: "uncommon" },
        { id: "void_ch", name: "Void-Charm", icon: "🌑", price: 540, poolRarity: "rare" },
      ],
      crosshairs: [
        { id: "beta_x", name: "Beta-Punkt", glyph: "◈", price: 340, poolRarity: "uncommon" },
        { id: "void_sight", name: "Void-Visier", glyph: "⊛", price: 480, poolRarity: "rare" },
      ],
      callingCards: [
        { id: "beta_card", name: "Beta Protocol", icon: "🔹", style: "cc-beta", price: 750, poolRarity: "rare" },
        { id: "void_card", name: "Void Signal", icon: "🌑", style: "cc-beta-void", price: 900, poolRarity: "epic" },
      ],
    },
  },

  RARITY: {
    common:   { label: "Common",   weight: 55, css: "crate-r-common" },
    uncommon: { label: "Uncommon", weight: 30, css: "crate-r-uncommon" },
    rare:     { label: "Rare",     weight: 13, css: "crate-r-rare" },
    epic:     { label: "Epic",     weight: 2,  css: "crate-r-epic" },
    legendary:{ label: "Legendary", weight: 0, css: "crate-r-legendary" },
  },

  _dayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  },

  isEnabled() {
    if (!BH.RELEASE || !BH.RELEASE.features) return true;
    return BH.RELEASE.features.crates !== false;
  },

  ensure(d) {
    if (!d.crates) {
      d.crates = {
        inventory: { front: 0, horizon: 0, alpha: 0, beta: 0 },
        pity: { frontRare: 0, horizonRare: 0, alphaRare: 0, betaRare: 0,
          horizonLegendary: 0, alphaLegendary: 0, betaLegendary: 0 },
        openedTotal: 0,
        history: [],
        daily: { key: "", front: 0 },
      };
    }
    const c = d.crates;
    if (!c.inventory) c.inventory = { front: 0, horizon: 0, alpha: 0, beta: 0 };
    for (const t of Object.keys(this.TYPES)) {
      if (typeof c.inventory[t] !== "number") c.inventory[t] = 0;
    }
    if (c.inventory.shadow > 0) {
      c.inventory.alpha = (c.inventory.alpha || 0) + c.inventory.shadow;
      c.inventory.shadow = 0;
    }
    if (!c.pity) c.pity = { frontRare: 0, horizonRare: 0, alphaRare: 0, betaRare: 0,
      horizonLegendary: 0, alphaLegendary: 0, betaLegendary: 0 };
    for (const t of Object.keys(this.TYPES)) {
      const k = t + "Rare";
      if (typeof c.pity[k] !== "number") c.pity[k] = 0;
      const lk = t + "Legendary";
      if (typeof c.pity[lk] !== "number") c.pity[lk] = 0;
    }
    if (typeof c.pity.shadowRare === "number") {
      c.pity.alphaRare = (c.pity.alphaRare || 0) + c.pity.shadowRare;
      delete c.pity.shadowRare;
    }
    if (typeof c.openedTotal !== "number") c.openedTotal = 0;
    if (!Array.isArray(c.history)) c.history = [];
    if (!c.daily) c.daily = { key: this._dayKey(), front: 0 };
    const today = this._dayKey();
    if (c.daily.key !== today) {
      c.daily.key = today;
      c.daily.front = 0;
    }
  },

  effectiveSeason(d) {
    if (BH.SeasonRelease && BH.SeasonRelease.effectiveBpSeason) {
      return BH.SeasonRelease.effectiveBpSeason(d);
    }
    return (d && d.bpSeason) || 1;
  },

  exclusiveItems(kind) {
    const keyMap = {
      camo: "camos",
      color: "colors",
      spray: "sprays",
      emblem: "emblems",
      title: "titles",
      charm: "charms",
      crosshair: "crosshairs",
      callingCard: "callingCards",
    };
    const listKey = keyMap[kind] || kind;
    const items = [];
    for (const type of Object.keys(this.EXCLUSIVE)) {
      const block = this.EXCLUSIVE[type];
      if (block && block[listKey]) items.push(...block[listKey]);
    }
    return items;
  },

  exclusiveItem(kind, id) {
    const keyMap = {
      camo: "camos",
      color: "colors",
      spray: "sprays",
      emblem: "emblems",
      title: "titles",
      charm: "charms",
      crosshair: "crosshairs",
      callingCard: "callingCards",
    };
    const listKey = keyMap[kind];
    if (!listKey) return null;
    for (const type of Object.keys(this.EXCLUSIVE)) {
      const list = (this.EXCLUSIVE[type] && this.EXCLUSIVE[type][listKey]) || [];
      const hit = list.find(x => x.id === id);
      if (hit) return hit;
    }
    return null;
  },

  _shopItem(kind, id) {
    const ex = this.exclusiveItem(kind, id);
    if (ex) return ex;
    const shop = BH.SHOP || {};
    const lists = {
      camo: shop.camos,
      crosshair: shop.crosshairs,
      color: shop.colors,
      spray: shop.sprays,
      emblem: shop.emblems,
      title: shop.titles,
      charm: shop.charms,
      callingCard: shop.callingCards || (BH.CallingCards && BH.CallingCards.list) || [],
    };
    const list = lists[kind];
    if (!list) return null;
    return list.find(x => x.id === id) || null;
  },

  _frontPool(season) {
    const pool = [
      { kind: "credits", id: "credits_25",  rarity: "common",   label: "+25 ⛁", credits: 25 },
      { kind: "credits", id: "credits_50",  rarity: "common",   label: "+50 ⛁", credits: 50 },
      { kind: "credits", id: "credits_75",  rarity: "common",   label: "+75 ⛁", credits: 75 },
      { kind: "color",   id: "orange",      rarity: "common",   label: "Farbe Orange" },
      { kind: "color",   id: "lime",        rarity: "common",   label: "Farbe Limette" },
      { kind: "spray",   id: "gg",          rarity: "common",   label: "Spray GG" },
      { kind: "spray",   id: "ez",          rarity: "uncommon", label: "Spray EZ" },
      { kind: "spray",   id: "target",      rarity: "uncommon", label: "Spray Ziel erfasst" },
      { kind: "emblem",  id: "shop_wolf",   rarity: "uncommon", label: "Emblem Wolf" },
      { kind: "emblem",  id: "shop_cross",  rarity: "uncommon", label: "Emblem Fadenkreuz" },
      { kind: "camo",    id: "sandsturm",   rarity: "rare",     label: "Tarnung Sandsturm" },
      { kind: "camo",    id: "aschegrau",   rarity: "rare",     label: "Tarnung Aschegrau" },
      { kind: "crosshair", id: "sharp",     rarity: "rare",     label: "Fadenkreuz Scharf" },
      { kind: "camo",    id: "mitternacht", rarity: "epic",     label: "Tarnung Mitternacht" },
      { kind: "spray",   id: "horizon",     rarity: "epic",     label: "Spray Black Horizon" },
    ];
    if (season >= 2) {
      pool.push(
        { kind: "camo", id: "void", rarity: "rare", label: "Tarnung Void" },
        { kind: "spray", id: "outbreak", rarity: "uncommon", label: "Spray Outbreak" },
      );
    }
    return pool;
  },

  _buildHorizonWeightedPool(creditEntries, premiumEntries, exclusiveEntries, creditW) {
    const credits = creditEntries.map(e => ({ ...e, weight: creditW }));
    let preTotal = credits.length * creditW;
    preTotal += premiumEntries.reduce((s, e) => s + (e.weight || 1), 0);
    preTotal += exclusiveEntries.length * creditW;
    const bonusW = (this.SEASON2_DROP_BONUS_PCT / 100) * preTotal;
    const exclusives = exclusiveEntries.map(e => ({
      ...e,
      exclusive: e.exclusive !== false,
      weight: e.weight != null ? e.weight : creditW + bonusW,
    }));
    return [...credits, ...premiumEntries, ...exclusives];
  },

  _appendCrateLegendaries(pool, weaponIds, pct) {
    if (!weaponIds || !weaponIds.length) return pool;
    const preTotal = this._poolTotalWeight(pool);
    const legTotalW = preTotal * (pct / 100) / (1 - pct / 100);
    const perLeg = legTotalW / weaponIds.length;
    const legs = weaponIds.map(id => ({
      kind: "weapon", id, rarity: "legendary", exclusive: true, weight: perLeg,
    }));
    return [...pool, ...legs];
  },

  _horizonPool() {
    const creditW = 26;
    const credits = [
      { kind: "credits", id: "hz_c_25", rarity: "common", label: "+25 ⛁", credits: 25 },
      { kind: "credits", id: "hz_c_50", rarity: "common", label: "+50 ⛁", credits: 50 },
      { kind: "credits", id: "hz_c_75", rarity: "common", label: "+75 ⛁", credits: 75 },
      { kind: "credits", id: "hz_c_100", rarity: "uncommon", label: "+100 ⛁", credits: 100 },
      { kind: "credits", id: "hz_c_150", rarity: "uncommon", label: "+150 ⛁", credits: 150 },
      { kind: "credits", id: "hz_c_200", rarity: "rare", label: "+200 ⛁", credits: 200 },
    ];
    const premium = [
      { kind: "premiumTime", id: "pt_7", days: 7, rarity: "uncommon", weight: 42 },
      { kind: "premiumTime", id: "pt_14", days: 14, rarity: "uncommon", weight: 20 },
      { kind: "premiumTime", id: "pt_30", days: 30, rarity: "rare", weight: 9 },
      { kind: "premiumTime", id: "pt_80", days: 80, rarity: "epic", weight: 2.5 },
      { kind: "premiumTime", id: "pt_365", days: 365, rarity: "epic", weight: 0.5 },
    ];
    const exclusives = [
      /* Common */
      { kind: "camo", id: "hz_rift", rarity: "common" },
      { kind: "camo", id: "hz_nacht", rarity: "common" },
      { kind: "camo", id: "hz_asche", rarity: "common" },
      { kind: "color", id: "hz_cyan", rarity: "common" },
      { kind: "color", id: "hz_gold", rarity: "common" },
      { kind: "color", id: "hz_ice", rarity: "common" },
      /* Uncommon */
      { kind: "camo", id: "hz_phantom", rarity: "uncommon" },
      { kind: "camo", id: "hz_zero", rarity: "uncommon" },
      { kind: "spray", id: "hz_burst", rarity: "uncommon" },
      { kind: "spray", id: "hz_lift", rarity: "uncommon" },
      { kind: "spray", id: "hz_wraith", rarity: "uncommon" },
      { kind: "spray", id: "hz_hardcore", rarity: "uncommon" },
      { kind: "charm", id: "hz_ch", rarity: "uncommon" },
      { kind: "charm", id: "lift_ch", rarity: "uncommon" },
      { kind: "crosshair", id: "hz_x", rarity: "uncommon" },
      /* Rare */
      { kind: "emblem", id: "hz_ops", rarity: "rare" },
      { kind: "emblem", id: "hardcore_hz", rarity: "rare" },
      { kind: "camo", id: "hz_tower", rarity: "rare" },
      { kind: "camo", id: "hz_wraith", rarity: "rare" },
      { kind: "spray", id: "hz_phoenix", rarity: "rare" },
      { kind: "crosshair", id: "hz_sharp", rarity: "rare" },
      { kind: "title", id: "hz_walker", rarity: "rare" },
      { kind: "title", id: "turmjaeger", rarity: "rare" },
      { kind: "title", id: "zero_runner", rarity: "rare" },
      { kind: "emblem", id: "wraith_mark", rarity: "rare" },
      { kind: "emblem", id: "spectre_mark", rarity: "rare" },
      { kind: "charm", id: "tower_ch", rarity: "rare" },
      { kind: "charm", id: "wraith_ch", rarity: "rare" },
      /* Epic */
      { kind: "camo", id: "hz_prime", rarity: "epic" },
      { kind: "camo", id: "hz_eclipse", rarity: "epic" },
      { kind: "spray", id: "hz_tower_mark", rarity: "epic" },
      { kind: "crosshair", id: "hz_phantom", rarity: "epic" },
      { kind: "emblem", id: "phoenix_sigil", rarity: "epic" },
      { kind: "title", id: "schwarzer_horizont", rarity: "epic" },
      { kind: "title", id: "nachtfalke_elite", rarity: "epic" },
      { kind: "title", id: "phoenix_rise", rarity: "epic" },
      { kind: "charm", id: "phoenix_ch", rarity: "epic" },
      { kind: "callingCard", id: "hz_card", rarity: "epic" },
      { kind: "callingCard", id: "hz_wraith_card", rarity: "epic" },
      { kind: "callingCard", id: "hz_tower_card", rarity: "epic" },
      { kind: "callingCard", id: "hz_phoenix_card", rarity: "epic" },
      /* Operatoren */
      { kind: "operator", id: "veil", rarity: "rare" },
      { kind: "operator", id: "atlas", rarity: "uncommon" },
      { kind: "operator", id: "ember", rarity: "rare" },
      { kind: "operator", id: "cipher", rarity: "epic" },
      { kind: "operator", id: "phoenix", rarity: "legendary" },
      { kind: "operator", id: "frost", rarity: "epic" },
      { kind: "operator", id: "mirage", rarity: "rare" },
    ];
    const base = this._buildHorizonWeightedPool(credits, premium, exclusives, creditW);
    return this._appendCrateLegendaries(base, BH.HORIZON_CRATE_WEAPON_IDS || BH.HORIZON_LEGENDARY_IDS || [], this.HORIZON_LEGENDARY_PCT);
  },

  _buildAlphaWeightedPool(creditEntries, legendaryEntries, creditW) {
    const credits = creditEntries.map(e => ({ ...e, weight: creditW }));
    const preTotal = credits.reduce((s, e) => s + e.weight, 0);
    const legTotalW = preTotal * (this.ALPHA_LEGENDARY_PCT / 100) / (1 - this.ALPHA_LEGENDARY_PCT / 100);
    const perLeg = legendaryEntries.length ? legTotalW / legendaryEntries.length : 0;
    const legendaries = legendaryEntries.map(e => ({
      ...e,
      exclusive: true,
      weight: perLeg,
    }));
    return [...credits, ...legendaries];
  },

  ALPHA_WEIGHTS: { common: 28, uncommon: 17, rare: 9, epic: 3.5 },

  _exclusiveKindMap: {
    camos: "camo",
    colors: "color",
    sprays: "spray",
    emblems: "emblem",
    titles: "title",
    charms: "charm",
    crosshairs: "crosshair",
    callingCards: "callingCard",
  },

  _resolveItem(kind, id) {
    const ex = this.exclusiveItem(kind, id);
    if (ex) return ex;
    if (kind === "weapon") {
      const w = BH.WEAPONS && BH.WEAPONS[id];
      return w ? { id, name: w.name } : null;
    }
    if (kind === "operator") {
      return (BH.OPERATORS_S1 || []).find(o => o.id === id)
        || (BH.OPERATORS_S2 || []).find(o => o.id === id)
        || null;
    }
    if (kind === "emblem") return (BH.EMBLEMS || []).find(e => e.id === id) || null;
    if (kind === "title") return (BH.TITLES || []).find(t => t.id === id) || null;
    if (kind === "camo") return (BH.CAMOS || []).find(c => c.id === id) || null;
    return this._shopItem(kind, id);
  },

  _priceToRarity(price, fallback) {
    const p = price || 0;
    if (p >= 1000) return "epic";
    if (p >= 650) return "rare";
    if (p >= 400) return "uncommon";
    return fallback || "common";
  },

  _alphaHorizonExclusiveKeys() {
    if (this._horizonKeyCache) return this._horizonKeyCache;
    const set = new Set();
    const block = this.EXCLUSIVE.horizon;
    if (block) {
      for (const [listKey, kind] of Object.entries(this._exclusiveKindMap)) {
        for (const item of block[listKey] || []) {
          set.add(kind + ":" + item.id);
        }
      }
    }
    this._horizonKeyCache = set;
    return set;
  },

  _betaExclusiveKeys() {
    if (this._betaKeyCache) return this._betaKeyCache;
    const set = new Set();
    const block = this.EXCLUSIVE.beta;
    if (block) {
      for (const [listKey, kind] of Object.entries(this._exclusiveKindMap)) {
        for (const item of block[listKey] || []) {
          set.add(kind + ":" + item.id);
        }
      }
    }
    this._betaKeyCache = set;
    return set;
  },

  _alphaIsSeason2Only(kind, id) {
    if (this._alphaHorizonExclusiveKeys().has(kind + ":" + id)) return true;
    if (this._betaExclusiveKeys().has(kind + ":" + id)) return true;
    if (kind === "weapon") {
      if ((BH.BETA_CRATE_WEAPON_IDS || []).includes(id)) return true;
      if ((BH.HORIZON_CRATE_WEAPON_IDS || []).includes(id)) return true;
      if ((BH.PROTOTYPE_ALPHA_IDS || []).includes(id)) return false;
    }
    if (kind === "operator") {
      if (id === "phoenix") return true;
      const op = (BH.OPERATORS_S1 || []).find(o => o.id === id)
        || (BH.OPERATORS_S2 || []).find(o => o.id === id);
      if (op && op.requireSeason >= 2) return true;
    }
    return false;
  },

  _alphaCatalog() {
    const entries = [];
    const seen = new Set();
    const keyOf = (kind, id) => kind + ":" + id;
    const add = (entry) => {
      if (this._alphaIsSeason2Only(entry.kind, entry.id)) return;
      const k = keyOf(entry.kind, entry.id);
      if (seen.has(k)) return;
      seen.add(k);
      entries.push(entry);
    };

    for (const c of [
      { id: "a_c_150", credits: 150, rarity: "common", label: "+150 ⛁", weightMult: 1.15 },
      { id: "a_c_250", credits: 250, rarity: "common", label: "+250 ⛁", weightMult: 1.1 },
      { id: "a_c_400", credits: 400, rarity: "common", label: "+400 ⛁" },
      { id: "a_c_550", credits: 550, rarity: "uncommon", label: "+550 ⛁" },
      { id: "a_c_800", credits: 800, rarity: "uncommon", label: "+800 ⛁" },
      { id: "a_c_1200", credits: 1200, rarity: "rare", label: "+1.200 ⛁" },
      { id: "a_c_1800", credits: 1800, rarity: "rare", label: "+1.800 ⛁" },
      { id: "a_c_3000", credits: 3000, rarity: "epic", label: "+3.000 ⛁", weightMult: 0.7 },
      { id: "a_c_5000", credits: 5000, rarity: "epic", label: "+5.000 ⛁", weightMult: 0.4 },
    ]) {
      add({ kind: "credits", poolTag: "credits", weightMult: 1, ...c });
    }

    for (const p of [
      { id: "pt_7", days: 7, weightMult: 0.9 },
      { id: "pt_14", days: 14, weightMult: 0.55 },
      { id: "pt_30", days: 30, weightMult: 0.38 },
      { id: "pt_80", days: 80, weightMult: 0.14 },
      { id: "pt_365", days: 365, weightMult: 0.035 },
    ]) {
      add({
        kind: "premiumTime", id: p.id, days: p.days, rarity: "epic",
        poolTag: "premium", weightMult: p.weightMult, exclusive: true,
      });
    }

    for (const c of (BH.SHOP && BH.SHOP.colors) || []) {
      if (c.id === "white") continue;
      add({ kind: "color", id: c.id, rarity: this._priceToRarity(c.price, "common"), poolTag: "shop", weightMult: 1 });
    }
    for (const c of (BH.SHOP && BH.SHOP.crosshairs) || []) {
      if (c.id === "classic") continue;
      add({ kind: "crosshair", id: c.id, rarity: this._priceToRarity(c.price, "uncommon"), poolTag: "shop", weightMult: 1 });
    }
    for (const c of (BH.SHOP && BH.SHOP.sprays) || []) {
      add({ kind: "spray", id: c.id, rarity: this._priceToRarity(c.price, "uncommon"), poolTag: "shop", weightMult: 1 });
    }
    for (const c of (BH.SHOP && BH.SHOP.camos) || []) {
      add({ kind: "camo", id: c.id, rarity: this._priceToRarity(c.price, "uncommon"), poolTag: "shop", weightMult: 1 });
    }
    for (const c of (BH.SHOP && BH.SHOP.emblems) || []) {
      add({ kind: "emblem", id: c.id, rarity: this._priceToRarity(c.price, "uncommon"), poolTag: "shop", weightMult: 1 });
    }
    for (const c of (BH.SHOP && BH.SHOP.titles) || []) {
      add({ kind: "title", id: c.id, rarity: this._priceToRarity(c.price, "rare"), poolTag: "shop", weightMult: 1 });
    }
    for (const c of (BH.SHOP && BH.SHOP.charms) || []) {
      add({ kind: "charm", id: c.id, rarity: this._priceToRarity(c.price, "uncommon"), poolTag: "shop", weightMult: 1 });
    }
    for (const c of (BH.SHOP && BH.SHOP.callingCards) || []) {
      add({ kind: "callingCard", id: c.id, rarity: this._priceToRarity(c.price, "rare"), poolTag: "shop", weightMult: 1 });
    }

    for (const c of (BH.CAMOS || [])) {
      if (c.shop || c.eventOnly || c.id === "black") continue;
      if ((BH.SHOP && BH.SHOP.camos) && BH.SHOP.camos.some(x => x.id === c.id)) continue;
      add({
        kind: "camo", id: c.id,
        rarity: c.requirePrestige ? "epic" : c.requireBpTier ? "rare" : c.requireLevel ? "uncommon" : "common",
        poolTag: "meta", weightMult: c.requirePrestige ? 0.45 : 0.85,
      });
    }

    for (const e of (BH.EMBLEMS || [])) {
      if (e.id === "recruit" || e.requireLogin) continue;
      add({
        kind: "emblem", id: e.id,
        rarity: e.requirePrestige ? "epic" : e.requireLevel >= 25 ? "rare" : "uncommon",
        poolTag: e.id.startsWith("fw_") ? "clan" : "meta",
        weightMult: e.id.startsWith("fw_") ? 1.35 : 0.9,
        exclusive: !!e.shop,
      });
    }

    for (const t of (BH.TITLES || [])) {
      if (t.id === "none") continue;
      add({
        kind: "title", id: t.id,
        rarity: t.requirePrestige ? "epic" : t.requireLevel >= 40 ? "rare" : "uncommon",
        poolTag: "meta", weightMult: 0.85,
      });
    }

    for (const c of (BH.CallingCards && BH.CallingCards.list) || []) {
      if (c.id === "default" || c.eventOnly) continue;
      if ((BH.SHOP && BH.SHOP.callingCards) && BH.SHOP.callingCards.some(x => x.id === c.id)) continue;
      add({
        kind: "callingCard", id: c.id,
        rarity: c.requirePrestige ? "epic" : "rare",
        poolTag: "meta", weightMult: c.requirePrestige ? 0.4 : 0.75,
      });
    }

    for (const crateType of ["alpha"]) {
      const block = this.EXCLUSIVE[crateType];
      if (!block) continue;
      const tag = "clan";
      const mult = 1.4;
      for (const [listKey, kind] of Object.entries(this._exclusiveKindMap)) {
        for (const item of block[listKey] || []) {
          add({
            kind, id: item.id,
            rarity: item.poolRarity || this._priceToRarity(item.price, "uncommon"),
            poolTag: tag, weightMult: mult, exclusive: true,
          });
        }
      }
    }

    for (const op of (BH.OPERATORS_S1 || [])) {
      if (op.id === "recruit" || op.requireSeason >= 2) continue;
      let rarity = "common";
      let mult = 1;
      if (BH.OperatorRarity) {
        rarity = BH.OperatorRarity.resolve(op).id;
        if (rarity === "legendary") { mult = 0.25; }
        else if (rarity === "epic") { mult = 0.35; }
        else if (rarity === "rare") { mult = 0.75; }
        else if (rarity === "uncommon") { mult = 0.9; }
      } else if (op.crateOnly) { rarity = "legendary"; mult = 0.25; }
      else if (op.requireBpTier) { rarity = "legendary"; mult = 0.25; }
      else if ((op.price || 0) >= 900) { rarity = "rare"; mult = 0.85; }
      else if ((op.price || 0) >= 650) { rarity = "uncommon"; }
      add({ kind: "operator", id: op.id, rarity, poolTag: "operator", weightMult: mult });
    }

    for (const id of (BH.ALPHA_EPIC_WEAPON_IDS || [])) {
      add({
        kind: "weapon", id, rarity: "epic",
        poolTag: "weapons", weightMult: 0.9, exclusive: true,
      });
    }

    return entries;
  },

  _buildAlphaPoolFromCatalog(catalog, legendaries) {
    const weights = this.ALPHA_WEIGHTS;
    const pool = catalog.map(entry => {
      const base = weights[entry.rarity] || weights.common;
      return { ...entry, weight: base * (entry.weightMult || 1) };
    });
    const preTotal = pool.reduce((s, e) => s + e.weight, 0);
    const legTotalW = preTotal * (this.ALPHA_LEGENDARY_PCT / 100) / (1 - this.ALPHA_LEGENDARY_PCT / 100);
    const perLeg = legendaries.length ? legTotalW / legendaries.length : 0;
    for (const leg of legendaries) {
      pool.push({ ...leg, exclusive: true, weight: perLeg, poolTag: "legendary" });
    }
    return pool;
  },

  _alphaPool() {
    const legendaries = (BH.ALPHA_CRATE_WEAPON_IDS || BH.ALPHA_LEGENDARY_IDS || []).map(id => ({
      kind: "weapon", id, rarity: "legendary",
    }));
    return this._buildAlphaPoolFromCatalog(this._alphaCatalog(), legendaries);
  },

  _betaPool() {
    const creditW = 24;
    const credits = [
      { kind: "credits", id: "b_c_25", rarity: "common", label: "+25 ⛁", credits: 25 },
      { kind: "credits", id: "b_c_50", rarity: "common", label: "+50 ⛁", credits: 50 },
      { kind: "credits", id: "b_c_75", rarity: "common", label: "+75 ⛁", credits: 75 },
      { kind: "credits", id: "b_c_100", rarity: "uncommon", label: "+100 ⛁", credits: 100 },
      { kind: "credits", id: "b_c_150", rarity: "uncommon", label: "+150 ⛁", credits: 150 },
      { kind: "credits", id: "b_c_200", rarity: "rare", label: "+200 ⛁", credits: 200 },
    ];
    const premium = [
      { kind: "premiumTime", id: "pt_7", days: 7, rarity: "uncommon", weight: 38 },
      { kind: "premiumTime", id: "pt_14", days: 14, rarity: "uncommon", weight: 18 },
      { kind: "premiumTime", id: "pt_30", days: 30, rarity: "rare", weight: 7 },
    ];
    const exclusives = [
      { kind: "camo", id: "beta_pulse", rarity: "uncommon" },
      { kind: "camo", id: "beta_void", rarity: "uncommon" },
      { kind: "camo", id: "beta_storm", rarity: "rare" },
      { kind: "camo", id: "beta_grav", rarity: "epic" },
      { kind: "color", id: "beta_cyan", rarity: "common" },
      { kind: "color", id: "beta_vio", rarity: "uncommon" },
      { kind: "spray", id: "beta_sig", rarity: "common" },
      { kind: "spray", id: "void_mark", rarity: "uncommon" },
      { kind: "spray", id: "proto", rarity: "uncommon" },
      { kind: "spray", id: "beta_strike", rarity: "rare" },
      { kind: "emblem", id: "beta_ops", rarity: "uncommon" },
      { kind: "emblem", id: "void_sigil", rarity: "rare" },
      { kind: "emblem", id: "storm_mark", rarity: "epic" },
      { kind: "title", id: "beta_runner", rarity: "uncommon" },
      { kind: "title", id: "void_walker", rarity: "rare" },
      { kind: "title", id: "proto_master", rarity: "epic" },
      { kind: "charm", id: "beta_ch", rarity: "uncommon" },
      { kind: "charm", id: "void_ch", rarity: "rare" },
      { kind: "crosshair", id: "beta_x", rarity: "uncommon" },
      { kind: "crosshair", id: "void_sight", rarity: "rare" },
      { kind: "callingCard", id: "beta_card", rarity: "rare" },
      { kind: "callingCard", id: "void_card", rarity: "epic" },
      { kind: "operator", id: "veil", rarity: "rare" },
      { kind: "operator", id: "atlas", rarity: "uncommon" },
      { kind: "operator", id: "ember", rarity: "rare" },
      { kind: "operator", id: "slag", rarity: "epic" },
      { kind: "operator", id: "nachtfalke", rarity: "rare" },
      { kind: "operator", id: "vortex", rarity: "rare" },
    ];
    const base = this._buildHorizonWeightedPool(credits, premium, exclusives, creditW);
    return this._appendCrateLegendaries(base, BH.BETA_CRATE_WEAPON_IDS || BH.BETA_LEGENDARY_IDS || [], this.BETA_LEGENDARY_PCT);
  },

  poolReady(type) {
    const def = this.typeDef(type);
    if (def && def.poolReady === false) return false;
    return this.getPool(type, null).length > 0;
  },

  eventShopEntries(d) {
    return this.EVENT_SHOP.filter(ev => {
      if (ev.crateType === "shadow" || ev.id === "shadow_event") return false;
      if (!ev.season || ev.season <= 1) return true;
      if (ev.season === 2) {
        if (ev.crateType === "horizon") {
          return !BH.SeasonRelease || BH.SeasonRelease.isS2Feature("eventCrateHorizon");
        }
        if (ev.crateType === "beta") {
          return !BH.SeasonRelease || BH.SeasonRelease.isS2Feature("eventCrateBeta");
        }
      }
      return true;
    });
  },

  usesWeightedPool(type) {
    return type === "horizon" || type === "alpha" || type === "beta";
  },

  _poolTotalWeight(pool) {
    return pool.reduce((s, e) => s + (e.weight || 1), 0);
  },

  _pickWeighted(pool, d) {
    const total = this._poolTotalWeight(pool);
    let roll = Math.random() * total;
    for (const entry of pool) {
      roll -= entry.weight || 1;
      if (roll <= 0) return entry;
    }
    return pool[pool.length - 1];
  },

  _legendaryWeaponPool(pool) {
    return pool.filter(e => e.kind === "weapon" && e.rarity === "legendary");
  },

  _pickLegendaryWeapon(candidates, d) {
    if (!candidates.length) return null;
    const unowned = candidates.filter(e => !this.isOwned(d, e));
    const pickFrom = unowned.length ? unowned : candidates;
    return pickFrom[Math.floor(Math.random() * pickFrom.length)];
  },

  legendaryPityProgress(d, type) {
    this.ensure(d);
    if (!this.usesWeightedPool(type)) return null;
    const key = type + "Legendary";
    const count = d.crates.pity[key] || 0;
    return {
      count,
      max: this.PITY_LEGENDARY,
      remaining: Math.max(0, this.PITY_LEGENDARY - count),
    };
  },

  legendaryPityRemaining(d, type) {
    const p = this.legendaryPityProgress(d, type);
    return p ? p.remaining : null;
  },

  getPool(type, d) {
    if (type === "front") return this._frontPool(this.effectiveSeason(d));
    if (type === "horizon") return this._horizonPool();
    if (type === "alpha") return this._alphaPool();
    if (type === "beta") return this._betaPool();
    return [];
  },

  count(d, type) {
    this.ensure(d);
    return d.crates.inventory[type] || 0;
  },

  totalUnopened(d) {
    this.ensure(d);
    let n = 0;
    for (const t of Object.keys(this.TYPES)) n += d.crates.inventory[t] || 0;
    return n;
  },

  inventoryRemaining(d, type) {
    return Math.max(0, this.MAX_INVENTORY - this.count(d, type));
  },

  inventorySummary(d) {
    this.ensure(d);
    return Object.keys(this.TYPES).map(id => {
      const def = this.TYPES[id];
      const n = this.count(d, id);
      return { id, name: def.name, icon: def.icon, color: def.color, count: n, max: this.MAX_INVENTORY };
    });
  },

  dailyRemaining(d, type) {
    this.ensure(d);
    const def = this.TYPES[type];
    if (!def || !def.dailyCap) return Infinity;
    const used = d.crates.daily[type] || 0;
    return Math.max(0, def.dailyCap - used);
  },

  canGrantDaily(d, type) {
    return this.dailyRemaining(d, type) > 0;
  },

  grant(d, type, count = 1, opts = {}) {
    if (!this.isEnabled()) return { ok: false, reason: "disabled" };
    this.ensure(d);
    if (type === "shadow") type = "alpha";
    const def = this.TYPES[type];
    if (!def) return { ok: false, reason: "unknown" };
    const invRem = this.inventoryRemaining(d, type);
    let add = Math.min(count, invRem);
    if (!opts.skipDailyCap && def.dailyCap) {
      add = Math.min(add, this.dailyRemaining(d, type));
    }
    if (add <= 0) {
      return {
        ok: false,
        reason: invRem <= 0 ? "inventory_cap" : "daily_cap",
        type,
        cap: def.dailyCap,
        max: this.MAX_INVENTORY,
      };
    }
    d.crates.inventory[type] = (d.crates.inventory[type] || 0) + add;
    if (def.dailyCap && !opts.skipDailyCap) {
      d.crates.daily[type] = (d.crates.daily[type] || 0) + add;
    }
    return { ok: true, type, granted: add, total: d.crates.inventory[type] };
  },

  buyEventCrates(d, eventShopId, qty) {
    const ev = this.EVENT_SHOP.find(e => e.id === eventShopId);
    if (!ev) return { ok: false, reason: "unknown_event" };
    if (ev.comingSoon) return { ok: false, reason: "coming_soon" };
    const pack = (ev.packs || []).find(p => p.qty === qty);
    if (!pack) return { ok: false, reason: "invalid_pack" };
    const invRem = this.inventoryRemaining(d, ev.crateType);
    if (invRem <= 0) return { ok: false, reason: "inventory_cap", max: this.MAX_INVENTORY };
    const grantQty = Math.min(qty, invRem);
    if (grantQty < qty) {
      return { ok: false, reason: "inventory_cap", max: invRem, need: qty };
    }
    if ((d.credits || 0) < BH.ShopEconomy.price(pack.price, { season: ev.season || 1, data: d })) {
      const need = BH.ShopEconomy.price(pack.price, { season: ev.season || 1, data: d });
      return { ok: false, reason: "credits", need, have: d.credits || 0 };
    }
    const spent = BH.ShopEconomy.price(pack.price, { season: ev.season || 1, data: d });
    d.credits -= spent;
    const res = this.grant(d, ev.crateType, grantQty, { skipDailyCap: true });
    if (!res.ok) {
      d.credits += spent;
      return res;
    }
    return {
      ok: true,
      type: ev.crateType,
      granted: grantQty,
      total: res.total,
      spent: spent,
      qty: pack.qty,
    };
  },

  claimEventCrate(d, eventShopId) {
    return this.buyEventCrates(d, eventShopId, 1);
  },

  grantFromMatch(d) {
    if (!this.isEnabled()) return null;
    return this.grant(d, "front", 1);
  },

  isOwned(d, entry) {
    if (!entry || entry.kind === "credits" || entry.kind === "premiumTime") return false;
    if (entry.kind === "weapon") {
      return ((d.owned && d.owned.weapons) || []).includes(entry.id);
    }
    if (entry.kind === "operator") {
      return ((d.owned && d.owned.operators) || []).includes(entry.id);
    }
    const owned = d.owned || {};
    const map = {
      camo: "camos",
      crosshair: "crosshairs",
      color: "colors",
      spray: "sprays",
      emblem: "emblems",
      title: "titles",
      charm: "charms",
      callingCard: "callingCards",
    };
    const key = map[entry.kind];
    if (!key) return false;
    const list = owned[key] || [];
    if (entry.kind === "crosshair" && entry.id === "classic") return true;
    if (entry.kind === "color" && entry.id === "white") return true;
    return list.includes(entry.id);
  },

  _itemPrice(entry) {
    if (entry.kind === "credits") return entry.credits || 50;
    if (entry.kind === "weapon") {
      if (entry.rarity === "epic") return this.EPIC_WEAPON_DUP_VALUE;
      return this.LEGENDARY_WEAPON_DUP_VALUE;
    }
    if (entry.kind === "operator") {
      const op = this._resolveItem("operator", entry.id);
      return (op && op.price) || 1200;
    }
    const item = this._resolveItem(entry.kind, entry.id);
    return (item && item.price) || 200;
  },

  _displayEntry(entry) {
    if (entry.kind === "premiumTime") {
      const days = entry.days || 0;
      const icon = days >= 365 ? "👑" : days >= 80 ? "💎" : "⭐";
      return { icon, name: "Premium-Spielzeit · " + days + " Tage", exclusive: true, premium: true };
    }
    if (entry.kind === "credits") {
      return { icon: "⛁", name: entry.label || ("+" + entry.credits + " Credits"), exclusive: false };
    }
    if (entry.kind === "weapon") {
      const w = BH.WEAPONS && BH.WEAPONS[entry.id];
      const isLeg = entry.rarity === "legendary";
      return {
        icon: isLeg ? "⚡" : "🔫",
        name: w ? w.name : (entry.label || entry.id),
        exclusive: true,
        legendary: isLeg,
        epic: entry.rarity === "epic",
      };
    }
    if (entry.kind === "operator") {
      const op = this._resolveItem("operator", entry.id);
      return { icon: "🎖", name: op ? op.name : entry.id, exclusive: false };
    }
    const item = this._resolveItem(entry.kind, entry.id);
    if (!item) return { icon: "🎁", name: entry.label || entry.id, exclusive: !!entry.exclusive };
    const icons = {
      spray: item.icon || "🎨",
      emblem: item.icon || "🎖",
      camo: "🔫",
      crosshair: item.glyph || "✛",
      color: "🎨",
      title: "🏷",
      charm: item.icon || "📿",
      callingCard: item.icon || "🃏",
    };
    return {
      icon: icons[entry.kind] || "🎁",
      name: item.name || entry.label || entry.id,
      exclusive: !!entry.exclusive,
    };
  },

  _ownedKey(kind) {
    const map = {
      weapon: "weapons",
      operator: "operators",
      camo: "camos",
      crosshair: "crosshairs",
      color: "colors",
      spray: "sprays",
      emblem: "emblems",
      title: "titles",
      charm: "charms",
      callingCard: "callingCards",
    };
    return map[kind];
  },

  addReward(d, entry) {
    if (entry.kind === "premiumTime") {
      const days = entry.days || 0;
      if (BH.PremiumPlaytime) BH.PremiumPlaytime.grantDays(d, days);
      return { kind: "premiumTime", days, duplicate: false, stacked: true };
    }
    if (entry.kind === "credits") {
      d.credits = (d.credits || 0) + (entry.credits || 0);
      return { kind: "credits", credits: entry.credits, duplicate: false };
    }
    if (entry.kind === "weapon") {
      if (!d.owned) d.owned = {};
      if (!d.owned.weapons) d.owned.weapons = [];
      const isLeg = entry.rarity === "legendary";
      if (!d.owned.weapons.includes(entry.id)) {
        d.owned.weapons.push(entry.id);
        return { kind: "weapon", id: entry.id, duplicate: false, exclusive: true, legendary: isLeg, epic: !isLeg };
      }
      const dupBase = isLeg ? this.LEGENDARY_WEAPON_DUP_VALUE : this.EPIC_WEAPON_DUP_VALUE;
      const credits = Math.max(400, Math.round(dupBase * this.DUPLICATE_CREDIT_MULT));
      d.credits = (d.credits || 0) + credits;
      return { kind: "weapon", id: entry.id, duplicate: true, credits, exclusive: true, legendary: isLeg, epic: !isLeg };
    }
    if (entry.kind === "operator") {
      if (!d.owned) d.owned = {};
      if (!d.owned.operators) d.owned.operators = ["recruit"];
      if (!d.owned.operators.includes(entry.id)) {
        d.owned.operators.push(entry.id);
        return { kind: "operator", id: entry.id, duplicate: false };
      }
      const credits = Math.max(400, Math.round(this._itemPrice(entry) * this.DUPLICATE_CREDIT_MULT));
      d.credits = (d.credits || 0) + credits;
      return { kind: "operator", id: entry.id, duplicate: true, credits };
    }
    const key = this._ownedKey(entry.kind);
    if (!key) return null;
    if (!d.owned) d.owned = {};
    if (!d.owned[key]) d.owned[key] = [];
    if (!d.owned[key].includes(entry.id)) {
      d.owned[key].push(entry.id);
      return { kind: entry.kind, id: entry.id, duplicate: false, exclusive: !!entry.exclusive };
    }
    const price = this._itemPrice(entry);
    const credits = Math.max(25, Math.round(price * this.DUPLICATE_CREDIT_MULT));
    d.credits = (d.credits || 0) + credits;
    return { kind: entry.kind, id: entry.id, duplicate: true, credits, exclusive: !!entry.exclusive };
  },

  _rollRarity(pityCount) {
    if (pityCount >= this.PITY_RARE - 1) return "rare";
    const entries = Object.entries(this.RARITY);
    const total = entries.reduce((s, [, r]) => s + r.weight, 0);
    let roll = Math.random() * total;
    for (const [id, r] of entries) {
      roll -= r.weight;
      if (roll <= 0) return id;
    }
    return "common";
  },

  _pickFromPool(pool, rarity, d) {
    let candidates = pool.filter(e => e.rarity === rarity);
    if (!candidates.length) {
      const order = ["legendary", "epic", "rare", "uncommon", "common"];
      const idx = order.indexOf(rarity);
      for (let i = idx + 1; i < order.length; i++) {
        candidates = pool.filter(e => e.rarity === order[i]);
        if (candidates.length) break;
      }
    }
    if (!candidates.length) {
      return { kind: "credits", id: "credits_50", rarity: "common", label: "+50 ⛁", credits: 50 };
    }
    const unowned = candidates.filter(e => e.kind === "credits" || !this.isOwned(d, e));
    const pickFrom = unowned.length ? unowned : candidates;
    return pickFrom[Math.floor(Math.random() * pickFrom.length)];
  },

  _executeOpen(d, type) {
    if (!this.isEnabled()) return { ok: false, reason: "disabled" };
    if (type === "shadow") type = "alpha";
    this.ensure(d);
    if ((d.crates.inventory[type] || 0) < 1) return { ok: false, reason: "empty" };
    if (!this.poolReady(type)) return { ok: false, reason: "pool_empty" };

    const pool = this.getPool(type, d);
    const pityKey = type + "Rare";
    const pityBefore = d.crates.pity[pityKey] || 0;
    const legPityKey = type + "Legendary";
    const legPityBefore = d.crates.pity[legPityKey] || 0;
    let rarity;
    let entry;
    let pityLegendaryHit = false;

    if (this.usesWeightedPool(type)) {
      const legWeapons = this._legendaryWeaponPool(pool);
      const forceLeg = legPityBefore >= this.PITY_LEGENDARY - 1 && legWeapons.length;
      if (forceLeg) {
        entry = this._pickLegendaryWeapon(legWeapons, d);
        if (entry) {
          pityLegendaryHit = true;
          rarity = "legendary";
        } else {
          entry = this._pickWeighted(pool, d);
          rarity = entry.rarity || "rare";
        }
      } else {
        entry = this._pickWeighted(pool, d);
        rarity = entry.rarity || "rare";
      }
    } else {
      rarity = this._rollRarity(pityBefore);
      entry = this._pickFromPool(pool, rarity, d);
    }

    const display = this._displayEntry(entry);
    d.crates.inventory[type]--;
    const applied = this.addReward(d, entry);

    const isRarePlus = rarity === "rare" || rarity === "epic" || rarity === "legendary";
    if (!this.usesWeightedPool(type)) {
      if (isRarePlus) d.crates.pity[pityKey] = 0;
      else d.crates.pity[pityKey] = pityBefore + 1;
    } else {
      if (pityLegendaryHit) d.crates.pity[legPityKey] = 0;
      else d.crates.pity[legPityKey] = legPityBefore + 1;
      if (entry.kind === "premiumTime" && entry.days >= 30) {
        d.crates.pity[pityKey] = 0;
      } else if (!isRarePlus) {
        d.crates.pity[pityKey] = pityBefore + 1;
      }
    }

    d.crates.openedTotal++;
    const hist = {
      type,
      at: Date.now(),
      rarity,
      label: display.name,
      duplicate: applied && applied.duplicate,
      exclusive: !!display.exclusive,
      premium: !!display.premium,
    };
    d.crates.history.unshift(hist);
    if (d.crates.history.length > 20) d.crates.history.length = 20;

    return {
      ok: true,
      type,
      entry,
      rarity,
      display,
      applied,
      pityRemaining: Math.max(0, this.PITY_RARE - (d.crates.pity[pityKey] || 0)),
      legendaryPity: this.legendaryPityProgress(d, type),
      pityLegendaryHit,
      inventoryLeft: d.crates.inventory[type] || 0,
    };
  },

  open(d, type, opts = {}) {
    const res = this._executeOpen(d, type);
    if (res.ok && !opts.skipSave) BH.Progress.save();
    return res;
  },

  openAll(d, type) {
    if (!this.isEnabled()) return { ok: false, reason: "disabled" };
    if (type === "shadow") type = "alpha";
    this.ensure(d);
    const n = this.count(d, type);
    if (n < 1) return { ok: false, reason: "empty" };

    const results = [];
    let totalCredits = 0;
    let totalPremiumDays = 0;
    const itemCounts = {};

    for (let i = 0; i < n; i++) {
      const res = this._executeOpen(d, type);
      if (!res.ok) break;
      results.push(res);
      if (res.applied) {
        if (res.applied.duplicate && res.applied.credits) totalCredits += res.applied.credits;
        if (res.applied.kind === "premiumTime") totalPremiumDays += res.applied.days || 0;
        if (res.applied.kind === "credits") totalCredits += res.applied.credits || 0;
      }
      const key = res.display.name;
      itemCounts[key] = (itemCounts[key] || 0) + 1;
    }

    if (results.length) BH.Progress.save();

    return {
      ok: results.length > 0,
      type,
      opened: results.length,
      results,
      totalCredits,
      totalPremiumDays,
      itemCounts,
      inventoryLeft: this.count(d, type),
    };
  },

  previewTable(type, d) {
    if (!this.poolReady(type)) {
      return [{
        id: "soon",
        label: "Inhalte folgen",
        css: "crate-r-common",
        chance: 0,
        items: [{
          kind: "placeholder",
          icon: "⏳",
          name: "Drop-Pool wird bald befüllt",
          itemChance: 0,
          owned: false,
          exclusive: false,
        }],
      }];
    }
    if (type === "alpha") return this.previewAlphaByRarity(d);
    if (this.usesWeightedPool(type)) return this._previewWeightedTable(type, d);
    const pool = this.getPool(type, d);
    const totalWeight = Object.values(this.RARITY).reduce((s, r) => s + r.weight, 0);
    const byRarity = {};
    for (const r of Object.keys(this.RARITY)) byRarity[r] = [];

    for (const entry of pool) {
      const disp = this._displayEntry(entry);
      const rCount = pool.filter(e => e.rarity === entry.rarity).length || 1;
      const rarityPct = (this.RARITY[entry.rarity].weight / totalWeight) * 100;
      const itemPct = Math.round(rarityPct / rCount * 10) / 10;
      byRarity[entry.rarity].push({
        ...entry,
        icon: disp.icon,
        name: disp.name,
        owned: this.isOwned(d, entry),
        itemChance: itemPct,
        exclusive: !!entry.exclusive || !!disp.exclusive,
      });
    }

    return Object.entries(this.RARITY).map(([id, meta]) => ({
      id,
      label: meta.label,
      css: meta.css,
      chance: Math.round(meta.weight / totalWeight * 1000) / 10,
      items: byRarity[id] || [],
    }));
  },

  _previewWeightedTable(type, d) {
    const pool = this.getPool(type, d);
    const totalW = this._poolTotalWeight(pool);
    const def = this.typeDef(type);
    const creditItems = [];
    const premiumItems = [];
    const cosmeticItems = [];
    const legendaryItems = [];
    const tagged = {};
    let credW = 0;
    let premW = 0;
    let cosW = 0;
    let legW = 0;

    const pushTagged = (tag, row, w) => {
      if (!tagged[tag]) tagged[tag] = { items: [], weight: 0 };
      tagged[tag].items.push(row);
      tagged[tag].weight += w;
    };

    for (const entry of pool) {
      const disp = this._displayEntry(entry);
      const w = entry.weight || 1;
      const pct = Math.round(w / totalW * 10000) / 100;
      const row = {
        ...entry,
        icon: disp.icon,
        name: disp.name,
        owned: entry.kind === "credits" || entry.kind === "premiumTime"
          ? false
          : this.isOwned(d, entry),
        itemChance: pct,
        exclusive: !!entry.exclusive || entry.kind === "premiumTime" || entry.kind === "weapon",
        premium: entry.kind === "premiumTime",
        legendary: entry.rarity === "legendary",
      };
      if (entry.kind === "credits") {
        creditItems.push(row);
        credW += w;
      } else if (entry.kind === "premiumTime") {
        premiumItems.push(row);
        premW += w;
      } else if (entry.kind === "weapon" && entry.rarity === "legendary") {
        legendaryItems.push(row);
        legW += w;
      } else if (type === "alpha" && entry.poolTag) {
        pushTagged(entry.poolTag, row, w);
      } else {
        cosmeticItems.push(row);
        cosW += w;
      }
    }

    const alphaTagLabels = {
      weapons: { label: "Epic-Waffen · Alpha", css: "crate-r-epic" },
      clan: { label: "Clan-Exklusiv", css: "crate-r-rare" },
      operator: { label: "Operatoren", css: "crate-r-uncommon" },
      shop: { label: "Shop-Kosmetik", css: "crate-r-common" },
      meta: { label: "Meta & Fraktion", css: "crate-r-uncommon" },
    };

    const cosmeticLabel = type === "horizon"
      ? "HORIZONT Exklusiv (+0,01 % vs. Credits)"
      : type === "beta"
        ? "BETA Exklusiv (+0,01 % vs. Credits)"
      : type === "alpha"
        ? "Alpha-Kosmetik"
        : "Exklusiv";

    const rows = [];
    if (creditItems.length) {
      rows.push({
        id: "credits",
        label: "Credits",
        css: "crate-r-common",
        chance: Math.round(credW / totalW * 1000) / 10,
        items: creditItems.sort((a, b) => b.itemChance - a.itemChance),
      });
    }
    if (premiumItems.length) {
      rows.push({
        id: "premium",
        label: "Premium-Spielzeit · Epic",
        css: "crate-r-epic",
        chance: Math.round(premW / totalW * 1000) / 10,
        items: premiumItems.sort((a, b) => b.itemChance - a.itemChance),
      });
    }
    if (type === "alpha") {
      for (const tag of ["weapons", "clan", "operator", "shop", "meta"]) {
        const bucket = tagged[tag];
        if (!bucket || !bucket.items.length) continue;
        const meta = alphaTagLabels[tag] || { label: tag, css: "crate-r-common" };
        rows.push({
          id: tag,
          label: meta.label,
          css: meta.css,
          chance: Math.round(bucket.weight / totalW * 1000) / 10,
          items: bucket.items.sort((a, b) => b.itemChance - a.itemChance),
        });
      }
    } else if (cosmeticItems.length) {
      rows.push({
        id: "cosmetic",
        label: cosmeticLabel,
        css: "crate-r-rare",
        chance: Math.round(cosW / totalW * 1000) / 10,
        items: cosmeticItems.sort((a, b) => b.itemChance - a.itemChance),
      });
    }
    if (legendaryItems.length) {
      rows.push({
        id: "legendary",
        label: "Legendary · Fantasiewaffen",
        css: "crate-r-legendary",
        chance: Math.round(legW / totalW * 10000) / 100,
        items: legendaryItems.sort((a, b) => b.itemChance - a.itemChance),
      });
    }
    return rows;
  },

  /** Alpha-Kiste: Drop-Pool nur nach Seltenheit (gewichtete Einzelchancen). */
  previewAlphaByRarity(d) {
    const pool = this.getPool("alpha", d);
    if (!pool.length) return [];
    const totalW = this._poolTotalWeight(pool);
    const byRarity = {};
    for (const id of Object.keys(this.RARITY)) byRarity[id] = { weight: 0, items: [] };

    for (const entry of pool) {
      const r = entry.rarity || "common";
      const w = entry.weight || 1;
      const disp = this._displayEntry(entry);
      if (!byRarity[r]) byRarity[r] = { weight: 0, items: [] };
      byRarity[r].weight += w;
      byRarity[r].items.push({
        icon: disp.icon,
        name: disp.name,
        itemChance: totalW > 0 ? (w / totalW) * 100 : 0,
        owned: entry.kind === "credits" || entry.kind === "premiumTime"
          ? false
          : this.isOwned(d, entry),
        exclusive: !!entry.exclusive || entry.kind === "weapon" || entry.kind === "premiumTime",
        premium: entry.kind === "premiumTime",
        legendary: entry.rarity === "legendary",
        epicWeapon: entry.kind === "weapon" && entry.rarity === "epic",
      });
    }

    const order = ["legendary", "epic", "rare", "uncommon", "common"];
    return order.map(id => {
      const bucket = byRarity[id];
      if (!bucket || !bucket.items.length) return null;
      const meta = this.RARITY[id] || { label: id, css: "crate-r-common" };
      return {
        id,
        label: meta.label,
        css: meta.css,
        chance: totalW > 0 ? (bucket.weight / totalW) * 100 : 0,
        items: bucket.items.sort((a, b) => b.itemChance - a.itemChance),
      };
    }).filter(Boolean);
  },

  rarityChips(type) {
    const totalWeight = Object.values(this.RARITY).reduce((s, r) => s + r.weight, 0);
    return Object.entries(this.RARITY).map(([id, meta]) => ({
      id,
      label: meta.label,
      css: meta.css,
      chance: Math.round(meta.weight / totalWeight * 1000) / 10,
    }));
  },

  _fmtPct(value, digits) {
    const d = typeof digits === "number" ? digits : 2;
    if (value > 0 && value < 0.01) return "< 0,01 %";
    return value.toLocaleString("de-DE", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }) + " %";
  },

  typeDef(type) {
    return this.TYPES[type] || null;
  },

  registerExclusive() {
    for (const crateType of Object.keys(this.EXCLUSIVE)) {
      const ex = this.EXCLUSIVE[crateType];
      if (BH.CAMOS) {
        for (const c of ex.camos || []) {
          if (!BH.CAMOS.some(x => x.id === c.id)) {
            BH.CAMOS.push({ id: c.id, name: c.name, color: c.color, eventOnly: true, price: c.price });
          }
        }
      }
      if (BH.EMBLEMS) {
        for (const e of ex.emblems || []) {
          if (!BH.EMBLEMS.some(x => x.id === e.id)) {
            BH.EMBLEMS.push({ id: e.id, name: e.name, icon: e.icon, eventOnly: true, price: e.price });
          }
        }
      }
      if (BH.TITLES) {
        for (const t of ex.titles || []) {
          if (!BH.TITLES.some(x => x.id === t.id)) {
            BH.TITLES.push({ id: t.id, name: t.name, eventOnly: true, price: t.price });
          }
        }
      }
      if (BH.CallingCards && BH.CallingCards.list) {
        for (const c of ex.callingCards || []) {
          if (!BH.CallingCards.list.some(x => x.id === c.id)) {
            BH.CallingCards.list.push({
              id: c.id, name: c.name, icon: c.icon, style: c.style || "cc-shadow", eventOnly: true,
            });
          }
        }
      }
    }
  },
};

(function registerPlaceholderCrates() {
  const list = [
    { id: "vault", name: "TRESOR", crateName: "TRESOR-KISTE", icon: "🔒", color: "#eab308", badge: "BALD · TRESOR", price: 420 },
    { id: "omega", name: "OMEGA", crateName: "OMEGA-KISTE", icon: "⚛️", color: "#22d3ee", badge: "BALD · OMEGA", price: 400 },
    { id: "sigma", name: "SIGMA", crateName: "SIGMA-KISTE", icon: "◆", color: "#a78bfa", badge: "BALD · SIGMA", price: 390 },
    { id: "phantom", name: "PHANTOM", crateName: "PHANTOM-KISTE", icon: "👻", color: "#64748b", badge: "BALD · PHANTOM", price: 410 },
    { id: "void", name: "VOID", crateName: "VOID-KISTE", icon: "🕳️", color: "#312e81", badge: "BALD · VOID", price: 400 },
    { id: "storm", name: "STURM", crateName: "STURM-KISTE", icon: "⛈️", color: "#94a3b8", badge: "BALD · STURM", price: 395 },
    { id: "prism", name: "PRISM", crateName: "PRISM-KISTE", icon: "🔮", color: "#e879f9", badge: "BALD · PRISM", price: 405 },
    { id: "cipher", name: "CIPHER", crateName: "CIPHER-KISTE", icon: "🔐", color: "#14b8a6", badge: "BALD · CIPHER", price: 415 },
  ];
  for (const p of list) {
    BH.Crates.TYPES[p.id] = {
      id: p.id,
      name: p.crateName,
      icon: p.icon,
      color: p.color,
      dailyCap: null,
      desc: "Drop-Pool folgt — Inhalt wird noch befüllt.",
      source: "event",
      eventId: p.id + "_event",
      poolReady: false,
    };
    BH.Crates.EVENT_SHOP.push({
      id: p.id + "_event",
      crateType: p.id,
      name: p.name,
      badge: p.badge,
      icon: p.icon,
      comingSoon: true,
      desc: "Kiste ohne Inhalt — Drop-Pool wird bald befüllt. Max. 200 Kisten.",
      packs: [
        { qty: 1, price: p.price },
        { qty: 5, price: Math.round(p.price * 4.65) },
        { qty: 25, price: Math.round(p.price * 21) },
      ],
    });
  }
})();

BH.PremiumPlaytime = {
  MS_DAY: 86400000,
  XP_MULT: 1.15,
  CREDITS_MULT: 1.1,

  ensure(d) {
    if (!d.premiumPlaytime) d.premiumPlaytime = { until: 0 };
    if (typeof d.premiumPlaytime.until !== "number") d.premiumPlaytime.until = 0;
  },

  isActive(d) {
    this.ensure(d);
    return d.premiumPlaytime.until > Date.now();
  },

  remainingMs(d) {
    this.ensure(d);
    return Math.max(0, d.premiumPlaytime.until - Date.now());
  },

  grantDays(d, days) {
    this.ensure(d);
    const now = Date.now();
    const base = d.premiumPlaytime.until > now ? d.premiumPlaytime.until : now;
    d.premiumPlaytime.until = base + (days || 0) * this.MS_DAY;
    return d.premiumPlaytime.until;
  },

  formatRemaining(d) {
    const ms = this.remainingMs(d);
    if (ms <= 0) return "";
    const days = Math.floor(ms / this.MS_DAY);
    const hours = Math.floor((ms % this.MS_DAY) / 3600000);
    if (days >= 1) return days + "T " + hours + "Std";
    const mins = Math.floor((ms % 3600000) / 60000);
    return hours + "Std " + mins + "Min";
  },

  statusLabel(d) {
    if (!this.isActive(d)) return "";
    return "⭐ Premium · " + this.formatRemaining(d);
  },

  benefitSummary() {
    const xpPct = Math.round((this.XP_MULT - 1) * 100);
    const credPct = Math.round((this.CREDITS_MULT - 1) * 100);
    return "+" + xpPct + "% Match-XP · +" + credPct + "% Credits";
  },

  xpMult(d) {
    return this.isActive(d) ? this.XP_MULT : 1;
  },

  creditsMult(d) {
    return this.isActive(d) ? this.CREDITS_MULT : 1;
  },

  buyPack(d, packId) {
    const pack = (BH.SHOP && BH.SHOP.premiumDays || []).find(p => p.id === packId);
    if (!pack || !d) return { ok: false, reason: "missing" };
    const price = BH.ShopEconomy ? BH.ShopEconomy.price(pack.price, { data: d }) : pack.price;
    if ((d.credits || 0) < price) {
      return { ok: false, reason: "credits", need: price, have: d.credits || 0 };
    }
    d.credits -= price;
    this.grantDays(d, pack.days);
    return { ok: true, days: pack.days, spent: price, until: d.premiumPlaytime.until };
  },
};
