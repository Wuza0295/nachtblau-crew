/* Fraktionskrieg – Territorien, Treue, Aufträge, Wochenbelohnungen */
window.BH = window.BH || {};

BH.FactionWar = {
  factions: [
    { id: "VANGUARD", name: "Vanguard", shortName: "VANGUARD", color: "#ff5a52", icon: "🔴",
      motto: "Aggressive Vorstoßtruppen. Rohe Feuerkraft und Hightech.",
      story: "2036 brach die Welt. Vanguard war die Antwort der Konzerne: private Armee, kein Gewissen, nur Auftrag.\n\n" +
        "Sie eroberten Anlage Sierra-7 und halten die Industriezone mit Panzern und Drohnenschwärmen. Wer Vanguard schwört, " +
        "kämpft an der Spitze – oder wird zur Deckung." },
    { id: "TF NACHTFALKE", name: "TF Nachtfalke", shortName: "NACHTFALKE", color: "#39c5ff", icon: "🦅",
      motto: "Elite-Task-Force. Präzision, Aufklärung, Nachteinsätze.",
      story: "Als die Regierung fiel, blieb nur TF Nachtfalke: Geheimdienst, Spezialeinsatz, letzte Ordnung.\n\n" +
        "Ihre Jäger patrouillieren Vorort Zero und Militärhafen Delta. Präzision schlägt Masse – und in der Dunkelheit " +
        "sehen sie zuerst, wer dich töten will." },
    { id: "WÜSTENKORPS", name: "Wüstenkorps", shortName: "WÜSTENKORPS", color: "#d4a040", icon: "🏜",
      motto: "Wüstenjäger und Überlebende. Härte und Ausdauer.",
      story: "Rotglut und Frostlinie formten harte Menschen. Das Wüstenkorps überlebte, als Armeen verdorrten.\n\n" +
        "Sie kennen jeden Sandsturm, jede Eisbrücke. Ihre Heimat-Territorien geben keinen Vorteil – sie sind Heimat. " +
        "Wer das Korps wählt, kämpft langsam, sicher und bis zum Ende." },
    { id: "SCHATTENKOLLEKTIV", name: "Schattenkollektiv", shortName: "SCHATTEN", color: "#b57bff", icon: "🌑",
      motto: "Geheimoperationen im toten Netz. Information ist Waffe.",
      story: "Niemand weiß, wann das Schattenkollektiv entstand – nur dass es überall ist und nirgends.\n\n" +
        "Hacker, Saboteure, Geister in den Türmen von Zero. Sie profitieren vom Krieg der anderen drei Fraktionen, " +
        "stehlen Daten, kappen Comms und verschwinden im Nebel. Ihre Loyalität ist eine Wahl – keine Pflicht." },
  ],

  territories: [
    { id: "harbor", name: "Militärhafen Delta", emoji: "⚓", home: null, short: "Hafen" },
    { id: "industrial", name: "Anlage Sierra-7", emoji: "🏭", home: "VANGUARD", short: "Sierra-7" },
    { id: "arctic", name: "Außenposten Frostlinie", emoji: "❄", home: "WÜSTENKORPS", short: "Frostlinie" },
    { id: "ruins", name: "Vorort Zero", emoji: "🏚", home: "TF NACHTFALKE", short: "Zero" },
    { id: "tower", name: "Hochhaus Zero", emoji: "🏙", home: "SCHATTENKOLLEKTIV", short: "Tower" },
  ],

  /** Frontkarte — klares 2-Reihen-Layout ohne Überlappung */
  mapLayout: {
    arctic:     { x: 3,  y: 10, w: 28, h: 26 },
    harbor:     { x: 36, y: 6,  w: 28, h: 24 },
    industrial: { x: 69, y: 10, w: 28, h: 26 },
    ruins:      { x: 6,  y: 56, w: 42, h: 32 },
    tower:      { x: 52, y: 56, w: 42, h: 32 },
  },

  /** Nachbarschaft — Frontlinie = Grenze zwischen unterschiedlichen Besitzern */
  mapEdges: [
    ["arctic", "harbor"],
    ["harbor", "industrial"],
    ["arctic", "ruins"],
    ["harbor", "ruins"],
    ["harbor", "tower"],
    ["industrial", "tower"],
    ["ruins", "tower"],
  ],

  CAPTURE_NEED: 6,

  /** Kein Einfluss auf Fraktionskrieg (Story / Ranked) */
  EXCLUDED_MODES: ["campaign", "ranked"],

  countsForWar(modeId) {
    return !!modeId && this.EXCLUDED_MODES.indexOf(modeId) < 0;
  },

  ranks: [
    { name: "Rekrut", min: 0, credMult: 1, xpMult: 1 },
    { name: "Soldat", min: 40, credMult: 1.03, xpMult: 1.02 },
    { name: "Veteran", min: 120, credMult: 1.06, xpMult: 1.04 },
    { name: "Elitesoldat", min: 280, credMult: 1.09, xpMult: 1.06 },
    { name: "Kommandeur", min: 550, credMult: 1.12, xpMult: 1.08 },
  ],

  contracts: [
    { id: "fw_k15", label: "15 Kills in der Fraktionssache", type: "kills", target: 15, reward: 220, xp: 40, fwp: 25 },
    { id: "fw_w3", label: "3 Siege für deine Fraktion", type: "wins", target: 3, reward: 320, xp: 60, fwp: 40 },
    { id: "fw_m5", label: "5 Matches absolvieren", type: "matches", target: 5, reward: 180, xp: 35, fwp: 15 },
    { id: "fw_dom2", label: "2 Siege in Herrschaft", type: "mode_wins", mode: "dom", target: 2, reward: 280, xp: 50, fwp: 35 },
    { id: "fw_snd1", label: "1 Sieg in Suchen & Zerstören", type: "mode_wins", mode: "snd", target: 1, reward: 260, xp: 45, fwp: 30 },
    { id: "fw_hs10", label: "10 Kopftreffer", type: "headshots", target: 10, reward: 200, xp: 40, fwp: 20 },
    { id: "fw_k25", label: "25 Kills – Frontoffensive", type: "kills", target: 25, reward: 350, xp: 70, fwp: 35 },
    { id: "fw_w5", label: "5 Siege für den Sieg", type: "wins", target: 5, reward: 450, xp: 90, fwp: 55 },
  ],

  milestones: [
    { id: "ms_50", fwp: 50, label: "Frontsoldat", credits: 180, xp: 60 },
    { id: "ms_150", fwp: 150, label: "Elite-Einsatz", credits: 450, xp: 150 },
    { id: "ms_300", fwp: 300, label: "Legendenstatus", credits: 900, xp: 300 },
  ],

  factionEmblems: {
    VANGUARD: "fw_vanguard",
    "TF NACHTFALKE": "fw_nachtfalke",
    WÜSTENKORPS: "fw_wueste",
    SCHATTENKOLLEKTIV: "fw_schatten",
  },

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

  _seedWorld(weekKey) {
    const scores = {};
    for (const f of this.factions) scores[f.id] = 0;
    const h = this._hash(weekKey + "world");
    const order = this.factions.slice().sort((a, b) =>
      this._hash(weekKey + a.id) - this._hash(weekKey + b.id));
    if (order[0]) scores[order[0].id] = 8 + (h % 6);
    if (order[1]) scores[order[1].id] = 4 + (h % 4);
    if (order[2]) scores[order[2].id] = 2 + (h % 3);
    return scores;
  },

  _defaultTerritories(weekKey) {
    const t = {};
    const wk = weekKey || this._weekKey();
    const list = BH.SeasonRelease ? BH.SeasonRelease.liveTerritories(this.territories) : this.territories;
    for (const ter of list) {
      if (ter.home) t[ter.id] = ter.home;
      else t[ter.id] = "TF NACHTFALKE";
    }
    return t;
  },

  _pickContract(weekKey, factionId) {
    const h = this._hash(weekKey + (factionId || "x"));
    return this.contracts[h % this.contracts.length].id;
  },

  _contractDef(id) {
    return this.contracts.find(c => c.id === id) || this.contracts[0];
  },

  _factionMeta(id) {
    return this.factions.find(f => f.id === id) || this.factions[0];
  },

  _shortLabel(id) {
    const m = this._factionMeta(id);
    return m.shortName || m.name;
  },

  _edgeKey(a, b) {
    return a < b ? a + "|" + b : b + "|" + a;
  },

  _regionCenter(layout) {
    return { x: layout.x + layout.w / 2, y: layout.y + layout.h / 2 };
  },

  _terById(id) {
    return this.getTerritories().find(t => t.id === id) || { id, name: id, short: id, emoji: "?" };
  },

  _logCapture(d, msg) {
    const fw = d.factionWar;
    if (!fw.captureLog) fw.captureLog = [];
    fw.captureLog.unshift({ t: Date.now(), msg });
    fw.captureLog = fw.captureLog.slice(0, 10);
  },

  _formatFrontTime(ts) {
    if (!ts) return "—";
    const diff = Math.max(0, Date.now() - ts);
    const min = Math.floor(diff / 60000);
    if (min < 1) return "gerade";
    if (min < 60) return "vor " + min + " Min";
    const h = Math.floor(min / 60);
    if (h < 24) return "vor " + h + " Std";
    return "vor " + Math.floor(h / 24) + " T";
  },

  operatorFaction(operatorId) {
    const op = BH.OperatorCatalog
      ? BH.OperatorCatalog.find(operatorId, null)
      : BH.OPERATORS.find(o => o.id === operatorId);
    const f = op && op.faction;
    if (f && this.factions.some(x => x.id === f)) return f;
    return "TF NACHTFALKE";
  },

  matchFaction(name, isPlayer) {
    if (isPlayer) {
      const d = BH.Progress.data;
      this.ensure(d);
      if (d.factionWar.pledged) return d.factionWar.pledged;
      return this.operatorFaction(d.operator);
    }
    const n = this.factions.length || 1;
    return this.factions[this._hash(name || "bot") % n].id;
  },

  hasPledged(d) {
    this.ensure(d);
    return !!d.factionWar.pledged;
  },

  canViewIntel(d) {
    return this.hasPledged(d);
  },

  getMapRegions(d) {
    if (!d.factionWar) this.ensure(d);
    const fw = d.factionWar;
    const reveal = this.canViewIntel(d);
    const pledged = fw.pledged;
    const rows = this._influenceRows(fw);
    const rowMap = {};
    for (const row of rows) rowMap[row.ter.id] = row;

    return this.getTerritories().map(ter => {
      const layout = this.mapLayout[ter.id] || { x: 10, y: 10, w: 20, h: 16 };
      const row = rowMap[ter.id];
      const owner = row ? row.owner : null;
      const meta = owner ? this._factionMeta(owner) : null;
      const yours = reveal && owner === pledged;
      const neutral = ter.home == null;
      const pushing = !!(row && row.lead && row.lead !== owner && row.max > 0);
      return {
        ter,
        layout,
        owner,
        meta,
        yours,
        contested: neutral || pushing,
        neutral,
        home: ter.home,
        infLead: row ? row.lead : null,
        infMax: row ? row.max : 0,
        infNeed: this.CAPTURE_NEED,
        infBars: row ? row.bars : [],
        hidden: !reveal,
      };
    });
  },

  /** Grenzen zwischen Territorien mit unterschiedlicher Fraktion */
  getFrontLines(d) {
    if (!d.factionWar) return [];
    const fw = d.factionWar;
    const pledged = fw.pledged;
    const lines = [];
    for (const pair of this.mapEdges) {
      const a = pair[0], b = pair[1];
      const oa = fw.territories[a], ob = fw.territories[b];
      if (!oa || !ob || oa === ob) continue;
      const la = this.mapLayout[a], lb = this.mapLayout[b];
      if (!la || !lb) continue;
      const ca = this._regionCenter(la), cb = this._regionCenter(lb);
      lines.push({
        a, b,
        key: this._edgeKey(a, b),
        x1: ca.x, y1: ca.y, x2: cb.x, y2: cb.y,
        metaA: this._factionMeta(oa),
        metaB: this._factionMeta(ob),
        ownerA: oa, ownerB: ob,
        yours: !!(pledged && (oa === pledged || ob === pledged)),
      });
    }
    return lines;
  },

  frontSummary(d) {
    if (!d.factionWar) this.ensure(d);
    const pledged = d.factionWar.pledged;
    const lines = this.getFrontLines(d);
    let yourFronts = 0;
    for (const l of lines) {
      if (pledged && (l.ownerA === pledged || l.ownerB === pledged)) yourFronts++;
    }
    return { active: lines.length, yourFronts };
  },

  /** Daten für Kriegsübersicht (ohne Karte) */
  warBriefing(d) {
    this.ensure(d);
    const fw = d.factionWar;
    const reveal = this.canViewIntel(d);
    const combined = this._combinedScores(fw);
    const leader = this._winnerFromScores(combined);
    const pledged = fw.pledged;
    const infRows = reveal ? this._influenceRows(fw) : [];
    const contested = infRows.filter(r => r.lead && r.lead !== r.owner && r.max > 0).length;

    const factions = this.factions.map(f => {
      const territories = [];
      if (reveal) {
        for (const ter of this.getTerritories()) {
          if (fw.territories[ter.id] === f.id) territories.push(ter);
        }
      }
      return {
        ...f,
        points: combined[f.id] || 0,
        playerPts: fw.scores[f.id] || 0,
        worldPts: fw.worldScores[f.id] || 0,
        territories,
        terCount: territories.length,
        isLeader: f.id === leader,
        isYours: f.id === pledged,
      };
    }).sort((a, b) => b.points - a.points);

    return {
      reveal,
      weekKey: fw.weekKey,
      leader,
      leaderMeta: this._factionMeta(leader),
      pledged,
      pledgedMeta: pledged ? this._factionMeta(pledged) : null,
      factions,
      totalTerritories: this.getTerritories().length,
      contested,
    };
  },

  /** Spieler-Fraktion (Schwur oder Operator-Herkunft) */
  alliedFaction(d) {
    d = d || (BH.Progress && BH.Progress.data);
    if (!d) return "TF NACHTFALKE";
    this.ensure(d);
    return d.factionWar.pledged || this.operatorFaction(d.operator);
  },

  /** Gegner-Fraktionen relativ zur eigenen Allianz */
  enemyFactions(alliedId) {
    return this.factions.filter(f => f.id !== alliedId);
  },

  /** Team A = eigene Fraktion · Team B / FFA = nur Gegner-Fraktionen (kein 25/25/25/25-Split) */
  botFaction(team, idx) {
    const i = typeof idx === "number" ? idx : 0;
    const allied = this.alliedFaction();
    const enemies = this.enemyFactions(allied);
    const pickEnemy = () => {
      if (!enemies.length) return allied;
      return enemies[i % enemies.length].id;
    };

    if (team === "A") return allied;
    if (team === "B") return pickEnemy();
    if (team && String(team).charAt(0) === "F") return pickEnemy();
    return pickEnemy();
  },

  /** Verbündete KI (Team A) zählt zu Spieler-Punkten, feindliche KI zu Welt-Punkten */
  _scoreBucket(fw, sb) {
    if (sb.isPlayer) return fw.scores;
    if (sb.team === "A") return fw.scores;
    return fw.worldScores;
  },

  /** Wöchentlichen Fraktionsstand zurücksetzen (Territorien, Punkte, Auftrag) */
  resetStandings(d) {
    this.ensure(d);
    const fw = d.factionWar;
    const wk = fw.weekKey;
    fw.scores = {};
    fw.worldScores = {};
    for (const f of this.factions) {
      fw.scores[f.id] = 0;
      fw.worldScores[f.id] = 0;
    }
    fw.territories = this._defaultTerritories();
    fw.territoryInfluence = {};
    fw.captureLog = [];
    fw.contrib = 0;
    fw.milestoneClaimed = [];
    fw.contractProg = 0;
    fw.contractDone = false;
    fw.contractId = this._pickContract(wk, fw.pledged);
    fw.pendingReward = null;
    BH.Progress.save();
    return { ok: true };
  },

  /** Bot-Kills und Team-Siege als Fraktionspunkte (KI-Front) — Alias für trackMatchKills */
  trackBotMatch(d, payload) {
    return this.trackMatchKills(d, payload);
  },

  /** Jeder Kill (Spieler + KI) = 1 Fraktionspunkt; Sieg-Bonus für KI-Teams */
  trackMatchKills(d, payload) {
    this.ensure(d);
    const fw = d.factionWar;
    const board = (payload && payload.scoreboard) || [];
    const winningTeam = payload && payload.winningTeam;
    const gains = {};

    for (const sb of board) {
      if (!sb.faction) continue;
      const kills = sb.kills || 0;
      if (kills > 0) {
        const bucket = this._scoreBucket(fw, sb);
        bucket[sb.faction] = (bucket[sb.faction] || 0) + kills;
        gains[sb.faction] = (gains[sb.faction] || 0) + kills;
      }
      if (winningTeam && sb.team === winningTeam && !sb.isPlayer) {
        const bucket = this._scoreBucket(fw, sb);
        bucket[sb.faction] = (bucket[sb.faction] || 0) + 1;
        gains[sb.faction] = (gains[sb.faction] || 0) + 1;
      }
    }
    BH.Progress.save();
    return gains;
  },

  getTerritories() {
    return BH.SeasonRelease ? BH.SeasonRelease.liveTerritories(this.territories) : this.territories;
  },

  ensure(d) {
    const wk = this._weekKey();
    if (!d.factionWar) {
      d.factionWar = {
        weekKey: wk,
        scores: {},
        worldScores: this._seedWorld(wk),
        contrib: 0,
        pledged: null,
        pledgedLocked: false,
        contractId: this._pickContract(wk, null),
        contractProg: 0,
        contractDone: false,
        territories: this._defaultTerritories(),
        territoryInfluence: {},
        captureLog: [],
        pendingReward: null,
        history: [],
        totalFwp: 0,
        milestoneClaimed: [],
      };
    }
    const fw = d.factionWar;
    if (!fw.scores || typeof fw.scores !== "object") fw.scores = {};
    if (!fw.worldScores || typeof fw.worldScores !== "object") fw.worldScores = {};
    for (const f of this.factions) {
      if (typeof fw.scores[f.id] !== "number") fw.scores[f.id] = 0;
      if (typeof fw.worldScores[f.id] !== "number") fw.worldScores[f.id] = 0;
    }
    if (!fw.territories) fw.territories = this._defaultTerritories();
    const defaultTer = this._defaultTerritories();
    for (const id of Object.keys(defaultTer)) {
      if (!fw.territories[id]) fw.territories[id] = defaultTer[id];
    }
    if (!fw.history) fw.history = [];
    if (!Array.isArray(fw.milestoneClaimed)) fw.milestoneClaimed = [];
    if (!fw.territoryInfluence || typeof fw.territoryInfluence !== "object") fw.territoryInfluence = {};
    if (!Array.isArray(fw.captureLog)) fw.captureLog = [];
    if (typeof fw.contrib !== "number") fw.contrib = 0;
    if (typeof fw.totalFwp !== "number") fw.totalFwp = 0;
    if (typeof fw.contractDone !== "boolean") fw.contractDone = false;
    if (!fw.contractId) fw.contractId = this._pickContract(wk, fw.pledged);
    if (fw.pledged && fw.pledgedLocked !== true) fw.pledgedLocked = true;
    if (typeof fw.pledgedLocked !== "boolean") fw.pledgedLocked = !!fw.pledged;

    if (fw.weekKey !== wk) {
      this._rollWeek(d, fw, wk);
    }
    if (!fw.worldScores || !Object.keys(fw.worldScores).length) {
      fw.worldScores = this._seedWorld(fw.weekKey);
    }
  },

  _combinedScores(fw) {
    const out = {};
    for (const f of this.factions) {
      out[f.id] = (fw.scores[f.id] || 0) + (fw.worldScores[f.id] || 0);
    }
    return out;
  },

  _winnerFromScores(scores) {
    let best = this.factions[0].id, max = -1;
    for (const f of this.factions) {
      if ((scores[f.id] || 0) > max) { max = scores[f.id]; best = f.id; }
    }
    return best;
  },

  _winRewardTier(contrib) {
    if (contrib >= 200) return { tier: "Gold", mult: 1.55, emblem: true };
    if (contrib >= 100) return { tier: "Silber", mult: 1.3, emblem: true };
    if (contrib >= 25) return { tier: "Bronze", mult: 1, emblem: false };
    return null;
  },

  _rollWeek(d, fw, newWeekKey) {
    const combined = this._combinedScores(fw);
    const winner = this._winnerFromScores(combined);
    fw.history = (fw.history || []).slice(0, 7);
    fw.history.unshift({ week: fw.weekKey, winner, scores: { ...combined } });

    if (fw.pledged === winner && fw.contrib >= 25 && !fw.pendingReward) {
      const tier = this._winRewardTier(fw.contrib);
      const baseCredits = 500 + Math.min(500, fw.contrib * 2);
      const baseXp = 180 + Math.min(250, Math.floor(fw.contrib / 2));
      const meta = this._factionMeta(winner);
      fw.pendingReward = {
        week: fw.weekKey,
        winner,
        winnerName: meta.name,
        tier: tier ? tier.tier : "Bronze",
        credits: Math.round(baseCredits * (tier ? tier.mult : 1)),
        xp: Math.round(baseXp * (tier ? tier.mult : 1)),
        fwp: fw.contrib,
        emblem: tier && tier.emblem ? this.factionEmblems[winner] : null,
      };
    }

    this._shiftTerritories(fw.territories, winner, combined);

    fw.weekKey = newWeekKey;
    fw.scores = {};
    for (const f of this.factions) fw.scores[f.id] = 0;
    fw.worldScores = this._seedWorld(newWeekKey);
    fw.contrib = 0;
    fw.milestoneClaimed = [];
    fw.territoryInfluence = {};
    fw.captureLog = [];
    fw.contractId = this._pickContract(newWeekKey, fw.pledged);
    fw.contractProg = 0;
    fw.contractDone = false;
    BH.Progress.save();
  },

  _shiftTerritories(territories, winner, combined) {
    const live = BH.SeasonRelease ? BH.SeasonRelease.liveTerritories(this.territories) : this.territories;
    const contested = live.filter(t => !t.home).map(t => t.id);
    if (!contested.length) return;
    const h = this._hash(winner + JSON.stringify(combined));
    const target = contested[h % contested.length];
    territories[target] = winner;

    const loser = this.factions.slice().sort((a, b) =>
      (combined[a.id] || 0) - (combined[b.id] || 0))[0].id;
    const loserHome = live.find(t => t.home === loser);
    if (loserHome && loser !== winner) {
      const neighbor = this.mapEdges.find(pair =>
        (pair[0] === loserHome.id || pair[1] === loserHome.id) &&
        territories[pair[0] === loserHome.id ? pair[1] : pair[0]] === winner);
      if (neighbor) territories[loserHome.id] = winner;
    }
  },

  pledge(d, factionId) {
    this.ensure(d);
    if (!this.factions.some(f => f.id === factionId)) return { ok: false, error: "Ungültige Fraktion." };
    const fw = d.factionWar;
    if (fw.pledgedLocked && fw.pledged && fw.pledged !== factionId) {
      return { ok: false, error: "Deine Fraktion ist endgültig gewählt und kann nicht gewechselt werden." };
    }
    fw.pledged = factionId;
    fw.pledgedLocked = true;
    if (!fw.contractDone) {
      fw.contractId = this._pickContract(fw.weekKey, factionId);
      fw.contractProg = 0;
    }
    BH.Progress.save();
    return { ok: true };
  },

  _grantEmblem(d, emblemId) {
    if (!emblemId) return false;
    if (!d.owned.emblems) d.owned.emblems = [];
    if (d.owned.emblems.includes(emblemId)) return false;
    d.owned.emblems.push(emblemId);
    return true;
  },

  claimPending(d) {
    this.ensure(d);
    const pr = d.factionWar.pendingReward;
    if (!pr) return { ok: false, error: "Keine ausstehende Belohnung." };
    d.credits = (d.credits || 0) + pr.credits;
    let emblemGranted = false;
    if (pr.emblem) emblemGranted = this._grantEmblem(d, pr.emblem);
    d.factionWar.pendingReward = null;
    BH.Progress.save();
    const xpRes = BH.Progress.addXp(pr.xp || 0);
    return { ok: true, reward: pr, xpRewards: xpRes.rewards || xpRes, emblemGranted };
  },

  milestoneRows(d) {
    this.ensure(d);
    const c = d.factionWar.contrib || 0;
    const claimed = d.factionWar.milestoneClaimed || [];
    return this.milestones.map(ms => ({
      ...ms,
      prog: Math.min(100, (c / ms.fwp) * 100),
      done: c >= ms.fwp,
      claimed: claimed.includes(ms.id),
      canClaim: c >= ms.fwp && !claimed.includes(ms.id),
    }));
  },

  claimMilestone(d, msId) {
    this.ensure(d);
    const ms = this.milestones.find(m => m.id === msId);
    if (!ms) return { ok: false, error: "Unbekannte Belohnung." };
    const fw = d.factionWar;
    if ((fw.contrib || 0) < ms.fwp) return { ok: false, error: "Noch nicht genug FWP." };
    if ((fw.milestoneClaimed || []).includes(msId)) return { ok: false, error: "Bereits abgeholt." };
    fw.milestoneClaimed.push(msId);
    d.credits = (d.credits || 0) + ms.credits;
    BH.Progress.save();
    const xpRes = BH.Progress.addXp(ms.xp || 0);
    return { ok: true, milestone: ms, xpRewards: xpRes.rewards || xpRes };
  },

  personalRank(d) {
    this.ensure(d);
    const c = d.factionWar.contrib || 0;
    let rank = this.ranks[0];
    for (const r of this.ranks) if (c >= r.min) rank = r;
    const next = this.ranks[this.ranks.indexOf(rank) + 1];
    return {
      ...rank,
      contrib: c,
      next: next ? next.name : null,
      need: next ? next.min - c : 0,
      progress: next ? Math.min(100, (c - rank.min) / (next.min - rank.min) * 100) : 100,
    };
  },

  recordWin(d, operatorId) {
    this.ensure(d);
    const f = d.factionWar.pledged;
    if (!f) return null;
    d.factionWar.scores[f] = (d.factionWar.scores[f] || 0) + 1;
    this._addContrib(d, 12, f);
    BH.Progress.save();
    return f;
  },

  trackMatch(d, payload) {
    this.ensure(d);
    const fw = d.factionWar;
    const pledged = fw.pledged;
    if (!pledged) return null;
    let fwp = 4;
    const kills = (payload && payload.kills) || 0;
    const wins = (payload && payload.wins) || 0;
    const mode = payload && payload.mode;
    const headshots = (payload && payload.headshots) || 0;

    if (kills) fwp += Math.min(15, kills * 2);
    if (wins) fwp += 10 * wins;

    this._addContrib(d, fwp, pledged);

    if (!fw.contractDone && fw.contractId) {
      const c = this._contractDef(fw.contractId);
      let add = 0;
      if (c.type === "kills") add = kills;
      else if (c.type === "wins") add = wins;
      else if (c.type === "matches") add = 1;
      else if (c.type === "mode_wins" && wins && mode === c.mode) add = wins;
      else if (c.type === "headshots") add = headshots;
      fw.contractProg = (fw.contractProg || 0) + add;
      if (fw.contractProg >= c.target) {
        fw.contractDone = true;
        d.credits = (d.credits || 0) + c.reward;
        if (c.xp) BH.Progress.addXp(c.xp);
        this._addContrib(d, c.fwp, pledged, false);
        BH.Progress.save();
        return { contractDone: true, contract: c };
      }
    }
    BH.Progress.save();
    return null;
  },

  _addContrib(d, amount, factionId, save) {
    if (amount <= 0) return;
    d.factionWar.contrib = (d.factionWar.contrib || 0) + amount;
    d.factionWar.totalFwp = (d.factionWar.totalFwp || 0) + amount;
    if (save !== false) BH.Progress.save();
  },

  leader(d) {
    this.ensure(d);
    const combined = this._combinedScores(d.factionWar);
    const winner = this._winnerFromScores(combined);
    return { faction: winner, meta: this._factionMeta(winner), scores: d.factionWar.scores, combined, bonus: 0.1 };
  },

  standings(d) {
    this.ensure(d);
    const combined = this._combinedScores(d.factionWar);
    const total = this.factions.reduce((s, f) => s + (combined[f.id] || 0), 0) || 1;
    return this.factions.map(f => ({
      ...f,
      player: d.factionWar.scores[f.id] || 0,
      world: d.factionWar.worldScores[f.id] || 0,
      total: combined[f.id] || 0,
      pct: total > 0 ? Math.round((combined[f.id] || 0) / total * 1000) / 10 : 0,
      pledged: d.factionWar.pledged === f.id,
    })).sort((a, b) => b.total - a.total);
  },

  territoryOwner(d, mapId) {
    this.ensure(d);
    return (d.factionWar.territories && d.factionWar.territories[mapId]) || null;
  },

  territoryBonus(d, mapId) {
    this.ensure(d);
    const pledged = d.factionWar.pledged;
    if (!pledged) return null;
    const owner = this.territoryOwner(d, mapId);
    if (!owner || owner !== pledged) return null;
    const ter = this.territories.find(t => t.id === mapId);
    const meta = this._factionMeta(owner);
    const isHome = ter && ter.home === owner;
    return {
      label: (isHome ? "Heimat-" : "Territorium-") + "Bonus: +6 % XP",
      xp: isHome ? 1.08 : 1.06,
      faction: meta.name,
    };
  },

  playerBonus(d) {
    this.ensure(d);
    const pledged = d.factionWar.pledged;
    if (!pledged) return null;
    const lead = this.leader(d);
    const rank = this.personalRank(d);
    let mult = 1;
    let parts = [];

    if (pledged === lead.faction) {
      mult *= 1.1;
      parts.push("+10 % Credits (Fraktion führt)");
    }
    if (rank.credMult > 1) {
      mult *= rank.credMult;
      parts.push("+" + Math.round((rank.credMult - 1) * 100) + " % (" + rank.name + ")");
    }
    if (mult <= 1) return null;
    return { label: parts.join(" · "), mult, xpMult: rank.xpMult };
  },

  xpBonus(d) {
    const pb = this.playerBonus(d);
    return pb && pb.xpMult > 1 ? pb.xpMult : 1;
  },

  contractStatus(d) {
    this.ensure(d);
    const c = this._contractDef(d.factionWar.contractId);
    return {
      def: c,
      prog: d.factionWar.contractProg || 0,
      done: d.factionWar.contractDone,
    };
  },

  applyMatchInfluence(d, payload) {
    this.ensure(d);
    const mapId = payload && payload.mapId;
    if (!mapId) return null;

    const fw = d.factionWar;
    const pledged = fw.pledged;
    const board = (payload && payload.scoreboard) || [];
    const wins = (payload && payload.wins) || 0;
    const inf = fw.territoryInfluence;
    if (!inf[mapId] || typeof inf[mapId] !== "object") inf[mapId] = {};

    let added = false;
    for (const sb of board) {
      if (!sb.faction) continue;
      const kills = sb.kills || 0;
      if (kills <= 0) continue;
      inf[mapId][sb.faction] = (inf[mapId][sb.faction] || 0) + kills;
      added = true;
    }
    if (wins > 0 && pledged) {
      inf[mapId][pledged] = (inf[mapId][pledged] || 0) + wins * 4;
      added = true;
    }
    if (!added) return { mapId, influence: inf[mapId] || {} };

    const owner = fw.territories[mapId];
    let best = null, max = 0;
    for (const fid of Object.keys(inf[mapId])) {
      if (inf[mapId][fid] > max) { max = inf[mapId][fid]; best = fid; }
    }

    let captured = null;
    if (max >= this.CAPTURE_NEED && best && best !== owner) {
      const prev = owner;
      fw.territories[mapId] = best;
      fw.territoryInfluence[mapId] = {};
      const ter = this._terById(mapId);
      const meta = this._factionMeta(best);
      const prevMeta = this._factionMeta(prev);
      this._logCapture(d,
        `${meta.icon} ${meta.shortName} erobert ${ter.emoji} ${ter.short || ter.name} (${prevMeta.shortName} → ${meta.shortName})`);
      captured = { mapId, faction: best, previous: prev };
    }

    BH.Progress.save();
    return { mapId, influence: inf[mapId] || {}, captured, leading: best, points: max, need: this.CAPTURE_NEED };
  },

  influenceRows(d) {
    this.ensure(d);
    return this._influenceRows(d.factionWar);
  },

  _influenceRows(fw) {
    const rows = [];
    for (const ter of this.getTerritories()) {
      const inf = (fw.territoryInfluence && fw.territoryInfluence[ter.id]) || {};
      let lead = null, max = 0;
      const bars = [];
      for (const f of this.factions) {
        const v = inf[f.id] || 0;
        if (v > 0) bars.push({ id: f.id, meta: f, value: v });
        if (v > max) { max = v; lead = f.id; }
      }
      bars.sort((a, b) => b.value - a.value);
      rows.push({ ter, influence: inf, lead, max, need: this.CAPTURE_NEED, owner: fw.territories[ter.id], bars });
    }
    return rows;
  },
};
