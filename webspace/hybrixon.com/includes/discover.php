<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/social.php';
require_once __DIR__ . '/notifications.php';

/**
 * Extract hashtags from text (without #).
 * @return list<string>
 */
function discover_extract_hashtags(string $text): array
{
    if (!preg_match_all('/#([A-Za-zÄÖÜäöüß0-9_]{2,40})/u', $text, $m)) {
        return [];
    }
    $out = [];
    foreach ($m[1] as $tag) {
        $out[] = mb_strtolower($tag);
    }
    return array_values(array_unique($out));
}

/**
 * Extract @usernames.
 * @return list<string>
 */
function discover_extract_mentions(string $text): array
{
    if (!preg_match_all('/@([A-Za-z0-9_]{3,24})/', $text, $m)) {
        return [];
    }
    return array_values(array_unique(array_map('strval', $m[1])));
}

function discover_index_post(int $postId, int $actorId, string $body): void
{
    $pdo = allxion_db();
    $pdo->prepare('DELETE FROM post_hashtags WHERE post_id = ?')->execute([$postId]);
    $pdo->prepare('DELETE FROM mentions WHERE post_id = ?')->execute([$postId]);

    foreach (discover_extract_hashtags($body) as $tag) {
        $pdo->prepare('INSERT OR IGNORE INTO hashtags (tag) VALUES (?)')->execute([$tag]);
        $h = $pdo->prepare('SELECT id FROM hashtags WHERE lower(tag) = lower(?)');
        $h->execute([$tag]);
        $hid = (int)$h->fetchColumn();
        if ($hid > 0) {
            $pdo->prepare(
                'INSERT OR IGNORE INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)'
            )->execute([$postId, $hid]);
        }
    }

    foreach (discover_extract_mentions($body) as $uname) {
        $u = social_find_user_by_username($uname);
        if (!$u || (int)$u['id'] === $actorId) {
            continue;
        }
        $pdo->prepare(
            'INSERT INTO mentions (actor_id, mentioned_user_id, post_id) VALUES (?, ?, ?)'
        )->execute([$actorId, (int)$u['id'], $postId]);
        notifications_create((int)$u['id'], 'mention', $actorId, $postId, null, null);
    }
}

function discover_index_comment(int $commentId, int $postId, int $actorId, string $body): void
{
    $pdo = allxion_db();
    foreach (discover_extract_mentions($body) as $uname) {
        $u = social_find_user_by_username($uname);
        if (!$u || (int)$u['id'] === $actorId) {
            continue;
        }
        $pdo->prepare(
            'INSERT INTO mentions (actor_id, mentioned_user_id, post_id, comment_id) VALUES (?, ?, ?, ?)'
        )->execute([$actorId, (int)$u['id'], $postId, $commentId]);
        notifications_create((int)$u['id'], 'mention', $actorId, $postId, $commentId, null);
    }
}

/** Render body with links for #tags and @users (escaped safely). */
function discover_format_body(string $body): string
{
    $escaped = e($body);
    $escaped = preg_replace_callback(
        '/#([A-Za-zÄÖÜäöüß0-9_]{2,40})/u',
        static function (array $m): string {
            $tag = $m[1];
            $url = allxion_url('tag.php?t=' . rawurlencode(mb_strtolower($tag)));
            return '<a href="' . e($url) . '">#' . e($tag) . '</a>';
        },
        $escaped
    ) ?? $escaped;
    $escaped = preg_replace_callback(
        '/@([A-Za-z0-9_]{3,24})/',
        static function (array $m): string {
            $name = $m[1];
            $url = user_public_url($name);
            return '<a href="' . e($url) . '">@' . e($name) . '</a>';
        },
        $escaped
    ) ?? $escaped;
    return nl2br($escaped);
}

/**
 * @return list<array<string,mixed>>
 */
function discover_search_users(?array $viewer, string $q, int $limit = 30): array
{
    require_once __DIR__ . '/blocks.php';
    $q = trim($q);
    if (mb_strlen($q) < 2) {
        return [];
    }
    $limit = max(1, min(50, $limit));
    $like = '%' . mb_strtolower($q) . '%';
    $stmt = allxion_db()->prepare(
        "SELECT id, username, display_name, avatar_path, city, postal_code, privacy_search, privacy_profile, banned_at
         FROM users
         WHERE (banned_at IS NULL OR banned_at = '')
           AND (lower(username) LIKE ? OR lower(COALESCE(display_name,'')) LIKE ? OR lower(COALESCE(city,'')) LIKE ?)
         ORDER BY lower(username) ASC
         LIMIT {$limit}"
    );
    $stmt->execute([$like, $like, $like]);
    $out = [];
    foreach ($stmt->fetchAll() as $row) {
        if ($viewer && social_is_blocked((int)$viewer['id'], (int)$row['id'])) {
            continue;
        }
        $searchLevel = (string)($row['privacy_search'] ?? 'public');
        if ($searchLevel === 'private') {
            if (!$viewer || ((int)$viewer['id'] !== (int)$row['id'] && !user_is_admin($viewer))) {
                continue;
            }
        } elseif ($searchLevel === 'friends') {
            if (!$viewer) {
                continue;
            }
            require_once __DIR__ . '/friends.php';
            if ((int)$viewer['id'] !== (int)$row['id']
                && !user_is_admin($viewer)
                && !friends_are_friends((int)$viewer['id'], (int)$row['id'])) {
                continue;
            }
        } elseif ($searchLevel === 'followers') {
            if (!$viewer) {
                continue;
            }
            if ((int)$viewer['id'] !== (int)$row['id']
                && !user_is_admin($viewer)
                && !social_is_following((int)$viewer['id'], (int)$row['id'])) {
                continue;
            }
        }
        if (!social_can_view_profile($viewer, $row)) {
            continue;
        }
        $out[] = $row;
    }
    return $out;
}

/**
 * @return list<array<string,mixed>>
 */
function discover_posts_by_tag(?array $viewer, string $tag, bool $includeAdult, int $limit = 40): array
{
    require_once __DIR__ . '/posts.php';
    require_once __DIR__ . '/blocks.php';
    $tag = mb_strtolower(trim($tag));
    $tag = ltrim($tag, '#');
    if ($tag === '') {
        return [];
    }
    $limit = max(1, min(80, $limit));
    $sql = <<<SQL
SELECT p.*, u.username, u.display_name, u.avatar_path, u.privacy_posts, u.privacy_profile,
  (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id AND r.kind = 'like') AS like_count
FROM posts p
JOIN users u ON u.id = p.user_id
JOIN post_hashtags ph ON ph.post_id = p.id
JOIN hashtags h ON h.id = ph.hashtag_id
WHERE lower(h.tag) = lower(?)
  AND p.moderation_status != 'removed'
  AND (u.banned_at IS NULL OR u.banned_at = '')
ORDER BY p.created_at DESC
LIMIT 
SQL;
    $sql .= (string)($limit * 3);
    $stmt = allxion_db()->prepare($sql);
    $stmt->execute([$tag]);
    $out = [];
    foreach ($stmt->fetchAll() as $row) {
        if (!$includeAdult && !empty($row['is_adult'])) {
            continue;
        }
        if ($viewer && social_is_blocked((int)$viewer['id'], (int)$row['user_id'])) {
            continue;
        }
        if (!allxion_post_is_feed_visible($row, $viewer)) {
            continue;
        }
        if (!social_can_view_posts($viewer, $row)) {
            continue;
        }
        $out[] = $row;
        if (count($out) >= $limit) {
            break;
        }
    }
    return $out;
}
