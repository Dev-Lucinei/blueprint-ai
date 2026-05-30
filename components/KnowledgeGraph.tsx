import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GraphNode, GraphLink } from '../types';

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

const COULOMB_CONSTANT = 5000;
const SPRING_CONSTANT = 0.005;
const SPRING_REST_LENGTH = 150;
const GRAVITY_CONSTANT = 0.001;
const DAMPING = 0.85;
const VELOCITY_THRESHOLD = 0.5;
const MIN_VELOCITY = 0.1;
const LABEL_OFFSET = 14;
const FONT_SIZE = 12;
const HIT_TOLERANCE = 6;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_SPEED = 0.001;
const DRAG_THRESHOLD = 5;
const GRID_CELL_SIZE = 200;
const MAX_FORCE_DIST = 400;

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
  const simNodesRef = useRef<GraphNode[]>([]);
  const simLinksRef = useRef<GraphLink[]>([]);
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const isSimulatingRef = useRef(true);
  const isPanningRef = useRef(false);
  const isDraggingNodeRef = useRef(false);
  const draggedNodeRef = useRef<GraphNode | null>(null);
  const hoveredNodeIdRef = useRef<string | null>(null);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const mouseDownRef = useRef({ x: 0, y: 0, isClick: true });
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const onNodeSelectRef = useRef(onNodeSelect);
  const selectedNodeIdRef = useRef<string | null | undefined>(null);
  const rafIdRef = useRef(0);

  onNodeSelectRef.current = onNodeSelect;
  selectedNodeIdRef.current = selectedNodeId;

  const [isSupported] = useState(() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('2d'));
    } catch {
      return false;
    }
  });

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const cam = cameraRef.current;
    return {
      x: (screenX - cam.x) / cam.zoom,
      y: (screenY - cam.y) / cam.zoom,
    };
  }, []);

  const hitTestNode = useCallback((worldX: number, worldY: number): GraphNode | null => {
    const sn = simNodesRef.current;
    for (let i = sn.length - 1; i >= 0; i--) {
      const node = sn[i];
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < (node.size || 8) + HIT_TOLERANCE) return node;
    }
    return null;
  }, []);

  const getConnectedNodeIds = useCallback((nodeId: string): Set<string> => {
    const connected = new Set<string>([nodeId]);
    for (const link of simLinksRef.current) {
      if (link.source === nodeId) connected.add(link.target);
      if (link.target === nodeId) connected.add(link.source);
    }
    return connected;
  }, []);

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
    const sn = simNodesRef.current;
    const sl = simLinksRef.current;
    const hoveredId = hoveredNodeIdRef.current;
    const selId = selectedNodeIdRef.current;

    const connectedIds = hoveredId ? getConnectedNodeIds(hoveredId) : null;

    for (const link of sl) {
      const source = sn.find(n => n.id === link.source);
      const target = sn.find(n => n.id === link.target);
      if (!source || !target) continue;

      const highlight = connectedIds
        ? (connectedIds.has(source.id) || connectedIds.has(target.id))
        : (selId === source.id || selId === target.id);

      ctx.beginPath();
      ctx.moveTo(source.x * cam.zoom + cam.x, source.y * cam.zoom + cam.y);
      ctx.lineTo(target.x * cam.zoom + cam.x, target.y * cam.zoom + cam.y);
      ctx.strokeStyle = highlight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = highlight ? 2 : 1;
      ctx.stroke();
    }

    for (const node of sn) {
      const isHovered = hoveredId === node.id;
      const isSelected = selId === node.id;
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
  }, [getConnectedNodeIds]);

  const simulate = useCallback(() => {
    const sn = simNodesRef.current;
    if (sn.length === 0) return;

    const n = sn.length;

    const grid = new Map<number, number[]>();
    for (let i = 0; i < n; i++) {
      const node = sn[i];
      const cx = Math.floor(node.x / GRID_CELL_SIZE);
      const cy = Math.floor(node.y / GRID_CELL_SIZE);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = (cx + dx) * 100000 + (cy + dy);
          if (!grid.has(key)) grid.set(key, []);
          grid.get(key)!.push(i);
        }
      }
    }

    const considered = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      considered[i] = 0;
    }

    for (let i = 0; i < n; i++) {
      const node = sn[i];
      const cx = Math.floor(node.x / GRID_CELL_SIZE);
      const cy = Math.floor(node.y / GRID_CELL_SIZE);
      const key = cx * 100000 + cy;
      const cell = grid.get(key);
      if (!cell) continue;

      for (const j of cell) {
        if (j <= i || considered[j]) continue;
        const a = sn[i];
        const b = sn[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > MAX_FORCE_DIST * MAX_FORCE_DIST) continue;
        let dist = Math.sqrt(distSq);
        if (dist < 1) dist = 1;
        const force = COULOMB_CONSTANT / (dist * dist);
        const fx = (force * dx) / dist;
        const fy = (force * dy) / dist;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
        considered[j] = 1;
      }
    }

    const sl = simLinksRef.current;
    for (let li = 0; li < sl.length; li++) {
      const link = sl[li];
      let source: GraphNode | undefined;
      let target: GraphNode | undefined;
      for (let ni = 0; ni < n; ni++) {
        const node = sn[ni];
        if (node.id === link.source) source = node;
        if (node.id === link.target) target = node;
      }
      if (!source || !target) continue;
      let dx = target.x - source.x;
      let dy = target.y - source.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) dist = 1;
      const displacement = dist - SPRING_REST_LENGTH;
      const force = SPRING_CONSTANT * displacement;
      const fx = (force * dx) / dist;
      const fy = (force * dy) / dist;
      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    }

    let maxVel = 0;
    for (let i = 0; i < n; i++) {
      const node = sn[i];
      node.vx -= node.x * GRAVITY_CONSTANT;
      node.vy -= node.y * GRAVITY_CONSTANT;
    }

    for (let i = 0; i < n; i++) {
      const node = sn[i];
      node.vx *= DAMPING;
      node.vy *= DAMPING;

      if (Math.abs(node.vx) < MIN_VELOCITY) node.vx = 0;
      if (Math.abs(node.vy) < MIN_VELOCITY) node.vy = 0;

      if (node.fx != null && node.fy != null) {
        node.x = node.fx;
        node.y = node.fy;
        node.vx = 0;
        node.vy = 0;
        continue;
      }

      node.x += node.vx;
      node.y += node.vy;

      const vel = Math.abs(node.vx) + Math.abs(node.vy);
      if (vel > maxVel) maxVel = vel;
    }

    if (maxVel < VELOCITY_THRESHOLD) {
      isSimulatingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (nodes.length === 0) {
      simNodesRef.current = [];
      simLinksRef.current = [];
      return;
    }

    const allAtOrigin = nodes.every(n => Math.abs(n.x) < 1 && Math.abs(n.y) < 1);
    const hasAnyLink = links.some(l => nodes.some(n => n.id === l.source) && nodes.some(n => n.id === l.target));
    const { width, height } = canvasSizeRef.current;
    const cx = width / 2;
    const cy = height / 2;

    simNodesRef.current = nodes.map((n, i) => {
      let x = n.x;
      let y = n.y;
      if (allAtOrigin) {
        const radius = Math.min(width, height) * 0.3;
        const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
        x = radius * Math.cos(angle);
        y = radius * Math.sin(angle);
      }
      return { ...n, x, y, vx: n.vx || 0, vy: n.vy || 0 };
    });

    simLinksRef.current = links.filter(
      l => nodes.some(n => n.id === l.source) && nodes.some(n => n.id === l.target)
    );

    if (allAtOrigin || !hasAnyLink) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const n of simNodesRef.current) {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
      }
      const graphW = maxX - minX || 400;
      const graphH = maxY - minY || 400;
      const gcX = (minX + maxX) / 2;
      const gcY = (minY + maxY) / 2;

      const scaleX = width / graphW;
      const scaleY = height / graphH;
      const fitZoom = Math.min(scaleX * 0.8, scaleY * 0.8, 2);

      cameraRef.current = {
        x: cx - gcX * fitZoom,
        y: cy - gcY * fitZoom,
        zoom: fitZoom,
      };
    } else {
      cameraRef.current = { x: cx, y: cy, zoom: 1 };
    }

    isSimulatingRef.current = true;
  }, [nodes, links]);

  const tick = useCallback(() => {
    if (isSimulatingRef.current) {
      simulate();
    }
    draw();
    rafIdRef.current = requestAnimationFrame(tick);
  }, [simulate, draw]);

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

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: mx, y: my } = getCanvasCoords(e.clientX, e.clientY);
    mouseDownRef.current = { x: mx, y: my, isClick: true };
    lastMouseRef.current = { x: mx, y: my };

    const world = screenToWorld(mx, my);
    const hit = hitTestNode(world.x, world.y);

    if (hit) {
      isDraggingNodeRef.current = true;
      draggedNodeRef.current = hit;
      hit.fx = hit.x;
      hit.fy = hit.y;
      isPanningRef.current = false;
    } else {
      isPanningRef.current = true;
      isDraggingNodeRef.current = false;
    }
  }, [getCanvasCoords, screenToWorld, hitTestNode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x: mx, y: my } = getCanvasCoords(e.clientX, e.clientY);

    const dx = mx - mouseDownRef.current.x;
    const dy = my - mouseDownRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
      mouseDownRef.current.isClick = false;
    }

    if (isDraggingNodeRef.current && draggedNodeRef.current) {
      const world = screenToWorld(mx, my);
      draggedNodeRef.current.x = world.x;
      draggedNodeRef.current.y = world.y;
      draggedNodeRef.current.fx = world.x;
      draggedNodeRef.current.fy = world.y;
    } else if (isPanningRef.current) {
      const ddx = mx - lastMouseRef.current.x;
      const ddy = my - lastMouseRef.current.y;
      cameraRef.current.x += ddx;
      cameraRef.current.y += ddy;
    } else {
      const world = screenToWorld(mx, my);
      const hit = hitTestNode(world.x, world.y);
      const newHover = hit ? hit.id : null;
      if (newHover !== hoveredNodeIdRef.current) {
        hoveredNodeIdRef.current = newHover;
        canvas.style.cursor = newHover ? 'pointer' : 'default';
      }
    }

    lastMouseRef.current = { x: mx, y: my };
  }, [getCanvasCoords, screenToWorld, hitTestNode]);

  const handleMouseUp = useCallback((_e: React.MouseEvent<HTMLCanvasElement>) => {
    const wasClick = mouseDownRef.current.isClick;

    if (isDraggingNodeRef.current && draggedNodeRef.current) {
      if (wasClick) {
        onNodeSelectRef.current?.(draggedNodeRef.current);
      }
      draggedNodeRef.current.fx = null;
      draggedNodeRef.current.fy = null;
      draggedNodeRef.current = null;
      isDraggingNodeRef.current = false;
    }

    if (isPanningRef.current) {
      if (wasClick) {
        onNodeSelectRef.current?.(null);
      }
      isPanningRef.current = false;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoveredNodeIdRef.current = null;
    isPanningRef.current = false;
    isDraggingNodeRef.current = false;
    if (draggedNodeRef.current) {
      draggedNodeRef.current.fx = null;
      draggedNodeRef.current.fy = null;
      draggedNodeRef.current = null;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const delta = -e.deltaY * ZOOM_SPEED;
      const oldZoom = cameraRef.current.zoom;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom * (1 + delta)));

      const worldX = (mx - cameraRef.current.x) / oldZoom;
      const worldY = (my - cameraRef.current.y) / oldZoom;

      cameraRef.current.x = mx - worldX * newZoom;
      cameraRef.current.y = my - worldY * newZoom;
      cameraRef.current.zoom = newZoom;
    };

    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, []);

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
