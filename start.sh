#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Load .env into environment if present
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

echo "Starting server..."
if command -v nodemon >/dev/null 2>&1; then
  exec nodemon server.js
else
  exec node server.js
fi
