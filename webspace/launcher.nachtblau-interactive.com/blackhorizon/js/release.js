/* Saison-Freigabe – Inhalte vorbereiten, ohne sie live zu schalten.
 *
 * Saison 2 veröffentlichen: s2.published = true
 * (oder einzelne Flags für gestaffeltes Testing setzen)
 */
window.BH = window.BH || {};

BH.RELEASE = {
  activeSeason: 1,
  earlyAccess: true,
  features: {
    crates: true,
  },
  s2: {
    published: false,
    campaign: false,
    battlePass: false,
    mapTower: false,
    operatorWraith: false,
    operators: false,
    factionTower: false,
    eventCrateHorizon: false,
    eventCrateBeta: false,
    clanExt: false,
    clanMatches: false,
    clanMatchesTest: false,
    finishers: false,
    /* Early Access — Saison 2 Start (launchAt hat Vorrang) */
    launchAt: "2026-08-01T18:00:00.000Z",
    launchLabel: "1.8.2026",
    launchInDays: 40,
    launchAnchor: "2026-06-13T18:00:00.000Z",
    launchStorageKey: "bh_s2_launch_at_v2",
  },
};

BH.SeasonRelease = {
  isS2Feature(key) {
    const s2 = BH.RELEASE.s2;
    if (s2.published) return true;
    return !!s2[key];
  },

  isS2Live() {
    return this.isS2Feature("published");
  },

  effectiveBpSeason(data) {
    const s = (data && data.bpSeason) || 1;
    if (s >= 2 && !this.isS2Feature("battlePass")) return 1;
    return s;
  },

  maxCampaignMissions() {
    return this.isS2Feature("campaign") ? 6 : 4;
  },

  isCampaignChapterSeasonLocked(chapterIdx) {
    return chapterIdx >= 4 && !this.isS2Feature("campaign");
  },

  filterMapPool(pool) {
    if (this.isS2Feature("mapTower")) return pool;
    return pool.filter(m => m.id !== "tower");
  },

  liveTerritories(all) {
    if (this.isS2Feature("factionTower")) return all;
    return all.filter(t => t.id !== "tower");
  },

  clampSaveData(data) {
    if (!data) return;
    const maxCamp = this.maxCampaignMissions();
    if ((data.campaignMission || 0) > maxCamp) data.campaignMission = maxCamp;
    if (data.campaignComplete && maxCamp < 6) data.campaignComplete = false;
    if ((data.bpSeason || 1) >= 2 && !this.isS2Feature("battlePass")) {
      /* Fortschritt bleibt gespeichert – UI nutzt effectiveBpSeason() */
    }
    if (!this.isS2Feature("operatorWraith")) {
      for (const id of ["wraith", "spectre"]) {
        if (data.operator === id) data.operator = "recruit";
      }
    }
    if (!this.isS2Feature("finishers")) {
      data.finisher = null;
    }
  },

  getS2LaunchAt() {
    const s2 = BH.RELEASE.s2;
    if (s2.launchAt) return new Date(s2.launchAt);
    if (s2.launchAnchor && s2.launchInDays) {
      const d = new Date(s2.launchAnchor);
      d.setUTCDate(d.getUTCDate() + s2.launchInDays);
      d.setUTCHours(20, 0, 0, 0);
      return d;
    }
    const key = s2.launchStorageKey || "bh_s2_launch_at_v2";
    try {
      let stored = localStorage.getItem(key);
      if (!stored) {
        const d = new Date();
        d.setDate(d.getDate() + (s2.launchInDays || 40));
        d.setHours(20, 0, 0, 0);
        stored = d.toISOString();
        localStorage.setItem(key, stored);
      }
      const launch = new Date(stored);
      if (!isNaN(launch.getTime())) return launch;
    } catch (e) { /* localStorage blockiert */ }
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + (s2.launchInDays || 40));
    fallback.setHours(20, 0, 0, 0);
    return fallback;
  },

  getS2Countdown() {
    if (this.isS2Live()) {
      return { live: true, expired: false, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    const launch = this.getS2LaunchAt();
    if (!launch || isNaN(launch.getTime())) return null;
    const diff = launch.getTime() - Date.now();
    if (diff <= 0) {
      return { live: false, expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, launch };
    }
    return {
      live: false,
      expired: false,
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      launch,
    };
  },

  formatCountdown(cd) {
    if (!cd) return "—";
    if (cd.live) return "JETZT LIVE";
    if (cd.expired) return "STARTET IN KÜRZE";
    const pad = (n) => String(n).padStart(2, "0");
    return `${cd.days}T ${pad(cd.hours)}:${pad(cd.minutes)}:${pad(cd.seconds)}`;
  },

  formatLaunchDate(cd) {
    const launch = cd && cd.launch;
    if (!launch) return "";
    try {
      return launch.toLocaleDateString("de-DE", {
        weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch (e) {
      return launch.toISOString().slice(0, 10);
    }
  },

  s2LaunchDateLabel() {
    const s2 = BH.RELEASE.s2;
    if (s2.launchLabel) return s2.launchLabel;
    const launch = this.getS2LaunchAt();
    if (!launch || isNaN(launch.getTime())) return "1.8.2026";
    return launch.toLocaleDateString("de-DE", {
      day: "numeric", month: "numeric", year: "numeric",
    });
  },

  isEarlyAccess() {
    return !!(BH.RELEASE.earlyAccess && !this.isS2Live());
  },

  earlyAccessNotice() {
    if (!this.isEarlyAccess()) return "";
    return "Early Access · Saison 1 · Saison 2 ab " + this.s2LaunchDateLabel();
  },

  earlyAccessBanner() {
    if (!this.isEarlyAccess()) return "";
    return "EARLY ACCESS · SAISON 1 · ASCHEFRONT";
  },

  earlyAccessBannerWithS2() {
    if (!this.isEarlyAccess()) return "";
    return "EARLY ACCESS · SAISON 1 · S2 AM " + this.s2LaunchDateLabel();
  },

  s2StartsOnNotice() {
    if (this.isS2Live()) return "";
    return "Saison 2 ab " + this.s2LaunchDateLabel();
  },

  s2LockedLabel() {
    if (this.isS2Live()) return "Saison 2";
    return "Saison 2 · " + this.s2LaunchDateLabel();
  },
};
