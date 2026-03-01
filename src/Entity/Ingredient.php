<?php declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\IngredientRepository;
use Doctrine\Common\Collections\{ArrayCollection, Collection};
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: IngredientRepository::class)]
#[ApiResource]
final class Ingredient
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private int | null $id = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Assert\NotBlank]
    private string | null $name = null;

    /**
     * @var Collection<int, IngredientComment>
     */
    #[ORM\OneToMany(targetEntity: IngredientComment::class, mappedBy: 'ingredient')]
    private Collection $comments;

    public function __construct()
    {
        $this->comments = new ArrayCollection();
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
}
