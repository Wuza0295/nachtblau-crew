/* Booster — je Bereich eigener 2×-Boost (Level / Battle Pass / Clan) */
window.BH = window.BH || {};

BH.BpXpTokens = {
  MULT: 2,
  STARTER_TIER: "30",
  STARTER_COUNT: 2,

  AREAS: [
    { id: "level", name: "Level", short: "Level-XP", icon: "📈", activateLabel: "2× Account-Level" },
    { id: "bp", name: "Battle Pass", short: "Saison-XP", icon: "🎖", activateLabel: "2× Battle Pass" },
    { id: "clan", name: "Clan", short: "Clan-XP", icon: "🛡", activateLabel: "2× Clan-XP", needsClan: true },
  ],

  TIERS: [
    { id: "15", label: "15 Min.", short: "15m", ms: 15 * 60 * 1000 },
    { id: "30", label: "30 Min.", short: "30m", ms: 30 * 60 * 1000 },
    { id: "60", label: "1 Std.", short: "1h", ms: 60 * 60 * 1000 },
  ],

  areaDef(id) {
    return this.AREAS.find(a => a.id === id) || null;
  },

  tierDef(id) {
    return this.TIERS.find(t => t.id === id) || null;
  },

  _emptyInventory() {
    const inv = {};
    for (const a of this.AREAS) {
      inv[a.id] = {};
      for (const t of this.TIERS) inv[a.id][t.id] = 0;
    }
    return inv;
  },

  _emptyActive() {
    const act = {};
    for (const a of this.AREAS) act[a.id] = null;
    return act;
  },

  _isNewPlayer(d) {
    return (d.matches || 0) === 0 && (d.seasonXp || 0) === 0 && (d.xp || 0) === 0;
  },

  hasClan(d) {
    return !!(d && d.clan);
  },

  canActivate(d, areaId) {
    const area = this.areaDef(areaId);
    if (!area) return false;
    if (area.needsClan && !this.hasClan(d)) return false;
    return true;
  },

  activationHint(d) {
    return "Je Bereich eigener Boost · Level · Battle Pass · Clan";
  },

  _migrateLegacy(d) {
    const b = d.bpXpTokens;
    if (!b) return;

    const flatTier = (id) => typeof b.inventory === "object" && typeof b.inventory[id] === "number";

    if (b.inventory && !b.inventory.level && (flatTier("15") || flatTier("30") || flatTier("60"))) {
      const flat = b.inventory;
      b.inventory = this._emptyInventory();
      for (const t of this.TIERS) {
        const n = flat[t.id] || 0;
        if (n > 0) {
          b.inventory.bp[t.id] = n;
          b.inventory.level[t.id] = Math.floor(n / 2);
        }
      }
    }

    if (b.active && b.active.tier && b.active.until) {
      const legacy = b.active;
      b.active = this._emptyActive();
      for (const a of this.AREAS) {
        if (a.needsClan && !this.hasClan(d)) continue;
        b.active[a.id] = { tier: legacy.tier, until: legacy.until };
      }
    } else if (!b.active || typeof b.active !== "object" || b.active.tier) {
      b.active = this._emptyActive();
    } else {
      for (const a of this.AREAS) {
        if (b.active[a.id] === undefined) b.active[a.id] = null;
      }
    }
  },

  ensure(d) {
    if (!d) return;
    if (!d.bpXpTokens) {
      const inv = this._emptyInventory();
      if (this._isNewPlayer(d)) {
        inv.level[this.STARTER_TIER] = this.STARTER_COUNT;
        inv.bp[this.STARTER_TIER] = this.STARTER_COUNT;
      }
      d.bpXpTokens = { inventory: inv, active: this._emptyActive() };
    }
    if (!d.bpXpTokens.inventory || typeof d.bpXpTokens.inventory !== "object") {
      d.bpXpTokens.inventory = this._emptyInventory();
    }
    if (!d.bpXpTokens.active || typeof d.bpXpTokens.active !== "object") {
      d.bpXpTokens.active = this._emptyActive();
    }
    this._migrateLegacy(d);
    for (const a of this.AREAS) {
      if (!d.bpXpTokens.inventory[a.id]) {
        d.bpXpTokens.inventory[a.id] = {};
      }
      for (const t of this.TIERS) {
        if (typeof d.bpXpTokens.inventory[a.id][t.id] !== "number") {
          d.bpXpTokens.inventory[a.id][t.id] = 0;
        }
      }
      if (d.bpXpTokens.active[a.id] === undefined) {
        d.bpXpTokens.active[a.id] = null;
      }
      this._expireArea(d, a.id);
    }
  },

  _expireArea(d, areaId) {
    const a = d.bpXpTokens.active[areaId];
    if (a && Date.now() >= a.until) d.bpXpTokens.active[areaId] = null;
  },

  _expireAll(d) {
    for (const a of this.AREAS) this._expireArea(d, a.id);
  },

  isActive(d, areaId) {
    this.ensure(d);
    if (!areaId) return this.AREAS.some(a => this.isActive(d, a.id));
    this._expireArea(d, areaId);
    const a = d.bpXpTokens.active[areaId];
    return !!(a && a.until > Date.now());
  },

  /** @deprecated — nutze isActive(d, "clan") */
  clanXpActive(d) {
    return this.isActive(d, "clan") && this.hasClan(d);
  },

  activeInfo(d, areaId) {
    this.ensure(d);
    if (!areaId) {
      const list = this.activeList(d);
      return list.length ? list[0] : null;
    }
    this._expireArea(d, areaId);
    const a = d.bpXpTokens.active[areaId];
    if (!a || a.until <= Date.now()) return null;
    const def = this.tierDef(a.tier);
    const area = this.areaDef(areaId);
    return {
      area: areaId,
      areaName: area ? area.name : areaId,
      areaIcon: area ? area.icon : "⚡",
      tier: a.tier,
      label: def ? def.label : a.tier,
      until: a.until,
      remainingMs: Math.max(0, a.until - Date.now()),
      clan: areaId === "clan" ? this.hasClan(d) : undefined,
    };
  },

  activeList(d) {
    this.ensure(d);
    this._expireAll(d);
    const out = [];
    for (const area of this.AREAS) {
      const info = this.activeInfo(d, area.id);
      if (info) out.push(info);
    }
    return out;
  },

  activeSummary(d) {
    const list = this.activeList(d);
    if (!list.length) return "";
    return list.map(x => (x.areaIcon || "⚡") + " " + x.areaName + " " + x.label).join(" · ");
  },

  xpAmount(d, base, areaId) {
    if (!base || base <= 0) return 0;
    if (!areaId) areaId = "level";
    return this.isActive(d, areaId) ? base * this.MULT : base;
  },

  xpBonus(d, base, areaId) {
    const add = this.xpAmount(d, base, areaId);
    return Math.max(0, add - base);
  },

  addSeasonXp(d, base) {
    this.ensure(d);
    const add = this.xpAmount(d, base, "bp");
    d.seasonXp = (d.seasonXp || 0) + add;
    return { base, add, bonus: Math.max(0, add - base), doubled: add > base };
  },

  applyClanXp(d, base) {
    if (!base || base <= 0) return { base: 0, add: 0, bonus: 0 };
    const add = this.isActive(d, "clan") && this.hasClan(d) ? base * this.MULT : base;
    return { base, add, bonus: Math.max(0, add - base) };
  },

  count(d, areaId, tierId) {
    this.ensure(d);
    if (!this.areaDef(areaId)) return 0;
    return d.bpXpTokens.inventory[areaId][tierId] || 0;
  },

  totalCount(d, areaId) {
    this.ensure(d);
    if (areaId) {
      return this.TIERS.reduce((s, t) => s + this.count(d, areaId, t.id), 0);
    }
    return this.AREAS.reduce((s, a) => s + this.totalCount(d, a.id), 0);
  },

  grant(d, areaId, tierId, count) {
    this.ensure(d);
    if (!this.areaDef(areaId) || !this.tierDef(tierId) || count <= 0) return false;
    d.bpXpTokens.inventory[areaId][tierId] =
      (d.bpXpTokens.inventory[areaId][tierId] || 0) + count;
    return true;
  },

  activate(d, areaId, tierId) {
    this.ensure(d);
    this._expireArea(d, areaId);
    const area = this.areaDef(areaId);
    const def = this.tierDef(tierId);
    if (!area || !def) return { ok: false, error: "invalid" };
    if (area.needsClan && !this.hasClan(d)) return { ok: false, error: "clan" };
    if ((d.bpXpTokens.inventory[areaId][tierId] || 0) < 1) {
      return { ok: false, error: "empty" };
    }
    if (this.isActive(d, areaId)) {
      return { ok: false, error: "active", info: this.activeInfo(d, areaId) };
    }
    d.bpXpTokens.inventory[areaId][tierId]--;
    d.bpXpTokens.active[areaId] = { tier: tierId, until: Date.now() + def.ms };
    return {
      ok: true,
      area: areaId,
      areaName: area.name,
      tier: tierId,
      label: def.label,
      until: d.bpXpTokens.active[areaId].until,
    };
  },

  formatRemaining(ms) {
    if (ms <= 0) return "0:00";
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    }
    return m + ":" + String(s).padStart(2, "0");
  },
};
