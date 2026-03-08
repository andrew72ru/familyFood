<?php declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\PartialSearchFilter;
use ApiPlatform\Metadata as API;
use App\Repository\IngredientRepository;
use Doctrine\Common\Collections\{ArrayCollection, Collection};
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: IngredientRepository::class)]
#[API\GetCollection(
    paginationClientEnabled: true,
    parameters: [
        'search[:property]' => new API\QueryParameter(filter: new PartialSearchFilter(), properties: ['name']),
    ],
)]
#[API\Get(mercure: true), API\Post, API\Patch(mercure: true), API\Delete]
class Ingredient
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    #[Groups(['ingredient:read'])]
    private int | null $id = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Assert\NotBlank]
    #[Groups(['ingredient:read'])]
    private string | null $name = null;

    /**
     * @var Collection<int, IngredientComment>
     */
    #[ORM\OneToMany(targetEntity: IngredientComment::class, mappedBy: 'ingredient', cascade: ['remove'], orphanRemoval: true)]
    private Collection $comments;

    #[ORM\Embedded]
    private Price $price;

    public function __construct()
    {
        $this->comments = new ArrayCollection();
        $this->price = new Price();
    }

    public function getId(): int | null
    {
        return $this->id;
    }

    public function getName(): string | null
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    /**
     * @return Collection<int, IngredientComment>
     */
    public function getComments(): Collection
    {
        return $this->comments;
    }

    public function addComment(IngredientComment $comment): static
    {
        if (!$this->comments->contains($comment)) {
            $this->comments->add($comment);
            $comment->setIngredient($this);
        }

        return $this;
    }

    public function removeComment(IngredientComment $comment): static
    {
        if ($this->comments->removeElement($comment)) {
            // set the owning side to null (unless already changed)
            if ($comment->getIngredient() === $this) {
                $comment->setIngredient(null);
            }
        }

        return $this;
    }

    public function getPrice(): Price
    {
        return $this->price;
    }

    public function setPrice(Price $price): static
    {
        $this->price = $price;

        return $this;
    }
}
