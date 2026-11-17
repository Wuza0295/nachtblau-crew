<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/albums.php';
require_once __DIR__ . '/includes/social.php';
require_once __DIR__ . '/includes/media_upload.php';

$viewer = allxion_current_user();
$albumId = (int)($_GET['id'] ?? 0);
$stmt = allxion_db()->prepare('SELECT * FROM albums WHERE id = ?');
$stmt->execute([$albumId]);
$album = $stmt->fetch();
if (!$album) {
    http_response_code(404);
    $pageTitle = 'Album · Hybrixon';
    require __DIR__ . '/includes/header.php';
    echo '<section class="panel"><h1>Album nicht gefunden</h1></section>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

$ownerStmt = allxion_db()->prepare('SELECT * FROM users WHERE id = ?');
$ownerStmt->execute([(int)$album['user_id']]);
$owner = $ownerStmt->fetch();
if (!$owner || !albums_can_view($viewer, $album, $owner)) {
    http_response_code(403);
    $pageTitle = 'Album · Hybrixon';
    require __DIR__ . '/includes/header.php';
    echo '<section class="panel"><p class="muted">Kein Zugriff auf dieses Album.</p></section>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

$isSelf = $viewer && (int)$viewer['id'] === (int)$owner['id'];
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $isSelf) {
    verify_csrf();
    $files = media_normalize_files($_FILES['photos'] ?? []);
    $shareAsPost = !empty($_POST['share_as_post']);
    $errors = albums_add_photos($albumId, (int)$viewer['id'], $files, $shareAsPost);
    if (!$errors) {
        flash('success', $shareAsPost ? 'Fotos hinzugefügt und Beitrag erstellt.' : 'Fotos hinzugefügt.');
        redirect(allxion_url('album.php?id=' . $albumId));
    }
}

$photos = albums_photos($albumId);
$pageTitle = $album['title'] . ' · Hybrixon';
$activeNav = $isSelf ? 'albums' : '';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1><?= e($album['title']) ?></h1>
  <p class="muted">von <a href="<?= e(user_public_url($owner['username'])) ?>">@<?= e($owner['username']) ?></a>
    · <a href="<?= e(allxion_url('albums.php?u=' . rawurlencode($owner['username']))) ?>">Alle Alben</a>
  </p>
  <?php if (!empty($album['description'])): ?>
    <p style="margin-top:0.75rem;"><?= nl2br(e($album['description'])) ?></p>
  <?php endif; ?>
</section>

<?php if ($isSelf): ?>
<section class="panel">
  <h2>Fotos hochladen</h2>
  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>
  <form method="post" class="form" enctype="multipart/form-data">
    <?= csrf_field() ?>
    <label>Bilder (max. <?= (int)MEDIA_POST_IMAGES_MAX ?>)
      <input type="file" name="photos[]" accept="image/jpeg,image/png,image/webp" multiple required data-share-toggle="share-album-post">
    </label>
    <label class="pref-check" id="share-album-post" hidden>
      <input type="checkbox" name="share_as_post" value="1">
      <span>Als Beitrag im Feed posten?</span>
    </label>
    <button class="btn" type="submit">Hochladen</button>
  </form>
</section>
<?php endif; ?>

<section class="media-grid media-grid-multi" style="margin-bottom:2rem;">
  <?php if (!$photos): ?>
    <div class="empty" style="grid-column:1/-1;"><p>Noch keine Fotos.</p></div>
  <?php else: ?>
    <?php foreach ($photos as $ph): ?>
      <div class="post-image">
        <img src="<?= e(allxion_url('media.php?album_photo=' . (int)$ph['id'])) ?>" alt="">
      </div>
    <?php endforeach; ?>
  <?php endif; ?>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
