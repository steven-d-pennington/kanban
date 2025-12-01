# STORY-011: Claim/Release Mechanisms

## Overview
Implement atomic claim and release mechanisms for agents to take ownership of work items and prevent conflicts.

## Status
**Current**: COMPLETED
**Phase**: 3 - Agent Integration
**Priority**: HIGH
**Estimated Effort**: Medium
**Completed**: December 1, 2024

---

## User Story
As an AI agent, I want to claim work items atomically so that no two agents process the same item simultaneously.

---

## Acceptance Criteria

- [x] Atomic claim operation (prevents race conditions)
- [x] Claim timeout/expiration (auto-release stale claims)
- [x] Manual release operation
- [x] View currently claimed items by agent
- [x] Claim queue for high-demand items
- [x] Notifications when items become claimable
- [x] Claim history tracking
- [x] Admin override to force-release items

## Implementation Summary

**Database Changes** (`supabase/migrations/002_agent_integration.sql`):
- Added `release_stale_claims()` function for auto-releasing stale claims
- Added `force_release_work_item()` function for admin override
- Created `agent_claimed_items` view for monitoring claimed items
- Enhanced claim/release functions with activity logging

**Agent SDK** (`agent/lib/workItems.ts`):
- `claimItem()`: Atomic claim with rate limiting
- `releaseItem()`: Release with reason tracking
- `claimNextItem()`: Retry logic for claiming
- `getClaimedItems()`: View items claimed by this agent

**Frontend** (`frontend/src/components/AgentInstancesPanel.tsx`):
- Currently claimed items display with stale claim warnings
- Force release functionality for admins
- Real-time updates on claimed items

---

## Technical Notes

### Claim Edge Function
```typescript
// supabase/functions/agent-claim/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const { workItemId, agentType, agentInstanceId } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Use transaction for atomic claim
  const { data, error } = await supabase.rpc('claim_work_item', {
    p_work_item_id: workItemId,
    p_agent_type: agentType,
    p_agent_instance_id: agentInstanceId
  })

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, claimed: data }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

### Atomic Claim Function (PostgreSQL)
```sql
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
    details
  ) VALUES (
    p_work_item_id,
    p_agent_type,
    p_agent_instance_id,
    CASE WHEN v_claimed THEN 'claimed' ELSE 'claim_failed' END,
    jsonb_build_object('claimed', v_claimed)
  );

  RETURN COALESCE(v_claimed, FALSE);
END;
$$ LANGUAGE plpgsql;
```

### Release Function
```sql
CREATE OR REPLACE FUNCTION release_work_item(
  p_work_item_id UUID,
  p_agent_instance_id VARCHAR,
  p_reason VARCHAR DEFAULT 'released'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_released BOOLEAN := FALSE;
BEGIN
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
  INSERT INTO agent_activity (
    work_item_id,
    agent_type,
    agent_instance_id,
    action,
    details
  ) VALUES (
    p_work_item_id,
    (SELECT assigned_agent FROM work_items WHERE id = p_work_item_id),
    p_agent_instance_id,
    'released',
    jsonb_build_object('reason', p_reason)
  );

  RETURN COALESCE(v_released, FALSE);
END;
$$ LANGUAGE plpgsql;
```

### Auto-Release Stale Claims (Cron Job)
```sql
-- Release items claimed more than 30 minutes ago without updates
CREATE OR REPLACE FUNCTION release_stale_claims()
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
      metadata = metadata - 'claimed_by_instance' - 'claimed_at'
    WHERE assigned_agent IS NOT NULL
      AND status = 'in_progress'
      AND (metadata->>'claimed_at')::timestamptz < NOW() - INTERVAL '30 minutes'
      AND updated_at < NOW() - INTERVAL '30 minutes'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM stale_items;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron
SELECT cron.schedule('release-stale-claims', '*/5 * * * *', 'SELECT release_stale_claims()');
```

### Agent SDK Helpers
```typescript
// agent/lib/workItems.ts
export async function claimNextItem(type: WorkItemType): Promise<WorkItem | null> {
  // Find available items
  const { data: items } = await agentClient
    .from('work_items')
    .select('*')
    .eq('status', 'ready')
    .in('type', getTypesForAgent(AGENT_TYPE))
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)

  if (!items?.length) return null

  // Attempt to claim
  const response = await fetch(`${SUPABASE_URL}/functions/v1/agent-claim`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workItemId: items[0].id,
      agentType: AGENT_TYPE,
      agentInstanceId: AGENT_INSTANCE_ID
    })
  })

  const result = await response.json()
  return result.claimed ? items[0] : null
}
```

---

## Related Stories
- Depends on: STORY-010 (agent auth)
- Blocks: STORY-013, STORY-014, STORY-015, STORY-016

---

## Notes
- Use `FOR UPDATE SKIP LOCKED` for polling scenarios
- Consider adding priority queuing for critical items
- Implement backoff strategy for claim retries
