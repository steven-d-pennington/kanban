-- Allow setting specific status on completion (e.g., 'review') instead of hardcoded 'done'
-- Migration: 006_allow_review_status.sql

DROP FUNCTION IF EXISTS complete_work_item(UUID, VARCHAR, VARCHAR, JSONB, JSONB);

CREATE OR REPLACE FUNCTION complete_work_item(
  p_work_item_id UUID,
  p_agent_type VARCHAR,
  p_agent_instance_id VARCHAR,
  p_output JSONB,
  p_child_items JSONB DEFAULT '[]', -- Array of {type, title, description, metadata}
  p_target_status VARCHAR DEFAULT 'done' -- Allow overriding status (e.g. to 'review')
)
RETURNS JSONB AS $$
DECLARE
  v_work_item RECORD;
  v_child_ids UUID[] := '{}';
  v_child_item JSONB;
  v_required_field TEXT;
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
      FOR v_required_field IN SELECT * FROM jsonb_array_elements_text(v_handoff_rule.validation_rules->'required_fields')
      LOOP
        IF NOT (p_output ? v_required_field) AND NOT (p_output->v_required_field IS NOT NULL) THEN
          v_validation_errors := array_append(v_validation_errors, 'Missing required field: ' || v_required_field);
        END IF;
      END LOOP;
    END IF;
  END IF;

  -- Update parent item to target status
  UPDATE work_items
  SET
    status = p_target_status,
    completed_at = CASE WHEN p_target_status = 'done' THEN NOW() ELSE NULL END, -- Only set completed_at if done
    assigned_agent = NULL,
    metadata = metadata || jsonb_build_object(
      'output', p_output,
      'completed_by_agent', p_agent_type,
      'completed_by_instance', p_agent_instance_id,
      'last_processed_at', NOW()
    ) - 'claimed_by_instance' - 'claimed_at'
  WHERE id = p_work_item_id;

  -- Create child items
  FOR v_child_item IN SELECT * FROM jsonb_array_elements(p_child_items)
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
      v_child_item->>'title',
      v_child_item->>'description',
      v_child_item->>'type',
      'ready', -- Ready for next agent
      v_work_item.priority,
      COALESCE(v_child_item->'metadata', '{}'::jsonb) || jsonb_build_object(
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
      'child_items', to_jsonb(v_child_ids),
      'child_count', array_length(v_child_ids, 1),
      'target_status', p_target_status
    ),
    p_output,
    'success'
  );

  RETURN jsonb_build_object(
    'success', true,
    'completed_item', p_work_item_id,
    'child_items', to_jsonb(v_child_ids),
    'validation_errors', to_jsonb(v_validation_errors)
  );
END;
$$ LANGUAGE plpgsql;
