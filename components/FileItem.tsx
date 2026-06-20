import React from 'react';
import { FileObject } from '../types';

interface FileItemProps {
  fileObject: FileObject;
  onRemove: () => void;
}

const FileItem: React.FC<FileItemProps> = ({ fileObject, onRemove }) => {
  const { file, status } = fileObject;

  const statusInfo = {
    pending: { text: 'Pendente', color: 'text-[var(--text-muted)]', icon: '...' },
    reading: { text: 'Lendo...', color: 'text-[var(--accent-light)]', icon: '...' },
    success: { text: 'Pronto', color: 'text-[var(--success)]', icon: '...' },
    error: { text: 'Erro', color: 'text-[var(--danger)]', icon: '...' },
  };

  return (
    <div className="flex items-center justify-between bg-[var(--bg-card-hover)] p-3 rounded-md animate-fade-in">
      <div className="flex items-center overflow-hidden">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[var(--accent-light)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div className="flex-1 overflow-hidden">
            <p className="text-sm text-[var(--text-primary)] truncate" title={file.name}>{file.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{(file.size / 1024).toFixed(2)} KB</p>
        </div>
      </div>
      <div className="flex items-center flex-shrink-0 ml-4">
        <span className={`text-xs font-medium mr-4 ${statusInfo[status].color}`}>
          {statusInfo[status].icon} {statusInfo[status].text}
        </span>
        <button onClick={onRemove} className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors rounded-full p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FileItem;
