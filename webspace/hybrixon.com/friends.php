<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/friends.php';
require_once __DIR__ . '/includes/social.php';
require_once __DIR__ . '/includes/i18n.php';

$user = allxion_require_login();
$errors = [];
$tab = (string)($_GET['tab'] ?? 'list');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = (string)($_POST['action'] ?? '');
    $otherId = (int)($_POST['user_id'] ?? 0);
    if ($action === 'request' && $otherId > 0) {
        $errors = friends_send_request((int)$user['id'], $otherId);
        $okMsg = friends_are_friends((int)$user['id'], $otherId)
            ? t('friends.now_friends')
            : t('friends.request_sent');
        flash($errors ? 'error' : 'success', $errors[0] ?? $okMsg);
        redirect(allxion_url('friends.php?tab=list'));
    }
    if ($action === 'accept' && $otherId > 0) {
        $errors = friends_respond((int)$user['id'], $otherId, true);
        flash($errors ? 'error' : 'success', $errors[0] ?? t('friends.accepted'));
        redirect(allxion_url('friends.php?tab=requests'));
    }
    if ($action === 'decline' && $otherId > 0) {
        $errors = friends_respond((int)$user['id'], $otherId, false);
        flash($errors ? 'error' : 'success', $errors[0] ?? t('friends.declined'));
        redirect(allxion_url('friends.php?tab=requests'));
    }
    if ($action === 'remove' && $otherId > 0) {
        friends_remove((int)$user['id'], $otherId);
        flash('success', t('friends.ended'));
        redirect(allxion_url('friends.php'));
    }
    if ($action === 'cancel' && $otherId > 0) {
        friends_cancel_outgoing((int)$user['id'], $otherId);
        flash('success', t('friends.cancelled'));
        redirect(allxion_url('friends.php?tab=requests'));
    }
    if ($action === 'request_username') {
        $uname = trim((string)($_POST['username'] ?? ''));
        $target = social_find_user_by_username($uname);
        if (!$target) {
            flash('error', t('friends.user_missing'));
        } else {
            $errors = friends_send_request((int)$user['id'], (int)$target['id']);
            $okMsg = friends_are_friends((int)$user['id'], (int)$target['id'])
                ? t('friends.now_friends')
                : t('friends.request_sent');
            flash($errors ? 'error' : 'success', $errors[0] ?? $okMsg);
        }
        redirect(allxion_url('friends.php'));
    }
}

$friends = friends_list((int)$user['id']);
$incoming = friends_incoming((int)$user['id']);
$pageTitle = t('friends.title') . ' · Hybrixon';
$activeNav = 'friends';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1><?= e(t('friends.title')) ?></h1>
  <p class="muted" style="margin-bottom:1rem;"><?= e(t('friends.summary', [
      'friends' => (string)count($friends),
      'requests' => (string)count($incoming),
  ])) ?></p>
  <div class="hero-actions" style="margin-top:0;">
    <a class="btn btn-sm <?= $tab === 'list' ? '' : 'btn-ghost' ?>" href="<?= e(allxion_url('friends.php?tab=list')) ?>"><?= e(t('friends.list')) ?></a>
    <a class="btn btn-sm <?= $tab === 'requests' ? '' : 'btn-ghost' ?>" href="<?= e(allxion_url('friends.php?tab=requests')) ?>"><?= e(t('friends.requests')) ?><?php if ($incoming): ?> (<?= count($incoming) ?>)<?php endif; ?></a>
  </div>
</section>

<section class="panel">
  <h2><?= e(t('friends.add')) ?></h2>
  <form method="post" class="form">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="request_username">
    <label><?= e(t('friends.username')) ?>
      <input type="text" name="username" required maxlength="40" placeholder="username" autocomplete="off">
    </label>
    <button class="btn" type="submit"><?= e(t('friends.send_request')) ?></button>
  </form>
</section>

<?php if ($tab === 'requests'): ?>
  <section class="panel">
    <h2><?= e(t('friends.incoming')) ?></h2>
    <?php if (!$incoming): ?>
      <p class="muted"><?= e(t('friends.none_incoming')) ?></p>
    <?php else: ?>
      <div class="feed">
        <?php foreach ($incoming as $f): ?>
          <div class="post" style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:0.75rem;">
              <div class="avatar">
                <?php if (!empty($f['avatar_path'])): ?>
                  <img src="<?= e(allxion_url('media.php?avatar=' . (int)$f['id'])) ?>" alt="">
                <?php else: ?>
                  <span><?= e(mb_strtoupper(mb_substr($f['username'], 0, 1))) ?></span>
                <?php endif; ?>
              </div>
              <div>
                <a class="post-user" href="<?= e(user_public_url($f['username'])) ?>">@<?= e($f['username']) ?></a>
                <?php if (!empty($f['display_name'])): ?>
                  <div class="muted"><?= e($f['display_name']) ?></div>
                <?php endif; ?>
              </div>
            </div>
            <div class="hero-actions" style="margin:0;">
              <form method="post" style="display:inline;"><?= csrf_field() ?>
                <input type="hidden" name="action" value="accept">
                <input type="hidden" name="user_id" value="<?= (int)$f['id'] ?>">
                <button class="btn btn-sm" type="submit"><?= e(t('friends.accept')) ?></button>
              </form>
              <form method="post" style="display:inline;"><?= csrf_field() ?>
                <input type="hidden" name="action" value="decline">
                <input type="hidden" name="user_id" value="<?= (int)$f['id'] ?>">
                <button class="btn btn-sm btn-ghost" type="submit"><?= e(t('friends.decline')) ?></button>
              </form>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </section>
<?php else: ?>
  <section class="panel">
    <h2><?= e(t('friends.list')) ?></h2>
    <?php if (!$friends): ?>
      <p class="muted"><?= e(t('friends.empty')) ?></p>
    <?php else: ?>
      <div class="feed">
        <?php foreach ($friends as $f): ?>
          <div class="post" style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:0.75rem;">
              <div class="avatar">
                <?php if (!empty($f['avatar_path'])): ?>
                  <img src="<?= e(allxion_url('media.php?avatar=' . (int)$f['id'])) ?>" alt="">
                <?php else: ?>
                  <span><?= e(mb_strtoupper(mb_substr($f['username'], 0, 1))) ?></span>
                <?php endif; ?>
              </div>
              <a class="post-user" href="<?= e(user_public_url($f['username'])) ?>">@<?= e($f['username']) ?></a>
            </div>
            <form method="post"><?= csrf_field() ?>
              <input type="hidden" name="action" value="remove">
              <input type="hidden" name="user_id" value="<?= (int)$f['id'] ?>">
              <button class="btn btn-sm btn-ghost" type="submit"><?= e(t('friends.remove')) ?></button>
            </form>
          </div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </section>
<?php endif; ?>

<?php require __DIR__ . '/includes/footer.php'; ?>
