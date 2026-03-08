<?php declare(strict_types=1);

namespace App\EventListener;

use App\Entity\{Dish, DishIngredient, RecipeComment};
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Event\{PostPersistEventArgs, PostRemoveEventArgs, PostUpdateEventArgs};
use Doctrine\ORM\Events;
use Doctrine\Persistence\ObjectManager;

#[AsEntityListener(event: Events::postPersist, method: 'postPersist', entity: DishIngredient::class)]
#[AsEntityListener(event: Events::postRemove, method: 'postRemove', entity: DishIngredient::class)]
#[AsEntityListener(event: Events::postUpdate, method: 'postUpdate', entity: DishIngredient::class)]
#[AsEntityListener(event: Events::postPersist, method: 'postPersistComment', entity: RecipeComment::class)]
#[AsEntityListener(event: Events::postRemove, method: 'postRemoveComment', entity: RecipeComment::class)]
#[AsEntityListener(event: Events::postUpdate, method: 'postUpdateComment', entity: RecipeComment::class)]
final class DishIngredientListener
{
    private bool $isFlushing = false;

    public function postPersist(DishIngredient $dishIngredient, PostPersistEventArgs $event): void
    {
        $this->updateDish($dishIngredient->getDish(), $event->getObjectManager());
    }

    public function postRemove(DishIngredient $dishIngredient, PostRemoveEventArgs $event): void
    {
        $this->updateDish($dishIngredient->getDish(), $event->getObjectManager());
    }

    public function postUpdate(DishIngredient $dishIngredient, PostUpdateEventArgs $event): void
    {
        $this->updateDish($dishIngredient->getDish(), $event->getObjectManager());
    }

    public function postPersistComment(RecipeComment $comment, PostPersistEventArgs $event): void
    {
        $this->updateDish($comment->getDish(), $event->getObjectManager());
    }

    public function postRemoveComment(RecipeComment $comment, PostRemoveEventArgs $event): void
    {
        $this->updateDish($comment->getDish(), $event->getObjectManager());
    }

    public function postUpdateComment(RecipeComment $comment, PostUpdateEventArgs $event): void
    {
        $this->updateDish($comment->getDish(), $event->getObjectManager());
    }

    private function updateDish(Dish | null $dish, ObjectManager $em): void
    {
        if ($this->isFlushing || $dish === null) {
            return;
        }

        $this->isFlushing = true;
        try {
            $dish->setUpdatedAt(new \DateTimeImmutable());
            $em->persist($dish);
            $em->flush();
        } finally {
            $this->isFlushing = false;
        }
    }
}
