<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

/**
 * Merge @HybrixonTeam → @Hybrixon (keep Team account, take brand logo/settings,
 * drop the auto-created duplicate). Idempotent.
 */
function hybrixon_merge_official_accounts(PDO $pdo): void
{
    $official = HYBRIXON_OFFICIAL_USERNAME;
    $legacyTeam = HYBRIXON_LEGACY_TEAM_USERNAME;

    $find = $pdo->prepare(
        'SELECT id, username, email, avatar_path, banner_path, display_name, bio, password_hash, is_admin
         FROM users WHERE lower(username) = lower(?) LIMIT 1'
    );

    $find->execute([$legacyTeam]);
    $team = $find->fetch() ?: null;

    $find->execute([$official]);
    $brand = $find->fetch() ?: null;

    // Nothing to merge: only brand or neither
    if (!$team) {
        return;
    }

    $keepId = (int)$team['id'];

    // Drop duplicate @Hybrixon (auto-seeded) after moving any content onto Team
    if ($brand && (int)$brand['id'] !== $keepId) {
        $dropId = (int)$brand['id'];
        hybrixon_reassign_user_content($pdo, $dropId, $keepId);

        // Free username/email for rename
        $pdo->prepare(
            'UPDATE users SET username = ?, email = ? WHERE id = ?'
        )->execute([
            '__merged_hx_' . $dropId,
            'merged_' . $dropId . '@hybrixon.invalid',
            $dropId,
        ]);
        $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$dropId]);
    }

    // Rename Team → Hybrixon (username) if needed
    $find->execute([$official]);
    $taken = $find->fetch();
    if (!$taken || (int)$taken['id'] === $keepId) {
        if (mb_strtolower((string)$team['username'], 'UTF-8') !== mb_strtolower($official, 'UTF-8')) {
            $pdo->prepare('UPDATE users SET username = ? WHERE id = ?')
                ->execute([$official, $keepId]);
        }
    }
}

/**
 * Move rows from $fromId to $toId. Skips conflicting unique pairs.
 */
function hybrixon_reassign_user_content(PDO $pdo, int $fromId, int $toId): void
{
    if ($fromId <= 0 || $toId <= 0 || $fromId === $toId) {
        return;
    }

    foreach (['posts', 'stories', 'albums', 'comments', 'saved_posts', 'user_ip_log', 'remember_tokens', 'age_audit'] as $table) {
        try {
            $pdo->prepare("UPDATE {$table} SET user_id = ? WHERE user_id = ?")
                ->execute([$toId, $fromId]);
        } catch (Throwable) {
            // table may not exist yet in older DBs
        }
    }

    try {
        $pdo->prepare('UPDATE community_groups SET owner_id = ? WHERE owner_id = ?')
            ->execute([$toId, $fromId]);
    } catch (Throwable) {
    }

    try {
        $pdo->prepare(
            'UPDATE group_members SET user_id = ? WHERE user_id = ?
             AND group_id NOT IN (SELECT group_id FROM group_members WHERE user_id = ?)'
        )->execute([$toId, $fromId, $toId]);
        $pdo->prepare('DELETE FROM group_members WHERE user_id = ?')->execute([$fromId]);
    } catch (Throwable) {
    }

    try {
        $pdo->prepare('UPDATE group_posts SET user_id = ? WHERE user_id = ?')
            ->execute([$toId, $fromId]);
    } catch (Throwable) {
    }

    // Follows
    try {
        $pdo->prepare(
            'UPDATE OR IGNORE follows SET follower_id = ? WHERE follower_id = ?'
        )->execute([$toId, $fromId]);
        $pdo->prepare('DELETE FROM follows WHERE follower_id = ?')->execute([$fromId]);
        $pdo->prepare(
            'UPDATE OR IGNORE follows SET following_id = ? WHERE following_id = ?'
        )->execute([$toId, $fromId]);
        $pdo->prepare('DELETE FROM follows WHERE following_id = ?')->execute([$fromId]);
        $pdo->prepare('DELETE FROM follows WHERE follower_id = following_id')->execute();
    } catch (Throwable) {
    }

    // Friendships involving $fromId → rebuild onto $toId
    try {
        $rows = $pdo->prepare(
            'SELECT * FROM friendships WHERE user_a = ? OR user_b = ?'
        );
        $rows->execute([$fromId, $fromId]);
        foreach ($rows->fetchAll() as $row) {
            $other = (int)$row['user_a'] === $fromId ? (int)$row['user_b'] : (int)$row['user_a'];
            if ($other === $toId) {
                $pdo->prepare('DELETE FROM friendships WHERE user_a = ? AND user_b = ?')
                    ->execute([(int)$row['user_a'], (int)$row['user_b']]);
                continue;
            }
            $a = min($toId, $other);
            $b = max($toId, $other);
            $requester = (int)$row['requester_id'] === $fromId ? $toId : (int)$row['requester_id'];
            $pdo->prepare('DELETE FROM friendships WHERE user_a = ? AND user_b = ?')
                ->execute([(int)$row['user_a'], (int)$row['user_b']]);
            $pdo->prepare(
                "INSERT INTO friendships (user_a, user_b, requester_id, status, updated_at)
                 VALUES (?, ?, ?, ?, datetime('now'))
                 ON CONFLICT(user_a, user_b) DO UPDATE SET
                   status = CASE
                     WHEN friendships.status = 'accepted' OR excluded.status = 'accepted' THEN 'accepted'
                     ELSE excluded.status
                   END,
                   updated_at = datetime('now')"
            )->execute([$a, $b, $requester, (string)$row['status']]);
        }
    } catch (Throwable) {
    }

    // Reactions / notifications / mentions / blocks — best effort
    foreach ([
        'UPDATE reactions SET user_id = ? WHERE user_id = ?',
        'UPDATE notifications SET user_id = ? WHERE user_id = ?',
        'UPDATE notifications SET actor_id = ? WHERE actor_id = ?',
        'UPDATE mentions SET actor_id = ? WHERE actor_id = ?',
        'UPDATE mentions SET mentioned_user_id = ? WHERE mentioned_user_id = ?',
        'UPDATE content_reports SET reporter_id = ? WHERE reporter_id = ?',
        'UPDATE users SET partner_id = NULL WHERE partner_id = ?',
        'UPDATE users SET partner_pending_id = NULL WHERE partner_pending_id = ?',
    ] as $sql) {
        try {
            if (substr_count($sql, '?') === 1) {
                $pdo->prepare($sql)->execute([$fromId]);
            } else {
                $pdo->prepare($sql)->execute([$toId, $fromId]);
            }
        } catch (Throwable) {
        }
    }

    try {
        $pdo->prepare(
            'UPDATE OR IGNORE user_blocks SET blocker_id = ? WHERE blocker_id = ?'
        )->execute([$toId, $fromId]);
        $pdo->prepare('DELETE FROM user_blocks WHERE blocker_id = ?')->execute([$fromId]);
        $pdo->prepare(
            'UPDATE OR IGNORE user_blocks SET blocked_id = ? WHERE blocked_id = ?'
        )->execute([$toId, $fromId]);
        $pdo->prepare('DELETE FROM user_blocks WHERE blocked_id = ?')->execute([$fromId]);
        $pdo->prepare('DELETE FROM user_blocks WHERE blocker_id = blocked_id')->execute();
    } catch (Throwable) {
    }
}

/**
 * Ensure the public @Hybrixon brand account exists with logo media
 * and auto-accepts friend requests. Idempotent — safe on every migrate.
 */
function hybrixon_ensure_official_account(PDO $pdo): void
{
    hybrixon_merge_official_accounts($pdo);

    $username = HYBRIXON_OFFICIAL_USERNAME;
    $stmt = $pdo->prepare(
        'SELECT id, username, avatar_path, banner_path, display_name, bio
         FROM users WHERE lower(username) = lower(?) LIMIT 1'
    );
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user) {
        // Fallback only if neither Team nor Hybrixon existed
        $hash = password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT);
        $pdo->prepare(
            "INSERT INTO users (
                username, email, password_hash, birthdate,
                display_name, bio, city, postal_code,
                privacy_profile, privacy_posts, privacy_friends, privacy_search,
                privacy_dms, privacy_albums, privacy_stories, privacy_groups,
                theme, brand_style, auto_accept_friends,
                legal_accepted_at, legal_docs_version,
                age_status, age_verified_at, age_provider
             ) VALUES (
                ?, ?, ?, '2000-01-01',
                'Hybrixon', ?, 'Berlin', NULL,
                'public', 'public', 'public', 'public',
                'everyone', 'public', 'public', 'public',
                'light', 'logo_text', 1,
                datetime('now'), ?,
                'approved', datetime('now'), 'admin'
             )"
        )->execute([
            $username,
            HYBRIXON_OFFICIAL_EMAIL,
            $hash,
            ALLXION_TAGLINE,
            defined('LEGAL_DOCS_VERSION') ? LEGAL_DOCS_VERSION : 'bootstrap',
        ]);
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if (!$user) {
            return;
        }
    }

    $id = (int)$user['id'];
    // Always use brand logo assets for the official profile
    $avatarPath = hybrixon_official_ensure_media(
        '',
        'avatars',
        'hybrixon-official-avatar',
        ALLXION_ROOT . '/assets/img/logo-avatar.png'
    );
    $bannerPath = hybrixon_official_ensure_media(
        '',
        'banners',
        'hybrixon-official-banner',
        ALLXION_ROOT . '/assets/img/logo-banner.png'
    );

    $pdo->prepare(
        "UPDATE users SET
            display_name = 'Hybrixon',
            avatar_path = COALESCE(?, avatar_path),
            banner_path = COALESCE(?, banner_path),
            auto_accept_friends = 1,
            privacy_profile = 'public',
            privacy_posts = 'public',
            privacy_friends = 'public',
            privacy_search = 'public'
         WHERE id = ?"
    )->execute([
        $avatarPath,
        $bannerPath,
        $id,
    ]);

    // Accept any leftover pending requests to this account
    $pending = $pdo->prepare(
        "SELECT requester_id FROM friendships
         WHERE status = 'pending' AND requester_id != ?
           AND (user_a = ? OR user_b = ?)"
    );
    $pending->execute([$id, $id, $id]);
    foreach ($pending->fetchAll() as $row) {
        $from = (int)$row['requester_id'];
        [$a, $b] = $from < $id ? [$from, $id] : [$id, $from];
        $pdo->prepare(
            "UPDATE friendships SET status = 'accepted', updated_at = datetime('now')
             WHERE user_a = ? AND user_b = ?"
        )->execute([$a, $b]);
    }
}

/**
 * Copy brand asset into uploads with a stable hex filename (matches media path rules).
 */
function hybrixon_official_ensure_media(
    string $currentPath,
    string $subdir,
    string $stableKey,
    string $sourceFile
): ?string {
    $subdir = preg_replace('/[^a-z0-9_-]/i', '', $subdir) ?: 'avatars';
    $dir = ALLXION_UPLOADS . '/' . $subdir;
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }
    $name = substr(hash('sha256', $stableKey), 0, 32) . '.png';
    $rel = $subdir . '/' . $name;
    $dest = ALLXION_UPLOADS . '/' . $rel;

    if (is_file($sourceFile)) {
        // Refresh from brand asset when missing or empty
        if (!is_file($dest) || filesize($dest) === 0) {
            if (!@copy($sourceFile, $dest)) {
                return $currentPath !== '' ? $currentPath : null;
            }
            @chmod($dest, 0640);
        }
        return $rel;
    }

    if ($currentPath !== '' && is_file(ALLXION_UPLOADS . '/' . $currentPath)) {
        return $currentPath;
    }
    return is_file($dest) ? $rel : ($currentPath !== '' ? $currentPath : null);
}

function hybrixon_is_official_username(string $username): bool
{
    $name = mb_strtolower(trim($username), 'UTF-8');
    return $name === mb_strtolower(HYBRIXON_OFFICIAL_USERNAME, 'UTF-8')
        || $name === mb_strtolower(HYBRIXON_LEGACY_TEAM_USERNAME, 'UTF-8');
}

function hybrixon_user_auto_accepts_friends(array $user): bool
{
    return !empty($user['auto_accept_friends']) || hybrixon_is_official_username((string)($user['username'] ?? ''));
}
