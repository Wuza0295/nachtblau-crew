<?php
declare(strict_types=1);

/**
 * Kopiere diese Datei nach config.local.php auf dem Server.
 * config.local.php wird nicht eingecheckt und nicht ausgeliefert.
 * Ohne MySQL-Angaben nutzt die Anmeldung eine SQLite-Datei unter data/.
 *
 * SMTP nur über Umgebungsvariablen oder diese Datei, nie im Quellcode fest verdrahten:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_SECURE
 * CREW_DB_HOST, CREW_DB_PORT, CREW_DB_NAME, CREW_DB_USER, CREW_DB_PASS
 * CREW_MAIL_FROM, CREW_AUTH_DEV=1 zeigt den Bestätigungslink in der Antwort.
 */
return [
    // 'mail_from' => 'noreply@example.test',
    // 'expose_confirmation_url' => false,
    // 'mysql' => [
    //     'host' => 'localhost',
    //     'port' => '3306',
    //     'name' => '',
    //     'user' => '',
    //     'pass' => '',
    // ],
];
