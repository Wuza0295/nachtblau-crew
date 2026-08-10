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

    // Auto handoff backup (head script usually runs first). Keep banner visible.
    // Skip when we just came back from an Intent miss (?from_app=1).
    if (!stayWebPref && !fromAppFallback && isAndroid
      && sessionStorage.getItem('hybrixon_app_autolaunch') !== '1') {
      sessionStorage.setItem('hybrixon_app_autolaunch', '1');

      // 1) Custom-scheme iframe: opens the app when installed, no navigation if missing.
      try {
        let httpsUrl = location.origin + location.pathname + location.search + location.hash;
        const u = new URL(httpsUrl);
        u.searchParams.delete('from_app');
        u.searchParams.delete('web');
        u.searchParams.delete('stay');
        httpsUrl = u.toString();
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'display:none;width:0;height:0;border:0';
        iframe.setAttribute('aria-hidden', 'true');
        iframe.src = 'hybrixon://open?url=' + encodeURIComponent(httpsUrl);
        document.body.appendChild(iframe);
        setTimeout(() => { try { iframe.remove(); } catch (_) {} }, 2500);
      } catch (_) {}

      // 2) Intent with same-page fallback (keeps banner) — not download.
      try {
        let httpsUrl = location.origin + location.pathname + location.search + location.hash;
        const u = new URL(httpsUrl);
        u.searchParams.delete('from_app');
        u.searchParams.delete('web');
        u.searchParams.delete('stay');
        httpsUrl = u.toString();
        const fallback = httpsUrl + (httpsUrl.indexOf('?') >= 0 ? '&' : '?') + 'from_app=1';
        const pkg = i18n.appPackage || 'com.hybrixon.app';
        const intentUrl = 'intent://open?url='
          + encodeURIComponent(httpsUrl)
          + '#Intent;scheme=hybrixon;package='
          + encodeURIComponent(pkg)
          + ';S.browser_fallback_url='
          + encodeURIComponent(fallback)
          + ';end';
        setTimeout(() => {
          if (!document.hidden) location.href = intentUrl;
        }, 120);
      } catch (_) {}

      // 3) If Chrome reports the related app, retry Intent once more.
      if (typeof navigator.getInstalledRelatedApps === 'function') {
        navigator.getInstalledRelatedApps().then((apps) => {
          const found = (apps || []).some((a) =>
            (a.id || a.url || '').indexOf('com.hybrixon.app') !== -1
            || a.id === 'com.hybrixon.app'
          );
          if (found && !document.hidden) {
            openInHybrixonApp({ goDownloadOnMiss: false });
          }
        }).catch(() => {});
      }
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


  // Keep screen / WebView awake during long uploads (Android bridge + Wake Lock).
  let wakeLock = null;
  let uploadGuardDepth = 0;
  const setUploadingGuard = (on) => {
    if (on) uploadGuardDepth += 1;
    else uploadGuardDepth = Math.max(0, uploadGuardDepth - 1);
    const active = uploadGuardDepth > 0;
    try {
      if (window.HybrixonNative && typeof window.HybrixonNative.setUploading === 'function') {
        window.HybrixonNative.setUploading(active);
      }
    } catch (_) {}
    if (active) {
      if (!wakeLock && navigator.wakeLock && navigator.wakeLock.request) {
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

  const maxVideoBytes = Number(i18n.maxVideoBytes) > 0
    ? Number(i18n.maxVideoBytes)
    : 500 * 1000 * 1000;
  const maxImageBytes = Number(i18n.maxImageBytes) > 0
    ? Number(i18n.maxImageBytes)
    : 12 * 1000 * 1000;
  const fmtMb = (n) => (n / 1000000).toFixed(n >= 100000000 ? 0 : 1);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fileKey = (file) => file.name + ':' + file.size + ':' + file.lastModified;
  const inNativeApp = !!(window.HybrixonNative)
    || /HybrixonApp/i.test(navigator.userAgent || '');

  /** Downscale large phone photos before upload (often 5–12 MB → <1.5 MB). */
  const maybeCompressImage = async (file) => {
    if (!file || !file.type || file.type.indexOf('image/') !== 0) return file;
    if (file.size < 900000) return file;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) return file;
    if (typeof createImageBitmap !== 'function') return file;
    try {
      const bmp = await createImageBitmap(file);
      const maxSide = 2048;
      const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      const w = Math.max(1, Math.round(bmp.width * scale));
      const h = Math.max(1, Math.round(bmp.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        bmp.close();
        return file;
      }
      ctx.drawImage(bmp, 0, 0, w, h);
      bmp.close();
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.82);
      });
      if (!blob || blob.size >= file.size * 0.95) return file;
      const base = file.name.replace(/\.[^.]+$/, '') || 'image';
      return new File([blob], base + '.jpg', {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      });
    } catch (_) {
      return file;
    }
  };

  const ensureFileCountHint = (input) => {
    const label = input.closest('label');
    if (!label) return null;
    let hint = label.querySelector('[data-file-count]');
    if (!hint) {
      hint = document.createElement('small');
      hint.className = 'muted';
      hint.setAttribute('data-file-count', '1');
      hint.style.display = 'block';
      hint.style.marginTop = '0.35rem';
      label.appendChild(hint);
    }
    return hint;
  };

  /**
   * Fast media staging:
   * - start uploading as soon as files are chosen (while user writes the caption)
   * - parallel XHRs (2–4)
   * - compress images client-side
   * - retry transient network errors
   */
  document.querySelectorAll('form[data-stage-uploads]').forEach((form) => {
    const stageUrl = form.getAttribute('data-stage-url') || 'api-media-stage.php';
    const purpose = form.getAttribute('data-stage-purpose') || 'posts';
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    const prevLabel = submitBtn ? (submitBtn.textContent || submitBtn.value || '') : '';
    const state = {
      // key -> { token?: string, promise?: Promise<string>, loaded: number, total: number, error?: string }
      items: new Map(),
      busy: 0,
    };
    form._hxStage = state;

    let progressEl = form.querySelector('[data-upload-progress]');
    if (!progressEl) {
      progressEl = document.createElement('p');
      progressEl.className = 'muted';
      progressEl.setAttribute('data-upload-progress', '1');
      progressEl.hidden = true;
      progressEl.style.margin = '0.5rem 0 0';
      progressEl.style.fontWeight = '600';
      if (submitBtn && submitBtn.parentNode) {
        submitBtn.parentNode.insertBefore(progressEl, submitBtn.nextSibling);
      } else {
        form.appendChild(progressEl);
      }
    }

    const renderProgress = () => {
      let done = 0;
      let total = 0;
      let loaded = 0;
      let bytes = 0;
      let errors = 0;
      state.items.forEach((row) => {
        total += 1;
        if (row.token) done += 1;
        if (row.error) errors += 1;
        loaded += row.loaded || 0;
        bytes += row.total || 0;
      });
      if (total === 0) {
        progressEl.hidden = true;
        progressEl.textContent = '';
        return;
      }
      progressEl.hidden = false;
      const pct = bytes > 0 ? Math.min(99, Math.round((loaded / bytes) * 100)) : 0;
      let text = 'Upload ' + done + '/' + total;
      if (bytes > 0 && done < total) {
        text += ' · ' + fmtMb(loaded) + '/' + fmtMb(bytes) + ' MB (' + pct + '%)';
      } else if (done === total && errors === 0) {
        text += ' · fertig — kannst veröffentlichen';
      }
      if (errors) text += ' · ' + errors + ' Fehler';
      progressEl.textContent = text;
      if (submitBtn && state.busy > 0 && form.dataset.stageSubmitting === '1') {
        submitBtn.textContent = text;
      }
    };

    const stageOne = (key, file, kind) => {
      if (state.items.has(key) && (state.items.get(key).token || state.items.get(key).promise)) {
        return state.items.get(key).promise || Promise.resolve(state.items.get(key).token);
      }
      const row = {
        token: null,
        promise: null,
        loaded: 0,
        total: file.size || 0,
        error: null,
        kind,
        file,
      };
      state.items.set(key, row);

      row.promise = (async () => {
        state.busy += 1;
        setUploadingGuard(true);
        try {
          const isVideo = kind === 'video'
            || (file.type && file.type.indexOf('video/') === 0);
          let uploadFile = file;
          if (!isVideo) {
            uploadFile = await maybeCompressImage(file);
            row.total = uploadFile.size || row.total;
          }
          const maxBytes = isVideo ? maxVideoBytes : maxImageBytes;
          if (uploadFile.size > maxBytes) {
            throw Object.assign(new Error(
              (isVideo ? 'Video' : 'Bild') + ' „' + file.name + '“ ist zu groß ('
              + Math.ceil(uploadFile.size / 1000000) + ' MB). Max. '
              + Math.floor(maxBytes / 1000000) + ' MB.'
            ), { retryable: false });
          }

          const csrfInput = form.querySelector('input[name="_csrf"]');
          const csrf = csrfInput ? csrfInput.value : (i18n.csrf || '');

          let lastErr = null;
          for (let attempt = 1; attempt <= 4; attempt++) {
            try {
              if (attempt > 1) await sleep(400 * attempt);
              const token = await new Promise((resolve, reject) => {
                const body = new FormData();
                body.append('_csrf', csrf);
                body.append('kind', kind);
                body.append('purpose', purpose);
                body.append('file', uploadFile, uploadFile.name);
                const xhr = new XMLHttpRequest();
                xhr.open('POST', stageUrl);
                xhr.withCredentials = true;
                xhr.setRequestHeader('Accept', 'application/json');
                xhr.upload.onprogress = (e) => {
                  if (!e.lengthComputable) return;
                  row.loaded = e.loaded;
                  row.total = e.total;
                  renderProgress();
                };
                xhr.onload = () => {
                  let data = null;
                  try { data = JSON.parse(xhr.responseText); } catch (_) { data = null; }
                  if (xhr.status === 413) {
                    const err = new Error(
                      'Datei zu groß für den Server (413). Max. '
                      + Math.floor(maxVideoBytes / 1000000) + ' MB je Video.'
                    );
                    err.retryable = false;
                    reject(err);
                    return;
                  }
                  if (xhr.status < 200 || xhr.status >= 300 || !data || !data.ok || !data.token) {
                    const err = new Error(
                      (data && data.error) ? data.error : ('Upload fehlgeschlagen (HTTP ' + xhr.status + ').')
                    );
                    err.retryable = xhr.status === 0 || xhr.status === 408 || xhr.status === 429
                      || xhr.status >= 500;
                    reject(err);
                    return;
                  }
                  resolve(data.token);
                };
                xhr.onerror = () => reject(Object.assign(new Error('Netzwerkfehler beim Upload.'), { retryable: true }));
                xhr.ontimeout = () => reject(Object.assign(new Error('Upload-Timeout.'), { retryable: true }));
                xhr.timeout = 30 * 60 * 1000;
                xhr.send(body);
              });
              row.token = token;
              row.loaded = row.total;
              row.error = null;
              renderProgress();
              return token;
            } catch (err) {
              lastErr = err;
              if (!err || !err.retryable || attempt === 4) throw err;
            }
          }
          throw lastErr || new Error('Upload fehlgeschlagen.');
        } catch (err) {
          row.error = (err && err.message) ? err.message : 'Fehler';
          row.promise = null;
          renderProgress();
          throw err;
        } finally {
          state.busy = Math.max(0, state.busy - 1);
          setUploadingGuard(false);
          renderProgress();
        }
      })();

      return row.promise;
    };

    const collectQueue = () => {
      const queue = [];
      form.querySelectorAll('input[type="file"]').forEach((input) => {
        if (!input.files || !input.files.length) return;
        const kind = input.getAttribute('data-stage-kind') || 'auto';
        Array.from(input.files).forEach((file) => {
          queue.push({ file, kind, key: fileKey(file), input });
        });
      });
      return queue;
    };

    const syncSelectionAndStart = () => {
      const queue = collectQueue();
      const liveKeys = new Set(queue.map((q) => q.key));
      // Drop deselected entries (tokens remain server-side until expiry — OK).
      Array.from(state.items.keys()).forEach((key) => {
        if (!liveKeys.has(key)) state.items.delete(key);
      });
      queue.forEach((q) => {
        const hint = ensureFileCountHint(q.input);
        if (hint) {
          const n = q.input.files ? q.input.files.length : 0;
          hint.textContent = n ? (n + ' Datei(en) — Upload startet…') : '';
        }
      });
      renderProgress();
      if (!queue.length) return;

      // Parallelism: more for small files, a bit less for huge videos.
      const hasHuge = queue.some((q) => q.file.size > 60 * 1000 * 1000);
      const concurrency = hasHuge
        ? (inNativeApp ? 2 : 3)
        : (inNativeApp ? 3 : 4);

      let next = 0;
      const worker = async () => {
        while (next < queue.length) {
          const i = next++;
          const item = queue[i];
          try {
            await stageOne(item.key, item.file, item.kind);
          } catch (_) {
            // keep going; submit path surfaces errors
          }
        }
      };
      const n = Math.min(concurrency, queue.length);
      Promise.all(Array.from({ length: n }, () => worker())).then(() => {
        form.querySelectorAll('input[type="file"]').forEach((input) => {
          const hint = ensureFileCountHint(input);
          if (!hint || !input.files || !input.files.length) return;
          let ready = 0;
          Array.from(input.files).forEach((file) => {
            const row = state.items.get(fileKey(file));
            if (row && row.token) ready += 1;
          });
          hint.textContent = ready + '/' + input.files.length + ' hochgeladen';
        });
        renderProgress();
      });
    };

    form.querySelectorAll('input[type="file"]').forEach((input) => {
      const max = parseInt(
        input.getAttribute('data-max-files') || input.getAttribute('data-max-images') || '15',
        10
      );
      input.addEventListener('change', () => {
        if (input.files && Number.isFinite(max) && max > 0 && input.files.length > max) {
          alert('Maximal ' + max + ' Dateien.');
          input.value = '';
          syncSelectionAndStart();
          return;
        }
        // New selection → clear submit lock so tokens can be rebuilt.
        form.dataset.stageDone = '0';
        syncSelectionAndStart();
      });
    });

    /**
     * Final publish MUST NOT multipart-upload the selected files again.
     * Android WebView often keeps FileList even after input.value='' → HTTP 413.
     * Build a clean FormData (fields + staged tokens only) and POST via fetch.
     */
    const publishWithTokens = async (tokens) => {
      const fd = new FormData();
      Array.from(form.elements).forEach((el) => {
        if (!el || !el.name || el.disabled) return;
        const tag = (el.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') return;
        if (el.type === 'file' || el.type === 'submit' || el.type === 'button') return;
        if (el.name === 'staged[]') return;
        if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
        fd.append(el.name, el.value);
      });
      tokens.forEach((token) => {
        if (token) fd.append('staged[]', token);
      });

      // Hard-disable file fields so a fallback native submit cannot attach them.
      form.querySelectorAll('input[type="file"]').forEach((input) => {
        try { input.value = ''; } catch (_) {}
        if (input.name) input.setAttribute('data-original-name', input.name);
        input.removeAttribute('name');
        input.disabled = true;
        input.removeAttribute('required');
      });

      const action = form.getAttribute('action') || window.location.href;
      const res = await fetch(action, {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
        redirect: 'manual',
      });

      if (res.status === 413) {
        throw new Error(
          'Server lehnt den Request ab (413). Bitte Seite neu laden und erneut versuchen.'
        );
      }

      // PRG redirect after successful create
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('Location') || '/';
        window.location.href = loc;
        return;
      }
      if (res.type === 'opaqueredirect' || res.status === 0) {
        window.location.href = '/';
        return;
      }
      if (res.ok) {
        // Some hosts return 200 with HTML — navigate home / reload target
        const next = (form.getAttribute('action') && form.getAttribute('action').indexOf('compose') !== -1)
          ? '/'
          : (form.getAttribute('action') || '/');
        window.location.href = next;
        return;
      }
      const text = await res.text().catch(() => '');
      throw new Error(
        'Veröffentlichen fehlgeschlagen (HTTP ' + res.status + ').'
        + (text && text.length < 180 ? (' ' + text) : '')
      );
    };

    form.addEventListener('submit', async (event) => {
      // Always intercept staging forms — never let the browser POST raw files.
      const queue = collectQueue();
      const stagedTokens = [];
      state.items.forEach((row) => {
        if (row && row.token) stagedTokens.push(row.token);
      });

      if (!queue.length && !stagedTokens.length) {
        return; // text-only post
      }

      event.preventDefault();
      event.stopPropagation();
      form.dataset.stageSubmitting = '1';
      if (submitBtn) submitBtn.disabled = true;
      setUploadingGuard(true);
      renderProgress();

      try {
        let tokens = stagedTokens.slice();
        if (queue.length) {
          // Finish any eager uploads still in flight / not started.
          // Huge videos: max 2 parallel to reduce 413/proxy pressure.
          const hasHuge = queue.some((q) => q.file.size > 60 * 1000 * 1000);
          const concurrency = hasHuge ? 2 : (inNativeApp ? 3 : 4);
          let next = 0;
          const ordered = new Array(queue.length);
          const worker = async () => {
            while (next < queue.length) {
              const i = next++;
              const item = queue[i];
              ordered[i] = await stageOne(item.key, item.file, item.kind);
            }
          };
          await Promise.all(
            Array.from({ length: Math.min(concurrency, queue.length) }, () => worker())
          );
          tokens = ordered;
        }

        if (!tokens.length) {
          throw new Error('Keine Medien-Tokens — Upload bitte erneut starten.');
        }

        if (submitBtn) submitBtn.textContent = 'Veröffentlichen…';
        progressEl.hidden = false;
        progressEl.textContent = 'Veröffentlichen…';
        form.dataset.stageDone = '1';
        await publishWithTokens(tokens);
      } catch (err) {
        form.dataset.stageDone = '0';
        // Re-enable file inputs for retry
        form.querySelectorAll('input[type="file"]').forEach((input) => {
          input.disabled = false;
          if (!input.getAttribute('name')) {
            const original = input.getAttribute('data-original-name');
            const kind = input.getAttribute('data-stage-kind');
            if (original) input.setAttribute('name', original);
            else if (kind === 'video') input.setAttribute('name', 'videos[]');
            else input.setAttribute('name', 'images[]');
          }
        });
        const msg = (err && err.message) ? err.message : 'Upload fehlgeschlagen.';
        alert(
          msg
          + '\n\nTipp: Große Videos werden einzeln hochgeladen — App geöffnet lassen.'
        );
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = prevLabel;
        }
      } finally {
        form.dataset.stageSubmitting = '0';
        setUploadingGuard(false);
      }
    }, true);
  });

  // File-count hints for non-staging forms (legacy).
  document.querySelectorAll('form:not([data-stage-uploads]) [data-max-files], form:not([data-stage-uploads]) [data-max-images]').forEach((input) => {
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
      const hint = ensureFileCountHint(input);
      if (hint) {
        hint.textContent = input.files.length
          ? (input.files.length + ' Datei(en) ausgewählt')
          : '';
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
