#!/bin/bash
# Foundation Platform Setup Script
# Run this in your Codespace to create all files

set -e

echo "=== Setting up Foundation Platform ==="

# Create directory structure
mkdir -p apps/mobile/lib/features/{auth,hello_entities}/{data,domain/{models,usecases},presentation/{providers,screens}}
mkdir -p apps/mobile/lib/core/{network,router,theme}
mkdir -p services/api/src/{auth,rbac,audit,hello-entities,health,config,prisma}
mkdir -p infra scripts docs .github/workflows .github/ISSUE_TEMPLATE

echo "Directory structure created"

# The rest of this script would contain all file contents...
# For now, this is a placeholder showing the approach

echo "=== Setup Complete ==="
echo "Next: Copy individual file contents from the assistant"
