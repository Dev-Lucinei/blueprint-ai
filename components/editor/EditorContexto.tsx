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

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 100;

const TEXT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.md', '.css', '.html', '.txt'];
const COMPRESSED_EXTENSIONS = ['.zip', '.tar', '.gz', '.rar', '.7z'];

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

  const processFiles = useCallback((selectedFiles: FileList | File[]) => {
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

    newFileObjects.forEach((fileObject, index) => {
      const fileIndex = currentFiles.length + index;

      if (fileObject.file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        onSetFiles(prev => prev.map((f, i) => i === fileIndex ? { ...f, status: 'error' } : f));
        alert(`Arquivo "${fileObject.file.name}" excede o limite de ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }

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

      const isTextSupported = TEXT_EXTENSIONS.some(ext => fileObject.file.name.endsWith(ext)) || fileObject.file.type.startsWith('text/');
      const isCompressedSupported = COMPRESSED_EXTENSIONS.some(ext => fileObject.file.name.endsWith(ext)) || fileObject.file.type.includes('zip') || fileObject.file.type.includes('tar') || fileObject.file.type.includes('compressed');

      if (isTextSupported) {
        reader.readAsText(fileObject.file);
      } else if (isCompressedSupported) {
        onSetFiles(prev => prev.map((f, i) => i === fileIndex ? { ...f, content: '[Arquivo Compactado - Anexado com sucesso]', status: 'success' } : f));
      } else {
        alert(`Arquivo "${fileObject.file.name}" não é um formato suportado.`);
        onSetFiles(prev => prev.map((f, i) => i === fileIndex ? { ...f, content: 'Conteúdo não suportado, não será incluído no prompt.', status: 'success' } : f));
      }
    });

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
      {/* Grid principal: 2 colunas — 40% / 60% */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6">
        {/* Coluna esquerda: Configurações do Projeto + IA */}
        <div className="space-y-6">
          <Card>
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-lg font-semibold text-[var(--accent-light)]">
                Configurações do Projeto
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <InputField
                label="Nome do Projeto"
                value={projectName}
                onChange={e => onUpdateProject({ projectName: e.target.value })}
                placeholder="Ex: Sistema de Gestão de Vendas"
              />
              <InputField
                label="Prazo Estimado"
                type="date"
                value={projectDeadline}
                onChange={e => onUpdateProject({ projectDeadline: e.target.value })}
              />
              <TextAreaField
                label="Descrição de Alto Nível"
                value={projectDescription}
                onChange={e => onUpdateProject({ projectDescription: e.target.value })}
                placeholder={`Template Sugerido:\n(1) Propósito de Negócio: [Qual problema resolve?]\n(2) Funcionalidades Críticas: [3-5 features principais]\n(3) Exclusões Conhecidas: [O que NÃO será implementado]`}
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

        {/* Coluna direita: Contexto + Arquivos */}
        <div className="space-y-6">
          <Card>
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-lg font-semibold text-[var(--accent-light)]">
                Contexto Adicional
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Cole texto adicional, requisitos detalhados ou notas técnicas para fundamentar a documentação.
              </p>
            </div>
            <div className="p-6">
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
                  placeholder="Cole aqui especificações, trechos de código importantes, diagramas em ASCII ou requisitos não estruturados."
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-lg font-semibold text-[var(--accent-light)]">
                Anexar Arquivos
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Envie até {MAX_FILES} arquivos de suporte. Arraste e solte ou selecione abaixo.
              </p>
            </div>
            <div className="p-6">
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
                  Máximo {MAX_FILES} arquivos ({MAX_FILE_SIZE_MB}MB por arquivo)
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
            </div>
          </Card>
        </div>
      </div>

      {/* Botão de Geração — Footer fixo */}
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
            {isLoading ? 'Gerando...' : appMode === 'analise' ? 'Iniciar Análise' : 'Gerar Documentação Completa'}
          </Button>
        </Tooltip>
        {!canProcess && (
          <p className="text-xs text-[var(--warning)] mt-2 text-center">
            Preencha a descrição do projeto para habilitar a geração.
          </p>
        )}
      </div>
    </div>
  );
};

export default EditorContexto;
