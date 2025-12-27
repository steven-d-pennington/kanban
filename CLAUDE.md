# Kanban Project Instructions

## Project Memory System

This project has a RAG-based memory system. **You MUST use it** to maintain context across sessions.

### Before Starting Any Task

Always call `recall_context` first to get relevant context:
```
mcp__kanban__recall_context({
  project_id: "5aa15d44-80ea-4245-82e1-9e52a9a41ac4",
  query: "<describe what you're about to work on>",
  include_code: true,
  include_memories: true,
  include_work_items: true
})
```

This returns:
- Relevant code snippets from the indexed codebase
- Project memories (decisions, patterns, conventions, lessons)
- Related work items for context

### When Searching for Specific Information

Use `search_memories` to find project knowledge:
```
mcp__kanban__search_memories({
  project_id: "5aa15d44-80ea-4245-82e1-9e52a9a41ac4",
  query: "state management patterns",
  limit: 5
})
```

Use `search_codebase` for code-specific searches:
```
mcp__kanban__search_codebase({
  project_id: "5aa15d44-80ea-4245-82e1-9e52a9a41ac4",
  query: "authentication flow",
  limit: 10
})
```

### When You Learn Something Important

Create a memory using `add_memory`:
```
mcp__kanban__add_memory({
  project_id: "5aa15d44-80ea-4245-82e1-9e52a9a41ac4",
  title: "Brief descriptive title",
  content: "Detailed explanation of what was learned",
  memory_type: "decision" | "pattern" | "convention" | "lesson" | "architecture" | "warning" | "preference"
})
```

**Create memories for:**
- Architectural decisions and their rationale
- Code patterns used in this project
- Naming conventions
- Lessons learned from bugs or issues
- User preferences
- Warnings about pitfalls to avoid

## Project Context

- **Project ID**: `5aa15d44-80ea-4245-82e1-9e52a9a41ac4`
- **Stack**: React + TypeScript frontend, Supabase backend, MCP server for AI tooling
- **State Management**: Zustand (NOT Redux)
- **Styling**: Tailwind CSS

## Kanban MCP Tools

The kanban MCP server provides these tools:
- `list_projects` - List all projects
- `list_work_items` - Get work items by status
- `get_work_item` - Get details of a specific item
- `claim_work_item` - Claim an item to work on
- `complete_work_item` - Mark item complete
- `create_work_item` - Create new items
- `update_work_item` - Update existing items
- `add_comment` - Add comments to items
- `handoff_work_item` - Complete and create child items

## Code Style

- Use functional components with hooks
- Prefer named exports over default exports
- Component files use PascalCase (e.g., `MemoryList.tsx`)
- Store files use camelCase with "Store" suffix (e.g., `memoryStore.ts`)
