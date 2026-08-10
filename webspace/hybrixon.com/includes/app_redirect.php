<?php
declare(strict_types=1);

/**
 * Android app handoff helpers.
 *
 * We intentionally do NOT issue an HTTP 302 to intent:// here.
 * Chrome often blocks Intent Location redirects without a user gesture and
 * leaves a blank page — so the open/stay banner never appears.
 *
 * Auto-open runs in the page <head> (JS) while the banner stays visible as
 * fallback. Explicit "Webversion verwenden" sets hybrixon_prefer_web.
 */
function hybrixon_maybe_redirect_to_app(): void
{
    // Kept for call-sites in header.php. No server Intent redirect.
}

/**
 * Whether the current request should attempt an immediate client-side app open.
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
