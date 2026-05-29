# AGENTS — Blueprint AI Merger

## Regras do Projeto

1. **Stack fixa**: React 19 + Vite 6 + TypeScript 5.8. Não adicionar frameworks externos (Next, Remix) sem aprovação explícita.

2. **API IA sempre via Provider**: Toda chamada de IA deve usar `services/aiProvider.ts`. Proibido `fetch` direto para APIs de terceiros.

3. **Componentes puros**: Componentes de UI não devem depender de estado global. Props in, eventos out.

4. **Grafo é opcional**: O Canvas do grafo só renderiza se `nodes.length > 0`. Nunca quebrar a UI se o grafo estiver vazio.

5. **Pipeline é extensível**: Adicionar etapas ao pipeline requer apenas criar system prompt + adicionar ao array ANALYSIS_STEPS. A UI de progresso deve refletir automaticamente.

## Convenções de Código

| Convenção | Regra |
|---|---|
| **Naming** | Arquivos: `PascalCase.tsx` para componentes, `camelCase.ts` para services |
| **Imports** | Primeiro React/hooks, depois componentes, depois services, depois types |
| **CSS** | Tailwind utility classes. Proibido CSS modules ou styled-components |
| **Estado** | `useState` para estado local, props drilling limitado a 3 níveis. Acima disso, usar context |
| **Erros** | `try/catch` em toda função async. Erros de IA vão para toast + estado de erro no componente |

## Quality Gates

1. `npm run build` deve passar sem erros
2. Pipeline com arquivos de fixture não deve lançar exceções
3. Grafo com 1 nó ou 100 nós não deve quebrar o Canvas
4. Nenhuma API key hardcoded

## Ciclo de Vida do Agente

1. Ler AGENTS.md → conhecer regras
2. Consultar Backlog (tasks.md) → identificar próxima tarefa
3. Implementar seguindo SPEC.md (design.md)
4. Validar: `npm run build` + verificar requisitos associados na matriz de rastreabilidade
5. Atualizar CHANGELOG.md
6. Confirmar com usuário antes de comitar
