<?php declare(strict_types=1);

namespace App\EventSubscriber;

use App\Entity\{RefreshToken, User};
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

final class AuthenticationSuccessSubscriber implements EventSubscriberInterface
{
    private const REFRESH_TOKEN_EXPIRATION = 31536000; // 1 year in seconds

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly JWTTokenManagerInterface $jwtManager,
    ) {
    }

    #[\Override]
    public static function getSubscribedEvents(): array
    {
        return [
            Events::AUTHENTICATION_SUCCESS => 'onAuthenticationSuccess',
        ];
    }

    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        $user = $event->getUser();

        if (!$user instanceof User) {
            return;
        }

        // Generate a long-lived JWT for refresh token
        // Lexik JWT manager by default uses the configured TTL.
        // We might want to use a different payload or TTL.
        // For simplicity and matching the request, we use a similar JWT but with longer life.

        $payload = [
            'exp' => \time() + self::REFRESH_TOKEN_EXPIRATION,
            'email' => $user->getEmail(),
            'refresh' => true,
        ];

        $refreshTokenString = $this->jwtManager->createFromPayload($user, $payload);

        // Store in DB
        $refreshToken = new RefreshToken();
        $refreshToken->setUser($user);
        $refreshToken->setToken($refreshTokenString);
        $refreshToken->setExpiresAt((new \DateTimeImmutable())->modify(\sprintf('+%d seconds', self::REFRESH_TOKEN_EXPIRATION)));

        $this->entityManager->persist($refreshToken);
        $this->entityManager->flush();

        // Add to response data
        $data = $event->getData();
        $data['refresh_token'] = $refreshTokenString;
        $data['refresh_token_expiration'] = self::REFRESH_TOKEN_EXPIRATION;
        $event->setData($data);
    }
}
