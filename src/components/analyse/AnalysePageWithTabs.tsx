import { useState, useEffect } from 'react';
import { NutritionTab } from './NutritionTab';
import { ActivityTab } from './ActivityTab';
import { BalanceTab } from './BalanceTab';
import { TrendsTab } from './TrendsTab';
import { AggregatesTab } from './AggregatesTab';
import { useSwipeTabs } from '../../hooks';

type TabType = 'nutrition' | 'activity' | 'balance' | 'trends' | 'aggregates';

const ANALYSE_TAB_KEY = 'voedseljournaal_analyse_tab';

export function AnalysePageWithTabs() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem(ANALYSE_TAB_KEY);
    return (saved as TabType) || 'nutrition';
  });

  useEffect(() => {
    localStorage.setItem(ANALYSE_TAB_KEY, activeTab);
  }, [activeTab]);

  const tabs = [
    { id: 'nutrition' as TabType, label: 'Voeding', icon: '🍎' },
    { id: 'activity' as TabType, label: 'Activiteit', icon: '🏃' },
    { id: 'balance' as TabType, label: 'Balance', icon: '⚖️' },
    { id: 'trends' as TabType, label: 'Trends', icon: '📊' },
    { id: 'aggregates' as TabType, label: 'Overzicht', icon: '📅' },
  ];

  // Enable swipe gestures for tab navigation
  const tabIds = tabs.map(t => t.id);
  const swipeHandlers = useSwipeTabs({
    tabs: tabIds,
    activeTab,
    setActiveTab,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analyse</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Inzichten in je voeding en activiteit</p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors flex-1 justify-center
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <span className="text-base sm:text-lg">{tab.icon}</span>
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content - No inner padding, swipe-enabled */}
        <div {...swipeHandlers}>
          {activeTab === 'nutrition' && <NutritionTab />}
          {activeTab === 'activity' && <ActivityTab />}
          {activeTab === 'balance' && <BalanceTab />}
          {activeTab === 'trends' && <TrendsTab />}
          {activeTab === 'aggregates' && <AggregatesTab />}
        </div>
      </div>
    </div>
  );
}
