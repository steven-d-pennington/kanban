import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Status, WorkItem } from '../types';
import { WorkItemCard } from './WorkItemCard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  id: Status;
  title: string;
  items: WorkItem[];
  onAddItem?: () => void;
}

const columnColors: Record<Status, string> = {
  backlog: 'bg-gray-400',
  ready: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  review: 'bg-purple-500',
  testing: 'bg-orange-500',
  done: 'bg-green-500',
};

export function KanbanColumn({ id, title, items, onAddItem }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col min-w-[320px] max-w-[320px] bg-gray-50 rounded-xl">
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${columnColors[id]}`} />
          <h2 className="font-semibold text-gray-700">{title}</h2>
          <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
            {items.length}
          </span>
        </div>
        {(id === 'backlog' || id === 'ready') && (
          <button
            onClick={onAddItem}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Add item"
          >
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]
          transition-colors
          ${isOver ? 'bg-blue-50' : ''}
        `}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <WorkItemCard key={item.id} item={item} />
          ))}
        </SortableContext>

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <p className="text-sm">No items</p>
          </div>
        )}
      </div>
    </div>
  );
}
