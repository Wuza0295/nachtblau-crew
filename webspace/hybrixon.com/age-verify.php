<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/policy.php';
require_once __DIR__ . '/includes/yoti.php';

$allowCamera = true;
$user = allxion_require_login();
$errors = [];
$yotiEnabled = yoti_is_enabled();

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
    $mode = (string)($_POST['mode'] ?? 'soft');

    if ($mode === 'yoti') {
        if (!$yotiEnabled) {
            $errors[] = 'Gesichtsprüfung ist derzeit nicht aktiv (' . yoti_status_label() . ').';
        } elseif (empty($_POST['legal_ok']) || empty($_POST['policy_ok'])) {
            $errors[] = 'Bitte Hinweise und Inhaltsregeln akzeptieren.';
        } else {
            $session = yoti_create_age_session($user);
            if (!$session['ok']) {
                $errors[] = $session['error'];
            } else {
                redirect($session['redirect']);
            }
        }
    } else {
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
  </p>

  <?php if ($pending && ($user['age_provider'] ?? '') !== 'yoti'): ?>
    <div class="flash flash-info" style="margin-bottom:1rem;">Dein Soft-Antrag wird geprüft. Soft-18+ bleibt bis zur Freigabe gesperrt.</div>
  <?php endif; ?>

  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>

  <?php if ($yotiEnabled): ?>
    <div class="panel" style="margin:1rem 0;">
      <h3 style="margin-bottom:0.4rem;">1. Gesichtsprüfung (empfohlen)</h3>
      <p class="muted" style="margin-bottom:0.75rem;">
        Yoti schätzt dein Alter anhand eines Selfies (mit Liveness).
        Es gilt ein Sicherheits-Puffer über <?= ALLXION_ADULT_AGE ?> Jahre.
        Kein Ausweis nötig. Kamera-Zugriff nur für diesen Schritt.
      </p>
      <form method="post" class="form">
        <?= csrf_field() ?>
        <input type="hidden" name="mode" value="yoti">
        <label class="check">
          <input type="checkbox" name="legal_ok" value="1" required>
          <span>Ich bin mindestens <?= ALLXION_ADULT_AGE ?> Jahre alt und willige in die Gesichtsprüfung ein.</span>
        </label>
        <label class="check">
          <input type="checkbox" name="policy_ok" value="1" required>
          <span>Ich akzeptiere Soft-18+ ohne Porno und ohne Gewalt (<a href="<?= e(allxion_url('rules.php')) ?>" target="_blank" rel="noopener">Regeln</a>).</span>
        </label>
        <button class="btn" type="submit">Gesichtsprüfung starten</button>
      </form>
    </div>
  <?php else: ?>
    <div class="flash flash-info" style="margin-bottom:1rem;">
      Gesichtsprüfung (Yoti) ist noch nicht aktiv — Status: <?= e(yoti_status_label()) ?>.
      Soft-Antrag mit Admin-Freigabe bleibt verfügbar.
    </div>
  <?php endif; ?>

  <?php if (!$pending): ?>
  <div class="panel" style="margin:1rem 0;">
    <h3 style="margin-bottom:0.4rem;"><?= $yotiEnabled ? '2. Soft-Antrag (Fallback)' : 'Soft-Antrag' ?></h3>
    <p class="muted" style="margin-bottom:0.75rem;">
      Passwort, Bestätigungssatz und manuelle Admin-Freigabe. Keine Ausweiskopien.
    </p>
    <form method="post" class="form">
      <?= csrf_field() ?>
      <input type="hidden" name="mode" value="soft">

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

      <button class="btn btn-ghost" type="submit">Antrag absenden</button>
      <a class="btn btn-ghost" href="<?= e(allxion_url()) ?>">Abbrechen</a>
    </form>
  </div>
  <?php elseif ($yotiEnabled): ?>
    <p class="muted">Solange der Soft-Antrag offen ist, kannst du trotzdem die Gesichtsprüfung oben nutzen — bei Erfolg wird sofort freigeschaltet.</p>
  <?php endif; ?>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
