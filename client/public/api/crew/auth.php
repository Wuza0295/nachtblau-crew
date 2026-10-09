<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

function crew_database_error(Throwable $error): never
{
    crew_log('Datenbankfehler: ' . $error->getMessage());
    $message = 'Die Anmeldung ist gerade nicht möglich. Bitte versuche es später erneut.';
    if ($error instanceof RuntimeException) {
        $message = $error->getMessage();
    }
    crew_json(['error' => $message], 503);
}

try {
    $config = crew_config();
    $pdo = crew_pdo($config);
} catch (Throwable $error) {
    crew_database_error($error);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = isset($_GET['action']) ? (string) $_GET['action'] : '';
$body = [];
if ($method === 'POST') {
    crew_assert_same_origin();
    $body = crew_read_json();
    if ($action === '' && isset($body['action'])) {
        $action = (string) $body['action'];
    }
}

try {
    if ($method === 'GET' && $action === 'me') {
        $user = crew_current_user($pdo);
        crew_json(['user' => $user ? crew_public_user($user) : null]);
    }

    if ($method === 'POST' && $action === 'register') {
        $name = trim((string) ($body['name'] ?? ''));
        $email = crew_normalize_email((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $passwordConfirm = (string) ($body['passwordConfirm'] ?? '');

        if ($name === '') {
            crew_json(['error' => 'Bitte einen Namen eingeben.'], 400);
        }
        $nameLength = function_exists('mb_strlen') ? mb_strlen($name) : strlen($name);
        if ($nameLength < 2) {
            crew_json(['error' => 'Der Name muss mindestens 2 Zeichen lang sein.'], 400);
        }
        if ($nameLength > 64) {
            crew_json(['error' => 'Der Name darf höchstens 64 Zeichen lang sein.'], 400);
        }
        if (!crew_valid_email($email)) {
            crew_json(['error' => 'Bitte eine gültige E-Mail-Adresse eingeben.'], 400);
        }
        if ($password === '') {
            crew_json(['error' => 'Bitte ein Passwort eingeben.'], 400);
        }
        if (strlen($password) < 8) {
            crew_json(['error' => 'Das Passwort muss mindestens 8 Zeichen lang sein.'], 400);
        }
        if (strlen($password) > 128) {
            crew_json(['error' => 'Das Passwort darf höchstens 128 Zeichen lang sein.'], 400);
        }
        if ($passwordConfirm === '') {
            crew_json(['error' => 'Bitte das Passwort wiederholen.'], 400);
        }
        if (strlen($password) !== strlen($passwordConfirm) || !hash_equals($password, $passwordConfirm)) {
            crew_json(['error' => 'Die Passwörter stimmen nicht überein.'], 400);
        }

        $existing = crew_find_user_by_email($pdo, $email);
        if ($existing) {
            crew_json([
                'error' => 'Zu dieser E-Mail gibt es bereits ein Konto. Melde dich an oder fordere einen neuen Bestätigungslink an.',
            ], 409);
        }

        $now = gmdate('Y-m-d H:i:s');
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $insert = $pdo->prepare(
            'INSERT INTO crew_users (name, email, password_hash, email_verified, created_at, last_signed_in) VALUES (?, ?, ?, 0, ?, NULL)'
        );
        try {
            $insert->execute([$name, $email, $hash, $now]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                crew_json([
                    'error' => 'Zu dieser E-Mail gibt es bereits ein Konto. Melde dich an oder fordere einen neuen Bestätigungslink an.',
                ], 409);
            }
            throw $error;
        }
        $user = crew_find_user_by_email($pdo, $email);
        if (!$user) {
            throw new RuntimeException('Konto konnte nicht angelegt werden.');
        }
        crew_json(crew_deliver($pdo, $user, $config), 201);
    }

    if ($method === 'POST' && $action === 'login') {
        $email = crew_normalize_email((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        if (!crew_valid_email($email) || $password === '') {
            crew_json(['error' => 'E-Mail oder Passwort ist falsch.'], 401);
        }
        $user = crew_find_user_by_email($pdo, $email);
        $stored = $user['password_hash'] ?? CREW_DUMMY_PASSWORD_HASH;
        $passwordOk = password_verify($password, (string) $stored);
        if (!$user || !$passwordOk) {
            crew_json(['error' => 'E-Mail oder Passwort ist falsch.'], 401);
        }
        if ((int) $user['email_verified'] !== 1) {
            crew_json([
                'error' => 'Bitte bestätige zuerst deine E-Mail-Adresse. Dein Konto ist angelegt, aber noch nicht freigeschaltet.',
                'code' => CREW_EMAIL_NOT_VERIFIED,
            ], 403);
        }
        $pdo->prepare('UPDATE crew_users SET last_signed_in = ? WHERE id = ?')->execute([
            gmdate('Y-m-d H:i:s'),
            (int) $user['id'],
        ]);
        crew_session_start();
        session_regenerate_id(true);
        $_SESSION['crew_user_id'] = (int) $user['id'];
        crew_json(['user' => crew_public_user($user)]);
    }

    if ($method === 'POST' && $action === 'logout') {
        crew_session_start();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $params['path'] ?: '/',
                'domain' => $params['domain'] ?? '',
                'secure' => (bool) $params['secure'],
                'httponly' => (bool) $params['httponly'],
                'samesite' => $params['samesite'] ?? 'Lax',
            ]);
        }
        session_destroy();
        crew_json(['success' => true]);
    }

    if (($method === 'POST' || $method === 'GET') && $action === 'confirm') {
        if ($method === 'POST') {
            $token = trim((string) ($body['token'] ?? ''));
        } else {
            $token = trim((string) ($_GET['token'] ?? ''));
        }
        if ($token === '' || strlen($token) > 512) {
            crew_json(['error' => 'Der Bestätigungslink ist ungültig oder abgelaufen.'], 400);
        }
        $result = crew_consume_token($pdo, hash('sha256', $token));
        if ($result === 'invalid') {
            crew_json(['error' => 'Der Bestätigungslink ist ungültig oder abgelaufen.'], 400);
        }
        crew_json(['alreadyConfirmed' => $result === 'already']);
    }

    if ($method === 'POST' && $action === 'resend') {
        $email = crew_normalize_email((string) ($body['email'] ?? ''));
        $generic = [
            'pendingConfirmation' => true,
            'emailSent' => false,
            'devConfirmationUrl' => null,
        ];
        if (!crew_valid_email($email)) {
            crew_json($generic);
        }
        $user = crew_find_user_by_email($pdo, $email);
        if (!$user || (int) $user['email_verified'] === 1) {
            crew_json($generic);
        }
        crew_json(crew_deliver($pdo, $user, $config));
    }
} catch (Throwable $error) {
    crew_database_error($error);
}

crew_json(['error' => 'Diese Anfrage wird nicht unterstützt.'], 405);
