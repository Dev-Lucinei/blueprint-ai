import { useState } from 'react';

interface ExportToolbarProps {
  markdown: string;
  projectName: string;
}

export function ExportToolbar({ markdown, projectName }: ExportToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleDownloadMd = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'blueprint'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const data = {
      project: projectName,
      content: markdown,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'blueprint'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleCopy}
        className="px-3 py-1.5 text-sm bg-gray-700/50 text-gray-300 border border-gray-600/50 rounded-md hover:bg-gray-600/50 transition-colors"
      >
        {copied ? '✓ Copiado!' : '📋 Copiar'}
      </button>
      <button
        onClick={handleDownloadMd}
        className="px-3 py-1.5 text-sm bg-gray-700/50 text-gray-300 border border-gray-600/50 rounded-md hover:bg-gray-600/50 transition-colors"
      >
        📥 Baixar .md
      </button>
      <button
        onClick={handleDownloadJson}
        className="px-3 py-1.5 text-sm bg-gray-700/50 text-gray-300 border border-gray-600/50 rounded-md hover:bg-gray-600/50 transition-colors"
      >
        📦 Exportar JSON
      </button>
    </div>
  );
}
