# Backlog — Blueprint AI Merger

---

## Fase 1 — Fundação (Estrutura + Tipos + Dependências)

| ID | Tarefa | Requisitos | Esforço | Dependências |
|---|---|---|---|---|
| T-001 | Adicionar `lucide-react` ao `package.json` e instalar | — | 5min | Nenhuma |
| T-002 | Estender `types.ts` com interfaces `AnalysisStep`, `PipelineState`, `GraphNode`, `GraphLink`, `ExtractedContext` | RF-003, RF-004 | 30min | Nenhuma |
| T-003 | Criar `services/pipelineService.ts` com orquestrador de pipeline multi-agente usando `aiProvider.ts` | RF-003 | 2h | T-002 |
| T-004 | Adicionar system prompts para Scout, Archaeologist, Architect, Cartographer em `services/geminiService.ts` | RF-003 | 1h | T-003 |
| T-005 | Adicionar retry logic com exponential backoff no `aiProvider.ts` | RS-002 | 30min | Nenhuma |

## Fase 2 — Pipeline Visual + Integração UI

| ID | Tarefa | Requisitos | Esforço | Dependências |
|---|---|---|---|---|
| T-006 | Criar `components/PipelineProgress.tsx` com barra de 4 etapas e status | RF-003 | 1h30min | T-003 |
| T-007 | Adicionar aba "Analisar" ao App, DesktopTabs, MobileTabs | RF-002 | 30min | T-006 |
| T-008 | Implementar `usePipeline` hook em App.tsx (estado do pipeline, execução, resultados acumulados) | RF-003 | 1h | T-003, T-005 |
| T-009 | Conectar resultados do pipeline ao fluxo de geração do blueprint (contexto enriquecido) | RF-005 | 1h | T-008 |

## Fase 3 — Grafo de Conhecimento

| ID | Tarefa | Requisitos | Esforço | Dependências |
|---|---|---|---|---|
| T-010 | Criar `components/KnowledgeGraph.tsx` com Canvas, simulação física (Coulomb + molas), pan/zoom | RF-004 | 4h | T-002 |
| T-011 | Criar `components/GraphSidebar.tsx` com detalhes do nó selecionado e legenda | RF-009 | 1h | T-010 |
| T-012 | Criar `components/KnowledgeGraphControls.tsx` (ZoomIn/Out, centralizar, reset, fullscreen) | RF-004 | 30min | T-010 |
| T-013 | Implementar `parseGraphFromAI()` no pipeline para extrair JSON de nós/links | RF-004 | 30min | T-003, T-010 |
| T-014 | Integrar grafo como sub-aba em ResultsTab | RF-004 | 30min | T-010, T-013 |
| T-015 | Adicionar fallback mobile para grafo (lista estática de nós quando touch) | RP-001 | 1h | T-010 |

## Fase 4 — Segurança e Tratamento de Erros

| ID | Tarefa | Requisitos | Esforço | Dependências |
|---|---|---|---|---|
| T-016 | Remover API key hardcoded do webapp.tsx legado | RS-001 | 5min | Nenhuma |
| T-017 | Adicionar validação de API key configurada antes de chamadas no pipeline | RS-003 | 15min | T-003 |
| T-018 | Implementar interrupção do pipeline com preservação de resultados parciais em caso de erro | RE-002 | 30min | T-008 |
| T-019 | Adicionar toast de erro específico para upload >5MB e formato inválido | RE-003 | 15min | Nenhuma |
| T-020 | Adicionar mensagem informativa para grafo vazio (0 nós) | RE-004 | 15min | T-013 |

## Fase 5 — Qualidade e Testes

| ID | Tarefa | Requisitos | Esforço | Dependências |
|---|---|---|---|---|
| T-021 | Verificar `npm run build` sem erros | RT-001 | 30min | T-001 a T-020 |
| T-022 | Criar fixture de arquivos de teste para pipeline | RT-002 | 1h | T-003 |
| T-023 | Validar formato de saída do Cartographer contra schema esperado | RT-002 | 30min | T-013, T-022 |
| T-024 | Remover `webapp.tsx` (código obsoleto do bundle) | — | 5min | T-016 |

## Fase 6 — Polimento

| ID | Tarefa | Requisitos | Esforço | Dependências |
|---|---|---|---|---|
| T-025 | Adicionar cache (sessionStorage) dos resultados do pipeline | RP-003 | 30min | T-008 |
| T-026 | Otimizar simulação física para 60 FPS com 30+ nós | RP-001 | 2h | T-010 |
| T-027 | Adicionar loading skeleton na UI do pipeline | RF-003 | 30min | T-006 |
| T-028 | Remover dependências CDN (marked, DOMPurify, mermaid) — bundle local via npm | — | 1h | Nenhuma |

## Milestones

| Marco | Tarefas | Previsão |
|---|---|---|
| M1 — Fundação sólida | T-001 a T-005 | Fim da Semana 1 |
| M2 — Pipeline rodando | T-006 a T-009 | Fim da Semana 2 |
| M3 — Grafo interativo | T-010 a T-015 | Fim da Semana 3 |
| M4 — Produção ready | T-016 a T-028 | Fim da Semana 4 |

## Matriz de Rastreabilidade

| Requisito | Tarefas |
|---|---|
| RF-001 | T-002, T-007 |
| RF-002 | T-002, T-007 |
| RF-003 | T-003, T-004, T-006, T-008, T-009 |
| RF-004 | T-010, T-011, T-012, T-013, T-014 |
| RF-005 | T-009, T-004 |
| RF-006 | — (já existe no código atual) |
| RF-007 | — (já existe no código atual) |
| RF-008 | — (já existe no código atual) |
| RF-009 | T-011 |
| RF-010 | — (já existe no código atual) |
| RS-001 | T-016 |
| RS-002 | T-005 |
| RS-003 | T-017 |
| RS-004 | — (já existe no código atual) |
| RE-001 | — (já existe no código atual) |
| RE-002 | T-018 |
| RE-003 | T-019 |
| RE-004 | T-020 |
| RT-001 | T-021 |
| RT-002 | T-022, T-023 |
| RT-003 | — (já existe no código atual) |
| RP-001 | T-015, T-026 |
| RP-002 | T-025, T-028 |
| RP-003 | T-005 |
