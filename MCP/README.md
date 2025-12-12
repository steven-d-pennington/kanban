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
Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kanban": {
      "command": "node",
      "args": ["c:\\projects\\kanban\\MCP\\dist\\index.js"]
    }
  }
}
```

### Available Tools

*   `list_work_items`: View tickets ready for work.
*   `claim_work_item`: Assign a ticket to yourself.
*   `add_comment`: Post updates or questions.
*   `complete_work_item`: Submit your work for review.
