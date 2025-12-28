-- Agent Kanban Board - Enhanced Agent Types
-- Migration: 007_enhanced_agents.sql
-- Adds code_reviewer and qa_tester agent types for the full pipeline

-- =============================================================================
-- UPDATE WORK_ITEMS AGENT CONSTRAINT
-- =============================================================================
ALTER TABLE work_items DROP CONSTRAINT IF EXISTS work_items_assigned_agent_check;
ALTER TABLE work_items ADD CONSTRAINT work_items_assigned_agent_check
  CHECK (assigned_agent IN (
    'project_manager', 'scrum_master', 'developer',
    'code_reviewer', 'qa_tester'
  ) OR assigned_agent IS NULL);

-- =============================================================================
-- UPDATE AGENT_INSTANCES CONSTRAINT
-- =============================================================================
ALTER TABLE agent_instances DROP CONSTRAINT IF EXISTS agent_instances_agent_type_check;
ALTER TABLE agent_instances ADD CONSTRAINT agent_instances_agent_type_check
  CHECK (agent_type IN (
    'project_manager', 'scrum_master', 'developer',
    'code_reviewer', 'qa_tester'
  ));

-- =============================================================================
-- UPDATE COMMENTS AUTHOR_AGENT CONSTRAINT
-- =============================================================================
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_author_agent_check;
ALTER TABLE comments ADD CONSTRAINT comments_author_agent_check
  CHECK (author_agent IN (
    'project_manager', 'scrum_master', 'developer',
    'code_reviewer', 'qa_tester'
  ) OR author_agent IS NULL);

-- =============================================================================
-- UPDATE AGENT_ACTIVITY CONSTRAINT
-- =============================================================================
ALTER TABLE agent_activity DROP CONSTRAINT IF EXISTS agent_activity_agent_type_check;
ALTER TABLE agent_activity ADD CONSTRAINT agent_activity_agent_type_check
  CHECK (agent_type IN (
    'project_manager', 'scrum_master', 'developer',
    'code_reviewer', 'qa_tester'
  ));

-- =============================================================================
-- ADD CODE REVIEW HANDOFF RULES
-- =============================================================================

-- Code reviewer picks up items in 'review' status
INSERT INTO handoff_rules (source_type, processed_by, output_type, creates_types, validation_rules)
VALUES
  ('story', 'code_reviewer', 'review_result', ARRAY[]::VARCHAR[],
   '{"required_fields": ["approved", "feedback"]}'),
  ('bug', 'code_reviewer', 'review_result', ARRAY[]::VARCHAR[],
   '{"required_fields": ["approved", "feedback"]}'),
  ('task', 'code_reviewer', 'review_result', ARRAY[]::VARCHAR[],
   '{"required_fields": ["approved", "feedback"]}')
ON CONFLICT DO NOTHING;

-- QA tester picks up approved items
INSERT INTO handoff_rules (source_type, processed_by, output_type, creates_types, validation_rules)
VALUES
  ('story', 'qa_tester', 'test_result', ARRAY['bug']::VARCHAR[],
   '{"required_fields": ["passed", "test_notes"]}')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- ADD STATUS WORKFLOW VIEW
-- =============================================================================
CREATE OR REPLACE VIEW work_item_pipeline AS
SELECT
  wi.id,
  wi.title,
  wi.type,
  wi.status,
  wi.priority,
  wi.assigned_agent,
  wi.project_id,
  p.name as project_name,
  wi.parent_id,
  parent.title as parent_title,
  wi.story_points,
  wi.created_at,
  wi.started_at,
  wi.completed_at,
  CASE
    WHEN wi.status = 'ready' AND wi.type IN ('feature', 'project_spec') THEN 'project_manager'
    WHEN wi.status = 'ready' AND wi.type = 'prd' THEN 'scrum_master'
    WHEN wi.status = 'ready' AND wi.type IN ('story', 'bug', 'task') THEN 'developer'
    WHEN wi.status = 'review' THEN 'code_reviewer'
    WHEN wi.status = 'testing' THEN 'qa_tester'
    ELSE NULL
  END as next_agent,
  EXTRACT(EPOCH FROM (NOW() - wi.updated_at)) / 3600 as hours_since_update
FROM work_items wi
JOIN projects p ON p.id = wi.project_id
LEFT JOIN work_items parent ON parent.id = wi.parent_id
WHERE wi.status NOT IN ('done', 'backlog')
ORDER BY
  CASE wi.priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  wi.created_at;

-- Grant access to the view
GRANT SELECT ON work_item_pipeline TO authenticated;
