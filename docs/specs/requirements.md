# PRD — Blueprint AI Merger

## Propósito

Unificar dois codebases complementares em uma única aplicação que suporta:
geração de documentação a partir de descrição textual (Blueprint AI existente) e
engenharia reversa com pipeline multi-agente e grafo interativo (Reversa × Blueprint).

---

## Perspectivas

### 1. Funcionalidade

| ID | Tipo EARS | Descrição | Critério de Aceitação |
|---|---|---|---|
| RF-001 | Ubíquo | THE sistema SHALL permitir upload de arquivos de código-fonte (.ts, .tsx, .js, .jsx, .py, .json, .md, .css, .html) | WHEN o usuário seleciona arquivos, THEN o sistema SHALL exibir a árvore de diretórios inferida E o conteúdo textual extraído em no máximo 2s |
| RF-002 | Ubíquo | THE sistema SHALL oferecer dois modos de geração: "Documentação" (descrição → blueprint) E "Análise" (código → pipeline → blueprint) | WHEN o usuário alterna entre modos, THEN os campos e botões da UI SHALL refletir o modo ativo |
| RF-003 | Ubíquo | THE sistema SHALL executar pipeline multi-agente em 4 etapas sequenciais (Scout → Archaeologist → Architect → Cartographer) | WHEN o pipeline inicia, THEN cada etapa SHALL exibir status (processando/concluído/erro) EM tempo real |
| RF-004 | Evento | WHEN o pipeline completa a etapa Cartographer, THEN o sistema SHALL renderizar um grafo de conhecimento interativo em Canvas | O grafo SHALL conter nós (file|entity|endpoint|tech) E arestas (imports|defines|calls|consumes) com simulação física |
| RF-005 | Ubíquo | THE sistema SHALL gerar blueprint Markdown com 9 seções obrigatórias (Especificação Técnica, Requisitos, Plano de Execução, etc) | O blueprint SHALL incluir diagramas Mermaid C4 (Nível 1 e 2) E ERD com cardinalidades |
| RF-006 | Evento | WHEN o usuário solicita refinamento do blueprint, THEN o sistema SHALL aplicar a edição solicitada via IA mantendo a estrutura de cabeçalhos original | O refinamento SHALL preservar 100% dos cabeçalhos ## e ### do documento original |
| RF-007 | Ubíquo | THE sistema SHALL exportar o bundle completo em JSON contendo metadados, arquivos fonte, resultados do pipeline, grafo e blueprint final | O JSON SHALL conter todas as 5 seções (project_metadata, source_files, analysis_results, knowledge_graph, final_blueprint) |
| RF-008 | Ubíquo | THE sistema SHALL exportar o blueprint como arquivo .md com formatação Markdown | O arquivo .md SHALL conter o blueprint renderizável em qualquer visualizador Markdown |
| RF-009 | Evento | WHEN o usuário clica em um nó do grafo, THEN o sistema SHALL exibir detalhes do nó (id, label, tipo, conexões) em sidebar | A sidebar SHALL mostrar ao menos 3 propriedades do nó selecionado |
| RF-010 | Ubíquo | THE sistema SHALL suportar 3 provedores de IA: Google Gemini, OpenAI e OpenRouter | O usuário SHALL poder selecionar o provedor E o modelo em dropdown na aba Projeto |

### 2. Segurança

| ID | Tipo EARS | Descrição | Critério de Aceitação |
|---|---|---|---|
| RS-001 | Ubíquo | THE sistema SHALL ler chaves de API exclusivamente de variáveis de ambiente (.env.local) | WHEN o sistema faz chamadas externas, THEN as chaves NUNCA SHALL estar hardcoded no código-fonte |
| RS-002 | Evento | IF uma chamada à API retorna erro 429 (rate limit), THEN o sistema SHALL aplicar retry exponencial com até 5 tentativas | O intervalo entre tentativas SHALL ser 2^i segundos (2, 4, 8, 16, 32) |
| RS-003 | Estado | WHILE o provedor selecionado não tem API key configurada, THEN o sistema SHALL exibir indicador "(sem API key)" ao lado do nome do provedor | O indicador SHALL aparecer no dropdown de seleção de provedor |
| RS-004 | Evento | WHEN a requisição ao provedor falha com erro de rede ou timeout, THEN o sistema SHALL exibir toast de erro E o blueprint SHALL conter seção de erro com detalhes técnicos | O toast SHALL exibir "Erro ao gerar documentação" E o blueprint SHALL incluir mensagem original do erro |

### 3. Erros

| ID | Tipo EARS | Descrição | Critério de Aceitação |
|---|---|---|---|
| RE-001 | Estados Indesejados | IF o usuário tenta gerar sem descrição do projeto, THEN o sistema SHALL exibir toast de erro E impedir a chamada | O toast SHALL conter "A descrição de alto nível do projeto é obrigatória" |
| RE-002 | Estados Indesejados | IF o pipeline falha em uma etapa intermediária, THEN o sistema SHALL interromper as etapas seguintes E exibir o erro parcial acumulado até o momento | O usuário SHALL poder visualizar os resultados das etapas concluídas antes da falha |
| RE-003 | Estados Indesejados | IF o arquivo enviado excede 5MB, THEN o sistema SHALL rejeitar o arquivo E exibir toast de erro | O toast SHALL informar o nome do arquivo E o limite excedido |
| RE-004 | Estados Indesejados | IF a análise resulta em grafo vazio (0 nós), THEN o sistema SHALL exibir mensagem informativa EM vez de canvas vazio | A mensagem SHALL sugerir verificar se os arquivos contêm código-fonte válido |

### 4. Testabilidade

| ID | Tipo EARS | Descrição | Critério de Aceitação |
|---|---|---|---|
| RT-001 | Ubíquo | THE sistema SHALL executar `npm run build` sem erros de tipo ou sintaxe | O build SHALL emitir exit code 0 |
| RT-002 | Evento | WHEN o pipeline é executado com arquivos de fixture conhecidos, THEN o formato dos resultados SHALL ser previsível e validável | O JSON de saída do Cartographer SHALL conter os campos obrigatórios: nodes[].{id,label,type} E links[].{source,target,type} |
| RT-003 | Estado | WHILE existe um blueprint gerado, THEN o sistema SHALL permitir copiar o conteúdo com 1 clique | O botão de cópia SHALL estar visível em ResultsTab e ActionsTab |

### 5. Performance

| ID | Tipo EARS | Descrição | Critério de Aceitação |
|---|---|---|---|
| RP-001 | Ubíquo | THE simulação física do grafo SHALL executar a 60 FPS em hardware médio (CPU 4 cores, 8GB RAM) | O `requestAnimationFrame` SHALL produzir no mínimo 55 frames em 1 segundo com até 30 nós |
| RP-002 | Ubíquo | THE carregamento inicial da aplicação SHALL ocorrer em até 3 segundos em conexão de banda larga (10 Mbps) | O bundle JS inicial SHALL ser inferior a 500KB (gzip) |
| RP-003 | Evento | WHEN o pipeline executa 4 chamadas consecutivas de IA, THEN cada chamada SHALL ter timeout de 60 segundos | O sistema SHALL abortar chamadas individuais que excedam 60s sem resposta |
