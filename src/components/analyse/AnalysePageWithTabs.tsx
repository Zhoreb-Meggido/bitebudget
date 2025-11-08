import { useState } from 'react';
import { NutritionTab } from './NutritionTab';
import { ActivityTab } from './ActivityTab';
import { BalanceTab } from './BalanceTab';

type TabType = 'nutrition' | 'activity' | 'balance';

export function AnalysePageWithTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('nutrition');

  const tabs = [
    { id: 'nutrition' as TabType, label: 'Voeding', icon: '🍎' },
    { id: 'activity' as TabType, label: 'Activiteit', icon: '🏃' },
    { id: 'balance' as TabType, label: 'Balance', icon: '⚖️' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analyse</h1>
        <p className="text-gray-600 mt-2">Inzichten in je voeding en activiteit</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'nutrition' && <NutritionTab />}
          {activeTab === 'activity' && <ActivityTab />}
          {activeTab === 'balance' && <BalanceTab />}
        </div>
      </div>
    </div>
  );
}
