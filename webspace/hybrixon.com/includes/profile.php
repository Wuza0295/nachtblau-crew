<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

const PROFILE_AVATAR_MAX_BYTES = 2_000_000;
const PROFILE_BANNER_MAX_BYTES = 4_000_000;
/** @var list<string> */
const PROFILE_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

function user_is_brand(array $user): bool
{
    return (($user['account_kind'] ?? 'user') === 'brand') || !empty($user['login_disabled']);
}

function user_login_disabled(array $user): bool
{
    return !empty($user['login_disabled']) || (($user['account_kind'] ?? '') === 'brand');
}

function user_display_name(array $user): string
{
    $d = trim((string)($user['display_name'] ?? ''));
    return $d !== '' ? $d : (string)$user['username'];
}

function profile_media_url(?string $relative, string $kind, int $userId): ?string
{
    if ($relative === null || $relative === '') {
        return null;
    }
    return allxion_url('profile-media.php?u=' . $userId . '&t=' . rawurlencode($kind));
}

/**
 * @return list<array<string,mixed>>
 */
function profile_admin_postable_accounts(): array
{
    $sql = "SELECT id, username, display_name, avatar_path, account_kind
            FROM users
            WHERE admin_postable = 1
              AND (banned_at IS NULL OR banned_at = '')
            ORDER BY lower(COALESCE(display_name, username)) ASC";
    return allxion_db()->query($sql)->fetchAll();
}

function profile_find_by_username(string $username): ?array
{
    $stmt = allxion_db()->prepare(
        "SELECT id, username, email, birthdate, display_name, bio, location, website,
                link_instagram, link_facebook, link_tiktok, link_x,
                avatar_path, banner_path, account_kind, login_disabled, admin_postable,
                age_status, age_verified_at, is_admin, created_at
         FROM users WHERE lower(username) = lower(?) LIMIT 1"
    );
    $stmt->execute([trim($username)]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function profile_find_by_id(int $id): ?array
{
    $stmt = allxion_db()->prepare(
        "SELECT id, username, email, birthdate, display_name, bio, location, website,
                link_instagram, link_facebook, link_tiktok, link_x,
                avatar_path, banner_path, account_kind, login_disabled, admin_postable,
                age_status, age_verified_at, is_admin, created_at
         FROM users WHERE id = ?"
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

/**
 * Public profile payload for API / pages.
 *
 * @return array<string,mixed>
 */
function profile_public_payload(array $user, ?array $viewer = null): array
{
    $id = (int)$user['id'];
    $isOwner = $viewer && (int)$viewer['id'] === $id;
    $isAdmin = $viewer && user_is_admin($viewer);
    return [
        'id' => $id,
        'username' => (string)$user['username'],
        'displayName' => user_display_name($user),
        'bio' => (string)($user['bio'] ?? ''),
        'location' => (string)($user['location'] ?? ''),
        'website' => (string)($user['website'] ?? ''),
        'instagram' => (string)($user['link_instagram'] ?? ''),
        'facebook' => (string)($user['link_facebook'] ?? ''),
        'tiktok' => (string)($user['link_tiktok'] ?? ''),
        'x' => (string)($user['link_x'] ?? ''),
        'avatarUrl' => profile_media_url($user['avatar_path'] ?? null, 'avatar', $id),
        'bannerUrl' => profile_media_url($user['banner_path'] ?? null, 'banner', $id),
        'isBrand' => user_is_brand($user),
        'isAdmin' => !empty($user['is_admin']),
        'ageVerified' => (($user['age_status'] ?? '') === 'approved') && !empty($user['age_verified_at']),
        'createdAt' => (string)($user['created_at'] ?? ''),
        'canEdit' => (bool)($isOwner || ($isAdmin && user_is_brand($user))),
        'email' => ($isOwner || $isAdmin) ? (string)($user['email'] ?? '') : null,
    ];
}

function profile_normalize_handle(string $value, string $network): string
{
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    $value = preg_replace('#^https?://(www\.)?#i', '', $value) ?? $value;
    $value = rtrim($value, '/');
    $value = ltrim($value, '@');
    return substr($value, 0, 120);
}

function profile_normalize_website(string $url): string
{
    $url = trim($url);
    if ($url === '') {
        return '';
    }
    if (!preg_match('#^https?://#i', $url)) {
        $url = 'https://' . $url;
    }
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return '';
    }
    return substr($url, 0, 240);
}

/**
 * @param array<string,mixed> $input
 * @param array<string,mixed>|null $avatarFile
 * @param array<string,mixed>|null $bannerFile
 * @return list<string>
 */
function profile_update(
    array $actor,
    int $targetUserId,
    array $input,
    ?array $avatarFile = null,
    ?array $bannerFile = null
): array {
    $target = profile_find_by_id($targetUserId);
    if (!$target) {
        return ['Profil nicht gefunden.'];
    }
    $isOwner = (int)$actor['id'] === $targetUserId;
    $isAdmin = user_is_admin($actor);
    if (!$isOwner && !($isAdmin && user_is_brand($target))) {
        return ['Keine Berechtigung.'];
    }

    $display = trim((string)($input['display_name'] ?? $input['displayName'] ?? ''));
    $bio = trim((string)($input['bio'] ?? ''));
    $location = trim((string)($input['location'] ?? ''));
    $website = profile_normalize_website((string)($input['website'] ?? ''));
    $ig = profile_normalize_handle((string)($input['instagram'] ?? $input['link_instagram'] ?? ''), 'instagram');
    $fb = profile_normalize_handle((string)($input['facebook'] ?? $input['link_facebook'] ?? ''), 'facebook');
    $tt = profile_normalize_handle((string)($input['tiktok'] ?? $input['link_tiktok'] ?? ''), 'tiktok');
    $x = profile_normalize_handle((string)($input['x'] ?? $input['link_x'] ?? ''), 'x');

    if (mb_strlen($display) > 48) {
        return ['Anzeigename max. 48 Zeichen.'];
    }
    if (mb_strlen($bio) > 500) {
        return ['Bio max. 500 Zeichen.'];
    }
    if (mb_strlen($location) > 80) {
        return ['Ort max. 80 Zeichen.'];
    }
    if (($input['website'] ?? '') !== '' && $website === '') {
        return ['Website-URL ungültig.'];
    }

    $avatarPath = $target['avatar_path'] ?? null;
    $bannerPath = $target['banner_path'] ?? null;

    if ($avatarFile && (($avatarFile['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE)) {
        $stored = profile_store_image($avatarFile, 'avatars', PROFILE_AVATAR_MAX_BYTES);
        if (!$stored['ok']) {
            return [$stored['error']];
        }
        profile_delete_image(is_string($avatarPath) ? $avatarPath : null);
        $avatarPath = $stored['path'];
    }
    if ($bannerFile && (($bannerFile['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE)) {
        $stored = profile_store_image($bannerFile, 'banners', PROFILE_BANNER_MAX_BYTES);
        if (!$stored['ok']) {
            return [$stored['error']];
        }
        profile_delete_image(is_string($bannerPath) ? $bannerPath : null);
        $bannerPath = $stored['path'];
    }

    if (!empty($input['remove_avatar'])) {
        profile_delete_image(is_string($avatarPath) ? $avatarPath : null);
        $avatarPath = null;
    }
    if (!empty($input['remove_banner'])) {
        profile_delete_image(is_string($bannerPath) ? $bannerPath : null);
        $bannerPath = null;
    }

    allxion_db()->prepare(
        "UPDATE users SET
            display_name = ?, bio = ?, location = ?, website = ?,
            link_instagram = ?, link_facebook = ?, link_tiktok = ?, link_x = ?,
            avatar_path = ?, banner_path = ?
         WHERE id = ?"
    )->execute([
        $display !== '' ? $display : null,
        $bio !== '' ? $bio : null,
        $location !== '' ? $location : null,
        $website !== '' ? $website : null,
        $ig !== '' ? $ig : null,
        $fb !== '' ? $fb : null,
        $tt !== '' ? $tt : null,
        $x !== '' ? $x : null,
        $avatarPath,
        $bannerPath,
        $targetUserId,
    ]);

    return [];
}

/**
 * @return array{ok: true, path: string, mime: string}|array{ok: false, error: string}
 */
function profile_store_image(array $file, string $subdir, int $maxBytes): array
{
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        return ['ok' => false, 'error' => 'Upload fehlgeschlagen.'];
    }
    $size = (int)($file['size'] ?? 0);
    if ($size <= 0 || $size > $maxBytes) {
        return ['ok' => false, 'error' => 'Bild max. ' . (int)($maxBytes / 1_000_000) . ' MB.'];
    }
    $tmp = (string)($file['tmp_name'] ?? '');
    if ($tmp === '' || !is_uploaded_file($tmp)) {
        return ['ok' => false, 'error' => 'Ungültiger Upload.'];
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string)$finfo->file($tmp);
    if (!in_array($mime, PROFILE_IMAGE_MIMES, true)) {
        return ['ok' => false, 'error' => 'Nur JPEG, PNG oder WebP.'];
    }
    if (@getimagesize($tmp) === false) {
        return ['ok' => false, 'error' => 'Datei ist kein gültiges Bild.'];
    }
    if (!in_array($subdir, ['avatars', 'banners'], true)) {
        return ['ok' => false, 'error' => 'Ungültiger Speicherort.'];
    }
    $ext = match ($mime) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        default => 'bin',
    };
    $dir = ALLXION_UPLOADS . '/' . $subdir;
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }
    $name = bin2hex(random_bytes(16)) . '.' . $ext;
    $dest = $dir . '/' . $name;
    if (!move_uploaded_file($tmp, $dest)) {
        return ['ok' => false, 'error' => 'Bild konnte nicht gespeichert werden.'];
    }
    @chmod($dest, 0640);
    return ['ok' => true, 'path' => $subdir . '/' . $name, 'mime' => $mime];
}

function profile_delete_image(?string $relativePath): void
{
    if ($relativePath === null || $relativePath === '') {
        return;
    }
    if (!preg_match('#^(avatars|banners)/[a-zA-Z0-9._-]+\.(jpg|png|webp)$#', $relativePath)) {
        return;
    }
    // Keep seeded brand assets
    if (str_contains($relativePath, 'brand-hybrixonteam-')) {
        return;
    }
    $full = ALLXION_UPLOADS . '/' . $relativePath;
    if (is_file($full)) {
        @unlink($full);
    }
}

function profile_can_admin_post_as(array $admin, int $asUserId): bool
{
    if (!user_is_admin($admin)) {
        return false;
    }
    $target = profile_find_by_id($asUserId);
    if (!$target) {
        return false;
    }
    return !empty($target['admin_postable']) && empty($target['banned_at']);
}
