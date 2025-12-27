-- Agent Kanban Board - Project Memory RAG System
-- Migration: 008_project_memory_rag.sql
-- Adds pgvector extension and tables for code embeddings and project memory

-- =============================================================================
-- ENABLE PGVECTOR EXTENSION
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- CODE EMBEDDINGS TABLE
-- =============================================================================
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

-- Standard indexes for code embeddings
CREATE INDEX idx_code_embeddings_project ON code_embeddings(project_id);
CREATE INDEX idx_code_embeddings_file ON code_embeddings(project_id, file_path);
CREATE INDEX idx_code_embeddings_hash ON code_embeddings(file_hash);
CREATE INDEX idx_code_embeddings_updated ON code_embeddings(updated_at DESC);

-- Vector index for similarity search (IVFFlat for large datasets)
-- Using lists=100 as specified for code embeddings
CREATE INDEX idx_code_embeddings_vector ON code_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

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
  embedding vector(1536),
  source_work_item_id UUID REFERENCES work_items(id) ON DELETE SET NULL,
  created_by_agent VARCHAR(100) CHECK (created_by_agent IN (
    'project_manager', 'scrum_master', 'developer',
    'code_reviewer', 'qa_tester'
  ) OR created_by_agent IS NULL),
  created_by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  relevance_score FLOAT DEFAULT 1.0,  -- Decays over time
  is_global BOOLEAN DEFAULT FALSE,    -- Cross-project memory
  is_active BOOLEAN DEFAULT TRUE,     -- Soft delete
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard indexes for memory queries
CREATE INDEX idx_project_memory_project ON project_memory(project_id);
CREATE INDEX idx_project_memory_type ON project_memory(project_id, memory_type);
CREATE INDEX idx_project_memory_source ON project_memory(source_work_item_id) WHERE source_work_item_id IS NOT NULL;
CREATE INDEX idx_project_memory_active ON project_memory(project_id) WHERE is_active = TRUE;
CREATE INDEX idx_project_memory_updated ON project_memory(updated_at DESC);

-- Vector index for memory search
-- Using lists=50 as specified for memory embeddings
CREATE INDEX idx_project_memory_vector ON project_memory
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- =============================================================================
-- CODE INDEX STATUS TABLE
-- =============================================================================
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

-- Index for status queries
CREATE INDEX idx_code_index_status_project ON code_index_status(project_id);
CREATE INDEX idx_code_index_status_status ON code_index_status(status);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Apply trigger to code_embeddings
CREATE TRIGGER update_code_embeddings_updated_at
  BEFORE UPDATE ON code_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Apply trigger to project_memory
CREATE TRIGGER update_project_memory_updated_at
  BEFORE UPDATE ON project_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Apply trigger to code_index_status
CREATE TRIGGER update_code_index_status_updated_at
  BEFORE UPDATE ON code_index_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE code_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_index_status ENABLE ROW LEVEL SECURITY;

-- Code Embeddings: Users can view embeddings for their projects
CREATE POLICY "Users can view code embeddings" ON code_embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_embeddings.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert code embeddings" ON code_embeddings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_embeddings.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update code embeddings" ON code_embeddings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_embeddings.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete code embeddings" ON code_embeddings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_embeddings.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Project Memory: Users can manage memory for their projects
CREATE POLICY "Users can view project memory" ON project_memory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_memory.project_id
      AND projects.created_by = auth.uid()
    )
    OR is_global = TRUE  -- Global memories visible to all
  );

CREATE POLICY "Users can create project memory" ON project_memory
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_memory.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update project memory" ON project_memory
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_memory.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete project memory" ON project_memory
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_memory.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Code Index Status: Users can view index status for their projects
CREATE POLICY "Users can view index status" ON code_index_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_index_status.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage index status" ON code_index_status
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_index_status.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON code_embeddings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_memory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON code_index_status TO authenticated;

-- =============================================================================
-- HELPER FUNCTIONS FOR VECTOR SEARCH
-- =============================================================================

-- Function to search codebase with vector similarity
CREATE OR REPLACE FUNCTION search_codebase(
  p_project_id UUID,
  p_query_embedding vector(1536),
  p_limit INTEGER DEFAULT 10,
  p_similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  file_path TEXT,
  chunk_text TEXT,
  chunk_start_line INTEGER,
  chunk_end_line INTEGER,
  language TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.file_path,
    ce.chunk_text,
    ce.chunk_start_line,
    ce.chunk_end_line,
    ce.language,
    1 - (ce.embedding <=> p_query_embedding) AS similarity
  FROM code_embeddings ce
  WHERE ce.project_id = p_project_id
    AND 1 - (ce.embedding <=> p_query_embedding) >= p_similarity_threshold
  ORDER BY ce.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to search memories with vector similarity
CREATE OR REPLACE FUNCTION search_memories(
  p_project_id UUID,
  p_query_embedding vector(1536),
  p_limit INTEGER DEFAULT 10,
  p_memory_types TEXT[] DEFAULT NULL,
  p_include_global BOOLEAN DEFAULT TRUE,
  p_similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  memory_type TEXT,
  title TEXT,
  content TEXT,
  source_work_item_id UUID,
  created_by_agent VARCHAR,
  created_at TIMESTAMPTZ,
  relevance_score FLOAT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.memory_type,
    pm.title,
    pm.content,
    pm.source_work_item_id,
    pm.created_by_agent,
    pm.created_at,
    pm.relevance_score,
    1 - (pm.embedding <=> p_query_embedding) AS similarity
  FROM project_memory pm
  WHERE pm.is_active = TRUE
    AND (pm.project_id = p_project_id OR (p_include_global AND pm.is_global = TRUE))
    AND (p_memory_types IS NULL OR pm.memory_type = ANY(p_memory_types))
    AND 1 - (pm.embedding <=> p_query_embedding) >= p_similarity_threshold
  ORDER BY pm.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION search_codebase TO authenticated;
GRANT EXECUTE ON FUNCTION search_memories TO authenticated;
