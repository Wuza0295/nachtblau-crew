<?php
declare(strict_types=1);

/**
 * On Android mobile browsers, hand off to the installed Hybrixon app via an
 * Intent URL. If the app is missing, Chrome follows browser_fallback_url (?web=1).
 *
 * Must run before any HTML output.
 */
function hybrixon_maybe_redirect_to_app(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        return;
    }
    if (headers_sent()) {
        return;
    }
    // Explicit "stay in browser" or previous fallback
    if (isset($_GET['web']) || (($_COOKIE['hybrixon_stay_web'] ?? '') === '1')) {
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
    if (preg_match('#/(?:admin(?:/|$)|api(?:/|$)|api-|assets/|downloads/|spa-assets/|media\.php|manifest\.json|\.well-known/)#', $path)) {
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

    $fallback = $httpsUrl;
    $fallback .= str_contains($fallback, '?') ? '&web=1' : '?web=1';

    $intent = 'intent://open?url=' . rawurlencode($httpsUrl)
        . '#Intent;scheme=hybrixon;package=com.hybrixon.app'
        . ';S.browser_fallback_url=' . rawurlencode($fallback)
        . ';end';

    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Location: ' . $intent, true, 302);
    exit;
}
