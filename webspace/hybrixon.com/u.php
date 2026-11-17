<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/posts.php';
require_once __DIR__ . '/includes/social.php';
require_once __DIR__ . '/includes/dm.php';
require_once __DIR__ . '/includes/friends.php';
require_once __DIR__ . '/includes/relationship.php';
require_once __DIR__ . '/includes/blocks.php';

$username = trim((string)($_GET['u'] ?? ''));
require_once __DIR__ . '/includes/official.php';
if (hybrixon_is_official_username($username)
    && mb_strtolower($username, 'UTF-8') === mb_strtolower(HYBRIXON_LEGACY_TEAM_USERNAME, 'UTF-8')
) {
    redirect(user_public_url(HYBRIXON_OFFICIAL_USERNAME));
}
$owner = social_find_user_by_username($username);
$viewer = allxion_current_user();

if (!$owner || !empty($owner['banned_at'])) {
    http_response_code(404);
    $pageTitle = 'Profil nicht gefunden · Hybrixon';
    require __DIR__ . '/includes/header.php';
    echo '<section class="panel"><h1>Profil nicht gefunden</h1></section>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $viewer) {
    verify_csrf();
    $action = (string)($_POST['action'] ?? '');
    if ($action === 'follow') {
        $errors = social_follow((int)$viewer['id'], (int)$owner['id']);
        flash($errors ? 'error' : 'success', $errors[0] ?? 'Du folgst jetzt @' . $owner['username']);
        redirect(user_public_url($owner['username']));
    }
    if ($action === 'unfollow') {
        social_unfollow((int)$viewer['id'], (int)$owner['id']);
        flash('success', 'Nicht mehr folgend.');
        redirect(user_public_url($owner['username']));
    }
    if ($action === 'friend_request') {
        $errors = friends_send_request((int)$viewer['id'], (int)$owner['id']);
        $okMsg = friends_are_friends((int)$viewer['id'], (int)$owner['id'])
            ? 'Ihr seid jetzt Freunde.'
            : 'Freundschaftsanfrage gesendet.';
        flash($errors ? 'error' : 'success', $errors[0] ?? $okMsg);
        redirect(user_public_url($owner['username']));
    }
    if ($action === 'friend_accept') {
        $errors = friends_respond((int)$viewer['id'], (int)$owner['id'], true);
        flash($errors ? 'error' : 'success', $errors[0] ?? 'Freundschaft angenommen.');
        redirect(user_public_url($owner['username']));
    }
    if ($action === 'friend_decline') {
        $errors = friends_respond((int)$viewer['id'], (int)$owner['id'], false);
        flash($errors ? 'error' : 'success', $errors[0] ?? 'Anfrage abgelehnt.');
        redirect(user_public_url($owner['username']));
    }
    if ($action === 'friend_remove') {
        friends_remove((int)$viewer['id'], (int)$owner['id']);
        flash('success', 'Freundschaft beendet.');
        redirect(user_public_url($owner['username']));
    }
    if ($action === 'friend_cancel') {
        friends_cancel_outgoing((int)$viewer['id'], (int)$owner['id']);
        flash('success', 'Anfrage zurückgezogen.');
        redirect(user_public_url($owner['username']));
    }
    if ($action === 'block') {
        $errors = social_block_user((int)$viewer['id'], (int)$owner['id']);
        flash($errors ? 'error' : 'success', $errors[0] ?? 'Nutzer blockiert.');
        redirect(allxion_url());
    }
    if ($action === 'unblock') {
        social_unblock_user((int)$viewer['id'], (int)$owner['id']);
        flash('success', 'Blockierung aufgehoben.');
        redirect(user_public_url($owner['username']));
    }
}

$canView = social_can_view_profile($viewer, $owner);
$canPosts = social_can_view_posts($viewer, $owner);
$isSelf = $viewer && (int)$viewer['id'] === (int)$owner['id'];
$following = $viewer && social_is_following((int)$viewer['id'], (int)$owner['id']);
$counts = social_counts((int)$owner['id']);
$friendCount = friends_count((int)$owner['id']);
$canSeeAdult = $viewer && user_age_verified($viewer);
$posts = $canPosts ? allxion_feed($viewer, (bool)$canSeeAdult, 30, (int)$owner['id']) : [];
$friendRow = $viewer && !$isSelf ? friends_request_status((int)$viewer['id'], (int)$owner['id']) : null;
$areFriends = $friendRow && ($friendRow['status'] ?? '') === 'accepted';
$friendPendingIn = $friendRow && ($friendRow['status'] ?? '') === 'pending' && (int)$friendRow['requester_id'] !== (int)($viewer['id'] ?? 0);
$friendPendingOut = $friendRow && ($friendRow['status'] ?? '') === 'pending' && (int)$friendRow['requester_id'] === (int)($viewer['id'] ?? 0);
$iBlocked = $viewer && !$isSelf && social_i_blocked((int)$viewer['id'], (int)$owner['id']);
$showRelationship = $canView && relationship_can_view($viewer, $owner);
$partner = $showRelationship ? relationship_partner_user($owner) : null;
$pendingPartner = null;
if ($isSelf && !$partner && !empty($owner['partner_pending_id'])) {
    $ps = allxion_db()->prepare('SELECT id, username FROM users WHERE id = ?');
    $ps->execute([(int)$owner['partner_pending_id']]);
    $pendingPartner = $ps->fetch() ?: null;
}

$display = trim((string)($owner['display_name'] ?? '')) ?: $owner['username'];
if (strcasecmp($display, (string)$owner['username']) !== 0) {
    $pageTitle = $display . ' (@' . $owner['username'] . ') · Hybrixon';
} else {
    $pageTitle = '@' . $owner['username'] . ' · Hybrixon';
}
$pageDescription = ALLXION_NAME . ' · ' . ALLXION_TAGLINE;
$pageUrl = hybrixon_public_url('u.php?u=' . rawurlencode($owner['username']));
$activeNav = $isSelf ? 'profile' : '';
require __DIR__ . '/includes/header.php';

$shareUrl = $pageUrl;
?>

<section class="panel profile-header">
  <div class="profile-banner<?= empty($owner['banner_path']) ? ' profile-banner-fallback' : '' ?>">
    <?php if (!empty($owner['banner_path'])): ?>
      <img src="<?= e(allxion_url('media.php?banner=' . (int)$owner['id'])) ?>" alt="">
    <?php endif; ?>
  </div>
  <div class="profile-top">
    <div class="avatar avatar-lg avatar-on-banner">
      <?php if (!empty($owner['avatar_path'])): ?>
        <img src="<?= e(allxion_url('media.php?avatar=' . (int)$owner['id'])) ?>" alt="">
      <?php else: ?>
        <span><?= e(mb_strtoupper(mb_substr($owner['username'], 0, 1))) ?></span>
      <?php endif; ?>
    </div>
    <div class="profile-meta">
      <h1><?= e($display) ?></h1>
      <p class="muted">@<?= e($owner['username']) ?>
        <?php if (!empty($owner['city'])): ?>
          · <?php if (!empty($owner['postal_code'])): ?><?= e($owner['postal_code']) ?> <?php endif; ?><?= e($owner['city']) ?>
        <?php endif; ?>
      </p>
      <div class="pill-row">
        <span class="pill"><?= (int)$counts['followers'] ?> Follower</span>
        <span class="pill"><?= (int)$counts['following'] ?> folgend</span>
        <?php if (social_can_view_friends($viewer, $owner)): ?>
          <span class="pill"><?= (int)$friendCount ?> Freunde</span>
        <?php endif; ?>
        <?php if (user_is_admin($owner)): ?><span class="pill pill-ok">Admin</span><?php endif; ?>
      </div>
      <?php if ($showRelationship && ($owner['relationship_status'] ?? 'unspecified') !== 'unspecified'): ?>
        <p class="muted" style="margin-top:0.65rem;">
          <?= e(relationship_label((string)$owner['relationship_status'])) ?>
          <?php if ($partner): ?>
            mit <a href="<?= e(user_public_url($partner['username'])) ?>">@<?= e($partner['username']) ?></a>
          <?php elseif ($pendingPartner): ?>
            · Anfrage an <a href="<?= e(user_public_url($pendingPartner['username'])) ?>">@<?= e($pendingPartner['username']) ?></a> ausstehend
          <?php endif; ?>
        </p>
      <?php endif; ?>
    </div>
  </div>

  <?php if ($canView && !empty($owner['bio'])): ?>
    <p class="profile-bio"><?= nl2br(e($owner['bio'])) ?></p>
  <?php endif; ?>

  <div class="hero-actions">
    <?php if ($isSelf): ?>
      <a class="btn" href="<?= e(allxion_url('settings.php')) ?>">Profil &amp; Privatsphäre</a>
      <a class="btn btn-ghost" href="<?= e(allxion_url('friends.php')) ?>">Freunde</a>
      <a class="btn btn-ghost" href="<?= e(allxion_url('albums.php?u=' . rawurlencode($owner['username']))) ?>">Alben</a>
      <a class="btn btn-ghost" href="<?= e(allxion_url('compose.php')) ?>">Posten</a>
    <?php elseif ($viewer): ?>
      <form method="post" style="display:inline;">
        <?= csrf_field() ?>
        <?php if ($following): ?>
          <input type="hidden" name="action" value="unfollow">
          <button class="btn btn-ghost" type="submit">Entfolgen</button>
        <?php else: ?>
          <input type="hidden" name="action" value="follow">
          <button class="btn" type="submit">Folgen</button>
        <?php endif; ?>
      </form>
      <?php if ($areFriends): ?>
        <form method="post" style="display:inline;"><?= csrf_field() ?>
          <input type="hidden" name="action" value="friend_remove">
          <button class="btn btn-ghost" type="submit">Freund entfernen</button>
        </form>
      <?php elseif ($friendPendingIn): ?>
        <form method="post" style="display:inline;"><?= csrf_field() ?>
          <input type="hidden" name="action" value="friend_accept">
          <button class="btn" type="submit">Anfrage annehmen</button>
        </form>
        <form method="post" style="display:inline;"><?= csrf_field() ?>
          <input type="hidden" name="action" value="friend_decline">
          <button class="btn btn-ghost" type="submit">Ablehnen</button>
        </form>
      <?php elseif ($friendPendingOut): ?>
        <form method="post" style="display:inline;"><?= csrf_field() ?>
          <input type="hidden" name="action" value="friend_cancel">
          <button class="btn btn-ghost" type="submit">Anfrage zurückziehen</button>
        </form>
      <?php else: ?>
        <form method="post" style="display:inline;"><?= csrf_field() ?>
          <input type="hidden" name="action" value="friend_request">
          <button class="btn btn-ghost" type="submit">Als Freund hinzufügen</button>
        </form>
      <?php endif; ?>
      <a class="btn btn-ghost" href="<?= e(allxion_url('albums.php?u=' . rawurlencode($owner['username']))) ?>">Alben</a>
      <?php if (social_can_dm($viewer, $owner) && dm_user_eligible($viewer)): ?>
        <a class="btn btn-ghost" href="<?= e(allxion_url('messages.php?to=' . rawurlencode($owner['username']))) ?>">Nachricht</a>
      <?php endif; ?>
      <?php if ($iBlocked): ?>
        <form method="post" style="display:inline;"><?= csrf_field() ?>
          <input type="hidden" name="action" value="unblock">
          <button class="btn btn-sm btn-ghost" type="submit">Blockierung aufheben</button>
        </form>
      <?php else: ?>
        <form method="post" style="display:inline;" onsubmit="return confirm('Nutzer wirklich blockieren?');"><?= csrf_field() ?>
          <input type="hidden" name="action" value="block">
          <button class="btn btn-sm btn-ghost" type="submit">Blockieren</button>
        </form>
      <?php endif; ?>
    <?php else: ?>
      <a class="btn" href="<?= e(allxion_url('login.php')) ?>">Anmelden zum Folgen</a>
    <?php endif; ?>
    <button class="btn btn-ghost" type="button" data-copy="<?= e($shareUrl) ?>"><?= e(t('profile.share')) ?></button>
  </div>
</section>

<?php if (!$canView): ?>
  <section class="panel"><p class="muted">Dieses Profil ist privat.</p></section>
<?php elseif (!$canPosts): ?>
  <section class="panel"><p class="muted">Beiträge sind eingeschränkt sichtbar.</p></section>
<?php else: ?>
  <section class="feed">
    <?php if (!$posts): ?>
      <div class="empty"><p>Noch keine Beiträge.</p></div>
    <?php else: ?>
      <?php foreach ($posts as $post): ?>
        <?php
          $media = allxion_post_media((int)$post['id']);
          require __DIR__ . '/includes/partials/post-card.php';
        ?>
      <?php endforeach; ?>
    <?php endif; ?>
  </section>
<?php endif; ?>

<?php require __DIR__ . '/includes/footer.php'; ?>
