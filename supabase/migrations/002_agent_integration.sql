-- Agent Kanban Board - Agent Integration Schema
-- Migration: 002_agent_integration.sql
-- Phase 3: Agent Integration (STORY-010, STORY-011, STORY-012, STORY-013)

-- =============================================================================
-- STORY-010: AGENT AUTHENTICATION SYSTEM
-- =============================================================================

-- Agent API Keys table for secure agent authentication
CREATE TABLE agent_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_instance_id VARCHAR(255) NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
  api_key_hash VARCHAR(255) NOT NULL, -- Store hashed API keys
  name VARCHAR(255), -- Descriptive name for the key
  permissions JSONB DEFAULT '{}', -- Fine-grained permissions
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_agent_api_keys_instance ON agent_api_keys(agent_instance_id);
CREATE INDEX idx_agent_api_keys_active ON agent_api_keys(is_active) WHERE is_active = TRUE;

-- Rate limiting table for agent operations
CREATE TABLE agent_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_instance_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_instance_id, action, window_start)
);

CREATE INDEX idx_agent_rate_limits_lookup ON agent_rate_limits(agent_instance_id, action, window_start);

-- Function to get current agent type from request headers
CREATE OR REPLACE FUNCTION current_agent_type()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('request.headers', true)::json->>'x-agent-type', '');
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current agent instance from request headers
CREATE OR REPLACE FUNCTION current_agent_instance()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('request.headers', true)::json->>'x-agent-instance', '');
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate agent instance and update last_seen
CREATE OR REPLACE FUNCTION validate_agent(
  p_agent_instance_id VARCHAR,
  p_agent_type VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_valid BOOLEAN := FALSE;
BEGIN
  -- Check if agent instance exists and is active
  UPDATE agent_instances
  SET last_seen_at = NOW()
  WHERE id = p_agent_instance_id
    AND agent_type = p_agent_type
    AND status = 'active'
  RETURNING TRUE INTO v_valid;

  RETURN COALESCE(v_valid, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to register a new agent instance
CREATE OR REPLACE FUNCTION register_agent_instance(
  p_instance_id VARCHAR,
  p_agent_type VARCHAR,
  p_display_name VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO agent_instances (id, agent_type, display_name, status, last_seen_at)
  VALUES (p_instance_id, p_agent_type, COALESCE(p_display_name, p_instance_id), 'active', NOW())
  ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    last_seen_at = NOW(),
    display_name = COALESCE(EXCLUDED.display_name, agent_instances.display_name);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to deactivate an agent instance
CREATE OR REPLACE FUNCTION deactivate_agent_instance(
  p_instance_id VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deactivated BOOLEAN := FALSE;
BEGIN
  UPDATE agent_instances
  SET status = 'inactive'
  WHERE id = p_instance_id
  RETURNING TRUE INTO v_deactivated;

  -- Release any claimed work items
  UPDATE work_items
  SET
    assigned_agent = NULL,
    status = 'ready',
    started_at = NULL,
    metadata = metadata - 'claimed_by_instance' - 'claimed_at'
  WHERE metadata->>'claimed_by_instance' = p_instance_id;

  RETURN COALESCE(v_deactivated, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_agent_rate_limit(
  p_agent_id VARCHAR,
  p_action VARCHAR,
  p_limit INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Calculate window start (truncate to minute)
  v_window_start := date_trunc('minute', NOW());

  -- Get current count in window
  SELECT COALESCE(SUM(request_count), 0) INTO v_count
  FROM agent_rate_limits
  WHERE agent_instance_id = p_agent_id
    AND action = p_action
    AND window_start > NOW() - (p_window_minutes || ' minutes')::interval;

  -- If under limit, increment and return true
  IF v_count < p_limit THEN
    INSERT INTO agent_rate_limits (agent_instance_id, action, window_start, request_count)
    VALUES (p_agent_id, p_action, v_window_start, 1)
    ON CONFLICT (agent_instance_id, action, window_start)
    DO UPDATE SET request_count = agent_rate_limits.request_count + 1;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STORY-011: CLAIM/RELEASE MECHANISMS ENHANCEMENTS
-- =============================================================================

-- Function to release stale claims (for scheduled job)
CREATE OR REPLACE FUNCTION release_stale_claims(
  p_stale_minutes INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH stale_items AS (
    UPDATE work_items
    SET
      assigned_agent = NULL,
      status = 'ready',
      started_at = NULL,
      metadata = metadata - 'claimed_by_instance' - 'claimed_at' ||
        jsonb_build_object('auto_released_at', NOW(), 'auto_release_reason', 'stale_claim')
    WHERE assigned_agent IS NOT NULL
      AND status = 'in_progress'
      AND (metadata->>'claimed_at')::timestamptz < NOW() - (p_stale_minutes || ' minutes')::interval
      AND updated_at < NOW() - (p_stale_minutes || ' minutes')::interval
    RETURNING id, assigned_agent, metadata->>'claimed_by_instance' as instance_id
  ),
  logged AS (
    INSERT INTO agent_activity (work_item_id, agent_type, agent_instance_id, action, details, status)
    SELECT
      id,
      assigned_agent,
      instance_id,
      'released',
      jsonb_build_object('reason', 'stale_claim_auto_release', 'stale_minutes', p_stale_minutes),
      'warning'
    FROM stale_items
  )
  SELECT COUNT(*) INTO v_count FROM stale_items;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function for admin to force-release a work item
CREATE OR REPLACE FUNCTION force_release_work_item(
  p_work_item_id UUID,
  p_reason VARCHAR DEFAULT 'admin_force_release'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_released BOOLEAN := FALSE;
  v_agent_type VARCHAR;
  v_instance_id VARCHAR;
BEGIN
  -- Get current assignment info
  SELECT assigned_agent, metadata->>'claimed_by_instance'
  INTO v_agent_type, v_instance_id
  FROM work_items
  WHERE id = p_work_item_id;

  -- Force release the item
  UPDATE work_items
  SET
    assigned_agent = NULL,
    status = 'ready',
    started_at = NULL,
    metadata = metadata - 'claimed_by_instance' - 'claimed_at' ||
      jsonb_build_object('force_released_at', NOW(), 'force_release_reason', p_reason)
  WHERE id = p_work_item_id
    AND assigned_agent IS NOT NULL
  RETURNING TRUE INTO v_released;

  -- Log the force release
  IF v_released THEN
    INSERT INTO agent_activity (
      work_item_id, agent_type, agent_instance_id, action, details, status
    ) VALUES (
      p_work_item_id,
      v_agent_type,
      v_instance_id,
      'released',
      jsonb_build_object('reason', p_reason, 'forced', true),
      'warning'
    );
  END IF;

  RETURN COALESCE(v_released, FALSE);
END;
$$ LANGUAGE plpgsql;

-- View for currently claimed items by agent
CREATE OR REPLACE VIEW agent_claimed_items AS
SELECT
  wi.id,
  wi.title,
  wi.type,
  wi.priority,
  wi.assigned_agent,
  wi.metadata->>'claimed_by_instance' as claimed_by_instance,
  (wi.metadata->>'claimed_at')::timestamptz as claimed_at,
  wi.started_at,
  wi.project_id,
  p.name as project_name,
  EXTRACT(EPOCH FROM (NOW() - (wi.metadata->>'claimed_at')::timestamptz)) / 60 as claimed_minutes_ago
FROM work_items wi
JOIN projects p ON p.id = wi.project_id
WHERE wi.assigned_agent IS NOT NULL
  AND wi.status = 'in_progress';

-- =============================================================================
-- STORY-012: AGENT ACTIVITY LOGGING ENHANCEMENTS
-- =============================================================================

-- Add additional action types
ALTER TABLE agent_activity
  DROP CONSTRAINT IF EXISTS agent_activity_action_check;

ALTER TABLE agent_activity
  ADD CONSTRAINT agent_activity_action_check
  CHECK (action IN (
    'claimed', 'processing', 'completed', 'handed_off',
    'failed', 'released', 'escalated', 'retrying',
    'waiting', 'started', 'paused', 'resumed'
  ));

-- View for recent activity feed
CREATE OR REPLACE VIEW agent_activity_feed AS
SELECT
  aa.id,
  aa.work_item_id,
  wi.title as work_item_title,
  wi.type as work_item_type,
  aa.agent_type,
  aa.agent_instance_id,
  ai.display_name as agent_display_name,
  aa.action,
  aa.details,
  aa.duration_ms,
  aa.status,
  aa.error_message,
  aa.created_at,
  p.id as project_id,
  p.name as project_name
FROM agent_activity aa
LEFT JOIN work_items wi ON wi.id = aa.work_item_id
LEFT JOIN projects p ON p.id = wi.project_id
LEFT JOIN agent_instances ai ON ai.id = aa.agent_instance_id
ORDER BY aa.created_at DESC;

-- Function to log agent activity with all fields
CREATE OR REPLACE FUNCTION log_agent_activity(
  p_work_item_id UUID,
  p_agent_type VARCHAR,
  p_agent_instance_id VARCHAR,
  p_action VARCHAR,
  p_details JSONB DEFAULT '{}',
  p_status VARCHAR DEFAULT 'success',
  p_duration_ms INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_input_data JSONB DEFAULT NULL,
  p_output_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO agent_activity (
    work_item_id, agent_type, agent_instance_id, action,
    details, status, duration_ms, error_message, input_data, output_data
  ) VALUES (
    p_work_item_id, p_agent_type, p_agent_instance_id, p_action,
    p_details, p_status, p_duration_ms, p_error_message, p_input_data, p_output_data
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old activity logs
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs(
  p_retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM agent_activity
    WHERE created_at < NOW() - (p_retention_days || ' days')::interval
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM deleted;

  -- Also clean up old rate limit entries
  DELETE FROM agent_rate_limits
  WHERE created_at < NOW() - INTERVAL '1 day';

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STORY-013: HANDOFF PROTOCOLS
-- =============================================================================

-- Handoff rules configuration table
CREATE TABLE handoff_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type VARCHAR(50) NOT NULL, -- work item type that triggers handoff
  processed_by VARCHAR(100) NOT NULL, -- agent type that processes this
  output_type VARCHAR(100) NOT NULL, -- type of output expected
  creates_types VARCHAR(50)[] DEFAULT '{}', -- child item types to create
  validation_rules JSONB DEFAULT '{}', -- validation requirements
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default handoff rules
INSERT INTO handoff_rules (source_type, processed_by, output_type, creates_types, validation_rules) VALUES
  ('project_spec', 'project_manager', 'prd', ARRAY['prd'], '{"required_fields": ["requirements"]}'),
  ('feature', 'project_manager', 'prd', ARRAY['prd'], '{"required_fields": ["requirements"]}'),
  ('prd', 'scrum_master', 'stories', ARRAY['story'], '{"required_fields": ["stories"]}'),
  ('story', 'developer', 'implementation', ARRAY[]::VARCHAR[], '{"required_fields": ["pr_url", "completed"]}'),
  ('bug', 'developer', 'fix', ARRAY[]::VARCHAR[], '{"required_fields": ["pr_url", "completed"]}'),
  ('task', 'developer', 'completion', ARRAY[]::VARCHAR[], '{"required_fields": ["completed"]}');

-- Handoff history table
CREATE TABLE handoff_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_work_item_id UUID NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  target_work_item_ids UUID[] DEFAULT '{}', -- child items created
  from_agent_type VARCHAR(100) NOT NULL,
  from_agent_instance VARCHAR(255),
  to_agent_type VARCHAR(100), -- NULL if going to human
  output_data JSONB,
  validation_passed BOOLEAN DEFAULT TRUE,
  validation_errors TEXT[],
  handoff_status VARCHAR(50) DEFAULT 'completed' CHECK (handoff_status IN ('completed', 'failed', 'rolled_back')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_handoff_history_source ON handoff_history(source_work_item_id);
CREATE INDEX idx_handoff_history_created ON handoff_history(created_at DESC);

-- Function to complete a work item and create handoff
CREATE OR REPLACE FUNCTION complete_work_item(
  p_work_item_id UUID,
  p_agent_type VARCHAR,
  p_agent_instance_id VARCHAR,
  p_output JSONB,
  p_child_items JSONB DEFAULT '[]' -- Array of {type, title, description, metadata}
)
RETURNS JSONB AS $$
DECLARE
  v_work_item RECORD;
  v_child_item RECORD;
  v_child_ids UUID[] := '{}';
  v_child JSONB;
  v_new_id UUID;
  v_handoff_rule RECORD;
  v_validation_errors TEXT[] := '{}';
BEGIN
  -- Get the work item
  SELECT * INTO v_work_item
  FROM work_items
  WHERE id = p_work_item_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Work item not found');
  END IF;

  -- Validate agent owns this item
  IF v_work_item.metadata->>'claimed_by_instance' != p_agent_instance_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agent does not own this work item');
  END IF;

  -- Get handoff rule for this type
  SELECT * INTO v_handoff_rule
  FROM handoff_rules
  WHERE source_type = v_work_item.type
    AND processed_by = p_agent_type
    AND is_active = TRUE
  LIMIT 1;

  -- Validate output if rule exists
  IF v_handoff_rule IS NOT NULL AND v_handoff_rule.validation_rules IS NOT NULL THEN
    -- Check required fields
    IF v_handoff_rule.validation_rules ? 'required_fields' THEN
      FOR v_child IN SELECT * FROM jsonb_array_elements_text(v_handoff_rule.validation_rules->'required_fields')
      LOOP
        IF NOT (p_output ? v_child::text) AND NOT (p_output->v_child::text IS NOT NULL) THEN
          v_validation_errors := array_append(v_validation_errors, 'Missing required field: ' || v_child::text);
        END IF;
      END LOOP;
    END IF;
  END IF;

  -- Update parent item to done
  UPDATE work_items
  SET
    status = 'done',
    completed_at = NOW(),
    assigned_agent = NULL,
    metadata = metadata || jsonb_build_object(
      'output', p_output,
      'completed_by_agent', p_agent_type,
      'completed_by_instance', p_agent_instance_id,
      'completed_at', NOW()
    ) - 'claimed_by_instance' - 'claimed_at'
  WHERE id = p_work_item_id;

  -- Create child items
  FOR v_child IN SELECT * FROM jsonb_array_elements(p_child_items)
  LOOP
    INSERT INTO work_items (
      project_id,
      parent_id,
      title,
      description,
      type,
      status,
      priority,
      metadata,
      created_by
    ) VALUES (
      v_work_item.project_id,
      p_work_item_id,
      v_child->>'title',
      v_child->>'description',
      v_child->>'type',
      'ready', -- Ready for next agent
      v_work_item.priority,
      COALESCE(v_child->'metadata', '{}'::jsonb) || jsonb_build_object(
        'created_by_agent', p_agent_type,
        'parent_output', p_output
      ),
      v_work_item.created_by
    )
    RETURNING id INTO v_new_id;

    v_child_ids := array_append(v_child_ids, v_new_id);
  END LOOP;

  -- Record handoff history
  INSERT INTO handoff_history (
    source_work_item_id,
    target_work_item_ids,
    from_agent_type,
    from_agent_instance,
    to_agent_type,
    output_data,
    validation_passed,
    validation_errors
  ) VALUES (
    p_work_item_id,
    v_child_ids,
    p_agent_type,
    p_agent_instance_id,
    CASE WHEN v_handoff_rule IS NOT NULL THEN v_handoff_rule.processed_by ELSE NULL END,
    p_output,
    array_length(v_validation_errors, 1) IS NULL,
    v_validation_errors
  );

  -- Log activity
  INSERT INTO agent_activity (
    work_item_id, agent_type, agent_instance_id, action, details, output_data, status
  ) VALUES (
    p_work_item_id,
    p_agent_type,
    p_agent_instance_id,
    'handed_off',
    jsonb_build_object(
      'child_items', v_child_ids,
      'child_count', array_length(v_child_ids, 1)
    ),
    p_output,
    'success'
  );

  RETURN jsonb_build_object(
    'success', true,
    'completed_item', p_work_item_id,
    'child_items', v_child_ids,
    'validation_errors', v_validation_errors
  );
END;
$$ LANGUAGE plpgsql;

-- Function for human escalation
CREATE OR REPLACE FUNCTION escalate_to_human(
  p_work_item_id UUID,
  p_agent_instance_id VARCHAR,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_agent_type VARCHAR;
BEGIN
  -- Get agent type
  SELECT assigned_agent INTO v_agent_type
  FROM work_items
  WHERE id = p_work_item_id;

  -- Release the work item
  PERFORM release_work_item(p_work_item_id, p_agent_instance_id, 'escalated');

  -- Update metadata with escalation info
  UPDATE work_items
  SET metadata = metadata || jsonb_build_object(
    'escalated', true,
    'escalation_reason', p_reason,
    'escalated_at', NOW(),
    'escalated_by_agent', v_agent_type,
    'escalated_by_instance', p_agent_instance_id
  )
  WHERE id = p_work_item_id;

  -- Add system comment
  INSERT INTO comments (work_item_id, author_agent, content, is_system_message)
  VALUES (
    p_work_item_id,
    v_agent_type,
    '**Escalated to human**: ' || p_reason,
    true
  );

  -- Log activity
  INSERT INTO agent_activity (
    work_item_id, agent_type, agent_instance_id, action, details, status
  ) VALUES (
    p_work_item_id,
    v_agent_type,
    p_agent_instance_id,
    'escalated',
    jsonb_build_object('reason', p_reason),
    'warning'
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- AGENT-SPECIFIC RLS POLICIES
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoff_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoff_history ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (agents use service key)
-- Note: In Supabase, service_role key bypasses RLS

-- Users can view handoff history for their projects
CREATE POLICY "Users can view handoff history" ON handoff_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM work_items wi
      JOIN projects p ON p.id = wi.project_id
      WHERE wi.id = handoff_history.source_work_item_id
      AND p.created_by = auth.uid()
    )
  );

-- Users can view handoff rules (read-only)
CREATE POLICY "Users can view handoff rules" ON handoff_rules
  FOR SELECT USING (true);

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION current_agent_type TO authenticated;
GRANT EXECUTE ON FUNCTION current_agent_instance TO authenticated;
GRANT EXECUTE ON FUNCTION validate_agent TO authenticated;
GRANT EXECUTE ON FUNCTION register_agent_instance TO authenticated;
GRANT EXECUTE ON FUNCTION deactivate_agent_instance TO authenticated;
GRANT EXECUTE ON FUNCTION check_agent_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION release_stale_claims TO authenticated;
GRANT EXECUTE ON FUNCTION force_release_work_item TO authenticated;
GRANT EXECUTE ON FUNCTION log_agent_activity TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION complete_work_item TO authenticated;
GRANT EXECUTE ON FUNCTION escalate_to_human TO authenticated;

GRANT SELECT ON agent_claimed_items TO authenticated;
GRANT SELECT ON agent_activity_feed TO authenticated;
