# Blueprint AI — Merger

Projeto resultante da fusão entre **Blueprint AI** (gerador de documentação) e **Reversa × Blueprint** (engenharia reversa com grafo de conhecimento).

**Stack:** React 19 + Vite 6 + TypeScript 5.8 + Google GenAI SDK + Lucide React + HTML5 Canvas

## Modos de Operação

| Modo | Entrada | Processamento | Saída |
|---|---|---|---|
| **Documentação** | Descrição textual do projeto | Chamada única IA | Blueprint Markdown com diagramas Mermaid |
| **Engenharia Reversa** | Upload de código-fonte | Pipeline multi-agente (Scout → Archaeologist → Architect → Cartographer) | Análise JSON + Grafo Canvas + Blueprint enriquecido |
| **Híbrido** | Código + descrição | Pipeline → contexto → blueprint | Blueprint completo com rastreabilidade código↔spec |
