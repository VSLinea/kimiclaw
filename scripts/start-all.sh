#!/bin/bash
set -e

echo "=== Foundation Platform Auto-Setup ==="

# Start infrastructure
echo "Starting PostgreSQL and Redis..."
cd /workspaces/kimiclaw/infra
docker-compose up -d postgres redis

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
sleep 5
until docker exec $(docker ps -q -f name=postgres) pg_isready -U postgres 2>/dev/null; do
    echo "  Waiting..."
    sleep 2
done
echo "✓ PostgreSQL ready"

# Setup backend
echo "Setting up backend..."
cd /workspaces/kimiclaw/services/api
npm install 2>/dev/null || true

# Create .env if needed
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠ Created .env - please add Clerk credentials"
fi

# Run migrations
npx prisma migrate deploy 2>/dev/null || npm run db:migrate 2>/dev/null || echo "Migrations may need manual run"

# Start backend
echo "Starting backend..."
nohup npm run dev > /tmp/backend.log 2>&1 &
sleep 3

# Check if running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ Backend running at http://localhost:3000"
    echo "✓ API Docs at http://localhost:3000/documentation"
else
    echo "⚠ Backend starting... (tail -f /tmp/backend.log)"
fi

echo ""
echo "=== Status ==="
docker-compose -f /workspaces/kimiclaw/infra/docker-compose.yml ps
echo ""
echo "Backend logs: tail -f /tmp/backend.log"
