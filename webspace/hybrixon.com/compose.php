<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/posts.php';
require_once __DIR__ . '/includes/policy.php';

$user = allxion_require_login();
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $body = (string)($_POST['body'] ?? '');
    $isAdult = !empty($_POST['is_adult']);
    $policyOk = !empty($_POST['policy_ok']);
    $image = isset($_FILES['image']) && is_array($_FILES['image']) ? $_FILES['image'] : null;
    $result = allxion_create_post((int)$user['id'], $body, $isAdult, $policyOk, $image);
    $errors = $result['errors'];
    if (!$errors) {
        if (!empty($result['pending_review'])) {
            flash(
                'success',
                'Beitrag eingereicht. Soft-18+-Inhalt / Bild wird geprüft und erscheint erst nach Freigabe öffentlich.'
            );
        } else {
            flash('success', 'Beitrag veröffentlicht.');
        }
        redirect(allxion_url());
    }
    $user = allxion_current_user() ?? $user;
}

$canAdult = user_age_verified($user);
$pageTitle = 'Posten · Hybrixon';
$activeNav = 'compose';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1>Neuen Beitrag</h1>
  <p class="muted" style="margin-bottom:1rem;">
    Soft-18+ = sensible Inhalte inkl. Soft-Nacktheit (z. B. Brüste) —
    <strong>kein 18++ / Porno, keine Genitalien, keine Sexakte, keine Gewalt</strong>.
    Bilder nur als Soft-18+; automatische Bildprüfung + Admin-Freigabe (nicht sofort öffentlich).
    <a href="<?= e(allxion_url('rules.php')) ?>">Regeln</a>
  </p>

  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>

  <?php if (user_is_adult($user) && !$canAdult): ?>
    <div class="age-gate">
      <h2>Soft-18+ noch nicht freigeschaltet</h2>
      <p>Normale Beiträge gehen immer. Für Soft-18+ / Bilder bitte die Altersprüfung bestätigen.</p>
      <a class="btn btn-sm" href="<?= e(allxion_url('age-verify.php')) ?>">Altersprüfung öffnen</a>
    </div>
  <?php endif; ?>

  <form method="post" class="form" enctype="multipart/form-data">
    <?= csrf_field() ?>
    <label>Dein Text
      <textarea name="body" maxlength="4000" placeholder="Was gibt's Neues?"><?= e($_POST['body'] ?? '') ?></textarea>
    </label>

    <?php if ($canAdult): ?>
      <label class="check">
        <input type="checkbox" name="is_adult" value="1" data-adult-toggle <?= !empty($_POST['is_adult']) ? 'checked' : '' ?>>
        <span>Als <strong>Soft-18+</strong> markieren (nur freigeschaltete 18+)</span>
      </label>
      <div data-adult-hint hidden>
        <p class="hint">
          Soft ok (u. a. Brüste). Verboten: 18++ / Porno, Genitalien, Sexakte, Gewalt.
          Jedes Bild wird geprüft und erst nach Admin-OK öffentlich.
        </p>
        <label>Bild (optional, JPEG/PNG/WebP, max. 4&nbsp;MB)
          <input type="file" name="image" accept="image/jpeg,image/png,image/webp">
        </label>
        <label class="check">
          <input type="checkbox" name="policy_ok" value="1" data-policy-required <?= !empty($_POST['policy_ok']) ? 'checked' : '' ?>>
          <span>Ich halte die <a href="<?= e(allxion_url('rules.php')) ?>" target="_blank" rel="noopener">Inhaltsregeln</a> ein (kein 18++).</span>
        </label>
      </div>
    <?php elseif (!user_is_adult($user)): ?>
      <p class="muted">Soft-18+ / Bilder erst ab <?= ALLXION_ADULT_AGE ?> Jahren.</p>
    <?php endif; ?>

    <button class="btn btn-block" type="submit">Veröffentlichen</button>
  </form>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
