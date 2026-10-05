<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/dm.php';

$user = allxion_require_login();
$errors = [];

if (!dm_user_eligible($user)) {
    flash('error', 'DMs erst ab ' . DM_MIN_AGE . ' Jahren.');
    redirect(allxion_url('messages.php'));
}

$threadId = (int)($_GET['id'] ?? 0);
$withName = trim((string)($_GET['with'] ?? ''));

if ($threadId <= 0 && $withName !== '') {
    $other = dm_find_user_by_username($withName);
    if ($other && (int)$other['id'] !== (int)$user['id']) {
        $thread = dm_get_or_create_thread((int)$user['id'], (int)$other['id']);
        redirect(allxion_url('message.php?id=' . (int)$thread['id']));
    }
    flash('error', 'Benutzer nicht gefunden.');
    redirect(allxion_url('messages.php'));
}

$thread = $threadId > 0 ? dm_thread_for_user($threadId, (int)$user['id']) : null;
if (!$thread) {
    flash('error', 'Unterhaltung nicht gefunden.');
    redirect(allxion_url('messages.php'));
}

$otherId = dm_other_user_id($thread, (int)$user['id']);
$otherStmt = allxion_db()->prepare('SELECT id, username, birthdate FROM users WHERE id = ?');
$otherStmt->execute([$otherId]);
$other = $otherStmt->fetch();
if (!$other) {
    flash('error', 'Gegenüber existiert nicht mehr.');
    redirect(allxion_url('messages.php'));
}

$blockedEither = dm_is_blocked((int)$user['id'], $otherId);
$iBlocked = dm_i_blocked((int)$user['id'], $otherId);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = (string)($_POST['action'] ?? 'send');

    if ($action === 'block') {
        $errors = dm_block((int)$user['id'], $otherId);
        if (!$errors) {
            flash('success', '@' . $other['username'] . ' blockiert.');
            redirect(allxion_url('message.php?id=' . (int)$thread['id']));
        }
    } elseif ($action === 'unblock') {
        dm_unblock((int)$user['id'], $otherId);
        flash('success', 'Blockierung aufgehoben.');
        redirect(allxion_url('message.php?id=' . (int)$thread['id']));
    } elseif ($action === 'report') {
        $errors = dm_report(
            $user,
            (int)$thread['id'],
            (string)($_POST['reason'] ?? ''),
            isset($_POST['message_id']) && $_POST['message_id'] !== '' ? (int)$_POST['message_id'] : null
        );
        if (!$errors) {
            flash('success', 'Meldung eingegangen. Ein Admin prüft die Unterhaltung.');
            redirect(allxion_url('message.php?id=' . (int)$thread['id']));
        }
    } else {
        $policyOk = !empty($_POST['policy_ok']) || dm_rules_accepted($user);
        $errors = dm_send($user, $otherId, (string)($_POST['body'] ?? ''), $policyOk);
        if (!$errors) {
            redirect(allxion_url('message.php?id=' . (int)$thread['id']));
        }
        $user = allxion_current_user() ?? $user;
    }
}

dm_mark_read((int)$thread['id'], (int)$user['id']);
$msgs = dm_messages((int)$thread['id']);

$pageTitle = 'DM @' . $other['username'] . ' · Hybrixon';
$activeNav = 'messages';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <div class="post-meta" style="margin-bottom:0.5rem;">
    <h1 style="margin:0;font-size:1.25rem;">@<?= e($other['username']) ?></h1>
    <a class="btn btn-sm btn-ghost" href="<?= e(allxion_url('messages.php')) ?>">Posteingang</a>
  </div>
  <p class="muted" style="margin-bottom:0.75rem;font-size:0.85rem;">
    Text only · Soft-18+-Verbote · Admins können einsehen · Speicherung ca. <?= (int)DM_RETENTION_DAYS ?> Tage
  </p>

  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>

  <?php if ($blockedEither): ?>
    <div class="flash flash-info" style="margin-bottom:0.75rem;">
      <?php if ($iBlocked): ?>
        Du hast @<?= e($other['username']) ?> blockiert. Nachrichten sind gestoppt.
      <?php else: ?>
        Unterhaltung nicht verfügbar (Blockierung).
      <?php endif; ?>
    </div>
  <?php endif; ?>

  <div class="hero-actions" style="margin-top:0;">
    <?php if ($iBlocked): ?>
      <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="unblock"><button class="btn btn-sm btn-ghost" type="submit">Block aufheben</button></form>
    <?php else: ?>
      <form method="post" onsubmit="return confirm('Wirklich blockieren?');"><?= csrf_field() ?><input type="hidden" name="action" value="block"><button class="btn btn-sm btn-danger" type="submit">Blockieren</button></form>
    <?php endif; ?>
  </div>
</section>

<section class="dm-thread">
  <?php if (!$msgs): ?>
    <div class="empty"><p>Noch keine Nachrichten in diesem Chat.</p></div>
  <?php else: ?>
    <?php foreach ($msgs as $m): ?>
      <?php $mine = (int)$m['sender_id'] === (int)$user['id']; ?>
      <article class="dm-bubble<?= $mine ? ' dm-mine' : '' ?>">
        <div class="dm-meta">
          <strong><?= $mine ? 'Du' : '@' . e($m['username']) ?></strong>
          <span><?= e(time_ago((string)$m['created_at'])) ?></span>
        </div>
        <div class="dm-body"><?= nl2br(e($m['body'])) ?></div>
      </article>
    <?php endforeach; ?>
  <?php endif; ?>
</section>

<?php if (!$blockedEither): ?>
<section class="panel">
  <form method="post" class="form">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="send">
    <label>Nachricht
      <textarea name="body" required maxlength="<?= (int)DM_MAX_LENGTH ?>" placeholder="Nur Text …"><?= e($_POST['action'] ?? '') === 'send' ? ($_POST['body'] ?? '') : '' ?></textarea>
    </label>
    <?php if (!dm_rules_accepted($user)): ?>
      <label class="check">
        <input type="checkbox" name="policy_ok" value="1" required>
        <span>DM-Regeln akzeptieren (<a href="<?= e(allxion_url('rules.php')) ?>" target="_blank" rel="noopener">lesen</a>)</span>
      </label>
    <?php else: ?>
      <input type="hidden" name="policy_ok" value="1">
    <?php endif; ?>
    <button class="btn btn-block" type="submit">Senden</button>
  </form>
</section>
<?php endif; ?>

<section class="panel">
  <h2>Melden</h2>
  <p class="muted" style="margin-bottom:0.75rem;">
    Bei Belästigung, illegalen oder verbotenen Inhalten. Meldungen priorisieren die Prüfung;
    Admins können DMs ohnehin zur Regel-Durchsetzung einsehen (protokolliert).
  </p>
  <form method="post" class="form">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="report">
    <label>Grund
      <textarea name="reason" required maxlength="<?= (int)DM_REPORT_REASON_MAX ?>" placeholder="Was ist passiert?"><?= e(($_POST['action'] ?? '') === 'report' ? ($_POST['reason'] ?? '') : '') ?></textarea>
    </label>
    <button class="btn btn-sm btn-danger" type="submit">Unterhaltung melden</button>
  </form>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
