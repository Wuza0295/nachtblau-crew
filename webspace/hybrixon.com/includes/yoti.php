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
    $cfg['buffer_years'] = (int)$cfg['buffer_years'];
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
        return 'aktiv';
    }
    if (yoti_is_configured()) {
        return 'konfiguriert, aber deaktiviert';
    }
    return 'nicht konfiguriert (Beispiel: data/yoti.example.json → yoti.json)';
}

/**
 * Create an age-verification session at Yoti (Age Verification API).
 * Returns ['ok'=>true,'redirect'=>url,'session_id'=>...] or ['ok'=>false,'error'=>...].
 *
 * Docs: https://developers.yoti.com/age-verification/
 * When keys are missing/disabled, returns a clear setup error (no fake success).
 */
function yoti_create_age_session(array $user): array
{
    if (!yoti_is_enabled()) {
        return [
            'ok' => false,
            'error' => 'Yoti ist noch nicht aktiv. Bitte data/yoti.json anhand von yoti.example.json einrichten.',
        ];
    }

    $c = yoti_config();
    // Effective threshold with KJM-style buffer for facial estimation
    $threshold = max($c['age_threshold'], $c['age_threshold'] + max(0, $c['buffer_years'] - 5));
    // For estimation modules KJM often wants buffer; keep configurable.
    $ageOver = $c['age_threshold'] + max(0, $c['buffer_years']);

    $payload = [
        'type' => 'AGE',
        'age_estimation' => [
            'allowed' => true,
            'threshold' => $ageOver,
        ],
        'ttl' => 900,
        'reference_id' => 'hybrixon-u' . (int)$user['id'] . '-' . bin2hex(random_bytes(6)),
        'callback' => [
            'auto' => true,
            'url' => hybrixon_public_url('yoti-callback.php'),
        ],
    ];

    // Yoti Age Verification sessions endpoint (REST). Exact path may vary by product;
    // this is the integration hook — adjust to your Yoti Age Verification dashboard docs.
    $url = 'https://api.yoti.com/age/v1/sessions';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $c['api_key'],
            'Yoti-SDK-Id: ' . $c['sdk_id'],
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
        CURLOPT_TIMEOUT => 20,
    ]);
    $body = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $cerr = curl_error($ch);
    curl_close($ch);

    if ($body === false || $code < 200 || $code >= 300) {
        return [
            'ok' => false,
            'error' => 'Yoti-Sitzung fehlgeschlagen'
                . ($code ? " (HTTP {$code})" : '')
                . ($cerr ? ": {$cerr}" : '')
                . '. API-URL/Header ggf. an euer Yoti-Produkt anpassen.',
            'debug' => is_string($body) ? substr($body, 0, 300) : '',
        ];
    }

    $data = json_decode($body, true);
    if (!is_array($data)) {
        return ['ok' => false, 'error' => 'Ungültige Yoti-Antwort.'];
    }

    $sessionId = (string)($data['id'] ?? $data['session_id'] ?? '');
    $redirect = (string)($data['redirect_url'] ?? $data['session_url'] ?? $data['url'] ?? '');
    if ($sessionId === '' || $redirect === '') {
        return [
            'ok' => false,
            'error' => 'Yoti-Antwort ohne session_id/redirect_url. Endpoint-Mapping prüfen.',
            'debug' => substr($body, 0, 300),
        ];
    }

    allxion_session_start_lite();
    $_SESSION['yoti_session_id'] = $sessionId;
    $_SESSION['yoti_user_id'] = (int)$user['id'];

    return ['ok' => true, 'session_id' => $sessionId, 'redirect' => $redirect];
}

/**
 * Apply a successful Yoti result to the user (called from callback after signature checks).
 */
function yoti_mark_user_verified(int $userId, string $detail = 'yoti'): void
{
    $stmt = allxion_db()->prepare(
        "UPDATE users
         SET age_status = 'approved',
             age_verified_at = datetime('now'),
             age_reviewed_at = datetime('now'),
             age_review_note = ?,
             age_provider = 'yoti'
         WHERE id = ?"
    );
    $stmt->execute([substr($detail, 0, 500), $userId]);
    require_once __DIR__ . '/auth.php';
    age_audit($userId, 'yoti_approved', $detail);
}
