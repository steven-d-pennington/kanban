import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ITEM_TYPE_CONFIG, PRIORITY_CONFIG, AGENT_CONFIG } from '../types';
import type { WorkItem } from '../types';
import { useKanbanStore } from '../store/kanbanStore';
import { MessageSquare, Bot, User, Zap } from 'lucide-react';

interface WorkItemCardProps {
  item: WorkItem;
}

// Memoized WorkItemCard component for performance optimization
// Only re-renders when the work item's key properties change
export const WorkItemCard = memo(function WorkItemCard({ item }: WorkItemCardProps) {
  const { setSelectedWorkItem } = useKanbanStore();
  const typeConfig = ITEM_TYPE_CONFIG[item.type];
  const priorityConfig = PRIORITY_CONFIG[item.priority];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setSelectedWorkItem(item)}
      className={`
        bg-white rounded-lg border border-gray-200 p-4 cursor-pointer
        hover:border-blue-300 hover:shadow-md transition-all
        ${isDragging ? 'opacity-50 shadow-lg rotate-2' : ''}
      `}
    >
      {/* Header: Type badge and priority */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium px-2 py-1 rounded ${typeConfig.bgColor} ${typeConfig.color}`}>
          {typeConfig.label}
        </span>
        <span className={`text-sm font-bold ${priorityConfig.color}`} title={priorityConfig.label}>
          {item.priority === 'critical' && <Zap className="w-4 h-4 fill-current" />}
          {item.priority === 'high' && '!!'}
          {item.priority === 'medium' && '!'}
          {item.priority === 'low' && '-'}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{item.title}</h3>

      {/* Description preview */}
      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description}</p>

      {/* Labels */}
      {item.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.labels.slice(0, 3).map((label) => (
            <span key={label} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {label}
            </span>
          ))}
          {item.labels.length > 3 && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              +{item.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {/* Story points */}
          {item.storyPoints && (
            <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded">
              {item.storyPoints} pts
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Comments indicator */}
          <div className="flex items-center gap-1 text-gray-400">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-xs">3</span>
          </div>

          {/* Assignee */}
          {item.assignedAgent ? (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded ${
                AGENT_CONFIG[item.assignedAgent].bgColor
              }`}
              title={AGENT_CONFIG[item.assignedAgent].label}
            >
              <Bot className={`w-3.5 h-3.5 ${AGENT_CONFIG[item.assignedAgent].color}`} />
              <span className={`text-xs font-medium ${AGENT_CONFIG[item.assignedAgent].color}`}>
                {item.assignedAgent === 'project_manager' && 'PM'}
                {item.assignedAgent === 'scrum_master' && 'SM'}
                {item.assignedAgent === 'developer' && 'Dev'}
              </span>
            </div>
          ) : item.assignedTo ? (
            <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
          ) : null}
        </div>
      </div>

      {/* Agent processing indicator */}
      {item.assignedAgent && item.status === 'in_progress' && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">
              Processing by {AGENT_CONFIG[item.assignedAgent].label}...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for efficient memoization
  // Only re-render if these key properties change
  const prev = prevProps.item;
  const next = nextProps.item;
  return (
    prev.id === next.id &&
    prev.title === next.title &&
    prev.description === next.description &&
    prev.type === next.type &&
    prev.priority === next.priority &&
    prev.status === next.status &&
    prev.assignedAgent === next.assignedAgent &&
    prev.assignedTo === next.assignedTo &&
    prev.storyPoints === next.storyPoints &&
    prev.updatedAt === next.updatedAt &&
    JSON.stringify(prev.labels) === JSON.stringify(next.labels)
  );
});
