-- Migration: Project Memory / RAG System
-- Enables semantic code search and project memory for agents

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Code embeddings table - stores vectorized code chunks
CREATE TABLE IF NOT EXISTS code_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    chunk_index INTEGER DEFAULT 0,
    chunk_text TEXT NOT NULL,
    embedding vector(1536),  -- OpenAI text-embedding-ada-002 dimensions
    file_hash TEXT,          -- For incremental updates
    language TEXT,           -- ts, js, py, etc.
    start_line INTEGER,
    end_line INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_chunk UNIQUE (project_id, file_path, chunk_index)
);

-- Indexes for code_embeddings
CREATE INDEX IF NOT EXISTS idx_code_embeddings_project ON code_embeddings(project_id);
CREATE INDEX IF NOT EXISTS idx_code_embeddings_file_path ON code_embeddings(file_path);
CREATE INDEX IF NOT EXISTS idx_code_embeddings_language ON code_embeddings(language);

-- IVFFlat index for vector similarity search (lists=100 for better recall)
CREATE INDEX IF NOT EXISTS idx_code_embeddings_vector ON code_embeddings
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Project memory table - stores learned decisions, patterns, conventions
CREATE TABLE IF NOT EXISTS project_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL CHECK (memory_type IN (
        'decision',      -- Architectural choices
        'pattern',       -- Code patterns to follow
        'convention',    -- Naming/organization rules
        'lesson',        -- Things learned the hard way
        'architecture',  -- System design notes
        'warning',       -- Things to avoid
        'preference'     -- Style preferences
    )),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    source_work_item_id UUID REFERENCES work_items(id) ON DELETE SET NULL,
    created_by_agent TEXT,
    relevance_score FLOAT DEFAULT 1.0,
    is_global BOOLEAN DEFAULT FALSE,  -- Cross-project memories
    is_active BOOLEAN DEFAULT TRUE,   -- Soft delete
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for project_memory
CREATE INDEX IF NOT EXISTS idx_project_memory_project ON project_memory(project_id);
CREATE INDEX IF NOT EXISTS idx_project_memory_type ON project_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_project_memory_active ON project_memory(is_active);
CREATE INDEX IF NOT EXISTS idx_project_memory_global ON project_memory(is_global);

-- IVFFlat index for memory vector search (lists=50, smaller corpus)
CREATE INDEX IF NOT EXISTS idx_project_memory_vector ON project_memory
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- Code index status - tracks indexing state per project
CREATE TABLE IF NOT EXISTS code_index_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
    last_indexed_at TIMESTAMPTZ,
    files_indexed INTEGER DEFAULT 0,
    chunks_created INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'indexing', 'complete', 'error')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code_index_status_project ON code_index_status(project_id);

-- Function to search codebase semantically
CREATE OR REPLACE FUNCTION search_codebase(
    query_embedding vector(1536),
    p_project_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_file_types TEXT[] DEFAULT NULL,
    p_directories TEXT[] DEFAULT NULL,
    p_similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
    id UUID,
    file_path TEXT,
    chunk_text TEXT,
    chunk_index INTEGER,
    start_line INTEGER,
    end_line INTEGER,
    language TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ce.id,
        ce.file_path,
        ce.chunk_text,
        ce.chunk_index,
        ce.start_line,
        ce.end_line,
        ce.language,
        1 - (ce.embedding <=> query_embedding) AS similarity
    FROM code_embeddings ce
    WHERE ce.project_id = p_project_id
        AND (p_file_types IS NULL OR ce.language = ANY(p_file_types))
        AND (p_directories IS NULL OR EXISTS (
            SELECT 1 FROM unnest(p_directories) d
            WHERE ce.file_path LIKE d || '%'
        ))
        AND 1 - (ce.embedding <=> query_embedding) >= p_similarity_threshold
    ORDER BY ce.embedding <=> query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to search memories semantically
CREATE OR REPLACE FUNCTION search_memories(
    query_embedding vector(1536),
    p_project_id UUID,
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
    created_by_agent TEXT,
    relevance_score FLOAT,
    is_global BOOLEAN,
    created_at TIMESTAMPTZ,
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
        pm.relevance_score,
        pm.is_global,
        pm.created_at,
        1 - (pm.embedding <=> query_embedding) AS similarity
    FROM project_memory pm
    WHERE pm.is_active = TRUE
        AND (pm.project_id = p_project_id OR (p_include_global AND pm.is_global = TRUE))
        AND (p_memory_types IS NULL OR pm.memory_type = ANY(p_memory_types))
        AND 1 - (pm.embedding <=> query_embedding) >= p_similarity_threshold
    ORDER BY pm.embedding <=> query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE code_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_index_status ENABLE ROW LEVEL SECURITY;

-- Code embeddings: users can see embeddings for projects they own
CREATE POLICY "Users can view code embeddings for their projects" ON code_embeddings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = code_embeddings.project_id
            AND p.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert code embeddings for their projects" ON code_embeddings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = code_embeddings.project_id
            AND p.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update code embeddings for their projects" ON code_embeddings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = code_embeddings.project_id
            AND p.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete code embeddings for their projects" ON code_embeddings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = code_embeddings.project_id
            AND p.created_by = auth.uid()
        )
    );

-- Project memory: users can see memories for their projects + global
CREATE POLICY "Users can view project memories" ON project_memory
    FOR SELECT USING (
        is_global = TRUE OR
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_memory.project_id
            AND p.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert project memories" ON project_memory
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_memory.project_id
            AND p.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update project memories" ON project_memory
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_memory.project_id
            AND p.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete project memories" ON project_memory
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_memory.project_id
            AND p.created_by = auth.uid()
        )
    );

-- Code index status: users can see status for their projects
CREATE POLICY "Users can view code index status" ON code_index_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = code_index_status.project_id
            AND p.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can manage code index status" ON code_index_status
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = code_index_status.project_id
            AND p.created_by = auth.uid()
        )
    );

-- Service role bypass for MCP server operations
CREATE POLICY "Service role full access to code_embeddings" ON code_embeddings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to project_memory" ON project_memory
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to code_index_status" ON code_index_status
    FOR ALL USING (auth.role() = 'service_role');
