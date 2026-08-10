<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/friends.php';

function groups_slugify(string $name): string
{
    $s = mb_strtolower(trim($name));
    $s = preg_replace('/[^a-z0-9]+/i', '-', $s) ?? '';
    $s = trim($s, '-');
    if ($s === '') {
        $s = 'gruppe';
    }
    return mb_substr($s, 0, 48);
}

/** @return list<string> */
function groups_create(int $ownerId, string $name, string $description, string $privacy): array
{
    $name = trim($name);
    $description = trim($description);
    if ($name === '' || mb_strlen($name) > 80) {
        return ['Gruppenname: 1–80 Zeichen.'];
    }
    if (mb_strlen($description) > 1000) {
        return ['Beschreibung max. 1000 Zeichen.'];
    }
    if (!in_array($privacy, ['public', 'friends', 'private'], true)) {
        $privacy = 'public';
    }
    $slug = groups_slugify($name);
    $base = $slug;
    $i = 1;
    while (true) {
        $check = allxion_db()->prepare('SELECT 1 FROM community_groups WHERE lower(slug) = lower(?)');
        $check->execute([$slug]);
        if (!$check->fetchColumn()) {
            break;
        }
        $slug = $base . '-' . $i;
        $i++;
        if ($i > 50) {
            return ['Slug belegt — anderen Namen wählen.'];
        }
    }
    $pdo = allxion_db();
    $pdo->prepare(
        'INSERT INTO community_groups (owner_id, name, slug, description, privacy) VALUES (?, ?, ?, ?, ?)'
    )->execute([$ownerId, $name, $slug, $description !== '' ? $description : null, $privacy]);
    $gid = (int)$pdo->lastInsertId();
    $pdo->prepare(
        "INSERT INTO group_members (group_id, user_id, role, status) VALUES (?, ?, 'owner', 'member')"
    )->execute([$gid, $ownerId]);
    return [];
}

function groups_is_member(int $groupId, int $userId): bool
{
    $stmt = allxion_db()->prepare(
        "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'member'"
    );
    $stmt->execute([$groupId, $userId]);
    return (bool)$stmt->fetchColumn();
}

function groups_can_view(?array $viewer, array $group): bool
{
    $privacy = (string)($group['privacy'] ?? 'public');
    if ($privacy === 'public') {
        return true;
    }
    if (!$viewer) {
        return false;
    }
    if (groups_is_member((int)$group['id'], (int)$viewer['id']) || user_is_admin($viewer)) {
        return true;
    }
    if ($privacy === 'friends') {
        return friends_are_friends((int)$viewer['id'], (int)$group['owner_id']);
    }
    return false;
}

/** @return list<string> */
function groups_join(int $groupId, int $userId): array
{
    $g = allxion_db()->prepare('SELECT * FROM community_groups WHERE id = ?');
    $g->execute([$groupId]);
    $group = $g->fetch();
    if (!$group) {
        return ['Gruppe nicht gefunden.'];
    }
    if (!groups_can_view(['id' => $userId], $group) && ($group['privacy'] ?? '') === 'private') {
        // private: only invite/owner — for now allow request as pending
    }
    if (($group['privacy'] ?? '') === 'private' && (int)$group['owner_id'] !== $userId) {
        allxion_db()->prepare(
            "INSERT OR IGNORE INTO group_members (group_id, user_id, role, status) VALUES (?, ?, 'member', 'pending')"
        )->execute([$groupId, $userId]);
        return [];
    }
    allxion_db()->prepare(
        "INSERT OR REPLACE INTO group_members (group_id, user_id, role, status) VALUES (?, ?, 'member', 'member')"
    )->execute([$groupId, $userId]);
    return [];
}

function groups_leave(int $groupId, int $userId): array
{
    $g = allxion_db()->prepare('SELECT owner_id FROM community_groups WHERE id = ?');
    $g->execute([$groupId]);
    $owner = (int)($g->fetchColumn() ?: 0);
    if ($owner === $userId) {
        return ['Als Owner kannst du die Gruppe nicht verlassen — lösche sie ggf. später.'];
    }
    allxion_db()->prepare(
        'DELETE FROM group_members WHERE group_id = ? AND user_id = ?'
    )->execute([$groupId, $userId]);
    return [];
}

/** @return list<string> */
function groups_post(int $groupId, int $userId, string $body): array
{
    $body = trim($body);
    if ($body === '' || mb_strlen($body) > 4000) {
        return ['Beitrag 1–4000 Zeichen.'];
    }
    if (!groups_is_member($groupId, $userId)) {
        return ['Nur Mitglieder können posten.'];
    }
    allxion_db()->prepare(
        'INSERT INTO group_posts (group_id, user_id, body) VALUES (?, ?, ?)'
    )->execute([$groupId, $userId, $body]);
    $postId = (int)allxion_db()->lastInsertId();

    require_once __DIR__ . '/mail.php';
    $g = allxion_db()->prepare('SELECT name, slug FROM community_groups WHERE id = ?');
    $g->execute([$groupId]);
    $group = $g->fetch() ?: ['name' => 'Gruppe', 'slug' => ''];
    $u = allxion_db()->prepare('SELECT username FROM users WHERE id = ?');
    $u->execute([$userId]);
    $uname = (string)($u->fetchColumn() ?: 'jemand');
    $members = allxion_db()->prepare(
        "SELECT user_id FROM group_members WHERE group_id = ? AND status = 'member'"
    );
    $members->execute([$groupId]);
    $ids = array_map(static fn($r) => (int)$r['user_id'], $members->fetchAll());
    $preview = mb_substr(trim($body), 0, 160);
    $link = hybrixon_public_url('group.php?slug=' . rawurlencode((string)($group['slug'] ?? '')));
    hybrixon_notify_email_bulk(
        $ids,
        'email_notify_group_posts',
        'Neuer Beitrag in ' . (string)$group['name'],
        '@' . $uname . ' in „' . (string)$group['name'] . "“:\n\n" . $preview . "\n\nÖffnen: " . $link,
        $userId
    );

    return [];
}

/** @return list<array<string,mixed>> */
function groups_list(?array $viewer, int $limit = 40): array
{
    $rows = allxion_db()->query(
        'SELECT g.*, u.username AS owner_name,
          (SELECT COUNT(*) FROM group_members m WHERE m.group_id = g.id AND m.status = \'member\') AS member_count
         FROM community_groups g
         JOIN users u ON u.id = g.owner_id
         ORDER BY g.created_at DESC LIMIT ' . max(1, min(100, $limit))
    )->fetchAll();
    return array_values(array_filter($rows, static fn ($g) => groups_can_view($viewer, $g)));
}
