<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/groups.php';
require_once __DIR__ . '/includes/social.php';

$viewer = allxion_current_user();
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $viewer) {
    verify_csrf();
    $action = (string)($_POST['action'] ?? '');
    if ($action === 'create') {
        $errors = groups_create(
            (int)$viewer['id'],
            (string)($_POST['name'] ?? ''),
            (string)($_POST['description'] ?? ''),
            (string)($_POST['privacy'] ?? 'public')
        );
        if (!$errors) {
            flash('success', 'Gruppe erstellt.');
            redirect(allxion_url('groups.php'));
        }
    }
}

$list = groups_list($viewer);
$pageTitle = 'Gruppen · Hybrixon';
$activeNav = 'groups';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1>Gruppen</h1>
  <p class="muted">Communities für gemeinsame Themen — öffentlich oder eingeschränkt.</p>
</section>

<?php if ($viewer): ?>
<section class="panel">
  <h2>Gruppe erstellen</h2>
  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>
  <form method="post" class="form">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="create">
    <label>Name <input type="text" name="name" maxlength="80" required></label>
    <label>Beschreibung <textarea name="description" maxlength="1000" rows="3"></textarea></label>
    <label>Sichtbarkeit
      <select name="privacy">
        <option value="public">Öffentlich</option>
        <option value="friends">Freunde des Owners</option>
        <option value="private">Privat (Anfrage)</option>
      </select>
    </label>
    <button class="btn" type="submit">Erstellen</button>
  </form>
</section>
<?php else: ?>
<section class="panel">
  <p><a class="btn" href="<?= e(allxion_url('login.php')) ?>">Anmelden</a> um Gruppen zu erstellen.</p>
</section>
<?php endif; ?>

<section class="feed">
  <?php if (!$list): ?>
    <div class="empty"><p>Noch keine Gruppen.</p></div>
  <?php else: ?>
    <?php foreach ($list as $g): ?>
      <a class="post" href="<?= e(allxion_url('group.php?slug=' . rawurlencode($g['slug']))) ?>" style="color:inherit;display:block;">
        <h2 style="margin:0 0 0.35rem;font-size:1.15rem;"><?= e($g['name']) ?></h2>
        <p class="muted"><?= (int)$g['member_count'] ?> Mitglieder · @<?= e($g['owner_name']) ?> · <?= e($g['privacy']) ?></p>
        <?php if (!empty($g['description'])): ?>
          <p style="margin-top:0.5rem;"><?= e(mb_substr((string)$g['description'], 0, 160)) ?></p>
        <?php endif; ?>
      </a>
    <?php endforeach; ?>
  <?php endif; ?>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
