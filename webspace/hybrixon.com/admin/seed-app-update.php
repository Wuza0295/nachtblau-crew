<?php
declare(strict_types=1);

/**
 * One-shot: @Hybrixon announces Android app update (re-download APK).
 * Protect with ?key=… matching data/seed.key or HYBRIXON_SEED_KEY.
 */

require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/includes/posts.php';
require_once dirname(__DIR__) . '/includes/official.php';
require_once dirname(__DIR__) . '/includes/discover.php';

header('Content-Type: text/plain; charset=utf-8');

$expected = getenv('HYBRIXON_SEED_KEY') ?: '';
$keyFile = ALLXION_DATA . '/seed.key';
if ($expected === '' && is_file($keyFile)) {
    $expected = trim((string)file_get_contents($keyFile));
}
$given = (string)($_GET['key'] ?? '');
if ($expected === '' || $given === '' || !hash_equals($expected, $given)) {
    http_response_code(403);
    exit("Forbidden\n");
}

$pdo = allxion_db();
hybrixon_ensure_official_account($pdo);

$username = HYBRIXON_OFFICIAL_USERNAME;
$marker = 'Hybrixon App Update 1.0.2';
$body = <<<TXT
{$marker}

Die Hybrixon-App hat ein Update (v1.0.2).

Bitte die APK noch einmal herunterladen und installieren — Updates kommen nicht automatisch über den Play Store.

Was neu ist:
• Mehrfachauswahl: bis 15 Bilder und/oder 15 Videos
• Videos bis 500 MB / 15 Minuten
• Stabile Uploads (kein „Request Entity Too Large“)
• Mobile Website öffnet die App, wenn sie installiert ist

Download: https://hybrixon.com/app.php

Closer. Freer.
— Hybrixon
TXT;

$stmt = $pdo->prepare('SELECT id FROM users WHERE lower(username) = lower(?) LIMIT 1');
$stmt->execute([$username]);
$userId = (int)($stmt->fetchColumn() ?: 0);
if ($userId <= 0) {
    http_response_code(500);
    exit("Official account @{$username} missing\n");
}

$exists = $pdo->prepare(
    "SELECT id FROM posts
     WHERE user_id = ? AND body LIKE ?
       AND moderation_status != 'removed'
     LIMIT 1"
);
$exists->execute([$userId, $marker . '%']);
$existingId = (int)($exists->fetchColumn() ?: 0);
if ($existingId > 0) {
    echo "OK already posted #{$existingId} as @{$username}\n";
    exit;
}

$src = ALLXION_ROOT . '/assets/img/welcome-logo.png';
if (!is_file($src)) {
    $src = ALLXION_ROOT . '/assets/img/logo-avatar.png';
}
if (!is_file($src)) {
    http_response_code(500);
    exit("Missing brand image\n");
}

$dir = ALLXION_UPLOADS . '/posts';
if (!is_dir($dir)) {
    mkdir($dir, 0750, true);
}
$ext = strtolower(pathinfo($src, PATHINFO_EXTENSION)) ?: 'png';
$name = bin2hex(random_bytes(16)) . '.' . $ext;
$dest = $dir . '/' . $name;
if (!copy($src, $dest)) {
    http_response_code(500);
    exit("Could not store image\n");
}
@chmod($dest, 0640);
$rel = 'posts/' . $name;
$mime = $ext === 'webp' ? 'image/webp' : ($ext === 'jpg' || $ext === 'jpeg' ? 'image/jpeg' : 'image/png');

// Bypass location/review gates for the official brand account
$pdo->prepare(
    "UPDATE users SET
        city = COALESCE(NULLIF(city, ''), 'Berlin'),
        age_status = 'approved',
        age_verified_at = COALESCE(age_verified_at, datetime('now'))
     WHERE id = ?"
)->execute([$userId]);

$errors = allxion_create_post(
    $userId,
    $body,
    false,
    false,
    [[
        'stored_path' => $rel,
        'stored_mime' => $mime,
    ]],
    null,
    'post',
    true
);

if ($errors) {
    // Fallback direct insert if create_post rejects for any policy reason
    $ins = $pdo->prepare(
        "INSERT INTO posts (user_id, body, is_adult, image_path, image_mime, moderation_status, post_type, created_at)
         VALUES (?, ?, 0, ?, ?, 'ok', 'post', datetime('now'))"
    );
    $ins->execute([$userId, $body, $rel, $mime]);
    $postId = (int)$pdo->lastInsertId();
    $pdo->prepare(
        'INSERT INTO post_media (post_id, kind, path, mime, sort_order, duration_sec) VALUES (?, ?, ?, ?, 0, NULL)'
    )->execute([$postId, 'image', $rel, $mime]);
    if (function_exists('discover_index_post')) {
        discover_index_post($postId, $userId, $body);
    }
    echo "OK fallback post #{$postId} as @{$username}\n";
    echo "note=" . implode(' | ', $errors) . "\n";
    exit;
}

$postId = (int)$pdo->query('SELECT id FROM posts WHERE user_id = ' . (int)$userId . ' ORDER BY id DESC LIMIT 1')->fetchColumn();
echo "OK posted #{$postId} as @{$username}\n";
echo "image={$rel}\n";
echo "url=https://hybrixon.com/post.php?id={$postId}\n";
