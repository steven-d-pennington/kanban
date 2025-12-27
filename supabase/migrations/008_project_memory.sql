-- Agent Kanban Board - Project Memory / RAG System
-- Migration: 008_project_memory.sql
-- Adds project_memory table with pgvector support for semantic memory search

-- =============================================================================
-- ENABLE VECTOR EXTENSION
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- PROJECT MEMORY TABLE
-- =============================================================================
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
  embedding vector(1536),  -- OpenAI ada-002 dimensions
  source_work_item_id UUID REFERENCES work_items(id) ON DELETE SET NULL,
  created_by_agent VARCHAR(100),
  created_by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  relevance_score FLOAT DEFAULT 1.0,  -- Decays over time
  is_global BOOLEAN DEFAULT FALSE,    -- Cross-project memory
  is_active BOOLEAN DEFAULT TRUE,     -- Soft delete
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PROJECT MEMORY
-- =============================================================================

-- Standard indexes for filtering
CREATE INDEX idx_project_memory_project ON project_memory(project_id);
CREATE INDEX idx_project_memory_type ON project_memory(project_id, memory_type);
CREATE INDEX idx_project_memory_source ON project_memory(source_work_item_id);
CREATE INDEX idx_project_memory_active ON project_memory(project_id) WHERE is_active = TRUE;
CREATE INDEX idx_project_memory_global ON project_memory(is_global) WHERE is_global = TRUE;

-- Vector index for similarity search (IVFFlat for semantic search)
CREATE INDEX idx_project_memory_vector ON project_memory
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE project_memory ENABLE ROW LEVEL SECURITY;

-- Users can manage memory for their projects
CREATE POLICY "Users can manage project memory" ON project_memory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_memory.project_id
      AND projects.created_by = auth.uid()
    )
    OR is_global = TRUE  -- Global memories readable by all
  );

-- Service role can access all memories (for MCP server)
CREATE POLICY "Service role can access all memories" ON project_memory
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_project_memory_timestamp
  BEFORE UPDATE ON project_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_project_memory_updated_at();

-- =============================================================================
-- SEARCH FUNCTION
-- =============================================================================

-- Function to search memories by similarity
CREATE OR REPLACE FUNCTION search_project_memories(
  p_project_id UUID,
  p_embedding vector(1536),
  p_memory_types TEXT[] DEFAULT NULL,
  p_include_global BOOLEAN DEFAULT FALSE,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  memory_type TEXT,
  title TEXT,
  content TEXT,
  source_work_item_id UUID,
  created_by_agent VARCHAR(100),
  created_at TIMESTAMPTZ,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.project_id,
    pm.memory_type,
    pm.title,
    pm.content,
    pm.source_work_item_id,
    pm.created_by_agent,
    pm.created_at,
    1 - (pm.embedding <=> p_embedding) AS similarity
  FROM project_memory pm
  WHERE
    pm.is_active = TRUE
    AND (
      pm.project_id = p_project_id
      OR (p_include_global = TRUE AND pm.is_global = TRUE)
    )
    AND (
      p_memory_types IS NULL
      OR pm.memory_type = ANY(p_memory_types)
    )
  ORDER BY pm.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION search_project_memories TO authenticated, service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE project_memory IS 'Stores learned knowledge and decisions for semantic search and agent context';
COMMENT ON COLUMN project_memory.embedding IS 'Vector embedding of title + content using OpenAI ada-002';
COMMENT ON COLUMN project_memory.memory_type IS 'Category of memory: decision, pattern, convention, lesson, architecture, warning, preference';
COMMENT ON COLUMN project_memory.relevance_score IS 'Score that can decay over time, higher = more relevant';
COMMENT ON COLUMN project_memory.is_global IS 'If true, memory is accessible across all projects';
COMMENT ON COLUMN project_memory.is_active IS 'Soft delete flag, false means memory is archived';
COMMENT ON FUNCTION search_project_memories IS 'Semantic similarity search for project memories using vector embeddings';
