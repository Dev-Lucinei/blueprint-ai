
import React, { useState, useEffect } from 'react';
import { LinkValidationResult } from '../types';

interface LinkValidatorProps {
  markdownContent: string;
}

// Mock function to check link status
// In a real-world scenario, this would be a backend call to avoid CORS issues.
const isKnownHost = (url: string, host: string): boolean => {
  try {
    const hostname = new URL(url).hostname;
    return hostname === host || hostname.endsWith('.' + host);
  } catch {
    return false;
  }
};

const checkLinkStatus = (url: string): Promise<LinkValidationResult> => {
  return new Promise(resolve => {
    setTimeout(() => {
      // Simulate different responses for demonstration
      if (isKnownHost(url, 'github.com') || isKnownHost(url, 'google.com') || isKnownHost(url, 'slack.com')) {
        resolve({ url, status: 200, statusText: 'OK' });
      } else if (isKnownHost(url, 'broken-link-example.com')) {
        resolve({ url, status: 404, statusText: 'Not Found' });
      } else if (isKnownHost(url, 'timeout-example.com')) {
        resolve({ url, status: 'error', statusText: 'Timeout' });
      } else {
        // Randomly succeed or fail for other links
        const isSuccess = Math.random() > 0.3;
        if (isSuccess) {
          resolve({ url, status: 200, statusText: 'OK' });
        } else {
          resolve({ url, status: 500, statusText: 'Server Error' });
        }
      }
    }, 500 + Math.random() * 1000); // Simulate network latency
  });
};

const LinkValidator: React.FC<LinkValidatorProps> = ({ markdownContent }) => {
  const [results, setResults] = useState<LinkValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const validateLinks = async () => {
      // 1. Extract Section 8.4 content
      const sectionMatch = markdownContent.match(/###\s+8\.4\s+CONTATOS E RECURSOS[\s\S]*?(?=###\s+9\.|$)/i);
      if (!sectionMatch) {
        setResults([]);
        return;
      }
      const sectionContent = sectionMatch[0];

      // 2. Extract all URLs
      const urlRegex = /https?:\/\/[^\s)]+/g;
      const urls = sectionContent.match(urlRegex) || [];
      const uniqueUrls = [...new Set(urls)];

      if (uniqueUrls.length === 0) {
        setResults([]);
        return;
      }
      
      setIsValidating(true);
      setResults(uniqueUrls.map(url => ({ url, status: 'checking', statusText: 'Verificando...' })));

      // 3. "Check" each URL
      const validationPromises = uniqueUrls.map(checkLinkStatus);
      const settledResults = await Promise.all(validationPromises);
      
      setResults(settledResults);
      setIsValidating(false);
    };

    if (markdownContent) {
      validateLinks();
    }
  }, [markdownContent]);

  if (results.length === 0 && !isValidating) {
    return null; // Don't render if no links are found in the relevant section
  }

  const validLinks = results.filter(r => r.status === 200).length;
  const totalLinks = results.length;
  const summaryColor = totalLinks > 0 && validLinks === totalLinks ? 'text-green-400' : 'text-yellow-400';

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Validação de Links Externos</h3>
            {isValidating ? (
                <span className="text-sm text-blue-400 flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    Verificando...
                </span>
            ) : (
                <span className={`text-sm font-bold ${summaryColor}`}>
                    {validLinks} de {totalLinks} links válidos
                </span>
            )}
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto p-3 bg-slate-900/50 rounded-lg border border-slate-700">
            {results.map(({ url, status, statusText }) => (
                <div key={url} className="flex items-center justify-between text-sm p-2 bg-slate-800 rounded">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="truncate text-slate-300 hover:text-indigo-400 transition-colors" title={url}>
                        {url.length > 60 ? `${url.substring(0, 60)}...` : url}
                    </a>
                    <span className="flex items-center flex-shrink-0 ml-4 font-medium">
                        {status === 'checking' && <span className="text-blue-400">{statusText}</span>}
                        {status === 200 && <span className="text-green-400 flex items-center"><svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> {status} OK</span>}
                        {status !== 'checking' && status !== 200 && <span className="text-red-400 flex items-center"><svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg> {status} {statusText}</span>}
                    </span>
                </div>
            ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
            Nota: A verificação de links é simulada devido a restrições de segurança do navegador (CORS).
        </p>
    </div>
  );
};

export default LinkValidator;
