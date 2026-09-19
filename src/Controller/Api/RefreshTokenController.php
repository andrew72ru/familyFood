<?php declare(strict_types=1);

namespace App\Controller\Api;

use App\Entity\User;
use App\Service\RefreshTokenSessionManager;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\{JsonResponse, Request, Response};
use Symfony\Component\Routing\Attribute\Route;

/**
 * @psalm-suppress PropertyNotSetInConstructor
 */
final class RefreshTokenController extends AbstractController
{
    public function __construct(
        private readonly RefreshTokenSessionManager $refreshTokenSessionManager,
        private readonly JWTTokenManagerInterface $jwtManager,
    ) {
    }

    #[Route(
        path: '/api/refresh_token',
        name: 'api_refresh_token',
        methods: ['POST'],
        format: 'json',
    )]
    public function __invoke(Request $request): Response
    {
        $refreshTokenString = $request->cookies->get(RefreshTokenSessionManager::COOKIE_NAME);

        if (!\is_string($refreshTokenString) || '' === $refreshTokenString) {
            return new JsonResponse(['message' => 'Refresh token not found in request'], Response::HTTP_FORBIDDEN);
        }

        $refreshToken = $this->refreshTokenSessionManager->findValid($refreshTokenString);

        if (!$refreshToken || $refreshToken->isExpired()) {
            return new JsonResponse(['message' => 'Invalid or expired refresh token'], Response::HTTP_FORBIDDEN);
        }

        $user = $refreshToken->getUser();
        if (!$user instanceof User) {
            return new JsonResponse(['message' => 'User not found'], Response::HTTP_FORBIDDEN);
        }

        $newToken = $this->jwtManager->create($user);

        return new JsonResponse([
            'token' => $newToken,
        ]);
    }
}
