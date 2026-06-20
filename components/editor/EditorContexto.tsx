import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { AIProvider, AppMode, FileObject } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { InputField } from '../ui/InputField';
import { TextAreaField } from '../ui/TextAreaField';
import { Tooltip } from '../ui/Tooltip';
import FileItem from '../FileItem';
import { AiConfigSidebar } from './AiConfigSidebar';
import { FileTree } from './FileTree';
import { InjectStructureBtn } from './InjectStructureBtn';
import { extractArchive, isCompressedFile, getUnsupportedCompressedFormats } from '../../services/archiveExtractor';

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 100;

const TEXT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.md', '.css', '.html', '.txt'];

interface EditorContextoProps {
  projectName: string;
  projectDeadline: string;
  projectDescription: string;
  contextText: string;
  files: FileObject[];
  aiProvider: AIProvider;
  aiModel: string;
  appMode: AppMode;
  isLoading: boolean;
  onUpdateProject: (p: { projectName?: string; projectDeadline?: string; projectDescription?: string }) => void;
  onSetContextText: (t: string) => void;
  onSetFiles: (filesOrUpdater: FileObject[] | ((prev: FileObject[]) => FileObject[])) => void;
  onRemoveFile: (i: number) => void;
  onSetAiConfig: (c: { provider?: AIProvider; model?: string }) => void;
  onSetAppMode: (m: AppMode) => void;
  onGenerate: () => void;
}

const EditorContexto: React.FC<EditorContextoProps> = ({
  projectName,
  projectDeadline,
  projectDescription,
  contextText,
  files,
  aiProvider,
  aiModel,
  appMode,
  isLoading,
  onUpdateProject,
  onSetContextText,
  onSetFiles,
  onRemoveFile,
  onSetAiConfig,
  onSetAppMode,
  onGenerate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!projectDescription.trim()) missing.push('Descrição do projeto');
    return missing;
  }, [projectDescription]);
  const canProcess = missingFields.length === 0;

  const processFiles = useCallback(async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);

    if (files.length + fileArray.length > MAX_FILES) {
      alert(`Limite de ${MAX_FILES} arquivos excedido.`);
      return;
    }

    const currentFiles = files;
    const newFileObjects: FileObject[] = fileArray.map((file: File) => ({
      file,
      content: '',
      status: 'pending' as const,
    }));

    onSetFiles([...currentFiles, ...newFileObjects]);

    for (let index = 0; index < newFileObjects.length; index++) {
      const fileObject = newFileObjects[index];
      const fileIndex = currentFiles.length + index;

      if (fileObject.file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        onSetFiles(prev => prev.map((f, i) => i === fileIndex ? { ...f, status: 'error' } : f));
        alert(`Arquivo "${fileObject.file.name}" excede o limite de ${MAX_FILE_SIZE_MB}MB.`);
        continue;
      }

      const isTextSupported = TEXT_EXTENSIONS.some(ext => fileObject.file.name.endsWith(ext)) || fileObject.file.type.startsWith('text/');
      const unsupportedFormats = getUnsupportedCompressedFormats();
      const isUnsupportedCompressed = unsupportedFormats.some(ext => fileObject.file.name.toLowerCase().endsWith(ext));

      if (isTextSupported) {
        const reader = new FileReader();
        reader.onloadstart = () => {
          onSetFiles(prev => prev.map((f, i) => i === fileIndex ? { ...f, status: 'reading' } : f));
        };
        reader.onload = (e) => {
          const content = e.target?.result as string;
          onSetFiles(prev => prev.map((f, i) => i === fileIndex ? { ...f, content, status: 'success' } : f));
        };
        reader.onerror = () => {
          onSetFiles(prev => prev.map((f, i) => i === fileIndex ? { ...f, status: 'error' } : f));
        };
        reader.readAsText(fileObject.file);
      } else if (isCompressedFile(fileObject.file.name)) {
        try {
          onSetFiles(prev => prev.map((f, i) => i === fileIndex ? { ...f, status: 'reading' } : f));
          const extractedFiles = await extractArchive(fileObject.file);
          const content = extractedFiles.map(f => `--- ${f.name} ---\n${f.content}`).join('\n\n');
          onSetFiles(prev => prev.map((f, i) => i === fileIndex ? { ...f, content, status: 'success' } : f));
        } catch (err) {
          console.error('Erro ao extrair arquivo comprimido:', err);
          onSetFiles(prev => prev.map((f, i) => i === fileIndex ? { ...f, content: '[Erro ao extrair arquivo comprimido]', status: 'error' } : f));
        }
      } else if (isUnsupportedCompressed) {
        const ext = fileObject.file.name.split('.').pop()?.toLowerCase() || 'desconhecido';
        onSetFiles(prev => prev.map((f, i) => i === fileIndex ? { ...f, content: `[Formato .${ext} - Extracao nao suportada no browser]`, status: 'success' } : f));
      } else {
        alert(`Arquivo "${fileObject.file.name}" nao e um formato suportado.`);
        onSetFiles(prev => prev.map((f, i) => i === fileIndex ? { ...f, content: 'Conteudo nao suportado, nao sera incluido no prompt.', status: 'success' } : f));
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (dirInputRef.current) dirInputRef.current.value = '';
  }, [files, onSetFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;
    processFiles(selectedFiles);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Grid principal: 2 colunas — 60% / 40% */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna esquerda: Configuracoes do Projeto + IA (7/12 = ~58%) */}
        <div className="lg:col-span-7 space-y-6">
          <Card title="Configuracoes do Projeto">
            <div className="space-y-5">
              <InputField
                label="Nome do Projeto"
                value={projectName}
                onChange={e => onUpdateProject({ projectName: e.target.value })}
                placeholder="Ex: Sistema de Gestao de Vendas"
              />
              <InputField
                label="Prazo Estimado"
                type="date"
                value={projectDeadline}
                onChange={e => onUpdateProject({ projectDeadline: e.target.value })}
              />
              <TextAreaField
                label="Descricao de Alto Nivel"
                value={projectDescription}
                onChange={e => onUpdateProject({ projectDescription: e.target.value })}
                placeholder={`Template Sugerido:\n(1) Proposito de Negocio: [Qual problema resolve?]\n(2) Funcionalidades Criticas: [3-5 features principais]\n(3) Exclusoes Conhecidas: [O que NAO sera implementado]`}
                rows={6}
              />
            </div>
          </Card>

          <AiConfigSidebar
            aiProvider={aiProvider}
            aiModel={aiModel}
            onSetAiConfig={onSetAiConfig}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>

        {/* Coluna direita: Contexto + Arquivos (5/12 = ~42%) */}
        <div className="lg:col-span-5 space-y-6">
          <Card title="Contexto Adicional">
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Cole texto adicional, requisitos detalhados ou notas tecnicas para fundamentar a documentacao.
            </p>
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <InjectStructureBtn
                  files={files}
                  onInject={(structure) => onSetContextText(contextText + structure)}
                  disabled={files.length === 0}
                />
              </div>
              <textarea
                className="w-full p-4 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--accent-glow)] focus:outline-none transition-all duration-150 min-h-[150px] resize-y"
                value={contextText}
                onChange={e => onSetContextText(e.target.value)}
                placeholder="Cole aqui especificacoes, trechos de codigo importantes, diagramas em ASCII ou requisitos nao estruturados."
              />
            </div>
          </Card>

          <Card title="Anexar Arquivos">
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Envie ate {MAX_FILES} arquivos de suporte. Arraste e solte ou selecione abaixo.
            </p>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center
                transition-all duration-200 cursor-pointer
                ${
                  isDragOver
                    ? 'border-[var(--accent)] bg-[var(--accent-glow)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-input)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'
                }
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-12 w-12 text-[var(--text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--accent-light)]">
                  Arraste arquivos aqui
                </span>{' '}
                ou clique para selecionar
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Maximo {MAX_FILES} arquivos ({MAX_FILE_SIZE_MB}MB por arquivo)
              </p>
            </div>

            <div className="flex flex-wrap gap-3 items-center mt-4">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept=".ts,.tsx,.js,.jsx,.py,.json,.md,.css,.html,.txt,.zip,.tar,.gz,.rar,.7z"
                onChange={handleFileChange}
                disabled={files.length >= MAX_FILES}
              />
              <Button
                variant="ghost"
                size="md"
                onClick={() => fileInputRef.current?.click()}
                disabled={files.length >= MAX_FILES}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                }
              >
                Selecionar Arquivos
              </Button>

              <input
                type="file"
                ref={dirInputRef}
                className="hidden"
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFileChange}
                disabled={files.length >= MAX_FILES}
              />
              <Button
                variant="ghost"
                size="md"
                onClick={() => dirInputRef.current?.click()}
                disabled={files.length >= MAX_FILES}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                }
              >
                Selecionar Pasta
              </Button>

              <span className="ml-4 text-sm text-[var(--text-muted)]">
                {files.length} / {MAX_FILES} arquivos
              </span>
            </div>

            {files.length > 0 && (
              <div className="mb-4">
                <FileTree files={files} max_height="200px" />
              </div>
            )}

            <div className="mt-4 p-4 bg-[var(--bg-input)] rounded-lg min-h-[100px] space-y-2">
              {files.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                  Nenhum arquivo anexado.
                </p>
              ) : (
                files.map((fileObj, index) => (
                  <FileItem key={index} fileObject={fileObj} onRemove={() => onRemoveFile(index)} />
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Botao de Geracao — Footer fixo */}
      <div className="bg-[var(--bg-card)] rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        <Tooltip
          content={canProcess ? '' : `Faltou: ${missingFields.join(', ')}`}
          disabled={canProcess}
        >
          <Button
            variant="primary"
            size="lg"
            onClick={onGenerate}
            disabled={!canProcess || isLoading}
            className="w-full"
            icon={
              isLoading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )
            }
          >
            {isLoading ? 'Gerando...' : appMode === 'analise' ? 'Iniciar Analise' : 'Gerar Documentacao Completa'}
          </Button>
        </Tooltip>
        {!canProcess && (
          <p className="text-xs text-[var(--warning)] mt-2 text-center">
            Preencha a descricao do projeto para habilitar a geracao.
          </p>
        )}
      </div>
    </div>
  );
};

export default EditorContexto;
