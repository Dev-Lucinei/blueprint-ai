import React, { useCallback, useRef, useState } from 'react';
import type { AIProvider, AppMode, FileObject } from '../../types';
import { Card } from '../ui/Card';
import { InputField } from '../ui/InputField';
import { TextAreaField } from '../ui/TextAreaField';
import FileItem from '../FileItem';
import { AiConfigSidebar } from './AiConfigSidebar';

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 100;

const TEXT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.md', '.css', '.html', '.txt'];
const COMPRESSED_EXTENSIONS = ['.zip', '.tar', '.gz', '.rar', '.7z'];

interface EditorContextoProps {
  // Configurações do projeto
  projectName: string;
  projectDeadline: string;
  projectDescription: string;
  // Conteúdo e arquivos
  contextText: string;
  files: FileObject[];
  // Configurações de IA
  aiProvider: AIProvider;
  aiModel: string;
  // Estado do app
  appMode: AppMode;
  isLoading: boolean;
  // Ações
  onUpdateProject: (p: { projectName?: string; projectDeadline?: string; projectDescription?: string }) => void;
  onSetContextText: (t: string) => void;
  onSetFiles: (filesOrUpdater: FileObject[] | ((prev: FileObject[]) => FileObject[])) => void;
  onRemoveFile: (i: number) => void;
  onSetAiConfig: (c: { provider?: AIProvider; model?: string }) => void;
  onSetAppMode: (m: AppMode) => void;
  onGenerate: () => void;
}

/**
 * EditorContexto — Componente unificado que combina as funcionalidades
 * de ProjectTab (configurações de projeto + IA) e ContentTab (upload de arquivos).
 *
 * Suporta drag & drop, upload de arquivos e pastas, e seleção de provedor/modelo de IA.
 */
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

  // --- Arquivos ---
  const processFiles = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);

    if (files.length + fileArray.length > MAX_FILES) {
      // Notificação inline — sem showToast prop para manter componente autocontido
      alert(`Limite de ${MAX_FILES} arquivos excedido.`);
      return;
    }

    const currentFiles = files;
    const newFileObjects: FileObject[] = fileArray.map((file: File) => ({
      file,
      content: '',
      status: 'pending' as const,
    }));

    // Adiciona arquivos de uma vez
    onSetFiles([...currentFiles, ...newFileObjects]);

    // Processa cada arquivo
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

    // Limpa inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (dirInputRef.current) dirInputRef.current.value = '';
  }, [files, onSetFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;
    processFiles(selectedFiles);
  };

  // --- Drag & Drop ---
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

  // --- Render ---
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Seção: Configuração do Projeto */}
      <Card>
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-indigo-300">Configurações do Projeto</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
          <div className="mt-6">
            <TextAreaField
              label="Descrição de Alto Nível"
              value={projectDescription}
              onChange={e => onUpdateProject({ projectDescription: e.target.value })}
              placeholder={`Template Sugerido:\n(1) Propósito de Negócio: [Qual problema resolve?]\n(2) Funcionalidades Críticas: [3-5 features principais]\n(3) Exclusões Conhecidas: [O que NÃO será implementado]`}
              rows={6}
            />
          </div>
        </div>
      </Card>

      {/* Seção: Configurações de IA */}
      <AiConfigSidebar
        aiProvider={aiProvider}
        aiModel={aiModel}
        onSetAiConfig={onSetAiConfig}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Seção: Contexto Adicional */}
      <Card>
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-indigo-300">Contexto Adicional</h2>
          <p className="text-sm text-slate-400 mt-1">
            Cole texto adicional, requisitos detalhados ou notas técnicas para fundamentar a documentação.
          </p>
        </div>
        <div className="p-6">
          <textarea
            className="w-full p-4 bg-slate-900/70 border border-slate-600 rounded-lg text-slate-100 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 transition min-h-[150px]"
            value={contextText}
            onChange={e => onSetContextText(e.target.value)}
            placeholder="Cole aqui especificações, trechos de código importantes, diagramas em ASCII ou requisitos não estruturados."
          />
        </div>
      </Card>

      {/* Seção: Upload de Arquivos */}
      <Card>
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-indigo-300">Anexar Arquivos</h2>
          <p className="text-sm text-slate-400 mt-1">
            Envie até {MAX_FILES} arquivos de suporte (.ts, .tsx, .js, .jsx, .py, .json, .md, .css, .html, .zip, .tar, .gz, .rar, .7z). Arraste e solte ou selecione abaixo.
          </p>
        </div>
        <div className="p-6">
          {/* Área de drag & drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
              ${isDragOver
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-600 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-900/50'
              }
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="mt-3 text-sm text-slate-400">
              <span className="font-semibold text-indigo-400">Arraste arquivos aqui</span> ou clique para selecionar
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Máximo {MAX_FILES} arquivos ({MAX_FILE_SIZE_MB}MB por arquivo)
            </p>
          </div>

          {/* Botões de upload */}
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
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= MAX_FILES}
              className="py-3 px-5 text-sm font-semibold text-white rounded-lg transition-all duration-300 ease-in-out bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Selecionar Arquivos
            </button>

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
            <button
              type="button"
              onClick={() => dirInputRef.current?.click()}
              disabled={files.length >= MAX_FILES}
              className="py-3 px-5 text-sm font-semibold text-white rounded-lg transition-all duration-300 ease-in-out bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Selecionar Pasta
            </button>
            <span className="ml-4 text-sm text-slate-400">{files.length} / {MAX_FILES} arquivos</span>
          </div>

          {/* Lista de arquivos */}
          <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 min-h-[100px] space-y-2">
            {files.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Nenhum arquivo anexado.</p>
            ) : (
              files.map((fileObj, index) => (
                <FileItem key={index} fileObject={fileObj} onRemove={() => onRemoveFile(index)} />
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Botão de Processamento */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg p-6">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isLoading || !projectDescription}
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Gerando...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {appMode === 'analise' ? 'Iniciar Análise' : 'Gerar Documentação Completa'}
            </>
          )}
        </button>
        {!projectDescription && (
          <p className="text-xs text-amber-400 mt-2 text-center">
            Preencha a descrição do projeto para habilitar a geração.
          </p>
        )}
      </div>
    </div>
  );
};

export default EditorContexto;
