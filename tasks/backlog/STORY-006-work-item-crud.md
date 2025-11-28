# STORY-006: Work Item CRUD Operations

## Overview
Implement full Create, Read, Update, and Delete operations for work items, including the detail view and edit forms.

## Status
**Current**: BACKLOG
**Phase**: 2 - Core Features
**Priority**: HIGH
**Estimated Effort**: Large

---

## User Story
As a user, I want to create, view, edit, and delete work items so that I can manage tasks on my Kanban board.

---

## Acceptance Criteria

- [ ] Create work item with form:
  - Title (required)
  - Description (rich text/markdown)
  - Type selection (feature, bug, story, task)
  - Priority selection
  - Story points (optional)
  - Due date (optional)
  - Labels (optional)
- [ ] View work item detail in modal or slide-over panel
- [ ] Edit all work item fields
- [ ] Delete work item with confirmation
- [ ] Work items store using Zustand
- [ ] Optimistic updates for better UX
- [ ] Error handling and toast notifications
- [ ] Form validation

---

## Technical Notes

### Work Items Store
```typescript
// src/stores/workItemsStore.ts
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface WorkItemsState {
  items: WorkItem[]
  loading: boolean
  error: string | null

  fetchItems: (projectId: string) => Promise<void>
  createItem: (item: Partial<WorkItem>) => Promise<WorkItem>
  updateItem: (id: string, updates: Partial<WorkItem>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
}

export const useWorkItemsStore = create<WorkItemsState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async (projectId) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('work_items')
      .select('*')
      .eq('project_id', projectId)
      .order('column_order')

    if (error) set({ error: error.message, loading: false })
    else set({ items: data, loading: false })
  },

  createItem: async (item) => {
    const { data, error } = await supabase
      .from('work_items')
      .insert(item)
      .select()
      .single()

    if (error) throw error
    set({ items: [...get().items, data] })
    return data
  },

  updateItem: async (id, updates) => {
    // Optimistic update
    const previousItems = get().items
    set({
      items: previousItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    })

    const { error } = await supabase
      .from('work_items')
      .update(updates)
      .eq('id', id)

    if (error) {
      set({ items: previousItems }) // Rollback
      throw error
    }
  },

  deleteItem: async (id) => {
    const { error } = await supabase
      .from('work_items')
      .delete()
      .eq('id', id)

    if (error) throw error
    set({ items: get().items.filter(item => item.id !== id) })
  }
}))
```

### Work Item Form Component
```typescript
// src/components/forms/WorkItemForm.tsx
interface WorkItemFormProps {
  projectId: string
  initialData?: Partial<WorkItem>
  onSubmit: (data: Partial<WorkItem>) => Promise<void>
  onCancel: () => void
}
```

### Work Item Types
```typescript
// src/types/workItem.ts
export type WorkItemType = 'project_spec' | 'feature' | 'prd' | 'story' | 'bug' | 'task'
export type WorkItemPriority = 'critical' | 'high' | 'medium' | 'low'
export type WorkItemStatus = 'backlog' | 'ready' | 'in_progress' | 'review' | 'testing' | 'done'

export interface WorkItem {
  id: string
  project_id: string
  parent_id?: string
  title: string
  description?: string
  type: WorkItemType
  priority: WorkItemPriority
  status: WorkItemStatus
  column_order: number
  assigned_to?: string
  assigned_agent?: string
  story_points?: number
  due_date?: string
  labels: string[]
  metadata: Record<string, unknown>
  created_by: string
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
}
```

---

## UI Components Needed

- [ ] `WorkItemForm` - Create/Edit form
- [ ] `WorkItemDetail` - Detail view modal
- [ ] `WorkItemActions` - Dropdown menu for edit/delete
- [ ] `CreateItemButton` - FAB or header button
- [ ] `DeleteConfirmDialog` - Confirmation modal

---

## Related Stories
- Depends on: STORY-003, STORY-004, STORY-005
- Blocks: STORY-007, STORY-008

---

## Notes
- Consider using react-hook-form for form management
- Add keyboard shortcuts (Cmd+N for new item)
- Support markdown in description field
