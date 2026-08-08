<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/notifications.php';
require_once __DIR__ . '/includes/i18n.php';

$user = allxion_require_login();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = (string)($_POST['action'] ?? '');
    if ($action === 'mark_all') {
        notifications_mark_read((int)$user['id']);
        flash('success', t('notif.marked_all'));
        redirect(allxion_url('notifications.php'));
    }
    if ($action === 'mark_one') {
        notifications_mark_read((int)$user['id'], (int)($_POST['id'] ?? 0));
        $nid = (int)($_POST['id'] ?? 0);
        $row = allxion_db()->prepare('SELECT post_id, type FROM notifications WHERE id = ? AND user_id = ?');
        $row->execute([$nid, (int)$user['id']]);
        $n = $row->fetch();
        if ($n && !empty($n['post_id'])) {
            redirect(allxion_url('post.php?id=' . (int)$n['post_id']));
        }
        if ($n && ($n['type'] ?? '') === 'friend_request') {
            redirect(allxion_url('friends.php?tab=requests'));
        }
        if ($n && ($n['type'] ?? '') === 'partner_request') {
            redirect(allxion_url('settings.php'));
        }
        if ($n && in_array(($n['type'] ?? ''), ['report_post', 'report_dm'], true) && user_is_admin($user)) {
            redirect(allxion_url('admin/'));
        }
        redirect(allxion_url('notifications.php'));
    }
}

$list = notifications_list((int)$user['id']);
$pageTitle = t('notif.title') . ' · Hybrixon';
$activeNav = 'notifications';
require __DIR__ . '/includes/header.php';
?>
<section class="panel">
  <h1><?= e(t('notif.title')) ?></h1>
  <form method="post" style="margin-bottom:1rem;"><?= csrf_field() ?>
    <input type="hidden" name="action" value="mark_all">
    <button class="btn btn-sm btn-ghost" type="submit"><?= e(t('notif.mark_all')) ?></button>
  </form>
  <?php if (!$list): ?>
    <p class="muted"><?= e(t('notif.empty')) ?></p>
  <?php else: ?>
    <div class="feed">
      <?php foreach ($list as $n): ?>
        <form method="post" class="post" style="<?= empty($n['is_read']) ? 'border-color:rgba(45,212,191,.4);' : '' ?>">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="mark_one">
          <input type="hidden" name="id" value="<?= (int)$n['id'] ?>">
          <button type="submit" style="all:unset;cursor:pointer;display:block;width:100%;">
            <div class="post-meta">
              <strong><?= e(notifications_label($n)) ?></strong>
              <span><?= e(time_ago($n['created_at'])) ?></span>
            </div>
            <?php if (empty($n['is_read'])): ?><span class="pill pill-ok"><?= e(t('notif.new')) ?></span><?php endif; ?>
          </button>
        </form>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</section>
<?php require __DIR__ . '/includes/footer.php'; ?>
