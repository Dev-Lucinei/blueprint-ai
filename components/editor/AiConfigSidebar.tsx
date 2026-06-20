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
    <div className={`transition-all duration-300 ${isOpen ? 'w-full' : 'w-12'}`}>
      <button
        onClick={onToggle}
        className="w-full p-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors flex items-center justify-center"
        title={isOpen ? 'Recolher configuracoes' : 'Expandir configuracoes'}
      >
        <span className="text-lg">...</span>
        {isOpen && <span className="ml-2 text-sm text-[var(--text-secondary)]">Config IA</span>}
      </button>

      {isOpen && (
        <Card className="mt-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Provedor
              </label>
              <select
                value={aiProvider}
                onChange={(e) => onSetAiConfig({ provider: e.target.value as AIProvider, model: '' })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Modelo
              </label>
              <select
                value={aiModel}
                onChange={(e) => onSetAiConfig({ model: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
              >
                {models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {aiProvider === 'ollama' && (
              <div className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${
                  ollamaStatus === 'online' ? 'bg-[var(--success)]' :
                  ollamaStatus === 'checking' ? 'bg-[var(--warning)]' : 'bg-[var(--danger)]'
                }`} />
                <span className="text-[var(--text-muted)]">
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
