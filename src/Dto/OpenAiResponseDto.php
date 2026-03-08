<?php declare(strict_types=1);

namespace App\Dto;

use Symfony\Component\Serializer\Attribute\SerializedName;

final readonly class OpenAiResponseDto
{
    /**
     * @param MessageDto[] $output
     */
    public function __construct(
        private string $id,
        private string $object,
        #[SerializedName('created_at')]
        private int $createdAt,
        private string $status,
        private array $output = [],
        private UsageDto | null $usage = null,
    ) {
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getObject(): string
    {
        return $this->object;
    }

    public function getCreatedAt(): int
    {
        return $this->createdAt;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    /**
     * @return MessageDto[]
     */
    public function getOutput(): array
    {
        return $this->output;
    }

    public function getUsage(): UsageDto | null
    {
        return $this->usage;
    }

    public function getFirstMessageText(): string
    {
        $message = $this->output[0] ?? null;
        if (!$message instanceof MessageDto) {
            return '';
        }

        $content = $message->getContent()[0] ?? null;
        if (!$content instanceof ContentDto) {
            return '';
        }

        return $content->getText();
    }
}
