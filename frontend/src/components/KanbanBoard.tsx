import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';
import { useKanbanStore } from '../store/kanbanStore';
import { COLUMNS } from '../types';
import type { WorkItem } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { WorkItemCard } from './WorkItemCard';

export function KanbanBoard() {
  const { getItemsByStatus, moveWorkItem, setCreateModalOpen } = useKanbanStore();
  const [activeItem, setActiveItem] = useState<WorkItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const allItems = COLUMNS.flatMap((col) => getItemsByStatus(col.id));
    const item = allItems.find((i) => i.id === active.id);
    if (item) {
      setActiveItem(item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = COLUMNS.find((col) => col.id === overId);
    if (targetColumn) {
      moveWorkItem(activeId, targetColumn.id);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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

      <DragOverlay>
        {activeItem ? (
          <div className="rotate-3 opacity-90">
            <WorkItemCard item={activeItem} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
