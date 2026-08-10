<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/push.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$user = allxion_current_user();
if (!$user) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Login required']);
    exit;
}

allxion_session_start_lite();
$raw = file_get_contents('php://input');
$data = is_string($raw) ? json_decode($raw, true) : null;
if (!is_array($data)) {
    $data = $_POST;
}
$csrf = (string)($data['_csrf'] ?? '');
if ($csrf === '' || !hash_equals((string)($_SESSION['_csrf'] ?? ''), $csrf)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'CSRF']);
    exit;
}

$sub = $data['subscription'] ?? $data;
if (!is_array($sub)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid subscription']);
    exit;
}

$ok = hybrixon_push_subscribe(
    (int)$user['id'],
    $sub,
    (string)($_SERVER['HTTP_USER_AGENT'] ?? '')
);
if (!$ok) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid subscription']);
    exit;
}

echo json_encode(['ok' => true]);
