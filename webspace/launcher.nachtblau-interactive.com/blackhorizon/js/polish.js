/* Tutorial, Medaillen, BP-Finishers, Grafik-Presets */

window.BH = window.BH || {};



/* ===== TUTORIAL ===== */

BH.Tutorial = {

  steps: [

    { key: "move", label: "WASD", desc: "Bewegen" },

    { key: "look", label: "Maus", desc: "Umschauen (Pointer Lock)" },

    { key: "fire", label: "LMB", desc: "Schießen · RMB Zielen" },

    { key: "reload", label: "R", desc: "Nachladen · 1/2 Waffe wechseln" },

    { key: "score", label: "Tab", desc: "Punktetafel (Fraktion unter Namen)" },

  ],



  needsIntro(d) {

    return d && !d.tutorialDone;

  },



  isActive(d) {

    return d && !!d.tutorialActive;

  },



  showIntro(onStart) {

    let el = document.getElementById("tutorial-overlay");

    if (!el) return;

    el.classList.remove("hidden");

    const stepsHtml = this.steps.map(s =>

      `<div class="tut-step"><span class="tut-key">${s.label}</span><span class="tut-desc">${s.desc}</span></div>`

    ).join("");

    el.innerHTML =

      `<div class="tut-panel">` +

      `<div class="tut-title">WILLKOMMEN BEI BLACK HORIZON</div>` +

      `<p class="tut-lead">Kurze Einführung – danach startet eine geführte Spec-Ops-Mission.</p>` +

      `<div class="tut-steps">${stepsHtml}</div>` +

      `<button type="button" class="btn btn-primary tut-start" id="btn-tut-start">SPEC-OPS TRAINING STARTEN</button>` +

      `<button type="button" class="btn tut-skip" id="btn-tut-skip">ÜBERSPRINGEN</button>` +

      `</div>`;

    const start = document.getElementById("btn-tut-start");

    const skip = document.getElementById("btn-tut-skip");

    if (start) start.onclick = () => {

      el.classList.add("hidden");

      const d = BH.Progress.data;

      d.tutorialActive = true;

      BH.Progress.save();

      if (onStart) onStart();

    };

    if (skip) skip.onclick = () => {

      el.classList.add("hidden");

      const d = BH.Progress.data;

      d.tutorialDone = true;

      d.tutorialActive = false;

      BH.Progress.save();

    };

  },



  complete(d) {

    if (!d) return;

    d.tutorialDone = true;

    d.tutorialActive = false;

    BH.Progress.save();

  },



  specOpsConfig(d) {

    if (!this.isActive(d)) return null;

    return { killsNeeded: 8, timeLeft: 240, hint: "Training: 8 Ziele in 4 Min. – Viel Erfolg!" };

  },

};



/* ===== POST-MATCH-MEDAILIEN ===== */

BH.MatchMedals = {

  compute(ms, result, modeId) {

    const medals = [];

    const kills = ms.kills || 0;

    const deaths = ms.deaths || 0;

    const hs = ms.headshots || 0;

    const hsPct = kills > 0 ? hs / kills : 0;

    const streak = ms.bestStreak || 0;

    const won = !!(result.deltas && result.deltas.wins);



    if (kills >= 20) medals.push({ id: "slayer", icon: "💀", name: "Abschussmaschine", desc: "20+ Kills" });

    if (hsPct >= 0.5 && kills >= 5) medals.push({ id: "head", icon: "🎯", name: "Kopfjäger", desc: "50 %+ Headshots" });

    if (hsPct >= 0.7 && kills >= 3) medals.push({ id: "sharp", icon: "🔭", name: "Scharfschütze", desc: "70 %+ Headshots" });

    if (streak >= 5) medals.push({ id: "streak", icon: "🔥", name: "Unaufhaltsam", desc: streak + "er Killstreak" });

    if (streak >= 7) medals.push({ id: "rampage", icon: "⚡", name: "Rampage", desc: streak + "er Killstreak" });

    if (deaths <= 1 && kills >= 8) medals.push({ id: "clean", icon: "🛡", name: "Sauber", desc: "Max. 1 Tod · 8+ Kills" });

    if (won && deaths === 0 && kills >= 3) medals.push({ id: "flawless", icon: "✨", name: "Makellos", desc: "Sieg ohne Tod" });

    if (won) medals.push({ id: "victory", icon: "🏆", name: "Sieger", desc: "Match gewonnen" });

    if (modeId === "specops" && won) medals.push({ id: "specop", icon: "🎯", name: "Spec-Op", desc: "Mission erfüllt" });

    if (ms.zombieRound >= 10) medals.push({ id: "zombie", icon: "🧟", name: "Überlebender", desc: "Runde " + ms.zombieRound });



    const seen = new Set();

    return medals.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });

  },



  renderHtml(medals) {

    if (!medals.length) return "";

    return (

      `<h4 class="aar-title">MEDAILLEN</h4>` +

      `<div class="medal-grid">` +

      medals.map(m =>

        `<div class="medal-card" title="${m.desc}">` +

        `<span class="medal-icon">${m.icon}</span>` +

        `<span class="medal-name">${m.name}</span>` +

        `<span class="medal-desc">${m.desc}</span>` +

        `</div>`

      ).join("") +

      `</div>`

    );

  },

};



/* ===== BP-FINISHERS ===== */

BH.BpFinishers = {

  catalog: [

    { id: "default_win", name: "Salut", icon: "🫡", css: "fin-salute", tier: 0, premium: false, win: true, season: 2 },

    { id: "default_loss", name: "Niederlage", icon: "💢", css: "fin-defeat", tier: 0, premium: false, win: false, season: 2 },

    { id: "drop_in", name: "Drop-In", icon: "🪂", css: "fin-dropin", tier: 9, premium: true, win: true, season: 2 },

    { id: "saber_salute", name: "Säbelgruß", icon: "⚔", css: "fin-saber", tier: 15, premium: true, win: true, season: 2 },

    { id: "victory_lap", name: "Victory Lap", icon: "🏁", css: "fin-victory", tier: 20, premium: true, win: true, season: 2 },

    { id: "tower_drop", name: "Tower Drop", icon: "🏙", css: "fin-tower", tier: 25, premium: true, win: true, season: 2 },

  ],



  isAvailable() {

    return !!(BH.SeasonRelease && BH.SeasonRelease.isS2Feature("finishers"));

  },



  get(id) {

    return this.catalog.find(f => f.id === id) || null;

  },



  _season(d) {

    return BH.SeasonRelease ? BH.SeasonRelease.effectiveBpSeason(d) : (d.bpSeason || 1);

  },



  _owned(d) {

    if (!d.owned) d.owned = {};

    if (!d.owned.finishers) d.owned.finishers = [];

    return d.owned.finishers;

  },



  _tierUnlocked(d, fin) {

    if (!this.isAvailable()) return false;

    const season = this._season(d);

    if (fin.season && fin.season !== season) return false;

    if (fin.tier <= 0) return true;

    if (fin.premium && !d.premiumPass) return false;

    return BH.Progress.getBpTier() >= fin.tier;

  },



  isUnlocked(d, fin) {

    if (!this.isAvailable() || !fin || !d) return false;

    if (this._owned(d).includes(fin.id)) return true;

    return this._tierUnlocked(d, fin);

  },



  unlockHint(fin) {

    if (!fin || fin.tier <= 0) return "Standard";

    let hint = "BP St. " + fin.tier;

    if (fin.premium) hint += " · Premium";

    if (fin.season) hint += " · S" + fin.season;

    return hint;

  },



  winFinishers(d) {

    return this.catalog.filter(f => f.win && f.id !== "default_win");

  },



  unlockedWinFinishers(d) {

    return this.catalog.filter(f => f.win && this.isUnlocked(d, f));

  },



  pick(d, won) {
    if (!this.isAvailable()) return null;

    const pool = this.catalog.filter(f => f.win === !!won && this.isUnlocked(d, f));

    if (!pool.length) {

      return this.get(won ? "default_win" : "default_loss");

    }

    const prem = pool.filter(f => f.tier > 0);

    return prem.length ? prem[prem.length - 1] : pool[0];

  },



  resolve(d, won) {
    if (!this.isAvailable()) return null;

    const eq = d && d.finisher;

    if (eq) {

      const fin = this.get(eq);

      if (fin && fin.win === !!won && this.isUnlocked(d, fin)) return fin;

    }

    return this.pick(d, won);

  },



  _sceneInner(fin) {

    const scenes = {

      default_win:

        `<div class="fin-silhouette fin-sil-salute">` +

        `<div class="fin-head"></div><div class="fin-torso"></div>` +

        `<div class="fin-arm fin-arm-salute"></div></div>`,

      default_loss:

        `<div class="fin-silhouette fin-sil-defeat">` +

        `<div class="fin-head fin-head-down"></div><div class="fin-torso fin-torso-bow"></div></div>` +

        `<div class="fin-smoke"></div>`,

      check_in:

        `<div class="fin-plane">✈</div><div class="fin-contrail"></div>` +

        `<div class="fin-silhouette fin-sil-watch"><div class="fin-head"></div><div class="fin-torso"></div></div>`,

      drop_in:

        `<div class="fin-chute">🪂</div>` +

        `<div class="fin-silhouette fin-sil-land"><div class="fin-head"></div><div class="fin-torso"></div></div>` +

        `<div class="fin-dust"></div>`,

      tower_drop:

        `<div class="fin-tower-block"></div><div class="fin-rope"></div>` +

        `<div class="fin-silhouette fin-sil-rappel"><div class="fin-head"></div><div class="fin-torso"></div></div>`,

      victory_lap:

        `<div class="fin-flag">🏁</div>` +

        `<div class="fin-silhouette fin-sil-celebrate"><div class="fin-head"></div><div class="fin-torso"></div>` +

        `<div class="fin-arm fin-arm-up"></div></div><div class="fin-confetti"></div>`,

      saber_salute:

        `<div class="fin-silhouette fin-sil-saber">` +

        `<div class="fin-head"></div><div class="fin-torso"></div>` +

        `<div class="fin-arm fin-arm-blade"></div><div class="fin-blade"></div>` +

        `<div class="fin-slash"></div><div class="fin-spark"></div></div>`,

    };

    return scenes[fin.id] || `<div class="fin-fallback-icon">${fin.icon || "★"}</div>`;

  },



  renderSceneHtml(fin, opts) {

    if (!fin) return "";

    const o = opts || {};

    const won = o.won !== false;

    const label = (won ? "SIEG" : "NIEDERLAGE") + " · " + fin.name;

    return (

      `<div class="finisher-stage ${fin.css}${o.play ? " fin-play" : ""}${o.compact ? " fin-compact" : ""}" data-fin="${fin.id}">` +

      `<div class="fin-stage-bg"></div>` +

      `<div class="fin-stage-vfx"></div>` +

      this._sceneInner(fin) +

      `<div class="fin-caption">${label}</div>` +

      `</div>`

    );

  },



  renderHtml(d, won) {

    const fin = this.resolve(d, won);

    if (!fin) return "";

    return this.renderSceneHtml(fin, { won: !!won, play: true });

  },



  replayStage(el) {

    if (!el) return;

    const stage = el.querySelector(".finisher-stage") || (el.classList.contains("finisher-stage") ? el : null);

    if (!stage) return;

    stage.classList.remove("fin-play");

    void stage.offsetWidth;

    stage.classList.add("fin-play");

  },



  grant(d, id) {

    if (!this.isAvailable()) return;

    const list = this._owned(d);

    if (!list.includes(id)) list.push(id);

  },

};



/* ===== GRAFIK-PRESETS ===== */

BH.Graphics = {

  presets: {

    low: {

      label: "Niedrig", desc: "Maximale FPS · schwache Hardware", tag: "FPS",

      pixelRatio: 1, fogMult: 1.35, botMult: 0.55,

      shadows: false, exposure: 0.98, hemiMult: 0.78, roughnessMult: 1.06, envMult: 0.85,

    },

    medium: {

      label: "Mittel", desc: "Ausgewogen · empfohlen für die meisten", tag: "Standard",

      pixelRatio: 1.5, fogMult: 1, botMult: 1,

      shadows: false, exposure: 1.06, hemiMult: 0.92, roughnessMult: 0.96, envMult: 1,

    },

    high: {

      label: "Hoch", desc: "Schatten & schärfere Darstellung", tag: "HD",

      pixelRatio: 2, fogMult: 0.84, botMult: 1.25,

      shadows: true, exposure: 1.14, hemiMult: 1, roughnessMult: 0.88,

      shadowMapSize: 1536, envMult: 1,

    },

    ultra: {

      label: "Ultra", desc: "Hohe Auflösung · volle Schatten · mehr Licht", tag: "Ultra HD",

      pixelRatio: 2.5, fogMult: 0.8, botMult: 1.35,

      shadows: true, exposure: 1.2, hemiMult: 1.06, roughnessMult: 0.8,

      shadowMapSize: 2048, envMult: 1.12,

    },

    superUltra: {

      label: "Super Ultra", desc: "Maximum · 4K-Schatten · höchste Bildqualität", tag: "MAX",

      warn: true,

      pixelRatio: 3, fogMult: 0.74, botMult: 1.5,

      shadows: true, exposure: 1.28, hemiMult: 1.12, roughnessMult: 0.72,

      shadowMapSize: 4096, envMult: 1.25,

    },

  },



  qualityOrder: ["low", "medium", "high", "ultra", "superUltra"],



  get() {

    const q = (BH.Settings && BH.Settings.get().quality) || "medium";

    return this.presets[q] || this.presets.medium;

  },



  scaleBots(n) {

    return Math.max(1, Math.round(n * this.get().botMult));

  },



  setupRenderer(renderer) {

    if (!renderer) return;

    const p = this.get();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, p.pixelRatio));

    renderer.outputEncoding = THREE.sRGBEncoding;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure = p.exposure || 1.05;

    renderer.shadowMap.enabled = !!p.shadows;

    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  },



  applyRenderer(renderer) {

    this.setupRenderer(renderer);

  },



  applyScene(scene) {

    if (!scene || !scene.fog) return;

    const p = this.get();

    if (!scene.fog._bhBaseNear) {

      scene.fog._bhBaseNear = scene.fog.near;

      scene.fog._bhBaseFar = scene.fog.far;

    }

    scene.fog.near = scene.fog._bhBaseNear * p.fogMult;

    scene.fog.far = scene.fog._bhBaseFar * p.fogMult;

  },



  applySceneLighting(scene) {

    if (!scene) return;

    const p = this.get();

    const hemiMult = p.hemiMult || 1;

    if (scene._bhHemiLight) scene._bhHemiLight.intensity = (scene._bhHemiBase || 0.9) * hemiMult;

    if (scene._bhAmbLight) scene._bhAmbLight.intensity = (scene._bhAmbBase || 0.3) * hemiMult;

    if (scene._bhRimLight) scene._bhRimLight.intensity = (scene._bhRimBase || 0.2) * hemiMult;



    const dir = scene._bhDirLight;

    if (!dir) return;

    dir.intensity = (scene._bhDirBase || dir.intensity) * hemiMult;

    if (p.shadows) {

      dir.castShadow = true;

      dir.shadow.bias = -0.0006;

      dir.shadow.normalBias = 0.018;

      const sz = p.shadowMapSize || 1024;

      dir.shadow.mapSize.set(sz, sz);

      const cam = dir.shadow.camera;

      cam.near = 2;

      cam.far = 160;

      cam.left = cam.bottom = -72;

      cam.right = cam.top = 72;

      cam.updateProjectionMatrix();

    } else {

      dir.castShadow = false;

    }

  },



  applySceneMeshes(scene) {

    if (!scene) return;

    const p = this.get();

    const shadows = !!p.shadows;

    const roughMult = p.roughnessMult || 1;

    scene.traverse(obj => {

      if (!obj.isMesh || obj.userData.bhNoShadow) return;

      if (obj.userData.bhGround) {

        obj.receiveShadow = shadows;

        obj.castShadow = false;

      } else {

        obj.castShadow = shadows;

        obj.receiveShadow = shadows;

      }

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

      for (const mat of mats) {

        if (!mat || !mat.isMeshStandardMaterial) continue;

        if (mat._bhBaseRoughness == null) mat._bhBaseRoughness = mat.roughness;

        mat.roughness = Math.max(0.28, mat._bhBaseRoughness * roughMult);

        if (mat.metalness > 0.15) mat.envMapIntensity = 0.55 * (p.envMult || 1);

      }

    });

  },

};



/* ===== UI-POLISH (Boot, Toasts, Menü-Animationen) ===== */

BH.UI = {

  boot() {

    const el = document.getElementById("boot-splash");

    if (!el || el.classList.contains("boot-done")) return;

    const bootVer = el.querySelector(".boot-version");
    if (bootVer && BH.gameVersionUpdateLabel) {
      bootVer.textContent = BH.gameVersionUpdateLabel();
    }

    const bar = el.querySelector(".boot-bar-fill");
    const barWrap = document.getElementById("boot-bar");
    const status = document.getElementById("boot-status");
    const pctEl = document.getElementById("boot-pct");

    const setProgress = (value, text) => {
      const v = Math.max(0, Math.min(100, value));
      if (bar) bar.style.width = v + "%";
      if (barWrap) barWrap.setAttribute("aria-valuenow", String(Math.round(v)));
      if (pctEl) pctEl.textContent = Math.round(v) + "%";
      if (status && text) status.textContent = text;
    };

    const steps = [
      { at: 80, pct: 6, msg: "System wird initialisiert…" },
      { at: 280, pct: 22, msg: "Fortschritt & Operatoren laden…" },
      { at: 520, pct: 44, msg: "Karten & Waffen vorbereiten…" },
      { at: 760, pct: 68, msg: "Audio & Interface…" },
      { at: 980, pct: 88, msg: "Frontlinie synchronisieren…" },
      { at: 1180, pct: 100, msg: "Einsatzbereit" },
    ];

    setProgress(0, steps[0].msg);
    steps.forEach(step => {
      setTimeout(() => setProgress(step.pct, step.msg), step.at);
    });

    setTimeout(() => {

      el.classList.add("boot-out");
      el.setAttribute("aria-busy", "false");

      setTimeout(() => {

        el.classList.add("boot-done");

        el.classList.remove("boot-out");

      }, 620);

    }, 2400);

  },



  toast(message, type, duration) {

    const stack = document.getElementById("ui-toast-stack");

    if (!stack || !message) return;

    const kind = type || "info";

    const el = document.createElement("div");

    el.className = "ui-toast ui-toast-" + kind;

    el.textContent = message;

    stack.appendChild(el);

    requestAnimationFrame(() => el.classList.add("show"));

    const ms = duration || (kind === "error" ? 3400 : 2600);

    setTimeout(() => {

      el.classList.remove("show");

      el.classList.add("hide");

      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 320);

    }, ms);

  },



  menuEnter(screenEl) {

    if (!screenEl) return;

    screenEl.classList.remove("menu-enter");

    void screenEl.offsetWidth;

    screenEl.classList.add("menu-enter");

  },



  endEnter() {

    const panel = document.querySelector("#screen-end .end-panel");

    if (!panel) return;

    panel.classList.remove("end-enter");

    void panel.offsetWidth;

    panel.classList.add("end-enter");

  },

};


