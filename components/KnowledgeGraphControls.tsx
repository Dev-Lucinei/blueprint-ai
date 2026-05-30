import React from 'react';

interface KnowledgeGraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
  onReset: () => void;
  onFullscreen: () => void;
}

const btnClass = 'p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed';

const KnowledgeGraphControls: React.FC<KnowledgeGraphControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onCenter,
  onReset,
  onFullscreen,
}) => {
  return (
    <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-10">
      <button onClick={onZoomIn} className={btnClass} aria-label="Aumentar zoom" title="Aumentar zoom">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <button onClick={onZoomOut} className={btnClass} aria-label="Diminuir zoom" title="Diminuir zoom">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>
      <button onClick={onCenter} className={btnClass} aria-label="Centralizar" title="Centralizar">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h2m14 0h2M12 3v2m0 14v2m-7-7h14" />
        </svg>
      </button>
      <button onClick={onReset} className={btnClass} aria-label="Resetar visualização" title="Resetar visualização">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      <button onClick={onFullscreen} className={btnClass} aria-label="Tela cheia" title="Tela cheia">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>
  );
};

export default KnowledgeGraphControls;
