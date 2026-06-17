import React from 'react';
import { AppMode } from '../types';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const Header: React.FC<HeaderProps> = ({ mode, setMode }) => {
  return (
    <header
      className="
        bg-[var(--bg-sidebar)] backdrop-blur-md
        p-4 shadow-lg sticky top-0 z-40
        border-b border-[var(--border-subtle)]
      "
    >
      <div className="container mx-auto flex items-center justify-between max-w-7xl">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
              boxShadow: '0 0 12px var(--accent-glow)',
            }}
          >
            <svg
              className="h-5 w-5 text-white"
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
          </div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-light)] to-[var(--accent)]">
            Blueprint AI
          </h1>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center space-x-1 bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border-subtle)]">
          {([
            { id: 'documentacao' as AppMode, label: 'Documentação' },
            { id: 'analise' as AppMode, label: 'Análise' },
          ]).map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-md
                transition-all duration-150 ease-in-out
                ${
                  mode === item.id
                    ? 'bg-[var(--accent)] text-white shadow-[0_0_8px_var(--accent-glow)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
