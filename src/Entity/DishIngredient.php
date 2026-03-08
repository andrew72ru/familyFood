<?php declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata as API;
use App\Repository\DishIngredientRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: DishIngredientRepository::class)]
#[API\GetCollection(
    uriTemplate: '/dishes/{id}/ingredients',
    uriVariables: [
        'id' => new API\Link(toProperty: 'dish', fromClass: Dish::class),
    ],
    order: ['ingredient.name' => 'asc'],
    normalizationContext: ['groups' => ['ingredient:read']],
    mercure: true
)]
#[API\Get(normalizationContext: ['groups' => ['ingredient:read']], mercure: true)]
#[API\Post(normalizationContext: ['groups' => ['ingredient:read']], mercure: true)]
#[API\Patch(mercure: true)]
#[API\GetCollection(mercure: true)]
#[API\Delete(mercure: true)]
class DishIngredient
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private int | null $id = null;

    #[ORM\Column(type: Types::STRING, nullable: true)]
    private string | null $weight = null;

    #[ORM\ManyToOne(inversedBy: 'dishIngredients')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['ingredient:read'])]
    private Dish | null $dish = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(onDelete: 'CASCADE')]
    #[Groups(['ingredient:read'])]
    #[API\ApiProperty(push: true)]
    private Ingredient | null $ingredient = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['ingredient:read'])]
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
