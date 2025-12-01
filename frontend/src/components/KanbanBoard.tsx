import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  rectIntersection,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragOverEvent, CollisionDetection } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { useState, useCallback } from 'react';
import { useKanbanStore } from '../store/kanbanStore';
import { COLUMNS } from '../types';
import type { WorkItem } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { WorkItemCard } from './WorkItemCard';
import { toast } from './Toast';

export function KanbanBoard() {
  const { getItemsByStatus, moveWorkItem, reorderWorkItems, setCreateModalOpen } = useKanbanStore();
  const [activeItem, setActiveItem] = useState<WorkItem | null>(null);

  // Configure sensors for different input methods
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Long press delay for touch
        tolerance: 5, // Movement tolerance during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom collision detection that combines strategies
  const collisionDetection: CollisionDetection = useCallback((args) => {
    // First try to find column intersections
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
    // Fall back to closest corners for more precise drops
    return closestCorners(args);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const allItems = COLUMNS.flatMap((col) => getItemsByStatus(col.id));
    const item = allItems.find((i) => i.id === active.id);
    if (item) {
      setActiveItem(item);
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Optional: Add visual feedback during drag over
    // This can be used for more complex reordering logic
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Get the active item's current status
    const allItems = COLUMNS.flatMap((col) => getItemsByStatus(col.id));
    const activeItemData = allItems.find((i) => i.id === activeId);
    if (!activeItemData) return;

    const currentStatus = activeItemData.status;

    // Check if dropped on a column
    const targetColumn = COLUMNS.find((col) => col.id === overId);
    if (targetColumn) {
      // Moving to a different column
      if (targetColumn.id !== currentStatus) {
        moveWorkItem(activeId, targetColumn.id);
        toast.info(`Moved to ${targetColumn.title}`);
      }
      return;
    }

    // Check if dropped on another item
    const overItem = allItems.find((i) => i.id === overId);
    if (overItem) {
      const targetStatus = overItem.status;

      if (targetStatus !== currentStatus) {
        // Moving to a different column via dropping on an item
        moveWorkItem(activeId, targetStatus);
        toast.info(`Moved to ${COLUMNS.find((c) => c.id === targetStatus)?.title || targetStatus}`);
      } else {
        // Reordering within the same column
        const columnItems = getItemsByStatus(currentStatus);
        const oldIndex = columnItems.findIndex((i) => i.id === activeId);
        const newIndex = columnItems.findIndex((i) => i.id === overId);

        if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(columnItems, oldIndex, newIndex);
          reorderWorkItems(currentStatus, newOrder.map((i) => i.id));
        }
      }
    }
  };

  const handleDragCancel = () => {
    setActiveItem(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 p-6 overflow-x-auto pb-24">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            items={getItemsByStatus(column.id)}
            onAddItem={() => setCreateModalOpen(true)}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeItem ? (
          <div className="rotate-3 opacity-90 shadow-xl">
            <WorkItemCard item={activeItem} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
