<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/official.php';

function hybrixon_app_release_body(): string
{
    $version = HYBRIXON_ANDROID_APP_VERSION;
    $lines = [
        "Hybrixon App Update {$version}",
        '',
        "Die neue Android-App-Version {$version} ist verfügbar.",
        '',
        'Was neu ist:',
    ];
    foreach (HYBRIXON_ANDROID_APP_RELEASE_NOTES as $note) {
        $note = trim((string)$note);
        if ($note !== '') {
            $lines[] = '• ' . $note;
        }
    }
    $lines[] = '';
    $lines[] = 'Download und Installation: https://hybrixon.com/app.php';
    $lines[] = '';
    $lines[] = 'Closer. Freer.';
    $lines[] = '— @Hybrixon';
    return implode("\n", $lines);
}

/**
 * Publish exactly one official post for the configured Android release.
 *
 * A small file stamp keeps the normal request path at one stat call. The
 * database marker remains the source of truth if a stamp is ever deleted.
 */
function hybrixon_publish_configured_app_release(PDO $pdo): ?int
{
    $version = trim(HYBRIXON_ANDROID_APP_VERSION);
    if ($version === '') {
        return null;
    }
    $releaseKey = hash('sha256', $version);
    $stamp = ALLXION_DATA . '/.app-release-' . $releaseKey . '.posted';
    if (is_file($stamp)) {
        return null;
    }

    $lock = @fopen(ALLXION_DATA . '/.app-release.lock', 'c');
    if ($lock === false || !@flock($lock, LOCK_EX | LOCK_NB)) {
        if (is_resource($lock)) {
            fclose($lock);
        }
        return null;
    }

    $storedImage = null;
    try {
        clearstatcache(true, $stamp);
        if (is_file($stamp)) {
            return null;
        }

        hybrixon_ensure_official_account($pdo);
        $findUser = $pdo->prepare(
            'SELECT id FROM users WHERE lower(username) = lower(?) LIMIT 1'
        );
        $findUser->execute([HYBRIXON_OFFICIAL_USERNAME]);
        $userId = (int)($findUser->fetchColumn() ?: 0);
        if ($userId <= 0) {
            return null;
        }

        $marker = "Hybrixon App Update {$version}";
        $exists = $pdo->prepare(
            "SELECT id FROM posts
             WHERE user_id = ? AND body LIKE ? AND moderation_status != 'removed'
             ORDER BY id DESC LIMIT 1"
        );
        $exists->execute([$userId, $marker . '%']);
        $existingId = (int)($exists->fetchColumn() ?: 0);
        if ($existingId > 0) {
            @file_put_contents($stamp, (string)$existingId, LOCK_EX);
            return $existingId;
        }

        $source = ALLXION_ROOT . '/assets/img/logo-avatar.png';
        if (!is_file($source)) {
            return null;
        }
        $uploadDir = ALLXION_UPLOADS . '/posts';
        if (!is_dir($uploadDir) && !@mkdir($uploadDir, 0750, true) && !is_dir($uploadDir)) {
            return null;
        }
        $extension = strtolower(pathinfo($source, PATHINFO_EXTENSION)) ?: 'png';
        $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        $destination = $uploadDir . '/' . $filename;
        if (!@copy($source, $destination)) {
            return null;
        }
        @chmod($destination, 0640);
        $storedImage = 'posts/' . $filename;
        $mime = $extension === 'webp'
            ? 'image/webp'
            : (in_array($extension, ['jpg', 'jpeg'], true) ? 'image/jpeg' : 'image/png');
        $body = hybrixon_app_release_body();

        $pdo->beginTransaction();
        $insert = $pdo->prepare(
            "INSERT INTO posts (
                user_id, body, is_adult, image_path, image_mime,
                moderation_status, post_type, created_at
             ) VALUES (?, ?, 0, ?, ?, 'ok', 'post', datetime('now'))"
        );
        $insert->execute([$userId, $body, $storedImage, $mime]);
        $postId = (int)$pdo->lastInsertId();
        $pdo->prepare(
            'INSERT INTO post_media (
                post_id, kind, path, mime, sort_order, duration_sec
             ) VALUES (?, ?, ?, ?, 0, NULL)'
        )->execute([$postId, 'image', $storedImage, $mime]);
        $pdo->commit();

        try {
            require_once __DIR__ . '/discover.php';
            if (function_exists('discover_index_post')) {
                discover_index_post($postId, $userId, $body);
            }
        } catch (Throwable) {
            // The release post is valid even if discovery indexing retries later.
        }
        @file_put_contents($stamp, (string)$postId, LOCK_EX);
        return $postId;
    } catch (Throwable) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        if ($storedImage !== null) {
            @unlink(ALLXION_UPLOADS . '/' . $storedImage);
        }
        return null;
    } finally {
        @flock($lock, LOCK_UN);
        fclose($lock);
    }
}
