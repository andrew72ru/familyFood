<?php declare(strict_types=1);

namespace App\EventSubscriber;

use App\Entity\User;
use App\Service\RefreshTokenSessionManager;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

final class AuthenticationSuccessSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly RefreshTokenSessionManager $refreshTokenSessionManager,
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

        $session = $this->refreshTokenSessionManager->create($user);
        $this->refreshTokenSessionManager->addCookie($event->getResponse(), $session['token'], $session['expiresAt']);
    }
}
