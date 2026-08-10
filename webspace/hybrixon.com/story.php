<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/stories.php';
require_once __DIR__ . '/includes/social.php';

$viewer = allxion_current_user();
$username = trim((string)($_GET['u'] ?? ''));
$owner = social_find_user_by_username($username);
if (!$owner) {
    http_response_code(404);
    $pageTitle = 'Story nicht gefunden · Hybrixon';
    require __DIR__ . '/includes/header.php';
    echo '<section class="panel"><h1>Story nicht gefunden</h1></section>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

$items = stories_for_user((int)$owner['id'], $viewer);
if (!$items) {
    flash('info', 'Keine aktiven Stories.');
    redirect(allxion_url());
}

$idx = max(0, min(count($items) - 1, (int)($_GET['i'] ?? 0)));
$current = $items[$idx];
if ($viewer) {
    stories_mark_viewed((int)$current['id'], (int)$viewer['id']);
}

$pageTitle = 'Story @' . $owner['username'] . ' · Hybrixon';
$activeNav = 'stories';
$noIndex = true;
require __DIR__ . '/includes/header.php';

$mediaUrl = allxion_url('media.php?story=' . (int)$current['id']);
$next = $idx + 1 < count($items)
    ? allxion_url('story.php?u=' . rawurlencode($owner['username']) . '&i=' . ($idx + 1))
    : null;
$prev = $idx > 0
    ? allxion_url('story.php?u=' . rawurlencode($owner['username']) . '&i=' . ($idx - 1))
    : null;
?>

<section class="panel story-viewer">
  <div class="post-meta">
    <a class="post-user" href="<?= e(user_public_url($owner['username'])) ?>">@<?= e($owner['username']) ?></a>
    <span><?= $idx + 1 ?> / <?= count($items) ?></span>
  </div>
  <?php if (($current['media_kind'] ?? '') === 'video'): ?>
    <div class="post-video">
      <video src="<?= e($mediaUrl) ?>" controls autoplay playsinline></video>
    </div>
  <?php else: ?>
    <div class="post-image">
      <img src="<?= e($mediaUrl) ?>" alt="">
    </div>
  <?php endif; ?>
  <?php if (!empty($current['caption'])): ?>
    <p class="post-body" style="margin-top:0.75rem;"><?= e($current['caption']) ?></p>
  <?php endif; ?>
  <div class="hero-actions">
    <?php if ($prev): ?><a class="btn btn-ghost" href="<?= e($prev) ?>">Zurück</a><?php endif; ?>
    <?php if ($next): ?><a class="btn" href="<?= e($next) ?>">Weiter</a><?php endif; ?>
    <a class="btn btn-ghost" href="<?= e(allxion_url()) ?>">Feed</a>
  </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
