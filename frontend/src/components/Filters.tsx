import { useKanbanStore } from '../store/kanbanStore';
import { ITEM_TYPE_CONFIG, PRIORITY_CONFIG } from '../types';
import type { WorkItemType, Priority } from '../types';
import { Filter, X } from 'lucide-react';

export function Filters() {
  const {
    filterType,
    filterPriority,
    filterAssignee,
    setFilterType,
    setFilterPriority,
    setFilterAssignee,
  } = useKanbanStore();

  const hasActiveFilters = filterType !== 'all' || filterPriority !== 'all' || filterAssignee !== 'all';

  const clearFilters = () => {
    setFilterType('all');
    setFilterPriority('all');
    setFilterAssignee('all');
  };

  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2 text-gray-500">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      {/* Type Filter */}
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value as WorkItemType | 'all')}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">All Types</option>
        {Object.entries(ITEM_TYPE_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>
            {config.label}
          </option>
        ))}
      </select>

      {/* Priority Filter */}
      <select
        value={filterPriority}
        onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">All Priorities</option>
        {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>
            {config.label}
          </option>
        ))}
      </select>

      {/* Assignee Filter */}
      <select
        value={filterAssignee}
        onChange={(e) => setFilterAssignee(e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">All Assignees</option>
        <option value="agent">Agent Only</option>
        <option value="human">Human Only</option>
      </select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      )}
    </div>
  );
}
