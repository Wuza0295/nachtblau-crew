<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/media_upload.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$user = allxion_current_user_for_upload();
if (!$user) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Login required']);
    exit;
}

// Release the session lock before receiving/moving the file so parallel
// XHR uploads are not serialized by PHP's session storage.
if (session_status() === PHP_SESSION_ACTIVE) {
    session_write_close();
}

$csrf = $_POST['_csrf'] ?? '';
if (!is_string($csrf)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'CSRF']);
    exit;
}
allxion_session_start_lite();
if (!hash_equals((string)($_SESSION['_csrf'] ?? ''), $csrf)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'CSRF']);
    exit;
}
if (session_status() === PHP_SESSION_ACTIVE) {
    session_write_close();
}

$file = null;
if (isset($_FILES['file']) && is_array($_FILES['file'])) {
    $file = $_FILES['file'];
} elseif (isset($_FILES['image']) && is_array($_FILES['image'])) {
    $file = $_FILES['image'];
} elseif (isset($_FILES['video']) && is_array($_FILES['video'])) {
    $file = $_FILES['video'];
}

if ($file === null || (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'No file']);
    exit;
}

$prefer = strtolower((string)($_POST['kind'] ?? 'auto'));
if (!in_array($prefer, ['auto', 'image', 'video'], true)) {
    $prefer = 'auto';
}
$purpose = strtolower((string)($_POST['purpose'] ?? 'posts'));
if (!in_array($purpose, ['posts', 'stories', 'reels'], true)) {
    $purpose = 'posts';
}

$poster = isset($_FILES['poster']) && is_array($_FILES['poster'])
    ? $_FILES['poster']
    : null;
$result = media_stage_store(
    (int)$user['id'],
    $file,
    $prefer,
    $purpose === 'stories' ? 'stories' : 'posts',
    $poster
);
if (!$result['ok']) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $result['error']]);
    exit;
}

echo json_encode([
    'ok' => true,
    'token' => $result['token'],
    'kind' => $result['kind'],
    'mime' => $result['mime'],
    'size' => $result['size'],
], JSON_UNESCAPED_UNICODE);
