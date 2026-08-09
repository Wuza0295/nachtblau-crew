<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/posts.php';
require_once __DIR__ . '/includes/policy.php';
require_once __DIR__ . '/includes/media_upload.php';

$user = allxion_require_login();
$errors = [];
$isShort = false;
require_once __DIR__ . '/includes/geo.php';
$hasLocation = user_has_location($user) || user_is_admin($user);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $body = (string)($_POST['body'] ?? '');
    $isAdult = !empty($_POST['is_adult']);
    $policyOk = !empty($_POST['policy_ok']);
    $images = media_normalize_files(isset($_FILES['images']) && is_array($_FILES['images']) ? $_FILES['images'] : []);
    $videos = media_normalize_files(isset($_FILES['videos']) && is_array($_FILES['videos']) ? $_FILES['videos'] : []);
    // Backward compatible single-file field name
    if ($videos === [] && isset($_FILES['video']) && is_array($_FILES['video'])) {
        $videos = media_normalize_files($_FILES['video']);
    }
    // Sequentially staged files (client upload one-by-one to avoid HTTP 413)
    foreach (media_stage_take_many($_POST['staged'] ?? [], (int)$user['id']) as $staged) {
        if (($staged['stored_kind'] ?? '') === 'video') {
            $videos[] = $staged;
        } else {
            $images[] = $staged;
        }
    }
    $errors = allxion_create_post((int)$user['id'], $body, $isAdult, $policyOk, $images, $videos, 'post');
    if (!$errors) {
        if ($hasLocation) {
            flash('success', 'Beitrag veröffentlicht.');
        } else {
            flash('info', 'Beitrag eingereicht. Ohne gültigen Ort wird er erst nach Admin-Prüfung öffentlich.');
        }
        redirect(allxion_url());
    }
    $user = allxion_current_user() ?? $user;
    $hasLocation = user_has_location($user) || user_is_admin($user);
}

$canAdult = user_age_verified($user);
$pageTitle = 'Posten · Hybrixon';
$activeNav = 'compose';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1><?= e(t('compose.title')) ?></h1>
  <p class="muted" style="margin-bottom:1rem;">
    <?= e(t('compose.lead')) ?>
    <?= e(t('compose.images_multi', [
        'n' => (string)(int)MEDIA_POST_IMAGES_MAX,
        'mb' => (string)(int)(MEDIA_IMAGE_MAX_BYTES / 1_000_000),
    ])) ?>
    <?= e(t('compose.videos_multi', [
        'n' => (string)(int)MEDIA_POST_VIDEOS_MAX,
        'mb' => (string)(int)(MEDIA_VIDEO_MAX_BYTES / 1_000_000),
        'min' => (string)(int)(MEDIA_VIDEO_MAX_SECONDS / 60),
    ])) ?>
    <a href="<?= e(allxion_url('shorts.php')) ?>"><?= e(t('nav.reels')) ?></a> ·
    <a href="<?= e(allxion_url('stories.php')) ?>"><?= e(t('nav.stories')) ?></a> ·
    <a href="<?= e(allxion_url('rules.php')) ?>"><?= e(t('footer.rules')) ?></a>
  </p>

  <?php if (!$hasLocation): ?>
    <div class="flash flash-info" style="margin-bottom:1rem;">
      Du hast noch keinen gültigen Ort angegeben.
      Beiträge sind dann erst nach <strong>Admin-Freigabe</strong> öffentlich sichtbar.
      <a href="<?= e(allxion_url('settings.php')) ?>">Ort jetzt hinterlegen</a> — dann sofort live.
    </div>
  <?php endif; ?>

  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>

  <?php if (user_is_adult($user) && !$canAdult): ?>
    <div class="age-gate">
      <h2>Soft-18+ noch nicht freigeschaltet</h2>
      <p>Für Soft-18+-Bilder bitte Altersprüfung bestätigen.</p>
      <a class="btn btn-sm" href="<?= e(allxion_url('age-verify.php')) ?>">Altersprüfung öffnen</a>
    </div>
  <?php endif; ?>

  <form method="post" class="form" enctype="multipart/form-data" data-stage-uploads data-stage-purpose="posts" data-stage-url="<?= e(allxion_url('api-media-stage.php')) ?>">
    <?= csrf_field() ?>
    <label><?= e(t('compose.body')) ?>
      <textarea name="body" maxlength="4000" data-mention placeholder="@user #tag"><?= e($_POST['body'] ?? '') ?></textarea>
    </label>

    <label><?= e(t('compose.images')) ?> (max. <?= (int)MEDIA_POST_IMAGES_MAX ?>, je <?= (int)(MEDIA_IMAGE_MAX_BYTES / 1_000_000) ?> MB)
      <input type="file" name="images[]" accept="image/jpeg,image/png,image/webp" multiple data-max-files="<?= (int)MEDIA_POST_IMAGES_MAX ?>" data-stage-kind="image">
    </label>
    <label><?= e(t('compose.video')) ?> (max. <?= (int)MEDIA_POST_VIDEOS_MAX ?>, je <?= (int)(MEDIA_VIDEO_MAX_BYTES / 1_000_000) ?> MB / <?= (int)(MEDIA_VIDEO_MAX_SECONDS / 60) ?> Min.)
      <input type="file" name="videos[]" accept="video/mp4,video/webm,video/quicktime" multiple data-max-files="<?= (int)MEDIA_POST_VIDEOS_MAX ?>" data-stage-kind="video">
    </label>

    <?php if ($canAdult): ?>
      <label class="check">
        <input type="checkbox" name="is_adult" value="1" data-adult-toggle <?= !empty($_POST['is_adult']) ? 'checked' : '' ?>>
        <span>Als <strong>Soft-18+</strong> markieren</span>
      </label>
      <div data-adult-hint hidden>
        <p class="hint">Soft ok (u. a. Brüste). Verboten: 18++. Soft-Medien werden Admins gemeldet.</p>
        <label class="check">
          <input type="checkbox" name="policy_ok" value="1" data-policy-required <?= !empty($_POST['policy_ok']) ? 'checked' : '' ?>>
          <span>Ich halte die <a href="<?= e(allxion_url('rules.php')) ?>" target="_blank" rel="noopener">Inhaltsregeln</a> ein.</span>
        </label>
      </div>
    <?php endif; ?>

    <button class="btn btn-block" type="submit"><?= e(t('compose.publish')) ?></button>
  </form>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
