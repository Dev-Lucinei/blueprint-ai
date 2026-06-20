import { FileObject } from '../../types';

interface InjectStructureBtnProps {
  files: FileObject[];
  onInject: (structure: string) => void;
  disabled?: boolean;
}

export function InjectStructureBtn({ files, onInject, disabled = false }: InjectStructureBtnProps) {
  const generateStructure = (): string => {
    if (files.length === 0) return '';

    const structure = files.map(({ file }) => {
      const parts = file.name.split('/');
      const indent = '  '.repeat(parts.length - 1);
      const fileName = parts[parts.length - 1];
      return `${indent}${fileName}`;
    }).join('\n');

    return `## Estrutura de Arquivos

\`\`\`
${structure}
\`\`\`

`;
  };

  const handleClick = () => {
    const structure = generateStructure();
    if (structure) {
      onInject(structure);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || files.length === 0}
      className="px-3 py-1.5 text-xs bg-[var(--accent-glow)] text-[var(--accent-light)] border border-[var(--accent)]/30 rounded-md hover:bg-[var(--accent)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title="Inserir estrutura de arquivos no contexto"
    >
      Injetar Estrutura
    </button>
  );
}