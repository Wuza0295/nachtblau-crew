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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
  <link rel="stylesheet" href="<?= e(allxion_url('assets/css/style.css')) ?>">
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
    <nav class="nav">
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
