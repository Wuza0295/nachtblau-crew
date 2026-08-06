<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/policy.php';

/** Max Soft-18+ image size (bytes). */
const CONTENT_IMAGE_MAX_BYTES = 4_000_000;

/** @var list<string> */
const CONTENT_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Heuristic text scan. Not perfect — Soft-18+ images are always auto-flagged too.
 *
 * @return array{action: 'allow'|'block'|'flag', reasons: list<string>}
 */
function content_scan_text(string $text): array
{
    $norm = mb_strtolower($text);
    $norm = strtr($norm, [
        'ä' => 'ae', 'ö' => 'oe', 'ü' => 'ue', 'ß' => 'ss',
    ]);
    $compact = preg_replace('/\s+/u', ' ', $norm) ?? $norm;

    $blockPatterns = [
        // Hard porn / genitals / sex acts
        '/\b(hardcore|hentai|onlyfans[\s-]*leak)\b/u',
        '/\b(blowjob|deepthroat|creampie|cumshot|handjob|gangbang|bukkake)\b/u',
        '/\b(porn|porno|pornografie|pornographie)\b/u',
        '/\b(sex\s*video|sexvideo|sex\s*tape|sextape)\b/u',
        '/\b(penis|vagina|vulva|klitoris|hoden|genitalien|anal\s*sex|analsex)\b/u',
        '/\b(ficken|gefickt|abschlecken|abspritzen|rein\s*spritzen)\b/u',
        '/\b(nude\s*genitals?|full\s*frontal|explicit\s*sex)\b/u',
        // CSAM / illegal
        '/\b(csam|child\s*porn|kinderporn|minderjaehrig(e|er|es)?\s*(nackt|sex|porno))\b/u',
        '/\b(lolita|underage\s*sex)\b/u',
        // Violence porn / gore
        '/\b(gewaltporn|snuff|torture\s*porn|vergewaltigung)\b/u',
    ];

    $flagPatterns = [
        '/\b(nacktbild|nacktfoto|nude\s*pic|nudes?\b)/u',
        '/\b(topless|oben\s*ohne|busenfrei)\b/u',
        '/\b(brust(e|en)?|brueste|boobs?|tits?)\b/u',
    ];

    $reasons = [];
    foreach ($blockPatterns as $re) {
        if (preg_match($re, $compact)) {
            $reasons[] = 'Automatische Prüfung: vermutet verbotener 18++ / expliziter Inhalt';
            return ['action' => 'block', 'reasons' => $reasons];
        }
    }

    foreach ($flagPatterns as $re) {
        if (preg_match($re, $compact)) {
            $reasons[] = 'Automatische Prüfung: Soft-NSFW-Hinweis — Admin-Review';
            return ['action' => 'flag', 'reasons' => array_values(array_unique($reasons))];
        }
    }

    return ['action' => 'allow', 'reasons' => []];
}

/**
 * Lightweight image heuristics (GD). Not a full NSFW model — used to block
 * obvious junk and prioritize Soft-18+ review. Always pairs with auto-report.
 *
 * @return array{action: 'allow'|'block'|'flag', reasons: list<string>, meta: array<string,mixed>}
 */
function content_scan_image(string $absolutePath, string $mime): array
{
    $reasons = [];
    $meta = [
        'width' => 0,
        'height' => 0,
        'skinRatio' => null,
        'engine' => extension_loaded('gd') ? 'gd' : 'none',
    ];

    $info = @getimagesize($absolutePath);
    if ($info === false) {
        return [
            'action' => 'block',
            'reasons' => ['Bildprüfung: Datei ist kein gültiges Bild.'],
            'meta' => $meta,
        ];
    }
    $w = (int)($info[0] ?? 0);
    $h = (int)($info[1] ?? 0);
    $meta['width'] = $w;
    $meta['height'] = $h;

    if ($w < 64 || $h < 64) {
        return [
            'action' => 'block',
            'reasons' => ['Bildprüfung: Auflösung zu gering (min. 64×64).'],
            'meta' => $meta,
        ];
    }
    if ($w > 8000 || $h > 8000) {
        return [
            'action' => 'block',
            'reasons' => ['Bildprüfung: Auflösung zu hoch (max. 8000px).'],
            'meta' => $meta,
        ];
    }

    $ratio = $w > 0 ? ($h / $w) : 0.0;
    if ($ratio < 0.2 || $ratio > 5.0) {
        $reasons[] = 'Bildprüfung: extremes Seitenverhältnis — Admin-Review';
    }

    if (!extension_loaded('gd')) {
        $reasons[] = 'Soft-18+ Bild — automatische Prüfung (GD nicht verfügbar, Review Pflicht)';
        return ['action' => 'flag', 'reasons' => $reasons, 'meta' => $meta];
    }

    $im = match ($mime) {
        'image/jpeg' => @imagecreatefromjpeg($absolutePath),
        'image/png' => @imagecreatefrompng($absolutePath),
        'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($absolutePath) : false,
        default => false,
    };
    if ($im === false) {
        return [
            'action' => 'block',
            'reasons' => ['Bildprüfung: Bild konnte nicht gelesen werden.'],
            'meta' => $meta,
        ];
    }

    // Downsample grid for skin-tone estimate (center-weighted).
    $sampleW = 48;
    $sampleH = 48;
    $sample = imagecreatetruecolor($sampleW, $sampleH);
    if ($sample === false) {
        imagedestroy($im);
        $reasons[] = 'Soft-18+ Bild — automatische Prüfung (Sampling fehlgeschlagen)';
        return ['action' => 'flag', 'reasons' => $reasons, 'meta' => $meta];
    }
    imagecopyresampled($sample, $im, 0, 0, 0, 0, $sampleW, $sampleH, $w, $h);

    $skin = 0;
    $total = $sampleW * $sampleH;
    $centerSkin = 0;
    $centerTotal = 0;
    for ($y = 0; $y < $sampleH; $y++) {
        for ($x = 0; $x < $sampleW; $x++) {
            $rgb = imagecolorat($sample, $x, $y);
            $r = ($rgb >> 16) & 0xFF;
            $g = ($rgb >> 8) & 0xFF;
            $b = $rgb & 0xFF;
            $isSkin = content_pixel_looks_like_skin($r, $g, $b);
            if ($isSkin) {
                $skin++;
            }
            // Center 50% area
            if ($x >= 12 && $x < 36 && $y >= 12 && $y < 36) {
                $centerTotal++;
                if ($isSkin) {
                    $centerSkin++;
                }
            }
        }
    }
    imagedestroy($sample);
    imagedestroy($im);

    $skinRatio = $total > 0 ? $skin / $total : 0.0;
    $centerRatio = $centerTotal > 0 ? $centerSkin / $centerTotal : 0.0;
    $meta['skinRatio'] = round($skinRatio, 3);
    $meta['centerSkinRatio'] = round($centerRatio, 3);

    // Very high skin share → likely Soft-NSFW / possible hard content → flag (not auto-block;
    // false positives on portraits exist; humans decide 18++).
    if ($skinRatio >= 0.42 || $centerRatio >= 0.55) {
        $reasons[] = sprintf(
            'Bildprüfung: hoher Hautanteil (gesamt %.0f%%, Zentrum %.0f%%) — Soft-NSFW-Review',
            $skinRatio * 100,
            $centerRatio * 100
        );
    } else {
        $reasons[] = 'Soft-18+ Bild — automatische Prüfung + Admin-Review';
    }

    // Extremely skin-dominant + low colour variance can still be Soft; keep as flag.
    return [
        'action' => 'flag',
        'reasons' => array_values(array_unique($reasons)),
        'meta' => $meta,
    ];
}

function content_pixel_looks_like_skin(int $r, int $g, int $b): bool
{
    // Classic RGB skin heuristics (works across several tones; imperfect).
    if ($r < 60 || $g < 30 || $b < 15) {
        return false;
    }
    if ($r < $g || $r < $b) {
        return false;
    }
    if (($r - $g) < 10) {
        return false;
    }
    $max = max($r, $g, $b);
    $min = min($r, $g, $b);
    if (($max - $min) < 15) {
        return false; // grey
    }
    // YCbCr-ish window
    $cb = 128 + (-0.148 * $r) - (0.291 * $g) + (0.439 * $b);
    $cr = 128 + (0.439 * $r) - (0.368 * $g) - (0.071 * $b);
    return $cb >= 77 && $cb <= 127 && $cr >= 133 && $cr <= 173;
}

/**
 * Re-encode JPEG/PNG/WebP without EXIF (privacy) when GD allows.
 */
function content_strip_image_metadata(string $absolutePath, string $mime): void
{
    if (!extension_loaded('gd')) {
        return;
    }
    $im = match ($mime) {
        'image/jpeg' => @imagecreatefromjpeg($absolutePath),
        'image/png' => @imagecreatefrompng($absolutePath),
        'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($absolutePath) : false,
        default => false,
    };
    if ($im === false) {
        return;
    }
    if ($mime === 'image/png') {
        imagealphablending($im, false);
        imagesavealpha($im, true);
    }
    $ok = match ($mime) {
        'image/jpeg' => imagejpeg($im, $absolutePath, 88),
        'image/png' => imagepng($im, $absolutePath, 6),
        'image/webp' => function_exists('imagewebp') ? imagewebp($im, $absolutePath, 85) : false,
        default => false,
    };
    imagedestroy($im);
    if ($ok) {
        @chmod($absolutePath, 0640);
    }
}

/**
 * Validate, scan, and store Soft-18+ image. Returns relative path under uploads/ or error.
 *
 * @return array{ok: true, path: string, mime: string, scan: array}|array{ok: false, error: string}
 */
function content_store_post_image(array $file): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return ['ok' => false, 'error' => 'Kein Bild gewählt.'];
    }
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        return ['ok' => false, 'error' => 'Upload fehlgeschlagen.'];
    }
    $size = (int)($file['size'] ?? 0);
    if ($size <= 0 || $size > CONTENT_IMAGE_MAX_BYTES) {
        return ['ok' => false, 'error' => 'Bild max. ' . (int)(CONTENT_IMAGE_MAX_BYTES / 1_000_000) . ' MB.'];
    }

    $tmp = (string)($file['tmp_name'] ?? '');
    if ($tmp === '' || !is_uploaded_file($tmp)) {
        return ['ok' => false, 'error' => 'Ungültiger Upload.'];
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string)$finfo->file($tmp);
    if (!in_array($mime, CONTENT_IMAGE_MIMES, true)) {
        return ['ok' => false, 'error' => 'Nur JPEG, PNG oder WebP erlaubt.'];
    }

    $info = @getimagesize($tmp);
    if ($info === false) {
        return ['ok' => false, 'error' => 'Datei ist kein gültiges Bild.'];
    }

    $ext = match ($mime) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        default => 'bin',
    };

    $dir = ALLXION_UPLOADS . '/posts';
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }

    $name = bin2hex(random_bytes(16)) . '.' . $ext;
    $dest = $dir . '/' . $name;
    if (!move_uploaded_file($tmp, $dest)) {
        return ['ok' => false, 'error' => 'Bild konnte nicht gespeichert werden.'];
    }
    @chmod($dest, 0640);

    content_strip_image_metadata($dest, $mime);

    $scan = content_scan_image($dest, $mime);
    if ($scan['action'] === 'block') {
        @unlink($dest);
        return ['ok' => false, 'error' => $scan['reasons'][0] ?? 'Bild abgelehnt.'];
    }

    return [
        'ok' => true,
        'path' => 'posts/' . $name,
        'mime' => $mime,
        'scan' => $scan,
    ];
}

function content_delete_image(?string $relativePath): void
{
    if ($relativePath === null || $relativePath === '') {
        return;
    }
    if (!preg_match('#^posts/[a-f0-9]+\.(jpg|png|webp)$#', $relativePath)) {
        return;
    }
    $full = ALLXION_UPLOADS . '/' . $relativePath;
    if (is_file($full)) {
        @unlink($full);
    }
}

function content_create_report(?int $reporterId, int $postId, string $source, string $reason): void
{
    $stmt = allxion_db()->prepare(
        'INSERT INTO content_reports (post_id, reporter_id, source, reason) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([
        $postId,
        $reporterId,
        $source === 'auto' ? 'auto' : 'user',
        substr(trim($reason), 0, 500),
    ]);
    $upd = allxion_db()->prepare(
        "UPDATE posts SET moderation_status = 'flagged' WHERE id = ? AND moderation_status = 'ok'"
    );
    $upd->execute([$postId]);
}

/**
 * @return list<string>
 */
function content_user_report_post(array $reporter, int $postId, string $reason): array
{
    $reason = trim($reason);
    if ($reason === '' || mb_strlen($reason) > 500) {
        return ['Bitte einen Grund (1–500 Zeichen) angeben.'];
    }
    $stmt = allxion_db()->prepare(
        "SELECT id, moderation_status FROM posts WHERE id = ? AND moderation_status != 'removed'"
    );
    $stmt->execute([$postId]);
    $post = $stmt->fetch();
    if (!$post) {
        return ['Beitrag nicht gefunden.'];
    }

    // Only one open report per user/post; after resolve (ok/removed) re-report is allowed.
    $open = allxion_db()->prepare(
        "SELECT COUNT(*) FROM content_reports
         WHERE reporter_id = ? AND post_id = ? AND status = 'open'"
    );
    $open->execute([(int)$reporter['id'], $postId]);
    if ((int)$open->fetchColumn() > 0) {
        return ['Du hast für diesen Beitrag bereits eine offene Meldung.'];
    }

    // Light anti-spam after a closed report: 10 minutes before same user can re-flag.
    $recent = allxion_db()->prepare(
        "SELECT COUNT(*) FROM content_reports
         WHERE reporter_id = ? AND post_id = ?
           AND status != 'open'
           AND created_at > datetime('now', '-10 minutes')"
    );
    $recent->execute([(int)$reporter['id'], $postId]);
    if ((int)$recent->fetchColumn() > 0) {
        return ['Bitte warte kurz, bevor du denselben Beitrag erneut meldest.'];
    }

    content_create_report((int)$reporter['id'], $postId, 'user', $reason);
    return [];
}

/**
 * @return list<array<string,mixed>>
 */
function content_admin_open_reports(): array
{
    $sql = <<<'SQL'
SELECT r.*,
  u.username AS reporter_username,
  p.body AS post_body,
  p.is_adult,
  p.image_path,
  p.moderation_status,
  p.created_at AS post_created_at,
  au.username AS author_username,
  au.id AS author_id,
  au.banned_at AS author_banned_at
FROM content_reports r
JOIN posts p ON p.id = r.post_id
JOIN users au ON au.id = p.user_id
LEFT JOIN users u ON u.id = r.reporter_id
WHERE r.status = 'open'
ORDER BY r.created_at ASC
SQL;
    return allxion_db()->query($sql)->fetchAll();
}

function content_admin_resolve_report(int $reportId, string $action, int $adminId, string $note = ''): void
{
    $row = allxion_db()->prepare('SELECT * FROM content_reports WHERE id = ?');
    $row->execute([$reportId]);
    $report = $row->fetch();
    if (!$report || ($report['status'] ?? '') !== 'open') {
        return;
    }

    $postId = (int)$report['post_id'];
    $note = substr(trim($note), 0, 500);

    if ($action === 'remove') {
        $post = allxion_db()->prepare('SELECT image_path FROM posts WHERE id = ?');
        $post->execute([$postId]);
        $p = $post->fetch();
        if ($p) {
            content_delete_image($p['image_path'] ?? null);
        }
        allxion_db()->prepare(
            "UPDATE posts SET moderation_status = 'removed', image_path = NULL, image_mime = NULL WHERE id = ?"
        )->execute([$postId]);
        $status = 'removed';
    } else {
        // ok / dismiss
        allxion_db()->prepare(
            "UPDATE posts SET moderation_status = 'ok' WHERE id = ? AND moderation_status = 'flagged'"
        )->execute([$postId]);
        $status = 'ok';
    }

    allxion_db()->prepare(
        "UPDATE content_reports
         SET status = ?, admin_note = ?, reviewed_at = datetime('now'), reviewed_by = ?
         WHERE id = ?"
    )->execute([$status, $note, $adminId, $reportId]);

    // Close sibling open reports on same post when removed
    if ($action === 'remove') {
        allxion_db()->prepare(
            "UPDATE content_reports
             SET status = 'removed', reviewed_at = datetime('now'), reviewed_by = ?,
                 admin_note = COALESCE(NULLIF(admin_note, ''), ?)
             WHERE post_id = ? AND status = 'open'"
        )->execute([$adminId, 'closed with post removal', $postId]);
    }
}
