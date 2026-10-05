<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/moderation.php';

/**
 * @param array<string,mixed>|null $imageFile $_FILES['image'] or null
 * @return list<string>
 */
function allxion_create_post(
    int $userId,
    string $body,
    bool $isAdult,
    bool $policyAccepted = false,
    ?array $imageFile = null
): array {
    require_once __DIR__ . '/policy.php';

    $body = trim($body);
    $hasImage = $imageFile
        && (($imageFile['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE);

    if (($body === '' && !$hasImage) || mb_strlen($body) > 4000) {
        return ['Beitrag muss Text (1–4000 Zeichen) und/oder ein Soft-18+-Bild enthalten.'];
    }

    $userStmt = allxion_db()->prepare('SELECT * FROM users WHERE id = ?');
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch();
    if (!$user) {
        return ['Benutzer nicht gefunden.'];
    }

    if ($hasImage && !$isAdult) {
        return ['Bilder nur als Soft-18+ (mit Inhaltsregeln).'];
    }

    if ($isAdult) {
        if (!user_is_adult($user)) {
            return ['18+-Inhalte nur ab ' . ALLXION_ADULT_AGE . ' Jahren.'];
        }
        if (!user_age_verified($user)) {
            return ['Bitte zuerst die Altersprüfung für Soft-18+ bestätigen.'];
        }
        if (!$policyAccepted) {
            return ['Bitte die Inhaltsregeln für Soft-18+ akzeptieren.'];
        }
    }

    $scan = content_scan_text($body);
    if ($scan['action'] === 'block') {
        return [$scan['reasons'][0] ?? 'Inhalt verstößt gegen die Regeln (kein 18++ / Porno).'];
    }

    $imagePath = null;
    $imageMime = null;
    if ($hasImage) {
        $stored = content_store_post_image($imageFile);
        if (!$stored['ok']) {
            return [$stored['error']];
        }
        $imagePath = $stored['path'];
        $imageMime = $stored['mime'];
    }

    $stmt = allxion_db()->prepare(
        'INSERT INTO posts (user_id, body, is_adult, image_path, image_mime, moderation_status)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $status = ($scan['action'] === 'flag' || $hasImage) ? 'flagged' : 'ok';
    $stmt->execute([
        $userId,
        $body,
        $isAdult ? 1 : 0,
        $imagePath,
        $imageMime,
        $status,
    ]);
    $postId = (int)allxion_db()->lastInsertId();

    if ($scan['action'] === 'flag' || $hasImage) {
        $bits = [];
        if ($scan['action'] === 'flag') {
            $bits[] = $scan['reasons'][0] ?? 'Automatische Textprüfung — Soft-NSFW';
        }
        if ($hasImage) {
            $bits[] = 'Soft-18+ Bild — automatische Prüfung (kein 18++: keine Genitalien/Sexakte)';
        }
        content_create_report(null, $postId, 'auto', implode(' · ', $bits));
    }

    return [];
}

/**
 * @return list<array<string,mixed>>
 */
function allxion_feed(?array $viewer, bool $includeAdult, int $limit = 50): array
{
    $limit = max(1, min(100, $limit));
    $sql = <<<'SQL'
SELECT p.*, u.username,
  (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.kind = 'like') AS like_count
FROM posts p
JOIN users u ON u.id = p.user_id
WHERE p.moderation_status != 'removed'
  AND (u.banned_at IS NULL OR u.banned_at = '')
SQL;
    if (!$includeAdult) {
        $sql .= ' AND p.is_adult = 0';
    }
    $sql .= ' ORDER BY p.created_at DESC LIMIT ' . $limit;
    return allxion_db()->query($sql)->fetchAll();
}

function allxion_toggle_like(int $userId, int $postId): void
{
    $pdo = allxion_db();
    $check = $pdo->prepare(
        "SELECT id FROM reactions WHERE post_id = ? AND user_id = ? AND kind = ?
         AND EXISTS (SELECT 1 FROM posts p WHERE p.id = ? AND p.moderation_status != 'removed')"
    );
    $check->execute([$postId, $userId, 'like', $postId]);
    if ($check->fetch()) {
        $del = $pdo->prepare('DELETE FROM reactions WHERE post_id = ? AND user_id = ? AND kind = ?');
        $del->execute([$postId, $userId, 'like']);
    } else {
        $ins = $pdo->prepare('INSERT INTO reactions (post_id, user_id, kind) VALUES (?, ?, ?)');
        $ins->execute([$postId, $userId, 'like']);
    }
}
