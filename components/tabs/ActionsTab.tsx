
import React, { useState } from 'react';
import LinkValidator from '../LinkValidator';

interface ActionsTabProps {
  onRefine: (query: string) => void;
  isRefining: boolean;
  generatedMarkdown: string;
  isLoading: boolean;
  onOpenVisualizer: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const Card: React.FC<{ children: React.ReactNode, title: string, description: string, hidden?: boolean }> = ({ children, title, description, hidden = false }) => (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg ${hidden ? 'hidden' : ''}`}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-slate-400 mt-1">{description}</p>
        <div className="mt-6">
          {children}
        </div>
      </div>
    </div>
);

const ActionsTab: React.FC<ActionsTabProps> = ({ onRefine, isRefining, generatedMarkdown, isLoading, onOpenVisualizer, showToast }) => {
  const [refinementQuery, setRefinementQuery] = useState('');
  const hasContent = generatedMarkdown.length > 0;

  const handleCopy = () => {
    if (!hasContent) {
        showToast('Nenhum blueprint para copiar.', 'info');
        return;
    }
    navigator.clipboard.writeText(generatedMarkdown);
    showToast('Blueprint copiado para a área de transferência!', 'success');
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {isLoading && (
        <div className="bg-slate-800/50 border border-indigo-500/50 rounded-2xl shadow-lg p-6 flex items-center justify-center space-x-3 text-indigo-300">
            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span className="font-medium text-lg">Gerando Documentação...</span>
        </div>
      )}

      {!isLoading && hasContent && (
         <div className="bg-slate-800/50 border border-green-500/30 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="text-lg font-semibold text-white mb-1">Documentação Gerada com Sucesso!</h3>
            <p className="text-sm text-slate-400">Acesse a aba "Resultados" para visualizar o blueprint gerado.</p>
        </div>
      )}
      
      <Card 
        title="Refinar e Ajustar Blueprint" 
        description="Solicite ajustes específicos na documentação gerada."
        hidden={!hasContent || isLoading}
      >
        <textarea
          value={refinementQuery}
          onChange={(e) => setRefinementQuery(e.target.value)}
          className="w-full p-4 bg-slate-900/70 border border-slate-600 rounded-lg text-slate-100 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 transition min-h-[100px]"
          placeholder="Ex: 'Mude a seção 1.4 para usar JavaScript e Node.js em vez de Python' ou 'Expanda a seção 2.1 com mais um Requisito Funcional.'"
        />
        <button
          onClick={() => onRefine(refinementQuery)}
          disabled={isRefining}
          className="mt-4 w-full py-3 px-6 font-semibold text-white rounded-lg transition-all duration-300 ease-in-out bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center"
        >
          {isRefining ? 'Aplicando...' : 'Aplicar Refinamento'}
        </button>
      </Card>
      
      <Card
        title="Análise de Qualidade"
        description="Validações automáticas e alertas sobre o conteúdo gerado."
        hidden={!hasContent || isLoading}
      >
        <LinkValidator markdownContent={generatedMarkdown} />
      </Card>
      
      <Card
        title="Exportar e Visualizar"
        description="Copie o conteúdo gerado ou visualize o plano de projeto."
        hidden={!hasContent || isLoading}
      >
        <div className="flex flex-wrap gap-4">
           <button
            onClick={handleCopy}
            className="py-3 px-6 font-semibold text-white rounded-lg transition-all duration-300 ease-in-out bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md flex items-center"
          >
            Copiar Blueprint
          </button>
           <button
            onClick={onOpenVisualizer}
            className="py-3 px-6 font-semibold text-white rounded-lg transition-all duration-300 ease-in-out bg-slate-600 hover:bg-slate-500 shadow-md flex items-center"
          >
            Visualizar Projeto
          </button>
        </div>
      </Card>

    </div>
  );
};

export default ActionsTab;
