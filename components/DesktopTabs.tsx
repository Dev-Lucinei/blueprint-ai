
import React from 'react';
import { Tab } from '../types';

interface DesktopTabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const DesktopTabs: React.FC<DesktopTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'projeto', label: 'Projeto' },
    { id: 'conteudo', label: 'Conteúdo' },
    { id: 'acoes', label: 'Ações' },
    { id: 'resultados', label: 'Resultados' },
  ];

  const getTabClass = (tabId: Tab) => {
    const baseClass = "px-6 py-4 text-sm font-medium transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";
    if (activeTab === tabId) {
      return `${baseClass} border-b-2 border-indigo-500 text-indigo-400`;
    }
    return `${baseClass} border-b-2 border-transparent text-slate-400 hover:text-white hover:border-slate-500`;
  };

  return (
    <div className="hidden lg:block bg-slate-900 border-b border-slate-700 sticky top-[73px] z-30">
      <div className="container mx-auto max-w-7xl">
        <div className="flex space-x-1 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={getTabClass(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesktopTabs;
