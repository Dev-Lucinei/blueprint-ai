# 📘 Documentação Técnica — Blueprint AI

Esta documentação fornece uma visão detalhada da implementação técnica do Blueprint AI, cobrindo a arquitetura, a integração com IA, o motor de pipeline e a renderização do grafo de conhecimento.

---

## 🏗️ Arquitetura do Sistema

O Blueprint AI é construído como uma **Single Page Application (SPA)** utilizando **React 19** e **Vite 6**, focada em processamento client-side para máxima privacidade e performance.

### Camadas de Abstração
1. **UI Layer (React)**: Gerencia o estado da interface, navegação por abas e interação com o usuário.
2. **Pipeline Engine**: Orquestra a sequência de chamadas de IA, acumulando contexto entre as etapas.
3. **AI Provider Layer**: Abstrai a comunicação com diferentes LLMs (Gemini, OpenAI, OpenRouter), normalizando requests e responses.
4. **Graph Engine**: Implementação customizada de visualização de redes utilizando HTML5 Canvas.

---

## 🤖 Integração com IA (`aiProvider.ts`)

A camada de provedores permite a troca transparente de modelos de IA sem impactar a lógica de negócio.

### Fluxo de Requisição
Toda chamada de IA passa pelo `aiClient.generate()`, que:
1. Resolve a chave de API via variáveis de ambiente (`VITE_..._API_KEY`).
2. Aplica a configuração de modelo e hiperparâmetros (temperatura, max tokens).
3. Envolve a execução em um wrapper de **Retry Exponencial**.

### Resiliência e Performance
- **Retry Logic**: Implementa `withRetry` com backoff exponencial. Erros `429 (Rate Limit)` disparam tentativas mais persistentes (até 5x), enquanto outros erros são limitados.
- **Timeouts**: Todas as requisições possuem um timeout rigoroso de **60 segundos** para evitar requisições pendentes infinitas.
- **Normalização**: Independente do provedor, o sistema sempre recebe um objeto `AIResponse { text: string, usage?: ... }`.

---

## ⚙️ Motor de Pipeline (`pipelineService.ts`)

O diferencial do Blueprint AI é o seu pipeline multi-agente, que transforma código bruto em documentação estruturada através de **Chain-of-Thought (CoT)**.

### Etapas do Pipeline
O processo é sequencial e cada etapa utiliza o resultado da anterior:

1. **Scout**: Analisa a estrutura global do projeto, identifica as principais tecnologias e a organização dos arquivos.
2. **Archaeologist**: Mergulha nos arquivos para extrair a lógica de negócio, fluxos de dados e dependências críticas.
3. **Architect**: Sintetiza as descobertas em uma estrutura de arquitetura, definindo componentes e interações.
4. **Cartographer**: Traduz a arquitetura em um formato de dados estruturado (JSON) contendo nós e links para o grafo de conhecimento.

### Acumulação de Contexto
O prompt enviado para a etapa $N$ é composto por:
`Contexto Original (Descrição + Código)` $\rightarrow$ `Análise do Scout` $\rightarrow$ `Análise do Archaeologist` $\rightarrow \dots$

Isso garante que a etapa final (Cartographer) tenha total consciência de todas as descobertas feitas nas etapas anteriores.

---

## 🕸️ Grafo de Conhecimento (`KnowledgeGraph.tsx`)

O grafo é renderizado via **HTML5 Canvas** para suportar centenas de nós com alta performance (60 FPS).

### Simulação Física (Force-Directed Graph)
A posição dos nós é calculada dinamicamente através de três forças:
- **Repulsão (Lei de Coulomb)**: Nós se repelem para evitar sobreposição.
- **Atração (Lei de Hooke)**: Links agem como molas, puxando nós conectados para perto.
- **Gravidade**: Uma força central suave que impede que nós isolados flutuem para fora da tela.

**Equação de Estabilidade**:
O sistema aplica um fator de **Damping (0.85)** a cada frame para dissipar a energia cinética e estabilizar o grafo em um estado de equilíbrio.

### Interatividade
- **Panning & Zoom**: Manipulação da câmera via mouse/wheel.
- **Node Dragging**: Ao arrastar um nó, sua posição é fixada (`fx`, `fy`), suspendendo a simulação física para aquele nó específico.
- **Mobile Fallback**: Em dispositivos touch, o sistema substitui o Canvas por uma lista hierárquica expansível para garantir usabilidade.

---

## 🛠️ Guia de Desenvolvimento

### Adicionando um Novo Provedor de IA
1. Adicionar o provedor ao tipo `AIProvider` em `types.ts`.
2. Implementar a função `generateWith[Provider]` em `aiProvider.ts`.
3. Atualizar o `switch` no `aiClient.generate`.
4. Adicionar a variável de ambiente correspondente no `.env.local`.

### Gerenciamento de Prompts (`services/prompts.ts`)
A lógica de prompts foi centralizada em `services/prompts.ts` para facilitar a manutenção e versionamento:
- **Templates**: Todos os prompts de sistema (Scout, Archaeologist, etc.) são definidos como funções exportadas.
- **Extensões**: Foram implementadas funções de aprimoramento (`enhanceWithEARS` e `enhanceWithTraceability`) para injetar metodologias rigorosas de engenharia de requisitos automaticamente.
- **Dynamic Prompts**: O blueprint de documentação utiliza templates dinâmicos para datas e contexto do usuário.

### Adicionando uma Etapa ao Pipeline
1. Definir o system prompt no `services/prompts.ts`.
2. Adicionar a definição da etapa ao array `STEPS` em `pipelineService.ts`.
3. A UI de `PipelineProgress` atualizará automaticamente a barra de progresso.

---

## 📦 Build e Deploy

O projeto utiliza **Vite** para bundling.
- **Build**: `npm run build` gera a pasta `dist/` com arquivos otimizados.
- **Variáveis de Ambiente**: Devem ser prefixadas com `VITE_` para serem expostas ao client-side.
