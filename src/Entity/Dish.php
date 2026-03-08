<?php declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter;
use ApiPlatform\Metadata as API;
use App\Repository\DishRepository;
use Doctrine\Common\Collections\{ArrayCollection, Collection};
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Gedmo\Mapping\Annotation as Gedmo;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: DishRepository::class)]
#[API\GetCollection(
    order: ['name' => 'ASC'],
    normalizationContext: ['groups' => ['dish:read']],
    mercure: true,
    parameters: [
        'search[:property]' => new API\QueryParameter(filter: new Filter\PartialSearchFilter(), properties: ['name']),
        'tags' => new API\QueryParameter(filter: new Filter\IriFilter(), property: 'tags'),
    ],
)]
#[API\Get(normalizationContext: ['groups' => ['dish:read']], mercure: true)]
#[API\Patch(denormalizationContext: ['groups' => ['dish:write']], mercure: true)]
#[API\Post]
#[API\Delete]
class Dish
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['dish:read'])]
    private int | null $id = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Assert\NotBlank]
    #[Groups(['dish:read', 'dish:write'])]
    private string | null $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['dish:read', 'dish:write'])]
    private string | null $description = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Gedmo\Timestampable(on: 'create')]
    #[Groups(['dish:read'])]
    private \DateTimeImmutable | null $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Gedmo\Timestampable(on: 'update')]
    #[Groups(['dish:read'])]
    private \DateTimeImmutable | null $updatedAt = null;

    #[ORM\Embedded]
    #[Groups(['dish:read', 'dish:write'])]
    private Recipe $recipe;

    /**
     * @var Collection<int, DishIngredient>
     */
    #[ORM\OneToMany(targetEntity: DishIngredient::class, mappedBy: 'dish', orphanRemoval: true)]
    #[Groups(['dish:read'])]
    #[API\ApiProperty(push: true)]
    private Collection $dishIngredients;

    /**
     * @var Collection<int, RecipeComment>
     */
    #[ORM\OneToMany(targetEntity: RecipeComment::class, mappedBy: 'dish')]
    #[Groups(['dish:read'])]
    private Collection $recipeComments;

    /**
     * @var Collection<int, Tag>
     */
    #[ORM\ManyToMany(targetEntity: Tag::class, inversedBy: 'dishes')]
    #[Groups(['dish:read', 'dish:write'])]
    private Collection $tags;

    public function __construct()
    {
        $this->recipe = new Recipe();
        $this->dishIngredients = new ArrayCollection();
        $this->recipeComments = new ArrayCollection();
        $this->tags = new ArrayCollection();
    }

    public function getId(): int | null
    {
        return $this->id;
    }

    public function getName(): string | null
    {
        return $this->name;
    }

    public function setName(string | null $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getDescription(): string | null
    {
        return $this->description;
    }

    public function setDescription(string | null $description): self
    {
        $this->description = $description;

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

    public function getUpdatedAt(): \DateTimeImmutable | null
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable | null $updatedAt): self
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }

    public function getRecipe(): Recipe
    {
        return $this->recipe;
    }

    public function setRecipe(Recipe $recipe): self
    {
        $this->recipe = $recipe;

        return $this;
    }

    /**
     * @return Collection<int, DishIngredient>
     */
    public function getDishIngredients(): Collection
    {
        return $this->dishIngredients;
    }

    public function addDishIngredient(DishIngredient $dishIngredient): self
    {
        if (!$this->dishIngredients->contains($dishIngredient)) {
            $this->dishIngredients->add($dishIngredient);
            $dishIngredient->setDish($this);
        }

        return $this;
    }

    public function removeDishIngredient(DishIngredient $dishIngredient): self
    {
        if ($this->dishIngredients->removeElement($dishIngredient)) {
            // set the owning side to null (unless already changed)
            if ($dishIngredient->getDish() === $this) {
                $dishIngredient->setDish(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, RecipeComment>
     */
    public function getRecipeComments(): Collection
    {
        return $this->recipeComments;
    }

    public function addRecipeComment(RecipeComment $recipeComment): self
    {
        if (!$this->recipeComments->contains($recipeComment)) {
            $this->recipeComments->add($recipeComment);
            $recipeComment->setDish($this);
        }

        return $this;
    }

    public function removeRecipeComment(RecipeComment $recipeComment): self
    {
        if ($this->recipeComments->removeElement($recipeComment)) {
            // set the owning side to null (unless already changed)
            if ($recipeComment->getDish() === $this) {
                $recipeComment->setDish(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Tag>
     */
    public function getTags(): Collection
    {
        return $this->tags;
    }

    public function addTag(Tag $tag): self
    {
        if (!$this->tags->contains($tag)) {
            $this->tags->add($tag);
        }

        return $this;
    }

    public function removeTag(Tag $tag): self
    {
        $this->tags->removeElement($tag);

        return $this;
    }
}
