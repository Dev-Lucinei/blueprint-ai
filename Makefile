# blueprint-ai/Makefile
.DEFAULT_GOAL := help
SHELL         := /usr/bin/env bash -euo pipefail

.PHONY: help setup dev build preview lint typecheck test clean all

help:  ## Mostra esta mensagem de ajuda com todos os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ── Configuração ────────────────────────────────────────────────────────────────
setup:  ## Instala dependências
	npm install

# ── Desenvolvimento ─────────────────────────────────────────────────────────────
dev:  ## Inicia servidor de desenvolvimento Vite
	npm run dev

build:  ## Build para produção
	npm run build

preview:  ## Preview do build
	npm run preview

# ── Qualidade ───────────────────────────────────────────────────────────────────
lint:  ## Executa linter
	npm run lint || echo "Lint não configurado ou passou sem erros."

typecheck:  ## Verifica tipagens do TypeScript
	npm run typecheck || npx tsc --noEmit

# ── Testes ──────────────────────────────────────────────────────────────────────
test:  ## Executa testes
	npm run test

# ── Limpeza ─────────────────────────────────────────────────────────────────────
clean:  ## Remove arquivos temporários
	rm -rf dist/ node_modules/

# ── Pipeline completo ───────────────────────────────────────────────────────────
all: typecheck test
