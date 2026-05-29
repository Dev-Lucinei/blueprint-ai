# SPEC — Blueprint AI Merger

## 1. Arquitetura C4

### Nível 1 — Contexto

```
┌──────────────────────────────────────────────────┐
│               Blueprint AI Merger                │
│  (React SPA — Geração de Documentação +         │
│   Engenharia Reversa + Grafo de Conhecimento)   │
└──────────┬───────────────────────────┬───────────┘
           │                           │
           ▼                           ▼
  ┌─────────────────┐       ┌──────────────────┐
  │  Usuário Final  │       │  Provedores IA   │
  │  (Eng. Software)│       │  Gemini / OpenAI │
  │                 │       │  / OpenRouter    │
  └─────────────────┘       └──────────────────┘
```

### Nível 2 — Containers

```
┌─────────────────────────────────────────────────┐
│                 Navegador (Client-Side)          │
│                                                  │
│  ┌──────────┐  ┌────────────┐  ┌─────────────┐  │
│  │ UI Layer │──│ AI Client │──│ Pipeline    │  │
│  │ (React)  │  │ (Provider) │  │ Engine      │  │
│  └────┬─────┘  └────────────┘  └──────┬──────┘  │
│       │                               │          │
│  ┌────▼─────┐                  ┌──────▼──────┐  │
│  │ Canvas   │                  │ Cache/Sess. │  │
│  │ Graph    │                  │ (memory)    │  │
│  └──────────┘                  └─────────────┘  │
└─────────────────────────────────────────────────┘
```

### Nível 3 — Componentes (UI Layer)

```
App.tsx
├── Header
├── DesktopTabs / MobileTabs
├── ProjectTab (descrição + configuração IA)
├── ContentTab (upload arquivos + contexto adicional)
├── PipelineTab (NOVO)
│   ├── PipelineProgress (status 4 etapas)
│   └── PipelineLog (resultados parciais)
├── ActionsTab (refinamento + validação + export)
├── ResultsTab (blueprint + grafo)
│   ├── MarkdownRenderer (com Mermaid + TOC)
│   └── KnowledgeGraph (sub-aba)
└── Toast (feedback global)
```

---

## 2. Princípios de Engenharia

| Princípio | Aplicação |
|---|---|
| **Separação de Responsabilidades** | Cada `tab/` lida com uma etapa distinta do fluxo. Services isolam chamadas de IA. |
| **Provider Pattern** | Toda comunicação com IA passa por `aiProvider.ts`. Pipeline usa o mesmo client, não fetch raw. |
| **Estado Imutável** | React state gerenciado via hooks no App. Pipeline mantém histórico de resultados acumulados. |
| **Componentes Autônomos** | `KnowledgeGraph` é puro: recebe nodes/links como props, não depende de estado global. |
| **Tratamento de Erros** | Toda chamada async tem try/catch + toast. Retry logic encapsulado no service. |

---

## 3. Módulos e Responsabilidades

| Módulo | Arquivo(s) | Responsabilidade |
|---|---|---|
| **Pipeline Engine** | `services/pipelineService.ts` | Orquestrar Scout → Archaeologist → Architect → Cartographer com Chain-of-Thought |
| **AI Provider** | `services/aiProvider.ts` | Abstrair Gemini/OpenAI/OpenRouter atrás de interface única `generate(prompt, config, options)` |
| **System Prompts** | `services/geminiService.ts` | Conter templates de system instruction para blueprint e para cada etapa do pipeline |
| **Knowledge Graph** | `components/KnowledgeGraph.tsx` | Renderizar grafo Canvas com física de partículas, pan/zoom, seleção |
| **Pipeline UI** | `components/PipelineProgress.tsx` | Exibir progresso sequencial das 4 etapas com status e resultados parciais |
| **Markdown Renderer** | `components/tabs/ResultsTab.tsx` | Renderizar Markdown com Mermaid, TOC interativo, code blocks com copy |
| **File Manager** | `components/tabs/ContentTab.tsx` | Upload, validação (tamanho, tipo), árvore de diretórios, remoção de arquivos |

---

## 4. Estratégia de Erros

| Camada | Erro | Resposta |
|---|---|---|
| UI | Toast dismissível com type (success/error/info) e auto-close 3s |
| API IA | Timeout / Rate Limit / 401 | Retry exponencial (até 5x). Se persistir, exibir erro no blueprint |
| Pipeline | Etapa individual falha | Interromper pipeline, exibir resultados parciais acumulados |
| Canvas | WebGL/Canvas não suportado | Fallback para lista estática de nós e links |
| Upload | Arquivo >5MB ou não textual | Toast de erro, arquivo não adicionado ao contexto |

---

## 5. Diagrama de Fluxo

```
[Upload Arquivos] ──► [Pipeline?] ──Sim──► [Scout] ──► [Archaeologist] ──► [Architect] ──► [Cartographer]
       │                    │                    │              │                │                │
       │                    │                    ▼              ▼                ▼                ▼
       │                    │              [resultado]   [resultado]      [resultado]       [JSON nós/links]
       │                    │                    │              │                │                │
       ▼                    ▼                    └──────────────┴────────────────┴────────────────┘
[Descrição Projeto] ──► [Gerar Blueprint] ◄───────── [Contexto Acumulado (opcional)]
                              │
                              ▼
                    [Markdown + Mermaid]
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
             [Export .md]        [Export Bundle JSON]
```

---

## 6. Estrutura de Dados do Pipeline

```typescript
// types.ts (adições)
interface AnalysisStep {
  id: 'scout' | 'archaeologist' | 'architect' | 'cartographer';
  name: string;
  instruction: string;
  output: keyof ExtractedContext | 'fullAnalysis';
}

interface PipelineState {
  currentStep: number;
  isRunning: boolean;
  results: Array<{ stepId: string; content: string; status: 'pending' | 'running' | 'done' | 'error' }>;
  accumulatedContext: string;
}

interface GraphNode {
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

interface GraphLink {
  source: string;
  target: string;
  type: string;
}
```
