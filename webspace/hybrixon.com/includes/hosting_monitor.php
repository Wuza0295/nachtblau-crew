<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

/** @return list<string> */
function hybrixon_hosting_dir_bytes(string $dir): int
{
    if (!is_dir($dir)) {
        return 0;
    }
    $total = 0;
    try {
        $it = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($it as $file) {
            if ($file instanceof SplFileInfo && $file->isFile()) {
                $total += (int)$file->getSize();
            }
        }
    } catch (Throwable) {
        return $total;
    }
    return $total;
}

function hybrixon_hosting_format_bytes(int $bytes): string
{
    if ($bytes < 1024) {
        return $bytes . ' B';
    }
    $units = ['KB', 'MB', 'GB', 'TB'];
    $v = (float)$bytes;
    foreach ($units as $u) {
        $v /= 1024;
        if ($v < 1024) {
            return number_format($v, $v >= 10 ? 0 : 1, ',', '.') . ' ' . $u;
        }
    }
    return number_format($v, 1, ',', '.') . ' PB';
}

/**
 * Collect live hosting fitness signals for ALL-INKL shared hosting.
 *
 * @return array{
 *   provider: string,
 *   engine: string,
 *   php: string,
 *   phpMin: string,
 *   sqlite: bool,
 *   metrics: array<string, mixed>,
 *   signals: list<array{level: string, code: string, message: string}>,
 *   verdict: string,
 *   score: int,
 *   recommendation: string,
 *   checkedAt: string
 * }
 */
function hybrixon_hosting_snapshot(bool $detailed = false, bool $scanUploads = false): array
{
    $t0 = hrtime(true);
    $pdo = allxion_db();

    $users = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    $posts = (int)$pdo->query('SELECT COUNT(*) FROM posts')->fetchColumn();
    $dbBytes = is_file(ALLXION_DB) ? (int)filesize(ALLXION_DB) : 0;

    // Full upload tree walks are expensive — only on admin / explicit scan.
    // Otherwise reuse the last recorded sample when present.
    $uploadBytes = 0;
    if ($scanUploads) {
        $uploadBytes = hybrixon_hosting_dir_bytes(ALLXION_UPLOADS);
    } else {
        $hist = hybrixon_hosting_history();
        if ($hist) {
            $last = $hist[array_key_last($hist)];
            $uploadBytes = (int)($last['uploadBytes'] ?? 0);
        }
    }

    $freeBytes = @disk_free_space(ALLXION_DATA);
    $freeBytes = $freeBytes === false ? null : (int)$freeBytes;

    $latencyMs = (int)round((hrtime(true) - $t0) / 1_000_000);

    $signals = [];
    $score = 100;

    $phpOk = version_compare(PHP_VERSION, HYBRIXON_MIN_PHP, '>=');
    if (!$phpOk) {
        $signals[] = [
            'level' => 'critical',
            'code' => 'php_old',
            'message' => 'PHP ' . PHP_VERSION . ' liegt unter Minimum ' . HYBRIXON_MIN_PHP . '.',
        ];
        $score -= 40;
    }

    if (!extension_loaded('pdo_sqlite')) {
        $signals[] = [
            'level' => 'critical',
            'code' => 'sqlite_missing',
            'message' => 'pdo_sqlite fehlt — Portal kann nicht zuverlässig laufen.',
        ];
        $score -= 50;
    }

    if ($dbBytes >= 1_073_741_824) {
        $signals[] = [
            'level' => 'critical',
            'code' => 'db_huge',
            'message' => 'SQLite-DB ist sehr groß (' . hybrixon_hosting_format_bytes($dbBytes) . ') — Wechsel zu MySQL/Postgres prüfen.',
        ];
        $score -= 35;
    } elseif ($dbBytes >= 200_000_000) {
        $signals[] = [
            'level' => 'warn',
            'code' => 'db_large',
            'message' => 'SQLite-DB wächst (' . hybrixon_hosting_format_bytes($dbBytes) . '). ALL-INKL noch ok, aber beobachten.',
        ];
        $score -= 15;
    }

    if ($uploadBytes >= 10_737_418_240) {
        $signals[] = [
            'level' => 'critical',
            'code' => 'uploads_huge',
            'message' => 'Uploads sehr groß (' . hybrixon_hosting_format_bytes($uploadBytes) . ') — Speicher/CDN oder VPS prüfen.',
        ];
        $score -= 30;
    } elseif ($uploadBytes >= 2_147_483_648) {
        $signals[] = [
            'level' => 'warn',
            'code' => 'uploads_large',
            'message' => 'Uploads wachsen (' . hybrixon_hosting_format_bytes($uploadBytes) . ').',
        ];
        $score -= 12;
    }

    if ($users >= 20_000) {
        $signals[] = [
            'level' => 'critical',
            'code' => 'users_high',
            'message' => 'Sehr viele Nutzer (' . number_format($users, 0, ',', '.') . ') — Shared Hosting wird eng.',
        ];
        $score -= 25;
    } elseif ($users >= 5_000) {
        $signals[] = [
            'level' => 'warn',
            'code' => 'users_growing',
            'message' => 'Nutzerzahl steigt (' . number_format($users, 0, ',', '.') . ').',
        ];
        $score -= 10;
    }

    if ($posts >= 100_000) {
        $signals[] = [
            'level' => 'critical',
            'code' => 'posts_high',
            'message' => 'Sehr viele Beiträge (' . number_format($posts, 0, ',', '.') . ').',
        ];
        $score -= 20;
    } elseif ($posts >= 25_000) {
        $signals[] = [
            'level' => 'warn',
            'code' => 'posts_growing',
            'message' => 'Beitragszahl steigt (' . number_format($posts, 0, ',', '.') . ').',
        ];
        $score -= 8;
    }

    if ($latencyMs >= 4000) {
        $signals[] = [
            'level' => 'critical',
            'code' => 'latency_high',
            'message' => 'DB/Health-Latenz hoch (' . $latencyMs . ' ms).',
        ];
        $score -= 25;
    } elseif ($latencyMs >= 1500) {
        $signals[] = [
            'level' => 'warn',
            'code' => 'latency_elevated',
            'message' => 'DB/Health-Latenz erhöht (' . $latencyMs . ' ms).',
        ];
        $score -= 10;
    }

    if ($freeBytes !== null && $freeBytes < 524_288_000) {
        $signals[] = [
            'level' => 'critical',
            'code' => 'disk_low',
            'message' => 'Wenig freier Speicher (' . hybrixon_hosting_format_bytes($freeBytes) . ').',
        ];
        $score -= 30;
    } elseif ($freeBytes !== null && $freeBytes < 2_147_483_648) {
        $signals[] = [
            'level' => 'warn',
            'code' => 'disk_tight',
            'message' => 'Freier Speicher wird knapper (' . hybrixon_hosting_format_bytes($freeBytes) . ').',
        ];
        $score -= 10;
    }

    $score = max(0, min(100, $score));
    $hasCritical = false;
    $hasWarn = false;
    foreach ($signals as $s) {
        if ($s['level'] === 'critical') {
            $hasCritical = true;
        }
        if ($s['level'] === 'warn') {
            $hasWarn = true;
        }
    }

    if ($hasCritical || $score < 55) {
        $verdict = 'migrate';
        $recommendation = 'ALL-INKL Shared Hosting wirkt überlastet oder an Grenzen. VPS/Cloud + eigene DB planen.';
    } elseif ($hasWarn || $score < 80) {
        $verdict = 'watch';
        $recommendation = 'ALL-INKL ist noch sinnvoll, aber Wachstum beobachten (DB, Uploads, Latenz).';
    } else {
        $verdict = 'ok';
        $recommendation = 'ALL-INKL bleibt für den aktuellen Stand sinnvoll. Kein Wechsel nötig.';
    }

    $metrics = [
        'users' => $users,
        'posts' => $posts,
        'latencyMs' => $latencyMs,
    ];
    if ($detailed) {
        $metrics['dbBytes'] = $dbBytes;
        $metrics['dbHuman'] = hybrixon_hosting_format_bytes($dbBytes);
        $metrics['uploadBytes'] = $uploadBytes;
        $metrics['uploadHuman'] = hybrixon_hosting_format_bytes($uploadBytes);
        $metrics['freeBytes'] = $freeBytes;
        $metrics['freeHuman'] = $freeBytes === null ? null : hybrixon_hosting_format_bytes($freeBytes);
    } else {
        // Coarse public buckets — no exact sizes
        $metrics['dbBucket'] = $dbBytes >= 1_073_741_824 ? 'xl' : ($dbBytes >= 200_000_000 ? 'l' : ($dbBytes >= 50_000_000 ? 'm' : 's'));
        $metrics['uploadBucket'] = $uploadBytes >= 10_737_418_240 ? 'xl' : ($uploadBytes >= 2_147_483_648 ? 'l' : ($uploadBytes >= 500_000_000 ? 'm' : 's'));
    }

    return [
        'provider' => 'all-inkl',
        'engine' => 'hybrixon-php85',
        'php' => PHP_VERSION,
        'phpMin' => HYBRIXON_MIN_PHP,
        'sqlite' => extension_loaded('pdo_sqlite'),
        'metrics' => $metrics,
        'signals' => $signals,
        'verdict' => $verdict,
        'score' => $score,
        'recommendation' => $recommendation,
        'checkedAt' => gmdate('c'),
    ];
}

/** Persist at most one sample per hour for trend history (admin). */
function hybrixon_hosting_record_sample(array $snapshot): void
{
    $file = ALLXION_DATA . '/hosting-monitor.json';
    $now = time();
    $history = [];
    if (is_file($file)) {
        $raw = file_get_contents($file);
        $decoded = is_string($raw) ? json_decode($raw, true) : null;
        if (is_array($decoded) && isset($decoded['samples']) && is_array($decoded['samples'])) {
            $history = $decoded['samples'];
        }
        $lastAt = (int)($decoded['lastRecordedAt'] ?? 0);
        if ($lastAt > 0 && ($now - $lastAt) < 3600) {
            return;
        }
    }

    $sample = [
        'at' => $snapshot['checkedAt'] ?? gmdate('c'),
        'verdict' => $snapshot['verdict'] ?? 'ok',
        'score' => (int)($snapshot['score'] ?? 0),
        'users' => (int)($snapshot['metrics']['users'] ?? 0),
        'posts' => (int)($snapshot['metrics']['posts'] ?? 0),
        'latencyMs' => (int)($snapshot['metrics']['latencyMs'] ?? 0),
        'dbBytes' => (int)($snapshot['metrics']['dbBytes'] ?? 0),
        'uploadBytes' => (int)($snapshot['metrics']['uploadBytes'] ?? 0),
        'signalCodes' => array_values(array_map(
            static fn(array $s): string => (string)$s['code'],
            $snapshot['signals'] ?? []
        )),
    ];
    $history[] = $sample;
    if (count($history) > 90) {
        $history = array_slice($history, -90);
    }

    if (!is_dir(ALLXION_DATA)) {
        mkdir(ALLXION_DATA, 0750, true);
    }
    file_put_contents(
        $file,
        json_encode([
            'lastRecordedAt' => $now,
            'samples' => $history,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT),
        LOCK_EX
    );
}

/** @return list<array<string, mixed>> */
function hybrixon_hosting_history(): array
{
    $file = ALLXION_DATA . '/hosting-monitor.json';
    if (!is_file($file)) {
        return [];
    }
    $raw = file_get_contents($file);
    $decoded = is_string($raw) ? json_decode($raw, true) : null;
    if (!is_array($decoded) || !isset($decoded['samples']) || !is_array($decoded['samples'])) {
        return [];
    }
    return array_values($decoded['samples']);
}
