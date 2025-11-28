-- Agent Kanban Board - Initial Database Schema
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PROJECTS TABLE
-- =============================================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user's projects
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);

-- =============================================================================
-- WORK ITEMS TABLE
-- =============================================================================
CREATE TABLE work_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES work_items(id) ON DELETE SET NULL,

  -- Core fields
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('project_spec', 'feature', 'prd', 'story', 'bug', 'task')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),

  -- Kanban state
  status VARCHAR(50) DEFAULT 'backlog' CHECK (status IN ('backlog', 'ready', 'in_progress', 'review', 'testing', 'done')),
  column_order INTEGER DEFAULT 0,

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_agent VARCHAR(100) CHECK (assigned_agent IN ('project_manager', 'scrum_master', 'developer') OR assigned_agent IS NULL),

  -- Metadata
  story_points INTEGER CHECK (story_points IS NULL OR story_points IN (1, 2, 3, 5, 8, 13, 21)),
  due_date DATE,
  labels JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX idx_work_items_project ON work_items(project_id);
CREATE INDEX idx_work_items_project_status ON work_items(project_id, status);
CREATE INDEX idx_work_items_status ON work_items(status);
CREATE INDEX idx_work_items_type ON work_items(type);
CREATE INDEX idx_work_items_assigned_agent ON work_items(assigned_agent) WHERE assigned_agent IS NOT NULL;
CREATE INDEX idx_work_items_assigned_to ON work_items(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_work_items_parent ON work_items(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_work_items_updated ON work_items(updated_at DESC);

-- Partial index for active items (not done or backlog)
CREATE INDEX idx_work_items_active ON work_items(project_id, column_order)
  WHERE status NOT IN ('done', 'backlog');

-- =============================================================================
-- AGENT ACTIVITY TABLE
-- =============================================================================
CREATE TABLE agent_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_item_id UUID REFERENCES work_items(id) ON DELETE CASCADE,
  agent_type VARCHAR(100) NOT NULL CHECK (agent_type IN ('project_manager', 'scrum_master', 'developer')),
  agent_instance_id VARCHAR(255),
  action VARCHAR(100) NOT NULL CHECK (action IN ('claimed', 'processing', 'completed', 'handed_off', 'failed', 'released', 'escalated')),
  details JSONB DEFAULT '{}',
  duration_ms INTEGER,
  status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'error', 'warning')),
  error_message TEXT,
  input_data JSONB,
  output_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for agent activity
CREATE INDEX idx_agent_activity_work_item ON agent_activity(work_item_id);
CREATE INDEX idx_agent_activity_agent_type ON agent_activity(agent_type);
CREATE INDEX idx_agent_activity_action ON agent_activity(action);
CREATE INDEX idx_agent_activity_created_at ON agent_activity(created_at DESC);
CREATE INDEX idx_agent_activity_status ON agent_activity(status);

-- Partial index for recent activity (last 7 days)
CREATE INDEX idx_agent_activity_recent ON agent_activity(created_at DESC)
  WHERE created_at > NOW() - INTERVAL '7 days';

-- =============================================================================
-- COMMENTS TABLE
-- =============================================================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_item_id UUID NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_agent VARCHAR(100) CHECK (author_agent IN ('project_manager', 'scrum_master', 'developer') OR author_agent IS NULL),
  content TEXT NOT NULL,
  is_system_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for comments
CREATE INDEX idx_comments_work_item ON comments(work_item_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- =============================================================================
-- AGENT INSTANCES TABLE (for monitoring)
-- =============================================================================
CREATE TABLE agent_instances (
  id VARCHAR(255) PRIMARY KEY,
  agent_type VARCHAR(100) NOT NULL CHECK (agent_type IN ('project_manager', 'scrum_master', 'developer')),
  display_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_instances_type ON agent_instances(agent_type);
CREATE INDEX idx_agent_instances_status ON agent_instances(status);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_work_items_updated_at
  BEFORE UPDATE ON work_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- AGENT CLAIM FUNCTION (atomic operation)
-- =============================================================================
CREATE OR REPLACE FUNCTION claim_work_item(
  p_work_item_id UUID,
  p_agent_type VARCHAR,
  p_agent_instance_id VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_claimed BOOLEAN := FALSE;
BEGIN
  -- Attempt to claim only if item is ready and not assigned
  UPDATE work_items
  SET
    assigned_agent = p_agent_type,
    status = 'in_progress',
    started_at = NOW(),
    metadata = metadata || jsonb_build_object(
      'claimed_by_instance', p_agent_instance_id,
      'claimed_at', NOW()
    )
  WHERE id = p_work_item_id
    AND status = 'ready'
    AND assigned_agent IS NULL
  RETURNING TRUE INTO v_claimed;

  -- Log the claim attempt
  INSERT INTO agent_activity (
    work_item_id,
    agent_type,
    agent_instance_id,
    action,
    details,
    status
  ) VALUES (
    p_work_item_id,
    p_agent_type,
    p_agent_instance_id,
    CASE WHEN v_claimed THEN 'claimed' ELSE 'failed' END,
    jsonb_build_object('claimed', COALESCE(v_claimed, FALSE)),
    CASE WHEN v_claimed THEN 'success' ELSE 'error' END
  );

  RETURN COALESCE(v_claimed, FALSE);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- AGENT RELEASE FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION release_work_item(
  p_work_item_id UUID,
  p_agent_instance_id VARCHAR,
  p_reason VARCHAR DEFAULT 'released'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_released BOOLEAN := FALSE;
  v_agent_type VARCHAR;
BEGIN
  -- Get agent type before release
  SELECT assigned_agent INTO v_agent_type
  FROM work_items
  WHERE id = p_work_item_id;

  -- Release only if this agent instance owns it
  UPDATE work_items
  SET
    assigned_agent = NULL,
    status = 'ready',
    started_at = NULL,
    metadata = metadata - 'claimed_by_instance' - 'claimed_at'
  WHERE id = p_work_item_id
    AND metadata->>'claimed_by_instance' = p_agent_instance_id
  RETURNING TRUE INTO v_released;

  -- Log the release
  IF v_released THEN
    INSERT INTO agent_activity (
      work_item_id,
      agent_type,
      agent_instance_id,
      action,
      details,
      status
    ) VALUES (
      p_work_item_id,
      v_agent_type,
      p_agent_instance_id,
      'released',
      jsonb_build_object('reason', p_reason),
      'success'
    );
  END IF;

  RETURN COALESCE(v_released, FALSE);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Projects: Users can view and manage their own projects
CREATE POLICY "Users can view their projects" ON projects
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their projects" ON projects
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their projects" ON projects
  FOR DELETE USING (auth.uid() = created_by);

-- Work Items: Users can manage items in their projects
CREATE POLICY "Users can view work items in their projects" ON work_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = work_items.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create work items in their projects" ON work_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = work_items.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update work items in their projects" ON work_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = work_items.project_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete work items in their projects" ON work_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = work_items.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Agent Activity: Users can view activity for their work items
CREATE POLICY "Users can view agent activity" ON agent_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM work_items
      JOIN projects ON projects.id = work_items.project_id
      WHERE work_items.id = agent_activity.work_item_id
      AND projects.created_by = auth.uid()
    )
  );

-- Comments: Users can manage comments on their work items
CREATE POLICY "Users can view comments" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM work_items
      JOIN projects ON projects.id = work_items.project_id
      WHERE work_items.id = comments.work_item_id
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_items
      JOIN projects ON projects.id = work_items.project_id
      WHERE work_items.id = comments.work_item_id
      AND projects.created_by = auth.uid()
    )
  );

-- =============================================================================
-- SERVICE ROLE POLICIES (for agents)
-- Note: Service role bypasses RLS by default in Supabase
-- =============================================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION claim_work_item TO authenticated;
GRANT EXECUTE ON FUNCTION release_work_item TO authenticated;
