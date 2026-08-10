<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/i18n.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$text = trim((string)($data['text'] ?? ''));
$to = strtolower(substr((string)($data['to'] ?? hybrixon_active_lang(allxion_current_user())), 0, 2));

if ($text === '' || mb_strlen($text) > 4000) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid text']);
    exit;
}
if (!hybrixon_locale_valid($to)) {
    $to = 'en';
}

$q = mb_substr($text, 0, 450);
$url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl='
    . rawurlencode($to) . '&dt=t&q=' . rawurlencode($q);

$ctx = stream_context_create([
    'http' => [
        'timeout' => 8,
        'header' => "Accept: application/json\r\nUser-Agent: Hybrixon/1.0\r\n",
    ],
    'ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
    ],
]);
$json = @file_get_contents($url, false, $ctx);
$translated = '';
if ($json !== false) {
    $parsed = json_decode($json, true);
    if (is_array($parsed[0] ?? null)) {
        foreach ($parsed[0] as $chunk) {
            if (is_array($chunk) && isset($chunk[0]) && is_string($chunk[0])) {
                $translated .= $chunk[0];
            }
        }
    }
}

$translated = trim($translated);
if ($translated === '') {
    $fallback = 'https://translate.google.com/?sl=auto&tl=' . rawurlencode($to)
        . '&text=' . rawurlencode($q) . '&op=translate';
    http_response_code(502);
    echo json_encode([
        'ok' => false,
        'error' => t('common.translate_failed'),
        'fallback' => $fallback,
    ]);
    exit;
}

echo json_encode([
    'ok' => true,
    'text' => $translated,
    'to' => $to,
], JSON_UNESCAPED_UNICODE);
