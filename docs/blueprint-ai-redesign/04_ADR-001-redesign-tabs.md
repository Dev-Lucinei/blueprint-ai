# 04_ADR-001-redesign-tabs.md

**Data**: 2026-06-16
**Status**: Aceito
**Decisor**: Lucinei

---

## Contexto
A interface atual do blueprint-ai possui 5 abas sequenciais: Projeto, Conteúdo, Analisar, Ações e Resultados. Essa separação gera uma fricção desnecessária, pois o usuário precisa alternar entre abas para configurar o input (combinando dados de Projeto e Conteúdo). Além disso, as ações de exportação e refinamento estão isoladas da visualização do resultado final, o que força a troca de contexto visual e aumenta o número de cliques para completar uma tarefa.

O componente raiz `App.tsx` gerencia 13 estados via `useState`, sem o uso de react-router, o que torna a transição para um modelo de macro-estados uma tarefa viável de refatoração.

## Decisão
Reduzir a navegação de 5 abas para **3 macro-estados lógicos**:
1. **Configuração (Input)**: Unifica as abas "Projeto" e "Conteúdo".
2. **Revisão (Processamento)**: Unifica "Analisar" e "Ações".
3. **Resultado (Output)**: Mantém a aba "Resultados", mas integra as ações de exportação e refinamento diretamente neste contexto.

Essa reestruturação visa melhorar a experiência do usuário ao reduzir cliques, simplificar o fluxo de trabalho e manter uma separação lógica clara entre as etapas do pipeline.

## Consequências
### Positivas
- Redução significativa no número de cliques para conclusão de uma tarefa.
- Melhoria na experiência de usuário (UX) ao agrupar configurações e ações relacionadas.
- Fluxo de trabalho mais intuitivo e linear.
- Interface mais limpa e focada no estado atual do processo.

### Negativas
- Necessidade de refatoração dos componentes React existentes (especialmente em `App.tsx` e componentes de abas).
- Risco de regressão que exigirá uma bateria de testes completa (unitários e integração).
- Possível necessidade de reajuste no estado global e na lógica de 13 `useState` atuais.

## Alternativas Consideradas
### 1. Manter 5 abas (status quo)
- **Prós:** Nenhuma mudança necessária, zero risco de implementação.
- **Contras:** Não resolve o problema de UX, mantém o atrito e a fragmentação existentes.

### 2. Unificar para 3 macro-estados (proposta)
- **Prós:** Reduz cliques, melhora o fluxo significativamente e mantém uma separação lógica clara.
- **Contras:** Reorganização de componentes e necessidade de testes de regressão.

### 3. Unificar para 2 macro-estados (Editor + Resultado)
- **Prós:** Máxima simplificação visual.
- **Contras:** Mistura etapas de processamento com input, perdendo a clareza do pipeline de etapas e sobrecarregando o estado do editor.

### 4. Manter 5 abas mas com navegação lateral
- **Prós:** Melhora a navegação visual sem alterar a lógica de estados.
- **Contras:** Não resolve o problema fundamental de separação de concerns e excesso de passos.

## Referências
- `src/App.tsx` (Estado atual da navegação e estados)
- `pipeline-desenvolvimento.json` (Estrutura de phases)
- `Recursos/docs/framework/01_FRAMEWORK_DEV.md`
