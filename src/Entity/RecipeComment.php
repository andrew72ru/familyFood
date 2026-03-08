<?php declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\{Get, GetCollection, Link, Patch, Post};
use App\Repository\RecipeCommentRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Gedmo\Mapping\Annotation\Timestampable;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: RecipeCommentRepository::class)]
#[GetCollection(
    order: ['createdAt' => 'desc'],
    normalizationContext: ['groups' => ['recipe_comment:read']],
    mercure: true
)]
#[GetCollection(
    uriTemplate: '/dishes/{id}/recipe_comments',
    uriVariables: [
        'id' => new Link(toProperty: 'dish', fromClass: Dish::class),
    ],
    order: ['createdAt' => 'desc'],
    normalizationContext: ['groups' => ['recipe_comment:read']],
    mercure: true,
)]
#[Get(
    normalizationContext: ['groups' => ['recipe_comment:read']],
    mercure: true
)]
#[Post(
    normalizationContext: ['groups' => ['recipe_comment:read']],
    mercure: true
)]
#[Patch(
    normalizationContext: ['groups' => ['recipe_comment:read']],
    mercure: true
)]
class RecipeComment
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['dish:read', 'recipe_comment:read'])]
    private int | null $id = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['dish:read', 'recipe_comment:read'])]
    private string | null $text = null;

    #[ORM\ManyToOne(inversedBy: 'recipeComments')]
    #[Groups(['recipe_comment:read'])]
    private Dish | null $dish = null;

    #[ORM\Column(nullable: true)]
    #[Timestampable(on: 'create')]
    #[Groups(['dish:read', 'recipe_comment:read'])]
    private \DateTimeImmutable | null $createdAt = null;

    public function getId(): int | null
    {
        return $this->id;
    }

    public function getText(): string | null
    {
        return $this->text;
    }

    public function setText(string | null $text): self
    {
        $this->text = $text;

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

    public function getCreatedAt(): \DateTimeImmutable | null
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable | null $createdAt): self
    {
        $this->createdAt = $createdAt;

        return $this;
    }
}
