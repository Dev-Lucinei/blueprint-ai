import React, { useState, useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';
import { GraphNode, GraphLink } from '../../types';
import KnowledgeGraph from '../KnowledgeGraph';
import GraphSidebar from '../GraphSidebar';
import KnowledgeGraphControls from '../KnowledgeGraphControls';
import { Button } from '../ui/Button';
import { Dropdown, DropdownItem } from '../ui/Dropdown';

interface ResultsTabProps {
  markdown: string;
  isLoading: boolean;
  projectName: string;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  graphNodes?: GraphNode[];
  graphLinks?: GraphLink[];
  onRefine?: (query: string) => Promise<void>;
  isRefining?: boolean;
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

type ViewMode = 'rendered' | 'raw' | 'graph';

const FIXED_SECTIONS = [
  { id: 'analise-funcional', label: 'Análise Funcional' },
  { id: 'diagramas-arquitetura', label: 'Diagramas de Arquitetura' },
  { id: 'modelo-dados', label: 'Modelo de Dados (ERD)' },
  { id: 'requisitos-tecnicos', label: 'Requisitos Técnicos' },
  { id: 'grafo-conhecimento', label: 'Grafo de Conhecimento' },
  { id: 'conclusao', label: 'Conclusão' },
];

/* ===== Debounce Hook ===== */
function useDebounce<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args: unknown[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
    }) as T,
    [delay]
  );
}

const ResultsTab: React.FC<ResultsTabProps> = ({
  markdown,
  isLoading,
  projectName,
  showToast,
  graphNodes = [],
  graphLinks = [],
  onRefine,
  isRefining = false,
  chatHistory = [],
}) => {
  const [activeView, setActiveView] = useState<ViewMode>('rendered');
  const renderedContentRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [refineQuery, setRefineQuery] = useState('');

  const hasGraph = graphNodes.length > 0;

  // ===== Export Dropdown Items =====
  const exportItems: DropdownItem[] = [
    { id: 'copy', label: 'Copiar para Área de Transferência', icon: <CopyIcon /> },
    { id: 'md', label: 'Baixar como .md', icon: <DownloadIcon /> },
    { id: 'json', label: 'Exportar como JSON', icon: <JsonIcon /> },
  ];

  const handleExportSelect = useCallback(
    (id: string) => {
      switch (id) {
        case 'copy':
          handleCopy();
          break;
        case 'md':
          handleDownloadMd();
          break;
        case 'json':
          handleExportJson();
          break;
      }
    },
    [markdown, projectName, showToast]
  );

  // ===== Render Markdown =====
  useEffect(() => {
    if (activeView === 'rendered' && markdown && renderedContentRef.current) {
      const rawHtml = marked.parse(markdown) as string;
      const cleanHtml = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['id'], ADD_TAGS: ['section'] });
      renderedContentRef.current.innerHTML = cleanHtml;

      // Wrap code blocks with header + copy button
      const preElements = renderedContentRef.current.querySelectorAll('pre');
      preElements.forEach(pre => {
        const code = pre.querySelector('code');
        const lang = code?.className.match(/language-(\S+)/)?.[1] || 'text';

        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';

        const header = document.createElement('div');
        header.className = 'code-block-header';

        const langSpan = document.createElement('span');
        langSpan.className = 'code-lang';
        langSpan.textContent = lang;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-code-btn';
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copiar`;
        copyBtn.onclick = () => {
          if (code?.textContent) {
            navigator.clipboard.writeText(code.textContent);
            showToast('Código copiado para a área de transferência!', 'success');
          }
        };

        header.appendChild(langSpan);
        header.appendChild(copyBtn);

        pre.parentNode?.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);
      });

      // Map headings to fixed section IDs
      const headings = renderedContentRef.current.querySelectorAll('h2');
      headings.forEach((h, i) => {
        if (i < FIXED_SECTIONS.length) {
          h.id = FIXED_SECTIONS[i].id;
        } else {
          h.id = `heading-${i}`;
        }
      });

      // Render Mermaid diagrams
      try {
        mermaid.run({ nodes: renderedContentRef.current.querySelectorAll('.mermaid') });
      } catch (e) {
        console.error('Mermaid rendering error:', e);
      }
    }
  }, [markdown, activeView, showToast]);

  // ===== IntersectionObserver with Debounce (50ms) =====
  const handleSectionChange = useDebounce((sectionId: string) => {
    setActiveSection(sectionId);
  }, 50);

  useEffect(() => {
    if (activeView !== 'rendered' || !renderedContentRef.current) return;

    const sectionIds = FIXED_SECTIONS.map(s => s.id).filter(id => {
      return renderedContentRef.current?.querySelector(`#${id}`);
    });

    if (observerRef.current) observerRef.current.disconnect();

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.reduce((prev, cur) =>
            prev.boundingClientRect.top < cur.boundingClientRect.top ? prev : cur
          );
          handleSectionChange(top.target.id);
        }
      },
      { root: contentScrollRef.current, rootMargin: '-80px 0px -60% 0px' }
    );

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [markdown, activeView, handleSectionChange]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      showToast('Blueprint copiado para a área de transferência!', 'success');
    } catch {
      showToast('Erro ao copiar conteúdo', 'error');
    }
  };

  const handleDownloadMd = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blueprint-${projectName.toLowerCase().replace(/\s+/g, '-') || 'projeto'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Download iniciado!', 'info');
  };

  const handleExportJson = () => {
    const data = {
      project: projectName,
      content: markdown,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blueprint-${projectName.toLowerCase().replace(/\s+/g, '-') || 'projeto'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('JSON exportado!', 'info');
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (refineQuery.trim() && onRefine && !isRefining) {
      await onRefine(refineQuery.trim());
      setRefineQuery('');
    }
  };

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const handleZoomIn = useCallback(() => {
    const canvas = graphContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }));
  }, []);

  const handleZoomOut = useCallback(() => {
    const canvas = graphContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }));
  }, []);

  const handleCenter = useCallback(() => {
    setSelectedNode(null);
    const canvas = graphContainerRef.current?.querySelector('canvas');
    if (canvas) canvas.dispatchEvent(new MouseEvent('mouseup'));
  }, []);

  const handleReset = useCallback(() => {
    setSelectedNode(null);
    const canvas = graphContainerRef.current?.querySelector('canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      canvas.dispatchEvent(new MouseEvent('mouseup', { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }));
    }
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = graphContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  }, []);

  const handleNodeSelect = useCallback((node: GraphNode | null) => {
    setSelectedNode(node);
  }, []);

  // ===== Loading State =====
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center min-h-[calc(100vh-56px)]">
        <div className="relative mb-6">
          <svg
            className="animate-spin"
            style={{ width: 56, height: 56, color: 'var(--accent)' }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              style={{ opacity: 0.75 }}
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          Gerando seu Blueprint...
        </h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
          Aguarde um momento enquanto a IA constrói a documentação completa do seu projeto.
        </p>
      </div>
    );
  }

  // ===== Empty State =====
  if (!markdown && !hasGraph) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center min-h-[calc(100vh-56px)]">
        <svg
          style={{ width: 80, height: 80, color: 'var(--text-muted)', marginBottom: 16 }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
          Nenhum Resultado Disponível
        </h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: 400 }}>
          Preencha os detalhes na aba "Editor" e gere a documentação para visualizar os resultados aqui.
        </p>
      </div>
    );
  }

  // ===== Main Layout =====
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 'calc(100vh - 56px)' }}>
      {/* ===== COLUNA ESQUERDA: SUMÁRIO (280px fixo) ===== */}
      <aside
        className="hidden md:flex flex-col"
        style={{
          width: 280,
          height: 'calc(100vh - 56px)',
          position: 'sticky',
          top: 56,
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          overflowY: 'auto',
        }}
      >
        {/* Header do Sumário */}
        <div
          style={{
            padding: '16px 20px',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
          }}
        >
          Sumário
        </div>

        {/* Botão Síntese */}
        <div style={{ padding: '0 16px', marginBottom: 12 }}>
          <Button
            variant="accent-outline"
            size="sm"
            className="w-full"
            onClick={() => {
              renderedContentRef.current?.scrollIntoView({ behavior: 'smooth' });
              setActiveView('rendered');
            }}
          >
            Síntese do Documento
          </Button>
        </div>

        {/* Lista de seções */}
        <nav style={{ padding: '8px 12px', flex: 1 }}>
          {FIXED_SECTIONS.map((section, idx) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-150"
                style={{
                  backgroundColor: isActive ? 'var(--accent-glow)' : 'transparent',
                  color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
                  fontSize: 13,
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  boxShadow: isActive ? '0 0 12px var(--accent-glow)' : 'none',
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontSize: 12, minWidth: 18 }}>
                  {idx + 1}.
                </span>
                {section.label}
              </button>
            );
          })}

          {/* Seção Grafo Interativo */}
          {hasGraph && (
            <button
              onClick={() => setActiveView('graph')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-150"
              style={{
                marginTop: 4,
                backgroundColor: activeView === 'graph' ? 'var(--accent-glow)' : 'transparent',
                color: activeView === 'graph' ? 'var(--accent-light)' : 'var(--text-secondary)',
                fontSize: 13,
                borderLeft: activeView === 'graph' ? '3px solid var(--accent)' : '3px solid transparent',
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontSize: 12, minWidth: 18 }}>7.</span>
              Grafo Interativo
            </button>
          )}
        </nav>
      </aside>

      {/* ===== COLUNA DIREITA: CONTEÚDO ===== */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* ===== HEADER STICKY ===== */}
        <div
          style={{
            position: 'sticky',
            top: 56,
            zIndex: 20,
            backgroundColor: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 24px',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Tabs — Visualização / Markdown Raw */}
          <div className="flex gap-1 h-full items-stretch">
            {([
              { mode: 'rendered' as ViewMode, label: 'Visualização Formatada' },
              { mode: 'raw' as ViewMode, label: 'Markdown Raw' },
            ]).map(tab => (
              <button
                key={tab.mode}
                onClick={() => setActiveView(tab.mode)}
                className="flex items-center px-3 transition-all duration-200"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: activeView === tab.mode ? 600 : 400,
                  color: activeView === tab.mode ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderBottom: activeView === tab.mode ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Ações — Copiar + Dropdown Exportar consolidado */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar
            </Button>

            {/* Dropdown Exportar consolidado */}
            <Dropdown
              trigger={
                <Button variant="ghost" size="sm">
                  Exportar
                  <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
              }
              items={exportItems}
              onSelect={handleExportSelect}
              align="right"
            />
          </div>
        </div>

        {/* ===== SCROLLABLE CONTENT AREA ===== */}
        <div ref={contentScrollRef} style={{ flex: 1, overflowY: 'auto' }}>
          {/* ===== CARD: REFINAR BLUEPRINT ===== */}
          {markdown && onRefine && (
            <div
              className="animate-fade-in"
              style={{
                margin: 24,
                backgroundColor: 'var(--bg-card)',
                borderRadius: 12,
                padding: 20,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: 16, height: 16, color: 'var(--accent)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Refinar Blueprint
                </span>
              </div>

              <form onSubmit={handleRefineSubmit} style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  value={refineQuery}
                  onChange={e => setRefineQuery(e.target.value)}
                  placeholder="Descreva o ajuste desejado..."
                  disabled={isRefining}
                  className="flex-1 px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] text-[13px] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] placeholder:text-[var(--text-muted)] disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={!refineQuery.trim() || isRefining}
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-white font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--accent)',
                  }}
                  onMouseEnter={e => {
                    if (refineQuery.trim() && !isRefining)
                      e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'var(--accent)';
                  }}
                >
                  {isRefining ? (
                    <svg
                      className="animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ width: 16, height: 16 }}
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    '→'
                  )}
                </button>
              </form>

              {/* Chat history */}
              {chatHistory.length > 0 && (
                <div
                  style={{
                    marginTop: 16,
                    maxHeight: 192,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 13,
                        backgroundColor:
                          msg.role === 'user' ? 'var(--accent-glow)' : 'var(--bg-card-hover)',
                        color:
                          msg.role === 'user' ? 'var(--accent-light)' : 'var(--text-secondary)',
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                      }}
                    >
                      {msg.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== RENDERED VIEW ===== */}
          {activeView === 'rendered' && (
            <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
              <div
                ref={renderedContentRef}
                style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  fontSize: 14,
                }}
              />
              <style>{`
                div[style*="max-width: 900px"] h2 {
                  font-size: 20px !important;
                  font-weight: 700 !important;
                  color: var(--text-primary) !important;
                  margin-top: 32px !important;
                  margin-bottom: 12px !important;
                  border-bottom: 1px solid var(--border-subtle);
                  padding-bottom: 8px;
                }
                div[style*="max-width: 900px"] h3 {
                  font-size: 16px !important;
                  font-weight: 700 !important;
                  color: var(--text-primary) !important;
                  margin-top: 24px !important;
                  margin-bottom: 8px !important;
                }
                div[style*="max-width: 900px"] p {
                  color: var(--text-secondary) !important;
                  line-height: 1.7 !important;
                  margin-bottom: 12px !important;
                }
                div[style*="max-width: 900px"] strong,
                div[style*="max-width: 900px"] b {
                  color: var(--text-primary) !important;
                }
                .code-block-wrapper {
                  margin: 16px 0;
                  border: 1px solid var(--border-subtle);
                  border-radius: 8px;
                  overflow: hidden;
                }
                .code-block-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 8px 12px;
                  background: var(--bg-card-hover);
                }
                .code-lang {
                  font-size: 11px;
                  font-weight: 600;
                  text-transform: uppercase;
                  color: var(--text-muted);
                  letter-spacing: 0.05em;
                }
                .copy-code-btn {
                  display: inline-flex;
                  align-items: center;
                  background: none;
                  border: none;
                  color: var(--text-muted);
                  font-size: 10px;
                  cursor: pointer;
                  padding: 2px 6px;
                  border-radius: 4px;
                  transition: all 100ms;
                }
                .copy-code-btn:hover {
                  color: var(--text-primary);
                  background: var(--bg-card-hover);
                }
                .code-block-wrapper pre {
                  margin: 0;
                  padding: 16px;
                  background: var(--bg-code);
                  border-radius: 0 0 8px 8px;
                  overflow-x: auto;
                }
                .code-block-wrapper pre code {
                  font-family: 'SF Mono', 'Fira Code', monospace;
                  font-size: 13px;
                  color: var(--text-secondary);
                }
                .mermaid {
                  margin: 16px 0;
                  border: 1px solid var(--border-subtle);
                  border-radius: 8px;
                  overflow: hidden;
                }
                .mermaid::before {
                  content: 'MERMAID';
                  display: block;
                  padding: 8px 12px;
                  background: var(--bg-card-hover);
                  font-size: 11px;
                  font-weight: 600;
                  text-transform: uppercase;
                  color: var(--text-muted);
                  letter-spacing: 0.05em;
                }
                .mermaid svg {
                  padding: 16px;
                  background: var(--bg-code);
                  border-radius: 0 0 8px 8px;
                  display: block;
                  width: 100%;
                }
                div[style*="max-width: 900px"] ul,
                div[style*="max-width: 900px"] ol {
                  padding-left: 24px;
                  margin: 12px 0;
                }
                div[style*="max-width: 900px"] li {
                  margin-bottom: 6px;
                  color: var(--text-secondary);
                  line-height: 1.7;
                }
                div[style*="max-width: 900px"] a {
                  color: var(--accent);
                  text-decoration: none;
                }
                div[style*="max-width: 900px"] a:hover {
                  text-decoration: underline;
                }
                div[style*="max-width: 900px"] table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 16px 0;
                }
                div[style*="max-width: 900px"] th,
                div[style*="max-width: 900px"] td {
                  padding: 8px 12px;
                  border: 1px solid var(--border-subtle);
                  text-align: left;
                  font-size: 13px;
                }
                div[style*="max-width: 900px"] th {
                  background: var(--bg-card-hover);
                  color: var(--text-primary);
                  font-weight: 600;
                }
                div[style*="max-width: 900px"] blockquote {
                  border-left: 3px solid var(--accent);
                  padding-left: 16px;
                  margin: 16px 0;
                  color: var(--text-muted);
                  font-style: italic;
                }
                div[style*="max-width: 900px"] hr {
                  border: none;
                  border-top: 1px solid var(--border-subtle);
                  margin: 24px 0;
                }
              `}</style>
            </div>
          )}

          {/* ===== RAW VIEW ===== */}
          {activeView === 'raw' && (
            <div style={{ padding: 24 }}>
              <textarea
                readOnly
                value={markdown}
                style={{
                  width: '100%',
                  height: 'calc(100vh - 200px)',
                  backgroundColor: 'var(--bg-code)',
                  color: 'var(--text-secondary)',
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  fontSize: 13,
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>
          )}

          {/* ===== GRAPH VIEW ===== */}
          {activeView === 'graph' && (
            <div style={{ padding: 24 }}>
              <div
                ref={graphContainerRef}
                style={{
                  display: 'flex',
                  gap: 16,
                  height: 'calc(100vh - 200px)',
                  position: 'relative',
                }}
              >
                <div style={{ flex: 1, position: 'relative' }}>
                  <KnowledgeGraph
                    nodes={graphNodes}
                    links={graphLinks}
                    onNodeSelect={handleNodeSelect}
                    selectedNodeId={selectedNode?.id}
                  />
                  <KnowledgeGraphControls
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onCenter={handleCenter}
                    onReset={handleReset}
                    onFullscreen={handleFullscreen}
                  />
                </div>
                <GraphSidebar
                  selectedNode={selectedNode}
                  totalNodes={graphNodes.length}
                  totalLinks={graphLinks.length}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ===== SVG Icons for Dropdown ===== */
function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function JsonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

export default ResultsTab;
