import React, { useCallback, useRef } from 'react';
import { FileObject } from '../../types';
import FileItem from '../FileItem';

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 5;

interface ContentTabProps {
  contextText: string;
  setContextText: (text: string) => void;
  files: FileObject[];
  // FIX: Correctly type `setFiles` to allow functional updates. This resolves all TypeScript errors in this file.
  setFiles: React.Dispatch<React.SetStateAction<FileObject[]>>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const Card: React.FC<{ children: React.ReactNode, title: string, description: string }> = ({ children, title, description }) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-slate-400 mt-1">{description}</p>
        <div className="mt-6">
          {children}
        </div>
      </div>
    </div>
);


const ContentTab: React.FC<ContentTabProps> = ({ contextText, setContextText, files, setFiles, showToast }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    if (files.length + selectedFiles.length > MAX_FILES) {
      showToast(`Limite de ${MAX_FILES} arquivos excedido.`, 'error');
      return;
    }

    const newFileObjects: FileObject[] = Array.from(selectedFiles).map((file: File) => ({
      file,
      content: '',
      status: 'pending',
    }));

    setFiles(prevFiles => [...prevFiles, ...newFileObjects]);

    newFileObjects.forEach((fileObject, index) => {
        const fileIndex = files.length + index;
        
        if (fileObject.file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setFiles(prev => prev.map((f, i) => i === fileIndex ? {...f, status: 'error'} : f));
            showToast(`Arquivo "${fileObject.file.name}" excede o limite de ${MAX_FILE_SIZE_MB}MB.`, 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadstart = () => {
            setFiles(prev => prev.map((f, i) => i === fileIndex ? {...f, status: 'reading'} : f));
        };
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setFiles(prev => prev.map((f, i) => i === fileIndex ? {...f, content, status: 'success'} : f));
        };
        reader.onerror = () => {
             setFiles(prev => prev.map((f, i) => i === fileIndex ? {...f, status: 'error'} : f));
        };
        
        const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.md', '.css', '.html', '.txt'];
        const isSupported = supportedExtensions.some(ext => fileObject.file.name.endsWith(ext)) || fileObject.file.type.startsWith('text/');
        
        if (isSupported) {
            reader.readAsText(fileObject.file);
        } else {
            showToast(`Arquivo "${fileObject.file.name}" não é um formato suportado.`, 'error');
            setFiles(prev => prev.map((f, i) => i === fileIndex ? {...f, content: "Conteúdo não suportado, não será incluído no prompt.", status: 'success'} : f));
        }
    });

    if(fileInputRef.current) fileInputRef.current.value = "";
    if(dirInputRef.current) dirInputRef.current.value = "";
  };
  
  const removeFile = (indexToRemove: number) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card 
        title="Adicionar Contexto" 
        description="Cole texto adicional, requisitos detalhados ou notas técnicas para fundamentar a documentação."
      >
        <textarea
          id="contextInput"
          className="w-full p-4 bg-slate-900/70 border border-slate-600 rounded-lg text-slate-100 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 transition min-h-[150px]"
          value={contextText}
          onChange={(e) => setContextText(e.target.value)}
          placeholder="Cole aqui especificações, trechos de código importantes, diagramas em ASCII ou requisitos não estruturados."
        ></textarea>
      </Card>
      
      <Card
        title="Anexar Arquivos"
        description={`Envie até ${MAX_FILES} arquivos de suporte (.ts, .tsx, .js, .jsx, .py, .json, .md, .css, .html). O conteúdo de texto será adicionado ao contexto.`}
       >
         <div className="flex flex-wrap gap-3 items-center">
             <input
                 type="file"
                 ref={fileInputRef}
                 className="hidden"
                 multiple
                 accept=".ts,.tsx,.js,.jsx,.py,.json,.md,.css,.html,.txt"
                 onChange={handleFileChange}
                 disabled={files.length >= MAX_FILES}
             />
             <button
                 type="button"
                 onClick={() => fileInputRef.current?.click()}
                 disabled={files.length >= MAX_FILES}
                 className="py-3 px-5 text-sm font-semibold text-white rounded-lg transition-all duration-300 ease-in-out bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center"
             >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
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
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                 Selecionar Pasta
             </button>
             <span className="ml-4 text-sm text-slate-400">{files.length} / {MAX_FILES} arquivos selecionados</span>
         </div>
 
         <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 min-h-[100px] space-y-2">
             {files.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Nenhum arquivo anexado.</p>
             ) : (
                 files.map((fileObj, index) => (
                     <FileItem key={index} fileObject={fileObj} onRemove={() => removeFile(index)} />
                 ))
             )}
         </div>
       </Card>
    </div>
  );
};


export default ContentTab;