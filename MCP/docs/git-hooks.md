# Git Hooks for Kanban MCP

This document describes the git hooks available for the Kanban MCP system, which enable automatic code indexing when you commit changes.

## Overview

The post-commit hook automatically detects file changes in your commits and triggers the MCP indexing system to update the code search index. This ensures that AI agents always have access to the most current codebase context.

## Features

- **Automatic Detection**: Uses `git diff-tree` to detect changed and deleted files
- **Background Execution**: Runs asynchronously to avoid blocking commits
- **Configurable**: Supports both environment variables and config files
- **Safe**: Only runs when properly configured, with graceful fallback
- **Cross-platform**: Works on Linux, macOS, and Windows (with Git Bash)

## Installation

### Quick Install

From the repository root:

```bash
cd MCP/scripts
./install-hooks.sh
```

This will:
1. Copy the post-commit hook to `.git/hooks/`
2. Make it executable
3. Backup any existing post-commit hook
4. Show configuration status

### Manual Install

If you prefer to install manually:

```bash
# From repository root
cp MCP/scripts/post-commit-hook.sh .git/hooks/post-commit
chmod +x .git/hooks/post-commit
```

## Configuration

The hook requires a `PROJECT_ID` to identify which Kanban project to update. You can configure this in two ways:

### Option 1: Environment Variable (Recommended for Personal Use)

Add to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
export KANBAN_PROJECT_ID=your-project-uuid-here
```

**Pros:**
- Per-user configuration
- Doesn't affect other developers
- Easy to change

**Cons:**
- Must be set in every environment
- Not automatically shared with team

### Option 2: .kanban File (Recommended for Team Use)

Create a `.kanban` file in your repository root:

```bash
echo 'PROJECT_ID=your-project-uuid-here' > .kanban
```

You can also include other configuration:

```
# Kanban MCP Configuration
PROJECT_ID=550e8400-e29b-41d4-a716-446655440000
# Optional: MCP server URL (if not using default)
# MCP_SERVER_URL=http://localhost:3000
```

**Pros:**
- Shared across team
- Version controlled (if desired)
- Automatically works for all team members

**Cons:**
- Contains project-specific ID
- May need to be gitignored for multi-project setups

**Important:** If your repository contains multiple projects, add `.kanban` to `.gitignore` and use environment variables instead.

## How It Works

1. **Trigger**: Git runs the hook after a successful commit
2. **Detection**: Hook uses `git diff-tree` to identify:
   - Changed files (modified or added)
   - Deleted files
3. **Background Processing**: Hook spawns a background process to:
   - Read PROJECT_ID from config
   - Collect file paths
   - Call MCP update_index tool
4. **Non-blocking**: Hook exits immediately, indexing continues in background

## File Detection Details

The hook uses two `git diff-tree` commands:

```bash
# Changed files (excludes deletions)
git diff-tree --no-commit-id --name-only --diff-filter=d -r HEAD

# Deleted files only
git diff-tree --no-commit-id --name-only --diff-filter=D -r HEAD
```

This ensures:
- Modified files are re-indexed
- New files are indexed
- Deleted files are removed from index

## Troubleshooting

### Hook Not Running

Check if the hook is executable:

```bash
ls -l .git/hooks/post-commit
# Should show: -rwxr-xr-x
```

If not:

```bash
chmod +x .git/hooks/post-commit
```

### PROJECT_ID Not Found

The hook will silently skip if PROJECT_ID is not configured. To verify:

```bash
# Check environment variable
echo $KANBAN_PROJECT_ID

# Check .kanban file
cat .kanban
```

### Debugging

To enable debug output, edit `.git/hooks/post-commit` and uncomment the debug line:

```bash
# Change this:
# echo "Kanban hook: PROJECT_ID not configured..." >&2

# To this:
echo "Kanban hook: PROJECT_ID not configured..." >&2
```

Then check the hook log:

```bash
cat MCP/hook.log
```

### MCP Server Not Found

If you see "MCP server not found", ensure you've built the MCP server:

```bash
cd MCP
npm install
npm run build
```

### Hook Conflicts

If you have an existing post-commit hook:

1. The installer backs it up to `.git/hooks/post-commit.backup.TIMESTAMP`
2. You can combine hooks by editing the installed hook
3. Add your existing hook's commands before or after the Kanban indexing

Example combined hook:

```bash
#!/bin/bash

# Existing hook functionality
./scripts/my-custom-hook.sh

# Kanban indexing (from post-commit-hook.sh)
# ... rest of Kanban hook code ...
```

## Performance Considerations

- **Background Execution**: Indexing runs in background, so commits are not slowed down
- **Selective Indexing**: Only changed/deleted files are processed, not entire codebase
- **Batch Processing**: Multiple files in a commit are batched together
- **Skip on Empty**: Hook exits immediately if no files changed

## Advanced Configuration

### Custom MCP Server Path

If your MCP server is in a non-standard location, you can modify the hook:

```bash
# Edit .git/hooks/post-commit
MCP_SERVER="/path/to/custom/mcp/server.js"
```

### File Filtering

To exclude certain files from indexing, modify the `git diff-tree` command:

```bash
# Example: Exclude .min.js files
CHANGED_FILES=$(git diff-tree --no-commit-id --name-only --diff-filter=d -r "$COMMIT_HASH" | grep -v '\.min\.js$' | tr '\n' ',' | sed 's/,$//')
```

### Logging

Adjust the log file location by editing the hook:

```bash
LOG_FILE="/custom/path/to/hook.log"
```

## Uninstalling

To remove the hook:

```bash
# Remove the hook
rm .git/hooks/post-commit

# Restore backup if desired
mv .git/hooks/post-commit.backup.TIMESTAMP .git/hooks/post-commit
```

## Future Enhancements

The current implementation is a foundation. Planned improvements:

1. **MCP Tool Integration**: Direct call to `update_index` MCP tool
2. **HTTP Endpoint**: REST API for hook to call
3. **Incremental Indexing**: Smart diff-based index updates
4. **Status Reporting**: Notifications on indexing completion
5. **Pre-commit Validation**: Validate code before allowing commit
6. **Webhook Support**: Trigger CI/CD pipelines on successful index

## Security Considerations

- **Script Injection**: Hook validates all input from git commands
- **Path Traversal**: Uses git root to constrain file paths
- **Execution Safety**: Runs in background with proper error handling
- **Config Isolation**: PROJECT_ID is isolated per user/repo

## Getting Help

If you encounter issues:

1. Check this documentation
2. Review the hook log: `MCP/hook.log`
3. Test the hook manually: `.git/hooks/post-commit`
4. Review MCP server logs: `MCP/debug.log`
5. Open an issue in the project repository

## Related Documentation

- [MCP Server README](../README.md)
- [Project Memory System](../../docs/PRD_ORCHESTRATOR_DASHBOARD.md)
- [Semantic Code Search](../src/services/index-project.ts)
