<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/policy.php';

$user = allxion_require_login();
$errors = [];

if (user_is_admin($user)) {
    allxion_ensure_admin_age_verified($user);
    flash('info', 'Als Admin bist du automatisch für Soft-18+ freigeschaltet.');
    redirect(allxion_url());
}

if (!user_is_adult($user)) {
    flash('error', 'Altersprüfung erst ab ' . ALLXION_ADULT_AGE . ' Jahren möglich.');
    redirect(allxion_url());
}

if (user_age_verified($user)) {
    flash('info', 'Soft-18+ ist bereits freigeschaltet.');
    redirect(allxion_url());
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    if (empty($_POST['legal_ok'])) {
        $errors[] = 'Bitte die Hinweise akzeptieren.';
    } elseif (empty($_POST['policy_ok'])) {
        $errors[] = 'Bitte die Inhaltsregeln akzeptieren.';
    } else {
        $errors = allxion_request_age_verification(
            $user,
            (string)($_POST['password'] ?? ''),
            (string)($_POST['phrase'] ?? '')
        );
        if (!$errors) {
            flash('success', 'Antrag eingereicht. Freigabe erst nach Admin-Prüfung.');
            redirect(allxion_url('profile.php'));
        }
    }
}

$pending = user_age_pending($user);
$pageTitle = 'Soft-18+ · Hybrixon';
$activeNav = 'profile';
require __DIR__ . '/includes/header.php';
?>

<section class="age-gate">
  <h2>Soft-18+ freischalten</h2>
  <p>
    Freischaltung für sensible Community-Inhalte hinter dem Altersfilter.
    <strong>Kein Porno, keine Gewalt</strong> — siehe <a href="<?= e(allxion_url('rules.php')) ?>">Regeln</a>.
    Braucht Passwort, Bestätigungssatz und Admin-Freigabe. Keine Ausweiskopien.
  </p>

  <?php if ($pending): ?>
    <div class="flash flash-info" style="margin-bottom:1rem;">Dein Antrag wird geprüft. Soft-18+ bleibt bis zur Freigabe gesperrt.</div>
  <?php endif; ?>

  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>

  <?php if (!$pending): ?>
  <form method="post" class="form">
    <?= csrf_field() ?>

    <label>Passwort bestätigen
      <input type="password" name="password" required autocomplete="current-password">
    </label>

    <label>Bestätigungssatz (exakt abtippen)
      <input type="text" name="phrase" required autocomplete="off" spellcheck="false" placeholder="<?= e(AGE_CONFIRM_PHRASE) ?>">
      <span class="hint">Genau so: <strong><?= e(AGE_CONFIRM_PHRASE) ?></strong></span>
    </label>

    <label class="check">
      <input type="checkbox" name="legal_ok" value="1" required>
      <span>Ich bin mindestens <?= ALLXION_ADULT_AGE ?> Jahre alt. Falschangaben können zum Sperren führen.</span>
    </label>

    <label class="check">
      <input type="checkbox" name="policy_ok" value="1" required>
      <span>Ich akzeptiere Soft-18+ ohne Porno und ohne Gewalt (<a href="<?= e(allxion_url('rules.php')) ?>" target="_blank" rel="noopener">Regeln</a>).</span>
    </label>

    <button class="btn" type="submit">Antrag absenden</button>
    <a class="btn btn-ghost" href="<?= e(allxion_url()) ?>">Abbrechen</a>
  </form>
  <?php endif; ?>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
