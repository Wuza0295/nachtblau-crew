<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

/** @return array<string, string> code => native label */
function hybrixon_locales(): array
{
    return [
        'de' => 'Deutsch',
        'en' => 'English',
        'fr' => 'Français',
        'es' => 'Español',
        'it' => 'Italiano',
        'nl' => 'Nederlands',
        'pl' => 'Polski',
        'tr' => 'Türkçe',
    ];
}

function hybrixon_locale_valid(string $code): bool
{
    return isset(hybrixon_locales()[$code]);
}

function hybrixon_set_lang_cookie(string $code): void
{
    if (!hybrixon_locale_valid($code)) {
        return;
    }
    $base = allxion_base_path();
    $path = $base === '' ? '/' : $base . '/';
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    setcookie('hybrixon_lang', $code, [
        'expires' => time() + 86400 * 400,
        'path' => $path,
        'secure' => $secure,
        'httponly' => false,
        'samesite' => 'Lax',
    ]);
    $_COOKIE['hybrixon_lang'] = $code;
}

function hybrixon_clear_lang_cache(): void
{
    // Reset static cache inside hybrixon_active_lang via request flag
    $GLOBALS['__hybrixon_lang_cache'] = null;
}

function hybrixon_active_lang(?array $user = null): string
{
    if (array_key_exists('__hybrixon_lang_cache', $GLOBALS) && $GLOBALS['__hybrixon_lang_cache'] !== null) {
        return (string)$GLOBALS['__hybrixon_lang_cache'];
    }

    // Explicit footer/settings choice (cookie) wins so UI language switches immediately.
    // Post bodies are never auto-translated — only via the optional "Translate" button.
    $cookie = (string)($_COOKIE['hybrixon_lang'] ?? '');
    if (hybrixon_locale_valid($cookie)) {
        return $GLOBALS['__hybrixon_lang_cache'] = $cookie;
    }
    if ($user && !empty($user['ui_lang']) && hybrixon_locale_valid((string)$user['ui_lang'])) {
        return $GLOBALS['__hybrixon_lang_cache'] = (string)$user['ui_lang'];
    }
    $accept = (string)($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '');
    if ($accept !== '') {
        foreach (explode(',', $accept) as $part) {
            $code = strtolower(substr(trim(explode(';', $part)[0]), 0, 2));
            if (hybrixon_locale_valid($code)) {
                return $GLOBALS['__hybrixon_lang_cache'] = $code;
            }
        }
    }
    return $GLOBALS['__hybrixon_lang_cache'] = 'de';
}

/** @return array<string, string> */
function hybrixon_lang_catalog(string $lang): array
{
    static $bags = [];
    if (isset($bags[$lang])) {
        return $bags[$lang];
    }
    $file = ALLXION_ROOT . '/lang/' . $lang . '.php';
    $deFile = ALLXION_ROOT . '/lang/de.php';
    $base = is_file($deFile) ? (require $deFile) : [];
    if (!is_array($base)) {
        $base = [];
    }
    if ($lang === 'de' || !is_file($file)) {
        return $bags[$lang] = $base;
    }
    $over = require $file;
    if (!is_array($over)) {
        $over = [];
    }
    return $bags[$lang] = array_merge($base, $over);
}

function t(string $key, array $replace = []): string
{
    $user = null;
    if (function_exists('allxion_current_user')) {
        $user = allxion_current_user();
    }
    $bag = hybrixon_lang_catalog(hybrixon_active_lang($user));
    $text = $bag[$key] ?? hybrixon_lang_catalog('de')[$key] ?? $key;
    foreach ($replace as $k => $v) {
        $text = str_replace(':' . $k, (string)$v, $text);
    }
    return $text;
}

function hybrixon_handle_lang_switch(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
        return;
    }
    $lang = (string)($_GET['lang'] ?? '');
    if ($lang === '' || !hybrixon_locale_valid($lang)) {
        return;
    }
    hybrixon_set_lang_cookie($lang);
    hybrixon_clear_lang_cache();
    if (function_exists('allxion_current_user')) {
        $user = allxion_current_user();
        if ($user) {
            try {
                allxion_db()->prepare('UPDATE users SET ui_lang = ? WHERE id = ?')
                    ->execute([$lang, (int)$user['id']]);
                $user['ui_lang'] = $lang;
            } catch (Throwable) {
            }
        }
    }
    $uri = (string)($_SERVER['REQUEST_URI'] ?? '/');
    $path = (string)(parse_url($uri, PHP_URL_PATH) ?? '/');
    $query = [];
    parse_str((string)(parse_url($uri, PHP_URL_QUERY) ?? ''), $query);
    unset($query['lang']);
    $qs = http_build_query($query);
    $target = $path . ($qs !== '' ? '?' . $qs : '');
    if (function_exists('redirect')) {
        redirect($target === '' ? allxion_url() : $target);
    }
    header('Location: ' . $target);
    exit;
}
