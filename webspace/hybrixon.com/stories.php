<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/stories.php';
require_once __DIR__ . '/includes/i18n.php';

$user = allxion_require_login();
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $file = $_FILES['media'] ?? null;
    if (!is_array($file)) {
        $errors[] = t('stories.pick_media');
    } else {
        $errors = stories_create(
            $user,
            $file,
            (string)($_POST['caption'] ?? ''),
            !empty($_POST['is_adult'])
        );
        if (!$errors) {
            flash('success', t('stories.online', ['hours' => (string)(int)STORY_TTL_HOURS]));
            redirect(allxion_url('stories.php'));
        }
    }
}

$tray = stories_tray($user);
$mine = stories_for_user((int)$user['id'], $user);
$pageTitle = t('nav.stories') . ' · Hybrixon';
$activeNav = 'stories';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1><?= e(t('stories.create_title')) ?></h1>
  <p class="muted" style="margin-bottom:1rem;"><?= e(t('stories.lead', ['hours' => (string)(int)STORY_TTL_HOURS])) ?></p>
  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>
  <form method="post" class="form" enctype="multipart/form-data">
    <?= csrf_field() ?>
    <label><?= e(t('stories.media')) ?>
      <input type="file" name="media" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" required>
    </label>
    <label><?= e(t('stories.caption')) ?>
      <input type="text" name="caption" maxlength="300" value="<?= e($_POST['caption'] ?? '') ?>">
    </label>
    <?php if (user_age_verified($user)): ?>
      <label class="check"><input type="checkbox" name="is_adult" value="1"> <?= e(t('post.soft18')) ?></label>
    <?php endif; ?>
    <button class="btn" type="submit"><?= e(t('stories.post')) ?></button>
  </form>
</section>

<?php if ($mine): ?>
<section class="panel">
  <h2><?= e(t('stories.yours', ['n' => (string)count($mine)])) ?></h2>
  <p><a class="btn btn-sm" href="<?= e(allxion_url('story.php?u=' . rawurlencode($user['username']))) ?>"><?= e(t('stories.view')) ?></a></p>
</section>
<?php endif; ?>

<section class="panel">
  <h2><?= e(t('feed.stories')) ?></h2>
  <?php if (!$tray): ?>
    <p class="muted"><?= e(t('feed.no_stories')) ?></p>
  <?php else: ?>
    <div class="story-tray">
      <?php foreach ($tray as $s): ?>
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
  <?php endif; ?>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
