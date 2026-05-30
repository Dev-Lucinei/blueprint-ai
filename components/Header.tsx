import React from 'react';
import { AppMode } from '../types';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const Header: React.FC<HeaderProps> = ({ mode, setMode }) => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-md p-4 shadow-lg sticky top-0 z-40 border-b border-slate-700">
      <div className="container mx-auto flex items-center justify-between max-w-7xl">
        <div className="flex items-center space-x-3">
          <svg
            className="h-8 w-8 text-indigo-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Blueprint AI
          </h1>
        </div>

        <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setMode('documentacao')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
              mode === 'documentacao'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Documentação
          </button>
          <button
            onClick={() => setMode('analise')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
              mode === 'analise'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Análise
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
