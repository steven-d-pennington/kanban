# STORY-008: Real-time Updates

## Overview
Implement real-time subscriptions using Supabase Realtime to keep the Kanban board synchronized across all connected clients.

## Status
**Current**: BACKLOG
**Phase**: 2 - Core Features
**Priority**: HIGH
**Estimated Effort**: Medium

---

## User Story
As a user, I want to see changes made by other users and agents immediately so that I always have an up-to-date view of the board.

---

## Acceptance Criteria

- [ ] Subscribe to work item changes (INSERT, UPDATE, DELETE)
- [ ] UI updates instantly when items are added/modified/deleted
- [ ] Subscribe to comment additions
- [ ] Subscribe to agent activity
- [ ] Connection status indicator
- [ ] Automatic reconnection on disconnect
- [ ] No duplicate items on reconnection
- [ ] Presence: show who's currently viewing the board
- [ ] Cleanup subscriptions on unmount

---

## Technical Notes

### Realtime Subscription Hook
```typescript
// src/hooks/useRealtimeSubscription.ts
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkItemsStore } from '@/stores/workItemsStore'

export function useWorkItemsSubscription(projectId: string) {
  const { addItem, updateItem, removeItem } = useWorkItemsStore()

  useEffect(() => {
    const channel = supabase
      .channel(`work_items:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'work_items',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          addItem(payload.new as WorkItem)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'work_items',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          updateItem(payload.new.id, payload.new as WorkItem)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'work_items',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          removeItem(payload.old.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, addItem, updateItem, removeItem])
}
```

### Agent Activity Subscription
```typescript
// src/hooks/useAgentActivitySubscription.ts
export function useAgentActivitySubscription(workItemId?: string) {
  const [activities, setActivities] = useState<AgentActivity[]>([])

  useEffect(() => {
    const filter = workItemId
      ? `work_item_id=eq.${workItemId}`
      : undefined

    const channel = supabase
      .channel('agent_activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_activity',
          filter
        },
        (payload) => {
          setActivities(prev => [payload.new as AgentActivity, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workItemId])

  return activities
}
```

### Presence Tracking
```typescript
// src/hooks/usePresence.ts
export function usePresence(projectId: string) {
  const [users, setUsers] = useState<PresenceUser[]>([])
  const { user } = useAuthStore()

  useEffect(() => {
    const channel = supabase.channel(`presence:${projectId}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const presentUsers = Object.values(state).flat() as PresenceUser[]
        setUsers(presentUsers)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await channel.track({
            user_id: user.id,
            email: user.email,
            online_at: new Date().toISOString()
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, user])

  return users
}
```

### Connection Status
```typescript
// src/hooks/useConnectionStatus.ts
export function useConnectionStatus() {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting')

  useEffect(() => {
    const channel = supabase.channel('connection-status')

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') setStatus('connected')
      else if (status === 'CLOSED') setStatus('disconnected')
      else setStatus('connecting')
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return status
}
```

---

## UI Components Needed

- [ ] `ConnectionIndicator` - Shows connection status
- [ ] `PresenceAvatars` - Shows who's online
- [ ] `LiveUpdateBadge` - Indicates item just updated

---

## Related Stories
- Depends on: STORY-002, STORY-006
- Blocks: STORY-012

---

## Notes
- Supabase Realtime requires RLS policies to be properly configured
- Consider debouncing rapid updates
- Add visual feedback when items update (brief highlight animation)
