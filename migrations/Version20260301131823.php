<?php declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260301131823 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remove an ingredient without error';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE dish_ingredient DROP CONSTRAINT fk_77196056933fe08c');
        $this->addSql('ALTER TABLE dish_ingredient ADD CONSTRAINT FK_77196056933FE08C FOREIGN KEY (ingredient_id) REFERENCES ingredient (id) ON DELETE CASCADE NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE dish_ingredient DROP CONSTRAINT FK_77196056933FE08C');
        $this->addSql('ALTER TABLE dish_ingredient ADD CONSTRAINT fk_77196056933fe08c FOREIGN KEY (ingredient_id) REFERENCES ingredient (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }
}
