<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/dm.php';

/**
 * Request-scoped set of users blocked with $userId (either direction).
 * Pass $bust=true after block/unblock writes.
 *
 * @return array<int, true>
 */
function social_blocked_set(int $userId, bool $bust = false): array
{
    static $sets = [];
    if ($bust) {
        unset($sets[$userId]);
        return [];
    }
    if ($userId <= 0) {
        return [];
    }
    if (!isset($sets[$userId])) {
        $stmt = allxion_db()->prepare(
            'SELECT CASE WHEN blocker_id = ? THEN blocked_id ELSE blocker_id END AS other_id
             FROM user_blocks
             WHERE blocker_id = ? OR blocked_id = ?'
        );
        $stmt->execute([$userId, $userId, $userId]);
        $map = [];
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $id) {
            $map[(int)$id] = true;
        }
        $sets[$userId] = $map;
    }
    return $sets[$userId];
}

function social_is_blocked(int $a, int $b): bool
{
    if ($a <= 0 || $b <= 0 || $a === $b) {
        return false;
    }
    return isset(social_blocked_set($a)[$b]);
}

function social_i_blocked(int $blockerId, int $blockedId): bool
{
    $stmt = allxion_db()->prepare(
        'SELECT 1 FROM user_blocks WHERE blocker_id = ? AND blocked_id = ? LIMIT 1'
    );
    $stmt->execute([$blockerId, $blockedId]);
    return (bool)$stmt->fetchColumn();
}

/** @return list<string> */
function social_block_user(int $blockerId, int $blockedId): array
{
    if ($blockerId === $blockedId) {
        return ['Du kannst dich nicht selbst blockieren.'];
    }
    $exists = allxion_db()->prepare('SELECT id, is_admin FROM users WHERE id = ?');
    $exists->execute([$blockedId]);
    $target = $exists->fetch();
    if (!$target) {
        return ['Nutzer nicht gefunden.'];
    }
    if (!empty($target['is_admin'])) {
        return ['Admins können nicht blockiert werden.'];
    }
    allxion_db()->prepare(
        'INSERT OR IGNORE INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)'
    )->execute([$blockerId, $blockedId]);
    social_blocked_set($blockerId, true);
    social_blocked_set($blockedId, true);
    // Sync DM block + drop friendship/follow both ways
    dm_block($blockerId, $blockedId);
    allxion_db()->prepare(
        'DELETE FROM follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)'
    )->execute([$blockerId, $blockedId, $blockedId, $blockerId]);
    if (function_exists('social_following_set')) {
        social_following_set($blockerId, true);
        social_following_set($blockedId, true);
    }
    require_once __DIR__ . '/friends.php';
    friends_remove($blockerId, $blockedId);
    return [];
}

function social_unblock_user(int $blockerId, int $blockedId): void
{
    allxion_db()->prepare(
        'DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?'
    )->execute([$blockerId, $blockedId]);
    social_blocked_set($blockerId, true);
    social_blocked_set($blockedId, true);
    dm_unblock($blockerId, $blockedId);
}

/** @return list<array<string,mixed>> */
function social_blocked_list(int $userId): array
{
    $stmt = allxion_db()->prepare(
        'SELECT u.id, u.username, u.display_name, u.avatar_path, b.created_at
         FROM user_blocks b JOIN users u ON u.id = b.blocked_id
         WHERE b.blocker_id = ? ORDER BY b.created_at DESC'
    );
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
}
