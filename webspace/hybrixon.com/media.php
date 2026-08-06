<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/posts.php';

$postId = (int)($_GET['id'] ?? 0);
if ($postId <= 0) {
    http_response_code(404);
    exit('Not found');
}

$stmt = allxion_db()->prepare(
    "SELECT id, user_id, is_adult, image_path, image_mime, moderation_status
     FROM posts WHERE id = ?"
);
$stmt->execute([$postId]);
$post = $stmt->fetch();
if (!$post || empty($post['image_path']) || ($post['moderation_status'] ?? '') === 'removed') {
    http_response_code(404);
    exit('Not found');
}

$viewer = allxion_current_user();
if (!allxion_can_view_post_image($post, $viewer)) {
    http_response_code(403);
    exit('Forbidden');
}

$path = (string)$post['image_path'];
if (!preg_match('#^posts/[a-f0-9]+\.(jpg|png|webp)$#', $path)) {
    http_response_code(404);
    exit('Not found');
}

$full = ALLXION_UPLOADS . '/' . $path;
if (!is_file($full)) {
    http_response_code(404);
    exit('Not found');
}

$mime = (string)($post['image_mime'] ?: 'application/octet-stream');
header('Content-Type: ' . $mime);
header('Content-Length: ' . (string)filesize($full));
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store');
readfile($full);
exit;
