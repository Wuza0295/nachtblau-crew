<?php
declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/policy.php';

function dm_user_eligible(array $user): bool
{
    $age = age_from_birthdate((string)$user['birthdate']);
    return $age !== null && $age >= DM_MIN_AGE;
}

function dm_rules_accepted(array $user): bool
{
    return !empty($user['dm_rules_accepted_at'])
        && (($user['dm_rules_version'] ?? '') === DM_CONSENT_VERSION);
}

function dm_accept_rules(int $userId): void
{
    $stmt = allxion_db()->prepare(
        "UPDATE users
         SET dm_rules_accepted_at = datetime('now'),
             dm_rules_version = ?
         WHERE id = ?"
    );
    $stmt->execute([DM_CONSENT_VERSION, $userId]);
}

function dm_pair_ids(int $a, int $b): array
{
    return $a < $b ? [$a, $b] : [$b, $a];
}

function dm_is_blocked(int $userId, int $otherId): bool
{
    $stmt = allxion_db()->prepare(
        'SELECT 1 FROM dm_blocks
         WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)
         LIMIT 1'
    );
    $stmt->execute([$userId, $otherId, $otherId, $userId]);
    return (bool)$stmt->fetchColumn();
}

function dm_i_blocked(int $blockerId, int $blockedId): bool
{
    $stmt = allxion_db()->prepare(
        'SELECT 1 FROM dm_blocks WHERE blocker_id = ? AND blocked_id = ? LIMIT 1'
    );
    $stmt->execute([$blockerId, $blockedId]);
    return (bool)$stmt->fetchColumn();
}

function dm_block(int $blockerId, int $blockedId): array
{
    if ($blockerId === $blockedId) {
        return ['Du kannst dich nicht selbst blockieren.'];
    }
    $stmt = allxion_db()->prepare(
        'INSERT OR IGNORE INTO dm_blocks (blocker_id, blocked_id) VALUES (?, ?)'
    );
    $stmt->execute([$blockerId, $blockedId]);
    return [];
}

function dm_unblock(int $blockerId, int $blockedId): void
{
    $stmt = allxion_db()->prepare(
        'DELETE FROM dm_blocks WHERE blocker_id = ? AND blocked_id = ?'
    );
    $stmt->execute([$blockerId, $blockedId]);
}

function dm_find_user_by_username(string $username): ?array
{
    $stmt = allxion_db()->prepare(
        'SELECT id, username, birthdate, dm_rules_accepted_at, is_admin FROM users WHERE username = ? LIMIT 1'
    );
    $stmt->execute([trim($username)]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function dm_get_or_create_thread(int $userId, int $otherId): array
{
    [$a, $b] = dm_pair_ids($userId, $otherId);
    $pdo = allxion_db();
    $stmt = $pdo->prepare('SELECT * FROM dm_threads WHERE user_a = ? AND user_b = ?');
    $stmt->execute([$a, $b]);
    $thread = $stmt->fetch();
    if ($thread) {
        return $thread;
    }
    $ins = $pdo->prepare('INSERT INTO dm_threads (user_a, user_b) VALUES (?, ?)');
    $ins->execute([$a, $b]);
    $id = (int)$pdo->lastInsertId();
    $stmt->execute([$a, $b]);
    return $stmt->fetch() ?: ['id' => $id, 'user_a' => $a, 'user_b' => $b];
}

function dm_thread_for_user(int $threadId, int $userId): ?array
{
    $stmt = allxion_db()->prepare(
        'SELECT * FROM dm_threads WHERE id = ? AND (user_a = ? OR user_b = ?)'
    );
    $stmt->execute([$threadId, $userId, $userId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function dm_other_user_id(array $thread, int $userId): int
{
    return (int)$thread['user_a'] === $userId ? (int)$thread['user_b'] : (int)$thread['user_a'];
}

function dm_user_is_a(array $thread, int $userId): bool
{
    return (int)$thread['user_a'] === $userId;
}

function dm_thread_consented(array $thread, int $userId): bool
{
    return dm_user_is_a($thread, $userId)
        ? !empty($thread['a_consented_at'])
        : !empty($thread['b_consented_at']);
}

function dm_mark_thread_consent(int $threadId, int $userId): void
{
    $thread = dm_thread_for_user($threadId, $userId);
    if (!$thread) {
        return;
    }
    $col = dm_user_is_a($thread, $userId) ? 'a_consented_at' : 'b_consented_at';
    $stmt = allxion_db()->prepare(
        "UPDATE dm_threads SET {$col} = COALESCE({$col}, datetime('now')) WHERE id = ?"
    );
    $stmt->execute([$threadId]);
}

function dm_mark_read(int $threadId, int $userId): void
{
    $thread = dm_thread_for_user($threadId, $userId);
    if (!$thread) {
        return;
    }
    $col = dm_user_is_a($thread, $userId) ? 'a_last_read_at' : 'b_last_read_at';
    $stmt = allxion_db()->prepare(
        "UPDATE dm_threads SET {$col} = datetime('now') WHERE id = ?"
    );
    $stmt->execute([$threadId]);
}

function dm_rate_ok(int $userId): bool
{
    $stmt = allxion_db()->prepare(
        "SELECT COUNT(*) FROM dm_messages
         WHERE sender_id = ? AND created_at >= datetime('now', '-1 hour')"
    );
    $stmt->execute([$userId]);
    return (int)$stmt->fetchColumn() < DM_RATE_PER_HOUR;
}

/**
 * @return list<string>
 */
function dm_send(array $sender, int $otherId, string $body, bool $policyOk): array
{
    $senderId = (int)$sender['id'];
    if ($senderId === $otherId) {
        return ['Du kannst dir keine Nachricht an dich selbst senden.'];
    }
    if (!dm_user_eligible($sender)) {
        return ['Direktnachrichten erst ab ' . DM_MIN_AGE . ' Jahren (Geburtsdatum im Konto).'];
    }
    if (!dm_rules_accepted($sender) && !$policyOk) {
        return ['Bitte die DM-Regeln akzeptieren.'];
    }

    $otherStmt = allxion_db()->prepare(
        'SELECT id, username, birthdate, dm_rules_accepted_at FROM users WHERE id = ?'
    );
    $otherStmt->execute([$otherId]);
    $other = $otherStmt->fetch();
    if (!$other) {
        return ['Empfänger nicht gefunden.'];
    }
    if (!dm_user_eligible($other)) {
        return ['Der Empfänger ist für DMs nicht freigeschaltet (Mindestalter ' . DM_MIN_AGE . ').'];
    }
    if (dm_is_blocked($senderId, $otherId)) {
        return ['Nachricht nicht möglich (Blockierung).'];
    }

    $body = trim($body);
    if ($body === '' || mb_strlen($body) > DM_MAX_LENGTH) {
        return ['Nachricht muss zwischen 1 und ' . DM_MAX_LENGTH . ' Zeichen lang sein.'];
    }

    require_once __DIR__ . '/moderation.php';
    $scan = content_scan_text($body);
    if ($scan['action'] === 'block') {
        return [$scan['reasons'][0] ?? 'Nachricht verstößt gegen die Regeln (kein 18++ / Porno).'];
    }

    if (!$policyOk && !dm_rules_accepted($sender)) {
        return ['Bitte die DM-Regeln akzeptieren.'];
    }
    if (!dm_rate_ok($senderId)) {
        return ['Zu viele Nachrichten in der letzten Stunde. Bitte später erneut versuchen.'];
    }

    if ($policyOk || !dm_rules_accepted($sender)) {
        dm_accept_rules($senderId);
    }

    $thread = dm_get_or_create_thread($senderId, $otherId);
    $threadId = (int)$thread['id'];
    dm_mark_thread_consent($threadId, $senderId);

    $ins = allxion_db()->prepare(
        'INSERT INTO dm_messages (thread_id, sender_id, body) VALUES (?, ?, ?)'
    );
    $ins->execute([$threadId, $senderId, $body]);
    allxion_db()->prepare(
        "UPDATE dm_threads SET updated_at = datetime('now') WHERE id = ?"
    )->execute([$threadId]);
    dm_mark_read($threadId, $senderId);

    return [];
}

/**
 * @return list<array<string,mixed>>
 */
function dm_inbox(int $userId): array
{
    $sql = <<<'SQL'
SELECT t.*,
  CASE WHEN t.user_a = ? THEN ub.username ELSE ua.username END AS other_username,
  CASE WHEN t.user_a = ? THEN t.user_b ELSE t.user_a END AS other_id,
  (SELECT body FROM dm_messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_body,
  (SELECT created_at FROM dm_messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_at,
  (
    SELECT COUNT(*) FROM dm_messages m
    WHERE m.thread_id = t.id
      AND m.sender_id != ?
      AND m.created_at > COALESCE(
            CASE WHEN t.user_a = ? THEN t.a_last_read_at ELSE t.b_last_read_at END,
            '1970-01-01'
          )
  ) AS unread
FROM dm_threads t
JOIN users ua ON ua.id = t.user_a
JOIN users ub ON ub.id = t.user_b
WHERE t.user_a = ? OR t.user_b = ?
ORDER BY COALESCE(t.updated_at, t.created_at) DESC
SQL;
    $stmt = allxion_db()->prepare($sql);
    $stmt->execute([$userId, $userId, $userId, $userId, $userId, $userId]);
    return $stmt->fetchAll();
}

function dm_unread_count(int $userId): int
{
    $threads = dm_inbox($userId);
    $n = 0;
    foreach ($threads as $t) {
        $n += (int)($t['unread'] ?? 0);
    }
    return $n;
}

/**
 * @return list<array<string,mixed>>
 */
function dm_messages(int $threadId, int $limit = 100): array
{
    $limit = max(1, min(200, $limit));
    $stmt = allxion_db()->prepare(
        "SELECT m.*, u.username
         FROM dm_messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.thread_id = ?
         ORDER BY m.id ASC
         LIMIT {$limit}"
    );
    $stmt->execute([$threadId]);
    return $stmt->fetchAll();
}

/**
 * @return list<string>
 */
function dm_report(array $reporter, int $threadId, string $reason, ?int $messageId = null): array
{
    $reason = trim($reason);
    if ($reason === '' || mb_strlen($reason) > DM_REPORT_REASON_MAX) {
        return ['Bitte einen Grund angeben (max. ' . DM_REPORT_REASON_MAX . ' Zeichen).'];
    }
    $thread = dm_thread_for_user($threadId, (int)$reporter['id']);
    if (!$thread) {
        return ['Unterhaltung nicht gefunden.'];
    }
    if ($messageId !== null) {
        $m = allxion_db()->prepare(
            'SELECT id FROM dm_messages WHERE id = ? AND thread_id = ?'
        );
        $m->execute([$messageId, $threadId]);
        if (!$m->fetch()) {
            return ['Nachricht nicht gefunden.'];
        }
    }
    $open = allxion_db()->prepare(
        "SELECT COUNT(*) FROM dm_reports
         WHERE reporter_id = ? AND thread_id = ? AND status = 'open'
           AND created_at >= datetime('now', '-1 day')"
    );
    $open->execute([(int)$reporter['id'], $threadId]);
    if ((int)$open->fetchColumn() >= 3) {
        return ['Zu viele offene Meldungen heute für diese Unterhaltung.'];
    }

    $ins = allxion_db()->prepare(
        'INSERT INTO dm_reports (reporter_id, thread_id, message_id, reason) VALUES (?, ?, ?, ?)'
    );
    $ins->execute([(int)$reporter['id'], $threadId, $messageId, $reason]);
    return [];
}

/**
 * Admin-only: open reports with context.
 * @return list<array<string,mixed>>
 */
function dm_admin_open_reports(): array
{
    $sql = <<<'SQL'
SELECT r.*,
  u.username AS reporter_username,
  t.user_a, t.user_b,
  ua.username AS user_a_name,
  ub.username AS user_b_name
FROM dm_reports r
JOIN users u ON u.id = r.reporter_id
JOIN dm_threads t ON t.id = r.thread_id
JOIN users ua ON ua.id = t.user_a
JOIN users ub ON ub.id = t.user_b
WHERE r.status = 'open'
ORDER BY r.created_at ASC
SQL;
    return allxion_db()->query($sql)->fetchAll();
}

function dm_admin_close_report(int $reportId, string $note = '', ?int $adminId = null): void
{
    $stmt = allxion_db()->prepare(
        "UPDATE dm_reports
         SET status = 'closed', reviewed_at = datetime('now'), admin_note = ?
         WHERE id = ?"
    );
    $stmt->execute([substr($note, 0, 500), $reportId]);

    if ($adminId) {
        $row = allxion_db()->prepare('SELECT thread_id FROM dm_reports WHERE id = ?');
        $row->execute([$reportId]);
        $threadId = (int)($row->fetchColumn() ?: 0);
        if ($threadId > 0) {
            dm_admin_audit($adminId, $threadId, $reportId, 'close_report', $note);
        }
    }
}

function dm_admin_audit(int $adminId, int $threadId, ?int $reportId, string $action, string $detail = ''): void
{
    $stmt = allxion_db()->prepare(
        'INSERT INTO dm_admin_audit (admin_id, thread_id, report_id, action, detail) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $adminId,
        $threadId,
        $reportId,
        substr($action, 0, 64),
        substr($detail, 0, 500),
    ]);
}

/**
 * Admin may read any DM thread (full moderation control).
 * Access is always audited. Users are informed via rules/consent.
 *
 * @return list<array<string,mixed>>|null
 */
function dm_admin_thread_messages(int $threadId, ?int $adminId = null, ?int $reportId = null): ?array
{
    $exists = allxion_db()->prepare('SELECT id FROM dm_threads WHERE id = ?');
    $exists->execute([$threadId]);
    if (!$exists->fetchColumn()) {
        return null;
    }

    if ($adminId) {
        $recent = allxion_db()->prepare(
            "SELECT 1 FROM dm_admin_audit
             WHERE admin_id = ? AND thread_id = ? AND action = 'view_thread'
               AND created_at >= datetime('now', '-10 minutes')
             LIMIT 1"
        );
        $recent->execute([$adminId, $threadId]);
        if (!$recent->fetchColumn()) {
            dm_admin_audit(
                $adminId,
                $threadId,
                $reportId,
                'view_thread',
                $reportId ? ('via report #' . $reportId) : 'full admin access'
            );
        }
    }

    return dm_messages($threadId, 200);
}

/** Full control: any existing thread is viewable by admins. */
function dm_admin_may_view_thread(int $threadId): bool
{
    $check = allxion_db()->prepare('SELECT 1 FROM dm_threads WHERE id = ? LIMIT 1');
    $check->execute([$threadId]);
    return (bool)$check->fetchColumn();
}

/**
 * All DM threads for admin browser.
 * @return list<array<string,mixed>>
 */
function dm_admin_all_threads(int $limit = 100): array
{
    $limit = max(1, min(300, $limit));
    $sql = <<<SQL
SELECT t.*,
  ua.username AS user_a_name,
  ub.username AS user_b_name,
  (SELECT body FROM dm_messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_body,
  (SELECT created_at FROM dm_messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_at,
  (SELECT COUNT(*) FROM dm_messages m WHERE m.thread_id = t.id) AS msg_count,
  (SELECT COUNT(*) FROM dm_reports r WHERE r.thread_id = t.id AND r.status = 'open') AS open_reports
FROM dm_threads t
JOIN users ua ON ua.id = t.user_a
JOIN users ub ON ub.id = t.user_b
ORDER BY COALESCE(t.updated_at, t.created_at) DESC
LIMIT {$limit}
SQL;
    return allxion_db()->query($sql)->fetchAll();
}

/**
 * @return array<string,mixed>|null
 */
function dm_admin_get_thread(int $threadId): ?array
{
    $stmt = allxion_db()->prepare(
        'SELECT t.*, ua.username AS user_a_name, ub.username AS user_b_name
         FROM dm_threads t
         JOIN users ua ON ua.id = t.user_a
         JOIN users ub ON ub.id = t.user_b
         WHERE t.id = ?'
    );
    $stmt->execute([$threadId]);
    $row = $stmt->fetch();
    return $row ?: null;
}
