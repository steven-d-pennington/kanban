import { useState } from 'react';
import { useKanbanStore } from '../store/kanbanStore';
import { ITEM_TYPE_CONFIG, PRIORITY_CONFIG } from '../types';
import type { WorkItemType, Priority } from '../types';
import { X, Plus } from 'lucide-react';

export function CreateItemModal() {
  const { isCreateModalOpen, setCreateModalOpen, addWorkItem, currentProjectId } = useKanbanStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<WorkItemType>('feature');
  const [priority, setPriority] = useState<Priority>('medium');
  const [labels, setLabels] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentProjectId) return;

    addWorkItem({
      projectId: currentProjectId,
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      status: 'backlog',
      labels: labels
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
      metadata: {},
      createdBy: 'user-1',
    });

    // Reset form
    setTitle('');
    setDescription('');
    setType('feature');
    setPriority('medium');
    setLabels('');
    setCreateModalOpen(false);
  };

  if (!isCreateModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Work Item</h2>
          <button
            onClick={() => setCreateModalOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a clear, descriptive title"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as WorkItemType)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(ITEM_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about this work item. For features and project specs, this will be used by agents to generate PRDs."
              rows={6}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Labels */}
          <div>
            <label htmlFor="labels" className="block text-sm font-medium text-gray-700 mb-2">
              Labels
            </label>
            <input
              id="labels"
              type="text"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="Enter labels separated by commas (e.g., frontend, urgent, auth)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Agent Processing Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Agent Processing</h4>
            <p className="text-sm text-blue-700">
              {type === 'project_spec' || type === 'feature' ? (
                <>
                  This item will be picked up by the <strong>Project Manager Agent</strong> to generate a PRD.
                </>
              ) : type === 'prd' ? (
                <>
                  This item will be picked up by the <strong>Scrum Master Agent</strong> to create user stories.
                </>
              ) : type === 'story' || type === 'bug' || type === 'task' ? (
                <>
                  This item can be picked up by a <strong>Developer Agent</strong> or assigned to a human.
                </>
              ) : null}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
