import { aiClient } from './aiProvider';
import type { AIConfig, FileObject, PipelineState, GraphNode, GraphLink } from '../types';
import {
  getScoutSystemPrompt,
  getArchaeologistSystemPrompt,
  getArchitectSystemPrompt,
  getCartographerSystemPrompt,
} from './geminiService';

interface StepDef {
  id: 'scout' | 'archaeologist' | 'architect' | 'cartographer';
  name: string;
  getPrompt: () => string;
}

const STEPS: StepDef[] = [
  { id: 'scout', name: 'Scout', getPrompt: getScoutSystemPrompt },
  { id: 'archaeologist', name: 'Archaeologist', getPrompt: getArchaeologistSystemPrompt },
  { id: 'architect', name: 'Architect', getPrompt: getArchitectSystemPrompt },
  { id: 'cartographer', name: 'Cartographer', getPrompt: getCartographerSystemPrompt },
];

function buildContext(projectDescription: string, files: FileObject[]): string {
  const fileList = files
    .map(f => `--- ${f.file.name} ---\n${f.content}`)
    .join('\n\n');
  return `## Descrição do Projeto\n${projectDescription}\n\n## Código-Fonte\n${fileList}`;
}

export async function runPipeline(
  projectDescription: string,
  files: FileObject[],
  config: AIConfig,
  signal?: AbortSignal,
  onStepComplete?: (stepId: string, content: string) => void
): Promise<PipelineState> {
  const sourceContext = buildContext(projectDescription, files);

  const state: PipelineState = {
    currentStep: 0,
    isRunning: true,
    results: STEPS.map(step => ({
      stepId: step.id,
      content: '',
      status: 'pending' as const,
    })),
    accumulatedContext: sourceContext,
  };

  for (let i = 0; i < STEPS.length; i++) {
    if (signal?.aborted) {
      state.isRunning = false;
      return state;
    }

    state.currentStep = i;
    state.results[i].status = 'running';
    const step = STEPS[i];

    try {
      const accumulatedSource = sourceContext + '\n\n## Análise Acumulada\n' + state.accumulatedContext;
      const response = await aiClient.generate(accumulatedSource, config, {
        systemInstruction: step.getPrompt(),
        temperature: 0.3,
      });

      state.results[i].content = response.text;
      state.results[i].status = 'done';
      state.accumulatedContext += `\n\n### ${step.name}\n${response.text}`;
      onStepComplete?.(step.id, response.text);
    } catch (error) {
      state.results[i].status = 'error';
      state.results[i].content = error instanceof Error ? error.message : String(error);
      state.isRunning = false;
      return state;
    }
  }

  state.isRunning = false;
  return state;
}

export function parseGraphFromAnalysis(analysis: string): { nodes: GraphNode[]; links: GraphLink[] } {
  try {
    const jsonMatch = analysis.match(/\{[\s\S]*"nodes"[\s\S]*"links"[\s\S]*\}/);
    if (!jsonMatch) return { nodes: [], links: [] };
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      links: Array.isArray(parsed.links) ? parsed.links : [],
    };
  } catch {
    return { nodes: [], links: [] };
  }
}
