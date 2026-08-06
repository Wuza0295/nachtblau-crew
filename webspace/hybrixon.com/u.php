<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/profile.php';
require_once __DIR__ . '/includes/posts.php';
require_once __DIR__ . '/includes/dm.php';

$username = trim((string)($_GET['u'] ?? ''));
if ($username === '') {
    flash('error', 'Profil nicht gefunden.');
    redirect(allxion_url());
}

$profile = profile_find_by_username($username);
if (!$profile) {
    http_response_code(404);
    $pageTitle = 'Profil nicht gefunden · Hybrixon';
    require __DIR__ . '/includes/header.php';
    echo '<section class="panel"><h1>Profil nicht gefunden</h1></section>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

$viewer = allxion_current_user();
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $viewer) {
    verify_csrf();
    $action = (string)($_POST['action'] ?? '');
    if ($action === 'save_profile') {
        $errors = profile_update(
            $viewer,
            (int)$profile['id'],
            $_POST,
            isset($_FILES['avatar']) && is_array($_FILES['avatar']) ? $_FILES['avatar'] : null,
            isset($_FILES['banner']) && is_array($_FILES['banner']) ? $_FILES['banner'] : null
        );
        if (!$errors) {
            flash('success', 'Profil aktualisiert.');
            redirect(allxion_url('u.php?u=' . rawurlencode((string)$profile['username'])));
        }
        $profile = profile_find_by_id((int)$profile['id']) ?? $profile;
    }
}

$payload = profile_public_payload($profile, $viewer);
$posts = allxion_db()->prepare(
    "SELECT p.*, u.username, u.display_name,
       (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.kind = 'like') AS like_count
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = ?
       AND p.moderation_status = 'ok'
     ORDER BY p.created_at DESC
     LIMIT 30"
);
$posts->execute([(int)$profile['id']]);
$userPosts = $posts->fetchAll();

$pageTitle = $payload['displayName'] . ' · Hybrixon';
$activeNav = 'profile';
require __DIR__ . '/includes/header.php';
?>

<section class="profile-hero">
  <div class="profile-banner"<?= $payload['bannerUrl'] ? ' style="background-image:url(' . e($payload['bannerUrl']) . ')"' : '' ?>></div>
  <div class="profile-hero-main">
    <div class="profile-avatar-wrap">
      <?php if ($payload['avatarUrl']): ?>
        <img class="profile-avatar" src="<?= e($payload['avatarUrl']) ?>" alt="">
      <?php else: ?>
        <div class="profile-avatar profile-avatar-fallback"><?= e(mb_strtoupper(mb_substr($payload['displayName'], 0, 1))) ?></div>
      <?php endif; ?>
    </div>
    <div class="profile-hero-text">
      <h1><?= e($payload['displayName']) ?></h1>
      <p class="muted">@<?= e($payload['username']) ?><?= $payload['isBrand'] ? ' · Offizielles Profil' : '' ?></p>
      <?php if ($payload['bio'] !== ''): ?>
        <p class="profile-bio"><?= nl2br(e($payload['bio'])) ?></p>
      <?php endif; ?>
      <div class="profile-meta">
        <?php if ($payload['location'] !== ''): ?><span><?= e($payload['location']) ?></span><?php endif; ?>
        <?php if ($payload['website'] !== ''): ?><a href="<?= e($payload['website']) ?>" target="_blank" rel="noopener">Website</a><?php endif; ?>
        <?php if ($payload['instagram'] !== ''): ?><a href="https://instagram.com/<?= e(ltrim($payload['instagram'], '@/')) ?>" target="_blank" rel="noopener">Instagram</a><?php endif; ?>
        <?php if ($payload['facebook'] !== ''): ?><a href="https://facebook.com/<?= e(ltrim($payload['facebook'], '@/')) ?>" target="_blank" rel="noopener">Facebook</a><?php endif; ?>
        <?php if ($payload['tiktok'] !== ''): ?><a href="https://tiktok.com/@<?= e(ltrim($payload['tiktok'], '@/')) ?>" target="_blank" rel="noopener">TikTok</a><?php endif; ?>
        <?php if ($payload['x'] !== ''): ?><a href="https://x.com/<?= e(ltrim($payload['x'], '@/')) ?>" target="_blank" rel="noopener">X</a><?php endif; ?>
      </div>
      <div class="hero-actions" style="margin-top:0.85rem;">
        <?php
          $canDm = $viewer
            && (int)$viewer['id'] !== (int)$profile['id']
            && dm_user_eligible($viewer)
            && dm_user_eligible($profile);
          if ($canDm):
            $dmOpen = dm_open_with_username($viewer, (string)$profile['username']);
        ?>
          <?php if ($dmOpen['ok']): ?>
            <a class="btn btn-sm" href="<?= e($dmOpen['url']) ?>">Nachricht schreiben</a>
          <?php endif; ?>
        <?php elseif ($viewer && (int)$viewer['id'] !== (int)$profile['id'] && !dm_user_eligible($viewer)): ?>
          <span class="muted">PN ab <?= (int)DM_MIN_AGE ?> Jahren</span>
        <?php elseif (!$viewer): ?>
          <a class="btn btn-sm btn-ghost" href="<?= e(allxion_url('login.php?next=' . rawurlencode(allxion_url('u.php?u=' . (string)$profile['username'])))) ?>">Anmelden für PN</a>
        <?php endif; ?>
      </div>
    </div>
  </div>
</section>

<?php if ($payload['canEdit']): ?>
<section class="panel">
  <h2>Profil bearbeiten</h2>
  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>
  <form method="post" class="form" enctype="multipart/form-data">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="save_profile">
    <label>Anzeigename
      <input type="text" name="display_name" maxlength="48" value="<?= e((string)($profile['display_name'] ?? '')) ?>" placeholder="Hybrixon Team">
    </label>
    <label>Bio
      <textarea name="bio" maxlength="500" rows="4" placeholder="Kurz über dich / die Marke"><?= e((string)($profile['bio'] ?? '')) ?></textarea>
    </label>
    <label>Ort
      <input type="text" name="location" maxlength="80" value="<?= e((string)($profile['location'] ?? '')) ?>">
    </label>
    <label>Website
      <input type="url" name="website" maxlength="240" value="<?= e((string)($profile['website'] ?? '')) ?>" placeholder="https://…">
    </label>
    <label>Instagram
      <input type="text" name="instagram" maxlength="120" value="<?= e((string)($profile['link_instagram'] ?? '')) ?>" placeholder="@handle oder URL">
    </label>
    <label>Facebook
      <input type="text" name="facebook" maxlength="120" value="<?= e((string)($profile['link_facebook'] ?? '')) ?>">
    </label>
    <label>TikTok
      <input type="text" name="tiktok" maxlength="120" value="<?= e((string)($profile['link_tiktok'] ?? '')) ?>">
    </label>
    <label>X / Twitter
      <input type="text" name="x" maxlength="120" value="<?= e((string)($profile['link_x'] ?? '')) ?>">
    </label>
    <label>Profilbild (JPEG/PNG/WebP, max. 2&nbsp;MB)
      <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp">
    </label>
    <label class="check"><input type="checkbox" name="remove_avatar" value="1"> Profilbild entfernen</label>
    <label>Banner (JPEG/PNG/WebP, max. 4&nbsp;MB)
      <input type="file" name="banner" accept="image/jpeg,image/png,image/webp">
    </label>
    <label class="check"><input type="checkbox" name="remove_banner" value="1"> Banner entfernen</label>
    <button class="btn" type="submit">Speichern</button>
  </form>
</section>
<?php endif; ?>

<section class="feed">
  <h2 class="pad-sm" style="margin:0 0 0.75rem;font-size:1.05rem;">Beiträge</h2>
  <?php if (!$userPosts): ?>
    <p class="muted">Noch keine öffentlichen Beiträge.</p>
  <?php else: ?>
    <?php foreach ($userPosts as $post): ?>
      <article class="post<?= !empty($post['is_adult']) ? ' post-adult' : '' ?>">
        <div class="post-meta">
          <span><?= e(time_ago((string)$post['created_at'])) ?></span>
          <?php if (!empty($post['is_adult'])): ?><span class="badge-18">Soft-18+</span><?php endif; ?>
        </div>
        <?php if (trim((string)$post['body']) !== ''): ?>
          <div class="post-body"><?= nl2br(e($post['body'])) ?></div>
        <?php endif; ?>
        <?php if (!empty($post['image_path'])): ?>
          <figure class="post-image">
            <img src="<?= e(allxion_url('media.php?id=' . (int)$post['id'])) ?>" alt="" loading="lazy">
          </figure>
        <?php endif; ?>
      </article>
    <?php endforeach; ?>
  <?php endif; ?>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
