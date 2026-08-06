<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/moderation.php';

/**
 * @param array<string,mixed>|null $imageFile $_FILES['image'] or null
 * @param array<string,mixed>|null $actor Admin/user performing the action (for post-as)
 * @return array{errors: list<string>, pending_review?: bool, post_id?: int}
 */
function allxion_create_post(
    int $userId,
    string $body,
    bool $isAdult,
    bool $policyAccepted = false,
    ?array $imageFile = null,
    ?array $actor = null,
    ?int $asUserId = null
): array {
    require_once __DIR__ . '/policy.php';
    require_once __DIR__ . '/profile.php';

    $body = trim($body);
    $hasImage = $imageFile
        && (($imageFile['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE);

    if (($body === '' && !$hasImage) || mb_strlen($body) > 4000) {
        return ['errors' => ['Beitrag muss Text (1–4000 Zeichen) und/oder ein Soft-18+-Bild enthalten.']];
    }

    $authorId = $userId;
    if ($asUserId !== null && $asUserId > 0 && $asUserId !== $userId) {
        $actor = $actor ?? profile_find_by_id($userId);
        if (!$actor || !profile_can_admin_post_as($actor, $asUserId)) {
            return ['errors' => ['Als dieses Profil posten ist nicht erlaubt.']];
        }
        $authorId = $asUserId;
    }

    $userStmt = allxion_db()->prepare('SELECT * FROM users WHERE id = ?');
    $userStmt->execute([$authorId]);
    $user = $userStmt->fetch();
    if (!$user) {
        return ['errors' => ['Benutzer nicht gefunden.']];
    }

    if ($hasImage && !$isAdult) {
        return ['errors' => ['Bilder nur als Soft-18+ (mit Inhaltsregeln).']];
    }

    if ($isAdult) {
        if (!user_is_adult($user)) {
            return ['errors' => ['18+-Inhalte nur ab ' . ALLXION_ADULT_AGE . ' Jahren.']];
        }
        if (!user_age_verified($user)) {
            return ['errors' => ['Bitte zuerst die Altersprüfung für Soft-18+ bestätigen.']];
        }
        if (!$policyAccepted) {
            return ['errors' => ['Bitte die Inhaltsregeln für Soft-18+ akzeptieren.']];
        }
    }

    $scan = content_scan_text($body);
    if ($scan['action'] === 'block') {
        return ['errors' => [$scan['reasons'][0] ?? 'Inhalt verstößt gegen die Regeln (kein 18++ / Porno).']];
    }

    $imagePath = null;
    $imageMime = null;
    $imageScan = null;
    if ($hasImage) {
        $stored = content_store_post_image($imageFile);
        if (!$stored['ok']) {
            return ['errors' => [$stored['error']]];
        }
        $imagePath = $stored['path'];
        $imageMime = $stored['mime'];
        $imageScan = $stored['scan'] ?? null;
    }

    $needsReview = $scan['action'] === 'flag' || $hasImage;
    $status = $needsReview ? 'flagged' : 'ok';

    $stmt = allxion_db()->prepare(
        'INSERT INTO posts (user_id, body, is_adult, image_path, image_mime, moderation_status)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $authorId,
        $body,
        $isAdult ? 1 : 0,
        $imagePath,
        $imageMime,
        $status,
    ]);
    $postId = (int)allxion_db()->lastInsertId();

    if ($needsReview) {
        $bits = [];
        if ($scan['action'] === 'flag') {
            $bits[] = $scan['reasons'][0] ?? 'Automatische Textprüfung — Soft-NSFW';
        }
        if ($hasImage) {
            if (is_array($imageScan) && !empty($imageScan['reasons'])) {
                $bits[] = implode(' · ', $imageScan['reasons']);
                $meta = $imageScan['meta'] ?? [];
                if (isset($meta['skinRatio'])) {
                    $bits[] = sprintf(
                        'Meta: %dx%d, Haut %.0f%%',
                        (int)($meta['width'] ?? 0),
                        (int)($meta['height'] ?? 0),
                        ((float)$meta['skinRatio']) * 100
                    );
                }
            } else {
                $bits[] = 'Soft-18+ Bild — automatische Prüfung (kein 18++: keine Genitalien/Sexakte)';
            }
        }
        content_create_report(null, $postId, 'auto', implode(' · ', $bits));
    }

    return [
        'errors' => [],
        'pending_review' => $needsReview,
        'post_id' => $postId,
    ];
}

/**
 * Public feed: approved posts for everyone (adult filter separate).
 * Flagged posts only for author or admin until cleared.
 *
 * @return list<array<string,mixed>>
 */
function allxion_feed(?array $viewer, bool $includeAdult, int $limit = 50): array
{
    $limit = max(1, min(100, $limit));
    $viewerId = $viewer ? (int)$viewer['id'] : 0;
    $isAdmin = $viewer && user_is_admin($viewer) ? 1 : 0;

    $sql = <<<'SQL'
SELECT p.*, u.username, u.display_name, u.avatar_path, u.account_kind,
  (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.kind = 'like') AS like_count
FROM posts p
JOIN users u ON u.id = p.user_id
WHERE p.moderation_status != 'removed'
  AND (u.banned_at IS NULL OR u.banned_at = '')
  AND (
    p.moderation_status = 'ok'
    OR p.user_id = :viewerId
    OR :isAdmin = 1
  )
SQL;
    if (!$includeAdult) {
        $sql .= ' AND p.is_adult = 0';
    }
    $sql .= ' ORDER BY p.created_at DESC LIMIT ' . $limit;

    $stmt = allxion_db()->prepare($sql);
    $stmt->bindValue(':viewerId', $viewerId, PDO::PARAM_INT);
    $stmt->bindValue(':isAdmin', $isAdmin, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

function allxion_toggle_like(int $userId, int $postId): void
{
    $pdo = allxion_db();
    $check = $pdo->prepare(
        "SELECT id FROM reactions WHERE post_id = ? AND user_id = ? AND kind = ?
         AND EXISTS (
           SELECT 1 FROM posts p
           WHERE p.id = ?
             AND p.moderation_status != 'removed'
             AND (p.moderation_status = 'ok' OR p.user_id = ?)
         )"
    );
    $check->execute([$postId, $userId, 'like', $postId, $userId]);
    if ($check->fetch()) {
        $del = $pdo->prepare('DELETE FROM reactions WHERE post_id = ? AND user_id = ? AND kind = ?');
        $del->execute([$postId, $userId, 'like']);
    } else {
        $ins = $pdo->prepare('INSERT INTO reactions (post_id, user_id, kind) VALUES (?, ?, ?)');
        $ins->execute([$postId, $userId, 'like']);
    }
}

/**
 * Whether a viewer may see a post image (age + moderation).
 */
function allxion_can_view_post_image(array $post, ?array $viewer): bool
{
    $status = (string)($post['moderation_status'] ?? '');
    if ($status === 'removed' || empty($post['image_path'])) {
        return false;
    }

    $isAuthor = $viewer && (int)$viewer['id'] === (int)$post['user_id'];
    $isAdmin = $viewer && user_is_admin($viewer);

    if ($status === 'flagged' && !$isAuthor && !$isAdmin) {
        return false;
    }

    if (!empty($post['is_adult'])) {
        if (!$viewer) {
            return false;
        }
        if (!$isAdmin && !user_age_verified($viewer) && !$isAuthor) {
            return false;
        }
    }

    return true;
}
