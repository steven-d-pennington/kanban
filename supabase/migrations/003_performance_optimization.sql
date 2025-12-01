-- Agent Kanban Board - Performance Optimization
-- Migration: 003_performance_optimization.sql
-- Phase 5: Polish (STORY-019)

-- =============================================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =============================================================================

-- Composite index for common project + status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_items_project_status
  ON work_items(project_id, status);

-- Index for agent assignment queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_items_assigned_status
  ON work_items(assigned_agent, status)
  WHERE assigned_agent IS NOT NULL;

-- Index for ordering and pagination
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_items_updated
  ON work_items(updated_at DESC);

-- Index for completed items (for analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_items_completed
  ON work_items(completed_at DESC)
  WHERE completed_at IS NOT NULL;

-- Partial index for recent agent activity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_activity_recent
  ON agent_activity(created_at DESC)
  WHERE created_at > NOW() - INTERVAL '7 days';

-- Partial index for active work items (not done/archived)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_items_active
  ON work_items(project_id, column_order)
  WHERE status NOT IN ('done');

-- Index for cycle time queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_items_cycle_time
  ON work_items(project_id, started_at, completed_at)
  WHERE started_at IS NOT NULL AND completed_at IS NOT NULL;

-- =============================================================================
-- METRICS VIEWS FOR ANALYTICS
-- =============================================================================

-- View for work item metrics (for analytics dashboard)
CREATE OR REPLACE VIEW work_item_metrics AS
SELECT
  project_id,
  status,
  type,
  EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600 as cycle_time_hours,
  EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600 as lead_time_hours,
  story_points,
  assigned_agent IS NOT NULL as completed_by_agent,
  DATE_TRUNC('week', completed_at) as completed_week,
  created_at,
  completed_at
FROM work_items
WHERE status = 'done';

-- View for bottleneck detection
CREATE OR REPLACE VIEW work_item_bottlenecks AS
SELECT
  wi.id,
  wi.title,
  wi.status,
  wi.type,
  wi.priority,
  EXTRACT(EPOCH FROM (NOW() - wi.updated_at)) / 3600 as hours_in_status,
  wi.assigned_to,
  wi.assigned_agent,
  wi.project_id,
  p.name as project_name
FROM work_items wi
JOIN projects p ON p.id = wi.project_id
WHERE wi.status NOT IN ('backlog', 'done')
  AND wi.updated_at < NOW() - INTERVAL '24 hours'
ORDER BY hours_in_status DESC;

-- View for agent performance metrics
CREATE OR REPLACE VIEW agent_performance_metrics AS
SELECT
  ai.id as agent_id,
  ai.agent_type,
  ai.display_name,
  ai.status,
  ai.last_seen_at,
  COUNT(aa.id) FILTER (WHERE aa.created_at > NOW() - INTERVAL '24 hours') as tasks_today,
  COUNT(aa.id) FILTER (WHERE aa.created_at > NOW() - INTERVAL '7 days') as tasks_week,
  COUNT(aa.id) as tasks_total,
  COUNT(aa.id) FILTER (WHERE aa.status = 'success') as success_count,
  ROUND(
    COUNT(aa.id) FILTER (WHERE aa.status = 'success')::numeric /
    NULLIF(COUNT(aa.id), 0) * 100,
    1
  ) as success_rate,
  ROUND(AVG(aa.duration_ms)::numeric, 0) as avg_duration_ms,
  COUNT(aa.id) FILTER (WHERE aa.status = 'error' AND aa.created_at > NOW() - INTERVAL '24 hours') as errors_today
FROM agent_instances ai
LEFT JOIN agent_activity aa ON aa.agent_instance_id = ai.id
GROUP BY ai.id, ai.agent_type, ai.display_name, ai.status, ai.last_seen_at;

-- =============================================================================
-- FUNCTION FOR EFFICIENT METRICS CALCULATION
-- =============================================================================

-- Function to get project summary metrics efficiently
CREATE OR REPLACE FUNCTION get_project_metrics(p_project_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_items', COUNT(*),
    'by_status', jsonb_object_agg(status, status_count),
    'by_type', jsonb_object_agg(type, type_count),
    'avg_cycle_time_hours', ROUND(AVG(cycle_time_hours)::numeric, 1),
    'avg_lead_time_hours', ROUND(AVG(lead_time_hours)::numeric, 1),
    'total_story_points', COALESCE(SUM(story_points), 0),
    'completed_story_points', COALESCE(SUM(story_points) FILTER (WHERE status = 'done'), 0)
  )
  INTO v_result
  FROM (
    SELECT
      status,
      type,
      story_points,
      EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600 as cycle_time_hours,
      EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600 as lead_time_hours,
      COUNT(*) OVER (PARTITION BY status) as status_count,
      COUNT(*) OVER (PARTITION BY type) as type_count
    FROM work_items
    WHERE project_id = p_project_id
  ) subq;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT ON work_item_metrics TO authenticated;
GRANT SELECT ON work_item_bottlenecks TO authenticated;
GRANT SELECT ON agent_performance_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_metrics TO authenticated;
