import { useState } from 'react';
import { Brain, Plus, Filter } from 'lucide-react';
import { MemoryList } from './MemoryList';
import { MemoryEditForm } from './MemoryEditForm';
import { MemoryDetailModal } from './MemoryDetailModal';
import { useMemoryStore } from '../../store/memoryStore';
import { useKanbanStore } from '../../store/kanbanStore';
import { toast } from '../Toast';
import type { ProjectMemory, MemoryType } from '../../types/memory';

const memoryTypes: { value: MemoryType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'decision', label: 'Decision' },
  { value: 'pattern', label: 'Pattern' },
  { value: 'convention', label: 'Convention' },
  { value: 'lesson', label: 'Lesson' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'warning', label: 'Warning' },
  { value: 'preference', label: 'Preference' },
];

export function MemoryPage() {
  const { currentProjectId } = useKanbanStore();
  const { createMemory, fetchMemories } = useMemoryStore();
  const [selectedMemory, setSelectedMemory] = useState<ProjectMemory | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<MemoryType | 'all'>('all');
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMemorySelect = (memory: ProjectMemory) => {
    setSelectedMemory(memory);
  };

  const handleCloseModal = () => {
    setSelectedMemory(null);
    setIsCreateModalOpen(false);
    if (currentProjectId) {
      fetchMemories(currentProjectId);
    }
  };

  const handleCreateMemory = async (title: string, content: string, memoryType: MemoryType) => {
    if (!currentProjectId) return;
    setIsSubmitting(true);
    try {
      await createMemory(currentProjectId, title, content, memoryType);
      toast.success('Memory created successfully');
      handleCloseModal();
    } catch (err) {
      toast.error('Failed to create memory');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentProjectId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No Project Selected</h2>
              <p className="text-gray-500">Please select a project to view its memories</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="w-7 h-7 text-blue-600" />
                Project Memory
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                View and manage project memories for agent context
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              New Memory
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Memory Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as MemoryType | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {memoryTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Start */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Date Range End */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(typeFilter !== 'all' || dateRangeStart || dateRangeEnd) && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setTypeFilter('all');
                    setDateRangeStart('');
                    setDateRangeEnd('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Memory List */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <MemoryList
            onMemorySelect={handleMemorySelect}
            typeFilter={typeFilter}
            dateRangeStart={dateRangeStart}
            dateRangeEnd={dateRangeEnd}
          />
        </div>
      </div>

      {/* Detail Modal for viewing/editing existing memory */}
      {selectedMemory && (
        <MemoryDetailModal
          memory={selectedMemory}
          onClose={handleCloseModal}
        />
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Memory</h2>
              <MemoryEditForm
                onSubmit={handleCreateMemory}
                onCancel={handleCloseModal}
                submitLabel="Create Memory"
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
