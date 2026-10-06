<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/posts.php';
require_once __DIR__ . '/includes/social.php';
require_once __DIR__ . '/includes/comments.php';
require_once __DIR__ . '/includes/saved.php';
require_once __DIR__ . '/includes/moderation.php';
require_once __DIR__ . '/includes/blocks.php';

$id = (int)($_GET['id'] ?? 0);
$viewer = allxion_current_user();
$stmt = allxion_db()->prepare(
    "SELECT p.*, u.username, u.display_name, u.avatar_path, u.privacy_posts, u.privacy_profile, u.banned_at,
      (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.kind = 'like') AS like_count,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
     FROM posts p JOIN users u ON u.id = p.user_id
     WHERE p.id = ? AND p.moderation_status != 'removed'"
);
$stmt->execute([$id]);
$post = $stmt->fetch();

if (!$post || !empty($post['banned_at']) || !social_can_view_posts($viewer, $post)
    || ($viewer && social_is_blocked((int)$viewer['id'], (int)$post['user_id']) && !user_is_admin($viewer))
    || !allxion_post_is_feed_visible($post, $viewer)) {
    http_response_code(404);
    $pageTitle = 'Beitrag nicht gefunden';
    require __DIR__ . '/includes/header.php';
    echo '<section class="panel"><h1>Beitrag nicht gefunden</h1></section>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

if (!empty($post['is_adult']) && !($viewer && user_age_verified($viewer))) {
    flash('error', 'Soft-18+ Inhalt — bitte freischalten.');
    redirect(allxion_url('age-verify.php'));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $viewer) {
    verify_csrf();
    $action = (string)($_POST['action'] ?? '');
    if ($action === 'add_comment') {
        $errors = comments_create($viewer, $id, (string)($_POST['body'] ?? ''));
        flash($errors ? 'error' : 'success', $errors[0] ?? 'Kommentar gepostet.');
        redirect(allxion_url('post.php?id=' . $id . '#comments'));
    }
    if ($action === 'delete_comment') {
        $errors = comments_delete($viewer, (int)($_POST['comment_id'] ?? 0));
        flash($errors ? 'error' : 'success', $errors[0] ?? 'Kommentar gelöscht.');
        redirect(allxion_url('post.php?id=' . $id . '#comments'));
    }
    if ($action === 'toggle_save') {
        $on = saved_toggle((int)$viewer['id'], $id);
        flash('success', $on ? 'Gespeichert.' : 'Nicht mehr gespeichert.');
        redirect(allxion_url('post.php?id=' . $id));
    }
    if ($action === 'delete_post') {
        $errors = allxion_delete_own_post($viewer, $id);
        flash($errors ? 'error' : 'success', $errors[0] ?? 'Beitrag gelöscht.');
        redirect($errors ? allxion_url('post.php?id=' . $id) : allxion_url());
    }
    if ($action === 'report_post') {
        $errors = content_user_report_post($viewer, $id, (string)($_POST['reason'] ?? ''));
        flash($errors ? 'error' : 'success', $errors[0] ?? 'Gemeldet.');
        redirect(allxion_url('post.php?id=' . $id));
    }
}

$media = allxion_post_media((int)$post['id']);
$user = $viewer;
$showComments = true;
$authorDisplay = trim((string)($post['display_name'] ?? '')) ?: $post['username'];
if (strcasecmp($authorDisplay, (string)$post['username']) !== 0) {
    $pageTitle = $authorDisplay . ' (@' . $post['username'] . ') · Hybrixon';
} else {
    $pageTitle = '@' . $post['username'] . ' · Hybrixon';
}
$pageDescription = ALLXION_NAME . ' · ' . ALLXION_TAGLINE;
$pageUrl = hybrixon_public_url('post.php?id=' . $id);
require __DIR__ . '/includes/header.php';
?>
<section class="feed">
  <?php require __DIR__ . '/includes/partials/post-card.php'; ?>
</section>
<?php require __DIR__ . '/includes/footer.php'; ?>
