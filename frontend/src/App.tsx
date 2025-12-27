import './index.css';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthWrapper } from './components/AuthWrapper';
import { Header } from './components/Header';
import { Filters } from './components/Filters';
import { KanbanBoard } from './components/KanbanBoard';
import { AgentStatusBar } from './components/AgentStatusBar';
import { CreateItemModal } from './components/CreateItemModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { WorkItemDetail } from './components/WorkItemDetail';
import { ToastContainer } from './components/Toast';
import { useNavigationStore } from './store/navigationStore';

// Lazy load monitoring and analytics dashboards for code splitting
const AgentMonitorDashboard = lazy(() =>
  import('./components/monitoring/AgentMonitorDashboard').then((module) => ({
    default: module.AgentMonitorDashboard,
  }))
);

const AnalyticsDashboard = lazy(() =>
  import('./components/analytics/AnalyticsDashboard').then((module) => ({
    default: module.AnalyticsDashboard,
  }))
);

const MemoryPage = lazy(() =>
  import('./components/memory/MemoryPage').then((module) => ({
    default: module.MemoryPage,
  }))
);

// Loading spinner component for Suspense fallback
function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}

function App() {
  const { currentPage } = useNavigationStore();

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-100">
        <Header />

        {/* Page Content */}
        {currentPage === 'board' && (
          <>
            <Filters />
            <KanbanBoard />
            <AgentStatusBar />
          </>
        )}

        {currentPage === 'monitoring' && (
          <Suspense fallback={<PageLoader />}>
            <AgentMonitorDashboard />
          </Suspense>
        )}

        {currentPage === 'analytics' && (
          <Suspense fallback={<PageLoader />}>
            <AnalyticsDashboard />
          </Suspense>
        )}

        {currentPage === 'memory' && (
          <Suspense fallback={<PageLoader />}>
            <MemoryPage />
          </Suspense>
        )}

        {/* Modals - only relevant on board page but keep them mounted */}
        <CreateItemModal />
        <CreateProjectModal />
        <ProjectSettingsModal />
        <WorkItemDetail />
        <ToastContainer />
      </div>
    </AuthWrapper>
  );
}

export default App;
