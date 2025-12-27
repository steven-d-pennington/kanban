import { useEffect, useState, useMemo } from 'react';
import { useMemoryStore } from '../../store/memoryStore';
import { useKanbanStore } from '../../store/kanbanStore';
import {
  Brain,
  Clock,
  Trash2,
  Edit,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';
import { toast } from '../Toast';
import type { ProjectMemory, MemoryType } from '../../types/memory';

interface MemoryListProps {
  onMemorySelect: (memory: ProjectMemory) => void;
  typeFilter?: MemoryType | 'all';
  dateRangeStart?: string;
  dateRangeEnd?: string;
}

const memoryTypeConfig: Record<
  MemoryType,
  { label: string; color: string; bgColor: string }
> = {
  decision: { label: 'Decision', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  pattern: { label: 'Pattern', color: 'text-green-700', bgColor: 'bg-green-100' },
  convention: { label: 'Convention', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  lesson: { label: 'Lesson', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  architecture: { label: 'Architecture', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  warning: { label: 'Warning', color: 'text-red-700', bgColor: 'bg-red-100' },
  preference: { label: 'Preference', color: 'text-pink-700', bgColor: 'bg-pink-100' },
};

export function MemoryList({
  onMemorySelect,
  typeFilter = 'all',
  dateRangeStart,
  dateRangeEnd
}: MemoryListProps) {
  const { currentProjectId } = useKanbanStore();
  const {
    memories,
    selectedMemories,
    loading,
    error,
    fetchMemories,
    bulkDeleteMemories,
    toggleMemorySelection,
    clearSelection,
    selectAll,
  } = useMemoryStore();

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (currentProjectId) {
      fetchMemories(currentProjectId);
    }
  }, [currentProjectId, fetchMemories]);

  // Apply filters to memories
  const filteredMemories = useMemo(() => {
    return memories.filter((memory) => {
      // Type filter
      if (typeFilter !== 'all' && memory.memoryType !== typeFilter) {
        return false;
      }

      // Date range filter - start
      if (dateRangeStart) {
        const memoryDate = new Date(memory.createdAt);
        const startDate = new Date(dateRangeStart);
        startDate.setHours(0, 0, 0, 0);
        if (memoryDate < startDate) {
          return false;
        }
      }

      // Date range filter - end
      if (dateRangeEnd) {
        const memoryDate = new Date(memory.createdAt);
        const endDate = new Date(dateRangeEnd);
        endDate.setHours(23, 59, 59, 999);
        if (memoryDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }, [memories, typeFilter, dateRangeStart, dateRangeEnd]);

  const handleBulkDelete = async () => {
    if (selectedMemories.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedMemories.size} selected ${
        selectedMemories.size === 1 ? 'memory' : 'memories'
      }? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await bulkDeleteMemories(Array.from(selectedMemories));
      toast.success(
        `Successfully deleted ${selectedMemories.size} ${
          selectedMemories.size === 1 ? 'memory' : 'memories'
        }`
      );
      clearSelection();
    } catch (err) {
      toast.error('Failed to delete memories');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading && memories.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading memories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Error loading memories</p>
          <p className="text-xs text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (filteredMemories.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            {memories.length === 0 ? 'No memories yet' : 'No memories match the current filters'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {memories.length === 0
              ? 'Create memories to help agents learn about your project'
              : 'Try adjusting your filter criteria'}
          </p>
        </div>
      </div>
    );
  }

  const allSelected = filteredMemories.length > 0 && selectedMemories.size === filteredMemories.length;
  const someSelected = selectedMemories.size > 0 && !allSelected;

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedMemories.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {selectedMemories.size} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete Selected'}
            </button>
          </div>
        </div>
      )}

      {/* Select All Checkbox */}
      <div className="flex items-center justify-between px-2">
        <button
          onClick={() => (allSelected ? clearSelection() : selectAll())}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          {allSelected ? (
            <CheckSquare className="w-5 h-5 text-blue-600" />
          ) : someSelected ? (
            <CheckSquare className="w-5 h-5 text-blue-400" />
          ) : (
            <Square className="w-5 h-5" />
          )}
          <span>Select all</span>
        </button>
        <span className="text-sm text-gray-500">
          {filteredMemories.length === memories.length
            ? `${memories.length} memories`
            : `${filteredMemories.length} of ${memories.length} memories`}
        </span>
      </div>

      {/* Memory Cards */}
      <div className="space-y-2">
        {filteredMemories.map((memory) => {
          const isSelected = selectedMemories.has(memory.id);
          const typeConfig = memoryTypeConfig[memory.memoryType];

          return (
            <div
              key={memory.id}
              className={`
                group relative p-4 border rounded-lg cursor-pointer transition-all
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                }
              `}
            >
              {/* Selection Checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMemorySelection(memory.id);
                }}
                className="absolute top-4 left-4 z-10"
              >
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                )}
              </button>

              {/* Memory Content */}
              <div
                onClick={() => onMemorySelect(memory)}
                className="ml-8 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  {/* Title and Type */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{memory.title}</h3>
                    <span
                      className={`
                        inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        ${typeConfig.color} ${typeConfig.bgColor}
                      `}
                    >
                      {typeConfig.label}
                    </span>
                  </div>

                  {/* Content Preview */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {memory.content}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(memory.updatedAt)}</span>
                    </div>
                    {memory.createdByAgent && (
                      <span className="text-purple-600">Agent: {memory.createdByAgent}</span>
                    )}
                    {memory.isGlobal && (
                      <span className="text-blue-600 font-medium">Global</span>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMemorySelect(memory);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit memory"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
