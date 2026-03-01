<?php declare(strict_types=1);

namespace App\Dto;

final readonly class MessageDto
{
    /**
     * @param ContentDto[] $content
     */
    public function __construct(
        private string $id,
        private string $type,
        private string $role,
        private string $status,
        private array $content = [],
    ) {
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    /**
     * @return ContentDto[]
     */
    public function getContent(): array
    {
        return $this->content;
    }
}
