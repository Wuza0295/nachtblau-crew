<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/posts.php';
require_once __DIR__ . '/includes/moderation.php';
require_once __DIR__ . '/includes/stories.php';
require_once __DIR__ . '/includes/saved.php';

$user = allxion_current_user();
$canSeeAdult = $user && user_age_verified($user);
$showAdult = $canSeeAdult && (($_GET['adult'] ?? '1') !== '0');
$scope = (string)($_GET['scope'] ?? 'all');
if (!in_array($scope, ['all', 'friends', 'following'], true)) {
    $scope = 'all';
}
$storyTray = stories_tray($user);

$feedQuery = $scope !== 'all' ? '?scope=' . rawurlencode($scope) : '';

if (isset($_GET['like']) && $user) {
    allxion_toggle_like((int)$user['id'], (int)$_GET['like']);
    redirect(allxion_url($feedQuery !== '' ? $feedQuery : ''));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $user) {
    verify_csrf();
    $action = (string)($_POST['action'] ?? '');
    if ($action === 'report_post') {
        $errors = content_user_report_post($user, (int)($_POST['post_id'] ?? 0), (string)($_POST['reason'] ?? ''));
        flash($errors ? 'error' : 'success', $errors[0] ?? 'Beitrag gemeldet — Admins prüfen.');
        redirect(allxion_url($feedQuery !== '' ? $feedQuery : ''));
    }
}

$posts = allxion_feed($user, $showAdult, 50, null, false, $scope);
$pageTitle = 'Hybrixon · Feed';
$activeNav = 'feed';
require __DIR__ . '/includes/header.php';
?>

<?php if ($user): ?>
<?php
  $composeImagesLabel = trim((string)(preg_replace('/\s*\([^)]*\)\s*$/u', '', t('compose.images')) ?? t('compose.images')));
  $composeVideoLabel = trim((string)(preg_replace('/\s*\([^)]*\)\s*$/u', '', t('compose.video')) ?? t('compose.video')));
?>
<section class="panel feed-scope-panel">
  <div class="pill-row" style="margin:0;">
    <a class="pill<?= $scope === 'all' ? ' pill-ok' : '' ?>" href="<?= e(allxion_url()) ?>"><?= e(t('feed.all')) ?></a>
    <a class="pill<?= $scope === 'friends' ? ' pill-ok' : '' ?>" href="<?= e(allxion_url('?scope=friends')) ?>"><?= e(t('feed.friends')) ?></a>
    <a class="pill<?= $scope === 'following' ? ' pill-ok' : '' ?>" href="<?= e(allxion_url('?scope=following')) ?>"><?= e(t('feed.following')) ?></a>
  </div>
</section>

<section class="panel feed-compose" aria-label="<?= e(t('compose.title')) ?>">
  <form method="post" action="<?= e(allxion_url('compose.php')) ?>" class="feed-compose-form" enctype="multipart/form-data" data-stage-uploads data-stage-purpose="posts" data-stage-url="<?= e(allxion_url('api-media-stage.php')) ?>">
    <?= csrf_field() ?>
    <div class="feed-compose-row">
      <a class="avatar feed-compose-avatar" href="<?= e(user_public_url((string)$user['username'])) ?>" aria-label="@<?= e((string)$user['username']) ?>">
        <?php if (!empty($user['avatar_path'])): ?>
          <img src="<?= e(allxion_url('media.php?avatar=' . (int)$user['id'])) ?>" alt="">
        <?php else: ?>
          <span><?= e(mb_strtoupper(mb_substr((string)$user['username'], 0, 1))) ?></span>
        <?php endif; ?>
      </a>
      <label class="feed-compose-field">
        <span class="visually-hidden"><?= e(t('compose.body')) ?></span>
        <textarea name="body" rows="2" maxlength="4000" placeholder="<?= e(t('feed.compose_prompt')) ?>" data-mention></textarea>
      </label>
    </div>
    <div class="feed-compose-actions">
      <label class="feed-compose-media feed-compose-action-image btn btn-sm btn-ghost" title="<?= e(t('compose.images')) ?>">
        <span class="feed-compose-action-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></svg>
        </span>
        <span><?= e($composeImagesLabel) ?></span>
        <input type="file" name="images[]" accept="image/jpeg,image/png,image/webp" multiple hidden data-max-files="<?= (int)MEDIA_POST_IMAGES_MAX ?>" data-stage-kind="image">
      </label>
      <label class="feed-compose-media feed-compose-action-video btn btn-sm btn-ghost" title="<?= e(t('compose.video')) ?>">
        <span class="feed-compose-action-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 9 5 3-5 3V9z"/></svg>
        </span>
        <span><?= e($composeVideoLabel) ?></span>
        <input type="file" name="videos[]" accept="video/mp4,video/webm,video/quicktime" multiple hidden data-max-files="<?= (int)MEDIA_POST_VIDEOS_MAX ?>" data-stage-kind="video">
      </label>
      <a class="feed-compose-action-more btn btn-sm btn-ghost" href="<?= e(allxion_url('compose.php')) ?>">
        <span class="feed-compose-action-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/></svg>
        </span>
        <span><?= e(t('feed.compose_more')) ?></span>
      </a>
      <button class="feed-compose-publish btn btn-sm" type="submit">
        <span><?= e(t('compose.publish')) ?></span>
        <svg class="feed-compose-publish-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 14-7-4 14-3-5-7-2Z"/><path d="m12 14 7-9"/></svg>
      </button>
    </div>
  </form>
</section>
<?php endif; ?>

<?php if ($storyTray || $user): ?>
<section class="panel story-tray-wrap">
  <div class="story-tray-head">
    <h2 style="margin:0;font-size:1.05rem;"><?= e(t('feed.stories')) ?></h2>
    <?php if ($user): ?>
      <a class="btn btn-sm btn-ghost" href="<?= e(allxion_url('stories.php')) ?>"><?= e(t('feed.add_story')) ?></a>
    <?php endif; ?>
  </div>
  <?php if ($storyTray): ?>
    <div class="story-tray">
      <?php foreach ($storyTray as $s): ?>
        <a class="story-ring<?= !empty($s['unseen']) ? ' story-unseen' : '' ?>" href="<?= e(allxion_url('story.php?u=' . rawurlencode($s['username']))) ?>">
          <div class="avatar">
            <?php if (!empty($s['avatar_path'])): ?>
              <img src="<?= e(allxion_url('media.php?avatar=' . (int)$s['id'])) ?>" alt="">
            <?php else: ?>
              <span><?= e(mb_strtoupper(mb_substr($s['username'], 0, 1))) ?></span>
            <?php endif; ?>
          </div>
          <span>@<?= e($s['username']) ?></span>
        </a>
      <?php endforeach; ?>
    </div>
  <?php else: ?>
    <p class="muted" style="margin-top:0.75rem;"><?= e(t('feed.no_stories')) ?></p>
  <?php endif; ?>
</section>
<?php endif; ?>

<?php if ($user && user_is_adult($user) && !user_age_verified($user)): ?>
  <section class="age-gate">
    <h2>Soft-18+ freischalten</h2>
    <?php if (user_age_pending($user)): ?>
      <p>Dein Antrag wird vom Admin geprüft.</p>
    <?php else: ?>
      <p>Für Soft-18+ (inkl. Soft-Nacktheit): Passwort, Bestätigungssatz und Admin-Freigabe.</p>
      <a class="btn btn-sm" href="<?= e(allxion_url('age-verify.php')) ?>">Altersprüfung starten</a>
    <?php endif; ?>
  </section>
<?php endif; ?>

<section class="feed">
  <?php if (!$posts): ?>
    <div class="empty">
      <p><?= e(t('feed.empty')) ?></p>
      <?php if ($user): ?>
        <p style="margin-top:0.75rem"><a class="btn btn-sm" href="<?= e(allxion_url('compose.php')) ?>">Ersten Post schreiben</a></p>
      <?php endif; ?>
    </div>
  <?php else: ?>
    <?php foreach ($posts as $post): ?>
      <?php $media = allxion_post_media((int)$post['id']); require __DIR__ . '/includes/partials/post-card.php'; ?>
    <?php endforeach; ?>
  <?php endif; ?>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
