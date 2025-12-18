# Kanban SuperCharge - Agent Development Project

## Quick Context

This is an **agent-driven development pipeline** project. We're building a kanban system optimized for AI agents to use, with specialized agents (PM, Scrum Master, Developer, Code Reviewer, QA) working through a pipeline.

## MCP Server

The kanban MCP server is configured and provides these tools:
- `list_projects`, `create_project`
- `list_work_items`, `get_work_item`, `create_work_item`, `update_work_item`
- `claim_work_item`, `complete_work_item`, `add_comment`
- `handoff_work_item` (complete + create children for next agent)

**Project ID**: `5aa15d44-80ea-4245-82e1-9e52a9a41ac4` (Kanban SuperCharge)

## Current State

### Ready for Development
12 stories for **Project Memory / RAG System** are in `ready` status:

**Phase 1 - Core Infrastructure:**
1. Create pgvector database migration (3 pts)
2. Implement OpenAI embedding service (3 pts)
3. Implement code chunking algorithm (5 pts)
4. Build index_project MCP tool (8 pts)

**Phase 2 - Search & Memory:**
5. Build search_codebase MCP tool (5 pts)
6. Build add_memory MCP tool (3 pts)
7. Build search_memories MCP tool (3 pts)

**Phase 3 - Auto-Context:**
8. Build recall_context MCP tool (5 pts)

**Phase 4 - Real-time Updates:**
9. Implement git post-commit hook (3 pts)
10. Build update_index MCP tool (5 pts)

**Phase 5 - Management UI:**
11. Memory Management UI - List/View (5 pts)
12. Memory Management UI - Edit/Delete (5 pts)

### Other Ready Items
- PRD: Agent Pipeline Orchestration (prd)
- Git Integration for Developer Workflow (feature, 13 pts)
- PRD: Agent Orchestrator Dashboard (prd)

## Key Documentation

- `docs/PRD_PROJECT_MEMORY_RAG.md` - Full PRD for memory system
- `docs/FEATURE_PROJECT_MEMORY.md` - Feature overview
- `C:\projects\kanban\MCP\src\index.ts` - MCP server implementation (main repo)

## How to Work

### As Developer Agent:
```
1. mcp__kanban__list_work_items (status: ready, type: story)
2. mcp__kanban__claim_work_item (work_item_id, agent_type: developer)
3. Implement the story
4. mcp__kanban__complete_work_item or mcp__kanban__handoff_work_item
```

### As PM Agent:
```
1. mcp__kanban__list_work_items (status: ready, type: feature)
2. mcp__kanban__claim_work_item (work_item_id, agent_type: project_manager)
3. Write PRD, create child PRD item via handoff
```

### As Scrum Master:
```
1. mcp__kanban__list_work_items (status: ready, type: prd)
2. mcp__kanban__claim_work_item (work_item_id, agent_type: scrum_master)
3. Break into stories, create via handoff
```

## Repository Structure

This is a **git worktree** at:
- Worktree: `C:\Users\Steven\.claude-worktrees\kanban\charming-dhawan`
- Main repo: `C:\projects\kanban`
- Branch: `charming-dhawan`

The MCP server code is in the main repo at `C:\projects\kanban\MCP\`.

## Database

- Supabase project: `hdwnobowkgprmsmzudph`
- Migrations: `supabase/migrations/`
- Key tables: `projects`, `work_items`, `agent_activity`, `comments`, `handoff_history`

## Suggested First Task

Start with **Phase 1, Story 1**: "Create pgvector database migration"
- This unblocks all other RAG system stories
- Creates the foundation for code embeddings and project memory
