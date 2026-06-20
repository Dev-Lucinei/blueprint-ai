import { useState } from 'react';
import { Tab } from '../../types';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: Tab;
  label: string;
  icon: string;
  description: string;
}

const navItems: NavItem[] = [
  { id: 'projeto', label: 'Editor', icon: '📝', description: 'Configurar projeto e contexto' },
  { id: 'analisar', label: 'Processamento', icon: '⚙️', description: 'Pipeline de analise' },
  { id: 'resultados', label: 'Resultado', icon: '📊', description: 'Visualizar e exportar' },
];

export function Sidebar({
  activeTab,
  onTabChange,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <aside
      className={`
        flex flex-col
        bg-[var(--bg-sidebar)]
        border-r border-[var(--border-subtle)]
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        hidden md:flex
        fixed left-0 top-14 bottom-0
      `}
    >
      {/* Toggle button */}
      <button
        onClick={onToggleCollapse}
        className="p-3 hover:bg-[var(--bg-card-hover)] transition-colors duration-150 border-b border-[var(--border-subtle)]"
        title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        <span className="text-lg text-[var(--text-secondary)]">
          {isCollapsed ? '☰' : '✕'}
        </span>
      </button>

      {/* Navigation items */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => onTabChange(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg
                  transition-all duration-150 ease-in-out
                  ${
                    isActive
                      ? 'bg-[var(--accent-glow)] text-[var(--accent-light)] shadow-[0_0_12px_var(--accent-glow)] border-l-2 border-[var(--accent)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-secondary)]'
                  }
                `}
                title={item.description}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <div className="text-left min-w-0">
                    <div className="text-sm font-medium truncate">{item.label}</div>
                    <div className="text-xs text-[var(--text-muted)] truncate">
                      {item.description}
                    </div>
                  </div>
                )}
              </button>

              {/* Tooltip - only when collapsed */}
              {isCollapsed && hoveredItem === item.id && (
                <div
                  className="
                    absolute left-14 top-1/2 -translate-y-1/2
                    bg-[var(--bg-card)] border border-[var(--border-subtle)]
                    rounded-lg px-3 py-2 whitespace-nowrap z-50
                    shadow-lg animate-fade-in
                  "
                >
                  <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{item.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)] text-center">
            Blueprint AI v1.0
          </div>
        </div>
      )}
    </aside>
  );
}
