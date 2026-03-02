# Deployment with Ansible

This directory contains the deployment playbook for the FamilyFood application.

## Prerequisites

- Ansible installed on your local machine.
- The server must be provisioned using the main playbook in the `ansible/` directory.
- Your SSH key must be added to the server's `ubuntu` user.

## Playbook Structure

The deployment follows a capistrano-style structure:
- `/var/www/family_food/releases/`: Contains timestamped folders for each release.
- `/var/www/family_food/shared/`: Contains persistent files (like `.env.local`).
- `/var/www/family_food/current`: A symlink to the latest release.

## How to Deploy

To deploy the latest version of the application:

```bash
ansible-playbook -i ansible/inventories/production/hosts.yml deploy/deploy.yml
```

## What the Playbook Does

1. **Creates release directories**: Prepares the structure for atomic deployment.
2. **Clones the repository**: Downloads the latest code from GitHub.
3. **Handles Secrets**:
   - Generates `.env.local` for Symfony using variables from `ansible/vars/secrets.yml`.
   - Generates `.env.local` for the React frontend with the correct API URL.
4. **Installs Dependencies**:
   - Runs `composer install` for the backend.
   - Runs `npm install` for the frontend.
5. **Builds Frontend**: Runs `npm run build` to generate static assets.
6. **Symfony Tasks**:
   - Installs assets (`php bin/console assets:install`).
   - Runs database migrations (`php bin/console doctrine:migrations:migrate`).
   - Warms up the cache (`php bin/console cache:warmup`).
7. **Atomic Symlink**: Updates the `current` symlink to the new release.
8. **Service Management**:
   - Reloads Caddy to serve the new release.
   - Restarts the Symfony Messenger service to pick up new code.
9. **Cleanup**: Keeps only the last 5 releases to save disk space.
