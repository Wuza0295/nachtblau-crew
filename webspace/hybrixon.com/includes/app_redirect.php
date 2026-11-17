<?php
declare(strict_types=1);

/**
 * On Android mobile browsers, hand off to the installed Hybrixon app via an
 * Intent URL. If the app is missing, Chrome follows browser_fallback_url
 * (?from_app=1) — that must NOT permanently hide the open/download banner.
 *
 * Must run before any HTML output.
 *
 * Additionally, hybrixon_should_client_auto_open_app() powers an in-page
 * backup when HTML is served (e.g. after fallback or non-Android).
 */
function hybrixon_maybe_redirect_to_app(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        return;
    }
    if (headers_sent()) {
        return;
    }

    // Skip after Intent fallback, explicit stay, or legacy ?web=1 links.
    if (
        isset($_GET['from_app'])
        || isset($_GET['web'])
        || isset($_GET['stay'])
        || (($_COOKIE['hybrixon_prefer_web'] ?? '') === '1')
    ) {
        return;
    }

    $ua = (string)($_SERVER['HTTP_USER_AGENT'] ?? '');
    if ($ua === '' || str_contains($ua, 'HybrixonApp')) {
        return;
    }
    if (!preg_match('/Android/i', $ua)) {
        return;
    }
    if (preg_match('/bot|crawl|spider|slurp|facebookexternalhit|preview|whatsapp|telegram/i', $ua)) {
        return;
    }

    $accept = (string)($_SERVER['HTTP_ACCEPT'] ?? 'text/html');
    if ($accept !== '' && !str_contains($accept, 'text/html') && !str_contains($accept, '*/*')) {
        return;
    }

    $uri = (string)($_SERVER['REQUEST_URI'] ?? '/');
    $path = (string)(parse_url($uri, PHP_URL_PATH) ?? '/');
    if (preg_match('#/(?:admin(?:/|$)|api(?:/|$)|api-|assets/|downloads/|spa-assets/|vendor/|media\.php|manifest\.json|sw\.js|\.well-known/)#', $path)) {
        return;
    }
    if (str_ends_with($path, '/app.php') || $path === '/app.php') {
        return;
    }

    $host = (string)($_SERVER['HTTP_HOST'] ?? 'hybrixon.com');
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    if (defined('HYBRIXON_FORCE_CANONICAL') && HYBRIXON_FORCE_CANONICAL && defined('HYBRIXON_CANONICAL_HOST')) {
        $host = HYBRIXON_CANONICAL_HOST;
        $https = true;
    }
    $httpsUrl = ($https ? 'https' : 'http') . '://' . $host . $uri;

    // Fallback stays on the same page and keeps the banner visible (no stay_web cookie).
    $fallback = $httpsUrl;
    $fallback .= str_contains($fallback, '?') ? '&from_app=1' : '?from_app=1';

    $intent = 'intent://open?url=' . rawurlencode($httpsUrl)
        . '#Intent;scheme=hybrixon;package=com.hybrixon.app'
        . ';S.browser_fallback_url=' . rawurlencode($fallback)
        . ';end';

    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Location: ' . $intent, true, 302);
    exit;
}

/**
 * Whether the current request should attempt an immediate client-side app open
 * (backup when HTML is served — e.g. Intent fallback ?from_app=1 is skipped).
 */
function hybrixon_should_client_auto_open_app(string $ua, bool $forceStayWeb): bool
{
    if ($forceStayWeb || $ua === '' || str_contains($ua, 'HybrixonApp')) {
        return false;
    }
    if (isset($_GET['from_app']) || isset($_GET['web']) || isset($_GET['stay'])) {
        return false;
    }
    if (!preg_match('/Android/i', $ua)) {
        return false;
    }
    if (preg_match('/bot|crawl|spider|slurp|facebookexternalhit|preview|whatsapp|telegram/i', $ua)) {
        return false;
    }
    $path = (string)(parse_url((string)($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?? '/');
    if (preg_match('#/(?:admin(?:/|$)|api(?:/|$)|api-|assets/|downloads/|spa-assets/|vendor/|media\.php|manifest\.json|sw\.js|\.well-known/)#', $path)) {
        return false;
    }
    if (str_ends_with($path, '/app.php') || $path === '/app.php') {
        return false;
    }
    return true;
}
