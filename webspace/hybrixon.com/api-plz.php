<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/geo.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=86400');
header('X-Content-Type-Options: nosniff');

$plz = trim((string)($_GET['plz'] ?? ''));
if (!preg_match('/^\d{5}$/', $plz)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'PLZ muss 5 Ziffern haben.', 'cities' => []], JSON_UNESCAPED_UNICODE);
    exit;
}

$cities = geo_cities_for_plz($plz);
echo json_encode([
    'ok' => true,
    'plz' => $plz,
    'cities' => $cities,
], JSON_UNESCAPED_UNICODE);
exit;
