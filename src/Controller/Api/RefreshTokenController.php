<?php declare(strict_types=1);

namespace App\Controller\Api;

use App\Entity\User;
use App\Repository\RefreshTokenRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\{JsonResponse, Request, Response};
use Symfony\Component\Routing\Annotation\Route;

final class RefreshTokenController extends AbstractController
{
    public function __construct(
        private readonly RefreshTokenRepository $refreshTokenRepository,
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
        $data = \json_decode($request->getContent(), true);
        $refreshTokenString = $data['refresh_token'] ?? $request->request->get('refresh_token');

        if (!$refreshTokenString) {
            return new JsonResponse(['message' => 'Refresh token not found in request'], Response::HTTP_FORBIDDEN);
        }

        $refreshToken = $this->refreshTokenRepository->findOneBy(['token' => $refreshTokenString]);

        if (!$refreshToken || $refreshToken->isExpired()) {
            return new JsonResponse(['message' => 'Invalid or expired refresh token'], Response::HTTP_FORBIDDEN);
        }

        $user = $refreshToken->getUser();
        if (!$user instanceof User) {
            return new JsonResponse(['message' => 'User not found'], Response::HTTP_FORBIDDEN);
        }

        // Generate a new access token
        $newToken = $this->jwtManager->create($user);
        $expiration = $refreshToken->getExpiresAt()?->getTimestamp() - \time();

        return new JsonResponse([
            'token' => $newToken,
            'refresh_token' => $refreshTokenString, // Keep the same refresh token or generate a new one
            'refresh_token_expiration' => $expiration > 0 ? $expiration : 0,
        ]);
    }
}
