import { useKanbanStore } from '../store/kanbanStore';
import { useNavigationStore, type Page } from '../store/navigationStore';
import { UserMenu } from './UserMenu';
import { ConnectionIndicator } from './ConnectionIndicator';
import { PresenceAvatars } from './PresenceAvatars';
import { ProjectSelector } from './ProjectSelector';
import { Plus, Settings, Bot, LayoutDashboard, Activity, BarChart3 } from 'lucide-react';

const navItems: { id: Page; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'board', label: 'Board', icon: LayoutDashboard },
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export function Header() {
  const { setCreateModalOpen, setProjectSettingsOpen, currentProjectId } = useKanbanStore();
  const { currentPage, setCurrentPage } = useNavigationStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Agent Kanban</span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentPage(id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>

          {/* Project Selector - only show on board page */}
          {currentPage === 'board' && <ProjectSelector />}

          {/* Connection Status */}
          <ConnectionIndicator />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Online Users */}
          <PresenceAvatars />

          <div className="w-px h-6 bg-gray-200" />

          {currentPage === 'board' && (
            <>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">New Item</span>
              </button>

              <button
                onClick={() => setProjectSettingsOpen(true)}
                disabled={!currentProjectId}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                title="Project Settings"
              >
                <Settings className="w-5 h-5 text-gray-500" />
              </button>

              <div className="w-px h-6 bg-gray-200" />
            </>
          )}

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
