<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/media_upload.php';
require_once __DIR__ . '/friends.php';
require_once __DIR__ . '/social.php';

/** @return list<string> */
function albums_create(int $userId, string $title, string $description, string $privacy): array
{
    $title = trim($title);
    $description = trim($description);
    if ($title === '' || mb_strlen($title) > 80) {
        return ['Titel: 1–80 Zeichen.'];
    }
    if (mb_strlen($description) > 500) {
        return ['Beschreibung max. 500 Zeichen.'];
    }
    if (!in_array($privacy, ['public', 'friends', 'followers', 'private'], true)) {
        $privacy = 'friends';
    }
    allxion_db()->prepare(
        'INSERT INTO albums (user_id, title, description, privacy) VALUES (?, ?, ?, ?)'
    )->execute([$userId, $title, $description !== '' ? $description : null, $privacy]);
    return [];
}

function albums_can_view(?array $viewer, array $album, array $owner): bool
{
    if ($viewer && ((int)$viewer['id'] === (int)$owner['id'] || user_is_admin($viewer))) {
        return true;
    }
    $level = (string)($album['privacy'] ?? 'friends');
    if ($level === 'public') {
        return true;
    }
    if ($level === 'private' || !$viewer) {
        return false;
    }
    if ($level === 'followers') {
        return social_is_following((int)$viewer['id'], (int)$owner['id']);
    }
    return friends_are_friends((int)$viewer['id'], (int)$owner['id']);
}

/** @return list<array<string,mixed>> */
function albums_for_user(int $ownerId, ?array $viewer): array
{
    $ownerStmt = allxion_db()->prepare('SELECT * FROM users WHERE id = ?');
    $ownerStmt->execute([$ownerId]);
    $owner = $ownerStmt->fetch();
    if (!$owner) {
        return [];
    }
    $stmt = allxion_db()->prepare(
        'SELECT * FROM albums WHERE user_id = ? ORDER BY created_at DESC'
    );
    $stmt->execute([$ownerId]);
    $out = [];
    foreach ($stmt->fetchAll() as $album) {
        if (albums_can_view($viewer, $album, $owner)) {
            $out[] = $album;
        }
    }
    return $out;
}

/** @return list<string> */
function albums_add_photos(int $albumId, int $userId, array $files, bool $shareAsPost = false): array
{
    $album = allxion_db()->prepare('SELECT * FROM albums WHERE id = ? AND user_id = ?');
    $album->execute([$albumId, $userId]);
    $a = $album->fetch();
    if (!$a) {
        return ['Album nicht gefunden.'];
    }
    $files = array_slice($files, 0, MEDIA_POST_IMAGES_MAX);
    if (!$files) {
        return ['Bitte Bilder wählen.'];
    }
    $ins = allxion_db()->prepare(
        'INSERT INTO album_photos (album_id, path, mime, sort_order) VALUES (?, ?, ?, ?)'
    );
    $order = (int)allxion_db()->query(
        'SELECT COALESCE(MAX(sort_order),0) FROM album_photos WHERE album_id = ' . (int)$albumId
    )->fetchColumn();
    $firstPath = null;
    $storedPaths = [];
    foreach ($files as $file) {
        $stored = media_store_image($file, 'albums');
        if (!$stored['ok']) {
            return [$stored['error']];
        }
        $order++;
        $ins->execute([$albumId, $stored['path'], $stored['mime'], $order]);
        $storedPaths[] = $stored['path'];
        if ($firstPath === null) {
            $firstPath = $stored['path'];
        }
    }
    if ($firstPath && empty($a['cover_path'])) {
        allxion_db()->prepare('UPDATE albums SET cover_path = ? WHERE id = ?')
            ->execute([$firstPath, $albumId]);
    }
    if ($shareAsPost && $storedPaths) {
        require_once __DIR__ . '/posts.php';
        $title = (string)($a['title'] ?? 'Album');
        allxion_share_images_as_post(
            $userId,
            'hat Fotos zum Album „' . $title . '“ hinzugefügt.',
            $storedPaths
        );
    }
    return [];
}

/** @return list<array<string,mixed>> */
function albums_photos(int $albumId): array
{
    $stmt = allxion_db()->prepare(
        'SELECT * FROM album_photos WHERE album_id = ? ORDER BY sort_order ASC, id ASC'
    );
    $stmt->execute([$albumId]);
    return $stmt->fetchAll();
}
