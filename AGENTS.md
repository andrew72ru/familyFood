# AGENTS.md

## Stack overview

- **Backend**: Symfony 7.4 (PHP 8.3+), API Platform 4.2, Doctrine ORM 3.x, PostgreSQL 16
- **Frontend**: React 19 (create-react-app), TypeScript 4.9, Bootstrap 5, React Router 6
- **Real-time**: Mercure hub (Docker)
- **Auth**: JWT (Lexik bundle) with refresh-token flow
- **Deploy**: Ansible, capistrano-style releases under `/var/www/family_food/`

## One-time local setup

1. `composer install`
2. `docker-compose up -d` — starts Postgres, Mercure, Caddy, and an auto-restore service
3. `php bin/console doctrine:migrations:migrate` (only if the restore service did **not** seed the DB)
4. `cd frontend && npm install`

The `restore` container in `docker-compose.yaml` auto-imports `.docker/dev/pgsql/family_food.dump` when the DB is empty.

## Daily dev commands

### Backend

| Task                | Command                                                          |
|---------------------|------------------------------------------------------------------|
| Start local backend | `symfony serve` **or** any PHP server on `public/index.php`      |
| Run all tests       | `vendor/bin/phpunit` (reads `phpunit.dist.xml`)                  |
| Run single test     | `vendor/bin/phpunit tests/Path/To/Test.php`                      |
| Static analysis     | `vendor/bin/psalm` (config: `psalm.xml`, level 3)                |
| Lint / fix PHP      | `vendor/bin/php-cs-fixer fix` (config: `.php-cs-fixer.dist.php`) |
| Migrations          | `php bin/console doctrine:migrations:migrate`                    |
| Console             | `php bin/console <command>`                                      |

### Frontend

| Task       | Command                                                                                                     |
|------------|-------------------------------------------------------------------------------------------------------------|
| Dev server | `cd frontend && npm start` (serves on `https://localhost` via Caddy; `BROWSER=none` is set in package.json) |
| Build      | `cd frontend && npm run build`                                                                              |
| Tests      | `cd frontend && npm test` (Jest via react-scripts, interactive)                                             |
| Lint       | `cd frontend && npm run lint` **or** `npm run lint:fix`                                                     |
| Format     | `cd frontend && npm run format` (Prettier)                                                                  |

## Environment & services

- `.env.local` is already committed and contains local dev secrets (DB URL, JWT keys, OpenAI keys). Do **not** treat it as uncommitted.
- `.env.dev` and `.env.test` both point to `postgresql://app:app-password@127.0.0.1:5432/app`.
- Caddy container proxies `https://localhost` (ports 80/443) to the backend/app directory.
- Mercure hub runs in Docker; local publisher/subscriber JWT keys are hard-coded in `docker-compose.yaml`.

## Testing requirements

- PHPUnit requires a running PostgreSQL instance (the Docker `database` service).
- The test env is forced to `APP_ENV=test` in `phpunit.dist.xml`.
- Deprecations are disabled (`SYMFONY_DEPRECATIONS_HELPER=disabled`) — do not fail builds on them.
- Test bootstrap: `tests/bootstrap.php` loads `.env` via Symfony Dotenv.

## Code style

### PHP

- PHP-CS-Fixer extends `@Symfony` with notable overrides:
  - `concat_space` → `one`
  - `yoda_style` → `false`
  - `group_import` → `true`
  - `blank_line_after_opening_tag` / `linebreak_after_opening_tag` → `false`
  - `new_with_braces` → `false`
  - `single_import_per_statement` → `false`
  - `native_function_invocation` includes `@internal` functions
- Psalm suppresses `ClassMustBeFinal` inside `src/Entity`.

### Frontend

- Prettier: `singleQuote: true`, `trailingComma: all`, `printWidth: 120`, `tabWidth: 2`
- ESLint extends `react-app`, `react-app/jest`, `plugin:prettier/recommended`

## Architecture notes

- API resources live in `src/ApiResource/`; Doctrine entities in `src/Entity/`.
- The frontend does **not** rely heavily on `@api-platform/client-generator`. It uses a hand-rolled `frontend/src/api.ts` that:
  - Handles JWT access-token refresh automatically
  - Redirects to login on 401 (unless `IS_PUBLIC_APP`)
  - Sets `Accept: application/ld+json` and `Content-Type: application/merge-patch+json` for PATCH
- OpenAI prompts are configured via `OPENAI_PROMPT` / `OPENAI_EXTRACT_PROMPT` env vars (prompt IDs, not raw text).
- Symfony Messenger transport defaults to `doctrine://default?auto_setup=0`.

## Deployment

- Production deploy: `ansible-playbook -i ansible/inventories/production/hosts.yml deploy/deploy.yml`
- The playbook clones the repo, installs Composer + npm dependencies, builds the frontend, runs migrations, warms cache, updates the `current` symlink, and reloads Caddy + Messenger.
- See `deploy/README.md` and `ansible/README.md` for server provisioning details.
