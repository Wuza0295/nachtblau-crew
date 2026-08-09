document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('.app');
  const i18n = window.HYBRIXON_I18N || {};
  const inApp = !!(root && root.getAttribute('data-in-app') === '1')
    || /HybrixonApp/i.test(navigator.userAgent || '');
  const stayWebPref = !!(root && root.getAttribute('data-stay-web') === '1')
    || localStorage.getItem('hybrixon_stay_web') === '1'
    || /[?&]web=1(?:&|$)/.test(location.search);
  const isAndroid = /Android/i.test(navigator.userAgent || '');
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

  const downloadUrl = i18n.appDownloadUrl || '/app.php';

  /**
   * Open the native Android app when installed.
   * If not installed (or the OS ignores the intent), send the user to the APK download page.
   * Note: Browsers block *automatic* custom-scheme / intent jumps without a user tap —
   * so this must run from a click for reliable handoff.
   */
  const openInHybrixonApp = (opts = {}) => {
    const goDownloadOnMiss = opts.goDownloadOnMiss !== false;
    const path = location.pathname + location.search + location.hash;
    const httpsUrl = location.origin + path;
    const fallback = downloadUrl;

    if (!isAndroid) {
      // No native store app on iOS yet → install / Home-Screen guide
      location.href = downloadUrl;
      return;
    }

    const pkg = i18n.appPackage || 'com.hybrixon.app';
    // Custom scheme is the most reliable opener for sideloaded APKs.
    // browser_fallback_url → Download page when the app is missing.
    const intentUrl = 'intent://open?url='
      + encodeURIComponent(httpsUrl)
      + '#Intent;scheme=hybrixon;package='
      + encodeURIComponent(pkg)
      + ';S.browser_fallback_url='
      + encodeURIComponent(fallback)
      + ';end';

    let leftPage = false;
    const onHide = () => { leftPage = true; };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);

    location.href = intentUrl;

    // Some browsers ignore S.browser_fallback_url for sideloaded packages —
    // if we're still here after ~1.6s, go to the download page.
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
  if (banner && isMobile && !inApp && !stayWebPref) {
    banner.hidden = false;
    const openBtn = banner.querySelector('[data-app-open]');
    const stayBtn = banner.querySelector('[data-app-stay-web]');
    if (openBtn) openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openInHybrixonApp({ goDownloadOnMiss: true });
    });
    if (stayBtn) stayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.setItem('hybrixon_stay_web', '1');
      banner.hidden = true;
      const u = new URL(location.href);
      u.searchParams.set('web', '1');
      history.replaceState({}, '', u.toString());
    });

    // Client-side auto handoff when Chrome reports the related Android app is installed.
    // (Server-side Intent redirect also runs in header.php for Android.)
    if (isAndroid && typeof navigator.getInstalledRelatedApps === 'function'
        && sessionStorage.getItem('hybrixon_app_autolaunch') !== '1') {
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

  // Sequential media staging: upload each file in its own request to avoid HTTP 413
  // ("Request Entity Too Large") on multi-select batches.
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
      const csrf = csrfInput ? csrfInput.value : '';
      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      const prevLabel = submitBtn ? (submitBtn.textContent || submitBtn.value || '') : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        if ('textContent' in submitBtn) {
          submitBtn.textContent = 'Upload 0/' + queue.length + '…';
        }
      }

      const tokens = [];
      const maxVideoBytes = 200 * 1000 * 1000;
      const maxImageBytes = 12 * 1000 * 1000;
      try {
        for (let i = 0; i < queue.length; i++) {
          const item = queue[i];
          const isVideo = item.kind === 'video'
            || (item.file.type && item.file.type.indexOf('video/') === 0);
          const maxBytes = isVideo ? maxVideoBytes : maxImageBytes;
          if (item.file.size > maxBytes) {
            throw new Error(
              (isVideo ? 'Video' : 'Bild') + ' „' + item.file.name + '“ ist zu groß ('
              + Math.ceil(item.file.size / 1000000) + ' MB). Max. '
              + Math.floor(maxBytes / 1000000) + ' MB.'
            );
          }
          if (submitBtn && 'textContent' in submitBtn) {
            submitBtn.textContent = 'Upload ' + (i + 1) + '/' + queue.length + '…';
          }
          const body = new FormData();
          body.append('_csrf', csrf);
          body.append('kind', item.kind);
          body.append('purpose', purpose);
          body.append('file', item.file, item.file.name);
          const res = await fetch(stageUrl, {
            method: 'POST',
            body,
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
          });
          let data = null;
          try {
            data = await res.json();
          } catch (_) {
            data = null;
          }
          if (!res.ok || !data || !data.ok || !data.token) {
            const msg = (data && data.error) ? data.error : ('Upload fehlgeschlagen (HTTP ' + res.status + ').');
            throw new Error(msg);
          }
          tokens.push(data.token);
        }

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
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
        } else {
          form.submit();
        }
      } catch (err) {
        alert(err && err.message ? err.message : 'Upload fehlgeschlagen.');
        if (submitBtn) {
          submitBtn.disabled = false;
          if ('textContent' in submitBtn) submitBtn.textContent = prevLabel;
        }
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
});
