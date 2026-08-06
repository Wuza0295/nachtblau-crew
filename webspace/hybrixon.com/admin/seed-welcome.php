<?php
declare(strict_types=1);

/**
 * One-shot seed: HybrixonTeam welcome post + large logo.
 * Protect with ?key=… then delete this file from the server.
 */

require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/includes/posts.php';

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

$username = 'HybrixonTeam';
$email = 'team@hybrixon.com';
$body = <<<'TXT'
Willkommen bei Hybrixon.

Alles kann, nichts muss.
Nur eines bleibt hart: keine 18++ / pornografischen Inhalte, keine Waffen und keine Gewalt.

Ansonsten seid euch nah, schreibt, teilt, flirtet soft — fühlt euch frei.
Closer. Freer.

— Hybrixon Team
TXT;

$pdo = allxion_db();

// Ensure brand account
$stmt = $pdo->prepare('SELECT id FROM users WHERE lower(username) = lower(?) LIMIT 1');
$stmt->execute([$username]);
$userId = (int)($stmt->fetchColumn() ?: 0);
$createdUser = false;
$tempPassword = null;

if ($userId <= 0) {
    $tempPassword = bin2hex(random_bytes(12));
    $hash = password_hash($tempPassword, PASSWORD_DEFAULT);
    $ins = $pdo->prepare(
        "INSERT INTO users (
            username, email, password_hash, birthdate,
            age_status, age_verified_at, age_reviewed_at, age_provider,
            legal_accepted_at, legal_docs_version, is_admin, created_at
         ) VALUES (?, ?, ?, '1990-01-01', 'approved', datetime('now'), datetime('now'), 'admin',
                   datetime('now'), 'seed', 0, datetime('now'))"
    );
    try {
        $ins->execute([$username, $email, $hash]);
    } catch (PDOException $e) {
        // email collision — retry with unique mail
        $email = 'team+' . bin2hex(random_bytes(3)) . '@hybrixon.com';
        $ins->execute([$username, $email, $hash]);
    }
    $userId = (int)$pdo->lastInsertId();
    $createdUser = true;
} else {
    // Keep team account Soft-18+ ready for future brand posts
    $pdo->prepare(
        "UPDATE users
         SET age_status = 'approved',
             age_verified_at = COALESCE(age_verified_at, datetime('now')),
             age_provider = CASE WHEN age_provider IS NULL OR age_provider = 'none' THEN 'admin' ELSE age_provider END
         WHERE id = ?"
    )->execute([$userId]);
}

// Idempotent: skip if welcome already exists
$exists = $pdo->prepare(
    "SELECT id FROM posts
     WHERE user_id = ? AND body LIKE 'Willkommen bei Hybrixon.%'
     AND moderation_status != 'removed'
     LIMIT 1"
);
$exists->execute([$userId]);
$existingId = (int)($exists->fetchColumn() ?: 0);
if ($existingId > 0) {
    echo "OK already seeded post #{$existingId} as @{$username}\n";
    exit;
}

$src = ALLXION_ROOT . '/assets/img/welcome-logo.png';
if (!is_file($src)) {
    http_response_code(500);
    exit("Missing assets/img/welcome-logo.png\n");
}

$dir = ALLXION_UPLOADS . '/posts';
if (!is_dir($dir)) {
    mkdir($dir, 0750, true);
}
$name = bin2hex(random_bytes(16)) . '.png';
$dest = $dir . '/' . $name;
if (!copy($src, $dest)) {
    http_response_code(500);
    exit("Could not store logo image\n");
}
@chmod($dest, 0640);

$rel = 'posts/' . $name;
$insPost = $pdo->prepare(
    "INSERT INTO posts (user_id, body, is_adult, image_path, image_mime, moderation_status, created_at)
     VALUES (?, ?, 0, ?, 'image/png', 'ok', datetime('now'))"
);
$insPost->execute([$userId, $body, $rel]);
$postId = (int)$pdo->lastInsertId();

echo "OK seeded welcome post #{$postId} as @{$username}\n";
echo "image={$rel}\n";
if ($createdUser && $tempPassword !== null) {
    echo "created_user=1\n";
    echo "temp_password={$tempPassword}\n";
    echo "Change this password after first login.\n";
} else {
    echo "created_user=0\n";
}
