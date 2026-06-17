
import React from 'react';
import { Play, Square } from 'lucide-react';
import type { FileObject, AIConfig, PipelineState } from '../types';
import type { UsePipelineReturn } from '../hooks/usePipeline';
import { PIPELINE_STEPS } from '../services/pipelineService';
import PipelineProgress from './PipelineProgress';
import { Button } from './ui/Button';

function SkeletonBar({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded ${className}`} style={{ backgroundColor: 'var(--bg-card-hover)' }} />
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-subtle)',
      }}
    >
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
      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Pipeline de Análise
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          O pipeline executa 4 etapas sequenciais para analisar o código-fonte e extrair conhecimento do projeto.
        </p>

        {isRunning && !hasDoneResults ? (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between gap-3">
              {PIPELINE_STEPS.map((step, i) => (
                <React.Fragment key={step.id}>
                  <div
                    className="flex flex-col items-center gap-2 rounded-xl border p-4"
                    style={{
                      minWidth: 120,
                      flex: 1,
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <SkeletonBar className="w-7 h-7 rounded-xl" />
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
          <div
            className="border rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: 'var(--danger-bg)',
              borderColor: 'var(--danger)',
              color: 'var(--danger)',
            }}
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          {isRunning ? (
            <Button
              variant="danger"
              size="md"
              onClick={stopPipeline}
              icon={<Square className="w-4 h-4" />}
            >
              Parar
            </Button>
          ) : (
            <Button
              variant={canStart ? 'primary' : 'ghost'}
              size="md"
              onClick={handleStart}
              disabled={!canStart}
              icon={<Play className="w-4 h-4" />}
            >
              Iniciar Análise
            </Button>
          )}

          {!canStart && !isRunning && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {!projectDescription.trim() && 'adicione uma descrição do projeto'}
              {!projectDescription.trim() && files.length === 0 && ' e '}
              {files.length === 0 && 'carregue arquivos para iniciar'}
            </span>
          )}
        </div>
      </div>

      {isRunning && hasAnyRunning && !hasDoneResults && (
        <div
          className="rounded-2xl border p-6 space-y-4 animate-fade-in"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <h3 className="text-md font-semibold" style={{ color: 'var(--text-primary)' }}>
            Processando...
          </h3>
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}

      {hasDoneResults && (
        <div
          className="rounded-2xl border p-6 space-y-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <h3 className="text-md font-semibold" style={{ color: 'var(--text-primary)' }}>
            Resultados Parciais
          </h3>
          <div className="space-y-3">
            {pipelineState.results
              .filter(r => r.status === 'done' && r.content)
              .map(result => (
                <div
                  key={result.stepId}
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: 'var(--bg-card-hover)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <h4
                    className="text-sm font-medium mb-2 uppercase tracking-wider"
                    style={{ color: 'var(--accent)' }}
                  >
                    {PIPELINE_STEPS.find(s => s.id === result.stepId)?.name ?? result.stepId}
                  </h4>
                  <pre
                    className="text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto"
                    style={{ color: 'var(--text-primary)' }}
                  >
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
