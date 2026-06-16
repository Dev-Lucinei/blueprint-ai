import { useState, useEffect } from 'react';
import { AIProvider, PROVIDER_MODELS } from '../../types';
import { Card } from '../ui/Card';

interface AiConfigSidebarProps {
  aiProvider: AIProvider;
  aiModel: string;
  onSetAiConfig: (config: { provider?: AIProvider; model?: string }) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function AiConfigSidebar({ aiProvider, aiModel, onSetAiConfig, isOpen, onToggle }: AiConfigSidebarProps) {
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Buscar modelos do Ollama quando o provider for 'ollama'
  useEffect(() => {
    if (aiProvider === 'ollama') {
      fetchOllamaModels();
    }
  }, [aiProvider]);

  const fetchOllamaModels = async () => {
    setOllamaStatus('checking');
    try {
      const res = await fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const data = await res.json();
        const models = data.models?.map((m: { name: string }) => m.name) || [];
        setOllamaModels(models);
        setOllamaStatus('online');
        if (models.length > 0 && !models.includes(aiModel)) {
          onSetAiConfig({ model: models[0] });
        }
      } else {
        setOllamaStatus('offline');
      }
    } catch {
      setOllamaStatus('offline');
    }
  };

  const providers: { id: AIProvider; name: string }[] = [
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'openrouter', name: 'OpenRouter' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'ollama', name: 'Ollama (Local)' },
  ];

  const models = aiProvider === 'ollama' && ollamaModels.length > 0
    ? ollamaModels
    : PROVIDER_MODELS[aiProvider] || [];

  return (
    <div className={`transition-all duration-300 ${isOpen ? 'w-64' : 'w-12'} flex-shrink-0`}>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="w-full p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:bg-gray-700/50 transition-colors flex items-center justify-center"
        title={isOpen ? 'Recolher configurações' : 'Expandir configurações'}
      >
        <span className="text-lg">⚙️</span>
        {isOpen && <span className="ml-2 text-sm text-gray-300">Config IA</span>}
      </button>

      {/* Sidebar content */}
      {isOpen && (
        <Card className="mt-2">
          <div className="space-y-4">
            {/* Provider selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Provedor
              </label>
              <select
                value={aiProvider}
                onChange={(e) => onSetAiConfig({ provider: e.target.value as AIProvider, model: '' })}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Model selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Modelo
              </label>
              <select
                value={aiModel}
                onChange={(e) => onSetAiConfig({ model: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Ollama status */}
            {aiProvider === 'ollama' && (
              <div className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${
                  ollamaStatus === 'online' ? 'bg-green-500' :
                  ollamaStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-gray-400">
                  {ollamaStatus === 'online' ? 'Ollama conectado' :
                   ollamaStatus === 'checking' ? 'Verificando...' : 'Ollama offline'}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
