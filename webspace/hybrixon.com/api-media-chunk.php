<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/media_chunk_upload.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

/** @param array<string, mixed> $payload */
function media_chunk_respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    media_chunk_respond(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$user = allxion_current_user_for_upload();
if (!$user) {
    media_chunk_respond(['ok' => false, 'error' => 'Login required'], 401);
}
$csrf = $_POST['_csrf'] ?? '';
if (
    !is_string($csrf)
    || !hash_equals((string)($_SESSION['_csrf'] ?? ''), $csrf)
) {
    media_chunk_respond(['ok' => false, 'error' => 'CSRF'], 403);
}
if (session_status() === PHP_SESSION_ACTIVE) {
    session_write_close();
}

@set_time_limit(300);
$userId = (int)$user['id'];
$action = strtolower((string)($_POST['action'] ?? ''));
$uploadId = strtolower((string)($_POST['upload_id'] ?? ''));

if ($action === 'init') {
    $result = media_chunk_init(
        $userId,
        (string)($_POST['name'] ?? 'video'),
        (string)($_POST['mime'] ?? ''),
        (int)($_POST['size'] ?? 0)
    );
} elseif ($action === 'part') {
    $chunk = isset($_FILES['chunk']) && is_array($_FILES['chunk'])
        ? $_FILES['chunk']
        : [];
    $result = media_chunk_store_part(
        $userId,
        $uploadId,
        (int)($_POST['index'] ?? -1),
        $chunk
    );
} elseif ($action === 'complete') {
    $poster = isset($_FILES['poster']) && is_array($_FILES['poster'])
        ? $_FILES['poster']
        : null;
    $result = media_chunk_complete($userId, $uploadId, $poster);
} elseif ($action === 'abort') {
    media_chunk_abort($userId, $uploadId);
    $result = ['ok' => true];
} else {
    media_chunk_respond(['ok' => false, 'error' => 'Unknown action'], 400);
}

if (empty($result['ok'])) {
    media_chunk_respond(
        ['ok' => false, 'error' => (string)($result['error'] ?? 'Upload fehlgeschlagen.')],
        400
    );
}
media_chunk_respond($result);
