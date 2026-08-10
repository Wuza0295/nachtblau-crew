document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('.app');
  const i18n = window.HYBRIXON_I18N || {};
  const inApp = !!(root && root.getAttribute('data-in-app') === '1')
    || /HybrixonApp/i.test(navigator.userAgent || '');
  // Clear legacy localStorage trap from older builds (!== prefer_web).
  try { localStorage.removeItem('hybrixon_stay_web'); } catch (_) {}
  const stayWebPref = !!(root && root.getAttribute('data-stay-web') === '1')
    || localStorage.getItem('hybrixon_prefer_web') === '1';
  const fromAppFallback = !!(root && root.getAttribute('data-from-app') === '1')
    || /[?&](?:from_app|web)=1(?:&|$)/.test(location.search);
  const isAndroid = /Android/i.test(navigator.userAgent || '');
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

  const downloadUrl = i18n.appDownloadUrl || '/app.php';

  const setPreferWebCookie = () => {
    const maxAge = 60 * 60 * 24 * 7;
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = 'hybrixon_prefer_web=1; Path=/; Max-Age=' + maxAge + '; SameSite=Lax' + secure;
  };

  /**
   * Open the native Android app when installed.
   * On user tap: Intent with download fallback.
   * On auto: never force-download / never set stay-web — keep the banner.
   */
  const openInHybrixonApp = (opts = {}) => {
    const goDownloadOnMiss = !!opts.goDownloadOnMiss;
    const path = location.pathname + location.search + location.hash;
    // Strip fallback flags so the app opens the clean URL.
    let httpsUrl = location.origin + path;
    try {
      const u = new URL(httpsUrl);
      u.searchParams.delete('from_app');
      u.searchParams.delete('web');
      u.searchParams.delete('stay');
      httpsUrl = u.toString();
    } catch (_) {}
    const fallback = downloadUrl;

    if (!isAndroid) {
      location.href = downloadUrl;
      return;
    }

    const pkg = i18n.appPackage || 'com.hybrixon.app';
    let intentUrl = 'intent://open?url='
      + encodeURIComponent(httpsUrl)
      + '#Intent;scheme=hybrixon;package='
      + encodeURIComponent(pkg);
    if (goDownloadOnMiss) {
      intentUrl += ';S.browser_fallback_url=' + encodeURIComponent(fallback);
    }
    intentUrl += ';end';

    let leftPage = false;
    const onHide = () => { leftPage = true; };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);

    location.href = intentUrl;

    if (goDownloadOnMiss) {
      setTimeout(() => {
        document.removeEventListener('visibilitychange', onHide);
        window.removeEventListener('pagehide', onHide);
        if (!leftPage && !document.hidden) {
          location.href = fallback;
        }
      }, 1600);
    }
  };

  const banner = document.querySelector('[data-app-open-banner]');
  if (banner && isMobile && !inApp) {
    if (stayWebPref) {
      banner.hidden = true;
    } else {
      banner.hidden = false;
      const openBtn = banner.querySelector('[data-app-open]');
      const stayBtn = banner.querySelector('[data-app-stay-web]');
      if (openBtn) openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openInHybrixonApp({ goDownloadOnMiss: true });
      });
      if (stayBtn) stayBtn.addEventListener('click', (e) => {
        e.preventDefault();
        try { localStorage.setItem('hybrixon_prefer_web', '1'); } catch (_) {}
        setPreferWebCookie();
        banner.hidden = true;
      });
    }

    // Extra client handoff when Chrome reports the related app (sideload often empty).
    // Skip when we just came back from a server Intent miss — banner stays usable.
    if (
      !stayWebPref
      && !fromAppFallback
      && isAndroid
      && typeof navigator.getInstalledRelatedApps === 'function'
      && sessionStorage.getItem('hybrixon_app_autolaunch') !== '1'
    ) {
      sessionStorage.setItem('hybrixon_app_autolaunch', '1');
      navigator.getInstalledRelatedApps().then((apps) => {
        const found = (apps || []).some((a) =>
          (a.id || a.url || '').indexOf('com.hybrixon.app') !== -1
          || a.id === 'com.hybrixon.app'
        );
        if (found) {
          openInHybrixonApp({ goDownloadOnMiss: false });
        }
      }).catch(() => {});
    }
  }

  const adultToggle = document.querySelector('[data-adult-toggle]');
  const adultHint = document.querySelector('[data-adult-hint]');
  const policyRequired = document.querySelector('[data-policy-required]');
  if (adultToggle && adultHint) {
    const sync = () => {
      const on = adultToggle.checked;
      adultHint.hidden = !on;
      if (policyRequired) {
        policyRequired.required = on;
        if (!on) policyRequired.checked = false;
      }
    };
    adultToggle.addEventListener('change', sync);
    sync();
  }

  document.querySelectorAll('[data-share-toggle]').forEach((input) => {
    const targetId = input.getAttribute('data-share-toggle');
    const box = targetId ? document.getElementById(targetId) : null;
    if (!box) return;
    const syncShare = () => {
      const hasFiles = !!(input.files && input.files.length);
      box.hidden = !hasFiles;
      if (!hasFiles) {
        const cb = box.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = false;
      }
    };
    input.addEventListener('change', syncShare);
    syncShare();
  });

  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy') || '';
      const i18n = window.HYBRIXON_I18N || {};
      try {
        await navigator.clipboard.writeText(text);
        const prev = btn.textContent;
        btn.textContent = i18n.copied || 'Kopiert';
        setTimeout(() => { btn.textContent = prev; }, 1200);
      } catch (_) {
        window.prompt(i18n.copied || 'Link:', text);
      }
    });
  });

  // In-place post translation
  document.querySelectorAll('[data-translate-post]').forEach((btn) => {
    const body = btn.previousElementSibling && btn.previousElementSibling.matches('[data-post-body]')
      ? btn.previousElementSibling
      : btn.parentElement?.querySelector('[data-post-body]');
    if (!body) return;
    const originalHtml = body.innerHTML;
    const originalText = btn.getAttribute('data-original') || body.textContent || '';
    let translated = null;
    let showingTranslated = false;
    const i18n = window.HYBRIXON_I18N || {};

    btn.addEventListener('click', async () => {
      if (showingTranslated) {
        body.innerHTML = originalHtml;
        btn.textContent = i18n.translate || 'Übersetzen';
        showingTranslated = false;
        return;
      }
      if (translated) {
        body.textContent = translated;
        btn.textContent = i18n.showOriginal || 'Original';
        showingTranslated = true;
        return;
      }
      btn.disabled = true;
      btn.textContent = i18n.translating || '…';
      try {
        const res = await fetch(i18n.translateUrl || 'api-translate.php', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: originalText, to: i18n.lang || 'en' }),
        });
        const data = await res.json();
        if (!data.ok || !data.text) {
          if (data.fallback) {
            window.open(data.fallback, '_blank', 'noopener');
          }
          throw new Error(data.error || 'fail');
        }
        translated = data.text;
        body.textContent = translated;
        btn.textContent = i18n.showOriginal || 'Original';
        showingTranslated = true;
      } catch (_) {
        btn.textContent = i18n.translateFailed || 'Fehler';
        setTimeout(() => { btn.textContent = i18n.translate || 'Übersetzen'; }, 1500);
      } finally {
        btn.disabled = false;
      }
    });
  });


  document.querySelectorAll('[data-max-files], [data-max-images]').forEach((input) => {
    const max = parseInt(
      input.getAttribute('data-max-files') || input.getAttribute('data-max-images') || '15',
      10
    );
    if (!Number.isFinite(max) || max < 1) return;
    input.addEventListener('change', () => {
      if (!input.files) return;
      if (input.files.length > max) {
        alert('Maximal ' + max + ' Dateien.');
        input.value = '';
        return;
      }
      // Show selected count next to the control (helps in the Android app).
      const label = input.closest('label');
      if (label) {
        let hint = label.querySelector('[data-file-count]');
        if (!hint) {
          hint = document.createElement('small');
          hint.className = 'muted';
          hint.setAttribute('data-file-count', '1');
          hint.style.display = 'block';
          hint.style.marginTop = '0.35rem';
          label.appendChild(hint);
        }
        hint.textContent = input.files.length
          ? (input.files.length + ' Datei(en) ausgewählt')
          : '';
      }
    });
  });

  // Keep screen / WebView awake during long uploads (Android bridge + Wake Lock).
  let wakeLock = null;
  const setUploadingGuard = (on) => {
    try {
      if (window.HybrixonNative && typeof window.HybrixonNative.setUploading === 'function') {
        window.HybrixonNative.setUploading(!!on);
      }
    } catch (_) {}
    if (on) {
      if (navigator.wakeLock && navigator.wakeLock.request) {
        navigator.wakeLock.request('screen').then((lock) => {
          wakeLock = lock;
          lock.addEventListener('release', () => { wakeLock = null; });
        }).catch(() => {});
      }
    } else if (wakeLock) {
      try { wakeLock.release(); } catch (_) {}
      wakeLock = null;
    }
  };

  // Media staging: parallel batches, retries, progress. Survives brief network blips.
  document.querySelectorAll('form[data-stage-uploads]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      if (form.dataset.stageDone === '1') return;
      const fileInputs = Array.from(form.querySelectorAll('input[type="file"]'));
      const queue = [];
      fileInputs.forEach((input) => {
        if (!input.files || !input.files.length) return;
        const kind = input.getAttribute('data-stage-kind') || 'auto';
        Array.from(input.files).forEach((file) => queue.push({ file, kind }));
      });
      if (!queue.length) return;

      event.preventDefault();
      const stageUrl = form.getAttribute('data-stage-url') || 'api-media-stage.php';
      const purpose = form.getAttribute('data-stage-purpose') || 'posts';
      const csrfInput = form.querySelector('input[name="_csrf"]');
      const csrf = csrfInput ? csrfInput.value : (i18n.csrf || '');
      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      const prevLabel = submitBtn ? (submitBtn.textContent || submitBtn.value || '') : '';
      const setStatus = (text) => {
        if (submitBtn && 'textContent' in submitBtn) submitBtn.textContent = text;
      };
      if (submitBtn) {
        submitBtn.disabled = true;
        setStatus('Upload 0/' + queue.length + '…');
      }
      setUploadingGuard(true);

      const maxVideoBytes = Number(i18n.maxVideoBytes) > 0
        ? Number(i18n.maxVideoBytes)
        : 500 * 1000 * 1000;
      const maxImageBytes = Number(i18n.maxImageBytes) > 0
        ? Number(i18n.maxImageBytes)
        : 12 * 1000 * 1000;

      const fmtMb = (n) => (n / 1000000).toFixed(n >= 100000000 ? 0 : 1);
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      const stageFileOnce = (item, index) => new Promise((resolve, reject) => {
        const isVideo = item.kind === 'video'
          || (item.file.type && item.file.type.indexOf('video/') === 0);
        const maxBytes = isVideo ? maxVideoBytes : maxImageBytes;
        if (item.file.size > maxBytes) {
          reject(new Error(
            (isVideo ? 'Video' : 'Bild') + ' „' + item.file.name + '“ ist zu groß ('
            + Math.ceil(item.file.size / 1000000) + ' MB). Max. '
            + Math.floor(maxBytes / 1000000) + ' MB.'
          ));
          return;
        }
        const body = new FormData();
        body.append('_csrf', csrf);
        body.append('kind', item.kind);
        body.append('purpose', purpose);
        body.append('file', item.file, item.file.name);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', stageUrl);
        xhr.withCredentials = true;
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;
          const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
          setStatus(
            'Upload ' + (index + 1) + '/' + queue.length
            + ' · ' + fmtMb(e.loaded) + '/' + fmtMb(e.total) + ' MB (' + pct + '%)'
          );
        };
        xhr.onload = () => {
          let data = null;
          try { data = JSON.parse(xhr.responseText); } catch (_) { data = null; }
          if (xhr.status < 200 || xhr.status >= 300 || !data || !data.ok || !data.token) {
            const msg = (data && data.error)
              ? data.error
              : ('Upload fehlgeschlagen (HTTP ' + xhr.status + ').');
            const err = new Error(msg);
            err.retryable = xhr.status === 0 || xhr.status === 408 || xhr.status === 429
              || xhr.status >= 500;
            reject(err);
            return;
          }
          resolve(data.token);
        };
        xhr.onerror = () => {
          const err = new Error('Netzwerkfehler beim Upload.');
          err.retryable = true;
          reject(err);
        };
        xhr.ontimeout = () => {
          const err = new Error('Upload-Timeout — bitte erneut versuchen.');
          err.retryable = true;
          reject(err);
        };
        xhr.timeout = 30 * 60 * 1000;
        xhr.send(body);
      });

      const stageFile = async (item, index) => {
        let lastErr = null;
        for (let attempt = 1; attempt <= 4; attempt++) {
          try {
            if (attempt > 1) {
              setStatus('Upload ' + (index + 1) + '/' + queue.length + ' · Retry ' + attempt + '…');
              await sleep(1000 * attempt * attempt);
            }
            return await stageFileOnce(item, index);
          } catch (err) {
            lastErr = err;
            if (!err || !err.retryable || attempt === 4) throw err;
          }
        }
        throw lastErr || new Error('Upload fehlgeschlagen.');
      };

      try {
        // One-at-a-time on mobile/app (more stable when OS throttles background tabs).
        const inNativeApp = !!(window.HybrixonNative)
          || /HybrixonApp/i.test(navigator.userAgent || '');
        const concurrency = inNativeApp ? 1 : Math.min(2, queue.length);
        const tokens = new Array(queue.length);
        let nextIndex = 0;
        let completed = 0;
        const worker = async () => {
          while (nextIndex < queue.length) {
            const i = nextIndex++;
            setStatus('Upload ' + (completed + 1) + '/' + queue.length + '…');
            tokens[i] = await stageFile(queue[i], i);
            completed += 1;
            setStatus('Upload ' + completed + '/' + queue.length + ' fertig…');
          }
        };
        await Promise.all(Array.from({ length: concurrency }, () => worker()));

        fileInputs.forEach((input) => {
          input.value = '';
          input.removeAttribute('required');
        });
        form.querySelectorAll('input[name="staged[]"]').forEach((el) => el.remove());
        tokens.forEach((token) => {
          const hidden = document.createElement('input');
          hidden.type = 'hidden';
          hidden.name = 'staged[]';
          hidden.value = token;
          form.appendChild(hidden);
        });
        form.dataset.stageDone = '1';
        setStatus('Veröffentlichen…');
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
        } else {
          form.submit();
        }
      } catch (err) {
        alert(
          (err && err.message ? err.message : 'Upload fehlgeschlagen.')
          + '\n\nTipp: App während des Uploads geöffnet lassen (Bildschirm an).'
        );
        if (submitBtn) {
          submitBtn.disabled = false;
          setStatus(prevLabel);
        }
      } finally {
        setUploadingGuard(false);
      }
    });
  });

  const plzInput = document.querySelector('[data-plz-input]');
  const citySelect = document.querySelector('[data-city-select]');
  const plzHidden = document.querySelector('[data-plz-hidden]');
  const cityFilter = document.querySelector('[data-city-filter]');
  if (plzInput && citySelect) {
    let timer = null;
    let cityTimer = null;
    let lastCities = [];
    const plzApi = plzInput.getAttribute('data-plz-api') || 'api-plz.php';
    const cityApi = plzInput.getAttribute('data-city-api') || 'api-city.php';

    const renderCities = (cities, keepValue, emptyLabel) => {
      lastCities = cities.slice();
      const prev = keepValue || citySelect.value || '';
      citySelect.innerHTML = '';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = emptyLabel;
      citySelect.appendChild(placeholder);
      cities.forEach((name) => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        if (prev && prev.toLowerCase() === String(name).toLowerCase()) {
          opt.selected = true;
        }
        citySelect.appendChild(opt);
      });
    };

    const fillCitiesByPlz = async (plz, keepValue) => {
      citySelect.innerHTML = '';
      const loading = document.createElement('option');
      loading.value = '';
      loading.textContent = 'Orte werden geladen…';
      citySelect.appendChild(loading);
      try {
        const res = await fetch(plzApi + '?plz=' + encodeURIComponent(plz), { credentials: 'same-origin' });
        const data = await res.json();
        const cities = (data && data.cities) ? data.cities : [];
        if (plzHidden) {
          plzHidden.value = cities.length ? plz : '';
        }
        renderCities(
          cities,
          keepValue,
          cities.length ? 'Bitte Ort wählen…' : 'Keine Orte für diese PLZ'
        );
      } catch (_) {
        if (plzHidden) {
          plzHidden.value = '';
        }
        renderCities([], '', 'Ort-Suche fehlgeschlagen');
      }
    };

    const fillCitiesByQuery = async (q, keepValue) => {
      try {
        const res = await fetch(cityApi + '?q=' + encodeURIComponent(q), { credentials: 'same-origin' });
        const data = await res.json();
        const rows = (data && data.results) ? data.results : [];
        const names = [];
        const seen = {};
        rows.forEach((row) => {
          const name = row.city || '';
          const key = name.toLowerCase();
          if (!name || seen[key]) return;
          seen[key] = true;
          names.push(name);
        });
        renderCities(
          names,
          keepValue,
          names.length ? 'Bitte Ort wählen…' : 'Keine Treffer — anders suchen'
        );
      } catch (_) {
        renderCities([], '', 'Ort-Suche fehlgeschlagen');
      }
    };

    const syncPlzHidden = () => {
      if (!plzHidden) return;
      const typed = (plzInput.value || '').trim();
      plzHidden.value = /^\d{5}$/.test(typed) ? typed : '';
    };

    const onPlz = () => {
      const plz = (plzInput.value || '').trim();
      if (plz === '') {
        syncPlzHidden();
        if (lastCities.length) {
          renderCities(lastCities, citySelect.value || '', 'Bitte Ort wählen…');
        } else {
          renderCities(
            citySelect.value ? [citySelect.value] : [],
            citySelect.value || '',
            'Ort suchen oder PLZ eingeben…'
          );
        }
        return;
      }
      if (!/^\d{5}$/.test(plz)) {
        if (lastCities.length || citySelect.options.length > 1) {
          return;
        }
        renderCities([], '', '5-stellige PLZ oder Ort suchen…');
        return;
      }
      fillCitiesByPlz(plz, citySelect.value || '');
    };

    Array.from(citySelect.options).forEach((opt) => {
      if (opt.value) {
        lastCities.push(opt.value);
      }
    });

    plzInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(onPlz, 280);
    });
    plzInput.addEventListener('change', onPlz);

    if (cityFilter) {
      cityFilter.addEventListener('input', () => {
        clearTimeout(cityTimer);
        cityTimer = setTimeout(() => {
          const q = (cityFilter.value || '').trim();
          const plz = (plzInput.value || '').trim();
          if (/^\d{5}$/.test(plz)) {
            return; // PLZ filter hat Vorrang
          }
          if (q.length < 2) {
            return;
          }
          fillCitiesByQuery(q, citySelect.value || '');
        }, 280);
      });
    }

    citySelect.addEventListener('change', () => {
      // PLZ bleibt optional: nur das sichtbare Feld zählt, nie aus dem Ort erzwingen
      syncPlzHidden();
    });

    const form = plzInput.closest('form');
    if (form && plzHidden) {
      form.addEventListener('submit', syncPlzHidden);
    }
  }

  // @mention autocomplete
  const mentionApiBase = (document.querySelector('[data-mention-api]') || {}).getAttribute
    ? document.querySelector('[data-mention-api]').getAttribute('data-mention-api')
    : null;
  const mentionApi = mentionApiBase || (document.body.dataset.mentionApi || '');

  const resolveMentionApi = (el) => {
    if (el.getAttribute('data-mention-api')) {
      return el.getAttribute('data-mention-api');
    }
    const link = document.querySelector('link[rel="mention-api"]');
    if (link) return link.getAttribute('href');
    // derive from known path patterns: use relative api-mention.php near current
    const scripts = document.querySelectorAll('script[src*="app.js"]');
    if (scripts.length) {
      const src = scripts[0].getAttribute('src') || '';
      return src.replace(/assets\/js\/app\.js.*$/, 'api-mention.php');
    }
    return 'api-mention.php';
  };

  document.querySelectorAll('textarea[data-mention]').forEach((ta) => {
    const api = resolveMentionApi(ta);
    let box = null;
    let timer = null;
    let activeIdx = -1;
    let items = [];

    const hide = () => {
      if (box) {
        box.remove();
        box = null;
      }
      activeIdx = -1;
      items = [];
    };

    const insertMention = (username) => {
      const val = ta.value;
      const pos = ta.selectionStart || 0;
      const before = val.slice(0, pos);
      const after = val.slice(pos);
      const m = before.match(/@([A-Za-z0-9_]{0,24})$/);
      if (!m) return;
      const start = before.length - m[0].length;
      ta.value = before.slice(0, start) + '@' + username + ' ' + after;
      const caret = start + username.length + 2;
      ta.focus();
      ta.setSelectionRange(caret, caret);
      hide();
    };

    const render = (users) => {
      hide();
      items = users;
      if (!users.length) return;
      box = document.createElement('div');
      box.className = 'mention-box';
      box.setAttribute('role', 'listbox');
      users.forEach((u, i) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'mention-item';
        row.setAttribute('role', 'option');
        const label = u.display_name ? (u.display_name + ' · @' + u.username) : ('@' + u.username);
        row.innerHTML = (u.avatar
          ? '<img class="mention-av" src="' + u.avatar + '" alt="">'
          : '<span class="mention-av mention-av-fallback">' + String(u.username).charAt(0).toUpperCase() + '</span>')
          + '<span>' + label.replace(/</g, '&lt;') + '</span>';
        row.addEventListener('mousedown', (e) => {
          e.preventDefault();
          insertMention(u.username);
        });
        box.appendChild(row);
      });
      ta.parentNode.style.position = ta.parentNode.style.position || 'relative';
      ta.parentNode.appendChild(box);
      activeIdx = 0;
      if (box.children[0]) box.children[0].classList.add('active');
    };

    const queryMentions = async (q) => {
      try {
        const res = await fetch(api + '?q=' + encodeURIComponent(q), { credentials: 'same-origin' });
        const data = await res.json();
        render((data && data.users) ? data.users : []);
      } catch (_) {
        hide();
      }
    };

    ta.addEventListener('input', () => {
      const pos = ta.selectionStart || 0;
      const before = ta.value.slice(0, pos);
      const m = before.match(/@([A-Za-z0-9_]{1,24})$/);
      if (!m) {
        hide();
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(() => queryMentions(m[1]), 180);
    });

    ta.addEventListener('keydown', (e) => {
      if (!box) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdx = Math.min(items.length - 1, activeIdx + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = Math.max(0, activeIdx - 1);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (activeIdx >= 0 && items[activeIdx]) {
          e.preventDefault();
          insertMention(items[activeIdx].username);
          return;
        }
      } else if (e.key === 'Escape') {
        hide();
        return;
      } else {
        return;
      }
      Array.from(box.children).forEach((el, i) => {
        el.classList.toggle('active', i === activeIdx);
      });
    });

    ta.addEventListener('blur', () => setTimeout(hide, 150));
  });

  // Fullscreen lightbox for content images
  const LB_SEL = '.post-image img, .profile-banner img, .banner-preview, .avatar-lg img';
  let lbRoot = null;
  let lbImg = null;
  let lbPrev = null;
  let lbNext = null;
  let lbList = [];
  let lbIndex = 0;

  const ensureLightbox = () => {
    if (lbRoot) return;
    lbRoot = document.createElement('div');
    lbRoot.className = 'lightbox';
    lbRoot.hidden = true;
    lbRoot.setAttribute('role', 'dialog');
    lbRoot.setAttribute('aria-modal', 'true');
    lbRoot.setAttribute('aria-label', 'Bildansicht');
    lbRoot.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="Schließen">×</button>' +
      '<button type="button" class="lightbox-nav lightbox-prev" aria-label="Vorheriges">‹</button>' +
      '<img class="lightbox-img" alt="">' +
      '<button type="button" class="lightbox-nav lightbox-next" aria-label="Nächstes">›</button>';
    document.body.appendChild(lbRoot);
    lbImg = lbRoot.querySelector('.lightbox-img');
    lbPrev = lbRoot.querySelector('.lightbox-prev');
    lbNext = lbRoot.querySelector('.lightbox-next');
    lbRoot.querySelector('.lightbox-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeLightbox();
    });
    lbPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      showLightboxAt(lbIndex - 1);
    });
    lbNext.addEventListener('click', (e) => {
      e.stopPropagation();
      showLightboxAt(lbIndex + 1);
    });
    lbRoot.addEventListener('click', (e) => {
      if (e.target === lbRoot) closeLightbox();
    });
  };

  const syncNav = () => {
    const multi = lbList.length > 1;
    lbPrev.hidden = !multi;
    lbNext.hidden = !multi;
  };

  const showLightboxAt = (idx) => {
    if (!lbList.length) return;
    lbIndex = (idx + lbList.length) % lbList.length;
    lbImg.src = lbList[lbIndex];
    syncNav();
  };

  const openLightbox = (urls, startIndex) => {
    ensureLightbox();
    lbList = urls.filter(Boolean);
    if (!lbList.length) return;
    showLightboxAt(startIndex || 0);
    lbRoot.hidden = false;
    document.body.classList.add('lightbox-open');
  };

  const closeLightbox = () => {
    if (!lbRoot) return;
    lbRoot.hidden = true;
    lbImg.removeAttribute('src');
    lbList = [];
    document.body.classList.remove('lightbox-open');
  };

  document.addEventListener('click', (e) => {
    const img = e.target.closest(LB_SEL);
    if (!img || !img.getAttribute('src')) return;
    if (img.closest('.lightbox')) return;
    e.preventDefault();
    const grid = img.closest('.media-grid, .media-grid-multi');
    let urls = [img.currentSrc || img.src];
    let start = 0;
    if (grid) {
      const imgs = Array.from(grid.querySelectorAll('.post-image img'));
      if (imgs.length) {
        urls = imgs.map((el) => el.currentSrc || el.src).filter(Boolean);
        start = Math.max(0, imgs.indexOf(img));
      }
    }
    openLightbox(urls, start);
  });

  document.addEventListener('keydown', (e) => {
    if (!lbRoot || lbRoot.hidden) return;
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      showLightboxAt(lbIndex - 1);
    } else if (e.key === 'ArrowRight') {
      showLightboxAt(lbIndex + 1);
    }
  });

  // ——— Push notifications (Web Push + Android native bridge) ———
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  };

  const pushSupported = !!(
    'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
  );

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return null;
    try {
      return await navigator.serviceWorker.register(i18n.swUrl || '/sw.js', { scope: '/' });
    } catch (_) {
      return null;
    }
  };

  const subscribeWebPush = async () => {
    if (!i18n.loggedIn || !i18n.vapidPublicKey || !pushSupported) {
      return { ok: false, reason: 'unsupported' };
    }
    const reg = await registerServiceWorker();
    if (!reg) return { ok: false, reason: 'sw' };
    let permission = Notification.permission;
    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') return { ok: false, reason: 'denied' };

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(i18n.vapidPublicKey),
      });
    }
    const res = await fetch(i18n.pushSubscribeUrl || '/api-push-subscribe.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ _csrf: i18n.csrf || '', subscription: sub.toJSON() }),
    });
    const data = await res.json().catch(() => null);
    return { ok: !!(res.ok && data && data.ok), reason: data && data.error };
  };

  // Auto-register SW; try quiet re-subscribe if already granted.
  if (i18n.loggedIn) {
    registerServiceWorker().then(async (reg) => {
      if (!reg || !pushSupported || Notification.permission !== 'granted' || !i18n.vapidPublicKey) {
        return;
      }
      try { await subscribeWebPush(); } catch (_) {}
    });
  }

  // Settings button
  document.querySelectorAll('[data-push-enable]').forEach((btn) => {
    const statusEl = document.querySelector('[data-push-status]');
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      btn.disabled = true;
      try {
        // Native Android app: request OS permission + start polling bridge
        if (window.HybrixonNative && typeof window.HybrixonNative.requestNotifications === 'function') {
          window.HybrixonNative.requestNotifications();
        }
        const result = await subscribeWebPush();
        if (statusEl) {
          statusEl.hidden = false;
          if (result.ok) {
            statusEl.textContent = i18n.pushActive || 'Push aktiv';
          } else if (!pushSupported && window.HybrixonNative) {
            statusEl.textContent = i18n.pushActive || 'Push aktiv';
          } else {
            statusEl.textContent = i18n.pushUnsupported || 'Push nicht verfügbar';
          }
        }
      } catch (err) {
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.textContent = (err && err.message) || (i18n.pushUnsupported || 'Push fehlgeschlagen');
        }
      } finally {
        btn.disabled = false;
      }
    });
  });

  // Poll for new notifications → native Android tray (and browser Notification).
  if (i18n.loggedIn && i18n.notifPollUrl) {
    let seeded = false;
    let lastShown = Number(localStorage.getItem('hybrixon_last_shown') || '0');
    const poll = async () => {
      try {
        const url = (i18n.notifPollUrl || '/api-notifications-poll.php')
          + (lastShown > 0 ? ('?since_id=' + lastShown) : '');
        const res = await fetch(url, {
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.ok) return;
        const maxId = Number(data.max_id || 0);
        const items = Array.isArray(data.items) ? data.items : [];
        if (!seeded) {
          seeded = true;
          if (maxId > lastShown) {
            lastShown = maxId;
            localStorage.setItem('hybrixon_last_shown', String(lastShown));
          }
          return;
        }
        items.forEach((item) => {
          const id = Number(item && item.id) || 0;
          if (id <= lastShown) return;
          lastShown = id;
          localStorage.setItem('hybrixon_last_shown', String(lastShown));
          if (window.HybrixonNative && typeof window.HybrixonNative.showNotification === 'function') {
            window.HybrixonNative.showNotification(
              item.title || 'Hybrixon',
              item.body || '',
              item.url || '/notifications.php'
            );
          } else if (typeof Notification !== 'undefined'
            && Notification.permission === 'granted'
            && document.hidden) {
            try {
              const n = new Notification(item.title || 'Hybrixon', {
                body: item.body || '',
                icon: '/assets/img/logo-avatar.png',
              });
              n.onclick = () => {
                window.focus();
                location.href = item.url || '/notifications.php';
              };
            } catch (_) {}
          }
        });
        if (maxId > lastShown) {
          lastShown = maxId;
          localStorage.setItem('hybrixon_last_shown', String(lastShown));
        }
      } catch (_) {}
    };
    poll();
    setInterval(poll, 45000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) poll();
    });
  }
});
