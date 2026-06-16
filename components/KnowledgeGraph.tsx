import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GraphNode, GraphLink } from '../types';
import { useGraphSimulation } from '../hooks/useGraphSimulation';
import { useGraphZoom } from '../hooks/useGraphZoom';
import { useGraphDrag } from '../hooks/useGraphDrag';

function MobileFallback({ nodes, links, onNodeSelect, selectedNodeId }: {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeSelect?: (node: GraphNode | null) => void;
  selectedNodeId?: string | null;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="w-full h-full min-h-[400px] bg-gray-900 rounded-lg border border-gray-700 overflow-y-auto p-4">
      <p className="text-xs text-gray-400 mb-3">
        {nodes.length} nós · {links.length} conexões
      </p>
      <div className="space-y-1">
        {nodes.map(node => {
          const isSelected = selectedNodeId === node.id;
          const isExpanded = expanded === node.id;
          const connectedLinks = links.filter(l => l.source === node.id || l.target === node.id);
          return (
            <div key={node.id}>
              <button
                onClick={() => {
                  onNodeSelect?.(isSelected ? null : node);
                  setExpanded(isExpanded ? null : node.id);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                  isSelected ? 'bg-gray-700 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getNodeColor(node.type) }} />
                <span className="flex-1 truncate">{node.label || node.id}</span>
                <span className="text-[10px] text-gray-500 uppercase">{node.type}</span>
              </button>
              {isExpanded && connectedLinks.length > 0 && (
                <div className="ml-6 mt-1 mb-2 space-y-0.5">
                  <p className="text-[10px] text-gray-500 uppercase">Conexões</p>
                  {connectedLinks.map((link, i) => (
                    <div key={i} className="text-xs text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span>{link.source === node.id ? link.target : link.source}</span>
                      <span className="text-[10px] text-gray-600">({link.type})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeSelect?: (node: GraphNode | null) => void;
  selectedNodeId?: string | null;
}

const NODE_COLORS: Record<string, string> = {
  file: '#3b82f6',
  entity: '#22c55e',
  endpoint: '#a855f7',
  tech: '#f97316',
};

const LABEL_OFFSET = 14;
const FONT_SIZE = 12;
const HIT_TOLERANCE = 6;

function getNodeColor(type: string): string {
  return NODE_COLORS[type] || '#6b7280';
}

function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  nodes,
  links,
  onNodeSelect,
  selectedNodeId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const selectedNodeIdRef = useRef<string | null | undefined>(null);
  const rafIdRef = useRef(0);

  selectedNodeIdRef.current = selectedNodeId;

  const [isSupported] = useState(() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('2d'));
    } catch {
      return false;
    }
  });

  // Hooks personalizados
  const { simulatedNodes, simulatedLinks } = useGraphSimulation({
    nodes,
    links,
    width: canvasSizeRef.current.width,
    height: canvasSizeRef.current.height,
  });

  const {
    cameraRef,
    handleWheelZoom,
  } = useGraphZoom();

  const {
    hoveredNodeId,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  } = useGraphDrag({
    onNodeSelect,
    screenToWorld: useCallback((screenX: number, screenY: number) => {
      const cam = cameraRef.current;
      return {
        x: (screenX - cam.x) / cam.zoom,
        y: (screenY - cam.y) / cam.zoom,
      };
    }, [cameraRef]),
    hitTestNode: useCallback((worldX: number, worldY: number): GraphNode | null => {
      for (let i = simulatedNodes.length - 1; i >= 0; i--) {
        const node = simulatedNodes[i];
        const dx = worldX - node.x;
        const dy = worldY - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < (node.size || 8) + HIT_TOLERANCE) return node;
      }
      return null;
    }, [simulatedNodes]),
    cameraRef,
  });

  const getConnectedNodeIds = useCallback((nodeId: string): Set<string> => {
    const connected = new Set<string>([nodeId]);
    for (const link of simulatedLinks) {
      if (link.source === nodeId) connected.add(link.target);
      if (link.target === nodeId) connected.add(link.source);
    }
    return connected;
  }, [simulatedLinks]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvasSizeRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const cam = cameraRef.current;
    const sn = simulatedNodes;
    const sl = simulatedLinks;

    const connectedIds = hoveredNodeId ? getConnectedNodeIds(hoveredNodeId) : null;

    for (const link of sl) {
      const source = sn.find(n => n.id === link.source);
      const target = sn.find(n => n.id === link.target);
      if (!source || !target) continue;

      const highlight = connectedIds
        ? (connectedIds.has(source.id) || connectedIds.has(target.id))
        : (selectedNodeIdRef.current === source.id || selectedNodeIdRef.current === target.id);

      ctx.beginPath();
      ctx.moveTo(source.x * cam.zoom + cam.x, source.y * cam.zoom + cam.y);
      ctx.lineTo(target.x * cam.zoom + cam.x, target.y * cam.zoom + cam.y);
      ctx.strokeStyle = highlight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = highlight ? 2 : 1;
      ctx.stroke();
    }

    for (const node of sn) {
      const isHovered = hoveredNodeId === node.id;
      const isSelected = selectedNodeIdRef.current === node.id;
      const sx = node.x * cam.zoom + cam.x;
      const sy = node.y * cam.zoom + cam.y;
      const radius = Math.max(3, (node.size || 8) * cam.zoom);

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(sx, sy, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = getNodeColor(node.type);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (isHovered) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (cam.zoom > 0.35 && node.label) {
        ctx.fillStyle = (isHovered || isSelected) ? '#ffffff' : 'rgba(255,255,255,0.75)';
        ctx.font = `${Math.max(8, Math.round(FONT_SIZE * cam.zoom))}px system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, sx + radius + LABEL_OFFSET * cam.zoom, sy);
      }
    }
  }, [simulatedNodes, simulatedLinks, hoveredNodeId, getConnectedNodeIds, cameraRef]);

  const tick = useCallback(() => {
    draw();
    rafIdRef.current = requestAnimationFrame(tick);
  }, [draw]);

  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [tick]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w === 0 || h === 0) continue;
        canvasSizeRef.current = { width: w, height: h };
        const dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = (e: WheelEvent) => {
      const rect = canvas.getBoundingClientRect();
      handleWheelZoom(e, rect);
    };

    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, [handleWheelZoom]);

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 rounded-lg border border-gray-700">
        <p className="text-gray-400 text-sm">
          Canvas não é suportado neste navegador.
        </p>
      </div>
    );
  }

  if (nodes.length > 0 && isTouchDevice()) {
    return (
      <MobileFallback
        nodes={nodes}
        links={links}
        onNodeSelect={onNodeSelect}
        selectedNodeId={selectedNodeId}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[400px] bg-gray-900 rounded-lg overflow-hidden border border-gray-700"
    >
      {nodes.length === 0 ? (
        <div className="flex items-center justify-center w-full h-full min-h-[400px]">
          <div className="text-center p-8">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <p className="text-gray-400 text-sm">
              Nenhum nó encontrado. Verifique se os arquivos contêm código-fonte válido.
            </p>
          </div>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      )}

      {nodes.length > 0 && (
        <div className="absolute top-2 left-2 flex gap-2 pointer-events-none">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {type}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraph;
