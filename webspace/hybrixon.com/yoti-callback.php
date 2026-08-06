<?php
declare(strict_types=1);

/**
 * Yoti Age Verification return URL.
 * Session ID is appended as ?sessionId=… after synchronous_checks.
 */

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/yoti.php';

$allowCamera = true;
$user = allxion_require_login();

$sessionId = trim((string)($_GET['sessionId'] ?? $_GET['session_id'] ?? ''));
if ($sessionId === '' || !preg_match('/^[0-9a-f-]{36}$/i', $sessionId)) {
    flash('error', 'Yoti-Callback ohne gültige Sitzungs-ID.');
    redirect(allxion_url('age-verify.php'));
}

allxion_session_start();
$expected = (string)($_SESSION['yoti_session_id'] ?? '');
$expectedUser = (int)($_SESSION['yoti_user_id'] ?? 0);
if ($expected === '' || !hash_equals($expected, $sessionId) || $expectedUser !== (int)$user['id']) {
    age_audit((int)$user['id'], 'yoti_callback_mismatch', $sessionId);
    flash('error', 'Yoti-Sitzung gehört nicht zu diesem Login. Bitte erneut starten.');
    redirect(allxion_url('age-verify.php'));
}

if (user_age_verified($user)) {
    unset($_SESSION['yoti_session_id'], $_SESSION['yoti_user_id'], $_SESSION['yoti_reference']);
    flash('info', 'Soft-18+ ist bereits freigeschaltet.');
    redirect(allxion_url('profile.php'));
}

$result = yoti_fetch_session_result($sessionId);
if (!$result['ok']) {
    age_audit((int)$user['id'], 'yoti_result_error', $result['error'] ?? 'unknown');
    flash('error', 'Gesichtsprüfung konnte nicht ausgewertet werden. Bitte erneut versuchen oder Soft-Antrag nutzen.');
    redirect(allxion_url('age-verify.php'));
}

$interp = yoti_interpret_result($result['data']);
unset($_SESSION['yoti_session_id'], $_SESSION['yoti_user_id'], $_SESSION['yoti_reference'], $_SESSION['yoti_started_at']);

if ($interp['passed']) {
    yoti_mark_user_verified((int)$user['id'], $interp['detail']);
    flash('success', 'Gesichtsprüfung bestanden — Soft-18+ ist freigeschaltet.');
    redirect(allxion_url('profile.php'));
}

yoti_mark_user_rejected((int)$user['id'], $interp['detail']);
flash(
    'error',
    'Gesichtsprüfung nicht bestanden (Alters-Schätzung unter dem Sicherheits-Puffer). '
    . 'Du kannst später erneut versuchen oder den Soft-Antrag zur Admin-Prüfung nutzen.'
);
redirect(allxion_url('age-verify.php'));
