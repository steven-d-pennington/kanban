import { useState } from 'react';
import type { MemoryType } from '../../types/memory';

interface MemoryEditFormProps {
  initialTitle?: string;
  initialContent?: string;
  initialType?: MemoryType;
  onSubmit: (title: string, content: string, memoryType: MemoryType) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

const memoryTypes: { value: MemoryType; label: string; description: string }[] = [
  {
    value: 'decision',
    label: 'Decision',
    description: 'Architectural choices and technical decisions',
  },
  {
    value: 'pattern',
    label: 'Pattern',
    description: 'Code patterns and best practices to follow',
  },
  {
    value: 'convention',
    label: 'Convention',
    description: 'Naming conventions and organizational rules',
  },
  {
    value: 'lesson',
    label: 'Lesson',
    description: 'Important lessons learned from experience',
  },
  {
    value: 'architecture',
    label: 'Architecture',
    description: 'System design and architecture notes',
  },
  {
    value: 'warning',
    label: 'Warning',
    description: 'Things to avoid and known issues',
  },
  {
    value: 'preference',
    label: 'Preference',
    description: 'Style preferences and team guidelines',
  },
];

export function MemoryEditForm({
  initialTitle = '',
  initialContent = '',
  initialType = 'decision',
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  isSubmitting = false,
}: MemoryEditFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [memoryType, setMemoryType] = useState<MemoryType>(initialType);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const validate = () => {
    const newErrors: { title?: string; content?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required';
    } else if (content.trim().length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await onSubmit(title.trim(), content.trim(), memoryType);
    } catch (err) {
      // Error handling is done in the parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors({ ...errors, title: undefined });
          }}
          placeholder="e.g., Use React Query for data fetching"
          className={`
            w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'}
          `}
          disabled={isSubmitting}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      {/* Memory Type */}
      <div>
        <label htmlFor="memoryType" className="block text-sm font-medium text-gray-700 mb-2">
          Memory Type
        </label>
        <select
          id="memoryType"
          value={memoryType}
          onChange={(e) => setMemoryType(e.target.value as MemoryType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          {memoryTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label} - {type.description}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (errors.content) setErrors({ ...errors, content: undefined });
          }}
          placeholder="Describe the memory in detail. This will be used to help agents understand project context..."
          rows={8}
          className={`
            w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors.content ? 'border-red-300 bg-red-50' : 'border-gray-300'}
          `}
          disabled={isSubmitting}
        />
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
        <p className="mt-1 text-xs text-gray-500">
          Be specific and detailed. This content will be embedded and used for semantic search.
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
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
