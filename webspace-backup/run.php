<?php
declare(strict_types=1);

/**
 * ALL-INKL-Cronjob-Ziel (HTTP).
 * KAS → Tools → Cronjobs:
 *   https://nacht-blau.de/backup/run.php?token=GEHEIM
 * Täglich nachts reicht; Archive_Tar ist auf dem Host vorinstalliert.
 */
header('Content-Type: text/plain; charset=utf-8');

require __DIR__ . '/job.php';

try {
    $only = isset($_GET['project']) ? (string) $_GET['project'] : null;
    $status = nb_backup_run(__DIR__, $only !== '' ? $only : null);
    echo $status['ok'] ? "Backup fertig\n" : "Backup mit Fehlern\n";
    echo 'Zeit: ' . $status['ran_at'] . "\n";
    echo 'Home: ' . $status['home'] . "\n";
    foreach ($status['results'] as $row) {
        if (!empty($row['ok'])) {
            echo 'OK  ' . $row['project'] . ' ' . ($row['file'] ?? '') . ' ' . ($row['bytes'] ?? 0) . " bytes\n";
        } else {
            echo 'ERR ' . $row['project'] . ' ' . ($row['error'] ?? '') . "\n";
        }
    }
    http_response_code($status['ok'] ? 200 : 500);
} catch (Throwable $e) {
    http_response_code(500);
    echo 'Fehler: ' . $e->getMessage() . "\n";
}
