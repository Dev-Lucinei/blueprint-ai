import React, { useState, useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import mermaid from 'mermaid';
import { Tab, FileObject, AIProvider, AIConfig, AppMode, AppState, AppAction, initialState } from './types';
import { getDocSystemInstruction, getRefinementSystemInstruction } from './services/geminiService';
import { aiClient } from './services/aiProvider';
import { usePipeline } from './hooks/usePipeline';
import { parseGraphFromAI } from './services/pipelineService';
import Header from './components/Header';
import DesktopTabs from './components/DesktopTabs';
import MobileTabs from './components/MobileTabs';
import EditorContexto from './components/editor/EditorContexto';
import ActionsTab from './components/tabs/ActionsTab';
import ResultsTab from './components/tabs/ResultsTab';
import AnalyzeTab from './components/AnalyzeTab';
import Toast from './components/Toast';
import ProjectVisualizerModal from './components/ProjectVisualizerModal';

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_APP_MODE':
      return { ...state, appMode: action.payload };
    case 'UPDATE_PROJECT':
      return { ...state, ...action.payload };
    case 'SET_CONTEXT_TEXT':
      return { ...state, contextText: action.payload };
    case 'ADD_FILES':
      return { ...state, files: [...state.files, ...action.payload] };
    case 'REMOVE_FILE':
      return { ...state, files: state.files.filter((_, i) => i !== action.payload) };
    case 'SET_FILES':
      return { ...state, files: action.payload };
    case 'SET_AI_CONFIG':
      return { ...state, ...action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_REFINING':
      return { ...state, isRefining: action.payload };
    case 'SET_GENERATED_MD':
      return { ...state, generatedMarkdown: action.payload };
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const {
    activeTab, appMode, projectName, projectDeadline,
    projectDescription, contextText, files, aiProvider,
    aiModel, isLoading, isRefining, generatedMarkdown,
  } = state;

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Ref para acesso ao estado atual em callbacks estáveis (compatibilidade com functional updater do setFiles)
  const stateRef = useRef(state);
  stateRef.current = state;

  // --- Wrapper functions: mantêm assinaturas idênticas aos setters originais ---
  const setActiveTab = useCallback((tab: Tab) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab }), []);
  const setAppMode = useCallback((mode: AppMode) => dispatch({ type: 'SET_APP_MODE', payload: mode }), []);
  const setProjectName = useCallback((name: string) => dispatch({ type: 'UPDATE_PROJECT', payload: { projectName: name } }), []);
  const setProjectDeadline = useCallback((deadline: string) => dispatch({ type: 'UPDATE_PROJECT', payload: { projectDeadline: deadline } }), []);
  const setProjectDescription = useCallback((desc: string) => dispatch({ type: 'UPDATE_PROJECT', payload: { projectDescription: desc } }), []);
  const setContextText = useCallback((text: string) => dispatch({ type: 'SET_CONTEXT_TEXT', payload: text }), []);
  const setAiProvider = useCallback((provider: AIProvider) => dispatch({ type: 'SET_AI_CONFIG', payload: { provider } }), []);
  const setAiModel = useCallback((model: string) => dispatch({ type: 'SET_AI_CONFIG', payload: { model } }), []);
  const setIsLoading = useCallback((loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }), []);
  const setIsRefining = useCallback((refining: boolean) => dispatch({ type: 'SET_REFINING', payload: refining }), []);
  const setGeneratedMarkdown = useCallback((md: string) => dispatch({ type: 'SET_GENERATED_MD', payload: md }), []);

  /**
   * setFiles: suporta both value assignment e functional updater (React.SetStateAction<FileObject[]>).
   * Necessário porque ContentTab usa o padrão setFiles(prev => prev.map(...)).
   */
  const setFiles = useCallback((filesOrUpdater: FileObject[] | ((prev: FileObject[]) => FileObject[])) => {
    if (typeof filesOrUpdater === 'function') {
      dispatch({ type: 'SET_FILES', payload: filesOrUpdater(stateRef.current.files) });
    } else {
      dispatch({ type: 'SET_FILES', payload: filesOrUpdater });
    }
  }, []);

  const pipeline = usePipeline((stepId, content) => {
    console.log(`Pipeline step ${stepId} completed`);
  });
  const { pipelineState } = pipeline;

  const graphData = useMemo(() => {
    if (!pipelineState) return { nodes: [], links: [] };
    const cartographerResult = pipelineState.results.find(r => r.stepId === 'cartographer');
    if (!cartographerResult || cartographerResult.status !== 'done') return { nodes: [], links: [] };
    return parseGraphFromAI(cartographerResult.content);
  }, [pipelineState]);

  useEffect(() => {
    const defaults: Record<AIProvider, string> = {
      gemini: 'gemini-2.5-flash',
      openrouter: 'openai/gpt-4o',
      openai: 'gpt-4o',
    };
    setAiModel(defaults[aiProvider]);
  }, [aiProvider, setAiModel]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isApiKeyConfigured = (provider: AIProvider): boolean => {
    const keys: Record<AIProvider, string> = {
      gemini: (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || '') as string,
      openrouter: (import.meta.env.VITE_OPENROUTER_API_KEY || '') as string,
      openai: (import.meta.env.VITE_OPENAI_API_KEY || '') as string,
    };
    return !!keys[provider];
  };

  const getFullQuery = useCallback(() => {
    let enrichedQuery = projectDescription;
    if (projectName) enrichedQuery = `NOME DO PROJETO: ${projectName}\n\n` + enrichedQuery;
    if (projectDeadline) enrichedQuery += `\n\nPRAZO ESTIMADO DE CONCLUSÃO: ${projectDeadline}`;

    const fileContexts = files.map(f => `\n\n--- CONTEÚDO DO ARQUIVO: ${f.file.name} ---\n${f.content}`).join('');

    return enrichedQuery + (contextText ? `\n\nCONTEXTO ADICIONAL: ${contextText}` : '') + fileContexts;
  }, [projectName, projectDeadline, projectDescription, contextText, files]);

  const handleGenerate = useCallback(async () => {
    if (!projectDescription) {
      showToast('A descrição de alto nível do projeto é obrigatória.', 'error');
      return;
    }

    if (!isApiKeyConfigured(aiProvider)) {
      showToast(`API Key para ${aiProvider} não configurada. Verifique o .env.local`, 'error');
      return;
    }

    setIsLoading(true);
    setActiveTab('resultados');
    setGeneratedMarkdown('');

    const fullQuery = getFullQuery();
    let finalQuery = fullQuery;

    if (appMode === 'analise' && pipelineState?.accumulatedContext) {
      finalQuery += `\n\n## Contexto Adicional da Análise de Código\n${pipelineState.accumulatedContext}`;
    }

    try {
      const config: AIConfig = { provider: aiProvider, model: aiModel };
      const systemInstruction = getDocSystemInstruction(projectDescription, contextText);

      const response = await aiClient.generate(finalQuery, config, {
        systemInstruction,
      });

      setGeneratedMarkdown(response.text.trim());
      showToast('Documentação gerada com sucesso!', 'success');

    } catch (error) {
      console.error('Erro ao gerar documentação:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      setGeneratedMarkdown(`## Erro na Geração\n\nOcorreu um erro ao tentar gerar a documentação.\n\n**Detalhes:**\n\`\`\`\n${errorMessage}\n\`\`\``);
      showToast('Erro ao gerar documentação.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [projectDescription, getFullQuery, contextText, showToast, aiProvider, aiModel, appMode, pipelineState]);

  const handleRefine = useCallback(async (refinementQuery: string) => {
    if (!generatedMarkdown) {
      showToast('Gere a documentação principal antes de refinar.', 'error');
      return;
    }
    if (!refinementQuery) {
      showToast('Por favor, descreva o ajuste que pretende aplicar.', 'error');
      return;
    }
    if (!isApiKeyConfigured(aiProvider)) {
      showToast(`API Key para ${aiProvider} não configurada. Verifique o .env.local`, 'error');
      return;
    }
    setIsRefining(true);
    setChatHistory(prev => [...prev, { role: 'user', content: refinementQuery }]);
    try {
      const config: AIConfig = { provider: aiProvider, model: aiModel };
      const systemInstruction = getRefinementSystemInstruction(refinementQuery, generatedMarkdown);
      const response = await aiClient.generate(`Aplique o refinamento: ${refinementQuery}`, config, {
        systemInstruction,
      });
      setGeneratedMarkdown(response.text.trim());
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Refinamento aplicado com sucesso!' }]);
      showToast('Refinamento aplicado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao refinar documentação:', error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Erro ao aplicar refinamento.' }]);
      showToast('Erro ao refinar documentação.', 'error');
    } finally {
      setIsRefining(false);
    }
  }, [generatedMarkdown, showToast, aiProvider, aiModel]);

  const handleExportJSON = useCallback(() => {
    const bundle = {
      project: {
        name: projectName,
        deadline: projectDeadline,
        description: projectDescription,
      },
      context: {
        additionalText: contextText,
        files: files.map(f => ({ name: f.file.name, content: f.content })),
      },
      aiConfig: {
        provider: aiProvider,
        model: aiModel,
      },
      blueprint: generatedMarkdown,
      graph: graphData,
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'blueprint-ai'}-bundle.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Bundle JSON exportado com sucesso!', 'success');
  }, [projectName, projectDeadline, projectDescription, contextText, files, aiProvider, aiModel, generatedMarkdown, graphData, showToast]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
      },
    });
  }, []);

  return (
    <div className="min- h-screen flex flex-col bg-surface-dark text-text-primary">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Header mode={appMode} setMode={setAppMode} />

      <DesktopTabs activeTab={activeTab} setActiveTab={setActiveTab} mode={appMode} />

      <main className="flex-1 container mx-auto p-4 lg:px-8 xl:px-4 max-w-7xl overflow-y-auto pb-24 lg:pb-4">
        <div className={activeTab === 'projeto' ? '' : 'hidden'}>
          <EditorContexto
            projectName={projectName}
            projectDeadline={projectDeadline}
            projectDescription={projectDescription}
            contextText={contextText}
            files={files}
            aiProvider={aiProvider}
            aiModel={aiModel}
            appMode={appMode}
            isLoading={isLoading}
            onUpdateProject={(p) => dispatch({ type: 'UPDATE_PROJECT', payload: p })}
            onSetContextText={(t) => dispatch({ type: 'SET_CONTEXT_TEXT', payload: t })}
            onSetFiles={setFiles}
            onRemoveFile={(i) => dispatch({ type: 'REMOVE_FILE', payload: i })}
            onSetAiConfig={(c) => dispatch({ type: 'SET_AI_CONFIG', payload: c })}
            onSetAppMode={(m) => dispatch({ type: 'SET_APP_MODE', payload: m })}
            onGenerate={handleGenerate}
          />
        </div>
         <div className={activeTab === 'acoes' ? '' : 'hidden'}>
           <ActionsTab
             onRefine={handleRefine}
             isRefining={isRefining}
             generatedMarkdown={generatedMarkdown}
             isLoading={isLoading}
             onOpenVisualizer={() => setIsModalOpen(true)}
             onExportJSON={handleExportJSON}
             showToast={showToast}
           />
         </div>

        <div className={activeTab === 'resultados' ? '' : 'hidden'}>
          <ResultsTab
            markdown={generatedMarkdown}
            isLoading={isLoading}
            projectName={projectName}
            showToast={showToast}
            graphNodes={graphData.nodes}
            graphLinks={graphData.links}
            onRefine={handleRefine}
            isRefining={isRefining}
            chatHistory={chatHistory}
          />
        </div>
        <div className={activeTab === 'analisar' ? '' : 'hidden'}>
          <AnalyzeTab
            pipeline={pipeline}
            projectDescription={projectDescription}
            files={files}
            aiConfig={{ provider: aiProvider, model: aiModel }}
          />
        </div>
      </main>

      <MobileTabs activeTab={activeTab} setActiveTab={setActiveTab} mode={appMode} />

      <ProjectVisualizerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        markdownContent={generatedMarkdown}
      />
    </div>
  );
};

export default App;
