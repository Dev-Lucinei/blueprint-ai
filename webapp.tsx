import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, Trash2, Loader2, FileUp, X, FolderOpen, Scan, Layers, FileJson, Download } from 'lucide-react';


// Removed ExtractedContext interface as we are not using it for state storage.
// Analysis results are stored as raw strings in the messages array.

interface AnalysisStep {
  id: string;
  name: string;
  icon: typeof Scan;
  instruction: string;
  output: keyof ExtractedContext | 'fullAnalysis';
}

const ANALYSIS_STEPS: AnalysisStep[] = [
  {
    id: 'scout',
    name: 'Scout',
    icon: Scan,
    instruction: `MAPEIE O PROJETO COMPLETAMENTE: 
1. ESTRUTURA DE PASTAS: Liste toda a árvore de diretórios (exclua: node_modules, .git, dist, build, coverage, __pycache__)
2. TECNOLOGIAS: Identifique linguagens por extensão, frameworks via package.json/requirements.txt, versões críticas
3. PONTOS DE ENTRADA: Encontre arquivos main/index/app/server/bootstrap e scripts de inicialização
4. DEPENDÊNCIAS: Liste todas dependências com versões (package.json, requirements.txt, etc.)
5. CI/CD: Identifique pipelines (GitHub Actions, GitLab CI, Dockerfile, docker-compose)
6. FEATURE FLAGS: Procure variáveis de ambiente, configs de toggle
Responda em JSON estruturado com:
- modules: lista de módulos/arquivos principais (caminho relativo)
- entities: estruturas de dados identificadas
- endpoints: rotas ou pontos de entrada
- technologies: stack identificada (linguagem, framework, versão)
- entryPoints: arquivos de inicialização
- structure: árvore de diretórios (objeto nome→tipo/contagem)
- dependencies: lista de dependências com versões
- scripts: scripts npm/yarn disponíveis
- ciCd: pipelines CI/CD identificados
- envVars: variáveis de ambiente encontradas`,
    output: 'fullAnalysis',
  },
    {
      id: 'archaeologist',
      name: 'Archaeologist',
      icon: Layers,
      instruction: `EXTRAIA TUDO DETALHADAMENTE: Para cada módulo identificado, extraia:
1. FUNÇÕES E PARÂMETROS: nome, parâmetros (nome, tipo, obrigatório, valor default), retorno, complexidade
2. ESTRUTURAS DE DADOS: modelos, entidades, DTOs, interfaces (nome, campos: {nome, tipo, obrigatório, default, descrição}, métodos)
3. LÓGICA DE NEGÓCIO: algoritmos não-triviais, transformações de dados, validações de entrada, regras de negócio embutidas
4. CONSTANTES E ENUMS: nomes, valores, uso no código, feature flags
5. TRATAMENTO DE ERROS: como exceções são capturadas, logs, retornos de erro, edge cases tratados
6. EXPORTS: o que é exposto (funções, classes, variáveis) e imports externos usados
7. RELACIONAMENTOS: dependências entre módulos, injeção de dependência, compartilhamento de estado
8. METADADOS: tamanho do arquivo, número de linhas, data de modificação (se disponível)
Responda em formato JSON estruturado com:
- functions: array de {name, parameters: [{name, type, required, default}], return, complexity}
- dataStructures: array de {name, fields: [{name, type, required, default, description}], methods}
- businessLogic: array de {description, type: 'algorithm|validation|transformation', complexity}
- constants: array of {name, value, usage}
- errorHandling: array of {scenario, handling, logged}
- exports: array of {name, type: 'function|class|variable', exportedAs}
- imports: array of {source, importedAs}
- relationships: array of {from, to, type: 'dependency|inheritance|composition'}
- metadata: {fileSize, lines, lastModified}
Use 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA para cada afirmação.`,
    output: 'entities',
  },
  {
    id: 'architect',
    name: 'Architect',
    icon: FolderOpen,
    instruction: `SINTETIZE ARQUITETURA DETALHADA: Com base na análise do Scout e Archaeologist, gere:
1. DIAGRAMA C4 CONTEXTO (Nível 1): sistema no centro, usuários, sistemas externos, protocolos
2. DIAGRAMA C4 CONTAINERS (Nível 2): aplicações, serviços, bancos de dados, filas, caches com tecnologia de cada um
3. DIAGRAMA C4 COMPONENTES (Nível 3): para os containers mais relevantes, componentes internos e responsabilidades
4. ERD COMPLETO: todas as entidades com atributos, tipos, obrigatoriedade, relacionamentos (cardinalidades 1:1, 1:N, N:M), chaves primárias e estrangeiras
5. INTEGRAÇÕES EXTERNAS: APIs REST/GraphQL consumidas e produzidas, webhooks, eventos, protocolos e formatos de dados
6. MIDDLEWARES E INTERCEPTORS: pipeline de requisições, autenticação, logging, tratamento de erros
7. FEATURE FLAGS E TOGGLES: como funcionalidades são ativadas/desativadas
Responda em Markdown com diagramas Mermaid quando aplicável. Inclua:
- Para C4: sintaxe Mermaid válida
- Para ERD: sintaxe Mermaid ERD
- Para listas: formato de tabela ou lista detalhada
Use 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA para cada afirmação.`,
    output: 'fullAnalysis',
  },
];

const App = () => {
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; name: string; content: string; type: string }[]>([]);
  const [messages, setMessages] = useState<{ id: number; role: 'user' | 'system' | 'analysis'; content: string; step?: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiKey = "";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const copyToClipboard = (text: string) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  const downloadProjectBundle = () => {
    const bundle = {
      project_metadata: {
        exported_at: new Date().toISOString(),
        input_query: input
      },
      source_files: attachedFiles.map(f => ({
        name: f.name,
        type: f.type,
        content: f.content
      })),
      analysis_results: messages.filter(m => m.role === 'analysis').map(m => ({
        step: m.step,
        content: m.content
      })),
      final_blueprint: messages.find(m => m.role === 'system')?.content || ""
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blueprint-bundle-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedFiles(prev => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            content: event.target?.result as string,
            type: file.name.split('.').pop() || 'unknown',
          },
        ]);
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const getBaseInstructions = (step: AnalysisStep) => `
VOCÊ É UM AGENTE DE ANÁLISE DE CÓDIGO. SUA FUNÇÃO É EXTRAIR CONHECIMENTO ESTRUTURADO DE PROJETOS LEGADO.
${step.instruction}
REGRAS:
1. Responda APENAS com o formato especificado
2. Use 🟢 para CONFIRMADO, 🟡 para INFERIDO, 🔴 para LACUNA
3. Para JSON: retorne apenas o objeto, sem markdown
4. Para Markdown: use formato técnico com diagramas quando possível
5. NOMEIE CADA ARQUIVO/FUNÇÃO/ENTIDADE com sua confiança`;

  const callAnalysisAgent = async (context: string, step: AnalysisStep): Promise<string> => {
    const systemPrompt = getBaseInstructions(step);
    const userPayload = context || 'Analise: projeto vazio';

    const maxRetries = 5;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: userPayload }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
            }),
          }
        );

        if (!response.ok) throw new Error('Falha na requisição da API');
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta.';
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    return 'Erro após múltiplas tentativas.';
  };

  const buildContext = (files: typeof attachedFiles): string => {
    if (files.length === 0) return 'Nenhum arquivo anexado.';
    
    // Create file tree structure
    const fileTree: Record<string, any> = {};
    files.forEach(file => {
      const parts = file.name.split('/');
      let current = fileTree;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          current[part] = {
            type: file.type,
            size: file.content.length,
            lines: file.content.split('\n').length
          };
        } else {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      }
    });
    
    // Format file tree as string
    const formatTree = (obj: any, indent = 0): string => {
      return Object.entries(obj).map(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value) && 'type' in value) {
          return '  '.repeat(indent) + `📄 ${key} (${value.type}, ${value.size} chars, ${value.lines} lines)`;
        } else {
          return '  '.repeat(indent) + `📁 ${key}/\n${formatTree(value, indent + 1)}`;
        }
      }).join('\n');
    };
    
    const treeString = formatTree(fileTree);
    
    // Format file contents
    const filesString = files.map(f => {
      return `--- ARQUIVO: ${f.name} (${f.type}, ${f.content.length} chars, ${f.content.split('\n').length} lines) ---\n\`\`\`${f.type}\n${f.content}\n\`\`\``;
    }).join('\n\n');
    
    return `ESTRUTURA DE DIRETÓRIOS:\n${treeString}\n\nCONTEÚDO DOS ARQUIVOS:\n${filesString}`;
  };

  const handleAnalyze = async () => {
    if (attachedFiles.length === 0 && !input.trim()) return;
    const context = buildContext(attachedFiles);
    const userPrompt = input.trim() || 'Analise os arquivos anexados.';
    setIsProcessing(true);
    setMessages([]);
    setCurrentStep(0);

    try {
      const resultsAccumulated: string[] = [];

      for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
        const step = ANALYSIS_STEPS[i];
        setCurrentStep(i);
        
        const stepMsgId = Date.now() + i;
        setMessages(prev => [...prev, {
          id: stepMsgId,
          role: 'analysis',
          content: `🔍 **${step.name}** — Processando...`,
          step: step.id,
        }]);

        const result = await callAnalysisAgent(
          `PROMPT DO USUÁRIO: "${userPrompt}"\n\nCONTEXTO:\n${context}`,
          step
        );

        resultsAccumulated.push(result);

        setMessages(prev => prev.map(m => 
          m.id === stepMsgId ? { ...m, content: result } : m
        ));
      }

       const finalPrompt = `
CONTEXTO DOS ARQUIVOS ANALISADOS:
${context}
OUTPUT DO ANALYSIS:
${resultsAccumulated.join('\n\n---\n\n')}
USUÁRIO SOLICITOU: "${userPrompt}"
GERE UM BLUEPRINT DE IMPLEMENTAÇÃO COMPLETO seguindo:
1. ESPECIFICAÇÃO TÉCNICA (propósito, escopo, público-alvo, stack)
2. REQUISITOS FUNCIONAIS (EARS — formato Dado/Quando/Então)
3. ARQUITETURA (C4: contexto, containers, componentes)
4. ENTIDADES E RELACIONAMENTOS (ERD completo com cardinalidades)
5. ENDPOINTS DE API (OpenAPI com schemas de request/response)
6. PLANO DE EXECUÇÃO (WBS + MAF + rastreabilidade código↔spec)
7. GUIA DE USO E DEPLOY (instalação, configuração, uso)
8. GOVERNANÇA E QUALIDADE (Definition of Done, critérios de aceitação, testes, cobertura, métricas)
9. ROADMAP DE EVOLUÇÃO (features futuras, dependências técnicas, versionamento, milestones)
10. DEPENDÊNCIAS E PRÉ-REQUISITOS (dependências externas, variáveis de ambiente, recursos)
Para cada entidade, função ou componente especificado, inclua rastreabilidade: 
- arquivo_origem (caminho relativo)
- linha_início e linha_fim no código fonte
- nível de confiança (🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA)
Use 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA para cada afirmação.`;

      const blueprintResult = await callAnalysisAgent(finalPrompt, ANALYSIS_STEPS[2]);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 999, role: 'system', content: blueprintResult },
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { id: Date.now(), role: 'system', content: `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a1628] text-slate-200 font-sans">
      <header className="border-b border-white/10 p-4 bg-slate-950/60 backdrop-blur-xl flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2.5 rounded-xl border border-white/10">
            <Layers className="text-emerald-400" size={22} />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white uppercase">Reversa × Blueprint</h1>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Análise + Documentação</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && !isProcessing && (
            <button
              onClick={downloadProjectBundle}
              title="Baixar pacote completo (JSON)"
              className="flex items-center gap-2 p-2 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-all border border-emerald-500/20"
            >
              <Download size={16} /> Exportar Bundle
            </button>
          )}
          <button
            onClick={() => { setMessages([]); setAttachedFiles([]); setCurrentStep(0); }}
            className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-2xl mx-auto opacity-60">
            <div className="grid grid-cols-3 gap-4 w-full">
              {ANALYSIS_STEPS.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="bg-slate-900/40 border border-white/10 rounded-xl p-4 text-center">
                    <Icon size={24} className="mx-auto mb-2 text-emerald-500" />
                    <p className="text-xs font-bold uppercase">{step.name}</p>
                    <p className="text-[9px] text-slate-600 mt-1">
                      {idx === 0 ? 'Inventário' : idx === 1 ? 'Entidades' : 'Arquitetura'}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-slate-400">
              Anexe arquivos de código para iniciar a análise automática — Scout → Archaeologist → Architect → Blueprint
            </p>
          </div>
        )}
        
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[95%] p-6 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-blue-600 shadow-lg'
                  : msg.role === 'analysis'
                  ? 'bg-slate-800/80 border border-white/10 shadow-xl'
                  : 'bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                {msg.role === 'analysis' && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                    <FileJson size={12} /> Resultado de Análise
                  </div>
                )}
                <button 
                  onClick={() => copyToClipboard(msg.content)}
                  className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors"
                  title="Copiar texto"
                >
                  <Copy size={12} />
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-100 max-h-96 overflow-y-auto custom-scrollbar">
                {msg.content}
              </pre>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-900/40 border border-white/10 p-6 rounded-2xl w-72">
              <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase">
                <Loader2 size={14} className="animate-spin" />
                {ANALYSIS_STEPS[currentStep]?.name || 'Processando'}...
              </div>
              <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 animate-[shimmer_2s_infinite] w-1/3" />
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="p-4 md:p-8 bg-slate-950/80 border-t border-white/5 backdrop-blur-md">
        <div className="max-w-5xl mx-auto space-y-4">
          {attachedFiles.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {attachedFiles.map(file => (
                <div key={file.id} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full whitespace-nowrap">
                  <span className="text-[10px] font-bold">{file.name}</span>
                  <button onClick={() => removeFile(file.id)} className="text-slate-400 hover:text-white">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition duration-500" />
            <div className="relative bg-slate-950 rounded-2xl border border-white/10 shadow-2xl">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAnalyze())}
                placeholder="Descreva o projeto ou anexe arquivos..."
                className="w-full bg-transparent px-6 py-5 text-sm outline-none resize-none h-28 placeholder:text-slate-700 focus:placeholder:text-slate-600 transition-all"
              />
              <div className="absolute right-4 bottom-4 flex gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-colors border border-white/5"
                  title="Anexar arquivos"
                >
                  <FileUp size={20} />
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={isProcessing || (attachedFiles.length === 0 && !input.trim())}
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white shadow-xl shadow-emerald-600/20 disabled:opacity-50 disabled:bg-slate-800 disabled:shadow-none transition-all"
                  title="Iniciar análise"
                >
                  {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default App;
