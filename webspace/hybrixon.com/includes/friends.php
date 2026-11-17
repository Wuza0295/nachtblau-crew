<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

function friends_pair(int $a, int $b): array
{
    return $a < $b ? [$a, $b] : [$b, $a];
}

function friends_are_friends(int $a, int $b): bool
{
    if ($a <= 0 || $b <= 0 || $a === $b) {
        return false;
    }
    [$x, $y] = friends_pair($a, $b);
    $stmt = allxion_db()->prepare(
        "SELECT 1 FROM friendships WHERE user_a = ? AND user_b = ? AND status = 'accepted'"
    );
    $stmt->execute([$x, $y]);
    return (bool)$stmt->fetchColumn();
}

function friends_request_status(int $me, int $other): ?array
{
    if ($me === $other) {
        return null;
    }
    [$x, $y] = friends_pair($me, $other);
    $stmt = allxion_db()->prepare(
        'SELECT * FROM friendships WHERE user_a = ? AND user_b = ?'
    );
    $stmt->execute([$x, $y]);
    $row = $stmt->fetch();
    return $row ?: null;
}

/** @return list<string> */
function friends_send_request(int $fromId, int $toId): array
{
    if ($fromId === $toId) {
        return ['Nicht möglich.'];
    }
    $u = allxion_db()->prepare(
        'SELECT id, username, banned_at, auto_accept_friends FROM users WHERE id = ?'
    );
    $u->execute([$toId]);
    $target = $u->fetch();
    if (!$target || !empty($target['banned_at'])) {
        return ['Nutzer nicht gefunden.'];
    }
    $existing = friends_request_status($fromId, $toId);
    if ($existing) {
        if ($existing['status'] === 'accepted') {
            return ['Ihr seid bereits Freunde.'];
        }
        if ($existing['status'] === 'pending') {
            return ['Anfrage läuft bereits.'];
        }
    }
    [$a, $b] = friends_pair($fromId, $toId);
    require_once __DIR__ . '/official.php';
    $auto = hybrixon_user_auto_accepts_friends($target);
    $status = $auto ? 'accepted' : 'pending';
    allxion_db()->prepare(
        "INSERT INTO friendships (user_a, user_b, requester_id, status, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(user_a, user_b) DO UPDATE SET
           requester_id = excluded.requester_id,
           status = excluded.status,
           updated_at = datetime('now')"
    )->execute([$a, $b, $fromId, $status]);
    require_once __DIR__ . '/notifications.php';
    if ($auto) {
        notifications_create($fromId, 'friend_accept', $toId);
    } else {
        notifications_create($toId, 'friend_request', $fromId);
    }
    return [];
}

/** @return list<string> */
function friends_respond(int $me, int $other, bool $accept): array
{
    $row = friends_request_status($me, $other);
    if (!$row || $row['status'] !== 'pending') {
        return ['Keine offene Anfrage.'];
    }
    if ((int)$row['requester_id'] === $me) {
        return ['Du kannst deine eigene Anfrage nicht annehmen.'];
    }
    [$a, $b] = friends_pair($me, $other);
    if ($accept) {
        allxion_db()->prepare(
            "UPDATE friendships SET status = 'accepted', updated_at = datetime('now')
             WHERE user_a = ? AND user_b = ?"
        )->execute([$a, $b]);
        require_once __DIR__ . '/notifications.php';
        notifications_create((int)$row['requester_id'], 'friend_accept', $me);
    } else {
        allxion_db()->prepare(
            'DELETE FROM friendships WHERE user_a = ? AND user_b = ?'
        )->execute([$a, $b]);
    }
    return [];
}

function friends_remove(int $me, int $other): void
{
    [$a, $b] = friends_pair($me, $other);
    allxion_db()->prepare(
        'DELETE FROM friendships WHERE user_a = ? AND user_b = ?'
    )->execute([$a, $b]);
}

function friends_cancel_outgoing(int $me, int $other): void
{
    $row = friends_request_status($me, $other);
    if ($row && $row['status'] === 'pending' && (int)$row['requester_id'] === $me) {
        friends_remove($me, $other);
    }
}

/** @return list<array<string,mixed>> */
function friends_list(int $userId): array
{
    $sql = <<<SQL
SELECT u.id, u.username, u.display_name, u.avatar_path, f.updated_at
FROM friendships f
JOIN users u ON u.id = CASE WHEN f.user_a = ? THEN f.user_b ELSE f.user_a END
WHERE (f.user_a = ? OR f.user_b = ?) AND f.status = 'accepted'
  AND (u.banned_at IS NULL OR u.banned_at = '')
ORDER BY lower(u.username)
SQL;
    $stmt = allxion_db()->prepare($sql);
    $stmt->execute([$userId, $userId, $userId]);
    return $stmt->fetchAll();
}

/** @return list<array<string,mixed>> */
function friends_incoming(int $userId): array
{
    $sql = <<<SQL
SELECT u.id, u.username, u.display_name, u.avatar_path, f.created_at
FROM friendships f
JOIN users u ON u.id = f.requester_id
WHERE (f.user_a = ? OR f.user_b = ?) AND f.status = 'pending' AND f.requester_id != ?
  AND (u.banned_at IS NULL OR u.banned_at = '')
ORDER BY f.created_at DESC
SQL;
    $stmt = allxion_db()->prepare($sql);
    $stmt->execute([$userId, $userId, $userId]);
    return $stmt->fetchAll();
}

function friends_count(int $userId): int
{
    $stmt = allxion_db()->prepare(
        "SELECT COUNT(*) FROM friendships WHERE (user_a = ? OR user_b = ?) AND status = 'accepted'"
    );
    $stmt->execute([$userId, $userId]);
    return (int)$stmt->fetchColumn();
}
