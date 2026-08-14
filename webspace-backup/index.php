<?php
declare(strict_types=1);

require __DIR__ . '/job.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $config = nb_backup_load_config(__DIR__);
    nb_backup_require_token($config);
    $statusFile = __DIR__ . '/archiv/status.json';
    if (!is_file($statusFile)) {
        echo json_encode(['ok' => false, 'error' => 'Noch kein Backup gelaufen.'], JSON_UNESCAPED_SLASHES);
        exit;
    }
    echo file_get_contents($statusFile);
} catch (Throwable $e) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_SLASHES);
}
