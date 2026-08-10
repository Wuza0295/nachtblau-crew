<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

function saved_is_saved(int $userId, int $postId): bool
{
    $stmt = allxion_db()->prepare(
        'SELECT 1 FROM saved_posts WHERE user_id = ? AND post_id = ?'
    );
    $stmt->execute([$userId, $postId]);
    return (bool)$stmt->fetchColumn();
}

function saved_toggle(int $userId, int $postId): bool
{
    if (saved_is_saved($userId, $postId)) {
        allxion_db()->prepare(
            'DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?'
        )->execute([$userId, $postId]);
        return false;
    }
    allxion_db()->prepare(
        'INSERT OR IGNORE INTO saved_posts (user_id, post_id) VALUES (?, ?)'
    )->execute([$userId, $postId]);
    return true;
}

/** @return list<array<string,mixed>> */
function saved_list(int $userId, bool $includeAdult, int $limit = 40): array
{
    require_once __DIR__ . '/social.php';
    require_once __DIR__ . '/blocks.php';
    $limit = max(1, min(80, $limit));
    $sql = <<<SQL
SELECT p.*, u.username, u.display_name, u.avatar_path, u.privacy_posts, u.privacy_profile,
  (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.kind = 'like') AS like_count,
  s.created_at AS saved_at
FROM saved_posts s
JOIN posts p ON p.id = s.post_id
JOIN users u ON u.id = p.user_id
WHERE s.user_id = ?
  AND p.moderation_status != 'removed'
  AND (u.banned_at IS NULL OR u.banned_at = '')
ORDER BY s.created_at DESC
LIMIT {$limit}
SQL;
    $stmt = allxion_db()->prepare($sql);
    $stmt->execute([$userId]);
    $viewer = ['id' => $userId];
    $out = [];
    foreach ($stmt->fetchAll() as $row) {
        if (!$includeAdult && !empty($row['is_adult'])) {
            continue;
        }
        if (social_is_blocked($userId, (int)$row['user_id'])) {
            continue;
        }
        if (!social_can_view_posts($viewer, $row)) {
            continue;
        }
        $out[] = $row;
    }
    return $out;
}
