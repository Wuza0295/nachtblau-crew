<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/policy.php';

$pageTitle = 'Regeln · Hybrixon';
$activeNav = '';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1>Inhaltsregeln</h1>
  <p class="muted" style="margin-bottom:1rem;"><?= e(content_policy_summary()) ?></p>

  <h2>Soft-18+ (erlaubt mit Altersfilter)</h2>
  <ul class="muted" style="margin:0.75rem 0 1.25rem 1.1rem;display:grid;gap:0.35rem;">
    <?php foreach (CONTENT_POLICY_SOFT_18 as $item): ?>
      <li><?= e($item) ?></li>
    <?php endforeach; ?>
  </ul>

  <h2>Direktnachrichten</h2>
  <ul class="muted" style="margin:0.75rem 0 1.25rem 1.1rem;display:grid;gap:0.35rem;">
    <?php foreach (CONTENT_POLICY_DM as $item): ?>
      <li><?= e($item) ?></li>
    <?php endforeach; ?>
  </ul>

  <h2>Verboten</h2>
  <ul class="muted" style="margin:0.75rem 0 1.25rem 1.1rem;display:grid;gap:0.35rem;">
    <?php foreach (CONTENT_POLICY_FORBIDDEN as $item): ?>
      <li><?= e($item) ?></li>
    <?php endforeach; ?>
  </ul>

  <p class="muted">
    Verstöße können zur Löschung von Beiträgen/Nachrichten und Sperrung des Kontos führen.
    Stand: <?= e(CONTENT_POLICY_VERSION) ?>.
  </p>
  <p style="margin-top:1rem;">
    <a class="btn btn-ghost" href="<?= e(allxion_url()) ?>">Feed</a>
    <a class="btn btn-ghost" href="<?= e(allxion_url('terms.php')) ?>">Nutzungsbedingungen</a>
    <a class="btn btn-ghost" href="<?= e(allxion_url('privacy.php')) ?>">Datenschutz</a>
    <a class="btn btn-ghost" href="<?= e(allxion_url('impressum.php')) ?>">Impressum</a>
    <?php if (allxion_current_user()): ?>
      <a class="btn btn-ghost" href="<?= e(allxion_url('messages.php')) ?>">Nachrichten</a>
    <?php endif; ?>
  </p>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
