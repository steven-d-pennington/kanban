import { useState } from 'react';
import { useKanbanStore } from '../store/kanbanStore';
import { X, Plus } from 'lucide-react';
import { WorkItemForm, type WorkItemFormData } from './forms/WorkItemForm';
import { toast } from './Toast';

export function CreateItemModal() {
  const { isCreateModalOpen, setCreateModalOpen, addWorkItem, currentProjectId } = useKanbanStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: WorkItemFormData) => {
    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }

    setIsSubmitting(true);
    try {
      addWorkItem({
        projectId: currentProjectId,
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        status: 'backlog',
        storyPoints: data.storyPoints,
        dueDate: data.dueDate,
        labels: data.labels,
        metadata: {},
        createdBy: 'user-1', // TODO: Get from auth
      });
      setCreateModalOpen(false);
      toast.success('Work item created successfully');
    } catch {
      toast.error('Failed to create work item');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCreateModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Work Item</h2>
          </div>
          <button
            onClick={() => setCreateModalOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          <WorkItemForm
            onSubmit={handleSubmit}
            onCancel={() => setCreateModalOpen(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
