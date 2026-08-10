<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

// Increment whenever allxion_migrate() gains schema/data migrations.
const HYBRIXON_SCHEMA_VERSION = 2026081002;

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
    $pdo->exec('PRAGMA busy_timeout = 5000');
    $pdo->exec('PRAGMA synchronous = NORMAL');
    $pdo->exec('PRAGMA temp_store = MEMORY');
    $pdo->exec('PRAGMA mmap_size = 134217728');

    $schemaVersion = (int)$pdo->query('PRAGMA user_version')->fetchColumn();
    if ($schemaVersion < HYBRIXON_SCHEMA_VERSION) {
        $schemaLock = @fopen(ALLXION_DATA . '/.schema.lock', 'c');
        if ($schemaLock !== false) {
            @flock($schemaLock, LOCK_EX);
        }
        try {
            // Another PHP worker may have completed it while this one waited.
            $schemaVersion = (int)$pdo->query('PRAGMA user_version')->fetchColumn();
            if ($schemaVersion < HYBRIXON_SCHEMA_VERSION) {
                allxion_migrate($pdo);
                $pdo->exec('PRAGMA user_version = ' . HYBRIXON_SCHEMA_VERSION);
            }
        } finally {
            if ($schemaLock !== false) {
                @flock($schemaLock, LOCK_UN);
                fclose($schemaLock);
            }
        }
    }
    allxion_db_maintenance($pdo);
    return $pdo;
}

/**
 * Retention used to execute on every DB open, including every byte-range
 * request. Run it at most hourly under a non-blocking process lock instead.
 */
function allxion_db_maintenance(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    $stamp = ALLXION_DATA . '/.maintenance-hourly';
    $lastRun = @filemtime($stamp);
    if ($lastRun !== false && $lastRun >= time() - 3600) {
        return;
    }
    $lock = @fopen(ALLXION_DATA . '/.maintenance.lock', 'c');
    if ($lock === false || !@flock($lock, LOCK_EX | LOCK_NB)) {
        if (is_resource($lock)) {
            fclose($lock);
        }
        return;
    }
    try {
        clearstatcache(true, $stamp);
        $lastRun = @filemtime($stamp);
        if ($lastRun !== false && $lastRun >= time() - 3600) {
            return;
        }
        $pdo->exec("DELETE FROM stories WHERE expires_at < datetime('now')");
        $pdo->exec("DELETE FROM remember_tokens WHERE expires_at < datetime('now')");
        $ipDays = max(7, (int)IP_LOG_RETENTION_DAYS);
        $pdo->exec(
            "DELETE FROM user_ip_log WHERE created_at < datetime('now', '-{$ipDays} days')"
        );
        $pdo->exec(
            "UPDATE users SET last_ip = NULL, last_ip_at = NULL
             WHERE last_ip_at IS NOT NULL AND last_ip_at < datetime('now', '-{$ipDays} days')"
        );
        $days = max(30, (int)DM_RETENTION_DAYS);
        $pdo->exec(
            "DELETE FROM dm_messages WHERE created_at < datetime('now', '-{$days} days')"
        );
        @touch($stamp);
    } finally {
        @flock($lock, LOCK_UN);
        fclose($lock);
    }
}

function allxion_migrate(PDO $pdo): void
{
    $pdo->exec('PRAGMA journal_mode = WAL');
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
        'display_name' => 'TEXT',
        'bio' => 'TEXT',
        'avatar_path' => 'TEXT',
        'banner_path' => 'TEXT',
        'postal_code' => 'TEXT',
        'city' => 'TEXT',
        'privacy_profile' => "TEXT NOT NULL DEFAULT 'public'",
        'privacy_posts' => "TEXT NOT NULL DEFAULT 'public'",
        'privacy_dms' => "TEXT NOT NULL DEFAULT 'everyone'",
        'last_ip' => 'TEXT',
        'last_ip_at' => 'TEXT',
        'last_seen_at' => 'TEXT',
        'relationship_status' => "TEXT NOT NULL DEFAULT 'unspecified'",
        'partner_id' => 'INTEGER',
        'partner_pending_id' => 'INTEGER',
        'theme' => "TEXT NOT NULL DEFAULT 'light'",
        'brand_style' => "TEXT NOT NULL DEFAULT 'logo_text'",
        'sidebar_items' => 'TEXT',
        'email_notify_enabled' => 'INTEGER NOT NULL DEFAULT 1',
        'email_notify_activity' => 'INTEGER NOT NULL DEFAULT 1',
        'email_notify_messages' => 'INTEGER NOT NULL DEFAULT 1',
        'email_notify_friend_posts' => 'INTEGER NOT NULL DEFAULT 0',
        'email_notify_group_posts' => 'INTEGER NOT NULL DEFAULT 0',
        'privacy_friends' => "TEXT NOT NULL DEFAULT 'friends'",
        'privacy_albums' => "TEXT NOT NULL DEFAULT 'friends'",
        'privacy_stories' => "TEXT NOT NULL DEFAULT 'friends'",
        'privacy_groups' => "TEXT NOT NULL DEFAULT 'public'",
        'privacy_relationship' => "TEXT NOT NULL DEFAULT 'friends'",
        'privacy_search' => "TEXT NOT NULL DEFAULT 'public'",
        'auto_accept_friends' => 'INTEGER NOT NULL DEFAULT 0',
        'ui_lang' => "TEXT NOT NULL DEFAULT 'de'",
        'push_notify_enabled' => 'INTEGER NOT NULL DEFAULT 1',
    ];
    foreach ($add as $name => $def) {
        if (!isset($cols[$name])) {
            $pdo->exec("ALTER TABLE users ADD COLUMN {$name} {$def}");
        }
    }

    $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
SQL);

    $postCols = [];
    foreach ($pdo->query('PRAGMA table_info(posts)') as $row) {
        $postCols[$row['name']] = true;
    }
    $postAdd = [
        'image_path' => 'TEXT',
        'image_mime' => 'TEXT',
        'moderation_status' => "TEXT NOT NULL DEFAULT 'ok'",
        'post_type' => "TEXT NOT NULL DEFAULT 'post'",
        'video_path' => 'TEXT',
        'video_mime' => 'TEXT',
        'video_duration' => 'INTEGER',
        'updated_at' => 'TEXT',
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

CREATE TABLE IF NOT EXISTS post_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'image',
  path TEXT NOT NULL,
  mime TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  duration_sec INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id INTEGER NOT NULL,
  following_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_ip_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ip TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS remember_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS friendships (
  user_a INTEGER NOT NULL,
  user_b INTEGER NOT NULL,
  requester_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_a, user_b),
  FOREIGN KEY (user_a) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_b) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  media_path TEXT NOT NULL,
  media_mime TEXT,
  media_kind TEXT NOT NULL DEFAULT 'image',
  caption TEXT,
  is_adult INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS story_views (
  story_id INTEGER NOT NULL,
  viewer_id INTEGER NOT NULL,
  viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (story_id, viewer_id),
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  privacy TEXT NOT NULL DEFAULT 'friends',
  cover_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS album_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id INTEGER NOT NULL,
  path TEXT NOT NULL,
  mime TEXT,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  description TEXT,
  privacy TEXT NOT NULL DEFAULT 'public',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'member',
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES community_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (group_id) REFERENCES community_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  actor_id INTEGER,
  type TEXT NOT NULL,
  post_id INTEGER,
  comment_id INTEGER,
  body TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hashtags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id INTEGER NOT NULL,
  hashtag_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, hashtag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (hashtag_id) REFERENCES hashtags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mentions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER NOT NULL,
  mentioned_user_id INTEGER NOT NULL,
  post_id INTEGER,
  comment_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_posts (
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id INTEGER NOT NULL,
  blocked_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (blocker_id, blocked_id),
  FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
);
SQL);

    $mediaCols = [];
    foreach ($pdo->query('PRAGMA table_info(post_media)') as $row) {
        $mediaCols[$row['name']] = true;
    }
    foreach ([
        'poster_path' => 'TEXT',
        'poster_mime' => 'TEXT',
    ] as $name => $def) {
        if (!isset($mediaCols[$name])) {
            $pdo->exec("ALTER TABLE post_media ADD COLUMN {$name} {$def}");
        }
    }

    // Migrate legacy single image_path into post_media once
    $legacy = $pdo->query(
        "SELECT id, image_path, image_mime FROM posts
         WHERE image_path IS NOT NULL AND image_path != ''
           AND id NOT IN (SELECT post_id FROM post_media WHERE kind = 'image')"
    )->fetchAll();
    $insMedia = $pdo->prepare(
        'INSERT INTO post_media (post_id, kind, path, mime, sort_order) VALUES (?, \'image\', ?, ?, 0)'
    );
    foreach ($legacy as $row) {
        $insMedia->execute([(int)$row['id'], $row['image_path'], $row['image_mime'] ?? null]);
    }

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

    require_once __DIR__ . '/legal.php';
    require_once __DIR__ . '/official.php';
    hybrixon_ensure_official_account($pdo);
}
