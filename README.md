# FamilyFood

FamilyFood is a full-stack web application designed for managing recipes, ingredients, and meal planning. It features a robust PHP-based backend using Symfony and API Platform, and a modern frontend built with React and TypeScript.

## Key Features

- **Recipe Management**: Create, read, update, and delete recipes.
- **Ingredient Tracking**: Manage a comprehensive list of ingredients and their associations with dishes.
- **Social Interaction**: Commenting systems for recipes and ingredients.
- **Categorization**: Use tags to organize recipes and dishes.
- **API-First Design**: Fully exposed REST API using API Platform.

## Technology Stack

### Backend
- **Framework**: PHP 8.3+ with [Symfony 7.4](https://symfony.com/)
- **API**: [API Platform 4.2](https://api-platform.com/)
- **ORM**: Doctrine ORM 3.x
- **Database**: PostgreSQL 16 (running via Docker)
- **Static Analysis**: Psalm
- **Testing**: PHPUnit 12

### Frontend
- **Framework**: [React 19](https://reactjs.org/)
- **Language**: [TypeScript 4.9](https://www.typescriptlang.org/)
- **UI Components**: Bootstrap 5 & React-Bootstrap
- **Routing**: React Router 7
- **State/Data**: API Platform client generator integrations

### Infrastructure & Deployment
- **Containerization**: Docker & Docker Compose
- **Provisioning & Deployment**: Ansible

## Project Structure

```text
.
├── ansible/          # Ansible playbooks and roles for deployment
├── bin/              # Symfony console and executable scripts
├── config/           # Symfony application configuration
├── frontend/         # React/TypeScript frontend application
├── migrations/       # Doctrine database migrations
├── public/           # Web server entry point (index.php) and assets
├── src/              # PHP source code (Entities, Controllers, Services, etc.)
│   ├── ApiResource/  # API Platform resources
│   ├── Controller/   # Custom Symfony controllers
│   ├── Entity/       # Doctrine entities (Dish, Recipe, Ingredient, etc.)
│   ├── Repository/   # Doctrine repositories
│   └── Service/      # Business logic services
├── templates/        # Twig templates (mostly for admin/emails)
├── tests/            # PHPUnit tests
├── docker-compose.yaml # Docker configuration for database
├── composer.json     # PHP dependencies
└── package.json      # (if present in root, else see frontend/package.json)
```

## 🏁 Getting Started

### Prerequisites
- PHP 8.3 or higher
- Composer
- Node.js (v18+) & npm/yarn
- Docker & Docker Compose

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd FamilyFood
   ```

2. **Backend Setup:**
   ```bash
   composer install
   # Copy environment files and configure them
   cp .env .env.local
   # Start the database container
   docker-compose up -d
   # Run migrations
   php bin/console doctrine:migrations:migrate
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   ```

## Development

### Running the Backend
To start the Symfony server (if you have the [Symfony CLI](https://symfony.com/download) installed):
```bash
symfony serve
```
Alternatively, use a local PHP server or Docker-based setup.

### Running the Frontend
```bash
cd frontend
npm start
```
The frontend will be available at `http://localhost:3000`.

### Database & Tools
- **API Documentation**: Access the API Platform UI at `http://localhost:8000/api` (depending on your local server configuration).
- **Static Analysis**: `vendor/bin/psalm`
- **Coding Standards**: `vendor/bin/php-cs-fixer fix`

## Testing

### Backend Tests
```bash
vendor/bin/phpunit
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Deployment

The project uses Ansible for deployment. Configuration and playbooks can be found in the `ansible/` directory.

To deploy to production:
```bash
ansible-playbook -i ansible/inventories/production/hosts.yml ansible/playbook.yml
```
*(Refer to `ansible/README.md` for more details on server provisioning and secret management.)*
