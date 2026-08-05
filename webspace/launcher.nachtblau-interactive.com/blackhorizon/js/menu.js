/* Menüsteuerung: Screens, Loadout, Battle Pass, Ränge, Spielstart */
window.BH = window.BH || {};

BH.Menu = class {
  constructor() {
    BH.Progress.load();
    if (BH.Social) BH.Social.touchPresence(BH.Progress.data);
    if (BH.LoadoutPresets) {
      BH.LoadoutPresets.ensure(BH.Progress.data);
      this.loadout = BH.LoadoutPresets.getActive(BH.Progress.data);
    } else {
      this.loadout = BH.Progress.data.loadout || {
        weaponId: "ar",
        attachments: { optic: "none", barrel: "none", grip: "none", mag: "none" },
        secondaryWeaponId: "pistol",
        secondaryAttachments: { optic: "none", barrel: "none", grip: "none", mag: "none" },
        camo: "black",
        equipmentId: "frag",
      };
    }
    this.game = null;
    this.shopFilter = "camos";
    this._s2CdTimer = null;
    this._opPreviewId = null;
    this._opRarityFilter = "all";
    this._loadoutTab = "weapon";
    this._loadoutSlot = "primary";
    this._weaponFilter = "standard";
    this._showLockedCamos = false;
    this._bpTab = "rewards";
    this._ranksTab = "prestige";
    this._ranksInfoPrestige = null;
    this._profileTab = "identity";
    this._socialTab = "friends";
    this._factionTab = "war";
    this._fwPledgePick = null;
    this._devblogTab = "news";
    this._settingsTab = "gameplay";
    this._clanTab = "home";
    this._modesTab = "pvp";

    this._crateOpenType = null;

    document.addEventListener("click", () => {
      BH.audio.unlock();
      if (BH.OperatorVoices) BH.OperatorVoices._loadVoices();
    }, { once: true });

    // Navigation
    document.querySelectorAll("[data-screen]").forEach(btn => {
      btn.addEventListener("click", () => {
        BH.audio.unlock(); BH.audio.click();
        this.showScreen(btn.dataset.screen);
      });
    });

    // Modus-Karten
    document.querySelectorAll(".mode-card[data-mode]").forEach(card => {
      card.addEventListener("click", () => {
        BH.audio.unlock();
        const mode = card.dataset.mode;
        if (BH.ComingSoonModes && BH.ComingSoonModes.isComingSoon(mode)) {
          BH.audio.empty();
          this.showComingSoonNotice(mode);
          return;
        }
        if (BH.ModeMaintenance && BH.ModeMaintenance.isActive(mode)) {
          BH.audio.empty();
          this.showMaintenanceNotice(mode);
          return;
        }
        this.startGame(mode);
      });
    });

    document.querySelectorAll("[data-campaign-chapter]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (btn.classList.contains("locked")) return;
        BH.audio.unlock(); BH.audio.click();
        this.startCampaignChapter(parseInt(btn.dataset.campaignChapter, 10));
      });
    });

    const mapPickWrap = document.getElementById("map-pick-wrap");
    if (mapPickWrap && !mapPickWrap._bound) {
      mapPickWrap._bound = true;
      mapPickWrap.addEventListener("click", e => {
        const modeBtn = e.target.closest("[data-map-pick]");
        if (modeBtn) {
          e.stopPropagation();
          BH.audio.unlock(); BH.audio.click();
          this.setMapPickMode(modeBtn.dataset.mapPick);
          return;
        }
        const card = e.target.closest("[data-map-id]");
        if (card) {
          e.stopPropagation();
          BH.audio.unlock(); BH.audio.click();
          this.selectMap(card.dataset.mapId);
        }
      });
    }

    // Schnellstart: zuletzt gespielten Modus direkt starten
    document.getElementById("btn-quickstart").addEventListener("click", () => {
      BH.audio.unlock();
      let mode = BH.Progress.data.lastMode || "tdm";
      if (BH.ModeMaintenance && BH.ModeMaintenance.isActive(mode)) mode = "tdm";
      this.startGame(mode);
    });

    const roadmapWarnBtn = document.getElementById("btn-roadmap-warn");
    if (roadmapWarnBtn && !roadmapWarnBtn._bound) {
      roadmapWarnBtn._bound = true;
      roadmapWarnBtn.addEventListener("click", () => {
        BH.audio.unlock();
        BH.audio.click();
        this.showRoadmapNotice();
      });
    }

    // Pause-Buttons
    document.getElementById("btn-resume").addEventListener("click", () => {
      if (this.game) this.game.setPaused(false);
    });
    document.getElementById("btn-quit").addEventListener("click", () => {
      if (!this.game) return;
      this.game.endGame({
        title: "MATCH ABGEBROCHEN",
        stats: [["Kills", this.game.player.kills], ["Tode", this.game.player.deaths]],
        xpBreakdown: [["Teilnahme", 50]],
        deltas: { matches: 1, kills: this.game.player.kills, deaths: this.game.player.deaths },
      });
    });

    document.getElementById("btn-end-continue").addEventListener("click", () => {
      BH.audio.click();
      document.getElementById("screen-end").classList.add("hidden");
      document.getElementById("menu-root").classList.remove("hidden");
      this.showScreen("home");
    });

    document.querySelectorAll(".shop-tab[data-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        BH.audio.click();
        this.shopFilter = btn.dataset.filter;
        this.applyShopFilter();
      });
    });

    document.querySelectorAll(".ranks-tab[data-ranks-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        BH.audio.click();
        this._ranksTab = btn.dataset.ranksTab;
        this.applyRanksTab();
        if (btn.dataset.ranksTab === "info") {
          this.renderPrestigeInfo();
        }
      });
    });

    document.querySelectorAll(".profile-tab[data-profile-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        BH.audio.click();
        this._profileTab = btn.dataset.profileTab;
        this.applyProfileTab();
      });
    });

    document.querySelectorAll(".social-tab[data-social-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        BH.audio.click();
        this._socialTab = btn.dataset.socialTab;
        this.applySocialTab();
      });
    });

    document.querySelectorAll(".fw-tab[data-fw-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        BH.audio.click();
        this._factionTab = btn.dataset.fwTab;
        this.applyFactionTab();
      });
    });

    document.querySelectorAll(".dblog-tab[data-dblog-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        BH.audio.click();
        this._devblogTab = btn.dataset.dblogTab;
        this.applyDevblogTab();
      });
    });

    document.querySelectorAll(".settings-tab[data-settings-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        BH.audio.click();
        this._settingsTab = btn.dataset.settingsTab;
        this.applySettingsTab();
      });
    });

    document.querySelectorAll(".clan-tab[data-clan-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        BH.audio.click();
        this._clanTab = btn.dataset.clanTab;
        this.applyClanTab();
      });
    });

    document.querySelectorAll(".modes-tab[data-modes-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        BH.audio.click();
        this._modesTab = btn.dataset.modesTab;
        this.applyModesTab();
      });
    });

    const btnModesDeploy = document.getElementById("btn-modes-deploy");
    if (btnModesDeploy && !btnModesDeploy._bound) {
      btnModesDeploy._bound = true;
      btnModesDeploy.addEventListener("click", () => {
        BH.audio.unlock();
        let mode = BH.Progress.data.lastMode || "tdm";
        if (BH.ModeMaintenance && BH.ModeMaintenance.isActive(mode)) mode = "tdm";
        this.startGame(mode);
      });
    }

    document.querySelectorAll(".devblog-home-teaser[data-screen]").forEach(el => {
      el.addEventListener("click", () => {
        BH.audio.click();
        this.showScreen(el.dataset.screen);
      });
    });

    this.initFeedback();
    this.initCrates();

    const btnInsp = document.getElementById("btn-weapon-inspect");
    if (btnInsp) btnInsp.addEventListener("click", () => this.openWeaponInspect());
    const btnInspClose = document.getElementById("btn-inspect-close");
    if (btnInspClose) btnInspClose.addEventListener("click", () => {
      document.getElementById("inspect-overlay").classList.add("hidden");
      BH.audio.click();
    });

    const btnOpSkillsClose = document.getElementById("btn-op-skills-close");
    if (btnOpSkillsClose) btnOpSkillsClose.addEventListener("click", () => this.closeOpSkills());
    const opSkillsOverlay = document.getElementById("op-skills-overlay");
    if (opSkillsOverlay) {
      opSkillsOverlay.addEventListener("click", (e) => {
        if (e.target === opSkillsOverlay) this.closeOpSkills();
      });
    }

    document.querySelectorAll(".loadout-tab[data-lo-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        BH.audio.click();
        this._loadoutTab = btn.dataset.loTab;
        document.querySelectorAll(".loadout-tab[data-lo-tab]").forEach(b =>
          b.classList.toggle("active", b.dataset.loTab === this._loadoutTab));
        document.querySelectorAll(".loadout-panel[data-lo-panel]").forEach(p =>
          p.classList.toggle("active", p.dataset.loPanel === this._loadoutTab));
      });
    });
    document.querySelectorAll(".lo-filter[data-wfilter]").forEach(btn => {
      btn.addEventListener("click", () => {
        BH.audio.click();
        this._weaponFilter = btn.dataset.wfilter;
        document.querySelectorAll(".lo-filter[data-wfilter]").forEach(b =>
          b.classList.toggle("active", b.dataset.wfilter === this._weaponFilter));
        this.renderLoadout();
      });
    });
    document.querySelectorAll(".lo-slot[data-lo-slot]").forEach(btn => {
      btn.addEventListener("click", () => {
        BH.audio.click();
        this._setLoadoutSlot(btn.dataset.loSlot);
      });
    });
    const loPriWrap = document.getElementById("lo-sum-primary-wrap");
    const loSecWrap = document.getElementById("lo-sum-secondary");
    if (loPriWrap) loPriWrap.addEventListener("click", () => { BH.audio.click(); this._setLoadoutSlot("primary"); });
    if (loSecWrap) loSecWrap.addEventListener("click", () => { BH.audio.click(); this._setLoadoutSlot("secondary"); });
    const camoToggle = document.getElementById("camo-toggle-locked");
    if (camoToggle) {
      camoToggle.addEventListener("click", () => {
        BH.audio.click();
        this._showLockedCamos = !this._showLockedCamos;
        this.renderLoadout();
      });
    }

    this.showScreen("home");
    if (BH.I18n) {
      document.documentElement.lang = BH.I18n.getLang();
      BH.I18n.apply();
    }
  }

  applyI18nDynamic() {
    if (this.currentScreen === "settings") {
      const s = BH.Settings.get();
      this.renderQualityCards(s.quality || "medium");
      this.renderLanguageGrid();
    }
  }

  refreshI18nScreen() {
    if (!BH.I18n) return;
    const id = this.currentScreen || "home";
    if (id === "home") this.renderHome();
    else if (id === "modes") this.renderModes();
    else if (id === "loadout") this.renderLoadout();
    else if (id === "shop") this.renderShop();
    else if (id === "operator") this.renderOperator();
    else if (id === "battlepass") this.renderBattlepass();
    else if (id === "eventpass") this.renderEventPass();
    else if (id === "ranks") this.renderRanks();
    else if (id === "profile") this.renderProfile();
    else if (id === "social") this.renderSocial();
    else if (id === "clan") this.renderClan();
    else if (id === "factionwar") this.renderFactionWar();
    else if (id === "settings") this.renderSettings();
    else if (id === "devblog") this.renderDevblogScreen();
    else if (id === "operation") this.renderOperationScreen();
    this.renderTopbar();
  }

  renderLanguageGrid() {
    const grid = document.getElementById("lang-grid");
    if (!grid || !BH.I18n) return;
    const cur = BH.I18n.getLang();
    const t = k => BH.I18n.t(k);
    grid.innerHTML = BH.I18n.langs.map(lang => (
      `<button type="button" class="lang-card disabled${lang.id === cur ? " active" : ""}" data-lang="${lang.id}" disabled aria-disabled="true">` +
      `<span class="lang-flag">${lang.flag}</span>` +
      `<span class="lang-native">${lang.native}</span>` +
      `<span class="lang-name">${lang.name}</span>` +
      (lang.id === cur ? `<span class="lang-badge">${t("lang_active")}</span>` : "") +
      `</button>`
    )).join("");
  }

  showScreen(id) {
    if (id !== "operator") this.closeOpSkills();
    document.querySelectorAll(".menu-screen").forEach(s => s.classList.add("hidden"));
    const screen = document.getElementById("screen-" + id);
    if (!screen) return;
    screen.classList.remove("hidden");
    this.currentScreen = id;
    if (BH.UI) BH.UI.menuEnter(screen);
    document.querySelectorAll(".tb-tab").forEach(t =>
      t.classList.toggle("active", t.dataset.screen === id));
    if (BH.Social) BH.Social.touchPresence(BH.Progress.data, { save: false });
    if (BH.I18n) BH.I18n.applyStatic();
    this.renderTopbar();
    if (id === "home") {
      this.renderHome();
      this.startS2CountdownTimer();
    } else {
      this.stopS2CountdownTimer();
      if (id !== "eventpass" && this._epTimer) {
        clearInterval(this._epTimer);
        this._epTimer = null;
      }
    }
    if (id === "battlepass") {
      this.renderBattlepass();
    }
    if (id === "eventpass") {
      this.renderEventPass();
    }
    if (id === "ranks") {
      this.renderRanks();
    }
    if (id === "loadout") this.renderLoadout();
    if (id === "shop") this.renderShop();
    if (id === "operator") this.renderOperator();
    if (id === "settings") this.renderSettings();
    if (id === "profile") this.renderProfile();
    if (id === "social") this.renderSocial();
    if (id === "clan") this.renderClan();
    if (id === "factionwar") this.renderFactionWar();
    if (id === "modes") {
      this._modesTab = this.modesTabForMode(BH.Progress.data.lastMode || "tdm");
      this.renderModes();
    }
    if (id === "operation") this.renderOperationScreen();
    if (id === "devblog") this.renderDevblogScreen();
  }

  startS2CountdownTimer() {
    this.stopS2CountdownTimer();
    this.updateS2Countdown();
    this.updateHomeLiveClock();
    if (!BH.SeasonRelease || BH.SeasonRelease.isS2Live()) {
      this._s2CdTimer = setInterval(() => this.updateHomeLiveClock(), 1000);
      this.startEventPassTimer();
      return;
    }
    this._s2CdTimer = setInterval(() => {
      this.updateS2Countdown();
      this.updateHomeLiveClock();
    }, 1000);
    this.startEventPassTimer();
  }

  updateHomeLiveClock() {
    const clock = document.getElementById("home-live-clock");
    const dateEl = document.getElementById("home-live-date");
    const now = new Date();
    if (clock) {
      const loc = BH.I18n ? BH.I18n.locale() : "de-DE";
      clock.textContent = now.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    if (dateEl) {
      const loc = BH.I18n ? BH.I18n.locale() : "de-DE";
      dateEl.textContent = now.toLocaleDateString(loc, { weekday: "short", day: "2-digit", month: "short" });
    }
    this.updateEventPassHomeWidget(BH.Progress.data);
  }

  homeGreetingText(d) {
    const h = new Date().getHours();
    const name = BH.Social ? BH.Social.displayName(d) : "Operator";
    const t = BH.I18n ? k => BH.I18n.t(k) : k => k;
    let time;
    if (h >= 5 && h < 12) time = t("greet_morning");
    else if (h >= 12 && h < 18) time = t("greet_day");
    else if (h >= 18 && h < 23) time = t("greet_evening");
    else time = t("greet_night");
    return time.replace("OPERATOR", name).replace("Operator", name);
  }

  renderHomeTactical(d, rank, lvl) {
    const el = document.getElementById("home-tactical-readout");
    if (!el) return;
    const st = d.stats || {};
    const kd = st.deaths > 0 ? (st.kills / st.deaths).toFixed(2) : (st.kills || 0).toFixed(2);
    const cells = [
      { label: "RANG", val: rank.name, sub: "Lv " + lvl.level },
      { label: "K/D", val: kd, sub: (st.kills || 0) + "K · " + (st.deaths || 0) + "D" },
      { label: "MATCHES", val: String(st.matches || 0), sub: (st.wins || 0) + " Siege" },
      { label: "CREDITS", val: "⛁ " + (d.credits || 0).toLocaleString("de-DE"), sub: d.prestige > 0 ? "✪" + d.prestige + " Prestige" : "Karriere" },
    ];
    el.innerHTML = cells.map(c =>
      `<div class="htr-cell">` +
      `<span class="htr-label">${c.label}</span>` +
      `<span class="htr-val">${c.val}</span>` +
      `<span class="htr-sub">${c.sub}</span>` +
      `</div>`
    ).join("");
  }

  stopS2CountdownTimer() {
    if (this._s2CdTimer) {
      clearInterval(this._s2CdTimer);
      this._s2CdTimer = null;
    }
  }

  updateS2Countdown() {
    const wrap = document.getElementById("sp-countdown");
    if (!wrap || !BH.SeasonRelease) return;
    const cd = BH.SeasonRelease.getS2Countdown();
    if (!cd || cd.live) {
      wrap.classList.add("hidden");
      return;
    }
    wrap.classList.remove("hidden");
    wrap.classList.toggle("expired", !!cd.expired);

    const pad = (n) => String(n).padStart(2, "0");
    const daysEl = document.getElementById("sp-cd-days");
    const hoursEl = document.getElementById("sp-cd-hours");
    const minsEl = document.getElementById("sp-cd-mins");
    const secsEl = document.getElementById("sp-cd-secs");
    const dateEl = document.getElementById("sp-countdown-date");

    if (cd.expired) {
      if (daysEl) daysEl.textContent = "0";
      if (hoursEl) hoursEl.textContent = "00";
      if (minsEl) minsEl.textContent = "00";
      if (secsEl) secsEl.textContent = "00";
      if (dateEl) dateEl.textContent = BH.SeasonRelease.earlyAccessNotice();
      this.updateEarlyAccessBar();
      return;
    }

    if (daysEl) daysEl.textContent = String(cd.days);
    if (hoursEl) hoursEl.textContent = pad(cd.hours);
    if (minsEl) minsEl.textContent = pad(cd.minutes);
    if (secsEl) secsEl.textContent = pad(cd.seconds);
    if (dateEl) dateEl.textContent = BH.SeasonRelease.earlyAccessNotice();

    const banner = document.getElementById("season-banner");
    if (banner && !BH.SeasonRelease.isS2Feature("battlePass")) {
      banner.textContent = BH.SeasonRelease.isEarlyAccess()
        ? BH.SeasonRelease.earlyAccessBannerWithS2()
        : "SAISON 1 · ASCHEFRONT";
    }

    this.updateEarlyAccessBar();
  }

  updateEarlyAccessBar() {
    const bar = document.getElementById("early-access-bar");
    if (!bar || !BH.SeasonRelease) return;
    if (!BH.SeasonRelease.isEarlyAccess()) {
      bar.classList.add("hidden");
      return;
    }
    bar.classList.remove("hidden");
    const text = document.getElementById("early-access-text");
    if (text) text.textContent = BH.SeasonRelease.earlyAccessNotice();
  }

  renderDailyLogin() {
    const el = document.getElementById("daily-login-panel");
    if (!el || !BH.DailyLogin) return;
    const d = BH.Progress.data;
    const st = BH.DailyLogin.status(d);
    const r = st.reward;
    if (st.claimedToday) {
      el.innerHTML =
        `<div class="dl-head">📅 TÄGLICHER BONUS · Tag ${st.streak}/7 ✔</div>` +
        `<div class="dl-sub">Heute abgeholt: +${r.credits} ⛁ · +${r.xp} XP. Morgen weiter!</div>`;
      el.className = "daily-login claimed";
      return;
    }
    el.className = "daily-login claimable";
    el.innerHTML =
      `<div class="dl-head">📅 TÄGLICHER LOGIN-BONUS · Tag ${st.nextDay}/7</div>` +
      `<div class="dl-sub">+${r.credits} ⛁ · +${r.xp} XP${r.bonusEmblem ? " · Emblem Treue (Tag 7)" : ""}</div>` +
      `<button type="button" class="btn btn-primary dl-claim" id="btn-daily-claim">BONUS ABHOLEN</button>`;
    const btn = document.getElementById("btn-daily-claim");
    if (btn) {
      btn.onclick = () => {
        const res = BH.DailyLogin.claim(d);
        if (!res) return;
        BH.audio.buy();
        this.renderDailyLogin();
        this.renderTopbar();
        this.renderHome();
        BH.Achievements.evaluate(d, {});
        BH.Progress.save();
        if (BH.UI) BH.UI.toast(`Login-Bonus Tag ${res.day}: +${res.reward.credits} ⛁ · +${res.reward.xp} XP`, "success");
      };
    }
  }

  renderOperationScreen() {
    const list = document.getElementById("operation-list");
    const sub = document.getElementById("operation-sub");
    if (!list || !BH.LiveOps) return;
    const d = BH.Progress.data;
    if (sub && BH.WeeklyOperations) {
      const wk = BH.WeeklyOperations.weekKey();
      sub.textContent = "Live-Ops · " + wk.replace("-W", " · KW ") + " · Aufträge & Events";
    }
    list.innerHTML = "";
    for (const e of BH.LiveOps.entries(d)) {
      const done = e.active === false;
      const card = document.createElement("div");
      card.className = "operation-card" + (done ? " done" : "");
      card.innerHTML =
        `<div class="op-card-head">` +
        `<span class="op-icon">${e.icon}</span>` +
        `<div class="op-card-body">` +
        `<div class="op-card-title">${e.title}</div>` +
        `<div class="op-card-desc">${e.desc}</div>` +
        `</div>` +
        (e.bonus ? `<span class="op-bonus">${e.bonus}</span>` : "") +
        `</div>` +
        `<button type="button" class="op-cta btn btn-primary${done ? " disabled" : ""}">${e.cta}</button>`;
      const btn = card.querySelector(".op-cta");
      if (!done) {
        btn.addEventListener("click", () => {
          BH.audio.click();
          if (e.modeId) this.startGame(e.modeId);
          else if (e.screen) this.showScreen(e.screen);
        });
      } else {
        btn.disabled = true;
      }
      list.appendChild(card);
    }
  }

  applyModesTab() {
    const tab = this._modesTab || "pvp";
    document.querySelectorAll(".modes-panel[data-modes-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.modesPanel === tab);
    });
    document.querySelectorAll(".modes-tab[data-modes-tab]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.modesTab === tab);
    });
  }

  modesTabForMode(modeId) {
    const solo = { specops: 1, training: 1 };
    const story = { campaign: 1 };
    const special = { zombies: 1, gungame: 1 };
    const ranked = { ranked: 1 };
    if (story[modeId]) return "story";
    if (solo[modeId]) return "solo";
    if (special[modeId]) return "special";
    if (ranked[modeId]) return "ranked";
    return "pvp";
  }

  modeDisplayMeta(modeId) {
    const EMOJI = {
      campaign: "📖", specops: "🎯", training: "🎯", tdm: "🔫", ffa: "🎯",
      zombies: "🧟", dom: "🏴", snd: "💣", frontwar: "⚔️", conquest: "🚩",
      gungame: "🔁", ranked: "🏆", killconfirmed: "🪖", hardcore: "💀", infected: "🧟",
      operation: "📋", coopstrike: "🤝", clanmatch: "⚔",
    };
    const name = BH.I18n ? BH.I18n.modeName(modeId) : (modeId || "tdm").toUpperCase();
    return { name, emoji: EMOJI[modeId] || "▶" };
  }

  renderModesSidebar(d) {
    const t = BH.I18n ? k => BH.I18n.t(k) : k => k;
    const lastMode = d.lastMode || "tdm";
    const meta = this.modeDisplayMeta(lastMode);
    const isManual = d.mapPickMode === "manual";
    const curMap = BH.Maps
      ? (isManual ? BH.Maps.getActiveMap() : BH.Maps.getRotatingMap())
      : { emoji: "🗺", short: "—", name: "—" };

    const chips = document.getElementById("modes-head-chips");
    if (chips) {
      chips.innerHTML =
        `<span class="modes-chip">${curMap.emoji} ${curMap.short || curMap.name}</span>` +
        `<span class="modes-chip modes-chip-mode">${meta.emoji} ${meta.name}</span>` +
        `<span class="modes-chip">${isManual ? t("map_manual") : t("modes_rotation")}</span>`;
    }

    const emojiEl = document.getElementById("modes-deploy-emoji");
    const nameEl = document.getElementById("modes-deploy-name");
    const mapEl = document.getElementById("modes-deploy-map");
    if (emojiEl) emojiEl.textContent = meta.emoji;
    if (nameEl) nameEl.textContent = meta.name;
    if (mapEl) {
      mapEl.textContent = isManual
        ? curMap.short || curMap.name
        : (curMap.short || curMap.name) + " · " + t("modes_rotation");
    }

    const ltmStrip = document.getElementById("modes-ltm-strip");
    if (ltmStrip && BH.LTM) {
      const ltm = BH.LTM.current();
      if (ltm && ltm.name) {
        ltmStrip.classList.remove("hidden");
        ltmStrip.innerHTML =
          `<span class="mls-icon">★</span>` +
          `<span class="mls-text">LTM: <b>${ltm.name}</b> · +${Math.round((ltm.bonus - 1) * 100)} % XP</span>`;
      } else {
        ltmStrip.classList.add("hidden");
        ltmStrip.innerHTML = "";
      }
    }

    document.querySelectorAll(".mode-card[data-mode]").forEach(card => {
      card.classList.toggle("mode-last-played", card.dataset.mode === lastMode);
    });
  }

  renderModes() {
    const d = BH.Progress.data;
    const t = BH.I18n ? k => BH.I18n.t(k) : k => k;
    const maxCamp = BH.SeasonRelease ? BH.SeasonRelease.maxCampaignMissions() : 6;
    const s2Camp = BH.SeasonRelease && BH.SeasonRelease.isS2Feature("campaign");
    const done = Math.min(d.campaignMission || 0, maxCamp);
    const desc = document.getElementById("campaign-mode-desc");
    const tag = document.getElementById("campaign-mode-tag");
    const names = (BH.CampaignBriefings || []).map(b => b.name);
    const fallback = ["Schwarzer Morgen", "Schattenop", "Panzerfahrt", "Phönix-Fall", "Eisiger Schatten", "Horizonts-Ende"];
    const missionNames = names.length ? names : fallback;
    const dateLabel = BH.SeasonRelease ? BH.SeasonRelease.s2LaunchDateLabel() : "1.8.2026";
    if (desc && tag) {
      if (d.campaignComplete) {
        desc.textContent = t("desc_campaign_done");
        tag.textContent = t("tag_solo_done");
      } else if (done > 0) {
        const totalLabel = s2Camp ? 6 : 4;
        desc.textContent = t("desc_campaign_prog", {
          done, total: totalLabel, name: missionNames[Math.min(done, totalLabel - 1)],
        });
        tag.textContent = t("tag_solo_prog", { done, total: totalLabel });
      } else {
        desc.textContent = s2Camp
          ? t("desc_campaign_s2")
          : t("desc_campaign_s1", { date: dateLabel });
        tag.textContent = t("tag_solo_missions", { n: s2Camp ? 6 : 4 });
      }
    }
    document.querySelectorAll("[data-campaign-chapter]").forEach(btn => {
      const idx = parseInt(btn.dataset.campaignChapter, 10);
      const seasonLocked = BH.SeasonRelease && BH.SeasonRelease.isCampaignChapterSeasonLocked(idx);
      const unlocked = !seasonLocked && (d.campaignComplete || idx <= done);
      btn.classList.toggle("locked", !unlocked);
      let chapterTitle = missionNames[idx] || ("Mission " + (idx + 1));
      if (seasonLocked) {
        const date = BH.SeasonRelease ? BH.SeasonRelease.s2LaunchDateLabel() : "1.8.2026";
        chapterTitle = "Saison 2 · " + date + " – " + chapterTitle;
      }
      btn.title = chapterTitle;
    });
    this.renderMapPicker();
    this.renderModesSidebar(d);
    this.applyModesTab();
    this.applyModeMaintenance();
    this.applyComingSoonModes();
  }

  applyComingSoonModes() {
    if (!BH.ComingSoonModes) return;
    document.querySelectorAll(".mode-card[data-mode]").forEach(card => {
      const mode = card.dataset.mode;
      if (BH.ModeMaintenance && BH.ModeMaintenance.isActive(mode)) return;
      if (!BH.ComingSoonModes.isComingSoon(mode)) {
        card.classList.remove("coming-soon");
        return;
      }
      const def = BH.ComingSoonModes.def(mode);
      card.classList.add("coming-soon", "locked");
      const tag = card.querySelector(".mode-tag");
      const desc = card.querySelector("p");
      if (tag) tag.textContent = "🔒 COMING SOON";
      if (desc && def && def.message) desc.textContent = def.message;
      card.title = (def && def.label ? def.label + " — " : "") + "Coming Soon";
    });
  }

  applyModeMaintenance() {
    if (!BH.ModeMaintenance) return;
    const summary = BH.ModeMaintenance.summary();
    document.querySelectorAll(".mode-card[data-mode]").forEach(card => {
      const mode = card.dataset.mode;
      const st = BH.ModeMaintenance.status(mode);
      const tag = card.querySelector(".mode-tag");
      const desc = card.querySelector("p");
      const title = card.querySelector("h3");

      card.classList.toggle("maintenance", !!st);
      card.classList.toggle("locked", !!st);
      if (st) {
        if (tag) tag.textContent = "🔧 WARTUNG · " + st.remaining.toUpperCase();
        if (desc) desc.textContent = st.message + " · Verfügbar in " + st.remaining.toLowerCase() + ".";
        card.title = st.label + ": " + st.message + " (" + st.remaining + ")";
      } else {
        const t = BH.I18n ? k => BH.I18n.t(k) : k => k;
        if (tag && tag.dataset.i18n) tag.textContent = t(tag.dataset.i18n);
        if (desc && desc.dataset.i18n) desc.textContent = t(desc.dataset.i18n);
        if (title && title.dataset.i18n) title.textContent = t(title.dataset.i18n);
        card.removeAttribute("title");
      }
    });
    const banner = document.getElementById("hw-maintenance");
    if (banner) {
      if (summary) {
        banner.classList.remove("hidden");
        banner.classList.add("maint-clickable");
        banner.title = "DevBlog · Wartungsdetails";
        banner.innerHTML =
          `<span class="maint-icon">🔧</span>` +
          `<span class="maint-text"><b>WARTUNG:</b> ${summary.names} — ${summary.message} <b>${summary.remaining}</b> · <u>DevBlog</u></span>`;
        banner.onclick = () => {
          BH.audio.click();
          this._devblogTab = "news";
          this.showScreen("devblog");
          setTimeout(() => {
            const id = (summary.devblogIds && summary.devblogIds[0]) || summary.devblogId;
            const el = document.getElementById("devblog-" + id);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }, 80);
        };
      } else {
        banner.classList.add("hidden");
        banner.classList.remove("maint-clickable");
        banner.onclick = null;
        banner.innerHTML = "";
      }
    }
  }

  showComingSoonNotice(modeId) {
    const def = BH.ComingSoonModes && BH.ComingSoonModes.def(modeId);
    const toast = document.getElementById("mode-maintenance-toast");
    if (!toast || !def) return;
    toast.innerHTML =
      `<div class="maint-toast-inner coming-soon-toast">` +
      `<div class="maint-toast-title">🔒 ${def.label} — COMING SOON</div>` +
      `<p>${def.message}</p>` +
      `<p class="maint-toast-time">${def.hint || "Modus folgt in einem kommenden Update."}</p>` +
      `<div class="maint-toast-actions">` +
      `<button type="button" class="btn maint-toast-devblog">DEVBLOG LESEN</button>` +
      `<button type="button" class="btn btn-primary maint-toast-close">VERSTANDEN</button>` +
      `</div></div>`;
    toast.classList.remove("hidden");
    const devblogBtn = toast.querySelector(".maint-toast-devblog");
    if (devblogBtn) {
      devblogBtn.onclick = () => {
        toast.classList.add("hidden");
        BH.audio.click();
        this._devblogTab = "news";
        this.showScreen("devblog");
        setTimeout(() => {
          const el = document.getElementById("devblog-modes-roadmap-jun2026");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 80);
      };
    }
    const close = toast.querySelector(".maint-toast-close");
    if (close) {
      close.onclick = () => {
        toast.classList.add("hidden");
        BH.audio.click();
      };
    }
  }

  showMaintenanceNotice(modeId) {
    const st = BH.ModeMaintenance && BH.ModeMaintenance.status(modeId);
    const toast = document.getElementById("mode-maintenance-toast");
    if (!toast || !st) return;
    toast.innerHTML =
      `<div class="maint-toast-inner">` +
      `<div class="maint-toast-title">🔧 ${st.label} — WARTUNG</div>` +
      `<p>${st.message}</p>` +
      `<p class="maint-toast-time">Wieder spielbar: <b>${st.remaining}</b></p>` +
      `<div class="maint-toast-actions">` +
      `<button type="button" class="btn maint-toast-devblog">DEVBLOG LESEN</button>` +
      `<button type="button" class="btn btn-primary maint-toast-close">VERSTANDEN</button>` +
      `</div></div>`;
    toast.classList.remove("hidden");
    const devblogBtn = toast.querySelector(".maint-toast-devblog");
    if (devblogBtn) {
      devblogBtn.onclick = () => {
        toast.classList.add("hidden");
        BH.audio.click();
        this._devblogTab = "news";
        this.showScreen("devblog");
        setTimeout(() => {
          const id = st.devblogId || "maintenance-jun2026";
          const el = document.getElementById("devblog-" + id);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 80);
      };
    }
    const close = toast.querySelector(".maint-toast-close");
    if (close) {
      close.onclick = () => {
        toast.classList.add("hidden");
        BH.audio.click();
      };
    }
  }

  showRoadmapNotice() {
    const n = BH.RoadmapNotice;
    const toast = document.getElementById("mode-maintenance-toast");
    if (!toast || !n || !n.active) return;
    toast.innerHTML =
      `<div class="maint-toast-inner roadmap-warn-toast">` +
      `<div class="maint-toast-title roadmap-warn-title">⚠ ${n.title || "ACHTUNG · ROADMAP"}</div>` +
      `<p>${n.message || "Die Roadmap weist derzeit Fehler auf."}</p>` +
      `<p class="maint-toast-time">${n.detail || "Wir arbeiten so schnell wie möglich daran, diese zu beheben."}</p>` +
      `<div class="maint-toast-actions">` +
      `<button type="button" class="btn maint-toast-devblog">ROADMAP ANSEHEN</button>` +
      `<button type="button" class="btn btn-primary maint-toast-close">VERSTANDEN</button>` +
      `</div></div>`;
    toast.classList.remove("hidden");
    const devblogBtn = toast.querySelector(".maint-toast-devblog");
    if (devblogBtn) {
      devblogBtn.onclick = () => {
        toast.classList.add("hidden");
        BH.audio.click();
        this._devblogTab = "roadmap";
        this.showScreen("devblog");
      };
    }
    const close = toast.querySelector(".maint-toast-close");
    if (close) {
      close.onclick = () => {
        toast.classList.add("hidden");
        BH.audio.click();
      };
    }
  }

  applyRoadmapNotice() {
    const btn = document.getElementById("btn-roadmap-warn");
    const textEl = document.getElementById("btn-roadmap-warn-text");
    const n = BH.RoadmapNotice;
    if (!btn) return;
    if (!n || !n.active) {
      btn.classList.add("hidden");
      this.applyRoadmapDisabled(false);
      return;
    }
    btn.classList.remove("hidden");
    if (textEl && n.buttonText) textEl.textContent = n.buttonText;
    btn.title = n.message || "Hinweis zur Roadmap";
    this.applyRoadmapDisabled(n.isDisabled ? n.isDisabled() : !!(n.active && n.disabled));
  }

  applyRoadmapDisabled(disabled) {
    const n = BH.RoadmapNotice;
    if (disabled == null) disabled = n && n.isDisabled && n.isDisabled();
    const overlayHtml =
      `<div class="roadmap-blocked-inner">` +
      `<div class="roadmap-blocked-icon">⚠</div>` +
      `<div class="roadmap-blocked-title">${(n && n.overlayTitle) || "ROADMAP VORÜBERGEHEND GESPERRT"}</div>` +
      `<p class="roadmap-blocked-text">${(n && n.message) || "Die Roadmap weist derzeit Fehler auf."}</p>` +
      `<p class="roadmap-blocked-sub">${(n && n.detail) || "Wir arbeiten an einer Behebung."}</p>` +
      `</div>`;

    ["dblog-roadmap-wrap", "season-preview-wrap"].forEach(id => {
      const wrap = document.getElementById(id);
      if (!wrap) return;
      wrap.classList.toggle("is-disabled", !!disabled);
      let overlay = wrap.querySelector(".roadmap-blocked-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "roadmap-blocked-overlay";
        overlay.setAttribute("aria-hidden", disabled ? "false" : "true");
        wrap.appendChild(overlay);
      }
      if (disabled) {
        overlay.innerHTML = overlayHtml;
        overlay.classList.remove("hidden");
        overlay.setAttribute("aria-hidden", "false");
      } else {
        overlay.innerHTML = "";
        overlay.classList.add("hidden");
        overlay.setAttribute("aria-hidden", "true");
      }
    });

    const roadmapTab = document.querySelector('.dblog-tab[data-dblog-tab="roadmap"]');
    if (roadmapTab) roadmapTab.classList.toggle("roadmap-tab-disabled", !!disabled);

    const hint = document.getElementById("dblog-roadmap-hint");
    if (hint) {
      hint.textContent = disabled
        ? "Roadmap derzeit nicht lesbar — Fehler werden behoben."
        : "Saison 2 · Schwarzer Horizont — nur geplante Inhalte ab 1.8.2026.";
    }
  }

  renderMapPicker() {
    if (!BH.Maps) return;
    const d = BH.Progress.data;
    const isManual = d.mapPickMode === "manual";
    const pool = BH.Maps.livePool ? BH.Maps.livePool() : BH.Maps.MAP_POOL;
    const active = isManual ? BH.Maps.getActiveMap() : BH.Maps.getRotatingMap();
    const next = BH.Maps.getNextMap();

    document.querySelectorAll("[data-map-pick]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mapPick === (isManual ? "manual" : "rotation"));
    });

    const summary = document.getElementById("map-pick-summary");
    if (summary) {
      summary.textContent = isManual
        ? active.emoji + " " + (active.short || active.name) + " · Feste Karte"
        : active.emoji + " " + (active.short || active.name) + " · Nächste: " + (next.short || next.name);
    }

    const grid = document.getElementById("map-pick-grid");
    if (grid) {
      grid.classList.toggle("hidden", !isManual);
      grid.innerHTML = pool.map(m => {
        const owner = BH.FactionWar && BH.FactionWar.hasPledged(d)
          ? BH.FactionWar.territoryOwner(d, m.id) : null;
        const fac = owner && BH.FactionWar
          ? BH.FactionWar.factions.find(f => f.id === owner) : null;
        const terrLabel = fac ? fac.shortName : (BH.FactionWar && !BH.FactionWar.hasPledged(d) ? "???" : "Neutral");
        const selected = d.selectedMapId === m.id;
        return `<button type="button" class="map-pick-card${selected ? " selected" : ""}" data-map-id="${m.id}" title="${m.name}">
          <span class="map-pick-emoji">${m.emoji}</span>
          <span class="map-pick-name">${m.short || m.name}</span>
          <span class="map-pick-terr">${terrLabel}</span>
        </button>`;
      }).join("");
    }
  }

  setMapPickMode(mode) {
    const d = BH.Progress.data;
    d.mapPickMode = mode === "manual" ? "manual" : "rotation";
    if (d.mapPickMode === "manual" && !d.selectedMapId) {
      d.selectedMapId = BH.Maps.getRotatingMap().id;
    }
    BH.Progress.save();
    this.renderMapPicker();
    if (this.currentScreen === "home") this.renderHome();
    if (this.currentScreen === "modes") this.renderModesSidebar(BH.Progress.data);
  }

  selectMap(mapId) {
    const d = BH.Progress.data;
    d.mapPickMode = "manual";
    d.selectedMapId = mapId;
    BH.Progress.save();
    this.renderMapPicker();
    if (this.currentScreen === "home") this.renderHome();
    if (this.currentScreen === "modes") this.renderModesSidebar(BH.Progress.data);
  }

  startCampaignChapter(chapterIdx) {
    if (BH.SeasonRelease && BH.SeasonRelease.isCampaignChapterSeasonLocked(chapterIdx)) return;
    BH.Progress.data._campaignChapterStart = chapterIdx;
    this.startGame("campaign");
  }

  renderTopbar() {
    const d = BH.Progress.data;
    const rank = BH.Progress.getRank();
    const lvl = BH.Progress.getLevel();
    document.getElementById("tb-credits").textContent = "⛁ " + d.credits;
    const verEl = document.getElementById("tb-version");
    if (verEl) verEl.textContent = BH.gameVersionShort ? BH.gameVersionShort() : "v0.0.1";
    const footerVer = document.getElementById("footer-version");
    if (footerVer && BH.GAME_VERSION) {
      footerVer.textContent = BH.gameVersionUpdateLabel ? BH.gameVersionUpdateLabel() : ("Update " + BH.GAME_VERSION);
    }
    const clanTag = d.clan && d.clan.tag ? "[" + d.clan.tag + "] " : "";
    document.getElementById("tb-rank").textContent =
      clanTag +
      (d.prestige > 0 ? "✪" + d.prestige + " · " : "") + rank.name + " · LV " + lvl.level;
    const premEl = document.getElementById("tb-premium");
    if (premEl && BH.PremiumPlaytime) {
      const premLabel = BH.PremiumPlaytime.statusLabel(d);
      if (premLabel) {
        premEl.textContent = premLabel;
        premEl.classList.remove("hidden");
      } else if (d.premiumPass) {
        premEl.textContent = "⭐ Premium Pass";
        premEl.classList.remove("hidden");
      } else {
        premEl.textContent = "";
        premEl.classList.add("hidden");
      }
    }
    this.updateCrateTopbar();
    this.updateEarlyAccessBar();
  }

  /* =============== HOME =============== */
  renderHome() {
    const d = BH.Progress.data;
    const rank = BH.Progress.getRank();
    const lvl = BH.Progress.getLevel();

    // Schnellstart-Beschriftung
    const modeLabel = (id) => BH.I18n ? BH.I18n.modeName(id) : id;
    const qsMode = document.getElementById("qs-mode");
    if (qsMode) qsMode.textContent = modeLabel(d.lastMode || "tdm");

    const greeting = document.getElementById("home-greeting");
    if (greeting) greeting.textContent = this.homeGreetingText(d);
    this.updateHomeLiveClock();

    const season = BH.SeasonRelease
      ? BH.SeasonRelease.effectiveBpSeason(d)
      : (d.bpSeason || 1);
    const seasonBanner = document.getElementById("season-banner");
    const t = BH.I18n ? k => BH.I18n.t(k) : k => k;
    const fmt = BH.I18n ? n => BH.I18n.fmt(n) : n => Number(n).toLocaleString("de-DE");

    if (seasonBanner) {
      if (season === 2) {
        seasonBanner.textContent = t("season_2");
      } else if (BH.SeasonRelease && BH.SeasonRelease.isEarlyAccess()) {
        seasonBanner.textContent = BH.SeasonRelease.earlyAccessBannerWithS2();
      } else {
        seasonBanner.textContent = t("season_1");
      }
    }

    // Operator-Schaukasten
    const op = BH.OperatorCatalog
      ? BH.OperatorCatalog.find(d.operator, d)
      : BH.OPERATORS.find(o => o.id === d.operator) || BH.OPERATORS[0];
    const opFig = document.getElementById("hw-op-figure");
    const opName = document.getElementById("hw-op-name");
    const opFaction = document.getElementById("hw-op-faction");
    if (opFig) {
      const opGolden = BH.PrestigeMaster && BH.PrestigeMaster.hasGoldenFrame(d);
      opFig.innerHTML = this.opFigure(op, true, opGolden);
    }
    if (opName) opName.textContent = op.name;
    if (opFaction) opFaction.textContent = op.faction;

    const hero = document.querySelector(".home-hero");
    if (hero) {
      const facId = (op.id || d.operator || "").toLowerCase();
      hero.dataset.faction = facId.includes("vanguard") ? "vanguard"
        : facId.includes("schatten") || facId.includes("shadow") ? "shadow"
        : facId.includes("wraith") ? "wraith" : "default";
    }

    this.renderHomeTactical(d, rank, lvl);

    // Widget: Rang
    const rankIcon = document.getElementById("home-rank-icon");
    const rankName = document.getElementById("home-rank-name");
    const rankLevel = document.getElementById("home-level");
    const rankHint = document.getElementById("home-rank-hint");
    const rankFill = document.getElementById("home-xp-fill");
    if (rankIcon) rankIcon.textContent = rank.icon || "🎖";
    if (rankName) {
      rankName.textContent = (d.prestige > 0 ? "✪" + d.prestige + " · " : "") + rank.name;
    }
    if (rankLevel) {
      rankLevel.textContent = "Lv " + lvl.level + " / " + BH.MAX_LEVEL + (lvl.maxed ? " · MAX" : "");
    }
    if (rankHint) {
      rankHint.textContent = lvl.maxed
        ? t("rank_max_reached")
        : t("rank_xp_in_level", { current: Math.round(lvl.intoLevel), needed: lvl.needed });
    }
    if (rankFill) {
      rankFill.style.width = Math.min(100, lvl.intoLevel / lvl.needed * 100) + "%";
    }

    // Widget: Battle Pass
    const bp = BH.Progress.getBattlePassDef ? BH.Progress.getBattlePassDef() : BH.BATTLEPASS;
    const tier = BH.Progress.getBpTier();
    const xpInfo = BH.BattlePass ? BH.BattlePass.xpInTier(d) : { current: 0, need: bp.xpPerTier || 1000, done: tier >= bp.tiers };
    const bpTier = document.getElementById("hw-bp-tier");
    const bpSub = document.getElementById("hw-bp-sub");
    const bpText = document.getElementById("hw-bp-text");
    const bpFill = document.getElementById("hw-bp-fill");
    const bpSeasonEl = document.getElementById("hw-bp-season");
    const bpTag = document.getElementById("hw-bp-tag");
    const bpSeason = BH.SeasonRelease
      ? BH.SeasonRelease.effectiveBpSeason(d)
      : (d.bpSeason || 1);
    if (bpSeasonEl) bpSeasonEl.textContent = bpSeason === 2 ? t("bp_season_short_2") : t("bp_season_short_1");
    if (bpTag) bpTag.textContent = bpSeason === 2 ? "S2" : "S1";
    if (bpTier) {
      bpTier.textContent = tier >= bp.tiers ? t("bp_complete") : t("bp_tier", { n: tier });
    }
    if (bpSub) {
      bpSub.textContent = tier >= bp.tiers
        ? "✔"
        : tier + " / " + bp.tiers;
    }
    if (bpText) {
      const pending = BH.BattlePass ? BH.BattlePass.pendingCount(d) : 0;
      const actives = BH.BpXpTokens ? BH.BpXpTokens.activeList(d) : [];
      if (actives.length) {
        bpText.textContent = t("bp_boost_active", { summary: BH.BpXpTokens.activeSummary(d) });
      } else if (tier >= bp.tiers) {
        bpText.textContent = t("bp_all_unlocked");
      } else if (pending > 0) {
        bpText.textContent = t("bp_rewards_pending", { n: pending });
      } else {
        bpText.textContent = Math.round(xpInfo.current) + " / " + fmt(xpInfo.need) + " XP · " + t("bp_tier", { n: tier + 1 });
      }
    }
    if (bpFill) {
      bpFill.style.width = Math.min(100, xpInfo.done ? 100 : xpInfo.current / xpInfo.need * 100) + "%";
    }

    this.updateEventPassHomeWidget(d);

    // Widget: Karten-Rotation
    const isManual = d.mapPickMode === "manual";
    const curMap = isManual ? BH.Maps.getActiveMap() : BH.Maps.getRotatingMap();
    const nextMap = BH.Maps.getNextMap();
    const mapEmoji = document.getElementById("hw-map-emoji");
    const mapName = document.getElementById("hw-map-name");
    const mapCardName = document.getElementById("hw-map-card-name");
    const mapNext = document.getElementById("hw-map-next");
    const mapText = document.getElementById("hw-map-text");
    const mapCardText = document.getElementById("hw-map-card-text");
    const mapRotLabel = document.getElementById("hw-map-rotation-label");
    const mapFill = document.getElementById("hw-map-fill");
    const deploySub = document.getElementById("home-deploy-sub");
    if (mapEmoji) mapEmoji.textContent = curMap.emoji;
    if (mapName) mapName.textContent = curMap.short || curMap.name;
    if (mapCardName) mapCardName.textContent = curMap.short || curMap.name;
    if (mapNext) {
      mapNext.textContent = isManual
        ? t("home_manual_pick")
        : t("home_next_map", { map: nextMap.short || nextMap.name });
    }
    if (mapRotLabel) mapRotLabel.textContent = isManual ? t("map_manual") : t("map_auto");
    const mapDesc = isManual ? t("map_fixed_hint") : t("home_map_active");
    if (mapText) mapText.textContent = mapDesc;
    if (mapCardText) mapCardText.textContent = mapDesc;
    if (deploySub) {
      deploySub.textContent = modeLabel(d.lastMode || "tdm") + " · " + (curMap.short || curMap.name);
    }
    if (mapFill) mapFill.style.width = isManual ? "100%" : "65%";

    const cNames = (BH.CampaignBriefings || []).map(b => b.name);
    const maxCamp = BH.SeasonRelease ? BH.SeasonRelease.maxCampaignMissions() : 6;
    const s2Camp = BH.SeasonRelease && BH.SeasonRelease.isS2Feature("campaign");
    const cDone = Math.min(d.campaignMission || 0, maxCamp);
    const cIdx = d.campaignComplete ? 5 : Math.min(cDone, maxCamp - 1);
    const cTitle = document.getElementById("hw-campaign-title");
    const cSub = document.getElementById("hw-campaign-sub");
    const cText = document.getElementById("hw-campaign-text");
    const cFill = document.getElementById("hw-campaign-fill");
    if (cTitle) cTitle.textContent = cNames[cIdx] || "Kampagne";
    if (cSub) {
      cSub.textContent = d.campaignComplete
        ? "Abgeschlossen ✔"
        : "Mission " + Math.min(cDone + 1, s2Camp ? 6 : maxCamp) + " / " + (s2Camp ? 6 : maxCamp);
    }
    if (cText) {
      cText.textContent = d.campaignComplete
        ? "Alle sechs Missionen gemeistert"
        : (!s2Camp && cDone >= maxCamp
          ? "Saison 1 abgeschlossen – Saison 2 ab " + (BH.SeasonRelease ? BH.SeasonRelease.s2LaunchDateLabel() : "1.8.2026")
          : (BH.CampaignBriefings && BH.CampaignBriefings[cIdx]
            ? BH.CampaignBriefings[cIdx].objective || "Kapitel freischalten und spielen"
            : "Story-Kampagne Saison 1 & 2"));
    }
    if (cFill) cFill.style.width = Math.min(100, (cDone / (s2Camp ? 6 : maxCamp)) * 100) + "%";

    // DevBlog
    this.renderWelcomeBanner();
    this.applyRoadmapNotice();
    this.renderDevblog();
    this.renderSeasonPreview();

    // Saison-Story (Kriegsfronten)
    if (BH.SeasonStory) {
      const ss = BH.SeasonStory.chapter(d);
      const ssChapter = document.getElementById("ss-chapter");
      const ssText = document.getElementById("ss-text");
      const ssFill = document.getElementById("ss-fill");
      if (ssChapter) ssChapter.textContent = ss.cur.name;
      if (ssText) ssText.textContent = ss.cur.text;
      if (ssFill) ssFill.style.width = ss.progress + "%";
    }

    // Fraktions-Bonus-Hinweis beim Operator
    const bonus = BH.FactionBonus ? BH.FactionBonus.get(d.operator, curMap.id) : null;
    const hint = document.querySelector(".home-op-hint");
    if (hint) hint.textContent = bonus ? "BONUS: " + bonus.label : "KLICKEN ZUM WECHSELN";

    if (BH.LTM) {
      const ltm = BH.LTM.current();
      const el = document.getElementById("hw-ltm");
      if (el) {
        if (ltm && ltm.name) {
          el.classList.remove("hidden");
          el.innerHTML = `★ LTM DIESE WOCHE: <b>${ltm.name}</b> · +${Math.round((ltm.bonus - 1) * 100)} % XP`;
        } else {
          el.innerHTML = "";
          el.classList.add("hidden");
        }
      }
    } else {
      const el = document.getElementById("hw-ltm");
      if (el) { el.innerHTML = ""; el.classList.add("hidden"); }
    }
    if (BH.FactionWar) {
      BH.FactionWar.ensure(d);
      const el = document.getElementById("hw-faction");
      if (el) {
        if (!BH.FactionWar.hasPledged(d)) {
          el.innerHTML =
            `<div class="fw-home-head">⚔ FRAKTIONSKRIEG</div>` +
            `<div class="fw-home-scores dim">Front unbekannt — wähle deine Fraktion</div>` +
            `<div class="fw-home-sub">Einmalige Treue · Karte &amp; Stand danach sichtbar · Klicken</div>`;
        } else {
          const fw = BH.FactionWar.leader(d);
          const pr = BH.FactionWar.personalRank(d);
          const pledgedMeta = BH.FactionWar._factionMeta(d.factionWar.pledged);
          el.innerHTML =
            `<div class="fw-home-head">⚔ FRAKTIONSKRIEG · ${fw.meta.name} führt</div>` +
            `<div class="fw-home-scores">` +
            BH.FactionWar.factions.map(f =>
              `<span class="fw-home-f${f.id === fw.faction ? " lead" : ""}">${f.icon} ${(fw.combined[f.id] || 0)}</span>`
            ).join(" · ") +
            `</div>` +
            `<div class="fw-home-sub">${pledgedMeta.icon} ${pledgedMeta.name} · ${pr.name} · ${pr.contrib} FWP · Klicken für Übersicht</div>`;
        }
      }
    }

    this.renderDailyLogin();
    this.renderHomeCrates();

    if (BH.Tutorial && BH.Tutorial.needsIntro(d) && !this._tutShown) {
      this._tutShown = true;
      BH.Tutorial.showIntro(() => this.startGame("specops"));
    }

    this.applyModeMaintenance();
    this.applyComingSoonModes();
  }

  renderDevblog() {
    const list = document.getElementById("devblog-list");
    if (!list || !BH.DEVBLOG) return;
    const entry = BH.DEVBLOG[0];
    if (!entry) { list.innerHTML = ""; return; }
    list.innerHTML = this.renderDevblogEntry(entry, false);
  }

  renderWelcomeBanner() {
    const el = document.getElementById("home-welcome-banner");
    const w = BH.WELCOME_UPDATE;
    if (!el || !w) return;
    const items = (w.highlights || []).map(h =>
      `<li><span class="hwb-icon">${h.icon || "•"}</span><span>${h.text}</span></li>`
    ).join("");
    el.innerHTML =
      `<div class="hwb-inner">` +
      `<div class="hwb-head">` +
      `<span class="hwb-tag">${w.tag || "NEU"}</span>` +
      `<span class="hwb-date">${w.date || ""}</span>` +
      `</div>` +
      `<div class="hwb-title">${w.title}</div>` +
      `<div class="hwb-sub">${w.subtitle || ""}</div>` +
      `<ul class="hwb-list">${items}</ul>` +
      `<div class="hwb-actions">` +
      (BH.DevBlogReward && BH.DevBlogReward.canClaim(BH.Progress.data)
        ? `<button type="button" class="hwb-cta hwb-cta-prem" data-screen="devblog" data-dblog-gift="1">⭐ 1 TAG PREMIUM · NEWS LESEN</button>`
        : "") +
      `<button type="button" class="hwb-cta" data-screen="devblog">DEVBLOG · ALLE DETAILS →</button>` +
      `</div>` +
      `</div>`;
    el.querySelectorAll(".hwb-cta").forEach(btn => {
      btn.onclick = () => {
        this._devblogTab = "news";
        this.showScreen("devblog");
      };
    });
  }

  applyDevblogTab() {
    const tab = this._devblogTab || "news";
    document.querySelectorAll(".dblog-panel[data-dblog-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.dblogPanel === tab);
    });
    document.querySelectorAll(".dblog-tab[data-dblog-tab]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.dblogTab === tab);
    });
  }

  /** Roadmap-Block — gleiches Layout für Sidebar & DevBlog (wie Saison 1) */
  buildSeasonRoadmapHtml(preview, opts) {
    if (!preview) return "";
    opts = opts || {};
    const role = opts.role || "upcoming";
    const etaText = opts.etaText != null ? opts.etaText : (preview.eta || "");
    const sidebar = !!opts.sidebar;
    const subLabel = (text) => sidebar
      ? `<div class="sp-section-label">${text}</div>`
      : `<div class="dblog-sub-label">${text}</div>`;
    const listCls = sidebar ? "sp-list" : "dbr-list";
    const tagClass = role === "current" ? "db-tag-game" : "db-tag-season";
    const tagText = role === "current" ? "LIVE" : "KOMMEND";
    const liveNowLabel = role === "current"
      ? `JETZT LIVE · ${preview.label}`
      : `EARLY ACCESS · VOR ${preview.label}`;

    let html = sidebar
      ? `<article class="db-entry sp-intro${role === "current" ? " sp-live-season" : ""}">` +
        `<div class="db-meta"><span class="db-tag ${tagClass}">${tagText}</span>` +
        `<span class="db-date">${etaText}</span></div>` +
        `<div class="db-entry-title">${preview.label} · ${preview.name}</div>` +
        `<div class="db-entry-text">${preview.intro || ""}</div></article>`
      : `<div class="dblog-roadmap-block">` +
        `<div class="dblog-roadmap-head">` +
        `<div class="dbr-season">${preview.label} · ${preview.name}</div>` +
        `<div class="dbr-eta"><span class="db-tag ${tagClass}">${tagText}</span>${etaText ? " · " + etaText : ""}</div>` +
        `<p class="dbr-intro">${preview.intro || ""}</p></div>`;

    if (!opts.upcomingOnly && preview.liveNow && preview.liveNow.length) {
      html += subLabel(liveNowLabel);
      html += sidebar
        ? `<article class="db-entry sp-highlights sp-live-now"><ul class="${listCls}">` +
          preview.liveNow.map(h => `<li>${h}</li>`).join("") + `</ul></article>`
        : `<ul class="${listCls}">` + preview.liveNow.map(h => `<li>${h}</li>`).join("") + `</ul>`;
    }

    const spotlight = BH.SeasonPreview && BH.SeasonPreview.visibleChanges(preview, 3);
    if (spotlight && spotlight.length) {
      html += subLabel("SPOTLIGHT DER WOCHE");
      for (const ch of spotlight) {
        if (sidebar) {
          html +=
            `<article class="db-entry">` +
            `<div class="db-meta"><span class="db-tag ${ch.tagClass || ""}">${ch.tag}</span>` +
            `<span class="db-date">Fokus</span></div>` +
            (ch.title ? `<div class="db-entry-title">${ch.title}</div>` : "") +
            `<div class="db-entry-text">${ch.text}</div></article>`;
        } else {
          html +=
            `<div class="dbr-change"><span class="db-tag ${ch.tagClass || ""}">${ch.tag}</span> ` +
            `<b>${ch.title}</b><br><span>${ch.text}</span></div>`;
        }
      }
    }

    if (preview.highlights && preview.highlights.length) {
      html += subLabel("HIGHLIGHTS");
      html += sidebar
        ? `<article class="db-entry sp-highlights"><ul class="${listCls}">` +
          preview.highlights.map(h => `<li>${h}</li>`).join("") + `</ul></article>`
        : `<ul class="${listCls}">` + preview.highlights.map(h => `<li>${h}</li>`).join("") + `</ul>`;
    }

    if (preview.bpTeaser) {
      html += subLabel("BATTLE PASS");
      html += sidebar
        ? `<article class="db-entry sp-bp-teaser"><div class="db-meta">` +
          `<span class="db-tag db-tag-shop">BATTLE PASS</span><span class="db-date">Premium</span></div>` +
          `<div class="db-entry-text">${preview.bpTeaser}</div></article>`
        : `<p class="dbr-block">${preview.bpTeaser}</p>`;
    }

    if (preview.maps && preview.maps.length) {
      html += subLabel("KARTEN");
      for (const m of preview.maps) {
        if (sidebar) {
          html +=
            `<article class="db-entry">` +
            `<div class="db-meta"><span class="db-tag db-tag-game">${m.tag || "KARTE"}</span></div>` +
            `<div class="db-entry-title">${m.name}</div>` +
            `<div class="db-entry-text">${m.desc}</div></article>`;
        } else {
          html +=
            `<div class="dbr-map"><span class="dbr-map-tag">${m.tag || "KARTE"}</span> ` +
            `<b>${m.name}</b><br><span>${m.desc}</span></div>`;
        }
      }
    }

    if (preview.ranked && preview.ranked.items && preview.ranked.items.length) {
      html += subLabel("RANKED · " + (preview.ranked.title || preview.label));
      html += sidebar
        ? `<article class="db-entry sp-highlights"><ul class="${listCls}">` +
          preview.ranked.items.map(i => `<li>${i}</li>`).join("") + `</ul></article>`
        : `<ul class="${listCls}">` + preview.ranked.items.map(i => `<li>${i}</li>`).join("") + `</ul>`;
    }

    if (preview.modes && preview.modes.length) {
      html += subLabel("MODI & EVENTS");
      for (const m of preview.modes) {
        if (sidebar) {
          html +=
            `<article class="db-entry">` +
            `<div class="db-meta"><span class="db-tag db-tag-season">MODUS</span></div>` +
            `<div class="db-entry-title">${m.name}</div>` +
            `<div class="db-entry-text">${m.desc}</div></article>`;
        } else {
          html += `<div class="dbr-mode"><b>${m.name}</b><br><span>${m.desc}</span></div>`;
        }
      }
    }

    if (preview.operators && preview.operators.length) {
      html += subLabel("OPERATOR");
      for (const op of preview.operators) {
        if (sidebar) {
          html +=
            `<article class="db-entry">` +
            `<div class="db-meta"><span class="db-tag db-tag-shop">${op.faction}</span></div>` +
            `<div class="db-entry-title">${op.name}</div>` +
            `<div class="db-entry-text">${op.desc}</div></article>`;
        } else {
          html +=
            `<div class="dbr-mode"><b>${op.name}</b> ` +
            `<span class="dbr-faction">${op.faction}</span><br><span>${op.desc}</span></div>`;
        }
      }
    }

    if (preview.qol && preview.qol.length && !opts.upcomingOnly) {
      html += subLabel("QUALITÄT & UI");
      html += sidebar
        ? `<article class="db-entry sp-highlights"><ul class="${listCls}">` +
          preview.qol.map(i => `<li>${i}</li>`).join("") + `</ul></article>`
        : `<ul class="${listCls}">` + preview.qol.map(i => `<li>${i}</li>`).join("") + `</ul>`;
    }

    const changeSections = [
      { key: "BUFF", label: "WAFFEN-BUFFS" },
      { key: "NERF", label: "WAFFEN-NERFS" },
      { key: "NEU", label: "NEU IN DIESER SAISON" },
    ];
    for (const sec of changeSections) {
      const items = (preview.changes || []).filter(c => c.tag === sec.key);
      if (!items.length) continue;
      html += subLabel(sec.label);
      for (const ch of items) {
        if (sidebar) {
          html +=
            `<article class="db-entry">` +
            `<div class="db-meta"><span class="db-tag ${ch.tagClass || ""}">${ch.tag}</span></div>` +
            `<div class="db-entry-title">${ch.title}</div>` +
            `<div class="db-entry-text">${ch.text}</div></article>`;
        } else {
          html +=
            `<div class="dbr-change"><span class="db-tag ${ch.tagClass || ""}">${ch.tag}</span> ` +
            `<b>${ch.title}</b><br><span>${ch.text}</span></div>`;
        }
      }
    }

    if (!sidebar) html += `</div>`;
    return html;
  }

  renderDevblogEntry(entry, full) {
    let html =
      `<article class="db-entry${full ? " db-entry-full" : ""}${entry.id ? " db-entry-" + entry.id : ""}"` +
      (entry.id ? ` id="devblog-${entry.id}"` : "") + `>` +
      `<div class="db-meta">` +
      `<span class="db-tag ${entry.tagClass || ""}">${entry.tag}</span>` +
      `<span class="db-date">${entry.date}` +
      (entry.until ? ` · bis ${entry.until}` : "") + `</span></div>` +
      `<div class="db-entry-title">${entry.title}</div>` +
      `<div class="db-entry-text">${entry.text}</div>`;

    if (full && entry.intro) {
      html += `<p class="db-entry-intro">${entry.intro}</p>`;
    }
    if (full && entry.sections && entry.sections.length) {
      html += `<div class="db-maint-sections">`;
      for (const sec of entry.sections) {
        html +=
          `<div class="db-maint-block">` +
          `<div class="db-maint-head"><span class="db-maint-emoji">${sec.emoji || "🔧"}</span>` +
          `<div><div class="db-maint-title">${sec.title}</div>` +
          (sec.subtitle ? `<div class="db-maint-sub">${sec.subtitle}</div>` : "") +
          `</div></div>` +
          `<ul class="db-maint-list">` +
          sec.changes.map(c => `<li>${c}</li>`).join("") +
          `</ul></div>`;
      }
      html += `</div>`;
    }
    if (full && entry.notes && entry.notes.length) {
      html +=
        `<div class="db-maint-notes">` +
        `<div class="db-maint-notes-label">${entry.notesLabel || "WÄHREND DER WARTUNG"}</div>` +
        `<ul class="db-maint-list db-maint-notes-list">` +
        entry.notes.map(n => `<li>${n}</li>`).join("") +
        `</ul></div>`;
    }
    if (full && BH.ModeMaintenance && BH.ModeMaintenance.isDevblogActive(entry.id)) {
      html += `<p class="db-maint-countdown">⏱ Wieder spielbar: <b>${BH.ModeMaintenance.formatRemainingForDevblog(entry.id)}</b></p>`;
    }
    html += `</article>`;
    return html;
  }

  renderDevblogScreen() {
    if (!BH.DEVBLOG) return;
    const d = BH.Progress.data;
    const entries = BH.DEVBLOG;
    const latest = entries[0];

    const headMeta = document.getElementById("dblog-head-meta");
    if (headMeta) headMeta.textContent = entries.length + " Einträge · " + (latest ? latest.date : "") +
      (BH.GAME_VERSION ? " · v" + BH.GAME_VERSION : "");

    const featured = document.getElementById("dblog-featured");
    if (featured && latest) {
      featured.innerHTML =
        (BH.DevBlogReward && BH.DevBlogReward.canClaim(d)
          ? `<div class="dbf-gift-hint">🎁 1 Tag Premium oben im News-Tab einsammeln</div>`
          : "") +
        `<div class="dbf-tag ${latest.tagClass || ""}">${latest.tag}</div>` +
        `<div class="dbf-title">${latest.title}</div>` +
        `<div class="dbf-date">${latest.date}${latest.until ? " · bis " + latest.until : ""}</div>` +
        `<div class="dbf-text">${latest.text}</div>` +
        (latest.id && BH.ModeMaintenance && BH.ModeMaintenance.isDevblogActive(latest.id)
          ? `<div class="dbf-maint-cta">⏱ ${BH.ModeMaintenance.formatRemainingForDevblog(latest.id)} · Details unten</div>`
          : "");
    }

    const sideInfo = document.getElementById("dblog-sidebar-info");
    if (sideInfo) {
      const lvl = BH.Progress.getLevel();
      const bpTier = BH.Progress.getBpTier();
      sideInfo.innerHTML =
        `<div class="dbf-stat"><span>Version</span><span>${BH.gameVersionLabel ? BH.gameVersionLabel(d) : "v0.0.1"}</span></div>` +
        `<div class="dbf-stat"><span>Dein Level</span><span>${lvl.level} / ${BH.MAX_LEVEL}</span></div>` +
        `<div class="dbf-stat"><span>Battle Pass</span><span>Stufe ${bpTier}</span></div>` +
        `<div class="dbf-stat"><span>Matches</span><span>${d.matches || 0}</span></div>` +
        `<p class="dbf-note">Kostenlos · Kein Account · Speicherstand lokal</p>` +
        `<p class="dbf-studio">${(BH.STUDIO && BH.STUDIO.creditLine) || "© NACHTBLAU Interaktive"}</p>`;
    }

    const newsList = document.getElementById("dblog-news-list");
    const newsReward = document.getElementById("dblog-news-reward");
    if (newsReward && BH.DevBlogReward) {
      const canClaim = BH.DevBlogReward.canClaim(d);
      if (canClaim) {
        newsReward.innerHTML =
          `<div class="dblog-reward-box">` +
          `<div class="dblog-reward-text">` +
          `<span class="dblog-reward-tag">🎁 LESE-BONUS</span>` +
          `<span class="dblog-reward-title">1 Tag Premium gratis</span>` +
          `<span class="dblog-reward-sub">Lies die News — dann hier einsammeln · +15 % XP · +10 % Credits</span>` +
          `</div>` +
          `<button type="button" class="btn btn-primary dblog-reward-btn" id="dblog-claim-premium">` +
          `⭐ 1 TAG PREMIUM EINSAMMELN` +
          `</button>` +
          `</div>`;
        newsReward.classList.remove("hidden", "claimed");
        const claimBtn = document.getElementById("dblog-claim-premium");
        if (claimBtn) {
          claimBtn.onclick = () => {
            const res = BH.DevBlogReward.claimPremiumDay(d);
            if (res.ok) {
              BH.audio.buy();
              if (BH.UI) BH.UI.toast("⭐ 1 Tag Premium aktiviert — danke fürs Lesen!", "success");
              this.renderDevblogScreen();
              this.renderTopbar();
              this.renderHome();
            } else {
              BH.audio.empty();
            }
          };
        }
      } else {
        newsReward.innerHTML =
          `<div class="dblog-reward-box claimed">` +
          `<span class="dblog-reward-claimed">✔ Lese-Bonus eingelöst · Premium aktiv oder bereits abgeholt</span>` +
          (BH.PremiumPlaytime && BH.PremiumPlaytime.isActive(d)
            ? `<span class="dblog-reward-active">${BH.PremiumPlaytime.statusLabel(d)}</span>`
            : "") +
          `</div>`;
        newsReward.classList.add("claimed");
        newsReward.classList.remove("hidden");
      }
    }

    if (newsList) {
      newsList.innerHTML = entries.map(e => this.renderDevblogEntry(e, true)).join("");
    }

    const roadmapEl = document.getElementById("dblog-roadmap");
    if (roadmapEl && BH.SeasonPreview) {
      const preview = BH.SeasonPreview.forRoadmap();
      const cd = BH.SeasonRelease && BH.SeasonRelease.getS2Countdown();
      let etaText = preview ? preview.eta || "" : "";
      if (preview && cd && !cd.live && !cd.expired) {
        etaText = `Start in ${cd.days} Tagen · ${BH.SeasonRelease.s2LaunchDateLabel()}`;
      } else if (preview && BH.SeasonRelease) {
        etaText = BH.SeasonRelease.s2LaunchDateLabel();
      }
      roadmapEl.innerHTML = preview
        ? this.buildSeasonRoadmapHtml(preview, { role: "upcoming", etaText, upcomingOnly: true })
        : "";
    }
    this.applyRoadmapDisabled();

    const aboutEl = document.getElementById("dblog-about");
    if (aboutEl) {
      aboutEl.innerHTML =
        `<div class="dba-block">` +
        `<h3 class="dba-h">Was ist Black Horizon?</h3>` +
        `<p class="dba-p">Ein kostenloser Browser-FPS im Shooter-Stil. 2038: Vier Fraktionen, Outbreak-Katastrophe, dein Operator. Kampagne, Zombies, Ranked und 15+ Modi — direkt im Browser, ohne Download.</p>` +
        `</div>` +
        `<div class="dba-block">` +
        `<h3 class="dba-h">Kernfeatures</h3>` +
        `<ul class="dbr-list">` +
        `<li>6-Missionen-Kampagne mit Boss-Kämpfen</li>` +
        `<li>Battle Pass mit 100 Stufen pro Saison</li>` +
        `<li>18 Operatoren · Loadout · Shop · Prestige</li>` +
        `<li>Fraktionskrieg · Clans · Freundes-Codes</li>` +
        `<li>Zombies: Perks, Pack-a-Punch, Easter Egg</li>` +
        `<li>Ranked · Achievements · Daily Login</li>` +
        `</ul></div>` +
        `<div class="dba-block">` +
        `<h3 class="dba-h">Steuerung</h3>` +
        `<p class="dba-p">WASD · Maus · LMB/RMB · R · Shift · Tab · Esc · Touch auf Tablet/Handy</p>` +
        `</div>` +
        `<div class="dba-block dba-studio">` +
        `<h3 class="dba-h">Credits</h3>` +
        `<p class="dba-p dba-studio-name">${(BH.STUDIO && BH.STUDIO.name) || "NACHTBLAU Interaktive"}</p>` +
        `<p class="dba-p">Entwicklung, Design und Umsetzung von Project: Black Horizon.</p>` +
        `<p class="dba-p">Aktuelle Version: <b>${BH.gameVersionShort ? BH.gameVersionShort() : "v0.0.1"}</b></p>` +
        `</div>`;
    }

    this.applyDevblogTab();
  }

  renderSeasonPreview() {
    const list = document.getElementById("season-preview-list");
    const label = document.getElementById("sp-season-label");
    const titleEl = document.querySelector("#season-preview .db-title");
    if (!list || !BH.SeasonPreview) return;
    const d = BH.Progress.data;
    const current = BH.SeasonRelease
      ? BH.SeasonRelease.effectiveBpSeason(d)
      : (d.bpSeason || 1);
    const preview = BH.SeasonPreview.forNextSeason(current);
    if (titleEl) titleEl.textContent = preview.label || "SAISON 2";
    if (label) label.textContent = preview.sub || preview.name || "";
    list.innerHTML = "";

    this.updateS2Countdown();

    const cd = BH.SeasonRelease && BH.SeasonRelease.getS2Countdown();
    const etaText = cd && !cd.live && !cd.expired
      ? `Start in ${cd.days} Tagen · ${BH.SeasonRelease.s2LaunchDateLabel()}`
      : (BH.SeasonRelease ? BH.SeasonRelease.s2LaunchDateLabel() : preview.eta || "");

    list.innerHTML = this.buildSeasonRoadmapHtml(preview, {
      role: "upcoming",
      etaText,
      sidebar: true,
      upcomingOnly: true,
    });

    const foot = document.createElement("button");
    foot.type = "button";
    foot.className = "sp-devblog-link";
    foot.textContent = "DEVBLOG · ROADMAP →";
    foot.onclick = () => {
      this._devblogTab = "roadmap";
      this.showScreen("devblog");
    };
    list.appendChild(foot);
    this.applyRoadmapDisabled();
  }

  bundleItemCount(bundle) {
    const items = bundle.items || {};
    let n = 0;
    for (const k of Object.keys(items)) {
      if (k === "credits") { if (items.credits) n++; continue; }
      if (Array.isArray(items[k])) n += items[k].length;
    }
    return n;
  }

  initFeedback() {
    const open = () => this.openFeedback();
    const close = () => this.closeFeedback();
    const overlay = document.getElementById("feedback-overlay");
    document.getElementById("btn-feedback")?.addEventListener("click", () => { BH.audio.click(); open(); });
    document.getElementById("btn-open-feedback")?.addEventListener("click", () => { BH.audio.click(); open(); });
    document.getElementById("btn-feedback-close")?.addEventListener("click", () => { BH.audio.click(); close(); });
    overlay?.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.getElementById("btn-feedback-submit")?.addEventListener("click", () => this.submitFeedback());
    document.getElementById("btn-feedback-mail")?.addEventListener("click", () => this.mailFeedback());
  }

  openFeedback() {
    const overlay = document.getElementById("feedback-overlay");
    const msg = document.getElementById("feedback-msg");
    if (msg) msg.textContent = "";
    if (overlay) overlay.classList.remove("hidden");
  }

  closeFeedback() {
    document.getElementById("feedback-overlay")?.classList.add("hidden");
  }

  _feedbackPayload() {
    return {
      category: document.getElementById("feedback-category")?.value || "bug",
      text: document.getElementById("feedback-text")?.value || "",
      contact: document.getElementById("feedback-contact")?.value || "",
      includeSave: document.getElementById("feedback-include-save")?.checked !== false,
    };
  }

  async submitFeedback() {
    if (!BH.Feedback) return;
    const msgEl = document.getElementById("feedback-msg");
    const payload = this._feedbackPayload();
    if (!payload.text.trim()) {
      BH.audio.empty();
      if (msgEl) msgEl.textContent = "Bitte beschreibe das Problem oder deinen Vorschlag.";
      return;
    }
    const res = await BH.Feedback.submit(payload);
    if (!res.ok) {
      BH.audio.empty();
      if (msgEl) msgEl.textContent = "Report konnte nicht erstellt werden.";
      return;
    }
    BH.audio.buy();
    if (msgEl) {
      msgEl.textContent = res.copied
        ? "Report kopiert ✔ — einfügen in Discord, E-Mail oder das Feedback-Formular."
        : "Report erstellt ✔ — nutze „Per E-Mail“ oder markiere den Text manuell.";
    }
    const ta = document.getElementById("feedback-text");
    if (ta && !res.copied) {
      ta.value = res.report;
      ta.select();
    }
  }

  mailFeedback() {
    if (!BH.Feedback) return;
    const msgEl = document.getElementById("feedback-msg");
    const payload = this._feedbackPayload();
    if (!payload.text.trim()) {
      BH.audio.empty();
      if (msgEl) msgEl.textContent = "Bitte zuerst eine Beschreibung eingeben.";
      return;
    }
    const report = BH.Feedback.buildReport(payload);
    BH.Feedback._saveLog({
      at: new Date().toISOString(),
      category: payload.category,
      text: payload.text,
      contact: payload.contact || "",
    });
    BH.audio.click();
    window.location.href = BH.Feedback.mailtoUrl(report);
    if (msgEl) msgEl.textContent = "E-Mail-Programm geöffnet — Report ist vorausgefüllt.";
  }

  initCrates() {
    if (!BH.Crates || !BH.Crates.isEnabled()) return;
    const overlay = document.getElementById("crate-overlay");
    document.getElementById("btn-crates")?.addEventListener("click", () => {
      BH.audio.click();
      this.openCrateHub();
    });
    document.getElementById("btn-home-crates")?.addEventListener("click", () => {
      BH.audio.click();
      this.openCrateHub();
    });
    document.getElementById("btn-crate-hub-close")?.addEventListener("click", () => {
      BH.audio.click();
      this.closeCrateHub();
    });
    document.getElementById("crate-hub-overlay")?.addEventListener("click", (e) => {
      if (e.target.id === "crate-hub-overlay") this.closeCrateHub();
    });
    document.getElementById("btn-crate-drop-info-close")?.addEventListener("click", () => {
      BH.audio.click();
      this.closeCrateDropInfo();
    });
    document.getElementById("crate-drop-info-overlay")?.addEventListener("click", (e) => {
      if (e.target.id === "crate-drop-info-overlay") this.closeCrateDropInfo();
    });
    document.getElementById("btn-end-crate-open")?.addEventListener("click", () => {
      BH.audio.click();
      const d = BH.Progress.data;
      const type = Object.keys(BH.Crates.TYPES).find(t => BH.Crates.count(d, t) > 0) || "front";
      this.openCrateModal(type);
    });
    document.getElementById("btn-crate-close")?.addEventListener("click", () => {
      BH.audio.click();
      this.closeCrateModal();
    });
    document.getElementById("btn-crate-open-done")?.addEventListener("click", () => {
      BH.audio.click();
      this.closeCrateModal();
    });
    document.getElementById("btn-crate-open-confirm")?.addEventListener("click", () => {
      BH.audio.click();
      this.performCrateOpen();
    });
    document.getElementById("btn-crate-open-all")?.addEventListener("click", () => {
      BH.audio.click();
      this.performCrateOpenAll();
    });
    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) this.closeCrateModal();
    });
    this.updateCrateTopbar();
    this.renderHomeCrates();
  }

  renderHomeCrates() {
    if (!BH.Crates || !BH.Crates.isEnabled()) return;
    const totalEl = document.getElementById("home-crates-total");
    const bar = document.getElementById("btn-home-crates");
    if (!totalEl || !bar) return;
    const total = BH.Crates.totalUnopened(BH.Progress.data);
    totalEl.textContent = String(total);
    bar.classList.toggle("has-crates", total > 0);
    bar.title = total > 0
      ? `${total} Kiste(n) im Inventar — klicken zum Öffnen`
      : "Keine Kisten — Event-Kisten im Shop kaufen";
  }

  updateCrateTopbar() {
    if (!BH.Crates || !BH.Crates.isEnabled()) return;
    const btn = document.getElementById("btn-crates");
    const countEl = document.getElementById("tb-crates-count");
    if (!btn || !countEl) return;
    const n = BH.Crates.totalUnopened(BH.Progress.data);
    countEl.textContent = n;
    btn.classList.remove("hidden");
    this.renderHomeCrates();
  }

  renderEndCrate(grant) {
    const wrap = document.getElementById("end-crate");
    const btnOpen = document.getElementById("btn-end-crate-open");
    if (!wrap || !BH.Crates || !BH.Crates.isEnabled()) {
      wrap?.classList.add("hidden");
      btnOpen?.classList.add("hidden");
      return;
    }
    if (!grant || !grant.ok) {
      wrap.classList.add("hidden");
      btnOpen?.classList.add("hidden");
      return;
    }
    const def = BH.Crates.typeDef(grant.type);
    const remaining = BH.Crates.dailyRemaining(BH.Progress.data, grant.type);
    wrap.classList.remove("hidden");
    wrap.innerHTML =
      `<div class="end-crate-inner">` +
      `<div class="end-crate-icon">${def ? def.icon : "📦"}</div>` +
      `<div class="end-crate-text">` +
      `<div class="end-crate-title">${def ? def.name : "KISTE"} erhalten!</div>` +
      `<div class="end-crate-sub">Kosmetische Belohnung · Öffnen über 📦 KISTEN</div>` +
      `<div class="end-crate-meta">Im Inventar: ${grant.total} · Heute noch ${remaining} Match-Kisten möglich</div>` +
      `</div></div>`;
    btnOpen?.classList.remove("hidden");
  }

  updateCrateModalButtons(type) {
    const count = BH.Crates ? BH.Crates.count(BH.Progress.data, type) : 0;
    const ready = BH.Crates ? BH.Crates.poolReady(type) : true;
    const confirm = document.getElementById("btn-crate-open-confirm");
    const openAll = document.getElementById("btn-crate-open-all");
    if (count < 1 || !ready) {
      confirm?.classList.add("hidden");
      openAll?.classList.add("hidden");
    } else {
      confirm?.classList.remove("hidden");
      if (confirm) confirm.textContent = "ÖFFNEN";
      if (openAll) {
        openAll.textContent = `ALLE ÖFFNEN (${count})`;
        openAll.classList.remove("hidden");
      }
    }
  }

  _crateAccent(type) {
    const def = BH.Crates && BH.Crates.typeDef(type);
    return (def && def.color) || "#4ade80";
  }

  _crateClearAnimTimers() {
    if (this._crateAnimTimers) {
      this._crateAnimTimers.forEach(t => clearTimeout(t));
    }
    this._crateAnimTimers = [];
  }

  _crateSchedule(fn, ms) {
    if (!this._crateAnimTimers) this._crateAnimTimers = [];
    const id = setTimeout(fn, ms);
    this._crateAnimTimers.push(id);
    return id;
  }

  _resetCrateStage(type) {
    this._crateClearAnimTimers();
    const def = BH.Crates && BH.Crates.typeDef(type);
    const color = this._crateAccent(type);
    const modal = document.querySelector(".crate-modal");
    const stage = document.getElementById("crate-open-stage");
    const box = document.getElementById("crate-open-box");
    const glow = document.getElementById("crate-open-glow");
    const rays = document.getElementById("crate-open-rays");
    const particles = document.getElementById("crate-open-particles");
    const progress = document.getElementById("crate-open-progress-fill");
    const base = box && box.querySelector(".crate-box-base");

    if (modal) modal.style.setProperty("--crate-accent", color);
    if (stage) {
      stage.className = "crate-open-stage";
      stage.classList.remove("hidden", "crate-phase-done");
    }
    if (glow) glow.style.setProperty("--crate-glow", color);
    if (rays) rays.style.setProperty("--crate-glow", color);
    if (box) {
      box.className = "crate-open-box";
      box.style.setProperty("--crate-accent", color);
    }
    if (base) base.textContent = (def && def.icon) || "📦";
    if (progress) progress.style.width = "0%";
    if (particles) particles.innerHTML = "";
  }

  _spawnCrateParticles(color) {
    const particles = document.getElementById("crate-open-particles");
    if (!particles) return;
    particles.innerHTML = "";
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const dist = 48 + (i % 3) * 8;
      const p = document.createElement("span");
      p.className = "crate-particle";
      p.style.setProperty("--tx", Math.round(Math.cos(angle) * dist) + "px");
      p.style.setProperty("--ty", Math.round(Math.sin(angle) * dist) + "px");
      p.style.setProperty("--crate-glow", color);
      particles.appendChild(p);
    }
  }

  _runCrateOpenAnimation(type, onComplete, options) {
    const fast = options && options.fast;
    const color = this._crateAccent(type);
    const stage = document.getElementById("crate-open-stage");
    const hint = document.getElementById("crate-open-hint");
    const progress = document.getElementById("crate-open-progress-fill");

    this._resetCrateStage(type);
    this._spawnCrateParticles(color);

    const phases = fast
      ? [
          { cls: "crate-phase-shake", hint: "Öffnen…", pct: 55, ms: 420 },
          { cls: "crate-phase-burst", hint: "", pct: 100, ms: 380 },
        ]
      : [
          { cls: "crate-phase-charge", hint: "Energie aufbauen…", pct: 22, ms: 480 },
          { cls: "crate-phase-shake", hint: "Öffnen…", pct: 52, ms: 680 },
          { cls: "crate-phase-burst", hint: "", pct: 78, ms: 520 },
          { cls: "crate-phase-open", hint: "Belohnung!", pct: 100, ms: 420 },
        ];

    let delay = 0;
    phases.forEach(ph => {
      this._crateSchedule(() => {
        if (stage) stage.className = "crate-open-stage " + ph.cls;
        if (hint && ph.hint) hint.textContent = ph.hint;
        if (progress) progress.style.width = ph.pct + "%";
      }, delay);
      delay += ph.ms;
    });

    this._crateSchedule(() => {
      if (stage) stage.classList.add("crate-phase-done");
      onComplete();
    }, delay);
  }

  resetCrateModal(type) {
    const def = BH.Crates.typeDef(type);
    const title = document.getElementById("crate-modal-title");
    const stage = document.getElementById("crate-open-stage");
    const hint = document.getElementById("crate-open-hint");
    const panel = document.getElementById("crate-reward-panel");
    const confirm = document.getElementById("btn-crate-open-confirm");
    const done = document.getElementById("btn-crate-open-done");
    if (title) title.textContent = def ? def.name : "KISTE";
    this._resetCrateStage(type);
    stage?.classList.remove("hidden");
    panel?.classList.add("hidden");
    if (panel) {
      panel.classList.remove("crate-reward-visible");
      panel.innerHTML = "";
    }
    if (hint) {
      hint.textContent = BH.Crates && !BH.Crates.poolReady(type)
        ? "Drop-Pool folgt bald — Kiste bleibt sicher im Inventar."
        : "Klicke ÖFFNEN für deine Belohnung.";
    }
    confirm?.classList.remove("hidden");
    done?.classList.add("hidden");
    document.getElementById("btn-crate-open-all")?.classList.add("hidden");
    this.updateCrateModalButtons(type);
  }

  openCrateModal(type) {
    if (!BH.Crates || !BH.Crates.isEnabled()) return;
    if (BH.Crates.count(BH.Progress.data, type) < 1) {
      BH.audio.empty();
      return;
    }
    this._crateOpenType = type;
    this.resetCrateModal(type);
    this.updateCrateModalButtons(type);
    document.getElementById("crate-overlay")?.classList.remove("hidden");
  }

  closeCrateModal() {
    this._crateClearAnimTimers();
    document.getElementById("crate-overlay")?.classList.add("hidden");
    this._crateOpenType = null;
    this.updateCrateTopbar();
    this.renderTopbar();
    const d = BH.Progress.data;
    const n = BH.Crates ? BH.Crates.totalUnopened(d) : 0;
    const btnOpen = document.getElementById("btn-end-crate-open");
    if (btnOpen) btnOpen.classList.toggle("hidden", n < 1);
    this.renderCrateHub();
  }

  openCrateHub() {
    this.renderCrateHub();
    document.getElementById("crate-hub-overlay")?.classList.remove("hidden");
  }

  closeCrateHub() {
    document.getElementById("crate-hub-overlay")?.classList.add("hidden");
  }

  performCrateOpen() {
    const type = this._crateOpenType;
    if (!type || !BH.Crates) return;
    if (BH.Crates.count(BH.Progress.data, type) < 1) {
      BH.audio.empty();
      this.closeCrateModal();
      return;
    }
    const hint = document.getElementById("crate-open-hint");
    const confirm = document.getElementById("btn-crate-open-confirm");
    const panel = document.getElementById("crate-reward-panel");
    const stage = document.getElementById("crate-open-stage");
    if (panel) {
      panel.classList.add("hidden");
      panel.classList.remove("crate-reward-visible");
      panel.innerHTML = "";
    }
    stage?.classList.remove("hidden");
    if (hint) hint.textContent = "Kiste wird geöffnet…";
    if (confirm) {
      confirm.disabled = true;
      confirm.textContent = "ÖFFNEN";
    }

    this._runCrateOpenAnimation(type, () => {
      const res = BH.Crates.open(BH.Progress.data, type);
      if (confirm) confirm.disabled = false;
      if (!res.ok) {
        BH.audio.empty();
        if (res.reason === "pool_empty" && BH.UI) {
          BH.UI.toast("Drop-Pool folgt bald — Kiste noch nicht öffnbar.", "error");
        }
        this.resetCrateModal(type);
        return;
      }
      BH.audio.buy();
      this.showCrateReward(res);
      this.updateCrateTopbar();
      this.renderTopbar();
      this.updateCrateModalButtons(type);
      this.refreshCrateDropInfoIfOpen(type);
    });
  }

  performCrateOpenAll() {
    const type = this._crateOpenType;
    if (!type || !BH.Crates) return;
    const count = BH.Crates.count(BH.Progress.data, type);
    if (count < 1) {
      BH.audio.empty();
      this.closeCrateModal();
      return;
    }
    const confirm = document.getElementById("btn-crate-open-confirm");
    const openAll = document.getElementById("btn-crate-open-all");
    const hint = document.getElementById("crate-open-hint");
    const panel = document.getElementById("crate-reward-panel");
    if (panel) {
      panel.classList.add("hidden");
      panel.classList.remove("crate-reward-visible");
      panel.innerHTML = "";
    }
    if (confirm) confirm.disabled = true;
    if (openAll) openAll.disabled = true;
    if (hint) hint.textContent = `${count} Kisten werden geöffnet…`;

    this._runCrateOpenAnimation(type, () => {
      const bulk = BH.Crates.openAll(BH.Progress.data, type);
      if (confirm) confirm.disabled = false;
      if (openAll) openAll.disabled = false;
      if (!bulk.ok) {
        BH.audio.empty();
        if (BH.Crates && !BH.Crates.poolReady(type) && BH.UI) {
          BH.UI.toast("Drop-Pool folgt bald — Kiste noch nicht öffnbar.", "error");
        }
        this.resetCrateModal(type);
        return;
      }
      BH.audio.buy();
      this.showCrateBulkSummary(bulk);
      this.updateCrateTopbar();
      this.renderTopbar();
      this.refreshCrateDropInfoIfOpen(type);
    }, { fast: true });
  }

  showCrateBulkSummary(bulk) {
    const panel = document.getElementById("crate-reward-panel");
    const confirm = document.getElementById("btn-crate-open-confirm");
    const openAll = document.getElementById("btn-crate-open-all");
    const done = document.getElementById("btn-crate-open-done");
    const hint = document.getElementById("crate-open-hint");
    const stage = document.getElementById("crate-open-stage");
    if (stage) {
      stage.classList.add("crate-phase-done");
      this._crateSchedule(() => stage.classList.add("hidden"), 180);
    }
    if (hint) hint.textContent = `${bulk.opened} Kiste(n) geöffnet!`;
    confirm?.classList.add("hidden");
    openAll?.classList.add("hidden");

    const lines = Object.entries(bulk.itemCounts || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, n]) => `<li>${name}${n > 1 ? " ×" + n : ""}</li>`)
      .join("");

    if (panel) {
      panel.classList.remove("hidden");
      panel.innerHTML =
        `<div class="crate-bulk-summary">` +
        `<div class="crate-bulk-title">${bulk.opened} BELOHNUNGEN</div>` +
        `<ul class="crate-bulk-list">${lines || "<li>—</li>"}</ul>` +
        (bulk.totalPremiumDays
          ? `<div class="crate-bulk-prem">⭐ +${bulk.totalPremiumDays} Tage Premium-Spielzeit</div>`
          : "") +
        (bulk.totalCredits
          ? `<div class="crate-bulk-credits">⛁ +${bulk.totalCredits} Credits (Duplikate)</div>`
          : "") +
        (BH.PremiumPlaytime && BH.PremiumPlaytime.isActive(BH.Progress.data)
          ? `<div class="crate-bulk-prem-active">${BH.PremiumPlaytime.statusLabel(BH.Progress.data)}</div>`
          : "") +
        `</div>`;
      this._crateSchedule(() => panel.classList.add("crate-reward-visible"), 40);
    }
    done?.classList.remove("hidden");
    if (done) done.textContent = "FERTIG";
  }

  showCrateReward(res) {
    const rarity = BH.Crates.RARITY[res.rarity] || {};
    const panel = document.getElementById("crate-reward-panel");
    const confirm = document.getElementById("btn-crate-open-confirm");
    const done = document.getElementById("btn-crate-open-done");
    const hint = document.getElementById("crate-open-hint");
    const stage = document.getElementById("crate-open-stage");
    if (stage) {
      stage.classList.add("crate-phase-done");
      this._crateSchedule(() => stage.classList.add("hidden"), 200);
    }
    if (hint) hint.textContent = "Belohnung erhalten!";
    if (panel) {
      panel.classList.remove("hidden", "crate-reward-visible");
      const dup = res.applied && res.applied.duplicate;
      const isPrem = res.applied && res.applied.kind === "premiumTime";
      let dupLine = `<div class="crate-reward-new">Neu freigeschaltet!</div>`;
      if (isPrem) {
        dupLine = `<div class="crate-reward-prem">⭐ Premium-Spielzeit · +${res.applied.days} Tage</div>` +
          (BH.PremiumPlaytime ? `<div class="crate-reward-prem-left">${BH.PremiumPlaytime.statusLabel(BH.Progress.data)} · ${BH.PremiumPlaytime.benefitSummary()}</div>` : "");
      } else if (dup) {
        dupLine = `<div class="crate-reward-dup">Duplikat → +${res.applied.credits} ⛁</div>`;
      } else if (res.applied && res.applied.kind === "weapon") {
        dupLine = res.applied.epic
          ? `<div class="crate-reward-new">Epic-Waffe freigeschaltet!</div>`
          : `<div class="crate-reward-new">Fantasiewaffe freigeschaltet!</div>`;
      }
      const exLine = res.rarity === "legendary"
        ? `<div class="crate-reward-ex">★ LEGENDARY · ALPHA-EXKLUSIV</div>` +
          (res.pityLegendaryHit ? `<div class="crate-reward-pity-leg">★ PITY · Legendary garantiert (1.000 Kisten)</div>` : "")
        : (res.applied && res.applied.epic
          ? `<div class="crate-reward-ex">★ EPIC · ALPHA-KISTE</div>`
          : (res.display.exclusive ? `<div class="crate-reward-ex">★ EVENT-EXKLUSIV</div>` : ""));
      const legPity = res.legendaryPity;
      const legPityLine = legPity
        ? `<div class="crate-reward-pity-leg">Pity Legendary: ${legPity.count.toLocaleString("de-DE")} / ${legPity.max.toLocaleString("de-DE")}` +
          (legPity.remaining > 0 ? ` · noch ${legPity.remaining.toLocaleString("de-DE")} Kiste(n)` : "") +
          `</div>`
        : "";
      panel.innerHTML =
        `<div class="crate-reward-card ${rarity.css || ""}">` +
        `<div class="crate-reward-rarity">${rarity.label || res.rarity}</div>` +
        `<div class="crate-reward-icon">${res.display.icon}</div>` +
        `<div class="crate-reward-name">${res.display.name}</div>` +
        dupLine +
        exLine +
        (res.rarity !== "legendary" ? `<div class="crate-reward-pity">Pity Rare: noch ${res.pityRemaining} Kiste(n)</div>` : "") +
        legPityLine +
        `</div>`;
      this._crateSchedule(() => panel.classList.add("crate-reward-visible"), 40);
    }
    const left = res.inventoryLeft || 0;
    if (left > 0) {
      confirm?.classList.remove("hidden");
      if (confirm) confirm.textContent = `NOCH EINE (${left})`;
      const openAllBtn = document.getElementById("btn-crate-open-all");
      if (openAllBtn) {
        openAllBtn.textContent = `ALLE ÖFFNEN (${left})`;
        openAllBtn.classList.remove("hidden");
      }
      done?.classList.remove("hidden");
      if (done) done.textContent = "FERTIG";
    } else {
      confirm?.classList.add("hidden");
      document.getElementById("btn-crate-open-all")?.classList.add("hidden");
      done?.classList.remove("hidden");
      if (done) done.textContent = "FERTIG";
    }
  }

  closeCrateHub() {
    document.getElementById("crate-hub-overlay")?.classList.add("hidden");
  }

  cratePoolHtml(type, d) {
    if (!BH.Crates) return "";
    const def = BH.Crates.typeDef(type);
    const table = BH.Crates.previewTable(type, d);
    const weighted = BH.Crates.usesWeightedPool(type);
    const fmtPct = (v, rowId) => {
      if (weighted || type === "alpha") {
        const digits = rowId === "legendary" ? 2 : 2;
        return BH.Crates._fmtPct(v, digits);
      }
      return (Math.round(v * 10) / 10).toLocaleString("de-DE") + " %";
    };
    const pityKey = type + "Rare";
    const pityLeft = Math.max(0, BH.Crates.PITY_RARE - ((d.crates.pity[pityKey]) || 0));
    const legPity = BH.Crates.legendaryPityProgress(d, type);
    const legPityHtml = legPity
      ? `<span class="crate-pity-tag crate-pity-leg">Pity Legendary: ${legPity.count.toLocaleString("de-DE")} / ${legPity.max.toLocaleString("de-DE")}</span>`
      : "";

    if (type === "alpha") {
      return this.cratePoolHtmlAlphaTable(def, table, fmtPct, pityLeft, legPity);
    }

    const chipsHtml = weighted
      ? ""
      : `<div class="crate-chance-bars">` +
        BH.Crates.rarityChips(type).map(c =>
          `<div class="crate-chance-row ${c.css}">` +
          `<span>${c.label}</span>` +
          `<div class="crate-chance-track"><div style="width:${c.chance}%"></div></div>` +
          `<span>${c.chance} %</span>` +
          `</div>`
        ).join("") +
        `</div>`;
    const itemTag = (it) => {
      if (it.premium) return " ★PRE";
      if (it.legendary) return " ★LEG";
      if (it.epicWeapon) return " ★EPIC";
      if (it.exclusive) return " ★EX";
      return "";
    };
    return (
      `<div class="crate-pool-head">` +
      `<h4>${def ? def.icon + " " + def.name : type}</h4>` +
      `<span class="crate-pity-tag">Pity Rare: ${pityLeft} Kiste(n)</span>` +
      legPityHtml +
      `</div>` +
      chipsHtml +
      table.map(row =>
        `<div class="crate-pool-rarity ${row.css}">` +
        `<div class="crate-pool-rarity-head">` +
        `<span>${row.label}</span><span>${fmtPct(row.chance, row.id)} gesamt</span>` +
        `</div>` +
        `<div class="crate-pool-items">` +
        row.items.map(it =>
          `<span class="crate-pool-item${it.owned ? " owned" : ""}${it.exclusive ? " exclusive" : ""}" title="${it.name}">` +
          `${it.icon} ${it.name} · <b>${fmtPct(it.itemChance, row.id)}</b>` +
          `${itemTag(it)}${it.owned ? " ✔" : ""}` +
          `</span>`
        ).join("") +
        `</div></div>`
      ).join("")
    );
  }

  cratePoolHtmlAlphaTable(def, table, fmtPct, pityLeft, legPity) {
    const legPityHtml = legPity
      ? `<span class="crate-pity-tag crate-pity-leg">Pity Legendary: ${legPity.count.toLocaleString("de-DE")} / ${legPity.max.toLocaleString("de-DE")}</span>`
      : "";
    const tagHtml = (it) => {
      const tags = [];
      if (it.premium) tags.push('<span class="crt-tag pre">PREMIUM</span>');
      if (it.legendary) tags.push('<span class="crt-tag leg">LEGENDARY</span>');
      if (it.epicWeapon) tags.push('<span class="crt-tag epic">EPIC</span>');
      else if (it.exclusive && !it.premium && !it.legendary) tags.push('<span class="crt-tag ex">EX</span>');
      if (it.owned) tags.push('<span class="crt-tag ok">✔</span>');
      return tags.join(" ");
    };

    const summaryRows = table.map(row =>
      `<tr class="crt-sum-row ${row.css}">` +
      `<td class="crt-rarity-label">${row.label}</td>` +
      `<td class="crt-pct">${fmtPct(row.chance, row.id)}</td>` +
      `<td class="crt-count">${row.items.length}</td>` +
      `</tr>`
    ).join("");

    const detailRows = table.map(row => {
      const group = `<tr class="crt-group-row ${row.css}">` +
        `<td colspan="4">${row.label} · ${fmtPct(row.chance, row.id)} gesamt · ${row.items.length} Items</td>` +
        `</tr>`;
      const items = row.items.map(it =>
        `<tr class="crt-item-row ${row.css}${it.owned ? " owned" : ""}">` +
        `<td class="crt-rarity-dot" aria-hidden="true"></td>` +
        `<td class="crt-item-name">${it.icon} ${it.name}</td>` +
        `<td class="crt-item-pct">${fmtPct(it.itemChance, row.id)}</td>` +
        `<td class="crt-item-tags">${tagHtml(it)}</td>` +
        `</tr>`
      ).join("");
      return group + items;
    }).join("");

    return (
      `<div class="crate-rate-wrap">` +
      `<div class="crate-pool-head">` +
      `<h4>${def ? def.icon + " " + def.name : "ALPHA"}</h4>` +
      `<span class="crate-pity-tag">Pity Rare: ${pityLeft} Kiste(n)</span>` +
      legPityHtml +
      `</div>` +
      `<p class="crate-pool-hint">Drop-Raten nach Seltenheit · Legendary-Waffe garantiert spätestens bei ${(legPity && legPity.max) ? legPity.max.toLocaleString("de-DE") : "1.000"} Kisten (Zähler steigt pro Öffnung)</p>` +
      `<div class="crate-rate-section-label">SELTENHEITS-ÜBERSICHT</div>` +
      `<div class="crate-rate-table-scroll">` +
      `<table class="crate-rate-table crate-rate-summary">` +
      `<thead><tr><th>Seltenheit</th><th>Gesamt-Chance</th><th>Items</th></tr></thead>` +
      `<tbody>${summaryRows}</tbody>` +
      `</table></div>` +
      `<div class="crate-rate-section-label">Einzelraten</div>` +
      `<div class="crate-rate-table-scroll crate-rate-table-scroll-tall">` +
      `<table class="crate-rate-table crate-rate-detail">` +
      `<thead><tr><th></th><th>Belohnung</th><th>Drop-Rate</th><th>Info</th></tr></thead>` +
      `<tbody>${detailRows}</tbody>` +
      `</table></div>` +
      `</div>`
    );
  }

  openCrateDropInfo(type) {
    const d = BH.Progress.data;
    const def = BH.Crates.typeDef(type);
    const title = document.getElementById("crate-drop-info-title");
    const body = document.getElementById("crate-drop-info-body");
    if (title) title.textContent = "DROP-RATEN · " + (def ? def.name : type);
    if (body) body.innerHTML = this.cratePoolHtml(type, d);
    document.getElementById("crate-drop-info-overlay")?.classList.remove("hidden");
  }

  closeCrateDropInfo() {
    document.getElementById("crate-drop-info-overlay")?.classList.add("hidden");
  }

  refreshCrateDropInfoIfOpen(type) {
    const overlay = document.getElementById("crate-drop-info-overlay");
    if (!overlay || overlay.classList.contains("hidden")) return;
    this.openCrateDropInfo(type);
  }

  renderEventCrateShop() {
    if (!BH.Crates || !BH.Crates.isEnabled()) return;
    const d = BH.Progress.data;
    const sp = (p, season) => (BH.ShopEconomy ? BH.ShopEconomy.price(p, { season, data: d }) : p);
    const spBundle = (b) => (BH.ShopEconomy ? BH.ShopEconomy.bundlePrice(b, d) : b.price);
    BH.Crates.ensure(d);
    const eventEl = document.getElementById("crate-event-shop");
    if (!eventEl) return;

    eventEl.innerHTML =
      `<div class="crate-event-label">EVENT-KISTEN · SHOP</div>` +
      (BH.SeasonRelease && BH.SeasonRelease.isEarlyAccess()
        ? `<p class="crate-event-ea-hint">${BH.SeasonRelease.earlyAccessNotice()}</p>`
        : "") +
      BH.Crates.eventShopEntries(d).map(ev => {
        const def = BH.Crates.typeDef(ev.crateType);
        const count = BH.Crates.count(d, ev.crateType);
        const invRem = BH.Crates.inventoryRemaining(d, ev.crateType);
        const atCap = invRem <= 0;
        const packs = (ev.packs || []).map(pack => {
          const packPrice = sp(pack.price, ev.season || 1);
          const canBuy = !ev.comingSoon && !atCap && invRem >= pack.qty && d.credits >= packPrice;
          const capBlock = invRem < pack.qty && !atCap;
          return (
            `<div class="crate-pack-field">` +
            `<div class="crate-pack-price">⛁ ${packPrice.toLocaleString("de-DE")}</div>` +
            `<div class="crate-pack-qty">${pack.qty} Kiste${pack.qty > 1 ? "n" : ""}</div>` +
            `<button type="button" class="btn btn-primary crate-pack-buy"` +
            `${!canBuy ? " disabled" : ""} data-event-buy="${ev.id}" data-qty="${pack.qty}">` +
            (ev.comingSoon ? "BALD" : atCap ? "LIMIT (200)" : capBlock ? `MAX ${invRem}` : d.credits < packPrice ? "ZU WENIG ⛁" : "KAUFEN") +
            `</button></div>`
          );
        }).join("");
        return (
          `<div class="crate-event-card${ev.comingSoon ? " coming-soon" : ""}" style="--crate-color:${def ? def.color : "#a855f7"}">` +
          `<div class="crate-event-card-top">` +
          `<div class="crate-event-icon">${ev.icon || "🌑"}</div>` +
          `<div class="crate-event-body">` +
          `<div class="crate-event-badge">${ev.badge}</div>` +
          `<div class="crate-event-name">${ev.name}</div>` +
          `<div class="crate-event-desc">${ev.desc}</div>` +
          `<div class="crate-event-meta">Inventar: ${count} / ${BH.Crates.MAX_INVENTORY}</div>` +
          `</div>` +
          `<button type="button" class="crate-event-info" data-crate-info="${ev.crateType}" title="Drop-Raten anzeigen">ℹ</button>` +
          `</div>` +
          `<div class="crate-event-packs">${packs}</div>` +
          `</div>`
        );
      }).join("");

    eventEl.querySelectorAll("[data-crate-info]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        BH.audio.click();
        this.openCrateDropInfo(btn.dataset.crateInfo);
      });
    });

    eventEl.querySelectorAll("[data-event-buy]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.disabled) { BH.audio.empty(); return; }
        const qty = parseInt(btn.dataset.qty, 10);
        const res = BH.Crates.buyEventCrates(d, btn.dataset.eventBuy, qty);
        if (!res.ok) {
          BH.audio.empty();
          if (res.reason === "coming_soon" && BH.UI) {
            BH.UI.toast("Kauf folgt bald — Drop-Pool wird noch befüllt.", "error");
          }
          if (res.reason === "credits") {
            btn.textContent = "ZU WENIG ⛁";
            setTimeout(() => this.renderEventCrateShop(), 1200);
          }
          return;
        }
        BH.audio.buy();
        BH.Progress.save();
        this.renderEventCrateShop();
        this.renderShop();
        this.updateCrateTopbar();
        this.renderTopbar();
        this.renderHomeCrates();
      });
    });
  }

  renderCrateHub() {
    if (!BH.Crates || !BH.Crates.isEnabled()) return;
    const d = BH.Progress.data;
    BH.Crates.ensure(d);
    const invEl = document.getElementById("crate-inventory");
    const histEl = document.getElementById("crate-history");
    if (!invEl) return;

    const premBanner = document.getElementById("crate-premium-banner");
    if (premBanner && BH.PremiumPlaytime) {
      const label = BH.PremiumPlaytime.statusLabel(d);
      if (label) {
        premBanner.classList.remove("hidden");
        premBanner.innerHTML = `<span class="crate-prem-icon">⭐</span> ${label} · ${BH.PremiumPlaytime.benefitSummary()}`;
      } else {
        premBanner.classList.add("hidden");
        premBanner.innerHTML = "";
      }
    }

    const types = Object.keys(BH.Crates.TYPES).filter(t => BH.Crates.count(d, t) > 0);

    if (!types.length) {
      invEl.innerHTML =
        `<div class="crate-hub-empty">` +
        `<div class="crate-hub-empty-icon">📦</div>` +
        `<div class="crate-hub-empty-title">Keine Kisten im Inventar</div>` +
        `<p class="crate-hub-empty-hint">Event-Kisten im Shop unter EVENT-KISTEN · FRONT-Kisten durch Matches</p>` +
        `</div>`;
    } else {
      invEl.innerHTML = types.map(type => {
        const def = BH.Crates.typeDef(type);
        const count = BH.Crates.count(d, type);
        const ready = BH.Crates.poolReady(type);
        return (
          `<div class="crate-inv-card" style="--crate-color:${def.color}">` +
          `<div class="crate-inv-icon">${def.icon}</div>` +
          `<div class="crate-inv-body">` +
          `<div class="crate-inv-name">${def.name}</div>` +
          `<div class="crate-inv-count">${count} Kiste${count !== 1 ? "n" : ""}${!ready ? " · Inhalte folgen" : ""}</div>` +
          `</div>` +
          `<div class="crate-inv-actions">` +
          (ready
            ? `<button type="button" class="btn btn-sm btn-primary crate-btn-open" data-crate-open="${type}">ÖFFNEN</button>` +
              (count > 1
                ? `<button type="button" class="btn btn-sm btn-crate-all-inv" data-crate-open-all="${type}">ALLE (${count})</button>`
                : "")
            : `<button type="button" class="btn btn-sm" disabled title="Drop-Pool folgt bald">BALD</button>`) +
          `</div></div>`
        );
      }).join("");

      invEl.querySelectorAll("[data-crate-open]").forEach(btn => {
        btn.addEventListener("click", () => {
          BH.audio.click();
          this.openCrateModal(btn.dataset.crateOpen);
        });
      });
      invEl.querySelectorAll("[data-crate-open-all]").forEach(btn => {
        btn.addEventListener("click", () => {
          BH.audio.click();
          const type = btn.dataset.crateOpenAll;
          this.openCrateModal(type);
          this.performCrateOpenAll();
        });
      });
    }

    if (histEl) {
      const hist = d.crates.history || [];
      histEl.innerHTML = hist.length
        ? `<h4 class="crate-hist-title">LETZTE DROPS</h4>` +
          hist.slice(0, 10).map(h => {
            const r = BH.Crates.RARITY[h.rarity] || {};
            const tDef = BH.Crates.typeDef(h.type);
            return `<div class="crate-hist-row ${r.css || ""}">` +
              `<span>${tDef ? tDef.icon : "📦"} ${h.label}${h.exclusive ? " ★" : ""}</span>` +
              `<span>${r.label || h.rarity}${h.duplicate ? " · Dupl." : ""}</span>` +
              `</div>`;
          }).join("")
        : "";
    }

    this.renderHomeCrates();
  }

  bundleItemLabels(bundle) {
    const items = bundle.items;
    const lines = [];
    const opName = id => (BH.OperatorCatalog
      ? BH.OperatorCatalog.find(id, BH.Progress.data)
      : BH.OPERATORS.find(o => o.id === id) || {}).name || id;
    const camoName = id => (BH.SHOP.camos.find(c => c.id === id) || {}).name || id;
    const chName = id => (BH.SHOP.crosshairs.find(c => c.id === id) || {}).name || id;
    const colName = id => (BH.SHOP.colors.find(c => c.id === id) || {}).name || id;
    for (const id of items.operators || []) lines.push("👤 " + opName(id));
    for (const id of items.weapons || []) {
      const w = BH.WEAPONS && BH.WEAPONS[id];
      lines.push("⚡ " + (w ? w.name : id));
    }
    for (const id of items.camos || []) lines.push("🔫 " + camoName(id));
    for (const id of items.crosshairs || []) lines.push("✛ " + chName(id));
    for (const id of items.colors || []) lines.push("🎨 " + colName(id));
    for (const id of items.sprays || []) {
      const s = (BH.SHOP.sprays || []).find(x => x.id === id);
      lines.push("💨 " + (s ? s.name : id));
    }
    for (const id of items.emblems || []) {
      const e = (BH.SHOP.emblems || []).find(x => x.id === id);
      lines.push((e ? e.icon : "🎖") + " " + (e ? e.name : id));
    }
    for (const id of items.titles || []) {
      const t = (BH.SHOP.titles || []).find(x => x.id === id);
      lines.push("🏷 " + (t ? t.name : id));
    }
    if (items.credits) lines.push("⛁ +" + items.credits + " Bonus-Credits");
    for (const id of items.charms || []) {
      const c = (BH.SHOP.charms || []).find(x => x.id === id);
      lines.push("📿 " + (c ? c.name : id));
    }
    for (const id of items.callingCards || []) {
      const c = (BH.CallingCards || BH.SHOP.callingCards || []).list?.find?.(x => x.id === id) ||
        (BH.SHOP.callingCards || []).find(x => x.id === id);
      lines.push("🃏 " + (c ? c.name : id));
    }
    return lines;
  }

  /* =============== OPERATOR =============== */
  opFigure(op, small, golden) {
    const hex = c => "#" + c.toString(16).padStart(6, "0");
    const s2 = !!(op.accent != null);
    let html = `<div class="op-figure${small ? " small" : ""}${golden ? " prestige-gold" : ""}${s2 ? " op-s2" : ""}">`;
    html += `<div class="opf-head" style="background:${hex(op.head)}">`;
    if (op.visor != null) html += `<div class="opf-visor" style="background:${hex(op.visor)}"></div>`;
    html += `</div>`;
    html += `<div class="opf-body" style="background:${hex(op.body)}">`;
    if (op.accent != null) html += `<div class="opf-stripe" style="background:${hex(op.accent)}"></div>`;
    html += `</div>`;
    html += `<div class="opf-legs" style="background:${hex(op.body)}"></div>`;
    if (op.accent != null) html += `<div class="opf-glow" style="--op-accent:${hex(op.accent)}"></div>`;
    html += `</div>`;
    return html;
  }

  opLockInfo(op) {
    return BH.OperatorUnlock
      ? BH.OperatorUnlock.lockInfo(op, BH.Progress.data)
      : { state: "owned" };
  }

  opRarityBadge(op, small) {
    if (!BH.OperatorRarity) return "";
    return BH.OperatorRarity.badgeHtml(BH.OperatorRarity.resolve(op), { small });
  }

  opSourceLabel(li) {
    if (li.state === "owned") return { text: "VERFÜGBAR", cls: "owned" };
    if (li.state === "buy") return { text: "SHOP · " + li.label, cls: "buy" };
    if (li.source === "battlepass") return { text: "🔒 " + li.label, cls: "locked bp" };
    if (li.source === "crate") return { text: "🔒 " + li.label, cls: "locked crate" };
    return { text: "🔒 " + li.label, cls: "locked" };
  }

  openOpSkills(opId) {
    if (!BH.OperatorSkills || !opId) return;
    const d = BH.Progress.data;
    if (!(d.owned.operators || []).includes(opId)) {
      BH.audio.empty();
      return;
    }
    const ops = BH.OperatorCatalog ? BH.OperatorCatalog.all(d) : BH.OPERATORS;
    const op = ops.find(o => o.id === opId);
    if (!op) return;
    this._opSkillsId = opId;
    this.renderOpSkillsModal(op);
    const overlay = document.getElementById("op-skills-overlay");
    if (overlay) {
      overlay.classList.remove("hidden");
      overlay.setAttribute("aria-hidden", "false");
    }
    BH.audio.click();
  }

  closeOpSkills() {
    this._opSkillsId = null;
    const overlay = document.getElementById("op-skills-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
      overlay.setAttribute("aria-hidden", "true");
    }
  }

  renderOpSkillsModal(op) {
    const body = document.getElementById("op-skills-modal-body");
    const title = document.getElementById("op-skills-modal-title");
    if (!body || !BH.OperatorSkills || !op) return;
    const d = BH.Progress.data;
    if (title) title.textContent = "SKILLS · " + op.name;

    const prog = BH.OperatorSkills.progress(d, op.id);
    const pct = Math.round((prog.matchProg / prog.perDiamond) * 100);
    const bonusLines = BH.OperatorSkills.summaryLines(d, op.id);
    let skillsHtml = "";
    for (const skill of BH.OperatorSkills.SKILLS) {
      const lvl = BH.OperatorSkills.skillLevel(d, op.id, skill.id);
      const check = BH.OperatorSkills.canUpgrade(d, op.id, skill.id);
      const maxed = lvl >= skill.max;
      const barPct = Math.round((lvl / skill.max) * 100);
      skillsHtml +=
        `<div class="op-skill-row${maxed ? " maxed" : ""}">` +
        `<div class="op-skill-top">` +
        `<span class="op-skill-icon">${skill.icon}</span>` +
        `<span class="op-skill-name">${skill.name}</span>` +
        `<span class="op-skill-lvl">${lvl}/${skill.max}</span>` +
        `</div>` +
        `<div class="op-skill-bar"><div class="op-skill-fill" style="width:${barPct}%"></div></div>` +
        `<div class="op-skill-desc">${skill.desc}${lvl ? " · " + skill.fmt(lvl) : ""}</div>` +
        (maxed
          ? `<div class="op-skill-btn max">MAX</div>`
          : `<button type="button" class="op-skill-btn btn-upgrade-skill"` +
            ` data-skill="${skill.id}"${check.ok ? "" : " disabled"}>` +
            (check.reason === "diamonds" ? `💎 ${check.need} (${prog.diamonds})` : `💎 ${check.cost || 1}`) +
            `</button>`) +
        `</div>`;
    }

    body.innerHTML =
      `<div class="op-skills-head">` +
      `<div class="op-skills-title">💎 DIAMANTEN</div>` +
      `<div class="op-skills-diamonds">💎 ${prog.diamonds}</div>` +
      `</div>` +
      `<div class="op-skills-progress">` +
      `<div class="op-skills-prog-label">Nächster Diamant · ${prog.matchProg}/${prog.perDiamond} Matches</div>` +
      `<div class="op-skill-bar op-diamond-bar"><div class="op-skill-fill diamond" style="width:${pct}%"></div></div>` +
      `</div>` +
      (bonusLines.length
        ? `<div class="op-skills-active">Aktiv: ${bonusLines.join(" · ")}</div>`
        : `<div class="op-skills-active dim">Noch keine Skills — spiele Matches mit ${op.name} für Diamanten</div>`) +
      `<div class="op-skills-list">${skillsHtml}</div>`;

    body.querySelectorAll("[data-skill]").forEach(btn => {
      btn.addEventListener("click", () => {
        const res = BH.OperatorSkills.upgrade(d, op.id, btn.dataset.skill);
        if (!res.ok) { BH.audio.empty(); return; }
        BH.audio.buy();
        BH.Progress.save();
        if (BH.UI) BH.UI.toast(res.skill.name + " Stufe " + res.level + " ✔", "success");
        this.renderOpSkillsModal(op);
        this.renderOperator();
      });
    });
  }

  renderOperator() {
    const d = BH.Progress.data;
    let ops = BH.OperatorCatalog ? BH.OperatorCatalog.all(d) : BH.OPERATORS;
    if (BH.OperatorRarity) ops = BH.OperatorRarity.sortOps(ops);
    const s2 = BH.OperatorCatalog && BH.OperatorCatalog.useS2(d);
    const screen = document.getElementById("screen-operator");
    if (screen) screen.classList.toggle("season-2", s2);
    const seasonTag = document.getElementById("op-season-tag");
    if (seasonTag) {
      const t = BH.I18n ? k => BH.I18n.t(k) : k => k;
      seasonTag.textContent = s2
        ? t("season_2")
        : (BH.SeasonRelease && BH.SeasonRelease.isEarlyAccess()
          ? BH.SeasonRelease.earlyAccessBannerWithS2()
          : t("season_1"));
      seasonTag.className = "op-season-tag" + (s2 ? " s2" : "");
    }

    const rarityBar = document.getElementById("op-rarity-bar");
    if (rarityBar && BH.OperatorRarity) {
      const tiers = BH.OperatorRarity.TIERS;
      const counts = { all: ops.length };
      for (const op of ops) {
        const id = BH.OperatorRarity.resolve(op).id;
        counts[id] = (counts[id] || 0) + 1;
      }
      const filters = [
        { id: "all", label: "ALLE", css: "" },
        ...Object.values(tiers).sort((a, b) => b.order - a.order).map(t => ({
          id: t.id, label: t.label.toUpperCase(), css: t.css,
        })),
      ];
      rarityBar.innerHTML = filters.map(f => {
        const n = counts[f.id] || 0;
        if (f.id !== "all" && !n) return "";
        return (
          `<button type="button" class="op-rarity-filter${f.css ? " " + f.css : ""}` +
          `${this._opRarityFilter === f.id ? " active" : ""}" data-op-rarity="${f.id}">` +
          `${f.label}${f.id !== "all" ? ` · ${n}` : ""}` +
          `</button>`
        );
      }).join("");
      rarityBar.querySelectorAll("[data-op-rarity]").forEach(btn => {
        btn.addEventListener("click", () => {
          BH.audio.click();
          this._opRarityFilter = btn.dataset.opRarity;
          this.renderOperator();
        });
      });
    }

    const filterId = this._opRarityFilter || "all";
    const visibleOps = filterId === "all" || !BH.OperatorRarity
      ? ops
      : ops.filter(op => BH.OperatorRarity.resolve(op).id === filterId);

    const equippedOp = BH.OperatorCatalog
      ? BH.OperatorCatalog.find(d.operator, d)
      : BH.OPERATORS.find(o => o.id === d.operator) || BH.OPERATORS[0];
    if (!this._opPreviewId || !ops.find(o => o.id === this._opPreviewId)) {
      this._opPreviewId = d.operator;
    }
    const preview = ops.find(o => o.id === this._opPreviewId) || equippedOp;
    const info = this.opLockInfo(preview);
    const previewRarity = BH.OperatorRarity ? BH.OperatorRarity.resolve(preview) : null;
    const previewGolden = BH.PrestigeMaster && BH.PrestigeMaster.hasGoldenFrame(d)
      && preview.id === d.operator;

    let statusHtml;
    if (preview.id === d.operator) {
      statusHtml = `<div class="op-status equipped">✔ AUSGERÜSTET</div>`;
    } else if (info.state === "locked") {
      statusHtml = `<div class="op-status locked">🔒 ${info.label}</div>`;
    } else if (info.state === "buy") {
      statusHtml = `<div class="op-status buy">SHOP · ${info.label}</div>`;
    } else if (info.source === "battlepass") {
      statusHtml = `<div class="op-status locked">🔒 ${info.label}</div>`;
    } else if (info.source === "crate") {
      statusHtml = `<div class="op-status locked">🔒 ${info.label}</div>`;
    } else {
      statusHtml = `<div class="op-status hint">KLICKEN ZUM AUSRÜSTEN</div>`;
    }

    const previewOwned = info.state === "owned" || (d.owned.operators || []).includes(preview.id);
    let skillsBtnHtml = "";
    if (previewOwned && BH.OperatorSkills) {
      const pProg = BH.OperatorSkills.progress(d, preview.id);
      skillsBtnHtml =
        `<button type="button" class="btn btn-op-skills" id="btn-op-skills-open">` +
        `💎 SKILLS · ${pProg.diamonds}` +
        (pProg.matchProg ? ` · ${pProg.matchProg}/10` : "") +
        `</button>`;
    }

    document.getElementById("op-preview").innerHTML =
      this.opFigure(preview, false, previewGolden) +
      (previewRarity ? this.opRarityBadge(preview) : "") +
      `<div class="op-name">${preview.name}</div>` +
      `<div class="op-faction">${preview.faction}</div>` +
      `<div class="op-desc">${preview.desc}</div>` +
      statusHtml +
      skillsBtnHtml;

    const btnOpSkillsOpen = document.getElementById("btn-op-skills-open");
    if (btnOpSkillsOpen) {
      btnOpSkillsOpen.addEventListener("click", (e) => {
        e.stopPropagation();
        this.openOpSkills(preview.id);
      });
    }

    if (this._opSkillsId && (d.owned.operators || []).includes(this._opSkillsId)) {
      const skillsOp = ops.find(o => o.id === this._opSkillsId);
      if (skillsOp) this.renderOpSkillsModal(skillsOp);
    }

    const grid = document.getElementById("op-grid");
    grid.innerHTML = "";
    for (const op of visibleOps) {
      const li = this.opLockInfo(op);
      const rarity = BH.OperatorRarity ? BH.OperatorRarity.resolve(op) : null;
      const equipped = d.operator === op.id;
      const selected = this._opPreviewId === op.id;
      const cardGolden = BH.PrestigeMaster && BH.PrestigeMaster.hasGoldenFrame(d) && equipped;
      const el = document.createElement("div");
      el.className = "op-card" +
        (equipped ? " equipped" : "") +
        (selected && !equipped ? " selected" : "") +
        (li.state === "locked" ? " locked" : "") +
        (cardGolden ? " prestige-gold" : "") +
        (rarity ? " " + rarity.css : "");

      let stateHtml;
      const src = this.opSourceLabel(li);
      if (equipped) stateHtml = `<div class="opc-state equipped">AUSGERÜSTET</div>`;
      else stateHtml = `<div class="opc-state ${src.cls}">${src.text}</div>`;

      let skillsCardHtml = "";
      if (BH.OperatorSkills && li.state === "owned") {
        const prog = BH.OperatorSkills.progress(d, op.id);
        skillsCardHtml =
          `<button type="button" class="opc-skills-btn" data-op-skills="${op.id}">` +
          `💎 SKILLS${prog.diamonds ? " · " + prog.diamonds : ""}` +
          `</button>`;
      }

      el.innerHTML =
        (rarity ? this.opRarityBadge(op, true) : "") +
        this.opFigure(op, true, cardGolden) +
        `<div class="opc-name">${op.name}</div>` +
        `<div class="opc-faction">${op.faction}</div>` +
        stateHtml +
        skillsCardHtml;

      const skillsBtn = el.querySelector("[data-op-skills]");
      if (skillsBtn) {
        skillsBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this._opPreviewId = op.id;
          this.openOpSkills(op.id);
        });
      }

      el.addEventListener("click", () => {
        this._opPreviewId = op.id;
        const cur = this.opLockInfo(op);
        if (cur.state === "locked") {
          BH.audio.empty();
          this.renderOperator();
          return;
        }
        if (cur.state === "buy") {
          const cost = BH.ShopEconomy ? BH.ShopEconomy.operatorPrice(op, d) : op.price;
          if (d.credits < cost) {
            BH.audio.empty();
            this.renderOperator();
            return;
          }
          d.credits -= cost;
          if (!d.owned.operators.includes(op.id)) d.owned.operators.push(op.id);
          BH.audio.buy();
        } else {
          BH.audio.click();
        }
        if (d.owned.operators.includes(op.id)) d.operator = op.id;
        BH.Progress.save();
        this.renderOperator();
        this.renderTopbar();
        const home = document.getElementById("screen-home");
        if (home && !home.classList.contains("hidden")) this.renderHome();
      });
      grid.appendChild(el);
    }
  }

  /* =============== LOADOUT =============== */
  _setLoadoutSlot(slot) {
    this._loadoutSlot = slot === "secondary" ? "secondary" : "primary";
    if (this._loadoutSlot === "secondary" && this._weaponFilter === "prototypes") {
      this._weaponFilter = "standard";
    }
    this.renderLoadout();
  }

  _loadoutActiveWeaponId() {
    return this._loadoutSlot === "secondary"
      ? (this.loadout.secondaryWeaponId || "pistol")
      : this.loadout.weaponId;
  }

  _loadoutActiveAttachments() {
    if (this._loadoutSlot === "secondary") {
      if (!this.loadout.secondaryAttachments) {
        this.loadout.secondaryAttachments = { optic: "none", barrel: "none", grip: "none", mag: "none" };
      }
      return this.loadout.secondaryAttachments;
    }
    return this.loadout.attachments;
  }

  renderLoadout() {
    if (BH.LoadoutPresets) BH.LoadoutPresets.normalizeLoadout(this.loadout);
    const d = BH.Progress.data;
    const lvl = BH.Progress.getLevel().level;
    const bpTier = BH.Progress.getBpTier();
    const slot = this._loadoutSlot === "secondary" ? "secondary" : "primary";
    const wPri = BH.buildWeapon(this.loadout.weaponId, this.loadout.attachments, this.loadout.camo);
    const wSec = BH.buildWeapon(
      this.loadout.secondaryWeaponId || "pistol",
      this.loadout.secondaryAttachments || {},
      this.loadout.camo
    );
    const w = slot === "secondary" ? wSec : wPri;
    const wDef = w.def;
    const priDef = wPri.def;
    const secDef = wSec.def;
    const camo = BH.CAMOS.find(c => c.id === this.loadout.camo) || BH.CAMOS[0];
    const charm = (BH.SHOP.charms || []).find(c => c.id === d.charm);
    const masPri = BH.Mastery ? BH.Mastery.get(d, priDef.id) : { level: 1 };
    const masProg = BH.Mastery ? BH.Mastery.progress(d, priDef.id) : null;

    const sumPrimaryWrap = document.getElementById("lo-sum-primary-wrap");
    const sumSecondary = document.getElementById("lo-sum-secondary");
    if (sumPrimaryWrap) sumPrimaryWrap.classList.toggle("active-slot", slot === "primary");
    if (sumSecondary) sumSecondary.classList.toggle("active-slot", slot === "secondary");

    const sumPrimary = document.getElementById("lo-sum-primary");
    const sumMeta = document.getElementById("lo-sum-meta");
    const sumCamo = document.getElementById("lo-sum-camo");
    const sumSecName = document.getElementById("lo-sum-sec-name");
    const sumSecType = document.getElementById("lo-sum-sec-type");
    if (sumPrimary) {
      sumPrimary.textContent = priDef.name;
      sumPrimary.classList.toggle("fantasy", !!priDef.fantasy);
    }
    if (sumMeta) {
      sumMeta.innerHTML =
        `<span class="lo-sum-type">${priDef.type}</span>` +
        `<span class="lo-sum-mastery">${masProg ? masProg.title + " · M" + masProg.level : "Meisterschaft M" + masPri.level}</span>` +
        (masProg && !masProg.maxed
          ? `<span class="mastery-bar lo-sum-mastery-bar"><span style="width:${masProg.pct}%"></span></span>` +
            `<span class="lo-sum-mastery-xp">${masProg.xp}/${masProg.need} XP` +
            (masProg.nextUnlock ? ` · Nächster Aufsatz M${masProg.nextUnlock.requireMastery}: ${masProg.nextUnlock.name}` : "") +
            `</span>`
          : masProg && masProg.maxed
            ? `<span class="lo-sum-mastery-xp maxed">MAX · Alle Aufsätze freigeschaltet</span>`
            : "") +
        `<span class="lo-sum-mag">${priDef.mag} Schuss · ${Math.round(priDef.rpm)} RPM · ${priDef.reloadTime.toFixed(1)} s Reload</span>`;
    }
    if (sumSecName) sumSecName.textContent = secDef.name;
    if (sumSecType) sumSecType.textContent = secDef.type.split("·").pop().trim();
    if (sumCamo) {
      const cs = BH.CamoStyle || null;
      sumCamo.innerHTML =
        `<span class="lo-camo-swatch${cs ? cs.swatchClass(camo) : ""}" style="${cs ? cs.swatchStyle(camo) : `background:#${camo.color.toString(16).padStart(6, "0")}`}"></span>` +
        `<span>${camo.name}</span>` +
        (charm && d.charm !== "none" ? `<span class="lo-sum-charm">${charm.icon} ${charm.name}</span>` : "");
    }

    const presetWrap = document.getElementById("loadout-presets");
    if (presetWrap && BH.LoadoutPresets) {
      presetWrap.innerHTML = "";
      for (let i = 0; i < BH.LoadoutPresets.slots; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "preset-btn" + (d.activePreset === i ? " active" : "");
        btn.textContent = "PRESET " + (i + 1);
        btn.title = "Klicken zum Wechseln · Erneut klicken zum Speichern";
        btn.addEventListener("click", () => {
          BH.audio.click();
          if (d.activePreset === i) BH.LoadoutPresets.saveCurrent(i);
          else { this.loadout = BH.LoadoutPresets.activate(i); this.renderLoadout(); }
        });
        presetWrap.appendChild(btn);
      }
    }

    const list = document.getElementById("weapon-list");
    const filterWrap = document.getElementById("weapon-filter");
    if (filterWrap) filterWrap.classList.toggle("hidden", slot === "secondary");
    if (list) {
      list.innerHTML = "";
      const ids = slot === "secondary"
        ? BH.SECONDARY_IDS
        : (this._weaponFilter === "prototypes"
          ? (BH.PROTOTYPE_IDS || BH.FANTASY_IDS.concat(BH.ALPHA_LEGENDARY_IDS || []))
          : BH.PRIMARY_IDS);
      const activeId = this._loadoutActiveWeaponId();
      const addWeapon = (id) => {
        const def = BH.WEAPONS[id];
        if (!def) return;
        let lock = { state: "owned" };
        if (slot === "secondary") lock = BH.SecondaryUnlock.lockInfo(id, d);
        else if ((def.fantasy || def.alphaEpic) && BH.FantasyUnlock) lock = BH.FantasyUnlock.lockInfo(id, d);
        const locked = lock.state === "locked";
        const el = document.createElement("button");
        el.type = "button";
        el.className = "weapon-entry" +
          (activeId === id ? " selected" : "") +
          (def.fantasy ? " fantasy" : "") +
          (def.alphaEpic ? " alpha-epic" : "") +
          (def.alphaLegendary || def.crateLegendary ? " alpha-legendary" : "") +
          (def.betaLegendary ? " beta-legendary" : "") +
          (def.horizonLegendary ? " horizon-legendary" : "") +
          (locked ? " locked" : "");
        const mp = BH.Mastery ? BH.Mastery.progress(BH.Progress.data, id) : null;
        el.innerHTML =
          (def.isNew ? `<span class="we-new-badge">NEU</span>` : "") +
          `<span class="we-name">${def.name}</span>` +
          `<span class="we-meta">` +
          (mp
            ? `<span class="w-mastery">${mp.title} · M${mp.level}</span>` +
              `<span class="mastery-bar"><span style="width:${mp.pct}%"></span></span>` +
              `<span class="w-mastery-xp">${mp.maxed ? "MAX" : mp.xp + "/" + mp.need}</span>`
            : `<span class="w-mastery">M1</span>`) +
          (locked ? `<span class="w-type">${lock.label}</span>` : "") +
          `</span>`;
        if (!locked) {
          el.addEventListener("click", () => {
            BH.audio.click();
            if (slot === "secondary") this.loadout.secondaryWeaponId = id;
            else this.loadout.weaponId = id;
            this.saveLoadout();
            this.renderLoadout();
          });
        }
        list.appendChild(el);
      };
      const groups = BH.WeaponCategories
        ? BH.WeaponCategories.groupIds(ids)
        : [{ key: "all", label: "", ids }];
      for (const grp of groups) {
        const head = document.createElement("div");
        head.className = "weapon-cat-head";
        head.dataset.cat = grp.key;
        head.textContent = grp.label;
        list.appendChild(head);
        for (const id of grp.ids) addWeapon(id);
      }
    }

    const attHint = document.getElementById("loadout-att-hint");
    const attWeaponId = this._loadoutActiveWeaponId();
    const attMas = BH.Mastery ? BH.Mastery.progress(d, attWeaponId) : null;
    if (attHint) {
      const slotLabel = slot === "secondary" ? "Sekundärwaffe" : "Primärwaffe";
      if (attMas && attMas.nextUnlock) {
        attHint.textContent =
          `Aufsätze für ${slotLabel} · Meisterschaft M${attMas.level} · Nächster Aufsatz bei M${attMas.nextUnlock.requireMastery}: ${attMas.nextUnlock.name}`;
      } else if (attMas && attMas.maxed) {
        attHint.textContent = `Aufsätze für ${slotLabel} · Meisterschaft MAX — alle Aufsätze freigeschaltet`;
      } else {
        attHint.textContent = `Aufsätze für ${slotLabel} · Meisterschaft M${attMas ? attMas.level : 1}`;
      }
    }

    const attArea = document.getElementById("attachment-area");
    if (attArea) {
      attArea.innerHTML = "";
      const activeAtt = this._loadoutActiveAttachments();
      const labels = { optic: "VISIER", barrel: "LAUF", grip: "GRIFF", mag: "MAGAZIN" };
      for (const attSlot of ["optic", "barrel", "grip", "mag"]) {
        const cur = (BH.ATTACHMENTS[attSlot] || []).find(a => a.id === (activeAtt[attSlot] || "none"));
        const grp = document.createElement("div");
        grp.className = "att-group";
        grp.innerHTML =
          `<div class="att-head"><span class="att-label">${labels[attSlot]}</span>` +
          `<span class="att-current">${cur ? cur.name : "—"}</span></div>`;
        const opts = document.createElement("div");
        opts.className = "att-options";
        for (const opt of BH.ATTACHMENTS[attSlot]) {
          const req = BH.Mastery ? BH.Mastery.requiredLevel(opt.id) : 1;
          const unlocked = !BH.Mastery || BH.Mastery.isAttachmentUnlocked(d, attWeaponId, opt.id);
          const o = document.createElement("button");
          o.type = "button";
          o.className = "att-opt" +
            (activeAtt[attSlot] === opt.id ? " selected" : "") +
            (!unlocked ? " locked" : "");
          o.innerHTML = unlocked
            ? opt.name
            : `<span class="att-opt-name">${opt.name}</span><span class="att-opt-req">M${req}</span>`;
          o.title = unlocked
            ? opt.name
            : `Meisterschaft M${req} erforderlich (${opt.name})`;
          if (unlocked) {
            o.addEventListener("click", () => {
              BH.audio.click();
              activeAtt[attSlot] = opt.id;
              this.saveLoadout();
              this.renderLoadout();
            });
          }
          opts.appendChild(o);
        }
        grp.appendChild(opts);
        attArea.appendChild(grp);
      }
    }

    const camoUnlocked = document.getElementById("camo-area-unlocked");
    const camoLocked = document.getElementById("camo-area-locked");
    const camoToggle = document.getElementById("camo-toggle-locked");
    const ownedCamos = d.owned.camos;
    const prestige = d.prestige;
    const isCamoLocked = (c) =>
      (c.eventOnly && !ownedCamos.includes(c.id)) ||
      (c.requireLevel && lvl < c.requireLevel) ||
      (c.requireBpTier && bpTier < c.requireBpTier) ||
      (c.requirePrestige && prestige < c.requirePrestige) ||
      (c.shop && !ownedCamos.includes(c.id));

    const renderCamoSwatch = (camo, locked, parent) => {
      const cs = BH.CamoStyle || null;
      const sw = document.createElement("button");
      sw.type = "button";
      sw.className = "camo-card" +
        (this.loadout.camo === camo.id ? " selected" : "") +
        (locked ? " locked" : "") +
        (cs ? cs.cardClass(camo) : "");
      sw.innerHTML =
        `<span class="camo-swatch${cs ? cs.swatchClass(camo) : ""}" style="${cs ? cs.swatchStyle(camo) : `background:#${camo.color.toString(16).padStart(6, "0")}`}"></span>` +
        `<span class="camo-name">${camo.name}</span>`;
      sw.title = camo.name + (locked
        ? (camo.shop ? ` · Shop ${camo.price} ⛁`
          : camo.requireLevel ? ` · ab Level ${camo.requireLevel}`
          : camo.requirePrestige ? ` · ab Prestige ${camo.requirePrestige}`
          : camo.requireBpTier ? ` · BP Stufe ${camo.requireBpTier}`
          : camo.eventOnly ? " · Event"
          : " · Gesperrt")
        : "");
      if (!locked) {
        sw.addEventListener("click", () => {
          BH.audio.click();
          this.loadout.camo = camo.id;
          this.saveLoadout();
          this.renderLoadout();
        });
      }
      parent.appendChild(sw);
    };

    if (camoUnlocked) {
      camoUnlocked.innerHTML = "";
      let lockedCount = 0;
      for (const c of BH.CAMOS) {
        if (isCamoLocked(c)) lockedCount++;
        else renderCamoSwatch(c, false, camoUnlocked);
      }
      if (camoLocked) {
        camoLocked.innerHTML = "";
        camoLocked.classList.toggle("hidden", !this._showLockedCamos);
        if (this._showLockedCamos) {
          for (const c of BH.CAMOS) {
            if (isCamoLocked(c)) renderCamoSwatch(c, true, camoLocked);
          }
        }
      }
      if (camoToggle) {
        camoToggle.classList.toggle("hidden", lockedCount === 0);
        camoToggle.textContent = this._showLockedCamos
          ? "Gesperrte ausblenden"
          : `Gesperrte anzeigen (${lockedCount})`;
      }
    }

    const eqArea = document.getElementById("equipment-area");
    if (eqArea && BH.Equipment) {
      eqArea.innerHTML = "";
      const curEq = this.loadout.equipmentId || "frag";
      for (const eq of BH.Equipment.list()) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "equipment-card" + (curEq === eq.id ? " selected" : "");
        card.innerHTML =
          `<span class="eq-icon">${eq.icon}</span>` +
          `<span class="eq-name">${eq.name}</span>` +
          `<span class="eq-desc">${eq.desc}</span>` +
          `<span class="eq-meta">CD ${eq.cooldown}s · ${eq.stock}× pro Leben · [G]</span>`;
        card.addEventListener("click", () => {
          BH.audio.click();
          this.loadout.equipmentId = eq.id;
          this.saveLoadout();
          this.renderLoadout();
        });
        eqArea.appendChild(card);
      }
    }

    const charmArea = document.getElementById("charm-area");
    if (charmArea) {
      charmArea.innerHTML = "";
      const addCharm = (id, icon, name, owned) => {
        const sw = document.createElement("button");
        sw.type = "button";
        sw.className = "charm-card" + (d.charm === id ? " selected" : "") + (!owned ? " locked" : "");
        sw.innerHTML = `<span class="charm-icon">${icon}</span><span class="charm-name">${name}</span>`;
        if (owned) {
          sw.addEventListener("click", () => {
            d.charm = id;
            BH.Progress.save();
            this.renderLoadout();
            BH.audio.click();
          });
        }
        charmArea.appendChild(sw);
      };
      addCharm("none", "—", "Keiner", true);
      for (const ch of BH.SHOP.charms || []) {
        addCharm(ch.id, ch.icon, ch.name, (d.owned.charms || []).includes(ch.id));
      }
      for (const ch of (BH.Crates ? BH.Crates.exclusiveItems("charms") : []) || []) {
        addCharm(ch.id, ch.icon, ch.name, (d.owned.charms || []).includes(ch.id));
      }
    }

    const statsEl = document.getElementById("weapon-stats");
    if (statsEl) {
      const bar = (label, val) =>
        `<div class="stat-row"><span class="sr-label">${label}</span><span class="sr-bar"><div style="width:${Math.min(100, Math.round(val * 100))}%"></div></span></div>`;
      statsEl.innerHTML =
        bar("SCHADEN", (wDef.damage * (wDef.pellets || 1)) / 120) +
        bar("FEUERRATE", wDef.rpm / 950) +
        bar("REICHWEITE", wDef.range / 200) +
        bar("MOBILITÄT", wDef.moveSpeed / 1.15);
    }

    document.querySelectorAll(".loadout-tab[data-lo-tab]").forEach(b =>
      b.classList.toggle("active", b.dataset.loTab === this._loadoutTab));
    document.querySelectorAll(".loadout-panel[data-lo-panel]").forEach(p =>
      p.classList.toggle("active", p.dataset.loPanel === this._loadoutTab));
    document.querySelectorAll(".lo-filter[data-wfilter]").forEach(b =>
      b.classList.toggle("active", b.dataset.wfilter === this._weaponFilter));
    document.querySelectorAll(".lo-slot[data-lo-slot]").forEach(b =>
      b.classList.toggle("active", b.dataset.loSlot === slot));
  }

  saveLoadout() {
    if (BH.LoadoutPresets) BH.LoadoutPresets.normalizeLoadout(this.loadout);
    BH.Progress.data.loadout = this.loadout;
    if (BH.LoadoutPresets) BH.LoadoutPresets.saveCurrent(BH.Progress.data.activePreset || 0);
    else BH.Progress.save();
  }

  openWeaponInspect() {
    BH.audio.click();
    const slot = this._loadoutSlot === "secondary" ? "secondary" : "primary";
    const w = slot === "secondary"
      ? BH.buildWeapon(this.loadout.secondaryWeaponId || "pistol", this.loadout.secondaryAttachments || {}, this.loadout.camo)
      : BH.buildWeapon(this.loadout.weaponId, this.loadout.attachments, this.loadout.camo);
    const camo = BH.CAMOS.find(c => c.id === this.loadout.camo) || BH.CAMOS[0];
    const charm = (BH.SHOP.charms || []).find(c => c.id === BH.Progress.data.charm);
    const cs = BH.CamoStyle || null;
    document.getElementById("inspect-name").textContent = w.def.name;
    document.getElementById("inspect-weapon").innerHTML =
      `<div class="inspect-gun${cs && cs.isNeon(camo) ? " inspect-gun-neon" : ""}" style="${cs ? cs.swatchStyle(camo) : `background:#${camo.color.toString(16).padStart(6, "0")}`}">` +
      (charm ? `<span class="inspect-charm">${charm.icon}</span>` : "") +
      `</div><div class="inspect-type">${w.def.type}</div>`;
    document.getElementById("inspect-overlay").classList.remove("hidden");
  }

  /* =============== EINSTELLUNGEN =============== */
  applySettingsTab() {
    const tab = this._settingsTab || "gameplay";
    document.querySelectorAll(".settings-panel[data-settings-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.settingsPanel === tab);
    });
    document.querySelectorAll(".settings-tab[data-settings-tab]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.settingsTab === tab);
    });
  }

  renderQualityCards(currentQuality) {
    const grid = document.getElementById("gfx-quality-grid");
    const detail = document.getElementById("gfx-quality-detail");
    if (!grid || !BH.Graphics) return;
    const t = BH.I18n ? k => BH.I18n.t(k) : k => k;

    const order = BH.Graphics.qualityOrder || Object.keys(BH.Graphics.presets);
    grid.innerHTML = order.map(id => {
      const p = BH.Graphics.presets[id];
      if (!p) return "";
      const active = id === currentQuality;
      const shadowLabel = p.shadows ? t("gfx_shadows_on") : t("gfx_shadows_off");
      return (
        `<button type="button" class="gfx-quality-card${active ? " active" : ""}${p.warn ? " gfx-warn" : ""}" data-quality="${id}">` +
        `<span class="gqc-tag">${p.tag || id.toUpperCase()}</span>` +
        `<span class="gqc-name">${p.label}</span>` +
        `<span class="gqc-desc">${p.desc || ""}</span>` +
        `<span class="gqc-spec">${shadowLabel} · ${p.pixelRatio}x</span>` +
        `</button>`
      );
    }).join("");

    if (!grid._bound) {
      grid._bound = true;
      grid.addEventListener("click", e => {
        const btn = e.target.closest("[data-quality]");
        if (!btn) return;
        const q = btn.dataset.quality;
        if (q === (BH.Settings.get().quality || "medium")) return;
        const confirmMsg = BH.I18n ? BH.I18n.t("gfx_ultra_confirm")
          : "Super Ultra kann auf schwächerer Hardware die FPS stark senken.\n\nTrotzdem aktivieren?";
        if (q === "superUltra" && !confirm(confirmMsg)) {
          return;
        }
        BH.audio.click();
        BH.Settings.setQuality(q);
        this.renderSettings();
      });
    }

    const cur = BH.Graphics.presets[currentQuality] || BH.Graphics.presets.medium;
    if (detail) {
      const fogLabel = cur.fogMult <= 0.85 ? t("gfx_fog_far") : cur.fogMult >= 1.2 ? t("gfx_fog_short") : t("gfx_fog_normal");
      detail.innerHTML =
        `<div class="gqd-title">${t("gfx_active")}: ${cur.label}</div>` +
        `<div class="gqd-rows">` +
        `<div class="gqd-row"><span>${t("gfx_resolution")}</span><span>${cur.pixelRatio}x</span></div>` +
        `<div class="gqd-row"><span>${t("gfx_shadows")}</span><span>${cur.shadows ? (cur.shadowMapSize || 1024) + " px" : t("gfx_shadows_off")}</span></div>` +
        `<div class="gqd-row"><span>${t("gfx_exposure")}</span><span>${cur.exposure || 1}</span></div>` +
        `<div class="gqd-row"><span>${t("gfx_bots")}</span><span>${Math.round((cur.botMult || 1) * 100)} %</span></div>` +
        `<div class="gqd-row"><span>${t("gfx_fog")}</span><span>${fogLabel}</span></div>` +
        `</div>` +
        (cur.warn ? `<p class="gqd-warn">${t("gfx_warn")}</p>` : "");
    }
  }

  renderSettings() {
    const s = BH.Settings.get();
    this.applySettingsTab();
    this.renderLanguageGrid();

    const bind = (id, valId, key, fmt) => {
      const el = document.getElementById(id);
      const valEl = document.getElementById(valId);
      if (!el || !valEl) return;
      el.value = s[key];
      valEl.textContent = fmt ? fmt(s[key]) : s[key];
      el.oninput = () => {
        BH.Settings.set(key, parseFloat(el.value));
        valEl.textContent = fmt ? fmt(parseFloat(el.value)) : el.value;
      };
    };
    bind("set-sens", "set-sens-val", "sensitivity");
    bind("set-vol", "set-vol-val", "volume", v => Math.round(v * 100) + "%");
    bind("set-fov", "set-fov-val", "fov", v => Math.round(v));
    bind("set-ch", "set-ch-val", "crosshairScale");

    this.renderQualityCards(s.quality || "medium");

    const voiceEl = document.getElementById("set-voice");
    if (voiceEl) {
      voiceEl.checked = BH.Progress.data.operatorVoice !== false;
      voiceEl.onchange = () => {
        BH.Progress.data.operatorVoice = voiceEl.checked;
        BH.Progress.save();
        BH.audio.click();
      };
    }

    const settingsVer = document.getElementById("settings-version");
    if (settingsVer) {
      const studio = (BH.STUDIO && BH.STUDIO.name) || "NACHTBLAU Interaktive";
      const ver = BH.gameVersionLabel ? BH.gameVersionLabel(BH.Progress.data) : "v0.0.1";
      settingsVer.textContent = ver + " · " + studio;
    }

    const resetBtn = document.getElementById("btn-save-reset");
    const resetMsg = document.getElementById("save-reset-msg");
    if (resetBtn) {
      resetBtn.onclick = () => {
        const confirmMsg = BH.I18n
          ? BH.I18n.t("save_reset_confirm")
          : "Spielstand wirklich zurücksetzen?\n\nAlle Fortschritte, Käufe, Kisten, Clan und Stats werden gelöscht. Einstellungen bleiben. Nicht rückgängig machbar.";
        if (!confirm(confirmMsg)) {
          return;
        }
        BH.audio.click();
        BH.Progress.reset({ keepSettings: true, leaderboard: true });
        if (resetMsg) {
          resetMsg.textContent = BH.I18n ? BH.I18n.t("save_reset_ok") : "Spielstand zurückgesetzt ✔ — Seite wird neu geladen…";
          resetMsg.className = "save-msg ok";
        }
        if (BH.LoadoutPresets) {
          this.loadout = BH.LoadoutPresets.getActive(BH.Progress.data);
        }
        setTimeout(() => location.reload(), 600);
      };
    }
  }

  /* =============== PROFIL =============== */
  applyProfileTab() {
    const tab = this._profileTab || "identity";
    document.querySelectorAll(".profile-panel[data-profile-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.profilePanel === tab);
    });
    document.querySelectorAll(".profile-tab[data-profile-tab]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.profileTab === tab);
    });
  }

  updateProfilePreview(d) {
    const el = document.getElementById("profile-preview");
    if (!el) return;
    const emblem = (BH.Cosmetics.ownedEmblems(d).find(e => e.id === d.emblem) ||
      BH.EMBLEMS.find(e => e.id === d.emblem) || { icon: "🎖", name: "Rekrut" });
    const title = (BH.Cosmetics.ownedTitles(d).find(t => t.id === d.title) ||
      BH.TITLES.find(t => t.id === d.title) || { name: "" });
    const sprayId = d.spray || "none";
    const spray = sprayId === "none"
      ? null
      : (BH.SHOP.sprays || []).find(s => s.id === sprayId);
    const card = BH.CallingCards
      ? BH.CallingCards.get(d.callingCard || "default")
      : { icon: "⬛", name: "Standard", style: "cc-default" };
    const op = BH.OperatorCatalog
      ? BH.OperatorCatalog.find(d.operator, d)
      : (BH.OPERATORS || []).find(o => o.id === d.operator) ||
      (BH.OPERATORS || []).find(o => o.id === "recruit") || { name: "REKRUT" };
    const displayName = (d.playerName && d.playerName.trim()) ? d.playerName.trim() : op.name;

    el.innerHTML =
      `<div class="profile-preview-card ${card.style || "cc-default"}">` +
        `<div class="pp-card-icon">${card.icon || "⬛"}</div>` +
        `<div class="pp-emblem">${emblem.icon || "🎖"}</div>` +
        `<div class="pp-name">${displayName}</div>` +
        `<div class="pp-title">${title.id === "none" || !title.name ? "—" : title.name}</div>` +
        `<div class="pp-spray">${spray ? spray.icon + " " + spray.name : "Kein Spray"}</div>` +
      `</div>`;
  }

  renderProfile() {
    const d = BH.Progress.data;
    BH.Challenges.ensure(d);
    this.updateProfilePreview(d);

    const emWrap = document.getElementById("profile-emblems");
    if (emWrap) {
      emWrap.innerHTML = "";
      for (const e of BH.Cosmetics.ownedEmblems(d)) {
        const el = document.createElement("div");
        el.className = "prof-item" + (d.emblem === e.id ? " equipped" : "");
        el.innerHTML = `<span class="pi-icon">${e.icon}</span><span class="pi-name">${e.name}</span>`;
        el.onclick = () => { d.emblem = e.id; BH.Progress.save(); this.renderProfile(); this.renderHome(); BH.audio.click(); };
        emWrap.appendChild(el);
      }
    }

    const tiWrap = document.getElementById("profile-titles");
    if (tiWrap) {
      tiWrap.innerHTML = "";
      for (const t of BH.Cosmetics.ownedTitles(d)) {
        const el = document.createElement("div");
        el.className = "prof-item" + (d.title === t.id ? " equipped" : "");
        el.innerHTML = `<span class="pi-name">${t.name}</span>`;
        el.onclick = () => { d.title = t.id; BH.Progress.save(); this.renderProfile(); this.renderHome(); BH.audio.click(); };
        tiWrap.appendChild(el);
      }
    }

    const spWrap = document.getElementById("profile-sprays");
    if (spWrap) {
      spWrap.innerHTML = "";
      const none = document.createElement("div");
      none.className = "prof-item" + (d.spray === "none" ? " equipped" : "");
      none.innerHTML = `<span class="pi-name">Kein Spray</span>`;
      none.onclick = () => { d.spray = "none"; BH.Progress.save(); this.renderProfile(); BH.audio.click(); };
      spWrap.appendChild(none);
      for (const s of BH.SHOP.sprays || []) {
        if (!d.owned.sprays.includes(s.id)) continue;
        const el = document.createElement("div");
        el.className = "prof-item" + (d.spray === s.id ? " equipped" : "");
        el.innerHTML = `<span class="pi-icon">${s.icon}</span><span class="pi-name">${s.name}</span>`;
        el.onclick = () => { d.spray = s.id; BH.Progress.save(); this.renderProfile(); BH.audio.click(); };
        spWrap.appendChild(el);
      }
    }

    const renderCh = (wrapId, ids, progKey, doneKey) => {
      const wrap = document.getElementById(wrapId);
      if (!wrap) return;
      wrap.innerHTML = "";
      for (const id of ids) {
        const c = BH.Challenges.def(id);
        if (!c) continue;
        const prog = d.challenges[progKey][id] || 0;
        const done = d.challenges[doneKey].includes(id);
        const pct = Math.min(100, (prog / c.target) * 100);
        const el = document.createElement("div");
        el.className = "ch-row" + (done ? " done" : "");
        el.innerHTML =
          `<div class="ch-body">` +
            `<div class="ch-label">${c.label}</div>` +
            `<div class="ch-bar"><div style="width:${done ? 100 : pct}%"></div></div>` +
          `</div>` +
          `<div class="ch-prog">${done ? "✔" : prog + " / " + c.target}</div>` +
          `<div class="ch-reward">⛁ ${c.reward}</div>`;
        wrap.appendChild(el);
      }
    };
    renderCh("profile-daily", d.challenges.daily, "dailyProg", "dailyDone");
    renderCh("profile-weekly", d.challenges.weekly, "weeklyProg", "weeklyDone");

    const r = d.ranked || { lp: 0, wins: 0, losses: 0 };
    const tier = BH.Ranked.tier(r.lp);
    const rankedHtml =
      `<div class="ranked-title">🏆 ${tier.name}</div>` +
      `<div class="ranked-stats">` +
        `<div class="ranked-stat"><span class="rs-val">${r.lp}</span><span class="rs-lab">LP</span></div>` +
        `<div class="ranked-stat"><span class="rs-val">${r.wins}</span><span class="rs-lab">Siege</span></div>` +
        `<div class="ranked-stat"><span class="rs-val">${r.losses}</span><span class="rs-lab">Niederlagen</span></div>` +
      `</div>` +
      `<div class="ranked-hint">Ranked-Modus auf der Startseite · LP steigt mit Siegen</div>`;

    const rankedEl = document.getElementById("profile-ranked");
    if (rankedEl) rankedEl.innerHTML = rankedHtml;

    const rankedMini = document.getElementById("profile-ranked-mini");
    if (rankedMini) {
      rankedMini.innerHTML =
        `<div class="prm-tier">${tier.name}</div>` +
        `<div class="prm-lp">${r.lp} LP</div>` +
        `<div class="prm-wl">${r.wins}W · ${r.losses}L</div>`;
    }

    const cardWrap = document.getElementById("profile-cards");
    if (cardWrap && BH.CallingCards) {
      cardWrap.innerHTML = "";
      for (const c of BH.CallingCards.owned(d)) {
        const el = document.createElement("div");
        el.className = "prof-item calling-card-item " + c.style + (d.callingCard === c.id ? " equipped" : "");
        el.innerHTML = `<span class="pi-icon">${c.icon}</span><span class="pi-name">${c.name}</span>`;
        el.onclick = () => { d.callingCard = c.id; BH.Progress.save(); this.renderProfile(); this.renderHome(); BH.audio.click(); };
        cardWrap.appendChild(el);
      }
    }

    this.renderProfileFinishers(d);

    const conWrap = document.getElementById("profile-contract");
    if (conWrap && BH.Contracts) {
      const c = BH.Contracts.active(d);
      const prog = d.contracts.prog || 0;
      if (c) {
        const pct = Math.min(100, (prog / c.target) * 100);
        conWrap.innerHTML =
          `<div class="contract-active">` +
            `<div class="contract-label">${c.label}</div>` +
            `<div class="ch-bar contract-bar"><div style="width:${pct}%"></div></div>` +
            `<div class="contract-meta">${prog} / ${c.target} · Belohnung ⛁ ${c.reward}${c.camo ? " + Camo" : ""}</div>` +
          `</div>`;
      } else {
        conWrap.innerHTML = `<div class="contract-done">Alle Verträge erledigt ✔</div>`;
      }
    }

    if (BH.Achievements) BH.Achievements.render(document.getElementById("profile-achievements"));
    this.applyProfileTab();
  }

  renderProfileFinishers(d) {
    const preview = document.getElementById("profile-finisher-preview");
    const wrap = document.getElementById("profile-finishers");
    const section = document.getElementById("profile-finisher-section");
    const hint = document.getElementById("profile-identity-hint");
    if (!wrap || !BH.BpFinishers) return;

    const available = BH.BpFinishers.isAvailable();
    if (section) section.classList.toggle("hidden", !available);
    if (hint) {
      hint.textContent = available
        ? "Emblem, Titel, Spray, Calling Card & Finisher · Klicken zum Ausrüsten"
        : "Emblem, Titel, Spray und Calling Card · Klicken zum Ausrüsten";
    }

    if (!available) {
      if (preview) preview.innerHTML = "";
      wrap.innerHTML = "";
      return;
    }

    const active = BH.BpFinishers.resolve(d, true);
    if (preview) {
      preview.innerHTML = active
        ? BH.BpFinishers.renderSceneHtml(active, { won: true, play: true })
        : "";
      if (active) requestAnimationFrame(() => BH.BpFinishers.replayStage(preview));
    }

    wrap.innerHTML = "";
    const items = [{ id: "default_win" }].concat(
      BH.BpFinishers.winFinishers(d).map(f => ({ id: f.id }))
    );

    for (const item of items) {
      const fin = BH.BpFinishers.get(item.id);
      if (!fin) continue;
      const unlocked = BH.BpFinishers.isUnlocked(d, fin);
      const isEq = (d.finisher || "default_win") === fin.id || (!d.finisher && fin.id === "default_win");
      const el = document.createElement("div");
      el.className = "prof-item finisher-item" +
        (isEq ? " equipped" : "") +
        (!unlocked ? " locked" : "");
      el.innerHTML =
        BH.BpFinishers.renderSceneHtml(fin, { won: true, compact: true }) +
        `<span class="pi-name">${fin.name}</span>` +
        (!unlocked ? `<span class="pi-lock-hint">${BH.BpFinishers.unlockHint(fin)}</span>` : "");
      if (unlocked) {
        el.onclick = () => {
          d.finisher = fin.id === "default_win" ? null : fin.id;
          BH.Progress.save();
          this.renderProfile();
          BH.audio.click();
        };
      }
      wrap.appendChild(el);
    }
  }

  /* =============== FRAKTIONSKRIEG =============== */
  applyFactionTab() {
    const tab = this._factionTab || "war";
    document.querySelectorAll(".fw-panel-tab[data-fw-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.fwPanel === tab);
    });
    document.querySelectorAll(".fw-tab[data-fw-tab]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.fwTab === tab);
    });
  }

  renderFwWarOverview(container, d) {
    if (!container || !BH.FactionWar) return;
    const b = BH.FactionWar.warBriefing(d);

    if (!b.reveal) {
      const ters = BH.FactionWar.getTerritories();
      container.innerHTML =
        `<div class="fw-overview-mystery">` +
        `<div class="fw-overview-mystery-head">⚔ UNBEKANNTE FRONT</div>` +
        `<div class="fw-overview-mystery-ters">` +
        ters.map(t => `<span class="fw-overview-ter-slot dim">${t.emoji} ???</span>`).join("") +
        `</div>` +
        `<p class="fw-overview-mystery-sub">Besitz, Punkte und Eroberungen werden nach deiner Fraktionswahl sichtbar.</p>` +
        `</div>`;
      return;
    }

    const maxPts = Math.max(1, ...b.factions.map(f => f.points));
    let html =
      `<div class="fw-overview-head">` +
      `<span>${b.leaderMeta.icon} <b style="color:${b.leaderMeta.color}">${b.leaderMeta.name}</b> führt diese Woche</span>` +
      `<span class="fw-overview-meta">${b.contested ? b.contested + " umkämpft · " : ""}${b.totalTerritories} Territorien</span>` +
      `</div>` +
      `<div class="fw-faction-grid">`;

    for (const f of b.factions) {
      const pct = Math.round(f.points / maxPts * 100);
      const terChips = f.territories.length
        ? f.territories.map(t =>
          `<span class="fw-overview-ter-chip" title="${t.name}">${t.emoji} ${t.short || t.name}</span>`
        ).join("")
        : `<span class="fw-overview-ter-chip empty">—</span>`;
      html +=
        `<div class="fw-faction-card${f.isLeader ? " leader" : ""}${f.isYours ? " yours" : ""}" style="--fw-color:${f.color}">` +
        `<div class="fw-fc-head">` +
        `<span class="fw-fc-icon">${f.icon}</span>` +
        `<span class="fw-fc-name">${f.shortName}</span>` +
        (f.isLeader ? `<span class="fw-fc-badge">FÜHRT</span>` : "") +
        (f.isYours ? `<span class="fw-fc-badge you">DEIN</span>` : "") +
        `</div>` +
        `<div class="fw-fc-points"><b>${f.points}</b> Pkt · ${f.terCount} Territor${f.terCount === 1 ? "ium" : "ien"}</div>` +
        `<div class="xp-bar fw-bar"><div style="width:${pct}%;background:${f.color}"></div></div>` +
        `<div class="fw-fc-sub">Du: ${f.playerPts} · Bots: ${f.worldPts}</div>` +
        `<div class="fw-fc-ters">${terChips}</div>` +
        `</div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
  }

  renderFwFrontPanel(d) {
    const statusEl = document.getElementById("fw-front-status");
    const logEl = document.getElementById("fw-front-log");
    if (!BH.FactionWar || !BH.FactionWar.canViewIntel(d)) {
      if (statusEl) statusEl.innerHTML = "";
      if (logEl) logEl.innerHTML = "";
      return;
    }
    const summary = BH.FactionWar.frontSummary(d);
    const lines = BH.FactionWar.getFrontLines(d);
    const pledged = d.factionWar.pledged;

    if (statusEl) {
      statusEl.innerHTML =
        `<div class="fw-front-summary">` +
        `<span><b>${summary.active}</b> Grenz${summary.active === 1 ? "e" : "en"} aktiv</span>` +
        (pledged ? `<span><b>${summary.yourFronts}</b> an deiner Fraktion</span>` : "") +
        `</div>` +
        (lines.length
          ? `<div class="fw-front-rows">` + lines.map(l => {
            const ta = BH.FactionWar._terById(l.a);
            const tb = BH.FactionWar._terById(l.b);
            const yours = pledged && (l.ownerA === pledged || l.ownerB === pledged);
            const borderTxt = `${l.metaA.icon} ${l.metaA.shortName} ↔ ${l.metaB.icon} ${l.metaB.shortName}`;
            return `<div class="fw-front-row${yours ? " yours" : ""}">` +
              `<span class="fw-fr-maps">${ta.emoji} ${ta.short} — ${tb.emoji} ${tb.short}</span>` +
              `<span class="fw-fr-push">${borderTxt}</span>` +
              `</div>`;
          }).join("") + `</div>`
          : `<div class="social-empty">Keine Grenzen — alle Nachbarn gehören derselben Fraktion.</div>`);
    }

    if (logEl) {
      const log = d.factionWar.captureLog || [];
      logEl.innerHTML = log.length
        ? log.map(e => {
          const when = BH.FactionWar._formatFrontTime(e.t);
          return `<div class="fw-fl-row capture"><span class="fw-fl-time">${when}</span><span>${e.msg}</span></div>`;
        }).join("")
        : `<div class="social-empty">Noch keine Eroberungen diese Woche.</div>`;
    }
  }

  renderFwPledgeGate(d) {
    const gate = document.getElementById("fw-pledge-gate");
    const layout = document.getElementById("fw-main-layout");
    if (!gate || !BH.FactionWar) return;

    if (BH.FactionWar.hasPledged(d)) {
      gate.classList.add("hidden");
      if (layout) layout.classList.remove("hidden");
      return;
    }

    gate.classList.remove("hidden");
    if (layout) layout.classList.add("hidden");

    const previewEl = document.getElementById("fw-gate-preview");
    if (previewEl) {
      const ters = BH.FactionWar.getTerritories();
      previewEl.innerHTML =
        `<div class="fw-gate-preview-inner">` +
        `<div class="fw-gate-preview-icon">⚔</div>` +
        `<div class="fw-gate-preview-title">WÖCHENTLICHER FRAKTIONSKRIEG</div>` +
        `<div class="fw-gate-preview-ters">` +
        ters.map(t => `<span class="fw-gate-ter">${t.emoji}</span>`).join("") +
        `</div>` +
        `<p class="fw-gate-preview-text">${ters.length} Territorien · 4 Fraktionen · Matches zählen für Einfluss &amp; Wochenpunkte</p>` +
        `</div>`;
    }

    const facEl = document.getElementById("fw-gate-factions");
    const detailEl = document.getElementById("fw-gate-detail");
    const confirmBtn = document.getElementById("btn-fw-pledge-confirm");
    const pick = this._fwPledgePick;

    if (facEl) {
      facEl.innerHTML = BH.FactionWar.factions.map(f => {
        const active = pick === f.id ? " active" : "";
        return `<button type="button" class="fw-gate-card${active}" data-fw-pick="${f.id}" style="--fw-color:${f.color}">` +
          `<span class="fw-gate-icon">${f.icon}</span>` +
          `<span class="fw-gate-name">${f.name}</span>` +
          `<span class="fw-gate-motto">${f.motto}</span>` +
          `</button>`;
      }).join("");
      facEl.querySelectorAll("[data-fw-pick]").forEach(btn => {
        btn.onclick = () => {
          BH.audio.click();
          this._fwPledgePick = btn.dataset.fwPick;
          this.renderFwPledgeGate(d);
        };
      });
    }

    if (detailEl && pick) {
      const meta = BH.FactionWar._factionMeta(pick);
      const paras = (meta.story || "").split("\n\n").slice(0, 2).map(p =>
        `<p class="fw-gate-story">${p}</p>`
      ).join("");
      detailEl.classList.remove("hidden");
      detailEl.innerHTML =
        `<div class="fw-gate-detail-head" style="border-color:${meta.color}">` +
        `<span>${meta.icon}</span><span style="color:${meta.color}">${meta.name}</span></div>` +
        paras;
    } else if (detailEl) {
      detailEl.classList.add("hidden");
      detailEl.innerHTML = "";
    }

    if (confirmBtn) {
      if (pick) {
        confirmBtn.classList.remove("hidden");
        confirmBtn.onclick = () => {
          const meta = BH.FactionWar._factionMeta(pick);
          if (!confirm(`Fraktion endgültig wählen?\n\n${meta.icon} ${meta.name}\n\nDiese Entscheidung kann nicht rückgängig gemacht werden.`)) return;
          const res = BH.FactionWar.pledge(d, pick);
          if (!res.ok) {
            if (BH.UI) BH.UI.toast(res.error || "Fehler", "error");
            return;
          }
          BH.audio.buy();
          this._fwPledgePick = null;
          BH.Achievements && BH.Achievements.evaluate(d, {});
          this.renderFactionWar();
          this.renderHome();
          this.renderMapPicker();
          if (BH.UI) BH.UI.toast(`${meta.name} — Treue bekannt`, "success");
        };
      } else {
        confirmBtn.classList.add("hidden");
      }
    }
  }

  updateFactionSidebar(d) {
    const fw = d.factionWar;
    const pledged = fw.pledged;
    const hasIntel = BH.FactionWar.canViewIntel(d);
    const pr = BH.FactionWar.personalRank(d);
    const meta = pledged ? BH.FactionWar._factionMeta(pledged) : null;

    const headMeta = document.getElementById("fw-head-meta");
    if (headMeta) {
      headMeta.textContent = hasIntel
        ? (fw.weekKey || "Woche") + " · " + pr.contrib + " FWP · " + pr.name
        : "Treue wählen · Front gesperrt";
    }

    const identity = document.getElementById("fw-sidebar-identity");
    if (identity) {
      if (meta) {
        identity.innerHTML =
          `<div class="fw-si-icon">${meta.icon}</div>` +
          `<div class="fw-si-name" style="color:${meta.color}">${meta.name}</div>` +
          `<div class="fw-si-motto">${meta.motto}</div>` +
          (fw.pledgedLocked ? `<div class="fw-si-lock">🔒 Endgültige Treue</div>` : "");
      } else {
        identity.innerHTML =
          `<div class="fw-si-icon dim">⚔</div>` +
          `<div class="fw-si-name dim">Keine Treue</div>` +
          `<div class="fw-si-motto">Wähle unten deine Fraktion — danach öffnet sich die Kriegsübersicht.</div>`;
      }
    }

    const rankEl = document.getElementById("fw-sidebar-rank");
    if (rankEl) {
      rankEl.innerHTML = hasIntel
        ? `<div class="fw-sr-name">${pr.name}</div>` +
          `<div class="fw-sr-sub">${pr.contrib} FWP${pr.next ? " · " + pr.need + " bis " + pr.next : " · MAX"}</div>` +
          `<div class="xp-bar"><div style="width:${pr.progress}%"></div></div>` +
          `<div class="fw-sr-total">Karriere: ${fw.totalFwp || 0} FWP</div>`
        : `<div class="fw-sr-name dim">—</div><div class="fw-sr-sub">Rang sichtbar nach Fraktionswahl</div>`;
    }

    const bonusEl = document.getElementById("fw-sidebar-bonus");
    if (bonusEl) {
      if (!hasIntel) {
        bonusEl.innerHTML = `<div class="fw-sb-row dim">Kriegsstand &amp; Boni nach deiner Wahl sichtbar</div>`;
      } else {
        const pb = BH.FactionWar.playerBonus(d);
        const lead = BH.FactionWar.leader(d);
        const leadMeta = lead.meta;
        bonusEl.innerHTML =
          `<div class="fw-sb-row"><span>Führt:</span><span style="color:${leadMeta.color}">${leadMeta.icon} ${leadMeta.name}</span></div>` +
          (() => {
            const fs = BH.FactionWar.frontSummary(d);
            return fs.yourFronts > 0
              ? `<div class="fw-sb-row">⚔ ${fs.yourFronts} Grenz${fs.yourFronts === 1 ? "e" : "en"} an deiner Fraktion</div>`
              : "";
          })() +
          (pb
            ? `<div class="fw-sb-row bonus">${pb.label}</div>`
            : `<div class="fw-sb-row dim">Keine aktiven Credit-Boni</div>`) +
          `<div class="fw-sb-row dim">Rang: Credits ×${pr.credMult.toFixed(2)} · XP ×${pr.xpMult.toFixed(2)}</div>`;
      }
    }

    const claimEl = document.getElementById("fw-sidebar-claim");
    if (claimEl) {
      if (!hasIntel) {
        claimEl.innerHTML = "";
      } else if (fw.pendingReward) {
        const prw = fw.pendingReward;
        claimEl.innerHTML =
          `<div class="fw-claim-box">` +
          `<div class="fw-claim-title">🏆 ${prw.tier || "Sieg"}</div>` +
          `<div class="fw-claim-loot">+${prw.credits} ⛁ · +${prw.xp} XP</div>` +
          `<button type="button" class="btn btn-primary fw-claim-btn" id="btn-fw-claim">ABHOLEN</button>` +
          `</div>`;
        const claimBtn = document.getElementById("btn-fw-claim");
        if (claimBtn) {
          claimBtn.onclick = () => {
            const res = BH.FactionWar.claimPending(d);
            if (res.ok) {
              BH.audio.buy();
              BH.Achievements && BH.Achievements.evaluate(d, {});
              this.renderFactionWar();
              this.renderTopbar();
              this.renderHome();
            }
          };
        }
      } else {
        claimEl.innerHTML = `<div class="fw-claim-empty">Keine ausstehende Belohnung</div>`;
      }
    }
  }

  renderFactionWar() {
    const d = BH.Progress.data;
    if (!BH.FactionWar) return;
    BH.FactionWar.ensure(d);
    const fw = d.factionWar;
    const hasIntel = BH.FactionWar.canViewIntel(d);

    this.renderFwPledgeGate(d);
    this.updateFactionSidebar(d);

    if (!hasIntel) return;

    const overviewEl = document.getElementById("fw-war-overview");
    if (overviewEl) this.renderFwWarOverview(overviewEl, d);
    this.renderFwFrontPanel(d);

    const standEl = document.getElementById("fw-standings");
    if (standEl) {
      const rows = BH.FactionWar.standings(d);
      const maxT = Math.max(1, ...rows.map(r => r.total));
      standEl.innerHTML =
        `<div class="fw-stand-headrow">` +
        `<span class="fw-panel-hint">Spieler- und Bot-Punkte dieser Woche</span>` +
        `<button type="button" class="btn fw-reset-btn" id="btn-fw-reset">STAND ZURÜCKSETZEN</button>` +
        `</div>` +
        rows.map(r =>
        `<div class="fw-stand-row${r.pledged ? " pledged" : ""}">` +
        `<div class="fw-stand-head"><span>${r.icon} ${r.name}</span><span class="fw-stand-total">${r.total} Pkt · ${r.pct}%</span></div>` +
        `<div class="xp-bar fw-bar"><div style="width:${Math.round(r.total / maxT * 100)}%;background:${r.color}"></div></div>` +
        `<div class="fw-stand-sub">Du: ${r.player} · KI-Bots: ${r.world}</div></div>`
      ).join("");
      const resetBtn = document.getElementById("btn-fw-reset");
      if (resetBtn) {
        resetBtn.onclick = () => {
          if (!confirm("Fraktionsstand, Territorien und Wochen-FWP wirklich zurücksetzen?\n(Treue & Gesamt-FWP bleiben erhalten.)")) return;
          BH.FactionWar.resetStandings(d);
          BH.audio.click();
          this.renderFactionWar();
          this.renderHome();
        };
      }
    }

    const terrEl = document.getElementById("fw-territories");
    if (terrEl) {
      const pledged = fw.pledged;
      const infRows = BH.FactionWar.influenceRows(d);
      terrEl.innerHTML = infRows.map(row => {
        const t = row.ter;
        const owner = row.owner || t.home || "?";
        const meta = BH.FactionWar._factionMeta(owner);
        const yours = owner === pledged;
        const home = t.home === owner;
        const pushing = row.lead && row.lead !== owner && row.max > 0;
        const infLine = row.max > 0
          ? `<div class="fw-terr-inf">Einfluss: ${row.max}/${row.need}${row.lead ? " · " + BH.FactionWar._shortLabel(row.lead) : ""}${pushing ? " · umkämpft" : ""}</div>`
          : "";
        const barLine = row.bars && row.bars.length
          ? `<div class="fw-terr-bars">` + (() => {
            const sum = row.bars.reduce((s, b) => s + b.value, 0) || 1;
            return row.bars.map(b =>
              `<span class="fw-terr-bar" style="width:${Math.round(b.value / sum * 100)}%;background:${b.meta.color}" title="${b.meta.shortName}"></span>`
            ).join("");
          })() + `</div>`
          : "";
        return `<div class="fw-terr${yours ? " yours" : ""}${pushing ? " contested" : ""}">` +
          `<span class="fw-terr-emoji">${t.emoji}</span>` +
          `<div class="fw-terr-info"><div class="fw-terr-name">${t.name}</div>` +
          `<div class="fw-terr-owner" style="color:${meta.color}">${meta.icon} ${meta.name}${home ? " · Heimat" : ""}${yours ? " · DEIN BONUS" : ""}</div>` +
          barLine + infLine +
          `</div></div>`;
      }).join("");
    }

    const contractEl = document.getElementById("fw-contract");
    if (contractEl) {
      const cs = BH.FactionWar.contractStatus(d);
      const c = cs.def;
      contractEl.innerHTML = cs.done
        ? `<div class="fw-contract done">✔ ${c.label}<br><span class="fw-contract-reward">Abgeschlossen · +${c.reward} ⛁ · +${c.xp || 0} XP · +${c.fwp} FWP</span></div>`
        : `<div class="fw-contract">${c.label}<br>` +
          `<div class="xp-bar fw-bar"><div style="width:${Math.min(100, cs.prog / c.target * 100)}%"></div></div>` +
          `<span class="fw-contract-prog">${cs.prog} / ${c.target}</span> · <b>${c.reward} ⛁</b> · <b>${c.xp || 0} XP</b> · <b>${c.fwp} FWP</b></div>`;
    }

    const msEl = document.getElementById("fw-milestones");
    if (msEl) {
      const rows = BH.FactionWar.milestoneRows(d);
      msEl.innerHTML = rows.map(r =>
        `<div class="fw-ms-row${r.claimed ? " claimed" : ""}${r.canClaim ? " ready" : ""}">` +
        `<div class="fw-ms-body">` +
          `<div class="fw-ms-label">${r.label} · ${r.fwp} FWP</div>` +
          `<div class="xp-bar fw-bar"><div style="width:${r.done ? 100 : r.prog}%"></div></div>` +
        `</div>` +
        `<div class="fw-ms-reward">+${r.credits} ⛁<br>+${r.xp} XP</div>` +
        (r.canClaim
          ? `<button type="button" class="btn fw-ms-claim" data-ms="${r.id}">ABHOLEN</button>`
          : `<span class="fw-ms-status">${r.claimed ? "✔" : Math.min(fw.contrib || 0, r.fwp) + "/" + r.fwp}</span>`) +
        `</div>`
      ).join("");
      msEl.querySelectorAll("[data-ms]").forEach(btn => {
        btn.onclick = () => {
          const res = BH.FactionWar.claimMilestone(d, btn.dataset.ms);
          if (res.ok) {
            BH.audio.buy();
            this.renderFactionWar();
            this.renderTopbar();
          } else BH.audio.empty();
        };
      });
    }

    const rewardEl = document.getElementById("fw-reward-panel");
    if (rewardEl) {
      if (fw.pendingReward) {
        const prw = fw.pendingReward;
        const emNote = prw.emblem ? `<div class="fw-reward-extra">+ Fraktions-Emblem freischalten</div>` : "";
        rewardEl.innerHTML =
          `<div class="fw-reward-ready">` +
          `<p>Deine Fraktion <b style="color:var(--accent)">${prw.winnerName || prw.winner}</b> gewann Woche ${prw.week}!</p>` +
          `<div class="fw-reward-tier">${prw.tier || "Bronze"}-Belohnung</div>` +
          `<div class="fw-reward-loot">+${prw.credits} ⛁ · +${prw.xp} XP</div>` +
          emNote +
          `<p class="fw-reward-hint">Abholen in der Sidebar →</p></div>`;
      } else {
        rewardEl.innerHTML =
          `<div class="fw-reward-info">` +
          `<div class="fw-reward-tier-row"><span>Bronze</span><span>25+ FWP · Basis</span></div>` +
          `<div class="fw-reward-tier-row silver"><span>Silber</span><span>100+ FWP · ×1,3 + Emblem</span></div>` +
          `<div class="fw-reward-tier-row gold"><span>Gold</span><span>200+ FWP · ×1,55 + Emblem</span></div>` +
          `<p class="fw-reward-hint">Mindestens 25 FWP und siegreiche Fraktion am Wochenwechsel.</p></div>`;
      }
    }

    const loreEl = document.getElementById("fw-lore-panel");
    if (loreEl) {
      if (fw.pledged) {
        const meta = BH.FactionWar._factionMeta(fw.pledged);
        const storyParas = (meta.story || meta.motto || "").split("\n\n").map(p =>
          `<p class="fw-lore-p">${p}</p>`
        ).join("");
        loreEl.innerHTML =
          `<div class="fw-lore-header" style="border-color:${meta.color}">` +
          `<span class="fw-lore-icon">${meta.icon}</span>` +
          `<div><div class="fw-lore-name" style="color:${meta.color}">${meta.name}</div>` +
          `<div class="fw-lore-motto">${meta.motto}</div></div></div>` +
          `<div class="fw-lore-body">${storyParas}</div>`;
      } else {
        loreEl.innerHTML = "";
      }
    }

    const histEl = document.getElementById("fw-history");
    if (histEl) {
      const hist = fw.history || [];
      const captureLog = (fw.captureLog || []).slice(0, 6);
      let html = "";
      if (captureLog.length) {
        html += `<div class="fw-sub-label" style="margin-bottom:4px">Eroberungen (diese Woche)</div>`;
        html += captureLog.map(e =>
          `<div class="fw-fl-row capture"><span class="fw-fl-time">${BH.FactionWar._formatFrontTime(e.t)}</span><span>${e.msg}</span></div>`
        ).join("");
        html += `<div class="fw-sub-label" style="margin:10px 0 4px">WOCHEN-SIEGER</div>`;
      }
      html += hist.length
        ? hist.map(h => {
          const m = BH.FactionWar._factionMeta(h.winner);
          return `<div class="fw-hist-row"><span>${h.week}</span><span style="color:${m.color}">${m.icon} ${m.name}</span></div>`;
        }).join("")
        : (captureLog.length ? "" : `<div class="social-empty">Noch keine abgeschlossenen Wochen.</div>`);
      histEl.innerHTML = html;
    }

    this.applyFactionTab();
  }

  /* =============== SOCIAL =============== */
  applySocialTab() {
    const tab = this._socialTab || "friends";
    document.querySelectorAll(".social-panel[data-social-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.socialPanel === tab);
    });
    document.querySelectorAll(".social-tab[data-social-tab]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.socialTab === tab);
    });
  }

  renderClanQuestRows(d, period) {
    const rows = BH.Social.getQuestRows(d, period);
    if (!rows.length) return `<div class="social-empty">Kein Clan aktiv</div>`;
    return rows.map(r => {
      const pct = Math.min(100, (r.prog / r.target) * 100);
      return (
        `<div class="clan-quest-row${r.done ? " done" : ""}">` +
        `<div class="cq-body">` +
          `<div class="cq-label">${r.label}</div>` +
          `<div class="cq-desc">${r.desc}</div>` +
          `<div class="ch-bar"><div style="width:${r.done ? 100 : pct}%"></div></div>` +
        `</div>` +
        `<div class="cq-prog">${r.done ? "✔" : r.prog + "/" + r.target}</div>` +
        `<div class="cq-reward">+${r.rewardXp} XP<br>⛁ ${r.rewardCredits}<br><span class="cq-res">+Ressourcen</span></div>` +
        `</div>`
      );
    }).join("");
  }

  renderClanPerksBlock(d, cLvl) {
    let html = `<div class="clan-perks-grid">`;
    for (const p of BH.Social.CLAN_PERKS) {
      const unlocked = cLvl >= p.level;
      html +=
        `<div class="clan-perk-row${unlocked ? " unlocked" : ""}">` +
        `<div class="cpr-lvl">LV ${p.level}</div>` +
        `<div class="cpr-body">` +
          `<div class="cpr-name">${p.name}</div>` +
          `<ul class="cpr-list">${p.perks.map(x => `<li>${x}</li>`).join("")}</ul>` +
        `</div>` +
        `<div class="cpr-status">${unlocked ? "✔" : "🔒"}</div>` +
        `</div>`;
    }
    html += `</div>`;
    const next = BH.Social.getNextClanPerk(cLvl);
    html += next
      ? `<div class="clan-perk-next">Nächster Vorteil ab Level ${next.level}: ${next.name}</div>`
      : `<div class="clan-perk-next">Alle Clan-Vorteile freigeschaltet ✔</div>`;
    return html;
  }

  renderClanTreasuryBlock(d) {
    if (!BH.Social || !BH.Social.CLAN_TREASURY_BUILDINGS || !d.clan) return "";
    const isLeader = d.clan.role === "leader";
    const res = d.clan.resources;
    const totalLv = BH.Social.treasuryTotalLevels(d);
    const labels = BH.Social.CLAN_RESOURCE_LABELS;

    let html =
      `<div class="social-subsection clan-treasury-section">` +
      `<div class="social-sub-label">SCHATZKAMMER · STUFE ${totalLv}</div>` +
      `<div class="clan-resources-bar">` +
      `<span class="cr-chip" title="${labels.alloy.name}">${labels.alloy.icon} ${res.alloy || 0}</span>` +
      `<span class="cr-chip" title="${labels.intel.name}">${labels.intel.icon} ${res.intel || 0}</span>` +
      `<span class="cr-chip" title="${labels.supplies.name}">${labels.supplies.icon} ${res.supplies || 0}</span>` +
      `</div>` +
      `<p class="clan-treasury-hint">Ressourcen durch Matches & Clan-Aufgaben · ${isLeader ? "Du kannst als Anführer ausbauen" : (d.clan.isAiClan ? "KI-Anführer verwaltet Ausbauten" : "Nur der Anführer baut aus")}</p>` +
      `<div class="clan-treasury-buildings">`;

    for (const b of BH.Social.CLAN_TREASURY_BUILDINGS) {
      if (b.id === "horizon" && BH.ClanExt && !BH.ClanExt.isLive()) continue;
      const s2Locked = b.s2 && BH.ClanExt && !BH.ClanExt.isLive();
      const info = BH.Social.getTreasuryUpgradeInfo(d, b.id);
      const lvl = info ? info.level : 0;
      const maxed = info && info.maxed;
      const effect = b.effectLabel(lvl);
      const nextEffect = !maxed ? b.effectLabel(lvl + 1) : null;

      let actionHtml;
      if (maxed) {
        actionHtml = `<div class="ctb-action maxed">MAX</div>`;
      } else if (s2Locked) {
        actionHtml = `<div class="ctb-action dim">S2</div>`;
      } else if (isLeader) {
        const costStr = BH.Social.formatResourceCost(info.cost);
        actionHtml =
          `<button type="button" class="btn ctb-upgrade${info.canAfford ? "" : " disabled"}" ` +
          `data-treasury-upgrade="${b.id}" title="Kosten: ${costStr}">` +
          `↑ ST.${info.nextLevel}<br><span class="ctb-cost">${costStr}</span></button>`;
      } else {
        actionHtml = `<div class="ctb-action dim">🔒</div>`;
      }

      html +=
        `<div class="clan-tb-row${lvl > 0 ? " built" : ""}${maxed ? " maxed" : ""}">` +
        `<div class="ctb-icon">${b.icon}</div>` +
        `<div class="ctb-body">` +
          `<div class="ctb-name">${b.name} <span class="ctb-lvl">ST.${lvl}/${b.maxLevel}</span></div>` +
          `<div class="ctb-desc">${b.desc}</div>` +
          `<div class="ctb-effect">${effect}${nextEffect && !maxed ? ` → ${nextEffect}` : ""}</div>` +
        `</div>` +
        actionHtml +
        `</div>`;
    }

    html += `</div></div>`;
    return html;
  }

  renderClanEventBlock(d) {
    if (!d.clan) return "";
    const ev = BH.Social.getClanEvent();
    if (!ev) return "";
    return (
      `<div class="clan-event-banner">` +
      `<div class="ce-icon">${ev.icon || "📅"}</div>` +
      `<div class="ce-body">` +
        `<div class="ce-name">CLAN-EVENT · ${ev.name}</div>` +
        `<div class="ce-desc">${ev.desc}</div>` +
        `<div class="ce-week">Wechselt wöchentlich · gilt für alle Mitglieder</div>` +
      `</div></div>`
    );
  }

  renderClanMatchBlock(d) {
    if (!BH.ClanMatches || !d.clan) return "";
    const info = BH.ClanMatches.windowInfo();
    const maps = BH.ClanMatches.allMaps();
    const mapChips = maps.map(m =>
      `<span class="clan-match-map" title="${m.name}">${m.emoji} ${m.short || m.name}</span>`
    ).join("");

    if (!BH.ClanMatches.isSeasonUnlocked()) {
      return (
        `<div class="clan-match-block locked">` +
        `<div class="clan-match-head">` +
        `<span class="clan-match-icon">⚔</span>` +
        `<div><div class="clan-match-title">CLAN-MATCHES</div>` +
        `<div class="clan-match-sub">Saison 2 · 2 Wochen Event · alle Karten</div></div>` +
        `<span class="clan-match-badge locked">S2</span></div>` +
        `<p class="clan-match-hint dim">${BH.ClanExt && !BH.ClanExt.isLive() ? (BH.SeasonRelease ? BH.SeasonRelease.s2StartsOnNotice() : "Saison 2 startet am 1.8.2026") + " — Clan-Erweiterungen inkl. Matches." : (BH.SeasonRelease ? BH.SeasonRelease.s2StartsOnNotice() : "Saison 2 startet am 1.8.2026") + " — temporäre 2-Wochen-Fenster mit Zufallskarte aus dem kompletten Map-Pool."}</p>` +
        `</div>`
      );
    }

    const status = BH.ClanMatches.statusLabel(info);
    const active = info.active;
    const st = d.clan.clanMatchStats || { played: 0, wins: 0 };

    return (
      `<div class="clan-match-block${active ? " live" : ""}">` +
      `<div class="clan-match-head">` +
      `<span class="clan-match-icon">⚔</span>` +
      `<div><div class="clan-match-title">CLAN-MATCHES</div>` +
      `<div class="clan-match-sub">Team Deathmatch · Zufällige Karte · 2-Wochen-Event</div></div>` +
      `<span class="clan-match-badge${active ? " live" : ""}">${active ? "LIVE" : status}</span></div>` +
      `<div class="clan-match-maps">` +
      `<div class="clan-match-maps-label">ALLE KARTEN (${maps.length})</div>` +
      `<div class="clan-match-map-list">${mapChips || "—"}</div>` +
      `</div>` +
      `<div class="clan-match-stats">Diese Runde: ${st.played} Matches · ${st.wins} Siege</div>` +
      (BH.ClanExt ? BH.ClanExt.renderCmLeaderboard(d) : "") +
      (active
        ? `<button type="button" class="btn btn-primary clan-match-play" id="btn-clan-match-play">CLAN-MATCH STARTEN</button>`
        : `<p class="clan-match-hint dim">${info.reason === "prelaunch" ? (BH.SeasonRelease ? BH.SeasonRelease.s2StartsOnNotice() : "Startet am 1.8.2026") : "Aktuell pausiert — nächstes 2-Wochen-Fenster bald."}</p>`) +
      `</div>`
    );
  }

  updateSocialSidebar(d) {
    const identity = document.getElementById("social-identity");
    const headMeta = document.getElementById("social-head-meta");
    if (!identity) return;

    const profile = BH.Social.myProfile(d);
    const displayName = BH.Social.displayName(d);
    const emblem = profile.emblem || "🎖";
    const clanLine = d.clan
      ? `<div class="si-clan si-clan-link" data-screen="clan" title="Zum Clan-Bereich">[${d.clan.tag}] ${d.clan.name} →</div>`
      : `<div class="si-clan dim si-clan-link" data-screen="clan" title="Clan gründen oder beitreten">Kein Clan · CLAN →</div>`;

    identity.innerHTML =
      `<div class="si-emblem">${emblem}</div>` +
      `<div class="si-name">${displayName}</div>` +
      clanLine +
      `<div class="si-stats">LV ${profile.level || 1} · K/D ${profile.kd || 0} · ${profile.wins || 0}W</div>` +
      `<div class="si-friends">${d.friends.length} / ${BH.Social.MAX_FRIENDS} Freunde</div>`;

    if (headMeta) {
      headMeta.textContent = d.friends.length + " Freunde" + (d.clan ? " · [" + d.clan.tag + "]" : "");
    }
  }

  _setClanSidebarCodeVisible(visible) {
    const sidebar = document.querySelector("#screen-clan .clan-sidebar");
    if (sidebar) sidebar.classList.toggle("clan-sidebar-has-clan", visible);
  }

  updateClanSidebar(d) {
    const identity = document.getElementById("clan-sidebar-identity");
    const headMeta = document.getElementById("clan-head-meta");
    const bonusEl = document.getElementById("clan-sidebar-bonus");
    const codeEl = document.getElementById("clan-sidebar-code");
    if (!identity) return;

    if (!d.clan) {
      identity.innerHTML =
        `<div class="csi-icon">⚔</div>` +
        `<div class="csi-title">Kein Clan</div>` +
        `<div class="csi-sub">Gründe einen Clan oder tritt per BC1-Code bei.</div>`;
      if (headMeta) headMeta.textContent = "Kein Clan · Gründen oder beitreten";
      if (bonusEl) bonusEl.innerHTML = "";
      if (codeEl) codeEl.value = "";
      this._setClanSidebarCodeVisible(false);
      return;
    }

    this._setClanSidebarCodeVisible(true);

    const cLvl = BH.Social.clanLevel(d.clan);
    const xpIn = (d.clan.xp || 0) % BH.Social.CLAN_XP_PER_LEVEL;
    const xpNeed = BH.Social.CLAN_XP_PER_LEVEL;
    const xpPct = Math.min(100, xpIn / xpNeed * 100);
    const bonus = Math.round((BH.Social.xpMult(d) - 1) * 100);
    const cBonus = Math.round((BH.Social.creditsMult(d) - 1) * 100);
    const totalTreasury = BH.Social.treasuryTotalLevels(d);
    const res = d.clan.resources || {};
    const onlineN = (d.clan.members || []).filter(m =>
      BH.Social.isRecentlyOnline(m.lastOnlineAt || m.joinedAt)).length;

    identity.innerHTML =
      `<div class="csi-em">${BH.ClanExt ? BH.ClanExt.clanEmblemIcon(d.clan) : "⚔"}</div>` +
      `<div class="csi-tag">[${d.clan.tag}]</div>` +
      `<div class="csi-title">${d.clan.name}</div>` +
      (d.clan.motto ? `<div class="csi-motto">„${d.clan.motto}"</div>` : "") +
      `<div class="csi-sub">Level ${cLvl} · ${d.clan.members.length}/${BH.Social.MAX_CLAN} · ${
        d.clan.role === "leader" ? "ANFÜHRER"
          : (BH.ClanExt && BH.ClanExt.isLive() && d.clan.role === "officer" ? "OFFIZIER" : "MITGLIED")
      }${d.clan.isAiClan ? " · KI" : ""}</div>` +
      `<div class="csi-sub csi-online">${onlineN} online · ${Math.max(0, d.clan.members.length - onlineN)} offline</div>` +
      `<div class="csi-xp-label">Clan-XP ${xpIn}/${xpNeed}</div>` +
      `<div class="xp-bar"><div style="width:${xpPct}%"></div></div>`;

    if (headMeta) headMeta.textContent = `[${d.clan.tag}] ${d.clan.name} · LV ${cLvl}`;
    if (bonusEl) {
      bonusEl.innerHTML = bonus > 0
        ? `<div class="csb-line">⚡ +${bonus}% XP · +${cBonus}% Credits</div>` +
          `<div class="csb-line">🏦 Schatzkammer St.${totalTreasury}</div>` +
          `<div class="csb-res">⚙ ${res.alloy || 0} · 📡 ${res.intel || 0} · 📦 ${res.supplies || 0}</div>`
        : `<div class="csb-line dim">Boni ab Clan-Level 2</div>`;
    }
    if (codeEl) codeEl.value = BH.Social.clanCode(d);
  }

  applyClanTab() {
    const hasClan = !!BH.Progress.data.clan;
    const tab = this._clanTab || "home";
    const chatOk = BH.ClanChat && BH.ClanChat.isEnabled(BH.Progress.data);
    const activeTab = hasClan ? (tab === "chat" && !chatOk ? "home" : tab) : "join";

    document.querySelectorAll(".clan-panel[data-clan-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.clanPanel === activeTab);
    });
    document.querySelectorAll(".clan-tab[data-clan-tab]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.clanTab === activeTab);
    });

    const tabsNav = document.getElementById("clan-tabs");
    if (tabsNav) tabsNav.classList.toggle("hidden", !hasClan);

    const chatTab = document.getElementById("clan-tab-chat");
    if (chatTab) chatTab.classList.toggle("hidden", !chatOk);
  }

  updateClanHeadChips(d) {
    const el = document.getElementById("clan-head-chips");
    if (!el) return;
    if (!d.clan) {
      el.innerHTML = "";
      return;
    }
    const cLvl = BH.Social.clanLevel(d.clan);
    const onlineN = (d.clan.members || []).filter(m =>
      BH.Social.isRecentlyOnline(m.lastOnlineAt || m.joinedAt)).length;
    const bonus = Math.round((BH.Social.xpMult(d) - 1) * 100);
    el.innerHTML =
      `<span class="clan-chip">LV ${cLvl}</span>` +
      `<span class="clan-chip">${d.clan.members.length}/${BH.Social.MAX_CLAN}</span>` +
      `<span class="clan-chip clan-chip-online">${onlineN} online</span>` +
      (bonus > 0 ? `<span class="clan-chip clan-chip-bonus">+${bonus}% XP</span>` : "");
  }

  renderClanMemberRows(d, clan) {
    return BH.Social.sortClanMembers(clan.members).map(m => {
      const s = m.stats || {};
      const role = m.role === "leader" ? "★ " : (BH.ClanExt && BH.ClanExt.isLive() && m.role === "officer" ? "◆ " : "");
      const wc = m.weekContrib || {};
      const pres = BH.Social.memberPresenceLabel(m);
      const online = BH.Social.isRecentlyOnline(m.lastOnlineAt || m.joinedAt);
      let actions = "";
      if (BH.ClanExt && BH.ClanExt.isLive() && clan.role === "leader" && !m.isSelf && !m.isAi) {
        actions += `<button type="button" class="btn sf-remove" data-kick="${m.id}">✕</button>`;
        if (m.role === "member") actions += `<button type="button" class="btn sf-promote" data-promote="${m.id}" title="Offizier">◆</button>`;
        if (m.role === "officer") actions += `<button type="button" class="btn sf-demote" data-demote="${m.id}" title="Degradieren">↓</button>`;
      } else if (clan.role === "leader" && !m.isSelf && !m.isAi) {
        actions += `<button type="button" class="btn sf-remove" data-kick="${m.id}">✕</button>`;
      }
      return `<div class="social-row clan-member-row${m.isSelf ? " self" : ""}${online ? " online" : ""}${m.isAi ? " ai-member" : ""}">` +
        `<span class="sf-em">${s.emblem || "🎖"}</span>` +
        `<div class="sf-info"><div class="sf-name">${role}${m.name}${m.isSelf ? " (DU)" : ""}${m.isAi ? " 🤖" : ""}</div>` +
        `<div class="sf-sub">LV ${s.level || 1} · K/D ${s.kd || 0} · Woche: ${wc.kills || 0}K · <span class="sf-last-online${online ? " online" : ""}">${pres}</span></div></div>` +
        actions +
        `</div>`;
    }).join("");
  }

  renderClanJoinPanel(d) {
    return (
      (BH.ClanExt ? BH.ClanExt.renderLockedBlock() : "") +
      (BH.ClanExt ? BH.ClanExt.renderRecommendationsBlock(d) : "") +
      `<p class="clan-panel-hint">Spieler-Clan per BC1-Code · oder sofort einem KI-Clan beitreten</p>` +
      `<div class="clan-join-grid">` +
        `<div class="clan-join-card">` +
          `<div class="clan-join-card-title">CLAN GRÜNDEN</div>` +
          `<p class="clan-join-card-desc">Eigener Name &amp; Tag · du wirst Anführer · Code zum Einladen</p>` +
          `<div class="social-name-row"><input type="text" id="clan-name" class="social-input" maxlength="24" placeholder="Clan-Name"></div>` +
          `<div class="social-name-row"><input type="text" id="clan-tag" class="social-input" maxlength="5" placeholder="Tag (z. B. BHZN)"></div>` +
          `<button type="button" class="btn btn-primary social-action-btn" id="btn-create-clan">CLAN GRÜNDEN</button>` +
        `</div>` +
        `<div class="clan-join-card">` +
          `<div class="clan-join-card-title">CLAN BEITRETEN</div>` +
          `<p class="clan-join-card-desc">BC1-Import-Code von einem Freund oder aus der Zwischenablage</p>` +
          `<input type="text" id="clan-import" class="social-code-input" placeholder="BC1.…">` +
          `<button type="button" class="btn social-action-btn" id="btn-join-clan">CLAN BEITRETEN</button>` +
        `</div>` +
      `</div>`
    );
  }

  bindClanJoinHandlers(d) {
    const createBtn = document.getElementById("btn-create-clan");
    const joinBtn = document.getElementById("btn-join-clan");
    const joinPanel = document.getElementById("clan-panel-join");
    if (createBtn) {
      createBtn.onclick = () => {
        const msg = document.getElementById("clan-msg");
        const nameEl = document.getElementById("clan-name");
        const tagEl = document.getElementById("clan-tag");
        const res = BH.Social.createClan(d,
          nameEl ? nameEl.value : "",
          tagEl ? tagEl.value : "");
        if (msg) {
          msg.textContent = res.ok ? "Clan gegründet ✔" : ("Fehler: " + res.error);
          msg.className = "save-msg clan-msg-bar " + (res.ok ? "ok" : "err");
        }
        if (res.ok) {
          BH.audio.buy();
          BH.Achievements && BH.Achievements.evaluate(d, {});
          this._clanTab = "home";
          this.renderClan();
          this.renderTopbar();
        } else BH.audio.empty();
      };
    }
    if (joinBtn) {
      joinBtn.onclick = () => {
        const msg = document.getElementById("clan-msg");
        const codeEl = document.getElementById("clan-import");
        const res = BH.Social.joinClanFromCode(d, codeEl ? codeEl.value : "");
        if (msg) {
          msg.textContent = res.ok ? "Clan beigetreten ✔" : ("Fehler: " + res.error);
          msg.className = "save-msg clan-msg-bar " + (res.ok ? "ok" : "err");
        }
        if (res.ok) {
          BH.audio.buy();
          BH.Achievements && BH.Achievements.evaluate(d, {});
          this._clanTab = "home";
          this.renderClan();
          this.renderTopbar();
        } else BH.audio.empty();
      };
    }
    if (BH.ClanExt && joinPanel) BH.ClanExt.bindRecommendationHandlers(d, joinPanel, this);
  }

  bindClanPanelHandlers(d, clanPanel) {
    const copyClan = document.getElementById("btn-copy-clan-code");
    if (copyClan) {
      copyClan.onclick = () => {
        BH.audio.click();
        const code = BH.Social.clanCode(d);
        const msg = document.getElementById("clan-msg");
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(() => {
            if (msg) { msg.textContent = "Clan-Code kopiert ✔"; msg.className = "save-msg clan-msg-bar ok"; }
          });
        }
      };
    }

    clanPanel.querySelectorAll("[data-treasury-upgrade]").forEach(btn => {
      btn.onclick = () => {
        const msg = document.getElementById("clan-msg");
        if (btn.classList.contains("disabled")) {
          BH.audio.empty();
          if (msg) {
            msg.textContent = "Nicht genug Clan-Ressourcen — spiele Matches und erledige Aufgaben.";
            msg.className = "save-msg clan-msg-bar err";
          }
          return;
        }
        const res = BH.Social.upgradeTreasury(d, btn.dataset.treasuryUpgrade);
        if (msg) {
          msg.textContent = res.ok
            ? `${res.building} → Stufe ${res.level} ✔`
            : ("Fehler: " + res.error);
          msg.className = "save-msg clan-msg-bar " + (res.ok ? "ok" : "err");
        }
        if (res.ok) {
          BH.audio.buy();
          this.renderClan();
        } else BH.audio.empty();
      };
    });

    const clan = d.clan;
    if (clan) {
      clanPanel.querySelectorAll("[data-kick]").forEach(btn => {
        btn.onclick = () => {
          clan.members = clan.members.filter(m => m.id !== btn.dataset.kick);
          BH.Progress.save();
          BH.audio.click();
          this.renderClan();
        };
      });

      clanPanel.querySelectorAll("[data-invite]").forEach(btn => {
        btn.onclick = () => {
          const msg = document.getElementById("clan-msg");
          const res = BH.Social.inviteFriend(d, btn.dataset.invite);
          if (msg) {
            msg.textContent = res.ok ? "Eingeladen ✔" : res.error;
            msg.className = "save-msg clan-msg-bar " + (res.ok ? "ok" : "err");
          }
          if (res.ok) { BH.audio.buy(); this.renderClan(); }
          else BH.audio.empty();
        };
      });
    }

    const rivalBtn = document.getElementById("btn-clan-rival");
    if (rivalBtn) {
      rivalBtn.onclick = () => {
        const codeEl = document.getElementById("clan-rival-code");
        const resEl = document.getElementById("clan-rival-result");
        const res = BH.Social.compareRivalClan(d, codeEl ? codeEl.value : "");
        BH.audio.click();
        if (!res.ok) {
          if (resEl) resEl.innerHTML = `<p class="save-msg err">${res.error}</p>`;
          BH.audio.empty();
          return;
        }
        const winXp = res.yours.xp >= res.rival.xp;
        if (resEl) {
          resEl.innerHTML =
            `<div class="clan-rival-grid">` +
            `<div class="cr-col${winXp ? " win" : ""}"><div class="cr-tag">[${res.yours.tag}]</div>` +
            `<div class="cr-name">${res.yours.name}</div>` +
            `<div class="cr-stat">LV ${res.yours.level} · ${res.yours.xp} XP</div>` +
            `<div class="cr-stat">${res.yours.members} Mitglieder · ${res.yours.questsDone} Aufgaben ✔</div></div>` +
            `<div class="cr-vs">VS</div>` +
            `<div class="cr-col${!winXp ? " win" : ""}"><div class="cr-tag">[${res.rival.tag}]</div>` +
            `<div class="cr-name">${res.rival.name}</div>` +
            `<div class="cr-stat">LV ${res.rival.level} · ${res.rival.xp} XP</div>` +
            `<div class="cr-stat">${res.rival.members} Mitglieder (Code)</div></div>` +
            `</div>`;
        }
      };
    }

    const leaveBtn = document.getElementById("btn-leave-clan");
    if (leaveBtn) {
      leaveBtn.onclick = () => {
        BH.Social.leaveClan(d);
        BH.audio.click();
        this._clanTab = "home";
        this.renderClan();
        this.renderTopbar();
      };
    }
  }

  renderClan() {
    const d = BH.Progress.data;
    if (!BH.Social) return;
    BH.Social.ensure(d);

    if (d.clan) {
      const self = d.clan.members.find(m => m.isSelf);
      if (self) self.stats = BH.Social.myProfile(d);
      BH.Social.touchPresence(d, { save: false });
      BH.Social.syncClanMemberPresence(d);
    }

    this.updateClanSidebar(d);
    this.updateClanHeadChips(d);

    const sidebarCopy = document.getElementById("btn-clan-sidebar-copy");
    const sidebarMsg = document.getElementById("clan-sidebar-msg");
    if (sidebarCopy) {
      sidebarCopy.onclick = () => {
        BH.audio.click();
        if (!d.clan) {
          if (sidebarMsg) {
            sidebarMsg.textContent = "Erst Clan gründen oder beitreten.";
            sidebarMsg.className = "save-msg err";
          }
          BH.audio.empty();
          return;
        }
        const code = BH.Social.clanCode(d);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(() => {
            if (sidebarMsg) { sidebarMsg.textContent = "Code kopiert ✔"; sidebarMsg.className = "save-msg ok"; }
          });
        }
      };
    }

    const msgEl = document.getElementById("clan-msg");
    if (msgEl && !d.clan) {
      msgEl.textContent = "";
      msgEl.className = "save-msg clan-msg-bar";
    }

    const joinPanel = document.getElementById("clan-panel-join");
    const homePanel = document.getElementById("clan-panel-home");
    const warPanel = document.getElementById("clan-panel-war");
    const questsPanel = document.getElementById("clan-panel-quests");
    const treasuryPanel = document.getElementById("clan-panel-treasury");
    const membersPanel = document.getElementById("clan-panel-members");
    const chatPanel = document.getElementById("clan-panel-chat");
    const panelsRoot = document.getElementById("clan-panels-root");
    if (!joinPanel || !panelsRoot) return;

    if (!d.clan) {
      joinPanel.innerHTML = this.renderClanJoinPanel(d);
      if (homePanel) homePanel.innerHTML = "";
      if (warPanel) warPanel.innerHTML = "";
      if (questsPanel) questsPanel.innerHTML = "";
      if (treasuryPanel) treasuryPanel.innerHTML = "";
      if (membersPanel) membersPanel.innerHTML = "";
      if (chatPanel) chatPanel.innerHTML = "";
      this.applyClanTab();
      this.bindClanJoinHandlers(d);
      return;
    }

    const clan = d.clan;
    const cLvl = BH.Social.clanLevel(clan);
    const bonus = Math.round((BH.Social.xpMult(d) - 1) * 100);
    const cBonus = Math.round((BH.Social.creditsMult(d) - 1) * 100);
    const bonusHtml = bonus > 0
      ? `<div class="clan-bonus-banner">⚡ +${bonus}% XP · +${cBonus}% Credits · Clan + Schatzkammer + Event</div>`
      : `<div class="clan-bonus-banner dim">Spiele Matches für Clan-XP &amp; Ressourcen · Boni ab Level 2</div>`;

    if (homePanel) {
      homePanel.innerHTML =
        `<p class="clan-panel-hint">Event · Identität · Beiträge · Wochenrückblick</p>` +
        (BH.ClanExt ? BH.ClanExt.renderLockedBlock() : "") +
        this.renderClanEventBlock(d) +
        bonusHtml +
        (BH.ClanExt ? BH.ClanExt.renderIdentityBlock(d) : "") +
        (BH.ClanExt ? BH.ClanExt.renderContribBlock(d) : "") +
        (BH.ClanExt ? BH.ClanExt.renderRecapBlock(d) : "");
    }

    if (warPanel) {
      warPanel.innerHTML =
        `<p class="clan-panel-hint">Clan-Matches · Rivalen-Vergleich · Saison-Events</p>` +
        this.renderClanMatchBlock(d) +
        (BH.ClanExt ? BH.ClanExt.renderRivalBlock(d) : "");
    }

    if (questsPanel) {
      questsPanel.innerHTML =
        `<p class="clan-panel-hint">Tägliche &amp; wöchentliche Clan-Aufgaben · Belohnungen in XP, Credits &amp; Ressourcen</p>` +
        `<div class="clan-quest-section">` +
          `<div class="clan-section-label">TÄGLICH</div>` +
          `<div class="clan-quest-list">${this.renderClanQuestRows(d, "daily")}</div>` +
        `</div>` +
        `<div class="clan-quest-section">` +
          `<div class="clan-section-label">WOCHE</div>` +
          `<div class="clan-quest-list">${this.renderClanQuestRows(d, "weekly")}</div>` +
        `</div>`;
    }

    if (treasuryPanel) {
      treasuryPanel.innerHTML =
        `<p class="clan-panel-hint">Ressourcen ausbauen · Clan-Shop-Buffs · Level-Vorteile</p>` +
        this.renderClanTreasuryBlock(d) +
        (BH.ClanExt ? BH.ClanExt.renderShopBlock(d) : "") +
        `<div class="clan-quest-section">` +
          `<div class="clan-section-label">CLAN-VORTEILE</div>` +
          this.renderClanPerksBlock(d, cLvl) +
        `</div>`;
    }

    if (membersPanel) {
      let membersHtml =
        `<p class="clan-panel-hint">Mitglieder · Online-Status · Einladungen · Clan verlassen</p>` +
        `<div class="clan-section-label">MITGLIEDER · ZULETZT ONLINE</div>` +
        `<div class="social-list clan-members-list">${this.renderClanMemberRows(d, clan)}</div>`;

      if ((clan.role === "leader" || (BH.ClanExt && BH.ClanExt.isLive() && clan.role === "officer")) && d.friends.length) {
        membersHtml +=
          `<div class="clan-section-label">FREUND EINLADEN</div>` +
          `<div class="social-list">`;
        for (const f of d.friends) {
          if (clan.members.some(m => m.name.toLowerCase() === f.name.toLowerCase())) continue;
          membersHtml +=
            `<div class="social-row">` +
            `<span class="sf-em">${(f.stats && f.stats.emblem) || "🎖"}</span>` +
            `<div class="sf-info"><div class="sf-name">${f.name}</div></div>` +
            `<button type="button" class="btn sf-add" data-invite="${f.id}">+</button></div>`;
        }
        membersHtml += `</div>`;
      }

      if (clan.role === "leader" || (BH.ClanExt && BH.ClanExt.isLive() && clan.role === "officer")) {
        membersHtml +=
          `<div class="clan-invite-block">` +
            `<div class="clan-section-label">CLAN-EINLADUNG</div>` +
            `<input type="text" id="clan-export-code" class="social-code-input" readonly value="${BH.Social.clanCode(d)}">` +
            `<button type="button" class="btn social-action-btn" id="btn-copy-clan-code">CLAN-CODE KOPIEREN</button>` +
          `</div>`;
      }

      membersHtml +=
        `<button type="button" class="btn btn-danger social-leave-btn" id="btn-leave-clan">CLAN VERLASSEN</button>`;
      membersPanel.innerHTML = membersHtml;
    }

    if (chatPanel) {
      chatPanel.innerHTML = BH.ClanChat && BH.ClanChat.isEnabled(d)
        ? `<p class="clan-panel-hint">Nur Spieler-Clans · KI-Clans ohne Chat</p>` + BH.ClanChat.render(d)
        : `<p class="clan-panel-hint dim">Chat ist in KI-Clans deaktiviert.</p>`;
    }

    joinPanel.innerHTML = "";
    this.applyClanTab();

    document.getElementById("btn-clan-match-play")?.addEventListener("click", () => {
      BH.audio.click();
      if (!BH.ClanMatches || !BH.ClanMatches.canPlay(d)) {
        BH.audio.empty();
        return;
      }
      this.startGame(BH.ClanMatches.MODE_ID);
    });

    this.bindClanPanelHandlers(d, panelsRoot);
    if (BH.ClanExt) BH.ClanExt.bindHandlers(d, panelsRoot, this);
    if (BH.ClanChat && BH.ClanChat.isEnabled(d)) BH.ClanChat.bind(d, panelsRoot, this);
  }

  renderSocial() {
    const d = BH.Progress.data;
    if (!BH.Social) return;
    BH.Social.ensure(d);

    if (d.clan) {
      const self = d.clan.members.find(m => m.isSelf);
      if (self) self.stats = BH.Social.myProfile(d);
    }

    this.updateSocialSidebar(d);

    const nameEl = document.getElementById("social-player-name");
    if (nameEl) nameEl.value = d.playerName || "";

    const saveName = document.getElementById("btn-social-save-name");
    if (saveName) {
      saveName.onclick = () => {
        d.playerName = (nameEl.value || "").trim().slice(0, 20);
        BH.Progress.save();
        BH.audio.click();
        this.renderSocial();
        this.renderTopbar();
      };
    }

    const codeTa = document.getElementById("social-my-friend-code");
    if (codeTa) codeTa.value = BH.Social.friendCode(d);

    const sidebarMsg = document.getElementById("social-sidebar-msg");
    const copyBtn = document.getElementById("btn-copy-friend-code");
    if (copyBtn) {
      copyBtn.onclick = () => {
        BH.audio.click();
        const code = BH.Social.friendCode(d);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(() => {
            if (sidebarMsg) { sidebarMsg.textContent = "Code kopiert ✔"; sidebarMsg.className = "save-msg ok"; }
          });
        } else if (codeTa) {
          codeTa.select();
        }
      };
    }

    const addBtn = document.getElementById("btn-add-friend");
    const friendMsg = document.getElementById("social-friend-msg");
    if (addBtn) {
      addBtn.onclick = () => {
        const code = document.getElementById("social-friend-import").value;
        const res = BH.Social.addFriendFromCode(d, code);
        if (friendMsg) {
          friendMsg.textContent = res.ok ? "Freund hinzugefügt ✔" : ("Fehler: " + res.error);
          friendMsg.className = "save-msg " + (res.ok ? "ok" : "err");
        }
        if (res.ok) {
          BH.audio.buy();
          BH.Achievements && BH.Achievements.evaluate(d, {});
          document.getElementById("social-friend-import").value = "";
          this.renderSocial();
        } else {
          BH.audio.empty();
        }
      };
    }

    const countEl = document.getElementById("social-friend-count");
    if (countEl) countEl.textContent = "(" + d.friends.length + "/" + BH.Social.MAX_FRIENDS + ")";

    const listEl = document.getElementById("social-friends-list");
    if (listEl) {
      listEl.innerHTML = d.friends.length
        ? d.friends.map(f => {
          const s = f.stats || {};
          const tag = s.clanTag ? `<span class="sf-clan">[${s.clanTag}]</span> ` : "";
          return `<div class="social-row" data-fid="${f.id}">` +
            `<span class="sf-em">${s.emblem || "🎖"}</span>` +
            `<div class="sf-info"><div class="sf-name">${tag}${f.name}</div>` +
            `<div class="sf-sub">LV ${s.level || 1} · K/D ${s.kd || 0} · ${s.wins || 0} Siege</div></div>` +
            `<button type="button" class="btn sf-remove" data-remove="${f.id}">✕</button></div>`;
        }).join("")
        : `<div class="social-empty">Noch keine Freunde – Code teilen oder aus Bestenliste hinzufügen.</div>`;
      listEl.querySelectorAll("[data-remove]").forEach(btn => {
        btn.onclick = () => {
          BH.Social.removeFriend(d, btn.dataset.remove);
          BH.audio.click();
          this.renderSocial();
        };
      });
    }

    const lbEl = document.getElementById("social-lb-suggest");
    if (lbEl && BH.Leaderboard) {
      const top = BH.Leaderboard.top(5);
      const myName = BH.Social.displayName(d).toLowerCase();
      lbEl.innerHTML = top.length
        ? top.filter(e => e.name.toLowerCase() !== myName).map(e =>
          `<div class="social-row lb-suggest">` +
          `<div class="sf-info"><div class="sf-name">${e.name}</div>` +
          `<div class="sf-sub">K/D ${e.kd.toFixed(2)} · ${e.kills} Kills</div></div>` +
          `<button type="button" class="btn sf-add" data-lb="${encodeURIComponent(e.name)}">+</button></div>`
        ).join("")
        : `<div class="social-empty">Spiele Matches für Bestenlisten-Einträge.</div>`;
      lbEl.querySelectorAll(".sf-add").forEach(btn => {
        btn.onclick = () => {
          const name = decodeURIComponent(btn.dataset.lb);
          const entry = top.find(x => x.name === name);
          const res = BH.Social.addFriendFromLeaderboard(d, entry);
          if (friendMsg) {
            friendMsg.textContent = res.ok ? name + " hinzugefügt ✔" : res.error;
            friendMsg.className = "save-msg " + (res.ok ? "ok" : "err");
          }
          if (res.ok) {
            BH.audio.buy();
            BH.Achievements && BH.Achievements.evaluate(d, {});
            this.renderSocial();
          } else BH.audio.empty();
        };
      });
    }

    this.applySocialTab();
  }

  /* =============== SHOP =============== */
  _shopTabMeta(filter) {
    const map = {
      camos: { title: "Waffen-Skins", meta: "Tarnungen für dein Loadout" },
      crosshairs: { title: "Fadenkreuz", meta: "Stile und Farben fürs Visier" },
      sprays: { title: "Sprays", meta: "Profil & Killfeed" },
      emblems: { title: "Embleme", meta: "Profil, Rangliste & Clan" },
      titles: { title: "Titel", meta: "Unter deinem Operator-Namen" },
      charms: { title: "Anhänger", meta: "Primärwaffe & Loadout" },
      cards: { title: "Calling Cards", meta: "Nach dem Match" },
      premium: { title: "Premium", meta: "Spielzeit mit Bonus-XP & Credits" },
      diamonds: { title: "Diamanten", meta: "Operator-Skill-Fortschritt" },
      bundles: { title: "Bundles", meta: "Pakete mit Bonus-Inhalten" },
      boosters: { title: "Booster", meta: "XP für Level, BP & Clan" },
      crates: { title: "Event-Kisten", meta: "Exklusive Drops & Premium-Zeit" },
    };
    return map[filter] || { title: "Shop", meta: "" };
  }

  _shopPanelItemCount(filter) {
    const panel = document.querySelector(`.shop-panel[data-shop-panel="${filter}"]`);
    if (!panel) return 0;
    return panel.querySelectorAll(".shop-item, .bundle-card, .crate-event-card").length;
  }

  _updateShopContentHead() {
    const f = this.shopFilter || "camos";
    const info = this._shopTabMeta(f);
    const titleEl = document.getElementById("shop-content-title");
    const metaEl = document.getElementById("shop-content-meta");
    const badgeEl = document.getElementById("shop-content-badge");
    if (titleEl) titleEl.textContent = info.title;
    if (metaEl) metaEl.textContent = info.meta;
    if (badgeEl) {
      const count = this._shopPanelItemCount(f);
      badgeEl.textContent = count > 0 ? `${count} Items` : "";
    }
  }

  applyShopFilter() {
    const f = this.shopFilter || "camos";
    document.querySelectorAll(".shop-panel[data-shop-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.shopPanel === f);
    });
    document.querySelectorAll(".shop-tab[data-filter]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === f);
    });
    this._updateShopContentHead();
    const activeTab = document.querySelector(".shop-tab[data-filter].active");
    if (activeTab) activeTab.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }

  updateShopPreview(opts) {
    const el = document.getElementById("shop-preview");
    if (!el || !opts) return;
    const credits = BH.Progress.data.credits;
    let statusClass = "";
    let statusText;
    if (opts.equipped) {
      statusClass = " equipped";
      statusText = "Aktuell ausgerüstet";
    } else if (opts.locked) {
      statusClass = " locked";
      statusText = "Gesperrt — Story-Fortschritt erforderlich";
    } else if (opts.owned) {
      statusClass = " owned";
      statusText = "Im Besitz — erneut klicken zum Ausrüsten";
    } else if (opts.price === 0) {
      statusText = "Kostenlos — Klick zum Freischalten";
    } else if (credits >= opts.price) {
      statusText = "Kaufbar — Klick auf Item";
    } else {
      statusClass = " cant-afford";
      statusText = "Zu wenig Credits";
    }
    const priceHtml = !opts.owned && !opts.locked && opts.price > 0
      ? `<span class="shop-preview-price${credits < opts.price ? " cant-afford" : ""}">⛁ ${opts.price.toLocaleString("de-DE")}</span>`
      : opts.owned
        ? `<span class="shop-preview-price owned">✔ Besitzt</span>`
        : "";
    const tags = [
      opts.neon ? `<span class="shop-preview-tag neon">NEON</span>` : "",
      opts.badge ? `<span class="shop-preview-tag">${opts.badge}</span>` : "",
    ].filter(Boolean).join("");
    el.innerHTML =
      `<div class="shop-preview-inner">` +
      `<div class="shop-preview-visual">` +
      `<div class="shop-preview-box${opts.neon ? " camo-neon" : ""}${opts.previewClass || ""}" style="${opts.previewStyle || ""}">${opts.preview || "—"}</div>` +
      `</div>` +
      `<div class="shop-preview-meta">` +
      (tags ? `<div class="shop-preview-tags">${tags}</div>` : "") +
      `<div class="shop-preview-name">${opts.name}</div>` +
      (priceHtml ? `<div class="shop-preview-price-row">${priceHtml}</div>` : "") +
      `<div class="shop-preview-status${statusClass}">${statusText}</div>` +
      `</div>` +
      `</div>`;
  }

  renderDiamondShop(d, sp) {
    if (!BH.OperatorSkills || !BH.SHOP.diamondPacks) return;
    const statusEl = document.getElementById("shop-diamond-status");
    const packWrap = document.getElementById("shop-diamond-packs");
    const customWrap = document.getElementById("shop-diamond-custom");
    if (!statusEl || !packWrap || !customWrap) return;

    const ownedIds = d.owned.operators || ["recruit"];
    if (!this._shopDiamondOpId || !ownedIds.includes(this._shopDiamondOpId)) {
      this._shopDiamondOpId = ownedIds.includes(d.operator) ? d.operator : ownedIds[0];
    }
    const opId = this._shopDiamondOpId;
    const ops = BH.OperatorCatalog ? BH.OperatorCatalog.all(d) : (BH.OPERATORS || []);
    const op = ops.find(o => o.id === opId) || { id: opId, name: opId };
    const prog = BH.OperatorSkills.progress(d, opId);
    const minCustom = BH.OperatorSkills.SHOP_CUSTOM_MIN;

    let opOptions = "";
    for (const oid of ownedIds) {
      const o = ops.find(x => x.id === oid) || { id: oid, name: oid };
      const p = BH.OperatorSkills.progress(d, oid);
      opOptions +=
        `<option value="${oid}"${oid === opId ? " selected" : ""}>` +
        `${o.name} · 💎 ${p.diamonds}` +
        `</option>`;
    }

    statusEl.innerHTML =
      `<div class="shop-diamond-target">` +
      `<label class="shop-diamond-label">Empfänger</label>` +
      `<select id="shop-diamond-op" class="shop-diamond-select">${opOptions}</select>` +
      `</div>` +
      `<div class="shop-diamond-balance">` +
      `<span>${op.name}</span> · <b>💎 ${prog.diamonds}</b> · Match ${prog.matchProg}/${prog.perDiamond}` +
      `</div>`;

    const opSelect = document.getElementById("shop-diamond-op");
    if (opSelect) {
      opSelect.addEventListener("change", () => {
        this._shopDiamondOpId = opSelect.value;
        this.renderDiamondShop(d, sp);
      });
    }

    packWrap.innerHTML = "";
    for (const pack of BH.SHOP.diamondPacks) {
      const price = sp(pack.price);
      const perDia = Math.round(price / pack.diamonds);
      const canBuy = d.credits >= price;
      const el = document.createElement("div");
      el.className = "shop-item diamond-pack" + (canBuy ? "" : " cant-afford");
      el.innerHTML =
        (pack.badge ? `<span class="diamond-pack-badge">${pack.badge}</span>` : "") +
        `<div class="si-preview diamond-pack-icon">${pack.icon || "💎"}</div>` +
        `<div class="si-price">⛁ ${price.toLocaleString("de-DE")}</div>` +
        `<div class="si-name">${pack.diamonds} Diamanten</div>` +
        `<div class="si-sub">${pack.desc || ("≈ " + perDia.toLocaleString("de-DE") + " ⛁ / 💎")}</div>`;
      el.addEventListener("click", () => {
        this.updateShopPreview({
          preview: "💎",
          previewStyle: "font-size:32px;color:#7dd3fc",
          name: pack.diamonds + " Diamanten · " + op.name,
          price,
          owned: false,
          equipped: false,
        });
        document.querySelectorAll(".shop-item.selected, .bundle-card.selected").forEach(x => x.classList.remove("selected"));
        el.classList.add("selected");
        const res = BH.OperatorSkills.buyShopPack(d, pack.id, opId);
        if (!res.ok) {
          BH.audio.empty();
          if (BH.UI && res.reason === "credits") {
            BH.UI.toast("Zu wenig Credits · ⛁ " + res.need.toLocaleString("de-DE"), "warn");
          }
          return;
        }
        BH.audio.buy();
        BH.Progress.save();
        if (BH.UI) {
          BH.UI.toast("💎 +" + res.added + " · " + op.name + " ✔", "success");
        }
        this.renderShop();
        this.renderTopbar();
        if (this._opSkillsId === opId) {
          const skillsOp = ops.find(o => o.id === opId);
          if (skillsOp) this.renderOpSkillsModal(skillsOp);
        }
      });
      packWrap.appendChild(el);
    }

    const customQty = Math.max(minCustom, Math.floor(Number(this._shopDiamondCustomQty) || minCustom));
    this._shopDiamondCustomQty = customQty;
    const customDetail = BH.OperatorSkills.customShopPriceDetail(customQty, d);
    const customPrice = customDetail ? customDetail.price : null;
    const canCustom = customPrice && d.credits >= customPrice;
    const tierHint = customDetail
      ? `${customDetail.label} · ≈ ${customDetail.perDia.toLocaleString("de-DE")} ⛁ / 💎`
      : `Mindestens ${minCustom} Diamanten`;

    customWrap.innerHTML =
      `<div class="shop-diamond-custom-box">` +
      `<div class="shop-diamond-custom-title">EIGENE MENGE · SHOP-PREIS</div>` +
      `<p class="shop-diamond-custom-hint">Mindestens ${minCustom} Diamanten · Preis wie Festpakete kombiniert (kein 1:1-Kurs)</p>` +
      `<div id="shop-diamond-tier-hint" class="shop-diamond-tier-hint">${tierHint}</div>` +
      `<div class="shop-diamond-custom-row">` +
      `<label class="shop-diamond-label" for="shop-diamond-qty">Anzahl</label>` +
      `<input type="number" id="shop-diamond-qty" class="shop-diamond-qty" min="${minCustom}" step="10" value="${customQty}">` +
      `<span id="shop-diamond-custom-price" class="shop-diamond-custom-price">= ⛁ ${customPrice ? customPrice.toLocaleString("de-DE") : "—"}</span>` +
      `</div>` +
      `<button type="button" class="btn btn-diamond-custom${canCustom ? "" : " disabled"}" id="btn-diamond-custom-buy"` +
      `${canCustom ? "" : " disabled"}>KAUFEN · 💎 ${customQty.toLocaleString("de-DE")}</button>` +
      `</div>`;

    const qtyInput = document.getElementById("shop-diamond-qty");
    const priceEl = document.getElementById("shop-diamond-custom-price");
    const btnCustom = document.getElementById("btn-diamond-custom-buy");
    const syncCustomPrice = () => {
      const qty = Math.floor(Number(qtyInput && qtyInput.value) || 0);
      this._shopDiamondCustomQty = qty;
      const detail = BH.OperatorSkills.customShopPriceDetail(qty, d);
      const price = detail ? detail.price : null;
      const ok = price && d.credits >= price;
      const tierEl = document.getElementById("shop-diamond-tier-hint");
      if (tierEl) {
        tierEl.textContent = detail
          ? `${detail.label} · ≈ ${detail.perDia.toLocaleString("de-DE")} ⛁ / 💎`
          : (qty > 0 && qty < minCustom ? `Mindestens ${minCustom} Diamanten` : "—");
      }
      if (priceEl) {
        priceEl.textContent = price
          ? "= ⛁ " + price.toLocaleString("de-DE")
          : (qty > 0 && qty < minCustom ? "= Min. " + minCustom + " 💎" : "= —");
      }
      if (btnCustom) {
        btnCustom.disabled = !ok;
        btnCustom.classList.toggle("disabled", !ok);
        btnCustom.textContent = qty >= minCustom
          ? "KAUFEN · 💎 " + qty.toLocaleString("de-DE")
          : "MIN. " + minCustom + " 💎";
      }
    };
    if (qtyInput) {
      qtyInput.addEventListener("input", syncCustomPrice);
    }
    if (btnCustom) {
      btnCustom.addEventListener("click", () => {
        const qty = Math.floor(Number(qtyInput && qtyInput.value) || 0);
        this.updateShopPreview({
          preview: "💎",
          previewStyle: "font-size:32px;color:#7dd3fc",
          name: qty + " Diamanten · " + op.name,
          price: BH.OperatorSkills.customShopPrice(qty, d) || 0,
          owned: false,
          equipped: false,
        });
        const res = BH.OperatorSkills.buyCustom(d, qty, opId);
        if (!res.ok) {
          BH.audio.empty();
          if (BH.UI) {
            if (res.reason === "min") {
              BH.UI.toast("Mindestens " + res.min + " Diamanten", "warn");
            } else if (res.reason === "credits") {
              BH.UI.toast("Zu wenig Credits · ⛁ " + res.need.toLocaleString("de-DE"), "warn");
            }
          }
          return;
        }
        BH.audio.buy();
        BH.Progress.save();
        if (BH.UI) {
          BH.UI.toast("💎 +" + res.added + " · " + op.name + " ✔", "success");
        }
        this.renderShop();
        this.renderTopbar();
        if (this._opSkillsId === opId) {
          const skillsOp = ops.find(o => o.id === opId);
          if (skillsOp) this.renderOpSkillsModal(skillsOp);
        }
      });
    }
  }

  renderShop() {
    const d = BH.Progress.data;
    const sp = (p, season) => (BH.ShopEconomy ? BH.ShopEconomy.price(p, { season, data: d }) : p);
    const spBundle = (b) => (BH.ShopEconomy ? BH.ShopEconomy.bundlePrice(b, d) : b.price);
    const bpEx = (cat, id) => BH.BattlePass && BH.BattlePass.isExclusive(cat, id);
    document.getElementById("shop-credits").textContent = d.credits.toLocaleString("de-DE");

    const heroPrem = document.getElementById("shop-hero-premium");
    if (heroPrem && BH.PremiumPlaytime) {
      const active = BH.PremiumPlaytime.isActive(d);
      heroPrem.classList.toggle("active", active);
      const textEl = heroPrem.querySelector(".shop-premium-text");
      if (textEl) {
        textEl.textContent = active
          ? BH.PremiumPlaytime.statusLabel(d)
          : "Premium inaktiv";
      }
    }

    const dealEl = document.getElementById("shop-daily-deal");
    if (dealEl && BH.DailyDeal) {
      const deal = BH.DailyDeal.current(d);
      const owned = BH.DailyDeal.isOwned(d, deal);
      const price = BH.DailyDeal.dealPrice(deal);
      const prevStyle = deal.cat === "crosshair"
        ? `color:${d.crosshair.color}`
        : `background:${deal.preview || "#333"}`;
      dealEl.innerHTML =
        `<div class="deal-inner">` +
        `<div class="deal-visual"><span class="deal-preview" style="${prevStyle}">${deal.cat === "crosshair" ? deal.preview : (deal.preview || "🎁")}</span></div>` +
        `<div class="deal-body">` +
        `<span class="deal-tag">−${Math.round(deal.discount * 100)} % HEUTE</span>` +
        `<span class="deal-name">${deal.name}</span>` +
        `<span class="deal-price">${owned ? "GEKAUFT ✔" : "⛁ " + price.toLocaleString("de-DE")}</span>` +
        `</div></div>`;
      dealEl.className = "shop-daily-deal" + (owned ? " owned" : "");
      dealEl.onclick = () => {
        this.updateShopPreview({
          preview: deal.cat === "crosshair" ? deal.preview : (deal.preview || "🎁"),
          previewStyle: deal.cat === "crosshair" ? `color:${d.crosshair.color}` : `background:${deal.preview || "#333"}`,
          name: deal.name,
          price: price,
          owned,
          equipped: false,
        });
        if (owned) return;
        const res = BH.DailyDeal.buy(d);
        if (!res.ok) { BH.audio.empty(); return; }
        BH.audio.buy();
        this.renderShop();
        this.renderTopbar();
      };
    }

    const weekEl = document.getElementById("shop-weekly-featured");
    if (weekEl && BH.WeeklyShop) {
      const items = BH.WeeklyShop.items(d);
      weekEl.innerHTML = items.map((item, idx) => {
        const owned = BH.WeeklyShop.isOwned(d, item);
        const price = BH.WeeklyShop.price(item);
        const prev = item.cat === "crosshair" ? item.preview : (item.preview || "🎁");
        const prevStyle = item.cat === "crosshair"
          ? `color:${d.crosshair.color}`
          : `background:${item.preview || "#333"}`;
        return (
          `<button type="button" class="weekly-deal-row${owned ? " owned" : ""}" data-wi="${idx}">` +
          `<span class="wd-preview" style="${prevStyle}">${prev}</span>` +
          `<span class="wd-body"><span class="wd-name">${item.name}</span>` +
          `<span class="wd-price">${owned ? "✔ Besitzt" : "⛁ " + price.toLocaleString("de-DE")}</span></span>` +
          `</button>`
        );
      }).join("") +
      `<div class="weekly-deal-tag">−${Math.round(BH.WeeklyShop.DISCOUNT * 100)} % · KW ${(d.weeklyShop.weekKey || "").replace("-W", "")}</div>`;
      weekEl.querySelectorAll("[data-wi]").forEach(row => {
        row.onclick = () => {
          const item = items[parseInt(row.dataset.wi, 10)];
          this.updateShopPreview({
            preview: item.cat === "crosshair" ? item.preview : (item.preview || "🎁"),
            previewStyle: item.cat === "crosshair" ? `color:${d.crosshair.color}` : `background:${item.preview || "#333"}`,
            name: item.name,
            price: BH.WeeklyShop.price(item),
            owned: BH.WeeklyShop.isOwned(d, item),
            equipped: false,
          });
          if (BH.WeeklyShop.isOwned(d, item)) return;
          const res = BH.WeeklyShop.buy(d, item);
          if (!res.ok) { BH.audio.empty(); return; }
          BH.audio.buy();
          this.renderShop();
          this.renderTopbar();
        };
      });
    }

    // --- Bundles ---
    const bundleWrap = document.getElementById("shop-bundles");
    bundleWrap.innerHTML = "";
    const bundles = [...BH.SHOP.bundles].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return spBundle(b) - spBundle(a);
    });
    for (const b of bundles) {
      const owned = d.owned.bundles.includes(b.id);
      const locked = b.seasonLocked && BH.SeasonBundle && BH.SeasonBundle.isLocked(d);
      const bundlePrice = spBundle(b);
      const cantAfford = !owned && !locked && d.credits < bundlePrice;
      const itemCount = this.bundleItemCount(b);
      const el = document.createElement("div");
      el.className = "bundle-card" +
        (owned ? " owned" : "") +
        (cantAfford ? " cant-afford" : "") +
        (locked ? " locked" : "") +
        (b.featured ? " featured" : "");
      const itemLines = this.bundleItemLabels(b).map(l => `<li>${l}</li>`).join("");
      el.innerHTML =
        (b.featured ? `<div class="bundle-featured-tag">⭐ PREMIUM</div>` : "") +
        `<div class="bundle-badge">${b.badge || "BUNDLE"}</div>` +
        `<div class="bundle-name">${b.name}</div>` +
        `<div class="bundle-price">${owned ? "GEKAUFT ✔" : locked ? "GESPERRT" : "⛁ " + bundlePrice.toLocaleString("de-DE")}</div>` +
        `<div class="bundle-meta"><span class="bundle-count">${itemCount} Items</span>` +
        (b.items && b.items.credits ? `<span class="bundle-bonus">+${b.items.credits} ⛁ Bonus</span>` : "") +
        `</div>` +
        `<div class="bundle-desc">${locked ? "🔒 Freischaltung ab Saison-Story Woche 4" : b.desc}</div>` +
        `<ul class="bundle-items">${itemLines}</ul>`;
      el.addEventListener("click", () => {
        this.updateShopPreview({
          preview: "📦",
          previewStyle: "font-size:28px",
          name: b.name,
          price: bundlePrice,
          owned,
          locked,
        });
        document.querySelectorAll(".shop-item.selected, .bundle-card.selected").forEach(x => x.classList.remove("selected"));
        el.classList.add("selected");
        if (owned || locked) { BH.audio.click(); return; }
        const res = BH.Progress.buyBundle(b.id);
        if (!res.ok) { BH.audio.empty(); return; }
        BH.audio.buy();
        this.renderShop();
        this.renderTopbar();
        this.renderHome();
      });
      bundleWrap.appendChild(el);
    }

    const makeItem = (parent, opts) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "shop-item" +
        (opts.owned ? " owned" : "") +
        (opts.equipped ? " equipped" : "") +
        (!opts.owned && d.credits < opts.price ? " cant-afford" : "") +
        (opts.neon ? " shop-item-neon" : "");
      const priceLabel = opts.equipped
        ? "AUSGERÜSTET"
        : opts.owned
          ? "BESITZT"
          : opts.price === 0
            ? "GRATIS"
            : "⛁ " + opts.price.toLocaleString("de-DE");
      el.innerHTML =
        (opts.neon ? `<span class="si-tag si-tag-neon">NEON</span>` : "") +
        (opts.badge ? `<span class="si-tag">${opts.badge}</span>` : "") +
        `<div class="si-preview-wrap">` +
        `<div class="si-preview${opts.previewClass || ""}" style="${opts.previewStyle || ""}">${opts.preview || ""}</div>` +
        `</div>` +
        `<div class="si-foot">` +
        `<div class="si-name">${opts.name}</div>` +
        `<div class="si-price">${priceLabel}</div>` +
        `</div>`;
      el.addEventListener("click", () => {
        this.updateShopPreview(opts);
        document.querySelectorAll(".shop-item.selected, .bundle-card.selected").forEach(x => x.classList.remove("selected"));
        el.classList.add("selected");
        if (!opts.owned) {
          if (d.credits < opts.price) {
            BH.audio.empty();
            return;
          }
          d.credits -= opts.price;
          opts.onBuy();
          BH.audio.buy();
        } else if (opts.onEquip) {
          opts.onEquip();
          BH.audio.click();
        }
        BH.Progress.save();
        this.renderShop();
      });
      parent.appendChild(el);
    };

    // --- Waffen-Skins ---
    const camoWrap = document.getElementById("shop-camos");
    camoWrap.innerHTML = "";
    for (const c of BH.SHOP.camos) {
      if (bpEx("camos", c.id)) continue;
      const owned = d.owned.camos.includes(c.id);
      const camoDef = BH.CAMOS.find(x => x.id === c.id) || c;
      const cs = BH.CamoStyle;
      makeItem(camoWrap, {
        previewStyle: cs ? cs.swatchStyle(camoDef) : `background:#${c.color.toString(16).padStart(6, "0")}`,
        previewClass: cs ? cs.swatchClass(camoDef) : "",
        name: c.name,
        price: sp(c.price),
        owned,
        neon: !!(camoDef && camoDef.neon),
        equipped: owned && this.loadout.camo === c.id,
        onBuy: () => d.owned.camos.push(c.id),
        onEquip: () => { this.loadout.camo = c.id; this.saveLoadout(); },
      });
    }

    const weaponWrap = document.getElementById("shop-premium");
    const premStatus = document.getElementById("shop-premium-status");
    if (premStatus && BH.PremiumPlaytime) {
      const active = BH.PremiumPlaytime.isActive(d);
      premStatus.innerHTML = active
        ? `<div class="shop-prem-active">⭐ ${BH.PremiumPlaytime.statusLabel(d)} · ${BH.PremiumPlaytime.benefitSummary()}</div>`
        : `<div class="shop-prem-inactive">Kein Premium aktiv — Tage kaufen oder aus Kisten gewinnen</div>`;
    }
    if (weaponWrap && BH.SHOP.premiumDays) {
      weaponWrap.innerHTML = "";
      for (const pack of BH.SHOP.premiumDays) {
        const price = sp(pack.price);
        const canBuy = d.credits >= price;
        const el = document.createElement("div");
        el.className = "shop-item premium-pack" + (canBuy ? "" : " cant-afford");
        el.innerHTML =
          (pack.badge ? `<span class="premium-pack-badge">${pack.badge}</span>` : "") +
          `<div class="si-preview premium-pack-icon">${pack.icon || "⭐"}</div>` +
          `<div class="si-price">⛁ ${price.toLocaleString("de-DE")}</div>` +
          `<div class="si-name">${pack.days} Tage Premium</div>` +
          `<div class="si-sub">${pack.desc || BH.PremiumPlaytime.benefitSummary()}</div>`;
        el.addEventListener("click", () => {
          this.updateShopPreview({
            preview: pack.icon || "⭐",
            previewStyle: "font-size:32px;color:#ffd24d",
            name: pack.days + " Tage Premium",
            price,
            owned: false,
            equipped: false,
          });
          document.querySelectorAll(".shop-item.selected, .bundle-card.selected").forEach(x => x.classList.remove("selected"));
          el.classList.add("selected");
          if (!BH.PremiumPlaytime) return;
          const res = BH.PremiumPlaytime.buyPack(d, pack.id);
          if (!res.ok) { BH.audio.empty(); return; }
          BH.audio.buy();
          BH.Progress.save();
          if (BH.UI) {
            BH.UI.toast("Premium · " + pack.days + " Tage aktiviert ✔", "success");
          }
          this.renderShop();
          this.renderTopbar();
          this.renderHome();
        });
        weaponWrap.appendChild(el);
      }
    }

    this.renderDiamondShop(d, sp);

    // --- Fadenkreuz-Stile ---
    const chWrap = document.getElementById("shop-crosshairs");
    chWrap.innerHTML = "";
    for (const c of BH.SHOP.crosshairs) {
      if (bpEx("crosshairs", c.id)) continue;
      const owned = d.owned.crosshairs.includes(c.id);
      makeItem(chWrap, {
        preview: c.glyph,
        previewStyle: `color:${d.crosshair.color}`,
        name: c.name,
        price: sp(c.price),
        owned,
        equipped: owned && d.crosshair.style === c.id,
        onBuy: () => { d.owned.crosshairs.push(c.id); d.crosshair.style = c.id; },
        onEquip: () => { d.crosshair.style = c.id; },
      });
    }

    // --- Fadenkreuz-Farben ---
    const colWrap = document.getElementById("shop-colors");
    colWrap.innerHTML = "";
    for (const c of BH.SHOP.colors) {
      if (bpEx("colors", c.id)) continue;
      const owned = d.owned.colors.includes(c.id);
      makeItem(colWrap, {
        preview: "✛",
        previewStyle: `color:${c.css}`,
        name: c.name,
        price: sp(c.price),
        owned,
        equipped: owned && d.crosshair.color === c.css,
        onBuy: () => { d.owned.colors.push(c.id); d.crosshair.color = c.css; },
        onEquip: () => { d.crosshair.color = c.css; },
      });
    }

    // --- Sprays ---
    const sprayWrap = document.getElementById("shop-sprays");
    if (sprayWrap) {
      sprayWrap.innerHTML = "";
      for (const s of BH.SHOP.sprays || []) {
        if (bpEx("sprays", s.id)) continue;
        const owned = d.owned.sprays.includes(s.id);
        makeItem(sprayWrap, {
          preview: s.icon,
          previewStyle: "font-size:28px",
          name: s.name,
          price: sp(s.price),
          owned,
          equipped: owned && d.spray === s.id,
          onBuy: () => d.owned.sprays.push(s.id),
          onEquip: () => { d.spray = s.id; },
        });
      }
      for (const s of (BH.Crates ? BH.Crates.exclusiveItems("sprays") : []) || []) {
        if (!d.owned.sprays.includes(s.id)) continue;
        makeItem(sprayWrap, {
          preview: s.icon,
          previewStyle: "font-size:28px",
          name: s.name + " ★EX",
          price: 0,
          owned: true,
          equipped: d.spray === s.id,
          onEquip: () => { d.spray = s.id; },
        });
      }
    }

    // --- Shop-Embleme ---
    const emShop = document.getElementById("shop-emblems");
    if (emShop) {
      emShop.innerHTML = "";
      for (const e of BH.SHOP.emblems || []) {
        if (bpEx("emblems", e.id)) continue;
        const owned = d.owned.emblems.includes(e.id);
        makeItem(emShop, {
          preview: e.icon,
          previewStyle: "font-size:28px",
          name: e.name,
          price: sp(e.price),
          owned,
          equipped: owned && d.emblem === e.id,
          onBuy: () => d.owned.emblems.push(e.id),
          onEquip: () => { d.emblem = e.id; },
        });
      }
    }

    // --- Shop-Titel ---
    const tiShop = document.getElementById("shop-titles");
    if (tiShop) {
      tiShop.innerHTML = "";
      for (const t of BH.SHOP.titles || []) {
        if (bpEx("titles", t.id)) continue;
        const owned = d.owned.titles.includes(t.id);
        makeItem(tiShop, {
          preview: "🏷",
          name: t.name,
          price: sp(t.price),
          owned,
          equipped: owned && d.title === t.id,
          onBuy: () => d.owned.titles.push(t.id),
          onEquip: () => { d.title = t.id; },
        });
      }
    }

    const chShop = document.getElementById("shop-charms");
    if (chShop) {
      chShop.innerHTML = "";
      for (const c of BH.SHOP.charms || []) {
        if (bpEx("charms", c.id)) continue;
        const owned = (d.owned.charms || []).includes(c.id);
        makeItem(chShop, {
          preview: c.icon,
          previewStyle: "font-size:28px",
          name: c.name,
          price: sp(c.price),
          owned,
          equipped: owned && d.charm === c.id,
          onBuy: () => { if (!d.owned.charms.includes(c.id)) d.owned.charms.push(c.id); d.charm = c.id; },
          onEquip: () => { d.charm = c.id; },
        });
      }
    }

    const cardShop = document.getElementById("shop-cards");
    if (cardShop) {
      cardShop.innerHTML = "";
      for (const c of BH.SHOP.callingCards || []) {
        const owned = (d.owned.callingCards || []).includes(c.id);
        makeItem(cardShop, {
          preview: c.icon,
          previewStyle: "font-size:28px",
          name: c.name,
          price: sp(c.price),
          owned,
          equipped: owned && d.callingCard === c.id,
          onBuy: () => { if (!d.owned.callingCards.includes(c.id)) d.owned.callingCards.push(c.id); d.callingCard = c.id; },
          onEquip: () => { d.callingCard = c.id; },
        });
      }
    }

    this.renderEventCrateShop();

    const boostEl = document.getElementById("shop-boosters");
    if (boostEl && BH.BpXpTokens && BH.SHOP.xpTokens) {
      let boostHtml = "";
      for (const area of BH.BpXpTokens.AREAS) {
        const items = BH.SHOP.xpTokens.filter(t => t.area === area.id);
        if (!items.length) continue;
        boostHtml +=
          `<div class="booster-area">` +
          `<div class="booster-area-head">` +
          `<span class="booster-area-icon">${area.icon}</span>` +
          `<span class="booster-area-title">${area.name}</span>` +
          `<span class="booster-area-sub">${area.activateLabel}</span>` +
          `</div>` +
          `<div class="shop-grid booster-area-grid">`;
        for (const tok of items) {
          const owned = BH.BpXpTokens.count(d, tok.area, tok.tier);
          const tokPrice = sp(tok.price);
          const canBuy = d.credits >= tokPrice;
          boostHtml +=
            `<div class="shop-item booster-item${canBuy ? "" : " cant-afford"}"` +
            ` data-xp-token="${tok.id}">` +
            (tok.badge ? `<span class="booster-pack-badge">${tok.badge}</span>` : "") +
            `<span class="shop-item-preview booster-preview">${tok.icon || area.icon}</span>` +
            `<span class="shop-item-price booster-price">⛁ ${tokPrice.toLocaleString("de-DE")}</span>` +
            `<span class="shop-item-name">${tok.name}</span>` +
            `<span class="shop-item-sub">${owned ? owned + " im Besitz · " : ""}${tok.desc || ""}</span>` +
            `</div>`;
        }
        boostHtml += `</div></div>`;
      }
      boostEl.innerHTML = boostHtml;
      boostEl.querySelectorAll("[data-xp-token]").forEach(el => {
        el.onclick = () => {
          const tok = BH.SHOP.xpTokens.find(t => t.id === el.dataset.xpToken);
          if (!tok) return;
          const tokPrice = sp(tok.price);
          this.updateShopPreview({
            preview: tok.icon || "⚡",
            previewStyle: "font-size:32px;color:#39c5ff",
            name: tok.name,
            price: tokPrice,
            owned: false,
            equipped: false,
          });
          if (d.credits < tokPrice) { BH.audio.empty(); return; }
          d.credits -= tokPrice;
          BH.BpXpTokens.grant(d, tok.area, tok.tier, 1);
          BH.Progress.save();
          BH.audio.buy();
          if (BH.UI) BH.UI.toast(tok.name + " gekauft ✔", "success");
          this.renderShop();
          this.renderTopbar();
        };
      });
    }

    const cratesHint = document.getElementById("shop-crates-hint");
    if (cratesHint && BH.SeasonRelease && BH.SeasonRelease.isEarlyAccess()) {
      cratesHint.textContent = BH.SeasonRelease.earlyAccessNotice() + " · Event-Kisten · ℹ Drop-Raten · Öffnen über 📦 KISTEN";
    }
    this.applyShopFilter();
    this._updateShopContentHead();
  }

  /* =============== BATTLE PASS =============== */
  _applyBpTab(tab) {
    this._bpTab = tab;
    document.querySelectorAll(".bp2-tab[data-bp-tab]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.bpTab === tab);
    });
    document.querySelectorAll(".bp2-panel[data-bp-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.bpPanel === tab);
    });
  }

  updateEventPassHomeWidget(d) {
    if (!BH.EventPass) return;
    d = d || BH.Progress.data;
    BH.EventPass.ensure(d);
    const card = document.querySelector(".hw-eventpass");
    const timerEl = document.getElementById("hw-ep-timer");
    const tierEl = document.getElementById("hw-ep-tier");
    const textEl = document.getElementById("hw-ep-text");
    const fillEl = document.getElementById("hw-ep-fill");
    if (!card) return;
    const active = BH.EventPass.isActive();
    card.classList.toggle("hidden", !active && BH.EventPass.isEnded());
    if (!active && !BH.EventPass.isEnded()) {
      if (timerEl) timerEl.textContent = "Startet bald";
      return;
    }
    const cd = BH.EventPass.countdown();
    if (timerEl) timerEl.textContent = BH.EventPass.formatCountdown(cd);
    const tier = BH.EventPass.getTier(d);
    const xp = BH.EventPass.xpInTier(d);
    const pending = BH.EventPass.pendingCount(d);
    if (tierEl) tierEl.textContent = "Stufe " + tier + " / " + BH.EventPass.TIERS;
    if (textEl) {
      if (BH.EventPass.isEnded()) {
        textEl.textContent = "Event beendet · Belohnungen einsammeln";
      } else if (pending > 0) {
        textEl.textContent = pending + " offen · Tag " + BH.EventPass.currentDay() + " →";
      } else {
        textEl.textContent = "Tag " + BH.EventPass.currentDay() + " · " + Math.round(xp.current) + " / " + xp.need + " Sterne";
      }
    }
    if (fillEl) {
      fillEl.style.width = xp.done ? "100%" : Math.min(100, (xp.current / Math.max(1, xp.need)) * 100) + "%";
    }
  }

  startEventPassTimer() {
    if (this._epTimer) clearInterval(this._epTimer);
    const tick = () => {
      if (this.currentScreen !== "eventpass" && this.currentScreen !== "home") return;
      this.updateEventPassCountdown();
      if (this.currentScreen === "home") this.updateEventPassHomeWidget(BH.Progress.data);
    };
    tick();
    this._epTimer = setInterval(tick, 1000);
  }

  updateEventPassCountdown() {
    if (!BH.EventPass) return;
    const el = document.getElementById("ep-countdown-val");
    if (!el) return;
    el.textContent = BH.EventPass.formatCountdown(BH.EventPass.countdown());
  }

  _bindEpTabsOnce() {
    if (this._epTabsBound) return;
    this._epTabsBound = true;
    document.querySelectorAll(".ep-tab[data-ep-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        BH.audio.click();
        const tab = btn.dataset.epTab;
        document.querySelectorAll(".ep-tab[data-ep-tab]").forEach(b =>
          b.classList.toggle("active", b.dataset.epTab === tab));
        document.querySelectorAll(".ep-panel[data-ep-panel]").forEach(p =>
          p.classList.toggle("active", p.dataset.epPanel === tab));
        if (tab === "missions") this.renderEventPassMissions();
        if (tab === "rewards") this.renderEventPassTrack();
      });
    });
    const claimAll = document.getElementById("ep-claim-all");
    if (claimAll && !claimAll._bound) {
      claimAll._bound = true;
      claimAll.addEventListener("click", () => {
        BH.audio.click();
        const d = BH.Progress.data;
        let count = 0;
        for (const m of (BH.EventPass.MISSIONS || [])) {
          const res = BH.EventPass.claimMission(d, m.id);
          if (res.ok) count++;
        }
        const tr = BH.EventPass.claimAllTiers(d);
        count += tr.count || 0;
        if (count > 0) {
          BH.audio.buy();
          if (BH.UI) BH.UI.toast(count + " Belohnung(en) eingesammelt ✔", "success");
          this.renderEventPass();
          this.renderTopbar();
          this.renderHome();
        } else BH.audio.empty();
      });
    }
  }

  _epRewardHtml(reward, state, tier) {
    if (!reward && state === "empty") {
      return `<div class="ep-reward empty"><span class="ep-rw-icon">—</span><span class="ep-rw-name">—</span></div>`;
    }
    if (!reward) return "";
    let action = "";
    if (state === "claimable") {
      action = `<button type="button" class="btn ep-claim-btn" data-ep-claim="${tier}">EINSAMMELN</button>`;
    } else if (state === "claimed") {
      action = `<span class="ep-claimed">✔</span>`;
    } else if (state === "locked") {
      action = `<span class="ep-locked">🔒</span>`;
    }
    const cap = [10, 25, 50].includes(tier) ? " capstone" : "";
    return (
      `<div class="ep-reward ${state}${cap}">` +
      `<span class="ep-rw-icon">${reward.icon || "🎁"}</span>` +
      `<span class="ep-rw-name">${reward.name}</span>` +
      action +
      `</div>`
    );
  }

  renderEventPassTrack() {
    const d = BH.Progress.data;
    const el = document.getElementById("ep-track");
    if (!el || !BH.EventPass) return;
    BH.EventPass.ensure(d);
    const tier = BH.EventPass.getTier(d);
    let html = "";
    for (let t = 1; t <= BH.EventPass.TIERS; t++) {
      const state = BH.EventPass.tierState(d, t);
      const reward = BH.EventPass.getReward(t);
      const isCurrent = t === tier + 1 || (t === tier && state === "claimable");
      const isCap = [10, 25, 50].includes(t);
      html +=
        `<div class="ep-col${isCurrent ? " current" : ""}${t <= tier ? " unlocked" : ""}${isCap ? " capstone" : ""}" data-ep-tier="${t}">` +
        `<div class="ep-col-num">${t <= tier ? "✔" : t}</div>` +
        this._epRewardHtml(reward, state === "empty" ? "empty" : state, t) +
        `</div>`;
    }
    el.innerHTML = html;
    el.querySelectorAll("[data-ep-claim]").forEach(btn => {
      btn.onclick = () => {
        const res = BH.EventPass.claimTier(d, parseInt(btn.dataset.epClaim, 10));
        if (res.ok) {
          BH.audio.buy();
          if (BH.UI) BH.UI.toast((res.reward.name || "Belohnung") + " erhalten ✔", "success");
          this.renderEventPass();
          this.renderTopbar();
          this.renderHome();
        } else BH.audio.empty();
      };
    });
  }

  renderEventPassMissions() {
    const d = BH.Progress.data;
    const el = document.getElementById("ep-missions");
    if (!el || !BH.EventPass) return;
    BH.EventPass.ensure(d);
    const today = BH.EventPass.currentDay();
    const sorted = [...(BH.EventPass.MISSIONS || [])].sort((a, b) => {
      if (a.day === today) return -1;
      if (b.day === today) return 1;
      return b.day - a.day;
    });
    el.innerHTML = sorted.map(m => {
      const st = BH.EventPass.missionStatus(d, m);
      const pct = Math.min(100, (st.prog / st.target) * 100);
      const isToday = m.day === today;
      let lockNote = "";
      if (!st.unlocked) {
        lockNote = st.daysUntil === 1
          ? "Morgen freigeschaltet"
          : "In " + st.daysUntil + " Tagen";
      }
      return (
        `<div class="ep-mission${st.claimed ? " done" : ""}${st.claimable ? " claimable" : ""}${isToday ? " today" : ""}${!st.unlocked ? " locked-day" : ""}">` +
        `<div class="ep-m-day">TAG ${m.day}${isToday ? " · HEUTE" : ""}</div>` +
        `<div class="ep-m-icon">${st.unlocked ? m.icon : "🔒"}</div>` +
        `<div class="ep-m-body">` +
        `<div class="ep-m-label">${m.label}</div>` +
        `<div class="ep-m-desc">${m.desc} · +${m.xp} ★</div>` +
        (st.unlocked
          ? `<div class="xp-bar"><div style="width:${st.claimed ? 100 : pct}%"></div></div>` +
            `<div class="ep-m-prog">${st.claimed ? "Abgeholt ✔" : st.prog + " / " + st.target}</div>`
          : `<div class="ep-m-locknote">${lockNote}</div>`) +
        `</div>` +
        (st.claimable
          ? `<button type="button" class="btn btn-primary ep-m-claim" data-ep-mission="${m.id}">HOLEN</button>`
          : st.claimed
            ? `<span class="ep-m-done">✔</span>`
            : `<span class="ep-m-lock">${st.unlocked ? "—" : "🔒"}</span>`) +
        `</div>`
      );
    }).join("");

    el.querySelectorAll("[data-ep-mission]").forEach(btn => {
      btn.onclick = () => {
        const res = BH.EventPass.claimMission(d, btn.dataset.epMission);
        if (res.ok) {
          BH.audio.buy();
          if (BH.UI) BH.UI.toast("+" + res.xp + " Event-Sterne · " + res.mission.label, "success");
          this.renderEventPass();
          this.renderHome();
        } else BH.audio.empty();
      };
    });
  }

  renderEventPass() {
    if (!BH.EventPass) return;
    const d = BH.Progress.data;
    BH.EventPass.ensure(d);
    this._bindEpTabsOnce();
    this.startEventPassTimer();

    const hero = document.getElementById("ep-hero");
    if (hero) hero.style.setProperty("--ep-accent", BH.EventPass.ACCENT);

    const tier = BH.EventPass.getTier(d);
    const xp = BH.EventPass.xpInTier(d);
    const pending = BH.EventPass.pendingCount(d);
    const day = BH.EventPass.currentDay();

    const tierNum = document.getElementById("ep-tier-num");
    const xpFill = document.getElementById("ep-xp-fill");
    const xpText = document.getElementById("ep-xp-text");
    const dayInfo = document.getElementById("ep-day-info");
    const badge = document.getElementById("ep-pending-badge");

    if (tierNum) tierNum.textContent = String(tier);
    if (xpFill) {
      xpFill.style.width = xp.done ? "100%" : Math.min(100, xp.current / Math.max(1, xp.need) * 100) + "%";
    }
    if (xpText) {
      xpText.textContent = xp.done
        ? (d.eventPass.xp || 0).toLocaleString("de-DE") + " ★ · Pass voll"
        : xp.current.toLocaleString("de-DE") + " / " + xp.need.toLocaleString("de-DE") + " ★ · Stufe " + (xp.nextTier || tier + 1);
    }
    if (dayInfo) {
      dayInfo.textContent = BH.EventPass.isEnded()
        ? "Event beendet · letzte Belohnungen einsammeln"
        : "Tag " + day + " / " + BH.EventPass.totalDays() + " · " + ((BH.EventPass.MISSIONS || []).find(m => m.day === day)?.label?.replace(/^Tag \d+ · /, "") || "Aufgabe aktiv");
    }
    if (badge) {
      if (pending > 0) {
        badge.classList.remove("hidden");
        badge.textContent = pending + " offen";
      } else {
        badge.classList.add("hidden");
      }
    }

    this.updateEventPassCountdown();
    this.renderEventPassMissions();
    this.renderEventPassTrack();
  }

  _bindBpTabsOnce() {
    if (this._bpTabsBound) return;
    this._bpTabsBound = true;
    document.querySelectorAll(".bp2-tab[data-bp-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        BH.audio.click();
        this._applyBpTab(btn.dataset.bpTab);
        if (btn.dataset.bpTab === "missions") this.renderBattlepassMissions();
      });
    });
  }

  _bpRewardHtml(reward, track, state, tier) {
    const t = BH.I18n ? k => BH.I18n.t(k) : k => k;
    if (!reward && state === "empty") {
      return (
        `<div class="bp2-reward ${track} empty">` +
        `<span class="bp2-rw-icon">—</span>` +
        `<span class="bp2-rw-name">—</span>` +
        `</div>`
      );
    }
    if (!reward) return "";
    let name = reward.name;
    let icon = reward.icon || "🎁";
    if (reward.type === "finisher" && BH.BpFinishers && !BH.BpFinishers.isAvailable()) {
      name = "Premium-Belohnung";
      icon = "🔒";
    }
    if (state === "needs-pass" && track === "premium") icon = "🔒";
    const cap = [10, 15, 25, 40, 50].includes(tier) ? " capstone" : "";
    let action = "";
    if (state === "claimable" && !(reward.type === "finisher" && BH.BpFinishers && !BH.BpFinishers.isAvailable())) {
      action = `<button type="button" class="btn bp2-claim-btn" data-bp-claim="${tier}" data-bp-track="${track}">${t("btn_claim")}</button>`;
    } else if (state === "claimed") {
      action = `<span class="bp2-claimed">✔</span>`;
    } else if (state === "needs-pass") {
      action = `<span class="bp2-locked">${t("prem_track")}</span>`;
    } else if (reward.type === "finisher" && BH.BpFinishers && !BH.BpFinishers.isAvailable()) {
      action = `<span class="bp2-locked">S2</span>`;
    }
    return (
      `<div class="bp2-reward ${track} ${state}${cap}">` +
      `<span class="bp2-rw-icon">${icon}</span>` +
      `<span class="bp2-rw-name">${name}</span>` +
      action +
      `</div>`
    );
  }

  _bpTierTrackHtml(d, bp, tier, track) {
    let html = "";
    for (let t = 1; t <= bp.tiers; t++) {
      const row = bp.rewards[t - 1];
      if (!row) continue;
      const state = BH.BattlePass.rewardState(d, t, track);
      const reward = track === "free" ? row.free : row.premium;
      const isCurrent = t === tier + 1 || (t === tier && state === "claimable");
      const isCap = [10, 25, 40, 50].includes(t);
      html +=
        `<div class="bp2-col${isCurrent ? " current" : ""}${t <= tier ? " unlocked" : ""}${isCap ? " capstone" : ""}" data-bp-tier="${t}">` +
        `<div class="bp2-col-num">${t <= tier ? "✔" : t}</div>` +
        this._bpRewardHtml(reward, track, state, t) +
        `</div>`;
    }
    return html;
  }

  _bindBpClaimButtons(root) {
    if (!root) return;
    root.querySelectorAll("[data-bp-claim]").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const d = BH.Progress.data;
        const res = BH.BattlePass.claim(d, parseInt(btn.dataset.bpClaim, 10), btn.dataset.bpTrack);
        if (res.ok) {
          BH.audio.buy();
          if (BH.UI) BH.UI.toast(res.reward.name + " erhalten ✔", "success");
          this.renderBattlepass();
          this.renderTopbar();
          this.renderHome();
        } else BH.audio.empty();
      };
    });
  }

  renderBattlepassTokens(d) {
    const el = document.getElementById("bp2-tokens");
    if (!el || !BH.BpXpTokens) return;
    BH.BpXpTokens.ensure(d);
    const inClan = BH.BpXpTokens.hasClan(d);
    const actives = BH.BpXpTokens.activeList(d);
    const collapsed = this._bpBoostCollapsed !== false;

    let html =
      `<div class="bp2-tokens-head">` +
      `<button type="button" class="bp2-tokens-toggle" id="bp2-boost-toggle" aria-expanded="${!collapsed}">` +
      `<span class="bp2-tokens-title">⚡ BOOSTER</span>` +
      `<span class="bp2-tokens-chevron">${collapsed ? "▸" : "▾"}</span>` +
      `</button>` +
      `<span class="bp2-tokens-hint">${BH.BpXpTokens.activationHint(d)}</span>` +
      `</div>`;

    if (actives.length) {
      html += `<div class="bp2-boost-active-list">`;
      for (const active of actives) {
        html +=
          `<span class="bp2-boost-pill" data-boost-area="${active.area}">` +
          `${active.areaIcon} ${active.label} ` +
          `<b class="bp2-boost-timer" data-boost-area="${active.area}">` +
          `${BH.BpXpTokens.formatRemaining(active.remainingMs)}</b>` +
          `</span>`;
      }
      html += `</div>`;
    }

    html += `<div class="bp2-boost-compact${collapsed ? " collapsed" : ""}" id="bp2-boost-body">`;
    for (const area of BH.BpXpTokens.AREAS) {
      const areaActive = BH.BpXpTokens.isActive(d, area.id);
      const canUse = BH.BpXpTokens.canActivate(d, area.id);
      const clanHint = area.needsClan && !inClan ? " · Clan nötig" : "";
      html +=
        `<div class="bp2-boost-row bp2-boost-${area.id}">` +
        `<span class="bp2-boost-row-label" title="${area.activateLabel}${clanHint}">` +
        `${area.icon} ${area.name}${clanHint}` +
        `</span>` +
        `<div class="bp2-boost-btns">`;
      for (const t of BH.BpXpTokens.TIERS) {
        const count = BH.BpXpTokens.count(d, area.id, t.id);
        const disabled = count < 1 || areaActive || !canUse;
        const short = t.id === "60" ? "1h" : t.short;
        html +=
          `<button type="button" class="bp2-boost-btn${disabled ? " disabled" : ""}"` +
          ` data-bp-area="${area.id}" data-bp-token="${t.id}"` +
          ` title="${area.name} · ${t.label} · ${count} im Besitz"` +
          (disabled ? " disabled" : "") + `>${short}${count ? "·" + count : ""}</button>`;
      }
      html += `</div></div>`;
    }
    html += `</div>`;
    el.innerHTML = html;

    const toggle = document.getElementById("bp2-boost-toggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        BH.audio.click();
        this._bpBoostCollapsed = !this._bpBoostCollapsed;
        this.renderBattlepassTokens(d);
      });
    }

    el.querySelectorAll("[data-bp-area][data-bp-token]").forEach(btn => {
      btn.onclick = () => {
        const res = BH.BpXpTokens.activate(d, btn.dataset.bpArea, btn.dataset.bpToken);
        if (res.ok) {
          BH.audio.buy();
          BH.Progress.save();
          this._bpBoostCollapsed = false;
          if (BH.UI) BH.UI.toast("2× " + res.areaName + " · " + res.label, "success");
          this.renderBattlepass();
          this.renderHome();
        } else if (res.error === "active") {
          BH.audio.empty();
          if (BH.UI) BH.UI.toast("Booster in diesem Bereich läuft bereits", "error");
        } else if (res.error === "clan") {
          BH.audio.empty();
          if (BH.UI) BH.UI.toast("Clan-Booster · erst Clan beitreten", "warn");
        } else if (res.error === "empty") {
          BH.audio.empty();
          if (BH.UI) BH.UI.toast("Kein Token für diesen Bereich", "error");
        } else BH.audio.empty();
      };
    });

    if (this._bpTokenTimer) clearInterval(this._bpTokenTimer);
    this._bpTokenTimer = null;
    if (actives.length && this.currentScreen === "battlepass") {
      this._bpTokenTimer = setInterval(() => {
        if (this.currentScreen !== "battlepass") {
          clearInterval(this._bpTokenTimer);
          this._bpTokenTimer = null;
          return;
        }
        const list = BH.BpXpTokens.activeList(d);
        if (!list.length) {
          clearInterval(this._bpTokenTimer);
          this._bpTokenTimer = null;
          this.renderBattlepassTokens(d);
          return;
        }
        for (const info of list) {
          const timerEl = el.querySelector(`.bp2-boost-timer[data-boost-area="${info.area}"]`);
          if (timerEl) timerEl.textContent = BH.BpXpTokens.formatRemaining(info.remainingMs);
        }
      }, 1000);
    }
  }

  renderBattlepassMissions() {
    const d = BH.Progress.data;
    if (!BH.BattlePass) return;
    BH.BattlePass.ensure(d);

    const dailyReset = document.getElementById("bp2-daily-reset");
    const weeklyReset = document.getElementById("bp2-weekly-reset");
    const seasonReset = document.getElementById("bp2-season-reset");
    if (dailyReset) dailyReset.textContent = BH.BattlePass.dailyResetLabel();
    if (weeklyReset) weeklyReset.textContent = BH.BattlePass.weeklyResetLabel();
    if (seasonReset) seasonReset.textContent = BH.BattlePass.seasonResetLabel(d);

    const dailyEl = document.getElementById("bp2-missions-daily");
    const weeklyEl = document.getElementById("bp2-missions-weekly");
    const seasonEl = document.getElementById("bp2-missions-season");
    if (dailyEl) {
      dailyEl.innerHTML = BH.BattlePass.getDailyMissions().map(m =>
        this._bpMissionHtml(m, BH.BattlePass.dailyMissionStatus(d, m), "daily")
      ).join("");
    }
    if (weeklyEl) {
      weeklyEl.innerHTML = BH.BattlePass.WEEKLY.map(m =>
        this._bpMissionHtml(m, BH.BattlePass.missionStatus(d, m), "weekly")
      ).join("");
    }
    if (seasonEl) {
      seasonEl.innerHTML = BH.BattlePass.getSeasonMissions(d).map(m =>
        this._bpMissionHtml(m, BH.BattlePass.seasonMissionStatus(d, m), "season")
      ).join("");
    }

    const missionRoot = document.getElementById("screen-battlepass") || document;
    missionRoot.querySelectorAll("[data-bp-mission]").forEach(btn => {
      btn.onclick = () => {
        const scope = btn.dataset.bpScope || "weekly";
        const res = scope === "daily"
          ? BH.BattlePass.claimDailyMission(d, btn.dataset.bpMission)
          : scope === "season"
            ? BH.BattlePass.claimSeasonMission(d, btn.dataset.bpMission)
            : BH.BattlePass.claimMission(d, btn.dataset.bpMission);
        if (res.ok) {
          BH.audio.buy();
          let toast = res.mission.label + ": ";
          if (res.xp) toast += "+" + res.xp + " Saison-XP";
          if (res.credits) toast += (res.xp ? " · " : "") + "+" + res.credits + " ⛁";
          if (res.seasonBonus > 0) toast += " (+" + res.seasonBonus + " Boost)";
          if (BH.UI) BH.UI.toast(toast, "success");
          this.renderBattlepass();
          this.renderTopbar();
        } else BH.audio.empty();
      };
    });
  }

  _bpMissionHtml(m, st, scope) {
    const t = BH.I18n ? k => BH.I18n.t(k) : k => k;
    const pct = Math.min(100, (st.prog / st.target) * 100);
    const rewards = (BH.BattlePass.missionRewards(m) || []).map(r =>
      `<span class="bp2-m-reward"><span class="bp2-m-reward-icon">${r.icon}</span>${r.text}</span>`
    ).join("");
    const scopeCls = scope === "season" ? " season" : "";
    return (
      `<div class="bp2-mission${scopeCls}${st.claimed ? " done" : ""}${st.claimable ? " claimable" : ""}">` +
      `<div class="bp2-m-icon">${m.icon}</div>` +
      `<div class="bp2-m-body">` +
        `<div class="bp2-m-label">${m.label}</div>` +
        `<div class="bp2-m-desc">${m.desc}</div>` +
        `<div class="bp2-m-rewards">${rewards}</div>` +
        `<div class="xp-bar"><div style="width:${st.claimed ? 100 : pct}%"></div></div>` +
        `<div class="bp2-m-prog">${st.claimed ? t("claimed_ok") : st.prog + " / " + st.target}</div>` +
      `</div>` +
      (st.claimable
        ? `<button type="button" class="btn btn-primary bp2-m-claim" data-bp-scope="${scope}" data-bp-mission="${m.id}">${t("btn_collect")}</button>`
        : st.claimed
          ? `<span class="bp2-m-done">✔</span>`
          : `<span class="bp2-m-lock">—</span>`) +
      `</div>`
    );
  }

  renderBattlepass() {
    const d = BH.Progress.data;
    if (!BH.BattlePass) return;
    BH.BattlePass.ensure(d);
    this._bindBpTabsOnce();

    const season = BH.BattlePass.effectiveSeason(d);
    const bp = BH.BattlePass.getDef(season);
    const tier = BH.BattlePass.getTier(d);
    const xp = BH.BattlePass.xpInTier(d);
    const pending = BH.BattlePass.pendingCount(d);

    const hero = document.getElementById("bp2-hero");
    if (hero) hero.style.setProperty("--bp-accent", bp.accent || "#ff7a00");

    const tagEl = document.getElementById("bp2-season-tag");
    const titleEl = document.getElementById("bp2-title");
    const taglineEl = document.getElementById("bp2-tagline");
    if (tagEl) tagEl.textContent = "SAISON " + season + (season === 2 ? " · SCHWARZER HORIZONT" : " · ASCHEFRONT");
    if (titleEl) titleEl.textContent = bp.name;
    if (taglineEl) {
      taglineEl.textContent = season === 2
        ? (bp.tagline || ("Battle Pass · " + bp.tiers + " Stufen"))
        : (BH.SeasonRelease && BH.SeasonRelease.isEarlyAccess()
          ? BH.SeasonRelease.earlyAccessNotice()
          : (bp.tagline || ("Battle Pass · " + bp.tiers + " Stufen")));
    }

    const tierNum = document.getElementById("bp2-tier-num");
    const xpFill = document.getElementById("bp2-xp-fill");
    const xpText = document.getElementById("bp2-xp-text");
    if (tierNum) tierNum.textContent = String(tier);
    if (xpFill) {
      xpFill.style.width = xp.done ? "100%" : Math.min(100, xp.current / xp.need * 100) + "%";
    }
    if (xpText) {
      if (xp.isOverflow) {
        xpText.textContent =
          xp.current.toLocaleString("de-DE") + " / " + xp.need.toLocaleString("de-DE") +
          " XP · Bonus-Stufe " + (xp.overflowNext || tier + 1);
      } else {
        xpText.textContent =
          xp.current.toLocaleString("de-DE") + " / " + xp.need.toLocaleString("de-DE") +
          " XP · Stufe " + (tier + 1) + " / " + bp.tiers;
      }
    }

    const premBtn = document.getElementById("bp2-premium-btn");
    const claimAll = document.getElementById("bp2-claim-all");
    const badge = document.getElementById("bp2-pending-badge");
    const price = bp.premiumPrice || 2200;
    const premCost = BH.ShopEconomy ? BH.ShopEconomy.bpPremiumPrice(bp, d) : price;
    const t = BH.I18n ? k => BH.I18n.t(k) : k => k;
    const fmt = BH.I18n ? n => BH.I18n.fmt(n) : n => Number(n).toLocaleString("de-DE");

    if (premBtn) {
      if (d.premiumPass) {
        premBtn.textContent = t("premium_active");
        premBtn.classList.add("active");
        premBtn.disabled = true;
      } else {
        premBtn.textContent = t("premium_pass") + " · " + fmt(premCost) + " ⛁";
        premBtn.classList.remove("active");
        premBtn.disabled = false;
        premBtn.onclick = () => {
          const res = BH.BattlePass.buyPremium(d);
          if (res.ok) {
            BH.audio.buy();
            if (BH.UI) BH.UI.toast("Premium Pass freigeschaltet ✔", "success");
            this.renderBattlepass();
            this.renderTopbar();
          } else {
            BH.audio.empty();
            if (BH.UI) BH.UI.toast("Zu wenig Credits — du brauchst " + premCost.toLocaleString("de-DE") + " ⛁", "error");
          }
        };
      }
    }

    const bindSkip = (id, count) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const price = BH.BattlePass.tierSkipPrice(d, count);
      btn.textContent = (count === 1 ? t("tier_buy_1") : t("tier_buy_5")) + " · " + fmt(price) + " ⛁";
      btn.disabled = price <= 0;
      btn.onclick = () => {
        const need = BH.BattlePass.tierSkipPrice(d, count);
        if ((d.credits || 0) < need) {
          BH.audio.empty();
          if (BH.UI) BH.UI.toast("Zu wenig Credits — du brauchst " + need.toLocaleString("de-DE") + " ⛁", "error");
          return;
        }
        const label = count === 1 ? "1 Stufe" : count + " Stufen";
        if (!confirm(label + " für " + need.toLocaleString("de-DE") + " ⛁ kaufen?\n\nDu springst im Battle Pass sofort weiter.")) {
          return;
        }
        const res = BH.BattlePass.buyTierSkip(d, count);
        if (res.ok) {
          BH.audio.buy();
          if (BH.UI) {
            BH.UI.toast(
              "Stufe " + res.tierBefore + " → " + res.tierAfter + " · −" + res.price.toLocaleString("de-DE") + " ⛁",
              "success"
            );
          }
          this.renderBattlepass();
          this.renderTopbar();
          this.renderHome();
        } else {
          BH.audio.empty();
          if (BH.UI && res.reason === "credits") {
            BH.UI.toast("Zu wenig Credits — du brauchst " + res.need.toLocaleString("de-DE") + " ⛁", "error");
          }
        }
      };
    };
    bindSkip("bp2-skip-btn", 1);
    bindSkip("bp2-skip5-btn", 5);

    if (claimAll) {
      claimAll.disabled = pending === 0;
      claimAll.textContent = pending > 0 ? t("btn_claim_all") + " (" + pending + ")" : t("btn_none_open");
      claimAll.onclick = () => {
        const res = BH.BattlePass.claimAll(d);
        if (res.count > 0) {
          BH.audio.buy();
          if (BH.UI) BH.UI.toast(res.count + " Belohnung(en) erhalten ✔", "success");
          this.renderBattlepass();
          this.renderTopbar();
          this.renderHome();
        } else BH.audio.empty();
      };
    }

    if (badge) {
      if (pending > 0) {
        badge.textContent = pending + " offen";
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    }

    const trackFree = document.getElementById("bp2-track-free");
    const trackPrem = document.getElementById("bp2-track-prem");
    const scrollEl = document.getElementById("bp2-track-scroll");
    if (trackFree && trackPrem) {
      trackFree.innerHTML = this._bpTierTrackHtml(d, bp, tier, "free");
      trackPrem.innerHTML = this._bpTierTrackHtml(d, bp, tier, "premium");
      const wrap = trackFree.closest(".bp2-tracks-sync");
      this._bindBpClaimButtons(wrap || trackFree.parentElement);

      const curTier = Math.max(1, Math.min(tier, bp.tiers));
      const curCol = trackFree.querySelector(".bp2-col.current") ||
        trackFree.querySelector(`.bp2-col[data-bp-tier="${curTier}"]`);
      if (curCol && scrollEl) {
        requestAnimationFrame(() => {
          const left = curCol.offsetLeft - scrollEl.clientWidth / 2 + curCol.clientWidth / 2;
          scrollEl.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
        });
      }
    }

    const ovEl = document.getElementById("bp2-overflow");
    if (ovEl) {
      const ovLevel = BH.BattlePass.overflowLevel(d);
      const ovCredits = bp.overflowCredits || 90;
      const ovDiamonds = bp.overflowDiamonds || 2;
      const ovPending = BH.BattlePass.overflowPending(d);
      if (tier >= bp.tiers || ovLevel > 0) {
        let ovHtml =
          `<div class="bp2-overflow-head">` +
          `<span class="bp2-overflow-title">Bonus ab Stufe ${bp.tiers + 1}</span>` +
          `<span class="bp2-overflow-sub">Gratis ${ovCredits.toLocaleString("de-DE")} ⛁ · Premium ${ovDiamonds} 💎 je Level</span>` +
          `</div>`;
        if (tier >= bp.tiers) {
          ovHtml +=
            `<div class="bp2-overflow-stats">` +
            `<span>Aktuell: Stufe <b>${tier}</b></span>` +
            (ovLevel > 0 ? `<span>Bonus-Level: <b>${ovLevel}</b></span>` : "") +
            (ovPending > 0 ? `<span class="bp2-overflow-pending">${ovPending} offen</span>` : "") +
            `</div>`;
        }
        if (ovPending > 0) {
          ovHtml +=
            `<button type="button" class="btn btn-primary bp2-overflow-claim" id="bp2-overflow-claim">` +
            `Bonus einsammeln (${ovPending})` +
            `</button>`;
        } else if (tier >= bp.tiers) {
          ovHtml += `<p class="bp2-overflow-hint">Stufe ${bp.tiers} geschafft — weiterleveln für ⛁ und 💎.</p>`;
        }
        ovEl.innerHTML = ovHtml;
        ovEl.classList.remove("hidden");
        const ovClaim = document.getElementById("bp2-overflow-claim");
        if (ovClaim) {
          ovClaim.onclick = () => {
            const res = BH.BattlePass.claimOverflowAll(d);
            if (res.count > 0) {
              BH.audio.buy();
              if (BH.UI) BH.UI.toast(res.count + " Bonus-Belohnung(en) erhalten ✔", "success");
              this.renderBattlepass();
              this.renderTopbar();
              this.renderHome();
            } else BH.audio.empty();
          };
        }
      } else {
        ovEl.innerHTML = "";
        ovEl.classList.add("hidden");
      }
    }

    this.renderBattlepassTokens(d);
    this.renderBattlepassMissions();
    this._applyBpTab(this._bpTab || "rewards");
  }

  /* =============== RÄNGE & PRESTIGE =============== */
  applyRanksTab() {
    const tab = this._ranksTab || "prestige";
    document.querySelectorAll(".ranks-panel[data-ranks-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.ranksPanel === tab);
    });
    document.querySelectorAll(".ranks-tab[data-ranks-tab]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.ranksTab === tab);
    });
  }

  openPrestigeInfo(tier) {
    this._ranksInfoPrestige = tier;
    this._ranksTab = "info";
    this.applyRanksTab();
    this.renderPrestigeInfo();
  }

  renderPrestigeInfo() {
    const d = BH.Progress.data;
    const lvlInfo = BH.Progress.getLevel();
    const selected = this._ranksInfoPrestige != null
      ? this._ranksInfoPrestige
      : BH.Ranks.defaultInfoPrestige(d);
    const info = BH.Ranks.infoPrestigeTier(selected);
    const meta = info.meta || BH.PRESTIGE_TIERS[0];
    const isActiveCycle = ((d.prestige || 0) + 1 === selected && d.prestige < BH.MAX_PRESTIGE)
      || (selected === BH.MAX_PRESTIGE && d.prestige >= BH.MAX_PRESTIGE);

    const selectEl = document.getElementById("prestige-info-select");
    if (selectEl) {
      selectEl.innerHTML = BH.PRESTIGE_TIERS.map(tier => {
        const active = tier.tier === selected;
        const playerState = BH.Ranks.prestigeTierState(tier.tier, d, lvlInfo);
        return (
          `<button type="button" class="prestige-info-pill${active ? " active" : ""}${playerState === "done" ? " done" : ""}"` +
          ` data-prestige-info-pick="${tier.tier}" style="--pip-color:${tier.color}">` +
          `<span class="pip-icon">${tier.icon}${tier.tier}</span>` +
          `<span class="pip-name">${tier.name}</span>` +
          `</button>`
        );
      }).join("");

      if (!selectEl._bound) {
        selectEl._bound = true;
        selectEl.addEventListener("click", e => {
          const btn = e.target.closest("[data-prestige-info-pick]");
          if (!btn) return;
          BH.audio.click();
          this._ranksInfoPrestige = parseInt(btn.dataset.prestigeInfoPick, 10);
          this.renderPrestigeInfo();
        });
      }
    }

    const headEl = document.getElementById("prestige-info-head");
    if (headEl) {
      const cyclePrestige = info.cycleAt;
      const totalCycle = BH.Ranks.cycleCreditsTotal(cyclePrestige);
      const bonusPct = BH.Ranks.prestigeCreditBonusPct(cyclePrestige);
      const camoLine = info.camos.length
        ? info.camos.map(c => c.name).join(" · ")
        : "—";
      headEl.innerHTML =
        `<div class="pih-main" style="--pih-color:${meta.color}">` +
        `<div class="pih-title">${meta.icon} PRESTIGE ${meta.tier} · ${meta.name}</div>` +
        `<div class="pih-sub">${meta.subtitle}</div>` +
        `<div class="pih-row"><span class="pih-label">Zyklus</span><span class="pih-val">${info.cycleLabel}</span></div>` +
        `<div class="pih-row"><span class="pih-label">Credits-Bonus</span><span class="pih-val pih-gold">+${bonusPct} %${cyclePrestige > 0 ? " · ✪" + cyclePrestige : " · Basis"}</span></div>` +
        `<div class="pih-row"><span class="pih-label">100 Level · Credits gesamt</span><span class="pih-val pih-gold">${totalCycle.toLocaleString("de-DE")} ⛁</span></div>` +
        `<div class="pih-row"><span class="pih-label">Abschluss-Belohnung</span><span class="pih-val pih-gold">+${info.completionReward.credits.toLocaleString("de-DE")} ⛁</span></div>` +
        `<div class="pih-row"><span class="pih-label">Prestige-Tarnung</span><span class="pih-val">${camoLine}</span></div>` +
        (isActiveCycle
          ? `<div class="pih-active">▶ Dein aktueller Zyklus · Level ${lvlInfo.maxed ? BH.MAX_LEVEL : lvlInfo.level} / ${BH.MAX_LEVEL} · +${BH.Ranks.prestigeCreditBonusPct(d.prestige)} % Credits</div>`
          : `<div class="pih-note">ℹ Höheres Prestige = mehr ⛁ pro Level und stärkere Abschluss-Belohnung.</div>`) +
        `</div>`;
    }

    const gridEl = document.getElementById("prestige-info-grid");
    if (gridEl) {
      let gridHtml = "";
      for (let block = 0; block < 10; block++) {
        const start = block * 10 + 1;
        const end = start + 9;
        gridHtml +=
          `<div class="level-rewards-block lrb-info">` +
          `<div class="lrb-head">` +
          `<span class="lrb-range">Level ${start}–${end}</span>` +
          `</div>` +
          `<div class="lrb-grid">`;

        for (let l = start; l <= end; l++) {
          const entry = BH.Ranks.levelEntry(l, info.cycleAt);
          let stateClass = "info";
          if (isActiveCycle) {
            stateClass = BH.Ranks.levelCycleState(l, lvlInfo);
          }
          const tags = [
            entry.milestone ? `<span class="lrc-tag lrc-tag-milestone">★ Meilenstein</span>` : "",
            entry.rank ? `<span class="lrc-tag lrc-tag-rank">${entry.rankIcon || "🎖"} ${entry.rank}</span>` : "",
            entry.prestigeUnlock ? `<span class="lrc-tag lrc-tag-prestige">✪ Prestige</span>` : "",
          ].filter(Boolean).join("");

          gridHtml +=
            `<div class="lvl-reward-card ${stateClass}${entry.milestone ? " milestone" : ""}${entry.prestigeUnlock ? " prestige-lv" : ""}">` +
            `<div class="lrc-top">` +
            `<span class="lrc-lv">${l}</span>` +
            (isActiveCycle
              ? `<span class="lrc-status">${stateClass === "done" ? "✔" : stateClass === "next" ? "▶" : "🔒"}</span>`
              : `<span class="lrc-status lrc-info">ℹ</span>`) +
            `</div>` +
            `<div class="lrc-credits">+${entry.credits.toLocaleString("de-DE")} ⛁</div>` +
            (entry.xp > 0
              ? `<div class="lrc-xp">${entry.xp.toLocaleString("de-DE")} XP → Lv ${l + 1}</div>`
              : `<div class="lrc-xp lrc-xp-max">Lv ${l} · Zyklus-Ende</div>`) +
            (entry.bonus ? `<div class="lrc-bonus">${entry.bonus}</div>` : "") +
            (tags ? `<div class="lrc-tags">${tags}</div>` : "") +
            `</div>`;
        }
        gridHtml += `</div></div>`;
      }
      gridEl.innerHTML = gridHtml;
    }
  }

  renderRanks() {
    const d = BH.Progress.data;
    const lvlInfo = BH.Progress.getLevel();
    const lvl = lvlInfo.level;
    const display = BH.Ranks.displayRank(d);
    const xpPct = lvlInfo.maxed ? 100 : Math.min(100, lvlInfo.intoLevel / lvlInfo.needed * 100);
    const career = BH.Ranks.careerLevel(d);
    const nextPrem = BH.Ranks.nextPrestigeTier(d.prestige);
    const premReward = BH.Ranks.prestigeReward(d.prestige);

    const careerVal = document.getElementById("ranks-career-val");
    if (careerVal) careerVal.textContent = career.toLocaleString("de-DE");

    const headBadge = document.getElementById("ranks-head-badge");
    if (headBadge) {
      if (d.prestige >= BH.MAX_PRESTIGE && lvlInfo.maxed) {
        headBadge.textContent = "★ MAX";
        headBadge.className = "ranks-head-badge ranks-head-badge-max";
      } else if (d.prestige > 0) {
        headBadge.textContent = "✪" + d.prestige;
        headBadge.className = "ranks-head-badge";
        if (display.prestigeTier) headBadge.style.color = display.prestigeTier.color;
      } else {
        headBadge.textContent = "—";
        headBadge.className = "ranks-head-badge";
        headBadge.style.color = "";
      }
    }

    const heroCard = document.getElementById("ranks-hero-card");
    if (heroCard && display.prestigeTier) {
      heroCard.style.setProperty("--rank-accent", display.prestigeTier.color);
    } else if (heroCard) {
      heroCard.style.setProperty("--rank-accent", "#ff7a00");
    }

    const heroPrem = document.getElementById("ranks-hero-prestige");
    if (heroPrem) {
      if (display.prestigeTier) {
        heroPrem.innerHTML =
          `<span class="rhp-icon">${display.prestigeTier.icon}</span>` +
          `<span class="rhp-tier">PRESTIGE ${display.prestigeTier.tier}</span>` +
          `<span class="rhp-name">${display.prestigeTier.name}</span>`;
        heroPrem.classList.remove("hidden");
      } else {
        heroPrem.innerHTML = `<span class="rhp-name rhp-none">Erster Zyklus · Prestige ab Level 100</span>`;
        heroPrem.classList.remove("hidden");
      }
    }

    const curIcon = document.getElementById("ranks-current-icon");
    const curName = document.getElementById("ranks-current-name");
    const curTier = document.getElementById("ranks-current-tier");
    const curMeta = document.getElementById("ranks-current-meta");
    const cycleBadge = document.getElementById("ranks-cycle-badge");
    const xpFill = document.getElementById("ranks-xp-fill");
    const xpText = document.getElementById("ranks-xp-text");
    const premActions = document.getElementById("prestige-actions");

    if (curIcon) curIcon.textContent = display.icon || "🎖";
    if (curName) curName.textContent = display.label;
    if (curTier) {
      curTier.textContent = display.prestigeTier
        ? display.prestigeTier.subtitle
        : "Level-Zyklus " + (d.prestige + 1) + " von " + BH.MAX_PRESTIGE;
    }
    if (curMeta) {
      curMeta.textContent = "LEVEL " + lvl + " / " + BH.MAX_LEVEL +
        (lvlInfo.maxed ? " · MAX" : "");
    }
    if (cycleBadge) cycleBadge.textContent = BH.Ranks.cycleLabel(d.prestige);
    if (xpFill) xpFill.style.width = xpPct + "%";
    if (xpText) {
      xpText.textContent = lvlInfo.maxed
        ? (BH.Progress.canPrestige()
          ? "Level 100 erreicht · Prestige " + (d.prestige + 1) + " bereit"
          : "Maximallevel · Karriere abgeschlossen")
        : Math.round(lvlInfo.intoLevel) + " / " + lvlInfo.needed + " XP bis Level " + (lvl + 1);
    }

    if (premActions) {
      premActions.innerHTML = "";
      if (BH.Progress.canPrestige()) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-prestige";
        const tierName = nextPrem ? nextPrem.name : ("Prestige " + (d.prestige + 1));
        btn.textContent = "✪ " + tierName + " · AUFSTEIGEN";
        btn.addEventListener("click", () => {
          const res = BH.Progress.doPrestige();
          if (res) {
            BH.audio.objective();
            const tierLine = res.tier ? res.tier.name + " (" + res.tier.subtitle + ")" : "Prestige " + res.prestige;
            alert(
              "✪ PRESTIGE " + res.prestige + " — " + tierLine + "\n\n" +
              "+" + res.credits.toLocaleString("de-DE") + " ⛁ Credits\n" +
              "Level zurück auf 1 · Käufe, Skins & Statistiken bleiben erhalten."
            );
            this.renderRanks();
            this.renderHome();
            this.renderTopbar();
          }
        });
        premActions.appendChild(btn);
        const hint = document.createElement("div");
        hint.className = "ranks-prestige-reward-hint";
        hint.textContent = "+" + premReward.credits.toLocaleString("de-DE") + " ⛁ · Nächster Zyklus +"
          + BH.Ranks.prestigeCreditBonusPct(d.prestige + 1) + " % Credits";
        premActions.appendChild(hint);
      } else if (d.prestige >= BH.MAX_PRESTIGE && lvlInfo.maxed) {
        premActions.innerHTML = `<div class="ranks-prestige-max">★ MAX PRESTIGE · KARRIERE VOLLENDET</div>`;
      } else {
        premActions.innerHTML =
          `<div class="ranks-prestige-hint">Prestige ab Level ${BH.MAX_LEVEL} · ${BH.MAX_PRESTIGE} Stufen · +${BH.Ranks.prestigeCreditBonusPct(d.prestige)} % Credits · Abschluss +${BH.Ranks.prestigeReward(d.prestige).credits.toLocaleString("de-DE")} ⛁</div>`;
      }
    }

    const nr = document.getElementById("next-rewards");
    if (nr) {
      if (lvlInfo.maxed && BH.Progress.canPrestige()) {
        nr.innerHTML =
          `<div class="nr-row"><span class="nr-label">✪ ${nextPrem ? nextPrem.name : "Prestige " + (d.prestige + 1)}</span>` +
          `<span class="nr-credits">+${premReward.credits.toLocaleString("de-DE")} ⛁</span></div>` +
          `<div class="nr-row"><span class="nr-label">${nextPrem ? nextPrem.subtitle : "Neuer Zyklus"}</span>` +
          `<span class="nr-bonus">Level 1–100</span></div>` +
          `<div class="nr-row"><span class="nr-label">Prestige-Tarnung</span><span class="nr-bonus">Loadout</span></div>`;
      } else if (lvlInfo.maxed) {
        nr.innerHTML = `<div class="nr-row"><span class="nr-label">Karriere</span><span class="nr-bonus">${career} / ${BH.Ranks.maxCareerLevel()}</span></div>`;
      } else {
        let html = "";
        for (let l = lvl + 1; l <= Math.min(BH.MAX_LEVEL, lvl + 4); l++) {
          const r = BH.Progress.levelReward(l);
          const rankAt = BH.RANKS.find(x => x.level === l);
          html +=
            `<div class="nr-row">` +
            `<span class="nr-label">Level ${l}${l % 10 === 0 ? " ★" : ""}</span>` +
            `<span class="nr-val">` +
            (rankAt ? `<span class="nr-bonus">${rankAt.name}</span> ` : "") +
            (r.bonus ? `<span class="nr-bonus">${r.bonus}</span> ` : "") +
            `<span class="nr-credits">+${r.credits} ⛁</span>` +
            `</span></div>`;
        }
        nr.innerHTML = html;
      }
    }

    const premTrack = document.getElementById("prestige-track");
    if (premTrack) {
      premTrack.innerHTML = BH.PRESTIGE_TIERS.map(tier => {
        const state = BH.Ranks.prestigeTierState(tier.tier, d, lvlInfo);
        const reward = BH.Ranks.prestigeReward(tier.tier - 1);
        let progress = 0;
        if (state === "done") progress = 100;
        else if (state === "active") progress = lvlInfo.maxed ? 100 : Math.round((lvl / BH.MAX_LEVEL) * 100);

        return (
          `<div class="prestige-tier ${state}" style="--pt-color:${tier.color}">` +
          `<div class="pt-rail"><div class="pt-rail-fill" style="width:${progress}%"></div></div>` +
          `<div class="pt-node">${tier.icon}${tier.tier}</div>` +
          `<div class="pt-body">` +
          `<div class="pt-head"><span class="pt-name">${tier.name}</span>` +
          `<button type="button" class="pt-info-btn" data-prestige-info="${tier.tier}" title="100 Level · Info">ℹ</button>` +
          `<span class="pt-lv">${BH.MAX_LEVEL} LV</span></div>` +
          `<div class="pt-sub">${tier.subtitle}</div>` +
          `<div class="pt-meta">` +
          `<span class="pt-reward">+${reward.credits.toLocaleString("de-DE")} ⛁ · Lv +${BH.Ranks.prestigeCreditBonusPct(tier.tier - 1)} %</span>` +
          `<span class="pt-state">${state === "done" ? "✔ Abgeschlossen" : state === "active" ? "Level " + lvl + " / " + BH.MAX_LEVEL : "Gesperrt"}</span>` +
          `</div></div></div>`
        );
      }).join("");

      if (!premTrack._infoBound) {
        premTrack._infoBound = true;
        premTrack.addEventListener("click", e => {
          const btn = e.target.closest("[data-prestige-info]");
          if (!btn) return;
          e.stopPropagation();
          BH.audio.click();
          this.openPrestigeInfo(parseInt(btn.dataset.prestigeInfo, 10));
        });
      }
    }

    this.renderPrestigeInfo();

    const list = document.getElementById("rank-list");
    if (list) {
      list.innerHTML = "";
      const currentRank = BH.Progress.getRank();
      BH.RANKS.forEach((r, i) => {
        const next = BH.RANKS[i + 1];
        const rangeEnd = next ? next.level - 1 : BH.MAX_LEVEL;
        const range = r.level === rangeEnd ? `Lv ${r.level}` : `Lv ${r.level}–${rangeEnd}`;
        const isCurrent = r.level === currentRank.level;
        const isFuture = lvl < r.level;
        const isDone = !isFuture && !isCurrent;

        let progressPct = 0;
        if (isCurrent && !lvlInfo.maxed) {
          const span = (next ? next.level : BH.MAX_LEVEL + 1) - r.level;
          progressPct = span > 0
            ? Math.min(100, ((lvl - r.level) + lvlInfo.intoLevel / lvlInfo.needed) / span * 100)
            : 100;
        } else if (isDone && !isCurrent) {
          progressPct = 100;
        } else if (isCurrent && lvlInfo.maxed) {
          progressPct = 100;
        }

        const el = document.createElement("div");
        el.className = "rank-entry" +
          (isCurrent ? " current" : "") +
          (isFuture ? " future" : "") +
          (isDone && !isCurrent ? " done" : "");
        el.innerHTML =
          `<div class="re-lv">${r.level}</div>` +
          `<div class="re-icon">${r.icon}</div>` +
          `<div class="re-body">` +
            `<div class="re-name">${r.name}</div>` +
            `<div class="re-range">${range}</div>` +
            `<div class="re-bar"><div style="width:${progressPct}%"></div></div>` +
          `</div>` +
          `<div class="re-status">${isFuture ? "🔒" : isCurrent ? "▶" : "✔"}</div>`;
        list.appendChild(el);
      });
    }

    const statsPanel = document.getElementById("stats-panel");
    if (statsPanel) {
      const kd = d.deaths > 0 ? (d.kills / d.deaths).toFixed(2) : d.kills.toFixed(0);
      const pt = BH.Ranks.prestigeTier(d.prestige);
      statsPanel.innerHTML = [
        ["Karriere-Level", career + " / " + BH.Ranks.maxCareerLevel()],
        ["Level (Zyklus)", lvl + " / " + BH.MAX_LEVEL],
        ["Prestige", d.prestige > 0 ? "✪" + d.prestige + (pt ? " · " + pt.name : "") : "—"],
        ["Rang", display.name],
        ["Gesamt-XP", (d.xp || 0).toLocaleString("de-DE")],
        ["Kills", (d.kills || 0).toLocaleString("de-DE")],
        ["K/D", kd],
        ["Siege", (d.wins || 0).toLocaleString("de-DE")],
        ["Matches", (d.matches || 0).toLocaleString("de-DE")],
        ["Zombie-Kills", (d.zombieKills || 0).toLocaleString("de-DE")],
        ["Beste Runde", d.bestZombieRound || 0],
        ["Credits", "⛁ " + (d.credits || 0).toLocaleString("de-DE")],
      ].map(([label, val]) =>
        `<div class="stat-box"><div class="sb-val">${val}</div><div class="sb-label">${label}</div></div>`
      ).join("");
    }

    const lbPanel = document.getElementById("leaderboard-panel");
    if (lbPanel && BH.Leaderboard) {
      const top = BH.Leaderboard.top(10);
      lbPanel.innerHTML = top.length
        ? top.map((e, i) =>
          `<div class="lb-row${i === 0 ? " lb-top" : ""}">` +
          `<span class="lb-rank">#${i + 1}</span>` +
          `<span class="lb-name">${e.name}</span>` +
          `<span class="lb-stat">K/D ${e.kd.toFixed(2)}</span>` +
          `<span class="lb-stat">${e.kills} K</span>` +
          `</div>`
        ).join("")
        : `<div class="lb-empty">Noch keine Einträge – spiele ein Match!</div>`;
    }

    this.applyRanksTab();
  }
  /* =============== SPIELSTART / -ENDE =============== */
  startGame(modeId) {
    if (modeId === "clanmatch" && (!BH.ClanMatches || !BH.ClanMatches.canPlay(BH.Progress.data))) {
      BH.audio.empty();
      return;
    }
    if (BH.ModeMaintenance && BH.ModeMaintenance.isActive(modeId)) {
      BH.audio.empty();
      this.showMaintenanceNotice(modeId);
      return;
    }
    this.lastModeId = modeId;
    if (BH.LoadoutPresets) BH.LoadoutPresets.normalizeLoadout(this.loadout);
    else if (BH.Mastery) BH.Mastery.sanitizeLoadout(BH.Progress.data, this.loadout);
    BH.Progress.data.lastMode = modeId;
    BH.Progress.save();
    BH.audio.unlock();
    this._matchOperatorId = BH.Progress.data.operator;
    document.getElementById("menu-root").classList.add("hidden");
    document.getElementById("hud").classList.remove("hidden");
    document.getElementById("game-canvas").classList.add("bh-active");
    document.getElementById("points-display").classList.add("hidden");
    const showMini = !["campaign", "zombies", "training", "hardcore", "specops"].includes(modeId);
    document.getElementById("minimap").classList.toggle("hidden", !showMini);
    this.game = new BH.Game({
      modeId,
      loadout: this.loadout,
      onEnd: (result) => this.onGameEnd(result),
    });
    this.game.lock();
  }

  onGameEnd(result) {
    const endedGame = this.game;
    this.game = null;

    // Fortschritt verbuchen
    const d = BH.Progress.data;
    const dl = result.deltas || {};
    if (this.lastModeId === "clanmatch") dl.clanmatches = 1;
    if (BH.FactionWar && BH.FactionWar.countsForWar(this.lastModeId) && d.factionWar && d.factionWar.pledged) {
      dl.factionkills = (result.matchStats && result.matchStats.kills) || dl.kills || 0;
    }
    d.kills += dl.kills || 0;
    d.deaths += dl.deaths || 0;
    d.zombieKills += dl.zombieKills || 0;
    d.wins += dl.wins || 0;
    d.matches += dl.matches || 0;
    d.missionsCompleted += dl.missionsCompleted || 0;
    if (dl.bestZombieRound) d.bestZombieRound = Math.max(d.bestZombieRound, dl.bestZombieRound);
    const abortedEarly = /ABGEBROCHEN/i.test(result.title || "");
    if (BH.OperatorSkills && !abortedEarly && (dl.matches || 0) > 0) {
      const opId = this._matchOperatorId || d.operator || "recruit";
      const diaRes = BH.OperatorSkills.trackMatch(d, opId);
      if (diaRes) {
        const opName = BH.OperatorCatalog
          ? (BH.OperatorCatalog.find(opId, d) || {}).name
          : opId;
        if (diaRes.earned > 0) {
          result.xpBreakdown.push(["💎 Diamant · " + (opName || opId) + " · +1", 0]);
        } else {
          result.xpBreakdown.push([
            "💎 " + (opName || opId) + " · " + diaRes.matchProg + "/10 Matches",
            0,
          ]);
        }
      }
    }
    if (BH.ModeStats) BH.ModeStats.track(d, this.lastModeId, dl);
    if (result.matchStats && result.matchStats.headshots) {
      d.totalHeadshots = (d.totalHeadshots || 0) + result.matchStats.headshots;
    }

    let totalXp = 0;
    for (const [, xp] of result.xpBreakdown) totalXp += xp;
    if (this.lastModeId === "operation") {
      const opBonus = Math.round(totalXp * 0.25);
      if (opBonus > 0) {
        totalXp += opBonus;
        result.xpBreakdown.push(["Operations-Bonus (+25 %)", opBonus]);
      }
    } else if (this.lastModeId === "coopstrike") {
      const csBonus = Math.round(totalXp * 0.15);
      if (csBonus > 0) {
        totalXp += csBonus;
        result.xpBreakdown.push(["Co-op Bonus (+15 %)", csBonus]);
      }
    }
    const ltmMult = BH.LTM ? BH.LTM.xpMult(this.lastModeId) : 1;
    if (ltmMult > 1) {
      const ltmBonus = Math.round(totalXp * (ltmMult - 1));
      totalXp += ltmBonus;
      result.xpBreakdown.push(["LTM-Bonus", ltmBonus]);
    }
    const clanXpMult = BH.Social ? BH.Social.xpMult(d) : 1;
    if (clanXpMult > 1) {
      const clanBonus = Math.round(totalXp * (clanXpMult - 1));
      totalXp += clanBonus;
      result.xpBreakdown.push(["Clan-Bonus", clanBonus]);
    }
    const mapBeforeRotate = BH.Maps ? BH.Maps.getActiveMap() : null;
    let fwXpMult = BH.FactionWar ? BH.FactionWar.xpBonus(d) : 1;
    if (BH.FactionWar && mapBeforeRotate) {
      const terr = BH.FactionWar.territoryBonus(d, mapBeforeRotate.id);
      if (terr && terr.xp > 1) fwXpMult *= terr.xp;
    }
    if (fwXpMult > 1) {
      const fwXpBonus = Math.round(totalXp * (fwXpMult - 1));
      totalXp += fwXpBonus;
      result.xpBreakdown.push(["Fraktions-Bonus", fwXpBonus]);
    }
    if (BH.PremiumPlaytime) {
      const premXpMult = BH.PremiumPlaytime.xpMult(d);
      if (premXpMult > 1) {
        const premXpBonus = Math.round(totalXp * (premXpMult - 1));
        totalXp += premXpBonus;
        result.xpBreakdown.push(["Premium-Spielzeit", premXpBonus]);
      }
    }
    let clanTokenBonus = 0;
    let clanUpResult = null;
    if (BH.Social) {
      clanUpResult = BH.Social.trackMatch(d, dl);
      if (clanUpResult && clanUpResult.leveled) {
        result.xpBreakdown.push(["Clan Level-Up", 0]);
      }
      if (clanUpResult && clanUpResult.questRewards && clanUpResult.questRewards.length) {
        for (const qr of clanUpResult.questRewards) {
          result.xpBreakdown.push(["Clan-Aufgabe: " + qr.quest.label, qr.credits]);
        }
      }
      if (clanUpResult && clanUpResult.resources) {
        const parts = [];
        if (clanUpResult.resources.alloy) parts.push("⚙" + clanUpResult.resources.alloy);
        if (clanUpResult.resources.supplies) parts.push("📦" + clanUpResult.resources.supplies);
        if (parts.length) result.xpBreakdown.push(["Clan-Ressourcen", parts.join(" ")]);
      }
      if (clanUpResult && clanUpResult.facBonus) {
        result.xpBreakdown.push(["Fraktions-Einheit", 0]);
      }
      if (clanUpResult && clanUpResult.clanTokenBonus > 0) {
        clanTokenBonus = clanUpResult.clanTokenBonus;
        result.xpBreakdown.push(["🛡 2× Clan-Boost", clanUpResult.clanTokenBonus]);
      }
    }

    let cmEndExtras = null;
    if (this.lastModeId === "clanmatch" && d.clan) {
      cmEndExtras = d.clan.clanMatchStats || null;
    }

    let fwContractDone = null;
    let fwCapture = null;
    if (BH.FactionWar && BH.FactionWar.countsForWar(this.lastModeId)) {
      if (dl.wins) BH.FactionWar.recordWin(d, d.operator);
      fwContractDone = BH.FactionWar.trackMatch(d, {
        wins: dl.wins || 0,
        kills: (result.matchStats && result.matchStats.kills) || dl.kills || 0,
        mode: this.lastModeId,
        headshots: (result.matchStats && result.matchStats.headshots) || 0,
      });
      let winningTeam = null;
      const scoreboard = endedGame && endedGame.scoreboard
        ? [...endedGame.scoreboard.values()] : [];
      if (endedGame && endedGame.mode
        && typeof endedGame.mode.scoreA === "number"
        && typeof endedGame.mode.scoreB === "number") {
        if (endedGame.mode.scoreA > endedGame.mode.scoreB) winningTeam = "A";
        else if (endedGame.mode.scoreB > endedGame.mode.scoreA) winningTeam = "B";
      }
      if (mapBeforeRotate) {
        fwCapture = BH.FactionWar.applyMatchInfluence(d, {
          mapId: mapBeforeRotate.id,
          wins: dl.wins || 0,
          scoreboard,
        });
      }
      if (scoreboard.length) {
        const killGains = BH.FactionWar.trackMatchKills(d, { scoreboard, winningTeam });
        const topFac = Object.entries(killGains || {}).sort((a, b) => b[1] - a[1])[0];
        if (topFac && topFac[1] > 0) {
          const fm = BH.FactionWar._factionMeta(topFac[0]);
          result.xpBreakdown.push(["Fraktions-Kills: " + (fm.shortName || fm.name), topFac[1]]);
        }
      }
    }

    const achUnlocked = BH.Achievements
      ? BH.Achievements.evaluate(d, { matchStats: result.matchStats, deltas: dl }) : [];

    const xpResult = BH.Progress.addXp(totalXp);
    const levelRewards = xpResult.rewards || [];
    const bpSeasonBonus = xpResult.seasonBonus || 0;
    const playerXpBonus = xpResult.playerBonus || 0;
    if (BH.BattlePass) {
      BH.BattlePass.onMatchEnd(d, result.matchStats || {}, !!(result.deltas && result.deltas.wins), this.lastModeId);
    }
    if (BH.EventPass) {
      BH.EventPass.onMatchEnd(d, result.matchStats || {}, !!(result.deltas && result.deltas.wins), this.lastModeId);
    }

    let creditsEarned = Math.max(25, Math.round(totalXp / 10));
    const fwBonus = BH.FactionWar ? BH.FactionWar.playerBonus(d) : null;
    if (fwBonus) creditsEarned = Math.round(creditsEarned * fwBonus.mult);
    const clanCredMult = BH.Social ? BH.Social.creditsMult(d) : 1;
    if (clanCredMult > 1) creditsEarned = Math.round(creditsEarned * clanCredMult);
    if (BH.PremiumPlaytime) {
      const premCredMult = BH.PremiumPlaytime.creditsMult(d);
      if (premCredMult > 1) creditsEarned = Math.round(creditsEarned * premCredMult);
    }

    d.credits += creditsEarned;

    const chCredits = BH.Challenges ? BH.Challenges.track(dl) : 0;
    const contractCredits = (BH.Contracts && result.matchStats)
      ? BH.Contracts.track(d, result.matchStats) : 0;

    if (BH.Leaderboard && result.matchStats) {
      BH.Leaderboard.submit(BH.Cosmetics ? BH.Cosmetics.displayName(d) : "DU", {
        ...result.matchStats, mode: this.lastModeId,
        kills: result.matchStats.kills, deaths: result.matchStats.deaths,
        zombieRound: dl.bestZombieRound || result.matchStats.zombieRound,
      });
    }

    // Karten-Rotation nach Multiplayer-Matches
    if (BH.ROTATING_MODES.includes(this.lastModeId)) {
      if (mapBeforeRotate) {
        result.stats = [["Karte", mapBeforeRotate.emoji + " " + mapBeforeRotate.name], ...result.stats];
      }
      if (d.mapPickMode !== "manual") {
        BH.Maps.advanceRotation();
      }
    }

    let crateGrant = null;
    const aborted = /ABGEBROCHEN/i.test(result.title || "");
    if (BH.Crates && BH.Crates.isEnabled() && !aborted && (dl.matches || 0) > 0) {
      crateGrant = BH.Crates.grantFromMatch(d);
    }

    if (BH.Social) BH.Social.touchPresence(d, { save: false });

    BH.Progress.save();

    // Endbildschirm
    document.getElementById("end-title").textContent = result.title;
    document.getElementById("end-stats").innerHTML = result.stats.map(([label, val]) =>
      `<div class="stat-box"><div class="sb-val">${val}</div><div class="sb-label">${label}</div></div>`
    ).join("");

    const endClanEl = document.getElementById("end-clan");
    if (endClanEl && BH.ClanExt && BH.ClanExt.isLive() && d.clan) {
      endClanEl.innerHTML = BH.ClanExt.renderEndBlock(d, { clanUp: clanUpResult, cmStats: cmEndExtras });
      endClanEl.classList.toggle("hidden", !endClanEl.innerHTML);
    } else if (endClanEl) {
      endClanEl.innerHTML = "";
      endClanEl.classList.add("hidden");
    }

    const ms = result.matchStats || {};
    const aarKd = ms.deaths > 0 ? (ms.kills / ms.deaths).toFixed(2) : (ms.kills || 0);
    const headAcc = ms.kills > 0 ? Math.round((ms.headshots || 0) / ms.kills * 100) : 0;
    const aarEl = document.getElementById("end-aar");
    if (aarEl) {
      const medals = BH.MatchMedals ? BH.MatchMedals.compute(ms, result, this.lastModeId) : [];
      aarEl.innerHTML =
        `<h4 class="aar-title">AFTER-ACTION-REPORT</h4>` +
        `<div class="aar-grid">` +
        `<div class="stat-box"><div class="sb-val">${ms.kills || 0}</div><div class="sb-label">KILLS</div></div>` +
        `<div class="stat-box"><div class="sb-val">${ms.deaths || 0}</div><div class="sb-label">TODE</div></div>` +
        `<div class="stat-box"><div class="sb-val">${aarKd}</div><div class="sb-label">K/D</div></div>` +
        `<div class="stat-box"><div class="sb-val">${headAcc}%</div><div class="sb-label">HEADSHOT-QUOTE</div></div>` +
        `</div>` +
        (BH.MatchMedals ? BH.MatchMedals.renderHtml(medals) : "");
    }

    const finEl = document.getElementById("end-finisher");
    if (finEl) {
      if (BH.BpFinishers && BH.BpFinishers.isAvailable()) {
        const won = !!(dl.wins) || (result.title && /ERFOLG|SIEG|GEWONNEN|✅/i.test(result.title));
        finEl.innerHTML = BH.BpFinishers.renderHtml(d, won);
        finEl.classList.toggle("hidden", !finEl.innerHTML);
        if (finEl.innerHTML) requestAnimationFrame(() => BH.BpFinishers.replayStage(finEl));
      } else {
        finEl.innerHTML = "";
        finEl.classList.add("hidden");
      }
    }

    const cardEl = document.getElementById("end-calling-card");
    if (cardEl && BH.CallingCards) {
      const card = BH.CallingCards.get(d.callingCard || "default");
      cardEl.className = "calling-card-display " + (card.style || "cc-default");
      cardEl.innerHTML = `<span class="cc-icon">${card.icon}</span> ${BH.Cosmetics.displayName(d)}`;
    }

    const lvl = BH.Progress.getLevel();
    const rank = BH.Progress.getRank();
    const p = BH.Progress.data.prestige;

    let rewardHtml = "";
    if (levelRewards.length > 0) {
      rewardHtml = levelRewards.map(r =>
        `<span class="end-xp-bonus" style="color:#3ddc84">⬆ Level ${r.level} · +${r.credits} ⛁` +
        (r.bonus ? ` · ${r.bonus}` : "") + `</span>`
      ).join("");
      if (lvl.maxed) {
        rewardHtml += `<span class="end-xp-bonus" style="color:#ffd24d">✪ Prestige verfügbar</span>`;
      }
    }

    const bonusLines = [];
    if (chCredits) bonusLines.push(`<span class="end-xp-bonus" style="color:#3ddc84">Challenges: +${chCredits} ⛁</span>`);
    if (contractCredits) bonusLines.push(`<span class="end-xp-bonus" style="color:#3ddc84">Vertrag: +${contractCredits} ⛁</span>`);
    if (fwContractDone && fwContractDone.contractDone) {
      bonusLines.push(`<span class="end-xp-bonus" style="color:#39c5ff">⚔ Fraktions-Auftrag: +${fwContractDone.contract.reward} ⛁</span>`);
    }
    if (fwCapture && fwCapture.captured) {
      bonusLines.push(`<span class="end-xp-bonus" style="color:#b57bff">⚔ Territorium: ${fwCapture.captured.mapId}</span>`);
    }
    if (clanTokenBonus > 0) {
      bonusLines.push(`<span class="end-xp-bonus" style="color:#b57bff">🛡 2× Clan-Boost: +${clanTokenBonus} Clan-XP</span>`);
    }
    if (playerXpBonus > 0) {
      bonusLines.push(`<span class="end-xp-bonus" style="color:#3ddc84">📈 2× Level-Boost: +${playerXpBonus} Level-XP</span>`);
    }
    if (bpSeasonBonus > 0) {
      bonusLines.push(`<span class="end-xp-bonus" style="color:#39c5ff">🎖 2× BP-Boost: +${bpSeasonBonus} Saison-XP</span>`);
    }
    if (achUnlocked.length) {
      bonusLines.push(`<span class="end-xp-bonus" style="color:#ffd24d">🏅 ${achUnlocked.map(a => a.name).join(", ")}</span>`);
    }
    if (fwBonus) bonusLines.push(`<span class="end-xp-bonus" style="color:#ffd24d">${fwBonus.label}</span>`);
    if (crateGrant && crateGrant.ok) {
      bonusLines.push(`<span class="end-xp-bonus" style="color:#4ade80">📦 FRONT-KISTE erhalten</span>`);
    }

    document.getElementById("end-xp").innerHTML =
      `<div class="end-xp-lines">` +
      result.xpBreakdown.map(([label, xp]) =>
        label.startsWith("💎")
          ? `<span class="end-xp-line end-diamond-line">${label}</span>`
          : `<span class="end-xp-line">${label}: <b>+${xp}</b></span>`
      ).join("") +
      `</div>` +
      `<div class="end-xp-total">` +
      `Gesamt: <b>+${totalXp} XP</b> · <span style="color:#ffd24d">+${creditsEarned} ⛁</span>` +
      bonusLines.join("") +
      rewardHtml +
      `</div>` +
      `<div class="end-xp-meta">${(p > 0 ? "✪" + p + " · " : "")}${rank.name} · Level ${lvl.level} / ${BH.MAX_LEVEL}</div>`;

    this.renderEndCrate(crateGrant);
    this.updateCrateTopbar();

    document.getElementById("screen-end").classList.remove("hidden");
    if (BH.UI) BH.UI.endEnter();
  }
};
