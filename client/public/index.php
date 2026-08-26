<?php
declare(strict_types=1);
header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('Content-Type: text/html; charset=UTF-8');
readfile(__DIR__ . '/index.html');
