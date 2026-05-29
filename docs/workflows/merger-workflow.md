# Workflow: Blueprint AI Merger

1. **Verificar Status Atual**
   - Ler AGENTS.md para conhecer as regras do projeto
   - Ler Backlog (tasks.md) para identificar próxima tarefa
   - Executar `npm run build` — confirmar build limpo

2. **Executar Tarefa**
   - Seguir a SPEC (design.md) para implementação
   - Manter estilo de código do projeto existente (Tailwind + componentes modulares)
   - Para grafo Canvas: garantir fallback mobile

3. **Autoavaliação** (antes de marcar concluído)
   - `npm run build` sem erros
   - Nenhuma API key hardcoded
   - Pipeline testado com fixture
   - Grafo não quebra com 0, 1 ou 100+ nós

4. **Atualizar Registros**
   - tasks.md: marcar tarefa como concluída
   - CHANGELOG.md: adicionar entrada em [Não Publicado]

5. **Comitar**
   - Commits atômicos por tarefa
   - Prefixo: `feat:` para novas funcionalidades, `refactor:` para refatorações, `fix:` para correções
