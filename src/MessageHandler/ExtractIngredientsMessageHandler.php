<?php declare(strict_types=1);

namespace App\MessageHandler;

use App\Dto\Message\ExtractIngredientsRequestDto;
use App\{Entity, Repository};
use App\Service\ExtractIngredients;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class ExtractIngredientsMessageHandler
{
    public function __construct(
        private ExtractIngredients $extractIngredients,
        private Repository\DishRepository $dishRepository,
        private Repository\IngredientRepository $ingredientRepository,
        private EntityManagerInterface $entityManager,
    ) {
    }

    public function __invoke(ExtractIngredientsRequestDto $message): void
    {
        $dish = $this->dishRepository->find($message->getDishId());

        if (!$dish instanceof Entity\Dish) {
            return;
        }

        $recipeText = $dish->getRecipe()->getText();

        if ($recipeText === null) {
            return;
        }

        $ingredientNames = $this->extractIngredients->extract($recipeText);

        if (empty($ingredientNames)) {
            return;
        }

        foreach ($ingredientNames as $name) {
            $ingredient = $this->ingredientRepository->findOneBy(['name' => $name]);

            if (!$ingredient instanceof Entity\Ingredient) {
                $ingredient = (new Entity\Ingredient())->setName($name);
                $this->entityManager->persist($ingredient);
            }

            // Check if this ingredient is already attached to the dish
            $alreadyAttached = false;
            foreach ($dish->getDishIngredients() as $dishIngredient) {
                if ($dishIngredient->getIngredient()?->getId() === $ingredient->getId()) {
                    $alreadyAttached = true;
                    break;
                }
            }

            if ($alreadyAttached === false) {
                $dishIngredient = (new Entity\DishIngredient())->setDish($dish)->setIngredient($ingredient);

                $this->entityManager->persist($dishIngredient);
                $dish->addDishIngredient($dishIngredient);
                $dish->setUpdatedAt(new \DateTimeImmutable());
            }
        }

        $this->entityManager->flush();
    }
}
