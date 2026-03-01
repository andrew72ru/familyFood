# Ansible Playbooks for FamilyFood

This directory contains Ansible playbooks to configure a Ubuntu LTS server for the FamilyFood application (Symfony 7.4 + React + PostgreSQL 16).

## Structure

- `ansible.cfg`: Configuration for Ansible.
- `playbook.yml`: The main entry point for configuring the server.
- `inventories/production/`: Inventory files for production.
- `roles/`: reusable components for server configuration (common, php, postgresql, nodejs, caddy, app_setup).
- `vars/secrets.yml`: **(Ignored by git)** Store sensitive information like database passwords and app secrets here.

## Prerequisites

- Ansible installed on your local machine.
- A target server with Ubuntu LTS and SSH access for the `ubuntu` user (or change `remote_user` in `ansible.cfg`).

## Usage

1.  **Configure secrets**:
    Copy `vars/secrets.yml` (if it doesn't exist) and fill in the values:
    ```yaml
    ssh_user: "ubuntu"
    server_ip: "0.0.0.0"
    app_domain: "example.com"
    db_name: "family_food"
    db_user: "app_user"
    db_password: "YOUR_SECURE_PASSWORD"
    app_secret: "YOUR_SYMFONY_APP_SECRET"
    ```

2.  **Update variables**:
    Variables that are not sensitive (like versions) can be found in `inventories/production/group_vars/all.yml`.

3.  **Run the playbook**:
    ```bash
    ansible-playbook playbook.yml
    ```

### Running Specific Tasks (Manual Only)

Some tasks are marked as `never` and must be run manually using specific tags.

#### Symfony Messenger Setup
To deploy and enable the Symfony Messenger systemd unit (e.g., for processing async messages), use the `messenger-setup` tag:

```bash
ansible-playbook playbook.yml --tags "messenger-setup"
```

## Technologies Configured

- **PHP 8.3** (with FPM, CLI, and essential extensions)
- **PostgreSQL 16** (official repository)
- **Caddy** (with automatic SSL via Let's Encrypt and PHP-FPM support)
- **Node.js 20.x** (for frontend builds)
- **Composer** (latest version)
- **ACL & Permissions** (set up for Symfony `var/` directory)
- **UFW Firewall** (OpenSSH, HTTP, and HTTPS allowed)
