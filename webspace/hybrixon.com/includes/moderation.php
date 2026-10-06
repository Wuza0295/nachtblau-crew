<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/policy.php';
require_once __DIR__ . '/media_upload.php';

/** @deprecated use MEDIA_IMAGE_MAX_BYTES */
const CONTENT_IMAGE_MAX_BYTES = MEDIA_IMAGE_MAX_BYTES;

/** @var list<string> */
const CONTENT_IMAGE_MIMES = MEDIA_IMAGE_MIMES;

/**
 * Heuristic text scan. Not perfect — Soft-18+ images are always auto-flagged too.
 *
 * allow  = ok for general feed
 * flag   = Soft-18+ / Admin-Review (forces Soft-18+ on posts)
 * block  = 18++ / forbidden
 *
 * @return array{action: 'allow'|'block'|'flag', reasons: list<string>}
 */
function content_scan_text(string $text): array
{
    $norm = mb_strtolower($text);
    $norm = strtr($norm, [
        'ä' => 'ae', 'ö' => 'oe', 'ü' => 'ue', 'ß' => 'ss',
    ]);
    // Leetspeak leicht normalisieren (p0ppen → poppen)
    $norm = str_replace(['0', '1', '!', '|'], ['o', 'i', 'i', 'i'], $norm);
    $norm = preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $norm) ?? $norm;
    $compact = trim(preg_replace('/\s+/u', ' ', $norm) ?? $norm);

    $blockPatterns = [
        // Hard porn / genitals / sex acts
        '/\b(hardcore|hentai|onlyfans[\s-]*leak)\b/u',
        '/\b(blowjob|deepthroat|creampie|cumshot|handjob|gangbang|bukkake)\b/u',
        '/\b(porn|porno|pornografie|pornographie)\b/u',
        '/\b(sex\s*video|sexvideo|sex\s*tape|sextape)\b/u',
        '/\b(penis|vagina|vulva|klitoris|hoden|genitalien|anal\s*sex|analsex)\b/u',
        '/\b(ficken|gefickt|abschlecken|abspritzen|rein\s*spritzen|wichsen|abwichsen)\b/u',
        '/\b(nude\s*genitals?|full\s*frontal|explicit\s*sex)\b/u',
        '/\b(oralsex|oral\s*sex|penetration|ejakul)/u',
        // CSAM / illegal
        '/\b(csam|child\s*porn|kinderporn|minderjaehrig(e|er|es)?\s*(nackt|sex|porno))\b/u',
        '/\b(lolita|underage\s*sex)\b/u',
        // Violence porn / gore
        '/\b(gewaltporn|snuff|torture\s*porn|vergewaltigung)\b/u',
    ];

    // Soft-18+: derbe sexuelle Sprache, Anbahnung, Soft-NSFW — Kennzeichnung + Review
    $flagPatterns = [
        '/\b(nacktbild|nacktfoto|nude\s*pic|nudes?\b)/u',
        '/\b(topless|oben\s*ohne|busenfrei)\b/u',
        '/\b(brust(e|en)?|brueste|boobs?|tits?)\b/u',
        '/\b(nackt|nackig|nackte[rn]?|entbloesst)\b/u',
        '/\b(sexy|erotisch|erotik|nsfw|onlyfans)\b/u',
        '/\b(poppen|gepoppt|bumsen|gebumst|voegeln|gevogelt|vögeln)\b/u',
        '/\b(geil\s+(auf|machen|werden)|geiler?\s+(chat|treffen|abend))\b/u',
        '/\bbock\s+auf\b.{0,40}\b(sex|poppen|bumsen|ficken|dich|euch|mich|ihn|sie|uns)\b/u',
        '/\b(lust\s+auf)\b.{0,40}\b(sex|poppen|bumsen|dich|mich)\b/u',
        '/\b(sex\s*treffen|sextreffen|one\s*night|onenight|hook\s*up|hookup)\b/u',
        '/\b(ficktreff|fick\s*treffen|quickie|fremdgeh)/u',
        '/\b(dirty\s*talk|sexting|nudes?\s*(schick|send|tauschen))\b/u',
        '/\b(ohne\s*kondom|bareback|creampie)\b/u',
        '/\b(arsch|titten|schwanz|muschi|fotze|pussy|dick\b|cock\b)\b/u',
        '/\b(horny|geilheit|geilheit)\b/u',
        '/\b(milf|dilf|bbc|bwc|gang\s*bang)\b/u',
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
            $reasons[] = 'Automatische Prüfung: sexueller / Soft-18+-Inhalt — Kennzeichnung und Admin-Review';
            return ['action' => 'flag', 'reasons' => array_values(array_unique($reasons))];
        }
    }

    return ['action' => 'allow', 'reasons' => []];
}

function content_store_post_image(array $file): array
{
    return media_store_image($file, 'posts');
}

function content_delete_image(?string $relativePath): void
{
    media_delete_path($relativePath);
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
    require_once __DIR__ . '/mail.php';
    hybrixon_notify_admins_of_report('post', (int)$reporter['id'], $reason, $postId);
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
        require_once __DIR__ . '/posts.php';
        allxion_delete_post_media_files($postId);
        allxion_db()->prepare(
            "UPDATE posts SET moderation_status = 'removed', image_path = NULL, image_mime = NULL,
             video_path = NULL, video_mime = NULL, video_duration = NULL WHERE id = ?"
        )->execute([$postId]);
        allxion_db()->prepare('DELETE FROM post_media WHERE post_id = ?')->execute([$postId]);
        $status = 'removed';
    } else {
        // ok / dismiss
        allxion_db()->prepare(
            "UPDATE posts SET moderation_status = 'ok' WHERE id = ? AND moderation_status IN ('flagged', 'pending')"
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
