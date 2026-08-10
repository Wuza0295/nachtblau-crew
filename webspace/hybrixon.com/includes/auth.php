<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

const ALLXION_USER_SELECT = 'id, username, email, birthdate, age_verified_at, age_status, age_doc_path, age_requested_at, age_reviewed_at, age_review_note, age_provider, dm_rules_accepted_at, dm_rules_version, is_admin, banned_at, ban_reason, banned_by, display_name, bio, avatar_path, banner_path, postal_code, city, privacy_profile, privacy_posts, privacy_dms, privacy_friends, privacy_albums, privacy_stories, privacy_groups, privacy_relationship, privacy_search, relationship_status, partner_id, partner_pending_id, theme, brand_style, sidebar_items, email_notify_enabled, email_notify_activity, email_notify_messages, email_notify_friend_posts, email_notify_group_posts, auto_accept_friends, ui_lang, last_ip, last_ip_at, last_seen_at, created_at';

function allxion_cookie_path(): string
{
    return allxion_base_path() === '' ? '/' : allxion_base_path() . '/';
}

/** Active UI theme: logged-in preference, else guest cookie, else light. */
function hybrixon_active_theme(?array $user = null): string
{
    if ($user && in_array((string)($user['theme'] ?? ''), ['light', 'dark'], true)) {
        return (string)$user['theme'];
    }
    $cookie = (string)($_COOKIE['hybrixon_theme'] ?? '');
    if (in_array($cookie, ['light', 'dark'], true)) {
        return $cookie;
    }
    return 'light';
}

function hybrixon_set_theme_cookie(string $theme): void
{
    if (!in_array($theme, ['light', 'dark'], true)) {
        $theme = 'light';
    }
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    setcookie('hybrixon_theme', $theme, [
        'expires' => time() + (400 * 86400),
        'path' => allxion_cookie_path(),
        'secure' => $secure,
        'httponly' => false,
        'samesite' => 'Lax',
    ]);
    $_COOKIE['hybrixon_theme'] = $theme;
}

/** Brand mark in topbar: logo | logo_text | text */
function hybrixon_brand_styles(): array
{
    return [
        'logo' => 'Nur Logo',
        'logo_text' => 'Logo und Text',
        'text' => 'Nur Text',
    ];
}

function hybrixon_active_brand_style(?array $user = null): string
{
    $allowed = array_keys(hybrixon_brand_styles());
    if ($user && in_array((string)($user['brand_style'] ?? ''), $allowed, true)) {
        return (string)$user['brand_style'];
    }
    $cookie = (string)($_COOKIE['hybrixon_brand'] ?? '');
    if (in_array($cookie, $allowed, true)) {
        return $cookie;
    }
    return 'logo_text';
}

function hybrixon_set_brand_cookie(string $style): void
{
    if (!isset(hybrixon_brand_styles()[$style])) {
        $style = 'logo_text';
    }
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    setcookie('hybrixon_brand', $style, [
        'expires' => time() + (400 * 86400),
        'path' => allxion_cookie_path(),
        'secure' => $secure,
        'httponly' => false,
        'samesite' => 'Lax',
    ]);
    $_COOKIE['hybrixon_brand'] = $style;
}

function hybrixon_sync_ui_cookies(array $user): void
{
    $theme = (string)($user['theme'] ?? 'light');
    if (in_array($theme, ['light', 'dark'], true)) {
        hybrixon_set_theme_cookie($theme);
    }
    $brand = (string)($user['brand_style'] ?? 'logo_text');
    if (isset(hybrixon_brand_styles()[$brand])) {
        hybrixon_set_brand_cookie($brand);
    }
}

function allxion_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('hybrixon_sess');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => allxion_cookie_path(),
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function allxion_fetch_user_by_id(int $id): ?array
{
    $stmt = allxion_db()->prepare('SELECT ' . ALLXION_USER_SELECT . ' FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function allxion_remember_cookie_name(): string
{
    return 'hybrixon_remember';
}

function allxion_set_remember_me(int $userId): void
{
    $raw = bin2hex(random_bytes(32));
    $hash = hash('sha256', $raw);
    $days = max(1, (int)REMEMBER_ME_DAYS);
    allxion_db()->prepare(
        "INSERT INTO remember_tokens (user_id, token_hash, expires_at)
         VALUES (?, ?, datetime('now', '+{$days} days'))"
    )->execute([$userId, $hash]);
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    setcookie(allxion_remember_cookie_name(), $userId . ':' . $raw, [
        'expires' => time() + ($days * 86400),
        'path' => allxion_cookie_path(),
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function allxion_clear_remember_me(?int $userId = null): void
{
    $cookie = (string)($_COOKIE[allxion_remember_cookie_name()] ?? '');
    if ($cookie !== '' && str_contains($cookie, ':')) {
        [, $raw] = explode(':', $cookie, 2);
        $hash = hash('sha256', $raw);
        allxion_db()->prepare('DELETE FROM remember_tokens WHERE token_hash = ?')->execute([$hash]);
    }
    if ($userId) {
        allxion_db()->prepare('DELETE FROM remember_tokens WHERE user_id = ?')->execute([$userId]);
    }
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    setcookie(allxion_remember_cookie_name(), '', [
        'expires' => time() - 42000,
        'path' => allxion_cookie_path(),
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function allxion_try_remember_login(): ?array
{
    $cookie = (string)($_COOKIE[allxion_remember_cookie_name()] ?? '');
    if ($cookie === '' || !str_contains($cookie, ':')) {
        return null;
    }
    [$uidRaw, $raw] = explode(':', $cookie, 2);
    $userId = (int)$uidRaw;
    if ($userId <= 0 || $raw === '') {
        return null;
    }
    $hash = hash('sha256', $raw);
    $stmt = allxion_db()->prepare(
        "SELECT user_id FROM remember_tokens
         WHERE token_hash = ? AND user_id = ? AND expires_at > datetime('now')"
    );
    $stmt->execute([$hash, $userId]);
    if (!(int)$stmt->fetchColumn()) {
        allxion_clear_remember_me();
        return null;
    }
    $user = allxion_fetch_user_by_id($userId);
    if (!$user || user_is_banned($user)) {
        allxion_clear_remember_me($userId);
        return null;
    }
    allxion_session_start();
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;
    // Rotate token
    allxion_db()->prepare('DELETE FROM remember_tokens WHERE token_hash = ?')->execute([$hash]);
    allxion_set_remember_me($userId);
    hybrixon_sync_ui_cookies($user);
    return $user;
}

function allxion_current_user(): ?array
{
    allxion_session_start();
    $id = $_SESSION['user_id'] ?? null;
    if (!$id) {
        $remembered = allxion_try_remember_login();
        if (!$remembered) {
            return null;
        }
        $id = (int)$remembered['id'];
    }
    $user = allxion_fetch_user_by_id((int)$id);
    if (!$user) {
        return null;
    }
    if (user_is_banned($user)) {
        allxion_logout();
        return null;
    }
    require_once __DIR__ . '/social.php';
    social_track_ip((int)$user['id']);
    if (!empty($user['is_admin']) && user_is_adult($user) && !user_age_verified($user)) {
        $user = allxion_ensure_admin_age_verified($user);
    }
    return $user;
}

/**
 * Authenticate high-frequency upload requests without writing presence/IP
 * metadata for every parallel chunk. Normal page requests still track it.
 */
function allxion_current_user_for_upload(): ?array
{
    allxion_session_start();
    $id = $_SESSION['user_id'] ?? null;
    if (!$id) {
        // Preserve remember-me behavior on the first request.
        return allxion_current_user();
    }
    $user = allxion_fetch_user_by_id((int)$id);
    if (!$user) {
        return null;
    }
    if (user_is_banned($user)) {
        allxion_logout();
        return null;
    }
    return $user;
}

function user_is_banned(array $user): bool
{
    return !empty($user['banned_at']);
}

/**
 * @return true|string true on success, error message on failure
 */
function allxion_login(string $login, string $password, bool $remember = false): bool|string
{
    $stmt = allxion_db()->prepare(
        'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1'
    );
    $stmt->execute([$login, $login]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        return false;
    }
    if (user_is_banned($user)) {
        $reason = trim((string)($user['ban_reason'] ?? ''));
        return $reason !== ''
            ? ('Konto gesperrt: ' . $reason)
            : 'Dieses Konto wurde gesperrt.';
    }
    allxion_session_start();
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];
    require_once __DIR__ . '/social.php';
    social_track_ip((int)$user['id']);
    if ($remember) {
        allxion_set_remember_me((int)$user['id']);
    }
    hybrixon_sync_ui_cookies($user);
    return true;
}

function allxion_require_login(): array
{
    $user = allxion_current_user();
    if (!$user) {
        flash('error', 'Bitte melde dich an, um zu posten.');
        redirect(allxion_url('login.php?next=' . rawurlencode($_SERVER['REQUEST_URI'] ?? allxion_url())));
    }
    return $user;
}

function allxion_change_password(array $user, string $current, string $newPassword): array
{
    if ($current === '' && $newPassword === '') {
        return ['Bitte aktuelles und neues Passwort eingeben.'];
    }
    if ($current === '') {
        return ['Bitte aktuelles Passwort eingeben.'];
    }
    if (strlen($newPassword) < 8) {
        return ['Neues Passwort mindestens 8 Zeichen.'];
    }
    $row = allxion_db()->prepare('SELECT password_hash FROM users WHERE id = ?');
    $row->execute([(int)$user['id']]);
    $hash = (string)$row->fetchColumn();
    if ($hash === '' || !password_verify($current, $hash)) {
        return ['Aktuelles Passwort ist falsch.'];
    }
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    allxion_db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([$newHash, (int)$user['id']]);
    // Invalidate other remember sessions
    allxion_db()->prepare('DELETE FROM remember_tokens WHERE user_id = ?')
        ->execute([(int)$user['id']]);
    return [];
}

function allxion_logout(): void
{
    allxion_session_start();
    $uid = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    allxion_clear_remember_me($uid);
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', (bool)$p['secure'], (bool)$p['httponly']);
    }
    session_destroy();
}

/**
 * @return list<string>
 */
function allxion_ban_user(int $targetUserId, array $actor, string $reason = '', bool $removePosts = false): array
{
    if (!user_is_admin($actor)) {
        return ['Keine Berechtigung.'];
    }
    if ($targetUserId === (int)$actor['id']) {
        return ['Du kannst dich nicht selbst sperren.'];
    }
    $stmt = allxion_db()->prepare('SELECT id, username, is_admin, banned_at FROM users WHERE id = ?');
    $stmt->execute([$targetUserId]);
    $target = $stmt->fetch();
    if (!$target) {
        return ['Benutzer nicht gefunden.'];
    }
    if (!empty($target['is_admin'])) {
        return ['Admins können nicht gesperrt werden. Zuerst Admin entziehen.'];
    }
    if (!empty($target['banned_at'])) {
        return ['Benutzer ist bereits gesperrt.'];
    }

    $reason = substr(trim($reason), 0, 500);
    allxion_db()->prepare(
        'UPDATE users SET banned_at = datetime(\'now\'), ban_reason = ?, banned_by = ? WHERE id = ?'
    )->execute([$reason !== '' ? $reason : null, (int)$actor['id'], $targetUserId]);

    if ($removePosts) {
        require_once __DIR__ . '/posts.php';
        $posts = allxion_db()->prepare(
            "SELECT id FROM posts WHERE user_id = ? AND moderation_status != 'removed'"
        );
        $posts->execute([$targetUserId]);
        foreach ($posts->fetchAll() as $p) {
            allxion_delete_post_media_files((int)$p['id']);
        }
        allxion_db()->prepare(
            "UPDATE posts SET moderation_status = 'removed', image_path = NULL, image_mime = NULL,
             video_path = NULL, video_mime = NULL, video_duration = NULL WHERE user_id = ?"
        )->execute([$targetUserId]);
        allxion_db()->prepare('DELETE FROM post_media WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)')->execute([$targetUserId]);
        allxion_db()->prepare(
            "UPDATE content_reports SET status = 'removed', reviewed_at = datetime('now'), reviewed_by = ?,
             admin_note = COALESCE(NULLIF(admin_note, ''), 'user banned')
             WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?) AND status = 'open'"
        )->execute([(int)$actor['id'], $targetUserId]);
    }

    return [];
}

/**
 * @return list<string>
 */
function allxion_unban_user(int $targetUserId, array $actor): array
{
    if (!user_is_admin($actor)) {
        return ['Keine Berechtigung.'];
    }
    $stmt = allxion_db()->prepare('SELECT id, banned_at FROM users WHERE id = ?');
    $stmt->execute([$targetUserId]);
    $target = $stmt->fetch();
    if (!$target) {
        return ['Benutzer nicht gefunden.'];
    }
    if (empty($target['banned_at'])) {
        return ['Benutzer ist nicht gesperrt.'];
    }
    allxion_db()->prepare(
        'UPDATE users SET banned_at = NULL, ban_reason = NULL, banned_by = NULL WHERE id = ?'
    )->execute([$targetUserId]);
    return [];
}

function allxion_register(
    string $username,
    string $email,
    string $password,
    string $birthdate,
    bool $termsOk = false,
    bool $privacyOk = false,
    string $theme = 'light',
    string $postalCode = '',
    string $city = ''
): array
{
    require_once __DIR__ . '/legal.php';
    require_once __DIR__ . '/geo.php';
    require_once __DIR__ . '/social.php';

    $username = trim($username);
    $email = trim(mb_strtolower($email));
    $theme = in_array($theme, ['light', 'dark'], true) ? $theme : 'light';
    $postalCode = trim($postalCode);
    $city = trim($city);
    $errors = [];

    if (!preg_match('/^[a-zA-Z0-9_]{3,24}$/', $username)) {
        $errors[] = 'Benutzername: 3–24 Zeichen, nur Buchstaben, Zahlen und _.';
    }
    require_once __DIR__ . '/official.php';
    if (hybrixon_is_official_username($username)) {
        $errors[] = 'Dieser Benutzername ist reserviert.';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Bitte eine gültige E-Mail angeben.';
    }
    if (mb_strtolower($email) === mb_strtolower(HYBRIXON_OFFICIAL_EMAIL)) {
        $errors[] = 'Diese E-Mail ist reserviert.';
    }
    if (strlen($password) < 8) {
        $errors[] = 'Passwort mindestens 8 Zeichen.';
    }
    $age = age_from_birthdate($birthdate);
    if ($age === null) {
        $errors[] = 'Bitte ein gültiges Geburtsdatum angeben.';
    } elseif ($age < ALLXION_MIN_REGISTER_AGE) {
        $errors[] = 'Registrierung erst ab ' . ALLXION_MIN_REGISTER_AGE . ' Jahren.';
    }
    $errors = array_merge($errors, social_validate_location($postalCode, $city, true));
    if (!$termsOk) {
        $errors[] = 'Bitte die Nutzungsbedingungen akzeptieren.';
    }
    if (!$privacyOk) {
        $errors[] = 'Bitte die Datenschutzerklärung akzeptieren.';
    }

    if ($errors) {
        return $errors;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    try {
        $stmt = allxion_db()->prepare(
            'INSERT INTO users (username, email, password_hash, birthdate, legal_accepted_at, legal_docs_version, theme, postal_code, city)
             VALUES (?, ?, ?, ?, datetime(\'now\'), ?, ?, ?, ?)'
        );
        $stmt->execute([$username, $email, $hash, $birthdate, LEGAL_DOCS_VERSION, $theme, $postalCode, $city]);
        $id = (int)allxion_db()->lastInsertId();
        allxion_session_start();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $id;
        hybrixon_set_theme_cookie($theme);
        hybrixon_set_brand_cookie('logo_text');
    } catch (PDOException $e) {
        if (str_contains($e->getMessage(), 'UNIQUE')) {
            return ['Benutzername oder E-Mail ist bereits vergeben.'];
        }
        throw $e;
    }
    return [];
}

/**
 * Permanently delete account and related data (GDPR Art. 17).
 * Last admin cannot delete themselves.
 * @return list<string>
 */
function allxion_delete_account(array $user, string $password): array
{
    require_once __DIR__ . '/media_upload.php';
    require_once __DIR__ . '/posts.php';

    $userId = (int)$user['id'];
    $row = allxion_db()->prepare('SELECT password_hash, is_admin, avatar_path, banner_path, age_doc_path FROM users WHERE id = ?');
    $row->execute([$userId]);
    $dbUser = $row->fetch();
    if (!$dbUser || !password_verify($password, $dbUser['password_hash'])) {
        return ['Passwort ungültig.'];
    }
    if (!empty($dbUser['is_admin']) && admin_count() <= 1) {
        return ['Der letzte Admin kann das Konto nicht löschen.'];
    }

    $pdo = allxion_db();

    // Media files (DB rows cascade with user)
    $posts = $pdo->prepare('SELECT id FROM posts WHERE user_id = ?');
    $posts->execute([$userId]);
    foreach ($posts->fetchAll() as $p) {
        allxion_delete_post_media_files((int)$p['id']);
    }

    $stories = $pdo->prepare('SELECT media_path FROM stories WHERE user_id = ?');
    $stories->execute([$userId]);
    foreach ($stories->fetchAll() as $s) {
        media_delete_path($s['media_path'] ?? null);
    }

    $albums = $pdo->prepare(
        'SELECT ap.path FROM album_photos ap
         JOIN albums a ON a.id = ap.album_id WHERE a.user_id = ?'
    );
    $albums->execute([$userId]);
    foreach ($albums->fetchAll() as $ph) {
        media_delete_path($ph['path'] ?? null);
    }

    media_delete_path($dbUser['avatar_path'] ?? null);
    media_delete_path($dbUser['banner_path'] ?? null);
    if (!empty($dbUser['age_doc_path'])) {
        $doc = ALLXION_AGE_DOCS . '/' . basename((string)$dbUser['age_doc_path']);
        if (is_file($doc)) {
            @unlink($doc);
        }
    }

    // Break partner links pointing at this user
    $pdo->prepare('UPDATE users SET partner_id = NULL WHERE partner_id = ?')->execute([$userId]);
    $pdo->prepare('UPDATE users SET partner_pending_id = NULL WHERE partner_pending_id = ?')->execute([$userId]);

    // Explicit privacy-sensitive tables (also covered by FK CASCADE)
    $pdo->prepare('DELETE FROM remember_tokens WHERE user_id = ?')->execute([$userId]);
    $pdo->prepare('DELETE FROM user_ip_log WHERE user_id = ?')->execute([$userId]);
    $pdo->prepare('DELETE FROM age_audit WHERE user_id = ?')->execute([$userId]);

    $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);
    allxion_logout();
    return [];
}

function age_from_birthdate(string $birthdate): ?int
{
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $birthdate)) {
        return null;
    }
    try {
        $born = new DateTimeImmutable($birthdate);
    } catch (Exception) {
        return null;
    }
    $today = new DateTimeImmutable('today');
    if ($born > $today) {
        return null;
    }
    return (int)$born->diff($today)->y;
}

function user_is_adult(array $user): bool
{
    $age = age_from_birthdate((string)$user['birthdate']);
    return $age !== null && $age >= ALLXION_ADULT_AGE;
}

function user_is_admin(array $user): bool
{
    return !empty($user['is_admin']);
}

function allxion_require_admin(): array
{
    $user = allxion_require_login();
    // Bootstrap: configured founder usernames get admin flag once
    if (empty($user['is_admin'])) {
        $name = mb_strtolower((string)($user['username'] ?? ''), 'UTF-8');
        foreach (HYBRIXON_ADMIN_USERNAMES as $admin) {
            if ($name === mb_strtolower($admin, 'UTF-8')) {
                $stmt = allxion_db()->prepare('UPDATE users SET is_admin = 1 WHERE id = ?');
                $stmt->execute([(int)$user['id']]);
                $user['is_admin'] = 1;
                break;
            }
        }
    }
    if (!user_is_admin($user)) {
        http_response_code(403);
        flash('error', 'Kein Admin-Zugang.');
        redirect(allxion_url());
    }
    return allxion_ensure_admin_age_verified($user);
}

/**
 * Admins are treated as age-verified automatically (no ID upload).
 */
function allxion_ensure_admin_age_verified(array $user): array
{
    if (!user_is_admin($user)) {
        return $user;
    }
    if (!user_is_adult($user)) {
        return $user;
    }
    if (user_age_verified($user)) {
        return $user;
    }

    $stmt = allxion_db()->prepare(
        "UPDATE users
         SET age_status = 'approved',
             age_verified_at = COALESCE(age_verified_at, datetime('now')),
             age_reviewed_at = datetime('now'),
             age_review_note = COALESCE(NULLIF(age_review_note, ''), 'auto-admin'),
             age_provider = CASE WHEN age_provider IS NULL OR age_provider = 'none' THEN 'admin' ELSE age_provider END
         WHERE id = ?"
    );
    $stmt->execute([(int)$user['id']]);
    age_audit((int)$user['id'], 'admin_auto_age_verify', 'admin role');

    return allxion_fetch_user_by_id((int)$user['id']) ?: $user;
}

function admin_count(): int
{
    return (int)allxion_db()->query('SELECT COUNT(*) FROM users WHERE is_admin = 1')->fetchColumn();
}

/**
 * Grant or revoke admin. Returns list of error messages (empty = ok).
 *
 * @return list<string>
 */
function allxion_set_user_admin(int $targetUserId, bool $makeAdmin, array $actor): array
{
    if (!user_is_admin($actor)) {
        return ['Keine Berechtigung.'];
    }
    if ($targetUserId <= 0) {
        return ['Ungültiger Nutzer.'];
    }

    $stmt = allxion_db()->prepare('SELECT id, username, is_admin, birthdate FROM users WHERE id = ?');
    $stmt->execute([$targetUserId]);
    $target = $stmt->fetch();
    if (!$target) {
        return ['Nutzer nicht gefunden.'];
    }

    $currentlyAdmin = !empty($target['is_admin']);
    if ($makeAdmin === $currentlyAdmin) {
        return [];
    }

    if (!$makeAdmin) {
        if ((int)$target['id'] === (int)$actor['id']) {
            return ['Du kannst dir Admin nicht selbst entziehen.'];
        }
        if (admin_count() <= 1) {
            return ['Der letzte Admin kann nicht entfernt werden.'];
        }
    }

    $upd = allxion_db()->prepare('UPDATE users SET is_admin = ? WHERE id = ?');
    $upd->execute([$makeAdmin ? 1 : 0, $targetUserId]);
    age_audit(
        $targetUserId,
        $makeAdmin ? 'admin_grant' : 'admin_revoke',
        'by @' . ($actor['username'] ?? '?')
    );

    if ($makeAdmin) {
        allxion_ensure_admin_age_verified([
            'id' => $target['id'],
            'username' => $target['username'],
            'is_admin' => 1,
            'birthdate' => $target['birthdate'],
            'age_status' => 'none',
            'age_verified_at' => null,
        ]);
    }

    return [];
}

function user_age_verified(array $user): bool
{
    return user_is_adult($user)
        && (($user['age_status'] ?? '') === 'approved')
        && !empty($user['age_verified_at']);
}

function user_age_pending(array $user): bool
{
    return ($user['age_status'] ?? '') === 'pending';
}

function age_audit(int $userId, string $action, string $detail = ''): void
{
    $stmt = allxion_db()->prepare(
        'INSERT INTO age_audit (user_id, action, ip, user_agent, detail) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $userId,
        $action,
        substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 64),
        substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
        substr($detail, 0, 500),
    ]);
}

function account_age_hours(array $user): float
{
    try {
        $created = new DateTimeImmutable((string)$user['created_at']);
    } catch (Exception) {
        return 0;
    }
    $now = new DateTimeImmutable('now');
    return max(0, ($now->getTimestamp() - $created->getTimestamp()) / 3600);
}

/**
 * Submit age verification request (no ID upload — GDPR-light).
 * Non-admins stay pending until admin approval. Admins are auto-verified elsewhere.
 *
 * @return list<string>
 */
function allxion_request_age_verification(array $user, string $password, string $phrase): array
{
    $userId = (int)$user['id'];

    if (user_is_admin($user)) {
        allxion_ensure_admin_age_verified($user);
        return [];
    }

    if (!user_is_adult($user)) {
        return ['Altersprüfung erst ab ' . ALLXION_ADULT_AGE . ' Jahren möglich.'];
    }
    if (user_age_verified($user)) {
        return ['Bereits freigeschaltet.'];
    }
    if (user_age_pending($user)) {
        return ['Prüfung läuft bereits. Bitte auf die Freigabe warten.'];
    }
    if (account_age_hours($user) < AGE_VERIFY_ACCOUNT_MIN_HOURS) {
        $left = (int)ceil(AGE_VERIFY_ACCOUNT_MIN_HOURS - account_age_hours($user));
        return ['Konto muss mindestens ' . AGE_VERIFY_ACCOUNT_MIN_HOURS . " Stunden alt sein (noch ca. {$left} Std.)."];
    }

    $row = allxion_db()->prepare('SELECT password_hash FROM users WHERE id = ?');
    $row->execute([$userId]);
    $hashRow = $row->fetch();
    if (!$hashRow || !password_verify($password, $hashRow['password_hash'])) {
        age_audit($userId, 'verify_fail', 'wrong password');
        return ['Passwort ungültig.'];
    }

    $normalized = mb_strtoupper(trim(preg_replace('/\s+/', ' ', $phrase) ?? ''), 'UTF-8');
    if ($normalized !== AGE_CONFIRM_PHRASE) {
        age_audit($userId, 'verify_fail', 'wrong phrase');
        return ['Bestätigungssatz stimmt nicht. Bitte exakt abtippen.'];
    }

    $countStmt = allxion_db()->prepare(
        "SELECT COUNT(*) FROM age_audit WHERE user_id = ? AND action = 'verify_submit' AND created_at >= datetime('now', '-1 day')"
    );
    $countStmt->execute([$userId]);
    if ((int)$countStmt->fetchColumn() >= AGE_VERIFY_MAX_PENDING_PER_DAY) {
        return ['Zu viele Anträge heute. Bitte später erneut versuchen.'];
    }

    $stmt = allxion_db()->prepare(
        "UPDATE users
         SET age_status = 'pending',
             age_requested_at = datetime('now'),
             age_verified_at = NULL,
             age_review_note = NULL,
             age_doc_path = NULL,
             age_provider = 'soft'
         WHERE id = ?"
    );
    $stmt->execute([$userId]);
    age_audit($userId, 'verify_submit', 'soft-attestation');

    return [];
}

function allxion_admin_set_age_status(int $userId, string $status, string $note = ''): void
{
    if (!in_array($status, ['approved', 'rejected', 'none'], true)) {
        throw new InvalidArgumentException('Invalid status');
    }
    if ($status === 'approved') {
        $stmt = allxion_db()->prepare(
            "UPDATE users
             SET age_status = 'approved',
                 age_verified_at = datetime('now'),
                 age_reviewed_at = datetime('now'),
                 age_review_note = ?,
                 age_provider = CASE WHEN age_provider = 'yoti' THEN 'yoti' ELSE 'soft' END
             WHERE id = ?"
        );
        $stmt->execute([substr($note, 0, 500), $userId]);
    } else {
        $stmt = allxion_db()->prepare(
            "UPDATE users
             SET age_status = ?,
                 age_verified_at = NULL,
                 age_reviewed_at = datetime('now'),
                 age_review_note = ?,
                 age_provider = 'none'
             WHERE id = ?"
        );
        $stmt->execute([$status, substr($note, 0, 500), $userId]);
    }
    age_audit($userId, 'admin_' . $status, $note);
}

