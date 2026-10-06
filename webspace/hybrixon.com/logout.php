<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
allxion_logout();
flash('info', 'Abgemeldet.');
redirect(allxion_url());
