# 05_BACKLOG.md

**Baseado em**: 01_BRIEF.md + Arquitetura atual do blueprint-ai
**Data**: 2026-06-16
**Autor**: Lucinei

---

## Definition of Done

- [ ] Código commitado
- [ ] Build passou sem erros (`npm run build`)
- [ ] Teste manual passou
- [ ] Sem erros no console
- [ ] Documentado se necessário

---

## Sprint Backlog

### Fase 1: Refatoração de Base

---

### [ ] TASK-001: Migrar App.tsx de useState para useReducer
**Descrição**: Substituir os 13 `useState` espalhados em `App.tsx` por um `useReducer` com state e actions tipados, centralizando toda a lógica de estado.
**Arquivos**:
- `App.tsx` — refatorar para `useReducer`
- `types.ts` — adicionar `AppState` interface e `AppAction` union type

**Critério de Pronto**:
- Nenhum `useState` restante em `App.tsx` (exceto estado local de UI como `toast`)
- Todas as 13 variáveis de estado migradas para o reducer
- Build sem erros: `npm run build`
- Nenhum comportamento alterado visível ao usuário

**Dependência**: Nenhuma
**Estimativa**: 3h

---

### [ ] TASK-002: Extrair componentes auxiliares inline de ProjectTab.tsx
**Descrição**: Criar componentes `Card`, `InputField` e `TextAreaField` reutilizáveis, extraindo o JSX inline repetido em `ProjectTab.tsx`.
**Arquivos**:
- `components/tabs/ProjectTab.tsx` — refatorar para usar novos componentes
- `components/ui/Card.tsx` — novo componente wrapper
- `components/ui/InputField.tsx` — novo componente de input labelado
- `components/ui/TextAreaField.tsx` — novo componente de textarea labelado

**Critério de Pronto**:
- 3 componentes extraídos e reutilizáveis
- `ProjectTab.tsx` usa os novos componentes em vez de JSX inline
- Sem duplicação de código nos campos de formulário
- Build sem erros: `npm run build`
- Layout visual idêntico ao original

**Dependência**: Nenhuma
**Estimativa**: 2h

---

### Fase 2: Unificação Editor de Contexto

---

### [ ] TASK-003: Criar componente EditorContexto.tsx
**Descrição**: Criar o componente `EditorContexto.tsx` que unifica `ProjectTab` (configurações de projeto + IA) e `ContentTab` (upload de arquivos) em uma única tela de edição de contexto.
**Arquivos**:
- `components/EditorContexto.tsx` — novo componente principal do macro-estado 1
- `components/tabs/ProjectTab.tsx` — será descontinuado (lógica migrada)
- `components/tabs/ContentTab.tsx` — será descontinuado (lógica migrada)

**Critério de Pronto**:
- `EditorContexto.tsx` renderiza: formulário do projeto + textarea de contexto + upload de arquivos + sidebar de config IA
- Dados do formulário são alimentados pelo reducer (via props ou Context)
- Sem erro de build: `npm run build`
- Tudo que existia em ProjectTab + ContentTab funciona no novo componente

**Dependência**: TASK-001, TASK-002
**Estimativa**: 4h

---

### [ ] TASK-004: Implementar sidebar colapsável para configurações de IA
**Descrição**: Criar um painel lateral colapsável dentro de `EditorContexto.tsx` que permite ao usuário selecionar provedor, modelo e ver o status da conexão, sem ocupar espaço permanente na tela.
**Arquivos**:
- `components/EditorContexto.tsx` — integrar sidebar colapsável
- `components/ui/Sidebar.tsx` — novo componente de sidebar colapsável

**Critério de Pronto**:
- Sidebar abre/fecha com animação suave (transition)
- Mostra: seletor de provedor, seletor de modelo, indicador de status
- Em mobile: sidebar abre como overlay/modal
- Persiste estado de aberto/fechado via reducer
- Build sem erros: `npm run build`

**Dependência**: TASK-003
**Estimativa**: 3h

---

### [ ] TASK-005: Adicionar mini-árvore de arquivos visível durante edição
**Descrição**: Exibir uma mini-árvore (tree view) dos arquivos carregados no `EditorContexto`, permitindo ao usuário visualizar a estrutura do contexto sem precisar scrollar a lista completa.
**Arquivos**:
- `components/EditorContexto.tsx` — adicionar mini-árvore
- `components/ui/FileTreeView.tsx` — novo componente de árvore de arquivos

**Critério de Pronto**:
- Árvore mostra hierarquia de arquivos carregados (pastas e arquivos)
- Clique em arquivo navega para ele na lista
- Atualiza em tempo real quando arquivos são adicionados/removidos
- Layout compacto, não mais que 200px de altura
- Build sem erros: `npm run build`

**Dependência**: TASK-003
**Estimativa**: 2h

---

### [ ] TASK-006: Implementar botão "Injetar Estrutura Automatizada" no textarea
**Descrição**: Adicionar um botão dentro do textarea de contexto que, ao clicado, insere automaticamente a estrutura de pastas/arquivos formatada no campo, economizando tempo do usuário.
**Arquivos**:
- `components/EditorContexto.tsx` — adicionar botão no textarea
- `components/ui/AutoInjectButton.tsx` — novo componente

**Critério de Pronto**:
- Botão visível dentro do textarea (posição absoluta, canto superior direito)
- Ao clicar, insere texto formatado com a estrutura de arquivos carregados
- Não sobrescreve texto existente (insere no cursor ou no final)
- Desabilitado quando não há arquivos carregados
- Build sem erros: `npm run build`

**Dependência**: TASK-003, TASK-005
**Estimativa**: 1h

---

### Fase 3: Workspace de Resultado

---

### [ ] TASK-007: Integrar botões de exportação na aba Resultados
**Descrição**: Mover os botões de exportação (Copiar, Baixar .md, JSON) que estavam na `ActionsTab` para dentro da `ResultsTab`, disponibilizando-os diretamente junto ao conteúdo gerado.
**Arquivos**:
- `components/tabs/ResultsTab.tsx` — adicionar barra de exportação
- `components/tabs/ActionsTab.tsx` — será descontinuado (lógica migrada)

**Critério de Pronto**:
- Botões de Copiar, Baixar .md e Baixar JSON visíveis acima do conteúdo gerado
- Copiar coloca o markdown no clipboard e mostra toast de confirmação
- Baixar .md gera arquivo `.md` com o conteúdo
- Baixar JSON gera arquivo `.json` com o conteúdo estruturado
- Funciona para todos os 3 formatos de output
- Build sem erros: `npm run build`

**Dependência**: TASK-001
**Estimativa**: 2h

---

### [ ] TASK-008: Integrar chat de refinamento na aba Resultados
**Descrição**: Mover o chat de refinamento (input + envio de prompt de refinamento) da `ActionsTab` para dentro da `ResultsTab`, permitindo refinamento iterativo direto na tela de resultados.
**Arquivos**:
- `components/tabs/ResultsTab.tsx` — adicionar chat de refinamento
- `components/ui/RefinementChat.tsx` — novo componente de chat de refinamento

**Critério de Pronto**:
- Input de refinamento visível abaixo do conteúdo gerado
- Histórico de refinamentos exibido em cascata
- Enter ou botão envia o refinamento
- Loading state durante processamento do refinamento
- Conteúdo atualizado após refinamento
- Build sem erros: `npm run build`

**Dependência**: TASK-001, TASK-007
**Estimativa**: 3h

---

### [ ] TASK-009: Remover aba ActionsTab
**Descrição**: Excluir o componente `ActionsTab.tsx` e toda a referência a ele, já que toda sua funcionalidade foi migrada para `ResultsTab`.
**Arquivos**:
- `components/tabs/ActionsTab.tsx` — deletar arquivo
- `App.tsx` — remover import e renderização de `ActionsTab`

**Critério de Pronto**:
- Arquivo `ActionsTab.tsx` deletado
- Nenhuma referência restante a `ActionsTab` em nenhum arquivo
- Nenhum `useState` ou reducer key associado à aba `acoes`
- Build sem erros: `npm run build`

**Dependência**: TASK-007, TASK-008
**Estimativa**: 0.5h

---

### Fase 4: Navegação

---

### [ ] TASK-010: Criar componente Sidebar global de navegação entre macro-estados
**Descrição**: Criar um componente `Sidebar` de navegação permanente à esquerda que permite alternar entre os 3 macro-estados (Editor de Contexto, Processamento, Workspace de Resultado).
**Arquivos**:
- `components/Sidebar.tsx` — novo componente principal de navegação
- `App.tsx` — integrar Sidebar e gerenciar macro-estado ativo

**Critério de Pronto**:
- Sidebar visível na lateral esquerda (desktop) e como hamburger (mobile)
- 3 itens de navegação: Editor de Contexto, Processamento, Workspace de Resultado
- Item ativo destacado visualmente
- Indicador de progresso (checkmark nos concluídos)
- Navegação atualiza o reducer (macro-estado ativo)
- Build sem erros: `npm run build`

**Dependência**: TASK-001, TASK-003, TASK-007
**Estimativa**: 3h

---

### [ ] TASK-011: Atualizar tipo Tab de 5 para 3 valores
**Descrição**: Atualizar o tipo `Tab` em `types.ts` para refletir os 3 novos macro-estados e atualizar todas as referências.
**Arquivos**:
- `types.ts` — atualizar tipo `Tab` e tipos dependentes
- `App.tsx` — atualizar referências ao tipo `Tab`

**Critério de Pronto**:
- Tipo `Tab` definido como: `'editor-contexto' | 'processamento' | 'workspace-resultado'`
- Nenhuma referência restante aos valores antigos (`projeto`, `conteudo`, `acoes`, `resultados`, `analisar`)
- Build sem erros: `npm run build`
- TypeScript sem erros de tipo

**Dependência**: TASK-001, TASK-003, TASK-007
**Estimativa**: 1h

---

### [ ] TASK-012: Remover DesktopTabs e MobileTabs antigos
**Descrição**: Deletar os componentes `DesktopTabs.tsx` e `MobileTabs.tsx` que não são mais necessários com a nova sidebar de navegação.
**Arquivos**:
- `components/DesktopTabs.tsx` — deletar arquivo
- `components/MobileTabs.tsx` — deletar arquivo
- `App.tsx` — remover imports e renderização dos tabs antigos

**Critério de Pronto**:
- Arquivos `DesktopTabs.tsx` e `MobileTabs.tsx` deletados
- Nenhuma referência restante em nenhum arquivo
- Build sem erros: `npm run build`

**Dependência**: TASK-010, TASK-011
**Estimativa**: 0.5h

---

### Fase 5: Melhorias

---

### [ ] TASK-013: Decompor KnowledgeGraph.tsx em hooks menores
**Descrição**: Extrair a lógica de `KnowledgeGraph.tsx` (626 linhas) em hooks customizados menores: `useGraphSimulation`, `useGraphZoom`, `useGraphDrag`.
**Arquivos**:
- `components/KnowledgeGraph.tsx` — refatorar usando hooks
- `hooks/useGraphSimulation.ts` — novo hook (simulação D3)
- `hooks/useGraphZoom.ts` — novo hook (zoom/pan)
- `hooks/useGraphDrag.ts` — novo hook (drag de nós)

**Critério de Pronto**:
- `KnowledgeGraph.tsx` reduzido para menos de 200 linhas
- 3 hooks extraídos com responsabilidade única
- Sem alteração visual ou comportamental
- Build sem erros: `npm run build`

**Dependência**: Nenhuma
**Estimativa**: 3h

---

### [ ] TASK-014: Externalizar templates de prompts.ts para arquivos .md
**Descrição**: Mover os templates de system instruction do `services/prompts.ts` para arquivos `.md` separados, facilitando manutenção e版本amento independente.
**Arquivos**:
- `services/prompts.ts` — refatorar para carregar de arquivos externos
- `prompts/doc-system.md` — novo arquivo (template de documentação)
- `prompts/refinement-system.md` — novo arquivo (template de refinamento)
- `services/geminiService.ts` — atualizar imports se necessário

**Critério de Pronto**:
- Templates migrados para arquivos `.md`
- `prompts.ts` carrega templates via fetch ou import estático
- Nenhuma alteração no output final dos prompts
- Build sem erros: `npm run build`

**Dependência**: Nenhuma
**Estimativa**: 1.5h

---

### [ ] TASK-015: Adicionar tooltip dinâmico no botão de processamento
**Descrição**: Implementar um tooltip que aparece ao passar o mouse no botão de processamento, mostrando dinamicamente o que falta para habilitar o processamento (ex: "Faltou definir o nome do projeto", "Nenhum arquivo carregado").
**Arquivos**:
- `components/EditorContexto.tsx` — adicionar tooltip no botão de processamento
- `components/ui/Tooltip.tsx` — novo componente de tooltip

**Critério de Pronto**:
- Tooltip aparece ao hover no botão de processamento
- Lista dinamicamente os campos obrigatórios que faltam
- Desaparece quando todos os campos estão preenchidos
- Botão desabilitado quando há campos faltando
- Build sem erros: `npm run build`

**Dependência**: TASK-003
**Estimativa**: 2h

---

## Resumo Estimativas

| Fase | Tarefas | Estimativa Total |
|------|---------|------------------|
| Fase 1: Refatoração de Base | TASK-001, TASK-002 | 5h |
| Fase 2: Editor de Contexto | TASK-003, TASK-004, TASK-005, TASK-006 | 10h |
| Fase 3: Workspace de Resultado | TASK-007, TASK-008, TASK-009 | 5.5h |
| Fase 4: Navegação | TASK-010, TASK-011, TASK-012 | 4.5h |
| Fase 5: Melhorias | TASK-013, TASK-014, TASK-015 | 6.5h |
| **Total** | **15 tarefas** | **~32h** |

---

## Bugs / Melhorias

- [ ] BUG: `KnowledgeGraph.tsx` com 626 linhas — precisa decomposição (TASK-013)
- [ ] MELHORIA: Prompts hardcoded em `prompts.ts` — externalizar para `.md` (TASK-014)
- [ ] MELHORIA: Tooltip dinâmico no botão de processamento (TASK-015)

---

## Notas

- **Ordem de execução respeitada**: Fase 1 → 2 → 3 → 4 → 5, pois fases dependem da anterior.
- **TASK-009 e TASK-012**: São deletions — devem ser feitas **depois** das migrações para evitar quebra.
- **Responsividade**: Todas as tasks devem manter os breakpoints mobile existentes.
- **Provedores de IA**: Nenhuma task altera a lógica de integração com provedores — apenas UI.
- **Build crítico**: Cada task deve ser validada com `npm run build` antes de passar para a próxima.
