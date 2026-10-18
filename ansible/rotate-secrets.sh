#!/usr/bin/env bash

# 1. JWT Passphrase
JWT_PASSPHRASE=$(openssl rand -hex 32)

# 2. JWT Private Key (encrypted, 4096-bit RSA)
openssl genrsa -aes256 -passout pass:"$JWT_PASSPHRASE" -out /tmp/jwt_private.pem 4096

# 3. JWT Public Key
openssl rsa -in /tmp/jwt_private.pem -passin pass:"$JWT_PASSPHRASE" -pubout -out /tmp/jwt_public.pem 2>/dev/null

# 4. Base64-encode keys (single line, as in your secrets.yml)
JWT_SECRET_KEY=$(cat /tmp/jwt_private.pem | base64 | tr -d '\n')
JWT_PUBLIC_KEY=$(cat /tmp/jwt_public.pem | base64 | tr -d '\n')

# 5. Mercure keys (32+ bytes, base64)
MERCURE_PUBLISHER_JWT_KEY=$(openssl rand -base64 32)
MERCURE_SUBSCRIBER_JWT_KEY=$(openssl rand -base64 32)

# Output
echo "============================================"
echo "=== Copy this to ansible/vars/secrets.yml ==="
echo "============================================"
echo
echo "jwt_passphrase: \"$JWT_PASSPHRASE\""
echo
echo "jwt_private_key: \"$JWT_SECRET_KEY\""
echo
echo "jwt_public_key: \"$JWT_PUBLIC_KEY\""
echo
echo "mercure_publisher_jwt_key: \"$MERCURE_PUBLISHER_JWT_KEY\""
echo
echo "mercure_subscriber_jwt_key: \"$MERCURE_SUBSCRIBER_JWT_KEY\""

# Cleanup temp files
rm -f /tmp/jwt_private.pem /tmp/jwt_public.pem
