<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function allxion_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    foreach ([ALLXION_DATA, ALLXION_UPLOADS, ALLXION_AGE_DOCS] as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0750, true);
        }
    }

    $deny = ALLXION_AGE_DOCS . '/.htaccess';
    if (!is_file($deny)) {
        file_put_contents($deny, "Require all denied\n");
    }

    $pdo = new PDO('sqlite:' . ALLXION_DB, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA foreign_keys = ON');
    allxion_migrate($pdo);
    return $pdo;
}

function allxion_migrate(PDO $pdo): void
{
    $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  birthdate TEXT NOT NULL,
  age_verified_at TEXT,
  age_status TEXT NOT NULL DEFAULT 'none',
  age_doc_path TEXT,
  age_requested_at TEXT,
  age_reviewed_at TEXT,
  age_review_note TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  is_adult INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'like',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(post_id, user_id, kind),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS age_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dm_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_a INTEGER NOT NULL,
  user_b INTEGER NOT NULL,
  a_consented_at TEXT,
  b_consented_at TEXT,
  a_last_read_at TEXT,
  b_last_read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_a, user_b),
  FOREIGN KEY (user_a) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_b) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dm_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (thread_id) REFERENCES dm_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dm_blocks (
  blocker_id INTEGER NOT NULL,
  blocked_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (blocker_id, blocked_id),
  FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dm_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL,
  thread_id INTEGER NOT NULL,
  message_id INTEGER,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (thread_id) REFERENCES dm_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES dm_messages(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS dm_admin_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL,
  thread_id INTEGER NOT NULL,
  report_id INTEGER,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (thread_id) REFERENCES dm_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (report_id) REFERENCES dm_reports(id) ON DELETE SET NULL
);
SQL);

    // Additive migrations for existing DBs
    $cols = [];
    foreach ($pdo->query('PRAGMA table_info(users)') as $row) {
        $cols[$row['name']] = true;
    }
    $add = [
        'age_status' => "TEXT NOT NULL DEFAULT 'none'",
        'age_doc_path' => 'TEXT',
        'age_requested_at' => 'TEXT',
        'age_reviewed_at' => 'TEXT',
        'age_review_note' => 'TEXT',
        'is_admin' => 'INTEGER NOT NULL DEFAULT 0',
        'age_provider' => "TEXT NOT NULL DEFAULT 'none'",
        'dm_rules_accepted_at' => 'TEXT',
        'dm_rules_version' => 'TEXT',
        'legal_accepted_at' => 'TEXT',
        'legal_docs_version' => 'TEXT',
        'banned_at' => 'TEXT',
        'ban_reason' => 'TEXT',
        'banned_by' => 'INTEGER',
        // Social-style profile
        'display_name' => 'TEXT',
        'bio' => 'TEXT',
        'location' => 'TEXT',
        'website' => 'TEXT',
        'link_instagram' => 'TEXT',
        'link_facebook' => 'TEXT',
        'link_tiktok' => 'TEXT',
        'link_x' => 'TEXT',
        'avatar_path' => 'TEXT',
        'banner_path' => 'TEXT',
        'account_kind' => "TEXT NOT NULL DEFAULT 'user'",
        'login_disabled' => 'INTEGER NOT NULL DEFAULT 0',
        'admin_postable' => 'INTEGER NOT NULL DEFAULT 0',
    ];
    foreach ($add as $name => $def) {
        if (!isset($cols[$name])) {
            $pdo->exec("ALTER TABLE users ADD COLUMN {$name} {$def}");
        }
    }

    $postCols = [];
    foreach ($pdo->query('PRAGMA table_info(posts)') as $row) {
        $postCols[$row['name']] = true;
    }
    $postAdd = [
        'image_path' => 'TEXT',
        'image_mime' => 'TEXT',
        'moderation_status' => "TEXT NOT NULL DEFAULT 'ok'",
    ];
    foreach ($postAdd as $name => $def) {
        if (!isset($postCols[$name])) {
            $pdo->exec("ALTER TABLE posts ADD COLUMN {$name} {$def}");
        }
    }

    $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS content_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  reporter_id INTEGER,
  source TEXT NOT NULL DEFAULT 'user',
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  admin_note TEXT,
  reviewed_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
SQL);

    // Retention: purge old DMs (GDPR storage limitation)
    $days = max(30, (int)DM_RETENTION_DAYS);
    $pdo->exec(
        "DELETE FROM dm_messages WHERE created_at < datetime('now', '-{$days} days')"
    );

    // Ensure configured admins stay admins
    $adminStmt = $pdo->prepare('UPDATE users SET is_admin = 1 WHERE lower(username) = lower(?)');
    foreach (HYBRIXON_ADMIN_USERNAMES as $adminName) {
        $adminStmt->execute([$adminName]);
    }

    // Auto-verify admins (no ID required)
    $pdo->exec(
        "UPDATE users
         SET age_status = 'approved',
             age_verified_at = COALESCE(age_verified_at, datetime('now')),
             age_reviewed_at = COALESCE(age_reviewed_at, datetime('now')),
             age_review_note = COALESCE(NULLIF(age_review_note, ''), 'auto-admin'),
             age_provider = CASE WHEN age_provider IS NULL OR age_provider = 'none' THEN 'admin' ELSE age_provider END
         WHERE is_admin = 1"
    );

    hybrixon_ensure_brand_team($pdo);
}

/**
 * Official brand profile: no direct login, admins may post as this account.
 */
function hybrixon_ensure_brand_team(PDO $pdo): void
{
    $username = 'HybrixonTeam';
    $email = 'hello@hybrixon.com';
    $display = 'Hybrixon Team';
    $bio = "Offizielles Hybrixon-Profil.\nAlles kann, nichts muss — nur keine 18++ / pornografischen Inhalte, keine Waffen und keine Gewalt.\nCloser. Freer.";
    $website = 'https://hybrixon.com';

    $stmt = $pdo->prepare('SELECT id, email, avatar_path FROM users WHERE lower(username) = lower(?) LIMIT 1');
    $stmt->execute([$username]);
    $row = $stmt->fetch();

    $avatarRel = null;
    $bannerRel = null;
    $logoSrc = ALLXION_ROOT . '/assets/img/welcome-logo.png';
    $logoSvg = ALLXION_ROOT . '/assets/img/logo.svg';
    $avatarsDir = ALLXION_UPLOADS . '/avatars';
    $bannersDir = ALLXION_UPLOADS . '/banners';
    foreach ([$avatarsDir, $bannersDir] as $d) {
        if (!is_dir($d)) {
            mkdir($d, 0750, true);
        }
    }

    if (is_file($logoSrc)) {
        $avatarName = 'brand-hybrixonteam-avatar.png';
        $bannerName = 'brand-hybrixonteam-banner.png';
        $avatarAbs = $avatarsDir . '/' . $avatarName;
        $bannerAbs = $bannersDir . '/' . $bannerName;
        if (!is_file($avatarAbs)) {
            @copy($logoSrc, $avatarAbs);
            @chmod($avatarAbs, 0640);
        }
        if (!is_file($bannerAbs)) {
            @copy($logoSrc, $bannerAbs);
            @chmod($bannerAbs, 0640);
        }
        if (is_file($avatarAbs)) {
            $avatarRel = 'avatars/' . $avatarName;
        }
        if (is_file($bannerAbs)) {
            $bannerRel = 'banners/' . $bannerName;
        }
    } elseif (is_file($logoSvg)) {
        // SVG stored as-is only if we later serve it — skip for mime safety
    }

    if ($row) {
        // Free email if held by another row
        $pdo->prepare(
            "UPDATE users SET email = lower(username) || '@brand.invalid'
             WHERE lower(email) = lower(?) AND id != ?"
        )->execute([$email, (int)$row['id']]);

        $pdo->prepare(
            "UPDATE users SET
                email = ?,
                display_name = COALESCE(NULLIF(display_name, ''), ?),
                bio = COALESCE(NULLIF(bio, ''), ?),
                website = COALESCE(NULLIF(website, ''), ?),
                account_kind = 'brand',
                login_disabled = 1,
                admin_postable = 1,
                age_status = 'approved',
                age_verified_at = COALESCE(age_verified_at, datetime('now')),
                age_provider = CASE WHEN age_provider IS NULL OR age_provider = 'none' THEN 'admin' ELSE age_provider END,
                avatar_path = COALESCE(NULLIF(avatar_path, ''), ?),
                banner_path = COALESCE(NULLIF(banner_path, ''), ?)
             WHERE id = ?"
        )->execute([
            $email,
            $display,
            $bio,
            $website,
            $avatarRel,
            $bannerRel,
            (int)$row['id'],
        ]);
        return;
    }

    // Unusable login: random hash + login_disabled
    $hash = password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT);
    $pdo->prepare(
        "INSERT INTO users (
            username, email, password_hash, birthdate,
            display_name, bio, website, location,
            avatar_path, banner_path,
            account_kind, login_disabled, admin_postable,
            age_status, age_verified_at, age_reviewed_at, age_provider,
            legal_accepted_at, legal_docs_version, is_admin, created_at
         ) VALUES (
            ?, ?, ?, '1990-01-01',
            ?, ?, ?, 'Community',
            ?, ?,
            'brand', 1, 1,
            'approved', datetime('now'), datetime('now'), 'admin',
            datetime('now'), 'brand', 0, datetime('now')
         )"
    )->execute([
        $username,
        $email,
        $hash,
        $display,
        $bio,
        $website,
        $avatarRel,
        $bannerRel,
    ]);
}
