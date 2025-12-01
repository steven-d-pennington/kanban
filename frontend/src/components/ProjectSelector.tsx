import { useState, useRef, useEffect } from 'react';
import { useKanbanStore } from '../store/kanbanStore';
import { LayoutDashboard, ChevronDown, Plus, Check, FolderOpen } from 'lucide-react';

export function ProjectSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    projects,
    currentProjectId,
    setCurrentProject,
    setCreateProjectModalOpen,
  } = useKanbanStore();

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const activeProjects = projects.filter((p) => p.status === 'active');
  const archivedProjects = projects.filter((p) => p.status === 'archived');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProject = (projectId: string) => {
    setCurrentProject(projectId);
    setIsOpen(false);
  };

  const handleCreateProject = () => {
    setIsOpen(false);
    setCreateProjectModalOpen(true);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <LayoutDashboard className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-700 max-w-[200px] truncate">
          {currentProject?.name || 'Select Project'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Active Projects */}
          {activeProjects.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Active Projects
              </div>
              {activeProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                >
                  <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{project.name}</div>
                    {project.description && (
                      <div className="text-xs text-gray-500 truncate">{project.description}</div>
                    )}
                  </div>
                  {project.id === currentProjectId && (
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Archived Projects */}
          {archivedProjects.length > 0 && (
            <div className="py-2 border-t border-gray-100">
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Archived
              </div>
              {archivedProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left opacity-60"
                >
                  <FolderOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-700 truncate">{project.name}</div>
                  </div>
                  {project.id === currentProjectId && (
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Create New Project */}
          <div className="border-t border-gray-200 p-2">
            <button
              onClick={handleCreateProject}
              className="w-full flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Create New Project</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
