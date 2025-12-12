import React, { useState } from 'react';
import { MonitoringTab } from './components/monitoring-tab';

type TabType = 'overview' | 'monitoring' | 'analytics' | 'settings';

interface TabConfig {
  id: TabType;
  label: string;
  component: React.ComponentType;
}

const OverviewTab: React.FC = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600">Welcome to the application dashboard.</p>
    </div>
  </div>
);

const AnalyticsTab: React.FC = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h2>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600">Analytics dashboard coming soon.</p>
    </div>
  </div>
);

const SettingsTab: React.FC = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600">Application settings and configuration.</p>
    </div>
  </div>
);

const tabs: TabConfig[] = [
  { id: 'overview', label: 'Overview', component: OverviewTab },
  { id: 'monitoring', label: 'Monitoring', component: MonitoringTab },
  { id: 'analytics', label: 'Analytics', component: AnalyticsTab },
  { id: 'settings', label: 'Settings', component: SettingsTab },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || OverviewTab;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Application Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main
        id={`${activeTab}-panel`}
        role="tabpanel"
        aria-labelledby={`${activeTab}-tab`}
        className="max-w-7xl mx-auto"
      >
        <ActiveComponent />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 Application Dashboard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;