<?php declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Embeddable]
#[ApiResource]
final class Recipe
{
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private string | null $text = null;

    public function getText(): string | null
    {
        return $this->text;
    }

    public function setText(string | null $text): self
    {
        $this->text = $text;

        return $this;
    }
}
