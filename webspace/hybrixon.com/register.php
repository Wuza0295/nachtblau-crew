<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/legal.php';

if (allxion_current_user()) {
    redirect(allxion_url());
}

$errors = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $errors = allxion_register(
        (string)($_POST['username'] ?? ''),
        (string)($_POST['email'] ?? ''),
        (string)($_POST['password'] ?? ''),
        (string)($_POST['birthdate'] ?? ''),
        !empty($_POST['terms_ok']),
        !empty($_POST['privacy_ok']),
        (string)($_POST['theme'] ?? 'light'),
        (string)($_POST['postal_code'] ?? ''),
        (string)($_POST['city'] ?? '')
    );
    if (!$errors) {
        flash('success', 'Konto erstellt. Du kannst jetzt posten.');
        redirect(allxion_url());
    }
}

$pageTitle = 'Registrieren · Hybrixon';
$activeNav = 'register';
require __DIR__ . '/includes/header.php';
$regTheme = (string)($_POST['theme'] ?? hybrixon_active_theme(null));
if (!in_array($regTheme, ['light', 'dark'], true)) {
    $regTheme = 'light';
}
?>

<section class="panel">
  <h1>Registrieren</h1>
  <p class="muted" style="margin-bottom:1rem;">
    Ab <?= ALLXION_MIN_REGISTER_AGE ?> Jahren. Soft-18+ (ohne Porno/Gewalt) zusätzlich ab <?= ALLXION_ADULT_AGE ?> mit Altersprüfung.
    <a href="<?= e(allxion_url('rules.php')) ?>">Regeln</a> ·
    <a href="<?= e(allxion_url('terms.php')) ?>">Nutzungsbedingungen</a> ·
    <a href="<?= e(allxion_url('privacy.php')) ?>">Datenschutz</a>
  </p>
  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>
  <form method="post" class="form">
    <?= csrf_field() ?>
    <label>Benutzername
      <input type="text" name="username" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_]+" autocomplete="username" value="<?= e($_POST['username'] ?? '') ?>">
      <span class="hint">3–24 Zeichen, a–z, 0–9, _</span>
    </label>
    <label>E-Mail
      <input type="email" name="email" required autocomplete="email" value="<?= e($_POST['email'] ?? '') ?>">
    </label>
    <label>Passwort
      <input type="password" name="password" required minlength="8" autocomplete="new-password">
      <span class="hint">Mindestens 8 Zeichen</span>
    </label>
    <label>Geburtsdatum
      <input type="date" name="birthdate" required value="<?= e($_POST['birthdate'] ?? '') ?>">
      <span class="hint">Für Altersprüfung (nicht öffentlich). Soft-18+/DMs ab <?= ALLXION_ADULT_AGE ?>.</span>
    </label>

    <?php
      $plzValue = (string)($_POST['postal_code'] ?? '');
      $cityValue = (string)($_POST['city'] ?? '');
      $required = true;
      require __DIR__ . '/includes/partials/location-fields.php';
    ?>

    <label>Darstellung
      <select name="theme">
        <option value="light" <?= $regTheme === 'light' ? 'selected' : '' ?>>Light Mode</option>
        <option value="dark" <?= $regTheme === 'dark' ? 'selected' : '' ?>>Dark Mode</option>
      </select>
      <span class="hint">Vor dem Login ist Light Standard; nach dem Login gilt deine Auswahl.</span>
    </label>

    <label class="check">
      <input type="checkbox" name="terms_ok" value="1" required <?= !empty($_POST['terms_ok']) ? 'checked' : '' ?>>
      <span>Ich akzeptiere die <a href="<?= e(allxion_url('terms.php')) ?>" target="_blank" rel="noopener">Nutzungsbedingungen</a> und <a href="<?= e(allxion_url('rules.php')) ?>" target="_blank" rel="noopener">Inhaltsregeln</a> (kein Porno, keine Gewalt; Admins können DMs lesen).</span>
    </label>
    <label class="check">
      <input type="checkbox" name="privacy_ok" value="1" required <?= !empty($_POST['privacy_ok']) ? 'checked' : '' ?>>
      <span>Ich habe die <a href="<?= e(allxion_url('privacy.php')) ?>" target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen und stimme der Verarbeitung zu.</span>
    </label>
    <button class="btn btn-block" type="submit">Konto erstellen</button>
  </form>
  <p class="muted center" style="margin-top:1rem;">Bereits Mitglied? <a href="<?= e(allxion_url('login.php')) ?>">Anmelden</a></p>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
