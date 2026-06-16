import { useState, useCallback, useRef } from 'react';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_SPEED = 0.001;

interface UseGraphZoomProps {
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  initialPan?: { x: number; y: number };
}

interface UseGraphZoomReturn {
  zoom: number;
  pan: { x: number; y: number };
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleReset: () => void;
  handleWheelZoom: (e: WheelEvent, canvasRect: DOMRect) => void;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  cameraRef: React.MutableRefObject<{ x: number; y: number; zoom: number }>;
}

export function useGraphZoom({
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM,
  initialZoom = 1,
  initialPan = { x: 0, y: 0 },
}: UseGraphZoomProps = {}): UseGraphZoomReturn {
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState(initialPan);
  const cameraRef = useRef({ x: initialPan.x, y: initialPan.y, zoom: initialZoom });

  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z * 1.2, maxZoom));
    cameraRef.current.zoom = Math.min(cameraRef.current.zoom * 1.2, maxZoom);
  }, [maxZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z / 1.2, minZoom));
    cameraRef.current.zoom = Math.max(cameraRef.current.zoom / 1.2, minZoom);
  }, [minZoom]);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    cameraRef.current = { x: 0, y: 0, zoom: 1 };
  }, []);

  const handleWheelZoom = useCallback((e: WheelEvent, canvasRect: DOMRect) => {
    e.preventDefault();
    const mx = e.clientX - canvasRect.left;
    const my = e.clientY - canvasRect.top;

    const delta = -e.deltaY * ZOOM_SPEED;
    const oldZoom = cameraRef.current.zoom;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, oldZoom * (1 + delta)));

    const worldX = (mx - cameraRef.current.x) / oldZoom;
    const worldY = (my - cameraRef.current.y) / oldZoom;

    cameraRef.current.x = mx - worldX * newZoom;
    cameraRef.current.y = my - worldY * newZoom;
    cameraRef.current.zoom = newZoom;

    setZoom(newZoom);
    setPan({ x: cameraRef.current.x, y: cameraRef.current.y });
  }, [minZoom, maxZoom]);

  return {
    zoom,
    pan,
    handleZoomIn,
    handleZoomOut,
    handleReset,
    handleWheelZoom,
    setPan,
    setZoom,
    cameraRef,
  };
}
