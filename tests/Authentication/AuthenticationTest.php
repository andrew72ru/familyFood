<?php declare(strict_types=1);

namespace App\Tests\Authentication;

use ApiPlatform\Symfony\Bundle\Test\{ApiTestCase, Client};
use App\Entity\{RefreshToken, User};
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class AuthenticationTest extends ApiTestCase
{
    public function testLogin(): void
    {
        $client = self::createClient([], ['base_uri' => 'https://localhost']);
        $this->ensureUser();

        // Retrieve a token
        $response = $client->request('POST', '/api/login_check', [
            'headers' => ['Content-Type' => 'application/json'],
            'json' => [
                'email' => 'test@example.com',
                'password' => '$3cr3t',
            ],
        ]);

        $json = $response->toArray();
        self::assertResponseIsSuccessful();
        $this->assertArrayHasKey('token', $json);
        $this->assertArrayNotHasKey('refresh_token', $json);
        $this->assertIsString($json['token']);
        $this->assertNotEmpty($json['token']);

        $cookies = $response->getHeaders(false)['set-cookie'] ?? [];
        $refreshCookie = \array_values(\array_filter(
            $cookies,
            static fn (string $cookie): bool => \str_contains($cookie, 'path=/api')
                && !\str_contains($cookie, 'Max-Age=0')
        ));
        $this->assertCount(1, $refreshCookie);
        $this->assertStringContainsString('refresh_token=', $refreshCookie[0]);
        $this->assertStringContainsString('httponly', \strtolower($refreshCookie[0]));
        $this->assertStringContainsString('secure', \strtolower($refreshCookie[0]));
        $this->assertStringContainsString('samesite=strict', \strtolower($refreshCookie[0]));

        \sleep(1);

        // Test Refreshing token
        $response = $client->request('POST', '/api/refresh_token', [
            'headers' => ['Content-Type' => 'application/json'],
        ]);
        self::assertResponseIsSuccessful();
        $jsonRefresh = $response->toArray();
        $this->assertArrayHasKey('token', $jsonRefresh);
        $this->assertArrayNotHasKey('refresh_token', $jsonRefresh);
        $this->assertNotEquals($json['token'], $jsonRefresh['token']);

        // Test with the new token
        $client->request('GET', '/api/users', [
            'headers' => ['Authorization' => 'Bearer ' . $jsonRefresh['token']],
        ]);
        self::assertResponseIsSuccessful();
    }

    public function testLoginInvalidCredentials(): void
    {
        $client = self::createClient([], ['base_uri' => 'https://localhost']);

        $client->request('POST', '/api/login_check', [
            'headers' => ['Content-Type' => 'application/json'],
            'json' => [
                'email' => 'wrong@example.com',
                'password' => 'wrong',
            ],
        ]);

        self::assertResponseStatusCodeSame(401);
    }

    public function testSeparateDevicesKeepIndependentSessions(): void
    {
        $firstDevice = self::createClient([], ['base_uri' => 'https://localhost']);
        $this->ensureUser();

        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $user = $manager->getRepository(User::class)->findOneBy(['email' => 'test@example.com']);
        self::assertInstanceOf(User::class, $user);
        $sessionsBefore = $manager->getRepository(RefreshToken::class)->count(['user' => $user]);

        $this->login($firstDevice);

        $secondDevice = self::createClient([], ['base_uri' => 'https://localhost']);
        $this->login($secondDevice);

        $manager = self::getContainer()->get(EntityManagerInterface::class);
        $user = $manager->getRepository(User::class)->findOneBy(['email' => 'test@example.com']);
        self::assertInstanceOf(User::class, $user);
        $this->assertSame(
            $sessionsBefore + 2,
            $manager->getRepository(RefreshToken::class)->count(['user' => $user])
        );

        $response = $firstDevice->request('POST', '/api/logout');
        $this->assertSame(204, $response->getStatusCode());

        $response = $firstDevice->request('POST', '/api/refresh_token');
        $this->assertSame(403, $response->getStatusCode());

        $response = $secondDevice->request('POST', '/api/refresh_token');
        $this->assertSame(200, $response->getStatusCode());
    }

    private function ensureUser(): void
    {
        $container = self::getContainer();
        $manager = $container->get(EntityManagerInterface::class);
        $user = $manager->getRepository(User::class)->findOneBy(['email' => 'test@example.com']);

        if ($user instanceof User) {
            return;
        }

        $user = new User();
        $user->setEmail('test@example.com');
        $user->setPassword(
            $container->get(UserPasswordHasherInterface::class)->hashPassword($user, '$3cr3t')
        );

        $manager->persist($user);
        $manager->flush();
    }

    private function login(Client $client): void
    {
        $response = $client->request('POST', '/api/login_check', [
            'headers' => ['Content-Type' => 'application/json'],
            'json' => [
                'email' => 'test@example.com',
                'password' => '$3cr3t',
            ],
        ]);

        $this->assertSame(200, $response->getStatusCode());
    }
}
