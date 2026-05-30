
import React from 'react';
import { Play, Square } from 'lucide-react';
import type { FileObject, AIConfig, PipelineState } from '../types';
import type { UsePipelineReturn } from '../hooks/usePipeline';
import { PIPELINE_STEPS } from '../services/pipelineService';
import PipelineProgress from './PipelineProgress';

function SkeletonBar({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-700/50 rounded ${className}`} />
  );
}

function SkeletonCard() {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-4 space-y-3">
      <SkeletonBar className="h-4 w-24" />
      <SkeletonBar className="h-3 w-full" />
      <SkeletonBar className="h-3 w-3/4" />
      <SkeletonBar className="h-3 w-1/2" />
    </div>
  );
}

interface AnalyzeTabProps {
  pipeline: UsePipelineReturn;
  projectDescription: string;
  files: FileObject[];
  aiConfig: AIConfig;
}

const AnalyzeTab: React.FC<AnalyzeTabProps> = ({ pipeline, projectDescription, files, aiConfig }) => {
  const { pipelineState, isRunning, error, startPipeline, stopPipeline } = pipeline;

  const canStart = projectDescription.trim().length > 0 && files.length > 0 && !isRunning;

  const handleStart = () => {
    if (!canStart) return;
    startPipeline(projectDescription, files, aiConfig);
  };

  const steps = PIPELINE_STEPS.map(step => {
    const result = pipelineState?.results.find(r => r.stepId === step.id);
    return {
      id: step.id,
      name: step.name,
      status: result?.status ?? 'pending',
    };
  });

  const hasDoneResults = pipelineState?.results.some(r => r.status === 'done');
  const hasAnyRunning = pipelineState?.results.some(r => r.status === 'running');

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-6">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Pipeline de Análise</h2>
        <p className="text-sm text-slate-400">
          O pipeline executa 4 etapas sequenciais para analisar o código-fonte e extrair conhecimento do projeto.
        </p>

        {isRunning && !hasDoneResults ? (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between gap-2">
              {PIPELINE_STEPS.map((step, i) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-700/50 min-w-[120px] flex-1">
                    <SkeletonBar className="w-7 h-7 rounded-full" />
                    <SkeletonBar className="h-3 w-16" />
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && <SkeletonBar className="h-0.5 flex-1" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <PipelineProgress steps={steps} />
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          {isRunning ? (
            <button
              onClick={stopPipeline}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Square className="w-4 h-4" />
              Parar
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={!canStart}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                canStart
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4" />
              Iniciar Análise
            </button>
          )}

          {!canStart && !isRunning && (
            <span className="text-xs text-slate-500">
              {!projectDescription.trim() && 'adicione uma descrição do projeto'}
              {!projectDescription.trim() && files.length === 0 && ' e '}
              {files.length === 0 && 'carregue arquivos para iniciar'}
            </span>
          )}
        </div>
      </div>

      {isRunning && hasAnyRunning && !hasDoneResults && (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 space-y-4 animate-fade-in">
          <h3 className="text-md font-semibold text-white">Processando...</h3>
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}

      {hasDoneResults && (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 space-y-4">
          <h3 className="text-md font-semibold text-white">Resultados Parciais</h3>
          <div className="space-y-3">
            {pipelineState.results
              .filter(r => r.status === 'done' && r.content)
              .map(result => (
                <div key={result.stepId} className="bg-slate-800 rounded-xl border border-slate-700/50 p-4">
                  <h4 className="text-sm font-medium text-indigo-400 mb-2 uppercase tracking-wider">
                    {PIPELINE_STEPS.find(s => s.id === result.stepId)?.name ?? result.stepId}
                  </h4>
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                    {result.content}
                  </pre>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzeTab;
