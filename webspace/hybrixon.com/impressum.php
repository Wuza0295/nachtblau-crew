<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/legal.php';

$noIndex = true;
$pageTitle = 'Impressum · Hybrixon';
$activeNav = '';
$pageDescription = 'Impressum Hybrixon';
require __DIR__ . '/includes/header.php';
?>

<section class="panel legal-doc">
  <h1>Impressum</h1>
  <p class="muted">Stand: <?= e(LEGAL_STAND) ?> · <strong>Hybrixon</strong></p>

  <h2>Diensteanbieter</h2>
  <p>
    <strong><?= e(LEGAL_OPERATOR) ?></strong><br>
    Gesellschaft bürgerlichen Rechts<br>
    E-Mail: <a href="mailto:<?= e(LEGAL_EMAIL) ?>"><?= e(LEGAL_EMAIL) ?></a>
  </p>
  <p class="muted">
    Der Anbieter hat derzeit keinen festen Geschäftssitz.
    Privatanschriften der Gesellschafter werden nicht veröffentlicht.
  </p>

  <h2>Zum Dienst</h2>
  <p>
    <strong>Hybrixon</strong> ist ein eigenständiges Community-/Social-Portal.
    <?php if (hybrixon_is_interim()): ?>
      Derzeit erreichbar unter
      <a href="<?= e(hybrixon_public_url()) ?>"><?= e(hybrixon_public_url()) ?></a>;
      Ziel-Domain: <a href="<?= e(hybrixon_canonical_origin()) ?>/"><?= e(HYBRIXON_CANONICAL_HOST) ?></a>.
    <?php else: ?>
      Erreichbar unter
      <a href="<?= e(hybrixon_canonical_origin()) ?>/"><?= e(HYBRIXON_CANONICAL_HOST) ?></a>.
    <?php endif; ?>
    Hobbyprojekt ohne gewerbliche Einnahmen.
  </p>

  <h2>Verantwortlich für den Inhalt</h2>
  <p>
    <?= e(LEGAL_OPERATOR) ?><br>
    <a href="mailto:<?= e(LEGAL_EMAIL) ?>"><?= e(LEGAL_EMAIL) ?></a>
  </p>

  <h2>Haftung für Nutzerinhalte</h2>
  <p>
    Beiträge und Direktnachrichten stammen von Nutzern. Wir sind nicht verpflichtet,
    alle Inhalte vorab zu prüfen (§§ 7–10 TMG), entfernen aber Verstöße nach Kenntnis
    (Melden/Moderation) und können Konten sperren.
  </p>

  <h2>EU-Streitschlichtung</h2>
  <p>
    <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">ODR-Plattform</a>.
    Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
    Verbraucherschlichtungsstelle teilzunehmen.
  </p>

  <p style="margin-top:1.25rem;">
    <a class="btn btn-ghost" href="<?= e(allxion_url('privacy.php')) ?>">Datenschutz</a>
    <a class="btn btn-ghost" href="<?= e(allxion_url('terms.php')) ?>">Nutzungsbedingungen</a>
    <a class="btn btn-ghost" href="<?= e(allxion_url('rules.php')) ?>">Inhaltsregeln</a>
  </p>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
