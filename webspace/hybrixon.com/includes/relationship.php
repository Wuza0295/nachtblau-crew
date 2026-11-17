<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/friends.php';

/** @return array<string,string> */
function relationship_status_labels(): array
{
    return [
        'unspecified' => 'Keine Angabe',
        'single' => 'Single',
        'in_relationship' => 'In einer Beziehung',
        'engaged' => 'Verlobt',
        'married' => 'Verheiratet',
        'complicated' => 'Es ist kompliziert',
        'open' => 'Offene Beziehung',
    ];
}

function relationship_label(string $status): string
{
    $map = relationship_status_labels();
    return $map[$status] ?? $map['unspecified'];
}

function relationship_can_view(?array $viewer, array $owner): bool
{
    if ($viewer && ((int)$viewer['id'] === (int)$owner['id'] || user_is_admin($viewer))) {
        return true;
    }
    $level = (string)($owner['privacy_relationship'] ?? 'friends');
    if ($level === 'public') {
        return true;
    }
    if ($level === 'private' || !$viewer) {
        return false;
    }
    if ($level === 'followers') {
        require_once __DIR__ . '/social.php';
        return social_is_following((int)$viewer['id'], (int)$owner['id']);
    }
    return friends_are_friends((int)$viewer['id'], (int)$owner['id']);
}

/** @return list<string> */
function relationship_set_status(int $userId, string $status): array
{
    if (!isset(relationship_status_labels()[$status])) {
        return ['Ungültiger Beziehungsstatus.'];
    }
    allxion_db()->prepare(
        'UPDATE users SET relationship_status = ? WHERE id = ?'
    )->execute([$status, $userId]);
    if (in_array($status, ['single', 'unspecified'], true)) {
        relationship_clear_partner($userId);
    }
    return [];
}

function relationship_clear_partner(int $userId): void
{
    $pdo = allxion_db();
    $stmt = $pdo->prepare('SELECT partner_id, partner_pending_id FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) {
        return;
    }
    $partnerId = (int)($row['partner_id'] ?? 0);
    $pendingId = (int)($row['partner_pending_id'] ?? 0);
    $pdo->prepare(
        'UPDATE users SET partner_id = NULL, partner_pending_id = NULL WHERE id = ?'
    )->execute([$userId]);
    if ($partnerId > 0) {
        $pdo->prepare(
            'UPDATE users SET partner_id = NULL WHERE id = ? AND partner_id = ?'
        )->execute([$partnerId, $userId]);
    }
    if ($pendingId > 0) {
        // no-op on target; pending is only on requester
    }
}

/** @return list<string> */
function relationship_request_partner(int $fromId, string $partnerUsername): array
{
    $partnerUsername = trim($partnerUsername);
    if ($partnerUsername === '') {
        return ['Partner-Benutzername fehlt.'];
    }
    $stmt = allxion_db()->prepare(
        'SELECT id, username, banned_at, partner_id FROM users WHERE lower(username) = lower(?)'
    );
    $stmt->execute([$partnerUsername]);
    $target = $stmt->fetch();
    if (!$target || !empty($target['banned_at'])) {
        return ['Nutzer nicht gefunden.'];
    }
    $toId = (int)$target['id'];
    if ($toId === $fromId) {
        return ['Du kannst dich nicht selbst als Partner eintragen.'];
    }
    if (!empty($target['partner_id'])) {
        return ['Diese Person hat bereits einen Partner eingetragen.'];
    }
    $me = allxion_db()->prepare('SELECT partner_id, partner_pending_id FROM users WHERE id = ?');
    $me->execute([$fromId]);
    $mine = $me->fetch();
    if (!empty($mine['partner_id'])) {
        return ['Du hast bereits einen Partner. Zuerst trennen.'];
    }
    allxion_db()->prepare(
        'UPDATE users SET partner_pending_id = ? WHERE id = ?'
    )->execute([$toId, $fromId]);
    require_once __DIR__ . '/notifications.php';
    notifications_create($toId, 'partner_request', $fromId);
    return [];
}

/** @return list<string> */
function relationship_respond_partner(int $me, int $fromId, bool $accept): array
{
    $stmt = allxion_db()->prepare(
        'SELECT id, partner_pending_id, partner_id FROM users WHERE id = ?'
    );
    $stmt->execute([$fromId]);
    $from = $stmt->fetch();
    if (!$from || (int)($from['partner_pending_id'] ?? 0) !== $me) {
        return ['Keine Partner-Anfrage.'];
    }
    if ($accept) {
        $pdo = allxion_db();
        $pdo->prepare(
            "UPDATE users SET partner_id = ?, partner_pending_id = NULL,
             relationship_status = CASE WHEN relationship_status IN ('unspecified','single') THEN 'in_relationship' ELSE relationship_status END
             WHERE id = ?"
        )->execute([$me, $fromId]);
        $pdo->prepare(
            "UPDATE users SET partner_id = ?, partner_pending_id = NULL,
             relationship_status = CASE WHEN relationship_status IN ('unspecified','single') THEN 'in_relationship' ELSE relationship_status END
             WHERE id = ?"
        )->execute([$fromId, $me]);
    } else {
        allxion_db()->prepare(
            'UPDATE users SET partner_pending_id = NULL WHERE id = ?'
        )->execute([$fromId]);
    }
    return [];
}

/** Incoming partner requests for $userId */
function relationship_incoming(int $userId): array
{
    $stmt = allxion_db()->prepare(
        'SELECT id, username, display_name, avatar_path FROM users
         WHERE partner_pending_id = ? AND (banned_at IS NULL OR banned_at = \'\')'
    );
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
}

function relationship_partner_user(?array $owner): ?array
{
    $pid = (int)($owner['partner_id'] ?? 0);
    if ($pid <= 0) {
        return null;
    }
    $stmt = allxion_db()->prepare(
        'SELECT id, username, display_name, avatar_path FROM users WHERE id = ?'
    );
    $stmt->execute([$pid]);
    $row = $stmt->fetch();
    return $row ?: null;
}
