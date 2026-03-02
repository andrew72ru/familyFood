<?php declare(strict_types=1);

namespace App\MessageHandler;

use App\Dto\Message\ExtractIngredientsRequestDto;
use App\Entity\{DishIngredient, Ingredient};
use App\Repository\{DishRepository, IngredientRepository};
use App\Service\ExtractIngredients;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class ExtractIngredientsMessageHandler
{
    public function __construct(
        private ExtractIngredients $extractIngredients,
        private DishRepository $dishRepository,
        private IngredientRepository $ingredientRepository,
        private EntityManagerInterface $entityManager,
    ) {
    }

    public function __invoke(ExtractIngredientsRequestDto $message): void
    {
        $dish = $this->dishRepository->find($message->getDishId());

        if (!$dish) {
            return;
        }

        $recipeText = $dish->getRecipe()->getText();

        if (!$recipeText) {
            return;
        }

        $ingredientNames = $this->extractIngredients->extract($recipeText);

        if (empty($ingredientNames)) {
            return;
        }

        foreach ($ingredientNames as $name) {
            $ingredient = $this->ingredientRepository->findOneBy(['name' => $name]);

            if (!$ingredient) {
                $ingredient = (new Ingredient())->setName($name);
                $this->entityManager->persist($ingredient);
            }

            // Check if this ingredient is already attached to the dish
            $alreadyAttached = false;
            foreach ($dish->getDishIngredients() as $dishIngredient) {
                if ($dishIngredient->getIngredient() === $ingredient) {
                    $alreadyAttached = true;
                    break;
                }
            }

            if (!$alreadyAttached) {
                $dishIngredient = (new DishIngredient())
                    ->setDish($dish)
                    ->setIngredient($ingredient);

                $this->entityManager->persist($dishIngredient);
                $dish->addDishIngredient($dishIngredient);
            }
        }

        $this->entityManager->flush();
    }
}
