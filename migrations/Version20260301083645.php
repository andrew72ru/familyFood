<?php declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260301083645 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Price for an ingredient';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            ALTER TABLE ingredient ADD price_integer INT DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE ingredient ADD price_string VARCHAR(255) DEFAULT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            ALTER TABLE ingredient DROP price_integer
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE ingredient DROP price_string
        SQL);
    }
}
