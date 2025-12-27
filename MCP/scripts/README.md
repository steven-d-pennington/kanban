# Kanban MCP Scripts

This directory contains utility scripts for the Kanban MCP system.

## Available Scripts

### post-commit-hook.sh

Git post-commit hook that automatically indexes code changes when you commit.

**Features:**
- Detects changed and deleted files using `git diff-tree`
- Runs in background to avoid blocking commits
- Reads PROJECT_ID from environment or `.kanban` file
- Logs activity for debugging

**Usage:**
This script is meant to be installed as a git hook. Use the installation script below.

### install-hooks.sh

Installation script for setting up git hooks in your repository.

**Usage:**
```bash
cd MCP/scripts
./install-hooks.sh
```

**What it does:**
- Copies the post-commit hook to `.git/hooks/`
- Makes the hook executable
- Backs up any existing post-commit hook
- Checks configuration status
- Shows next steps

### .kanban.example

Example configuration file for the git hooks.

**Usage:**
```bash
# Copy to repository root
cp MCP/scripts/.kanban.example .kanban

# Edit with your project ID
nano .kanban
```

## Quick Start

1. **Install the hook:**
   ```bash
   cd MCP/scripts
   ./install-hooks.sh
   ```

2. **Configure PROJECT_ID:**

   Option A - Environment variable (per-user):
   ```bash
   echo 'export KANBAN_PROJECT_ID=your-uuid-here' >> ~/.bashrc
   source ~/.bashrc
   ```

   Option B - Config file (team-wide):
   ```bash
   cp MCP/scripts/.kanban.example .kanban
   # Edit .kanban and set your PROJECT_ID
   ```

3. **Make a commit:**
   ```bash
   git add .
   git commit -m "Test automatic indexing"
   ```

4. **Verify it's working:**
   ```bash
   # Check the hook log
   cat MCP/hook.log
   ```

## Requirements

- Git (version 2.0+)
- Bash (included with Git Bash on Windows)
- Node.js (for MCP server)
- Built MCP server (`npm run build` in MCP directory)

## Troubleshooting

See the [Git Hooks Documentation](../docs/git-hooks.md) for detailed troubleshooting information.

Common issues:

- **Hook not running**: Check if it's executable with `ls -l .git/hooks/post-commit`
- **PROJECT_ID not found**: Verify `echo $KANBAN_PROJECT_ID` or `cat .kanban`
- **MCP server not found**: Run `cd MCP && npm run build`

## Documentation

For complete documentation, see:
- [Git Hooks Guide](../docs/git-hooks.md)
- [MCP Server README](../README.md)

## Advanced

### Custom Hook Integration

If you already have a post-commit hook, you can integrate the Kanban indexing:

```bash
#!/bin/bash

# Your existing hook commands
./scripts/my-custom-script.sh

# Add Kanban indexing
source .git/hooks/post-commit.kanban.sh
```

### Testing the Hook

To test the hook without making a commit:

```bash
# Set up test environment
export KANBAN_PROJECT_ID=test-uuid

# Run the hook directly
.git/hooks/post-commit
```

## Support

For issues or questions, refer to the main project documentation or open an issue.
