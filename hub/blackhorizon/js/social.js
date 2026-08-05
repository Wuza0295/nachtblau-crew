/* Freundesliste & Clans (lokal, per Code teilen) */
window.BH = window.BH || {};

BH.Social = {
  MAX_FRIENDS: 50,
  MAX_CLAN: 20,
  CLAN_XP_PER_LEVEL: 400,
  FRIEND_CODE_PREFIX: "BF1.",
  CLAN_CODE_PREFIX: "BC1.",

  CLAN_DAILY_QUESTS: [
    { id: "d_kills", label: "Front-Einsatz", desc: "20 Kills heute", target: 20, track: "kills", rewardXp: 50, rewardCredits: 100 },
    { id: "d_wins", label: "Siegesserie", desc: "3 Siege heute", target: 3, track: "wins", rewardXp: 70, rewardCredits: 150 },
    { id: "d_matches", label: "Präsenz", desc: "5 Matches heute", target: 5, track: "matches", rewardXp: 40, rewardCredits: 80 },
  ],

  CLAN_WEEKLY_QUESTS: [
    { id: "w_kills", label: "Clan-Offensive", desc: "100 Kills diese Woche", target: 100, track: "kills", rewardXp: 200, rewardCredits: 400, rewardIntel: 30, rewardAlloy: 15, rewardSupplies: 20 },
    { id: "w_wins", label: "Dominanz", desc: "15 Siege diese Woche", target: 15, track: "wins", rewardXp: 250, rewardCredits: 500, rewardIntel: 25, rewardAlloy: 10, rewardSupplies: 35 },
  ],

  CLAN_PERKS: [
    { level: 1, name: "Gründung", perks: ["Clan-Tag im Profil", "Clan-XP durch Matches", "Clan-Aufgaben"] },
    { level: 2, name: "Aktiv", perks: ["+2% Spiel-XP", "+3% Match-Credits"] },
    { level: 3, name: "Verband", perks: ["+4% Spiel-XP", "+6% Match-Credits"] },
    { level: 5, name: "Elite", perks: ["+8% Spiel-XP", "+12% Match-Credits", "Verstärkte Event-Boni"] },
    { level: 7, name: "Veteran", perks: ["+12% Spiel-XP", "+18% Match-Credits"] },
    { level: 10, name: "Legendär", perks: ["+18% Spiel-XP", "+27% Match-Credits", "Max-Clan-Status"] },
  ],

  CLAN_EVENTS: [
    { id: "xp_rush", name: "XP-RUSH", icon: "⚡", desc: "+50% Clan-XP aus Matches diese Woche", xpMult: 1.5 },
    { id: "credit_raid", name: "CREDIT-RAID", icon: "⛁", desc: "+20% Credits für Clan-Mitglieder", creditMult: 1.2 },
    { id: "war_week", name: "KRIEGSWOCHE", icon: "⚔", desc: "Clan-Aufgaben: doppelte Belohnung · Clan-Match-Siege zählen doppelt", questMult: 2, cmWinMult: 2 },
    { id: "unity", name: "EINHEIT", icon: "🛡", desc: "+25% Clan-XP und +10% Credits", xpMult: 1.25, creditMult: 1.1 },
    { id: "hunter", name: "JÄGERTRUPP", icon: "🎯", desc: "Kill-Aufgaben zählen +50% schneller", questTrackMult: 1.5 },
  ],

  /* Schatzkammer — Clan-Ressourcen & Ausbauten */
  CLAN_RESOURCE_LABELS: {
    alloy: { icon: "⚙", name: "Legierung" },
    intel: { icon: "📡", name: "Intel" },
    supplies: { icon: "📦", name: "Vorräte" },
  },

  CLAN_TREASURY_BUILDINGS: [
    {
      id: "vault", name: "Schatzkammer", icon: "🏦", maxLevel: 5,
      desc: "Sichert Clan-Reichtum — +4 % Match-Credits pro Stufe.",
      effectLabel: lvl => `+${lvl * 4} % Credits`,
    },
    {
      id: "command", name: "Kommandozentrale", icon: "🎖", maxLevel: 5,
      desc: "Koordiniert Einsätze — +3 % Spiel-XP pro Stufe.",
      effectLabel: lvl => `+${lvl * 3} % XP`,
    },
    {
      id: "armory", name: "Waffenkammer", icon: "🔫", maxLevel: 5,
      desc: "Rüstet die Front aus — +20 % Legierung aus Matches pro Stufe.",
      effectLabel: lvl => `+${lvl * 20} % Legierung`,
    },
    {
      id: "outpost", name: "Außenposten", icon: "🏚", maxLevel: 5,
      desc: "Sammelt Feld-Intel — +25 % Intel aus Aufgaben pro Stufe.",
      effectLabel: lvl => `+${lvl * 25} % Intel`,
    },
    {
      id: "depot", name: "Versorgungslager", icon: "📦", maxLevel: 5,
      desc: "Lagert Vorräte — +25 % Vorräte aus Siegen & Matches pro Stufe.",
      effectLabel: lvl => `+${lvl * 25} % Vorräte`,
    },
  ],

  _treasuryUpgradeCost(buildingId, targetLevel) {
    const base = { vault: { alloy: 25, intel: 15, supplies: 20 }, command: { alloy: 20, intel: 25, supplies: 15 },
      armory: { alloy: 35, intel: 10, supplies: 25 }, outpost: { alloy: 15, intel: 30, supplies: 20 },
      depot: { alloy: 20, intel: 15, supplies: 35 } };
    const b = base[buildingId] || { alloy: 20, intel: 20, supplies: 20 };
    const scale = targetLevel;
    return {
      alloy: b.alloy + scale * 12,
      intel: b.intel + scale * 10,
      supplies: b.supplies + scale * 12,
    };
  },

  ensureClanTreasury(d) {
    if (!d.clan) return;
    if (!d.clan.resources) d.clan.resources = { alloy: 0, intel: 0, supplies: 0 };
    if (!d.clan.treasury) d.clan.treasury = { vault: 0, command: 0, armory: 0, outpost: 0, depot: 0, horizon: 0 };
    if (d.clan.treasury.horizon == null) d.clan.treasury.horizon = 0;
  },

  addClanResources(d, amounts) {
    this.ensure(d);
    if (!d.clan || !amounts) return;
    this.ensureClanTreasury(d);
    const r = d.clan.resources;
    for (const k of ["alloy", "intel", "supplies"]) {
      if (amounts[k]) r[k] = (r[k] || 0) + amounts[k];
    }
  },

  treasuryBuildingLevel(d, buildingId) {
    if (!d.clan || !d.clan.treasury) return 0;
    return d.clan.treasury[buildingId] || 0;
  },

  treasuryResourceMult(d, buildingId) {
    const lvl = this.treasuryBuildingLevel(d, buildingId);
    if (!lvl) return 1;
    return 1 + lvl * 0.2;
  },

  treasuryCreditsMult(d) {
    const lvl = this.treasuryBuildingLevel(d, "vault");
    return 1 + lvl * 0.04;
  },

  treasuryXpMult(d) {
    const lvl = this.treasuryBuildingLevel(d, "command");
    return 1 + lvl * 0.03;
  },

  getTreasuryUpgradeInfo(d, buildingId) {
    if (!d.clan) return null;
    this.ensureClanTreasury(d);
    const def = this.CLAN_TREASURY_BUILDINGS.find(b => b.id === buildingId);
    if (!def) return null;
    const level = this.treasuryBuildingLevel(d, buildingId);
    if (level >= def.maxLevel) return { def, level, maxed: true };
    const cost = this._treasuryUpgradeCost(buildingId, level + 1);
    const r = d.clan.resources;
    const canAfford = r.alloy >= cost.alloy && r.intel >= cost.intel && r.supplies >= cost.supplies;
    return { def, level, maxed: false, cost, canAfford, nextLevel: level + 1 };
  },

  upgradeTreasury(d, buildingId) {
    this.ensure(d);
    if (!d.clan) return { ok: false, error: "Kein Clan." };
    if (d.clan.role !== "leader") return { ok: false, error: "Nur der Anführer kann ausbauen." };
    const def = this.CLAN_TREASURY_BUILDINGS.find(b => b.id === buildingId);
    if (def && def.s2 && BH.ClanExt && !BH.ClanExt.isLive()) {
      return { ok: false, error: "Ab Saison 2 verfügbar." };
    }
    if (def && def.s2 && BH.SeasonRelease && !BH.SeasonRelease.isS2Feature("battlePass") && !BH.SeasonRelease.isS2Live()) {
      return { ok: false, error: "Horizont-Basis ab Saison 2." };
    }
    const info = this.getTreasuryUpgradeInfo(d, buildingId);
    if (!info) return { ok: false, error: "Unbekanntes Gebäude." };
    if (info.maxed) return { ok: false, error: "Maximale Stufe erreicht." };
    if (!info.canAfford) return { ok: false, error: "Nicht genug Clan-Ressourcen." };
    const r = d.clan.resources;
    r.alloy -= info.cost.alloy;
    r.intel -= info.cost.intel;
    r.supplies -= info.cost.supplies;
    d.clan.treasury[buildingId] = info.nextLevel;
    BH.Progress.save();
    return { ok: true, level: info.nextLevel, building: info.def.name };
  },

  grantMatchResources(d, deltas) {
    if (!d.clan) return null;
    this.ensureClanTreasury(d);
    const kills = deltas?.kills || 0;
    const wins = deltas?.wins || 0;
    let alloy = 2 + Math.min(10, Math.floor(kills / 3));
    let supplies = wins ? 8 : 2;
    alloy = Math.round(alloy * this.treasuryResourceMult(d, "armory"));
    supplies = Math.round(supplies * this.treasuryResourceMult(d, "depot"));
    this.addClanResources(d, { alloy, supplies });
    return { alloy, supplies };
  },

  formatResourceCost(cost) {
    const parts = [];
    for (const k of ["alloy", "intel", "supplies"]) {
      if (!cost[k]) continue;
      const lab = this.CLAN_RESOURCE_LABELS[k];
      parts.push(`${lab.icon} ${cost[k]}`);
    }
    return parts.join(" · ");
  },

  treasuryHorizonCmMult(d) {
    if (BH.ClanExt && !BH.ClanExt.isLive()) return 1;
    const lvl = this.treasuryBuildingLevel(d, "horizon");
    return 1 + lvl * 0.15;
  },

  treasuryTotalLevels(d) {
    if (!d.clan || !d.clan.treasury) return 0;
    return Object.values(d.clan.treasury).reduce((s, v) => s + (v || 0), 0);
  },

  ensure(d) {
    if (typeof d.playerName !== "string") d.playerName = "";
    if (!Array.isArray(d.friends)) d.friends = [];
    if (d.clan === undefined) d.clan = null;
    if (d.clan) {
      if (!Array.isArray(d.clan.members)) d.clan.members = [];
      if (!d.clan.role) d.clan.role = "member";
      if (typeof d.clan.xp !== "number") d.clan.xp = 0;
      for (const m of d.clan.members) {
        if (!m.lastOnlineAt && m.joinedAt) m.lastOnlineAt = m.joinedAt;
        if (!m.lastOnlineAt) m.lastOnlineAt = 0;
      }
      this.ensureClanQuests(d);
      this.ensureClanTreasury(d);
      this.ensureClanMatchStats(d);
      if (BH.ClanChat) BH.ClanChat.ensure(d);
      if (BH.ClanExt) BH.ClanExt.ensure(d);
    }
  },

  ensureClanMatchStats(d) {
    if (!d.clan) return;
    if (!d.clan.clanMatchStats) d.clan.clanMatchStats = { played: 0, wins: 0, windowKey: "" };
  },

  _id(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  _dayKey() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  },

  _weekKey() {
    const n = new Date();
    const start = new Date(n.getFullYear(), 0, 1);
    const week = Math.floor((n - start) / 604800000);
    return `${n.getFullYear()}-W${week}`;
  },

  _weekIndex() {
    const n = new Date();
    const start = new Date(n.getFullYear(), 0, 1);
    return Math.floor((n - start) / 604800000);
  },

  _b64urlEncode(obj) {
    const s = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(s)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },

  _b64urlDecode(str) {
    let s = (str || "").replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return JSON.parse(decodeURIComponent(escape(atob(s))));
  },

  displayName(d) {
    const custom = (d.playerName || "").trim();
    if (custom) return custom.slice(0, 20);
    return BH.Cosmetics ? BH.Cosmetics.displayName(d) : "Spieler";
  },

  touchPresence(d, opts = {}) {
    this.ensure(d);
    if (!d.clan) return;
    const now = Date.now();
    const self = d.clan.members.find(m => m.isSelf);
    if (!self) return;
    if (!opts.force && self.lastOnlineAt && now - self.lastOnlineAt < 30000) return;
    self.lastOnlineAt = now;
    if (opts.save !== false) BH.Progress.save();
  },

  formatLastOnline(ts) {
    if (!ts || ts <= 0) return "Unbekannt";
    const diff = Date.now() - ts;
    if (diff < 120000) return "Gerade online";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return "Vor " + mins + " Min";
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return "Vor " + hours + " Std";
    const days = Math.floor(diff / 86400000);
    if (days < 7) return "Vor " + days + "T";
    try {
      return new Date(ts).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
    } catch (e) {
      return "Vor " + days + "T";
    }
  },

  isRecentlyOnline(ts) {
    return ts && Date.now() - ts < 120000;
  },

  memberPresenceLabel(m) {
    const ts = m.lastOnlineAt || m.joinedAt || 0;
    return this.formatLastOnline(ts);
  },

  syncClanMemberPresence(d) {
    if (!d.clan || !Array.isArray(d.clan.members)) return;
    for (const m of d.clan.members) {
      if (m.isSelf) continue;
      const friend = (d.friends || []).find(f => f.name.toLowerCase() === m.name.toLowerCase());
      if (friend && friend.lastOnlineAt) m.lastOnlineAt = friend.lastOnlineAt;
    }
  },

  sortClanMembers(members) {
    return [...members].sort((a, b) => {
      if (a.isSelf) return -1;
      if (b.isSelf) return 1;
      const aOn = this.isRecentlyOnline(a.lastOnlineAt || a.joinedAt);
      const bOn = this.isRecentlyOnline(b.lastOnlineAt || b.joinedAt);
      if (aOn !== bOn) return aOn ? -1 : 1;
      return (b.lastOnlineAt || b.joinedAt || 0) - (a.lastOnlineAt || a.joinedAt || 0);
    });
  },

  myProfile(d) {
    const lvl = BH.Progress.getLevel();
    const rank = BH.Progress.getRank();
    const kd = d.deaths > 0 ? d.kills / d.deaths : d.kills;
    const em = BH.Cosmetics ? BH.Cosmetics.emblem(d) : null;
    return {
      name: this.displayName(d),
      level: lvl.level,
      prestige: d.prestige || 0,
      rank: rank.name,
      kd: +kd.toFixed(2),
      wins: d.wins || 0,
      matches: d.matches || 0,
      operator: d.operator || "recruit",
      emblem: em ? em.icon : "🎖",
      clanTag: d.clan ? d.clan.tag : null,
      faction: d.factionWar && d.factionWar.pledged ? d.factionWar.faction : null,
    };
  },

  /* ===== KURZ-CODES ===== */
  _packFriend(d) {
    const p = this.myProfile(d);
    return { v: 2, n: p.name, l: p.level, p: p.prestige, k: p.kd, w: p.wins, e: p.emblem, o: p.operator, c: p.clanTag || "", lo: Date.now() };
  },

  _unpackFriend(data) {
    if (!data) return null;
    if (data.v === 1 || data.v === 2) {
      return {
        t: "bh_friend",
        name: data.n,
        level: data.l || 1,
        prestige: data.p || 0,
        kd: data.k || 0,
        wins: data.w || 0,
        emblem: data.e || "🎖",
        operator: data.o || "recruit",
        clanTag: data.c || null,
        rank: "REKRUT",
        matches: 0,
        lastOnlineAt: data.lo || 0,
      };
    }
    return null;
  },

  _packClan(clan) {
    const pack = {
      v: 3,
      n: clan.name,
      g: clan.tag,
      x: clan.xp || 0,
      m: (clan.members || []).filter(m => !m.isSelf).map(m => ({
        n: m.name,
        r: m.role === "leader" ? "l" : (m.role === "officer" ? "o" : "m"),
        lo: m.lastOnlineAt || m.joinedAt || 0,
        e: (m.stats && m.stats.emblem) || "🎖",
        lv: (m.stats && m.stats.level) || 1,
        kd: (m.stats && m.stats.kd) || 0,
      })),
    };
    if (BH.ClanExt && BH.ClanExt.isLive()) Object.assign(pack, BH.ClanExt.packClanExtra(clan));
    return pack;
  },

  friendCode(d) {
    return this.FRIEND_CODE_PREFIX + this._b64urlEncode(this._packFriend(d));
  },

  clanCode(d) {
    if (!d.clan) return "";
    return this.CLAN_CODE_PREFIX + this._b64urlEncode(this._packClan(d.clan));
  },

  _decode(code) {
    try {
      const trimmed = (code || "").trim();
      if (!trimmed) return null;

      if (trimmed.startsWith(this.FRIEND_CODE_PREFIX)) {
        return this._unpackFriend(this._b64urlDecode(trimmed.slice(this.FRIEND_CODE_PREFIX.length)));
      }
      if (trimmed.startsWith(this.CLAN_CODE_PREFIX)) {
        const data = this._b64urlDecode(trimmed.slice(this.CLAN_CODE_PREFIX.length));
        if (data && (data.v === 1 || data.v === 2 || data.v === 3)) {
          const members = (data.m || []).map(m => ({
            name: m.n,
            role: m.r === "l" ? "leader" : (m.r === "o" ? "officer" : "member"),
            lastOnlineAt: m.lo || 0,
            stats: { emblem: m.e || "🎖", level: m.lv || 1, kd: m.kd || 0 },
          }));
          const extra = BH.ClanExt ? BH.ClanExt.unpackClanExtra(data) : {};
          return { t: "bh_clan", name: data.n, tag: data.g, xp: data.x || 0, members, ...extra };
        }
      }

      const json = trimmed.startsWith("{")
        ? trimmed
        : decodeURIComponent(escape(atob(trimmed)));
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  },

  /* ===== FREUNDE ===== */
  addFriendFromCode(d, code) {
    this.ensure(d);
    const data = this._decode(code);
    if (!data || data.t !== "bh_friend" || !data.name) {
      return { ok: false, error: "Ungültiger Freundes-Code." };
    }
    if (data.name === this.displayName(d)) {
      return { ok: false, error: "Das bist du selbst." };
    }
    if (d.friends.some(f => f.name.toLowerCase() === data.name.toLowerCase())) {
      return { ok: false, error: "Freund ist bereits auf der Liste." };
    }
    if (d.friends.length >= this.MAX_FRIENDS) {
      return { ok: false, error: "Freundesliste voll (" + this.MAX_FRIENDS + ")." };
    }
    const friend = {
      id: this._id("f_"),
      name: data.name.slice(0, 24),
      addedAt: Date.now(),
      lastOnlineAt: data.lastOnlineAt || Date.now(),
      source: "code",
      stats: {
        level: data.level || 1,
        prestige: data.prestige || 0,
        rank: data.rank || "REKRUT",
        kd: data.kd || 0,
        wins: data.wins || 0,
        matches: data.matches || 0,
        operator: data.operator || "recruit",
        emblem: data.emblem || "🎖",
        clanTag: data.clanTag || null,
      },
    };
    d.friends.push(friend);
    BH.Progress.save();
    return { ok: true, friend };
  },

  addFriendFromLeaderboard(d, entry) {
    this.ensure(d);
    if (!entry || !entry.name) return { ok: false, error: "Kein Eintrag." };
    if (entry.name === this.displayName(d)) {
      return { ok: false, error: "Das bist du selbst." };
    }
    if (d.friends.some(f => f.name.toLowerCase() === entry.name.toLowerCase())) {
      return { ok: false, error: "Bereits auf der Liste." };
    }
    if (d.friends.length >= this.MAX_FRIENDS) {
      return { ok: false, error: "Freundesliste voll." };
    }
    const friend = {
      id: this._id("f_"),
      name: entry.name.slice(0, 24),
      addedAt: Date.now(),
      source: "leaderboard",
      stats: {
        level: 1,
        prestige: 0,
        rank: "REKRUT",
        kd: entry.kd || 0,
        wins: 0,
        matches: 0,
        operator: "recruit",
        emblem: "🎖",
        clanTag: null,
      },
    };
    d.friends.push(friend);
    BH.Progress.save();
    return { ok: true, friend };
  },

  removeFriend(d, id) {
    this.ensure(d);
    d.friends = d.friends.filter(f => f.id !== id);
    BH.Progress.save();
  },

  /* ===== CLAN ===== */
  normalizeTag(tag) {
    return (tag || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
  },

  clanLevel(clan) {
    if (!clan) return 0;
    return Math.min(10, 1 + Math.floor((clan.xp || 0) / this.CLAN_XP_PER_LEVEL));
  },

  getClanEvent() {
    const idx = Math.abs(this._weekIndex()) % this.CLAN_EVENTS.length;
    return this.CLAN_EVENTS[idx];
  },

  eventXpMult(d) {
    if (!d.clan) return 1;
    const ev = this.getClanEvent();
    return ev && ev.xpMult ? ev.xpMult : 1;
  },

  eventCreditMult(d) {
    if (!d.clan) return 1;
    const ev = this.getClanEvent();
    return ev && ev.creditMult ? ev.creditMult : 1;
  },

  questTrackMult(d) {
    if (!d.clan) return 1;
    const ev = this.getClanEvent();
    return ev && ev.questTrackMult ? ev.questTrackMult : 1;
  },

  questRewardMult(d) {
    if (!d.clan) return 1;
    const ev = this.getClanEvent();
    return ev && ev.questMult ? ev.questMult : 1;
  },

  xpMult(d) {
    const lvl = this.clanLevel(d.clan);
    let base = 1;
    if (lvl <= 1) base = d.clan ? this.eventXpMult(d) * this.treasuryXpMult(d) : 1;
    else base = (1 + (lvl - 1) * 0.02) * this.eventXpMult(d) * this.treasuryXpMult(d);
    if (BH.ClanExt) {
      if (BH.ClanExt.isLive()) {
        base *= BH.ClanExt.activeBuffMult(d, "xp") * BH.ClanExt.streakMult(d);
      }
    }
    return base;
  },

  creditsMult(d) {
    const lvl = this.clanLevel(d.clan);
    const treasury = this.treasuryCreditsMult(d);
    let base = 1;
    if (lvl <= 1) base = d.clan ? this.eventCreditMult(d) * treasury : 1;
    else base = (1 + (lvl - 1) * 0.03) * this.eventCreditMult(d) * treasury;
    if (BH.ClanExt && BH.ClanExt.isLive()) base *= BH.ClanExt.activeBuffMult(d, "credits");
    return base;
  },

  getClanPerksForLevel(level) {
    let row = this.CLAN_PERKS[0];
    for (const p of this.CLAN_PERKS) {
      if (level >= p.level) row = p;
    }
    return row;
  },

  getNextClanPerk(level) {
    for (const p of this.CLAN_PERKS) {
      if (p.level > level) return p;
    }
    return null;
  },

  ensureClanQuests(d) {
    if (!d.clan) return;
    if (!d.clan.quests) {
      d.clan.quests = {
        dailyKey: "",
        weeklyKey: "",
        dailyProg: {},
        dailyDone: [],
        weeklyProg: {},
        weeklyDone: [],
      };
    }
    const q = d.clan.quests;
    const today = this._dayKey();
    const week = this._weekKey();
    if (q.dailyKey !== today) {
      q.dailyKey = today;
      q.dailyProg = {};
      q.dailyDone = [];
    }
    if (q.weeklyKey !== week) {
      q.weeklyKey = week;
      q.weeklyProg = {};
      q.weeklyDone = [];
    }
  },

  getQuestDefs(period) {
    const base = period === "weekly" ? this.CLAN_WEEKLY_QUESTS : this.CLAN_DAILY_QUESTS;
    const s2Ids = new Set(["w_clanmatch", "w_faction", "d_contrib"]);
    const live = BH.ClanExt && BH.ClanExt.isLive();
    let defs = base.filter(q => live || !s2Ids.has(q.id));
    if (live && BH.ClanExt) {
      for (const q of BH.ClanExt.extraQuests(period)) {
        if (!defs.some(x => x.id === q.id)) defs.push(q);
      }
    }
    return defs;
  },

  getQuestRows(d, period) {
    if (!d.clan) return [];
    this.ensureClanQuests(d);
    const q = d.clan.quests;
    const defs = this.getQuestDefs(period);
    const progMap = period === "weekly" ? q.weeklyProg : q.dailyProg;
    const doneList = period === "weekly" ? q.weeklyDone : q.dailyDone;
    const mult = this.questRewardMult(d);

    return defs.map(def => {
      const prog = progMap[def.id] || 0;
      const done = doneList.includes(def.id);
      return {
        id: def.id,
        label: def.label,
        desc: def.desc,
        prog,
        target: def.target,
        done,
        rewardXp: Math.round(def.rewardXp * mult),
        rewardCredits: Math.round(def.rewardCredits * mult),
      };
    });
  },

  _grantQuestReward(d, def, mult) {
    const xp = Math.round(def.rewardXp * mult);
    const credits = Math.round(def.rewardCredits * mult);
    this.addClanXp(d, xp);
    d.credits = (d.credits || 0) + credits;
    const intelMult = this.treasuryResourceMult(d, "outpost");
    const resIntel = Math.round((def.rewardIntel || 12) * mult * intelMult);
    const resAlloy = Math.round((def.rewardAlloy || 5) * mult);
    const resSupplies = Math.round((def.rewardSupplies || 8) * mult);
    this.addClanResources(d, { intel: resIntel, alloy: resAlloy, supplies: resSupplies });
    return { xp, credits, resources: { intel: resIntel, alloy: resAlloy, supplies: resSupplies } };
  },

  _advanceQuests(d, deltas) {
    if (!d.clan) return [];
    this.ensureClanQuests(d);
    const q = d.clan.quests;
    const trackMult = this.questTrackMult(d)
      * (BH.ClanExt && BH.ClanExt.isLive() ? BH.ClanExt.activeBuffMult(d, "questTrack") : 1);
    const k = Math.round((deltas?.kills || 0) * trackMult);
    const w = deltas?.wins || 0;
    const m = 1;
    const cm = deltas?.clanmatches || 0;
    const fk = Math.round((deltas?.factionkills || 0) * trackMult);
    const granted = [];
    const rewardMult = this.questRewardMult(d);

    const bump = (defs, progMap, doneList) => {
      for (const def of defs) {
        if (doneList.includes(def.id)) continue;
        let add = 0;
        if (def.track === "kills") add = k;
        else if (def.track === "wins") add = w;
        else if (def.track === "matches") add = m;
        else if (def.track === "clanmatches") add = cm;
        else if (def.track === "factionkills") add = fk;
        progMap[def.id] = (progMap[def.id] || 0) + add;
        if (progMap[def.id] >= def.target) {
          doneList.push(def.id);
          granted.push({ quest: def, ...this._grantQuestReward(d, def, rewardMult) });
        }
      }
    };

    bump(this.getQuestDefs("daily"), q.dailyProg, q.dailyDone);
    bump(this.getQuestDefs("weekly"), q.weeklyProg, q.weeklyDone);
    if (granted.length) BH.Progress.save();
    return granted;
  },

  createClan(d, name, tag) {
    this.ensure(d);
    if (d.clan) return { ok: false, error: "Du bist bereits in einem Clan." };
    const cName = (name || "").trim().slice(0, 24);
    const cTag = this.normalizeTag(tag);
    if (cName.length < 2) return { ok: false, error: "Clan-Name zu kurz (min. 2 Zeichen)." };
    if (cTag.length < 2) return { ok: false, error: "Clan-Tag min. 2 Zeichen (A–Z, 0–9)." };
    const self = this._selfMember(d, "leader");
    d.clan = {
      name: cName,
      tag: cTag,
      xp: 0,
      role: "leader",
      emblem: "shield",
      motto: "",
      announcement: "",
      createdAt: Date.now(),
      members: [self],
      resources: { alloy: 15, intel: 10, supplies: 10 },
      treasury: { vault: 0, command: 0, armory: 0, outpost: 0, depot: 0, horizon: 0 },
      rival: { tag: "", name: "", weekKey: "", startXp: 0, startQuests: 0 },
      streak: { dayKey: "", count: 0 },
      buffs: [],
      milestonesClaimed: [],
      matchRounds: [],
      horizonMvp: { windowKey: "", name: "", matches: 0 },
      quests: {
        dailyKey: this._dayKey(),
        weeklyKey: this._weekKey(),
        dailyProg: {},
        dailyDone: [],
        weeklyProg: {},
        weeklyDone: [],
      },
    };
    BH.Progress.save();
    if (BH.ClanChat) BH.ClanChat.onClanCreated(d);
    return { ok: true };
  },

  _selfMember(d, role) {
    const p = this.myProfile(d);
    const now = Date.now();
    return {
      id: "self",
      name: p.name,
      role: role || "member",
      isSelf: true,
      joinedAt: now,
      lastOnlineAt: now,
      stats: p,
    };
  },

  leaveClan(d) {
    this.ensure(d);
    if (!d.clan) return { ok: false, error: "Kein Clan." };
    d.clan = null;
    BH.Progress.save();
    return { ok: true };
  },

  inviteFriend(d, friendId) {
    this.ensure(d);
    if (!d.clan) return { ok: false, error: "Kein Clan." };
    const canInvite = d.clan.role === "leader"
      || (BH.ClanExt && BH.ClanExt.isLive() && d.clan.role === "officer");
    if (!canInvite) return { ok: false, error: "Nur Anführer/Offizier kann einladen." };
    if (!d.clan.members) d.clan.members = [];
    const friend = d.friends.find(f => f.id === friendId);
    if (!friend) return { ok: false, error: "Freund nicht gefunden." };
    if (d.clan.members.some(m => m.name.toLowerCase() === friend.name.toLowerCase())) {
      return { ok: false, error: "Bereits im Clan." };
    }
    if (d.clan.members.length >= this.MAX_CLAN) {
      return { ok: false, error: "Clan ist voll (" + this.MAX_CLAN + ")." };
    }
    d.clan.members.push({
      id: friend.id,
      name: friend.name,
      role: "member",
      isSelf: false,
      joinedAt: Date.now(),
      lastOnlineAt: friend.lastOnlineAt || Date.now(),
      stats: { ...friend.stats },
    });
    BH.Progress.save();
    return { ok: true };
  },

  joinClanFromCode(d, code) {
    this.ensure(d);
    if (d.clan) return { ok: false, error: "Verlasse zuerst deinen aktuellen Clan." };
    const data = this._decode(code);
    if (!data || data.t !== "bh_clan" || !data.name || !data.tag) {
      return { ok: false, error: "Ungültiger Clan-Code." };
    }
    const members = (data.members || []).map(m => ({
      id: this._id("m_"),
      name: m.name,
      role: m.role || "member",
      isSelf: false,
      joinedAt: Date.now(),
      lastOnlineAt: m.lastOnlineAt || 0,
      stats: m.stats || {},
    }));
    members.push(this._selfMember(d, "member"));
    d.clan = {
      name: data.name.slice(0, 24),
      tag: this.normalizeTag(data.tag),
      xp: data.xp || 0,
      role: "member",
      emblem: data.emblem || "shield",
      motto: data.motto || "",
      announcement: data.announcement || "",
      createdAt: Date.now(),
      members,
      resources: { alloy: 0, intel: 0, supplies: 0 },
      treasury: { vault: 0, command: 0, armory: 0, outpost: 0, depot: 0, horizon: 0 },
      rival: { tag: "", name: "", weekKey: "", startXp: 0, startQuests: 0 },
      streak: { dayKey: "", count: 0 },
      buffs: [],
      milestonesClaimed: [],
      matchRounds: [],
      horizonMvp: { windowKey: "", name: "", matches: 0 },
      quests: {
        dailyKey: this._dayKey(),
        weeklyKey: this._weekKey(),
        dailyProg: {},
        dailyDone: [],
        weeklyProg: {},
        weeklyDone: [],
      },
    };
    BH.Progress.save();
    if (BH.ClanChat) BH.ClanChat.onClanJoined(d);
    return { ok: true };
  },

  addClanXp(d, amount) {
    this.ensure(d);
    if (!d.clan || amount <= 0) return;
    const before = this.clanLevel(d.clan);
    d.clan.xp = (d.clan.xp || 0) + amount;
    const after = this.clanLevel(d.clan);
    BH.Progress.save();
    return { leveled: after > before, level: after };
  },

  trackMatch(d, deltas) {
    if (!d.clan) return null;
    let xp = 8;
    if (deltas && deltas.wins) xp += 30 * deltas.wins;
    if (deltas && deltas.kills) xp += Math.min(20, deltas.kills * 2);
    xp = Math.round(xp * this.eventXpMult(d));
    let clanTokenBonus = 0;
    if (BH.BpXpTokens) {
      const applied = BH.BpXpTokens.applyClanXp(d, xp);
      clanTokenBonus = applied.bonus;
      xp = applied.add;
    }
    const levelResult = this.addClanXp(d, xp);
    const questRewards = this._advanceQuests(d, deltas);
    let resources = this.grantMatchResources(d, deltas);
    const facBonus = BH.ClanExt && BH.ClanExt.isLive() ? BH.ClanExt.factionClanBonus(d) : null;
    if (facBonus && resources) {
      if (facBonus.mult > 1) {
        if (resources.alloy) resources.alloy = Math.round(resources.alloy * facBonus.mult);
        if (resources.supplies) resources.supplies = Math.round(resources.supplies * facBonus.mult);
      }
      const extraIntel = facBonus.intelBonus || 0;
      if (extraIntel) {
        this.addClanResources(d, { intel: extraIntel });
        resources.intel = (resources.intel || 0) + extraIntel;
      }
    }
    if (BH.ClanExt && BH.ClanExt.isLive()) {
      BH.ClanExt.recordContribution(d, deltas || {}, {
        clanXp: xp,
        quests: questRewards.length,
      });
      BH.ClanExt.recordMatchEnd(d, deltas || {}, {});
      if (questRewards.length) BH.ClanExt.syncUnlockedTitles(d);
    }
    return { ...levelResult, questRewards, clanXp: xp, clanTokenBonus, resources, facBonus };
  },

  compareRivalClan(d, code) {
    this.ensure(d);
    if (!d.clan) return { ok: false, error: "Du bist in keinem Clan." };
    const data = this._decode(code);
    if (!data || data.t !== "bh_clan" || !data.name) {
      return { ok: false, error: "Ungültiger Clan-Code." };
    }
    const rivalXp = data.xp || 0;
    const rivalLvl = Math.min(10, 1 + Math.floor(rivalXp / this.CLAN_XP_PER_LEVEL));
    const myLvl = this.clanLevel(d.clan);
    const myXpIn = (d.clan.xp || 0) % this.CLAN_XP_PER_LEVEL;
    const rivalXpIn = rivalXp % this.CLAN_XP_PER_LEVEL;
    const daily = this.getQuestRows(d, "daily").filter(q => q.done).length;
    const weekly = this.getQuestRows(d, "weekly").filter(q => q.done).length;
    return {
      ok: true,
      yours: {
        name: d.clan.name,
        tag: d.clan.tag,
        level: myLvl,
        xp: d.clan.xp || 0,
        xpIn: myXpIn,
        members: (d.clan.members || []).length,
        questsDone: daily + weekly,
      },
      rival: {
        name: data.name,
        tag: data.tag,
        level: rivalLvl,
        xp: rivalXp,
        xpIn: rivalXpIn,
        members: (data.members && data.members.length) || 1,
        questsDone: null,
      },
    };
  },
};
