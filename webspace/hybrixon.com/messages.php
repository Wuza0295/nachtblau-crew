<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/dm.php';
require_once __DIR__ . '/includes/social.php';
require_once __DIR__ . '/includes/i18n.php';

$user = allxion_require_login();
$errors = [];
$prefillUser = trim((string)($_GET['to'] ?? $_POST['username'] ?? ''));

if (!dm_user_eligible($user)) {
    $pageTitle = t('messages.title') . ' · Hybrixon';
    $activeNav = 'messages';
    require __DIR__ . '/includes/header.php';
    echo '<section class="panel"><h1>' . e(t('messages.title')) . '</h1>';
    echo '<p class="muted">' . e(t('messages.age_gate', ['age' => (string)(int)DM_MIN_AGE])) . '</p>';
    echo '<p style="margin-top:1rem;"><a class="btn btn-ghost" href="' . e(allxion_url('rules.php')) . '">' . e(t('footer.rules')) . '</a></p>';
    echo '</section>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'start') {
    verify_csrf();
    $toName = trim((string)($_POST['username'] ?? ''));
    $body = (string)($_POST['body'] ?? '');
    $policyOk = !empty($_POST['policy_ok']);
    $other = dm_find_user_by_username($toName);
    if (!$other) {
        $errors[] = t('messages.user_missing');
    } elseif (!social_can_dm($user, $other)) {
        $errors[] = t('messages.privacy_block');
    } else {
        $errors = dm_send($user, (int)$other['id'], $body, $policyOk);
        if (!$errors) {
            $thread = dm_get_or_create_thread((int)$user['id'], (int)$other['id']);
            flash('success', t('messages.sent'));
            redirect(allxion_url('message.php?id=' . (int)$thread['id']));
        }
    }
    $user = allxion_current_user() ?? $user;
}

$inbox = dm_inbox((int)$user['id']);
$pageTitle = t('messages.title') . ' · Hybrixon';
$activeNav = 'messages';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1><?= e(t('messages.title')) ?></h1>
  <p class="muted" style="margin-bottom:1rem;">
    <?= e(t('messages.lead', ['age' => (string)(int)DM_MIN_AGE])) ?>
    <strong><?= e(t('messages.admin_note')) ?></strong>
    <?= e(t('messages.retention', ['days' => (string)(int)DM_RETENTION_DAYS])) ?>
    <a href="<?= e(allxion_url('rules.php')) ?>"><?= e(t('footer.rules')) ?></a>
  </p>

  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>

  <form method="post" class="form">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="start">
    <label><?= e(t('messages.to')) ?>
      <input type="text" name="username" required maxlength="24" pattern="[A-Za-z0-9_]+" autocomplete="off" value="<?= e($prefillUser) ?>" placeholder="<?= e(t('messages.to_ph')) ?>">
    </label>
    <label><?= e(t('messages.first')) ?>
      <textarea name="body" required maxlength="<?= (int)DM_MAX_LENGTH ?>" placeholder="<?= e(t('messages.text_only_ph')) ?>"><?= e($_POST['body'] ?? '') ?></textarea>
    </label>
    <?php if (!dm_rules_accepted($user)): ?>
      <label class="check">
        <input type="checkbox" name="policy_ok" value="1" required <?= !empty($_POST['policy_ok']) ? 'checked' : '' ?>>
        <span><?= e(t('messages.accept_rules')) ?>
          (<a href="<?= e(allxion_url('rules.php')) ?>" target="_blank" rel="noopener"><?= e(t('messages.dm_rules_link')) ?></a>)</span>
      </label>
    <?php else: ?>
      <input type="hidden" name="policy_ok" value="1">
      <p class="hint"><?= e(t('messages.rules_accepted')) ?> · <a href="<?= e(allxion_url('rules.php')) ?>"><?= e(t('messages.read_rules')) ?></a></p>
    <?php endif; ?>
    <button class="btn" type="submit"><?= e(t('messages.send')) ?></button>
  </form>
</section>

<section class="feed">
  <h2 class="panel" style="margin:0;padding:0.9rem 1.1rem;font-size:1.1rem;"><?= e(t('messages.inbox')) ?></h2>
  <?php if (!$inbox): ?>
    <div class="empty"><p><?= e(t('messages.inbox_empty')) ?></p></div>
  <?php else: ?>
    <?php foreach ($inbox as $row): ?>
      <a class="post dm-row<?= (int)($row['unread'] ?? 0) > 0 ? ' dm-unread' : '' ?>" href="<?= e(allxion_url('message.php?id=' . (int)$row['id'])) ?>">
        <div class="post-meta">
          <span class="post-user">@<?= e((string)$row['other_username']) ?></span>
          <span><?= e(time_ago((string)($row['last_at'] ?? $row['updated_at'] ?? ''))) ?></span>
        </div>
        <div class="post-body muted" style="font-size:0.95rem;">
          <?php if ((int)($row['unread'] ?? 0) > 0): ?>
            <span class="badge-18" style="margin-right:0.35rem;"><?= e(t('messages.new_count', ['n' => (string)(int)$row['unread']])) ?></span>
          <?php endif; ?>
          <?= e(mb_strimwidth((string)($row['last_body'] ?? '—'), 0, 120, '…')) ?>
        </div>
      </a>
    <?php endforeach; ?>
  <?php endif; ?>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
