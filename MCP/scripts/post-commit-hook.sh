#!/bin/bash
# Git post-commit hook for Kanban MCP automatic indexing
# This hook automatically updates the code index when you commit changes
# so that agents always have access to the latest context.

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration
# Try to read PROJECT_ID from environment variable first
PROJECT_ID="${KANBAN_PROJECT_ID:-}"

# If not in environment, try to read from .kanban file in repo root
if [ -z "$PROJECT_ID" ]; then
    REPO_ROOT=$(git rev-parse --show-toplevel)
    KANBAN_FILE="$REPO_ROOT/.kanban"

    if [ -f "$KANBAN_FILE" ]; then
        # Read PROJECT_ID from .kanban file (assumes format: PROJECT_ID=xxx)
        PROJECT_ID=$(grep -E '^PROJECT_ID=' "$KANBAN_FILE" | cut -d'=' -f2 | tr -d ' "'"'"'')
    fi
fi

# If still no PROJECT_ID, exit silently (hook not configured)
if [ -z "$PROJECT_ID" ]; then
    # Uncomment the line below for debugging
    # echo "Kanban hook: PROJECT_ID not configured. Set KANBAN_PROJECT_ID env var or create .kanban file." >&2
    exit 0
fi

# Get the latest commit hash
COMMIT_HASH=$(git rev-parse HEAD)

# Get changed and deleted files from the commit
# --name-only shows only file names
# --diff-filter=d excludes deleted files for changed list
# --diff-filter=D shows only deleted files
CHANGED_FILES=$(git diff-tree --no-commit-id --name-only --diff-filter=d -r "$COMMIT_HASH" | tr '\n' ',' | sed 's/,$//')
DELETED_FILES=$(git diff-tree --no-commit-id --name-only --diff-filter=D -r "$COMMIT_HASH" | tr '\n' ',' | sed 's/,$//')

# Only proceed if there are changes
if [ -z "$CHANGED_FILES" ] && [ -z "$DELETED_FILES" ]; then
    exit 0
fi

# Get the repo root path
REPO_PATH=$(git rev-parse --show-toplevel)

# Function to call the MCP update_index tool
update_index() {
    # Determine the MCP server path
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    MCP_DIR="$(dirname "$SCRIPT_DIR")"
    MCP_SERVER="$MCP_DIR/dist/index.js"

    # Check if MCP server exists
    if [ ! -f "$MCP_SERVER" ]; then
        echo "Warning: MCP server not found at $MCP_SERVER" >&2
        echo "Please build the MCP server with: cd $MCP_DIR && npm run build" >&2
        return 1
    fi

    # Construct the update payload
    # Note: This is a placeholder for the actual MCP call
    # In a real implementation, you would call the MCP server with the appropriate protocol
    # For now, we'll create a simple log entry

    LOG_FILE="$MCP_DIR/hook.log"
    echo "[$(date -Iseconds)] Commit $COMMIT_HASH - Changed: $CHANGED_FILES | Deleted: $DELETED_FILES" >> "$LOG_FILE"

    # TODO: Implement actual MCP call when update_index tool is available
    # This could be done via:
    # 1. HTTP endpoint (if server runs as HTTP)
    # 2. CLI wrapper that communicates via stdio
    # 3. Direct database call (if bypassing MCP)

    # For now, log the intent
    echo "Kanban: Would update index for project $PROJECT_ID" >&2
    echo "  Repository: $REPO_PATH" >&2
    echo "  Changed files: ${CHANGED_FILES:-none}" >&2
    echo "  Deleted files: ${DELETED_FILES:-none}" >&2
}

# Run the update in the background so it doesn't block the commit
# Redirect output to avoid cluttering the commit message
(update_index >> /dev/null 2>&1) &

# Exit successfully
exit 0
