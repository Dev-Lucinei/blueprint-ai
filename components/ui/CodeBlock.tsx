import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
  showCopy?: boolean;
}

export function CodeBlock({ language, code, showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="rounded-lg overflow-hidden border border-[var(--border-subtle)] my-4">
      {/* Header */}
      <div className="bg-[var(--bg-card)] px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
          {language}
        </span>
        {showCopy && (
          <button
            onClick={handleCopy}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copiar
              </>
            )}
          </button>
        )}
      </div>

      {/* Code */}
      <pre className="bg-[var(--bg-code)] p-4 overflow-x-auto">
        <code className="text-sm font-mono text-[var(--text-primary)] leading-relaxed">
          {code}
        </code>
      </pre>
    </div>
  );
}
