-- Migration: Fix Memory/RAG Database Functions
-- This script fixes schema mismatches in the search functions
-- Run this in the Supabase SQL Editor

-- ============================================
-- Step 1: Ensure pgvector extension exists
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Step 2: Fix code_embeddings table schema
-- ============================================

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add start_line if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'code_embeddings' AND column_name = 'start_line'
    ) THEN
        ALTER TABLE code_embeddings ADD COLUMN start_line INTEGER;
        RAISE NOTICE 'Added start_line column to code_embeddings';
    END IF;

    -- Add end_line if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'code_embeddings' AND column_name = 'end_line'
    ) THEN
        ALTER TABLE code_embeddings ADD COLUMN end_line INTEGER;
        RAISE NOTICE 'Added end_line column to code_embeddings';
    END IF;

    -- Add chunk_index if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'code_embeddings' AND column_name = 'chunk_index'
    ) THEN
        ALTER TABLE code_embeddings ADD COLUMN chunk_index INTEGER DEFAULT 0;
        RAISE NOTICE 'Added chunk_index column to code_embeddings';
    END IF;

    -- Add language if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'code_embeddings' AND column_name = 'language'
    ) THEN
        ALTER TABLE code_embeddings ADD COLUMN language TEXT;
        RAISE NOTICE 'Added language column to code_embeddings';
    END IF;

    -- Add file_hash if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'code_embeddings' AND column_name = 'file_hash'
    ) THEN
        ALTER TABLE code_embeddings ADD COLUMN file_hash TEXT;
        RAISE NOTICE 'Added file_hash column to code_embeddings';
    END IF;
END $$;

-- ============================================
-- Step 3: Fix project_memory table schema
-- ============================================

DO $$
BEGIN
    -- Add relevance_score if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_memory' AND column_name = 'relevance_score'
    ) THEN
        ALTER TABLE project_memory ADD COLUMN relevance_score FLOAT DEFAULT 1.0;
        RAISE NOTICE 'Added relevance_score column to project_memory';
    END IF;

    -- Add is_global if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_memory' AND column_name = 'is_global'
    ) THEN
        ALTER TABLE project_memory ADD COLUMN is_global BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_global column to project_memory';
    END IF;

    -- Add is_active if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_memory' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE project_memory ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_active column to project_memory';
    END IF;

    -- Add source_work_item_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_memory' AND column_name = 'source_work_item_id'
    ) THEN
        ALTER TABLE project_memory ADD COLUMN source_work_item_id UUID REFERENCES work_items(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added source_work_item_id column to project_memory';
    END IF;

    -- Add created_by_agent if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_memory' AND column_name = 'created_by_agent'
    ) THEN
        ALTER TABLE project_memory ADD COLUMN created_by_agent TEXT;
        RAISE NOTICE 'Added created_by_agent column to project_memory';
    END IF;
END $$;

-- Remove the created_by_agent check constraint if it exists (we'll be more flexible)
DO $$
BEGIN
    ALTER TABLE project_memory DROP CONSTRAINT IF EXISTS project_memory_created_by_agent_check;
EXCEPTION WHEN undefined_object THEN
    -- Constraint doesn't exist, that's fine
    NULL;
END $$;

-- ============================================
-- Step 4: Drop and recreate search_codebase function
-- ============================================

DROP FUNCTION IF EXISTS search_codebase(vector, UUID, INTEGER, TEXT[], TEXT[], FLOAT);
DROP FUNCTION IF EXISTS search_codebase(vector(1536), UUID, INTEGER, TEXT[], TEXT[], FLOAT);

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
        (1 - (ce.embedding <=> query_embedding))::FLOAT AS similarity
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

-- ============================================
-- Step 5: Drop and recreate search_memories function
-- ============================================

DROP FUNCTION IF EXISTS search_memories(vector, UUID, INTEGER, TEXT[], BOOLEAN, FLOAT);
DROP FUNCTION IF EXISTS search_memories(vector(1536), UUID, INTEGER, TEXT[], BOOLEAN, FLOAT);

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
        (1 - (pm.embedding <=> query_embedding))::FLOAT AS similarity
    FROM project_memory pm
    WHERE pm.is_active = TRUE
        AND (pm.project_id = p_project_id OR (p_include_global AND pm.is_global = TRUE))
        AND (p_memory_types IS NULL OR pm.memory_type = ANY(p_memory_types))
        AND 1 - (pm.embedding <=> query_embedding) >= p_similarity_threshold
    ORDER BY pm.embedding <=> query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Step 6: Create indexes if missing
-- ============================================

-- Code embeddings indexes
CREATE INDEX IF NOT EXISTS idx_code_embeddings_project ON code_embeddings(project_id);
CREATE INDEX IF NOT EXISTS idx_code_embeddings_file_path ON code_embeddings(file_path);
CREATE INDEX IF NOT EXISTS idx_code_embeddings_language ON code_embeddings(language);

-- Project memory indexes
CREATE INDEX IF NOT EXISTS idx_project_memory_project ON project_memory(project_id);
CREATE INDEX IF NOT EXISTS idx_project_memory_type ON project_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_project_memory_global ON project_memory(is_global) WHERE is_global = TRUE;
CREATE INDEX IF NOT EXISTS idx_project_memory_active ON project_memory(is_active) WHERE is_active = TRUE;

-- Vector indexes (IVFFlat) - only create if embeddings exist
DO $$
BEGIN
    -- Check if there are any embeddings before creating vector index
    IF EXISTS (SELECT 1 FROM code_embeddings WHERE embedding IS NOT NULL LIMIT 1) THEN
        CREATE INDEX IF NOT EXISTS idx_code_embeddings_vector ON code_embeddings
            USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
        RAISE NOTICE 'Created vector index on code_embeddings';
    ELSE
        RAISE NOTICE 'Skipping code_embeddings vector index (no embeddings yet)';
    END IF;

    IF EXISTS (SELECT 1 FROM project_memory WHERE embedding IS NOT NULL LIMIT 1) THEN
        CREATE INDEX IF NOT EXISTS idx_project_memory_vector ON project_memory
            USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
        RAISE NOTICE 'Created vector index on project_memory';
    ELSE
        RAISE NOTICE 'Skipping project_memory vector index (no embeddings yet)';
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Vector index creation skipped: %', SQLERRM;
END $$;

-- ============================================
-- Step 7: Verify the fix
-- ============================================

DO $$
DECLARE
    ce_cols TEXT;
    pm_cols TEXT;
BEGIN
    -- Check code_embeddings columns
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO ce_cols
    FROM information_schema.columns
    WHERE table_name = 'code_embeddings';

    RAISE NOTICE 'code_embeddings columns: %', ce_cols;

    -- Check project_memory columns
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO pm_cols
    FROM information_schema.columns
    WHERE table_name = 'project_memory';

    RAISE NOTICE 'project_memory columns: %', pm_cols;

    -- Test search_codebase function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'search_codebase'
    ) THEN
        RAISE NOTICE 'search_codebase function: OK';
    ELSE
        RAISE WARNING 'search_codebase function: MISSING';
    END IF;

    -- Test search_memories function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'search_memories'
    ) THEN
        RAISE NOTICE 'search_memories function: OK';
    ELSE
        RAISE WARNING 'search_memories function: MISSING';
    END IF;
END $$;

-- Success message
DO $$ BEGIN RAISE NOTICE 'Migration 009_fix_memory_functions completed successfully!'; END $$;
