<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

const LEGAL_OPERATOR = 'NachtBlau GbR';
const LEGAL_EMAIL = 'info@nacht-blau.de';
const LEGAL_STAND = '2026-08-06';

/** Bump when terms/privacy change — registration stores this version. */
const LEGAL_DOCS_VERSION = '2026-08-06-soft-images';

function legal_parent_impressum_url(): string
{
    return 'https://nacht-blau.de/impressum.html';
}

function legal_parent_privacy_url(): string
{
    return 'https://nacht-blau.de/datenschutz.html';
}
