# STORY-019: Performance Optimization

## Overview
Optimize application performance including database queries, frontend rendering, real-time updates, and caching.

## Status
**Current**: BACKLOG
**Phase**: 5 - Polish
**Priority**: MEDIUM
**Estimated Effort**: Medium

---

## User Story
As a user, I want the application to be fast and responsive so that I can work efficiently without waiting for pages to load.

---

## Acceptance Criteria

- [ ] Initial page load < 2 seconds (LCP)
- [ ] Interaction response < 100ms (INP)
- [ ] Database queries optimized with proper indexes
- [ ] Implement pagination for large lists
- [ ] Add virtualization for long columns
- [ ] Optimize bundle size (code splitting)
- [ ] Add caching layer for frequent queries
- [ ] Optimize real-time subscriptions
- [ ] Reduce unnecessary re-renders
- [ ] Add performance monitoring

---

## Technical Notes

### Database Optimization

#### Indexes
```sql
-- Additional indexes for common queries
CREATE INDEX CONCURRENTLY idx_work_items_project_status
  ON work_items(project_id, status);

CREATE INDEX CONCURRENTLY idx_work_items_assigned_status
  ON work_items(assigned_agent, status)
  WHERE assigned_agent IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_work_items_updated
  ON work_items(updated_at DESC);

CREATE INDEX CONCURRENTLY idx_agent_activity_recent
  ON agent_activity(created_at DESC)
  WHERE created_at > NOW() - INTERVAL '7 days';

-- Partial index for active items
CREATE INDEX CONCURRENTLY idx_work_items_active
  ON work_items(project_id, column_order)
  WHERE status NOT IN ('done', 'archived');
```

#### Query Optimization
```typescript
// Before: N+1 query problem
const items = await supabase.from('work_items').select('*')
for (const item of items) {
  const comments = await supabase.from('comments').select('*').eq('work_item_id', item.id)
}

// After: Single query with join
const items = await supabase
  .from('work_items')
  .select(`
    *,
    comments(id, content, created_at),
    agent_activity(id, action, created_at)
  `)
  .eq('project_id', projectId)
  .order('column_order')
```

### Frontend Optimization

#### React Query for Caching
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      cacheTime: 1000 * 60 * 5, // 5 minutes
    }
  }
})

// src/hooks/useWorkItems.ts
export function useWorkItems(projectId: string) {
  return useQuery({
    queryKey: ['workItems', projectId],
    queryFn: () => fetchWorkItems(projectId),
    staleTime: 30000 // 30 seconds for frequently changing data
  })
}
```

#### Virtualization for Long Lists
```typescript
// src/components/board/VirtualizedColumn.tsx
import { useVirtualizer } from '@tanstack/react-virtual'

export function VirtualizedColumn({ items }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated card height
    overscan: 5
  })

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            <WorkItemCard item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### Code Splitting
```typescript
// src/App.tsx
import { lazy, Suspense } from 'react'

// Lazy load heavy components
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'))
const AgentMonitor = lazy(() => import('./pages/AgentMonitor'))

function App() {
  return (
    <Routes>
      <Route path="/board" element={<KanbanBoard />} />
      <Route
        path="/analytics"
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <AnalyticsDashboard />
          </Suspense>
        }
      />
    </Routes>
  )
}
```

#### Memoization
```typescript
// src/components/board/WorkItemCard.tsx
import { memo } from 'react'

export const WorkItemCard = memo(function WorkItemCard({ item }: Props) {
  // Component implementation
}, (prev, next) => {
  // Custom comparison for efficient updates
  return (
    prev.item.id === next.item.id &&
    prev.item.updated_at === next.item.updated_at
  )
})
```

### Real-time Optimization

#### Throttled Updates
```typescript
// src/hooks/useThrottledRealtimeUpdates.ts
import { useRef, useCallback } from 'react'
import { throttle } from 'lodash-es'

export function useThrottledRealtimeUpdates(
  onUpdate: (items: WorkItem[]) => void
) {
  const pendingUpdates = useRef<Map<string, WorkItem>>(new Map())

  const flushUpdates = useCallback(
    throttle(() => {
      if (pendingUpdates.current.size > 0) {
        onUpdate(Array.from(pendingUpdates.current.values()))
        pendingUpdates.current.clear()
      }
    }, 100),
    [onUpdate]
  )

  const handleUpdate = useCallback((item: WorkItem) => {
    pendingUpdates.current.set(item.id, item)
    flushUpdates()
  }, [flushUpdates])

  return handleUpdate
}
```

#### Selective Subscriptions
```typescript
// Only subscribe to relevant columns' changes
const activeStatuses = ['ready', 'in_progress', 'review']

const channel = supabase
  .channel('work_items_active')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'work_items',
    filter: `project_id=eq.${projectId} AND status=in.(${activeStatuses.join(',')})`
  }, handleChange)
  .subscribe()
```

### Bundle Optimization

#### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'charts': ['recharts'],
          'dnd': ['@dnd-kit/core', '@dnd-kit/sortable']
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
})
```

### Performance Monitoring
```typescript
// src/lib/performance.ts
export function measurePerformance() {
  // Report Core Web Vitals
  if ('web-vitals' in window) {
    import('web-vitals').then(({ getCLS, getFID, getLCP }) => {
      getCLS(console.log)
      getFID(console.log)
      getLCP(console.log)
    })
  }

  // Custom timing marks
  performance.mark('board-load-start')
  // ... after load
  performance.mark('board-load-end')
  performance.measure('board-load', 'board-load-start', 'board-load-end')
}
```

---

## Related Stories
- Depends on: All core features complete
- Blocks: None

---

## Notes
- Run Lighthouse audits before and after optimizations
- Profile React components with React DevTools
- Use `EXPLAIN ANALYZE` for database query optimization
- Consider edge caching with Vercel Edge Config
