<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/stories.php';
require_once __DIR__ . '/includes/i18n.php';
require_once __DIR__ . '/includes/media_upload.php';

$user = allxion_require_login();
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $files = media_normalize_files(isset($_FILES['media']) && is_array($_FILES['media']) ? $_FILES['media'] : []);
    if ($files === []) {
        $errors[] = t('stories.pick_media');
    } else {
        $errors = stories_create_many(
            $user,
            $files,
            (string)($_POST['caption'] ?? ''),
            !empty($_POST['is_adult'])
        );
        if (!$errors) {
            $n = count($files);
            flash(
                'success',
                $n > 1
                    ? t('stories.online_multi', ['n' => (string)$n, 'hours' => (string)(int)STORY_TTL_HOURS])
                    : t('stories.online', ['hours' => (string)(int)STORY_TTL_HOURS])
            );
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
  <p class="muted" style="margin-bottom:1rem;">
    <?= e(t('stories.lead', ['hours' => (string)(int)STORY_TTL_HOURS])) ?>
    <?= e(t('stories.multi_hint', [
        'n' => (string)(int)MEDIA_STORY_MEDIA_MAX,
        'imgMb' => (string)(int)(MEDIA_IMAGE_MAX_BYTES / 1_000_000),
        'vidMb' => (string)(int)(MEDIA_VIDEO_MAX_BYTES / 1_000_000),
    ])) ?>
  </p>
  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>
  <form method="post" class="form" enctype="multipart/form-data">
    <?= csrf_field() ?>
    <label><?= e(t('stories.media')) ?> (max. <?= (int)MEDIA_STORY_MEDIA_MAX ?>)
      <input type="file" name="media[]" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" multiple required data-max-files="<?= (int)MEDIA_STORY_MEDIA_MAX ?>">
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
