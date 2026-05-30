import { 
  getDocSystemInstruction, 
  getRefinementSystemInstruction, 
  getScoutSystemPrompt, 
  getArchaeologistSystemPrompt, 
  getArchitectSystemPrompt, 
  getCartographerSystemPrompt,
  enhanceWithEARS,
  enhanceWithTraceability
} from './prompts';

export { 
  getDocSystemInstruction, 
  getRefinementSystemInstruction, 
  getScoutSystemPrompt, 
  getArchaeologistSystemPrompt, 
  getArchitectSystemPrompt, 
  getCartographerSystemPrompt 
};

/**
 * Enhances a prompt with EARS/INCOSE methodology for requirements.
 */
export function enhancePromptWithEARS(prompt: string): string {
  return enhanceWithEARS(prompt);
}

/**
 * Enhances a prompt with a traceability matrix requirement.
 */
export function enhancePromptWithTraceability(prompt: string): string {
  return enhanceWithTraceability(prompt);
}
