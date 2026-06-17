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
  { id: 'analisar', label: 'Processamento', icon: '⚙️', description: 'Pipeline de análise' },
  { id: 'resultados', label: 'Resultado', icon: '📊', description: 'Visualizar e exportar' },
];

export function Sidebar({
  activeTab,
  onTabChange,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={`
        flex flex-col
        bg-[var(--bg-sidebar)]
        border-r border-[var(--border-subtle)]
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        hidden md:flex
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
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-lg
                transition-all duration-150 ease-in-out
                ${
                  isActive
                    ? 'bg-[var(--accent-glow)] text-[var(--accent-light)] shadow-[0_0_12px_var(--accent-glow)]'
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
