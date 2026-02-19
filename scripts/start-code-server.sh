#!/bin/bash

# Code Server startup script for Foundation project

CODE_SERVER_BIN="$HOME/.local/bin/bin/code-server"
WORKSPACE_DIR="/root/.openclaw/workspace"
PASSWORD="${CODE_SERVER_PASSWORD:-admin}"
PORT="${CODE_SERVER_PORT:-8080}"

# Export password for code-server
export PASSWORD

echo "=== Starting Code Server ==="
echo "Workspace: $WORKSPACE_DIR"
echo "Port: $PORT"
echo "Password: $PASSWORD"
echo ""

exec "$CODE_SERVER_BIN" \
    --auth password \
    --bind-addr "0.0.0.0:$PORT" \
    --disable-telemetry \
    --disable-update-check \
    "$WORKSPACE_DIR"
