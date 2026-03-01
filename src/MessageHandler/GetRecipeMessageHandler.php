<?php declare(strict_types=1);

namespace App\MessageHandler;

use App\Dto\Message\GetRecipeRequestDto;
use App\Repository\DishRepository;
use App\Service\OpenAiService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final readonly class GetRecipeMessageHandler
{
    public function __construct(
        private OpenAiService $openAiService,
        private DishRepository $dishRepository,
        private EntityManagerInterface $entityManager,
    ) {
    }

    public function __invoke(GetRecipeRequestDto $message): void
    {
        $dish = $this->dishRepository->find($message->getDishId());

        if (!$dish) {
            return;
        }

        $recipeResponse = $this->openAiService->getRecipeForDish($dish->getName() ?? '');
        $recipeText = $recipeResponse->getFirstMessageText();

        if ($recipeText !== '') {
            $dish->getRecipe()->setText($recipeText);
            $this->entityManager->flush();
        }
    }
}
