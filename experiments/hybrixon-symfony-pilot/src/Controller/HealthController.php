<?php

declare(strict_types=1);

namespace App\\Controller;

use Symfony\\Component\\HttpFoundation\\JsonResponse;

final class HealthController
{
    public function __invoke(): JsonResponse
    {
        return new JsonResponse([
            'ok' => true,
            'engine' => 'hybrixon-symfony-pilot-7.4',
            'php' => PHP_VERSION,
            'mode' => 'isolated-pilot',
        ]);
    }
}
