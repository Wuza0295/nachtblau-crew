<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/discover.php';
require_once __DIR__ . '/includes/posts.php';

$viewer = allxion_current_user();
$tag = trim((string)($_GET['t'] ?? ''));
$canSeeAdult = $viewer && user_age_verified($viewer);
$posts = discover_posts_by_tag($viewer, $tag, (bool)$canSeeAdult);
$pageTitle = '#' . $tag . ' · Hybrixon';
$activeNav = 'search';
require __DIR__ . '/includes/header.php';
?>
<section class="panel">
  <h1>#<?= e(ltrim($tag, '#')) ?></h1>
  <p class="muted"><a href="<?= e(allxion_url('search.php')) ?>">Zur Suche</a></p>
</section>
<section class="feed">
  <?php if (!$posts): ?>
    <div class="empty"><p>Keine Beiträge mit diesem Tag.</p></div>
  <?php else: ?>
    <?php foreach ($posts as $post): ?>
      <?php $media = allxion_post_media((int)$post['id']); $user = $viewer; require __DIR__ . '/includes/partials/post-card.php'; ?>
    <?php endforeach; ?>
  <?php endif; ?>
</section>
<?php require __DIR__ . '/includes/footer.php'; ?>
