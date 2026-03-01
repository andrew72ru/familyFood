<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Embeddable]
class Price
{
    #[ORM\Column(Types::INTEGER, nullable: true)]
    private int | null $price = null;

    #[ORM\Column(Types::STRING, nullable: true)]
    private string | null $unit = null;

    public function getPrice(): int | null
    {
        return $this->price;
    }

    public function setPrice(int | null $price): static
    {
        $this->price = $price;

        return $this;
    }

    public function getUnit(): string | null
    {
        return $this->unit;
    }

    public function setUnit(string | null $unit): static
    {
        $this->unit = $unit;

        return $this;
    }
}
