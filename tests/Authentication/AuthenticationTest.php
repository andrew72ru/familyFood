<?php declare(strict_types=1);

namespace App\Tests\Authentication;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class AuthenticationTest extends ApiTestCase
{
    public function testLogin(): void
    {
        $client = self::createClient();
        $container = self::getContainer();

        $manager = $container->get(EntityManagerInterface::class);
        $user = $manager->getRepository(User::class)->findOneBy(['email' => 'test@example.com']);

        if (!$user) {
            $user = new User();
            $user->setEmail('test@example.com');
            $user->setPassword(
                $container->get(UserPasswordHasherInterface::class)->hashPassword($user, '$3cr3t')
            );

            $manager->persist($user);
            $manager->flush();
        }

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
        $this->assertArrayHasKey('refresh_token', $json);
        $this->assertArrayHasKey('refresh_token_expiration', $json);
        $this->assertIsString($json['token']);
        $this->assertNotEmpty($json['token']);
        $this->assertIsString($json['refresh_token']);
        $this->assertNotEmpty($json['refresh_token']);

        \sleep(1);

        // Test Refreshing token
        $response = $client->request('POST', '/api/refresh_token', [
            'headers' => ['Content-Type' => 'application/json'],
            'json' => [
                'refresh_token' => $json['refresh_token'],
            ],
        ]);
        self::assertResponseIsSuccessful();
        $jsonRefresh = $response->toArray();
        $this->assertArrayHasKey('token', $jsonRefresh);
        $this->assertArrayHasKey('refresh_token', $jsonRefresh);
        $this->assertArrayHasKey('refresh_token_expiration', $jsonRefresh);
        $this->assertNotEquals($json['token'], $jsonRefresh['token']);

        // Test with the new token
        $client->request('GET', '/api/users', [
            'headers' => ['Authorization' => 'Bearer ' . $jsonRefresh['token']],
        ]);
        self::assertResponseIsSuccessful();
    }

    public function testLoginInvalidCredentials(): void
    {
        $client = self::createClient();

        $client->request('POST', '/api/login_check', [
            'headers' => ['Content-Type' => 'application/json'],
            'json' => [
                'email' => 'wrong@example.com',
                'password' => 'wrong',
            ],
        ]);

        self::assertResponseStatusCodeSame(401);
    }
}
