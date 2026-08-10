<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/media_upload.php';
require_once __DIR__ . '/includes/stories.php';
require_once __DIR__ . '/includes/albums.php';
require_once __DIR__ . '/includes/social.php';

$mediaId = (int)($_GET['m'] ?? 0);
$postId = (int)($_GET['id'] ?? 0);
$avatarUser = (int)($_GET['avatar'] ?? 0);
$bannerUser = (int)($_GET['banner'] ?? 0);
$storyId = (int)($_GET['story'] ?? 0);
$albumPhotoId = (int)($_GET['album_photo'] ?? 0);

$path = null;
$mime = null;
$isAdult = false;

if ($storyId > 0) {
    $stmt = allxion_db()->prepare(
        'SELECT s.*, u.username, u.privacy_stories, u.banned_at, u.id AS owner_id
         FROM stories s JOIN users u ON u.id = s.user_id WHERE s.id = ?'
    );
    $stmt->execute([$storyId]);
    $row = $stmt->fetch();
    $viewer = allxion_current_user();
    if ($row && stories_can_view($viewer, [
        'id' => (int)$row['owner_id'],
        'privacy_stories' => $row['privacy_stories'],
        'banned_at' => $row['banned_at'],
    ]) && strtotime((string)$row['expires_at']) > time()) {
        if (!empty($row['is_adult'])) {
            if (!$viewer || !user_age_verified($viewer)) {
                http_response_code(403);
                exit('Forbidden');
            }
        }
        $path = (string)$row['media_path'];
        $mime = (string)($row['media_mime'] ?: 'application/octet-stream');
    }
} elseif ($albumPhotoId > 0) {
    $stmt = allxion_db()->prepare(
        'SELECT ap.*, a.privacy, a.user_id AS owner_id, u.banned_at
         FROM album_photos ap
         JOIN albums a ON a.id = ap.album_id
         JOIN users u ON u.id = a.user_id
         WHERE ap.id = ?'
    );
    $stmt->execute([$albumPhotoId]);
    $row = $stmt->fetch();
    $viewer = allxion_current_user();
    if ($row) {
        $ownerStmt = allxion_db()->prepare('SELECT * FROM users WHERE id = ?');
        $ownerStmt->execute([(int)$row['owner_id']]);
        $owner = $ownerStmt->fetch();
        $album = ['privacy' => $row['privacy'], 'user_id' => $row['owner_id']];
        if ($owner && albums_can_view($viewer, $album, $owner)) {
            $path = (string)$row['path'];
            $mime = (string)($row['mime'] ?: 'image/jpeg');
        }
    }
} elseif ($mediaId > 0) {
    $stmt = allxion_db()->prepare(
        'SELECT pm.*, p.is_adult, p.moderation_status
         FROM post_media pm JOIN posts p ON p.id = pm.post_id WHERE pm.id = ?'
    );
    $stmt->execute([$mediaId]);
    $row = $stmt->fetch();
    if ($row && ($row['moderation_status'] ?? '') !== 'removed') {
        $path = (string)$row['path'];
        $mime = (string)($row['mime'] ?: 'application/octet-stream');
        $isAdult = !empty($row['is_adult']);
    }
} elseif ($postId > 0) {
    $stmt = allxion_db()->prepare(
        "SELECT id, is_adult, image_path, image_mime, video_path, video_mime, moderation_status
         FROM posts WHERE id = ?"
    );
    $stmt->execute([$postId]);
    $post = $stmt->fetch();
    if ($post && ($post['moderation_status'] ?? '') !== 'removed') {
        $kind = (string)($_GET['kind'] ?? 'image');
        if ($kind === 'video' && !empty($post['video_path'])) {
            $path = (string)$post['video_path'];
            $mime = (string)($post['video_mime'] ?: 'video/mp4');
        } elseif (!empty($post['image_path'])) {
            $path = (string)$post['image_path'];
            $mime = (string)($post['image_mime'] ?: 'image/jpeg');
        }
        $isAdult = !empty($post['is_adult']);
    }
} elseif ($avatarUser > 0) {
    $stmt = allxion_db()->prepare('SELECT avatar_path, banned_at FROM users WHERE id = ?');
    $stmt->execute([$avatarUser]);
    $u = $stmt->fetch();
    if ($u && empty($u['banned_at']) && !empty($u['avatar_path'])) {
        $path = (string)$u['avatar_path'];
        $mime = 'image/jpeg';
        if (str_ends_with($path, '.png')) {
            $mime = 'image/png';
        } elseif (str_ends_with($path, '.webp')) {
            $mime = 'image/webp';
        }
    }
} elseif ($bannerUser > 0) {
    $stmt = allxion_db()->prepare('SELECT banner_path, banned_at FROM users WHERE id = ?');
    $stmt->execute([$bannerUser]);
    $u = $stmt->fetch();
    if ($u && empty($u['banned_at']) && !empty($u['banner_path'])) {
        $path = (string)$u['banner_path'];
        $mime = 'image/jpeg';
        if (str_ends_with($path, '.png')) {
            $mime = 'image/png';
        } elseif (str_ends_with($path, '.webp')) {
            $mime = 'image/webp';
        }
    }
}

if ($path === null || $path === '') {
    http_response_code(404);
    exit('Not found');
}

if ($isAdult) {
    $user = allxion_current_user();
    if (!$user || !user_age_verified($user)) {
        http_response_code(403);
        exit('Forbidden');
    }
}

if (!preg_match('#^(posts|avatars|banners|videos|stories|albums)/[a-f0-9]+\.[a-z0-9]+$#i', $path)) {
    http_response_code(404);
    exit('Not found');
}

$full = ALLXION_UPLOADS . '/' . $path;
if (!is_file($full)) {
    http_response_code(404);
    exit('Not found');
}

$size = (int)filesize($full);
$isVideo = str_starts_with((string)$mime, 'video/');

header('Content-Type: ' . $mime);
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, max-age=3600');
header('Accept-Ranges: bytes');

// Byte-range support so large feed videos can seek without downloading everything.
$range = (string)($_SERVER['HTTP_RANGE'] ?? '');
if ($isVideo && $range !== '' && preg_match('/bytes=(\d*)-(\d*)/', $range, $m)) {
    // RFC 7233 suffix range: "bytes=-500000" means the LAST 500000 bytes.
    // MP4 players use this to fetch the moov metadata stored at EOF.
    if ($m[1] === '' && $m[2] !== '') {
        $suffixLength = max(1, (int)$m[2]);
        $start = max(0, $size - $suffixLength);
        $end = $size - 1;
    } else {
        $start = $m[1] !== '' ? (int)$m[1] : 0;
        $end = $m[2] !== '' ? (int)$m[2] : ($size - 1);
    }
    if ($start < 0 || $end < $start || $start >= $size) {
        http_response_code(416);
        header('Content-Range: bytes */' . $size);
        exit;
    }
    $end = min($end, $size - 1);
    $length = $end - $start + 1;
    http_response_code(206);
    header('Content-Length: ' . (string)$length);
    header('Content-Range: bytes ' . $start . '-' . $end . '/' . $size);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'HEAD') {
        exit;
    }
    $fp = fopen($full, 'rb');
    if ($fp === false) {
        http_response_code(500);
        exit('Read error');
    }
    fseek($fp, $start);
    $remaining = $length;
    while ($remaining > 0 && !feof($fp)) {
        // Larger chunks reduce PHP loop/Apache buffering overhead substantially.
        $chunk = fread($fp, (int)min(1024 * 1024, $remaining));
        if ($chunk === false) {
            break;
        }
        echo $chunk;
        $remaining -= strlen($chunk);
        if (connection_aborted()) {
            break;
        }
    }
    fclose($fp);
    exit;
}

header('Content-Length: ' . (string)$size);
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'HEAD') {
    exit;
}
readfile($full);
exit;
