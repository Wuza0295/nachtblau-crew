<?php
declare(strict_types=1);

/**
 * ALL-INKL On-Server-Backup: alle Domain-Ordner (inkl. hybrixon.com) plus optionale MySQL-Dumps.
 * Nutzt das vorinstallierte PEAR-Paket Archive_Tar.
 */

function nb_backup_load_config(string $dir): array
{
    $file = $dir . '/config.php';
    if (!is_file($file)) {
        throw new RuntimeException('config.php fehlt. Bitte config.example.php kopieren oder deploy-backup.py ausführen.');
    }
    $config = require $file;
    if (!is_array($config) || empty($config['token']) || $config['token'] === 'CHANGE_ME') {
        throw new RuntimeException('config.php: gültiges token setzen.');
    }
    $config['keep'] = max(1, (int) ($config['keep'] ?? 7));
    $config['skip_roots'] = array_values(array_unique(array_merge(
        ['backup', 'logs', 'cgi-bin', 'tmp', 'mail', '.', '..'],
        $config['skip_roots'] ?? []
    )));
    $config['ignore_names'] = array_values(array_unique(array_merge(
        ['node_modules', '.git', '__pycache__', 'backup', 'archiv'],
        $config['ignore_names'] ?? []
    )));
    $config['databases'] = $config['databases'] ?? [];
    return $config;
}

function nb_backup_require_token(array $config): void
{
    if (PHP_SAPI === 'cli') {
        return;
    }
    $provided = $_GET['token'] ?? $_SERVER['HTTP_X_BACKUP_TOKEN'] ?? '';
    if (!is_string($provided) || !hash_equals((string) $config['token'], $provided)) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=utf-8');
        echo "Forbidden\n";
        exit(1);
    }
}

function nb_backup_home(array $config, string $backupDir): string
{
    if (!empty($config['home']) && is_dir($config['home'])) {
        return rtrim((string) $config['home'], '/');
    }
    foreach ([$_SERVER['HOME'] ?? '', getenv('HOME') ?: ''] as $candidate) {
        if (is_string($candidate) && $candidate !== '' && is_dir($candidate)) {
            return rtrim($candidate, '/');
        }
    }
    // webspace-backup liegt unter <home>/<domain>/backup
    $guess = dirname($backupDir, 2);
    if (is_dir($guess)) {
        return $guess;
    }
    throw new RuntimeException('Account-Home nicht gefunden.');
}

function nb_backup_projects(string $home, array $skipRoots): array
{
    $projects = [];
    $entries = @scandir($home) ?: [];
    foreach ($entries as $name) {
        if (in_array($name, $skipRoots, true) || str_starts_with($name, '.')) {
            continue;
        }
        $path = $home . '/' . $name;
        if (is_dir($path)) {
            $projects[] = $name;
        }
    }
    sort($projects);
    return $projects;
}

function nb_backup_prune(string $archivDir, string $prefix, int $keep): int
{
    $files = glob($archivDir . '/' . $prefix . '-*.tar.gz') ?: [];
    rsort($files, SORT_STRING);
    $removed = 0;
    foreach (array_slice($files, $keep) as $old) {
        if (@unlink($old)) {
            $removed++;
        }
    }
    return $removed;
}

function nb_backup_archive_project(string $home, string $project, string $target, array $ignoreNames): void
{
    if (!class_exists('Archive_Tar')) {
        require_once 'Archive/Tar.php';
    }
    $source = $home . '/' . $project;
    $tar = new Archive_Tar($target, 'gz');
    $tar->setIgnoreList($ignoreNames);
    $ok = $tar->createModify($source, '', $home);
    if ($ok === false) {
        throw new RuntimeException("Archiv fehlgeschlagen: {$project}");
    }
}

function nb_backup_dump_mysql(array $db, string $targetSql): void
{
    $host = $db['host'] ?? 'localhost';
    $user = $db['user'] ?? $db['name'] ?? '';
    $pass = $db['pass'] ?? '';
    $name = $db['name'] ?? '';
    if ($name === '' || $user === '') {
        throw new RuntimeException('MySQL-Eintrag unvollständig.');
    }
    $mysqli = @new mysqli($host, $user, $pass, $name);
    if ($mysqli->connect_error) {
        throw new RuntimeException('MySQL-Login fehlgeschlagen für ' . $name);
    }
    $mysqli->set_charset('utf8mb4');
    $fh = fopen($targetSql, 'wb');
    if ($fh === false) {
        $mysqli->close();
        throw new RuntimeException('Dump-Datei nicht schreibbar.');
    }
    fwrite($fh, "-- NachtBlau backup {$name} " . gmdate('c') . "\nSET FOREIGN_KEY_CHECKS=0;\n");
    $tables = [];
    $result = $mysqli->query('SHOW TABLES');
    if ($result) {
        while ($row = $result->fetch_row()) {
            $tables[] = $row[0];
        }
        $result->free();
    }
    foreach ($tables as $table) {
        $create = $mysqli->query('SHOW CREATE TABLE `' . $mysqli->real_escape_string($table) . '`');
        $row = $create ? $create->fetch_assoc() : null;
        if ($create) {
            $create->free();
        }
        $ddl = $row['Create Table'] ?? null;
        if ($ddl) {
            fwrite($fh, "DROP TABLE IF EXISTS `{$table}`;\n{$ddl};\n");
        }
        $data = $mysqli->query('SELECT * FROM `' . $table . '`', MYSQLI_USE_RESULT);
        if (!$data) {
            continue;
        }
        while ($record = $data->fetch_assoc()) {
            $cols = [];
            $vals = [];
            foreach ($record as $col => $val) {
                $cols[] = '`' . $col . '`';
                $vals[] = $val === null ? 'NULL' : "'" . $mysqli->real_escape_string((string) $val) . "'";
            }
            fwrite($fh, 'INSERT INTO `' . $table . '` (' . implode(',', $cols) . ') VALUES (' . implode(',', $vals) . ");\n");
        }
        $data->free();
    }
    fwrite($fh, "SET FOREIGN_KEY_CHECKS=1;\n");
    fclose($fh);
    $mysqli->close();
}

function nb_backup_run(string $backupDir, ?string $onlyProject = null): array
{
    @set_time_limit(0);
    @ini_set('memory_limit', '512M');
    @ini_set('max_execution_time', '0');

    $config = nb_backup_load_config($backupDir);
    nb_backup_require_token($config);

    $archivDir = $backupDir . '/archiv';
    if (!is_dir($archivDir) && !mkdir($archivDir, 0700, true) && !is_dir($archivDir)) {
        throw new RuntimeException('archiv/ konnte nicht angelegt werden.');
    }
    @chmod($archivDir, 0700);

    $stamp = gmdate('Ymd-His');
    $home = nb_backup_home($config, $backupDir);
    $projects = nb_backup_projects($home, $config['skip_roots']);
    if ($onlyProject) {
        $projects = array_values(array_filter($projects, static fn($p) => $p === $onlyProject));
        if (!$projects) {
            throw new RuntimeException('Unbekanntes Projekt: ' . $onlyProject);
        }
    }
    $results = [];

    foreach ($projects as $project) {
        $file = $archivDir . '/' . $project . '-' . $stamp . '.tar.gz';
        try {
            nb_backup_archive_project($home, $project, $file, $config['ignore_names']);
            $bytes = is_file($file) ? filesize($file) : 0;
            $pruned = nb_backup_prune($archivDir, $project, $config['keep']);
            $results[] = [
                'project' => $project,
                'ok' => true,
                'file' => basename($file),
                'bytes' => $bytes,
                'pruned' => $pruned,
            ];
        } catch (Throwable $e) {
            $results[] = [
                'project' => $project,
                'ok' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    foreach ($config['databases'] as $db) {
        $label = preg_replace('/[^a-zA-Z0-9._-]+/', '_', (string) ($db['name'] ?? 'db')) ?: 'db';
        $sqlFile = $archivDir . '/mysql-' . $label . '-' . $stamp . '.sql';
        try {
            nb_backup_dump_mysql($db, $sqlFile);
            $gz = $sqlFile . '.gz';
            $raw = file_get_contents($sqlFile);
            if ($raw === false) {
                throw new RuntimeException('Dump leer.');
            }
            file_put_contents($gz, gzencode($raw, 9));
            @unlink($sqlFile);
            nb_backup_prune($archivDir, 'mysql-' . $label, $config['keep']);
            $results[] = [
                'project' => 'mysql:' . $label,
                'ok' => true,
                'file' => basename($gz),
                'bytes' => is_file($gz) ? filesize($gz) : 0,
            ];
        } catch (Throwable $e) {
            $results[] = [
                'project' => 'mysql:' . $label,
                'ok' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    $status = [
        'ok' => !in_array(false, array_column($results, 'ok'), true),
        'ran_at' => gmdate('c'),
        'home' => $home,
        'projects' => $projects,
        'results' => $results,
    ];
    file_put_contents($archivDir . '/status.json', json_encode($status, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    $logLine = $status['ran_at'] . ' ok=' . ($status['ok'] ? '1' : '0') . ' n=' . count($results) . "\n";
    file_put_contents($backupDir . '/backup.log', $logLine, FILE_APPEND);
    return $status;
}
