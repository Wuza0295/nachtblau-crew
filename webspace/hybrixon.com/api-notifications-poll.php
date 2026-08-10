<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/notifications.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$user = allxion_current_user();
if (!$user) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Login required']);
    exit;
}

$sinceId = (int)($_GET['since_id'] ?? 0);
$unread = notifications_unread_count((int)$user['id']);
$items = [];
if ($sinceId > 0) {
    $stmt = allxion_db()->prepare(
        "SELECT n.*, a.username AS actor_name
         FROM notifications n
         LEFT JOIN users a ON a.id = n.actor_id
         WHERE n.user_id = ? AND n.id > ?
         ORDER BY n.id ASC
         LIMIT 20"
    );
    $stmt->execute([(int)$user['id'], $sinceId]);
    $rows = $stmt->fetchAll();
} else {
    $rows = notifications_list((int)$user['id'], 5);
}

foreach ($rows as $n) {
    $postId = (int)($n['post_id'] ?? 0);
    $items[] = [
        'id' => (int)$n['id'],
        'title' => 'Hybrixon',
        'body' => notifications_label($n),
        'url' => $postId > 0
            ? allxion_url('post.php?id=' . $postId)
            : allxion_url('notifications.php'),
        'created_at' => (string)($n['created_at'] ?? ''),
    ];
}

$maxId = 0;
foreach ($items as $it) {
    $maxId = max($maxId, (int)$it['id']);
}
if ($maxId === 0) {
    $maxStmt = allxion_db()->prepare('SELECT MAX(id) FROM notifications WHERE user_id = ?');
    $maxStmt->execute([(int)$user['id']]);
    $maxId = (int)$maxStmt->fetchColumn();
}

echo json_encode([
    'ok' => true,
    'unread' => $unread,
    'max_id' => $maxId,
    'items' => $items,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
