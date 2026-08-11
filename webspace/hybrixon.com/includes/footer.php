</main>
  <footer class="footer">
    <p><strong>Hybrixon</strong> · <?= e(ALLXION_TAGLINE) ?></p>
    <p class="muted">
      <a href="<?= e(allxion_url('app.php')) ?>"><?= e(t('footer.app')) ?></a> ·
      <a href="<?= e(allxion_url('rules.php')) ?>"><?= e(t('footer.rules')) ?></a> ·
      <a href="<?= e(allxion_url('terms.php')) ?>"><?= e(t('footer.terms')) ?></a> ·
      <a href="<?= e(allxion_url('privacy.php')) ?>"><?= e(t('footer.privacy')) ?></a> ·
      <a href="<?= e(allxion_url('impressum.php')) ?>"><?= e(t('footer.imprint')) ?></a>
      <?php if (!empty($currentUser)): ?>
        · <a href="<?= e(allxion_url('messages.php')) ?>"><?= e(t('footer.messages')) ?></a>
      <?php endif; ?>
    </p>
    <form class="footer-lang" method="get" action="">
      <label>
        <span class="visually-hidden"><?= e(t('footer.language')) ?></span>
        <select name="lang" onchange="this.form.submit()" aria-label="<?= e(t('footer.language')) ?>">
          <?php
            $curLang = hybrixon_active_lang($currentUser ?? null);
            foreach (hybrixon_locales() as $code => $label):
          ?>
            <option value="<?= e($code) ?>" <?= $curLang === $code ? 'selected' : '' ?>><?= e($label) ?></option>
          <?php endforeach; ?>
        </select>
      </label>
      <?php foreach ($_GET as $gk => $gv): ?>
        <?php if ($gk === 'lang' || is_array($gv)) {
            continue;
        } ?>
        <input type="hidden" name="<?= e((string)$gk) ?>" value="<?= e((string)$gv) ?>">
      <?php endforeach; ?>
    </form>
  </footer>
    </div><!-- .shell-main -->
  </div><!-- .shell -->
</div>
<?php
  require_once __DIR__ . '/push.php';
  $vapidPublic = hybrixon_vapid_public_key();
?>
<script>
window.HYBRIXON_I18N = <?= json_encode([
    'lang' => hybrixon_active_lang($currentUser ?? null),
    'copied' => t('common.copied'),
    'translate' => t('post.translate'),
    'showOriginal' => t('post.show_original'),
    'translating' => t('common.translating'),
    'translateFailed' => t('common.translate_failed'),
    'translateUrl' => allxion_url('api-translate.php'),
    'appPackage' => 'com.hybrixon.app',
    'appDownloadUrl' => allxion_url('app.php'),
    'openInApp' => t('app.open_in_app'),
    'stayWeb' => t('app.stay_web'),
    'maxVideoBytes' => MEDIA_VIDEO_MAX_BYTES,
    'maxImageBytes' => MEDIA_IMAGE_MAX_BYTES,
    'uploadParallelMin' => MEDIA_UPLOAD_PARALLEL_MIN,
    'mediaChunkUrl' => allxion_url('api-media-chunk.php'),
    'mediaChunkThreshold' => MEDIA_UPLOAD_CHUNK_THRESHOLD_BYTES,
    'mediaChunkSize' => MEDIA_UPLOAD_CHUNK_BYTES,
    'mediaChunkParallel' => MEDIA_UPLOAD_CHUNK_PARALLEL,
    'csrf' => csrf_token(),
    'loggedIn' => !empty($currentUser),
    'autoplayVideos' => !empty($currentUser['autoplay_videos']),
    'vapidPublicKey' => $vapidPublic,
    'pushSubscribeUrl' => allxion_url('api-push-subscribe.php'),
    'pushUnsubscribeUrl' => allxion_url('api-push-unsubscribe.php'),
    'notifPollUrl' => allxion_url('api-notifications-poll.php'),
    'swUrl' => allxion_url('sw.js?v=7'),
    'pushEnable' => t('settings.push_activate'),
    'pushActive' => t('settings.push_active'),
    'pushUnsupported' => t('settings.push_unsupported'),
], JSON_UNESCAPED_UNICODE) ?>;
</script>
<script src="<?= e(allxion_url('assets/js/app.js')) ?>?v=122" defer></script>
</body>
</html>
