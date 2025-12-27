# Kanban MCP Server

This MCP server provides tools to interact with the Kanban board from external AI agents (like Claude Desktop, Antigravity, etc.).

## Installation

1.  Navigate to this directory:
    ```bash
    cd c:\projects\kanban\MCP
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the project:
    ```bash
    npm run build
    ```

## Usage

### Connecting to Claude Desktop
Add this to your `claude_desktop_config.json` (typically located in `%APPDATA%\Claude\` on Windows or `~/Library/Application Support/Claude/` on macOS):

```json
{
  "mcpServers": {
    "kanban": {
      "command": "node",
      "args": ["c:\\projects\\kanban\\MCP\\dist\\index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "OPENAI_API_KEY": "sk-..." 
      }
    }
  }
}
```

> **Note**: `OPENAI_API_KEY` is required for Semantic Search features (embedding generation).

### Available Tools

*   `list_work_items`: View tickets ready for work.
*   `claim_work_item`: Assign a ticket to yourself.
*   `add_comment`: Post updates or questions.
*   `complete_work_item`: Submit your work for review.
*   `index_project`: Index entire codebase for semantic search.
*   `search_codebase`: Semantic search through indexed code.
*   `add_memory`: Store learned decisions and patterns.
*   `search_memories`: Search past decisions and lessons.

## Git Hooks for Automatic Indexing

The MCP server includes git hooks that automatically update the code index when you commit changes. This ensures agents always have access to the latest codebase context.

### Quick Setup

```bash
# Install the post-commit hook
cd MCP/scripts
./install-hooks.sh

# Configure your project ID
echo 'PROJECT_ID=your-project-uuid' > ../../.kanban
```

> The `PROJECT_ID` is the UUID of the project created in the Kanban board.

For detailed documentation, see:
- [Git Hooks Guide](docs/git-hooks.md)
- [Scripts Documentation](scripts/README.md)
