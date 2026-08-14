<?php
declare(strict_types=1);

/**
 * Kopie nach config.php auf dem Server (nicht committen).
 * deploy-backup.py erzeugt config.php automatisch, falls sie fehlt.
 */
return [
    // Pflicht: gleicher Wert wie ?token= beim Cronjob
    'token' => 'CHANGE_ME',

    // Wie viele Tagesstände je Ziel behalten werden (hybrixon.com ist ~6 GB)
    'keep' => 2,

    // Account-Wurzel mit allen Domain-Ordnern. Leer = automatisch.
    'home' => '',

    // Ordner im Account-Root, die nicht als Projekt gelten
    'skip_roots' => [
        'backup', 'logs', 'cgi-bin', 'tmp', 'mail', '.ssh', '.php',
    ],

    // Namen innerhalb eines Projekts, die nicht ins Archiv kommen
    'ignore_names' => [
        'node_modules', '.git', '__pycache__', 'cgi-bin', 'logs', 'tmp', 'backup', 'archiv',
    ],

    // Optional: MySQL-Dumps (Hybrixon nutzt SQLite und ist über die Dateien abgedeckt)
    'databases' => [
        // ['name' => 'dXXXXXX', 'user' => 'dXXXXXX', 'pass' => '', 'host' => 'localhost'],
    ],
];
