<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

const MEDIA_FASTSTART_CACHE_VERSION = 2;
const MEDIA_FASTSTART_MAX_MOOV_BYTES = 33_554_432;

function media_faststart_u32(string $data, int $offset): ?int
{
    if ($offset < 0 || $offset + 4 > strlen($data)) {
        return null;
    }
    $value = unpack('Nvalue', substr($data, $offset, 4));
    return isset($value['value']) ? (int)$value['value'] : null;
}

/** @return array{size: int, type: string, header: int}|null */
function media_faststart_atom_header(string $data, int $offset, int $limit): ?array
{
    if ($offset < 0 || $offset + 8 > $limit) {
        return null;
    }
    $size = media_faststart_u32($data, $offset);
    if ($size === null) {
        return null;
    }
    $type = substr($data, $offset + 4, 4);
    $header = 8;
    if ($size === 1) {
        if ($offset + 16 > $limit) {
            return null;
        }
        $parts = unpack('Nhigh/Nlow', substr($data, $offset + 8, 8));
        $high = (int)($parts['high'] ?? 0);
        $low = (int)($parts['low'] ?? 0);
        if ($high > 0x7fffffff) {
            return null;
        }
        $size = ($high * 4294967296) + $low;
        $header = 16;
    } elseif ($size === 0) {
        $size = $limit - $offset;
    }
    if ($size < $header || $offset + $size > $limit) {
        return null;
    }
    return ['size' => (int)$size, 'type' => $type, 'header' => $header];
}

/** @return list<array{offset: int, size: int, type: string, header: int}> */
function media_faststart_top_atoms(string $path, int $fileSize): array
{
    $handle = @fopen($path, 'rb');
    if ($handle === false) {
        return [];
    }
    $atoms = [];
    $offset = 0;
    try {
        while ($offset + 8 <= $fileSize && count($atoms) < 128) {
            if (fseek($handle, $offset) !== 0) {
                return [];
            }
            $headerBytes = fread($handle, 16);
            if (!is_string($headerBytes) || strlen($headerBytes) < 8) {
                return [];
            }
            $size = media_faststart_u32($headerBytes, 0);
            if ($size === null) {
                return [];
            }
            $type = substr($headerBytes, 4, 4);
            $header = 8;
            if ($size === 1) {
                if (strlen($headerBytes) < 16) {
                    return [];
                }
                $parts = unpack('Nhigh/Nlow', substr($headerBytes, 8, 8));
                $high = (int)($parts['high'] ?? 0);
                $low = (int)($parts['low'] ?? 0);
                if ($high > 0x7fffffff) {
                    return [];
                }
                $size = ($high * 4294967296) + $low;
                $header = 16;
            } elseif ($size === 0) {
                $size = $fileSize - $offset;
            }
            $size = (int)$size;
            if ($size < $header || $offset + $size > $fileSize) {
                return [];
            }
            $atoms[] = [
                'offset' => $offset,
                'size' => $size,
                'type' => $type,
                'header' => $header,
            ];
            $offset += $size;
        }
    } finally {
        fclose($handle);
    }
    return $offset === $fileSize ? $atoms : [];
}

function media_faststart_add_u32(string &$data, int $offset, int $delta): bool
{
    $value = media_faststart_u32($data, $offset);
    if ($value === null || $value + $delta > 0xffffffff) {
        return false;
    }
    $data = substr_replace($data, pack('N', $value + $delta), $offset, 4);
    return true;
}

function media_faststart_add_u64(string &$data, int $offset, int $delta): bool
{
    if ($offset < 0 || $offset + 8 > strlen($data)) {
        return false;
    }
    $parts = unpack('Nhigh/Nlow', substr($data, $offset, 8));
    $high = (int)($parts['high'] ?? 0);
    $low = (int)($parts['low'] ?? 0);
    $newLow = $low + $delta;
    if ($newLow > 0xffffffff) {
        $high++;
        $newLow -= 4294967296;
    }
    if ($high > 0xffffffff) {
        return false;
    }
    $data = substr_replace($data, pack('NN', $high, (int)$newLow), $offset, 8);
    return true;
}

/**
 * Patch stco/co64 media offsets inside an MP4 container.
 */
function media_faststart_patch_boxes(
    string &$data,
    int $start,
    int $end,
    int $delta,
    int $movedStart,
    int $movedEnd
): int {
    static $containers = [
        'moov' => true,
        'trak' => true,
        'mdia' => true,
        'minf' => true,
        'stbl' => true,
        'edts' => true,
        'dinf' => true,
        'mvex' => true,
        'moof' => true,
        'traf' => true,
        'mfra' => true,
        'udta' => true,
        'meta' => true,
        'ilst' => true,
    ];

    $patched = 0;
    $position = $start;
    while ($position + 8 <= $end) {
        $atom = media_faststart_atom_header($data, $position, $end);
        if ($atom === null) {
            return -1;
        }
        $content = $position + $atom['header'];
        $atomEnd = $position + $atom['size'];
        if ($atom['type'] === 'stco' || $atom['type'] === 'co64') {
            $count = media_faststart_u32($data, $content + 4);
            $entrySize = $atom['type'] === 'stco' ? 4 : 8;
            if (
                $count === null
                || $count < 0
                || $content + 8 + ($count * $entrySize) > $atomEnd
            ) {
                return -1;
            }
            for ($i = 0; $i < $count; $i++) {
                $entryOffset = $content + 8 + ($i * $entrySize);
                if ($entrySize === 4) {
                    $value = media_faststart_u32($data, $entryOffset);
                    if ($value === null) {
                        return -1;
                    }
                    if ($value >= $movedStart && $value < $movedEnd) {
                        if (!media_faststart_add_u32($data, $entryOffset, $delta)) {
                            return -1;
                        }
                    }
                } else {
                    $parts = unpack('Nhigh/Nlow', substr($data, $entryOffset, 8));
                    $high = (int)($parts['high'] ?? 0);
                    $low = (int)($parts['low'] ?? 0);
                    $value = ($high * 4294967296) + $low;
                    if ($value >= $movedStart && $value < $movedEnd) {
                        if (!media_faststart_add_u64($data, $entryOffset, $delta)) {
                            return -1;
                        }
                    }
                }
                $patched++;
            }
        } elseif (isset($containers[$atom['type']])) {
            $childStart = $content;
            if ($atom['type'] === 'meta') {
                // ISO BMFF meta is a FullBox with four version/flag bytes.
                // QuickTime/Apple recordings also use a flag-less meta box
                // whose first child begins immediately after the header.
                $directChild = media_faststart_atom_header($data, $content, $atomEnd);
                $hasDirectChild = $directChild !== null
                    && preg_match('/^[\x20-\x7e]{4}$/D', $directChild['type']) === 1;
                if (!$hasDirectChild) {
                    $childStart += 4;
                }
            }
            if ($childStart < $atomEnd) {
                $childPatched = media_faststart_patch_boxes(
                    $data,
                    $childStart,
                    $atomEnd,
                    $delta,
                    $movedStart,
                    $movedEnd
                );
                if ($childPatched < 0) {
                    return -1;
                }
                $patched += $childPatched;
            }
        }
        $position = $atomEnd;
    }
    return $position === $end ? $patched : -1;
}

function media_faststart_cache_dir(): string
{
    $dir = ALLXION_DATA . '/media-faststart';
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    return $dir;
}

/**
 * @return array{
 *   source_size: int,
 *   source_mtime: int,
 *   prefix_length: int,
 *   moov_length: int,
 *   middle_start: int,
 *   middle_length: int,
 *   suffix_start: int,
 *   suffix_length: int,
 *   moov_file: string
 * }|null
 */
function media_faststart_layout(string $path, string $relativePath, string $mime): ?array
{
    if ($mime !== 'video/mp4' || !is_file($path)) {
        return null;
    }
    $fileSize = (int)filesize($path);
    $mtime = (int)(filemtime($path) ?: 0);
    if ($fileSize < 32 || $mtime <= 0) {
        return null;
    }

    $key = hash(
        'sha256',
        MEDIA_FASTSTART_CACHE_VERSION . '|' . $relativePath . '|' . $fileSize . '|' . $mtime
    );
    $cacheDir = media_faststart_cache_dir();
    $jsonPath = $cacheDir . '/' . $key . '.json';
    $moovPath = $cacheDir . '/' . $key . '.moov';
    $loadCached = static function () use ($jsonPath, $moovPath, $fileSize, $mtime): array|null|false {
        $raw = @file_get_contents($jsonPath);
        $cached = is_string($raw) ? json_decode($raw, true) : null;
        if (
            !is_array($cached)
            || (int)($cached['source_size'] ?? 0) !== $fileSize
            || (int)($cached['source_mtime'] ?? 0) !== $mtime
        ) {
            return false;
        }
        if (empty($cached['virtual'])) {
            return null;
        }
        if (!is_file($moovPath) || (int)filesize($moovPath) !== (int)($cached['moov_length'] ?? 0)) {
            return false;
        }
        $cached['moov_file'] = $moovPath;
        return $cached;
    };

    $cached = $loadCached();
    if ($cached !== false) {
        return $cached;
    }

    $lock = @fopen($cacheDir . '/' . $key . '.lock', 'c');
    if ($lock !== false) {
        @flock($lock, LOCK_EX);
    }
    try {
        $cached = $loadCached();
        if ($cached !== false) {
            return $cached;
        }

        $atoms = media_faststart_top_atoms($path, $fileSize);
        $ftyp = null;
        $moov = null;
        $firstMdat = null;
        foreach ($atoms as $atom) {
            if ($atom['type'] === 'ftyp' && $ftyp === null) {
                $ftyp = $atom;
            } elseif ($atom['type'] === 'moov' && $moov === null) {
                $moov = $atom;
            } elseif ($atom['type'] === 'mdat' && $firstMdat === null) {
                $firstMdat = $atom;
            }
        }
        $negative = [
            'virtual' => false,
            'source_size' => $fileSize,
            'source_mtime' => $mtime,
        ];
        if (
            $ftyp === null
            || $moov === null
            || $firstMdat === null
            || $moov['offset'] < $firstMdat['offset']
            || $moov['size'] > MEDIA_FASTSTART_MAX_MOOV_BYTES
        ) {
            @file_put_contents($jsonPath, json_encode($negative), LOCK_EX);
            return null;
        }

        $handle = @fopen($path, 'rb');
        if ($handle === false || fseek($handle, $moov['offset']) !== 0) {
            if (is_resource($handle)) {
                fclose($handle);
            }
            return null;
        }
        $moovBytes = '';
        $remaining = $moov['size'];
        while ($remaining > 0 && !feof($handle)) {
            $chunk = fread($handle, min(1_048_576, $remaining));
            if (!is_string($chunk) || $chunk === '') {
                break;
            }
            $moovBytes .= $chunk;
            $remaining -= strlen($chunk);
        }
        fclose($handle);
        if ($remaining !== 0 || strlen($moovBytes) !== $moov['size']) {
            return null;
        }
        $root = media_faststart_atom_header($moovBytes, 0, strlen($moovBytes));
        if ($root === null || $root['type'] !== 'moov' || $root['size'] !== strlen($moovBytes)) {
            return null;
        }
        $patched = media_faststart_patch_boxes(
            $moovBytes,
            $root['header'],
            strlen($moovBytes),
            $moov['size'],
            $ftyp['offset'] + $ftyp['size'],
            $moov['offset']
        );
        if ($patched <= 0) {
            @file_put_contents($jsonPath, json_encode($negative), LOCK_EX);
            return null;
        }

        $tmpMoov = $moovPath . '.' . bin2hex(random_bytes(4)) . '.tmp';
        if (@file_put_contents($tmpMoov, $moovBytes, LOCK_EX) !== strlen($moovBytes)) {
            @unlink($tmpMoov);
            return null;
        }
        @chmod($tmpMoov, 0600);
        if (!@rename($tmpMoov, $moovPath)) {
            @unlink($tmpMoov);
            return null;
        }
        $prefixLength = $ftyp['offset'] + $ftyp['size'];
        $layout = [
            'virtual' => true,
            'source_size' => $fileSize,
            'source_mtime' => $mtime,
            'prefix_length' => $prefixLength,
            'moov_length' => $moov['size'],
            'middle_start' => $prefixLength,
            'middle_length' => $moov['offset'] - $prefixLength,
            'suffix_start' => $moov['offset'] + $moov['size'],
            'suffix_length' => $fileSize - ($moov['offset'] + $moov['size']),
        ];
        @file_put_contents(
            $jsonPath,
            json_encode($layout, JSON_UNESCAPED_SLASHES),
            LOCK_EX
        );
        $layout['moov_file'] = $moovPath;
        return $layout;
    } finally {
        if ($lock !== false) {
            @flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}

function media_faststart_copy_bytes(
    $handle,
    int $offset,
    int $length
): int {
    if (!is_resource($handle) || $length <= 0 || fseek($handle, $offset) !== 0) {
        return 0;
    }
    $sent = 0;
    while ($sent < $length && !feof($handle)) {
        $chunk = fread($handle, min(1_048_576, $length - $sent));
        if (!is_string($chunk) || $chunk === '') {
            break;
        }
        echo $chunk;
        $sent += strlen($chunk);
        if (connection_aborted()) {
            break;
        }
    }
    return $sent;
}

/**
 * Stream a byte range from the virtual ftyp+moov+media layout.
 */
function media_faststart_stream(
    array $layout,
    string $sourcePath,
    int $start,
    int $length
): int {
    $prefixLength = (int)$layout['prefix_length'];
    $moovLength = (int)$layout['moov_length'];
    $middleLength = (int)$layout['middle_length'];
    $suffixLength = (int)$layout['suffix_length'];
    $segments = [
        ['virtual' => 0, 'length' => $prefixLength, 'path' => $sourcePath, 'source' => 0],
        ['virtual' => $prefixLength, 'length' => $moovLength, 'path' => (string)$layout['moov_file'], 'source' => 0],
        [
            'virtual' => $prefixLength + $moovLength,
            'length' => $middleLength,
            'path' => $sourcePath,
            'source' => (int)$layout['middle_start'],
        ],
        [
            'virtual' => $prefixLength + $moovLength + $middleLength,
            'length' => $suffixLength,
            'path' => $sourcePath,
            'source' => (int)$layout['suffix_start'],
        ],
    ];

    $end = $start + $length;
    $sent = 0;
    $handles = [];
    try {
        foreach ($segments as $segment) {
            if ($segment['length'] <= 0) {
                continue;
            }
            $segmentStart = $segment['virtual'];
            $segmentEnd = $segmentStart + $segment['length'];
            $overlapStart = max($start, $segmentStart);
            $overlapEnd = min($end, $segmentEnd);
            if ($overlapStart >= $overlapEnd) {
                continue;
            }
            $segmentPath = $segment['path'];
            if (!isset($handles[$segmentPath])) {
                $handles[$segmentPath] = @fopen($segmentPath, 'rb');
            }
            $toSend = $overlapEnd - $overlapStart;
            $sourceOffset = $segment['source'] + ($overlapStart - $segmentStart);
            $sent += media_faststart_copy_bytes(
                $handles[$segmentPath],
                $sourceOffset,
                $toSend
            );
            if (connection_aborted() || $sent < ($overlapEnd - $start)) {
                break;
            }
        }
    } finally {
        foreach ($handles as $handle) {
            if (is_resource($handle)) {
                fclose($handle);
            }
        }
    }
    return $sent;
}
