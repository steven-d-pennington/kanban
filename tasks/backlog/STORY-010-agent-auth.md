# STORY-010: Agent Authentication System

## Overview
Implement authentication and authorization mechanisms for AI agents to securely interact with the Kanban board API.

## Status
**Current**: BACKLOG
**Phase**: 3 - Agent Integration
**Priority**: HIGH
**Estimated Effort**: Medium

---

## User Story
As an AI agent, I need to authenticate with the system so that I can securely access and modify work items assigned to me.

---

## Acceptance Criteria

- [ ] Agent service account creation in Supabase
- [ ] Agent-specific API keys/tokens
- [ ] Custom headers for agent identification:
  - `x-agent-type`
  - `x-agent-instance`
- [ ] RLS policies for agent access
- [ ] Rate limiting for agent operations
- [ ] Agent activity tracking per instance
- [ ] Revoke agent access capability
- [ ] Agent authentication validation middleware

---

## Technical Notes

### Agent Client Setup
```typescript
// agent/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!
const AGENT_TYPE = process.env.AGENT_TYPE! // 'project_manager', 'scrum_master', 'developer'
const AGENT_INSTANCE_ID = process.env.AGENT_INSTANCE_ID!

export const agentClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  global: {
    headers: {
      'x-agent-type': AGENT_TYPE,
      'x-agent-instance': AGENT_INSTANCE_ID
    }
  }
})
```

### Agent RLS Policies
```sql
-- Create function to get current agent type from header
CREATE OR REPLACE FUNCTION current_agent_type()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('request.headers', true)::json->>'x-agent-type';
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agents can read all work items in ready status for their type
CREATE POLICY "Agents can view ready items" ON work_items
  FOR SELECT USING (
    status = 'ready' AND
    (
      (current_agent_type() = 'project_manager' AND type IN ('project_spec', 'feature')) OR
      (current_agent_type() = 'scrum_master' AND type = 'prd') OR
      (current_agent_type() = 'developer' AND type IN ('story', 'bug', 'task'))
    )
  );

-- Agents can update items they have claimed
CREATE POLICY "Agents can update claimed items" ON work_items
  FOR UPDATE USING (
    assigned_agent = current_agent_type()
  );
```

### Agent Types Enum
```sql
CREATE TYPE agent_type AS ENUM (
  'project_manager',
  'scrum_master',
  'developer'
);

-- Track registered agent instances
CREATE TABLE agent_instances (
  id VARCHAR(255) PRIMARY KEY,
  agent_type agent_type NOT NULL,
  display_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Agent API Middleware (Edge Function)
```typescript
// supabase/functions/_shared/validateAgent.ts
export async function validateAgent(req: Request): Promise<AgentInfo | null> {
  const agentType = req.headers.get('x-agent-type')
  const agentInstance = req.headers.get('x-agent-instance')

  if (!agentType || !agentInstance) {
    return null
  }

  // Validate agent instance exists and is active
  const { data: agent } = await supabase
    .from('agent_instances')
    .select('*')
    .eq('id', agentInstance)
    .eq('status', 'active')
    .single()

  if (!agent) {
    return null
  }

  // Update last seen
  await supabase
    .from('agent_instances')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', agentInstance)

  return {
    type: agentType,
    instanceId: agentInstance,
    ...agent
  }
}
```

### Rate Limiting
```sql
-- Create rate limit tracking table
CREATE TABLE agent_rate_limits (
  agent_instance_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER DEFAULT 1,
  PRIMARY KEY (agent_instance_id, action, window_start)
);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_agent_rate_limit(
  p_agent_id VARCHAR,
  p_action VARCHAR,
  p_limit INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(count), 0) INTO v_count
  FROM agent_rate_limits
  WHERE agent_instance_id = p_agent_id
    AND action = p_action
    AND window_start > NOW() - (p_window_minutes || ' minutes')::interval;

  RETURN v_count < p_limit;
END;
$$ LANGUAGE plpgsql;
```

---

## Related Stories
- Depends on: STORY-003 (database schema)
- Blocks: STORY-011, STORY-012, STORY-014, STORY-015, STORY-016

---

## Notes
- Service keys should never be exposed to frontend
- Consider using Supabase Vault for storing sensitive agent credentials
- Implement key rotation mechanism for security
- Log all agent authentication attempts for auditing
