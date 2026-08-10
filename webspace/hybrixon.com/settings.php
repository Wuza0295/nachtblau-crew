<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/social.php';
require_once __DIR__ . '/includes/relationship.php';
require_once __DIR__ . '/includes/legal.php';
require_once __DIR__ . '/includes/i18n.php';

$user = allxion_require_login();
hybrixon_handle_lang_switch();
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = (string)($_POST['action'] ?? 'save_profile');
    // Ignore password fields unless this is an explicit password change
    // (browsers sometimes autofill them into the wrong form).
    if ($action !== 'change_password') {
        unset($_POST['current_password'], $_POST['new_password'], $_POST['password']);
    }
    if ($action === 'save_profile') {
        $avatar = isset($_FILES['avatar']) && is_array($_FILES['avatar']) ? $_FILES['avatar'] : null;
        $banner = isset($_FILES['banner']) && is_array($_FILES['banner']) ? $_FILES['banner'] : null;
        $errors = social_update_profile($user, $_POST, $avatar, $banner);
        if (!$errors) {
            $shared = [];
            $avatarUp = $avatar && (($avatar['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE);
            $bannerUp = $banner && (($banner['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE);
            if ($avatarUp && !empty($_POST['share_avatar_post'])) {
                $shared[] = 'Profilbild';
            }
            if ($bannerUp && !empty($_POST['share_banner_post'])) {
                $shared[] = 'Banner';
            }
            $msg = 'Profil & Privatsphäre gespeichert.';
            if ($shared) {
                $msg .= ' Als Beitrag geteilt: ' . implode(', ', $shared) . '.';
            }
            if (trim((string)($_POST['partner_username'] ?? '')) !== '') {
                $msg .= ' Partner-Anfrage gesendet — der Name erscheint im Profil erst nach Bestätigung.';
            }
            flash('success', $msg);
            redirect(allxion_url('settings.php'));
        }
        $user = allxion_current_user() ?? $user;
    } elseif ($action === 'partner_respond') {
        $fromId = (int)($_POST['from_id'] ?? 0);
        $accept = ((string)($_POST['decision'] ?? '')) === 'accept';
        $errors = relationship_respond_partner((int)$user['id'], $fromId, $accept);
        flash($errors ? 'error' : 'success', $errors[0] ?? ($accept ? 'Partner bestätigt.' : 'Anfrage abgelehnt.'));
        redirect(allxion_url('settings.php'));
    } elseif ($action === 'partner_clear') {
        relationship_clear_partner((int)$user['id']);
        flash('success', 'Partner-Eintrag entfernt.');
        redirect(allxion_url('settings.php'));
    } elseif ($action === 'partner_cancel_pending') {
        allxion_db()->prepare('UPDATE users SET partner_pending_id = NULL WHERE id = ?')
            ->execute([(int)$user['id']]);
        flash('success', 'Partner-Anfrage zurückgezogen.');
        redirect(allxion_url('settings.php'));
    } elseif ($action === 'change_password') {
        $errors = allxion_change_password(
            $user,
            (string)($_POST['current_password'] ?? ''),
            (string)($_POST['new_password'] ?? '')
        );
        flash($errors ? 'error' : 'success', $errors[0] ?? 'Passwort geändert.');
        redirect(allxion_url('settings.php'));
    } elseif ($action === 'unblock') {
        require_once __DIR__ . '/includes/blocks.php';
        social_unblock_user((int)$user['id'], (int)($_POST['user_id'] ?? 0));
        flash('success', 'Blockierung aufgehoben.');
        redirect(allxion_url('settings.php'));
    }
}

$user = allxion_current_user() ?? $user;
$partner = relationship_partner_user($user);
$incomingPartners = relationship_incoming((int)$user['id']);
$pendingPartner = null;
if (!empty($user['partner_pending_id'])) {
    $ps = allxion_db()->prepare('SELECT id, username FROM users WHERE id = ?');
    $ps->execute([(int)$user['partner_pending_id']]);
    $pendingPartner = $ps->fetch() ?: null;
}
require_once __DIR__ . '/includes/blocks.php';
$blockedUsers = social_blocked_list((int)$user['id']);


$vis = [
    'public' => t('vis.public'),
    'friends' => t('vis.friends'),
    'followers' => t('vis.followers'),
    'private' => t('vis.private'),
];

$pageTitle = t('nav.settings') . ' · Hybrixon';
$activeNav = 'settings';
require __DIR__ . '/includes/header.php';
?>

<section class="panel">
  <h1><?= e(t('settings.title')) ?></h1>

  <?php foreach ($errors as $err): ?>
    <div class="flash flash-error" style="margin-bottom:0.6rem;"><?= e($err) ?></div>
  <?php endforeach; ?>

  <form method="post" class="form" enctype="multipart/form-data" autocomplete="off">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="save_profile">
    <?php /* Absorb browser password autofill so it does not leak into profile fields */ ?>
    <div class="autofill-trap" aria-hidden="true">
      <input type="text" name="autofill_trap_user" value="" tabindex="-1" autocomplete="username">
      <input type="password" name="autofill_trap_pass" value="" tabindex="-1" autocomplete="new-password">
    </div>

    <div class="settings-avatar" style="margin-bottom:1rem;">
      <div class="avatar avatar-lg">
        <?php if (!empty($user['avatar_path'])): ?>
          <img src="<?= e(allxion_url('media.php?avatar=' . (int)$user['id'])) ?>" alt="">
        <?php else: ?>
          <span><?= e(mb_strtoupper(mb_substr($user['username'], 0, 1))) ?></span>
        <?php endif; ?>
      </div>
      <p class="muted" style="margin:0.75rem 0 0;">
        <button class="btn btn-sm btn-ghost" type="button" data-copy="<?= e(hybrixon_public_url('u.php?u=' . rawurlencode($user['username']))) ?>"><?= e(t('profile.share')) ?></button>
      </p>
    </div>

    <label>Profilbild (JPEG/PNG/WebP, max. <?= (int)(MEDIA_IMAGE_MAX_BYTES / 1_000_000) ?> MB)
      <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" data-share-toggle="share-avatar-post">
    </label>
    <label class="pref-check" id="share-avatar-post" hidden>
      <input type="checkbox" name="share_avatar_post" value="1">
      <span>Als Beitrag im Feed posten?</span>
    </label>
    <label>Profilbanner (quer, JPEG/PNG/WebP)
      <?php if (!empty($user['banner_path'])): ?>
        <img class="banner-preview" src="<?= e(allxion_url('media.php?banner=' . (int)$user['id'])) ?>" alt="Aktuelles Banner">
      <?php endif; ?>
      <input type="file" name="banner" accept="image/jpeg,image/png,image/webp" data-share-toggle="share-banner-post">
      <span class="hint">Breites Bild empfohlen (z. B. 1500×500). Ohne Upload bleibt der Standard-Verlauf.</span>
    </label>
    <label class="pref-check" id="share-banner-post" hidden>
      <input type="checkbox" name="share_banner_post" value="1">
      <span>Als Beitrag im Feed posten?</span>
    </label>
    <?php if (!empty($user['banner_path'])): ?>
      <label class="pref-check">
        <input type="checkbox" name="remove_banner" value="1">
        <span>Banner entfernen (Standard-Verlauf)</span>
      </label>
    <?php endif; ?>
    <label>Anzeigename
      <input type="text" name="display_name" maxlength="60" autocomplete="nickname" value="<?= e((string)($user['display_name'] ?? $_POST['display_name'] ?? '')) ?>">
    </label>
    <label>Bio
      <textarea name="bio" maxlength="500" rows="3" autocomplete="off"><?= e((string)($user['bio'] ?? $_POST['bio'] ?? '')) ?></textarea>
    </label>
    <?php
      $plzValue = (string)($user['postal_code'] ?? $_POST['postal_code'] ?? '');
      $cityValue = (string)($user['city'] ?? $_POST['city'] ?? '');
      $required = true;
      require __DIR__ . '/includes/partials/location-fields.php';
    ?>

    <h2 style="margin-top:1.25rem;"><?= e(t('settings.appearance')) ?></h2>
    <label><?= e(t('settings.language')) ?>
      <select name="ui_lang">
        <?php
          $curUiLang = (string)($user['ui_lang'] ?? hybrixon_active_lang($user));
          foreach (hybrixon_locales() as $code => $label):
        ?>
          <option value="<?= e($code) ?>" <?= $curUiLang === $code ? 'selected' : '' ?>><?= e($label) ?></option>
        <?php endforeach; ?>
      </select>
    </label>
    <label><?= e(t('settings.theme')) ?>
      <select name="theme">
        <?php $th = (string)($user['theme'] ?? 'light'); ?>
        <option value="light" <?= $th === 'light' ? 'selected' : '' ?>>Light Mode</option>
        <option value="dark" <?= $th === 'dark' ? 'selected' : '' ?>>Dark Mode</option>
      </select>
    </label>
    <label>Markenanzeige (obere Leiste)
      <select name="brand_style">
        <?php $bs = (string)($user['brand_style'] ?? 'logo_text'); ?>
        <?php foreach (hybrixon_brand_styles() as $val => $label): ?>
          <option value="<?= e($val) ?>" <?= $bs === $val ? 'selected' : '' ?>><?= e($label) ?></option>
        <?php endforeach; ?>
      </select>
      <span class="hint">Nur Logo, Logo mit Text „Hybrixon“, oder nur Text.</span>
    </label>

    <?php
      require_once __DIR__ . '/includes/sidebar-config.php';
      $sidebarEnabled = hybrixon_sidebar_items_for($user);
      $sidebarCatalog = hybrixon_sidebar_catalog();
      $sidebarPos = [];
      foreach ($sidebarEnabled as $i => $key) {
          $sidebarPos[$key] = $i + 1;
      }
      $posFallback = count($sidebarEnabled) + 1;
    ?>
    <fieldset class="sidebar-config">
      <legend>Seitenleiste (links)</legend>
      <p class="hint" style="margin-bottom:0.65rem;">
        Haken = in der linken Leiste sichtbar. Zahl = Reihenfolge.
        Ausgeblendete Punkte bleiben in der <strong>oberen Leiste</strong> erreichbar.
      </p>
      <?php
        $i = 0;
        foreach ($sidebarCatalog as $key => $meta):
          if (!empty($meta['admin']) && !user_is_admin($user)) {
              continue;
          }
          $i++;
          $checked = in_array($key, $sidebarEnabled, true);
          $pos = $sidebarPos[$key] ?? ($posFallback + $i);
      ?>
        <label class="sidebar-config-row">
          <input type="checkbox" name="sidebar_enabled[]" value="<?= e($key) ?>" <?= $checked ? 'checked' : '' ?>>
          <span class="sidebar-config-label"><?= e((string)$meta['label']) ?></span>
          <input type="number" class="sidebar-config-pos" name="sidebar_pos[<?= e($key) ?>]" value="<?= (int)$pos ?>" min="1" max="40" aria-label="Position <?= e((string)$meta['label']) ?>">
        </label>
      <?php endforeach; ?>
    </fieldset>

    <?php require_once __DIR__ . '/includes/mail.php'; ?>
    <fieldset class="sidebar-config">
      <legend>E-Mail-Benachrichtigungen</legend>
      <p class="hint" style="margin-bottom:0.65rem;">
        Alles abschalten: „E-Mail-Benachrichtigungen insgesamt“ deaktivieren.
        Einzelne Arten kannst du darunter fein steuern.
      </p>
      <div class="pref-checks">
        <?php foreach (hybrixon_email_pref_labels() as $key => $label): ?>
          <?php $on = (int)($user[$key] ?? ($key === 'email_notify_friend_posts' || $key === 'email_notify_group_posts' ? 0 : 1)) === 1; ?>
          <label class="pref-check">
            <input type="checkbox" name="<?= e($key) ?>" value="1" <?= $on ? 'checked' : '' ?>>
            <span><?= e($label) ?></span>
          </label>
        <?php endforeach; ?>
      </div>
    </fieldset>

    <fieldset class="sidebar-config" data-push-settings>
      <legend><?= e(t('settings.push_title')) ?></legend>
      <p class="hint" style="margin-bottom:0.65rem;"><?= e(t('settings.push_lead')) ?></p>
      <div class="pref-checks">
        <label class="pref-check">
          <input type="checkbox" name="push_notify_enabled" value="1" <?= ((int)($user['push_notify_enabled'] ?? 1) === 1) ? 'checked' : '' ?>>
          <span><?= e(t('settings.push_enable')) ?></span>
        </label>
      </div>
      <p style="margin-top:0.75rem;">
        <button type="button" class="btn btn-sm" data-push-enable><?= e(t('settings.push_activate')) ?></button>
      </p>
      <p class="hint" data-push-status hidden></p>
    </fieldset>

    <h2 style="margin-top:1.25rem;">Beziehung</h2>
    <label>Beziehungsstatus
      <select name="relationship_status">
        <?php
          $rs = (string)($user['relationship_status'] ?? 'unspecified');
          foreach (relationship_status_labels() as $k => $label):
        ?>
          <option value="<?= e($k) ?>" <?= $rs === $k ? 'selected' : '' ?>><?= e($label) ?></option>
        <?php endforeach; ?>
      </select>
    </label>
    <?php if ($partner): ?>
      <p class="muted">Partner: <a href="<?= e(user_public_url($partner['username'])) ?>">@<?= e($partner['username']) ?></a></p>
    <?php elseif ($pendingPartner): ?>
      <p class="muted">Anfrage ausstehend an @<?= e($pendingPartner['username']) ?></p>
    <?php else: ?>
      <label>Partner auf Hybrixon (Benutzername)
        <input type="text" name="partner_username" maxlength="40" placeholder="username" autocomplete="off">
      </label>
      <p class="hint">Die andere Person muss die Anfrage unter Einstellungen annehmen. Erst dann erscheint der Partner im Profil.</p>
    <?php endif; ?>

    <h2 style="margin-top:1.25rem;">Privatsphäre</h2>
    <?php
      $privacyFields = [
        'privacy_profile' => 'Profil sichtbar für',
        'privacy_posts' => 'Beiträge sichtbar für',
        'privacy_friends' => 'Freundesliste sichtbar für',
        'privacy_albums' => 'Alben-Standard sichtbar für',
        'privacy_stories' => 'Stories sichtbar für',
        'privacy_groups' => 'Gruppen-Mitgliedschaften sichtbar für',
        'privacy_relationship' => 'Beziehungsstatus sichtbar für',
        'privacy_search' => 'In Suche auffindbar für',
      ];
      foreach ($privacyFields as $field => $label):
        $cur = (string)($user[$field] ?? 'public');
    ?>
      <label><?= e($label) ?>
        <select name="<?= e($field) ?>">
          <?php foreach ($vis as $k => $v): ?>
            <option value="<?= e($k) ?>" <?= $cur === $k ? 'selected' : '' ?>><?= e($v) ?></option>
          <?php endforeach; ?>
        </select>
      </label>
    <?php endforeach; ?>
    <label><?= e(t('settings.who_may_message')) ?>
      <select name="privacy_dms">
        <?php
          $pd = (string)($user['privacy_dms'] ?? 'everyone');
          foreach ([
            'everyone' => t('vis.dm_everyone'),
            'friends' => t('vis.dm_friends'),
            'followers' => t('vis.dm_followers'),
            'none' => t('vis.dm_none'),
          ] as $k => $label):
        ?>
          <option value="<?= e($k) ?>" <?= $pd === $k ? 'selected' : '' ?>><?= e($label) ?></option>
        <?php endforeach; ?>
      </select>
    </label>

    <button class="btn btn-block" type="submit"><?= e(t('common.save')) ?></button>
  </form>
</section>

<?php if ($incomingPartners): ?>
<section class="panel">
  <h2>Partner-Anfragen</h2>
  <?php foreach ($incomingPartners as $ip): ?>
    <div class="hero-actions" style="margin-bottom:0.75rem;">
      <span>@<?= e($ip['username']) ?> möchte dich als Partner eintragen.</span>
      <form method="post" style="display:inline;"><?= csrf_field() ?>
        <input type="hidden" name="action" value="partner_respond">
        <input type="hidden" name="from_id" value="<?= (int)$ip['id'] ?>">
        <input type="hidden" name="decision" value="accept">
        <button class="btn btn-sm" type="submit">Annehmen</button>
      </form>
      <form method="post" style="display:inline;"><?= csrf_field() ?>
        <input type="hidden" name="action" value="partner_respond">
        <input type="hidden" name="from_id" value="<?= (int)$ip['id'] ?>">
        <input type="hidden" name="decision" value="decline">
        <button class="btn btn-sm btn-ghost" type="submit">Ablehnen</button>
      </form>
    </div>
  <?php endforeach; ?>
</section>
<?php endif; ?>

<?php if ($partner || $pendingPartner): ?>
<section class="panel">
  <h2>Partner verwalten</h2>
  <?php if ($partner): ?>
    <form method="post"><?= csrf_field() ?>
      <input type="hidden" name="action" value="partner_clear">
      <button class="btn btn-ghost" type="submit">Partnerschaft beenden</button>
    </form>
  <?php elseif ($pendingPartner): ?>
    <form method="post"><?= csrf_field() ?>
      <input type="hidden" name="action" value="partner_cancel_pending">
      <button class="btn btn-ghost" type="submit">Anfrage zurückziehen</button>
    </form>
  <?php endif; ?>
</section>
<?php endif; ?>

<section class="panel">
  <h2>Passwort ändern</h2>
  <p class="muted" style="margin-bottom:0.75rem;">Nur nötig, wenn du dein Passwort ändern willst — nicht zum Speichern des Profils.</p>
  <form method="post" class="form" autocomplete="on">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="change_password">
    <input type="text" name="username" value="<?= e((string)$user['username']) ?>" autocomplete="username" readonly tabindex="-1" class="autofill-trap-username" aria-hidden="true">
    <label>Aktuelles Passwort
      <input type="password" name="current_password" required autocomplete="current-password">
    </label>
    <label>Neues Passwort
      <input type="password" name="new_password" required minlength="8" autocomplete="new-password">
    </label>
    <button class="btn" type="submit">Passwort speichern</button>
  </form>
</section>

<?php if ($blockedUsers): ?>
<section class="panel">
  <h2>Blockierte Nutzer</h2>
  <?php foreach ($blockedUsers as $b): ?>
    <div class="hero-actions" style="margin-bottom:0.5rem;">
      <a href="<?= e(user_public_url($b['username'])) ?>">@<?= e($b['username']) ?></a>
      <form method="post" style="display:inline;"><?= csrf_field() ?>
        <input type="hidden" name="action" value="unblock">
        <input type="hidden" name="user_id" value="<?= (int)$b['id'] ?>">
        <button class="btn btn-sm btn-ghost" type="submit">Entsperren</button>
      </form>
    </div>
  <?php endforeach; ?>
</section>
<?php endif; ?>

<section class="panel">
  <h2>Schnellzugriff</h2>
  <div class="hero-actions">
    <a class="btn btn-ghost" href="<?= e(user_public_url($user['username'])) ?>"><?= e(t('profile.public')) ?></a>
    <a class="btn btn-ghost" href="<?= e(allxion_url('friends.php')) ?>"><?= e(t('nav.friends')) ?></a>
    <a class="btn btn-ghost" href="<?= e(allxion_url('saved.php')) ?>"><?= e(t('nav.saved')) ?></a>
    <a class="btn btn-ghost" href="<?= e(allxion_url('albums.php')) ?>"><?= e(t('nav.albums')) ?></a>
    <a class="btn btn-ghost" href="<?= e(allxion_url('stories.php')) ?>"><?= e(t('nav.stories')) ?></a>
    <a class="btn btn-ghost" href="<?= e(allxion_url('groups.php')) ?>"><?= e(t('nav.groups')) ?></a>
    <a class="btn btn-ghost" href="<?= e(allxion_url('profile.php')) ?>"><?= e(t('nav.profile')) ?></a>
  </div>
</section>

<?php require __DIR__ . '/includes/footer.php'; ?>
