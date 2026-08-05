/* Erweiterungen: Presets, Deals, Verträge, LTM, Fraktionskrieg, Leaderboard, Kosmetik */
window.BH = window.BH || {};

BH.LoadoutPresets = {
  slots: 3,
  defaultLoadout() {
    return {
      weaponId: "ar",
      attachments: { optic: "none", barrel: "none", grip: "none", mag: "none" },
      secondaryWeaponId: "pistol",
      secondaryAttachments: { optic: "none", barrel: "none", grip: "none", mag: "none" },
      camo: "black",
      equipmentId: "frag",
      charm: "none",
    };
  },
  normalizeLoadout(lo) {
    const base = this.defaultLoadout();
    if (!lo) return JSON.parse(JSON.stringify(base));
    if (!lo.attachments) lo.attachments = { ...base.attachments };
    if (!lo.secondaryWeaponId) lo.secondaryWeaponId = base.secondaryWeaponId;
    if (!lo.secondaryAttachments) lo.secondaryAttachments = { ...base.secondaryAttachments };
    if (!lo.camo) lo.camo = base.camo;
    if (!lo.equipmentId) lo.equipmentId = base.equipmentId;
    const d = BH.Progress && BH.Progress.data;
    if (d && BH.Mastery) BH.Mastery.sanitizeLoadout(d, lo);
    return lo;
  },
  ensure(d) {
    const base = this.defaultLoadout();
    if (!d.loadout) d.loadout = JSON.parse(JSON.stringify(base));
    this.normalizeLoadout(d.loadout);
    if (!d.loadoutPresets) {
      d.loadoutPresets = [0, 1, 2].map(() => JSON.parse(JSON.stringify(d.loadout)));
    } else {
      for (let i = 0; i < d.loadoutPresets.length; i++) {
        this.normalizeLoadout(d.loadoutPresets[i]);
      }
    }
    if (typeof d.activePreset !== "number") d.activePreset = 0;
    if (!d.charm) d.charm = "none";
    if (!d.callingCard) d.callingCard = "default";
    if (d.operatorVoice !== false) d.operatorVoice = true;
  },
  getActive(d) {
    this.ensure(d);
    return d.loadoutPresets[d.activePreset] || d.loadout;
  },
  activate(slot) {
    const d = BH.Progress.data;
    this.ensure(d);
    d.activePreset = slot;
    d.loadout = JSON.parse(JSON.stringify(d.loadoutPresets[slot]));
    BH.Progress.save();
    return d.loadout;
  },
  saveCurrent(slot) {
    const d = BH.Progress.data;
    this.ensure(d);
    d.loadoutPresets[slot] = JSON.parse(JSON.stringify(d.loadout));
    d.activePreset = slot;
    BH.Progress.save();
  },
};

BH.DailyDeal = {
  _dayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
  },
  _catalog() {
    const items = [];
    const bpOnly = (cat, id) => BH.BattlePass && BH.BattlePass.isShopExclusive(cat, id);
    for (const c of BH.SHOP.camos) {
      if (!bpOnly("camo", c.id)) items.push({ cat: "camo", id: c.id, name: c.name, price: c.price, preview: `#${c.color.toString(16).padStart(6, "0")}` });
    }
    for (const c of BH.SHOP.crosshairs) {
      if (c.price > 0 && !bpOnly("crosshair", c.id)) items.push({ cat: "crosshair", id: c.id, name: c.name, price: c.price, preview: c.glyph });
    }
    for (const s of BH.SHOP.sprays || []) {
      if (!bpOnly("spray", s.id)) items.push({ cat: "spray", id: s.id, name: s.name, price: s.price, preview: s.icon });
    }
    for (const c of BH.SHOP.charms || []) {
      if (!bpOnly("charm", c.id)) items.push({ cat: "charm", id: c.id, name: c.name, price: c.price, preview: c.icon });
    }
    for (const c of BH.SHOP.callingCards || []) {
      if (!bpOnly("card", c.id)) items.push({ cat: "card", id: c.id, name: c.name, price: c.price, preview: c.icon });
    }
    return items;
  },
  ensure(d) {
    if (!d.dailyDeal) d.dailyDeal = { dayKey: "", cat: "", id: "", discount: 0.3 };
    const day = this._dayKey();
    if (d.dailyDeal.dayKey !== day) {
      const pool = this._catalog();
      const pick = pool[Math.floor(Math.random() * pool.length)] || pool[0];
      d.dailyDeal = { dayKey: day, ...pick, discount: 0.3 };
      BH.Progress.save();
    } else if (BH.BattlePass && d.dailyDeal.id && BH.BattlePass.isShopExclusive(d.dailyDeal.cat, d.dailyDeal.id)) {
      const pool = this._catalog();
      const pick = pool[Math.floor(Math.random() * pool.length)] || pool[0];
      d.dailyDeal = { dayKey: day, ...pick, discount: d.dailyDeal.discount || 0.3 };
      BH.Progress.save();
    }
  },
  current(d) {
    this.ensure(d);
    return d.dailyDeal;
  },
  dealPrice(deal) {
    const base = BH.ShopEconomy ? BH.ShopEconomy.price(deal.price) : deal.price;
    return Math.max(1, Math.round(base * (1 - deal.discount)));
  },
  isOwned(d, deal) {
    const o = d.owned;
    if (deal.cat === "camo") return o.camos.includes(deal.id);
    if (deal.cat === "crosshair") return o.crosshairs.includes(deal.id);
    if (deal.cat === "spray") return (o.sprays || []).includes(deal.id);
    if (deal.cat === "charm") return (o.charms || []).includes(deal.id);
    if (deal.cat === "card") return (o.callingCards || []).includes(deal.id);
    return false;
  },
  buy(d) {
    const deal = this.current(d);
    if (BH.BattlePass && BH.BattlePass.isShopExclusive(deal.cat, deal.id)) return { ok: false, reason: "battlepass" };
    if (this.isOwned(d, deal)) return { ok: false, reason: "owned" };
    const price = this.dealPrice(deal);
    if (d.credits < price) return { ok: false, reason: "credits" };
    d.credits -= price;
    const o = d.owned;
    if (deal.cat === "camo" && !o.camos.includes(deal.id)) o.camos.push(deal.id);
    else if (deal.cat === "crosshair" && !o.crosshairs.includes(deal.id)) o.crosshairs.push(deal.id);
    else if (deal.cat === "spray" && !(o.sprays || []).includes(deal.id)) { if (!o.sprays) o.sprays = []; o.sprays.push(deal.id); }
    else if (deal.cat === "charm" && !(o.charms || []).includes(deal.id)) { if (!o.charms) o.charms = []; o.charms.push(deal.id); d.charm = deal.id; }
    else if (deal.cat === "card" && !(o.callingCards || []).includes(deal.id)) { if (!o.callingCards) o.callingCards = []; o.callingCards.push(deal.id); d.callingCard = deal.id; }
    BH.Progress.save();
    return { ok: true, deal, price };
  },
};

BH.WeeklyShop = {
  ITEM_COUNT: 4,
  DISCOUNT: 0.15,

  _weekKey() {
    const d = new Date();
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return d.getFullYear() + "-W" + week;
  },

  _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
    return Math.abs(h);
  },

  _pickItems(weekKey) {
    const pool = BH.DailyDeal._catalog();
    const out = [];
    const used = new Set();
    for (let i = 0; i < this.ITEM_COUNT; i++) {
      const h = this._hash(weekKey + "ws" + i);
      let pick = pool[h % pool.length];
      let guard = 0;
      while (used.has(pick.cat + pick.id) && guard++ < 40) {
        pick = pool[(h + guard) % pool.length];
      }
      used.add(pick.cat + pick.id);
      out.push({ ...pick, discount: this.DISCOUNT });
    }
    return out;
  },

  ensure(d) {
    const wk = this._weekKey();
    if (!d.weeklyShop) d.weeklyShop = { weekKey: "", items: [] };
    if (d.weeklyShop.weekKey !== wk) {
      d.weeklyShop = { weekKey: wk, items: this._pickItems(wk) };
      BH.Progress.save();
    }
  },

  items(d) {
    this.ensure(d);
    return d.weeklyShop.items || [];
  },

  price(item) {
    const base = BH.ShopEconomy ? BH.ShopEconomy.price(item.price) : item.price;
    return Math.max(1, Math.round(base * (1 - (item.discount || this.DISCOUNT))));
  },

  isOwned(d, item) {
    return BH.DailyDeal.isOwned(d, item);
  },

  buy(d, item) {
    if (BH.BattlePass && BH.BattlePass.isShopExclusive(item.cat, item.id)) return { ok: false, reason: "battlepass" };
    if (this.isOwned(d, item)) return { ok: false, reason: "owned" };
    const price = this.price(item);
    if (d.credits < price) return { ok: false, reason: "credits" };
    d.credits -= price;
    const o = d.owned;
    if (item.cat === "camo" && !o.camos.includes(item.id)) o.camos.push(item.id);
    else if (item.cat === "crosshair" && !o.crosshairs.includes(item.id)) o.crosshairs.push(item.id);
    else if (item.cat === "spray") { if (!o.sprays) o.sprays = []; if (!o.sprays.includes(item.id)) o.sprays.push(item.id); }
    else if (item.cat === "charm") { if (!o.charms) o.charms = []; if (!o.charms.includes(item.id)) o.charms.push(item.id); o.charm = item.id; }
    else if (item.cat === "card") { if (!o.callingCards) o.callingCards = []; if (!o.callingCards.includes(item.id)) o.callingCards.push(item.id); d.callingCard = item.id; }
    BH.Progress.save();
    return { ok: true, item, price };
  },
};

BH.Contracts = {
  pool: [
    { id: "smg20", label: "20 Kills mit SMG", weaponType: "MASCHINENPISTOLE", target: 20, reward: 400, camo: "toxin" },
    { id: "ar30", label: "30 Kills mit Sturmgewehr", weaponType: "STURMGEWEHR", target: 30, reward: 450, camo: "blutmond" },
    { id: "sniper10", label: "10 Sniper-Kills", weaponType: "PRÄZISIONSGEWEHR", target: 10, reward: 500, camo: "mitternacht" },
    { id: "head15", label: "15 Kopftreffer", field: "headshots", target: 15, reward: 350 },
    { id: "lmg25", label: "25 Kills mit LMG", weaponType: "LMG", target: 25, reward: 480, camo: "vulkan" },
  ],
  ensure(d) {
    if (!d.contracts) d.contracts = { active: null, prog: 0, done: [] };
    if (!d.contracts.active) {
      const open = this.pool.filter(c => !d.contracts.done.includes(c.id));
      d.contracts.active = (open[Math.floor(Math.random() * open.length)] || this.pool[0]).id;
      d.contracts.prog = 0;
    }
  },
  active(d) {
    this.ensure(d);
    return this.pool.find(c => c.id === d.contracts.active);
  },
  track(d, matchStats) {
    this.ensure(d);
    const c = this.active(d);
    if (!c || d.contracts.done.includes(c.id)) return 0;
    let add = 0;
    if (c.field === "headshots") add = matchStats.headshots || 0;
    else if (c.weaponType) add = matchStats.weaponKills && matchStats.weaponKills[c.weaponType] ? matchStats.weaponKills[c.weaponType] : 0;
    d.contracts.prog += add;
    if (d.contracts.prog >= c.target) {
      d.contracts.done.push(c.id);
      d.credits += c.reward;
      if (c.camo && !d.owned.camos.includes(c.camo)) d.owned.camos.push(c.camo);
      d.contracts.active = null;
      d.contracts.prog = 0;
      this.ensure(d);
      BH.Progress.save();
      return c.reward;
    }
    BH.Progress.save();
    return 0;
  },
};

BH.Leaderboard = {
  KEY: "bh_leaderboard_v1",
  load() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || { entries: [] }; } catch (e) { return { entries: [] }; }
  },
  save(data) { try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch (e) {} },
  submit(name, stats) {
    const lb = this.load();
    lb.entries.push({
      name, mode: stats.mode || "?", kills: stats.kills || 0, deaths: stats.deaths || 0,
      kd: stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills,
      round: stats.zombieRound || 0, date: Date.now(),
    });
    lb.entries.sort((a, b) => b.kd - a.kd || b.kills - a.kills);
    lb.entries = lb.entries.slice(0, 50);
    this.save(lb);
    return lb.entries.slice(0, 10);
  },
  top(n) { return this.load().entries.slice(0, n || 10); },
};

BH.LTM = {
  modes: [
    { id: "gungame", name: "GUN GAME", bonus: 1.25 },
    { id: "hardcore", name: "HARDCORE TDM", bonus: 1.2 },
    { id: "killconfirmed", name: "KILL CONFIRMED", bonus: 1.15 },
    { id: "infected", name: "INFIZIERT", bonus: 1.2 },
    { id: "ffa", name: "FREI-FÜR-ALLE", bonus: 1.1 },
  ],
  _weekKey() {
    return BH.FactionWar ? BH.FactionWar._weekKey() : "1970-W1";
  },
  current() {
    const wk = this._weekKey();
    let hash = 0;
    for (let i = 0; i < wk.length; i++) hash = ((hash << 5) - hash) + wk.charCodeAt(i);
    return this.modes[Math.abs(hash) % this.modes.length];
  },
  isActive(modeId) { return this.current().id === modeId; },
  xpMult(modeId) { return this.isActive(modeId) ? this.current().bonus : 1; },
};

/** Hinweis: Roadmap-Fehler (Startmenü-Button) — active: false zum Ausblenden & Freischalten */
BH.RoadmapNotice = {
  active: true,
  disabled: true,
  title: "ACHTUNG · ROADMAP",
  overlayTitle: "ROADMAP VORÜBERGEHEND GESPERRT",
  message: "Die Roadmap weist derzeit Fehler auf.",
  detail: "Wir arbeiten so schnell wie möglich daran, diese zu beheben. Der Inhalt ist vorübergehend ausgeblendet.",
  buttonText: "Roadmap — Fehler werden derzeit behoben",
  isDisabled() {
    return !!(this.active && this.disabled);
  },
};

/** Spielmodi in Entwicklung — Menü zeigt Coming Soon */
BH.ComingSoonModes = {
  modes: ["hardpoint", "ctf", "escort"],
  defs: {
    hardpoint: {
      label: "HARDPOINT",
      message: "Halte den rotierenden Punkt — Punkte pro Sekunde. Modus wird derzeit entwickelt.",
      hint: "Hardpoint, Flaggenraub & Eskorte folgen in einem kommenden Update.",
    },
    ctf: {
      label: "FLAGGENRAUB",
      message: "Stiehle die gegnerische Flagge und sichere sie in deiner Basis.",
      hint: "3D-Flaggen, Bot-KI und Karten-Layouts werden vorbereitet.",
    },
    escort: {
      label: "ESKORTE",
      message: "Schiebe die Fracht zum Ziel — Angreifer vs. Verteidiger.",
      hint: "Payload-Route, Checkpoints und Team-Rollen folgen bald.",
    },
  },
  isComingSoon(modeId) {
    return this.modes.includes(modeId);
  },
  def(modeId) {
    return this.defs[modeId] || null;
  },
};

/** Temporäre Modus-Wartung — mehrere parallele Fenster möglich */
BH.ModeMaintenance = {
  windows: [
    {
      modes: ["frontwar", "conquest", "ranked"],
      devblogId: "maintenance-jun2026",
      labels: {
        frontwar: "FRONTKRIEG",
        conquest: "EROBERUNG",
        ranked: "RANKED",
      },
      message: "Dort finden gerade Wartungsarbeiten statt.",
      startsAt: Date.parse("2026-06-12T00:00:00"),
      endsAt: Date.parse("2026-06-16T00:00:00"),
    },
    {
      modes: ["snd"],
      devblogId: "maintenance-snd-2026",
      labels: { snd: "SUCHEN & ZERSTÖREN" },
      message: "Bomben-Modus wird überarbeitet — KI, Spawns und Rundenablauf.",
      startsAt: Date.parse("2026-06-13T00:00:00"),
      endsAt: Date.parse("2026-07-08T00:00:00"),
    },
  ],

  _isWindowActive(win) {
    const now = Date.now();
    return now >= win.startsAt && now < win.endsAt;
  },

  activeWindows() {
    return this.windows.filter(w => this._isWindowActive(w));
  },

  isWindowActive() {
    return this.activeWindows().length > 0;
  },

  windowForMode(modeId) {
    return this.activeWindows().find(w => w.modes.includes(modeId)) || null;
  },

  windowForDevblog(devblogId) {
    return this.activeWindows().find(w => w.devblogId === devblogId) || null;
  },

  isDevblogActive(devblogId) {
    return !!this.windowForDevblog(devblogId);
  },

  isActive(modeId) {
    return !!this.windowForMode(modeId);
  },

  activeModes() {
    const out = [];
    for (const w of this.activeWindows()) out.push(...w.modes);
    return out;
  },

  remainingMs(win) {
    if (!win || !this._isWindowActive(win)) return 0;
    return Math.max(0, win.endsAt - Date.now());
  },

  formatRemaining(ms) {
    ms = ms != null ? ms : Math.max(...this.activeWindows().map(w => this.remainingMs(w)), 0);
    if (ms <= 0) return "bald wieder verfügbar";
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    if (days >= 1) return `Noch ${days} Tag${days > 1 ? "e" : ""}`;
    if (hours >= 1) return `Noch ${hours} Stunde${hours > 1 ? "n" : ""}`;
    return "Noch weniger als 1 Stunde";
  },

  formatRemainingForDevblog(devblogId) {
    const win = this.windowForDevblog(devblogId);
    return win ? this.formatRemaining(this.remainingMs(win)) : "";
  },

  status(modeId) {
    const win = this.windowForMode(modeId);
    if (!win) return null;
    return {
      modeId,
      label: (win.labels && win.labels[modeId]) || modeId.toUpperCase(),
      message: win.message,
      remaining: this.formatRemaining(this.remainingMs(win)),
      endsAt: win.endsAt,
      devblogId: win.devblogId,
    };
  },

  summary() {
    const active = this.activeWindows();
    if (!active.length) return null;
    const modes = [];
    const names = [];
    const devblogIds = [];
    for (const w of active) {
      devblogIds.push(w.devblogId);
      for (const id of w.modes) {
        modes.push(id);
        names.push((w.labels && w.labels[id]) || id);
      }
    }
    const longest = Math.max(...active.map(w => this.remainingMs(w)));
    return {
      modes,
      names: names.join(", "),
      remaining: this.formatRemaining(longest),
      message: active.length === 1 ? active[0].message : "Mehrere Modi in Wartung.",
      devblogId: devblogIds[0],
      devblogIds,
    };
  },

  devblogEntry(devblogId) {
    const id = devblogId || (this.summary() && this.summary().devblogId);
    if (!id || !BH.DEVBLOG) return null;
    return BH.DEVBLOG.find(e => e.id === id) || null;
  },
};

/** Clan-Matches — Saison 2 · 2 Wochen aktiv, 2 Wochen Pause · alle Karten */
BH.ClanMatches = {
  WINDOW_MS: 14 * 86400000,
  CYCLE_MS: 28 * 86400000,
  MODE_ID: "clanmatch",

  isSeasonUnlocked() {
    return !!(BH.ClanExt && BH.ClanExt.isLive());
  },

  windowInfo() {
    if (!this.isSeasonUnlocked()) {
      return { active: false, reason: "season", seasonLocked: true };
    }
    const launch = BH.SeasonRelease.getS2LaunchAt();
    if (!launch || isNaN(launch.getTime())) {
      return { active: false, reason: "launch" };
    }
    const start = launch.getTime();
    const now = Date.now();
    if (now < start) {
      if (BH.RELEASE.s2 && BH.RELEASE.s2.clanMatchesTest && BH.ClanExt && BH.ClanExt.isLive()) {
        const testStart = now - 86400000;
        return { active: true, reason: "live", startedAt: testStart, endsAt: testStart + this.WINDOW_MS };
      }
      return { active: false, reason: "prelaunch", startsAt: start };
    }
    const elapsed = now - start;
    const phase = elapsed % this.CYCLE_MS;
    if (phase >= this.WINDOW_MS) {
      const nextStart = now + (this.CYCLE_MS - phase);
      return { active: false, reason: "off", nextStart, endsAt: null };
    }
    const windowStart = now - phase;
    return {
      active: true,
      reason: "live",
      startedAt: windowStart,
      endsAt: windowStart + this.WINDOW_MS,
    };
  },

  isActive() {
    return !!this.windowInfo().active;
  },

  canPlay(d) {
    return !!(d && d.clan && this.isActive());
  },

  allMaps() {
    if (!BH.Maps || !BH.Maps.MAP_POOL) return [];
    return BH.Maps.MAP_POOL.slice();
  },

  pickMap() {
    const pool = this.allMaps();
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  },

  formatRemaining(ms) {
    ms = ms != null ? ms : 0;
    if (ms <= 0) return "—";
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    if (days >= 1) return `${days}T ${hours}Std`;
    if (hours >= 1) return `${hours} Std`;
    const mins = Math.floor((ms % 3600000) / 60000);
    return `${mins} Min`;
  },

  statusLabel(info) {
    info = info || this.windowInfo();
    if (info.seasonLocked) {
      return BH.SeasonRelease ? BH.SeasonRelease.s2StartsOnNotice() : "Saison 2 startet am 1.8.2026";
    }
    if (info.reason === "prelaunch" && info.startsAt) {
      return "Start · " + BH.SeasonRelease.formatLaunchDate({ launch: new Date(info.startsAt) });
    }
    if (info.active && info.endsAt) {
      return "Noch " + this.formatRemaining(info.endsAt - Date.now());
    }
    if (info.nextStart) {
      return "Nächste Runde · " + this.formatRemaining(info.nextStart - Date.now());
    }
    return "Inaktiv";
  },

  ensureStats(d) {
    if (!d.clan) return;
    if (!d.clan.clanMatchStats) d.clan.clanMatchStats = { played: 0, wins: 0, windowKey: "" };
  },

  _windowKey(info) {
    info = info || this.windowInfo();
    if (!info.startedAt) return "";
    return String(Math.floor(info.startedAt / this.CYCLE_MS));
  },

  trackMatch(d, deltas, victory) {
    if (!d.clan || !this.isActive()) return null;
    this.ensureStats(d);
    const info = this.windowInfo();
    const wKey = this._windowKey(info);
    const st = d.clan.clanMatchStats;
    if (st.windowKey !== wKey) {
      d.clan.clanMatchStats = { played: 0, wins: 0, windowKey: wKey };
      d.clan.cmRewards = {};
    }
    d.clan.clanMatchStats.played++;
    let winAdd = victory ? 1 : 0;
    const ev = BH.Social ? BH.Social.getClanEvent() : null;
    if (victory && ev && ev.cmWinMult) winAdd = ev.cmWinMult;
    if (victory) d.clan.clanMatchStats.wins += winAdd;
    let bonusXp = 30 + Math.min(40, (deltas?.kills || 0) * 4) + (victory ? 50 : 0);
    bonusXp = Math.round(bonusXp * this.mapFocusMult(info));
    bonusXp = Math.round(bonusXp * (BH.Social ? BH.Social.treasuryHorizonCmMult(d) : 1));
    if (BH.ClanExt && BH.ClanExt.isLive()) bonusXp = Math.round(bonusXp * BH.ClanExt.activeBuffMult(d, "cmXp"));
    if (BH.Social) BH.Social.addClanXp(d, bonusXp);
    if (BH.ClanExt && BH.ClanExt.isLive()) {
      BH.ClanExt.recordContribution(d, deltas || {}, { clanXp: bonusXp, cmWin: victory ? 1 : 0 });
    }
    const rewards = this._checkWinRewards(d, d.clan.clanMatchStats.wins);
    this._updateRoundHistory(d, wKey, victory, deltas);
    this._updateHorizonMvp(d, wKey);
    return { bonusXp, stats: d.clan.clanMatchStats, rewards, mapFocus: this.mapFocus(info) };
  },

  mapFocus(info) {
    info = info || this.windowInfo();
    const pool = this.allMaps();
    if (!pool.length) return null;
    const idx = info.startedAt
      ? Math.abs(Math.floor(info.startedAt / this.WINDOW_MS)) % pool.length
      : 0;
    return pool[idx] || pool[0];
  },

  mapFocusMult(info) {
    const focus = this.mapFocus(info);
    if (!focus || !BH.Menu || !BH.Menu.game) return 1;
    const cur = BH.Maps && BH.Maps.getActiveMap ? BH.Maps.getActiveMap() : null;
    if (cur && focus.id === cur.id) return 1.2;
    return 1;
  },

  rivalTeamLabel(d) {
    if (d && d.clan && d.clan.rival && d.clan.rival.tag) {
      return "[" + d.clan.rival.tag + "]";
    }
    const tags = BH.ClanExt ? BH.ClanExt.RIVAL_TEAM_TAGS : ["RIVAL"];
    const idx = Math.abs(Math.floor(Date.now() / 86400000)) % tags.length;
    return "[" + tags[idx] + "]";
  },

  _checkWinRewards(d, wins) {
    const granted = [];
    if (!BH.ClanExt || !BH.ClanExt.isLive()) return granted;
    if (!d.clan) return granted;
    if (!d.clan.cmRewards) d.clan.cmRewards = {};
    const r = d.clan.cmRewards;
    if (wins >= 5 && !r.w5) {
      r.w5 = true;
      d.credits = (d.credits || 0) + 400;
      if (BH.Crates && BH.Crates.grant) BH.Crates.grant(d, "front", 1, { skipDailyCap: true });
      granted.push({ type: "w5", credits: 400, crate: "front" });
    }
    if (wins >= 10 && !r.w10) {
      r.w10 = true;
      if (BH.ClanExt && BH.ClanExt.isLive() && d.owned && !d.owned.clanTitles.includes("clan_striker")) {
        d.owned.clanTitles.push("clan_striker");
      }
      granted.push({ type: "w10", title: "clan_striker" });
    }
    if (granted.length) BH.Progress.save();
    return granted;
  },

  _updateRoundHistory(d, wKey, victory, deltas) {
    if (!d.clan) return;
    if (!d.clan.matchRounds) d.clan.matchRounds = [];
    let row = d.clan.matchRounds.find(r => r.windowKey === wKey);
    if (!row) {
      row = { windowKey: wKey, played: 0, wins: 0, kills: 0, startedAt: Date.now() };
      d.clan.matchRounds.push(row);
    }
    row.played++;
    if (victory) row.wins++;
    row.kills = (row.kills || 0) + (deltas?.kills || 0);
    if (d.clan.matchRounds.length > 12) d.clan.matchRounds.shift();
  },

  _updateHorizonMvp(d, wKey) {
    if (!d.clan) return;
    const mvp = d.clan.horizonMvp || { windowKey: "", name: "", matches: 0 };
    if (mvp.windowKey !== wKey) {
      d.clan.horizonMvp = { windowKey: wKey, name: BH.Social ? BH.Social.displayName(d) : "DU", matches: 1 };
      return;
    }
    mvp.matches = (mvp.matches || 0) + 1;
    mvp.name = BH.Social ? BH.Social.displayName(d) : mvp.name;
    d.clan.horizonMvp = mvp;
  },

  leaderboardRows(d) {
    if (!d.clan || !d.clan.matchRounds) return [];
    return [...d.clan.matchRounds].sort((a, b) => (b.wins || 0) - (a.wins || 0)).slice(0, 5);
  },
};

BH.OperatorVoices = {
  _cooldown: 0,
  _nextIdle: 0,
  _hurtBarked: false,
  _barkT: null,

  lines: {
    recruit: {
      spawn: ["Task Force on me. Kein Fehler heute.", "Rekrut-7 im Einsatz. Bereit."],
      idle: ["Sektor sauber… vorerst.", "Augen offen. Immer.", "TF Nachtfalke – wir halten die Linie.", "Munition check. Alles grün.", "Wind dreht. Gefühl für Ärger.", "Horizont ist schwarz. Wir sind hellwach."],
      kill: ["Ziel neutralisiert.", "Treffer bestätigt.", "Feind fällt.", "Einer weniger auf der Karte."],
      headshot: ["Kopf. Sauber.", "Zentrum getroffen.", "Perfekter Schuss."],
      streak: ["Serie läuft!", "So macht man das.", "TF-Stolz."],
      hurt: ["Verwundet – halte durch!", "Noch nicht vorbei, Rekrut."],
      death: ["Man down…", "Ich fall… weiter ohne mich!"],
    },
    breaker: {
      spawn: ["Brecher geht zuerst rein. Aus dem Weg!", "Sprengsatz mental scharf. Los."],
      idle: ["Türen sind Vorschläge.", "Wer braucht schon Deckung?", "Ich rieche Schießpulver und schlechte Entscheidungen.", "Noch eine Wand? Kein Problem.", "Vorsicht: Ich bin lauter als dein Loadout.", "Heute gibt's Löcher statt Antworten."],
      kill: ["Einschlag!", "Zerstört.", "Brecher macht kurzen Prozess.", "Boom – nächster."],
      headshot: ["Kopf weg – Wand optional.", "Präzise für einen Brecher."],
      streak: ["Alles fliegt!", "Unaufhaltsam!", "Demolition-Dream!"],
      hurt: ["Nur Kratzer. NOCH.", "Das brennt – ich brenne zurück!"],
      death: ["Zu… viel… Druck…", "Brecher fällt. Rächt mich."],
    },
    ghost9: {
      spawn: ["Geist-9 online. Ihr habt mich nicht gesehen.", "…"],
      idle: ["…", "Lautlos.", "Sie wissen nicht, dass ich hier bin.", "Schatten bewegen sich.", "Kein Ping. Kein Fehler.", "Ich war nie hier.", "Wind trägt keinen Namen."],
      kill: ["Erledigt.", "Geist bestätigt.", "Keine Spuren.", "Verschwunden – wie ich."],
      headshot: ["Ein Atemzug. Dann nichts.", "Stille Treffer."],
      streak: ["Phantom-Serie.", "Unsichtbare Hand."],
      hurt: ["…getroffen.", "Geist blutet auch."],
      death: ["Abgeschlagen.", "…verdammt."],
    },
    karst: {
      spawn: ["Karst meldet sich. Die Wüste vergisst nichts.", "Rotglut kennt meinen Namen."],
      idle: ["Sand in den Zähnen. Normal.", "Hydration check – noch genug.", "Hitze lügt nicht.", "Vanguard-Spuren im Staub… frisch.", "Wüstenkorn schmeckt nach Sieg.", "Schattenseite nutzen. Immer."],
      kill: ["Wüste holt sich einen.", "Dürre deines Blutes.", "Karst sammelt Trophäen.", "Ein Sandkorn mehr im Wind."],
      headshot: ["Kalt wie Frost in der Wüste.", "Millimeterarbeit."],
      streak: ["Sandsturm-Modus.", "Die Düne frisst alles."],
      hurt: ["Verdurstet fast… figurativ.", "Wüste beißt zurück."],
      death: ["Zurück an die Sonne…", "Karst… wird Staub."],
    },
    cinder: {
      spawn: ["Cinder hier. Vanguard zahlt heute.", "Aus der Asche – gegen meine Alten."],
      idle: ["Vanguard-Rot passt zu Blut.", "Ich kenne ihre Taktik. Jede.", "Aschefront brennt noch.", "Verräter? Nein. Überlebender.", "Feuer reinigt.", "Mein altes Abzeichen brennt."],
      kill: ["Asche zu Asche.", "Vanguard fällt.", "Brenn, Bruder.", "Cinder sammelt Schulden ein."],
      headshot: ["Kopf – erloschen.", "Präzise Rache."],
      streak: ["Inferno läuft!", "Alles verbrennt!", "Feuerkette!"],
      hurt: ["Flamme flackert…", "Noch nicht erloschen!"],
      death: ["Cinder… erlischt.", "Hol… mich… aus der Asche…"],
    },
    mirage: {
      spawn: ["Mirage im Fenster. Atme nicht laut.", "Arktis-Lehrgänge zahlen sich aus."],
      idle: ["Windage minimal.", "Atem anhalten… feuern.", "Du siehst mich erst im Scope.", "Schnee lügt nicht – Menschen schon.", "Ein Schuss. Eine Entscheidung.", "Kalibrierung: perfekt."],
      kill: ["Distance closed.", "Langstrecken bestätigt.", "Ziel fällt leise.", "Mirage lügt nie."],
      headshot: ["Kopf. Kein Wind nötig.", "Arktis-Präzision."],
      streak: ["Unfehlbar.", "Keine Gnade aus der Ferne."],
      hurt: ["Einschuss… reposition.", "Mirage getroffen – selten."],
      death: ["Scope… verschwimmt…", "Zu nah… mein Fehler."],
    },
    nachtfalke: {
      spawn: ["Nachtfalke führt. Alle Kanäle offen.", "Kommandant im Einsatz. Exekution."],
      idle: ["TF hält die Linie.", "Horizont beobachten.", "Kein Operator allein.", "Priorität: Ziel erfüllen.", "Prestige verpflichtet.", "Schwarzer Horizont – wir antworten."],
      kill: ["Bestätigt. Weiter.", "Gegner eliminiert.", "Saubere Arbeit.", "Nachtfalke sieht alles."],
      headshot: ["Chirurgisch.", "Kommandant genehmigt."],
      streak: ["Dominanz.", "So führt man.", "TF on fire."],
      hurt: ["Kommandant getroffen – deckt mich!", "Noch im Kampf."],
      death: ["TF… ohne mich… weiter!", "Nachtfalke… fällt…"],
    },
    phoenix: {
      spawn: ["Phönix erwacht. 2038 brennt noch.", "Mythisch. Unaufhaltsam. Los."],
      idle: ["Aus Asche geboren.", "Der Horizont gehört mir.", "Legenden reloaden nicht – sie siegen.", "Vanguard fürchtet den Namen.", "Goldener Operator. Schwarzer Himmel.", "Mythen sterben nicht."],
      kill: ["Phönix steigt.", "Mythischer Treffer.", "Wiedergeburt durch Sieg.", "Asche deiner Hoffnung."],
      headshot: ["Kopf in Flammen.", "Göttliche Präzision."],
      streak: ["UNSTERBLICH!", "Phönix-Rage!", "Legenden-Serie!"],
      hurt: ["Feuer… flackert…", "Phönix brennt heller!"],
      death: ["Ich stehe wieder auf… irgendwann.", "Phönix… fällt… nicht für immer."],
    },
    wraith: {
      spawn: ["Wraith meldet sich. Schatten eins.", "Phantom-Einheit – unsichtbar bis zum Schuss."],
      idle: ["Atme leise.", "Horizont beobachtet.", "Kein Schritt zu laut.", "Phantom-Status aktiv.", "Sie sehen Schatten – nicht mich.", "Saison 2 beginnt im Dunkeln."],
      kill: ["Leise eliminiert.", "Schatten schlägt zu.", "Wraith war schon weg.", "Kein Geräusch. Nur Fall."],
      headshot: ["Präzision im Dunkeln.", "Ein Schuss – kein Echo."],
      streak: ["Phantom-Kette!", "Unsichtbare Dominanz!", "Schatten-Serie!"],
      hurt: ["Getroffen… leiser!", "Wraith… blutet leise…"],
      death: ["Schatten… verblasst…", "Phantom… ausgeschaltet…"],
    },
    striker: {
      spawn: ["Striker vorn! Deckung hinter mir!", "Vanguard-Sturm – kein Halten!"],
      idle: ["Immer nach vorne.", "Rot ist unsere Farbe.", "Wer zögert, fällt.", "Frontlinie braucht Druck.", "LM bereit. Immer.", "Vanguard wartet nicht."],
      kill: ["Sturm bestätigt!", "Vorn durch!", "Ziel fällt – weiter!", "Striker sammelt ein."],
      headshot: ["Kopf weg – Marsch!", "Sauberer Sturm."],
      streak: ["UNAUFHALTBAR!", "Vanguard-Welle!", "Sturm-Serie!"],
      hurt: ["Nur Kratzer – STURM!", "Striker fällt nicht leicht!"],
      death: ["Sturm… bricht…", "Vanguard… verliert… einen…"],
    },
    fluss: {
      spawn: ["Fluss online. Kanäle offen, Squad gesund.", "TF-Medevac bereit – ich bin schon da."],
      idle: ["Vitals stabil.", "Funk check – klar.", "Wasser reicht noch.", "Squad first.", "TF braucht jeden.", "Horizont heilt nicht – wir schon."],
      kill: ["Bedrohung weg – behandeln später.", "Sauber, Team.", "Feind neutral – weiter!", "Fluss bestätigt."],
      headshot: ["Präzise – wie Chirurgie.", "Kein Drama nötig."],
      streak: ["Team dominiert!", "TF on point!", "Serie – alle safe!"],
      hurt: ["Verwundet – ich halte!", "Noch nicht down!"],
      death: ["Fluss… fällt… Squad… weiter…", "Medevac… zu spät…"],
    },
    dune: {
      spawn: ["Düne im Sand. Spur ist frisch.", "Wüstenkorps – leise und schnell."],
      idle: ["Wind aus Osten.", "Spuren lesen wie Bücher.", "Rotglut flüstert.", "Sand deckt mich.", "Karst war hier – interessant.", "Hitze ist Verbündete."],
      kill: ["Sand frisst einen.", "Düne bestätigt.", "Leise fällt er.", "Wüste gewinnt."],
      headshot: ["Millimeter im Staub.", "Wind half nicht."],
      streak: ["Sandsturm!", "Dünen-Serie!", "Korps-Stolz!"],
      hurt: ["Sand in der Wunde…", "Düne… taumelt…"],
      death: ["Zurück… an den… Sand…", "Düne… verweht…"],
    },
    raven: {
      spawn: ["Rabe im Nest. Drohne oben.", "SIGINT live – ich sehe alles."],
      idle: ["Drohne rotiert.", "Signal sauber.", "TF braucht Augen.", "Oben ist es ruhiger.", "Karte aktualisiert.", "Horizont von oben – hässlich."],
      kill: ["Ziel markiert – erledigt.", "Drohne bestätigt Kill.", "Rabe sieht alles.", "Abgeschaltet."],
      headshot: ["Pixelgenau.", "Scope von oben."],
      streak: ["Luftüberlegenheit!", "Rabe-Kette!", "All-Seeing!"],
      hurt: ["Drohne getroffen… ich auch.", "Rabe… fällt…"],
      death: ["Drohne… down… ich… auch…", "Nest… verlassen…"],
    },
    zero: {
      spawn: ["Zero im Netz. Feind-Comms gestört.", "Cyber-Kampf aktiv."],
      idle: ["Firewall hält.", "Ping sauber.", "Hack läuft.", "Vanguard digital.", "Signal stören… optional.", "Nullen und Einsen – mein Krieg."],
      kill: ["Target deleted.", "Zero bestätigt.", "Offline.", "Netzwerk bereinigt."],
      headshot: ["Headshot.exe", "Kritisch – wie erwartet."],
      streak: ["Root access!", "Zero-Day-Serie!", "System dominiert!"],
      hurt: ["Integrity… damaged…", "Zero… reboot…"],
      death: ["Connection… lost…", "Zero… offline…"],
    },
    vortex: {
      spawn: ["Vortex schwer bewaffnet. Deckung hinter MIR.", "LM online – alle ducken."],
      idle: ["Munition schwer, Ziel leicht.", "Unterstützung bereit.", "Vanguard-Feuer.", "Gürtel voll.", "Deckung ist relativ.", "Ich BIN die Deckung."],
      kill: ["Unterdrückt!", "LM bestätigt.", "Vortex fegt.", "Ziel zerrissen."],
      headshot: ["Kopf – trotzdem viel Munition.", "Präzise für schwer."],
      streak: ["FEUERSTURM!", "Vortex dreht!", "LM-Serie!"],
      hurt: ["Weste hält… noch!", "Vortex… wackelt…"],
      death: ["LM… verstummt…", "Vortex… fällt… schwer…"],
    },
    frost: {
      spawn: ["Frost aus der Frostlinie. Kalt und bereit.", "Arktis-Ausbildung – jeden Tag."],
      idle: ["Atem sichtbar.", "Schnee lügt nie.", "Mirage war Lehrmeisterin.", "Kälte schärft.", "Weiß tarnt gut.", "Horizont friert – ich nicht."],
      kill: ["Eingefroren.", "Frost bestätigt.", "Kalt eliminiert.", "Arktis holt sich einen."],
      headshot: ["Kopf – kein Schnee nötig.", "Frost präzise."],
      streak: ["Blizzard!", "Frost-Kette!", "Eisige Serie!"],
      hurt: ["Einschuss… wärmer…", "Frost… bricht…"],
      death: ["Zu… warm…", "Frost… schmilzt…"],
    },
    slag: {
      spawn: ["Slag meldet sich. Prestige hat mich hart gemacht.", "Vanguard-Veteran – ich stehe wieder auf."],
      idle: ["Weste getragen.", "Drittes Prestige, erster Schlag.", "Vanguard vergisst nicht.", "Schrot und Ehre.", "Ich falle langsam.", "Horizont kennt Slag."],
      kill: ["Slag sammelt.", "Veteran bestätigt.", "Noch einer.", "Prestige zahlt."],
      headshot: ["Kopf – Veteranenarbeit.", "Sauber für Slag."],
      streak: ["VETERAN-RAGE!", "Slag dominiert!", "Prestige-Serie!"],
      hurt: ["Weste… hält…", "Slag… blutet… langsam…"],
      death: ["Ich… stehe… wieder…", "Slag… fällt… nicht… endgültig…"],
    },
    spectre: {
      spawn: ["Spectre im Netz. Phantom-Einheit elite.", "Du hörst mich – sie nicht."],
      idle: ["Radar passive.", "Elite-Status.", "Phantom führt.", "Horizont-Schatten.", "Wraith ist Schwester.", "Saison 2 Elite."],
      kill: ["Spectre bestätigt.", "Elite-Treffer.", "Radar ping – Kill.", "Phantom siegt."],
      headshot: ["Elite-Präzision.", "Spectre sieht alles."],
      streak: ["ELITE-SERIE!", "Radar explodiert!", "Phantom-König!"],
      hurt: ["Elite… getroffen…", "Spectre… schwächer…"],
      death: ["Phantom… verliert… Spectre…", "Elite… offline…"],
    },
  },

  opName(opId) {
    const op = BH.OperatorCatalog
      ? BH.OperatorCatalog.find(opId, BH.Progress && BH.Progress.data)
      : (BH.OPERATORS || []).find(o => o.id === opId);
    return op ? op.name : "OPERATOR";
  },

  pick(opId, type) {
    const set = this.lines[opId] || this.lines.recruit;
    const arr = set[type] || set.idle || set.kill;
    return arr[Math.floor(Math.random() * arr.length)];
  },

  _loadVoices() {
    if (!window.speechSynthesis) return;
    this._speechVoices = window.speechSynthesis.getVoices();
    if (!this._speechVoices.length) {
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        this._speechVoices = window.speechSynthesis.getVoices();
      }, { once: true });
    }
  },

  speak(opId, line) {
    if (!line || line === "…" || !window.speechSynthesis) return;
    const vol = (BH.Settings && BH.Settings.get().volume) || 1;
    if (vol <= 0) return;
    if (BH.audio) BH.audio.unlock();
    if (BH.audio && BH.audio.radio) BH.audio.radio();

    if (!this._speechVoices || !this._speechVoices.length) this._loadVoices();

    const profiles = {
      recruit: { rate: 1.0, pitch: 1.0 },
      breaker: { rate: 1.12, pitch: 0.9 },
      ghost9: { rate: 0.88, pitch: 0.82 },
      karst: { rate: 0.95, pitch: 0.95 },
      cinder: { rate: 1.05, pitch: 0.88 },
      mirage: { rate: 0.92, pitch: 1.08 },
      nachtfalke: { rate: 0.98, pitch: 0.92 },
      phoenix: { rate: 0.86, pitch: 0.72 },
      wraith: { rate: 0.84, pitch: 0.78 },
      striker: { rate: 1.14, pitch: 0.88 },
      fluss: { rate: 1.02, pitch: 1.05 },
      dune: { rate: 0.96, pitch: 0.94 },
      raven: { rate: 0.94, pitch: 0.96 },
      zero: { rate: 1.08, pitch: 0.85 },
      vortex: { rate: 0.92, pitch: 0.82 },
      frost: { rate: 0.9, pitch: 1.02 },
      slag: { rate: 0.88, pitch: 0.75 },
      spectre: { rate: 0.86, pitch: 0.8 },
    };
    const p = profiles[opId] || profiles.recruit;
    const u = new SpeechSynthesisUtterance(line);
    u.lang = "de-DE";
    u.volume = Math.min(1, vol * 0.92);
    u.rate = p.rate;
    u.pitch = p.pitch;

    const voices = this._speechVoices || window.speechSynthesis.getVoices();
    const de = voices.find(v => v.lang && v.lang.startsWith("de"));
    if (de) u.voice = de;

    window.speechSynthesis.cancel();
    setTimeout(() => {
      if (BH.Progress.data && BH.Progress.data.operatorVoice !== false) {
        window.speechSynthesis.speak(u);
      }
    }, 90);
  },

  say(game, type, force) {
    const d = BH.Progress.data;
    if (!d || d.operatorVoice === false) return;
    if (!force && game.time < this._cooldown) return;

    const opId = d.operator || "recruit";
    const name = this.opName(opId);
    const line = this.pick(opId, type);
    this._cooldown = game.time + (type === "idle" ? 16 : type === "death" ? 4 : 9);

    const el = document.getElementById("operator-bark");
    if (el) {
      el.querySelector(".ob-name").textContent = name;
      el.querySelector(".ob-line").textContent = "„" + line + "“";
      el.classList.remove("hidden");
      el.classList.add("show");
      clearTimeout(this._barkT);
      const dur = type === "death" ? 3000 : type === "spawn" ? 2800 : 2400;
      this._barkT = setTimeout(() => {
        el.classList.remove("show");
        setTimeout(() => el.classList.add("hidden"), 450);
      }, dur);
    } else {
      game.showMessage("", "🎙 " + name + ": „" + line + "“", 2400);
    }
    this.speak(opId, line);
  },

  onSpawn(game) {
    this._cooldown = 0;
    this._hurtBarked = false;
    this._nextIdle = game.time + 35 + Math.random() * 25;
    setTimeout(() => {
      if (game.active && !game.ending) this.say(game, "spawn", true);
    }, 4000);
  },

  update(game) {
    if (!game.active || game.paused || game.ending) return;
    const d = BH.Progress.data;
    if (!d || d.operatorVoice === false) return;

    if (game.time >= this._nextIdle) {
      this._nextIdle = game.time + 45 + Math.random() * 40;
      this.say(game, "idle");
    }

    const hp = game.player.health / game.player.maxHealth;
    if (!this._hurtBarked && hp > 0 && hp < 0.3 && game.player.alive) {
      this._hurtBarked = true;
      this.say(game, "hurt");
    }
  },

  onKill(game, isHead) {
    this.say(game, isHead ? "headshot" : "kill");
  },

  onDeath(game) {
    this._hurtBarked = false;
    this.say(game, "death", true);
  },

  onStreak(game, streak) {
    if ([3, 5, 7].includes(streak)) this.say(game, "streak", true);
  },
};

BH.CallingCards = {
  list: [
    { id: "default", name: "Standard", icon: "⬛", style: "cc-default" },
    { id: "blood", name: "Blutlinie", icon: "🩸", style: "cc-blood" },
    { id: "neon", name: "Neon-Streak", icon: "💜", style: "cc-neon" },
    { id: "horizon", name: "Black Horizon", icon: "🌑", style: "cc-horizon" },
    { id: "prestige", name: "Prestige-Gold", icon: "✪", style: "cc-prestige", requirePrestige: 5 },
  ],
  get(id) { return this.list.find(c => c.id === id) || this.list[0]; },
  owned(d) {
    return this.list.filter(c => {
      if (c.eventOnly) return (d.owned.callingCards || []).includes(c.id);
      if (c.requirePrestige && d.prestige < c.requirePrestige) return false;
      if ((BH.SHOP.callingCards || []).some(x => x.id === c.id)) return (d.owned.callingCards || []).includes(c.id);
      return true;
    });
  },
};

BH.SeasonBundle = {
  bundleId: "season_finale",
  requiredChapter: 3,
  canBuy(d) {
    const ch = BH.SeasonStory.chapter(d);
    return ch.idx >= this.requiredChapter;
  },
  isLocked(d) {
    const b = (BH.SHOP.bundles || []).find(x => x.id === this.bundleId);
    if (!b) return false;
    return !this.canBuy(d) && !(d.owned.bundles || []).includes(this.bundleId);
  },
};

BH.PrestigeMaster = {
  hasGoldenFrame(d) { return d.prestige >= 5; },
  titleUnlock(d) {
    if (d.prestige >= 5 && !d.owned.titles.includes("shop_elite")) {
      /* optional auto title */
    }
    return d.prestige >= 5 ? "✪ Prestige-Meister" : null;
  },
};

/* Shop-Erweiterungen in BH.SHOP einfügen */
if (BH.SHOP) {
  if (!BH.SHOP.charms) BH.SHOP.charms = [
    { id: "skull_ch", name: "Totenkopf", icon: "💀", price: 350 },
    { id: "star_ch", name: "Stern", icon: "⭐", price: 300 },
    { id: "bolt_ch", name: "Blitz", icon: "⚡", price: 400 },
    { id: "horizon_ch", name: "Horizont", icon: "🌑", price: 550 },
    { id: "dogtag", name: "Dogtag 2038", icon: "📿", price: 450 },
    { id: "flame_ch", name: "Flamme", icon: "🔥", price: 380 },
  ];
  if (!BH.SHOP.callingCards) BH.SHOP.callingCards = [
    { id: "blood", name: "Blutlinie", icon: "🩸", price: 500 },
    { id: "neon", name: "Neon-Streak", icon: "💜", price: 550 },
    { id: "horizon", name: "Black Horizon", icon: "🌑", price: 700 },
  ];
  if (!BH.SHOP.bundles.some(b => b.id === "season_finale")) {
    BH.SHOP.bundles.push({
      id: "season_finale", name: "ASCHEFRONT-FINALE", badge: "STORY", price: 2999,
      desc: "Freischaltung ab Saison-Story Woche 4.",
      items: { camos: ["aschegrau", "void"], sprays: ["horizon", "outbreak"], emblems: ["shop_horizon"], titles: ["shop_warlord"], charms: ["horizon_ch"], callingCards: ["horizon"], credits: 600 },
      seasonLocked: true,
    });
  }
}

/* Bug- & Feedback-Meldungen (lokal, kein Server) */
BH.Feedback = {
  STORAGE_KEY: "bh_feedback_log",
  SUPPORT_EMAIL: "feedback@blackhorizon.game",

  categories: {
    bug: "Bug / Fehler",
    balance: "Balance / Waffen",
    idea: "Vorschlag / Feature",
    cosmetic: "Kosmetik / Shop",
    other: "Sonstiges",
  },

  _meta() {
    const d = (BH.Progress && BH.Progress.data) || {};
    const lvl = BH.Progress ? BH.Progress.getLevel() : { level: 1 };
    let ua = "";
    try { ua = navigator.userAgent; } catch (e) { /* ignore */ }
    return {
      game: "PROJECT: BLACK HORIZON",
      version: BH.gameVersionLabel ? BH.gameVersionLabel(d) : ("v" + (BH.GAME_VERSION || "0.0.1")),
      date: new Date().toISOString(),
      level: lvl.level,
      prestige: d.prestige || 0,
      operator: d.operator || "recruit",
      lastMode: d.lastMode || "—",
      matches: d.matches || 0,
      credits: d.credits || 0,
      userAgent: ua,
    };
  },

  buildReport(opts) {
    const cat = this.categories[opts.category] || opts.category || "Sonstiges";
    const meta = opts.includeSave !== false ? this._meta() : { game: "PROJECT: BLACK HORIZON", date: new Date().toISOString() };
    const lines = [
      "=== BLACK HORIZON · FEEDBACK ===",
      "Kategorie: " + cat,
      "Datum: " + (meta.date || new Date().toISOString()),
      "",
      "— Beschreibung —",
      (opts.text || "").trim() || "(keine Beschreibung)",
      "",
    ];
    if (opts.contact && opts.contact.trim()) {
      lines.push("Kontakt: " + opts.contact.trim(), "");
    }
    if (opts.includeSave !== false) {
      lines.push(
        "— Spiel-Infos —",
        "Version: " + (meta.version || "—"),
        "Level: " + (meta.level ?? "—") + " · Prestige: " + (meta.prestige ?? 0),
        "Operator: " + (meta.operator || "—"),
        "Letzter Modus: " + (meta.lastMode || "—"),
        "Matches: " + (meta.matches ?? 0) + " · Credits: " + (meta.credits ?? 0),
        "Browser: " + (meta.userAgent || "—"),
        "",
      );
    }
    lines.push("=== Ende Report ===");
    return lines.join("\n");
  },

  _saveLog(entry) {
    try {
      const log = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
      log.unshift(entry);
      if (log.length > 20) log.length = 20;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(log));
    } catch (e) { /* localStorage blockiert */ }
  },

  async submit(opts) {
    const text = (opts.text || "").trim();
    if (!text) return { ok: false, reason: "empty" };
    const report = this.buildReport(opts);
    this._saveLog({
      at: new Date().toISOString(),
      category: opts.category,
      text,
      contact: opts.contact || "",
    });
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(report);
        copied = true;
      }
    } catch (e) { /* Clipboard blockiert */ }
    return { ok: true, report, copied };
  },

  mailtoUrl(report) {
    const subject = encodeURIComponent("Black Horizon Feedback");
    const body = encodeURIComponent(report);
    return "mailto:" + this.SUPPORT_EMAIL + "?subject=" + subject + "&body=" + body;
  },
};
