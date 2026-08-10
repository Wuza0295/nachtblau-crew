<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

/**
 * @return array<string, list<string>>
 */
function geo_plz_map(): array
{
    static $map = null;
    if (is_array($map)) {
        return $map;
    }
    $path = __DIR__ . '/geo/plz-ort.json';
    if (!is_file($path)) {
        $map = [];
        return $map;
    }
    $raw = file_get_contents($path);
    $decoded = json_decode((string)$raw, true);
    $map = is_array($decoded) ? $decoded : [];
    return $map;
}

/**
 * @return list<string>
 */
function geo_cities_for_plz(string $plz): array
{
    $plz = trim($plz);
    if (!preg_match('/^\d{5}$/', $plz)) {
        return [];
    }
    $cities = geo_plz_map()[$plz] ?? [];
    if (!is_array($cities)) {
        return [];
    }
    $out = [];
    foreach ($cities as $c) {
        $c = trim((string)$c);
        if ($c !== '') {
            $out[] = $c;
        }
    }
    return array_values(array_unique($out));
}

/**
 * Search cities by name fragment (optional PLZ filter).
 * @return list<array{city: string, plz: string}>
 */
function geo_search_cities(string $query, string $plz = '', int $limit = 40): array
{
    $query = trim($query);
    $plz = trim($plz);
    $limit = max(1, min(80, $limit));
    if ($query !== '' && mb_strlen($query) < 2 && $plz === '') {
        return [];
    }

    $map = geo_plz_map();
    if ($plz !== '') {
        if (!preg_match('/^\d{5}$/', $plz)) {
            return [];
        }
        $map = [$plz => ($map[$plz] ?? [])];
    }

    $q = mb_strtolower($query);
    $out = [];
    $seen = [];
    foreach ($map as $code => $cities) {
        if (!is_array($cities)) {
            continue;
        }
        foreach ($cities as $c) {
            $c = trim((string)$c);
            if ($c === '') {
                continue;
            }
            if ($q !== '' && !str_contains(mb_strtolower($c), $q)) {
                continue;
            }
            $key = mb_strtolower($c) . '|' . $code;
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $out[] = ['city' => $c, 'plz' => (string)$code];
            if (count($out) >= $limit) {
                return $out;
            }
        }
    }
    return $out;
}

function geo_city_exists(string $city): bool
{
    $city = trim($city);
    if ($city === '') {
        return false;
    }
    $needle = mb_strtolower($city);
    foreach (geo_plz_map() as $cities) {
        if (!is_array($cities)) {
            continue;
        }
        foreach ($cities as $c) {
            if (mb_strtolower(trim((string)$c)) === $needle) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Valid location: city always required from official list.
 * PLZ optional — if set, must match the city.
 */
function geo_is_valid_location(string $plz, string $city): bool
{
    $plz = trim($plz);
    $city = trim($city);
    if ($city === '') {
        return false;
    }
    if ($plz === '') {
        return geo_city_exists($city);
    }
    if (!preg_match('/^\d{5}$/', $plz)) {
        return false;
    }
    $cities = geo_cities_for_plz($plz);
    foreach ($cities as $c) {
        if (mb_strtolower($c) === mb_strtolower($city)) {
            return true;
        }
    }
    return false;
}

/** User has a verified DE city (PLZ optional but must match if present). */
function user_has_location(array $user): bool
{
    return geo_is_valid_location(
        (string)($user['postal_code'] ?? ''),
        (string)($user['city'] ?? '')
    );
}
