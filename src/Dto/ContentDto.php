<?php declare(strict_types=1);

namespace App\Dto;

final readonly class ContentDto
{
    public function __construct(
        private string $type,
        private string $text,
    ) {
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getText(): string
    {
        return $this->text;
    }
}
