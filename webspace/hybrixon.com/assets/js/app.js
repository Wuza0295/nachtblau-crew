/* hx-csrf-fix-20261005 */
document.addEventListener('DOMContentLoaded', () => {
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


  const imageInput = document.querySelector('[data-max-images]');
  if (imageInput) {
    const max = parseInt(imageInput.getAttribute('data-max-images') || '15', 10);
    imageInput.addEventListener('change', () => {
      if (imageInput.files && imageInput.files.length > max) {
        alert('Maximal ' + max + ' Bilder.');
        imageInput.value = '';
      }
    });
  }

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

  // Lazy videos: no network until play / near viewport
  const activateVideo = (figure) => {
    if (!figure || figure.dataset.videoReady === '1') return;
    const video = figure.querySelector('video[data-src]');
    const poster = figure.querySelector('[data-video-load]');
    if (!video) return;
    const src = video.getAttribute('data-src');
    if (!src) return;
    video.src = src;
    video.removeAttribute('hidden');
    if (poster) poster.hidden = true;
    figure.dataset.videoReady = '1';
    video.load();
  };

  document.addEventListener('click', (e) => {
    const poster = e.target.closest('[data-video-load]');
    if (!poster) return;
    e.preventDefault();
    const figure = poster.closest('.post-video');
    activateVideo(figure);
    const video = figure && figure.querySelector('video');
    if (video) {
      video.play().catch(() => {});
    }
  });

  document.querySelectorAll('[data-media-more]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const grid = btn.previousElementSibling;
      if (!grid || !grid.classList.contains('media-grid')) return;
      grid.querySelectorAll('.media-extra').forEach((el) => {
        el.hidden = false;
      });
      btn.remove();
    });
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          const video = entry.target.querySelector('video');
          if (video && !video.paused) video.pause();
          return;
        }
      });
    }, { rootMargin: '120px 0px', threshold: 0.15 });
    document.querySelectorAll('.post-video').forEach((fig) => io.observe(fig));
  }

  // Keep theme-color / dataset scheme in sync for System theme
  const themeMeta = document.getElementById('hx-theme-color');
  const syncSystemTheme = () => {
    if (!document.body.classList.contains('theme-system')) return;
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.hxScheme = dark ? 'aurora' : 'light';
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#07090d' : '#e8f0f1');
  };
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    syncSystemTheme();
    if (mq.addEventListener) mq.addEventListener('change', syncSystemTheme);
    else if (mq.addListener) mq.addListener(syncSystemTheme);
  }

  // Capture a lightweight JPEG poster from a local video file (for feed previews).
  const captureVideoPoster = (file) => new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.src = url;
      const fail = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      const timer = setTimeout(fail, 8000);
      video.addEventListener('loadeddata', () => {
        const seekTo = Math.min(1, Math.max(0.1, (video.duration || 1) * 0.08));
        const onSeeked = () => {
          clearTimeout(timer);
          try {
            const w = video.videoWidth || 0;
            const h = video.videoHeight || 0;
            if (w < 2 || h < 2) { fail(); return; }
            const maxW = 720;
            const scale = Math.min(1, maxW / w);
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(w * scale));
            canvas.height = Math.max(1, Math.round(h * scale));
            const ctx = canvas.getContext('2d');
            if (!ctx) { fail(); return; }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              URL.revokeObjectURL(url);
              if (!blob) { resolve(null); return; }
              resolve(new File([blob], 'poster.jpg', { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.72);
          } catch (_) {
            fail();
          }
        };
        video.addEventListener('seeked', onSeeked, { once: true });
        try { video.currentTime = seekTo; } catch (_) { onSeeked(); }
      }, { once: true });
      video.addEventListener('error', fail, { once: true });
    } catch (_) {
      resolve(null);
    }
  });

  // Staged uploads: one file at a time (+ optional video poster) to avoid HTTP 413.
  document.querySelectorAll('form[data-stage-uploads]').forEach((form) => {
    const stageUrl = form.getAttribute('data-stage-url');
    if (!stageUrl) return;
    const purpose = form.getAttribute('data-stage-purpose') || 'posts';
    const csrf = form.querySelector('input[name="_csrf"]')?.value || '';
    const status = document.createElement('p');
    status.className = 'muted stage-status';
    status.hidden = true;
    form.appendChild(status);

    form.addEventListener('submit', async (e) => {
      const inputs = Array.from(form.querySelectorAll('input[type="file"][data-stage-kind]'));
      const jobs = [];
      inputs.forEach((input) => {
        const kind = input.getAttribute('data-stage-kind') || 'auto';
        const max = parseInt(input.getAttribute('data-max-files') || '20', 10);
        const files = Array.from(input.files || []).slice(0, max);
        files.forEach((file) => jobs.push({ file, kind }));
      });
      if (!jobs.length) return;

      if (!csrf) {
        e.preventDefault();
        status.hidden = false;
        status.textContent = 'Sitzung abgelaufen — bitte Seite neu laden.';
        return;
      }

      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      status.hidden = false;
      status.textContent = 'Medien werden hochgeladen …';

      // Remove previous staged tokens
      form.querySelectorAll('input[name="staged[]"]').forEach((el) => el.remove());

      try {
        for (let i = 0; i < jobs.length; i += 1) {
          const { file, kind } = jobs[i];
          status.textContent = `Lade ${i + 1}/${jobs.length}: ${file.name}`;
          const fd = new FormData();
          if (csrf) fd.append('_csrf', csrf);
          fd.append('kind', kind);
          fd.append('purpose', purpose);
          fd.append('file', file, file.name);
          if (kind === 'video' || (kind === 'auto' && file.type.startsWith('video/'))) {
            const poster = await captureVideoPoster(file);
            if (poster) fd.append('poster', poster, 'poster.jpg');
          }
          const res = await fetch(stageUrl, { method: 'POST', body: fd, credentials: 'same-origin' });
          const data = await res.json().catch(() => ({ ok: false, error: 'Upload fehlgeschlagen' }));
          if (!res.ok || !data.ok) {
            throw new Error(data.error || `Upload fehlgeschlagen (${res.status})`);
          }
          const hidden = document.createElement('input');
          hidden.type = 'hidden';
          hidden.name = 'staged[]';
          hidden.value = data.token;
          form.appendChild(hidden);
        }
        // Clear file inputs so browser does not re-upload huge binaries
        inputs.forEach((input) => { input.value = ''; });
        status.textContent = 'Veröffentlichen …';
        form.submit();
      } catch (err) {
        status.textContent = err && err.message ? err.message : 'Upload fehlgeschlagen';
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
});
