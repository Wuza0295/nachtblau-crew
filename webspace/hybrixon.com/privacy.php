<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/legal.php';
require_once __DIR__ . '/includes/config.php';

$noIndex = true;
$pageTitle = 'Datenschutz · Hybrixon';
$activeNav = '';
$pageDescription = 'Datenschutzerklärung Hybrixon';
require __DIR__ . '/includes/header.php';
?>

<section class="panel legal-doc">
  <h1>Datenschutzerklärung (Hybrixon)</h1>
  <p class="muted">Stand: <?= e(LEGAL_STAND) ?> · Version: <?= e(LEGAL_DOCS_VERSION) ?></p>

  <h2>1. Verantwortlicher</h2>
  <p>
    <?= e(LEGAL_OPERATOR) ?><br>
    <a href="mailto:<?= e(LEGAL_EMAIL) ?>"><?= e(LEGAL_EMAIL) ?></a>
  </p>
  <p class="muted">Weitere Hinweise zum Anbieter: <a href="<?= e(legal_parent_privacy_url()) ?>">Datenschutzerklärung (Anbieter-Website)</a></p>

  <h2>2. Zweck des Portals</h2>
  <p>
    Hybrixon ist ein Community-Portal (Beiträge, Soft-18+-Filter, Direktnachrichten).
    Verarbeitung erfolgt zur Bereitstellung des Dienstes, Sicherheit und Regel-Durchsetzung
    (Art. 6 Abs. 1 lit. b und lit. f DSGVO; bei Einwilligungen lit. a).
  </p>

  <h2>3. Welche Daten wir verarbeiten</h2>
  <ul class="legal-list">
    <li><strong>Kontodaten:</strong> Benutzername, E-Mail, Passwort-Hash, Geburtsdatum, Registrierungszeit</li>
    <li><strong>Inhalte:</strong> Beiträge (Text, Soft-18+-Markierung, optional Soft-18+-Bilder), Likes/Reaktionen</li>
    <li><strong>Direktnachrichten:</strong> Textnachrichten zwischen Nutzern ab <?= (int)DM_MIN_AGE ?> Jahren</li>
    <li><strong>Altersfreigabe Soft-18+:</strong> Status, Zeitstempel, Audit-Einträge (ohne Ausweiskopien)</li>
    <li><strong>Moderation:</strong> automatische und Nutzer-Meldungen, Admin-Notizen, Admin-Zugriffsprotokolle auf DMs</li>
    <li><strong>Technik:</strong> Session-Cookie, serverseitige Logs des Hosters (IP, Zeit, URL)</li>
  </ul>

  <h2>4. Direktnachrichten &amp; Admin-Zugriff</h2>
  <p>
    DMs sind <strong>nicht Ende-zu-Ende verschlüsselt</strong>. Plattform-Admins können
    Direktnachrichten zur Durchsetzung der Nutzungs-/Inhaltsregeln einsehen.
    Solche Zugriffe werden protokolliert. Nutzer werden bei Registrierung und DM-Nutzung darauf hingewiesen.
  </p>
  <p>
    Nachrichten werden nach ca. <strong><?= (int)DM_RETENTION_DAYS ?> Tagen</strong> automatisch gelöscht
    (Speicherbegrenzung).
  </p>

  <h2>5. Soft-18+ / Alter</h2>
  <p>
    Das Geburtsdatum dient der Altersprüfung (Registrierung ab <?= (int)ALLXION_MIN_REGISTER_AGE ?>,
    Soft-18+/DMs ab <?= (int)ALLXION_ADULT_AGE ?>). Es wird nicht öffentlich angezeigt.
    Soft-18+ ist ein Inhaltsfilter (inkl. Soft-Nacktheit hinter Freischaltung);
    18++ / Pornografie und Gewalt sind verboten. Soft-18+-Bilder werden
    automatisch den Admins zur Prüfung gemeldet.
  </p>

  <h2>6. Cookies / Session</h2>
  <p>
    Essenzielles Session-Cookie <code>hybrixon_sess</code> für Login (HttpOnly, SameSite=Lax).
    Keine Tracking-/Marketing-Cookies durch Hybrixon.
  </p>

  <h2>7. Externe Dienste</h2>
  <p>
    Schriftarten können von Google Fonts geladen werden; dabei kann die IP-Adresse an Google übermittelt werden.
  </p>

  <h2>8. Speicherdauer</h2>
  <ul class="legal-list">
    <li>Kontodaten: bis zur Löschung des Kontos</li>
    <li>Beiträge/Reaktionen: bis Löschung durch Nutzer/Admin oder Kontolöschung</li>
    <li>DMs: ca. <?= (int)DM_RETENTION_DAYS ?> Tage, danach automatische Löschung</li>
    <li>Server-Logs: nach Vorgabe des Hosters</li>
  </ul>

  <h2>9. Weitergabe</h2>
  <p>
    Keine Weitergabe zu Werbezwecken. Weitergabe nur, wenn rechtlich erforderlich
    (z. B. Behörden) oder an Auftragsverarbeiter (Hosting), soweit nötig.
  </p>

  <h2>10. Ihre Rechte</h2>
  <p>
    Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch
    sowie Beschwerde bei einer Aufsichtsbehörde (Art. 15–21, 77 DSGVO).
  </p>
  <p>
    Kontolöschung: im Profil möglich oder per E-Mail an
    <a href="mailto:<?= e(LEGAL_EMAIL) ?>"><?= e(LEGAL_EMAIL) ?></a>.
  </p>

  <h2>11. Sicherheit</h2>
  <p>
    Passwörter werden gehasht gespeichert. Zugriff auf Admin-Funktionen ist beschränkt.
    Absolute Sicherheit im Internet kann nicht garantiert werden.
  </p>

  <p style="margin-top:1.25rem;">
    <a class="btn btn-ghost" href="<?= e(allxion_url('impressum.php')) ?>">Impressum</a>
    <a class="btn btn-ghost" href="<?= e(allxion_url('terms.php')) ?>">Nutzungsbedingungen</a>
  </p>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
