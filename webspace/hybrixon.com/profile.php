<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/posts.php';
require_once __DIR__ . '/includes/profile.php';
require_once __DIR__ . '/includes/legal.php';

$user = allxion_require_login();
redirect(allxion_url('u.php?u=' . rawurlencode((string)$user['username'])));
