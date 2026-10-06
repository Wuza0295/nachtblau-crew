(function () {
  const api = window.nachtblau;
  if (!api) {
    document.body.innerHTML = '<p style="padding:2rem;color:#fff">Launcher-API fehlt.</p>';
    return;
  }

  const els = {
    status: document.getElementById('status'),
    statusLabel: document.getElementById('status-label'),
    statusMeta: document.getElementById('status-meta'),
    addrLine: document.getElementById('addr-line'),
    updateLine: document.getElementById('update-line'),
    updateBanner: document.getElementById('update-banner'),
    updateBannerTitle: document.getElementById('update-banner-title'),
    updateBannerMeta: document.getElementById('update-banner-meta'),
    updateBannerProgress: document.getElementById('update-banner-progress'),
    updateProgressFill: document.getElementById('update-progress-fill'),
    btnUpdateAction: document.getElementById('btn-update-action'),
    btnUpdateCheck: document.getElementById('btn-update-check'),
    accountState: document.getElementById('account-state'),
    accountHint: document.getElementById('account-hint'),
    skinBust: document.getElementById('skin-bust'),
    skinFallback: document.getElementById('skin-fallback'),
    newsList: document.getElementById('news-list'),
    btnMain: document.getElementById('btn-main'),
    btnDiscord: document.getElementById('btn-discord'),
    btnLogout: document.getElementById('btn-logout'),
    ram: document.getElementById('ram'),
    ramValue: document.getElementById('ram-value'),
    ramHint: document.getElementById('ram-hint'),
    progressWrap: document.getElementById('progress-wrap'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    loginPaste: document.getElementById('login-paste'),
    loginPasteTitle: document.getElementById('login-paste-title'),
    loginPasteHint: document.getElementById('login-paste-hint'),
    loginPasteManual: document.getElementById('login-paste-manual'),
    loginPasteInput: document.getElementById('login-paste-input'),
    loginCancelOnly: document.getElementById('login-cancel-only'),
    btnPasteSubmit: document.getElementById('btn-paste-submit'),
    btnPasteCancel: document.getElementById('btn-paste-cancel'),
    btnLoginCancel: document.getElementById('btn-login-cancel'),
    toast: document.getElementById('toast'),
  };

  let server = {
    name: 'NachtBlau Lumina',
    host: '192.168.178.33',
    publicHost: 'drake-intra.tun.ply.gg',
    port: 58820,
    lanPort: 25565,
    version: '1.21.11',
    discord: 'https://discord.gg/uJ25M5xf',
  };
  let statusHost = 'drake-intra.tun.ply.gg';
  let statusPort = 58820;
  let loggedIn = false;
  let busy = false;
  let loginAwaiting = false;
  let appVersion = '';
  let updatePhase = 'idle';
  let updateRemoteVersion = null;

  function showToast(message, ok) {
    els.toast.textContent = message;
    els.toast.classList.toggle('is-ok', Boolean(ok));
    els.toast.classList.remove('hidden');
  }

  function hideToast() {
    els.toast.classList.add('hidden');
  }

  function setBusy(value) {
    busy = value;
    els.btnMain.disabled = value;
    els.btnLogout.disabled = value;
    els.ram.disabled = value;
  }

  function setLoginPasteVisible(visible, mode) {
    loginAwaiting = visible;
    els.loginPaste.classList.toggle('hidden', !visible);
    const manual = mode === 'browser';
    if (els.loginPasteManual) {
      els.loginPasteManual.classList.toggle('hidden', !manual);
    }
    if (els.loginCancelOnly) {
      els.loginCancelOnly.classList.toggle('hidden', manual);
    }
    if (!visible) {
      if (els.loginPasteInput) els.loginPasteInput.value = '';
      return;
    }
    if (manual && els.loginPasteInput) {
      els.loginPasteInput.focus();
    }
  }

  function skinUrlFor(profile) {
    const uuid = String(profile?.uuid || '').replace(/-/g, '');
    const name = String(profile?.name || '').trim();
    if (uuid && /^[a-f0-9]{32}$/i.test(uuid)) {
      return `https://mc-heads.net/avatar/${uuid}/64`;
    }
    if (name) {
      return `https://mc-heads.net/avatar/${encodeURIComponent(name)}/64`;
    }
    return '';
  }

  function setSkin(profile) {
    const url = skinUrlFor(profile);
    const initials = String(profile?.name || 'NB')
      .slice(0, 2)
      .toUpperCase();
    if (els.skinFallback) els.skinFallback.textContent = initials || 'NB';
    if (!els.skinBust) return;
    if (!url) {
      els.skinBust.hidden = true;
      els.skinBust.removeAttribute('src');
      if (els.skinFallback) els.skinFallback.hidden = false;
      return;
    }
    els.skinBust.onload = () => {
      els.skinBust.hidden = false;
      if (els.skinFallback) els.skinFallback.hidden = true;
    };
    els.skinBust.onerror = () => {
      els.skinBust.hidden = true;
      if (els.skinFallback) els.skinFallback.hidden = false;
    };
    els.skinBust.src = url;
    els.skinBust.alt = profile?.name ? `Skin von ${profile.name}` : 'Minecraft-Skin';
  }

  function updateAccountUI(profile) {
    if (loggedIn && profile) {
      els.accountState.textContent = profile.name;
      if (els.accountHint) {
        els.accountHint.textContent = 'Microsoft · bereit zum Spielen';
      }
      els.btnMain.textContent = 'Spielen & verbinden';
      els.btnLogout.classList.remove('hidden');
      setSkin(profile);
    } else {
      els.accountState.textContent = 'Nicht angemeldet';
      if (els.accountHint) {
        els.accountHint.textContent =
          'Benötigt Minecraft: Java Edition auf dem Microsoft-Konto.';
      }
      els.btnMain.textContent = 'Mit Microsoft anmelden';
      els.btnLogout.classList.add('hidden');
      setSkin(null);
    }
  }

  async function loadNews() {
    if (!els.newsList) return;
    const url =
      server.newsUrl ||
      'https://launcher.nachtblau-interactive.com/nachtblau-lumina/news.json';
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      if (!items.length) {
        els.newsList.innerHTML = '<p class="news-empty">Noch keine News — bald mehr von der Crew.</p>';
        return;
      }
      els.newsList.innerHTML = items
        .slice(0, 5)
        .map((item) => {
          const title = String(item.title || item.headline || 'Update').replace(/</g, '&lt;');
          const body = String(item.body || item.text || item.markdown || '')
            .replace(/</g, '&lt;')
            .replace(/\n/g, '<br>');
          const date = item.date || item.published || '';
          return `<article class="news-item"><h3 class="news-title">${title}</h3>${
            date ? `<p class="news-date">${String(date).replace(/</g, '&lt;')}</p>` : ''
          }${body ? `<p class="news-body">${body}</p>` : ''}</article>`;
        })
        .join('');
    } catch {
      els.newsList.innerHTML =
        '<p class="news-empty">News gerade nicht erreichbar — Launcher bleibt nutzbar.</p>';
    }
  }

  function setStatus(state, label, meta) {
    els.status.classList.remove('is-online', 'is-offline', 'is-degraded');
    els.status.classList.add(`is-${state}`);
    els.statusLabel.textContent = label;
    els.statusMeta.textContent = meta || '';
  }

  async function refreshServerStatus() {
    // 1) Direkter TCP-Probe auf Connect-Target (LAN zu Hause, playit unterwegs)
    // 2) mcsrvstat für Spielerzahl — aber nie gegen die alte VPS-IP / still 25565
    let probe = null;
    try {
      probe = api.probeServer ? await api.probeServer() : null;
    } catch {
      probe = null;
    }

    const host =
      (probe && probe.connectOk && probe.connectHost) ||
      statusHost ||
      server.publicHost ||
      server.host;
    const port = Number(
      (probe && probe.connectOk && probe.connectPort) ||
        statusPort ||
        server.port
    ) || 58820;

    const publicHost = statusHost || server.publicHost || host;
    const publicPort = Number(statusPort || server.port) || 58820;

    if (probe?.connectOk) {
      // Lokaler/erreichbarer Connect — optional mcsrvstat für Meta (kann bei LAN fehlschlagen)
      try {
        const res = await fetch(`https://api.mcsrvstat.us/3/${publicHost}:${publicPort}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.online) {
            const online = data.players?.online;
            const max = data.players?.max;
            const ver = data.version || data.protocol?.name || server.version;
            const players =
              Number.isFinite(online)
                ? `${online}${Number.isFinite(max) ? ` / ${max}` : ''} Spieler`
                : '';
            setStatus(
              'online',
              `${server.name} · Online`,
              `Java ${ver} · ${host}:${port}${players ? ` · ${players}` : ''}`
            );
            return;
          }
        }
      } catch {
        /* mcsrvstat optional */
      }
      setStatus('online', `${server.name} · Online`, `${host}:${port} · erreichbar`);
      return;
    }

    try {
      const res = await fetch(`https://api.mcsrvstat.us/3/${publicHost}:${publicPort}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.online) {
        const online = data.players?.online;
        const max = data.players?.max;
        const ver = data.version || data.protocol?.name || server.version;
        const players =
          Number.isFinite(online)
            ? `${online}${Number.isFinite(max) ? ` / ${max}` : ''} Spieler`
            : '';
        setStatus(
          'online',
          `${server.name} · Online`,
          `Java ${ver} · ${publicHost}:${publicPort}${players ? ` · ${players}` : ''}`
        );
        return;
      }
      setStatus('offline', `${server.name} · Offline`, `${publicHost}:${publicPort}`);
    } catch {
      setStatus(
        'degraded',
        'Status nicht abrufbar',
        `${publicHost}:${publicPort} — trotzdem starten möglich`
      );
    }
  }

  function setUpdateUI(data) {
    const phase = data?.phase || 'idle';
    updatePhase = phase;
    updateRemoteVersion = data?.version || updateRemoteVersion;
    const current = data?.currentVersion || appVersion;
    const remote = data?.version || updateRemoteVersion;
    const msg = data?.message || '';

    if (els.updateLine) {
      els.updateLine.textContent =
        phase === 'error'
          ? `Update: ${msg}`
          : msg || (current ? `Launcher v${current}` : 'Launcher-Update');
      els.updateLine.classList.toggle('is-ready', phase === 'ready');
      els.updateLine.classList.toggle('is-error', phase === 'error');
      els.updateLine.classList.toggle('is-available', phase === 'available' || phase === 'downloading');
    }

    if (!els.updateBanner) return;

    const showBanner =
      phase === 'available' ||
      phase === 'downloading' ||
      phase === 'ready' ||
      phase === 'checking' ||
      phase === 'reboot' ||
      phase === 'error';
    els.updateBanner.classList.toggle('hidden', !showBanner);
    els.updateBanner.classList.toggle('is-ready', phase === 'ready' || phase === 'reboot');
    els.updateBanner.classList.toggle('is-downloading', phase === 'downloading');

    if (els.updateBannerTitle) {
      if (phase === 'ready') els.updateBannerTitle.textContent = 'Update bereit';
      else if (phase === 'reboot') els.updateBannerTitle.textContent = 'Reboot nötig';
      else if (phase === 'downloading') els.updateBannerTitle.textContent = 'Update wird geladen';
      else if (phase === 'checking') els.updateBannerTitle.textContent = 'Suche Update …';
      else if (phase === 'error') els.updateBannerTitle.textContent = 'Update-Problem';
      else els.updateBannerTitle.textContent = 'Update verfügbar';
    }

    if (els.updateBannerMeta) {
      if (remote && current && (phase === 'available' || phase === 'ready' || phase === 'downloading' || phase === 'reboot')) {
        els.updateBannerMeta.textContent = `v${current} → v${remote}`;
      } else {
        els.updateBannerMeta.textContent = msg || '';
      }
    }

    const showProgress = phase === 'downloading' || phase === 'ready' || phase === 'reboot';
    if (els.updateBannerProgress) {
      els.updateBannerProgress.classList.toggle('hidden', !showProgress);
    }
    if (els.updateProgressFill && data?.progress != null) {
      els.updateProgressFill.style.width = `${Math.max(0, Math.min(100, data.progress))}%`;
    } else if (els.updateProgressFill && (phase === 'ready' || phase === 'reboot')) {
      els.updateProgressFill.style.width = '100%';
    }

    if (els.btnUpdateAction) {
      const actionHidden = phase === 'checking' || phase === 'idle' || phase === 'dev';
      els.btnUpdateAction.classList.toggle('hidden', actionHidden);
      if (phase === 'ready') {
        els.btnUpdateAction.textContent = 'Jetzt neu starten';
        els.btnUpdateAction.disabled = false;
      } else if (phase === 'reboot') {
        els.btnUpdateAction.textContent = 'System neu starten';
        els.btnUpdateAction.disabled = false;
      } else if (phase === 'downloading') {
        els.btnUpdateAction.textContent = 'Lädt …';
        els.btnUpdateAction.disabled = true;
      } else if (phase === 'available') {
        els.btnUpdateAction.textContent = 'Update laden & installieren';
        els.btnUpdateAction.disabled = false;
      } else if (phase === 'error') {
        els.btnUpdateAction.textContent = 'Download-Seite öffnen';
        els.btnUpdateAction.disabled = false;
      }
    }
  }

  async function onUpdateAction() {
    if (!api.downloadUpdate || !api.installUpdate) return;
    if (updatePhase === 'error') {
      api.openExternal?.('https://launcher.nachtblau-interactive.com/downloads/');
      return;
    }
    if (updatePhase === 'reboot') {
      showToast('Bitte System manuell neu starten (Reboot), damit das Update aktiv wird.');
      return;
    }
    if (updatePhase === 'ready') {
      const result = await api.installUpdate();
      if (result?.needsReboot) {
        setUpdateUI({
          phase: 'reboot',
          message: `v${result.version || updateRemoteVersion} gelayert — bitte neu starten (Reboot)`,
          version: result.version || updateRemoteVersion,
          currentVersion: appVersion,
          progress: 100,
          needsReboot: true,
        });
        showToast('Update gelayert. System neu starten, dann Launcher erneut öffnen.');
        return;
      }
      if (!result?.ok) showToast(result?.error || 'Neustart fehlgeschlagen');
      return;
    }
    if (updatePhase === 'available') {
      els.btnUpdateAction.disabled = true;
      els.btnUpdateAction.textContent = 'Lädt …';
      const result = await api.downloadUpdate();
      if (!result?.ok) {
        showToast(result?.error || 'Download fehlgeschlagen');
        els.btnUpdateAction.disabled = false;
        els.btnUpdateAction.textContent = 'Update laden & installieren';
      }
    }
  }

  function setProgress(visible, message, progress) {
    els.progressWrap.classList.toggle('hidden', !visible);
    if (message) els.progressText.textContent = message;
    if (progress != null) {
      els.progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
    } else if (visible) {
      els.progressFill.style.width = '15%';
    }
  }

  async function onMainClick() {
    hideToast();
    if (busy) return;

    if (!loggedIn) {
      setBusy(true);
      setProgress(true, 'Microsoft-Login wird vorbereitet …');
      setLoginPasteVisible(true, 'window');
      try {
        const result = await api.login();
        if (!result.ok) {
          showToast(result.error || 'Login fehlgeschlagen');
          return;
        }
        loggedIn = true;
        updateAccountUI(result.profile);
        showToast(`Angemeldet als ${result.profile.name}`, true);
      } catch (err) {
        showToast(String(err?.message || err));
      } finally {
        setBusy(false);
        setProgress(false);
        setLoginPasteVisible(false);
      }
      return;
    }

    setBusy(true);
    setProgress(true, 'Minecraft wird vorbereitet …', 5);
    try {
      const result = await api.launch();
      if (!result.ok) {
        showToast(result.error || 'Start fehlgeschlagen');
        setProgress(false);
        return;
      }
      showToast('Minecraft gestartet — Verbindung zum Server …', true);
    } catch (err) {
      showToast(String(err?.message || err));
      setProgress(false);
    } finally {
      setBusy(false);
    }
  }

  els.btnMain.addEventListener('click', onMainClick);

  els.btnPasteSubmit.addEventListener('click', async () => {
    const text = els.loginPasteInput.value.trim();
    if (!text) {
      showToast('Bitte die Redirect-URL aus dem Browser einfügen.');
      return;
    }
    const result = await api.submitRedirect(text);
    if (!result.ok) {
      showToast(result.error || 'Übernehmen fehlgeschlagen');
    }
  });

  async function cancelActiveLogin() {
    await api.cancelLogin();
    setLoginPasteVisible(false);
  }

  els.btnPasteCancel.addEventListener('click', cancelActiveLogin);
  if (els.btnLoginCancel) {
    els.btnLoginCancel.addEventListener('click', cancelActiveLogin);
  }

  els.loginPasteInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      els.btnPasteSubmit.click();
    }
  });

  els.btnLogout.addEventListener('click', async () => {
    if (busy) return;
    await api.logout();
    loggedIn = false;
    updateAccountUI(null);
    hideToast();
  });

  els.btnDiscord.addEventListener('click', () => {
    api.openExternal(server.discord || 'https://discord.gg/uJ25M5xf');
  });

  els.ram.addEventListener('input', () => {
    els.ramValue.textContent = els.ram.value;
  });

  els.ram.addEventListener('change', async () => {
    const settings = await api.setMemory(Number(els.ram.value));
    els.ram.value = String(settings.memoryGb);
    els.ramValue.textContent = String(settings.memoryGb);
  });

  api.onAuthChanged((data) => {
    loggedIn = Boolean(data?.loggedIn);
    updateAccountUI(data?.profile || null);
  });

  api.onAuthStatus((data) => {
    const msg = data?.message || 'Microsoft-Login…';
    if (data?.phase === 'error') {
      setProgress(false, msg);
      setLoginPasteVisible(false);
      return;
    }
    if (data?.phase === 'done') {
      setProgress(false);
      setLoginPasteVisible(false);
      return;
    }
    if (data?.phase === 'awaiting_code' || data?.phase === 'browser') {
      setLoginPasteVisible(true, 'browser');
      if (els.loginPasteTitle) {
        els.loginPasteTitle.textContent = 'Browser-Login';
      }
      if (els.loginPasteHint && data.message) {
        els.loginPasteHint.textContent = data.message;
      }
    } else if (data?.phase === 'window' || data?.phase === 'exchanging') {
      setLoginPasteVisible(true, 'window');
      if (els.loginPasteTitle) {
        els.loginPasteTitle.textContent =
          data.phase === 'exchanging' ? 'Anmeldung' : 'Microsoft-Login';
      }
      if (els.loginPasteHint && data.message) {
        els.loginPasteHint.textContent = data.message;
      }
    }
    setProgress(true, msg);
  });

  api.onLaunchStatus((data) => {
    const msg = data?.message || '';
    if (data?.phase === 'error') {
      showToast(msg || 'Fehler beim Start');
      setProgress(false);
      return;
    }
    if (data?.phase === 'launched') {
      setProgress(true, msg || 'Gestartet', 100);
      return;
    }
    if (data?.phase === 'close') {
      setProgress(false);
      return;
    }
    setProgress(true, msg || 'Läuft …', data?.progress);
  });

  api.onUpdateStatus((data) => {
    setUpdateUI(data || {});
  });

  if (els.btnUpdateAction) {
    els.btnUpdateAction.addEventListener('click', onUpdateAction);
  }
  if (els.btnUpdateCheck) {
    els.btnUpdateCheck.addEventListener('click', () => {
      api.checkUpdate?.().catch(() => {});
    });
  }

  api.getConfig().then((cfg) => {
    server = cfg.server || server;
    statusHost = cfg.statusHost || server.publicHost || server.host;
    statusPort = Number(cfg.statusPort || server.port) || 58820;
    loggedIn = Boolean(cfg.loggedIn);
    appVersion = cfg.appVersion || '';
    const memMax = Math.max(2, Number(cfg.memoryMaxGb) || 12);
    const memRecommended = Math.max(2, Math.min(memMax, Number(cfg.memoryRecommendedGb) || 6));
    els.ram.max = String(memMax);
    const mem = Math.min(memMax, cfg.settings?.memoryGb ?? memRecommended);
    els.ram.value = String(mem);
    els.ramValue.textContent = String(mem);
    if (els.ramHint) {
      els.ramHint.textContent =
        `Empfohlen: ${memRecommended} GB · Slider-Max: ${memMax} GB (OS-Reserve) · Mehr als 8 GB bringt selten FPS`;
    }
    const shownHost = cfg.connectHost || server.publicHost || server.host;
    const shownPort = cfg.connectPort != null ? cfg.connectPort : server.port;
    els.addrLine.textContent = `${shownHost}:${shownPort} · Java ${server.version}`;
    setUpdateUI({
      phase: cfg.packaged ? 'idle' : 'dev',
      message: appVersion
        ? `Launcher v${appVersion}${cfg.packaged ? '' : ' (Dev)'}`
        : 'Launcher-Update',
      currentVersion: appVersion,
      version: appVersion,
    });
    updateAccountUI(cfg.profile || null);
    loadNews();
    refreshServerStatus();
    setInterval(refreshServerStatus, 60000);
    api.checkUpdate?.().catch(() => {});
  });
})();
