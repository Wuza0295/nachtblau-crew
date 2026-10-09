<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/legal.php';
require_once __DIR__ . '/includes/policy.php';

$noIndex = true;
$pageTitle = 'Nutzungsbedingungen · Hybrixon';
$activeNav = '';
$pageDescription = 'Nutzungsbedingungen Hybrixon';
require __DIR__ . '/includes/header.php';
?>

<section class="panel legal-doc">
  <h1>Nutzungsbedingungen</h1>
  <p class="muted">Stand: <?= e(LEGAL_STAND) ?> · Version: <?= e(LEGAL_DOCS_VERSION) ?></p>

  <h2>1. Geltungsbereich</h2>
  <p>
    Diese Bedingungen gelten für die Nutzung von <strong>Hybrixon</strong>
    (Anbieter siehe <a href="<?= e(allxion_url('impressum.php')) ?>">Impressum</a>).
    Mit Registrierung und Nutzung akzeptierst du sie.
  </p>

  <h2>2. Mindestalter</h2>
  <p>
    Registrierung ab <?= (int)ALLXION_MIN_REGISTER_AGE ?> Jahren.
    Soft-18+-Inhalte und Direktnachrichten erst ab <?= (int)ALLXION_ADULT_AGE ?> Jahren
    (Geburtsdatum im Konto). Falsche Altersangaben können zur Sperrung führen.
  </p>

  <h2>3. Konto</h2>
  <p>
    Du bist für Zugangsdaten und Aktivitäten unter deinem Konto verantwortlich.
    Ein Konto pro Person; kein Missbrauch fremder Konten.
    <strong>Der Ort ist Pflicht</strong>; die PLZ ist optional und muss zutreffend sein, wenn angegeben.
    Falschangaben können geprüft und mit Einschränkungen oder Sperrung geahndet werden.
  </p>

  <h2>4. Erlaubte / verbotene Inhalte</h2>
  <p><?= e(content_policy_summary()) ?></p>
  <p><strong>Verboten u. a.:</strong></p>
  <ul class="legal-list">
    <?php foreach (CONTENT_POLICY_FORBIDDEN as $item): ?>
      <li><?= e($item) ?></li>
    <?php endforeach; ?>
  </ul>
  <p>Details: <a href="<?= e(allxion_url('rules.php')) ?>">Inhaltsregeln</a>.</p>

  <h2>5. Soft-18+</h2>
  <p>
    Soft-18+ umfasst sensible Community-Inhalte inkl. Soft-Nacktheit (z. B. Brüste)
    hinter Altersfreischaltung — <strong>kein</strong> 18++ / keine Pornografie,
    keine Genitalien, keine Sexakte, keine Gewalt. Soft-18+-Bilder werden
    automatisch geprüft und Admins gemeldet. Freischaltung über Selbstauskunft +
    Admin-Prüfung (kein AVS, keine Ausweiskopien).
  </p>

  <h2>6. Direktnachrichten</h2>
  <ul class="legal-list">
    <?php foreach (CONTENT_POLICY_DM as $item): ?>
      <li><?= e($item) ?></li>
    <?php endforeach; ?>
  </ul>
  <p>
    Du willigst ein, dass Plattform-Admins DMs zur Regel-Durchsetzung lesen dürfen.
    DMs sind nicht E2E-verschlüsselt.
  </p>

  <h2>7. Moderation</h2>
  <p>
    Wir können Inhalte löschen, Konten einschränken oder sperren bei Verstößen,
    rechtlichen Risiken oder Missbrauch — auch ohne Vorankündigung bei schweren Fällen.
    Melde- und Block-Funktionen sind zu nutzen.
  </p>

  <h2>8. Keine Garantie</h2>
  <p>
    Der Dienst wird „wie besehen“ als Hobbyprojekt betrieben. Keine Garantie auf
    ununterbrochene Verfügbarkeit. Keine Haftung für Nutzerinhalte Dritter, soweit gesetzlich zulässig.
  </p>

  <h2>9. Datenschutz</h2>
  <p>Es gilt die <a href="<?= e(allxion_url('privacy.php')) ?>">Datenschutzerklärung</a>.</p>

  <h2>10. Änderungen</h2>
  <p>
    Wir können Bedingungen anpassen. Wesentliche Änderungen werden über das Portal
    kenntlich gemacht (Versionsstand). Weiternutzung nach Änderung gilt als Zustimmung,
    soweit zulässig; sonst erneute Zustimmung bei Registrierung/DM-Consent.
  </p>

  <h2>11. Kontakt</h2>
  <p><a href="mailto:<?= e(LEGAL_EMAIL) ?>"><?= e(LEGAL_EMAIL) ?></a></p>

  <p style="margin-top:1.25rem;">
    <a class="btn btn-ghost" href="<?= e(allxion_url('impressum.php')) ?>">Impressum</a>
    <a class="btn btn-ghost" href="<?= e(allxion_url('privacy.php')) ?>">Datenschutz</a>
  </p>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
