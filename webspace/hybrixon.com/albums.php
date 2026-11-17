<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/albums.php';
require_once __DIR__ . '/includes/social.php';

$viewer = allxion_current_user();
$username = trim((string)($_GET['u'] ?? ''));
if ($username === '') {
    if (!$viewer) {
        flash('error', 'Bitte anmelden oder ein Profil wählen.');
        redirect(allxion_url('login.php?next=' . rawurlencode(allxion_url('albums.php'))));
    }
    $username = (string)$viewer['username'];
}
$owner = social_find_user_by_username($username);
if (!$owner || !empty($owner['banned_at'])) {
    http_response_code(404);
    $pageTitle = 'Alben · Hybrixon';
    require __DIR__ . '/includes/header.php';
    echo '<section class="panel"><h1>Nutzer nicht gefunden</h1></section>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

$isSelf = $viewer && (int)$viewer['id'] === (int)$owner['id'];
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $isSelf) {
    verify_csrf();
    $action = (string)($_POST['action'] ?? '');
    if ($action === 'create') {
        $errors = albums_create(
            (int)$viewer['id'],
            (string)($_POST['title'] ?? ''),
            (string)($_POST['description'] ?? ''),
            (string)($_POST['privacy'] ?? 'friends')
        );
        if (!$errors) {
            flash('success', 'Album erstellt.');
            redirect(allxion_url('albums.php?u=' . rawurlencode($owner['username'])));
        }
    }
}

$albums = albums_for_user((int)$owner['id'], $viewer);
$pageTitle = 'Alben @' . $owner['username'] . ' · Hybrixon';
$activeNav = $isSelf ? 'albums' : '';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1>Fotoalben · @<?= e($owner['username']) ?></h1>
  <p class="muted"><a href="<?= e(user_public_url($owner['username'])) ?>">Zurück zum Profil</a></p>
</section>

<?php if ($isSelf): ?>
<section class="panel">
  <h2>Neues Album</h2>
  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>
  <form method="post" class="form">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="create">
    <label>Titel <input type="text" name="title" maxlength="80" required></label>
    <label>Beschreibung <textarea name="description" maxlength="500" rows="2"></textarea></label>
    <label>Sichtbarkeit
      <select name="privacy">
        <option value="public">Öffentlich</option>
        <option value="friends" selected>Freunde</option>
        <option value="followers">Follower</option>
        <option value="private">Nur ich</option>
      </select>
    </label>
    <button class="btn" type="submit">Album anlegen</button>
  </form>
</section>
<?php endif; ?>

<section class="feed">
  <?php if (!$albums): ?>
    <div class="empty"><p>Keine Alben sichtbar.</p></div>
  <?php else: ?>
    <?php foreach ($albums as $album): ?>
      <a class="post" href="<?= e(allxion_url('album.php?id=' . (int)$album['id'])) ?>" style="color:inherit;display:block;">
        <h2 style="margin:0 0 0.35rem;font-size:1.1rem;"><?= e($album['title']) ?></h2>
        <p class="muted"><?= e((string)($album['privacy'] ?? '')) ?> · <?= e((string)$album['created_at']) ?></p>
        <?php if (!empty($album['description'])): ?>
          <p style="margin-top:0.5rem;"><?= e($album['description']) ?></p>
        <?php endif; ?>
      </a>
    <?php endforeach; ?>
  <?php endif; ?>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
