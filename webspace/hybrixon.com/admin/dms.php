<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/dm.php';

$admin = allxion_require_admin();
$threadId = (int)($_GET['id'] ?? 0);

if ($threadId > 0) {
    $thread = dm_admin_get_thread($threadId);
    if (!$thread) {
        flash('error', 'Thread nicht gefunden.');
        redirect(allxion_url('admin/dms.php'));
    }
    $msgs = dm_admin_thread_messages($threadId, (int)$admin['id']) ?? [];
    $pageTitle = 'Admin-DM #' . $threadId . ' · Hybrixon';
    $activeNav = 'admin';
    require __DIR__ . '/../includes/header.php';
    ?>
    <section class="panel">
      <div class="post-meta">
        <h1 style="margin:0;font-size:1.2rem;">
          @<?= e($thread['user_a_name']) ?> ↔ @<?= e($thread['user_b_name']) ?>
        </h1>
        <a class="btn btn-sm btn-ghost" href="<?= e(allxion_url('admin/dms.php')) ?>">Alle DMs</a>
      </div>
      <p class="muted" style="margin-top:0.5rem;">
        Volle Admin-Kontrolle · Zugriff protokolliert · Thread #<?= (int)$thread['id'] ?>
      </p>
    </section>
    <section class="dm-thread">
      <?php if (!$msgs): ?>
        <div class="empty"><p>Keine Nachrichten.</p></div>
      <?php else: ?>
        <?php foreach ($msgs as $m): ?>
          <article class="dm-bubble">
            <div class="dm-meta">
              <strong>@<?= e($m['username']) ?></strong>
              <span><?= e($m['created_at']) ?></span>
            </div>
            <div class="dm-body"><?= nl2br(e($m['body'])) ?></div>
          </article>
        <?php endforeach; ?>
      <?php endif; ?>
    </section>
    <p><a class="btn btn-ghost" href="<?= e(allxion_url('admin/#dms')) ?>">Zu Meldungen</a></p>
    <?php
    require __DIR__ . '/../includes/footer.php';
    exit;
}

$threads = dm_admin_all_threads(150);
$pageTitle = 'Admin · Alle DMs';
$activeNav = 'admin';
require __DIR__ . '/../includes/header.php';
?>

<section class="panel">
  <h1>Alle Direktnachrichten</h1>
  <div class="flash flash-info" style="margin-bottom:1rem;">
    <strong>Volle Kontrolle:</strong> Admins können alle DMs einsehen.
    Das ist in den Nutzerregeln offengelegt. Jeder Thread-Zugriff wird protokolliert.
  </div>
  <div class="pill-row">
    <a class="pill" href="<?= e(allxion_url('admin/')) ?>">Admin-Home</a>
    <a class="pill" href="<?= e(allxion_url('admin/#dms')) ?>">Meldungen</a>
    <a class="pill" href="<?= e(allxion_url('rules.php')) ?>">Regeln</a>
  </div>
</section>

<section class="feed">
  <?php if (!$threads): ?>
    <div class="empty"><p>Noch keine DM-Threads.</p></div>
  <?php else: ?>
    <?php foreach ($threads as $t): ?>
      <a class="post dm-row<?= (int)($t['open_reports'] ?? 0) > 0 ? ' dm-unread' : '' ?>" href="<?= e(allxion_url('admin/dms.php?id=' . (int)$t['id'])) ?>">
        <div class="post-meta">
          <span class="post-user">@<?= e($t['user_a_name']) ?> ↔ @<?= e($t['user_b_name']) ?></span>
          <span><?= e(time_ago((string)($t['last_at'] ?? $t['updated_at'] ?? ''))) ?></span>
        </div>
        <div class="post-body muted" style="font-size:0.95rem;">
          <?php if ((int)($t['open_reports'] ?? 0) > 0): ?>
            <span class="badge-18" style="margin-right:0.35rem;"><?= (int)$t['open_reports'] ?> Meldung(en)</span>
          <?php endif; ?>
          <span class="muted"><?= (int)($t['msg_count'] ?? 0) ?> Msg · </span>
          <?= e(mb_strimwidth((string)($t['last_body'] ?? '—'), 0, 100, '…')) ?>
        </div>
      </a>
    <?php endforeach; ?>
  <?php endif; ?>
</section>

<?php require __DIR__ . '/../includes/footer.php'; ?>
