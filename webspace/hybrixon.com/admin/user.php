<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/social.php';
require_once __DIR__ . '/../includes/posts.php';

$admin = allxion_require_admin();
$id = (int)($_GET['id'] ?? 0);
$stmt = allxion_db()->prepare('SELECT * FROM users WHERE id = ?');
$stmt->execute([$id]);
$target = $stmt->fetch();

if (!$target) {
    flash('error', 'Nutzer nicht gefunden.');
    redirect(allxion_url('admin/'));
}

$counts = social_counts((int)$target['id']);
$ips = social_ip_history((int)$target['id'], 40);
$posts = allxion_db()->prepare(
    "SELECT id, body, is_adult, post_type, created_at, moderation_status FROM posts WHERE user_id = ? ORDER BY id DESC LIMIT 20"
);
$posts->execute([(int)$target['id']]);
$userPosts = $posts->fetchAll();

$pageTitle = 'Admin · @' . $target['username'];
$activeNav = 'admin';
require __DIR__ . '/../includes/header.php';
?>

<section class="panel">
  <p class="muted"><a href="<?= e(allxion_url('admin/#admins')) ?>">← Nutzer</a></p>
  <h1>@<?= e($target['username']) ?></h1>
  <p class="muted">
    <?= e((string)($target['display_name'] ?? '')) ?> ·
    <a href="<?= e(user_public_url($target['username'])) ?>">Öffentliches Profil</a>
  </p>
  <div class="pill-row">
    <?php if (!empty($target['is_admin'])): ?><span class="pill pill-ok">Admin</span><?php endif; ?>
    <?php if (!empty($target['banned_at'])): ?><span class="pill" style="color:#fca5a5;">Gesperrt</span><?php endif; ?>
    <span class="pill"><?= (int)$counts['followers'] ?> Follower</span>
    <span class="pill"><?= (int)$counts['following'] ?> folgend</span>
  </div>
</section>

<section class="panel">
  <h2>Ort vs. IP</h2>
  <p>
    Angegeben:
    <?php if (!empty($target['postal_code']) || !empty($target['city'])): ?>
      <strong><?= e((string)$target['postal_code']) ?> <?= e((string)$target['city']) ?></strong>
    <?php else: ?>
      <span class="muted">keine PLZ/Ort</span>
    <?php endif; ?>
  </p>
  <p>
    Letzte IP:
    <strong><?= e((string)($target['last_ip'] ?? '—')) ?></strong>
    <?php if (!empty($target['last_ip_at'])): ?>
      <span class="muted">· <?= e($target['last_ip_at']) ?></span>
    <?php endif; ?>
  </p>
  <p class="muted" style="margin-top:0.5rem;">
    Hinweis: IP ≠ genauer Wohnort. Nur grober Abgleich (z. B. Land/Region über Whois extern).
  </p>
  <?php if ($ips): ?>
    <ul class="muted" style="list-style:none;margin-top:0.85rem;display:grid;gap:0.35rem;">
      <?php foreach ($ips as $row): ?>
        <li><code><?= e($row['ip']) ?></code> · <?= e($row['created_at'] ?? '') ?></li>
      <?php endforeach; ?>
    </ul>
  <?php endif; ?>
</section>

<section class="panel">
  <h2>Konto</h2>
  <p class="muted">E-Mail: <?= e($target['email']) ?></p>
  <p class="muted">Geburtsdatum: <?= e($target['birthdate']) ?> · Soft-18+: <?= e((string)$target['age_status']) ?></p>
  <p class="muted">Privatsphäre: Profil <?= e((string)$target['privacy_profile']) ?> · Posts <?= e((string)$target['privacy_posts']) ?> · DMs <?= e((string)$target['privacy_dms']) ?></p>
  <?php if (!empty($target['bio'])): ?>
    <p style="margin-top:0.75rem;"><?= nl2br(e($target['bio'])) ?></p>
  <?php endif; ?>
</section>

<section class="panel">
  <h2>Letzte Beiträge</h2>
  <?php if (!$userPosts): ?>
    <p class="muted">Keine.</p>
  <?php else: ?>
    <ul class="muted" style="list-style:none;display:grid;gap:0.45rem;">
      <?php foreach ($userPosts as $p): ?>
        <li>
          #<?= (int)$p['id'] ?> · <?= e($p['post_type']) ?> · <?= e($p['moderation_status']) ?>
          · <a href="<?= e(allxion_url('post.php?id=' . (int)$p['id'])) ?>">öffnen</a>
          <div><?= e(mb_substr((string)$p['body'], 0, 120)) ?></div>
        </li>
      <?php endforeach; ?>
    </ul>
  <?php endif; ?>
</section>

<?php require __DIR__ . '/../includes/footer.php'; ?>
