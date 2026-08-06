<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/posts.php';
require_once __DIR__ . '/includes/moderation.php';
require_once __DIR__ . '/includes/dm.php';

$user = allxion_current_user();
$canSeeAdult = $user && user_age_verified($user);
// Soft-18+ is included automatically once age-verified — no loud toggle bar.
$showAdult = $canSeeAdult && (($_GET['adult'] ?? '1') !== '0');

if (isset($_GET['like']) && $user) {
    allxion_toggle_like((int)$user['id'], (int)$_GET['like']);
    redirect(allxion_url());
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $user) {
    verify_csrf();
    $action = (string)($_POST['action'] ?? '');
    if ($action === 'report_post') {
        $errors = content_user_report_post(
            $user,
            (int)($_POST['post_id'] ?? 0),
            (string)($_POST['reason'] ?? '')
        );
        if ($errors) {
            flash('error', $errors[0]);
        } else {
            flash('success', 'Beitrag gemeldet — Admins prüfen.');
        }
        redirect(allxion_url());
    }
}

$posts = allxion_feed($user, $showAdult);
$pageTitle = 'Hybrixon · Feed';
$activeNav = 'feed';
require __DIR__ . '/includes/header.php';
?>

<section class="hero">
  <h1>Hybrixon</h1>
  <p><?= e(ALLXION_TAGLINE) ?></p>
  <div class="hero-actions">
    <?php if ($user): ?>
      <a class="btn" href="<?= e(allxion_url('compose.php')) ?>">Neuen Beitrag schreiben</a>
    <?php else: ?>
      <a class="btn" href="<?= e(allxion_url('register.php')) ?>">Registrieren</a>
      <a class="btn btn-ghost" href="<?= e(allxion_url('login.php')) ?>">Anmelden</a>
    <?php endif; ?>
  </div>
</section>

<?php if ($user && user_is_adult($user) && !user_age_verified($user)): ?>
  <section class="age-gate">
    <h2>Soft-18+ freischalten</h2>
    <?php if (user_age_pending($user)): ?>
      <p>Dein Antrag wird vom Admin geprüft. Soft-18+ bleibt bis zur Freigabe gesperrt.</p>
    <?php else: ?>
      <p>Für Soft-18+: Gesichtsprüfung (wenn aktiv) oder Soft-Antrag mit Admin-Freigabe. 18++ / Porno und Gewalt sind verboten.</p>
      <a class="btn btn-sm" href="<?= e(allxion_url('age-verify.php')) ?>">Altersprüfung starten</a>
    <?php endif; ?>
  </section>
<?php endif; ?>

<section class="feed">
  <?php if (!$posts): ?>
    <div class="empty">
      <p>Noch keine Beiträge.</p>
      <?php if ($user): ?>
        <p style="margin-top:0.75rem"><a class="btn btn-sm" href="<?= e(allxion_url('compose.php')) ?>">Ersten Post schreiben</a></p>
      <?php endif; ?>
    </div>
  <?php else: ?>
    <?php foreach ($posts as $post): ?>
      <article class="post<?= !empty($post['is_adult']) ? ' post-adult' : '' ?>">
        <div class="post-meta">
          <div class="post-author-line">
            <details class="author-menu">
              <summary class="author-menu-trigger">
                <?= e(trim((string)($post['display_name'] ?? '')) !== '' ? (string)$post['display_name'] : '@' . $post['username']) ?>
              </summary>
              <div class="author-menu-panel" role="menu">
                <a href="<?= e(allxion_url('u.php?u=' . rawurlencode((string)$post['username']))) ?>">Profil ansehen</a>
                <?php if ($user && (int)$user['id'] !== (int)$post['user_id'] && dm_user_eligible($user)): ?>
                  <a href="<?= e(allxion_url('messages.php?to=' . rawurlencode((string)$post['username']))) ?>">Nachricht schreiben</a>
                <?php elseif ($user && (int)$user['id'] !== (int)$post['user_id']): ?>
                  <span class="muted">PN ab <?= (int)DM_MIN_AGE ?> Jahren</span>
                <?php elseif (!$user): ?>
                  <a href="<?= e(allxion_url('login.php')) ?>">Anmelden für PN</a>
                <?php endif; ?>
              </div>
            </details>
            <?php if (trim((string)($post['display_name'] ?? '')) !== ''): ?>
              <span class="muted"> @<?= e($post['username']) ?></span>
            <?php endif; ?>
            <span> · <?= e(time_ago($post['created_at'])) ?></span>
            <?php if (!empty($post['is_adult'])): ?>
              <span class="badge-18" title="Soft-18+ · sensible Inhalte">Soft-18+</span>
            <?php endif; ?>
            <?php if (($post['moderation_status'] ?? '') === 'flagged'): ?>
              <span class="badge-18" title="Wartet auf Admin-Freigabe" style="opacity:.85;">Prüfung</span>
            <?php endif; ?>
          </div>
        </div>
        <?php if (trim((string)$post['body']) !== ''): ?>
          <div class="post-body"><?= nl2br(e($post['body'])) ?></div>
        <?php endif; ?>
        <?php if (!empty($post['image_path']) && allxion_can_view_post_image($post, $user)): ?>
          <figure class="post-image">
            <img src="<?= e(allxion_url('media.php?id=' . (int)$post['id'])) ?>" alt="Soft-18+ Bild" loading="lazy">
          </figure>
        <?php elseif (!empty($post['image_path'])): ?>
          <p class="muted" style="margin-top:0.5rem;">Bild wird geprüft und ist noch nicht öffentlich.</p>
        <?php endif; ?>
        <div class="post-actions">
          <?php if ($user): ?>
            <a class="btn btn-sm btn-ghost" href="<?= e(allxion_url('?like=' . (int)$post['id'])) ?>">♥ <?= (int)$post['like_count'] ?></a>
            <?php if ((int)$post['user_id'] !== (int)$user['id']): ?>
            <details class="report-details">
              <summary class="btn btn-sm btn-ghost">Melden</summary>
              <form method="post" class="form" style="margin-top:0.65rem;">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="report_post">
                <input type="hidden" name="post_id" value="<?= (int)$post['id'] ?>">
                <label>Grund
                  <textarea name="reason" required maxlength="500" rows="2" placeholder="Was verstößt gegen die Regeln?"></textarea>
                </label>
                <button class="btn btn-sm btn-danger" type="submit">Meldung absenden</button>
              </form>
            </details>
            <?php endif; ?>
          <?php else: ?>
            <span class="muted">♥ <?= (int)$post['like_count'] ?></span>
          <?php endif; ?>
        </div>
      </article>
    <?php endforeach; ?>
  <?php endif; ?>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
