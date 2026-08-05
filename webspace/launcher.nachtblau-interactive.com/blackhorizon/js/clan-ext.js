/* Clan-Erweiterungen — Identität, Rivalen, Shop, Beiträge, S2-Matches */
window.BH = window.BH || {};

BH.ClanExt = {
  CLAN_EMBLEMS: [
    { id: "shield", icon: "🛡", name: "Schild", minLevel: 1 },
    { id: "skull", icon: "💀", name: "Totenkopf", minLevel: 2 },
    { id: "eagle", icon: "🦅", name: "Adler", minLevel: 3 },
    { id: "star", icon: "⭐", name: "Stern", minLevel: 5 },
    { id: "horizon", icon: "🌑", name: "Horizont", minLevel: 7, s2: true },
    { id: "crown", icon: "👑", name: "Krone", minLevel: 10 },
  ],

  CLAN_TITLES: [
    { id: "clan_member", name: "Clan-Mitglied", icon: "⚔", minLevel: 1 },
    { id: "clan_veteran", name: "Horizont-Veteran", icon: "🏰", minLevel: 5 },
    { id: "clan_elite", name: "Clan-Elite", icon: "🎖", minLevel: 7 },
    { id: "clan_legend", name: "Legendär", icon: "👑", minLevel: 10 },
    { id: "clan_striker", name: "Clan-Stürmer", icon: "⚡", cmWins: 10 },
    { id: "clan_horizon", name: "Horizont-Champion", icon: "🌑", cmWins: 25 },
  ],

  CLAN_SHOP: [
    { id: "xp_boost", name: "XP-Schub", icon: "⚡", desc: "+15 % Spiel-XP · 24 h",
      cost: { alloy: 30, intel: 20, supplies: 25 }, buff: "xp", mult: 1.15, hours: 24 },
    { id: "credit_boost", name: "Credit-Raid", icon: "⛁", desc: "+12 % Match-Credits · 24 h",
      cost: { alloy: 25, intel: 15, supplies: 30 }, buff: "credits", mult: 1.12, hours: 24 },
    { id: "quest_boost", name: "Auftrags-Boost", icon: "📋", desc: "Clan-Aufgaben +50 % Fortschritt · 12 h",
      cost: { alloy: 20, intel: 35, supplies: 15 }, buff: "questTrack", mult: 1.5, hours: 12 },
    { id: "cm_boost", name: "Match-Fokus", icon: "🎯", desc: "+25 % Clan-XP in Clan-Matches · 48 h",
      cost: { alloy: 40, intel: 25, supplies: 35 }, buff: "cmXp", mult: 1.25, hours: 48 },
  ],

  TREASURY_MILESTONES: [
    { total: 10, reward: { credits: 500, title: "clan_veteran" }, label: "Schatzkammer St. 10" },
    { total: 15, reward: { credits: 800, emblem: "star" }, label: "Schatzkammer St. 15" },
    { total: 20, reward: { credits: 1200, title: "clan_elite" }, label: "Schatzkammer Max" },
  ],

  RIVAL_TEAM_TAGS: ["RIVAL", "FOE", "NEMESIS", "OUTCAST", "PHANTOM"],

  DONATE_RATE: 100,

  /** Alle Clan-Erweiterungen (Identität, Shop, Rivalen, CM, …) ab Saison 2 */
  isLive() {
    if (!BH.SeasonRelease) return false;
    return BH.SeasonRelease.isS2Feature("clanExt") || BH.SeasonRelease.isS2Live();
  },

  EXTRA_WEEKLY_QUESTS: [
    { id: "w_clanmatch", label: "Clan-Match", desc: "3 Clan-Matches diese Woche", target: 3, track: "clanmatches",
      rewardXp: 180, rewardCredits: 350, rewardIntel: 20, rewardAlloy: 12, rewardSupplies: 18 },
    { id: "w_faction", label: "Fraktions-Einsatz", desc: "40 Fraktions-Kills diese Woche", target: 40, track: "factionkills",
      rewardXp: 160, rewardCredits: 300, rewardIntel: 35, rewardAlloy: 8, rewardSupplies: 15 },
  ],

  EXTRA_DAILY_QUESTS: [
    { id: "d_contrib", label: "Einsatz", desc: "30 Kills heute (Clan)", target: 30, track: "kills",
      rewardXp: 55, rewardCredits: 110 },
  ],

  extraQuests(period) {
    if (!this.isLive()) return [];
    return period === "weekly" ? this.EXTRA_WEEKLY_QUESTS : this.EXTRA_DAILY_QUESTS;
  },

  ensure(d) {
    if (!d) return;
    if (!d.owned) d.owned = {};
    if (!Array.isArray(d.owned.clanTitles)) d.owned.clanTitles = [];
    if (!d.clan) return;
    if (!this.isLive()) return;
    const c = d.clan;
    if (!c.emblem) c.emblem = "shield";
    if (typeof c.motto !== "string") c.motto = "";
    if (typeof c.announcement !== "string") c.announcement = "";
    if (!c.rival) c.rival = { tag: "", name: "", weekKey: "", startXp: 0, startQuests: 0 };
    if (!c.streak) c.streak = { dayKey: "", count: 0 };
    if (!Array.isArray(c.buffs)) c.buffs = [];
    if (!Array.isArray(c.milestonesClaimed)) c.milestonesClaimed = [];
    if (!Array.isArray(c.matchRounds)) c.matchRounds = [];
    if (!c.horizonMvp) c.horizonMvp = { windowKey: "", name: "", matches: 0 };
    if (!c.treasury) c.treasury = { vault: 0, command: 0, armory: 0, outpost: 0, depot: 0, horizon: 0 };
    if (c.treasury.horizon == null) c.treasury.horizon = 0;
    this._purgeBuffs(c);
    for (const m of c.members || []) {
      if (!m.weekContrib) m.weekContrib = { xp: 0, kills: 0, quests: 0, cmWins: 0, key: "" };
      this._ensureMemberWeek(m);
    }
    this._ensureRivalWeek(d);
    this.syncUnlockedTitles(d);
  },

  _ensureMemberWeek(m) {
    const wk = BH.Social ? BH.Social._weekKey() : "";
    if (m.weekContrib.key !== wk) {
      m.weekContrib = { xp: 0, kills: 0, quests: 0, cmWins: 0, key: wk };
    }
  },

  _purgeBuffs(c) {
    const now = Date.now();
    c.buffs = (c.buffs || []).filter(b => b.expiresAt > now);
  },

  _ensureRivalWeek(d) {
    if (!d.clan || !BH.Social) return;
    const wk = BH.Social._weekKey();
    if (d.clan.rival.weekKey !== wk) {
      d.clan.rival.weekKey = wk;
      d.clan.rival.startXp = d.clan.xp || 0;
      d.clan.rival.startQuests = this._questsDoneCount(d);
    }
  },

  _questsDoneCount(d) {
    if (!d.clan || !d.clan.quests) return 0;
    const q = d.clan.quests;
    return (q.dailyDone || []).length + (q.weeklyDone || []).length;
  },

  isLeader(d) {
    return !!(d.clan && d.clan.role === "leader");
  },

  isOfficer(d) {
    if (!this.isLive()) return false;
    return !!(d.clan && (d.clan.role === "leader" || d.clan.role === "officer"));
  },

  canManageMembers(d) {
    return this.isLeader(d);
  },

  canInvite(d) {
    return this.isOfficer(d);
  },

  canEditMeta(d) {
    return this.isLeader(d);
  },

  emblemDef(id) {
    return this.CLAN_EMBLEMS.find(e => e.id === id) || this.CLAN_EMBLEMS[0];
  },

  clanEmblemIcon(clan) {
    if (!clan) return "⚔";
    const def = this.emblemDef(clan.emblem);
    return def.icon;
  },

  setEmblem(d, emblemId) {
    if (!this.isLive()) return { ok: false, error: "Ab Saison 2 verfügbar." };
    this.ensure(d);
    if (!this.canEditMeta(d)) return { ok: false, error: "Nur Anführer." };
    const def = this.CLAN_EMBLEMS.find(e => e.id === emblemId);
    if (!def) return { ok: false, error: "Unbekanntes Emblem." };
    const lvl = BH.Social.clanLevel(d.clan);
    if (lvl < def.minLevel) return { ok: false, error: "Clan-Level zu niedrig." };
    if (def.s2 && BH.SeasonRelease && !BH.SeasonRelease.isS2Feature("battlePass") && !BH.SeasonRelease.isS2Live()) {
      return { ok: false, error: "Ab Saison 2." };
    }
    d.clan.emblem = emblemId;
    BH.Progress.save();
    return { ok: true, emblem: def };
  },

  setMotto(d, text) {
    if (!this.isLive()) return { ok: false, error: "Ab Saison 2 verfügbar." };
    this.ensure(d);
    if (!this.canEditMeta(d)) return { ok: false, error: "Nur Anführer." };
    d.clan.motto = (text || "").trim().slice(0, 80);
    BH.Progress.save();
    return { ok: true };
  },

  setAnnouncement(d, text) {
    if (!this.isLive()) return { ok: false, error: "Ab Saison 2 verfügbar." };
    this.ensure(d);
    if (!this.canEditMeta(d)) return { ok: false, error: "Nur Anführer." };
    d.clan.announcement = (text || "").trim().slice(0, 120);
    BH.Progress.save();
    return { ok: true };
  },

  setClanTitle(d, titleId) {
    if (!this.isLive()) return { ok: false, error: "Ab Saison 2 verfügbar." };
    this.ensure(d);
    if (!titleId) { d.clanTitle = null; BH.Progress.save(); return { ok: true }; }
    if (!d.owned.clanTitles.includes(titleId)) return { ok: false, error: "Titel nicht freigeschaltet." };
    d.clanTitle = titleId;
    BH.Progress.save();
    return { ok: true };
  },

  titleDef(id) {
    return this.CLAN_TITLES.find(t => t.id === id);
  },

  activeTitleLabel(d) {
    if (!d.clanTitle) return "";
    const t = this.titleDef(d.clanTitle);
    return t ? t.icon + " " + t.name : "";
  },

  syncUnlockedTitles(d) {
    if (!this.isLive()) return;
    if (!d.clan || !BH.Social) return;
    const lvl = BH.Social.clanLevel(d.clan);
    const cmWins = this.totalCmWins(d);
    for (const t of this.CLAN_TITLES) {
      if (d.owned.clanTitles.includes(t.id)) continue;
      if (t.minLevel && lvl >= t.minLevel) d.owned.clanTitles.push(t.id);
      if (t.cmWins && cmWins >= t.cmWins) d.owned.clanTitles.push(t.id);
    }
    for (const ms of this.TREASURY_MILESTONES) {
      if (ms.reward.title && (d.clan.milestonesClaimed || []).includes(ms.total)) {
        if (!d.owned.clanTitles.includes(ms.reward.title)) d.owned.clanTitles.push(ms.reward.title);
      }
    }
  },

  totalCmWins(d) {
    if (!d.clan || !d.clan.matchRounds) return 0;
    return d.clan.matchRounds.reduce((s, r) => s + (r.wins || 0), 0);
  },

  promoteMember(d, memberId) {
    if (!this.isLive()) return { ok: false, error: "Ab Saison 2 verfügbar." };
    this.ensure(d);
    if (!this.isLeader(d)) return { ok: false, error: "Nur Anführer." };
    const m = d.clan.members.find(x => x.id === memberId);
    if (!m || m.isSelf) return { ok: false, error: "Mitglied nicht gefunden." };
    const officers = d.clan.members.filter(x => x.role === "officer" && !x.isSelf).length;
    if (m.role === "officer") return { ok: false, error: "Bereits Offizier." };
    if (officers >= 2) return { ok: false, error: "Max. 2 Offiziere." };
    m.role = "officer";
    BH.Progress.save();
    return { ok: true };
  },

  demoteMember(d, memberId) {
    if (!this.isLive()) return { ok: false, error: "Ab Saison 2 verfügbar." };
    this.ensure(d);
    if (!this.isLeader(d)) return { ok: false, error: "Nur Anführer." };
    const m = d.clan.members.find(x => x.id === memberId);
    if (!m || m.role !== "officer") return { ok: false, error: "Kein Offizier." };
    m.role = "member";
    BH.Progress.save();
    return { ok: true };
  },

  setRival(d, code) {
    if (!this.isLive()) return { ok: false, error: "Ab Saison 2 verfügbar." };
    this.ensure(d);
    if (!d.clan) return { ok: false, error: "Kein Clan." };
    if (!this.isOfficer(d)) return { ok: false, error: "Nur Anführer/Offizier." };
    const data = BH.Social._decode(code);
    if (!data || data.t !== "bh_clan" || !data.name) {
      return { ok: false, error: "Ungültiger Clan-Code." };
    }
    if (data.tag === d.clan.tag) return { ok: false, error: "Das ist euer eigener Clan." };
    d.clan.rival.tag = data.tag;
    d.clan.rival.name = data.name;
    d.clan.rival.weekKey = BH.Social._weekKey();
    d.clan.rival.startXp = d.clan.xp || 0;
    d.clan.rival.startQuests = this._questsDoneCount(d);
    d.clan.rival.rivalXp = data.xp || 0;
    BH.Progress.save();
    return { ok: true, rival: { tag: data.tag, name: data.name } };
  },

  rivalWeekStatus(d) {
    this.ensure(d);
    if (!d.clan || !d.clan.rival.tag) return null;
    const gainedXp = (d.clan.xp || 0) - (d.clan.rival.startXp || 0);
    const gainedQuests = this._questsDoneCount(d) - (d.clan.rival.startQuests || 0);
    return {
      tag: d.clan.rival.tag,
      name: d.clan.rival.name,
      gainedXp: Math.max(0, gainedXp),
      gainedQuests: Math.max(0, gainedQuests),
      weekKey: d.clan.rival.weekKey,
    };
  },

  recordContribution(d, deltas, extras) {
    if (!d.clan || !BH.Social) return;
    this.ensure(d);
    const self = d.clan.members.find(m => m.isSelf);
    if (!self) return;
    this._ensureMemberWeek(self);
    const c = self.weekContrib;
    if (deltas.kills) c.kills += deltas.kills;
    if (extras && extras.clanXp) c.xp += extras.clanXp;
    if (extras && extras.quests) c.quests += extras.quests;
    if (extras && extras.cmWin) c.cmWins += 1;
  },

  updateStreak(d) {
    if (!d.clan || !BH.Social) return null;
    this.ensure(d);
    const today = BH.Social._dayKey();
    const st = d.clan.streak;
    if (st.dayKey === today) return st;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    if (st.dayKey === yKey) st.count = (st.count || 0) + 1;
    else st.count = 1;
    st.dayKey = today;
    return st;
  },

  streakMult(d) {
    if (!this.isLive()) return 1;
    if (!d.clan || !d.clan.streak) return 1;
    const c = d.clan.streak.count || 0;
    if (c >= 7) return 1.15;
    if (c >= 3) return 1.08;
    return 1;
  },

  activeBuffMult(d, type) {
    if (!this.isLive() || !d.clan) return 1;
    this._purgeBuffs(d.clan);
    let m = 1;
    for (const b of d.clan.buffs || []) {
      if (b.type === type && b.mult) m *= b.mult;
    }
    return m;
  },

  buyShopItem(d, itemId) {
    if (!this.isLive()) return { ok: false, error: "Ab Saison 2 verfügbar." };
    this.ensure(d);
    if (!d.clan) return { ok: false, error: "Kein Clan." };
    if (!this.isOfficer(d)) return { ok: false, error: "Nur Anführer/Offizier." };
    const item = this.CLAN_SHOP.find(x => x.id === itemId);
    if (!item) return { ok: false, error: "Unbekannter Artikel." };
    const r = d.clan.resources || {};
    for (const k of ["alloy", "intel", "supplies"]) {
      if ((r[k] || 0) < (item.cost[k] || 0)) {
        return { ok: false, error: "Nicht genug Clan-Ressourcen." };
      }
    }
    for (const k of ["alloy", "intel", "supplies"]) r[k] -= item.cost[k] || 0;
    d.clan.buffs.push({
      id: item.id,
      type: item.buff,
      mult: item.mult,
      expiresAt: Date.now() + item.hours * 3600000,
    });
    BH.Progress.save();
    return { ok: true, item };
  },

  donateCredits(d, amount) {
    if (!this.isLive()) return { ok: false, error: "Ab Saison 2 verfügbar." };
    this.ensure(d);
    if (!d.clan) return { ok: false, error: "Kein Clan." };
    const n = Math.round(Number(amount));
    if (!n || n < this.DONATE_RATE) return { ok: false, error: "Mindestens " + this.DONATE_RATE + " ⛁." };
    if ((d.credits || 0) < n) return { ok: false, error: "Zu wenig Credits." };
    d.credits -= n;
    const packs = Math.floor(n / this.DONATE_RATE);
    const gain = { alloy: packs * 3, intel: packs * 2, supplies: packs * 4 };
    BH.Social.addClanResources(d, gain);
    BH.Progress.save();
    return { ok: true, gain, spent: n };
  },

  factionClanBonus(d) {
    if (!d.clan || !d.factionWar || !d.factionWar.pledged || !BH.FactionWar) return null;
    const myFac = d.factionWar.faction;
    if (!myFac) return null;
    let same = 0;
    let total = 0;
    for (const m of d.clan.members || []) {
      total++;
      const fac = m.stats && m.stats.faction;
      if (fac === myFac) same++;
    }
    if (total === 0) return null;
    const ratio = same / total;
    if (ratio < 0.5) return null;
    return { mult: 1.05, intelBonus: 2, label: "Fraktions-Einheit (+5 % Clan-Ressourcen)" };
  },

  checkTreasuryMilestones(d) {
    if (!this.isLive()) return [];
    if (!d.clan || !BH.Social) return [];
    this.ensure(d);
    const total = BH.Social.treasuryTotalLevels(d);
    const granted = [];
    for (const ms of this.TREASURY_MILESTONES) {
      if (total < ms.total) continue;
      if (d.clan.milestonesClaimed.includes(ms.total)) continue;
      d.clan.milestonesClaimed.push(ms.total);
      if (ms.reward.credits) d.credits = (d.credits || 0) + ms.reward.credits;
      if (ms.reward.title && !d.owned.clanTitles.includes(ms.reward.title)) {
        d.owned.clanTitles.push(ms.reward.title);
      }
      if (ms.reward.emblem) d.clan.emblem = ms.reward.emblem;
      granted.push(ms);
    }
    if (granted.length) {
      this.syncUnlockedTitles(d);
      BH.Progress.save();
    }
    return granted;
  },

  recordMatchEnd(d, deltas, ctx) {
    if (!d.clan || !BH.Social) return null;
    this.ensure(d);
    const out = { streak: this.updateStreak(d), milestones: [], rival: null };
    const streakM = this.streakMult(d);
    if (streakM > 1 && ctx) ctx.streakMult = streakM;
    out.milestones = this.checkTreasuryMilestones(d);
    out.rival = this.rivalWeekStatus(d);
    this.syncUnlockedTitles(d);
    return out;
  },

  killfeedName(d, name) {
    if (!this.isLive()) return name;
    if (!d.clan || !d.clan.tag) return name;
    if (d.settings && d.settings.clanTagKillfeed === false) return name;
    return "[" + d.clan.tag + "] " + name;
  },

  packClanExtra(clan) {
    return {
      e: clan.emblem || "shield",
      o: (clan.motto || "").slice(0, 80),
      a: (clan.announcement || "").slice(0, 120),
    };
  },

  unpackClanExtra(data) {
    return {
      emblem: data.e || "shield",
      motto: data.o || "",
      announcement: data.a || "",
    };
  },

  buildRecap(d) {
    if (!d.clan || !BH.Social) return null;
    this.ensure(d);
    const c = d.clan;
    const lvl = BH.Social.clanLevel(c);
    const self = c.members.find(m => m.isSelf);
    const wc = self && self.weekContrib ? self.weekContrib : {};
    const bestRound = (c.matchRounds || []).slice().sort((a, b) => (b.wins || 0) - (a.wins || 0))[0];
    return {
      name: c.name,
      tag: c.tag,
      level: lvl,
      xp: c.xp || 0,
      members: c.members.length,
      treasury: BH.Social.treasuryTotalLevels(d),
      streak: c.streak.count || 0,
      weekXp: wc.xp || 0,
      weekKills: wc.kills || 0,
      cmWins: this.totalCmWins(d),
      bestRound,
      emblem: this.clanEmblemIcon(c),
    };
  },

  renderEndBlock(d, extras) {
    if (!d.clan || !BH.Social || !this.isLive()) return "";
    this.ensure(d);
    const lvl = BH.Social.clanLevel(d.clan);
    const st = d.clan.streak.count || 0;
    let html =
      `<div class="end-clan-block">` +
      `<div class="ecb-head">${this.clanEmblemIcon(d.clan)} CLAN · [${d.clan.tag}] ${d.clan.name}</div>` +
      `<div class="ecb-grid">` +
      `<div class="ecb-stat"><span>Level</span><b>${lvl}</b></div>` +
      `<div class="ecb-stat"><span>Streak</span><b>${st}T</b></div>`;
    if (extras && extras.clanUp && extras.clanUp.leveled) {
      html += `<div class="ecb-stat highlight"><span>Level-Up!</span><b>↑</b></div>`;
    }
    if (extras && extras.cmStats) {
      html += `<div class="ecb-stat"><span>CM-Runde</span><b>${extras.cmStats.wins}W</b></div>`;
    }
    html += `</div></div>`;
    return html;
  },

  AI_CLANS: [
    {
      id: "nachtfalke_elite", name: "NACHTFALKE ELITE", tag: "NFEL", emblem: "eagle",
      motto: "Die Linie hält — auch im Dunkeln.", faction: "TF NACHTFALKE", factionLabel: "TF Nachtfalke",
      focus: "Fraktionskrieg · TDM · Aufträge", featured: true,
      desc: "Elite-Trupp der Task Force. Aktive Offiziere, tägliche Clan-Quests und Fraktions-Sync.",
      xp: 1400, announcement: "Kriegswoche — Daily-Quests heute abschließen!",
      resources: { alloy: 90, intel: 55, supplies: 70 },
      treasury: { vault: 2, command: 2, armory: 1, outpost: 2, depot: 1, horizon: 0 },
      members: [
        { name: "KOMMANDANT-K", role: "leader", level: 44, kd: 1.82, emblem: "🦅", online: true, wins: 120 },
        { name: "SIGMA-03", role: "officer", level: 36, kd: 1.55, emblem: "⚔", online: true, wins: 85 },
        { name: "NACHTJÄGER", role: "officer", level: 31, kd: 1.41, emblem: "🎯", online: false, wins: 62 },
        { name: "FALKE-7", role: "member", level: 28, kd: 1.28, emblem: "🎖", online: true, wins: 48 },
        { name: "STURM-ECHO", role: "member", level: 24, kd: 1.15, emblem: "🛡", online: false, wins: 35 },
        { name: "LUX-12", role: "member", level: 22, kd: 1.05, emblem: "⭐", online: false, wins: 28 },
      ],
    },
    {
      id: "vanguard_strike", name: "VANGUARD STRIKE", tag: "VSTK", emblem: "skull",
      motto: "Vorstoß ohne Gnade.", faction: "VANGUARD", factionLabel: "Vanguard",
      focus: "Aggressiv · Clan-Matches · Credits",
      desc: "Harte Frontkämpfer. Viel Clan-XP aus Siegen, Credit-Raid-Events bevorzugt.",
      xp: 900, announcement: "Clan-Match live — wer mitspielt, kriegt Bonus-XP.",
      resources: { alloy: 110, intel: 30, supplies: 55 },
      treasury: { vault: 3, command: 1, armory: 2, outpost: 0, depot: 2, horizon: 0 },
      members: [
        { name: "OVERLORD-V", role: "leader", level: 38, kd: 1.65, emblem: "💀", online: true, wins: 95 },
        { name: "BRECHER-X", role: "officer", level: 33, kd: 1.48, emblem: "🔥", online: false, wins: 70 },
        { name: "CINDER-9", role: "member", level: 27, kd: 1.32, emblem: "⚡", online: true, wins: 52 },
        { name: "SLAG-01", role: "member", level: 25, kd: 1.18, emblem: "🎖", online: false, wins: 40 },
        { name: "VORTEX", role: "member", level: 21, kd: 1.02, emblem: "🛡", online: false, wins: 30 },
      ],
    },
    {
      id: "wuestenwolf", name: "WÜSTENWOLF", tag: "WOLF", emblem: "shield",
      motto: "Ausdauer schlägt Tempo.", faction: "WÜSTENKORPS", factionLabel: "Wüstenkorps",
      focus: "Ausdauer · Schatzkammer · Ressourcen",
      desc: "Wüstenkorps-Veteranen mit starker Schatzkammer. Ideal für stetigen Fortschritt.",
      xp: 850,
      resources: { alloy: 70, intel: 40, supplies: 95 },
      treasury: { vault: 2, command: 2, armory: 1, outpost: 1, depot: 3, horizon: 0 },
      members: [
        { name: "KARST-F", role: "leader", level: 35, kd: 1.38, emblem: "🏜", online: false, wins: 78 },
        { name: "DÜNE-SCOUT", role: "officer", level: 29, kd: 1.22, emblem: "🎯", online: true, wins: 55 },
        { name: "FROST-LINE", role: "member", level: 26, kd: 1.14, emblem: "❄", online: false, wins: 42 },
        { name: "SANDWACHT", role: "member", level: 23, kd: 1.08, emblem: "🎖", online: true, wins: 33 },
        { name: "MIRAGE-2", role: "member", level: 20, kd: 0.98, emblem: "⭐", online: false, wins: 25 },
      ],
    },
    {
      id: "schattenzell", name: "SCHATTENZELL", tag: "SHNW", emblem: "horizon",
      motto: "Kein Ping. Kein Zeuge.", faction: "SCHATTENKOLLEKTIV", factionLabel: "Schattenkollektiv",
      focus: "Intel · Aufklärung · S2-Horizont", featured: true,
      desc: "Geister des Kollektivs. Hoher Intel-Gewinn, Horizont-Basis ausgebaut.",
      xp: 1800, announcement: "Horizont-Match-Fenster — Karten-Fokus beachten!",
      resources: { alloy: 55, intel: 120, supplies: 60 },
      treasury: { vault: 1, command: 2, armory: 0, outpost: 4, depot: 1, horizon: 2 },
      members: [
        { name: "GEIST-9", role: "leader", level: 48, kd: 1.91, emblem: "🌑", online: true, wins: 140 },
        { name: "NULL-RUNNER", role: "officer", level: 40, kd: 1.72, emblem: "👁", online: true, wins: 98 },
        { name: "PHANTOM-9", role: "officer", level: 37, kd: 1.58, emblem: "💠", online: false, wins: 82 },
        { name: "RABE-EYE", role: "member", level: 32, kd: 1.35, emblem: "🎯", online: true, wins: 60 },
        { name: "STATIC", role: "member", level: 28, kd: 1.20, emblem: "🎖", online: false, wins: 45 },
        { name: "VOID-3", role: "member", level: 25, kd: 1.10, emblem: "⚡", online: false, wins: 36 },
        { name: "ECHO-NULL", role: "member", level: 22, kd: 1.00, emblem: "🛡", online: false, wins: 28 },
      ],
    },
    {
      id: "aschenfront", name: "ASCHENFRONT", tag: "ASCH", emblem: "shield",
      motto: "Saison 1 — wir waren zuerst.", faction: null, factionLabel: "Alle Fraktionen",
      focus: "Einsteiger · Daily Quests · Fair",
      desc: "Freundlicher Einstiegs-Clan. Niedrige Anforderungen, hilfsbereite KI-Mitglieder.",
      xp: 350, featured: true,
      resources: { alloy: 35, intel: 25, supplies: 30 },
      treasury: { vault: 1, command: 1, armory: 0, outpost: 0, depot: 1, horizon: 0 },
      members: [
        { name: "REKRUT-A", role: "leader", level: 18, kd: 1.05, emblem: "🎖", online: true, wins: 22 },
        { name: "ROOKIE-2", role: "officer", level: 15, kd: 0.95, emblem: "⭐", online: true, wins: 15 },
        { name: "GRÜNSPAN", role: "member", level: 12, kd: 0.88, emblem: "🛡", online: false, wins: 10 },
        { name: "FRONTLINER", role: "member", level: 11, kd: 0.82, emblem: "⚔", online: false, wins: 8 },
      ],
    },
    {
      id: "black_horizon", name: "BLACK HORIZON", tag: "BHZN", emblem: "crown",
      motto: "Schwarzer Horizont — ohne Kompromiss.", faction: null, factionLabel: "Mixed",
      focus: "Endgame · Level 8+ · Clan-Matches",
      desc: "Top-Clan der Region. Hohe Schatzkammer, starke CM-Statistik — für Veteranen.",
      xp: 2400,
      resources: { alloy: 130, intel: 80, supplies: 100 },
      treasury: { vault: 4, command: 3, armory: 3, outpost: 2, depot: 3, horizon: 1 },
      members: [
        { name: "HORIZON-PRIME", role: "leader", level: 55, kd: 2.05, emblem: "👑", online: true, wins: 200 },
        { name: "ZERO-CMD", role: "officer", level: 46, kd: 1.78, emblem: "🌑", online: true, wins: 150 },
        { name: "SPECTRE-X", role: "officer", level: 42, kd: 1.65, emblem: "💀", online: false, wins: 120 },
        { name: "TOWER-DROP", role: "member", level: 38, kd: 1.50, emblem: "🏙", online: true, wins: 95 },
        { name: "PHÖNIX-7", role: "member", level: 34, kd: 1.38, emblem: "🔥", online: false, wins: 75 },
        { name: "NACHTFALKE-Ω", role: "member", level: 30, kd: 1.25, emblem: "🦅", online: false, wins: 58 },
        { name: "BRECHER-Z", role: "member", level: 28, kd: 1.18, emblem: "⚔", online: true, wins: 48 },
        { name: "FLUSS-SIG", role: "member", level: 26, kd: 1.10, emblem: "🎖", online: false, wins: 40 },
      ],
    },
    {
      id: "eisernes_komando", name: "EISERNES KOMMANDO", tag: "IRON", emblem: "star",
      motto: "Disziplin. Feuer. Sieg.", faction: "VANGUARD", factionLabel: "Vanguard",
      focus: "Competitive · Win-Streak · Offiziere",
      desc: "Disziplinierter Vanguard-Clan mit Offiziersstruktur und Siegesfokus.",
      xp: 1100,
      resources: { alloy: 85, intel: 45, supplies: 65 },
      treasury: { vault: 2, command: 2, armory: 2, outpost: 1, depot: 2, horizon: 0 },
      members: [
        { name: "GENERAL-IRON", role: "leader", level: 41, kd: 1.70, emblem: "⭐", online: false, wins: 105 },
        { name: "STRIKER-7", role: "officer", level: 34, kd: 1.45, emblem: "🔥", online: true, wins: 72 },
        { name: "ZERO-NULL", role: "member", level: 29, kd: 1.30, emblem: "⚡", online: true, wins: 55 },
        { name: "CORE-V", role: "member", level: 26, kd: 1.20, emblem: "🎖", online: false, wins: 42 },
        { name: "RAID-04", role: "member", level: 23, kd: 1.08, emblem: "🛡", online: false, wins: 32 },
      ],
    },
    {
      id: "horizont_pioniere", name: "HORIZONT-PIONIERE", tag: "HZRO", emblem: "horizon",
      motto: "Saison 2 — wir sind voraus.", faction: "SCHATTENKOLLEKTIV", factionLabel: "Schattenkollektiv",
      focus: "Saison 2 · Horizont-Basis · CM-Events",
      desc: "S2-Spezialisten mit Horizont-Basis. Perfekt wenn du Clan-Matches testen willst.",
      xp: 1600,
      resources: { alloy: 75, intel: 90, supplies: 80 },
      treasury: { vault: 2, command: 2, armory: 1, outpost: 2, depot: 2, horizon: 3 },
      members: [
        { name: "HZRO-LEAD", role: "leader", level: 45, kd: 1.75, emblem: "🌑", online: true, wins: 115 },
        { name: "TOWER-SCOUT", role: "officer", level: 38, kd: 1.52, emblem: "🏙", online: true, wins: 88 },
        { name: "RIFT-02", role: "member", level: 33, kd: 1.38, emblem: "💠", online: false, wins: 65 },
        { name: "CM-RUNNER", role: "member", level: 30, kd: 1.25, emblem: "⚔", online: true, wins: 52 },
        { name: "ZERO-LIFT", role: "member", level: 27, kd: 1.15, emblem: "🎖", online: false, wins: 38 },
      ],
    },
  ],

  aiClanDef(id) {
    return this.AI_CLANS.find(c => c.id === id) || null;
  },

  recommendClans(d) {
    if (!BH.Social) return [];
    const lvl = BH.Progress.getLevel().level;
    const fac = d.factionWar && d.factionWar.pledged ? d.factionWar.faction : null;
    return this.AI_CLANS.map(ai => {
      let score = 40;
      const cLvl = BH.Social.clanLevel({ xp: ai.xp });
      if (fac && ai.faction === fac) score += 40;
      else if (!fac && !ai.faction) score += 15;
      score += Math.max(0, 30 - Math.abs(Math.floor(lvl / 6) - cLvl) * 6);
      if (ai.featured) score += 10;
      if (lvl < 15 && ai.id === "aschenfront") score += 25;
      if (lvl >= 35 && ai.id === "black_horizon") score += 20;
      const online = (ai.members || []).filter(m => m.online).length;
      return { ...ai, score, level: cLvl, memberCount: (ai.members || []).length, onlineCount: online };
    }).sort((a, b) => b.score - a.score);
  },

  _buildAiMembers(template, d) {
    const now = Date.now();
    const wk = BH.Social._weekKey();
    const members = (template.members || []).map((m, i) => ({
      id: "ai_" + template.id + "_" + i,
      name: m.name,
      role: m.role || "member",
      isSelf: false,
      isAi: true,
      joinedAt: now - (i + 2) * 86400000 * 4,
      lastOnlineAt: m.online ? now - Math.floor(Math.random() * 900000) : now - (3600000 * (3 + i * 4)),
      stats: {
        level: m.level || 20,
        kd: m.kd || 1.2,
        emblem: m.emblem || "🎖",
        faction: template.faction,
        wins: m.wins || 40,
      },
      weekContrib: {
        xp: 80 + i * 35,
        kills: 25 + i * 12,
        quests: 1 + (i % 3),
        cmWins: Math.floor(i / 2),
        key: wk,
      },
    }));
    members.push(BH.Social._selfMember(d, "member"));
    return members;
  },

  joinAiClan(d, aiId) {
    this.ensure(d);
    if (d.clan) return { ok: false, error: "Verlasse zuerst deinen aktuellen Clan." };
    const template = this.aiClanDef(aiId);
    if (!template || !BH.Social) return { ok: false, error: "Clan nicht gefunden." };

    const members = this._buildAiMembers(template, d);
    const selfM = members.find(m => m.isSelf);
    const live = this.isLive();
    if (selfM) selfM.role = live ? "officer" : "member";
    d.clan = {
      name: template.name,
      tag: BH.Social.normalizeTag(template.tag),
      xp: template.xp || 0,
      role: live ? "officer" : "member",
      emblem: template.emblem || "shield",
      motto: template.motto || "",
      announcement: template.announcement || "",
      isAiClan: true,
      aiClanId: template.id,
      createdAt: Date.now() - 86400000 * 45,
      members,
      resources: Object.assign({ alloy: 40, intel: 30, supplies: 35 }, template.resources || {}),
      treasury: Object.assign(
        { vault: 0, command: 0, armory: 0, outpost: 0, depot: 0, horizon: 0 },
        template.treasury || {}
      ),
      rival: { tag: "", name: "", weekKey: "", startXp: 0, startQuests: 0 },
      streak: { dayKey: BH.Social._dayKey(), count: 2 },
      buffs: [],
      milestonesClaimed: [],
      matchRounds: live ? [{ windowKey: "ai", played: 8, wins: 5, kills: 120 }] : [],
      horizonMvp: live ? { windowKey: "ai", name: (template.members[0] && template.members[0].name) || "—", matches: 6 } : { windowKey: "", name: "", matches: 0 },
      clanMatchStats: { played: 0, wins: 0, windowKey: "" },
      quests: {
        dailyKey: BH.Social._dayKey(),
        weeklyKey: BH.Social._weekKey(),
        dailyProg: {},
        dailyDone: [],
        weeklyProg: {},
        weeklyDone: [],
      },
    };
    BH.Social.ensure(d);
    if (BH.ClanExt) BH.ClanExt.syncUnlockedTitles(d);
    if (BH.ClanChat) BH.ClanChat.seedAiClan(d, template);
    BH.Progress.save();
    return { ok: true, clan: template };
  },

  renderRecommendationsBlock(d) {
    if (d.clan) return "";
    const list = this.recommendClans(d);
    if (!list.length) return "";

    let html =
      `<div class="social-subsection clan-rec-section">` +
      `<div class="social-sub-label">CLAN-EMPFEHLUNGEN · KI-CLANS</div>` +
      `<p class="social-panel-hint">Sofort beitreten — aktive KI-Mitglieder, echte Clan-Boni. Spieler-Clans weiterhin per BC1-Code.</p>` +
      `<div class="clan-rec-grid">`;

    for (const ai of list) {
      const em = this.emblemDef(ai.emblem).icon;
      const facChip = ai.factionLabel
        ? `<span class="cr-fac">${ai.factionLabel}</span>` : "";
      const badges = (ai.featured ? `<span class="cr-badge hot">EMPFOHLEN</span>` : "") +
        `<span class="cr-badge ki">KI-CLAN</span>`;
      const matchHint = ai.score >= 70 ? `<span class="cr-match">Passt zu dir</span>` : "";

      html +=
        `<div class="clan-rec-card${ai.featured ? " featured" : ""}" data-ai-card="${ai.id}">` +
        `<div class="cr-top">` +
          `<span class="cr-em">${em}</span>` +
          `<div class="cr-head">` +
            `<div class="cr-name">[${ai.tag}] ${ai.name}</div>` +
            `<div class="cr-badges">${badges}${matchHint}</div>` +
          `</div>` +
          `<div class="cr-lvl">LV ${ai.level}</div>` +
        `</div>` +
        `<div class="cr-motto">${ai.motto ? "„" + ai.motto + "\"" : ""}</div>` +
        `<div class="cr-desc">${ai.desc}</div>` +
        `<div class="cr-meta">` +
          `${facChip}` +
          `<span class="cr-focus">${ai.focus}</span>` +
        `</div>` +
        `<div class="cr-stats">` +
          `${ai.memberCount} Mitglieder · ${ai.onlineCount} online · ${ai.xp} XP` +
        `</div>` +
        `<button type="button" class="btn btn-primary cr-join" data-join-ai-clan="${ai.id}">BEITRETEN</button>` +
        `</div>`;
    }

    html += `</div></div>`;
    return html;
  },

  renderLockedBlock() {
    if (this.isLive()) return "";
    const when = BH.SeasonRelease ? BH.SeasonRelease.s2StartsOnNotice() : "Saison 2 · 1.8.2026";
    return (
      `<div class="clan-s2-lock">` +
      `<div class="clan-s2-lock-head">🔒 CLAN-ERWEITERUNGEN · ${when}</div>` +
      `<p class="clan-s2-lock-sub">Ab Saison 2 — Schwarzer Horizont. Early Access: Basis-Clan (Gründen, KI-Clans, XP, Schatzkammer, Aufgaben).</p>` +
      `<div class="clan-s2-lock-grid">` +
      `<div class="csl-item"><span>🎨</span> Identität · Emblem, Motto, Titel</div>` +
      `<div class="csl-item"><span>👥</span> Offiziere · Befördern & Einladen</div>` +
      `<div class="csl-item"><span>📊</span> Beitrag · Wochen-Stats & Streak</div>` +
      `<div class="csl-item"><span>🛒</span> Clan-Shop & Spenden</div>` +
      `<div class="csl-item"><span>⚔</span> Rivalen-Woche & Clan-Matches</div>` +
      `<div class="csl-item"><span>🏦</span> Horizont-Basis & Meilensteine</div>` +
      `<div class="csl-item"><span>📋</span> S2-Aufgaben · CM & Fraktion</div>` +
      `<div class="csl-item"><span>🏆</span> CM-Belohnungen & Recap</div>` +
      `</div></div>`
    );
  },

  bindRecommendationHandlers(d, panel, menu) {
    if (!panel) return;
    panel.querySelectorAll("[data-join-ai-clan]").forEach(btn => {
      btn.addEventListener("click", () => {
        const msg = document.getElementById("clan-msg");
        const res = this.joinAiClan(d, btn.dataset.joinAiClan);
        if (msg) {
          msg.textContent = res.ok ? "Clan beigetreten ✔" : res.error;
          msg.className = "save-msg clan-msg-bar " + (res.ok ? "ok" : "err");
        }
        if (res.ok) {
          BH.audio.buy();
          BH.Achievements && BH.Achievements.evaluate(d, {});
          menu._clanTab = "home";
          menu.renderClan();
          menu.renderTopbar();
        } else BH.audio.empty();
      });
    });
  },
};

function ctxModeIsClanMatch() {
  return !!(BH.Menu && BH.Menu.lastModeId === "clanmatch");
}

Object.assign(BH.ClanExt, {
  renderIdentityBlock(d) {
    if (!d.clan || !this.isLive()) return "";
    this.ensure(d);
    const em = this.clanEmblemIcon(d.clan);
    const canEdit = this.canEditMeta(d);
    let html =
      `<div class="social-subsection clan-identity-section">` +
      `<div class="social-sub-label">CLAN-IDENTITÄT</div>` +
      `<div class="clan-id-row"><span class="clan-id-em">${em}</span>` +
      `<div><div class="clan-id-tag">[${d.clan.tag}] ${d.clan.name}</div>` +
      (d.clan.motto ? `<div class="clan-id-motto">„${d.clan.motto}"</div>` : "") +
      `</div></div>`;
    if (d.clan.announcement) {
      html += `<div class="clan-announce">📢 ${d.clan.announcement}</div>`;
    }
    if (canEdit) {
      html += `<div class="clan-emblem-pick">`;
      for (const e of this.CLAN_EMBLEMS) {
        const locked = BH.Social.clanLevel(d.clan) < e.minLevel;
        html += `<button type="button" class="clan-em-btn${d.clan.emblem === e.id ? " active" : ""}${locked ? " locked" : ""}" ` +
          `data-clan-emblem="${e.id}" title="${e.name}${locked ? " · LV" + e.minLevel : ""}">${e.icon}</button>`;
      }
      html += `</div>` +
        `<input type="text" id="clan-motto-input" class="social-input" maxlength="80" placeholder="Clan-Motto" value="${(d.clan.motto || "").replace(/"/g, "&quot;")}">` +
        `<input type="text" id="clan-announce-input" class="social-input" maxlength="120" placeholder="Ankündigung für Mitglieder" value="${(d.clan.announcement || "").replace(/"/g, "&quot;")}">` +
        `<button type="button" class="btn social-action-btn" id="btn-clan-save-meta">SPEICHERN</button>`;
    }
    if (d.clan.isAiClan) {
      html += `<div class="clan-ai-hint">🤖 KI-CLAN · Du bist Offizier. Spieler-Clans weiterhin per BC1-Code oder eigene Gründung.</div>`;
    }
    const titles = (d.owned.clanTitles || []).map(id => this.titleDef(id)).filter(Boolean);
    if (titles.length) {
      html += `<div class="clan-title-pick"><span class="dim">Clan-Titel:</span> `;
      html += `<button type="button" class="clan-title-btn${!d.clanTitle ? " active" : ""}" data-clan-title="">—</button>`;
      for (const t of titles) {
        html += `<button type="button" class="clan-title-btn${d.clanTitle === t.id ? " active" : ""}" data-clan-title="${t.id}">${t.icon} ${t.name}</button>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
    return html;
  },

  renderShopBlock(d) {
    if (!d.clan || !this.isLive()) return "";
    this.ensure(d);
    const r = d.clan.resources || {};
    let html =
      `<div class="social-subsection clan-shop-section">` +
      `<div class="social-sub-label">CLAN-SHOP · RESSOURCEN</div>` +
      `<p class="clan-treasury-hint">Temporäre Buffs für alle Mitglieder · ${this.isOfficer(d) ? "Du kannst kaufen" : "Nur Anführer/Offizier"}</p>` +
      `<div class="clan-shop-grid">`;
    for (const item of this.CLAN_SHOP) {
      const cost = BH.Social.formatResourceCost(item.cost);
      html +=
        `<div class="clan-shop-item">` +
        `<div class="csi-icon">${item.icon}</div>` +
        `<div class="csi-body"><div class="csi-name">${item.name}</div><div class="csi-desc">${item.desc}</div>` +
        `<div class="csi-cost">${cost}</div></div>` +
        (this.isOfficer(d)
          ? `<button type="button" class="btn csi-buy" data-clan-shop="${item.id}">KAUFEN</button>`
          : `<span class="dim">🔒</span>`) +
        `</div>`;
    }
    html += `</div>`;
    const buffs = (d.clan.buffs || []).filter(b => b.expiresAt > Date.now());
    if (buffs.length) {
      html += `<div class="clan-active-buffs">Aktiv: ` +
        buffs.map(b => {
          const left = Math.max(0, Math.round((b.expiresAt - Date.now()) / 3600000));
          return `${b.id} (${left}h)`;
        }).join(" · ") + `</div>`;
    }
    html +=
      `<div class="clan-donate-row">` +
      `<input type="number" id="clan-donate-amt" class="social-input" min="${this.DONATE_RATE}" step="${this.DONATE_RATE}" placeholder="${this.DONATE_RATE} ⛁">` +
      `<button type="button" class="btn" id="btn-clan-donate">SPENDEN (${this.DONATE_RATE} ⛁ = ⚙3 📡2 📦4)</button>` +
      `</div></div>`;
    return html;
  },

  renderRivalBlock(d) {
    if (!d.clan || !this.isLive()) return "";
    this.ensure(d);
    const rival = this.rivalWeekStatus(d);
    let html =
      `<div class="social-subsection clan-rival-section">` +
      `<div class="social-sub-label">RIVALEN-WOCHE</div>` +
      `<p class="social-panel-hint">Rivalen-Clan festlegen — wer diese Woche mehr Clan-XP sammelt, führt.</p>`;
    if (this.isOfficer(d)) {
      html +=
        `<input type="text" id="clan-rival-set-code" class="social-code-input" placeholder="BC1.… Rivalen-Code">` +
        `<button type="button" class="btn social-action-btn" id="btn-clan-set-rival">RIVALE SETZEN</button>`;
    }
    if (rival && rival.tag) {
      html +=
        `<div class="clan-rival-active">` +
        `<div class="cra-vs"><span class="win">[${d.clan.tag}]</span> vs <span>[${rival.tag}] ${rival.name}</span></div>` +
        `<div class="cra-stat">Diese Woche: +${rival.gainedXp} Clan-XP · ${rival.gainedQuests} Aufgaben ✔</div>` +
        `</div>`;
    }
    html +=
      `<input type="text" id="clan-rival-code" class="social-code-input" placeholder="BC1.… Schnellvergleich">` +
      `<button type="button" class="btn social-action-btn" id="btn-clan-rival">VERGLEICHEN</button>` +
      `<div id="clan-rival-result"></div></div>`;
    return html;
  },

  renderContribBlock(d) {
    if (!d.clan || !this.isLive()) return "";
    this.ensure(d);
    const self = d.clan.members.find(m => m.isSelf);
    const wc = self && self.weekContrib ? self.weekContrib : {};
    const st = d.clan.streak || {};
    const fac = this.factionClanBonus(d);
    let html =
      `<div class="social-subsection clan-contrib-section">` +
      `<div class="social-sub-label">DEIN BEITRAG · DIESE WOCHE</div>` +
      `<div class="clan-contrib-grid">` +
      `<div class="cc-cell"><span>Clan-XP</span><b>${wc.xp || 0}</b></div>` +
      `<div class="cc-cell"><span>Kills</span><b>${wc.kills || 0}</b></div>` +
      `<div class="cc-cell"><span>Aufgaben</span><b>${wc.quests || 0}</b></div>` +
      `<div class="cc-cell"><span>CM-Siege</span><b>${wc.cmWins || 0}</b></div>` +
      `<div class="cc-cell"><span>Streak</span><b>${st.count || 0}T</b></div>` +
      `</div>`;
    if (fac) html += `<div class="clan-fac-bonus">${fac.label}</div>`;
    html += `</div>`;
    return html;
  },

  renderCmLeaderboard(d) {
    if (!d.clan || !this.isLive() || !BH.ClanMatches) return "";
    const rows = BH.ClanMatches.leaderboardRows(d);
    const mvp = d.clan.horizonMvp;
    const focus = BH.ClanMatches.mapFocus();
    let html =
      `<div class="clan-cm-lb">` +
      `<div class="clan-cm-lb-title">CLAN-MATCH HISTORIE</div>`;
    if (focus && BH.ClanMatches.isActive()) {
      html += `<div class="clan-map-focus">🎯 Karten-Fokus: ${focus.emoji} ${focus.name} (+20 % CM-XP)</div>`;
    }
    if (mvp && mvp.name && BH.ClanMatches.isActive()) {
      html += `<div class="clan-horizon-mvp">🌑 Horizont-MVP: ${mvp.name} · ${mvp.matches || 0} Matches</div>`;
    }
    if (!rows.length) {
      html += `<p class="dim">Noch keine abgeschlossenen Runden.</p>`;
    } else {
      html += rows.map(r =>
        `<div class="clan-lb-row"><span>Runde</span><b>${r.wins || 0}W</b> · ${r.played || 0}M · ${r.kills || 0}K</div>`
      ).join("");
    }
    html += `</div>`;
    return html;
  },

  renderRecapBlock(d) {
    if (!this.isLive()) return "";
    const recap = this.buildRecap(d);
    if (!recap) return "";
    return (
      `<div class="social-subsection clan-recap-section">` +
      `<div class="social-sub-label">CLAN-RECAP</div>` +
      `<div class="clan-recap-card">` +
      `<div class="cr-em">${recap.emblem}</div>` +
      `<div class="cr-body">` +
      `<div class="cr-name">[${recap.tag}] ${recap.name}</div>` +
      `<div class="cr-line">Level ${recap.level} · ${recap.xp} XP · ${recap.members} Mitglieder</div>` +
      `<div class="cr-line">Schatzkammer St.${recap.treasury} · Streak ${recap.streak}T · CM ${recap.cmWins} Siege gesamt</div>` +
      `<div class="cr-line">Deine Woche: ${recap.weekXp} XP · ${recap.weekKills} Kills</div>` +
      (recap.bestRound ? `<div class="cr-line">Beste Runde: ${recap.bestRound.wins} Siege</div>` : "") +
      `</div></div></div>`
    );
  },

  bindHandlers(d, panel, menu) {
    if (!d.clan || !panel) return;
    panel.querySelector("#btn-clan-save-meta")?.addEventListener("click", () => {
      const motto = document.getElementById("clan-motto-input")?.value || "";
      const ann = document.getElementById("clan-announce-input")?.value || "";
      this.setMotto(d, motto);
      this.setAnnouncement(d, ann);
      BH.audio.click();
      menu.renderClan();
    });
    panel.querySelectorAll("[data-clan-emblem]").forEach(btn => {
      btn.addEventListener("click", () => {
        const res = this.setEmblem(d, btn.dataset.clanEmblem);
        const msg = document.getElementById("clan-msg");
        if (msg) { msg.textContent = res.ok ? "Emblem gesetzt ✔" : res.error; msg.className = "save-msg " + (res.ok ? "ok" : "err"); }
        if (res.ok) { BH.audio.buy(); menu.renderClan(); } else BH.audio.empty();
      });
    });
    panel.querySelectorAll("[data-clan-title]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.setClanTitle(d, btn.dataset.clanTitle || null);
        BH.audio.click();
        menu.renderClan();
      });
    });
    panel.querySelectorAll("[data-clan-shop]").forEach(btn => {
      btn.addEventListener("click", () => {
        const res = this.buyShopItem(d, btn.dataset.clanShop);
        const msg = document.getElementById("clan-msg");
        if (msg) { msg.textContent = res.ok ? res.item.name + " aktiviert ✔" : res.error; msg.className = "save-msg " + (res.ok ? "ok" : "err"); }
        if (res.ok) { BH.audio.buy(); menu.renderClan(); } else BH.audio.empty();
      });
    });
    document.getElementById("btn-clan-donate")?.addEventListener("click", () => {
      const amt = document.getElementById("clan-donate-amt")?.value;
      const res = this.donateCredits(d, amt);
      const msg = document.getElementById("clan-msg");
      if (msg) { msg.textContent = res.ok ? `+⚙${res.gain.alloy} gespendet ✔` : res.error; msg.className = "save-msg " + (res.ok ? "ok" : "err"); }
      if (res.ok) { BH.audio.buy(); menu.renderClan(); menu.renderTopbar(); } else BH.audio.empty();
    });
    document.getElementById("btn-clan-set-rival")?.addEventListener("click", () => {
      const code = document.getElementById("clan-rival-set-code")?.value || "";
      const res = this.setRival(d, code);
      const msg = document.getElementById("clan-msg");
      if (msg) { msg.textContent = res.ok ? "Rivale gesetzt ✔" : res.error; msg.className = "save-msg " + (res.ok ? "ok" : "err"); }
      if (res.ok) { BH.audio.buy(); menu.renderClan(); } else BH.audio.empty();
    });
    panel.querySelectorAll("[data-promote]").forEach(btn => {
      btn.addEventListener("click", () => {
        const res = this.promoteMember(d, btn.dataset.promote);
        const msg = document.getElementById("clan-msg");
        if (msg) { msg.textContent = res.ok ? "Offizier ernannt ✔" : res.error; msg.className = "save-msg " + (res.ok ? "ok" : "err"); }
        if (res.ok) menu.renderClan(); else BH.audio.empty();
      });
    });
    panel.querySelectorAll("[data-demote]").forEach(btn => {
      btn.addEventListener("click", () => {
        const res = this.demoteMember(d, btn.dataset.demote);
        if (res.ok) menu.renderClan(); else BH.audio.empty();
      });
    });
  },
});

/* Horizont-Gebäude — nur wenn Clan-Erweiterungen live */
if (BH.ClanExt && BH.Social && BH.Social.CLAN_TREASURY_BUILDINGS) {
  const hasHorizon = BH.Social.CLAN_TREASURY_BUILDINGS.some(b => b.id === "horizon");
  if (!hasHorizon) {
    BH.Social.CLAN_TREASURY_BUILDINGS.push({
      id: "horizon", name: "Horizont-Basis", icon: "🌑", maxLevel: 3, s2: true,
      desc: "Saison-2-Stützpunkt — +15 % Clan-XP in Clan-Matches pro Stufe.",
      effectLabel: lvl => `+${lvl * 15} % CM-XP`,
    });
  }
}
