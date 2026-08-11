<?php
declare(strict_types=1);

require_once __DIR__ . '/../sidebar-config.php';

/** @var ?array $currentUser */
/** @var string $activeNav */
/** @var int $dmUnread */
$activeNav = $activeNav ?? '';
$dmUnread = (int)($dmUnread ?? 0);
$items = hybrixon_sidebar_items_for($currentUser);
$displayLabel = $currentUser
    ? (trim((string)($currentUser['display_name'] ?? '')) !== ''
        ? (string)$currentUser['display_name']
        : '@' . (string)$currentUser['username'])
    : '';

$ico = static function (string $paths): string {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . $paths . '</svg>';
};

$defs = [
    'profile' => [
        'href' => $currentUser ? user_public_url($currentUser['username']) : allxion_url(),
        'active' => $activeNav === 'profile',
        'label' => $displayLabel !== '' ? $displayLabel : 'Profil',
        'avatar' => true,
    ],
    'friends' => [
        'href' => allxion_url('friends.php'),
        'active' => $activeNav === 'friends',
        'label' => 'Freunde',
        'svg' => $ico('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/>'),
    ],
    'saved' => [
        'href' => allxion_url('saved.php'),
        'active' => $activeNav === 'saved',
        'label' => 'Gespeichert',
        'svg' => $ico('<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
    ],
    'albums' => [
        'href' => allxion_url('albums.php'),
        'active' => $activeNav === 'albums',
        'label' => 'Fotoalben',
        'svg' => $ico('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'),
    ],
    'compose' => [
        'href' => allxion_url('compose.php'),
        'active' => $activeNav === 'compose',
        'label' => 'Posten',
        'svg' => $ico('<path d="M12 5v14"/><path d="M5 12h14"/>'),
    ],
    'feed' => [
        'href' => allxion_url(),
        'active' => $activeNav === 'feed',
        'label' => 'Feed',
        'svg' => $ico('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h14V10"/>'),
    ],
    'shorts' => [
        'href' => allxion_url('shorts-feed.php'),
        'active' => $activeNav === 'shorts',
        'label' => 'Reels',
        'svg' => $ico('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m10 9 5 3-5 3V9z"/>'),
    ],
    'stories' => [
        'href' => allxion_url('stories.php'),
        'active' => $activeNav === 'stories',
        'label' => 'Stories',
        'svg' => $ico('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>'),
    ],
    'groups' => [
        'href' => allxion_url('groups.php'),
        'active' => $activeNav === 'groups',
        'label' => 'Gruppen',
        'svg' => $ico('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    ],
    'search' => [
        'href' => allxion_url('search.php'),
        'active' => $activeNav === 'search',
        'label' => 'Suche',
        'svg' => $ico('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    ],
    'messages' => [
        'href' => allxion_url('messages.php'),
        'active' => $activeNav === 'messages',
        'label' => 'Nachrichten',
        'svg' => $ico('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
        'badge' => $dmUnread,
    ],
    'app' => [
        'href' => allxion_url('app.php'),
        'active' => $activeNav === 'app',
        'label' => t('nav.app'),
        'svg' => $ico('<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>'),
    ],
    'settings' => [
        'href' => allxion_url('settings.php'),
        'active' => $activeNav === 'settings',
        'label' => 'Einstellungen',
        'svg' => $ico('<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>'),
    ],
    'admin' => [
        'href' => allxion_url('admin/'),
        'active' => $activeNav === 'admin',
        'label' => 'Admin',
        'svg' => $ico('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
    ],
];
?>
<aside class="sidebar" aria-label="Schnellzugriff">
  <nav class="sidebar-nav">
    <?php foreach ($items as $key): ?>
      <?php if (!isset($defs[$key])) {
          continue;
      }
      $item = $defs[$key];
      ?>
      <a class="sidebar-link<?= !empty($item['active']) ? ' active' : '' ?>" href="<?= e((string)$item['href']) ?>" title="<?= e((string)$item['label']) ?>">
        <?php if (!empty($item['avatar']) && $currentUser): ?>
          <span class="avatar avatar-side">
            <?php if (!empty($currentUser['avatar_path'])): ?>
              <img src="<?= e(allxion_url('media.php?avatar=' . (int)$currentUser['id'])) ?>" alt="">
            <?php else: ?>
              <span><?= e(mb_strtoupper(mb_substr((string)$currentUser['username'], 0, 1))) ?></span>
            <?php endif; ?>
          </span>
        <?php else: ?>
          <span class="sidebar-ico"><?= $item['svg'] ?? '' ?></span>
        <?php endif; ?>
        <span class="sidebar-label"><?= e((string)$item['label']) ?></span>
        <?php if (!empty($item['badge'])): ?>
          <span class="nav-badge"><?= (int)$item['badge'] ?></span>
        <?php endif; ?>
      </a>
    <?php endforeach; ?>

    <?php if (!$currentUser): ?>
      <a class="sidebar-link<?= $activeNav === 'login' ? ' active' : '' ?>" href="<?= e(allxion_url('login.php')) ?>" title="Anmelden">
        <span class="sidebar-ico"><?= $ico('<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>') ?></span>
        <span class="sidebar-label">Anmelden</span>
      </a>
      <a class="sidebar-link<?= $activeNav === 'register' ? ' active' : '' ?>" href="<?= e(allxion_url('register.php')) ?>" title="Registrieren">
        <span class="sidebar-ico"><?= $ico('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/>') ?></span>
        <span class="sidebar-label">Registrieren</span>
      </a>
    <?php endif; ?>
  </nav>
</aside>
