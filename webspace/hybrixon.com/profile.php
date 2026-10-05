<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/posts.php';
require_once __DIR__ . '/includes/legal.php';

$user = allxion_require_login();
$age = age_from_birthdate((string)$user['birthdate']);
$verified = user_age_verified($user);
$pending = user_age_pending($user);
$status = (string)($user['age_status'] ?? 'none');
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'delete_account') {
    verify_csrf();
    $errors = allxion_delete_account($user, (string)($_POST['password'] ?? ''));
    if (!$errors) {
        flash('success', 'Konto und zugehörige Daten wurden gelöscht.');
        redirect(allxion_url());
    }
}

$pageTitle = 'Profil · Hybrixon';
$activeNav = 'profile';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1>@<?= e($user['username']) ?></h1>
  <p class="muted">Mitglied seit <?= e((new DateTimeImmutable($user['created_at']))->format('d.m.Y')) ?></p>

  <div class="pill-row">
    <span class="pill">Alter (Konto): <?= $age !== null ? (int)$age : '?' ?></span>
    <?php if (user_is_admin($user)): ?>
      <span class="pill pill-ok">Admin</span>
    <?php endif; ?>
    <?php if ($verified): ?>
      <span class="pill pill-adult">Soft-18+ freigeschaltet</span>
    <?php elseif ($pending): ?>
      <span class="pill">Soft-18+ in Prüfung</span>
    <?php elseif ($status === 'rejected'): ?>
      <span class="pill">Soft-18+ abgelehnt</span>
    <?php elseif (user_is_adult($user)): ?>
      <span class="pill">Soft-18+ nicht freigeschaltet</span>
    <?php else: ?>
      <span class="pill">Kein Soft-18+-Zugang</span>
    <?php endif; ?>
  </div>

  <?php if ($status === 'rejected' && !empty($user['age_review_note'])): ?>
    <p class="muted" style="margin-top:0.75rem;">Ablehnung: <?= e($user['age_review_note']) ?></p>
  <?php endif; ?>

  <div class="hero-actions">
    <a class="btn" href="<?= e(allxion_url('compose.php')) ?>">Beitrag schreiben</a>
    <a class="btn btn-ghost" href="<?= e(allxion_url('messages.php')) ?>">Nachrichten</a>
    <?php if (user_is_adult($user) && !$verified): ?>
      <a class="btn btn-ghost" href="<?= e(allxion_url('age-verify.php')) ?>">Soft-18+ freischalten</a>
    <?php endif; ?>
    <a class="btn btn-ghost" href="<?= e(allxion_url('rules.php')) ?>">Regeln</a>
    <a class="btn btn-ghost" href="<?= e(allxion_url('privacy.php')) ?>">Datenschutz</a>
    <?php if (user_is_admin($user)): ?>
      <a class="btn btn-ghost" href="<?= e(allxion_url('admin/')) ?>">Admin-Panel</a>
    <?php endif; ?>
    <a class="btn btn-ghost" href="<?= e(allxion_url('logout.php')) ?>">Logout</a>
  </div>
</section>

<section class="panel">
  <h2>Konto löschen</h2>
  <p class="muted" style="margin-bottom:0.75rem;">
    Löscht dauerhaft dein Konto, Beiträge, Reaktionen und DM-Teilnahmen (soweit technisch verknüpft).
    Das kann nicht rückgängig gemacht werden.
  </p>
  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>
  <form method="post" class="form" onsubmit="return confirm('Konto wirklich unwiderruflich löschen?');">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="delete_account">
    <label>Passwort zur Bestätigung
      <input type="password" name="password" required autocomplete="current-password">
    </label>
    <button class="btn btn-danger" type="submit">Konto endgültig löschen</button>
  </form>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
