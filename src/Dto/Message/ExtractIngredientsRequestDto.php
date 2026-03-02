<?php declare(strict_types=1);

namespace App\Dto\Message;

use ApiPlatform\Metadata\{ApiResource, Post};

#[ApiResource(
    operations: [
        new Post(
            status: 202,
            shortName: 'ExtractIngredients',
            output: false,
            messenger: true,
            read: false,
        ),
    ]
)]
final readonly class ExtractIngredientsRequestDto
{
    public function __construct(
        private int $dishId,
    ) {
    }

    public function getDishId(): int
    {
        return $this->dishId;
    }
}
