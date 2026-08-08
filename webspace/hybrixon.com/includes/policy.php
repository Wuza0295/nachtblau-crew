<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

/**
 * Soft-18+ only. Soft nudity (e.g. breasts) allowed behind age gate.
 * Hard porn / genitals / sex acts / violence forbidden — no AVS product.
 * DMs: text-only, 18+, same bans; admins may read all DMs (disclosed).
 */
const CONTENT_POLICY_VERSION = '2026-08-06-soft-images';

const CONTENT_POLICY_FORBIDDEN = [
    'Pornografie und explizite Sexdarstellungen (18++ / Hardcore)',
    'Genitalien, Sexakte, sexuelle Penetration — auch als Bild',
    'Gewaltpornografie und gewaltverherrlichende Inhalte',
    'Missbrauchsdarstellungen, CSAM und sonstige illegale Inhalte',
    'Inhalte, die nur mit echtem AVS / geschlossener Benutzergruppe erlaubt wären',
    'Belästigung, Drohungen, Stalking in Posts oder Direktnachrichten',
];

const CONTENT_POLICY_SOFT_18 = [
    'Sensible Community-Themen / Soft-NSFW hinter Altersfreischaltung',
    'Derbe Sprache, Andeutungen, nicht-pornografische Reifeinhalte',
    'Soft-Nacktheit (z. B. Brüste) — ohne Genitalien, ohne Sexakt',
    'Soft-18+-Bilder mit Markierung, automatischer Prüfung und Admin-Meldung',
    'Soft-18+ nur für altersgeprüfte Mitglieder sichtbar',
    'Normale (nicht Soft-18+) Beiträge inkl. Bilder sind ohne Extra-Markierung erlaubt',
];

const CONTENT_POLICY_DM = [
    'Nur zwischen Mitgliedern ab ' . DM_MIN_AGE . ' Jahren (Geburtsdatum im Konto)',
    'Nur Text — keine Datei-/Bild-Uploads in DMs',
    'Gleiche Verbote wie im Feed (kein Porno / 18++, keine Gewalt, nichts Illegales)',
    'Blockieren und Melden möglich',
    'Plattform-Admins können alle Direktnachrichten zur Regel-Durchsetzung einsehen (Zugriffe werden protokolliert)',
    'Nachrichten werden nach ca. ' . DM_RETENTION_DAYS . ' Tagen automatisch gelöscht',
];

function content_policy_summary(): string
{
    return 'Hybrixon erlaubt Soft-18+: sensible Inhalte inkl. Soft-Nacktheit (z. B. Brüste) hinter Altersfreischaltung. '
        . '18++ / Porno, Genitalien, Sexakte, Gewalt und Illegales sind verboten — auch in DMs. '
        . 'Soft-18+-Bilder werden automatisch geprüft und Admins gemeldet. DMs können von Plattform-Admins eingesehen werden.';
}
