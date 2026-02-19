#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="/root/.openclaw/workspace"
BARE_REPO_DIR="/var/git/foundation.git"

echo "=== Setting up Git repository for web access ==="

# Create bare repository directory
sudo mkdir -p /var/git
sudo chown -R $(whoami):$(whoami) /var/git

# Create bare repository if it doesn't exist
if [ ! -d "$BARE_REPO_DIR" ]; then
    echo "Creating bare repository at $BARE_REPO_DIR..."
    git init --bare "$BARE_REPO_DIR"
    
    # Configure the bare repo
    cd "$BARE_REPO_DIR"
    git config http.receivepack true
    git config http.uploadpack true
fi

# Add the bare repo as a remote if not already added
cd "$REPO_DIR"
if ! git remote | grep -q "local"; then
    echo "Adding 'local' remote..."
    git remote add local "$BARE_REPO_DIR"
fi

# Push to the bare repository
echo "Pushing to bare repository..."
git push local master || git push local master --force

echo ""
echo "=== Git repository setup complete ==="
echo "Bare repository location: $BARE_REPO_DIR"
echo ""
echo "To clone this repository:"
echo "  git clone $BARE_REPO_DIR"
echo ""
echo "Or via HTTP (when Gitea is running):"
echo "  git clone http://localhost:3001/git/foundation.git"
