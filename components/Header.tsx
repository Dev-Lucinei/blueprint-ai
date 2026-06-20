import React from 'react';
import { AppMode } from '../types';
import { Button } from './ui/Button';
import { Dropdown, DropdownItem } from './ui/Dropdown';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  projectName?: string;
  onExport?: (format: string) => void;
}

const Header: React.FC<HeaderProps> = ({ mode, setMode, projectName, onExport }) => {
  const exportItems: DropdownItem[] = [
    { id: 'md', label: 'Baixar .md' },
    { id: 'json', label: 'Exportar JSON' },
    { id: 'bundle', label: 'Exportar Bundle' },
  ];

  const handleExport = (id: string) => {
    onExport?.(id);
  };

  return (
    <header
      className="
        h-14
        bg-[var(--bg-sidebar)]
        border-b border-[var(--border-subtle)]
        flex items-center px-6
        fixed top-0 w-full z-50
      "
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
            boxShadow: '0 0 12px var(--accent-glow)',
          }}
        >
          <span className="text-white font-bold text-sm">B</span>
        </div>
        <span className="text-gray-100 font-bold text-lg">Blueprint AI</span>
      </div>

      {/* Breadcrumb */}
      <nav className="ml-8 flex items-center gap-2 text-sm">
        <span className="text-[var(--text-muted)]">Projetos</span>
        <span className="text-[var(--text-muted)]">/</span>
        <span className="text-[var(--text-secondary)]">
          {projectName || 'Novo Projeto'}
        </span>
      </nav>

      {/* Mode Toggle */}
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center space-x-1 bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border-subtle)]">
          {([
            { id: 'documentacao' as AppMode, label: 'Documentacao' },
            { id: 'analise' as AppMode, label: 'Analise' },
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

        <Button variant="ghost" size="sm">
          Documentacao
        </Button>

        <Dropdown
          trigger={<Button variant="primary" size="sm">Exportar</Button>}
          items={exportItems}
          onSelect={handleExport}
        />
      </div>
    </header>
  );
};

export default Header;
