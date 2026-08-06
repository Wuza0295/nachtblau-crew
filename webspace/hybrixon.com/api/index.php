<?php
declare(strict_types=1);

/**
 * Hybrixon JSON API — session-cookie auth for the Vite SPA.
 * ALL-INKL compatible: pure PHP, no Node runtime required.
 */

require_once dirname(__DIR__) . '/includes/posts.php';
require_once dirname(__DIR__) . '/includes/moderation.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

hybrixon_enforce_canonical_host();

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$path = (string)(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/');
// Normalize when API lives at /api or /api/
if (preg_match('#/api(?:/index\.php)?(?:/(.*))?$#', $path, $m)) {
    $route = trim((string)($m[1] ?? ''), '/');
} else {
    $route = trim($path, '/');
}

function api_json(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function api_error(string $message, int $status = 400, array $extra = []): never
{
    api_json(array_merge(['ok' => false, 'error' => $message], $extra), $status);
}

function api_read_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function api_public_user(?array $user): ?array
{
    if (!$user) {
        return null;
    }
    return [
        'id' => (int)$user['id'],
        'username' => (string)$user['username'],
        'isAdmin' => user_is_admin($user),
        'isAdult' => user_is_adult($user),
        'ageVerified' => user_age_verified($user),
        'agePending' => user_age_pending($user),
        'createdAt' => (string)($user['created_at'] ?? ''),
    ];
}

function api_public_post(array $post, ?array $viewer = null): array
{
    $id = (int)$post['id'];
    $hasImage = !empty($post['image_path']);
    $pending = (($post['moderation_status'] ?? '') === 'flagged');
    $canImage = $hasImage && allxion_can_view_post_image($post, $viewer);
    return [
        'id' => $id,
        'username' => (string)$post['username'],
        'body' => (string)($post['body'] ?? ''),
        'isAdult' => !empty($post['is_adult']),
        'likeCount' => (int)($post['like_count'] ?? 0),
        'createdAt' => (string)($post['created_at'] ?? ''),
        'imageUrl' => $canImage ? allxion_url('media.php?id=' . $id) : null,
        'pendingReview' => $pending,
    ];
}

function api_require_csrf(): void
{
    allxion_session_start();
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['_csrf'] ?? '');
    if (!is_string($token) || !hash_equals($_SESSION['_csrf'] ?? '', $token)) {
        api_error('Ungültiges CSRF-Token.', 403);
    }
}

try {
    match (true) {
        $route === 'health' && $method === 'GET' => api_json([
            'ok' => true,
            'engine' => 'hybrixon-php85',
            'php' => PHP_VERSION,
            'phpMin' => HYBRIXON_MIN_PHP,
            'sqlite' => extension_loaded('pdo_sqlite'),
        ]),

        $route === 'csrf' && $method === 'GET' => api_json([
            'ok' => true,
            'csrf' => csrf_token(),
        ]),

        $route === 'me' && $method === 'GET' => api_json([
            'ok' => true,
            'user' => api_public_user(allxion_current_user()),
            'csrf' => csrf_token(),
            'brand' => [
                'name' => ALLXION_NAME,
                'tagline' => ALLXION_TAGLINE,
            ],
        ]),

        $route === 'login' && $method === 'POST' => (function () {
            api_require_csrf();
            $body = api_read_json();
            $login = trim((string)($body['login'] ?? ''));
            $password = (string)($body['password'] ?? '');
            if ($login === '' || $password === '') {
                api_error('Login und Passwort erforderlich.');
            }
            $result = allxion_login($login, $password);
            if ($result === true) {
                api_json(['ok' => true, 'user' => api_public_user(allxion_current_user())]);
            }
            if (is_string($result)) {
                api_error($result, 403);
            }
            api_error('Login fehlgeschlagen.', 401);
        })(),

        $route === 'logout' && $method === 'POST' => (function () {
            api_require_csrf();
            allxion_logout();
            api_json(['ok' => true]);
        })(),

        $route === 'register' && $method === 'POST' => (function () {
            api_require_csrf();
            $body = api_read_json();
            $legal = !empty($body['legalOk']);
            $errors = allxion_register(
                (string)($body['username'] ?? ''),
                (string)($body['email'] ?? ''),
                (string)($body['password'] ?? ''),
                (string)($body['birthdate'] ?? ''),
                $legal,
                $legal
            );
            if ($errors) {
                api_error($errors[0], 400, ['errors' => $errors]);
            }
            api_json(['ok' => true, 'user' => api_public_user(allxion_current_user())]);
        })(),

        $route === 'feed' && $method === 'GET' => (function () {
            $user = allxion_current_user();
            $canAdult = $user && user_age_verified($user);
            $showAdult = $canAdult && (($_GET['adult'] ?? '1') !== '0');
            $posts = allxion_feed($user, $showAdult);
            api_json([
                'ok' => true,
                'posts' => array_map(static fn(array $p) => api_public_post($p, $user), $posts),
                'canSeeAdult' => (bool)$canAdult,
            ]);
        })(),

        $route === 'posts' && $method === 'POST' => (function () {
            api_require_csrf();
            $user = allxion_current_user();
            if (!$user) {
                api_error('Nicht angemeldet.', 401);
            }
            $isAdult = !empty($_POST['isAdult']) || !empty($_POST['is_adult']);
            $policyOk = !empty($_POST['policyOk']) || !empty($_POST['policy_ok']);
            $body = (string)($_POST['body'] ?? '');
            $image = isset($_FILES['image']) && is_array($_FILES['image']) ? $_FILES['image'] : null;
            $result = allxion_create_post((int)$user['id'], $body, $isAdult, $policyOk, $image);
            if ($result['errors']) {
                api_error($result['errors'][0], 400, ['errors' => $result['errors']]);
            }
            api_json([
                'ok' => true,
                'pendingReview' => !empty($result['pending_review']),
                'postId' => (int)($result['post_id'] ?? 0),
            ]);
        })(),

        preg_match('#^posts/(\d+)/like$#', $route, $lm) === 1 && $method === 'POST' => (function () use ($lm) {
            api_require_csrf();
            $user = allxion_current_user();
            if (!$user) {
                api_error('Nicht angemeldet.', 401);
            }
            allxion_toggle_like((int)$user['id'], (int)$lm[1]);
            api_json(['ok' => true]);
        })(),

        preg_match('#^posts/(\d+)/report$#', $route, $rm) === 1 && $method === 'POST' => (function () use ($rm) {
            api_require_csrf();
            $user = allxion_current_user();
            if (!$user) {
                api_error('Nicht angemeldet.', 401);
            }
            $body = api_read_json();
            $reason = (string)($body['reason'] ?? $_POST['reason'] ?? '');
            $errors = content_user_report_post($user, (int)$rm[1], $reason);
            if ($errors) {
                api_error($errors[0], 400, ['errors' => $errors]);
            }
            api_json(['ok' => true]);
        })(),

        $route === 'age/status' && $method === 'GET' => (function () {
            require_once dirname(__DIR__) . '/includes/yoti.php';
            $user = allxion_current_user();
            api_json([
                'ok' => true,
                'yotiEnabled' => yoti_is_enabled(),
                'yotiStatus' => yoti_status_label(),
                'user' => api_public_user($user),
            ]);
        })(),

        default => api_error('Not found', 404, ['route' => $route, 'method' => $method]),
    };
} catch (Throwable $e) {
    api_error('Serverfehler: ' . $e->getMessage(), 500);
}
