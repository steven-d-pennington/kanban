import { useState, useEffect } from 'react';
import { ITEM_TYPE_CONFIG, PRIORITY_CONFIG } from '../../types';
import type { WorkItem, WorkItemType, Priority } from '../../types';

export interface WorkItemFormData {
  title: string;
  description: string;
  type: WorkItemType;
  priority: Priority;
  storyPoints?: number;
  dueDate?: string;
  labels: string[];
}

interface WorkItemFormProps {
  initialData?: Partial<WorkItem>;
  onSubmit: (data: WorkItemFormData) => void;
  onCancel: () => void;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

export function WorkItemForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  isSubmitting = false,
}: WorkItemFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<WorkItemType>(initialData?.type || 'feature');
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'medium');
  const [storyPoints, setStoryPoints] = useState<string>(
    initialData?.storyPoints?.toString() || ''
  );
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [labelsInput, setLabelsInput] = useState(initialData?.labels?.join(', ') || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setType(initialData.type || 'feature');
      setPriority(initialData.priority || 'medium');
      setStoryPoints(initialData.storyPoints?.toString() || '');
      setDueDate(initialData.dueDate || '');
      setLabelsInput(initialData.labels?.join(', ') || '');
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (storyPoints && (isNaN(Number(storyPoints)) || Number(storyPoints) < 0)) {
      newErrors.storyPoints = 'Story points must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const labels = labelsInput
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      storyPoints: storyPoints ? Number(storyPoints) : undefined,
      dueDate: dueDate || undefined,
      labels,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a clear, descriptive title"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.title ? 'border-red-500' : 'border-gray-200'
          }`}
          disabled={isSubmitting}
        />
        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          >
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Story Points and Due Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="storyPoints" className="block text-sm font-medium text-gray-700 mb-2">
            Story Points
          </label>
          <input
            id="storyPoints"
            type="number"
            min="0"
            value={storyPoints}
            onChange={(e) => setStoryPoints(e.target.value)}
            placeholder="e.g., 3"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.storyPoints ? 'border-red-500' : 'border-gray-200'
            }`}
            disabled={isSubmitting}
          />
          {errors.storyPoints && (
            <p className="mt-1 text-sm text-red-500">{errors.storyPoints}</p>
          )}
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
            Due Date
          </label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
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
          placeholder="Provide detailed information about this work item. Supports markdown formatting."
          rows={6}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={isSubmitting}
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
          value={labelsInput}
          onChange={(e) => setLabelsInput(e.target.value)}
          placeholder="Enter labels separated by commas (e.g., frontend, urgent, auth)"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>

      {/* Agent Processing Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Agent Processing</h4>
        <p className="text-sm text-blue-700">
          {type === 'project_spec' || type === 'feature' ? (
            <>
              This item will be picked up by the <strong>Project Manager Agent</strong> to generate
              a PRD.
            </>
          ) : type === 'prd' ? (
            <>
              This item will be picked up by the <strong>Scrum Master Agent</strong> to create user
              stories.
            </>
          ) : type === 'story' || type === 'bug' || type === 'task' ? (
            <>
              This item can be picked up by a <strong>Developer Agent</strong> or assigned to a
              human.
            </>
          ) : null}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {isEdit ? 'Saving...' : 'Creating...'}
            </>
          ) : (
            <>{isEdit ? 'Save Changes' : 'Create Item'}</>
          )}
        </button>
      </div>
    </form>
  );
}
