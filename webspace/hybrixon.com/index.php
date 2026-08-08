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
<section class="panel" style="padding:0.85rem 1rem;">
  <div class="pill-row" style="margin:0;">
    <a class="pill<?= $scope === 'all' ? ' pill-ok' : '' ?>" href="<?= e(allxion_url()) ?>"><?= e(t('feed.all')) ?></a>
    <a class="pill<?= $scope === 'friends' ? ' pill-ok' : '' ?>" href="<?= e(allxion_url('?scope=friends')) ?>"><?= e(t('feed.friends')) ?></a>
    <a class="pill<?= $scope === 'following' ? ' pill-ok' : '' ?>" href="<?= e(allxion_url('?scope=following')) ?>"><?= e(t('feed.following')) ?></a>
  </div>
</section>

<section class="panel feed-compose" aria-label="<?= e(t('compose.title')) ?>">
  <form method="post" action="<?= e(allxion_url('compose.php')) ?>" class="feed-compose-form" enctype="multipart/form-data">
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
      <label class="feed-compose-media btn btn-sm btn-ghost">
        <?= e(t('compose.images')) ?>
        <input type="file" name="images[]" accept="image/jpeg,image/png,image/webp" multiple hidden>
      </label>
      <a class="btn btn-sm btn-ghost" href="<?= e(allxion_url('compose.php')) ?>"><?= e(t('feed.compose_more')) ?></a>
      <button class="btn btn-sm" type="submit"><?= e(t('compose.publish')) ?></button>
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
