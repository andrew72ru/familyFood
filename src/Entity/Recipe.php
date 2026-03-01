<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Embeddable]
class Recipe
{
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['dish:read', 'dish:write'])]
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
