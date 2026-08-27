<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';

allxion_require_admin();

$userId = (int)($_GET['user_id'] ?? 0);
$stmt = allxion_db()->prepare('SELECT id, age_doc_path FROM users WHERE id = ?');
$stmt->execute([$userId]);
$row = $stmt->fetch();
if (!$row || empty($row['age_doc_path'])) {
    http_response_code(404);
    exit('Dokument nicht gefunden.');
}

$file = ALLXION_AGE_DOCS . '/' . basename((string)$row['age_doc_path']);
if (!is_file($file)) {
    http_response_code(404);
    exit('Datei fehlt.');
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file) ?: 'application/octet-stream';
header('Content-Type: ' . $mime);
header('Content-Length: ' . (string)filesize($file));
header('X-Content-Type-Options: nosniff');
header('Content-Disposition: inline; filename="' . basename($file) . '"');
header('Cache-Control: private, no-store');
readfile($file);
exit;
