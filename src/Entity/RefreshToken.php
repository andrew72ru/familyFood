<?php declare(strict_types=1);

namespace App\Entity;

use App\Repository\RefreshTokenRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RefreshTokenRepository::class)]
#[ORM\Table(name: 'refresh_token')]
class RefreshToken
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private int | null $id = null;

    #[ORM\Column(type: 'string', length: 1024, unique: true)]
    private string | null $token = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User | null $user = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable | null $expiresAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): int | null
    {
        return $this->id;
    }

    public function getToken(): string | null
    {
        return $this->token;
    }

    public function setToken(string $token): static
    {
        $this->token = $token;

        return $this;
    }

    public function getUser(): User | null
    {
        return $this->user;
    }

    public function setUser(User | null $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getExpiresAt(): \DateTimeImmutable | null
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(\DateTimeImmutable $expiresAt): static
    {
        $this->expiresAt = $expiresAt;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function isExpired(): bool
    {
        return $this->expiresAt !== null && $this->expiresAt < new \DateTimeImmutable();
    }
}
