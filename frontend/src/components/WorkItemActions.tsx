import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2, Copy, MoveRight } from 'lucide-react';

interface WorkItemActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onMove?: () => void;
}

export function WorkItemActions({
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
}: WorkItemActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Work item actions"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onEdit);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>

          {onDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onDuplicate);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
          )}

          {onMove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onMove);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MoveRight className="w-4 h-4" />
              Move to...
            </button>
          )}

          <div className="border-t border-gray-100 my-1" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(onDelete);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
