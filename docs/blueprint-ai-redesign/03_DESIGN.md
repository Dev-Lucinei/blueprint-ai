# 03_DESIGN.md

**Baseado em**: 02_PRD.md
**Data**: 2026-06-16
**Autor**: Lucinei

---

## 1. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| UI Framework | React 19 | Manutenção da stack atual, hooks modernos |
| Bundler | Vite 6 | Build rápido, HMR eficiente |
| Linguagem | TypeScript 5.8 | Tipagem estática, autocompletar |
| Estilo | Tailwind CSS | Utility-first, responsividade mobile |
| IA Client | Google GenAI SDK + OpenAI + OpenRouter | 3 provedores cloud |
| IA Local | Ollama (porta 11434) | Privacidade, sem custo |
| State | useReducer + Context | Substitui 13 useState por estado unificado |
| Cache | sessionStorage | Persistência parcial do pipeline entre reloads |
| Grafo | D3.js force-directed | Visualização interativa de knowledge graph |
| Markdown | react-markdown + rehype | Renderização segura de MD gerado |

---

## 2. Modelo de Dados

### 2.1. Tipos Globais (types.ts)

```typescript
// === MACRO-ESTADOS ===
type MacroState = 'editor' | 'processing' | 'workspace';

// === AI PROVIDERS ===
type AIProvider = 'gemini' | 'openai' | 'openrouter' | 'ollama';
type AppMode = 'documentacao' | 'analise';

// === PROJECT METADATA ===
interface ProjectMeta {
  name: string;
  description: string;
  deadline: string;
}

// === FILE MANAGEMENT ===
interface FileObject {
  file: File;
  content: string;
}

// === PIPELINE STEPS ===
type StepId = 'scout' | 'archaeologist' | 'architect' | 'cartographer';
type StepStatus = 'pending' | 'running' | 'done' | 'error' | 'cancelled';

interface PipelineStep {
  id: StepId;
  label: string;
  status: StepStatus;
  content: string;
  startedAt?: number;
  completedAt?: number;
}

interface PipelineState {
  steps: PipelineStep[];
  accumulatedContext: string;
  currentStepIndex: number;
}

// === AI CONFIG ===
interface AIConfig {
  provider: AIProvider;
  model: string;
}

// === REFINEMENT CHAT ===
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// === APPLICATION STATE (REDUCER) ===
interface AppState {
  macroState: MacroState;
  project: ProjectMeta;
  contextText: string;
  files: FileObject[];
  ai: AIConfig;
  pipeline: PipelineState | null;
  generatedMarkdown: string;
  chatHistory: ChatMessage[];
  graphData: { nodes: Node[]; links: Link[] };
}

// === ACTIONS ===
type AppAction =
  | { type: 'SET_MACRO_STATE'; payload: MacroState }
  | { type: 'UPDATE_PROJECT'; payload: Partial<ProjectMeta> }
  | { type: 'SET_CONTEXT_TEXT'; payload: string }
  | { type: 'ADD_FILES'; payload: FileObject[] }
  | { type: 'REMOVE_FILE'; payload: number }
  | { type: 'SET_AI_CONFIG'; payload: Partial<AIConfig> }
  | { type: 'START_PIPELINE'; payload: PipelineState }
  | { type: 'UPDATE_STEP'; payload: { stepId: StepId; updates: Partial<PipelineStep> } }
  | { type: 'SET_PIPELINE_CONTEXT'; payload: string }
  | { type: 'SET_GENERATED_MD'; payload: string }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_GRAPH_DATA'; payload: { nodes: Node[]; links: Link[] } }
  | { type: 'RESET' };
```

### 2.2. Diagrama de Estados

```
                    ┌─────────────────────────────────────┐
                    │         MACRO STATE: EDITOR          │
                    │                                     │
                    │  ┌────────────┐  ┌───────────────┐  │
                    │  │  Sidebar   │  │  Main Area    │  │
                    │  │  (AI cfg)  │  │  (Meta + Files│  │
                    │  │            │  │  + Context)   │  │
                    │  └────────────┘  └───────────────┘  │
                    │                                     │
                    │  [Iniciar Processamento] ────────────┼──┐
                    └─────────────────────────────────────┘  │
                                                             │
                    ┌─────────────────────────────────────┐  │
                    │      MACRO STATE: PROCESSING        │  │
                    │                                     │  │
                    │  ┌─────┐┌─────┐┌─────┐┌──────────┐  │  │
                    │  │Scout││Arche││Archi││Cartograp.│  │  │
                    │  └─────┘└─────┘└─────┘└──────────┘  │  │
                    │  [Cancelar]  Progresso: 75%          │  │
                    │                                     │  │
                    │  Resultados parciais ────────────────┼──┐
                    └─────────────────────────────────────┘  │
                                                             │
                    ┌─────────────────────────────────────┐  │
                    │      MACRO STATE: WORKSPACE          │  │
                    │                                     │  │
                    │  ┌──────────┐  ┌──────────────────┐  │  │
                    │  │ TOC      │  │ MD Preview       │  │  │
                    │  │ Sidebar  │  │ + Raw Toggle     │  │  │
                    │  │          │  │                  │  │  │
                    │  │ Chat     │  │ [Copiar][Baixar] │  │  │
                    │  │ Refine   │  │ [JSON][Graph]    │  │  │
                    │  └──────────┘  └──────────────────┘  │  │
                    │                                     │  │
                    │  ←─── Voltar ao Editor ──────────────┼──┘
                    └─────────────────────────────────────┘
```

---

## 3. API Endpoints

**Não aplicável — frontend puro.**

---

## 4. Estrutura de Pastas

```
blueprint-ai/
├── App.tsx                          # Root: macro-state router
├── index.tsx                        # Entry point
├── types.ts                         # Tipos centrais (atualizado)
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
│
├── context/
│   └── AppContext.tsx               # useReducer + Context global
│
├── hooks/
│   ├── usePipeline.ts               # Orquestração do pipeline de agentes
│   └── useAutoScroll.ts             # Auto-scroll no chat
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx              # Sidebar colapsável (AI config + TOC)
│   │   ├── Header.tsx               # Header responsivo (simplificado)
│   │   └── MobileNav.tsx            # Navegação mobile bottom-sheet
│   │
│   ├── editor/
│   │   ├── ProjectMetaForm.tsx      # Nome + Deadline + Descrição
│   │   ├── FileUploader.tsx         # Drag & drop + lista de arquivos
│   │   ├── FileTree.tsx             # Mini-árvore visual
│   │   ├── ContextEditor.tsx        # Textarea de contexto
│   │   └── InjectStructureBtn.tsx   # Template sugerido
│   │
│   ├── processing/
│   │   ├── PipelineStepper.tsx      # Stepper visual 4 steps
│   │   ├── StepCard.tsx             # Card individual com status
│   │   └── PartialResult.tsx        # Preview do output de cada step
│   │
│   ├── workspace/
│   │   ├── MarkdownPreview.tsx      # Renderização MD com react-markdown
│   │   ├── RawToggle.tsx            # Toggle MD vs raw
│   │   ├── ExportToolbar.tsx        # Copiar / Baixar .md / JSON
│   │   ├── RefinementChat.tsx       # Chat integrado de refinamento
│   │   └── KnowledgeGraphToggle.tsx # Toggle para abrir grafo
│   │
│   └── shared/
│       ├── Button.tsx               # Botão reutilizável
│       ├── Toast.tsx                # Notificações (existente)
│       ├── Spinner.tsx              # Loading indicator
│       └── Tabs.tsx                 # Tabs mobile/desktop (simplificado)
│
├── services/
│   ├── aiProvider.ts                # Cliente unificado (4 provedores)
│   ├── geminiService.ts             # System instructions Gemini
│   ├── openaiService.ts             # System instructions OpenAI
│   ├── openrouterService.ts         # System instructions OpenRouter
│   └── pipelineService.ts           # Pipeline de agentes
│
├── utils/
│   ├── sessionStorage.ts            # Cache do pipeline
│   └── markdown.ts                  # Helpers de formatação
│
└── docs/
    └── blueprint-ai-redesign/
        ├── 01_BRIEF.md
        ├── 02_PRD.md
        └── 03_DESIGN.md             # Este arquivo
```

---

## 5. Fluxo Principal UI

### 5.1. Diagrama de Navegação

```
┌──────────────────────────────────────────────────────────────────┐
│                    BLUEPRINT-AI FLOW                             │
│                                                                  │
│  INÍCIO                                                          │
│    │                                                              │
│    ▼                                                              │
│  ┌─────────────────────────────────────────────────┐             │
│  │ MACRO 1: EDITOR                                 │             │
│  │                                                 │             │
│  │  1.1  Configurar IA (sidebar)                   │             │
│  │       ├─ Selecionar provider                    │             │
│  │       └─ Selecionar modelo                      │             │
│  │                                                 │             │
│  │  1.2  Preencher metadados                       │             │
│  │       ├─ Nome do projeto                        │             │
│  │       ├─ Prazo (opcional)                       │             │
│  │       └─ Descrição (obrigatório)                │             │
│  │                                                 │             │
│  │  1.3  Upload de contexto                        │             │
│  │       ├─ Texto livre                            │             │
│  │       └─ Arquivos (drag & drop)                 │             │
│  │                                                 │             │
│  │  1.4  [Iniciar Processamento] ←── habilitado    │             │
│  │       quando: description != '' && apiKey OK    │             │
│  │                                                 │             │
│  │  1.5  [Injetar Estrutura] → preenche template  │             │
│  └───────────────────────┬─────────────────────────┘             │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────┐             │
│  │ MACRO 2: PROCESSING                             │             │
│  │                                                 │             │
│  │  2.1  Scout: busca contexto externo             │             │
│  │       ↓ (card verde)                            │             │
│  │  2.2  Archaeologist: analisa arquivos           │             │
│  │       ↓ (card verde)                            │             │
│  │  2.3  Architect: gera estrutura doc             │             │
│  │       ↓ (card verde)                            │             │
│  │  2.4  Cartographer: gera conteúdo final         │             │
│  │       ↓ (card verde)                            │             │
│  │                                                 │             │
│  │  [Cancelar] disponível durante execução         │             │
│  │  Resultados parciais exibidos por step          │             │
│  │                                                 │             │
│  │  → AUTO → WORKSPACE (quando pipeline completo)  │             │
│  └───────────────────────┬─────────────────────────┘             │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────┐             │
│  │ MACRO 3: WORKSPACE                              │             │
│  │                                                 │             │
│  │  3.1  Visualização principal                    │             │
│  │       ├─ MD formatado (default)                 │             │
│  │       └─ Toggle → Raw MD                        │             │
│  │                                                 │             │
│  │  3.2  Sidebar                                   │             │
│  │       ├─ TOC (títulos do doc)                   │             │
│  │       └─ Chat de refinamento                    │             │
│  │                                                 │             │
│  │  3.3  Toolbar de exportação                     │             │
│  │       ├─ Copiar para clipboard                  │             │
│  │       ├─ Baixar .md                             │             │
│  │       ├─ Exportar JSON                          │             │
│  │       └─ Toggle Knowledge Graph                 │             │
│  │                                                 │             │
│  │  3.4  Refinamento iterativo                     │             │
│  │       └─ Envia mensagem → IA atualiza doc       │             │
│  │                                                 │             │
│  │  3.5  ←── Voltar ao Editor (refazer)            │             │
│  └─────────────────────────────────────────────────┘             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2. Estados de Transição

```
Editor ──[click "Iniciar"]──→ Processing
                                    │
                                    ├──[pipeline completo]──→ Workspace
                                    │
                                    ├──[cancelar]──→ Editor (mantém dados)
                                    │
                                    └──[erro]──→ Editor (mantém dados)

Workspace ──[click "Voltar"]──→ Editor
```

---

## 6. Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              App.tsx                                     │
│                           (Macro-State Router)                          │
│                              │                                          │
│              ┌───────────────┼───────────────┐                          │
│              │               │               │                          │
│              ▼               ▼               ▼                          │
│    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                   │
│    │    Editor     │ │  Processing  │ │   Workspace  │                   │
│    │   (Macro 1)   │ │  (Macro 2)   │ │  (Macro 3)   │                   │
│    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘                   │
│           │                │                │                            │
│    ┌──────┴───────┐        │         ┌──────┴───────┐                   │
│    │              │        │         │              │                   │
│    ▼              ▼        ▼         ▼              ▼                   │
│ ┌────────┐  ┌────────┐ ┌────────┐ ┌────────┐  ┌────────┐              │
│ │Sidebar │  │MetaForm│ │Stepper │ │Preview │  │  Chat  │              │
│ │(AI cfg)│  │        │ │        │ │        │  │        │              │
│ └────┬───┘  └────────┘ └────────┘ └────────┘  └────────┘              │
│      │                                        │                        │
│      │         ┌────────┐                     │                        │
│      │         │FileUpld│                     │                        │
│      │         └────────┘                     │                        │
│      │         ┌────────┐              ┌──────┴───────┐               │
│      │         │FileTree│              │ExportToolbar │               │
│      │         └────────┘              └──────────────┘               │
│      │         ┌────────┐                                             │
│      └────────→│ TOC    │  (reutilizado: no editor mostra             │
│                └────────┘   arquivos, no workspace mostra TOC)        │
│                                                                      │
│    ──── Shared ────                                                  │
│    ┌─────────┐ ┌────────┐ ┌─────────┐                               │
│    │ Toast   │ │Spinner │ │ Button  │                               │
│    └─────────┘ └────────┘ └─────────┘                               │
│                                                                      │
│    ──── Services ────                                                │
│    ┌─────────────────────────────────────┐                           │
│    │ aiProvider.ts (4 provedores)        │                           │
│    │ pipelineService.ts (orchestration)  │                           │
│    │ geminiService.ts (instructions)     │                           │
│    └─────────────────────────────────────┘                           │
│                                                                      │
│    ──── State ────                                                   │
│    ┌─────────────────────────────────────┐                           │
│    │ AppContext.tsx (useReducer + Provider)│                          │
│    └─────────────────────────────────────┘                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.1. Fluxo de Dados entre Componentes

```
AppContext (Provider)
    │
    ├──→ Editor
    │       ├── Sidebar          →  Dispatch: SET_AI_CONFIG
    │       ├── ProjectMetaForm  →  Dispatch: UPDATE_PROJECT
    │       ├── FileUploader     →  Dispatch: ADD_FILES / REMOVE_FILE
    │       ├── ContextEditor    →  Dispatch: SET_CONTEXT_TEXT
    │       └── InjectStructure  →  Dispatch: SET_CONTEXT_TEXT (template)
    │
    ├──→ Processing
    │       └── PipelineStepper  →  usePipeline hook → Dispatch: UPDATE_STEP
    │
    └──→ Workspace
            ├── MarkdownPreview  ←  State: generatedMarkdown
            ├── RawToggle        →  Toggle local (MD/RAW)
            ├── ExportToolbar    →  State: generatedMarkdown
            ├── RefinementChat   →  Dispatch: ADD_CHAT_MESSAGE
            └── KnowledgeGraph   ←  State: graphData
```

---

## 7. Decisões de Design

### 7.1. useState → useReducer

**Problema:** App.tsx atual tem 13 useState, dificultando manutenção e debugging.

**Solução:** Migrar para `useReducer` com `AppContext` centralizado.

```typescript
// Antes: 13 useState separados
const [activeTab, setActiveTab] = useState<Tab>('projeto');
const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');
// ... mais 11

// Depois: 1 reducer com actions tipadas
const [state, dispatch] = useReducer(appReducer, initialState);
```

### 7.2. Sidebar Colapsável

**Desktop:** Sidebar fixa à esquerda com toggle de collapse.

```text
┌──────┬────────────────────────────┐
│ ┌──┐ │                            │
│ │⚙️│ │    Área Principal           │
│ │  │ │                            │
│ ├──┤ │                            │
│ │📁│ │    Metadados do Projeto    │
│ │  │ │    Upload de Arquivos      │
│ │📋│ │    Contexto                │
│ └──┘ │                            │
│      │    [Iniciar Processamento] │
└──────┴────────────────────────────┘
  240px     flex-1
```

**Mobile:** Sidebar vira bottom-sheet com ícone flutuante.

```text
┌─────────────────────┐
│                     │
│   Área Principal    │
│                     │
│                     │
│                     │
└─────────────────────┘
  [⚙️] ← floating button → abre bottom-sheet
```

### 7.3. Grafo de Conhecimento

**Antes:** Componente monolítico (626 linhas) sempre visível.

**Depois:** Toggle button no Workspace que abre overlay/modal.

```text
┌─────────────────────────────────────────────┐
│  Workspace                    [🔍 Graph]    │
│                                             │
│  Markdown Preview...                        │
│                                             │
│─────────────────────────────────────────────│
│  Click "Graph" → abre overlay D3.js         │
│  [X] fecha overlay                          │
└─────────────────────────────────────────────┘
```

### 7.4. Cache do Pipeline

```typescript
// sessionStorage key: 'blueprint-ai-pipeline'
// Salva: pipelineState completo entre reloads
// TTL: descarta se > 30 minutos

const savePipelineCache = (state: PipelineState) => {
  sessionStorage.setItem('blueprint-ai-pipeline', JSON.stringify({
    ...state,
    cachedAt: Date.now()
  }));
};

const loadPipelineCache = (): PipelineState | null => {
  const raw = sessionStorage.getItem('blueprint-ai-pipeline');
  if (!raw) return null;
  const data = JSON.parse(raw);
  if (Date.now() - data.cachedAt > 30 * 60 * 1000) {
    sessionStorage.removeItem('blueprint-ai-pipeline');
    return null;
  }
  return data;
};
```

### 7.5. Compatibilidade Ollama

Ollama continua sendo detectado automaticamente (porta 11434). A detecção ocorre no `AIConfig`:

```typescript
const isOllamaAvailable = async (): Promise<boolean> => {
  try {
    const res = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(2000)
    });
    return res.ok;
  } catch {
    return false;
  }
};
```

---

## 8. Métricas de Sucesso

| Métrica | Atual | Meta |
|---------|-------|------|
| Cliques até primeiro resultado | ~12 | < 5 |
| Tempo de setup (projeto simples) | ~3 min | < 2 min |
| Componentes no App.tsx | 13 useState | 1 useReducer |
| Tamanho máximo componente | 626 linhas | < 200 linhas |
| Testes de tipos (tsc) | 0 | 0 (mantido) |
