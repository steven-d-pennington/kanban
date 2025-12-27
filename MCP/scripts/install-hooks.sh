#!/bin/bash
# Installation script for Kanban MCP git hooks
# This script installs the post-commit hook into your repository

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the repository root
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

if [ -z "$REPO_ROOT" ]; then
    echo -e "${RED}Error: Not in a git repository${NC}" >&2
    exit 1
fi

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
HOOK_SOURCE="$SCRIPT_DIR/post-commit-hook.sh"
HOOKS_DIR="$REPO_ROOT/.git/hooks"
HOOK_DEST="$HOOKS_DIR/post-commit"

# Check if source hook exists
if [ ! -f "$HOOK_SOURCE" ]; then
    echo -e "${RED}Error: Hook source not found at $HOOK_SOURCE${NC}" >&2
    exit 1
fi

# Create hooks directory if it doesn't exist
if [ ! -d "$HOOKS_DIR" ]; then
    echo -e "${RED}Error: .git/hooks directory not found${NC}" >&2
    echo "Are you in a git repository?" >&2
    exit 1
fi

# Backup existing hook if it exists
if [ -f "$HOOK_DEST" ]; then
    BACKUP="$HOOK_DEST.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}Backing up existing hook to $BACKUP${NC}"
    mv "$HOOK_DEST" "$BACKUP"
fi

# Copy the hook
echo "Installing post-commit hook..."
cp "$HOOK_SOURCE" "$HOOK_DEST"

# Make it executable
chmod +x "$HOOK_DEST"

echo -e "${GREEN}✓ Post-commit hook installed successfully!${NC}"
echo ""
echo "Configuration:"
echo "  Hook location: $HOOK_DEST"
echo ""
echo "To configure the hook, you have two options:"
echo ""
echo "  1. Set environment variable (recommended for personal use):"
echo "     export KANBAN_PROJECT_ID=your-project-uuid"
echo ""
echo "  2. Create .kanban file in repository root (recommended for team use):"
echo "     echo 'PROJECT_ID=your-project-uuid' > $REPO_ROOT/.kanban"
echo ""

# Check if .kanban exists
if [ -f "$REPO_ROOT/.kanban" ]; then
    PROJECT_ID=$(grep -E '^PROJECT_ID=' "$REPO_ROOT/.kanban" | cut -d'=' -f2 | tr -d ' "'"'"'')
    if [ -n "$PROJECT_ID" ]; then
        echo -e "${GREEN}✓ Found PROJECT_ID in .kanban: $PROJECT_ID${NC}"
    else
        echo -e "${YELLOW}⚠ .kanban file exists but PROJECT_ID not found${NC}"
    fi
elif [ -n "$KANBAN_PROJECT_ID" ]; then
    echo -e "${GREEN}✓ Using PROJECT_ID from environment: $KANBAN_PROJECT_ID${NC}"
else
    echo -e "${YELLOW}⚠ PROJECT_ID not configured yet${NC}"
    echo "The hook will not run until you configure a PROJECT_ID"
fi

echo ""
echo "For more information, see: $SCRIPT_DIR/../docs/git-hooks.md"
