## Overview

Build a project-level memory system that gives agents persistent context across sessions. This RAG (Retrieval-Augmented Generation) system indexes codebases and stores learned knowledge, enabling agents to work more effectively without re-discovering context every time.

## Problem Statement

Currently, agents must:
- Re-explore the codebase for every task
- Re-discover architectural patterns and conventions
- Miss context from previous related work
- Make inconsistent decisions due to lack of historical knowledge

This wastes time and leads to suboptimal outcomes.

## Key Components

### 1. Codebase Indexing
- Vector embeddings of all source files using OpenAI embeddings
- Chunked by logical units (functions, classes, components)
- Real-time updates via git hooks when files change
- Incremental re-indexing (only changed files)
- Cross-project support (each project has its own index)

### 2. Decision Memory
Store learned knowledge that persists across sessions:
- **Architectural Decisions**: "We use Zustand because..."
- **Patterns**: "Error handling follows this pattern..."
- **Conventions**: "Components are organized by feature..."
- **Lessons Learned**: "Avoid X, it caused issues with Y"
- **Related Work**: Links to past work items that touched similar areas

### 3. Contextual Recall
When an agent picks up a task:
- Auto-inject relevant codebase context
- Surface related past decisions
- Show similar completed work items
- Highlight applicable conventions

### 4. Memory Management
- Agents can add memories after completing work
- Memories linked to source work items for traceability
- Decay/relevance scoring over time
- Human ability to curate/delete memories

## User Stories

### US-1: Semantic Code Search
**As an** agent
**I want to** search the codebase semantically
**So that** I can find relevant code without knowing exact file paths

**Acceptance Criteria:**
- [ ] Query with natural language ("authentication flow")
- [ ] Returns ranked file paths and code snippets
- [ ] Filters by file type, directory, recency
- [ ] Results include relevance scores

### US-2: Real-time Index Updates
**As a** developer
**I want** the index to update automatically when I commit
**So that** agents always have current context

**Acceptance Criteria:**
- [ ] Git post-commit hook triggers re-indexing
- [ ] Only changed files are re-processed
- [ ] Index updates complete within seconds
- [ ] Handles file deletions and renames

### US-3: Store Decision Memory
**As an** agent
**I want to** record decisions and lessons learned
**So that** future agents benefit from my work

**Acceptance Criteria:**
- [ ] Add memory with type, content, and source work item
- [ ] Memories are embedded for semantic search
- [ ] Memories scoped to project
- [ ] Timestamp and agent attribution

### US-4: Contextual Recall on Task Pickup
**As an** agent claiming a work item
**I want** relevant context automatically provided
**So that** I can start work faster with better understanding

**Acceptance Criteria:**
- [ ] Receive relevant code snippets for the task
- [ ] See related past work items
- [ ] View applicable decisions/conventions
- [ ] Context ranked by relevance

### US-5: Cross-Project Memory
**As a** user with multiple projects
**I want** each project to have isolated memory
**So that** context doesn't bleed between unrelated projects

**Acceptance Criteria:**
- [ ] Embeddings partitioned by project
- [ ] Memories scoped to project
- [ ] Option for "global" memories (cross-project patterns)

## Technical Specifications

### Database Schema (Supabase + pgvector)

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Code embeddings
CREATE TABLE code_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  file_path TEXT NOT NULL,
  chunk_index INTEGER DEFAULT 0,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),  -- OpenAI ada-002 dimensions
  file_hash TEXT,
  language TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_code_embeddings_project ON code_embeddings(project_id);
CREATE INDEX idx_code_embeddings_embedding ON code_embeddings
  USING ivfflat (embedding vector_cosine_ops);

-- Project memory
CREATE TABLE project_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  memory_type TEXT CHECK (memory_type IN (
    'decision', 'pattern', 'convention', 'lesson',
    'architecture', 'warning', 'preference'
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  source_work_item_id UUID REFERENCES work_items(id),
  created_by_agent TEXT,
  relevance_score FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_memory_project ON project_memory(project_id);
CREATE INDEX idx_project_memory_type ON project_memory(memory_type);
CREATE INDEX idx_project_memory_embedding ON project_memory
  USING ivfflat (embedding vector_cosine_ops);
```

### MCP Tools

```typescript
// Search codebase semantically
search_codebase(query: string, project_id: string, options?: {
  file_types?: string[],
  directories?: string[],
  limit?: number
}) => CodeSearchResult[]

// Index/re-index project files
index_project(project_id: string, repo_path: string, options?: {
  incremental?: boolean,
  file_patterns?: string[]
}) => IndexResult

// Store a memory
add_memory(project_id: string, memory: {
  type: MemoryType,
  title: string,
  content: string,
  source_work_item_id?: string
}) => Memory

// Recall relevant context for a task
recall_context(work_item_id: string) => {
  code_snippets: CodeSnippet[],
  memories: Memory[],
  related_work_items: WorkItem[]
}

// Search memories
search_memories(project_id: string, query: string, options?: {
  types?: MemoryType[],
  limit?: number
}) => Memory[]
```

### Git Hook Integration

```bash
# .git/hooks/post-commit
#!/bin/bash
# Trigger re-indexing for changed files
changed_files=$(git diff-tree --no-commit-id --name-only -r HEAD)
curl -X POST http://localhost:3001/reindex \
  -H "Content-Type: application/json" \
  -d "{\"files\": [\"$changed_files\"]}"
```

### Memory Types

| Type | Purpose | Example |
|------|---------|---------|
| decision | Architectural choices | "Using Zustand for state management" |
| pattern | Code patterns to follow | "API error handling pattern" |
| convention | Naming/organization rules | "Components in src/components/{feature}/" |
| lesson | Things learned the hard way | "Don't use library X with Y" |
| architecture | System design notes | "Auth flow diagram" |
| warning | Things to avoid | "This approach caused performance issues" |
| preference | Style preferences | "Prefer explicit returns" |

## Out of Scope

- Multi-modal embeddings (images, diagrams)
- Real-time collaborative editing awareness
- Cross-organization memory sharing
- Custom embedding models (stick with OpenAI)

## Dependencies

- Supabase pgvector extension
- OpenAI API key for embeddings
- Git hooks or file watcher for real-time updates

## Success Metrics

1. **Context Quality**: Agents report relevant context 80%+ of the time
2. **Time Savings**: 30% reduction in exploration time per task
3. **Consistency**: Fewer contradictory architectural decisions
4. **Memory Growth**: Active projects accumulate 50+ useful memories
