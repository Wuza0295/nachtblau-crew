let games = [];
let categories = [];
let monetization = null;
let siteMeta = null;
let selectedId = null;
let activeCategoryId = 'all';
let activeSubcategoryId = 'all';
let updating = false;
let selectSeq = 0;
let previewLoadTimer = null;
let particlesRunning = true;

const $ = (sel) => document.querySelector(sel);

function coverSrc(game) {
  return game?.cover || 'assets/games/default-cover.svg';
}

function formatEuro(amount) {
  return `${Number(amount).toFixed(2).replace('.', ',')} €`;
}

function isSymbioseItem(game) {
  return game?.type === 'book' || game?.type === 'gallery';
}

function matchRule(game, rule) {
  if (!rule) return true;
  return Object.entries(rule).every(([key, value]) => {
    const actual = game[key];
    if (Array.isArray(value)) return value.includes(actual);
    return actual === value;
  });
}

function getActiveCategory() {
  return categories.find((c) => c.id === activeCategoryId) || categories[0];
}

function getFilteredGames() {
  const category = getActiveCategory();
  if (!category || category.id === 'all') return games;

  let filtered = games.filter((g) => matchRule(g, category.match));
  const sub = category.subcategories?.find((s) => s.id === activeSubcategoryId);
  if (sub && sub.id !== 'all' && sub.match) {
    filtered = filtered.filter((g) => matchRule(g, sub.match));
  }
  return filtered;
}

function tileCategoryLabel(game) {
  if (game.type === 'book') return 'Buch';
  if (game.type === 'gallery') return 'Galerie';
  return game.status || 'Spiel';
}

function symbiosePreviewHint(game) {
  if (game.type === 'gallery') return 'Alle Illustrationen kostenlos verfügbar';
  return 'Vollständiger Roman — kostenlos lesen';
}

function symbioseCtaLabel(game) {
  if (game.type === 'gallery') return 'Galerie öffnen';
  return 'Vollständig lesen';
}

function setTheme(game) {
  const accent = game?.accent || '#5eeaff';
  const accent2 = game?.accentSecondary || '#a8e6ff';
  document.documentElement.style.setProperty('--game-accent', accent);
  document.documentElement.style.setProperty('--game-accent-2', accent2);

  document.querySelectorAll('.bg-layer').forEach((layer) => {
    const isActive = layer.dataset.bg === (game?.background || 'default');
    layer.classList.toggle('active', isActive);
    if (isActive && game?.cover) {
      const photo = layer.querySelector('.bg-photo');
      if (photo) photo.src = game.cover;
    }
  });
}

function showToast(message, isError = false) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.remove('hidden');
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 400);
  }, 3500);
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function renderPresetButtons(container, input, amounts) {
  if (!container || !input) return;
  container.innerHTML = amounts
    .map((a) => `<button type="button" class="preset-btn" data-amount="${a}">${formatEuro(a)}</button>`)
    .join('');
  container.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      input.value = Number(btn.dataset.amount).toFixed(2);
    });
  });
}

function buildGameTile(game) {
  const btn = document.createElement('button');
  btn.type = 'button';
  const featured = game.featured ? ' game-tile-featured' : '';
  btn.className = 'game-tile' + featured + (game.id === selectedId ? ' selected' : '');
  btn.dataset.id = game.id;

  const cover = coverSrc(game);

  btn.innerHTML = `
    <div class="game-tile-cover">
      <img src="${escapeAttr(cover)}" alt="" loading="lazy" decoding="async">
      <span class="game-tile-cat">${escapeHtml(tileCategoryLabel(game))}</span>
      ${game.featured ? '<span class="game-tile-star" aria-hidden="true">★</span>' : ''}
      ${game.type === 'game' && game.web?.playUrl ? '<span class="game-tile-play" aria-hidden="true">▶</span>' : ''}
    </div>
    <div class="game-tile-info">
      <span class="game-tile-title">${escapeHtml(game.title)}</span>
      <span class="game-tile-sub">${escapeHtml(game.subtitle)}</span>
    </div>
  `;
  btn.addEventListener('click', () => selectGame(game.id));
  if (game.type === 'game' && game.web?.playUrl) {
    btn.addEventListener('dblclick', (e) => {
      e.preventDefault();
      selectGame(game.id).then(() => launchSelected());
    });
  }
  return btn;
}

function renderCategoryTabs() {
  const tabs = $('#category-tabs');
  const subtabs = $('#category-subtabs');
  if (!tabs) return;

  tabs.innerHTML = categories.map((cat) => {
    const count = cat.id === 'all'
      ? games.length
      : games.filter((g) => matchRule(g, cat.match)).length;
    const selected = cat.id === activeCategoryId ? ' selected' : '';
    const icon = cat.icon ? `<span class="category-tab-icon" aria-hidden="true">${cat.icon}</span>` : '';
    return `<button type="button" class="category-tab${selected}" data-category="${cat.id}">${icon}<span>${escapeHtml(cat.label)}</span><span class="category-tab-count">${count}</span></button>`;
  }).join('');

  tabs.querySelectorAll('.category-tab').forEach((btn) => {
    btn.addEventListener('click', () => setCategory(btn.dataset.category));
  });

  const category = getActiveCategory();
  if (subtabs && category?.subcategories?.length) {
    subtabs.classList.remove('hidden');
    subtabs.innerHTML = category.subcategories.map((sub) => {
      const selected = sub.id === activeSubcategoryId ? ' selected' : '';
      const count = sub.id === 'all'
        ? games.filter((g) => matchRule(g, category.match)).length
        : games.filter((g) => matchRule(g, category.match) && matchRule(g, sub.match)).length;
      return `<button type="button" class="category-subtab${selected}" data-subcategory="${sub.id}">${escapeHtml(sub.label)}<span class="category-tab-count">${count}</span></button>`;
    }).join('');

    subtabs.querySelectorAll('.category-subtab').forEach((btn) => {
      btn.addEventListener('click', () => setSubcategory(btn.dataset.subcategory));
    });
  } else if (subtabs) {
    subtabs.classList.add('hidden');
    subtabs.innerHTML = '';
  }
}

async function setCategory(id) {
  if (activeCategoryId === id) return;
  activeCategoryId = id;
  activeSubcategoryId = 'all';
  renderCategoryTabs();
  renderGameList();
  await ensureSelectionVisible();
}

async function setSubcategory(id) {
  if (activeSubcategoryId === id) return;
  activeSubcategoryId = id;
  renderCategoryTabs();
  renderGameList();
  await ensureSelectionVisible();
}

async function ensureSelectionVisible() {
  const visible = getFilteredGames();
  if (!visible.length) {
    selectedId = null;
    hideAllPreviewModes();
    resetPreviewFrame();
    $('#preview-empty')?.classList.remove('hidden');
    $('#detail-empty')?.classList.remove('hidden');
    $('#detail-content')?.classList.add('hidden');
    setTheme(null);
    return;
  }
  if (!visible.some((g) => g.id === selectedId)) {
    await selectGame(visible[0].id);
  } else {
    renderGameList();
  }
}

function renderGameList() {
  const list = $('#game-list');
  if (!list) return;

  list.innerHTML = '';
  getFilteredGames().forEach((game) => {
    const li = document.createElement('li');
    li.appendChild(buildGameTile(game));
    list.appendChild(li);
  });
}

function hideAllPreviewModes() {
  $('#preview-empty')?.classList.add('hidden');
  $('#preview-cover')?.classList.add('hidden');
  $('#preview-loading')?.classList.add('hidden');
  $('#preview-frame')?.classList.add('hidden');
  $('#preview-reader')?.classList.add('hidden');
  $('#preview-stage')?.classList.remove('is-fullscreen');
}

function resetPreviewFrame() {
  const frame = $('#preview-frame');
  if (frame) frame.src = 'about:blank';
}

function showPreviewLoading() {
  hideAllPreviewModes();
  $('#preview-loading')?.classList.remove('hidden');
}

function showPreviewCover(game, hint, options = {}) {
  hideAllPreviewModes();
  resetPreviewFrame();
  const img = $('#preview-cover-img');
  const hintEl = $('#preview-cover-hint');
  const cta = $('#preview-cover-cta');
  const showPlayCta = !!options.showPlayCta;
  if (img) {
    img.src = coverSrc(game);
    img.alt = `${game.title} ${game.subtitle}`;
    img.onerror = () => { img.src = 'assets/games/default-cover.svg'; };
  }
  if (hintEl) {
    hintEl.textContent = hint || 'Vorschau nicht verfügbar';
    hintEl.classList.toggle('hidden', showPlayCta);
  }
  if (cta) {
    cta.classList.toggle('hidden', !showPlayCta);
    const label = $('#btn-preview-play-label');
    const icon = $('#btn-preview-play')?.querySelector('.btn-icon');
    if (label) label.textContent = options.ctaLabel || game?.web?.label || 'Spiel starten';
    if (icon) icon.textContent = options.ctaIcon || '▶';
  }
  const hintCta = $('#preview-cover-cta-hint');
  if (hintCta && showPlayCta) {
    hintCta.textContent = options.ctaHint || (
      isSymbioseItem(game)
        ? 'Vollinhalt öffnet sich hier · Trinkgeld optional rechts'
        : 'Öffnet in eigenem Fenster · Doppelklick auf Kachel = sofort starten'
    );
  }
  $('#preview-cover')?.classList.remove('hidden');
}

function renderGalleryGrid(items, unlocked, game) {
  if (!items?.length) {
    return '<p class="panel-text">Noch keine Illustrationen im Build enthalten.</p>';
  }
  const tiles = items.map((item) => {
    const locked = !unlocked || !item.src;
    return `
      <figure class="gallery-tile${locked ? ' is-locked' : ''}">
        <div class="gallery-tile-frame">
          <img src="${locked ? coverSrc(game) : escapeAttr(item.src)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async">
          ${locked ? '<span class="gallery-lock" aria-hidden="true">🔒</span>' : ''}
        </div>
        <figcaption>${escapeHtml(item.title)}${item.caption ? ` · ${escapeHtml(item.caption)}` : ''}</figcaption>
      </figure>`;
  }).join('');
  return `<div class="gallery-grid">${tiles}</div>`;
}

async function renderContentPreview(game, fullView = false) {
  const productId = game.paywall?.productId || game.id;
  let data;
  try {
    data = await window.launcher.getBook(productId);
  } catch (err) {
    showPreviewCover(game, 'Inhalt konnte nicht geladen werden');
    return null;
  }

  hideAllPreviewModes();
  resetPreviewFrame();

  const reader = $('#preview-reader');
  const body = $('#reader-body');
  if (!reader || !body) return data;

  $('#reader-kicker').textContent = data.meta.tagline || 'NachtBlau Publishing';
  $('#reader-title').textContent = data.meta.title || game.subtitle;
  $('#reader-author').textContent = data.meta.author || '';

  let html = '';

  if (data.isGallery) {
    if (data.preview) html += `<div class="reader-prose reader-preview">${data.preview}</div>`;
    if (fullView) html += renderGalleryGrid(data.gallery, true, game);
  } else {
    if (data.preview) html += `<div class="reader-prose reader-preview">${data.preview}</div>`;
    if (fullView && data.chapters?.length) {
      html += data.chapters.map((ch) => `
        <article class="reader-chapter">
          <h3 class="reader-chapter-title">${escapeHtml(ch.title)}</h3>
          <div class="reader-prose">${ch.content}</div>
        </article>`).join('');
    }
  }

  body.innerHTML = html;
  reader.classList.remove('hidden');
  body.scrollTop = 0;

  return data;
}

async function loadPreview(game, seq) {
  clearTimeout(previewLoadTimer);
  if (!game) {
    hideAllPreviewModes();
    resetPreviewFrame();
    $('#preview-empty')?.classList.remove('hidden');
    return;
  }

  showPreviewLoading();

  previewLoadTimer = setTimeout(async () => {
    if (seq !== selectSeq) return;

    try {
      if (isSymbioseItem(game)) {
        showPreviewCover(game, symbiosePreviewHint(game), {
          showPlayCta: true,
          ctaLabel: symbioseCtaLabel(game),
          ctaIcon: game.type === 'gallery' ? '🖼' : '📖',
        });
        if (seq === selectSeq) $('#preview-loading')?.classList.add('hidden');
        return;
      }

      const preview = await window.launcher.getPreviewUrl(game.id);
      if (seq !== selectSeq) return;

      const canPlay = !!game.web?.playUrl;
      showPreviewCover(game, preview?.hint, { showPlayCta: canPlay });
      if (seq === selectSeq) $('#preview-loading')?.classList.add('hidden');
    } catch (err) {
      if (seq !== selectSeq) return;
      showPreviewCover(game, 'Vorschau nicht verfügbar');
      $('#preview-loading')?.classList.add('hidden');
    }
  }, 120);
}

function configureMonetization(game) {
  const tip = $('#detail-tip');
  const tipBtn = $('#btn-tip');
  const tipsEnabled = monetization?.tips?.enabled !== false;

  if (tipsEnabled) {
    tipBtn?.classList.remove('hidden');
    tip?.classList.remove('hidden');
    renderPresetButtons($('#tip-presets'), $('#tip-amount'), monetization?.tips?.presets || [2, 5, 10]);
    const tipStatus = $('#tip-status');
    if (tipStatus) tipStatus.textContent = '';
    const tipText = $('#tip-panel-text');
    if (tipText) {
      tipText.textContent = isSymbioseItem(game)
        ? 'Symbiose ist kostenlos — Trinkgeld unterstützt NachtBlau Publishing.'
        : 'Alle Spiele sind kostenlos spielbar — Trinkgeld ist freiwillig.';
    }
  } else {
    tipBtn?.classList.add('hidden');
    tip?.classList.add('hidden');
  }
}

function configureActions(game) {
  const playLabel = $('#btn-play-label');
  const playIcon = $('#btn-play-icon');

  if (isSymbioseItem(game)) {
    if (playLabel) playLabel.textContent = game.type === 'gallery' ? 'Galerie öffnen' : 'Vollständig lesen';
    if (playIcon) playIcon.textContent = game.type === 'gallery' ? '🖼' : '📖';
  } else {
    if (playLabel) playLabel.textContent = 'Spiel starten';
    if (playIcon) playIcon.textContent = '▶';
  }

  const playBtn = $('#btn-play');
  if (playBtn) playBtn.disabled = !game.installInfo.installed;

  const webBtn = $('#btn-website');
  if (webBtn) {
    if (game.websiteUrl) {
      webBtn.hidden = false;
      webBtn.onclick = () => window.launcher.openUrl(game.websiteUrl);
    } else {
      webBtn.hidden = true;
    }
  }

  const itchBtn = $('#btn-itch');
  if (itchBtn) {
    if (game.type === 'game' && game.itchUrl) {
      itchBtn.hidden = false;
      itchBtn.onclick = () => window.launcher.openUrl(game.itchUrl);
    } else {
      itchBtn.hidden = true;
    }
  }
}

async function selectGame(id) {
  const seq = ++selectSeq;
  selectedId = id;
  const game = games.find((g) => g.id === id);
  if (!game) return;

  setTheme(game);
  renderGameList();

  $('#detail-empty')?.classList.add('hidden');
  $('#detail-content')?.classList.remove('hidden');

  $('#detail-status').textContent = game.status;
  $('#detail-genre').textContent = game.genre;
  const catBadge = $('#detail-category');
  if (catBadge) {
    const catLabel = tileCategoryLabel(game);
    catBadge.textContent = catLabel;
    catBadge.classList.toggle('hidden', !catLabel);
  }
  $('#detail-title').textContent = game.title;
  $('#detail-subtitle').textContent = game.subtitle;
  $('#detail-desc').textContent = game.description;
  $('#detail-version').textContent = game.type === 'book' || game.type === 'gallery'
    ? `${game.version}${game.author ? ` · ${game.author}` : ''}`
    : `Version ${game.version}`;

  const pathEl = $('#detail-path-status');
  if (pathEl) {
    if (isSymbioseItem(game)) {
      pathEl.textContent = '✓ Kostenlos — vollständiger Inhalt verfügbar';
      pathEl.className = 'detail-path-status ok';
    } else {
      pathEl.textContent = '✓ Im Browser spielbar — startet in eigenem Fenster';
      pathEl.className = 'detail-path-status ok';
    }
  }

  configureMonetization(game);
  configureActions(game);
  await loadPreview(game, seq);
}

async function openFullContent(game) {
  await renderContentPreview(game, true);
}

async function startTipPayment(game) {
  const amount = parseFloat($('#tip-amount')?.value);
  const min = 1;
  if (!Number.isFinite(amount) || amount < min) {
    showToast(`Bitte mindestens ${formatEuro(min)} eingeben.`, true);
    $('#detail-tip')?.setAttribute('open', '');
    return;
  }
  const status = $('#tip-status');
  if (status) status.textContent = 'Weiterleitung zu PayPal …';
  try {
    const url = await window.launcher.createPayPalUrl({
      kind: 'tip',
      productId: game.id,
      amount,
      itemName: game.tip?.paypalItem || `Trinkgeld — ${game.title} ${game.subtitle}`,
    });
    window.location.href = url;
  } catch (err) {
    showToast(err.message || String(err), true);
    if (status) status.textContent = '';
  }
}

async function launchSelected() {
  if (!selectedId) return;
  const game = games.find((g) => g.id === selectedId);
  if (!game) return;

  if (isSymbioseItem(game)) {
    await openFullContent(game);
    return;
  }

  try {
    await window.launcher.launchGame(selectedId);
    showToast('Spiel wird in eigenem Fenster geöffnet…');
  } catch (err) {
    showToast(err.message || String(err), true);
  }
}

async function refreshConfig() {
  const config = await window.launcher.getConfig();
  games = config.games || [];
  categories = config.categories?.length ? config.categories : [
    { id: 'all', label: 'Alle', icon: '◈' },
    { id: 'games', label: 'Spiele', icon: '▶', match: { type: 'game' } },
    {
      id: 'symbiose',
      label: 'Symbiose',
      icon: '📖',
      match: { type: ['book', 'gallery'] },
      subcategories: [
        { id: 'all', label: 'Alle' },
        { id: 'book', label: 'Bücher', match: { type: 'book' } },
        { id: 'gallery', label: 'Galerie', match: { type: 'gallery' } },
      ],
    },
  ];
  monetization = config.monetization;
  siteMeta = config.site;
  if (config.studio?.tagline) {
    const tagline = $('#studio-tagline');
    if (tagline) tagline.textContent = config.studio.tagline;
  }
  if (siteMeta?.mainSite) {
    const link = $('#link-main-site');
    if (link) link.href = siteMeta.mainSite;
  }
  const platformLabel = $('#platform-label');
  if (platformLabel && config.platform) {
    const labels = { web: 'Web Hub', linux: 'Linux Hub', android: 'Android App' };
    platformLabel.textContent = labels[config.platform] || `${config.platform} Hub`;
  }
}

function initParticles() {
  const canvas = $('#particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let particles = [];
  let accent = '#5eeaff';
  let rafId = 0;

  const resize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  };

  const createParticles = () => {
    const count = Math.min(50, Math.floor((w * h) / 28000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      a: Math.random() * 0.4 + 0.08,
    }));
  };

  const draw = () => {
    if (!particlesRunning) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.globalAlpha = p.a;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(draw);
  };

  document.addEventListener('visibilitychange', () => {
    particlesRunning = !document.hidden;
    if (particlesRunning) draw();
    else cancelAnimationFrame(rafId);
  });

  window.addEventListener('resize', () => { resize(); createParticles(); });
  resize();
  createParticles();
  draw();
}

async function init() {
  if (!window.launcher) {
    document.body.innerHTML = '<p style="padding:2rem;color:#fff">Web-Bridge nicht geladen.</p>';
    return;
  }

  window.addEventListener('unhandledrejection', (e) => {
    console.error(e.reason);
    showToast('Ein Fehler ist aufgetreten', true);
  });

  try {
    await refreshConfig();
    renderCategoryTabs();
    renderGameList();
    setTheme(null);

    if (games.length > 0) {
      const featured = games.find((g) => g.featured) || games[0];
      const urlGame = new URLSearchParams(window.location.search).get('game');
      const pick = urlGame && games.some((g) => g.id === urlGame) ? urlGame : featured.id;
      activeCategoryId = 'all';
      activeSubcategoryId = 'all';
      renderCategoryTabs();
      renderGameList();
      await selectGame(pick);
    } else {
      hideAllPreviewModes();
      $('#preview-empty')?.classList.remove('hidden');
      showToast('Keine Titel in der Konfiguration gefunden', true);
    }
  } catch (err) {
    console.error(err);
    showToast('Launcher konnte nicht geladen werden', true);
  }

  $('#btn-play')?.addEventListener('click', launchSelected);
  $('#btn-preview-play')?.addEventListener('click', launchSelected);
  $('#btn-tip')?.addEventListener('click', () => {
    const game = games.find((g) => g.id === selectedId);
    if (game) startTipPayment(game);
  });
  $('#tip-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const game = games.find((g) => g.id === selectedId);
    if (game) startTipPayment(game);
  });

  window.launcher.onPaymentResult(async (result) => {
    if (result.success) {
      showToast(result.message);
    } else if (result.message) {
      showToast(result.message, true);
    }
  });

  initParticles();
}

init();
