# STORY-005: Build Kanban Board UI

## Overview
Create the visual Kanban board interface with columns, work item cards, and the foundational layout for the application.

## Status
**Current**: BACKLOG
**Phase**: 1 - Foundation
**Priority**: HIGH
**Estimated Effort**: Large

---

## User Story
As a user, I want to see a visual Kanban board with columns and cards so that I can understand the status of all work items at a glance.

---

## Acceptance Criteria

- [ ] Main application layout with navigation header
- [ ] Kanban board with 6 columns:
  - Backlog
  - Ready
  - In Progress
  - Review
  - Testing
  - Done
- [ ] Work item cards displaying:
  - Title
  - Type badge (feature, bug, story, etc.)
  - Priority indicator
  - Story points (if set)
  - Assignee avatar
  - Comment count
  - Agent processing indicator
- [ ] Column headers with item counts
- [ ] Empty state for columns with no items
- [ ] Responsive design (mobile-friendly)
- [ ] Sidebar for project navigation
- [ ] Filter bar for type, priority, assignee

---

## Technical Notes

### Component Structure
```
src/components/
  layout/
    Header.tsx
    Sidebar.tsx
    MainLayout.tsx
  board/
    KanbanBoard.tsx
    KanbanColumn.tsx
    WorkItemCard.tsx
    ColumnHeader.tsx
  filters/
    FilterBar.tsx
    TypeFilter.tsx
    PriorityFilter.tsx
```

### Kanban Board Component
```typescript
// src/components/board/KanbanBoard.tsx
const COLUMNS = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'ready', title: 'Ready' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'testing', title: 'Testing' },
  { id: 'done', title: 'Done' }
]

export function KanbanBoard() {
  return (
    <div className="flex gap-4 overflow-x-auto p-4">
      {COLUMNS.map(column => (
        <KanbanColumn
          key={column.id}
          column={column}
        />
      ))}
    </div>
  )
}
```

### Work Item Card Component
```typescript
// src/components/board/WorkItemCard.tsx
interface WorkItemCardProps {
  item: WorkItem
  onClick: () => void
}

export function WorkItemCard({ item, onClick }: WorkItemCardProps) {
  return (
    <div
      className="bg-white rounded-lg shadow p-3 cursor-pointer hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2">
        <TypeBadge type={item.type} />
        <PriorityIndicator priority={item.priority} />
      </div>
      <h3 className="font-medium text-gray-900 mb-2">{item.title}</h3>
      <div className="flex items-center justify-between text-sm text-gray-500">
        {item.story_points && <span>{item.story_points} pts</span>}
        <AssigneeAvatar user={item.assigned_to} agent={item.assigned_agent} />
      </div>
      {item.assigned_agent && (
        <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
          <RobotIcon className="w-3 h-3" />
          Processing by {item.assigned_agent}
        </div>
      )}
    </div>
  )
}
```

### Tailwind Classes Reference
```
Column: w-72 bg-gray-100 rounded-lg p-2 flex-shrink-0
Card: bg-white rounded-lg shadow p-3
Type Badge: px-2 py-0.5 rounded text-xs font-medium
Priority Colors:
  - Critical: bg-red-100 text-red-800
  - High: bg-orange-100 text-orange-800
  - Medium: bg-yellow-100 text-yellow-800
  - Low: bg-green-100 text-green-800
```

---

## UI Mockup Reference

```
┌────────────────────────────────────────────────────────────────────┐
│  Agent Kanban    │ Projects ▼ │ Search    │ User │ Settings       │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Filters: [All Types ▼] [All Priorities ▼] [All Assignees ▼]      │
│                                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ BACKLOG │ │  READY  │ │IN PROG  │ │ REVIEW  │ │  DONE   │      │
│  │   (5)   │ │   (3)   │ │   (2)   │ │   (1)   │ │  (12)   │      │
│  ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤      │
│  │ Card    │ │ Card    │ │ Card    │ │ Card    │ │ Card    │      │
│  │ Card    │ │ Card    │ │ Card    │ │         │ │ Card    │      │
│  │ Card    │ │ Card    │ │         │ │         │ │ Card    │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## Related Stories
- Depends on: STORY-001
- Blocks: STORY-007 (drag-drop needs board UI)

---

## Notes
- Use CSS Grid or Flexbox for column layout
- Consider virtualization for columns with many items (react-virtual)
- Card should be clickable to open detail modal/page
