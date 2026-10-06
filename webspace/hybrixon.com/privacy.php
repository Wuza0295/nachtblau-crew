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
    Hybrixon ist ein Community-Portal (Beiträge, Soft-18+-Filter, Direktnachrichten, soziale Funktionen).
    Verarbeitung erfolgt zur Bereitstellung des Dienstes, Sicherheit und Regel-Durchsetzung
    (Art. 6 Abs. 1 lit. b und lit. f DSGVO; bei Einwilligungen lit. a).
  </p>

  <h2>3. Welche Daten wir verarbeiten</h2>
  <ul class="legal-list">
    <li><strong>Kontodaten:</strong> Benutzername, E-Mail, Passwort-Hash, Geburtsdatum, <strong>Ort (Pflicht)</strong>, optionale PLZ, Theme-/Marken-/Seitenleisten-/E-Mail-Präferenzen, Registrierungszeit</li>
    <li><strong>Profil:</strong> optional Anzeigename, Bio, Avatar, Beziehungsstatus/Partner (bei Bestätigung)</li>
    <li><strong>Inhalte:</strong> Beiträge, Stories, Alben, Gruppenbeiträge, Soft-18+-Markierung, Likes/Reaktionen</li>
    <li><strong>Sozialgraph:</strong> Folgen, Freundschaften, Gruppenmitgliedschaften, Blockierungen</li>
    <li><strong>Interaktion:</strong> Kommentare, Likes, Mentions, Hashtags, gespeicherte Beiträge, Benachrichtigungen</li>
    <li><strong>Direktnachrichten:</strong> Textnachrichten zwischen Nutzern ab <?= (int)DM_MIN_AGE ?> Jahren</li>
    <li><strong>Altersfreigabe Soft-18+:</strong> Status, Zeitstempel, Audit-Einträge; ggf. hochgeladene Nachweise nur zur Prüfung</li>
    <li><strong>Moderation:</strong> automatische und Nutzer-Meldungen, Admin-Notizen, Admin-Zugriffsprotokolle auf DMs</li>
    <li><strong>Sicherheit / IP:</strong> aktuelle und historisierte IP-Adressen sowie User-Agent (siehe Ziff. 9)</li>
    <li><strong>Technik:</strong> Session-Cookie, optional Remember-Login-Cookie, Theme-/Markenanzeige-Cookies, Hoster-Serverlogs</li>
  </ul>

  <h2>4. Ort und optionale PLZ</h2>
  <p>
    Bei Registrierung und im Profil ist der <strong>Ort Pflicht</strong>. Die Postleitzahl ist
    <strong>optional</strong> und kann die Ortsauswahl eingrenzen.
    Ort und ggf. PLZ dienen der Community-Zuordnung, der Missbrauchs- und Spam-Prävention sowie der
    Regel-Durchsetzung (Vertragserfüllung und berechtigtes Interesse,
    Art. 6 Abs. 1 lit. b und lit. f DSGVO).
  </p>
  <p>
    Der Ort kann im Profil für andere Nutzer sichtbar sein (je nach Privatsphäre-Einstellung).
    <strong>Falschangaben</strong> können von der Plattform geprüft werden, insbesondere durch
    Abgleich mit anderen Konto- und Sicherheitsdaten (z. B. IP-/Zugangsdaten im Admin-Kontext).
    Unzutreffende Angaben können zur Einschränkung von Funktionen, zur manuellen Freigabe von
    Beiträgen oder zur Sperrung des Kontos führen.
  </p>
  <p>
    Ohne gültigen Ort werden neue Beiträge zunächst nicht öffentlich angezeigt und
    können einer Admin-Prüfung unterliegen, bis ein korrekter Ort hinterlegt bzw. freigegeben wurde.
  </p>
  <p>
    Optional versenden wir <strong>E-Mail-Benachrichtigungen</strong> (Aktivitäten, Nachrichten,
    Freundes-/Gruppenbeiträge) an die hinterlegte Adresse. Das kannst du in den Einstellungen
    einzeln oder vollständig abschalten.
  </p>

  <h2>5. Direktnachrichten &amp; Admin-Zugriff</h2>
  <p>
    DMs sind <strong>nicht Ende-zu-Ende verschlüsselt</strong>. Plattform-Admins können
    Direktnachrichten zur Durchsetzung der Nutzungs-/Inhaltsregeln einsehen.
    Solche Zugriffe werden protokolliert. Nutzer werden bei Registrierung und DM-Nutzung darauf hingewiesen.
  </p>
  <p>
    Nachrichten werden nach ca. <strong><?= (int)DM_RETENTION_DAYS ?> Tagen</strong> automatisch gelöscht
    (Speicherbegrenzung, Art. 5 Abs. 1 lit. e DSGVO).
  </p>

  <h2>6. Soft-18+ / Alter</h2>
  <p>
    Das Geburtsdatum dient der Altersprüfung (Registrierung ab <?= (int)ALLXION_MIN_REGISTER_AGE ?>,
    Soft-18+/DMs ab <?= (int)ALLXION_ADULT_AGE ?>). Es wird nicht öffentlich angezeigt.
    Soft-18+ ist ein Inhaltsfilter (inkl. Soft-Nacktheit hinter Freischaltung);
    18++ / Pornografie und Gewalt sind verboten. Soft-18+-Bilder werden
    automatisch den Admins zur Prüfung gemeldet.
  </p>

  <h2>7. Cookies / Session</h2>
  <ul class="legal-list">
    <li><code>hybrixon_sess</code> — essenzielles Session-Cookie (HttpOnly, SameSite=Lax)</li>
    <li><code>hybrixon_remember</code> — optional „Eingeloggt bleiben“ (max. <?= (int)REMEMBER_ME_DAYS ?> Tage)</li>
    <li><code>hybrixon_theme</code> — Speicherung der Darstellungspräferenz (Light/Dark) für Gäste / Komfort</li>
    <li><code>hybrixon_brand</code> — Speicherung der Markenanzeige (Logo / Logo+Text / Text)</li>
  </ul>
  <p>Keine Tracking-/Marketing-Cookies durch Hybrixon.</p>

  <h2>8. Externe Dienste</h2>
  <p>
    Schriftarten können von Google Fonts geladen werden; dabei kann die IP-Adresse an Google übermittelt werden.
  </p>

  <h2>9. IP-Adressen &amp; Speicherdauer</h2>
  <p>
    IP-Adressen und User-Agent werden zur Missbrauchsbekämpfung, Sicherheit und Moderation
    verarbeitet (berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO). Sie sind nicht öffentlich.
    Sie können im Rahmen der Prüfung von Ortsangaben intern herangezogen werden.
  </p>
  <ul class="legal-list">
    <li>IP-Verlauf: maximal ca. <strong><?= (int)IP_LOG_RETENTION_DAYS ?> Tage</strong>, danach automatische Löschung</li>
    <li>Bei Kontolöschung: IP-Verlauf und Remember-Tokens werden sofort gelöscht</li>
    <li>Hoster-Zugriffslogs: nach Vorgabe des Hostings (ALL-INKL / Kasserver)</li>
  </ul>

  <h2>10. Speicherdauer &amp; Kontolöschung</h2>
  <ul class="legal-list">
    <li>Kontodaten &amp; Profil inkl. PLZ/Ort: bis zur Löschung des Kontos</li>
    <li>Beiträge, Stories, Alben, Medien, Kommentare, Merkliste, Sozialgraph: bis Löschung durch Nutzer/Admin oder Kontolöschung</li>
    <li>Benachrichtigungen: bis Löschung bzw. mit Kontolöschung</li>
    <li>DMs: ca. <?= (int)DM_RETENTION_DAYS ?> Tage bzw. mit Kontolöschung</li>
    <li>Kontolöschung im Profil entfernt personenbezogene Daten und Dateien, soweit technisch dem Konto zugeordnet</li>
  </ul>
  <p>
    Nach Löschung können gesetzliche Aufbewahrungspflichten oder kurzfristige Backups des Hosters
    technische Restspuren enthalten; diese sind vom produktiven Nutzerkonto getrennt und werden
    nach den jeweiligen Fristen überschrieben.
  </p>

  <h2>11. Weitergabe</h2>
  <p>
    Keine Weitergabe zu Werbezwecken. Weitergabe nur, wenn rechtlich erforderlich
    (z. B. Behörden) oder an Auftragsverarbeiter (Hosting), soweit nötig.
  </p>

  <h2>12. Ihre Rechte</h2>
  <p>
    Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch
    sowie Beschwerde bei einer Aufsichtsbehörde (Art. 15–21, 77 DSGVO).
  </p>
  <p>
    Kontolöschung: im Profil möglich oder per E-Mail an
    <a href="mailto:<?= e(LEGAL_EMAIL) ?>"><?= e(LEGAL_EMAIL) ?></a>.
  </p>

  <h2>13. Sicherheit</h2>
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
