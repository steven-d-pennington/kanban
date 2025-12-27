import { AlertTriangle, X } from 'lucide-react';

interface MemoryDeleteConfirmModalProps {
  isOpen: boolean;
  memoryTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function MemoryDeleteConfirmModal({
  isOpen,
  memoryTitle,
  onConfirm,
  onCancel,
  isDeleting = false,
}: MemoryDeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Delete Memory</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isDeleting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600">
            Are you sure you want to delete this memory? This will remove it from the
            knowledge base and agents will no longer have access to it.
          </p>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-medium text-gray-900 truncate">{memoryTitle}</p>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> The memory will be soft-deleted (marked as inactive)
              and can potentially be recovered by a database administrator.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
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
                Deleting...
              </>
            ) : (
              'Delete Memory'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
