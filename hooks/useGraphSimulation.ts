import { useState, useEffect, useRef } from 'react';
import { GraphNode, GraphLink } from '../types';

const COULOMB_CONSTANT = 5000;
const SPRING_CONSTANT = 0.005;
const SPRING_REST_LENGTH = 150;
const GRAVITY_CONSTANT = 0.001;
const DAMPING = 0.85;
const VELOCITY_THRESHOLD = 0.5;
const MIN_VELOCITY = 0.1;
const GRID_CELL_SIZE = 200;
const MAX_FORCE_DIST = 400;

interface UseGraphSimulationProps {
  nodes: GraphNode[];
  links: GraphLink[];
  width: number;
  height: number;
}

interface UseGraphSimulationReturn {
  simulatedNodes: GraphNode[];
  simulatedLinks: GraphLink[];
  isSimulating: boolean;
}

export function useGraphSimulation({
  nodes,
  links,
  width,
  height,
}: UseGraphSimulationProps): UseGraphSimulationReturn {
  const simNodesRef = useRef<GraphNode[]>([]);
  const simLinksRef = useRef<GraphLink[]>([]);
  const isSimulatingRef = useRef(true);

  const [simulatedNodes, setSimulatedNodes] = useState<GraphNode[]>([]);
  const [simulatedLinks, setSimulatedLinks] = useState<GraphLink[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);

  const simulate = () => {
    const sn = simNodesRef.current;
    if (sn.length === 0) return;

    const n = sn.length;

    // Grid para colisão eficiente
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

    // Força de Coulomb (repulsão entre nós)
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

    // Força de mola (atração ao longo das arestas)
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

    // Gravidade (atração ao centro)
    let maxVel = 0;
    for (let i = 0; i < n; i++) {
      const node = sn[i];
      node.vx -= node.x * GRAVITY_CONSTANT;
      node.vy -= node.y * GRAVITY_CONSTANT;
    }

    // Atualização de posição com damping
    for (let i = 0; i < n; i++) {
      const node = sn[i];
      node.vx *= DAMPING;
      node.vy *= DAMPING;

      if (Math.abs(node.vx) < MIN_VELOCITY) node.vx = 0;
      if (Math.abs(node.vy) < MIN_VELOCITY) node.vy = 0;

      // Nós fixos não se movem
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

    // Parar simulação quando estabilizar
    if (maxVel < VELOCITY_THRESHOLD) {
      isSimulatingRef.current = false;
      setIsSimulating(false);
    }
  };

  // Inicializar e re-inicializar simulação quando dados mudam
  useEffect(() => {
    if (nodes.length === 0) {
      simNodesRef.current = [];
      simLinksRef.current = [];
      setSimulatedNodes([]);
      setSimulatedLinks([]);
      return;
    }

    const allAtOrigin = nodes.every(n => Math.abs(n.x) < 1 && Math.abs(n.y) < 1);
    const hasAnyLink = links.some(l => nodes.some(n => n.id === l.source) && nodes.some(n => n.id === l.target));
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

    setSimulatedNodes(simNodesRef.current);
    setSimulatedLinks(simLinksRef.current);
    isSimulatingRef.current = true;
    setIsSimulating(true);
  }, [nodes, links, width, height]);

  // Loop de simulação
  useEffect(() => {
    if (!isSimulatingRef.current) return;

    const animate = () => {
      if (isSimulatingRef.current) {
        simulate();
        setSimulatedNodes([...simNodesRef.current]);
      }
      requestAnimationFrame(animate);
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isSimulating]);

  return { simulatedNodes, simulatedLinks, isSimulating };
}
