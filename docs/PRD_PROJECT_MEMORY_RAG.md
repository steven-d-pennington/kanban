# PRD: Project Memory / RAG System for Agent Context

## Problem Statement

AI agents working on codebases currently operate without persistent memory. Every session, they must:
- Re-explore the codebase structure from scratch
- Re-discover architectural patterns and conventions
- Miss valuable context from previous related work
- Make inconsistent decisions due to lack of historical knowledge

This leads to:
1. **Wasted time**: 30-50% of agent work is redundant exploration
2. **Inconsistent decisions**: Different agents make contradictory choices
3. **Lost knowledge**: Lessons learned disappear between sessions
4. **Poor context**: Agents lack awareness of project-specific patterns

## Solution Overview

Build a **Project Memory System** using RAG (Retrieval-Augmented Generation) that:
1. **Indexes codebases** with vector embeddings for semantic search
2. **Stores learned knowledge** as searchable memories
3. **Auto-injects context** when agents pick up work items
4. **Updates in real-time** via git hooks when code changes

---

## User Stories

### US-1: Semantic Code Search
**As an** agent
**I want to** search the codebase semantically
**So that** I can find relevant code without knowing exact file paths

**Acceptance Criteria:**
- [ ] Query with natural language (e.g., "authentication flow", "error handling")
- [ ] Returns ranked file paths with code snippets
- [ ] Includes relevance scores (0-1) for each result
- [ ] Filters by: file types, directories, recency
- [ ] Limits configurable (default 10 results)
- [ ] Response time <500ms for typical queries

**Technical Notes:**
- Use OpenAI `text-embedding-ada-002` (1536 dimensions)
- Store in Supabase with pgvector extension
- Cosine similarity for matching
- Chunk code by logical units (functions, classes)

### US-2: Real-time Index Updates
**As a** developer
**I want** the index to update automatically when I commit
**So that** agents always have current context

**Acceptance Criteria:**
- [ ] Git post-commit hook triggers re-indexing
- [ ] Only changed files are re-processed (incremental)
- [ ] Index updates complete within 5 seconds for small changes
- [ ] Handles file deletions (removes old embeddings)
- [ ] Handles file renames (updates file_path)
- [ ] Supports manual full re-index command
- [ ] Shows indexing status in CLI output

**Technical Notes:**
- Git hook posts to local MCP endpoint
- Track file hashes to detect changes
- Batch embeddings API calls for efficiency
- Queue system for larger updates

### US-3: Store Decision Memory
**As an** agent
**I want to** record decisions and lessons learned
**So that** future agents benefit from my work

**Acceptance Criteria:**
- [ ] Add memory with: type, title, content, source work item
- [ ] Memory types: decision, pattern, convention, lesson, architecture, warning, preference
- [ ] Memories are embedded for semantic search
- [ ] Memories scoped to project
- [ ] Timestamp and agent attribution recorded
- [ ] Memories searchable by type filter

**Technical Notes:**
- Same embedding model as code
- Link to source work item for traceability
- Include relevance decay scoring (newer = more relevant)

### US-4: Contextual Recall on Task Pickup
**As an** agent claiming a work item
**I want** relevant context automatically provided
**So that** I can start work faster with better understanding

**Acceptance Criteria:**
- [ ] On claim, automatically search for relevant context
- [ ] Return top 5 relevant code snippets
- [ ] Return top 5 applicable memories
- [ ] Return related past work items (same area/keywords)
- [ ] Context ranked by combined relevance score
- [ ] Context injected into agent prompt automatically

**Technical Notes:**
- Use work item title + description as query
- Combine code search + memory search + work item search
- Weight recent items higher
- Cache results for quick re-access

### US-5: Search Memories
**As an** agent or user
**I want to** search project memories semantically
**So that** I can find relevant past decisions and patterns

**Acceptance Criteria:**
- [ ] Query with natural language
- [ ] Filter by memory type
- [ ] Filter by date range
- [ ] Returns ranked results with source work item links
- [ ] Supports project-specific or global search

**Technical Notes:**
- Similar to code search but against memory table
- Include source work item metadata in results

### US-6: Manual Index Project
**As a** user setting up a new project
**I want to** trigger full codebase indexing
**So that** agents have context from day one

**Acceptance Criteria:**
- [ ] Provide project_id and repo_path to index
- [ ] Configurable file patterns (default: common code files)
- [ ] Progress feedback during indexing
- [ ] Skip binary files and node_modules
- [ ] Support for incremental option
- [ ] Returns indexing statistics (files processed, chunks created)

**Technical Notes:**
- Use glob patterns for file discovery
- Chunk files at ~500 tokens per chunk
- Overlap chunks by ~50 tokens for context continuity
- Respect .gitignore

### US-7: Memory Management UI
**As a** user
**I want to** view and manage project memories
**So that** I can curate what agents remember

**Acceptance Criteria:**
- [ ] List all memories for a project
- [ ] Filter by type, date, source
- [ ] View memory details with source work item
- [ ] Delete individual memories
- [ ] Edit memory content (re-embeds automatically)
- [ ] Bulk delete by filter

**Technical Notes:**
- Add to existing admin/settings area
- Re-embed on edit using same model
- Soft delete with retention period

---

## Technical Specifications

### Database Schema (Supabase + pgvector)

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Code embeddings for semantic search
CREATE TABLE code_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  chunk_index INTEGER DEFAULT 0,
  chunk_text TEXT NOT NULL,
  chunk_start_line INTEGER,
  chunk_end_line INTEGER,
  embedding vector(1536),  -- OpenAI ada-002 dimensions
  file_hash TEXT NOT NULL,  -- For incremental updates
  language TEXT,  -- e.g., 'typescript', 'python'
  metadata JSONB DEFAULT '{}',  -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint for upsert
  UNIQUE(project_id, file_path, chunk_index)
);

-- Indexes for efficient queries
CREATE INDEX idx_code_embeddings_project ON code_embeddings(project_id);
CREATE INDEX idx_code_embeddings_file ON code_embeddings(project_id, file_path);
CREATE INDEX idx_code_embeddings_hash ON code_embeddings(file_hash);

-- Vector index for similarity search (IVFFlat for large datasets)
CREATE INDEX idx_code_embeddings_vector ON code_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Project memory for learned knowledge
CREATE TABLE project_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'decision',     -- Architectural choices
    'pattern',      -- Code patterns to follow
    'convention',   -- Naming/organization rules
    'lesson',       -- Things learned the hard way
    'architecture', -- System design notes
    'warning',      -- Things to avoid
    'preference'    -- Style preferences
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  source_work_item_id UUID REFERENCES work_items(id) ON DELETE SET NULL,
  created_by_agent VARCHAR(100),
  created_by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  relevance_score FLOAT DEFAULT 1.0,  -- Decays over time
  is_global BOOLEAN DEFAULT FALSE,    -- Cross-project memory
  is_active BOOLEAN DEFAULT TRUE,     -- Soft delete
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for memory queries
CREATE INDEX idx_project_memory_project ON project_memory(project_id);
CREATE INDEX idx_project_memory_type ON project_memory(project_id, memory_type);
CREATE INDEX idx_project_memory_source ON project_memory(source_work_item_id);
CREATE INDEX idx_project_memory_active ON project_memory(project_id) WHERE is_active = TRUE;

-- Vector index for memory search
CREATE INDEX idx_project_memory_vector ON project_memory
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- Index tracking for incremental updates
CREATE TABLE code_index_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  repo_path TEXT NOT NULL,
  last_indexed_at TIMESTAMPTZ,
  last_commit_hash TEXT,
  total_files INTEGER DEFAULT 0,
  total_chunks INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'indexing', 'completed', 'failed'
  )),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id)
);

-- RLS Policies
ALTER TABLE code_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_index_status ENABLE ROW LEVEL SECURITY;

-- Users can access embeddings for their projects
CREATE POLICY "Users can view code embeddings" ON code_embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_embeddings.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Users can manage memory for their projects
CREATE POLICY "Users can manage project memory" ON project_memory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_memory.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Users can view index status
CREATE POLICY "Users can view index status" ON code_index_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_index_status.project_id
      AND projects.created_by = auth.uid()
    )
  );
```

### MCP Tool Specifications

```typescript
// ============================================
// TOOL: search_codebase
// ============================================
interface SearchCodebaseInput {
  query: string;           // Natural language search query
  project_id: string;      // UUID of the project
  file_types?: string[];   // e.g., ['ts', 'tsx', 'js']
  directories?: string[];  // e.g., ['src/components']
  limit?: number;          // Default 10, max 50
}

interface CodeSearchResult {
  file_path: string;
  chunk_text: string;
  start_line: number;
  end_line: number;
  language: string;
  similarity: number;      // 0-1 relevance score
}

// Returns: CodeSearchResult[]

// ============================================
// TOOL: index_project
// ============================================
interface IndexProjectInput {
  project_id: string;
  repo_path: string;       // Absolute path to repo
  incremental?: boolean;   // Default true, only changed files
  file_patterns?: string[]; // Default ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.py', etc.]
}

interface IndexResult {
  success: boolean;
  files_processed: number;
  chunks_created: number;
  files_skipped: number;
  duration_ms: number;
  errors?: string[];
}

// ============================================
// TOOL: add_memory
// ============================================
interface AddMemoryInput {
  project_id: string;
  memory: {
    type: 'decision' | 'pattern' | 'convention' | 'lesson' |
          'architecture' | 'warning' | 'preference';
    title: string;
    content: string;
    source_work_item_id?: string;  // Link to originating work
    is_global?: boolean;           // Cross-project memory
  };
}

interface Memory {
  id: string;
  project_id: string;
  memory_type: string;
  title: string;
  content: string;
  source_work_item_id?: string;
  created_by_agent?: string;
  created_at: string;
}

// Returns: Memory

// ============================================
// TOOL: recall_context
// ============================================
interface RecallContextInput {
  work_item_id: string;    // Get context for this work item
  include_code?: boolean;  // Default true
  include_memories?: boolean; // Default true
  include_related_work?: boolean; // Default true
  limit_per_type?: number; // Default 5 each
}

interface ContextResult {
  code_snippets: CodeSearchResult[];
  memories: Memory[];
  related_work_items: {
    id: string;
    title: string;
    type: string;
    status: string;
    relevance: number;
  }[];
  query_used: string;  // Shows what was searched
}

// ============================================
// TOOL: search_memories
// ============================================
interface SearchMemoriesInput {
  project_id: string;
  query: string;
  types?: string[];        // Filter by memory types
  limit?: number;          // Default 10
  include_global?: boolean; // Include cross-project memories
}

// Returns: Memory[]

// ============================================
// TOOL: update_index
// ============================================
interface UpdateIndexInput {
  project_id: string;
  files: string[];         // Changed file paths
  deleted_files?: string[]; // Removed file paths
}

// For git hook integration
// Returns: { updated: number, deleted: number }
```

### Git Hook Integration

```bash
#!/bin/bash
# .git/hooks/post-commit

# Get project ID from environment or config
PROJECT_ID="${KANBAN_PROJECT_ID:-}"

if [ -z "$PROJECT_ID" ]; then
  # Try to read from .kanban config
  if [ -f ".kanban" ]; then
    PROJECT_ID=$(grep "project_id" .kanban | cut -d'=' -f2)
  fi
fi

if [ -z "$PROJECT_ID" ]; then
  echo "No KANBAN_PROJECT_ID set, skipping index update"
  exit 0
fi

# Get changed files in this commit
CHANGED=$(git diff-tree --no-commit-id --name-only -r HEAD | tr '\n' ',')
DELETED=$(git diff-tree --no-commit-id --name-only -r --diff-filter=D HEAD | tr '\n' ',')

# Trigger re-indexing via MCP endpoint
curl -s -X POST "http://localhost:3001/update-index" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": \"$PROJECT_ID\",
    \"files\": [$(echo $CHANGED | sed 's/,$//' | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')],
    \"deleted_files\": [$(echo $DELETED | sed 's/,$//' | sed 's/,/","/g' | sed 's/^/"/' | sed 's/$/"/')]
  }" > /dev/null 2>&1 &

echo "Index update triggered for ${CHANGED%,}"
```

### Memory Types Reference

| Type | Purpose | Example |
|------|---------|---------|
| `decision` | Architectural choices made | "Using Zustand for state management because Redux was overkill for this app size" |
| `pattern` | Code patterns to follow | "API error handling: always wrap in try/catch, return structured error objects" |
| `convention` | Naming/organization rules | "Components in src/components/{feature}/, one component per file" |
| `lesson` | Things learned the hard way | "Don't use library X with Y, caused memory leaks in production" |
| `architecture` | System design notes | "Auth flow: JWT stored in httpOnly cookie, refresh via /api/auth/refresh" |
| `warning` | Things to avoid | "This approach caused performance issues on large datasets" |
| `preference` | Style preferences | "Prefer named exports over default exports for better IDE support" |

### Chunking Strategy

```typescript
interface ChunkConfig {
  maxTokens: 500;        // Target size per chunk
  overlapTokens: 50;     // Overlap for context continuity
  splitOn: [
    'function',          // Function boundaries
    'class',             // Class boundaries
    'export',            // Export statements
    '\n\n',              // Double newlines
  ];
}

// Chunking algorithm:
// 1. Parse file to identify logical boundaries
// 2. Split at boundaries, respecting maxTokens
// 3. If chunk > maxTokens, split at next best point
// 4. Add overlap from previous chunk start
// 5. Store with line number references
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Stories 1, 6)
- Database migration with pgvector
- Basic embedding generation
- search_codebase tool
- index_project tool
- Manual indexing workflow

### Phase 2: Memory System (Stories 3, 5)
- add_memory tool
- search_memories tool
- Memory types and validation
- Agent attribution

### Phase 3: Auto-Context (Story 4)
- recall_context tool
- Integration with claim_work_item
- Context injection in agent prompts
- Related work item matching

### Phase 4: Real-time Updates (Story 2)
- Git hook implementation
- Incremental indexing
- update_index tool
- File deletion handling

### Phase 5: Management UI (Story 7)
- Memory list view
- Memory CRUD operations
- Index status dashboard
- Bulk operations

---

## Out of Scope

- Multi-modal embeddings (images, diagrams)
- Real-time collaborative editing awareness
- Cross-organization memory sharing
- Custom embedding models (stick with OpenAI)
- Memory versioning/history
- Automatic memory extraction from conversations

---

## Dependencies

- **Supabase pgvector extension**: Must be enabled
- **OpenAI API key**: For embeddings (ada-002)
- **Git hooks**: For real-time updates
- **MCP server**: Extension for new tools

---

## Success Metrics

1. **Context Quality**: Agents report relevant context >80% of the time
2. **Time Savings**: 30% reduction in exploration time per task
3. **Consistency**: 50% fewer contradictory architectural decisions
4. **Memory Growth**: Active projects accumulate 50+ useful memories in first month
5. **Index Freshness**: Average index update latency <5 seconds

---

## Open Questions

1. **Embedding Model**: Should we support switching to other models (e.g., OpenAI text-embedding-3-small)?
2. **Memory Decay**: How aggressively should old memories decay in relevance?
3. **Cross-Project**: When should memories be marked as global vs project-specific?

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAI API costs | Medium | Cache embeddings, batch requests, monitor usage |
| Large codebase indexing | High | Incremental updates, background processing, progress feedback |
| Stale context | Medium | Real-time git hooks, timestamp in results |
| Memory bloat | Low | Relevance decay, user curation tools, limits |

