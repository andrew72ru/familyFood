<?php declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\DishIngredientRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: DishIngredientRepository::class)]
#[ApiResource]
class DishIngredient
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private int | null $id = null;

    #[ORM\Column(type: Types::STRING, nullable: true)]
    private string | null $weight = null;

    #[ORM\ManyToOne(inversedBy: 'dishIngredients')]
    #[ORM\JoinColumn(nullable: false)]
    private Dish | null $dish = null;

    #[ORM\ManyToOne]
    private Ingredient | null $ingredient = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private string | null $comment = null;

    public function getId(): int | null
    {
        return $this->id;
    }

    public function getWeight(): string | null
    {
        return $this->weight;
    }

    public function setWeight(string | null $weight): self
    {
        $this->weight = $weight;

        return $this;
    }

    public function getDish(): Dish | null
    {
        return $this->dish;
    }

    public function setDish(Dish | null $dish): self
    {
        $this->dish = $dish;

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

    public function getComment(): string | null
    {
        return $this->comment;
    }

    public function setComment(string | null $comment): self
    {
        $this->comment = $comment;

        return $this;
    }
}
