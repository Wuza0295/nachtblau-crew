<?php
declare(strict_types=1);

const ALLXION_NAME = 'Hybrixon';
const ALLXION_TAGLINE = 'Closer. Freer.';
const ALLXION_MIN_REGISTER_AGE = 16;
const ALLXION_ADULT_AGE = 18;

/** Minimum supported PHP version for this portal build. */
const HYBRIXON_MIN_PHP = '8.5.0';

/** Canonical public domain (no scheme) — final home. */
const HYBRIXON_CANONICAL_HOST = 'hybrixon.com';

/**
 * false = Übergang: öffentliche Links & Betrieb unter nacht-blau.de/hybrixon/
 * true  = hybrixon.com ist live → alte Pfade 301 dorthin
 */
const HYBRIXON_FORCE_CANONICAL = true;

/** Interim base while the dedicated domain is not fully reachable. */
const HYBRIXON_INTERIM_ORIGIN = 'https://nacht-blau.de';
const HYBRIXON_INTERIM_BASE = '/hybrixon';

/** Exact confirmation phrase users must type (uppercase, no umlauts for reliability). */
const AGE_CONFIRM_PHRASE = 'ICH BIN MINDESTENS 18 JAHRE ALT';

/** Max open/pending age-verify requests per user within 24h. */
const AGE_VERIFY_MAX_PENDING_PER_DAY = 2;

/** Account must exist at least this many hours before age verification. */
const AGE_VERIFY_ACCOUNT_MIN_HOURS = 24;

/** Platform admins (usernames, case-insensitive). */
const HYBRIXON_ADMIN_USERNAMES = ['wuza1987'];

/** Direct messages: only between users aged 18+ (birthdate). */
const DM_MIN_AGE = 18;
const DM_MAX_LENGTH = 2000;
const DM_RATE_PER_HOUR = 40;
const DM_RETENTION_DAYS = 180;
const DM_REPORT_REASON_MAX = 500;

/** Bump when DM privacy/admin policy changes — forces re-consent. */
const DM_CONSENT_VERSION = '2026-08-05-full-admin';

/** Media limits (images / shorts). Per-file size stays large; counts allow multi-select. */
const MEDIA_IMAGE_MAX_BYTES = 12_000_000;
const MEDIA_VIDEO_MAX_BYTES = 50_000_000;
const MEDIA_VIDEO_MAX_SECONDS = 300;
const MEDIA_POST_IMAGES_MAX = 15;
const MEDIA_POST_VIDEOS_MAX = 10;
const MEDIA_REEL_VIDEOS_MAX = 10;
const MEDIA_STORY_MEDIA_MAX = 10;
const MEDIA_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MEDIA_VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'];

/** Stories expire after this many hours. */
const STORY_TTL_HOURS = 24;

/** „Eingeloggt bleiben“ cookie lifetime (days). */
const REMEMBER_ME_DAYS = 30;

/**
 * IP-Verlauf für Sicherheit/Moderation (Art. 6 Abs. 1 lit. f DSGVO).
 * Ältere Einträge werden automatisch gelöscht; bei Kontolöschung vollständig.
 */
const IP_LOG_RETENTION_DAYS = 90;

/** Soft switch for outbound notification e-mails (PHP mail()). */
const HYBRIXON_MAIL_ENABLED = true;

/** Public brand account (@Hybrixon) — auto-created, auto-accepts friends. */
const HYBRIXON_OFFICIAL_USERNAME = 'Hybrixon';
const HYBRIXON_OFFICIAL_EMAIL = 'official@hybrixon.com';
/** Legacy username merged into @Hybrixon (kept for redirects / reserved names). */
const HYBRIXON_LEGACY_TEAM_USERNAME = 'HybrixonTeam';

define('ALLXION_ROOT', dirname(__DIR__));
define('ALLXION_DATA', ALLXION_ROOT . '/data');
define('ALLXION_UPLOADS', ALLXION_ROOT . '/uploads');
define('ALLXION_AGE_DOCS', ALLXION_DATA . '/age-docs');
define('ALLXION_DB', ALLXION_DATA . '/hybrixon.sqlite');
define('ALLXION_ADMIN_HASH_FILE', ALLXION_DATA . '/admin.password');

function hybrixon_canonical_origin(): string
{
    return 'https://' . HYBRIXON_CANONICAL_HOST;
}

function hybrixon_is_interim(): bool
{
    return !HYBRIXON_FORCE_CANONICAL;
}

/**
 * Public absolute URL: interim NachtBlau path until the domain is fully live.
 */
function hybrixon_public_url(string $path = ''): string
{
    $path = ltrim($path, '/');
    if (HYBRIXON_FORCE_CANONICAL) {
        $origin = rtrim(hybrixon_canonical_origin(), '/');
        return $path === '' ? $origin . '/' : $origin . '/' . $path;
    }
    $base = rtrim(HYBRIXON_INTERIM_ORIGIN . HYBRIXON_INTERIM_BASE, '/');
    return $path === '' ? $base . '/' : $base . '/' . $path;
}

/** Base URL path when hosted under /hybrixon/ or at domain root. */
function allxion_base_path(): string
{
    $script = str_replace('\\', '/', (string)($_SERVER['SCRIPT_NAME'] ?? '/index.php'));

    // Admin lives in a subfolder — keep cookie/url root at the app base
    if (preg_match('#^(.*?)/admin(?:/|$)#', $script, $m)) {
        $base = rtrim($m[1], '/');
        return $base === '' ? '' : $base;
    }

    $dir = dirname($script);
    if ($dir === '/' || $dir === '.' || $dir === '\\') {
        return '';
    }
    return rtrim($dir, '/');
}

function allxion_url(string $path = ''): string
{
    $base = allxion_base_path();
    $path = ltrim($path, '/');
    if ($path === '') {
        return $base === '' ? '/' : $base . '/';
    }
    return ($base === '' ? '' : $base) . '/' . $path;
}

/**
 * 301 to hybrixon.com when still hit via nacht-blau.de/hybrixon/…
 * Also normalize www → apex on the canonical host.
 */
function hybrixon_enforce_canonical_host(): void
{
    if (!HYBRIXON_FORCE_CANONICAL || PHP_SAPI === 'cli' || headers_sent()) {
        return;
    }
    $host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
    $host = preg_replace('/:\d+$/', '', $host) ?? $host;
    if ($host === '') {
        return;
    }

    $uri = (string)($_SERVER['REQUEST_URI'] ?? '/');

    if ($host === 'www.' . HYBRIXON_CANONICAL_HOST) {
        header('Location: ' . hybrixon_canonical_origin() . $uri, true, 301);
        exit;
    }

    // Legacy path on NachtBlau → dedicated domain (strip /hybrixon prefix)
    if ($host === 'nacht-blau.de' || $host === 'www.nacht-blau.de') {
        $path = parse_url($uri, PHP_URL_PATH) ?? '/';
        $query = parse_url($uri, PHP_URL_QUERY);
        if (preg_match('#^/hybrixon(?:/(.*))?$#', $path, $m)) {
            $rest = isset($m[1]) ? $m[1] : '';
            $target = hybrixon_public_url($rest);
            if ($query) {
                $target .= (str_contains($target, '?') ? '&' : '?') . $query;
            }
            header('Location: ' . $target, true, 301);
            exit;
        }
    }
}
