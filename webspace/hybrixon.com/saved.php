<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/saved.php';
require_once __DIR__ . '/includes/posts.php';

$user = allxion_require_login();
$canSeeAdult = user_age_verified($user);
$posts = saved_list((int)$user['id'], (bool)$canSeeAdult);
$pageTitle = 'Gespeichert · Hybrixon';
$activeNav = 'saved';
require __DIR__ . '/includes/header.php';
?>
<section class="panel">
  <h1>Gespeicherte Beiträge</h1>
  <p class="muted">Deine Merkliste — nur für dich sichtbar.</p>
</section>
<section class="feed">
  <?php if (!$posts): ?>
    <div class="empty"><p>Noch nichts gespeichert.</p></div>
  <?php else: ?>
    <?php foreach ($posts as $post): ?>
      <?php $media = allxion_post_media((int)$post['id']); require __DIR__ . '/includes/partials/post-card.php'; ?>
    <?php endforeach; ?>
  <?php endif; ?>
</section>
<?php require __DIR__ . '/includes/footer.php'; ?>
