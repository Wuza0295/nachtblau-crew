<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/dm.php';

$user = allxion_require_login();
$errors = [];

if (!dm_user_eligible($user)) {
    $pageTitle = 'Nachrichten · Hybrixon';
    $activeNav = 'messages';
    require __DIR__ . '/includes/header.php';
    echo '<section class="panel"><h1>Direktnachrichten</h1>';
    echo '<p class="muted">DMs sind erst ab ' . (int)DM_MIN_AGE . ' Jahren möglich (Geburtsdatum im Konto). '
        . 'Das reduziert Risiken bei Unterhaltungen mit Minderjährigen.</p>';
    echo '<p style="margin-top:1rem;"><a class="btn btn-ghost" href="' . e(allxion_url('rules.php')) . '">Regeln</a></p>';
    echo '</section>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

$prefillTo = trim((string)($_GET['to'] ?? $_POST['username'] ?? ''));

// Deep-link: existing chat with this user → open thread directly
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $prefillTo !== '') {
    $open = dm_open_with_username($user, $prefillTo);
    if ($open['ok'] && !empty($open['threadId']) && str_contains($open['url'], 'message.php')) {
        redirect($open['url']);
    }
    if (!$open['ok']) {
        $errors[] = $open['error'];
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'start') {
    verify_csrf();
    $toName = trim((string)($_POST['username'] ?? ''));
    $body = (string)($_POST['body'] ?? '');
    $policyOk = !empty($_POST['policy_ok']);
    $other = dm_find_user_by_username($toName);
    if (!$other) {
        $errors[] = 'Benutzer nicht gefunden.';
    } else {
        $errors = dm_send($user, (int)$other['id'], $body, $policyOk);
        if (!$errors) {
            $thread = dm_get_or_create_thread((int)$user['id'], (int)$other['id']);
            flash('success', 'Nachricht gesendet.');
            redirect(allxion_url('message.php?id=' . (int)$thread['id']));
        }
    }
    $user = allxion_current_user() ?? $user;
    $prefillTo = $toName;
}

$inbox = dm_inbox((int)$user['id']);
$pageTitle = 'Nachrichten · Hybrixon';
$activeNav = 'messages';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1>Direktnachrichten</h1>
  <p class="muted" style="margin-bottom:1rem;">
    Privat zwischen Mitgliedern, nur Text, ab <?= (int)DM_MIN_AGE ?> Jahren. Kein Porno, keine Gewalt.
    <strong>Plattform-Admins können DMs einsehen</strong> (Regel-Durchsetzung, Zugriffe protokolliert).
    Aufbewahrung ca. <?= (int)DM_RETENTION_DAYS ?> Tage.
    <a href="<?= e(allxion_url('rules.php')) ?>">Regeln</a>
  </p>

  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>

  <?php if ($prefillTo !== ''): ?>
    <div class="flash flash-info" style="margin-bottom:0.85rem;">
      Neue PN an <strong>@<?= e($prefillTo) ?></strong> — erste Nachricht schreiben.
    </div>
  <?php endif; ?>

  <form method="post" class="form">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="start">
    <label>An (Benutzername)
      <input type="text" name="username" required maxlength="24" pattern="[A-Za-z0-9_]+" autocomplete="off" value="<?= e($prefillTo) ?>" placeholder="z.B. name">
    </label>
    <label>Erste Nachricht
      <textarea name="body" required maxlength="<?= (int)DM_MAX_LENGTH ?>" placeholder="Nur Text …"><?= e($_POST['body'] ?? '') ?></textarea>
    </label>
    <?php if (!dm_rules_accepted($user)): ?>
      <label class="check">
        <input type="checkbox" name="policy_ok" value="1" required <?= !empty($_POST['policy_ok']) ? 'checked' : '' ?>>
        <span>Ich akzeptiere die <a href="<?= e(allxion_url('rules.php')) ?>" target="_blank" rel="noopener">DM-Regeln</a> (kein Porno/Gewalt; Admins können DMs einsehen; begrenzte Speicherung).</span>
      </label>
    <?php else: ?>
      <input type="hidden" name="policy_ok" value="1">
      <p class="hint">DM-Regeln bereits akzeptiert · <a href="<?= e(allxion_url('rules.php')) ?>">nachlesen</a></p>
    <?php endif; ?>
    <button class="btn" type="submit">Nachricht senden</button>
  </form>
</section>

<section class="feed">
  <h2 class="panel" style="margin:0;padding:0.9rem 1.1rem;font-size:1.1rem;">Posteingang</h2>
  <?php if (!$inbox): ?>
    <div class="empty"><p>Noch keine Unterhaltungen.</p></div>
  <?php else: ?>
    <?php foreach ($inbox as $row): ?>
      <a class="post dm-row<?= (int)($row['unread'] ?? 0) > 0 ? ' dm-unread' : '' ?>" href="<?= e(allxion_url('message.php?id=' . (int)$row['id'])) ?>">
        <div class="post-meta">
          <span class="post-user">@<?= e((string)$row['other_username']) ?></span>
          <span><?= e(time_ago((string)($row['last_at'] ?? $row['updated_at'] ?? ''))) ?></span>
        </div>
        <div class="post-body muted" style="font-size:0.95rem;">
          <?php if ((int)($row['unread'] ?? 0) > 0): ?>
            <span class="badge-18" style="margin-right:0.35rem;"><?= (int)$row['unread'] ?> neu</span>
          <?php endif; ?>
          <?= e(mb_strimwidth((string)($row['last_body'] ?? '—'), 0, 120, '…')) ?>
        </div>
      </a>
    <?php endforeach; ?>
  <?php endif; ?>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
