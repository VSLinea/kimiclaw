#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Starting Foundation Web IDE & Git Server ==="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Error: Docker Compose is not installed"
    exit 1
fi

# Determine docker compose command
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

cd "$PROJECT_ROOT/infra"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Web IDE Configuration
CODE_SERVER_PASSWORD=admin
CODE_SERVER_SUDO_PASSWORD=admin

# Gitea Configuration
GITEA_DOMAIN=localhost
GITEA_ROOT_URL=http://localhost:3001
EOF
fi

# Start the services
echo "Starting services..."
$COMPOSE_CMD -f docker-compose.web.yml up -d

echo ""
echo "=== Services starting ==="
echo ""
echo "Waiting for services to be ready..."
sleep 5

# Check service health
echo ""
echo "Checking service health..."

# Check Gitea
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✓ Gitea (Git Web UI) is running at http://localhost:3001"
else
    echo "⚠ Gitea is starting (may take a minute)..."
fi

# Check Code Server
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✓ Code Server (Web IDE) is running at http://localhost:8080"
else
    echo "⚠ Code Server is starting (may take a minute)..."
fi

echo ""
echo "=== Access Information ==="
echo ""
echo "Web IDE (VS Code in Browser):"
echo "  URL:      http://localhost:8080"
echo "  Password: $(grep CODE_SERVER_PASSWORD .env | cut -d= -f2)"
echo ""
echo "Git Web Interface (Gitea):"
echo "  URL:      http://localhost:3001"
echo "  Note:     Create an account on first visit"
echo ""
echo "Nginx Reverse Proxy (with Basic Auth):"
echo "  Git:      http://localhost (server_name git.*)"
echo "  IDE:      http://localhost (server_name ide.*)"
echo "  Username: admin"
echo "  Password: $(grep -oP 'admin:\K[^:]*' htpasswd | head -1 || echo 'admin')"
echo ""
echo "=== Commands ==="
echo ""
echo "View logs:"
echo "  $COMPOSE_CMD -f docker-compose.web.yml logs -f"
echo ""
echo "Stop services:"
echo "  $COMPOSE_CMD -f docker-compose.web.yml down"
echo ""
echo "Restart services:"
echo "  $COMPOSE_CMD -f docker-compose.web.yml restart"
echo ""
