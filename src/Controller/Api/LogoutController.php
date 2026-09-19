<?php declare(strict_types=1);

namespace App\Controller\Api;

use App\Service\RefreshTokenSessionManager;
use Symfony\Component\HttpFoundation\{JsonResponse, Request, Response};
use Symfony\Component\Routing\Attribute\Route;

final class LogoutController
{
    public function __construct(
        private readonly RefreshTokenSessionManager $refreshTokenSessionManager,
    ) {
    }

    #[Route(path: '/api/logout', name: 'api_logout', methods: ['POST'], format: 'json')]
    public function __invoke(Request $request): Response
    {
        $token = $request->cookies->get(RefreshTokenSessionManager::COOKIE_NAME);

        if (\is_string($token) && '' !== $token) {
            $this->refreshTokenSessionManager->revoke($token);
        }

        $response = new JsonResponse(null, Response::HTTP_NO_CONTENT);
        $this->refreshTokenSessionManager->clearAllAuthCookies($response);

        return $response;
    }
}
