<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/policy.php';
require_once __DIR__ . '/social.php';
require_once __DIR__ . '/notifications.php';
require_once __DIR__ . '/discover.php';
require_once __DIR__ . '/blocks.php';

/** @return list<string> */
function comments_create(array $user, int $postId, string $body): array
{
    $body = trim($body);
    if ($body === '' || mb_strlen($body) > 2000) {
        return ['Kommentar 1–2000 Zeichen.'];
    }
    $scan = content_scan_text($body);
    if ($scan['action'] === 'block') {
        return [$scan['reasons'][0] ?? 'Inhalt verstößt gegen die Regeln.'];
    }

    $stmt = allxion_db()->prepare(
        "SELECT p.*, u.privacy_posts, u.privacy_profile, u.banned_at, u.username
         FROM posts p JOIN users u ON u.id = p.user_id
         WHERE p.id = ? AND p.moderation_status != 'removed'"
    );
    $stmt->execute([$postId]);
    $post = $stmt->fetch();
    if (!$post || !empty($post['banned_at']) || !social_can_view_posts($user, $post)) {
        return ['Beitrag nicht gefunden.'];
    }
    if (social_is_blocked((int)$user['id'], (int)$post['user_id'])) {
        return ['Keine Interaktion möglich.'];
    }

    allxion_db()->prepare(
        'INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)'
    )->execute([$postId, (int)$user['id'], $body]);
    $cid = (int)allxion_db()->lastInsertId();

    notifications_create((int)$post['user_id'], 'comment', (int)$user['id'], $postId, $cid);
    discover_index_comment($cid, $postId, (int)$user['id'], $body);
    return [];
}

/** @return list<array<string,mixed>> */
function comments_for_post(int $postId, ?array $viewer, int $limit = 50): array
{
    $limit = max(1, min(100, $limit));
    $stmt = allxion_db()->prepare(
        "SELECT c.*, u.username, u.display_name, u.avatar_path
         FROM comments c JOIN users u ON u.id = c.user_id
         WHERE c.post_id = ? AND (u.banned_at IS NULL OR u.banned_at = '')
         ORDER BY c.created_at ASC LIMIT {$limit}"
    );
    $stmt->execute([$postId]);
    $rows = $stmt->fetchAll();
    if (!$viewer) {
        return $rows;
    }
    return array_values(array_filter($rows, static function ($r) use ($viewer) {
        return !social_is_blocked((int)$viewer['id'], (int)$r['user_id']);
    }));
}

function comments_count(int $postId): int
{
    $stmt = allxion_db()->prepare('SELECT COUNT(*) FROM comments WHERE post_id = ?');
    $stmt->execute([$postId]);
    return (int)$stmt->fetchColumn();
}

/** @return list<string> */
function comments_delete(array $actor, int $commentId): array
{
    $stmt = allxion_db()->prepare('SELECT * FROM comments WHERE id = ?');
    $stmt->execute([$commentId]);
    $c = $stmt->fetch();
    if (!$c) {
        return ['Kommentar nicht gefunden.'];
    }
    if ((int)$c['user_id'] !== (int)$actor['id'] && !user_is_admin($actor)) {
        return ['Keine Berechtigung.'];
    }
    allxion_db()->prepare('DELETE FROM comments WHERE id = ?')->execute([$commentId]);
    return [];
}
