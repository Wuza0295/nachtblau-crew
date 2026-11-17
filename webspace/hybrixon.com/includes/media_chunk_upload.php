<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/media_upload.php';

function media_chunk_root(): string
{
    $root = ALLXION_DATA . '/media-chunks';
    if (!is_dir($root)) {
        mkdir($root, 0750, true);
    }
    return $root;
}

function media_chunk_valid_id(string $uploadId): bool
{
    return preg_match('/^[a-f0-9]{40}$/D', $uploadId) === 1;
}

function media_chunk_dir(int $userId, string $uploadId): string
{
    return media_chunk_root() . '/' . $userId . '/' . $uploadId;
}

/** @return array<string, mixed>|null */
function media_chunk_manifest(int $userId, string $uploadId): ?array
{
    if (!media_chunk_valid_id($uploadId)) {
        return null;
    }
    $raw = @file_get_contents(media_chunk_dir($userId, $uploadId) . '/manifest.json');
    if (!is_string($raw)) {
        return null;
    }
    $manifest = json_decode($raw, true);
    if (!is_array($manifest) || (int)($manifest['user_id'] ?? 0) !== $userId) {
        return null;
    }
    return $manifest;
}

function media_chunk_remove_tree(string $dir): void
{
    if (!is_dir($dir) || !str_starts_with($dir, media_chunk_root() . '/')) {
        return;
    }
    $items = scandir($dir);
    if (is_array($items)) {
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $path = $dir . '/' . $item;
            if (is_dir($path)) {
                media_chunk_remove_tree($path);
            } else {
                @unlink($path);
            }
        }
    }
    @rmdir($dir);
}

function media_chunk_cleanup(int $userId): void
{
    $cutoff = time() - MEDIA_UPLOAD_CHUNK_TTL_SECONDS;
    $userRoot = media_chunk_root() . '/' . $userId;
    foreach (glob($userRoot . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
        $created = @filemtime($dir . '/manifest.json');
        if ($created !== false && $created < $cutoff) {
            media_chunk_remove_tree($dir);
        }
    }
    $receiptRoot = media_chunk_root() . '/completed';
    foreach (glob($receiptRoot . '/' . $userId . '-*.json') ?: [] as $receipt) {
        $created = @filemtime($receipt);
        if ($created !== false && $created < $cutoff) {
            @unlink($receipt);
        }
    }
}

/**
 * @return array{ok: true, upload_id: string, chunk_size: int, chunk_count: int}|array{ok: false, error: string}
 */
function media_chunk_init(int $userId, string $name, string $mime, int $size): array
{
    if ($size <= 0 || $size > MEDIA_VIDEO_MAX_BYTES) {
        return ['ok' => false, 'error' => 'Video max. ' . (int)(MEDIA_VIDEO_MAX_BYTES / 1_000_000) . ' MB.'];
    }
    if ($mime !== '' && !str_starts_with(strtolower($mime), 'video/')) {
        return ['ok' => false, 'error' => 'Nur Videos können in Blöcken hochgeladen werden.'];
    }
    if (random_int(1, 20) === 1) {
        media_chunk_cleanup($userId);
    }

    $uploadId = bin2hex(random_bytes(20));
    $userRoot = media_chunk_root() . '/' . $userId;
    if (!is_dir($userRoot)) {
        mkdir($userRoot, 0750, true);
    }
    $dir = $userRoot . '/' . $uploadId;
    if (!mkdir($dir, 0750, true)) {
        return ['ok' => false, 'error' => 'Chunk-Upload konnte nicht gestartet werden.'];
    }
    $chunkSize = MEDIA_UPLOAD_CHUNK_BYTES;
    $chunkCount = (int)ceil($size / $chunkSize);
    $manifest = [
        'user_id' => $userId,
        'name' => mb_substr($name, 0, 240),
        'mime_hint' => mb_substr($mime, 0, 100),
        'size' => $size,
        'chunk_size' => $chunkSize,
        'chunk_count' => $chunkCount,
        'created' => time(),
    ];
    if (@file_put_contents(
        $dir . '/manifest.json',
        json_encode($manifest, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        LOCK_EX
    ) === false) {
        media_chunk_remove_tree($dir);
        return ['ok' => false, 'error' => 'Chunk-Upload konnte nicht vorbereitet werden.'];
    }
    return [
        'ok' => true,
        'upload_id' => $uploadId,
        'chunk_size' => $chunkSize,
        'chunk_count' => $chunkCount,
    ];
}

/**
 * @return array{ok: true, index: int}|array{ok: false, error: string}
 */
function media_chunk_store_part(int $userId, string $uploadId, int $index, array $file): array
{
    $manifest = media_chunk_manifest($userId, $uploadId);
    if ($manifest === null) {
        return ['ok' => false, 'error' => 'Chunk-Upload ist abgelaufen.'];
    }
    $chunkCount = (int)$manifest['chunk_count'];
    $chunkSize = (int)$manifest['chunk_size'];
    $totalSize = (int)$manifest['size'];
    if ($index < 0 || $index >= $chunkCount) {
        return ['ok' => false, 'error' => 'Ungültiger Video-Block.'];
    }
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return ['ok' => false, 'error' => 'Video-Block konnte nicht übertragen werden.'];
    }
    $expected = min($chunkSize, $totalSize - ($index * $chunkSize));
    $actual = (int)($file['size'] ?? 0);
    $tmp = (string)($file['tmp_name'] ?? '');
    if ($tmp === '' || !is_uploaded_file($tmp) || $actual !== $expected) {
        return ['ok' => false, 'error' => 'Video-Block ist unvollständig.'];
    }

    $dir = media_chunk_dir($userId, $uploadId);
    $part = $dir . '/' . sprintf('%06d.part', $index);
    if (is_file($part) && (int)filesize($part) === $expected) {
        return ['ok' => true, 'index' => $index];
    }
    $pending = $part . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (!move_uploaded_file($tmp, $pending)) {
        return ['ok' => false, 'error' => 'Video-Block konnte nicht gespeichert werden.'];
    }
    @chmod($pending, 0600);
    if ((int)filesize($pending) !== $expected || !@rename($pending, $part)) {
        @unlink($pending);
        return ['ok' => false, 'error' => 'Video-Block ist unvollständig.'];
    }
    return ['ok' => true, 'index' => $index];
}

function media_chunk_receipt_path(int $userId, string $uploadId): string
{
    $dir = media_chunk_root() . '/completed';
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }
    return $dir . '/' . $userId . '-' . $uploadId . '.json';
}

/** @return array<string, mixed>|null */
function media_chunk_receipt(int $userId, string $uploadId): ?array
{
    if (!media_chunk_valid_id($uploadId)) {
        return null;
    }
    $raw = @file_get_contents(media_chunk_receipt_path($userId, $uploadId));
    $receipt = is_string($raw) ? json_decode($raw, true) : null;
    if (
        !is_array($receipt)
        || empty($receipt['token'])
        || (int)($receipt['created'] ?? 0) < time() - MEDIA_UPLOAD_CHUNK_TTL_SECONDS
    ) {
        return null;
    }
    return $receipt;
}

/**
 * @return array{ok: true, token: string, kind: string, mime: string, size: int}|array{ok: false, error: string}
 */
function media_chunk_complete(
    int $userId,
    string $uploadId,
    ?array $posterFile = null
): array {
    $receipt = media_chunk_receipt($userId, $uploadId);
    if ($receipt !== null) {
        return [
            'ok' => true,
            'token' => (string)$receipt['token'],
            'kind' => (string)($receipt['kind'] ?? 'video'),
            'mime' => (string)($receipt['mime'] ?? 'video/mp4'),
            'size' => (int)($receipt['size'] ?? 0),
        ];
    }
    $manifest = media_chunk_manifest($userId, $uploadId);
    if ($manifest === null) {
        return ['ok' => false, 'error' => 'Chunk-Upload ist abgelaufen.'];
    }
    $dir = media_chunk_dir($userId, $uploadId);
    $lock = @fopen($dir . '/complete.lock', 'c');
    if ($lock === false || !@flock($lock, LOCK_EX)) {
        if (is_resource($lock)) {
            fclose($lock);
        }
        return ['ok' => false, 'error' => 'Video wird bereits zusammengesetzt.'];
    }

    try {
        $chunkCount = (int)$manifest['chunk_count'];
        $chunkSize = (int)$manifest['chunk_size'];
        $totalSize = (int)$manifest['size'];
        $assembled = $dir . '/assembled.video';
        $assembledSize = is_file($assembled) ? (int)filesize($assembled) : 0;
        if ($assembledSize > $totalSize) {
            return ['ok' => false, 'error' => 'Zusammengesetztes Video ist ungültig.'];
        }
        if ($assembledSize < $totalSize && $assembledSize % $chunkSize !== 0) {
            $alignedSize = intdiv($assembledSize, $chunkSize) * $chunkSize;
            $repair = @fopen($assembled, 'c+b');
            if ($repair === false || !@ftruncate($repair, $alignedSize)) {
                if (is_resource($repair)) {
                    fclose($repair);
                }
                return ['ok' => false, 'error' => 'Video konnte nicht fortgesetzt werden.'];
            }
            fclose($repair);
            $assembledSize = $alignedSize;
        }

        $startIndex = $assembledSize >= $totalSize
            ? $chunkCount
            : intdiv($assembledSize, $chunkSize);
        for ($i = $startIndex; $i < $chunkCount; $i++) {
            $part = $dir . '/' . sprintf('%06d.part', $i);
            $expected = min($chunkSize, $totalSize - ($i * $chunkSize));
            if (!is_file($part) || (int)filesize($part) !== $expected) {
                return ['ok' => false, 'error' => 'Video-Block ' . ($i + 1) . ' fehlt.'];
            }
        }

        $out = @fopen($assembled, 'ab');
        if ($out === false) {
            return ['ok' => false, 'error' => 'Video konnte nicht zusammengesetzt werden.'];
        }
        for ($i = $startIndex; $i < $chunkCount; $i++) {
            $part = $dir . '/' . sprintf('%06d.part', $i);
            $in = @fopen($part, 'rb');
            $expected = min($chunkSize, $totalSize - ($i * $chunkSize));
            $copied = $in === false ? false : stream_copy_to_stream($in, $out);
            if (is_resource($in)) {
                fclose($in);
            }
            if ($copied !== $expected) {
                fclose($out);
                return ['ok' => false, 'error' => 'Video-Block konnte nicht zusammengesetzt werden.'];
            }
            fflush($out);
            @unlink($part);
        }
        fclose($out);
        clearstatcache(true, $assembled);
        if (!is_file($assembled) || (int)filesize($assembled) !== $totalSize) {
            return ['ok' => false, 'error' => 'Zusammengesetztes Video ist unvollständig.'];
        }

        $result = media_stage_store_local_video($userId, $assembled, $totalSize, $posterFile);
        if (!$result['ok']) {
            return $result;
        }
        $receipt = [
            'token' => $result['token'],
            'kind' => $result['kind'],
            'mime' => $result['mime'],
            'size' => $result['size'],
            'created' => time(),
        ];
        @file_put_contents(
            media_chunk_receipt_path($userId, $uploadId),
            json_encode($receipt, JSON_UNESCAPED_SLASHES),
            LOCK_EX
        );
        return $result;
    } finally {
        @flock($lock, LOCK_UN);
        fclose($lock);
        if (isset($result) && is_array($result) && !empty($result['ok'])) {
            media_chunk_remove_tree($dir);
        }
    }
}

function media_chunk_abort(int $userId, string $uploadId): void
{
    if (!media_chunk_valid_id($uploadId)) {
        return;
    }
    $dir = media_chunk_dir($userId, $uploadId);
    $lock = @fopen($dir . '/complete.lock', 'c');
    if ($lock === false) {
        return;
    }
    if (@flock($lock, LOCK_EX | LOCK_NB)) {
        media_chunk_remove_tree($dir);
        @flock($lock, LOCK_UN);
    }
    fclose($lock);
}
