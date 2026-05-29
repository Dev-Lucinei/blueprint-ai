
import React from 'react';
import { Tab } from '../types';
import { ProjectIcon, ContentIcon, ActionsIcon, ResultsIcon } from './Icons';

interface MobileTabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const MobileTabs: React.FC<MobileTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'projeto' as Tab, label: 'Projeto', icon: <ProjectIcon /> },
    { id: 'conteudo' as Tab, label: 'Conteúdo', icon: <ContentIcon /> },
    { id: 'acoes' as Tab, label: 'Ações', icon: <ActionsIcon /> },
    { id: 'resultados' as Tab, label: 'Resultados', icon: <ResultsIcon /> },
  ];

  return (
    <nav className="lg:hidden bg-slate-900/80 backdrop-blur-md border-t border-slate-700 p-2 fixed bottom-0 w-full z-50">
      <div className="flex justify-around text-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center p-2 rounded-md transition-colors duration-200 ${
              activeTab === tab.id
                ? 'text-indigo-400'
                : 'text-slate-400 hover:text-indigo-400'
            }`}
          >
            {tab.icon}
            <span className="text-xs font-medium mt-1">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileTabs;
