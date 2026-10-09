<?php
declare(strict_types=1);

const CREW_TOKEN_TTL_SECONDS = 86400;
const CREW_EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED';
const CREW_DUMMY_PASSWORD_HASH = '$2y$10$MSXlaGXuveWS0Ym142xiOu8tPbRWU/DenRNS9ELQaq5kfyeYnvlNi';

function crew_config(): array
{
    $defaults = [
        'sqlite_path' => getenv('CREW_SQLITE_PATH') ?: dirname(__DIR__, 2) . '/data/crew-auth.sqlite',
        'log_path' => getenv('CREW_LOG_PATH') ?: dirname(__DIR__, 2) . '/data/crew-auth.log',
        'mysql' => [
            'host' => getenv('CREW_DB_HOST') ?: '',
            'port' => getenv('CREW_DB_PORT') ?: '3306',
            'name' => getenv('CREW_DB_NAME') ?: '',
            'user' => getenv('CREW_DB_USER') ?: '',
            'pass' => getenv('CREW_DB_PASS') ?: '',
        ],
        'smtp' => [
            'host' => getenv('SMTP_HOST') ?: '',
            'port' => getenv('SMTP_PORT') ?: '587',
            'user' => getenv('SMTP_USER') ?: '',
            'pass' => getenv('SMTP_PASSWORD') ?: (getenv('SMTP_PASS') ?: ''),
            'from' => getenv('SMTP_FROM') ?: '',
            'secure' => getenv('SMTP_SECURE') ?: '',
        ],
        'mail_from' => getenv('CREW_MAIL_FROM') ?: '',
        'expose_confirmation_url' => getenv('CREW_AUTH_DEV') === '1',
    ];

    $local = __DIR__ . '/config.local.php';
    if (is_file($local)) {
        $extra = require $local;
        if (is_array($extra)) {
            $defaults = array_replace_recursive($defaults, $extra);
        }
    }

    return $defaults;
}

function crew_json(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function crew_log(string $line): void
{
    $config = crew_config();
    $path = $config['log_path'];
    $dir = dirname($path);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    $safe = str_replace(["\r", "\n"], ' ', $line);
    @file_put_contents($path, '[' . gmdate('c') . '] ' . $safe . "\n", FILE_APPEND | LOCK_EX);
    if (is_file($path)) {
        @chmod($path, 0600);
    }
}

function crew_read_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function crew_origin(): string
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    if (!preg_match('/^[A-Za-z0-9.-]+(?::\d+)?$/', $host)) {
        $host = 'localhost';
    }
    return ($https ? 'https' : 'http') . '://' . $host;
}

function crew_assert_same_origin(): void
{
    $host = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {
        $originHost = strtolower((string) parse_url($origin, PHP_URL_HOST));
        if ($originHost === '' || $originHost !== $host) {
            crew_json(['error' => 'Die Anfrage kommt nicht von dieser Website.'], 403);
        }
        return;
    }
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    if ($referer !== '') {
        $refererHost = strtolower((string) parse_url($referer, PHP_URL_HOST));
        if ($refererHost === '' || $refererHost !== $host) {
            crew_json(['error' => 'Die Anfrage kommt nicht von dieser Website.'], 403);
        }
    }
}

function crew_pdo(array $config): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $mysql = $config['mysql'];
    $mysqlReady = ($mysql['host'] ?? '') !== '' && ($mysql['name'] ?? '') !== '' && ($mysql['user'] ?? '') !== '';
    if ($mysqlReady) {
        if (!extension_loaded('pdo_mysql')) {
            throw new RuntimeException('MySQL ist konfiguriert, aber die Erweiterung pdo_mysql fehlt auf diesem Host.');
        }
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $mysql['host'],
            (int) ($mysql['port'] ?: 3306),
            $mysql['name']
        );
        $pdo = new PDO($dsn, (string) $mysql['user'], (string) $mysql['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        crew_migrate($pdo);
        return $pdo;
    }

    if (!extension_loaded('pdo_sqlite')) {
        throw new RuntimeException(
            'Keine Datenbank erreichbar: Für MySQL fehlen die Zugangsdaten in der Umgebungsdatei, und SQLite (pdo_sqlite) ist auf diesem Host nicht vorhanden.'
        );
    }

    $path = (string) $config['sqlite_path'];
    $dir = dirname($path);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        throw new RuntimeException('Das Datenverzeichnis für die Anmeldung ist nicht beschreibbar.');
    }
    $pdo = new PDO('sqlite:' . $path, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA busy_timeout = 5000');
    crew_migrate($pdo);
    @chmod($path, 0600);
    return $pdo;
}

function crew_migrate(PDO $pdo): void
{
    $driver = (string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    if ($driver === 'mysql') {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS crew_users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(64) NOT NULL,
                email VARCHAR(320) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email_verified TINYINT(1) NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL,
                last_signed_in DATETIME NULL,
                UNIQUE KEY crew_users_email_unique (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
        );
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS crew_email_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token_hash CHAR(64) NOT NULL,
                expires_at DATETIME NOT NULL,
                used_at DATETIME NULL,
                created_at DATETIME NOT NULL,
                UNIQUE KEY crew_email_tokens_hash_unique (token_hash),
                KEY crew_email_tokens_user_idx (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
        );
        return;
    }

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS crew_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            email_verified INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            last_signed_in TEXT
        )'
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS crew_email_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            used_at TEXT,
            created_at TEXT NOT NULL
        )'
    );
}

function crew_normalize_email(string $email): string
{
    return strtolower(trim($email));
}

function crew_valid_email(string $email): bool
{
    if ($email === '' || strlen($email) > 320 || preg_match('/[\r\n]/', $email)) {
        return false;
    }
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function crew_public_user(array $user): array
{
    return [
        'id' => (int) $user['id'],
        'name' => (string) $user['name'],
        'email' => (string) $user['email'],
    ];
}

function crew_find_user_by_email(PDO $pdo, string $email): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM crew_users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    return $row === false ? null : $row;
}

function crew_find_user_by_id(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM crew_users WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row === false ? null : $row;
}

function crew_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    session_name('nb_crew');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function crew_current_user(PDO $pdo): ?array
{
    crew_session_start();
    $id = $_SESSION['crew_user_id'] ?? null;
    if (!is_int($id) && !(is_string($id) && ctype_digit($id))) {
        return null;
    }
    return crew_find_user_by_id($pdo, (int) $id);
}

function crew_token_raw(): string
{
    return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
}

function crew_store_token(PDO $pdo, int $userId, string $tokenHash, string $expiresAt): void
{
    $now = gmdate('Y-m-d H:i:s');
    $pdo->beginTransaction();
    try {
        $clear = $pdo->prepare(
            'UPDATE crew_email_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL'
        );
        $clear->execute([$now, $userId]);
        $insert = $pdo->prepare(
            'INSERT INTO crew_email_tokens (user_id, token_hash, expires_at, used_at, created_at) VALUES (?, ?, ?, NULL, ?)'
        );
        $insert->execute([$userId, $tokenHash, $expiresAt, $now]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function crew_consume_token(PDO $pdo, string $tokenHash): string
{
    $now = gmdate('Y-m-d H:i:s');
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT * FROM crew_email_tokens WHERE token_hash = ? LIMIT 1');
        $stmt->execute([$tokenHash]);
        $row = $stmt->fetch();
        if ($row === false) {
            $pdo->commit();
            return 'invalid';
        }

        $owner = crew_find_user_by_id($pdo, (int) $row['user_id']);
        if (!empty($row['used_at'])) {
            $pdo->commit();
            return $owner && (int) $owner['email_verified'] === 1 ? 'already' : 'invalid';
        }

        if (strtotime((string) $row['expires_at'] . ' UTC') === false || strtotime((string) $row['expires_at'] . ' UTC') <= time()) {
            $pdo->commit();
            return 'invalid';
        }

        $update = $pdo->prepare(
            'UPDATE crew_email_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL'
        );
        $update->execute([$now, $row['id']]);
        if ($update->rowCount() < 1) {
            $owner = crew_find_user_by_id($pdo, (int) $row['user_id']);
            $pdo->commit();
            return $owner && (int) $owner['email_verified'] === 1 ? 'already' : 'invalid';
        }

        $verify = $pdo->prepare('UPDATE crew_users SET email_verified = 1 WHERE id = ?');
        $verify->execute([(int) $row['user_id']]);
        $pdo->commit();
        return 'confirmed';
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function crew_mail_from(array $config): string
{
    $from = trim((string) ($config['smtp']['from'] ?: $config['mail_from']));
    if ($from !== '' && crew_valid_email($from)) {
        return $from;
    }
    $host = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
    if ($host !== '' && $host !== 'localhost' && $host !== '127.0.0.1' && str_contains($host, '.')) {
        $candidate = 'noreply@' . $host;
        if (crew_valid_email($candidate)) {
            return $candidate;
        }
    }
    return '';
}

function crew_smtp_configured(array $config): bool
{
    return ($config['smtp']['host'] ?? '') !== '' && ($config['smtp']['from'] ?? '') !== '';
}

function crew_smtp_read($stream): string
{
    $data = '';
    while (($line = fgets($stream, 515)) !== false) {
        $data .= $line;
        if (isset($line[3]) && $line[3] === ' ') {
            break;
        }
    }
    return $data;
}

function crew_smtp_cmd($stream, string $command): string
{
    fwrite($stream, $command . "\r\n");
    return crew_smtp_read($stream);
}

function crew_smtp_ok(string $response, string ...$prefixes): bool
{
    foreach ($prefixes as $prefix) {
        if (str_starts_with($response, $prefix)) {
            return true;
        }
    }
    return false;
}

function crew_smtp_send(array $smtp, string $to, string $subject, string $body): bool
{
    $host = (string) $smtp['host'];
    $port = (int) ($smtp['port'] ?: 587);
    $secure = strtolower((string) ($smtp['secure'] ?? ''));
    $useSsl = $secure === 'true' || $secure === 'ssl' || $port === 465;
    $remote = ($useSsl ? 'ssl://' : 'tcp://') . $host . ':' . $port;
    $errno = 0;
    $errstr = '';
    $stream = @stream_socket_client($remote, $errno, $errstr, 15, STREAM_CLIENT_CONNECT);
    if ($stream === false) {
        return false;
    }
    stream_set_timeout($stream, 15);
    try {
        if (!crew_smtp_ok(crew_smtp_read($stream), '2')) {
            return false;
        }
        $ehlo = preg_replace('/[^A-Za-z0-9.-]/', '', (string) gethostname()) ?: 'localhost';
        if (!crew_smtp_ok(crew_smtp_cmd($stream, 'EHLO ' . $ehlo), '250')) {
            return false;
        }
        if (!$useSsl && ($secure === 'true' || $secure === 'starttls' || $port === 587)) {
            if (!crew_smtp_ok(crew_smtp_cmd($stream, 'STARTTLS'), '220')) {
                return false;
            }
            if (!stream_socket_enable_crypto($stream, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                return false;
            }
            if (!crew_smtp_ok(crew_smtp_cmd($stream, 'EHLO ' . $ehlo), '250')) {
                return false;
            }
        }
        if (($smtp['user'] ?? '') !== '') {
            if (!crew_smtp_ok(crew_smtp_cmd($stream, 'AUTH LOGIN'), '334')) {
                return false;
            }
            if (!crew_smtp_ok(crew_smtp_cmd($stream, base64_encode((string) $smtp['user'])), '334')) {
                return false;
            }
            if (!crew_smtp_ok(crew_smtp_cmd($stream, base64_encode((string) $smtp['pass'])), '235')) {
                return false;
            }
        }
        $from = (string) $smtp['from'];
        if (!crew_smtp_ok(crew_smtp_cmd($stream, 'MAIL FROM:<' . $from . '>'), '250')) {
            return false;
        }
        if (!crew_smtp_ok(crew_smtp_cmd($stream, 'RCPT TO:<' . $to . '>'), '250', '251')) {
            return false;
        }
        if (!crew_smtp_ok(crew_smtp_cmd($stream, 'DATA'), '354')) {
            return false;
        }
        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $message = 'From: ' . $from . "\r\n"
            . 'To: ' . $to . "\r\n"
            . 'Subject: ' . $encodedSubject . "\r\n"
            . "MIME-Version: 1.0\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n\r\n"
            . str_replace("\n.", "\n..", $body) . "\r\n.";
        fwrite($stream, $message . "\r\n");
        if (!crew_smtp_ok(crew_smtp_read($stream), '250')) {
            return false;
        }
        crew_smtp_cmd($stream, 'QUIT');
        return true;
    } finally {
        fclose($stream);
    }
}

function crew_php_mail(string $from, string $to, string $confirmUrl): bool
{
    $subject = 'Bestätige deine E-Mail – NachtBlau Crew';
    $body = "Hallo,\n\n"
        . "bitte bestätige deine E-Mail-Adresse für die NachtBlau Crew.\n"
        . "Öffne dazu diesen Link:\n"
        . $confirmUrl . "\n\n"
        . "Der Link ist 24 Stunden gültig und kann nur einmal verwendet werden.\n"
        . "Dein Konto ist erst danach freigeschaltet.\n\n"
        . "Wenn du dich nicht registriert hast, kannst du diese Nachricht ignorieren.\n";
    $headers = 'From: ' . $from . "\r\n"
        . "MIME-Version: 1.0\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n";
    return @mail($to, $subject, $body, $headers, '-f ' . $from);
}

function crew_deliver(PDO $pdo, array $user, array $config): array
{
    $raw = crew_token_raw();
    $hash = hash('sha256', $raw);
    $expiresAt = gmdate('Y-m-d H:i:s', time() + CREW_TOKEN_TTL_SECONDS);
    crew_store_token($pdo, (int) $user['id'], $hash, $expiresAt);
    $confirmUrl = crew_origin() . '/email-bestaetigen?token=' . rawurlencode($raw);

    $emailSent = false;
    $smtpConfigured = crew_smtp_configured($config);
    if ($smtpConfigured) {
        try {
            $emailSent = crew_smtp_send($config['smtp'], (string) $user['email'], 'Bestätige deine E-Mail – NachtBlau Crew', implode("\n", [
                'Hallo,',
                '',
                'bitte bestätige deine E-Mail-Adresse für die NachtBlau Crew.',
                'Öffne dazu diesen Link:',
                $confirmUrl,
                '',
                'Der Link ist 24 Stunden gültig und kann nur einmal verwendet werden.',
                'Dein Konto ist erst danach freigeschaltet.',
                '',
                'Wenn du dich nicht registriert hast, kannst du diese Nachricht ignorieren.',
            ]));
        } catch (Throwable $error) {
            crew_log('SMTP-Versand fehlgeschlagen für ' . $user['email']);
            $emailSent = false;
        }
    }

    if (!$emailSent) {
        $from = crew_mail_from($config);
        if ($from !== '') {
            $emailSent = crew_php_mail($from, (string) $user['email'], $confirmUrl);
        }
    }

    if (!$smtpConfigured || !$emailSent) {
        $note = $emailSent
            ? 'mail() hat die Nachricht angenommen, SMTP ist nicht konfiguriert'
            : 'keine E-Mail verschickt';
        crew_log('Bestätigungslink für ' . $user['email'] . ' (' . $note . '): ' . $confirmUrl);
    }

    return [
        'pendingConfirmation' => true,
        'emailSent' => $emailSent,
        'devConfirmationUrl' => (!$emailSent && !empty($config['expose_confirmation_url'])) ? $confirmUrl : null,
    ];
}
