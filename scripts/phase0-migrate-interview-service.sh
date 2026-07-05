#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -d "services/interview-service/src" ]; then
  echo "services/interview-service already exists — skipping move."
  exit 0
fi

if [ ! -d "apps/backend/src" ]; then
  echo "apps/backend not found — nothing to migrate."
  exit 1
fi

echo "Moving apps/backend → services/interview-service..."
mkdir -p services
mv apps/backend services/interview-service

mkdir -p apps/backend
cat > apps/backend/package.json <<'EOF'
{
  "name": "backend-deprecated-stub",
  "private": true,
  "scripts": {
    "dev": "echo 'Use services/interview-service or apps/gateway. See docs/PHASE0.md' && exit 1"
  }
}
EOF

cat > apps/backend/README.md <<'EOF'
# Deprecated

Interview service moved to `services/interview-service`.

See `docs/PHASE0.md` for run instructions.
EOF

echo "Done. Update your dev commands to use services/interview-service."
