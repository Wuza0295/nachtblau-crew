<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/posts.php';

$user = allxion_require_login();
$id = (int)($_GET['id'] ?? 0);
$stmt = allxion_db()->prepare('SELECT * FROM posts WHERE id = ?');
$stmt->execute([$id]);
$post = $stmt->fetch();
if (!$post || ((int)$post['user_id'] !== (int)$user['id'] && !user_is_admin($user))) {
    flash('error', 'Beitrag nicht gefunden.');
    redirect(allxion_url());
}

$errors = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $errors = allxion_update_post($user, $id, (string)($_POST['body'] ?? ''));
    if (!$errors) {
        flash('success', 'Beitrag aktualisiert.');
        redirect(allxion_url('post.php?id=' . $id));
    }
}

$pageTitle = 'Beitrag bearbeiten · Hybrixon';
require __DIR__ . '/includes/header.php';
?>
<section class="panel">
  <h1>Beitrag bearbeiten</h1>
  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>
  <form method="post" class="form">
    <?= csrf_field() ?>
    <label>Text
      <textarea name="body" maxlength="4000" rows="6" required data-mention><?= e((string)($_POST['body'] ?? $post['body'])) ?></textarea>
    </label>
    <button class="btn" type="submit">Speichern</button>
    <a class="btn btn-ghost" href="<?= e(allxion_url('post.php?id=' . $id)) ?>">Abbrechen</a>
  </form>
</section>
<?php require __DIR__ . '/includes/footer.php'; ?>
