# 02_PRD.md

**Baseado em**: 01_BRIEF.md
**Data**: 2026-06-16
**Autor**: Lucinei

---

## 1. User Stories

### Macro-Estado 1: Editor de Contexto

#### US-001: Configuração de IA em Sidebar
**História**: Como desenvolvedor quero configurar o provedor e modelo de IA em um painel lateral fixo para não precisar navegar entre abas antes de gerar.

**Critérios de Aceite**:
1. Given o usuário está na tela inicial When abre a sidebar de configuração Then os campos provedor e modelo estão visíveis com os 4 provedores (Gemini, OpenAI, OpenRouter, Ollama)
2. Given o provedor selecionado não tem API key configurada When o dropdown é renderizado Then o indicador "(sem API key)" aparece ao lado do nome
3. Given o usuário seleciona um provedor When o modelo é atualizado Then o modelo padrão do provedor é selecionado automaticamente

#### US-002: Formulário de Projeto Unificado
**História**: Como gestor de conteúdo quero preencher nome, prazo e descrição do projeto em uma única tela para configurar tudo em um fluxo contínuo.

**Critérios de Aceite**:
1. Given o usuário está no Editor de Contexto When preenche o campo "Nome do Projeto" Then o valor é refletido imediatamente no estado da aplicação
2. Given o usuário não preencheu a descrição When clica em "Gerar Documentação" Then um toast de erro é exibido com a mensagem "A descrição de alto nível do projeto é obrigatória"
3. Given o usuário preenche nome, prazo e descrição When revisa os campos Then todos os 3 campos estão visíveis sem rolagem adicional na viewport padrão

#### US-003: Upload de Arquivos Integrado
**História**: Como desenvolvedor quero anexar arquivos de código-fonte diretamente na mesma tela de configuração para não perder contexto entre abas.

**Critérios de Aceite**:
1. Given o usuário está no Editor de Contexto When seleciona arquivos Then o sistema aceita no máximo 10 arquivos com até 100MB cada
2. Given o usuário seleciona arquivos de texto (.ts, .tsx, .js, .jsx, .py, .json, .md, .css, .html) When o upload é concluído Then o conteúdo textual é extraído e disponibilizado como contexto
3. Given o usuário seleciona um arquivo comprimido (.zip, .tar, .gz, .rar, .7z) When o upload é concluído Then o arquivo é anexado com mensagem "Arquivo Compactado - Anexado com sucesso"
4. Given o usuário anexou arquivos When remove um arquivo Then o arquivo é removido da lista e o contador é atualizado

#### US-004: Campo de Contexto Adicional
**História**: Como gestor de conteúdo quero adicionar texto livre com especificações e requisitos para enriquecer o contexto da geração.

**Critérios de Aceite**:
1. Given o usuário está no Editor de Contexto When preenche o campo de contexto adicional Then o texto é armazenado e incluído no prompt final de geração
2. Given o usuário digitou contexto adicional When gera a documentação Then o texto aparece na seção "CONTEXTO ADICIONAL" do prompt enviado à IA

---

### Macro-Estado 2: Processamento

#### US-005: Transição Automática para Processamento
**História**: Como desenvolvedor quero que ao clicar "Gerar" o sistema transicione automaticamente para a tela de processamento para visualizar o progresso.

**Critérios de Aceite**:
1. Given o usuário preencheu descrição e configuração When clica em "Gerar Documentação" Then a UI transiciona para o macro-estado Processamento sem interação adicional
2. Given a transição foi iniciada When a tela de processamento é exibida Then um indicador de carregamento com mensagem "Gerando seu Blueprint..." está visível

#### US-006: Pipeline de Agentes com Progresso
**História**: Como desenvolvedor quero visualizar o progresso do pipeline de 4 agentes (Scout → Archaeologist → Architect → Cartographer) para acompanhar a geração.

**Critérios de Aceite**:
1. Given o pipeline foi iniciado When cada etapa é executada Then o status (processando/concluído/erro) é atualizado em tempo real na UI de progresso
2. Given uma etapa do pipeline foi concluída When a próxima etapa inicia Then a etapa anterior mostra ícone de conclusão e a atual mostra animação de processamento
3. Given o pipeline completa a etapa Cartographer When o grafo é gerado Then o sistema renderiza o grafo de conhecimento interativo em Canvas
4. Given o pipeline falha em uma etapa intermediária When o erro é detectado Then o sistema interrompe as etapas seguintes e exibe o erro parcial com resultados das etapas concluídas

#### US-007: Controle de Pipeline (Iniciar/Parar)
**História**: Como desenvolvedor quero poder iniciar e interromper o pipeline manualmente para controlar o processamento.

**Critérios de Aceite**:
1. Given o pipeline não está rodando When o usuário clica "Iniciar Análise" Then o pipeline inicia com os arquivos e descrição configurados
2. Given o pipeline está em execução When o usuário clica "Parar" Then o pipeline é abortado imediatamente via AbortController
3. Given o pipeline não tem descrição ou arquivos When o usuário visualiza o botão "Iniciar Análise" Then o botão está desabilitado com mensagem auxiliar

---

### Macro-Estado 3: Workspace de Resultado

#### US-008: Visualização do Blueprint
**História**: Como gestor de conteúdo quero visualizar o blueprint gerado em formato formatado, raw markdown e grafo interativo para avaliar o resultado.

**Critérios de Aceite**:
1. Given o blueprint foi gerado When o usuário acessa o Workspace de Resultado Then o blueprint é exibido em formato renderizado (markdown → HTML) com sumário lateral
2. Given o blueprint está sendo exibido When o usuário clica em "Markdown Raw" Then o conteúdo bruto é exibido em textarea monospace somente leitura
3. Given o grafo de conhecimento tem nós When o usuário clica na aba "Grafo" Then o canvas de grafo é exibido com simulação física e sidebar de detalhes
4. Given o blueprint está vazio When o usuário acessa o Workspace Then uma mensagem "Nenhum Resultado Disponível" é exibida com instrução para preencher o Editor de Contexto

#### US-009: Refinamento via IA Integrado
**História**: como desenvolvedor quero refinhar o blueprint gerado com instruções de linguagem natural sem sair da tela de resultados.

**Critérios de Aceite**:
1. Given o blueprint foi gerado When o usuário digita uma instrução de refinamento e clica "Aplicar Refinamento" Then a IA processa a solicitação e atualiza o blueprint mantendo a estrutura de cabeçalhos
2. Given um refinamento está em andamento When o processamento está ativo Then o botão "Aplicar Refinamento" mostra "Aplicando..." e está desabilitado
3. Given o refinamento é bem-sucedido When a resposta chega Then um toast "Refinamento aplicado com sucesso!" é exibido

#### US-010: Exportação e Cópia
**História**: como gestor de conteúdo quero copiar o blueprint para a área de transferência ou baixar como arquivo .md para uso externo.

**Critérios de Aceite**:
1. Given o blueprint existe When o usuário clica "Copiar Blueprint" Then o conteúdo markdown é copiado para a área de transferência e toast de confirmação é exibido
2. Given o blueprint existe When o usuário clica "Baixar .md" Then um arquivo `blueprint-{nome-do-projeto}.md` é baixado via link temporário
3. Given o blueprint existe When o usuário clica "Exportar Bundle JSON" Then um JSON com project_metadata, source_files, analysis_results, knowledge_graph e final_blueprint é gerado e baixado

#### US-011: Validação de Links
**História**: como desenvolvedor quero que os links presentes no blueprint sejam validados automaticamente para garantir que referências externas estão corretas.

**Critérios de Aceite**:
1. Given o blueprint contém URLs When a validação é executada Then cada link recebe status (verificando/OK/erro) em tempo real
2. Given um link retorna erro When a validação completa Then o status exibe o código HTTP e mensagem descritiva

#### US-012: Sumário e Navegação
**História**: como gestor de conteúdo quero navegar pelo blueprint via sumário lateral para pular entre seções rapidamente.

**Critérios de Aceite**:
1. Given o blueprint está em visualização formatada When o conteúdo é renderizado Then um sumário lateral é gerado automaticamente a partir dos cabeçalhos h1, h2, h3
2. Given o sumário é exibido When o usuário clica em um item Then a viewport faz scroll suave até a seção correspondente
3. Given o scroll está ativo When uma seção entra na viewport Then o item correspondente no sumário é destacado como ativo

#### US-013: Grafo de Conhecimento Interativo
**História**: como desenvolvedor quero visualizar e interagir com o grafo de conhecimento extraído do pipeline para explorar relações entre componentes.

**Critérios de Aceite**:
1. Given o Cartographer gerou nós e arestas When o grafo é renderizado Then os nós são exibidos com tipos visuais distintos (file, entity, endpoint, tech) e arestas coloridas por tipo
2. Given o grafo está renderizado When o usuário clica em um nó Then uma sidebar exibe detalhes (id, label, tipo, conexões) com ao menos 3 propriedades
3. Given o grafo está renderizado When o usuário usa os controles Then zoom in, zoom out, centralizar, resetar e fullscreen estão funcionais
4. Given o grafo está vazio (0 nós) When a aba Grafo é acessada Then uma mensagem informativa sugere verificar se os arquivos contêm código-fonte válido

---

## 2. Requisitos Não Funcionais

### Performance

- **RNF-001**: O bundle JS inicial SHALL ser inferior a 500KB (gzip) para carregamento em até 3 segundos em banda larga (10 Mbps).
- **RNF-002**: A simulação física do grafo SHALL executar a 60 FPS em hardware médio (CPU 4 cores, 8GB RAM) com até 30 nós.
- **RNF-003**: Cada chamada individual de IA no pipeline SHALL ter timeout de 60 segundos, com abort automático via AbortController.
- **RNF-004**: A transição entre macro-estados SHALL ocorrer em até 200ms sem tela de carregamento intermédia.
- **RNF-005**: O upload e leitura de arquivos de até 100MB SHALL ser concluído em até 5 segundos em hardware padrão.

### UX

- **RNF-006**: O número total de cliques para configurar e gerar um projeto simples (nome + descrição + gerar) SHALL ser no máximo 4 (digitar nome, digitar descrição, clicar gerar, ver resultado).
- **RNF-007**: A interface SHALL ser responsiva em breakpoints mobile (sm: 640px, md: 768px, lg: 1024px, xl: 1280px) preservando a usabilidade em telas de até 320px.
- **RNF-008**: Toasts de sucesso, erro e info SHALL auto-dismiss em 3 segundos com opção de fechamento manual.
- **RNF-009**: O indicador de carregamento durante geração SHALL exibir mensagem descritiva e animação visual contínua (spinner ou skeleton).
- **RNF-010**: Todos os campos de formulário SHALL ter rótulos visíveis e textos de ajuda (helpText) abaixo de cada campo.
- **RNF-011**: O modo escuro SHALL ser o único tema suportado (sem toggle light/dark) conforme design atual.

### Segurança

- **RNF-012**: Chaves de API SHALL ser lidas exclusivamente de variáveis de ambiente (.env.local) — proibido hardcode.
- **RNF-013**: O sistema SHALL aplicar retry exponencial (até 5 tentativas, intervalo 2^i segundos) quando a API retornar erro 429 (rate limit).
- **RNF-014**: Conteúdo markdown renderizado SHALL ser sanitizado via DOMPurify antes de inserção no DOM.

### Compatibilidade

- **RNF-015**: A aplicação SHALL funcionar nos navegadores: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+.
- **RNF-016**: A aplicação SHALL manter compatibilidade total com os 4 provedores de IA existentes (Gemini, OpenAI, OpenRouter, Ollama) sem alteração no `services/aiProvider.ts`.

---

## 3. Métricas v1

| Métrica | Alvo | Ferramenta de Medição |
|---------|------|----------------------|
| Redução de cliques para setup | ≥ 40% menos cliques que 5 abas (contagem manual: ~12 → ~7) | Análise heurística + contagem de interações |
| Tempo médio de setup até primeiro resultado | < 2 minutos para projeto simples (nome + descrição + gerar) | Cronômetro manual em testes de usabilidade |
| Bundle JS gzip | < 500KB | `npm run build` + análise via `vite-bundle-visualizer` |
| FPS do grafo com 30 nós | ≥ 55 FPS | `requestAnimationFrame` benchmark em hardware médio |
| Build sem erros de tipo | Exit code 0 em `npm run build` | CI/CD pipeline (GitHub Actions) |
| Cobertura de componentes | 100% dos novos componentes sem erros de TypeScript strict | `tsc --noEmit` |
| Compatibilidade de provedores | 4/4 provedores funcionais sem regressão | Teste manual com cada provedor |
| Tempo de transição entre macro-estados | < 200ms | Performance API (`performance.now()`) |
| Uptime da aplicação | 0 erros de runtime em uso normal | Console limpo em testes manuais |
