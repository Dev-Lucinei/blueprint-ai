# Blueprint AI

Stack: React 19 + Vite 6 + TypeScript 5.8 + Google GenAI SDK, OpenAI, OpenRouter

## Comandos

```bash
npm install          # instalar dependências
npm run dev         # iniciar dev server (porta 3000)
npm run build       # build de produção
npm run preview    # visualizar build
```

## Variáveis de Ambiente

Criar `.env.local` com:
```
VITE_GEMINI_API_KEY=sua-chave-aqui
VITE_OPENAI_API_KEY=sua-chave-aqui
VITE_OPENROUTER_API_KEY=sua-chave-aqui
```

## Estrutura

- `App.tsx` — componente principal
- `components/` — componentes React
- `services/` — integração com API Gemini
- `types.ts` — tipos TypeScript

## Validação

Executar `npm run build` para verificar erros de tipo e build.

## Notas

- Projeto simples (monopackage, sem testes, sem lint configurado)
- Entry point: `index.tsx` → `App.tsx`