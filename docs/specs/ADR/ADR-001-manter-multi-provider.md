# ADR-001: Manter Multi-Provider no Pipeline

## Status

Aceito

## Contexto

O bundle "Reversa × Blueprint" faz chamadas diretas via `fetch` para a Gemini API
com modelo hardcoded `gemini-2.5-flash-preview-09-2025`. O projeto atual "Blueprint AI"
usa o SDK `@google/genai` e suporta 3 provedores (Gemini, OpenAI, OpenRouter).

Ao fundir os dois, o pipeline multi-agente precisa decidir qual abordagem usar.

## Decisão

Usar a abstração `aiProvider.ts` do projeto atual para todas as chamadas do pipeline,
em vez do `fetch` direto do bundle.

## Consequências

**Positivas:**
- Pipeline funciona com qualquer provedor, não só Gemini
- Código mais limpo e testável (interface `generate(prompt, config, options)`)
- Retry logic pode ser adicionada centralizadamente no provider
- Reuso do sistema de env vars existente

**Negativas:**
- Pipeline precisa ser compatível com modelos de provedores diferentes (alguns prompts
  podem precisar de ajuste por provedor)
- Custo: pipeline de 4 chamadas multiplicado por 3 provedores pode ter comportamentos
  diferentes

## Alternativas Consideradas

1. **Manter fetch direto do bundle**: Rejeitado — duplicaria lógica de API key e
   impediria suporte multi-provider
2. **Criar provider específico para pipeline**: Rejeitado — complexidade desnecessária,
   `aiProvider.ts` já atende ao caso de uso
