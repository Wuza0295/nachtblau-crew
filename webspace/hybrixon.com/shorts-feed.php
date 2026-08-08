<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/posts.php';
require_once __DIR__ . '/includes/i18n.php';

$user = allxion_current_user();
$canSeeAdult = $user && user_age_verified($user);
$posts = allxion_feed($user, (bool)$canSeeAdult, 40, null, true);
$pageTitle = t('reels.title') . ' · Hybrixon';
$activeNav = 'shorts';
require __DIR__ . '/includes/header.php';
?>

<section class="hero">
  <h1><?= e(t('reels.title')) ?></h1>
  <p><?= e(t('reels.lead')) ?></p>
  <div class="hero-actions">
    <?php if ($user): ?>
      <a class="btn" href="<?= e(allxion_url('shorts.php')) ?>"><?= e(t('reels.create')) ?></a>
    <?php else: ?>
      <a class="btn" href="<?= e(allxion_url('login.php')) ?>"><?= e(t('nav.login')) ?></a>
    <?php endif; ?>
  </div>
</section>

<section class="feed">
  <?php if (!$posts): ?>
    <div class="empty"><p><?= e(t('reels.empty')) ?></p></div>
  <?php else: ?>
    <?php foreach ($posts as $post): ?>
      <?php $media = allxion_post_media((int)$post['id']); require __DIR__ . '/includes/partials/post-card.php'; ?>
    <?php endforeach; ?>
  <?php endif; ?>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
