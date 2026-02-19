#!/bin/bash
set -e

echo "=== Foundation Platform Auto-Setup ==="

# Start infrastructure
echo "Starting PostgreSQL and Redis..."
cd /workspaces/kimiclaw/infra
docker-compose up -d postgres redis

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
sleep 3
until docker exec tasktracker-db pg_isready -U tasktracker 2>/dev/null; do
    echo "  Waiting..."
    sleep 2
done
echo "✓ PostgreSQL ready"

# Setup backend
echo "Setting up backend..."
cd /workspaces/kimiclaw/services/api

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    npm install
fi

# Generate Prisma client
npx prisma generate

# Create .env if needed
if [ ! -f ".env" ]; then
    cat > .env << 'ENVFILE'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://tasktracker:devpassword@localhost:5432/tasktracker?schema=public
JWT_SECRET=dev-jwt-secret-change-in-production
CLERK_SECRET_KEY=sk_test_change_this
CLERK_PUBLISHABLE_KEY=pk_test_change_this
ENVFILE
    echo "⚠ Created .env - please add Clerk credentials"
fi

# Run migrations
npx prisma migrate deploy

# Start backend
echo "Starting backend..."
pkill -f "tsx src/index.ts" 2>/dev/null || true
sleep 1
nohup npx tsx src/index.ts > /tmp/backend.log 2>&1 &
sleep 3

# Check if running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ Backend running at http://localhost:3000"
    echo "✓ API Docs at http://localhost:3000/docs"
else
    echo "⚠ Backend starting... (tail -f /tmp/backend.log)"
fi

echo ""
echo "=== Status ==="
docker-compose ps
echo ""
echo "Backend logs: tail -f /tmp/backend.log"
