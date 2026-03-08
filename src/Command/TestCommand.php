<?php declare(strict_types=1);

namespace App\Command;

use App\Entity\Dish;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Exception\RuntimeException;
use Symfony\Component\Console\Input\{InputArgument, InputInterface};
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:test-command',
    description: 'Dev-test command',
)]
final class TestCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
        parent::__construct();
    }

    #[\Override]
    protected function configure(): void
    {
        $this->addArgument('id', InputArgument::OPTIONAL);
    }

    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $id = $input->getArgument('id');
        if (!\is_numeric($id)) {
            $id = $this->getRandomId();
        }
        $dish = $this->em->getRepository(Dish::class)->find($id);
        if (!$dish instanceof Dish) {
            throw new RuntimeException('Dish not found');
        }

        return Command::SUCCESS;
    }

    private function getRandomId(): int
    {
        $arr = $this->em->getRepository(Dish::class)->createQueryBuilder('d')
            ->select('d.id')->getQuery()->getSingleColumnResult();

        $key = \array_rand($arr);

        return $arr[$key];
    }
}
