<?php declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260301092443 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Fix relation';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DROP INDEX uniq_77196056933fe08c');
        $this->addSql('CREATE INDEX IDX_77196056933FE08C ON dish_ingredient (ingredient_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX IDX_77196056933FE08C');
        $this->addSql('CREATE UNIQUE INDEX uniq_77196056933fe08c ON dish_ingredient (ingredient_id)');
    }
}
