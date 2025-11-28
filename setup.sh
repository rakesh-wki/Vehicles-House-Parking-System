#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Installing backend dependencies..."
npm install --no-audit --no-fund

if [ -d "frontend" ]; then
  echo "Installing frontend dependencies..."
  (cd frontend && npm install --no-audit --no-fund)
fi

# Create .env from example and generate JWT secret if needed
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "Created .env from .env.example"

  if grep -q "replace_with_secure_random_hex_64" .env 2>/dev/null; then
    if command -v node >/dev/null 2>&1; then
      SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    elif command -v openssl >/dev/null 2>&1; then
      SECRET=$(openssl rand -hex 32)
    else
      SECRET="replace_with_secure_random_hex_64"
    fi

    if [ "$SECRET" != "replace_with_secure_random_hex_64" ]; then
      sed "s/^JWT_SECRET=.*/JWT_SECRET=$SECRET/" .env > .env.tmp && mv .env.tmp .env
      echo "Generated strong JWT_SECRET and saved to .env"
    fi
  fi
fi

echo "Setup complete. Edit .env if necessary and run ./start.sh"
