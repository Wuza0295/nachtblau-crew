<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/geo.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=3600');
header('X-Content-Type-Options: nosniff');

$q = trim((string)($_GET['q'] ?? ''));
$plz = trim((string)($_GET['plz'] ?? ''));
if ($q === '' && $plz === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Suchbegriff oder PLZ nötig.', 'results' => []], JSON_UNESCAPED_UNICODE);
    exit;
}
if ($q !== '' && mb_strlen($q) < 2 && $plz === '') {
    echo json_encode(['ok' => true, 'results' => []], JSON_UNESCAPED_UNICODE);
    exit;
}

$results = geo_search_cities($q, $plz, 40);
echo json_encode(['ok' => true, 'results' => $results], JSON_UNESCAPED_UNICODE);
exit;
