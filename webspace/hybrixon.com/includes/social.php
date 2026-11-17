<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/media_upload.php';

function user_public_url(string $username): string
{
    return allxion_url('u.php?u=' . rawurlencode($username));
}

function user_profile_link_html(array $user, bool $withAt = true): string
{
    $name = (string)$user['username'];
    $label = $withAt ? '@' . $name : $name;
    return '<a href="' . e(user_public_url($name)) . '">' . e($label) . '</a>';
}

function privacy_level(array $user, string $field): string
{
    $val = (string)($user[$field] ?? 'public');
    $allowed = ['public', 'friends', 'followers', 'private', 'everyone', 'none'];
    return in_array($val, $allowed, true) ? $val : 'public';
}

function social_privacy_allows(?array $viewer, array $owner, string $field, string $default = 'public'): bool
{
    if ($viewer && ((int)$viewer['id'] === (int)$owner['id'] || user_is_admin($viewer))) {
        return true;
    }
    $raw = (string)($owner[$field] ?? $default);
    $level = in_array($raw, ['public', 'friends', 'followers', 'private', 'everyone', 'none'], true)
        ? $raw
        : $default;
    if ($level === 'public' || $level === 'everyone') {
        return true;
    }
    if ($level === 'private' || $level === 'none' || !$viewer) {
        return false;
    }
    if ($level === 'followers') {
        return social_is_following((int)$viewer['id'], (int)$owner['id']);
    }
    if ($level === 'friends') {
        require_once __DIR__ . '/friends.php';
        return friends_are_friends((int)$viewer['id'], (int)$owner['id']);
    }
    return false;
}

function social_is_following(int $followerId, int $followingId): bool
{
    if ($followerId <= 0 || $followingId <= 0 || $followerId === $followingId) {
        return false;
    }
    $stmt = allxion_db()->prepare(
        'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
    );
    $stmt->execute([$followerId, $followingId]);
    return (bool)$stmt->fetchColumn();
}

function social_follow(int $followerId, int $followingId): array
{
    if ($followerId === $followingId) {
        return ['Du kannst dir nicht selbst folgen.'];
    }
    $exists = allxion_db()->prepare('SELECT id, banned_at FROM users WHERE id = ?');
    $exists->execute([$followingId]);
    $target = $exists->fetch();
    if (!$target || !empty($target['banned_at'])) {
        return ['Profil nicht gefunden.'];
    }
    allxion_db()->prepare(
        'INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)'
    )->execute([$followerId, $followingId]);
    return [];
}

function social_unfollow(int $followerId, int $followingId): void
{
    allxion_db()->prepare(
        'DELETE FROM follows WHERE follower_id = ? AND following_id = ?'
    )->execute([$followerId, $followingId]);
}

function social_counts(int $userId): array
{
    $followers = (int)allxion_db()->query(
        'SELECT COUNT(*) FROM follows WHERE following_id = ' . (int)$userId
    )->fetchColumn();
    $following = (int)allxion_db()->query(
        'SELECT COUNT(*) FROM follows WHERE follower_id = ' . (int)$userId
    )->fetchColumn();
    return ['followers' => $followers, 'following' => $following];
}

/**
 * Can $viewer see the profile card of $owner?
 */
function social_can_view_profile(?array $viewer, array $owner): bool
{
    if (!empty($owner['banned_at'])) {
        return false;
    }
    if ($viewer && social_is_blocked_safe((int)$viewer['id'], (int)$owner['id'])
        && !user_is_admin($viewer)) {
        return false;
    }
    return social_privacy_allows($viewer, $owner, 'privacy_profile', 'public');
}

function social_is_blocked_safe(int $a, int $b): bool
{
    if ($a <= 0 || $b <= 0 || $a === $b) {
        return false;
    }
    static $loaded = false;
    if (!$loaded) {
        require_once __DIR__ . '/blocks.php';
        $loaded = true;
    }
    return social_is_blocked($a, $b);
}

function social_can_view_posts(?array $viewer, array $owner): bool
{
    if (!social_can_view_profile($viewer, $owner)) {
        return false;
    }
    return social_privacy_allows($viewer, $owner, 'privacy_posts', 'public');
}

function social_can_view_friends(?array $viewer, array $owner): bool
{
    if (!social_can_view_profile($viewer, $owner)) {
        return false;
    }
    return social_privacy_allows($viewer, $owner, 'privacy_friends', 'friends');
}

function social_can_dm(?array $viewer, array $owner): bool
{
    if (!$viewer) {
        return false;
    }
    if ((int)$viewer['id'] === (int)$owner['id']) {
        return false;
    }
    // Platform admins may initiate a moderation/support DM regardless of the
    // recipient's friends/followers/none preference. Other DM rules remain.
    if (user_is_admin($viewer)) {
        return true;
    }
    $level = privacy_level($owner, 'privacy_dms');
    if ($level === 'none') {
        return false;
    }
    if ($level === 'everyone' || $level === 'public') {
        return true;
    }
    if ($level === 'friends') {
        require_once __DIR__ . '/friends.php';
        return friends_are_friends((int)$viewer['id'], (int)$owner['id']);
    }
    return social_is_following((int)$viewer['id'], (int)$owner['id']);
}

function social_find_user_by_username(string $username): ?array
{
    $stmt = allxion_db()->prepare(
        'SELECT * FROM users WHERE lower(username) = lower(?) LIMIT 1'
    );
    $stmt->execute([trim($username)]);
    $row = $stmt->fetch();
    return $row ?: null;
}

/**
 * German city from official list (required). PLZ optional filter / match.
 * @return list<string>
 */
function social_validate_location(?string $plz, ?string $city, bool $required = true): array
{
    require_once __DIR__ . '/geo.php';
    $plz = trim((string)$plz);
    $city = trim((string)$city);
    if (!$required && $plz === '' && $city === '') {
        return [];
    }
    if ($city === '') {
        return ['Bitte einen Ort aus der Liste wählen.'];
    }
    if ($plz !== '' && !preg_match('/^\d{5}$/', $plz)) {
        return ['PLZ muss 5 Ziffern haben oder leer bleiben.'];
    }
    if (!geo_is_valid_location($plz, $city)) {
        if ($plz !== '') {
            return ['PLZ und Ort passen nicht zusammen — bitte Ort aus dem Pulldown wählen.'];
        }
        return ['Bitte einen gültigen Ort aus der Vorschlagsliste wählen.'];
    }
    return [];
}

/**
 * @return list<string>
 */
function social_update_profile(array $user, array $input, ?array $avatarFile = null, ?array $bannerFile = null): array
{
    $display = trim((string)($input['display_name'] ?? ''));
    $bio = trim((string)($input['bio'] ?? ''));
    $plz = trim((string)($input['postal_code'] ?? ''));
    $city = trim((string)($input['city'] ?? ''));
    $privacyProfile = (string)($input['privacy_profile'] ?? 'public');
    $privacyPosts = (string)($input['privacy_posts'] ?? 'public');
    $privacyDms = (string)($input['privacy_dms'] ?? 'everyone');
    $privacyFriends = (string)($input['privacy_friends'] ?? 'friends');
    $privacyAlbums = (string)($input['privacy_albums'] ?? 'friends');
    $privacyStories = (string)($input['privacy_stories'] ?? 'friends');
    $privacyGroups = (string)($input['privacy_groups'] ?? 'public');
    $privacyRelationship = (string)($input['privacy_relationship'] ?? 'friends');
    $privacySearch = (string)($input['privacy_search'] ?? 'public');
    $theme = (string)($input['theme'] ?? 'light');
    $brandStyle = (string)($input['brand_style'] ?? 'logo_text');
    $relationshipStatus = (string)($input['relationship_status'] ?? ($user['relationship_status'] ?? 'unspecified'));
    require_once __DIR__ . '/i18n.php';
    $uiLang = (string)($input['ui_lang'] ?? ($user['ui_lang'] ?? 'de'));
    if (!hybrixon_locale_valid($uiLang)) {
        $uiLang = 'de';
    }

    require_once __DIR__ . '/sidebar-config.php';
    [$sidebarItemsJson, $sidebarErrors] = hybrixon_sidebar_parse_settings($input, $user);

    $emailPrefs = [
        'email_notify_enabled' => !empty($input['email_notify_enabled']) ? 1 : 0,
        'email_notify_activity' => !empty($input['email_notify_activity']) ? 1 : 0,
        'email_notify_messages' => !empty($input['email_notify_messages']) ? 1 : 0,
        'email_notify_friend_posts' => !empty($input['email_notify_friend_posts']) ? 1 : 0,
        'email_notify_group_posts' => !empty($input['email_notify_group_posts']) ? 1 : 0,
    ];
    $pushNotifyEnabled = !empty($input['push_notify_enabled']) ? 1 : 0;
    $autoplayVideos = !empty($input['autoplay_videos']) ? 1 : 0;

    $errors = [];
    if ($display !== '' && mb_strlen($display) > 60) {
        $errors[] = 'Anzeigename max. 60 Zeichen.';
    }
    if (mb_strlen($bio) > 500) {
        $errors[] = 'Bio max. 500 Zeichen.';
    }
    $errors = array_merge($errors, social_validate_location($plz, $city, true));
    $errors = array_merge($errors, $sidebarErrors);
    $visOpts = ['public', 'friends', 'followers', 'private'];
    foreach ([
        'privacy_profile' => $privacyProfile,
        'privacy_posts' => $privacyPosts,
        'privacy_friends' => $privacyFriends,
        'privacy_albums' => $privacyAlbums,
        'privacy_stories' => $privacyStories,
        'privacy_groups' => $privacyGroups,
        'privacy_relationship' => $privacyRelationship,
        'privacy_search' => $privacySearch,
    ] as $k => $v) {
        if (!in_array($v, $visOpts, true)) {
            $errors[] = 'Ungültige Privatsphäre-Einstellung (' . $k . ').';
        }
    }
    if (!in_array($privacyDms, ['everyone', 'friends', 'followers', 'none'], true)) {
        $errors[] = 'Ungültige DM-Privatsphäre.';
    }
    if (!in_array($theme, ['dark', 'light'], true)) {
        $errors[] = 'Ungültiges Theme.';
    }
    if (!isset(hybrixon_brand_styles()[$brandStyle])) {
        $errors[] = 'Ungültige Markenanzeige.';
    }
    require_once __DIR__ . '/relationship.php';
    if (!isset(relationship_status_labels()[$relationshipStatus])) {
        $errors[] = 'Ungültiger Beziehungsstatus.';
    }
    if ($errors) {
        return $errors;
    }

    $avatarPath = $user['avatar_path'] ?? null;
    $hasAvatar = $avatarFile && (($avatarFile['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE);
    if ($hasAvatar) {
        $stored = media_store_image($avatarFile, 'avatars');
        if (!$stored['ok']) {
            return [$stored['error']];
        }
        media_delete_path($avatarPath);
        $avatarPath = $stored['path'];
    }

    $bannerPath = $user['banner_path'] ?? null;
    if (!empty($input['remove_banner'])) {
        media_delete_path($bannerPath);
        $bannerPath = null;
    }
    $hasBanner = $bannerFile && (($bannerFile['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE);
    if ($hasBanner) {
        $storedB = media_store_image($bannerFile, 'banners');
        if (!$storedB['ok']) {
            return [$storedB['error']];
        }
        media_delete_path($bannerPath);
        $bannerPath = $storedB['path'];
    }

    allxion_db()->prepare(
        'UPDATE users SET display_name = ?, bio = ?, postal_code = ?, city = ?,
         privacy_profile = ?, privacy_posts = ?, privacy_dms = ?,
         privacy_friends = ?, privacy_albums = ?, privacy_stories = ?,
         privacy_groups = ?, privacy_relationship = ?, privacy_search = ?,
         theme = ?, brand_style = ?, sidebar_items = ?,
         email_notify_enabled = ?, email_notify_activity = ?, email_notify_messages = ?,
         email_notify_friend_posts = ?, email_notify_group_posts = ?,
         push_notify_enabled = ?, autoplay_videos = ?,
         relationship_status = ?, avatar_path = ?, banner_path = ?, ui_lang = ?
         WHERE id = ?'
    )->execute([
        $display !== '' ? $display : null,
        $bio !== '' ? $bio : null,
        $plz !== '' ? $plz : null,
        $city,
        $privacyProfile,
        $privacyPosts,
        $privacyDms,
        $privacyFriends,
        $privacyAlbums,
        $privacyStories,
        $privacyGroups,
        $privacyRelationship,
        $privacySearch,
        $theme,
        $brandStyle,
        $sidebarItemsJson,
        $emailPrefs['email_notify_enabled'],
        $emailPrefs['email_notify_activity'],
        $emailPrefs['email_notify_messages'],
        $emailPrefs['email_notify_friend_posts'],
        $emailPrefs['email_notify_group_posts'],
        $pushNotifyEnabled,
        $autoplayVideos,
        $relationshipStatus,
        $avatarPath,
        $bannerPath,
        $uiLang,
        (int)$user['id'],
    ]);

    hybrixon_set_theme_cookie($theme);
    hybrixon_set_brand_cookie($brandStyle);
    hybrixon_set_lang_cookie($uiLang);
    if (in_array($relationshipStatus, ['single', 'unspecified'], true)) {
        relationship_clear_partner((int)$user['id']);
    }

    $partnerName = trim((string)($input['partner_username'] ?? ''));
    if ($partnerName !== '') {
        if (in_array($relationshipStatus, ['single', 'unspecified'], true)) {
            return ['Bitte zuerst einen Beziehungsstatus wählen (nicht „Single“ / „Keine Angabe“), dann den Partner eintragen.'];
        }
        $reqErrors = relationship_request_partner((int)$user['id'], $partnerName);
        if ($reqErrors) {
            return $reqErrors;
        }
    }

    // Optional: neues Profilbild / Banner als Feed-Beitrag teilen
    require_once __DIR__ . '/posts.php';
    $uid = (int)$user['id'];
    if ($hasAvatar && !empty($input['share_avatar_post']) && $avatarPath) {
        allxion_share_images_as_post($uid, 'hat das Profilbild aktualisiert.', [(string)$avatarPath]);
    }
    if ($hasBanner && !empty($input['share_banner_post']) && $bannerPath) {
        allxion_share_images_as_post($uid, 'hat das Profilbanner aktualisiert.', [(string)$bannerPath]);
    }

    return [];
}

function social_track_ip(int $userId): void
{
    $ip = media_client_ip();
    if ($ip === '') {
        return;
    }
    $ua = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300);
    allxion_db()->prepare(
        'UPDATE users SET last_ip = ?, last_ip_at = datetime(\'now\'), last_seen_at = datetime(\'now\') WHERE id = ?'
    )->execute([$ip, $userId]);

    // Log only if IP changed vs last log entry
    $last = allxion_db()->prepare(
        'SELECT ip FROM user_ip_log WHERE user_id = ? ORDER BY id DESC LIMIT 1'
    );
    $last->execute([$userId]);
    $prev = $last->fetchColumn();
    if ($prev !== $ip) {
        allxion_db()->prepare(
            'INSERT INTO user_ip_log (user_id, ip, user_agent) VALUES (?, ?, ?)'
        )->execute([$userId, $ip, $ua]);
    }
}

/**
 * @return list<array<string,mixed>>
 */
function social_ip_history(int $userId, int $limit = 30): array
{
    $limit = max(1, min(100, $limit));
    $stmt = allxion_db()->prepare(
        'SELECT ip, user_agent, created_at FROM user_ip_log WHERE user_id = ? ORDER BY id DESC LIMIT ' . $limit
    );
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
}
