import { useState, useCallback, useRef } from 'react';
import { GraphNode } from '../types';

const DRAG_THRESHOLD = 5;

interface UseGraphDragProps {
  onNodeSelect?: (node: GraphNode | null) => void;
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };
  hitTestNode: (worldX: number, worldY: number) => GraphNode | null;
  cameraRef: React.MutableRefObject<{ x: number; y: number; zoom: number }>;
}

interface UseGraphDragReturn {
  isDraggingNode: boolean;
  isPanning: boolean;
  hoveredNodeId: string | null;
  draggedNode: GraphNode | null;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseLeave: () => void;
}

export function useGraphDrag({
  onNodeSelect,
  screenToWorld,
  hitTestNode,
  cameraRef,
}: UseGraphDragProps): UseGraphDragReturn {
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);

  const isDraggingNodeRef = useRef(false);
  const isPanningRef = useRef(false);
  const draggedNodeRef = useRef<GraphNode | null>(null);
  const hoveredNodeIdRef = useRef<string | null>(null);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const mouseDownRef = useRef({ x: 0, y: 0, isClick: true });

  const getCanvasCoords = useCallback((clientX: number, clientY: number, canvas: HTMLCanvasElement | null) => {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const { x: mx, y: my } = getCanvasCoords(e.clientX, e.clientY, canvas);
    mouseDownRef.current = { x: mx, y: my, isClick: true };
    lastMouseRef.current = { x: mx, y: my };

    const world = screenToWorld(mx, my);
    const hit = hitTestNode(world.x, world.y);

    if (hit) {
      isDraggingNodeRef.current = true;
      draggedNodeRef.current = hit;
      setIsDraggingNode(true);
      setDraggedNode(hit);
      hit.fx = hit.x;
      hit.fy = hit.y;
      isPanningRef.current = false;
      setIsPanning(false);
    } else {
      isPanningRef.current = true;
      isDraggingNodeRef.current = false;
      setIsPanning(true);
      setIsDraggingNode(false);
    }
  }, [getCanvasCoords, screenToWorld, hitTestNode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    if (!canvas) return;
    const { x: mx, y: my } = getCanvasCoords(e.clientX, e.clientY, canvas);

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
        setHoveredNodeId(newHover);
        canvas.style.cursor = newHover ? 'pointer' : 'default';
      }
    }

    lastMouseRef.current = { x: mx, y: my };
  }, [getCanvasCoords, screenToWorld, hitTestNode, cameraRef]);

  const handleMouseUp = useCallback((_e: React.MouseEvent<HTMLCanvasElement>) => {
    const wasClick = mouseDownRef.current.isClick;

    if (isDraggingNodeRef.current && draggedNodeRef.current) {
      if (wasClick) {
        onNodeSelect?.(draggedNodeRef.current);
      }
      draggedNodeRef.current.fx = null;
      draggedNodeRef.current.fy = null;
      draggedNodeRef.current = null;
      isDraggingNodeRef.current = false;
      setIsDraggingNode(false);
      setDraggedNode(null);
    }

    if (isPanningRef.current) {
      if (wasClick) {
        onNodeSelect?.(null);
      }
      isPanningRef.current = false;
      setIsPanning(false);
    }
  }, [onNodeSelect]);

  const handleMouseLeave = useCallback(() => {
    hoveredNodeIdRef.current = null;
    setHoveredNodeId(null);
    isPanningRef.current = false;
    setIsPanning(false);
    isDraggingNodeRef.current = false;
    setIsDraggingNode(false);
    if (draggedNodeRef.current) {
      draggedNodeRef.current.fx = null;
      draggedNodeRef.current.fy = null;
      draggedNodeRef.current = null;
      setDraggedNode(null);
    }
  }, []);

  return {
    isDraggingNode,
    isPanning,
    hoveredNodeId,
    draggedNode,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  };
}
