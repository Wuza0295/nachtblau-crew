<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/media_upload.php';
require_once __DIR__ . '/friends.php';
require_once __DIR__ . '/social.php';
require_once __DIR__ . '/blocks.php';

/** @return list<string> */
function stories_create(array $user, array $file, string $caption = '', bool $isAdult = false): array
{
    $caption = trim($caption);
    if (mb_strlen($caption) > 300) {
        return ['Caption max. 300 Zeichen.'];
    }
    if ($isAdult && !user_age_verified($user)) {
        return ['Soft-18+ Stories nur mit Freischaltung.'];
    }

    // Already staged upload (sequential client upload to avoid HTTP 413)
    if (isset($file['stored_path'], $file['stored_mime'], $file['stored_kind'])) {
        $kind = (string)$file['stored_kind'] === 'video' ? 'video' : 'image';
        $path = (string)$file['stored_path'];
        $mime = (string)$file['stored_mime'];
    } else {
        $kindHint = (string)($file['type'] ?? '');
        $tmp = (string)($file['tmp_name'] ?? '');
        if ($tmp !== '' && is_uploaded_file($tmp)) {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $detected = (string)$finfo->file($tmp);
            if ($detected !== '') {
                $kindHint = $detected;
            }
        }
        $isVideo = str_starts_with($kindHint, 'video/')
            || in_array($kindHint, MEDIA_VIDEO_MIMES, true);

        if ($isVideo) {
            $stored = media_store_video($file);
            if (!$stored['ok']) {
                return [$stored['error']];
            }
            $kind = 'video';
            $path = $stored['path'];
            $mime = $stored['mime'];
        } else {
            $stored = media_store_image($file, 'stories');
            if (!$stored['ok']) {
                return [$stored['error']];
            }
            $kind = 'image';
            $path = $stored['path'];
            $mime = $stored['mime'];
        }
    }

    $hours = max(1, (int)STORY_TTL_HOURS);
    allxion_db()->prepare(
        "INSERT INTO stories (user_id, media_path, media_mime, media_kind, caption, is_adult, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+{$hours} hours'))"
    )->execute([
        (int)$user['id'],
        $path,
        $mime,
        $kind,
        $caption !== '' ? $caption : null,
        $isAdult ? 1 : 0,
    ]);
    return [];
}

/**
 * Detect whether an upload looks like video (MIME / finfo).
 */
function stories_file_is_video(array $file): bool
{
    if (isset($file['stored_kind'])) {
        return (string)$file['stored_kind'] === 'video';
    }
    $kindHint = (string)($file['type'] ?? '');
    $tmp = (string)($file['tmp_name'] ?? '');
    if ($tmp !== '' && is_uploaded_file($tmp)) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detected = (string)$finfo->file($tmp);
        if ($detected !== '') {
            $kindHint = $detected;
        }
    }
    return str_starts_with($kindHint, 'video/')
        || in_array($kindHint, MEDIA_VIDEO_MIMES, true);
}

/**
 * Create one story slide per selected file (up to 15 images and/or 15 videos).
 *
 * @param list<array<string,mixed>> $files
 * @return list<string>
 */
function stories_create_many(array $user, array $files, string $caption = '', bool $isAdult = false): array
{
    if ($files === []) {
        return ['Bitte Bild oder Video wählen.'];
    }
    $images = [];
    $videos = [];
    foreach ($files as $file) {
        if (stories_file_is_video($file)) {
            $videos[] = $file;
        } else {
            $images[] = $file;
        }
    }
    if (count($images) > MEDIA_STORY_IMAGES_MAX) {
        return ['Maximal ' . MEDIA_STORY_IMAGES_MAX . ' Bilder pro Story-Upload.'];
    }
    if (count($videos) > MEDIA_STORY_VIDEOS_MAX) {
        return ['Maximal ' . MEDIA_STORY_VIDEOS_MAX . ' Videos pro Story-Upload.'];
    }
    foreach (array_merge($images, $videos) as $file) {
        $errors = stories_create($user, $file, $caption, $isAdult);
        if ($errors) {
            return $errors;
        }
    }
    return [];
}

function stories_can_view(?array $viewer, array $owner): bool
{
    if (!empty($owner['banned_at'])) {
        return false;
    }
    if ($viewer && ((int)$viewer['id'] === (int)$owner['id'] || user_is_admin($viewer))) {
        return true;
    }
    $level = (string)($owner['privacy_stories'] ?? 'friends');
    if ($level === 'public') {
        return true;
    }
    if ($level === 'private' || !$viewer) {
        return false;
    }
    if ($level === 'followers') {
        return social_is_following((int)$viewer['id'], (int)$owner['id']);
    }
    // friends
    return friends_are_friends((int)$viewer['id'], (int)$owner['id']);
}

/**
 * Active story authors for tray.
 * @return list<array<string,mixed>>
 */
function stories_tray(?array $viewer): array
{
    $sql = <<<'SQL'
SELECT u.id, u.username, u.display_name, u.avatar_path, u.privacy_stories, u.banned_at,
  MAX(s.created_at) AS latest_at,
  COUNT(s.id) AS story_count
FROM stories s
JOIN users u ON u.id = s.user_id
WHERE s.expires_at > datetime('now')
  AND (u.banned_at IS NULL OR u.banned_at = '')
GROUP BY u.id
ORDER BY latest_at DESC
LIMIT 40
SQL;
    $rows = allxion_db()->query($sql)->fetchAll();
    $out = [];
    foreach ($rows as $row) {
        if (!stories_can_view($viewer, $row)) {
            continue;
        }
        if ($viewer && social_is_blocked((int)$viewer['id'], (int)$row['id'])) {
            continue;
        }
        $unseen = 0;
        if ($viewer) {
            $q = allxion_db()->prepare(
                "SELECT COUNT(*) FROM stories s
                 LEFT JOIN story_views v ON v.story_id = s.id AND v.viewer_id = ?
                 WHERE s.user_id = ? AND s.expires_at > datetime('now') AND v.story_id IS NULL"
            );
            $q->execute([(int)$viewer['id'], (int)$row['id']]);
            $unseen = (int)$q->fetchColumn();
        } else {
            $unseen = (int)$row['story_count'];
        }
        $row['unseen'] = $unseen;
        $out[] = $row;
    }
    return $out;
}

/** @return list<array<string,mixed>> */
function stories_for_user(int $ownerId, ?array $viewer): array
{
    $owner = allxion_db()->prepare('SELECT * FROM users WHERE id = ?');
    $owner->execute([$ownerId]);
    $o = $owner->fetch();
    if (!$o || !stories_can_view($viewer, $o)) {
        return [];
    }
    $stmt = allxion_db()->prepare(
        "SELECT * FROM stories WHERE user_id = ? AND expires_at > datetime('now') ORDER BY created_at ASC"
    );
    $stmt->execute([$ownerId]);
    $rows = $stmt->fetchAll();
    if ($viewer) {
        $canAdult = user_age_verified($viewer);
        $rows = array_values(array_filter($rows, static function ($s) use ($canAdult) {
            return empty($s['is_adult']) || $canAdult;
        }));
    } else {
        $rows = array_values(array_filter($rows, static fn ($s) => empty($s['is_adult'])));
    }
    return $rows;
}

function stories_mark_viewed(int $storyId, int $viewerId): void
{
    allxion_db()->prepare(
        'INSERT OR IGNORE INTO story_views (story_id, viewer_id) VALUES (?, ?)'
    )->execute([$storyId, $viewerId]);
}
