<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/groups.php';
require_once __DIR__ . '/includes/social.php';

$viewer = allxion_current_user();
$slug = trim((string)($_GET['slug'] ?? ''));
$stmt = allxion_db()->prepare('SELECT * FROM community_groups WHERE lower(slug) = lower(?)');
$stmt->execute([$slug]);
$group = $stmt->fetch();
if (!$group || !groups_can_view($viewer, $group)) {
    http_response_code(404);
    $pageTitle = 'Gruppe · Hybrixon';
    require __DIR__ . '/includes/header.php';
    echo '<section class="panel"><h1>Gruppe nicht gefunden</h1></section>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

$gid = (int)$group['id'];
$isMember = $viewer && groups_is_member($gid, (int)$viewer['id']);
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $viewer) {
    verify_csrf();
    $action = (string)($_POST['action'] ?? '');
    if ($action === 'join') {
        $errors = groups_join($gid, (int)$viewer['id']);
        flash($errors ? 'error' : 'success', $errors[0] ?? 'Beigetreten.');
        redirect(allxion_url('group.php?slug=' . rawurlencode($group['slug'])));
    }
    if ($action === 'leave') {
        $errors = groups_leave($gid, (int)$viewer['id']);
        flash($errors ? 'error' : 'success', $errors[0] ?? 'Gruppe verlassen.');
        redirect(allxion_url('group.php?slug=' . rawurlencode($group['slug'])));
    }
    if ($action === 'post') {
        $errors = groups_post($gid, (int)$viewer['id'], (string)($_POST['body'] ?? ''));
        if (!$errors) {
            flash('success', 'Beitrag gepostet.');
            redirect(allxion_url('group.php?slug=' . rawurlencode($group['slug'])));
        }
    }
}

$postsStmt = allxion_db()->prepare(
    'SELECT gp.*, u.username, u.display_name, u.avatar_path
     FROM group_posts gp JOIN users u ON u.id = gp.user_id
     WHERE gp.group_id = ? ORDER BY gp.created_at DESC LIMIT 50'
);
$postsStmt->execute([$gid]);
$posts = $postsStmt->fetchAll();

$memberCount = (int)allxion_db()->query(
    "SELECT COUNT(*) FROM group_members WHERE group_id = {$gid} AND status = 'member'"
)->fetchColumn();

$pageTitle = $group['name'] . ' · Hybrixon';
$activeNav = 'groups';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1><?= e($group['name']) ?></h1>
  <p class="muted"><?= (int)$memberCount ?> Mitglieder · <?= e($group['privacy']) ?>
    · <a href="<?= e(allxion_url('groups.php')) ?>">Alle Gruppen</a>
  </p>
  <?php if (!empty($group['description'])): ?>
    <p style="margin-top:0.75rem;"><?= nl2br(e($group['description'])) ?></p>
  <?php endif; ?>
  <div class="hero-actions">
    <?php if ($viewer && !$isMember): ?>
      <form method="post"><?= csrf_field() ?>
        <input type="hidden" name="action" value="join">
        <button class="btn" type="submit"><?= ($group['privacy'] ?? '') === 'private' ? 'Mitgliedschaft anfragen' : 'Beitreten' ?></button>
      </form>
    <?php elseif ($viewer && $isMember && (int)$group['owner_id'] !== (int)$viewer['id']): ?>
      <form method="post"><?= csrf_field() ?>
        <input type="hidden" name="action" value="leave">
        <button class="btn btn-ghost" type="submit">Verlassen</button>
      </form>
    <?php elseif (!$viewer): ?>
      <a class="btn" href="<?= e(allxion_url('login.php')) ?>">Anmelden</a>
    <?php endif; ?>
  </div>
</section>

<?php if ($isMember): ?>
<section class="panel">
  <h2>Beitrag schreiben</h2>
  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>
  <form method="post" class="form">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="post">
    <label>Text
      <textarea name="body" maxlength="4000" required rows="3" data-mention><?= e($_POST['body'] ?? '') ?></textarea>
    </label>
    <button class="btn" type="submit">Posten</button>
  </form>
</section>
<?php endif; ?>

<section class="feed">
  <?php if (!$posts): ?>
    <div class="empty"><p>Noch keine Gruppenbeiträge.</p></div>
  <?php else: ?>
    <?php foreach ($posts as $post): ?>
      <article class="post">
        <div class="post-meta">
          <a class="post-user" href="<?= e(user_public_url($post['username'])) ?>">@<?= e($post['username']) ?></a>
          <time><?= e($post['created_at']) ?></time>
        </div>
        <div class="post-body"><?= nl2br(e($post['body'])) ?></div>
      </article>
    <?php endforeach; ?>
  <?php endif; ?>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
