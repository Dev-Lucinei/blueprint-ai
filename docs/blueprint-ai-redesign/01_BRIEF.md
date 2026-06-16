# 01_BRIEF.md

**Projeto**: blueprint-ai
**Data**: 2026-06-16
**Autor**: Lucinei

---

## 1. Problema

A interface atual força o usuário a alternar entre 5 abas sequenciais para configurar um projeto, separando a definição do contexto (Projeto + Conteúdo) e isolando botões de refinamento e exportação em uma aba distinta dos resultados. Essa fragmentação gera cliques desnecessários, perda de contexto e um fluxo de trabalho entrecortado para uma tarefa que deveria ser contínua.

## 2. Usuário-alvo

Desenvolvedor ou gestor de conteúdo que utiliza IA generativa para prototipar, refinar e exportar documentos técnicos ou estratégicos, demandando um fluxo rápido de iteração sem trocar de contexto.

## 3. Objetivo

Unificar a experiência de configuração, processamento e resultado em 3 macro-estados claros, eliminando a necessidade de navegação entre abas para preparar e consumir o output do pipeline de agentes.

## 4. Sucesso v1

- Redução de pelo menos 40% no número de cliques necessários para configurar e gerar um projeto completo.
- Tempo médio de setup (do início ao primeiro resultado) inferior a 2 minutos para um projeto simples.
- Nenhuma quebra de funcionalidade nos 4 provedores de IA (Gemini, OpenAI, OpenRouter, Ollama).

## 5. Fora do Escopo v1

- Implementação de novos tipos de output (ex: apresentações, planilhas).
- Colaboração em tempo real entre múltiplos usuários.
- Sistema de templates pré-definidos para projetos.
- Automação agendada de geração de conteúdo.
- Redesign visual completo (mudanças de layout apenas).

## 6. Restrições

- Stack atual: React 19 + Vite 6 + TypeScript 5.8 + Tailwind CSS — não trocar framework.
- Manter compatibilidade total com os 4 provedores de IA já integrados (Google GenAI, OpenAI, OpenRouter, Ollama).
- Não quebrar o pipeline de agentes existente — refatoração da UI apenas.
- Manter responsividade mobile (breakpoints atuais preservados).
- Entregar em 1 sprint (estimativa: 1-2 semanas).
