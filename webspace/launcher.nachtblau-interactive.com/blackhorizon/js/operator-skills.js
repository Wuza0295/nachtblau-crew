/* Operator-Skills · Währung Diamanten (💎) — pro Operator spielbar & skillbar */
window.BH = window.BH || {};

BH.OperatorSkills = {
  MATCHES_PER_DIAMOND: 10,

  SKILLS: [
    {
      id: "mobility",
      name: "Mobilität",
      icon: "🏃",
      desc: "Schnelleres Laufen & Sprint",
      max: 5,
      perLevel: { moveSpeed: 0.025 },
      fmt: (lvl) => "+" + Math.round(lvl * 2.5) + " % Tempo",
    },
    {
      id: "reload",
      name: "Schnellladung",
      icon: "🔄",
      desc: "Kürzere Reload-Zeit",
      max: 5,
      perLevel: { reloadTime: -0.04 },
      fmt: (lvl) => "-" + Math.round(lvl * 4) + " % Reload",
    },
    {
      id: "ads",
      name: "Zielgeschwindigkeit",
      icon: "🎯",
      desc: "Schnelleres Anvisieren (ADS)",
      max: 4,
      perLevel: { adsTime: -0.05 },
      fmt: (lvl) => "-" + Math.round(lvl * 5) + " % ADS",
    },
    {
      id: "vitality",
      name: "Vitalität",
      icon: "❤",
      desc: "Mehr Trefferpunkte",
      max: 5,
      perLevel: { maxHp: 5 },
      fmt: (lvl) => "+" + (lvl * 5) + " HP",
    },
    {
      id: "steady",
      name: "Stabilisierung",
      icon: "📐",
      desc: "Weniger Waffen-Streuung",
      max: 4,
      perLevel: { spreadMult: -0.035 },
      fmt: (lvl) => "-" + Math.round(lvl * 3.5) + " % Streuung",
    },
  ],

  ensure(data) {
    if (!data) return;
    if (!data.opSkills || typeof data.opSkills !== "object") data.opSkills = {};
  },

  getOpState(data, opId) {
    this.ensure(data);
    if (!opId) opId = "recruit";
    if (!data.opSkills[opId]) {
      data.opSkills[opId] = { diamonds: 0, matchProg: 0, matches: 0, skills: {} };
    }
    const st = data.opSkills[opId];
    if (!st.skills || typeof st.skills !== "object") st.skills = {};
    if (typeof st.diamonds !== "number") st.diamonds = 0;
    if (typeof st.matchProg !== "number") st.matchProg = 0;
    if (typeof st.matches !== "number") st.matches = 0;
    return st;
  },

  /** Kosten pro Skill-Stufe (Stufe 1 → index 0) — sehr teuer & steigend */
  LEVEL_COSTS: [12, 25, 45, 70, 100],

  /** Shop: Custom-Kauf — Mindestmenge · Kurs wie Festpakete (Staffel) */
  SHOP_CUSTOM_MIN: 500,

  packUnitRate(pack, data) {
    if (!pack || !pack.diamonds) return 0;
    return this.shopPackPrice(pack, data) / pack.diamonds;
  },

  /** Preis wie Festpaket-Kombination im Shop (größte Pakete zuerst) */
  customShopPriceDetail(amount, data) {
    const qty = Math.floor(Number(amount) || 0);
    const packs = [...(BH.SHOP && BH.SHOP.diamondPacks || [])].sort((a, b) => b.diamonds - a.diamonds);
    if (!packs.length || qty < this.SHOP_CUSTOM_MIN) return null;

    let remaining = qty;
    let total = 0;
    const breakdown = [];

    for (const pack of packs) {
      while (remaining >= pack.diamonds) {
        const price = this.shopPackPrice(pack, data);
        total += price;
        remaining -= pack.diamonds;
        breakdown.push({ pack, price });
      }
    }
    if (remaining > 0) {
      const smallest = packs[packs.length - 1];
      const price = this.shopPackPrice(smallest, data);
      total += price;
      breakdown.push({ pack: smallest, price, topUp: true });
    }

    const parts = breakdown.map(b =>
      b.topUp
        ? `+1×${b.pack.diamonds} (Aufstockung)`
        : `1×${b.pack.diamonds}`
    );

    return {
      qty,
      price: total,
      breakdown,
      perDia: Math.round(total / qty),
      label: parts.join(" · ") || "—",
    };
  },

  customShopPrice(amount, data) {
    const detail = this.customShopPriceDetail(amount, data);
    return detail ? detail.price : null;
  },

  costForLevel(nextLevel) {
    const costs = this.LEVEL_COSTS;
    if (!nextLevel || nextLevel < 1) return costs[0];
    return costs[Math.min(nextLevel, costs.length) - 1];
  },

  progress(data, opId) {
    const st = this.getOpState(data, opId);
    return {
      diamonds: st.diamonds,
      matchProg: st.matchProg,
      matches: st.matches,
      perDiamond: this.MATCHES_PER_DIAMOND,
      remaining: Math.max(0, this.MATCHES_PER_DIAMOND - st.matchProg),
    };
  },

  skillLevel(data, opId, skillId) {
    const st = this.getOpState(data, opId);
    return st.skills[skillId] || 0;
  },

  totalSkillLevels(data, opId) {
    let n = 0;
    for (const s of this.SKILLS) n += this.skillLevel(data, opId, s.id);
    return n;
  },

  /** Nach abgeschlossenem Match — 1 💎 alle 10 Matches mit diesem Operator */
  trackMatch(data, opId) {
    if (!data || !opId) return null;
    const owned = (data.owned && data.owned.operators || []).includes(opId);
    if (!owned) return null;

    const st = this.getOpState(data, opId);
    st.matches += 1;
    st.matchProg += 1;
    let earned = 0;
    if (st.matchProg >= this.MATCHES_PER_DIAMOND) {
      st.matchProg = 0;
      st.diamonds += 1;
      earned = 1;
    }
    return {
      earned,
      diamonds: st.diamonds,
      matchProg: st.matchProg,
      remaining: this.MATCHES_PER_DIAMOND - st.matchProg,
      operatorId: opId,
    };
  },

  canUpgrade(data, opId, skillId) {
    const skill = this.SKILLS.find(s => s.id === skillId);
    if (!skill || !data) return { ok: false, reason: "missing" };
    const owned = (data.owned.operators || []).includes(opId);
    if (!owned) return { ok: false, reason: "locked" };
    const lvl = this.skillLevel(data, opId, skillId);
    if (lvl >= skill.max) return { ok: false, reason: "max" };
    const cost = this.costForLevel(lvl + 1);
    const st = this.getOpState(data, opId);
    if (st.diamonds < cost) return { ok: false, reason: "diamonds", need: cost, have: st.diamonds };
    return { ok: true, cost, nextLevel: lvl + 1, skill };
  },

  upgrade(data, opId, skillId) {
    const check = this.canUpgrade(data, opId, skillId);
    if (!check.ok) return check;
    const st = this.getOpState(data, opId);
    st.diamonds -= check.cost;
    st.skills[skillId] = check.nextLevel;
    return { ok: true, level: check.nextLevel, diamonds: st.diamonds, skill: check.skill };
  },

  bonuses(data, opId) {
    const out = {
      moveSpeed: 0,
      reloadMult: 1,
      adsTimeMult: 1,
      maxHp: 0,
      spreadMult: 1,
    };
    if (!data || !opId) return out;
    for (const skill of this.SKILLS) {
      const lvl = this.skillLevel(data, opId, skill.id);
      if (!lvl) continue;
      if (skill.perLevel.moveSpeed) out.moveSpeed += skill.perLevel.moveSpeed * lvl;
      if (skill.perLevel.reloadTime) out.reloadMult *= (1 + skill.perLevel.reloadTime * lvl);
      if (skill.perLevel.adsTime) out.adsTimeMult *= (1 + skill.perLevel.adsTime * lvl);
      if (skill.perLevel.maxHp) out.maxHp += skill.perLevel.maxHp * lvl;
      if (skill.perLevel.spreadMult) out.spreadMult *= (1 + skill.perLevel.spreadMult * lvl);
    }
    return out;
  },

  summaryLines(data, opId) {
    const b = this.bonuses(data, opId);
    const lines = [];
    if (b.moveSpeed > 0) lines.push("+" + Math.round(b.moveSpeed * 100) + " % Tempo");
    if (b.reloadMult < 1) lines.push("-" + Math.round((1 - b.reloadMult) * 100) + " % Reload");
    if (b.adsTimeMult < 1) lines.push("-" + Math.round((1 - b.adsTimeMult) * 100) + " % ADS");
    if (b.maxHp > 0) lines.push("+" + b.maxHp + " HP");
    if (b.spreadMult < 1) lines.push("-" + Math.round((1 - b.spreadMult) * 100) + " % Streuung");
    return lines;
  },

  shopPackPrice(pack, data) {
    if (!pack) return 0;
    return BH.ShopEconomy
      ? BH.ShopEconomy.price(pack.price, { data })
      : pack.price;
  },

  grantDiamonds(data, opId, amount) {
    if (!data || !opId || amount <= 0) return { ok: false, reason: "missing" };
    const owned = (data.owned && data.owned.operators || []).includes(opId);
    if (!owned) return { ok: false, reason: "locked" };
    const st = this.getOpState(data, opId);
    st.diamonds += amount;
    return { ok: true, diamonds: st.diamonds, added: amount, operatorId: opId };
  },

  buyShopPack(data, packId, opId) {
    const pack = (BH.SHOP && BH.SHOP.diamondPacks || []).find(p => p.id === packId);
    if (!pack || !data) return { ok: false, reason: "missing" };
    const target = opId || data.operator;
    const owned = (data.owned.operators || []).includes(target);
    if (!owned) return { ok: false, reason: "locked" };
    const price = this.shopPackPrice(pack, data);
    if ((data.credits || 0) < price) {
      return { ok: false, reason: "credits", need: price, have: data.credits || 0 };
    }
    data.credits -= price;
    const grant = this.grantDiamonds(data, target, pack.diamonds);
    if (!grant.ok) {
      data.credits += price;
      return grant;
    }
    return {
      ok: true,
      spent: price,
      diamonds: grant.diamonds,
      added: pack.diamonds,
      operatorId: target,
      pack,
    };
  },

  buyCustom(data, amount, opId) {
    if (!data) return { ok: false, reason: "missing" };
    const qty = Math.floor(Number(amount) || 0);
    if (qty < this.SHOP_CUSTOM_MIN) {
      return { ok: false, reason: "min", min: this.SHOP_CUSTOM_MIN, got: qty };
    }
    const target = opId || data.operator;
    const owned = (data.owned.operators || []).includes(target);
    if (!owned) return { ok: false, reason: "locked" };
    const price = this.customShopPrice(qty, data);
    if ((data.credits || 0) < price) {
      return { ok: false, reason: "credits", need: price, have: data.credits || 0 };
    }
    data.credits -= price;
    const grant = this.grantDiamonds(data, target, qty);
    if (!grant.ok) {
      data.credits += price;
      return grant;
    }
    return {
      ok: true,
      spent: price,
      diamonds: grant.diamonds,
      added: qty,
      operatorId: target,
      custom: true,
    };
  },
};
