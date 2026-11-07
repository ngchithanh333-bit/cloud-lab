#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Codespaces secrets may supply MONGODB_URI instead of a local .env file.
if [[ ! -f mern-demo/.env ]]; then
  if [[ -z "${MONGODB_URI:-}" ]]; then
    echo "Set MONGODB_URI as a Codespaces secret or create mern-demo/.env before running." >&2
    exit 1
  fi
  (umask 077; printf 'MONGODB_URI=%s\nPORT=5000\n' "$MONGODB_URI" > mern-demo/.env)
fi

docker --version
docker compose version
docker compose -f docker-compose.hub.yml config --quiet
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d --no-build --wait --wait-timeout 120
docker compose -f docker-compose.hub.yml ps
echo "Open port 5173 from Codespaces PORTS. Local URL: http://localhost:5173"
