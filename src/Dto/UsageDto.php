<?php declare(strict_types=1);

namespace App\Dto;

use Symfony\Component\Serializer\Attribute\SerializedName;

final readonly class UsageDto
{
    public function __construct(
        #[SerializedName('total_tokens')]
        private int $totalTokens,
        #[SerializedName('input_tokens')]
        private int $inputTokens,
        #[SerializedName('output_tokens')]
        private int $outputTokens,
    ) {
    }

    public function getTotalTokens(): int
    {
        return $this->totalTokens;
    }

    public function getInputTokens(): int
    {
        return $this->inputTokens;
    }

    public function getOutputTokens(): int
    {
        return $this->outputTokens;
    }
}
