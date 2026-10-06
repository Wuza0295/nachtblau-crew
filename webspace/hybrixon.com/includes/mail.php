<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/legal.php';

/**
 * @return array<string, string> key => label
 */
function hybrixon_email_pref_labels(): array
{
    return [
        'email_notify_enabled' => 'E-Mail-Benachrichtigungen insgesamt',
        'email_notify_activity' => 'Aktivitäten (Likes, Kommentare, Erwähnungen, Freundes-/Partner-Anfragen)',
        'email_notify_messages' => 'Neue Direktnachrichten',
        'email_notify_friend_posts' => 'Neue Beiträge von Freunden',
        'email_notify_group_posts' => 'Neue Beiträge in meinen Gruppen',
    ];
}

function hybrixon_mail_enabled(): bool
{
    return defined('HYBRIXON_MAIL_ENABLED') ? (bool)HYBRIXON_MAIL_ENABLED : true;
}

function hybrixon_send_mail(string $to, string $subject, string $textBody): bool
{
    if (!hybrixon_mail_enabled()) {
        return false;
    }
    $to = trim($to);
    if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        return false;
    }
    $from = LEGAL_EMAIL;
    $subject = 'Hybrixon: ' . preg_replace("/[\r\n]+/", ' ', $subject);
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'From: Hybrixon <' . $from . '>',
        'Reply-To: ' . $from,
        'X-Mailer: Hybrixon',
    ];
    $body = $textBody . "\n\n—\nHybrixon · " . hybrixon_public_url('') . "\n"
        . "E-Mails kannst du unter Einstellungen anpassen oder abschalten.\n";
    return @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));
}

function hybrixon_user_wants_email(array $user, string $pref): bool
{
    if ((int)($user['email_notify_enabled'] ?? 1) !== 1) {
        return false;
    }
    if ($pref === 'email_notify_enabled') {
        return true;
    }
    return (int)($user[$pref] ?? 0) === 1;
}

function hybrixon_fetch_user_email_prefs(int $userId): ?array
{
    if ($userId <= 0) {
        return null;
    }
    $stmt = allxion_db()->prepare(
        'SELECT id, username, email, email_notify_enabled, email_notify_activity,
                email_notify_messages, email_notify_friend_posts, email_notify_group_posts, banned_at
         FROM users WHERE id = ?'
    );
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function hybrixon_notify_email_activity(int $userId, string $subject, string $text): void
{
    $user = hybrixon_fetch_user_email_prefs($userId);
    if (!$user || !empty($user['banned_at'])) {
        return;
    }
    if (!hybrixon_user_wants_email($user, 'email_notify_activity')) {
        return;
    }
    hybrixon_send_mail((string)$user['email'], $subject, $text);
}

function hybrixon_notify_email_message(int $userId, string $fromUsername, string $preview): void
{
    $user = hybrixon_fetch_user_email_prefs($userId);
    if (!$user || !empty($user['banned_at'])) {
        return;
    }
    if (!hybrixon_user_wants_email($user, 'email_notify_messages')) {
        return;
    }
    $preview = mb_substr(trim($preview), 0, 160);
    hybrixon_send_mail(
        (string)$user['email'],
        'Neue Nachricht von @' . $fromUsername,
        '@' . $fromUsername . " hat dir geschrieben:\n\n" . $preview . "\n\n"
            . 'Öffnen: ' . hybrixon_public_url('messages.php')
    );
}

/**
 * @param list<int> $userIds
 */
function hybrixon_notify_email_bulk(array $userIds, string $pref, string $subject, string $text, int $excludeId = 0): void
{
    $userIds = array_values(array_unique(array_filter(array_map('intval', $userIds))));
    foreach ($userIds as $uid) {
        if ($uid <= 0 || $uid === $excludeId) {
            continue;
        }
        $user = hybrixon_fetch_user_email_prefs($uid);
        if (!$user || !empty($user['banned_at'])) {
            continue;
        }
        if (!hybrixon_user_wants_email($user, $pref)) {
            continue;
        }
        hybrixon_send_mail((string)$user['email'], $subject, $text);
    }
}

/** @return list<int> */
function hybrixon_admin_ids(): array
{
    $rows = allxion_db()->query(
        "SELECT id FROM users
         WHERE is_admin = 1
           AND (banned_at IS NULL OR banned_at = '')"
    )->fetchAll();
    return array_map(static fn($r) => (int)$r['id'], $rows);
}

/**
 * In-app + e-mail for every admin when a user files a report.
 */
function hybrixon_notify_admins_of_report(
    string $kind,
    ?int $reporterId,
    string $reason,
    ?int $postId = null
): void {
    require_once __DIR__ . '/notifications.php';
    $kind = $kind === 'dm' ? 'dm' : 'post';
    $type = $kind === 'dm' ? 'report_dm' : 'report_post';
    $reason = mb_substr(trim($reason), 0, 400);
    $reporterName = 'Jemand';
    if ($reporterId) {
        $s = allxion_db()->prepare('SELECT username FROM users WHERE id = ?');
        $s->execute([$reporterId]);
        $u = $s->fetchColumn();
        if ($u) {
            $reporterName = '@' . $u;
        }
    }
    $summary = $kind === 'dm'
        ? $reporterName . ' hat eine DM gemeldet'
        : $reporterName . ' hat einen Beitrag gemeldet';
    if ($reason !== '') {
        $summary .= ': ' . $reason;
    }
    $adminUrl = hybrixon_public_url('admin/');
    $linkHint = $postId
        ? hybrixon_public_url('post.php?id=' . (int)$postId) . "\nAdmin: " . $adminUrl
        : $adminUrl;

    foreach (hybrixon_admin_ids() as $adminId) {
        if ($reporterId && $adminId === $reporterId) {
            continue;
        }
        notifications_create($adminId, $type, $reporterId, $postId, null, $summary);
        $admin = hybrixon_fetch_user_email_prefs($adminId);
        if (!$admin || !empty($admin['banned_at'])) {
            continue;
        }
        // Moderation mail: only respect master e-mail switch
        if ((int)($admin['email_notify_enabled'] ?? 1) !== 1) {
            continue;
        }
        hybrixon_send_mail(
            (string)$admin['email'],
            $kind === 'dm' ? 'Neue DM-Meldung' : 'Neue Beitrags-Meldung',
            $summary . "\n\nÖffnen: " . $linkHint
        );
    }
}
