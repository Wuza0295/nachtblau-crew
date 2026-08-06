<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';

function yoti_config_path(): string
{
    return ALLXION_DATA . '/yoti.json';
}

function yoti_config(): array
{
    static $cfg = null;
    if (is_array($cfg)) {
        return $cfg;
    }
    $path = yoti_config_path();
    $defaults = [
        'enabled' => false,
        'sdk_id' => '',
        'api_key' => '',
        'age_threshold' => ALLXION_ADULT_AGE,
        'buffer_years' => 5,
        'api_base' => 'https://age.yoti.com/api/v1',
        'user_view_base' => 'https://age.yoti.com',
    ];
    if (!is_file($path)) {
        $cfg = $defaults;
        return $cfg;
    }
    $raw = json_decode((string)file_get_contents($path), true);
    if (!is_array($raw)) {
        $cfg = $defaults;
        return $cfg;
    }
    $cfg = array_merge($defaults, $raw);
    $cfg['enabled'] = !empty($cfg['enabled']);
    $cfg['sdk_id'] = trim((string)$cfg['sdk_id']);
    $cfg['api_key'] = trim((string)$cfg['api_key']);
    $cfg['age_threshold'] = (int)$cfg['age_threshold'];
    $cfg['buffer_years'] = max(0, (int)$cfg['buffer_years']);
    $cfg['api_base'] = rtrim((string)$cfg['api_base'], '/');
    $cfg['user_view_base'] = rtrim((string)$cfg['user_view_base'], '/');
    return $cfg;
}

function yoti_is_configured(): bool
{
    $c = yoti_config();
    return $c['sdk_id'] !== '' && $c['api_key'] !== '';
}

function yoti_is_enabled(): bool
{
    return yoti_config()['enabled'] && yoti_is_configured();
}

function yoti_status_label(): string
{
    if (yoti_is_enabled()) {
        return 'aktiv (Gesichtsprüfung)';
    }
    if (yoti_is_configured()) {
        return 'konfiguriert, aber deaktiviert';
    }
    return 'nicht konfiguriert (data/yoti.example.json → yoti.json)';
}

function yoti_http(string $method, string $url, ?array $payload = null): array
{
    $c = yoti_config();
    $ch = curl_init($url);
    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $c['api_key'],
        'Yoti-Sdk-Id: ' . $c['sdk_id'],
    ];
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 25,
        CURLOPT_CUSTOMREQUEST => strtoupper($method),
    ];
    if ($payload !== null) {
        $opts[CURLOPT_POSTFIELDS] = json_encode($payload, JSON_UNESCAPED_SLASHES);
    }
    curl_setopt_array($ch, $opts);
    $body = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $cerr = curl_error($ch);
    curl_close($ch);
    return [
        'ok' => $body !== false && $code >= 200 && $code < 300,
        'code' => $code,
        'body' => is_string($body) ? $body : '',
        'error' => $cerr,
        'data' => is_string($body) ? (json_decode($body, true) ?: null) : null,
    ];
}

/**
 * Create an OVER age-estimation session (facial AVS) and return redirect URL.
 *
 * @return array{ok: true, redirect: string, session_id: string}|array{ok: false, error: string, debug?: string}
 */
function yoti_create_age_session(array $user): array
{
    if (!yoti_is_enabled()) {
        return [
            'ok' => false,
            'error' => 'Gesichtsprüfung (Yoti) ist noch nicht aktiv. Bitte data/yoti.json einrichten.',
        ];
    }
    if (!function_exists('curl_init')) {
        return ['ok' => false, 'error' => 'cURL fehlt auf dem Server — Yoti kann nicht gestartet werden.'];
    }

    $c = yoti_config();
    // KJM-style buffer: facial estimation threshold above legal adult age.
    $faceThreshold = max(
        (int)$c['age_threshold'],
        (int)$c['age_threshold'] + (int)$c['buffer_years']
    );

    $reference = 'hybrixon-u' . (int)$user['id'] . '-' . bin2hex(random_bytes(6));
    $callbackUrl = hybrixon_public_url('yoti-callback.php');
    $cancelUrl = hybrixon_public_url('age-verify.php');

    $payload = [
        'type' => 'OVER',
        'ttl' => 900,
        'age_estimation' => [
            'allowed' => true,
            'threshold' => $faceThreshold,
            'level' => 'PASSIVE',
            'retry_limit' => 2,
        ],
        // Keep ID methods off by default — Soft-18+ prefers facial estimation only.
        'digital_id' => ['allowed' => false],
        'doc_scan' => ['allowed' => false],
        'credit_card' => ['allowed' => false],
        'mobile' => ['allowed' => false],
        'reference_id' => $reference,
        'callback' => [
            'auto' => true,
            'url' => $callbackUrl,
        ],
        'cancel_url' => $cancelUrl,
        'retry_enabled' => true,
        'resume_enabled' => true,
        'synchronous_checks' => true,
    ];

    $res = yoti_http('POST', $c['api_base'] . '/sessions', $payload);
    if (!$res['ok'] || !is_array($res['data'])) {
        return [
            'ok' => false,
            'error' => 'Yoti-Sitzung fehlgeschlagen'
                . ($res['code'] ? " (HTTP {$res['code']})" : '')
                . ($res['error'] !== '' ? ': ' . $res['error'] : '')
                . '. Keys/Endpoint in data/yoti.json prüfen.',
            'debug' => substr((string)$res['body'], 0, 400),
        ];
    }

    $sessionId = (string)($res['data']['id'] ?? $res['data']['session_id'] ?? '');
    if ($sessionId === '' || !preg_match('/^[0-9a-f-]{36}$/i', $sessionId)) {
        return [
            'ok' => false,
            'error' => 'Yoti-Antwort ohne gültige session_id.',
            'debug' => substr((string)$res['body'], 0, 400),
        ];
    }

    $redirect = $c['user_view_base'] . '?sessionId=' . rawurlencode($sessionId)
        . '&sdkId=' . rawurlencode($c['sdk_id']);

    allxion_session_start_lite();
    $_SESSION['yoti_session_id'] = $sessionId;
    $_SESSION['yoti_user_id'] = (int)$user['id'];
    $_SESSION['yoti_reference'] = $reference;
    $_SESSION['yoti_started_at'] = time();

    require_once __DIR__ . '/auth.php';
    age_audit((int)$user['id'], 'yoti_session_start', $sessionId);

    return ['ok' => true, 'session_id' => $sessionId, 'redirect' => $redirect];
}

/**
 * Fetch session result from Yoti.
 *
 * @return array{ok: true, data: array}|array{ok: false, error: string, data?: array}
 */
function yoti_fetch_session_result(string $sessionId): array
{
    if (!yoti_is_enabled()) {
        return ['ok' => false, 'error' => 'Yoti nicht aktiv.'];
    }
    $c = yoti_config();
    $res = yoti_http('GET', $c['api_base'] . '/sessions/' . rawurlencode($sessionId) . '/result');
    if (!$res['ok'] || !is_array($res['data'])) {
        return [
            'ok' => false,
            'error' => 'Yoti-Ergebnis nicht lesbar'
                . ($res['code'] ? " (HTTP {$res['code']})" : ''),
            'data' => is_array($res['data']) ? $res['data'] : [],
        ];
    }
    return ['ok' => true, 'data' => $res['data']];
}

/**
 * Interpret OVER age-estimation result.
 *
 * @return array{passed: bool, detail: string}
 */
function yoti_interpret_result(array $data): array
{
    $status = strtoupper((string)($data['status'] ?? $data['state'] ?? ''));
    $agePassed = $data['age_estimation']['passed']
        ?? $data['age_estimation']['result']
        ?? $data['checks']['age_estimation']['passed']
        ?? null;

    if (is_bool($agePassed)) {
        return [
            'passed' => $agePassed,
            'detail' => 'yoti age_estimation passed=' . ($agePassed ? '1' : '0') . ' status=' . $status,
        ];
    }

    $overall = strtoupper((string)($data['overall_status'] ?? $data['result'] ?? ''));
    if (in_array($overall, ['PASS', 'PASSED', 'COMPLETE_PASS', 'APPROVED'], true)
        || in_array($status, ['COMPLETE', 'COMPLETED', 'PASS', 'PASSED'], true)
    ) {
        // Prefer explicit method outcome when present.
        $methodStatus = strtoupper((string)(
            $data['age_estimation']['status']
            ?? $data['methods']['age_estimation']['status']
            ?? ''
        ));
        if ($methodStatus !== '' && in_array($methodStatus, ['FAIL', 'FAILED', 'REJECTED'], true)) {
            return ['passed' => false, 'detail' => 'yoti method failed status=' . $methodStatus];
        }
        if ($methodStatus !== '' && in_array($methodStatus, ['PASS', 'PASSED', 'COMPLETE'], true)) {
            return ['passed' => true, 'detail' => 'yoti method passed status=' . $methodStatus];
        }
        // COMPLETE alone is not enough without pass — check nested "over"
        $over = $data['over'] ?? $data['age']['over'] ?? null;
        if ($over === true || $over === 'true' || $over === 1) {
            return ['passed' => true, 'detail' => 'yoti over=true status=' . $status];
        }
        if ($over === false || $over === 'false' || $over === 0) {
            return ['passed' => false, 'detail' => 'yoti over=false status=' . $status];
        }
    }

    if (in_array($status, ['FAIL', 'FAILED', 'REJECTED', 'ERROR'], true)
        || in_array($overall, ['FAIL', 'FAILED', 'REJECTED'], true)
    ) {
        return ['passed' => false, 'detail' => 'yoti failed status=' . $status . ' overall=' . $overall];
    }

    return [
        'passed' => false,
        'detail' => 'yoti inconclusive status=' . $status . ' overall=' . $overall,
    ];
}

function yoti_mark_user_verified(int $userId, string $detail = 'yoti'): void
{
    $stmt = allxion_db()->prepare(
        "UPDATE users
         SET age_status = 'approved',
             age_verified_at = datetime('now'),
             age_reviewed_at = datetime('now'),
             age_review_note = ?,
             age_provider = 'yoti',
             age_requested_at = COALESCE(age_requested_at, datetime('now'))
         WHERE id = ?"
    );
    $stmt->execute([substr($detail, 0, 500), $userId]);
    require_once __DIR__ . '/auth.php';
    age_audit($userId, 'yoti_approved', $detail);
}

function yoti_mark_user_rejected(int $userId, string $detail = 'yoti fail'): void
{
    // Do not clobber an open soft admin request — only note the failed face check.
    $stmt = allxion_db()->prepare(
        "UPDATE users
         SET age_review_note = ?,
             age_reviewed_at = datetime('now')
         WHERE id = ? AND age_status != 'approved'"
    );
    $stmt->execute([substr('yoti fail: ' . $detail, 0, 500), $userId]);
    require_once __DIR__ . '/auth.php';
    age_audit($userId, 'yoti_rejected', $detail);
}
