<?php
declare(strict_types=1);

/**
 * Hybrixon JSON API — session-cookie auth for the Vite SPA.
 * ALL-INKL compatible: pure PHP, no Node runtime required.
 */

require_once dirname(__DIR__) . '/includes/posts.php';
require_once dirname(__DIR__) . '/includes/moderation.php';
require_once dirname(__DIR__) . '/includes/profile.php';
require_once dirname(__DIR__) . '/includes/dm.php';
require_once dirname(__DIR__) . '/includes/hosting_monitor.php';

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
    $id = (int)$user['id'];
    return [
        'id' => $id,
        'username' => (string)$user['username'],
        'displayName' => user_display_name($user),
        'isAdmin' => user_is_admin($user),
        'isAdult' => user_is_adult($user),
        'ageVerified' => user_age_verified($user),
        'agePending' => user_age_pending($user),
        'isBrand' => user_is_brand($user),
        'avatarUrl' => profile_media_url($user['avatar_path'] ?? null, 'avatar', $id),
        'createdAt' => (string)($user['created_at'] ?? ''),
    ];
}

function api_public_post(array $post, ?array $viewer = null): array
{
    $id = (int)$post['id'];
    $hasImage = !empty($post['image_path']);
    $pending = (($post['moderation_status'] ?? '') === 'flagged');
    $canImage = $hasImage && allxion_can_view_post_image($post, $viewer);
    $display = trim((string)($post['display_name'] ?? ''));
    $authorId = (int)($post['user_id'] ?? 0);
    return [
        'id' => $id,
        'username' => (string)$post['username'],
        'displayName' => $display !== '' ? $display : (string)$post['username'],
        'avatarUrl' => profile_media_url($post['avatar_path'] ?? null, 'avatar', $authorId),
        'body' => (string)($post['body'] ?? ''),
        'isAdult' => !empty($post['is_adult']),
        'likeCount' => (int)($post['like_count'] ?? 0),
        'createdAt' => (string)($post['created_at'] ?? ''),
        'imageUrl' => $canImage ? allxion_url('media.php?id=' . $id) : null,
        'pendingReview' => $pending,
        'isBrand' => (($post['account_kind'] ?? '') === 'brand'),
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
        $route === 'health' && $method === 'GET' => (function () {
            // Avoid recursive upload scans on every public health hit
            $detailed = hybrixon_hosting_snapshot(true, false);
            try {
                hybrixon_hosting_record_sample($detailed);
            } catch (Throwable) {
                // never fail health because of history write
            }
            $publicMetrics = [
                'users' => $detailed['metrics']['users'] ?? 0,
                'posts' => $detailed['metrics']['posts'] ?? 0,
                'latencyMs' => $detailed['metrics']['latencyMs'] ?? 0,
                'dbBucket' => (($detailed['metrics']['dbBytes'] ?? 0) >= 1_073_741_824) ? 'xl'
                    : ((($detailed['metrics']['dbBytes'] ?? 0) >= 200_000_000) ? 'l'
                    : ((($detailed['metrics']['dbBytes'] ?? 0) >= 50_000_000) ? 'm' : 's')),
                'uploadBucket' => (($detailed['metrics']['uploadBytes'] ?? 0) >= 10_737_418_240) ? 'xl'
                    : ((($detailed['metrics']['uploadBytes'] ?? 0) >= 2_147_483_648) ? 'l'
                    : ((($detailed['metrics']['uploadBytes'] ?? 0) >= 500_000_000) ? 'm' : 's')),
            ];
            api_json([
                'ok' => true,
                'engine' => $detailed['engine'],
                'php' => $detailed['php'],
                'phpMin' => $detailed['phpMin'],
                'sqlite' => $detailed['sqlite'],
                'hosting' => [
                    'provider' => $detailed['provider'],
                    'verdict' => $detailed['verdict'],
                    'score' => $detailed['score'],
                    'recommendation' => $detailed['recommendation'],
                    'signals' => $detailed['signals'],
                    'metrics' => $publicMetrics,
                    'checkedAt' => $detailed['checkedAt'],
                ],
            ]);
        })(),

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
            $asUserId = (int)($_POST['asUserId'] ?? $_POST['as_user_id'] ?? 0);
            $result = allxion_create_post(
                (int)$user['id'],
                $body,
                $isAdult,
                $policyOk,
                $image,
                $user,
                $asUserId > 0 ? $asUserId : null
            );
            if ($result['errors']) {
                api_error($result['errors'][0], 400, ['errors' => $result['errors']]);
            }
            api_json([
                'ok' => true,
                'pendingReview' => !empty($result['pending_review']),
                'postId' => (int)($result['post_id'] ?? 0),
            ]);
        })(),

        $route === 'brands' && $method === 'GET' => (function () {
            $user = allxion_current_user();
            if (!$user || !user_is_admin($user)) {
                api_error('Nur Admins.', 403);
            }
            $accounts = array_map(static function (array $a): array {
                return [
                    'id' => (int)$a['id'],
                    'username' => (string)$a['username'],
                    'displayName' => user_display_name($a),
                    'avatarUrl' => profile_media_url($a['avatar_path'] ?? null, 'avatar', (int)$a['id']),
                ];
            }, profile_admin_postable_accounts());
            api_json(['ok' => true, 'accounts' => $accounts]);
        })(),

        preg_match('#^profile/([a-zA-Z0-9_]{3,24})$#', $route, $pm) === 1 && $method === 'GET' => (function () use ($pm) {
            $profile = profile_find_by_username($pm[1]);
            if (!$profile) {
                api_error('Profil nicht gefunden.', 404);
            }
            $viewer = allxion_current_user();
            api_json([
                'ok' => true,
                'profile' => profile_public_payload($profile, $viewer),
            ]);
        })(),

        $route === 'profile' && $method === 'POST' => (function () {
            api_require_csrf();
            $user = allxion_current_user();
            if (!$user) {
                api_error('Nicht angemeldet.', 401);
            }
            $targetId = (int)($_POST['userId'] ?? $_POST['user_id'] ?? $user['id']);
            $errors = profile_update(
                $user,
                $targetId,
                $_POST,
                isset($_FILES['avatar']) && is_array($_FILES['avatar']) ? $_FILES['avatar'] : null,
                isset($_FILES['banner']) && is_array($_FILES['banner']) ? $_FILES['banner'] : null
            );
            if ($errors) {
                api_error($errors[0], 400, ['errors' => $errors]);
            }
            $fresh = profile_find_by_id($targetId);
            api_json([
                'ok' => true,
                'profile' => $fresh ? profile_public_payload($fresh, $user) : null,
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

        $route === 'dm/open' && $method === 'POST' => (function () {
            api_require_csrf();
            $user = allxion_current_user();
            if (!$user) {
                api_error('Nicht angemeldet.', 401);
            }
            $body = api_read_json();
            $username = trim((string)($body['username'] ?? ''));
            if ($username === '') {
                api_error('Benutzername fehlt.');
            }
            $open = dm_open_with_username($user, $username);
            if (!$open['ok']) {
                api_error($open['error'], 400);
            }
            api_json([
                'ok' => true,
                'url' => $open['url'],
                'threadId' => $open['threadId'],
            ]);
        })(),

        default => api_error('Not found', 404, ['route' => $route, 'method' => $method]),
    };
} catch (Throwable $e) {
    api_error('Serverfehler: ' . $e->getMessage(), 500);
}
