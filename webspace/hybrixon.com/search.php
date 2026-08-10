<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/discover.php';

$viewer = allxion_current_user();
$q = trim((string)($_GET['q'] ?? ''));
$results = $q !== '' ? discover_search_users($viewer, $q) : [];
$pageTitle = 'Suche · Hybrixon';
$activeNav = 'search';
require __DIR__ . '/includes/header.php';
?>
<section class="panel">
  <h1>Suche</h1>
  <form method="get" class="form">
    <label>Personen (Name, @user, Ort)
      <input type="search" name="q" value="<?= e($q) ?>" minlength="2" required placeholder="z. B. berlin oder username">
    </label>
    <button class="btn" type="submit">Suchen</button>
  </form>
</section>
<?php if ($q !== ''): ?>
<section class="feed">
  <?php if (!$results): ?>
    <div class="empty"><p>Keine Treffer.</p></div>
  <?php else: ?>
    <?php foreach ($results as $u): ?>
      <a class="post" href="<?= e(user_public_url($u['username'])) ?>" style="color:inherit;display:flex;gap:0.85rem;align-items:center;">
        <div class="avatar">
          <?php if (!empty($u['avatar_path'])): ?>
            <img src="<?= e(allxion_url('media.php?avatar=' . (int)$u['id'])) ?>" alt="">
          <?php else: ?>
            <span><?= e(mb_strtoupper(mb_substr($u['username'], 0, 1))) ?></span>
          <?php endif; ?>
        </div>
        <div>
          <strong>@<?= e($u['username']) ?></strong>
          <?php if (!empty($u['display_name'])): ?>
            <div class="muted"><?= e($u['display_name']) ?></div>
          <?php endif; ?>
          <?php if (!empty($u['city'])): ?>
            <div class="muted"><?= e((string)$u['postal_code']) ?> <?= e($u['city']) ?></div>
          <?php endif; ?>
        </div>
      </a>
    <?php endforeach; ?>
  <?php endif; ?>
</section>
<?php endif; ?>
<?php require __DIR__ . '/includes/footer.php'; ?>
