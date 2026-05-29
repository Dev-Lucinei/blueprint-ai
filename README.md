<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🚀 Blueprint AI

**Blueprint AI** é uma ferramenta poderosa para arquitetos de software e engenheiros de prompt que automatiza a criação de documentações técnicas e gerenciais completas para projetos de software. Utilizando o Google Gemini AI, a ferramenta transforma descrições simples em Blueprints de Implementação detalhados, prontos para serem utilizados por agentes de codificação autônomos ou equipes de desenvolvimento.

## ✨ Funcionalidades

- **Geração de Blueprints**: Cria documentação estruturada com 9 seções obrigatórias (Propósito, Requisitos, WBS, Matriz de Rastreabilidade, etc.).
- **Visualização Dual**: Alternância entre visualização renderizada (Markdown) e código raw.
- **Exportação Facilitada**: Funcionalidades integradas para copiar o conteúdo para a área de transferência ou baixar o arquivo `.md`.
- **Navegação Inteligente**: Sumário (TOC) gerado automaticamente para navegação rápida em documentos extensos.
- **Diagramas Mermaid**: Suporte à renderização de diagramas de arquitetura e fluxos.

## 🛠️ Stack Tecnológica

- **Frontend**: React 19 + Vite 6 + TypeScript 5.8
- **Estilização**: Tailwind CSS
- **IA**: Google GenAI SDK (Gemini)
- **Utilitários**: Marked (Markdown Parsing), DOMPurify (Sanitização), Mermaid.js (Diagramas)

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js (LTS recomendado)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd blueprint-ai
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto e adicione sua chave da API do Gemini:
   ```env
   VITE_GEMINI_API_KEY=sua_chave_aqui
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   O app estará disponível em `http://localhost:3000`.

## 📂 Estrutura do Projeto

- `src/App.tsx` - Componente principal da aplicação.
- `src/components/` - Componentes de UI reutilizáveis.
- `src/services/` - Lógica de integração com a API do Gemini.
- `src/types.ts` - Definições de tipos TypeScript.

---
Desenvolvido para acelerar a fase de especificação e arquitetura de software.
