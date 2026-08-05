/* Meta-Systeme: Einstellungen, Challenges, Kosmetik, Killstreaks, Meisterschaft, Saison, Ranked */
window.BH = window.BH || {};

/* ===== EINSTELLUNGEN ===== */
BH.Settings = {
  defaults: { sensitivity: 1.0, volume: 1.0, fov: 75, crosshairScale: 1.0, quality: "medium", language: "de" },
  get() {
    const d = BH.Progress.data.settings || {};
    const s = Object.assign({}, this.defaults, d);
    if (BH.Graphics && BH.Graphics.presets && !BH.Graphics.presets[s.quality]) {
      s.quality = this.defaults.quality;
    }
    return s;
  },
  set(key, val) {
    if (!BH.Progress.data.settings) BH.Progress.data.settings = {};
    BH.Progress.data.settings[key] = val;
    BH.Progress.save();
    this.apply();
    if (key === "language" && BH.I18n) BH.I18n.apply();
  },
  setQuality(quality) {
    this.set("quality", quality);
  },
  apply() {
    const s = this.get();
    if (BH.audio && BH.audio.setVolume) BH.audio.setVolume(s.volume);
    document.documentElement.style.setProperty("--ch-scale", s.crosshairScale);
    this.applyGraphicsLive();
  },
  applyGraphicsLive() {
    const menu = BH.menu;
    const game = menu && menu.game;
    if (!game || !game.renderer || !game.scene || !BH.Graphics) return;
    BH.Graphics.applyRenderer(game.renderer);
    BH.Graphics.applyScene(game.scene);
    BH.Graphics.applySceneLighting(game.scene);
    BH.Graphics.applySceneMeshes(game.scene);
    game.renderer.setSize(window.innerWidth, window.innerHeight);
    if (game.camera) {
      game.camera.aspect = window.innerWidth / window.innerHeight;
      game.camera.updateProjectionMatrix();
    }
  },
};

/* ===== EMBLEME & TITEL ===== */
BH.EMBLEMS = [
  { id: "recruit", name: "Rekrut", icon: "🎖", requireLevel: 1 },
  { id: "skull", name: "Totenkopf", icon: "💀", requireLevel: 10 },
  { id: "eagle", name: "Adler", icon: "🦅", requireLevel: 25 },
  { id: "ash", name: "Aschefront", icon: "🔥", requireBpTier: 5 },
  { id: "outbreak", name: "Outbreak", icon: "🧟", requireZombieRound: 15 },
  { id: "legend", name: "Legende", icon: "⭐", requirePrestige: 3 },
  { id: "login_7", name: "Treue", icon: "📅", requireLogin: true },
  { id: "fw_vanguard", name: "Vanguard-Siegel", icon: "🔴", shop: true },
  { id: "fw_nachtfalke", name: "Nachtfalke-Siegel", icon: "🦅", shop: true },
  { id: "fw_wueste", name: "Wüstenkorps-Siegel", icon: "🏜", shop: true },
  { id: "fw_schatten", name: "Schatten-Siegel", icon: "🌑", shop: true },
];
BH.TITLES = [
  { id: "none", name: "Kein Titel" },
  { id: "survivor", name: "Überlebender", requireLevel: 5 },
  { id: "ghost", name: "Geist von 2038", requireLevel: 30 },
  { id: "frontline", name: "Frontkämpfer", requireLevel: 50 },
  { id: "zombie_hunter", name: "Zombiejäger", requireZombieRound: 20 },
  { id: "prestige_warrior", name: "Prestige-Krieger", requirePrestige: 1 },
  { id: "legend_title", name: "Legende des Horizonts", requirePrestige: 5 },
];

BH.Cosmetics = {
  ownedEmblems(d) {
    return BH.EMBLEMS.filter(e => {
      if (e.eventOnly && !(d.owned.emblems || []).includes(e.id)) return false;
      if (e.shop && !(d.owned.emblems || []).includes(e.id)) return false;
      if (e.requireLevel && BH.Progress.getLevel().level < e.requireLevel) return false;
      if (e.requireBpTier && BH.Progress.getBpTier() < e.requireBpTier) return false;
      if (e.requireZombieRound && d.bestZombieRound < e.requireZombieRound) return false;
      if (e.requirePrestige && d.prestige < e.requirePrestige) return false;
      if (e.requireLogin && !(d.owned.emblems || []).includes(e.id)) return false;
      return true;
    });
  },
  ownedTitles(d) {
    return BH.TITLES.filter(t => {
      if (t.id === "none") return true;
      if (t.eventOnly) return (d.owned.titles || []).includes(t.id);
      if (t.shop) return (d.owned.titles || []).includes(t.id);
      if (t.requireLevel && BH.Progress.getLevel().level < t.requireLevel) return false;
      if (t.requireZombieRound && d.bestZombieRound < t.requireZombieRound) return false;
      if (t.requirePrestige && d.prestige < t.requirePrestige) return false;
      return true;
    });
  },
  emblem(d) {
    return BH.EMBLEMS.find(e => e.id === (d.emblem || "recruit")) || BH.EMBLEMS[0];
  },
  title(d) {
    const t = BH.TITLES.find(x => x.id === (d.title || "none"));
    return t && t.id !== "none" ? t : null;
  },
  displayName(d) {
    const t = this.title(d);
    const op = BH.OperatorCatalog ? BH.OperatorCatalog.find(d.operator, d) : BH.OPERATORS.find(o => o.id === d.operator);
    const em = this.emblem(d);
    const prefix = em && em.id !== "recruit" ? em.icon + " " : "";
    return prefix + (t ? `[${t.name}] ` : "") + (op ? op.name : "DU");
  },
  spray(d) {
    if (!d.spray || d.spray === "none") return null;
    const shop = (BH.SHOP.sprays || []).find(s => s.id === d.spray);
    if (shop) return shop;
    if (BH.Crates) {
      const ex = BH.Crates.exclusiveItems("sprays").find(s => s.id === d.spray);
      if (ex) return ex;
    }
    return null;
  },
};

/* Shop-Embleme & Titel in Kosmetik-Listen übernehmen */
if (BH.SHOP) {
  for (const e of BH.SHOP.emblems || []) BH.EMBLEMS.push({ id: e.id, name: e.name, icon: e.icon, price: e.price, shop: true });
  for (const t of BH.SHOP.titles || []) BH.TITLES.push({ id: t.id, name: t.name, price: t.price, shop: true });
}

/* ===== CHALLENGES ===== */
BH.Challenges = {
  _dayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
  },
  _weekKey() {
    const d = new Date();
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return d.getFullYear() + "-W" + week;
  },
  dailyPool: [
    { id: "kills10", label: "10 Kills", target: 10, field: "kills", reward: 150 },
    { id: "head3", label: "3 Kopftreffer", target: 3, field: "headshots", reward: 120 },
    { id: "win1", label: "1 Sieg", target: 1, field: "wins", reward: 200 },
    { id: "match2", label: "2 Matches spielen", target: 2, field: "matches", reward: 100 },
  ],
  weeklyPool: [
    { id: "kills50", label: "50 Kills", target: 50, field: "kills", reward: 600 },
    { id: "wins5", label: "5 Siege", target: 5, field: "wins", reward: 800 },
    { id: "zombie100", label: "100 Zombie-Kills", target: 100, field: "zombieKills", reward: 700 },
    { id: "match15", label: "15 Matches", target: 15, field: "matches", reward: 500 },
  ],
  ensure(d) {
    if (!d.challenges) d.challenges = { dayKey: "", weekKey: "", daily: [], weekly: [], dailyProg: {}, weeklyProg: {}, dailyDone: [], weeklyDone: [] };
    const day = this._dayKey(), week = this._weekKey();
    if (d.challenges.dayKey !== day) {
      d.challenges.dayKey = day;
      d.challenges.daily = this._pick(this.dailyPool, 3);
      d.challenges.dailyProg = {};
      d.challenges.dailyDone = [];
    }
    if (d.challenges.weekKey !== week) {
      d.challenges.weekKey = week;
      d.challenges.weekly = this._pick(this.weeklyPool, 2);
      d.challenges.weeklyProg = {};
      d.challenges.weeklyDone = [];
    }
  },
  _pick(pool, n) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n).map(c => c.id);
  },
  def(id) {
    return this.dailyPool.find(c => c.id === id) || this.weeklyPool.find(c => c.id === id);
  },
  track(deltas) {
    const d = BH.Progress.data;
    this.ensure(d);
    let earned = 0;
    const check = (ids, progKey, doneKey) => {
      for (const id of ids) {
        if (d.challenges[doneKey].includes(id)) continue;
        const c = this.def(id);
        if (!c) continue;
        d.challenges[progKey][id] = (d.challenges[progKey][id] || 0) + (deltas[c.field] || 0);
        if (d.challenges[progKey][id] >= c.target) {
          d.challenges[doneKey].push(id);
          earned += c.reward;
        }
      }
    };
    check(d.challenges.daily, "dailyProg", "dailyDone");
    check(d.challenges.weekly, "weeklyProg", "weeklyDone");
    if (earned) d.credits += earned;
    BH.Progress.save();
    return earned;
  },
};

/* ===== KILLSTREAKS ===== */
BH.KILLSTREAKS = [
  { kills: 3, id: "uav", name: "UAV", icon: "📡", duration: 12 },
  { kills: 5, id: "care", name: "Lieferung", icon: "📦" },
  { kills: 7, id: "arty", name: "Artillerie", icon: "💥" },
];

BH.KillstreakMgr = class {
  constructor(game) {
    this.game = game;
    this.streak = 0;
    this.deathsInLife = 0;
    this.uavUntil = 0;
    this.careReady = false;
    this.enabled = BH.KILLSTREAK_MODES.includes(game.modeId);
  }
  onKill() {
    if (!this.enabled) return;
    this.streak++;
    for (const ks of BH.KILLSTREAKS) {
      if (this.streak === ks.kills) this.activate(ks);
    }
  }
  onDeath() {
    this.streak = 0;
    this.careReady = false;
  }
  activate(ks) {
    const g = this.game;
    g.showMessage(ks.icon + " KILLSTREAK", ks.name + " aktiv!", 2200);
    BH.audio.objective();
    if (ks.id === "uav") {
      this.uavUntil = g.time + (ks.duration || 10);
      g.showMessage("", "Feinde auf der Minimap markiert", 2000);
    } else if (ks.id === "care") {
      this.careReady = true;
      g.showMessage("", "[E] Lieferdrohne abholen – zufällige Waffe", 2500);
      g.interactables.push({
        pos: g.yaw.position.clone(), radius: 2,
        _care: true,
        label: () => "Lieferdrohne abholen",
        action: () => {
          if (!this.careReady) return;
          this.careReady = false;
          const w = BH.randomWeapon(g.weapons[0].camo.id);
          g.weapons[0] = w;
          g.weaponIndex = 0;
          g._buildViewmodel();
          g._applyWeaponHud();
          BH.audio.buy();
          g.showMessage("", "📦 " + w.def.name + " geliefert!", 2000);
          g.interactables = g.interactables.filter(x => !x._care);
        },
      });
    } else if (ks.id === "arty") {
      for (const e of [...g.entities]) {
        if (!e.alive || e.isPlayer || e.team === "A") continue;
        const p = e.group.position;
        setTimeout(() => {
          if (g.active) g._explode(p, { radius: 8, damage: 120 }, null);
        }, 300 + Math.random() * 800);
      }
    }
  }
  uavActive() { return this.game.time < this.uavUntil; }
};

BH.KILLSTREAK_MODES = ["tdm", "ffa", "dom", "frontwar", "conquest", "ranked", "clanmatch"];

/* ===== WAFFEN-MEISTERSCHAFT ===== */
BH.Mastery = {
  maxLevel: 10,
  xpPerKill: 25,
  xpPerHead: 15,
  levelXp(n) { return 80 + n * 40; },
  get(d, weaponId) {
    if (!d.mastery) d.mastery = {};
    if (!d.mastery[weaponId]) d.mastery[weaponId] = { xp: 0, level: 1 };
    return d.mastery[weaponId];
  },
  findAttachment(attachmentId) {
    if (!attachmentId || attachmentId === "none") return null;
    for (const slot of ["optic", "barrel", "grip", "mag"]) {
      const att = (BH.ATTACHMENTS[slot] || []).find(a => a.id === attachmentId);
      if (att) return { slot, ...att };
    }
    return null;
  },
  requiredLevel(attachmentId) {
    if (!attachmentId || attachmentId === "none") return 1;
    const att = this.findAttachment(attachmentId);
    return att && att.requireMastery ? att.requireMastery : 1;
  },
  isAttachmentUnlocked(d, weaponId, attachmentId) {
    if (!attachmentId || attachmentId === "none") return true;
    return this.get(d, weaponId).level >= this.requiredLevel(attachmentId);
  },
  unlocksAtLevel(level) {
    const out = [];
    for (const slot of ["optic", "barrel", "grip", "mag"]) {
      for (const att of BH.ATTACHMENTS[slot] || []) {
        if (att.requireMastery === level) {
          out.push({ slot, id: att.id, name: att.name, requireMastery: level });
        }
      }
    }
    return out;
  },
  nextUnlock(d, weaponId) {
    const level = this.get(d, weaponId).level;
    if (level >= this.maxLevel) return null;
    let best = null;
    for (const slot of ["optic", "barrel", "grip", "mag"]) {
      for (const att of BH.ATTACHMENTS[slot] || []) {
        if (!att.requireMastery || att.requireMastery <= level) continue;
        if (!best || att.requireMastery < best.requireMastery) {
          best = { slot, id: att.id, name: att.name, requireMastery: att.requireMastery };
        }
      }
    }
    return best;
  },
  sanitizeAttachments(d, weaponId, attachments) {
    attachments = attachments || {};
    const out = { ...attachments };
    for (const slot of ["optic", "barrel", "grip", "mag"]) {
      const id = out[slot] || "none";
      if (!this.isAttachmentUnlocked(d, weaponId, id)) out[slot] = "none";
    }
    return out;
  },
  sanitizeLoadout(d, loadout) {
    if (!loadout) return loadout;
    loadout.attachments = this.sanitizeAttachments(d, loadout.weaponId, loadout.attachments);
    loadout.secondaryAttachments = this.sanitizeAttachments(
      d,
      loadout.secondaryWeaponId || "pistol",
      loadout.secondaryAttachments
    );
    loadout.camo = this.sanitizeCamo(d, loadout.camo);
    return loadout;
  },
  isCamoUnlocked(d, camoId) {
    const camo = (BH.CAMOS || []).find(c => c.id === camoId);
    if (!camo) return camoId === "black";
    const owned = (d && d.owned && d.owned.camos) || [];
    const freeDefaults = ["black", "desert", "forest", "arctic"];
    if (freeDefaults.includes(camoId)) return true;
    if (camo.eventOnly && !owned.includes(camoId)) return false;
    if (camo.requireLevel && BH.Progress.getLevel().level < camo.requireLevel) return false;
    if (camo.requireBpTier && BH.Progress.getBpTier() < camo.requireBpTier) return false;
    if (camo.requirePrestige && (d.prestige || 0) < camo.requirePrestige) return false;
    if (camo.shop && !owned.includes(camoId)) return false;
    return true;
  },
  sanitizeCamo(d, camoId) {
    return this.isCamoUnlocked(d, camoId || "black") ? (camoId || "black") : "black";
  },
  titles: [
    "Rekrut", "Gefecht", "Schütze", "Jäger", "Experte",
    "Veteran", "Elite", "Meister", "Legende", "Mythisch",
  ],
  titleForLevel(level) {
    const i = Math.max(0, Math.min(this.titles.length - 1, (level || 1) - 1));
    return this.titles[i];
  },
  progress(d, weaponId) {
    const m = this.get(d, weaponId);
    const max = this.maxLevel || 10;
    const nextUnlock = this.nextUnlock(d, weaponId);
    if (m.level >= max) {
      return {
        level: m.level, xp: m.xp, need: 0, pct: 100,
        title: this.titleForLevel(m.level), maxed: true, nextUnlock: null,
      };
    }
    const need = this.levelXp(m.level);
    return {
      level: m.level,
      xp: m.xp,
      need,
      pct: Math.min(100, (m.xp / need) * 100),
      title: this.titleForLevel(m.level),
      maxed: false,
      nextUnlock,
    };
  },
  addKill(weaponId, headshot) {
    const d = BH.Progress.data;
    const m = this.get(d, weaponId);
    const prevLevel = m.level;
    m.xp += this.xpPerKill + (headshot ? this.xpPerHead : 0);
    while (m.level < this.maxLevel && m.xp >= this.levelXp(m.level)) {
      m.xp -= this.levelXp(m.level);
      m.level++;
    }
    BH.Progress.save();
    const leveled = m.level > prevLevel;
    return {
      level: m.level,
      leveled,
      prevLevel,
      unlocks: leveled ? this.unlocksAtLevel(m.level) : [],
    };
  },
  camoUnlockLevel: 3,
  hasMasteryCamo(d, weaponId) {
    return this.get(d, weaponId).level >= this.camoUnlockLevel;
  },
};

/* ===== SAISON-STORY & FRAKTIONS-BONUS ===== */
BH.SeasonStory = {
  chapters: [
    { name: "Woche 1: Erste Schüsse", matches: 3, text: "Die Vanguard testet die Frontlinie." },
    { name: "Woche 2: Aschefront", matches: 8, text: "Die Stadt brennt – neue Karten gesperrt frei." },
    { name: "Woche 3: Vanguard-Vormarsch", matches: 15, text: "Feindliche Verstärkung an allen Fronten." },
    { name: "Woche 4: Entscheidung", matches: 25, text: "Die Saison kulminiert – Phönix erwartet dich." },
  ],
  chapter(d) {
    const m = d.matches || 0;
    let cur = this.chapters[0], idx = 0;
    for (let i = 0; i < this.chapters.length; i++) {
      if (m >= this.chapters[i].matches) { cur = this.chapters[i]; idx = i; }
    }
    const next = this.chapters[idx + 1];
    const into = m - cur.matches;
    const need = next ? next.matches - cur.matches : 1;
    return { cur, next, into, need, progress: next ? Math.min(100, into / need * 100) : 100, idx };
  },
};

BH.FactionBonus = {
  get(operatorId, mapId) {
    const op = BH.OperatorCatalog
      ? BH.OperatorCatalog.find(operatorId, BH.Progress && BH.Progress.data)
      : BH.OPERATORS.find(o => o.id === operatorId);
    if (!op) return null;
    const f = op.faction;
    if (f === "WÜSTENKORPS" && mapId === "desert") return { label: "+8 % Sprint", sprint: 1.08 };
    if (f === "TF NACHTFALKE" && (mapId === "harbor" || mapId === "city")) return { label: "+5 % Genauigkeit", accuracy: 1.05 };
    if (f === "VANGUARD") return { label: "+5 % Schaden", damage: 1.05 };
    if (f === "MYTHISCH") return { label: "+10 % XP", xp: 1.1 };
    if (f === "PHANTOM-EINHEIT") return { label: "+3 % Bewegung", sprint: 1.03 };
    if (f === "WÜSTENKORPS" && mapId === "arctic") return { label: "+5 % Sprint", sprint: 1.05 };
    if (f === "SCHATTENKOLLEKTIV" && (mapId === "tower" || mapId === "ruins")) return { label: "+6 % Genauigkeit", accuracy: 1.06 };
    return null;
  },
};

/* ===== RANKED ===== */
BH.Ranked = {
  tiers: [
    { name: "BRONZE", min: 0 }, { name: "SILBER", min: 800 }, { name: "GOLD", min: 1600 },
    { name: "PLATIN", min: 2400 }, { name: "DIAMANT", min: 3200 }, { name: "LEGENDE", min: 4000 },
  ],
  tier(lp) {
    let t = this.tiers[0];
    for (const x of this.tiers) if (lp >= x.min) t = x;
    return t;
  },
  update(d, won, kills) {
    if (!d.ranked) d.ranked = { lp: 0, wins: 0, losses: 0 };
    const delta = won ? 25 + kills * 2 : -15 + kills;
    d.ranked.lp = Math.max(0, d.ranked.lp + delta);
    if (won) d.ranked.wins++; else d.ranked.losses++;
    BH.Progress.save();
    return { delta, tier: this.tier(d.ranked.lp) };
  },
};
