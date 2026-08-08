<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/social.php';
require_once __DIR__ . '/i18n.php';

hybrixon_enforce_canonical_host();
hybrixon_handle_lang_switch();

$currentUser = allxion_current_user();
$pageTitle = $pageTitle ?? ALLXION_NAME;
$pageDescription = $pageDescription ?? (ALLXION_NAME . ' · ' . ALLXION_TAGLINE);
$activeNav = $activeNav ?? 'feed';
$flashes = take_flashes();
$canSeeAdult = $currentUser && user_age_verified($currentUser);
$uiTheme = hybrixon_active_theme($currentUser);
$brandStyle = hybrixon_active_brand_style($currentUser);
$uiLang = hybrixon_active_lang($currentUser);
$dmUnread = 0;
$notifUnread = 0;
if ($currentUser) {
    require_once __DIR__ . '/dm.php';
    if (dm_user_eligible($currentUser)) {
        $dmUnread = dm_unread_count((int)$currentUser['id']);
    }
    require_once __DIR__ . '/notifications.php';
    $notifUnread = notifications_unread_count((int)$currentUser['id']);
}

$searchQ = trim((string)($_GET['q'] ?? ''));
if ($activeNav !== 'search') {
    $searchQ = '';
}

if (!headers_sent()) {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
}

if (!isset($pageUrl)) {
    $reqPath = (string)(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/');
    $reqQuery = (string)(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_QUERY) ?? '');
    if (str_starts_with($reqPath, '/hybrixon')) {
        $reqPath = substr($reqPath, strlen('/hybrixon')) ?: '/';
    }
    $canonicalPath = ltrim($reqPath, '/');
    if ($reqQuery !== '') {
        $canonicalPath .= '?' . $reqQuery;
    }
    $pageUrl = hybrixon_public_url($canonicalPath);
}
?>
<!DOCTYPE html>
<html lang="<?= e($uiLang) ?>">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title><?= e($pageTitle) ?></title>
  <meta name="description" content="<?= e($pageDescription) ?>">
  <link rel="canonical" href="<?= e($pageUrl) ?>">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="<?= e(ALLXION_NAME) ?>">
  <meta property="og:title" content="<?= e($pageTitle) ?>">
  <meta property="og:description" content="<?= e($pageDescription) ?>">
  <meta property="og:url" content="<?= e($pageUrl) ?>">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="<?= e($pageTitle) ?>">
  <meta name="twitter:description" content="<?= e($pageDescription) ?>">
  <meta name="theme-color" content="<?= $uiTheme === 'light' ? '#e8f0f1' : '#12100e' ?>">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <?php if (!empty($noIndex)): ?>
  <meta name="robots" content="noindex,nofollow">
  <?php endif; ?>
  <link rel="icon" href="<?= e(allxion_url('assets/img/favicon.svg')) ?>" type="image/svg+xml">
  <link rel="apple-touch-icon" href="<?= e(allxion_url('assets/img/logo-avatar.png')) ?>">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Hybrixon">
  <link rel="manifest" href="<?= e(allxion_url('manifest.json')) ?>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&family=Oxanium:wght@600;700;800&family=Sora:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= e(allxion_url('assets/css/style.css')) ?>">
</head>
<body class="theme-<?= e($uiTheme) ?>">
<div class="app">
  <header class="topbar">
    <div class="topbar-left">
      <a class="brand brand-<?= e($brandStyle) ?>" href="<?= e(allxion_url()) ?>" aria-label="Hybrixon">
        <?php if ($brandStyle !== 'text'): ?>
          <img class="brand-logo" src="<?= e(allxion_url('assets/img/logo.svg')) ?>" width="40" height="40" alt="">
        <?php endif; ?>
        <?php if ($brandStyle !== 'logo'): ?>
          <span class="brand-text">
            <strong>Hybrixon</strong>
            <?php if ($brandStyle === 'logo_text'): ?>
              <small class="brand-tagline"><?= e(ALLXION_TAGLINE) ?></small>
            <?php endif; ?>
          </span>
        <?php endif; ?>
      </a>
      <form class="top-search" method="get" action="<?= e(allxion_url('search.php')) ?>" role="search">
        <svg class="top-search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="search" name="q" value="<?= e($searchQ) ?>" minlength="2" placeholder="<?= e(t('nav.search_placeholder')) ?>" aria-label="<?= e(t('nav.search_placeholder')) ?>">
      </form>
      <a href="<?= e(allxion_url('search.php')) ?>" class="top-search-btn<?= $activeNav === 'search' ? ' active' : '' ?>" aria-label="<?= e(t('nav.search')) ?>" title="<?= e(t('nav.search')) ?>">
        <svg class="nav-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
      </a>
    </div>

    <nav class="topbar-center" aria-label="<?= e(t('nav.feed')) ?>">
      <a href="<?= e(allxion_url()) ?>" class="topbar-tab<?= $activeNav === 'feed' ? ' active' : '' ?>" aria-label="<?= e(t('nav.feed')) ?>" title="<?= e(t('nav.feed')) ?>">
        <svg class="nav-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h14V10"/></svg>
      </a>
      <a href="<?= e(allxion_url('shorts-feed.php')) ?>" class="topbar-tab<?= $activeNav === 'reels' || $activeNav === 'shorts' ? ' active' : '' ?>" aria-label="<?= e(t('nav.reels')) ?>" title="<?= e(t('nav.reels')) ?>">
        <svg class="nav-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m10 9 5 3-5 3V9z"/></svg>
      </a>
      <a href="<?= e(allxion_url('stories.php')) ?>" class="topbar-tab<?= $activeNav === 'stories' ? ' active' : '' ?>" aria-label="<?= e(t('nav.stories')) ?>" title="<?= e(t('nav.stories')) ?>">
        <svg class="nav-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>
      </a>
      <a href="<?= e(allxion_url('groups.php')) ?>" class="topbar-tab<?= $activeNav === 'groups' ? ' active' : '' ?>" aria-label="<?= e(t('nav.groups')) ?>" title="<?= e(t('nav.groups')) ?>">
        <svg class="nav-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </a>
      <?php if ($currentUser): ?>
        <a href="<?= e(allxion_url('friends.php')) ?>" class="topbar-tab<?= $activeNav === 'friends' ? ' active' : '' ?>" aria-label="<?= e(t('nav.friends')) ?>" title="<?= e(t('nav.friends')) ?>">
          <svg class="nav-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/></svg>
        </a>
      <?php else: ?>
        <a href="<?= e(allxion_url('search.php')) ?>" class="topbar-tab<?= $activeNav === 'search' ? ' active' : '' ?>" aria-label="<?= e(t('nav.search')) ?>" title="<?= e(t('nav.search')) ?>">
          <svg class="nav-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        </a>
      <?php endif; ?>
    </nav>

    <div class="topbar-right">
      <?php if ($currentUser): ?>
        <a href="<?= e(allxion_url('compose.php')) ?>" class="nav-icon-link nav-round<?= $activeNav === 'compose' ? ' active' : '' ?>" aria-label="<?= e(t('nav.post')) ?>" title="<?= e(t('nav.post')) ?>">
          <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
        </a>
        <a href="<?= e(allxion_url('messages.php')) ?>" class="nav-icon-link nav-round<?= $activeNav === 'messages' ? ' active' : '' ?>" aria-label="<?= e(t('nav.messages')) ?><?= $dmUnread > 0 ? ' (' . (int)$dmUnread . ')' : '' ?>" title="<?= e(t('nav.messages')) ?>">
          <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <?php if ($dmUnread > 0): ?><span class="nav-badge nav-badge-icon"><?= (int)$dmUnread ?></span><?php endif; ?>
        </a>
        <a href="<?= e(allxion_url('notifications.php')) ?>" class="nav-icon-link nav-round<?= $activeNav === 'notifications' ? ' active' : '' ?>" aria-label="<?= e(t('nav.notifications')) ?><?= $notifUnread > 0 ? ' (' . (int)$notifUnread . ')' : '' ?>" title="<?= e(t('nav.notifications')) ?>">
          <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <?php if ($notifUnread > 0): ?><span class="nav-badge nav-badge-icon"><?= (int)$notifUnread ?></span><?php endif; ?>
        </a>
        <details class="nav-menu<?= in_array($activeNav, ['profile', 'settings', 'albums', 'saved'], true) ? ' active' : '' ?>">
          <summary class="nav-avatar-summary" aria-label="@<?= e($currentUser['username']) ?>" title="@<?= e($currentUser['username']) ?>">
            <span class="avatar avatar-nav">
              <?php if (!empty($currentUser['avatar_path'])): ?>
                <img src="<?= e(allxion_url('media.php?avatar=' . (int)$currentUser['id'])) ?>" alt="">
              <?php else: ?>
                <span><?= e(mb_strtoupper(mb_substr((string)$currentUser['username'], 0, 1))) ?></span>
              <?php endif; ?>
            </span>
          </summary>
          <div class="nav-menu-panel">
            <div class="nav-menu-user">@<?= e($currentUser['username']) ?></div>
            <a href="<?= e(user_public_url($currentUser['username'])) ?>"><?= e(t('nav.profile')) ?></a>
            <a href="<?= e(allxion_url('settings.php')) ?>"><?= e(t('nav.settings')) ?></a>
            <a href="<?= e(allxion_url('saved.php')) ?>"><?= e(t('nav.saved')) ?></a>
            <a href="<?= e(allxion_url('albums.php')) ?>"><?= e(t('nav.albums')) ?></a>
            <a href="<?= e(allxion_url('shorts.php')) ?>"><?= e(t('nav.reels')) ?></a>
            <a href="<?= e(allxion_url('profile.php')) ?>"><?= e(t('nav.profile')) ?></a>
            <?php if (user_is_admin($currentUser)): ?>
              <a href="<?= e(allxion_url('admin/')) ?>"><?= e(t('nav.admin')) ?></a>
            <?php endif; ?>
            <a href="<?= e(allxion_url('rules.php')) ?>"><?= e(t('footer.rules')) ?></a>
            <a href="<?= e(allxion_url('logout.php')) ?>"><?= e(t('nav.logout')) ?></a>
          </div>
        </details>
      <?php else: ?>
        <a href="<?= e(allxion_url('login.php')) ?>" class="nav-icon-link nav-round<?= $activeNav === 'login' ? ' active' : '' ?>" aria-label="<?= e(t('nav.login')) ?>" title="<?= e(t('nav.login')) ?>">
          <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>
        </a>
        <a href="<?= e(allxion_url('register.php')) ?>" class="btn btn-sm"><?= e(t('nav.register')) ?></a>
      <?php endif; ?>
    </div>
  </header>

  <div class="shell">
    <?php require __DIR__ . '/partials/sidebar.php'; ?>
    <div class="shell-main">
      <?php if ($flashes): ?>
        <div class="flash-wrap">
          <?php foreach ($flashes as $flash): ?>
            <div class="flash flash-<?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <main class="main">
