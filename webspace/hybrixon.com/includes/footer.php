</main>
  <footer class="footer">
    <p><strong>Hybrixon</strong> · <?= e(ALLXION_TAGLINE) ?></p>
    <p class="muted">
      <a href="<?= e(allxion_url('rules.php')) ?>">Regeln</a> ·
      <a href="<?= e(allxion_url('terms.php')) ?>">Nutzungsbedingungen</a> ·
      <a href="<?= e(allxion_url('privacy.php')) ?>">Datenschutz</a> ·
      <a href="<?= e(allxion_url('impressum.php')) ?>">Impressum</a>
      <?php if (!empty($currentUser)): ?>
        · <a href="<?= e(allxion_url('messages.php')) ?>">DMs</a>
      <?php endif; ?>
    </p>
    <p class="muted" style="margin-top:0.35rem;font-size:0.8rem;">
      <?php if (hybrixon_is_interim()): ?>
        Ziel-Domain: <a href="<?= e(hybrixon_canonical_origin()) ?>/"><?= e(HYBRIXON_CANONICAL_HOST) ?></a> ·
      <?php else: ?>
        <a href="<?= e(hybrixon_canonical_origin()) ?>/"><?= e(HYBRIXON_CANONICAL_HOST) ?></a> ·
      <?php endif; ?>
      Soft-18+ · kein 18++ / Porno / Gewalt
    </p>
  </footer>
</div>
<script src="<?= e(allxion_url('assets/js/app.js')) ?>" defer></script>
</body>
</html>
