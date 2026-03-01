<?php declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\IngredientCommentRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: IngredientCommentRepository::class)]
#[ApiResource]
class IngredientComment
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private int | null $id = null;

    #[ORM\ManyToOne(targetEntity: Ingredient::class, inversedBy: 'comments')]
    private Ingredient | null $ingredient = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Assert\NotBlank]
    private string | null $text = null;

    public function getId(): int | null
    {
        return $this->id;
    }

    public function getText(): string | null
    {
        return $this->text;
    }

    public function setText(string $text): self
    {
        $this->text = $text;

        return $this;
    }

    public function getIngredient(): Ingredient | null
    {
        return $this->ingredient;
    }

    public function setIngredient(Ingredient | null $ingredient): self
    {
        $this->ingredient = $ingredient;

        return $this;
    }
}
