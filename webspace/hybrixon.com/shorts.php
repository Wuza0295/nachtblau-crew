<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/posts.php';
require_once __DIR__ . '/includes/policy.php';
require_once __DIR__ . '/includes/media_upload.php';

$user = allxion_require_login();
$errors = [];
require_once __DIR__ . '/includes/geo.php';
$hasLocation = user_has_location($user) || user_is_admin($user);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $body = (string)($_POST['body'] ?? '');
    $isAdult = !empty($_POST['is_adult']);
    $policyOk = !empty($_POST['policy_ok']);
    $videos = media_normalize_files(isset($_FILES['videos']) && is_array($_FILES['videos']) ? $_FILES['videos'] : []);
    if ($videos === [] && isset($_FILES['video']) && is_array($_FILES['video'])) {
        $videos = media_normalize_files($_FILES['video']);
    }
    if ($videos === []) {
        $errors = ['Bitte mindestens ein Video wählen.'];
    } elseif (count($videos) > MEDIA_REEL_VIDEOS_MAX) {
        $errors = ['Maximal ' . MEDIA_REEL_VIDEOS_MAX . ' Videos pro Upload.'];
    } else {
        // One Reel per selected video (same caption / Soft-18+ flags).
        foreach ($videos as $video) {
            $errors = allxion_create_post((int)$user['id'], $body, $isAdult, $policyOk, [], [$video], 'short');
            if ($errors) {
                break;
            }
        }
    }
    if (!$errors) {
        $n = count($videos);
        if ($hasLocation) {
            flash('success', $n > 1 ? ($n . ' Reels veröffentlicht.') : 'Reel veröffentlicht.');
        } else {
            flash('info', 'Reel(s) eingereicht. Ohne gültigen Ort erst nach Admin-Freigabe sichtbar.');
        }
        redirect(allxion_url('shorts-feed.php'));
    }
    $user = allxion_current_user() ?? $user;
    $hasLocation = user_has_location($user) || user_is_admin($user);
}

$canAdult = user_age_verified($user);
$pageTitle = 'Reel · Hybrixon';
$activeNav = 'shorts';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1><?= e(t('reels.create')) ?></h1>
  <p class="muted" style="margin-bottom:1rem;">
    <?= e(t('compose.videos_multi', [
        'n' => (string)(int)MEDIA_REEL_VIDEOS_MAX,
        'mb' => (string)(int)(MEDIA_VIDEO_MAX_BYTES / 1_000_000),
        'min' => (string)(int)(MEDIA_VIDEO_MAX_SECONDS / 60),
    ])) ?>
    <?= e(t('reels.multi_hint')) ?>
  </p>
  <?php if (!$hasLocation): ?>
    <div class="flash flash-info" style="margin-bottom:1rem;">
      Ohne gültigen Ort wird der Short erst nach Admin-Freigabe sichtbar.
      <a href="<?= e(allxion_url('settings.php')) ?>">Ort hinterlegen</a>
    </div>
  <?php endif; ?>
  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>

  <form method="post" class="form" enctype="multipart/form-data">
    <?= csrf_field() ?>
    <label><?= e(t('compose.video')) ?> (max. <?= (int)MEDIA_REEL_VIDEOS_MAX ?>, je <?= (int)(MEDIA_VIDEO_MAX_BYTES / 1_000_000) ?> MB)
      <input type="file" name="videos[]" accept="video/mp4,video/webm,video/quicktime" multiple required data-max-files="<?= (int)MEDIA_REEL_VIDEOS_MAX ?>">
    </label>
    <label>Caption (optional)
      <textarea name="body" maxlength="4000" placeholder="Kurzbeschreibung…"><?= e($_POST['body'] ?? '') ?></textarea>
    </label>
    <?php if ($canAdult): ?>
      <label class="check">
        <input type="checkbox" name="is_adult" value="1" data-adult-toggle <?= !empty($_POST['is_adult']) ? 'checked' : '' ?>>
        <span>Soft-18+</span>
      </label>
      <div data-adult-hint hidden>
        <label class="check">
          <input type="checkbox" name="policy_ok" value="1" data-policy-required>
          <span>Inhaltsregeln akzeptiert</span>
        </label>
      </div>
    <?php endif; ?>
    <button class="btn btn-block" type="submit"><?= e(t('reels.create')) ?></button>
  </form>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
