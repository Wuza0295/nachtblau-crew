<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/profile.php';

$userId = (int)($_GET['u'] ?? 0);
$type = (string)($_GET['t'] ?? '');
if ($userId <= 0 || !in_array($type, ['avatar', 'banner'], true)) {
    http_response_code(404);
    exit('Not found');
}

$user = profile_find_by_id($userId);
if (!$user) {
    http_response_code(404);
    exit('Not found');
}

$rel = $type === 'avatar' ? ($user['avatar_path'] ?? null) : ($user['banner_path'] ?? null);
if (!is_string($rel) || $rel === '') {
    http_response_code(404);
    exit('Not found');
}
if (!preg_match('#^(avatars|banners)/[a-zA-Z0-9._-]+\.(jpg|png|webp)$#', $rel)) {
    http_response_code(404);
    exit('Not found');
}

$full = ALLXION_UPLOADS . '/' . $rel;
if (!is_file($full)) {
    http_response_code(404);
    exit('Not found');
}

$ext = strtolower(pathinfo($full, PATHINFO_EXTENSION));
$mime = match ($ext) {
    'jpg', 'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'webp' => 'image/webp',
    default => 'application/octet-stream',
};

header('Content-Type: ' . $mime);
header('Content-Length: ' . (string)filesize($full));
header('X-Content-Type-Options: nosniff');
header('Cache-Control: public, max-age=3600');
readfile($full);
exit;
