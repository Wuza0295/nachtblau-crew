<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/discover.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$viewer = allxion_current_user();
if (!$viewer) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'users' => []], JSON_UNESCAPED_UNICODE);
    exit;
}

$q = trim((string)($_GET['q'] ?? ''));
$q = ltrim($q, '@');
if (mb_strlen($q) < 1) {
    echo json_encode(['ok' => true, 'users' => []], JSON_UNESCAPED_UNICODE);
    exit;
}

$results = discover_search_users($viewer, $q);
$out = [];
foreach (array_slice($results, 0, 8) as $u) {
    $out[] = [
        'id' => (int)$u['id'],
        'username' => (string)$u['username'],
        'display_name' => (string)($u['display_name'] ?? ''),
        'avatar' => !empty($u['avatar_path'])
            ? allxion_url('media.php?avatar=' . (int)$u['id'])
            : null,
    ];
}

echo json_encode(['ok' => true, 'users' => $out], JSON_UNESCAPED_UNICODE);
exit;
