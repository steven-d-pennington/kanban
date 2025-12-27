import { useState } from 'react';
import { Brain, Plus, X } from 'lucide-react';
import { MemoryList, MemoryDetailModal } from '../components/memory';
import { MemoryEditForm } from '../components/memory/MemoryEditForm';
import { useMemoryStore } from '../store/memoryStore';
import { useKanbanStore } from '../store/kanbanStore';
import { toast } from '../components/Toast';
import type { ProjectMemory, MemoryType } from '../types/memory';

export function MemoryPage() {
  const { currentProjectId } = useKanbanStore();
  const { createMemory } = useMemoryStore();
  const [selectedMemory, setSelectedMemory] = useState<ProjectMemory | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateMemory = async (
    title: string,
    content: string,
    memoryType: MemoryType
  ) => {
    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }

    setIsCreating(true);
    try {
      const newMemory = await createMemory(currentProjectId, title, content, memoryType);
      if (newMemory) {
        toast.success('Memory created successfully');
        setIsCreateModalOpen(false);
      } else {
        toast.error('Failed to create memory');
      }
    } catch (err) {
      toast.error('Failed to create memory');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Project Memory</h1>
                <p className="text-sm text-gray-600">
                  Manage knowledge that agents learn and remember
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Memory
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <MemoryList onMemorySelect={setSelectedMemory} />
        </div>
      </div>

      {/* Detail Modal */}
      <MemoryDetailModal memory={selectedMemory} onClose={() => setSelectedMemory(null)} />

      {/* Create Memory Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Create New Memory</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
              <MemoryEditForm
                onSubmit={handleCreateMemory}
                onCancel={() => setIsCreateModalOpen(false)}
                submitLabel="Create Memory"
                isSubmitting={isCreating}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
