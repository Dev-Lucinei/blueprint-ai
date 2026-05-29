import React, { useState, useCallback, useEffect } from 'react';
import { Tab, FileObject, AIProvider, AIConfig, getDefaultModel } from './types';
import { getDocSystemInstruction, getRefinementSystemInstruction } from './services/geminiService';
import { aiClient } from './services/aiProvider';
import Header from './components/Header';
import DesktopTabs from './components/DesktopTabs';
import MobileTabs from './components/MobileTabs';
import ProjectTab from './components/tabs/ProjectTab';
import ContentTab from './components/tabs/ContentTab';
import ActionsTab from './components/tabs/ActionsTab';
import ResultsTab from './components/tabs/ResultsTab';
import Toast from './components/Toast';
import ProjectVisualizerModal from './components/ProjectVisualizerModal';

declare global {
  interface Window {
    marked: any;
    DOMPurify: any;
    mermaid: any;
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('projeto');
  const [projectName, setProjectName] = useState('');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [contextText, setContextText] = useState('');
  const [files, setFiles] = useState<FileObject[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [generatedMarkdown, setGeneratedMarkdown] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');
  const [aiModel, setAiModel] = useState<string>('gemini-2.5-flash');

  useEffect(() => {
    const defaults: Record<AIProvider, string> = {
      gemini: 'gemini-2.5-flash',
      openrouter: 'openai/gpt-4o',
      openai: 'gpt-4o',
    };
    setAiModel(defaults[aiProvider]);
  }, [aiProvider]);

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

    try {
      const config: AIConfig = { provider: aiProvider, model: aiModel };
      const systemInstruction = getDocSystemInstruction(projectDescription, contextText);

      const response = await aiClient.generate(fullQuery, config, {
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
  }, [projectDescription, getFullQuery, contextText, showToast, aiProvider, aiModel]);

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

    try {
      const config: AIConfig = { provider: aiProvider, model: aiModel };
      const systemInstruction = getRefinementSystemInstruction(refinementQuery, generatedMarkdown);

      const response = await aiClient.generate(`Aplique o refinamento: ${refinementQuery}`, config, {
        systemInstruction,
      });

      setGeneratedMarkdown(response.text.trim());
      showToast('Refinamento aplicado com sucesso!', 'success');

    } catch (error) {
      console.error('Erro ao refinar documentação:', error);
      showToast('Erro ao refinar documentação.', 'error');
    } finally {
      setIsRefining(false);
    }
  }, [generatedMarkdown, showToast, aiProvider, aiModel]);

  useEffect(() => {
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
        },
      });
    }
  }, []);

  return (
    <div className="min- h-screen flex flex-col bg-surface-dark text-text-primary">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Header />

      <DesktopTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 container mx-auto p-4 lg:px-8 xl:px-4 max-w-7xl overflow-y-auto pb-24 lg:pb-4">
        <div className={activeTab === 'projeto' ? '' : 'hidden'}>
          <ProjectTab
            projectName={projectName}
            setProjectName={setProjectName}
            projectDeadline={projectDeadline}
            setProjectDeadline={setProjectDeadline}
            projectDescription={projectDescription}
            setProjectDescription={setProjectDescription}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            aiProvider={aiProvider}
            setAiProvider={setAiProvider}
            aiModel={aiModel}
            setAiModel={setAiModel}
          />
        </div>
        <div className={activeTab === 'conteudo' ? '' : 'hidden'}>
          <ContentTab
            contextText={contextText}
            setContextText={setContextText}
            files={files}
            setFiles={setFiles}
            showToast={showToast}
          />
        </div>
        <div className={activeTab === 'acoes' ? '' : 'hidden'}>
          <ActionsTab
            onRefine={handleRefine}
            isRefining={isRefining}
            generatedMarkdown={generatedMarkdown}
            isLoading={isLoading}
            onOpenVisualizer={() => setIsModalOpen(true)}
            showToast={showToast}
          />
        </div>
        <div className={activeTab === 'resultados' ? '' : 'hidden'}>
          <ResultsTab
            markdown={generatedMarkdown}
            isLoading={isLoading}
            projectName={projectName}
            showToast={showToast}
          />
        </div>
      </main>

      <MobileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <ProjectVisualizerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        markdownContent={generatedMarkdown}
      />
    </div>
  );
};

export default App;