<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

/**
 * Web Push (VAPID) helpers for browser + Android WebView where supported.
 */

function hybrixon_push_autoload(): bool
{
    static $ok = null;
    if ($ok !== null) {
        return $ok;
    }
    $autoload = dirname(__DIR__) . '/vendor/autoload.php';
    if (!is_file($autoload)) {
        $ok = false;
        return false;
    }
    require_once $autoload;
    $ok = class_exists(\Minishlink\WebPush\WebPush::class);
    return $ok;
}

/** @return array{publicKey: string, privateKey: string}|null */
function hybrixon_vapid_keys(): ?array
{
    $path = ALLXION_DATA . '/vapid.json';
    if (is_file($path)) {
        $raw = file_get_contents($path);
        $data = is_string($raw) ? json_decode($raw, true) : null;
        if (
            is_array($data)
            && !empty($data['publicKey'])
            && !empty($data['privateKey'])
        ) {
            return [
                'publicKey' => (string)$data['publicKey'],
                'privateKey' => (string)$data['privateKey'],
            ];
        }
    }
    if (!hybrixon_push_autoload()) {
        return null;
    }
    try {
        $keys = \Minishlink\WebPush\VAPID::createVapidKeys();
    } catch (Throwable $e) {
        return null;
    }
    if (!is_dir(ALLXION_DATA)) {
        @mkdir(ALLXION_DATA, 0750, true);
    }
    file_put_contents(
        $path,
        json_encode($keys, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT),
        LOCK_EX
    );
    @chmod($path, 0640);
    return [
        'publicKey' => (string)$keys['publicKey'],
        'privateKey' => (string)$keys['privateKey'],
    ];
}

function hybrixon_vapid_public_key(): ?string
{
    $keys = hybrixon_vapid_keys();
    return $keys['publicKey'] ?? null;
}

function hybrixon_push_subscribe(int $userId, array $subscription, string $userAgent = ''): bool
{
    $endpoint = trim((string)($subscription['endpoint'] ?? ''));
    $p256dh = trim((string)($subscription['keys']['p256dh'] ?? ''));
    $auth = trim((string)($subscription['keys']['auth'] ?? ''));
    if ($userId <= 0 || $endpoint === '' || $p256dh === '' || $auth === '') {
        return false;
    }
    if (strlen($endpoint) > 2000 || strlen($p256dh) > 255 || strlen($auth) > 255) {
        return false;
    }
    $pdo = allxion_db();
    $pdo->prepare(
        'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime(\'now\'))
         ON CONFLICT(endpoint) DO UPDATE SET
           user_id = excluded.user_id,
           p256dh = excluded.p256dh,
           auth = excluded.auth,
           user_agent = excluded.user_agent,
           updated_at = datetime(\'now\')'
    )->execute([$userId, $endpoint, $p256dh, $auth, mb_substr($userAgent, 0, 240)]);
    return true;
}

function hybrixon_push_unsubscribe(int $userId, string $endpoint): void
{
    if ($userId <= 0 || $endpoint === '') {
        return;
    }
    allxion_db()->prepare(
        'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?'
    )->execute([$userId, $endpoint]);
}

/**
 * Send a web-push notification to all subscriptions of a user.
 */
function hybrixon_push_notify_user(int $userId, string $title, string $body, string $url = '/notifications.php'): void
{
    if ($userId <= 0 || !hybrixon_push_autoload()) {
        return;
    }
    $keys = hybrixon_vapid_keys();
    if ($keys === null) {
        return;
    }

    $userStmt = allxion_db()->prepare(
        'SELECT push_notify_enabled, banned_at FROM users WHERE id = ?'
    );
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch();
    if (!$user || !empty($user['banned_at']) || (int)($user['push_notify_enabled'] ?? 1) !== 1) {
        return;
    }

    $subs = allxion_db()->prepare(
        'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?'
    );
    $subs->execute([$userId]);
    $rows = $subs->fetchAll();
    if (!$rows) {
        return;
    }

    $payload = json_encode([
        'title' => $title,
        'body' => $body,
        'url' => $url,
        'icon' => '/assets/img/logo-avatar.png',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    try {
        $webPush = new \Minishlink\WebPush\WebPush([
            'VAPID' => [
                'subject' => 'mailto:support@hybrixon.com',
                'publicKey' => $keys['publicKey'],
                'privateKey' => $keys['privateKey'],
            ],
        ]);
        $webPush->setReuseVAPIDHeaders(true);
        $webPush->setAutomaticPadding(true);

        foreach ($rows as $row) {
            $subscription = \Minishlink\WebPush\Subscription::create([
                'endpoint' => (string)$row['endpoint'],
                'publicKey' => (string)$row['p256dh'],
                'authToken' => (string)$row['auth'],
            ]);
            $webPush->queueNotification($subscription, (string)$payload);
        }

        foreach ($webPush->flush() as $report) {
            if ($report->isSuccess()) {
                continue;
            }
            $endpoint = $report->getRequest()->getUri()->__toString();
            $code = $report->getResponse() ? $report->getResponse()->getStatusCode() : 0;
            // Gone / expired subscription
            if (in_array($code, [404, 410], true)) {
                allxion_db()->prepare(
                    'DELETE FROM push_subscriptions WHERE endpoint = ?'
                )->execute([$endpoint]);
            }
        }
    } catch (Throwable $e) {
        // Never break the main request path for push failures.
        error_log('hybrixon push: ' . $e->getMessage());
    }
}
