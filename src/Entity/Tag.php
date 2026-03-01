<?php declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata as API;
use App\Repository\TagRepository;
use Doctrine\Common\Collections\{ArrayCollection, Collection};
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TagRepository::class)]
#[API\ApiResource]
#[API\GetCollection, API\Get, API\Post, API\Patch, API\Delete]
#[UniqueEntity('name')]
class Tag
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private int | null $id = null;

    #[ORM\Column(length: 255, unique: true)]
    #[Assert\NotBlank]
    private string | null $name = null;

    /**
     * @var Collection<int, Dish>
     */
    #[ORM\ManyToMany(targetEntity: Dish::class, mappedBy: 'tags')]
    private Collection $dishes;

    public function __construct()
    {
        $this->dishes = new ArrayCollection();
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
     * @return Collection<int, Dish>
     */
    public function getDishes(): Collection
    {
        return $this->dishes;
    }

    public function addDish(Dish $dish): self
    {
        if (!$this->dishes->contains($dish)) {
            $this->dishes->add($dish);
            $dish->addTag($this);
        }

        return $this;
    }

    public function removeDish(Dish $dish): self
    {
        if ($this->dishes->removeElement($dish)) {
            $dish->removeTag($this);
        }

        return $this;
    }
}
