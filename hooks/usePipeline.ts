import { useState, useCallback, useRef, useEffect } from 'react';
import type { FileObject, AIConfig, PipelineState } from '../types';
import { runPipeline, PIPELINE_STEPS } from '../services/pipelineService';

const CACHE_PREFIX = 'pipeline_cache_';

function buildCacheKey(projectDescription: string, files: FileObject[]): string {
  const fileHash = files.map(f => `${f.file.name}:${f.content.length}`).join('|');
  return `${CACHE_PREFIX}${projectDescription.length}_${files.length}_${fileHash}`;
}

function loadFromCache(key: string): PipelineState | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as PipelineState;
  } catch {
    return null;
  }
}

function saveToCache(key: string, state: PipelineState): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // sessionStorage may be full or unavailable
  }
}

export interface UsePipelineReturn {
  pipelineState: PipelineState | null;
  isRunning: boolean;
  error: string | null;
  startPipeline: (projectDescription: string, files: FileObject[], config: AIConfig) => Promise<void>;
  stopPipeline: () => void;
  resetPipeline: () => void;
}

export function usePipeline(
  onStepComplete?: (stepId: string, content: string) => void
): UsePipelineReturn {
  const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const onStepCompleteRef = useRef(onStepComplete);
  const cacheKeyRef = useRef<string>('');
  onStepCompleteRef.current = onStepComplete;

  const stopPipeline = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const resetPipeline = useCallback(() => {
    setPipelineState(null);
    setError(null);
    setIsRunning(false);
  }, []);

  const startPipeline = useCallback(async (
    projectDescription: string,
    files: FileObject[],
    config: AIConfig
  ): Promise<void> => {
    stopPipeline();

    const key = buildCacheKey(projectDescription, files);
    cacheKeyRef.current = key;

    const cached = loadFromCache(key);
    if (cached) {
      setPipelineState(cached);
      setError(null);
      setIsRunning(false);
      cached.results.forEach(r => {
        if (r.status === 'done' && r.content) {
          onStepCompleteRef.current?.(r.stepId, r.content);
        }
      });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setIsRunning(true);
    setError(null);
    setPipelineState({
      currentStep: 0,
      isRunning: true,
      results: PIPELINE_STEPS.map(step => ({
        stepId: step.id,
        content: '',
        status: 'pending' as const,
      })),
      accumulatedContext: '',
    });

    try {
      const result = await runPipeline(
        projectDescription,
        files,
        config,
        controller.signal,
        (stepId, content) => {
          setPipelineState(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              results: prev.results.map(r =>
                r.stepId === stepId ? { ...r, content, status: 'done' as const } : r
              ),
            };
          });
          onStepCompleteRef.current?.(stepId, content);
        }
      );

      if (!controller.signal.aborted) {
        setPipelineState(result);
        if (result.results.every(r => r.status === 'done')) {
          saveToCache(key, result);
        }
        const failedStep = result.results.find(r => r.status === 'error');
        if (failedStep) {
          setError(`Pipeline falhou na etapa "${failedStep.stepId}": ${failedStep.content}`);
        }
        setIsRunning(false);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setIsRunning(false);
      }
    } finally {
      if (!controller.signal.aborted) {
        abortRef.current = null;
      }
    }
  }, [stopPipeline]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    pipelineState,
    isRunning,
    error,
    startPipeline,
    stopPipeline,
    resetPipeline,
  };
}
