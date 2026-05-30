import React from 'react';
import { GraphNode } from '../types';

const NODE_COLORS: Record<string, string> = {
  file: '#3b82f6',
  entity: '#22c55e',
  endpoint: '#a855f7',
  tech: '#f97316',
};

interface GraphSidebarProps {
  selectedNode: GraphNode | null;
  totalNodes: number;
  totalLinks: number;
}

const GraphSidebar: React.FC<GraphSidebarProps> = ({ selectedNode, totalNodes, totalLinks }) => {
  return (
    <div className="w-64 flex-shrink-0 bg-gray-900 rounded-lg border border-gray-700 overflow-y-auto">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Grafo</h3>
        <p className="text-xs text-gray-400 mt-1">
          {totalNodes} nós · {totalLinks} conexões
        </p>
      </div>

      <div className="p-4 border-b border-gray-700">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Legenda</h4>
        <div className="space-y-1.5">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-300 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4">
        {selectedNode ? (
          <div>
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Nó Selecionado
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-gray-500 uppercase block">ID</span>
                <span className="text-xs text-gray-200 font-mono break-all">{selectedNode.id}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase block">Label</span>
                <span className="text-xs text-gray-200">{selectedNode.label}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase block">Tipo</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-200">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[selectedNode.type] || '#6b7280' }} />
                  {selectedNode.type}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase block">Tamanho</span>
                <span className="text-xs text-gray-200">{selectedNode.size}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <p className="text-xs text-gray-500">
              Clique em um nó para ver detalhes
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphSidebar;
