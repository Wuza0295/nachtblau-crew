<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/hosting_monitor.php';

$admin = allxion_require_admin();
$snap = hybrixon_hosting_snapshot(true, true);
hybrixon_hosting_record_sample($snap);
$history = array_reverse(hybrixon_hosting_history());

$pageTitle = 'Hosting-Monitor · Hybrixon';
$activeNav = 'admin';
require __DIR__ . '/../includes/header.php';

$verdict = (string)$snap['verdict'];
$verdictLabel = match ($verdict) {
    'migrate' => 'Wechsel prüfen',
    'watch' => 'Beobachten',
    default => 'ALL-INKL ok',
};
$verdictClass = match ($verdict) {
    'migrate' => 'flash-error',
    'watch' => 'flash-warn',
    default => 'flash-success',
};
?>

<section class="panel">
  <h1>Hosting-Monitor</h1>
  <p class="muted">Automatische Einschätzung, ob ALL-INKL für Hybrixon noch passt. Öffentlicher Check: <code>/api/health</code>.</p>
  <div class="pill-row" style="margin:0.75rem 0 1rem;">
    <a class="pill" href="<?= e(allxion_url('admin/')) ?>">← Admin</a>
    <span class="pill">Score <?= (int)$snap['score'] ?>/100</span>
    <span class="pill"><?= e((string)$snap['php']) ?></span>
    <span class="pill"><?= e((string)$snap['provider']) ?></span>
  </div>

  <div class="flash <?= e($verdictClass) ?>">
    <strong><?= e($verdictLabel) ?></strong><br>
    <?= e((string)$snap['recommendation']) ?>
  </div>
</section>

<section class="panel">
  <h2>Kennzahlen</h2>
  <ul class="muted app-feature-list" style="margin-top:0.75rem;">
    <li>Nutzer: <?= number_format((int)$snap['metrics']['users'], 0, ',', '.') ?></li>
    <li>Beiträge: <?= number_format((int)$snap['metrics']['posts'], 0, ',', '.') ?></li>
    <li>SQLite-DB: <?= e((string)$snap['metrics']['dbHuman']) ?></li>
    <li>Uploads: <?= e((string)$snap['metrics']['uploadHuman']) ?></li>
    <li>Frei (Daten-Partition): <?= e((string)($snap['metrics']['freeHuman'] ?? 'n/a')) ?></li>
    <li>Health-Latenz: <?= (int)$snap['metrics']['latencyMs'] ?> ms</li>
    <li>Stand: <?= e((string)$snap['checkedAt']) ?></li>
  </ul>
</section>

<section class="panel">
  <h2>Signale</h2>
  <?php if (!$snap['signals']): ?>
    <p class="muted">Keine Warnungen — alles im grünen Bereich.</p>
  <?php else: ?>
    <ul class="app-feature-list" style="margin-top:0.75rem;">
      <?php foreach ($snap['signals'] as $sig): ?>
        <li>
          <strong><?= e(strtoupper((string)$sig['level'])) ?></strong>
          · <?= e((string)$sig['code']) ?> —
          <?= e((string)$sig['message']) ?>
        </li>
      <?php endforeach; ?>
    </ul>
  <?php endif; ?>
</section>

<section class="panel">
  <h2>Verlauf (max. 90 Stunden-Samples)</h2>
  <?php if (!$history): ?>
    <p class="muted">Noch keine Samples. Der öffentliche Health-Check speichert höchstens 1× pro Stunde.</p>
  <?php else: ?>
    <div class="feed" style="gap:0.45rem;">
      <?php foreach (array_slice($history, 0, 24) as $row): ?>
        <div class="post" style="padding:0.65rem 0.85rem;">
          <div class="post-meta">
            <span><?= e((string)($row['at'] ?? '')) ?></span>
            <span><?= e((string)($row['verdict'] ?? '')) ?> · <?= (int)($row['score'] ?? 0) ?>/100</span>
          </div>
          <p class="muted" style="margin:0.25rem 0 0;">
            Nutzer <?= number_format((int)($row['users'] ?? 0), 0, ',', '.') ?>
            · Posts <?= number_format((int)($row['posts'] ?? 0), 0, ',', '.') ?>
            · <?= (int)($row['latencyMs'] ?? 0) ?> ms
            · DB <?= e(hybrixon_hosting_format_bytes((int)($row['dbBytes'] ?? 0))) ?>
            · Uploads <?= e(hybrixon_hosting_format_bytes((int)($row['uploadBytes'] ?? 0))) ?>
          </p>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</section>

<?php require __DIR__ . '/../includes/footer.php'; ?>
