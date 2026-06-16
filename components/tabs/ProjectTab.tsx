import React from 'react';
import type { AIProvider } from '../../types';
import { PROVIDER_MODELS, getDefaultModel } from '../../types';
import { Card } from '../ui/Card';
import { InputField } from '../ui/InputField';
import { TextAreaField } from '../ui/TextAreaField';

const isApiKeyConfigured = (provider: AIProvider): boolean => {
  const keys: Record<AIProvider, string> = {
    gemini: (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || '') as string,
    openrouter: (import.meta.env.VITE_OPENROUTER_API_KEY || '') as string,
    openai: (import.meta.env.VITE_OPENAI_API_KEY || '') as string,
  };
  return !!keys[provider];
};

interface ProjectTabProps {
  projectName: string;
  setProjectName: (name: string) => void;
  projectDeadline: string;
  setProjectDeadline: (date: string) => void;
  projectDescription: string;
  setProjectDescription: (desc: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  aiProvider: AIProvider;
  setAiProvider: (p: AIProvider) => void;
  aiModel: string;
  setAiModel: (m: string) => void;
}



const ProjectTab: React.FC<ProjectTabProps> = ({
  projectName,
  setProjectName,
  projectDeadline,
  setProjectDeadline,
  projectDescription,
  setProjectDescription,
  onGenerate,
  isLoading,
  aiProvider,
  setAiProvider,
  aiModel,
  setAiModel,
}) => {
  const providers: { id: AIProvider; name: string }[] = [
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'openrouter', name: 'OpenRouter' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'ollama', name: 'Ollama (Local)' },
  ];

  const [ollamaModels, setOllamaModels] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (aiProvider === 'ollama') {
      fetch('http://localhost:11434/api/tags')
        .then(res => res.json())
        .then(data => {
          if (data && data.models) {
            const models = data.models.map((m: any) => m.name);
            setOllamaModels(models);
            if (models.length > 0 && !models.includes(aiModel)) {
              setAiModel(models[0]);
            }
          }
        })
        .catch(err => console.error('Falha ao buscar modelos do Ollama:', err));
    }
  }, [aiProvider, aiModel, setAiModel]);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = e.target.value as AIProvider;
    setAiProvider(p);
    setAiModel(getDefaultModel(p));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-indigo-300">Configurações de IA</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-slate-300">
                Provedor de IA
              </label>
              <select
                id="provider"
                value={aiProvider}
                onChange={handleProviderChange}
                className="mt-1 block w-full p-3 bg-slate-900/70 border border-slate-600 rounded-lg text-slate-100 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 transition"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {!isApiKeyConfigured(p.id) ? '(sem API key)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-slate-300">
                Modelo
              </label>
              <select
                id="model"
                value={aiModel}
                onChange={e => setAiModel(e.target.value)}
                className="mt-1 block w-full p-3 bg-slate-900/70 border border-slate-600 rounded-lg text-slate-100 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 transition"
              >
                {(aiProvider === 'ollama' && ollamaModels.length > 0 ? ollamaModels : PROVIDER_MODELS[aiProvider]).map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-indigo-300">Detalhes do Projeto</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Nome do Projeto *"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="Ex: Sistema de Gestão de Vendas"
            />
            <InputField
              label="Prazo Estimado"
              type="date"
              value={projectDeadline}
              onChange={e => setProjectDeadline(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-indigo-300">Descrição Principal</h2>
        </div>
        <div className="p-6">
          <TextAreaField
            label="Descrição de Alto Nível *"
            value={projectDescription}
            onChange={e => setProjectDescription(e.target.value)}
            placeholder={`Template Sugerido:\n(1) Propósito de Negócio: [Qual problema resolve?]\n(2) Funcionalidades Críticas: [3-5 features principais]\n(3) Exclusões Conhecidas: [O que NÃO será implementado]`}
            rows={6}
          />
        </div>
      </Card>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg p-6">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full py-4 px-6 text-lg font-semibold text-white rounded-lg transition-all duration-300 ease-in-out bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/50 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Gerando...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 inline mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Gerar Documentação Completa
            </>
          )}
        </button>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Adicione contexto na aba "Conteúdo" para um resultado mais preciso.
        </p>
      </div>
    </div>
  );
};

export default ProjectTab;