import './index.css';
import { Header } from './components/Header';
import { Filters } from './components/Filters';
import { KanbanBoard } from './components/KanbanBoard';
import { AgentStatusBar } from './components/AgentStatusBar';
import { CreateItemModal } from './components/CreateItemModal';
import { WorkItemDetail } from './components/WorkItemDetail';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Filters />
      <KanbanBoard />
      <AgentStatusBar />
      <CreateItemModal />
      <WorkItemDetail />
    </div>
  );
}

export default App;
