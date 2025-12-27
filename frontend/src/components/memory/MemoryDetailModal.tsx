import { useState } from 'react';
import { X, Edit, Trash2, Brain, Clock, Tag, User, Bot } from 'lucide-react';
import { useMemoryStore } from '../../store/memoryStore';
import { MemoryEditForm } from './MemoryEditForm';
import { MemoryDeleteConfirmModal } from './MemoryDeleteConfirmModal';
import { toast } from '../Toast';
import type { ProjectMemory, MemoryType } from '../../types/memory';

interface MemoryDetailModalProps {
  memory: ProjectMemory | null;
  onClose: () => void;
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

export function MemoryDetailModal({ memory, onClose }: MemoryDetailModalProps) {
  const { updateMemory, deleteMemory } = useMemoryStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!memory) return null;

  const typeConfig = memoryTypeConfig[memory.memoryType];

  const handleUpdate = async (title: string, content: string, _memoryType: MemoryType) => {
    setIsSubmitting(true);
    try {
      await updateMemory(memory.id, title, content);
      toast.success('Memory updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to update memory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMemory(memory.id);
      toast.success('Memory deleted successfully');
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      toast.error('Failed to delete memory');
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Memory' : 'Memory Details'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit memory"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete memory"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
            {isEditing ? (
              <MemoryEditForm
                initialTitle={memory.title}
                initialContent={memory.content}
                initialType={memory.memoryType}
                onSubmit={handleUpdate}
                onCancel={() => setIsEditing(false)}
                submitLabel="Save Changes"
                isSubmitting={isSubmitting}
              />
            ) : (
              <div className="space-y-6">
                {/* Title and Type */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`
                        inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium
                        ${typeConfig.color} ${typeConfig.bgColor}
                      `}
                    >
                      <Tag className="w-4 h-4 mr-1.5" />
                      {typeConfig.label}
                    </span>
                    {memory.isGlobal && (
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium text-blue-700 bg-blue-100">
                        Global Memory
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">{memory.title}</h3>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Content</h4>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{memory.content}</p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Created
                    </h4>
                    <p className="text-sm text-gray-600">{formatDate(memory.createdAt)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Last Updated
                    </h4>
                    <p className="text-sm text-gray-600">{formatDate(memory.updatedAt)}</p>
                  </div>
                  {memory.createdByAgent && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                        <Bot className="w-4 h-4" />
                        Created By Agent
                      </h4>
                      <p className="text-sm text-purple-600 font-medium">
                        {memory.createdByAgent}
                      </p>
                    </div>
                  )}
                  {memory.createdByUser && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        Created By User
                      </h4>
                      <p className="text-sm text-gray-600">{memory.createdByUser}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Relevance Score
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${memory.relevanceScore * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {Math.round(memory.relevanceScore * 100)}%
                      </span>
                    </div>
                  </div>
                  {memory.sourceWorkItemId && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Source Work Item
                      </h4>
                      <p className="text-sm text-blue-600 hover:underline cursor-pointer">
                        View Work Item
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <MemoryDeleteConfirmModal
        isOpen={showDeleteConfirm}
        memoryTitle={memory.title}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isDeleting={isDeleting}
      />
    </>
  );
}
