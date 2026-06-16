/**
 * Templates and generators for AI system instructions.
 */

import docSystemPrompt from '../prompts/doc-system.md?raw';
import refinementSystemPrompt from '../prompts/refinement-system.md?raw';
import scoutSystemPrompt from '../prompts/pipeline-scout.md?raw';
import archaeologistSystemPrompt from '../prompts/pipeline-archaeologist.md?raw';
import architectSystemPrompt from '../prompts/pipeline-architect.md?raw';
import cartographerSystemPrompt from '../prompts/pipeline-cartographer.md?raw';

export function getDocSystemInstruction(userInputText: string, contextText: string): string {
  const date = new Date().toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Substitui o placeholder ${date} pela data atual
  return docSystemPrompt.replace('${date}', date);
}

export function getRefinementSystemInstruction(refinementPrompt: string, documentContent: string): string {
  return refinementSystemPrompt
    .replace('${refinementPrompt}', refinementPrompt)
    .replace('${documentContent}', documentContent);
}

export function getScoutSystemPrompt(): string {
  return scoutSystemPrompt;
}

export function getArchaeologistSystemPrompt(): string {
  return archaeologistSystemPrompt;
}

export function getArchitectSystemPrompt(): string {
  return architectSystemPrompt;
}

export function getCartographerSystemPrompt(): string {
  return cartographerSystemPrompt;
}

export function enhanceWithEARS(baseInstruction: string): string {
  return baseInstruction + `

--- METODOLOGIA EARS/INCOSE OBRIGATÓRIA ---

PARA A SEÇÃO 2.1 (REQUISITOS FUNCIONAIS):

1. TODOS os Acceptance Criteria DEVEM seguir padrões EARS:
   - Ubiquitous: THE [Sistema] SHALL [resposta]
   - Event-driven: WHEN [trigger], THE [Sistema] SHALL [resposta]
   - State-driven: WHILE [condição], THE [Sistema] SHALL [resposta]
   - Unwanted event: IF [condição], THEN THE [Sistema] SHALL [resposta]
   - Optional feature: WHERE [opção], THE [Sistema] SHALL [resposta]

2. PROIBIDO usar:
   - Termos vagos ("rapidamente", "adequado")
   - Cláusulas de escape ("onde possível")
   - Pronomes ("it", "them")
   - Absolutos ("nunca", "sempre")

3. OBRIGATÓRIO:
   - Voz ativa
   - Critérios mensuráveis
   - Terminologia consistente

--- FIM METODOLOGIA EARS/INCOSE ---`;
}

export function enhanceWithTraceability(baseInstruction: string): string {
  return baseInstruction + `

--- MATRIZ DE RASTREABILIDADE OBRIGATÓRIA ---

ADICIONE APÓS a SEÇÃO 3.3 UMA NOVA SEÇÃO:

### 3.4 MATRIZ DE RASTREABILIDADE

| ID Requisito | Descrição | IDs Tarefas WBS | Critérios de Pronto |
|---|---|---|---|
| RF-001 | [Descrição do requisito] | T001, T002 | [Critérios aplicáveis] |

GARANTA que:
- Cada requisito funcional tenha pelo menos uma tarefa WBS
- Cada tarefa referencie pelo menos um requisito
- Todos os critérios de pronto sejam aplicáveis

--- FIM MATRIZ DE RASTREABILIDADE ---`;
}
