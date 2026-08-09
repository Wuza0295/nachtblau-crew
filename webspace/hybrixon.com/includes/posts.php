<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/moderation.php';
require_once __DIR__ . '/media_upload.php';
require_once __DIR__ . '/social.php';

/**
 * @param list<array<string,mixed>> $imageFiles
 * @param list<array<string,mixed>>|array<string,mixed>|null $videoFiles Single file or list
 * @return list<string>
 */
function allxion_create_post(
    int $userId,
    string $body,
    bool $isAdult,
    bool $policyAccepted = false,
    array $imageFiles = [],
    array|null $videoFiles = null,
    string $postType = 'post',
    bool $allowPublicImages = false
): array {
    require_once __DIR__ . '/policy.php';

    $body = trim($body);
    $postType = $postType === 'short' ? 'short' : 'post';
    $images = array_slice($imageFiles, 0, MEDIA_POST_IMAGES_MAX);
    $hasImages = $images !== [];

    // Accept legacy single $_FILES['video'] array or a list of file arrays.
    $videoList = [];
    if (is_array($videoFiles)) {
        if (isset($videoFiles['tmp_name']) && !is_array($videoFiles['tmp_name'])) {
            if (($videoFiles['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
                $videoList[] = $videoFiles;
            }
        } else {
            foreach ($videoFiles as $vf) {
                if (is_array($vf) && (($vf['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE)) {
                    $videoList[] = $vf;
                }
            }
        }
    }
    $videoMax = $postType === 'short' ? MEDIA_REEL_VIDEOS_MAX : MEDIA_POST_VIDEOS_MAX;
    if (count($imageFiles) > MEDIA_POST_IMAGES_MAX) {
        return ['Maximal ' . MEDIA_POST_IMAGES_MAX . ' Bilder pro Beitrag.'];
    }
    if (count($videoList) > $videoMax) {
        return ['Maximal ' . $videoMax . ' Videos pro ' . ($postType === 'short' ? 'Reel-Upload' : 'Beitrag') . '.'];
    }
    $videos = array_slice($videoList, 0, $videoMax);
    $hasVideo = $videos !== [];

    if ($postType === 'short' && ($hasImages || !$hasVideo)) {
        return ['Reels brauchen Video(s) — ohne Bilder-Upload.'];
    }
    if (($body === '' && !$hasImages && !$hasVideo) || mb_strlen($body) > 4000) {
        return ['Beitrag braucht Text und/oder Medien (max. 4000 Zeichen Text).'];
    }

    $userStmt = allxion_db()->prepare('SELECT * FROM users WHERE id = ?');
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch();
    if (!$user) {
        return ['Benutzer nicht gefunden.'];
    }

    $scan = content_scan_text($body);
    if ($scan['action'] === 'block') {
        return [$scan['reasons'][0] ?? 'Inhalt verstößt gegen die Regeln (kein 18++ / Porno).'];
    }
    // Derbe sexuelle Sprache / Anbahnung → zwingend Soft-18+
    if ($scan['action'] === 'flag') {
        $isAdult = true;
    }

    // Soft-18+ nur wenn markiert/erzwungen — normale Bilder/Videos sind erlaubt
    if ($isAdult) {
        if (!user_is_adult($user)) {
            return ['18+-Inhalte nur ab ' . ALLXION_ADULT_AGE . ' Jahren.'];
        }
        if (!user_age_verified($user)) {
            return ['Soft-18+ braucht Altersfreischaltung.'];
        }
        if (!$policyAccepted) {
            return ['Bitte die Inhaltsregeln für Soft-18+ akzeptieren.'];
        }
    }

    $storedImages = [];
    foreach ($images as $img) {
        // Already-stored image path (profile/album share)
        if (is_array($img) && isset($img['stored_path'], $img['stored_mime'])) {
            $storedImages[] = [
                'path' => (string)$img['stored_path'],
                'mime' => (string)$img['stored_mime'],
            ];
            continue;
        }
        $stored = media_store_image($img, 'posts');
        if (!$stored['ok']) {
            foreach ($storedImages as $prev) {
                media_delete_path($prev['path']);
            }
            return [$stored['error']];
        }
        $storedImages[] = $stored;
    }

    $storedVideos = [];
    foreach ($videos as $vf) {
        $storedV = media_store_video($vf);
        if (!$storedV['ok']) {
            foreach ($storedImages as $prev) {
                media_delete_path($prev['path']);
            }
            foreach ($storedVideos as $prev) {
                media_delete_path($prev['path']);
            }
            return [$storedV['error']];
        }
        $storedVideos[] = $storedV;
    }

    $legacyPath = $storedImages[0]['path'] ?? null;
    $legacyMime = $storedImages[0]['mime'] ?? null;
    $videoPath = $storedVideos[0]['path'] ?? null;
    $videoMime = $storedVideos[0]['mime'] ?? null;
    $videoDuration = $storedVideos[0]['duration'] ?? null;
    // Nur Soft-18+/NSFW-Text → flagged; normale Beiträge sind sofort öffentlich (außer Ort-Pflicht)
    $needsMediaReview = $isAdult && (($hasImages && !$allowPublicImages) || $hasVideo);
    $status = ($scan['action'] === 'flag' || $needsMediaReview) ? 'flagged' : 'ok';

    require_once __DIR__ . '/geo.php';
    $needsLocationReview = !user_is_admin($user) && !user_has_location($user);
    if ($needsLocationReview) {
        // Ohne PLZ/Ort: nicht öffentlich, bis Admin freigibt
        $status = 'pending';
    }

    $stmt = allxion_db()->prepare(
        'INSERT INTO posts (user_id, body, is_adult, image_path, image_mime, moderation_status, post_type, video_path, video_mime, video_duration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $userId,
        $body,
        $isAdult ? 1 : 0,
        $legacyPath,
        $legacyMime,
        $status,
        $postType,
        $videoPath,
        $videoMime,
        $videoDuration,
    ]);
    $postId = (int)allxion_db()->lastInsertId();

    $ins = allxion_db()->prepare(
        'INSERT INTO post_media (post_id, kind, path, mime, sort_order, duration_sec) VALUES (?, ?, ?, ?, ?, ?)'
    );
    $sort = 0;
    foreach ($storedImages as $img) {
        $ins->execute([$postId, 'image', $img['path'], $img['mime'], $sort, null]);
        $sort++;
    }
    foreach ($storedVideos as $vid) {
        $ins->execute([$postId, 'video', $vid['path'], $vid['mime'], $sort, $vid['duration'] ?? null]);
        $sort++;
    }

    if ($needsLocationReview) {
        content_create_report(
            null,
            $postId,
            'auto',
            'Ortspflicht: Kein gültiger Ort — Beitrag wartet auf Admin-Freigabe.'
        );
        // content_create_report only flags 'ok' → keep pending
        allxion_db()->prepare(
            "UPDATE posts SET moderation_status = 'pending' WHERE id = ?"
        )->execute([$postId]);
    } elseif ($scan['action'] === 'flag' || $needsMediaReview) {
        $bits = [];
        if ($scan['action'] === 'flag') {
            $bits[] = $scan['reasons'][0] ?? 'Automatische Textprüfung — Soft-NSFW';
        }
        if ($isAdult && $hasImages && !$allowPublicImages) {
            $bits[] = 'Soft-18+ Bild(er) — automatische Prüfung';
        }
        if ($isAdult && $hasVideo) {
            $bits[] = 'Soft-18+ Video — automatische Prüfung';
        }
        content_create_report(null, $postId, 'auto', implode(' · ', $bits));
    }

    require_once __DIR__ . '/discover.php';
    discover_index_post($postId, $userId, $body);

    if (in_array($status, ['ok', 'flagged'], true)) {
        require_once __DIR__ . '/friends.php';
        require_once __DIR__ . '/mail.php';
        $friends = friends_list($userId);
        $ids = array_map(static fn($f) => (int)$f['id'], $friends);
        $uname = (string)($user['username'] ?? 'jemand');
        $preview = mb_substr(trim($body), 0, 160);
        if ($preview === '') {
            $preview = '(Medienbeitrag)';
        }
        hybrixon_notify_email_bulk(
            $ids,
            'email_notify_friend_posts',
            'Neuer Beitrag von @' . $uname,
            '@' . $uname . " hat etwas Neues gepostet:\n\n" . $preview . "\n\n"
                . 'Öffnen: ' . hybrixon_public_url('post.php?id=' . $postId),
            $userId
        );
    }

    return [];
}

/**
 * Feed-Beitrag aus bereits gespeicherten Bildpfaden (Profil/Album-Share).
 * Öffentliche Bilder ohne Soft-18+-Pflicht.
 *
 * @param list<string> $relativePaths
 * @return list<string>
 */
function allxion_share_images_as_post(int $userId, string $body, array $relativePaths): array
{
    $images = [];
    foreach ($relativePaths as $path) {
        $path = (string)$path;
        if ($path === '') {
            continue;
        }
        $dup = media_duplicate_image($path, 'posts');
        if (!$dup['ok']) {
            foreach ($images as $prev) {
                media_delete_path($prev['stored_path']);
            }
            return [$dup['error']];
        }
        $images[] = [
            'stored_path' => $dup['path'],
            'stored_mime' => $dup['mime'],
        ];
    }
    if ($images === []) {
        return ['Keine Bilder zum Teilen.'];
    }
    return allxion_create_post(
        $userId,
        $body,
        false,
        false,
        $images,
        null,
        'post',
        true
    );
}

/** Publicly visible in feeds (pending = Ort-Prüfung, removed = gelöscht). */
function allxion_post_is_feed_visible(array $post, ?array $viewer = null): bool
{
    $status = (string)($post['moderation_status'] ?? 'ok');
    if ($status === 'removed') {
        return false;
    }
    if ($status === 'pending') {
        if (!$viewer) {
            return false;
        }
        if ((int)$viewer['id'] === (int)$post['user_id'] || user_is_admin($viewer)) {
            return true;
        }
        return false;
    }
    // ok + flagged bleiben im Feed (Soft-18+-Review parallel)
    return true;
}

/**
 * @return list<string>
 */
function allxion_update_post(array $actor, int $postId, string $body): array
{
    require_once __DIR__ . '/policy.php';
    require_once __DIR__ . '/discover.php';

    $body = trim($body);
    if ($body === '' || mb_strlen($body) > 4000) {
        return ['Text 1–4000 Zeichen.'];
    }
    $scan = content_scan_text($body);
    if ($scan['action'] === 'block') {
        return [$scan['reasons'][0] ?? 'Inhalt verstößt gegen die Regeln.'];
    }

    $stmt = allxion_db()->prepare('SELECT * FROM posts WHERE id = ?');
    $stmt->execute([$postId]);
    $post = $stmt->fetch();
    if (!$post || ($post['moderation_status'] ?? '') === 'removed') {
        return ['Beitrag nicht gefunden.'];
    }
    if ((int)$post['user_id'] !== (int)$actor['id'] && !user_is_admin($actor)) {
        return ['Keine Berechtigung.'];
    }

    $forceAdult = $scan['action'] === 'flag' ? 1 : (int)($post['is_adult'] ?? 0);
    if ($forceAdult && $scan['action'] === 'flag') {
        if (!user_is_adult($actor) && !user_is_admin($actor)) {
            return ['18+-Inhalte nur ab ' . ALLXION_ADULT_AGE . ' Jahren.'];
        }
        if (!user_age_verified($actor) && !user_is_admin($actor)) {
            return ['Dieser Text braucht Soft-18+. Bitte zuerst die Altersprüfung freischalten.'];
        }
    }

    $statusSql = '';
    $params = [$body];
    if ($scan['action'] === 'flag') {
        $statusSql = ", is_adult = 1, moderation_status = CASE WHEN moderation_status = 'ok' THEN 'flagged' ELSE moderation_status END";
    }
    allxion_db()->prepare(
        "UPDATE posts SET body = ?, updated_at = datetime('now'){$statusSql} WHERE id = ?"
    )->execute(array_merge($params, [$postId]));
    if ($scan['action'] === 'flag') {
        content_create_report(null, $postId, 'auto', $scan['reasons'][0] ?? 'Soft-18+ Text nach Bearbeitung');
    }
    discover_index_post($postId, (int)$post['user_id'], $body);
    return [];
}

/**
 * @return list<string>
 */
function allxion_delete_own_post(array $actor, int $postId): array
{
    $stmt = allxion_db()->prepare('SELECT * FROM posts WHERE id = ?');
    $stmt->execute([$postId]);
    $post = $stmt->fetch();
    if (!$post) {
        return ['Beitrag nicht gefunden.'];
    }
    if ((int)$post['user_id'] !== (int)$actor['id'] && !user_is_admin($actor)) {
        return ['Keine Berechtigung.'];
    }
    allxion_delete_post_media_files($postId);
    allxion_db()->prepare('DELETE FROM posts WHERE id = ?')->execute([$postId]);
    return [];
}

/**
 * @return list<array<string,mixed>>
 */
function allxion_post_media(int $postId): array
{
    $stmt = allxion_db()->prepare(
        'SELECT * FROM post_media WHERE post_id = ? ORDER BY sort_order ASC, id ASC'
    );
    $stmt->execute([$postId]);
    $rows = $stmt->fetchAll();
    if ($rows) {
        return $rows;
    }
    // Legacy fallback
    $post = allxion_db()->prepare('SELECT image_path, image_mime, video_path, video_mime, video_duration FROM posts WHERE id = ?');
    $post->execute([$postId]);
    $p = $post->fetch();
    $out = [];
    if ($p && !empty($p['image_path'])) {
        $out[] = [
            'id' => 0,
            'post_id' => $postId,
            'kind' => 'image',
            'path' => $p['image_path'],
            'mime' => $p['image_mime'],
            'sort_order' => 0,
            'duration_sec' => null,
        ];
    }
    if ($p && !empty($p['video_path'])) {
        $out[] = [
            'id' => 0,
            'post_id' => $postId,
            'kind' => 'video',
            'path' => $p['video_path'],
            'mime' => $p['video_mime'],
            'sort_order' => 0,
            'duration_sec' => $p['video_duration'],
        ];
    }
    return $out;
}

/**
 * @param 'all'|'friends'|'following' $scope
 * @return list<array<string,mixed>>
 */
function allxion_feed(
    ?array $viewer,
    bool $includeAdult,
    int $limit = 50,
    ?int $onlyUserId = null,
    bool $shortsOnly = false,
    string $scope = 'all'
): array {
    require_once __DIR__ . '/blocks.php';
    require_once __DIR__ . '/friends.php';

    $limit = max(1, min(100, $limit));
    if (!in_array($scope, ['all', 'friends', 'following'], true)) {
        $scope = 'all';
    }
    $sql = <<<'SQL'
SELECT p.*, u.username, u.display_name, u.avatar_path, u.privacy_posts, u.privacy_profile,
  (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.kind = 'like') AS like_count,
  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
FROM posts p
JOIN users u ON u.id = p.user_id
WHERE p.moderation_status != 'removed'
  AND (u.banned_at IS NULL OR u.banned_at = '')
SQL;
    if ($shortsOnly) {
        $sql .= " AND p.post_type = 'short'";
    }
    if ($onlyUserId) {
        $sql .= ' AND p.user_id = ' . (int)$onlyUserId;
    }
    if (!$includeAdult) {
        $sql .= ' AND p.is_adult = 0';
    }
    $pool = $shortsOnly ? max(80, $limit * 5) : ($limit * 4);
    $sql .= ' ORDER BY p.created_at DESC LIMIT ' . $pool;
    $rows = allxion_db()->query($sql)->fetchAll();

    $viewerId = $viewer ? (int)$viewer['id'] : 0;
    $out = [];
    foreach ($rows as $row) {
        $authorId = (int)$row['user_id'];
        if ($viewerId > 0 && social_is_blocked($viewerId, $authorId)) {
            continue;
        }
        if (!allxion_post_is_feed_visible($row, $viewer)) {
            continue;
        }
        if ($scope === 'friends' && $viewerId > 0) {
            if ($authorId !== $viewerId && !friends_are_friends($viewerId, $authorId)) {
                continue;
            }
        } elseif ($scope === 'following' && $viewerId > 0) {
            if ($authorId !== $viewerId && !social_is_following($viewerId, $authorId)) {
                continue;
            }
        } elseif (($scope === 'friends' || $scope === 'following') && !$viewerId) {
            continue;
        }
        if (!social_can_view_posts($viewer, $row)) {
            continue;
        }
        $out[] = $row;
        if (!$shortsOnly && count($out) >= $limit) {
            break;
        }
    }

    if ($shortsOnly) {
        $scored = [];
        foreach ($out as $row) {
            $score = (float)($row['like_count'] ?? 0) * 3.0;
            $ageHours = max(0.5, (time() - strtotime((string)$row['created_at'])) / 3600);
            $score += 48.0 / $ageHours;
            if ($viewerId > 0) {
                $authorId = (int)$row['user_id'];
                if (social_is_following($viewerId, $authorId)) {
                    $score += 25;
                }
                if (friends_are_friends($viewerId, $authorId)) {
                    $score += 40;
                }
                if ($authorId === $viewerId) {
                    $score += 5;
                }
            }
            $score += (crc32((string)$row['id'] . (string)(int)(time() / 300)) % 1000) / 1000.0;
            $row['_score'] = $score;
            $scored[] = $row;
        }
        usort($scored, static fn ($a, $b) => $b['_score'] <=> $a['_score']);
        $out = array_slice($scored, 0, $limit);
        foreach ($out as &$r) {
            unset($r['_score']);
        }
        unset($r);
    }

    return $out;
}

function allxion_toggle_like(int $userId, int $postId): void
{
    require_once __DIR__ . '/notifications.php';
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
        $owner = $pdo->prepare('SELECT user_id FROM posts WHERE id = ?');
        $owner->execute([$postId]);
        $oid = (int)$owner->fetchColumn();
        if ($oid > 0) {
            notifications_create($oid, 'like', $userId, $postId);
        }
    }
}

function allxion_delete_post_media_files(int $postId): void
{
    foreach (allxion_post_media($postId) as $m) {
        media_delete_path($m['path'] ?? null);
    }
    $p = allxion_db()->prepare('SELECT image_path, video_path FROM posts WHERE id = ?');
    $p->execute([$postId]);
    $row = $p->fetch();
    if ($row) {
        media_delete_path($row['image_path'] ?? null);
        media_delete_path($row['video_path'] ?? null);
    }
}
