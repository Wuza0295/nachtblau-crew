<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';

hybrixon_enforce_canonical_host();

$currentUser = allxion_current_user();
$pageTitle = $pageTitle ?? ALLXION_NAME;
$pageDescription = $pageDescription ?? 'Hybrixon – Social-Portal. Soft-18+ · kein Porno, keine Gewalt.';
$activeNav = $activeNav ?? 'feed';
$flashes = take_flashes();
$canSeeAdult = $currentUser && user_age_verified($currentUser);
$dmUnread = 0;
if ($currentUser) {
    require_once __DIR__ . '/dm.php';
    if (dm_user_eligible($currentUser)) {
        $dmUnread = dm_unread_count((int)$currentUser['id']);
    }
}

if (!headers_sent()) {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title><?= e($pageTitle) ?></title>
  <meta name="description" content="<?= e($pageDescription) ?>">
  <?php
    $reqPath = (string)(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/');
    if (str_starts_with($reqPath, '/hybrixon')) {
        $reqPath = substr($reqPath, strlen('/hybrixon')) ?: '/';
    }
    $canonicalPath = ltrim($reqPath, '/');
  ?>
  <link rel="canonical" href="<?= e(hybrixon_public_url($canonicalPath)) ?>">
  <meta name="theme-color" content="#12100e">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <?php if (!empty($noIndex)): ?>
  <meta name="robots" content="noindex,nofollow">
  <?php endif; ?>
  <link rel="icon" href="<?= e(allxion_url('assets/img/favicon.svg')) ?>" type="image/svg+xml">
  <link rel="manifest" href="<?= e(allxion_url('manifest.json')) ?>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&family=Oxanium:wght@600;700;800&family=Sora:wght@500;600;700&display=swap" rel="stylesheet">
  <?php
    $cssPath = ALLXION_ROOT . '/assets/css/style.css';
    $cssVer = is_file($cssPath) ? (string)filemtime($cssPath) : '1';
  ?>
  <link rel="stylesheet" href="<?= e(allxion_url('assets/css/style.css') . '?v=' . $cssVer) ?>">
</head>
<body>
<div class="app">
  <header class="topbar">
    <a class="brand" href="<?= e(allxion_url()) ?>">
      <img class="brand-logo" src="<?= e(allxion_url('assets/img/logo.svg')) ?>" width="40" height="40" alt="">
      <span class="brand-text">
        <strong>Hybrixon</strong>
        <small><?= e(ALLXION_TAGLINE) ?></small>
      </span>
    </a>
    <button type="button" class="nav-toggle" data-nav-toggle aria-expanded="false" aria-controls="site-nav" aria-label="Menü öffnen">
      <span class="nav-toggle-bar" aria-hidden="true"></span>
      <span class="nav-toggle-bar" aria-hidden="true"></span>
      <span class="nav-toggle-bar" aria-hidden="true"></span>
    </button>
    <nav class="nav" id="site-nav" data-site-nav>
      <a href="<?= e(allxion_url()) ?>" class="<?= $activeNav === 'feed' ? 'active' : '' ?>">Feed</a>
      <?php if ($currentUser): ?>
        <a href="<?= e(allxion_url('compose.php')) ?>" class="<?= $activeNav === 'compose' ? 'active' : '' ?>">Posten</a>
        <a href="<?= e(allxion_url('messages.php')) ?>" class="<?= $activeNav === 'messages' ? 'active' : '' ?>">DMs<?php if ($dmUnread > 0): ?> <span class="nav-badge"><?= (int)$dmUnread ?></span><?php endif; ?></a>
        <a href="<?= e(allxion_url('profile.php')) ?>" class="<?= $activeNav === 'profile' ? 'active' : '' ?>">@<?= e($currentUser['username']) ?></a>
        <?php if (user_is_admin($currentUser)): ?>
          <a href="<?= e(allxion_url('admin/')) ?>" class="<?= $activeNav === 'admin' ? 'active' : '' ?>">Admin</a>
        <?php endif; ?>
        <a href="<?= e(allxion_url('logout.php')) ?>">Logout</a>
      <?php else: ?>
        <a href="<?= e(allxion_url('login.php')) ?>" class="<?= $activeNav === 'login' ? 'active' : '' ?>">Anmelden</a>
        <a href="<?= e(allxion_url('register.php')) ?>" class="btn btn-sm <?= $activeNav === 'register' ? 'active' : '' ?>">Registrieren</a>
      <?php endif; ?>
    </nav>
  </header>

  <nav class="tabbar" aria-label="Schnellnavigation">
    <a href="<?= e(allxion_url()) ?>" class="tabbar-item <?= $activeNav === 'feed' ? 'active' : '' ?>">
      <span class="tabbar-icon tabbar-icon-feed" aria-hidden="true"></span>
      <span>Feed</span>
    </a>
    <?php if ($currentUser): ?>
      <a href="<?= e(allxion_url('compose.php')) ?>" class="tabbar-item <?= $activeNav === 'compose' ? 'active' : '' ?>">
        <span class="tabbar-icon tabbar-icon-compose" aria-hidden="true"></span>
        <span>Posten</span>
      </a>
      <a href="<?= e(allxion_url('messages.php')) ?>" class="tabbar-item <?= $activeNav === 'messages' ? 'active' : '' ?>">
        <span class="tabbar-icon tabbar-icon-dm" aria-hidden="true"></span>
        <span>DMs<?php if ($dmUnread > 0): ?> <span class="nav-badge"><?= (int)$dmUnread ?></span><?php endif; ?></span>
      </a>
      <a href="<?= e(allxion_url('profile.php')) ?>" class="tabbar-item <?= $activeNav === 'profile' ? 'active' : '' ?>">
        <span class="tabbar-icon tabbar-icon-profile" aria-hidden="true"></span>
        <span>Profil</span>
      </a>
    <?php else: ?>
      <a href="<?= e(allxion_url('login.php')) ?>" class="tabbar-item <?= $activeNav === 'login' ? 'active' : '' ?>">
        <span class="tabbar-icon tabbar-icon-login" aria-hidden="true"></span>
        <span>Login</span>
      </a>
      <a href="<?= e(allxion_url('register.php')) ?>" class="tabbar-item <?= $activeNav === 'register' ? 'active' : '' ?>">
        <span class="tabbar-icon tabbar-icon-join" aria-hidden="true"></span>
        <span>Join</span>
      </a>
    <?php endif; ?>
  </nav>

  <?php if (hybrixon_is_interim()): ?>
    <div class="flash-wrap">
      <div class="flash flash-info">
        Bald unter <strong><?= e(HYBRIXON_CANONICAL_HOST) ?></strong> —
        vorübergehend erreichbar unter dieser Adresse.
      </div>
    </div>
  <?php endif; ?>

  <?php if ($flashes): ?>
    <div class="flash-wrap">
      <?php foreach ($flashes as $flash): ?>
        <div class="flash flash-<?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>

  <main class="main">
