<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function e(?string $value): string
{
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function redirect(string $url): never
{
    header('Location: ' . $url);
    exit;
}

function flash(string $type, string $message): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        allxion_session_start_lite();
    }
    $_SESSION['_flash'][] = ['type' => $type, 'message' => $message];
}

function allxion_session_start_lite(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    require_once __DIR__ . '/auth.php';
    allxion_session_start();
}

function take_flashes(): array
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        allxion_session_start_lite();
    }
    $items = $_SESSION['_flash'] ?? [];
    unset($_SESSION['_flash']);
    return $items;
}

function csrf_token(): string
{
    allxion_session_start_lite();
    if (empty($_SESSION['_csrf'])) {
        $_SESSION['_csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['_csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="_csrf" value="' . e(csrf_token()) . '">';
}

function verify_csrf(): void
{
    allxion_session_start_lite();
    $token = $_POST['_csrf'] ?? '';
    if (!is_string($token) || !hash_equals($_SESSION['_csrf'] ?? '', $token)) {
        http_response_code(400);
        exit('Ungültiges CSRF-Token.');
    }
}

function time_ago(string $datetime): string
{
    try {
        $then = new DateTimeImmutable($datetime);
    } catch (Exception) {
        return $datetime;
    }
    $diff = (new DateTimeImmutable('now'))->getTimestamp() - $then->getTimestamp();
    if ($diff < 60) {
        return 'gerade eben';
    }
    if ($diff < 3600) {
        return (int)floor($diff / 60) . ' Min.';
    }
    if ($diff < 86400) {
        return (int)floor($diff / 3600) . ' Std.';
    }
    if ($diff < 604800) {
        return (int)floor($diff / 86400) . ' T.';
    }
    return $then->format('d.m.Y');
}
