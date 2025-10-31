// Main entry point voor de Voedseljournaal app
import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/main.css'
import { useDatabase } from '@/hooks'
import { TabNavigation, useActiveTab } from '@/components/TabNavigation'
import { JournalPage } from '@/components/journal/JournalPage'
import { TrackingPage } from '@/components/tracking/TrackingPage'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { AnalysePage } from '@/components/analyse/AnalysePage'
import { DataPage } from '@/components/data/DataPage'
import { SettingsPage } from '@/components/settings/SettingsPage'

// App component met database initialisatie
function App() {
  const { isInitialized, error } = useDatabase();
  const [activeTab, setActiveTab] = useActiveTab();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Database Error
          </h1>
          <p className="text-gray-700">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Database wordt geïnitialiseerd...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="py-6">
        {activeTab === 'journaal' && <JournalPage />}
        {activeTab === 'tracking' && <TrackingPage />}
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'analyse' && <AnalysePage />}
        {activeTab === 'data' && <DataPage />}
        {activeTab === 'instellingen' && <SettingsPage />}
      </div>
    </div>
  );
}

// Render app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
