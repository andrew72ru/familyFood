<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\{RefreshToken, User};
use App\Repository\RefreshTokenRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\{Cookie, Response};

final class RefreshTokenSessionManager
{
    public const string COOKIE_NAME = 'refresh_token';
    public const int LIFETIME = 31536000;

    private const string COOKIE_PATH = '/api';

    // Mirrors config/packages/lexik_jwt_authentication.yaml `set_cookies.BEARER`.
    private const string ACCESS_TOKEN_COOKIE_NAME = 'BEARER';
    private const int ACCESS_TOKEN_COOKIE_LIFETIME = 3600;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly RefreshTokenRepository $refreshTokenRepository,
    ) {
    }

    /**
     * @return array{token: string, expiresAt: \DateTimeImmutable}
     */
    public function create(User $user): array
    {
        $token = $this->generateToken();
        $expiresAt = (new \DateTimeImmutable())->modify(\sprintf('+%d seconds', self::LIFETIME));

        $refreshToken = new RefreshToken();
        $refreshToken->setUser($user);
        $refreshToken->setToken($this->hashToken($token));
        $refreshToken->setExpiresAt($expiresAt);

        $this->entityManager->persist($refreshToken);
        $this->entityManager->flush();

        return ['token' => $token, 'expiresAt' => $expiresAt];
    }

    public function findValid(string $token): RefreshToken | null
    {
        $refreshToken = $this->refreshTokenRepository->findOneBy(['token' => $this->hashToken($token)]);

        // Keep refresh cookies issued before tokens were hashed working during rollout.
        if (!$refreshToken instanceof RefreshToken) {
            $refreshToken = $this->refreshTokenRepository->findOneBy(['token' => $token]);

            if ($refreshToken instanceof RefreshToken) {
                $refreshToken->setToken($this->hashToken($token));
                $this->entityManager->flush();
            }
        }

        if (!$refreshToken instanceof RefreshToken || $refreshToken->isExpired()) {
            return null;
        }

        return $refreshToken;
    }

    public function revoke(string $token): void
    {
        $refreshToken = $this->findValid($token);

        if (!$refreshToken instanceof RefreshToken) {
            return;
        }

        $this->entityManager->remove($refreshToken);
        $this->entityManager->flush();
    }

    public function addCookie(Response $response, string $token, \DateTimeImmutable $expiresAt): void
    {
        $this->clearLegacyCookie($response);
        $response->headers->setCookie(
            Cookie::create(self::COOKIE_NAME)
                ->withValue($token)
                ->withExpires($expiresAt)
                ->withPath(self::COOKIE_PATH)
                ->withSecure(true)
                ->withHttpOnly(true)
                ->withSameSite(Cookie::SAMESITE_STRICT)
        );
    }

    public function clearCookie(Response $response): void
    {
        $response->headers->clearCookie(
            self::COOKIE_NAME,
            self::COOKIE_PATH,
            null,
            true,
            true,
            Cookie::SAMESITE_STRICT,
        );
        $this->clearLegacyCookie($response);
    }

    /**
     * Lexik's JWT cookie authenticates browser-initiated requests we can't attach
     * an Authorization header to (Vulcain preload sub-requests). Keep it in sync
     * with the in-memory access token whenever we hand out a fresh one.
     */
    public function addAccessTokenCookie(Response $response, string $jwt): void
    {
        $response->headers->setCookie(
            Cookie::create(self::ACCESS_TOKEN_COOKIE_NAME)
                ->withValue($jwt)
                ->withExpires((new \DateTimeImmutable())->modify(\sprintf('+%d seconds', self::ACCESS_TOKEN_COOKIE_LIFETIME)))
                ->withPath('/')
                ->withSecure(true)
                ->withHttpOnly(true)
                ->withSameSite(Cookie::SAMESITE_LAX)
        );
    }

    /**
     * Clears every cookie that can authenticate a request on its own, so logout
     * actually ends the session instead of leaving a still-valid BEARER cookie behind.
     */
    public function clearAllAuthCookies(Response $response): void
    {
        $this->clearCookie($response);
        $response->headers->clearCookie(
            self::ACCESS_TOKEN_COOKIE_NAME,
            '/',
            null,
            true,
            true,
            Cookie::SAMESITE_LAX,
        );
    }

    private function generateToken(): string
    {
        return \rtrim(\strtr(\base64_encode(\random_bytes(64)), '+/', '-_'), '=');
    }

    private function hashToken(string $token): string
    {
        return \hash('sha256', $token);
    }

    private function clearLegacyCookie(Response $response): void
    {
        $response->headers->clearCookie(
            self::COOKIE_NAME,
            '/',
            null,
            true,
            true,
            Cookie::SAMESITE_LAX,
        );
    }
}
