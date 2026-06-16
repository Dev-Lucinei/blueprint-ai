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

export function Sidebar({ activeTab, onTabChange, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  return (
    <aside className={`flex flex-col bg-gray-800/30 border-r border-gray-700/50 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Toggle button */}
      <button
        onClick={onToggleCollapse}
        className="p-3 hover:bg-gray-700/50 transition-colors border-b border-gray-700/50"
        title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        <span className="text-lg">{isCollapsed ? '☰' : '✕'}</span>
      </button>

      {/* Navigation items */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
              activeTab === item.id
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
            }`}
            title={item.description}
          >
            <span className="text-xl">{item.icon}</span>
            {!isCollapsed && (
              <div className="text-left">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-gray-700/50">
          <div className="text-xs text-gray-500 text-center">
            Blueprint AI v1.0
          </div>
        </div>
      )}
    </aside>
  );
}