<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

/**
 * @return array{ok: true, path: string, mime: string}|array{ok: false, error: string}
 */
function media_store_image(array $file, string $subdir = 'posts'): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return ['ok' => false, 'error' => 'Kein Bild gewählt.'];
    }
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        return ['ok' => false, 'error' => 'Upload fehlgeschlagen.'];
    }
    $size = (int)($file['size'] ?? 0);
    if ($size <= 0 || $size > MEDIA_IMAGE_MAX_BYTES) {
        return ['ok' => false, 'error' => 'Bild max. ' . (int)(MEDIA_IMAGE_MAX_BYTES / 1_000_000) . ' MB.'];
    }
    $tmp = (string)($file['tmp_name'] ?? '');
    if ($tmp === '' || !is_uploaded_file($tmp)) {
        return ['ok' => false, 'error' => 'Ungültiger Upload.'];
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string)$finfo->file($tmp);
    if (!in_array($mime, MEDIA_IMAGE_MIMES, true)) {
        return ['ok' => false, 'error' => 'Nur JPEG, PNG oder WebP erlaubt.'];
    }
    if (@getimagesize($tmp) === false) {
        return ['ok' => false, 'error' => 'Datei ist kein gültiges Bild.'];
    }
    $ext = match ($mime) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        default => 'bin',
    };
    return media_move_upload($tmp, $subdir, $ext, $mime);
}

/**
 * @return array{ok: true, path: string, mime: string, duration: ?int}|array{ok: false, error: string}
 */
function media_store_video(array $file, bool $probeDuration = true): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return ['ok' => false, 'error' => 'Kein Video gewählt.'];
    }
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        return ['ok' => false, 'error' => 'Video-Upload fehlgeschlagen.'];
    }
    $size = (int)($file['size'] ?? 0);
    if ($size <= 0 || $size > MEDIA_VIDEO_MAX_BYTES) {
        return ['ok' => false, 'error' => 'Video max. ' . (int)(MEDIA_VIDEO_MAX_BYTES / 1_000_000) . ' MB.'];
    }
    $tmp = (string)($file['tmp_name'] ?? '');
    if ($tmp === '' || !is_uploaded_file($tmp)) {
        return ['ok' => false, 'error' => 'Ungültiger Video-Upload.'];
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string)$finfo->file($tmp);
    if (!in_array($mime, MEDIA_VIDEO_MIMES, true)) {
        return ['ok' => false, 'error' => 'Nur MP4, WebM oder MOV erlaubt.'];
    }
    // Duration probe skipped by default during staging (reads up to 2 MB and is
    // often inconclusive when moov is at EOF). Enforce only when explicitly asked.
    $duration = null;
    if ($probeDuration) {
        $duration = media_probe_video_duration($tmp);
        if ($duration !== null && $duration > MEDIA_VIDEO_MAX_SECONDS) {
            return ['ok' => false, 'error' => 'Video max. ' . (int)(MEDIA_VIDEO_MAX_SECONDS / 60) . ' Minuten.'];
        }
    }
    $ext = match ($mime) {
        'video/mp4' => 'mp4',
        'video/webm' => 'webm',
        'video/quicktime' => 'mov',
        default => 'bin',
    };
    $stored = media_move_upload($tmp, 'videos', $ext, $mime);
    if (!$stored['ok']) {
        return $stored;
    }
    return ['ok' => true, 'path' => $stored['path'], 'mime' => $mime, 'duration' => $duration];
}

/**
 * @return array{ok: true, path: string, mime: string}|array{ok: false, error: string}
 */
function media_move_upload(string $tmp, string $subdir, string $ext, string $mime): array
{
    $subdir = preg_replace('/[^a-z0-9_-]/i', '', $subdir) ?: 'misc';
    $dir = ALLXION_UPLOADS . '/' . $subdir;
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }
    $name = bin2hex(random_bytes(16)) . '.' . $ext;
    $dest = $dir . '/' . $name;
    if (!move_uploaded_file($tmp, $dest)) {
        return ['ok' => false, 'error' => 'Datei konnte nicht gespeichert werden.'];
    }
    @chmod($dest, 0640);
    return ['ok' => true, 'path' => $subdir . '/' . $name, 'mime' => $mime];
}

function media_delete_path(?string $relativePath): void
{
    if ($relativePath === null || $relativePath === '') {
        return;
    }
    if (!preg_match('#^(posts|avatars|banners|videos|stories|albums)/[a-f0-9]+\.[a-z0-9]+$#i', $relativePath)) {
        return;
    }
    $full = ALLXION_UPLOADS . '/' . $relativePath;
    if (is_file($full)) {
        @unlink($full);
    }
}

/**
 * Copy an existing upload into another subdir (e.g. avatar → posts share).
 * @return array{ok: true, path: string, mime: string}|array{ok: false, error: string}
 */
function media_duplicate_image(string $relativePath, string $destSubdir = 'posts'): array
{
    if (!preg_match('#^(posts|avatars|banners|videos|stories|albums)/([a-f0-9]+\.[a-z0-9]+)$#i', $relativePath, $m)) {
        return ['ok' => false, 'error' => 'Ungültiger Medienpfad.'];
    }
    $src = ALLXION_UPLOADS . '/' . $relativePath;
    if (!is_file($src)) {
        return ['ok' => false, 'error' => 'Quelle nicht gefunden.'];
    }
    $destSubdir = preg_replace('/[^a-z0-9_-]/i', '', $destSubdir) ?: 'posts';
    $dir = ALLXION_UPLOADS . '/' . $destSubdir;
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }
    $ext = strtolower(pathinfo($m[2], PATHINFO_EXTENSION));
    $name = bin2hex(random_bytes(16)) . '.' . $ext;
    $dest = $dir . '/' . $name;
    if (!@copy($src, $dest)) {
        return ['ok' => false, 'error' => 'Kopie fehlgeschlagen.'];
    }
    @chmod($dest, 0640);
    $mime = match ($ext) {
        'png' => 'image/png',
        'webp' => 'image/webp',
        default => 'image/jpeg',
    };
    return ['ok' => true, 'path' => $destSubdir . '/' . $name, 'mime' => $mime];
}

/** Best-effort MP4/MOV duration (seconds); null if unknown. */
function media_probe_video_duration(string $path): ?int
{
    $fh = @fopen($path, 'rb');
    if (!$fh) {
        return null;
    }
    $data = (string)fread($fh, 2_000_000);
    fclose($fh);
    // Look for mvhd timescale/duration (ISO BMFF)
    $pos = strpos($data, 'mvhd');
    if ($pos === false || $pos + 24 >= strlen($data)) {
        return null;
    }
    $ver = ord($data[$pos + 4]);
    if ($ver === 0 && $pos + 24 < strlen($data)) {
        $timescale = unpack('N', substr($data, $pos + 16, 4))[1] ?? 0;
        $duration = unpack('N', substr($data, $pos + 20, 4))[1] ?? 0;
        if ($timescale > 0 && $duration > 0) {
            return (int)ceil($duration / $timescale);
        }
    }
    return null;
}

/**
 * Normalize multi-file $_FILES['images'] structure into list of file arrays.
 *
 * @return list<array<string,mixed>>
 */
function media_normalize_files(array $filesField): array
{
    $out = [];
    if (!isset($filesField['name'])) {
        return $out;
    }
    if (!is_array($filesField['name'])) {
        if (($filesField['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
            $out[] = $filesField;
        }
        return $out;
    }
    foreach ($filesField['name'] as $i => $name) {
        $err = $filesField['error'][$i] ?? UPLOAD_ERR_NO_FILE;
        if ($err === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        $out[] = [
            'name' => $name,
            'type' => $filesField['type'][$i] ?? '',
            'tmp_name' => $filesField['tmp_name'][$i] ?? '',
            'error' => $err,
            'size' => $filesField['size'][$i] ?? 0,
        ];
    }
    return $out;
}

function media_client_ip(): string
{
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
    return substr($ip, 0, 64);
}

/**
 * Stage one uploaded file in the user session (avoids HTTP 413 on huge multi-POSTs).
 *
 * @return array{ok: true, token: string, kind: string, mime: string, size: int}|array{ok: false, error: string}
 */
function media_stage_store(int $userId, array $file, string $prefer = 'auto', string $purpose = 'posts'): array
{
    require_once __DIR__ . '/helpers.php';

    // Validate + move BEFORE touching the session: the PHP session file is
    // locked for the whole request, which would serialize parallel uploads.
    $kindHint = strtolower((string)($file['type'] ?? ''));
    $isVideo = $prefer === 'video'
        || ($prefer === 'auto' && (str_starts_with($kindHint, 'video/') || in_array($kindHint, MEDIA_VIDEO_MIMES, true)));

    if ($prefer === 'image') {
        $isVideo = false;
    }

    if ($isVideo) {
        // Skip duration probe on the hot staging path (faster; moov often at EOF).
        $stored = media_store_video($file, false);
        if (!$stored['ok']) {
            return ['ok' => false, 'error' => (string)$stored['error']];
        }
        $kind = 'video';
        $entry = [
            'user_id' => $userId,
            'path' => $stored['path'],
            'mime' => $stored['mime'],
            'kind' => $kind,
            'duration' => $stored['duration'] ?? null,
            'created' => time(),
        ];
    } else {
        $subdir = $purpose === 'stories' ? 'stories' : 'posts';
        $stored = media_store_image($file, $subdir);
        if (!$stored['ok']) {
            return ['ok' => false, 'error' => (string)$stored['error']];
        }
        $kind = 'image';
        $entry = [
            'user_id' => $userId,
            'path' => $stored['path'],
            'mime' => $stored['mime'],
            'kind' => $kind,
            'duration' => null,
            'created' => time(),
        ];
    }

    // Session only for the short token registration, not during file I/O.
    allxion_session_start_lite();
    if (!isset($_SESSION['hybrixon_media_stage']) || !is_array($_SESSION['hybrixon_media_stage'])) {
        $_SESSION['hybrixon_media_stage'] = [];
    }
    // Drop stale staged files (>2h)
    foreach ($_SESSION['hybrixon_media_stage'] as $tok => $row) {
        if (!is_array($row) || (int)($row['created'] ?? 0) < time() - 7200) {
            if (is_array($row) && !empty($row['path'])) {
                media_delete_path((string)$row['path']);
            }
            unset($_SESSION['hybrixon_media_stage'][$tok]);
        }
    }

    $token = bin2hex(random_bytes(16));
    $_SESSION['hybrixon_media_stage'][$token] = $entry;

    return [
        'ok' => true,
        'token' => $token,
        'kind' => $kind,
        'mime' => (string)$entry['mime'],
        'size' => (int)($file['size'] ?? 0),
    ];
}

/**
 * Take staged media tokens for this user (removes them from the session).
 *
 * @param list<string>|mixed $tokens
 * @return list<array{stored_path: string, stored_mime: string, stored_kind: string, stored_duration: ?int}>
 */
function media_stage_take_many(mixed $tokens, int $userId): array
{
    require_once __DIR__ . '/helpers.php';
    allxion_session_start_lite();

    if (!is_array($tokens)) {
        return [];
    }
    $bag = $_SESSION['hybrixon_media_stage'] ?? [];
    if (!is_array($bag)) {
        return [];
    }

    $out = [];
    foreach ($tokens as $token) {
        $token = (string)$token;
        if ($token === '' || !isset($bag[$token]) || !is_array($bag[$token])) {
            continue;
        }
        $row = $bag[$token];
        unset($_SESSION['hybrixon_media_stage'][$token]);
        if ((int)($row['user_id'] ?? 0) !== $userId) {
            continue;
        }
        if ((int)($row['created'] ?? 0) < time() - 7200) {
            media_delete_path((string)($row['path'] ?? ''));
            continue;
        }
        $out[] = [
            'stored_path' => (string)$row['path'],
            'stored_mime' => (string)$row['mime'],
            'stored_kind' => (string)($row['kind'] ?? 'image'),
            'stored_duration' => isset($row['duration']) ? (is_null($row['duration']) ? null : (int)$row['duration']) : null,
        ];
    }
    return $out;
}
