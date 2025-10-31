import { useState, useEffect } from 'react';

export type TabId = 'journaal' | 'tracking' | 'dashboard' | 'analyse' | 'data' | 'instellingen';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'journaal', label: 'Journaal', icon: '📔' },
  { id: 'tracking', label: 'Tracking', icon: '⚖️' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'analyse', label: 'Analyse', icon: '📈' },
  { id: 'data', label: 'Data', icon: '💾' },
  { id: 'instellingen', label: 'Instellingen', icon: '⚙️' },
];

const ACTIVE_TAB_KEY = 'voedseljournaal_active_tab';

interface Props {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export function TabNavigation({ activeTab, onTabChange }: Props) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <nav className="flex justify-around sm:justify-start sm:space-x-8" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-1 sm:gap-2
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              aria-label={tab.label}
            >
              <span className="text-base sm:text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function useActiveTab(): [TabId, (tab: TabId) => void] {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const saved = localStorage.getItem(ACTIVE_TAB_KEY);
    return (saved as TabId) || 'journaal';
  });

  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
  }, [activeTab]);

  return [activeTab, setActiveTab];
}
