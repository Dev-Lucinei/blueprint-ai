
export type Tab = 'projeto' | 'conteudo' | 'acoes' | 'resultados';

export type AIProvider = 'gemini' | 'openrouter' | 'openai';

export interface AIConfig {
  provider: AIProvider;
  model: string;
}

export const PROVIDER_MODELS: Record<AIProvider, string[]> = {
  gemini: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  openrouter: ['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash', 'mistralai/mistral-7b-instruct'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
};

export const PROVIDER_DEFAULT_MODEL: Record<AIProvider, string> = {
  gemini: 'gemini-2.5-flash',
  openrouter: 'openai/gpt-4o',
  openai: 'gpt-4o',
};

export function getDefaultModel(provider: AIProvider): string {
  return PROVIDER_DEFAULT_MODEL[provider];
}

export interface FileObject {
  file: File;
  content: string;
  status: 'pending' | 'reading' | 'success' | 'error';
}

export interface Inconsistency {
  type: string;
  severity: 'error' | 'warning';
  section: string;
  description: string;
  affectedItems: string[];
}

export interface ValidationResult {
  isValid: boolean;
  inconsistencies: Inconsistency[];
  suggestions: string[];
}

export interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
  custom_class?: string;
}

export interface KanbanTask {
    id: string;
    content: string;
}

export interface LinkValidationResult {
  url: string;
  status: number | 'checking' | 'error';
  statusText: string;
}

export interface AnalysisStep {
  id: 'scout' | 'archaeologist' | 'architect' | 'cartographer';
  name: string;
  instruction: string;
  output: keyof ExtractedContext | 'fullAnalysis';
}

export interface PipelineState {
  currentStep: number;
  isRunning: boolean;
  results: Array<{ stepId: string; content: string; status: 'pending' | 'running' | 'done' | 'error' }>;
  accumulatedContext: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'file' | 'entity' | 'endpoint' | 'tech';
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
  size: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export interface ExtractedContext {
  projectStructure: string;
  technologies: string;
  entryPoints: string;
  dependencies: string;
  entities: string;
  architecture: string;
  dataFlow: string;
}
