<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mail.php';

function notifications_create(
    int $userId,
    string $type,
    ?int $actorId = null,
    ?int $postId = null,
    ?int $commentId = null,
    ?string $body = null
): void {
    if ($userId <= 0) {
        return;
    }
    if ($actorId !== null && $actorId === $userId) {
        return; // no self-notify
    }
    allxion_db()->prepare(
        'INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id, body)
         VALUES (?, ?, ?, ?, ?, ?)'
    )->execute([
        $userId,
        $actorId,
        $type,
        $postId,
        $commentId,
        $body,
    ]);

    $emailTypes = [
        'like', 'comment', 'friend_request', 'friend_accept', 'mention', 'partner_request',
    ];
    if (!in_array($type, $emailTypes, true)) {
        return; // report_* etc. handled separately for admins
    }
    $fake = ['type' => $type, 'actor_name' => null, 'body' => $body];
    if ($actorId) {
        $a = allxion_db()->prepare('SELECT username FROM users WHERE id = ?');
        $a->execute([$actorId]);
        $fake['actor_name'] = $a->fetchColumn() ?: null;
    }
    $label = notifications_label($fake);
    $link = hybrixon_public_url('notifications.php');
    if ($postId) {
        $link = hybrixon_public_url('post.php?id=' . (int)$postId);
    }
    hybrixon_notify_email_activity(
        $userId,
        $label,
        $label . "\n\nÖffnen: " . $link
    );
}

function notifications_unread_count(int $userId): int
{
    $stmt = allxion_db()->prepare(
        'SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0'
    );
    $stmt->execute([$userId]);
    return (int)$stmt->fetchColumn();
}

/** @return list<array<string,mixed>> */
function notifications_list(int $userId, int $limit = 40): array
{
    $limit = max(1, min(100, $limit));
    $stmt = allxion_db()->prepare(
        "SELECT n.*, a.username AS actor_name, a.display_name AS actor_display
         FROM notifications n
         LEFT JOIN users a ON a.id = n.actor_id
         WHERE n.user_id = ?
         ORDER BY n.created_at DESC, n.id DESC
         LIMIT {$limit}"
    );
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
}

function notifications_mark_read(int $userId, ?int $notificationId = null): void
{
    if ($notificationId) {
        allxion_db()->prepare(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
        )->execute([$notificationId, $userId]);
        return;
    }
    allxion_db()->prepare(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
    )->execute([$userId]);
}

function notifications_label(array $n): string
{
    if (!function_exists('t')) {
        require_once __DIR__ . '/i18n.php';
    }
    $who = !empty($n['actor_name']) ? '@' . $n['actor_name'] : t('notif.someone');
    $type = (string)($n['type'] ?? '');
    $key = match ($type) {
        'like' => 'notif.like',
        'comment' => 'notif.comment',
        'friend_request' => 'notif.friend_request',
        'friend_accept' => 'notif.friend_accept',
        'mention' => 'notif.mention',
        'partner_request' => 'notif.partner_request',
        'report_post' => 'notif.report_post',
        'report_dm' => 'notif.report_dm',
        default => 'notif.default',
    };
    // Stored body may be German admin text — prefer typed i18n labels for known types.
    if (in_array($type, ['report_post', 'report_dm'], true) && trim((string)($n['body'] ?? '')) !== '') {
        return (string)$n['body'];
    }
    if ($key === 'notif.default' && trim((string)($n['body'] ?? '')) !== '') {
        return (string)$n['body'];
    }
    return t($key, ['who' => $who]);
}
