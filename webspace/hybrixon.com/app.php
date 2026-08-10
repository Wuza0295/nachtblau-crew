<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/i18n.php';

$pageTitle = t('app.title') . ' · Hybrixon';
$activeNav = 'app';
$apkLatest = ALLXION_ROOT . '/downloads/hybrixon.apk';
$apkVersioned = ALLXION_ROOT . '/downloads/hybrixon-1.0.3.apk';
$apkPath = is_file($apkLatest) ? $apkLatest : $apkVersioned;
$apkBytes = is_file($apkPath) ? (int)filesize($apkPath) : 0;
$apkMb = $apkBytes > 0 ? number_format($apkBytes / 1048576, 1, ',', '.') : '—';
$version = '1.0.3';
$downloadUrl = allxion_url('downloads/hybrixon.apk');
$homeUrl = allxion_url();

require __DIR__ . '/includes/header.php';
?>

<section class="panel app-download">
  <div class="app-download-hero">
    <img class="app-download-icon" src="<?= e(allxion_url('assets/img/logo-avatar.png')) ?>" alt="Hybrixon" width="96" height="96">
    <div>
      <h1><?= e(t('app.title')) ?></h1>
      <p class="muted"><?= e(t('app.lead')) ?></p>
    </div>
  </div>

  <div class="app-platform" id="android">
    <h2><?= e(t('app.android_title')) ?></h2>
    <p class="muted"><?= e(t('app.android_lead')) ?></p>

    <div class="pill-row" style="margin:1rem 0;">
      <span class="pill">Android 7+</span>
      <span class="pill">v<?= e($version) ?></span>
      <span class="pill"><?= e($apkMb) ?> MB</span>
    </div>

    <?php if ($apkBytes > 0): ?>
      <a class="btn btn-block" href="<?= e($downloadUrl) ?>" download="hybrixon-<?= e($version) ?>.apk">
        <?= e(t('app.download')) ?>
      </a>
    <?php else: ?>
      <div class="flash flash-error"><?= e(t('app.missing')) ?></div>
    <?php endif; ?>

    <h3 class="app-subhead"><?= e(t('app.install_title')) ?></h3>
    <ol class="app-install-steps">
      <li><?= e(t('app.step1')) ?></li>
      <li><?= e(t('app.step2')) ?></li>
      <li><?= e(t('app.step3')) ?></li>
    </ol>

    <h3 class="app-subhead"><?= e(t('app.features_title')) ?></h3>
    <ul class="muted app-feature-list">
      <li><?= e(t('app.feature1')) ?></li>
      <li><?= e(t('app.feature2')) ?></li>
      <li><?= e(t('app.feature3')) ?></li>
      <li><?= e(t('app.feature4')) ?></li>
    </ul>

    <p class="hint" style="margin-top:1rem;"><?= e(t('app.note')) ?></p>
  </div>

  <div class="app-platform" id="apple">
    <h2><?= e(t('app.ios_title')) ?></h2>
    <p class="muted"><?= e(t('app.ios_lead')) ?></p>

    <div class="pill-row" style="margin:1rem 0;">
      <span class="pill">iPhone / iPad</span>
      <span class="pill">Safari</span>
      <span class="pill">iOS 16+</span>
    </div>

    <a class="btn btn-block btn-ghost" href="<?= e($homeUrl) ?>">
      <?= e(t('app.ios_open')) ?>
    </a>

    <h3 class="app-subhead"><?= e(t('app.ios_install_title')) ?></h3>
    <ol class="app-install-steps">
      <li><?= e(t('app.ios_step1')) ?></li>
      <li><?= e(t('app.ios_step2')) ?></li>
      <li><?= e(t('app.ios_step3')) ?></li>
      <li><?= e(t('app.ios_step4')) ?></li>
    </ol>

    <h3 class="app-subhead"><?= e(t('app.ios_tips_title')) ?></h3>
    <ul class="muted app-feature-list">
      <li><?= e(t('app.ios_tip1')) ?></li>
      <li><?= e(t('app.ios_tip2')) ?></li>
      <li><?= e(t('app.ios_tip3')) ?></li>
    </ul>

    <p class="hint" style="margin-top:1rem;"><?= e(t('app.ios_note')) ?></p>
  </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
