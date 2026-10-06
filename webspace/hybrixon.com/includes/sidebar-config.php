<?php
declare(strict_types=1);

if (!function_exists('t')) {
    require_once __DIR__ . '/i18n.php';
}

/**
 * Catalog of configurable left-sidebar entries.
 * Top bar stays independent — removing here never removes top-nav items.
 *
 * @return array<string, array{label: string, auth: bool, admin?: bool}>
 */
function hybrixon_sidebar_catalog(): array
{
    return [
        'profile' => ['label' => t('nav.profile'), 'auth' => true],
        'friends' => ['label' => t('nav.friends'), 'auth' => true],
        'saved' => ['label' => t('nav.saved'), 'auth' => true],
        'albums' => ['label' => t('nav.albums'), 'auth' => true],
        'compose' => ['label' => t('nav.post'), 'auth' => true],
        'feed' => ['label' => t('nav.feed'), 'auth' => false],
        'shorts' => ['label' => t('nav.reels'), 'auth' => false],
        'stories' => ['label' => t('nav.stories'), 'auth' => false],
        'groups' => ['label' => t('nav.groups'), 'auth' => false],
        'search' => ['label' => t('nav.search'), 'auth' => false],
        'messages' => ['label' => t('nav.messages'), 'auth' => true],
        'app' => ['label' => t('nav.app'), 'auth' => false],
        'settings' => ['label' => t('nav.settings'), 'auth' => true],
        'admin' => ['label' => t('nav.admin'), 'auth' => true, 'admin' => true],
    ];
}

/** @return list<string> */
function hybrixon_sidebar_default_order(?array $user = null): array
{
    $keys = [];
    foreach (hybrixon_sidebar_catalog() as $key => $meta) {
        if (!empty($meta['admin']) && (!$user || !user_is_admin($user))) {
            continue;
        }
        if (!empty($meta['auth']) && !$user) {
            continue;
        }
        $keys[] = $key;
    }
    return $keys;
}

/**
 * @return list<string>
 */
function hybrixon_sidebar_items_for(?array $user): array
{
    $catalog = hybrixon_sidebar_catalog();
    $defaults = hybrixon_sidebar_default_order($user);

    if (!$user) {
        return array_values(array_filter(
            ['feed', 'shorts', 'stories', 'groups', 'search', 'app'],
            static fn(string $k): bool => isset($catalog[$k])
        ));
    }

    $raw = trim((string)($user['sidebar_items'] ?? ''));
    if ($raw === '') {
        return $defaults;
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return $defaults;
    }
    // Explicit empty list = hide all configurable entries (except always-on app link)
    if ($decoded === []) {
        return isset($catalog['app']) ? ['app'] : [];
    }

    $out = [];
    foreach ($decoded as $key) {
        $key = (string)$key;
        if (!isset($catalog[$key])) {
            continue;
        }
        $meta = $catalog[$key];
        if (!empty($meta['admin']) && !user_is_admin($user)) {
            continue;
        }
        if (!empty($meta['auth']) && !$user) {
            continue;
        }
        if (!in_array($key, $out, true)) {
            $out[] = $key;
        }
    }
    // Keep the Hybrixon App page discoverable even with a custom sidebar
    if (isset($catalog['app']) && !in_array('app', $out, true)) {
        $out[] = 'app';
    }
    return $out;
}

/**
 * Parse settings form into stored JSON (only enabled keys, sorted by position).
 *
 * @return array{0: string, 1: list<string>} JSON string + validation errors
 */
function hybrixon_sidebar_parse_settings(array $input, array $user): array
{
    $catalog = hybrixon_sidebar_catalog();
    $enabled = $input['sidebar_enabled'] ?? [];
    if (!is_array($enabled)) {
        $enabled = [];
    }
    $positions = $input['sidebar_pos'] ?? [];
    if (!is_array($positions)) {
        $positions = [];
    }

    $picked = [];
    foreach ($enabled as $key) {
        $key = (string)$key;
        if (!isset($catalog[$key])) {
            continue;
        }
        $meta = $catalog[$key];
        if (!empty($meta['admin']) && !user_is_admin($user)) {
            continue;
        }
        if (!empty($meta['auth']) && empty($user['id'])) {
            continue;
        }
        $pos = (int)($positions[$key] ?? 999);
        $picked[$key] = $pos;
    }

    if (!$picked) {
        return ['[]', []];
    }

    asort($picked, SORT_NUMERIC);
    $order = array_keys($picked);
    return [json_encode($order, JSON_UNESCAPED_UNICODE), []];
}
