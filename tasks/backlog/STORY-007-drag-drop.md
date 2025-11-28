# STORY-007: Drag-and-Drop Functionality

## Overview
Implement drag-and-drop functionality to allow users to move work items between columns and reorder items within columns.

## Status
**Current**: BACKLOG
**Phase**: 2 - Core Features
**Priority**: HIGH
**Estimated Effort**: Medium

---

## User Story
As a user, I want to drag work items between columns so that I can easily update their status on the Kanban board.

---

## Acceptance Criteria

- [ ] Drag work item cards between columns
- [ ] Reorder items within the same column
- [ ] Visual feedback during drag (shadow, highlight)
- [ ] Drop zone highlighting
- [ ] Persist order changes to database
- [ ] Update status when moving to different column
- [ ] Keyboard accessibility for drag operations
- [ ] Touch support for mobile devices
- [ ] Undo last move (optional)

---

## Technical Notes

### Recommended Library
Use `@dnd-kit/core` and `@dnd-kit/sortable` for modern drag-and-drop:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### DnD Context Setup
```typescript
// src/components/board/KanbanBoard.tsx
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

export function KanbanBoard() {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeItem = findItem(active.id)
    const overColumn = findColumn(over.id)

    if (activeItem && overColumn) {
      await updateItemStatus(activeItem.id, overColumn.id)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      {/* columns */}
      <DragOverlay>
        {activeId ? <WorkItemCard item={findItem(activeId)} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
```

### Sortable Column
```typescript
// src/components/board/SortableColumn.tsx
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

export function SortableColumn({ column, items }: Props) {
  const { setNodeRef } = useDroppable({ id: column.id })

  return (
    <div ref={setNodeRef} className="kanban-column">
      <SortableContext
        items={items.map(i => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map(item => (
          <SortableWorkItem key={item.id} item={item} />
        ))}
      </SortableContext>
    </div>
  )
}
```

### Sortable Item
```typescript
// src/components/board/SortableWorkItem.tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function SortableWorkItem({ item }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <WorkItemCard item={item} />
    </div>
  )
}
```

### Status Update on Drop
```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event
  if (!over) return

  const newStatus = over.data.current?.column as WorkItemStatus
  const newOrder = calculateNewOrder(over)

  await updateItem(active.id as string, {
    status: newStatus,
    column_order: newOrder
  })
}
```

---

## Related Stories
- Depends on: STORY-005, STORY-006
- Blocks: None

---

## Notes
- Consider adding animation for smooth transitions
- Test thoroughly on touch devices
- Implement collision detection for better drop accuracy
- Consider limiting drag to within board (no dragging outside)
