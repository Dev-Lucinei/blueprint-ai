import React, { useState, useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';
import { GraphNode, GraphLink } from '../../types';
import KnowledgeGraph from '../KnowledgeGraph';
import GraphSidebar from '../GraphSidebar';
import KnowledgeGraphControls from '../KnowledgeGraphControls';
import { ExportToolbar } from '../workspace/ExportToolbar';

interface ResultsTabProps {
  markdown: string;
  isLoading: boolean;
  projectName: string;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  graphNodes?: GraphNode[];
  graphLinks?: GraphLink[];
}

type ViewMode = 'rendered' | 'raw' | 'graph';

const ResultsTab: React.FC<ResultsTabProps> = ({ markdown, isLoading, projectName, showToast, graphNodes = [], graphLinks = [] }) => {
  const [activeView, setActiveView] = useState<ViewMode>('rendered');
  const renderedContentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  const hasGraph = graphNodes.length > 0;

  useEffect(() => {
    if (activeView === 'rendered' && markdown && renderedContentRef.current) {
        const rawHtml = marked.parse(markdown) as string;
        const cleanHtml = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['id'], ADD_TAGS: ['section'] });
            renderedContentRef.current.innerHTML = cleanHtml;

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
                copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy`;
                copyBtn.onclick = () => {
                    if (code?.textContent) {
                        navigator.clipboard.writeText(code.textContent);
                        showToast('Code copied to clipboard!', 'success');
                    }
                };

                header.appendChild(langSpan);
                header.appendChild(copyBtn);

                pre.parentNode?.insertBefore(wrapper, pre);
                wrapper.appendChild(header);
                wrapper.appendChild(pre);
            });

            const headings = renderedContentRef.current.querySelectorAll('h1, h2, h3');
            const newToc: { id: string; text: string; level: number }[] = [];
            headings.forEach((h, i) => {
                const id = `heading-${i}`;
                h.id = id;
                newToc.push({
                    id,
                    text: h.textContent || '',
                    level: parseInt(h.tagName.substring(1), 10),
                });
            });
            setToc(newToc);

            try {
                mermaid.run({ nodes: renderedContentRef.current.querySelectorAll('.mermaid') });
            } catch(e) {
                console.error("Mermaid rendering error:", e);
            }
        }
  }, [markdown, activeView, showToast]);

  useEffect(() => {
    if (toc.length === 0 || activeView !== 'rendered') {
      return;
    }

    if (observerRef.current) {
        observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
        entries => {
            const intersectingEntries = entries.filter(e => e.isIntersecting);
            if (intersectingEntries.length > 0) {
                const topEntry = intersectingEntries.reduce((prev, current) =>
                    prev.boundingClientRect.top < current.boundingClientRect.top ? prev : current
                );

                const activeId = topEntry.target.id;
                document.querySelectorAll('.toc-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${activeId}`) {
                        link.classList.add('active');
                    }
                });
            }
        },
        { rootMargin: '-80px 0px -60% 0px' }
    );

    toc.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) observer.observe(el);
    });

    observerRef.current = observer;

    return () => {
        observer.disconnect();
    };
}, [toc, activeView]);

  const getTOCLinkClass = (level: number) => {
      if (level === 1) return "font-bold text-indigo-300";
      if (level === 2) return "pl-4 text-slate-200 hover:text-white";
      return "pl-8 text-sm text-slate-400 hover:text-slate-200";
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      showToast('Blueprint copiado para a área de transferência!', 'success');
    } catch (err) {
      showToast('Erro ao copiar conteúdo', 'error');
    }
  };

  const handleDownload = () => {
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

  const handleZoomIn = useCallback(() => {
    const container = graphContainerRef.current?.querySelector('canvas');
    if (!container) return;
    const wheel = new WheelEvent('wheel', { deltaY: -120, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
    container.dispatchEvent(wheel);
  }, []);

  const handleZoomOut = useCallback(() => {
    const container = graphContainerRef.current?.querySelector('canvas');
    if (!container) return;
    const wheel = new WheelEvent('wheel', { deltaY: 120, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
    container.dispatchEvent(wheel);
  }, []);

  const handleCenter = useCallback(() => {
    setSelectedNode(null);
    const canvas = graphContainerRef.current?.querySelector('canvas');
    if (canvas) {
      canvas.dispatchEvent(new MouseEvent('mouseup'));
    }
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

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-800/50 rounded-2xl border border-slate-700">
            <svg className="animate-spin h-12 w-12 text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <h3 className="text-xl font-semibold text-white mb-2">Gerando seu Blueprint...</h3>
            <p className="text-slate-400 max-w-md">Aguarde um momento enquanto a IA constrói a documentação completa do seu projeto.</p>
        </div>
    );
  }

  if (!markdown && !hasGraph) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-800/50 rounded-2xl border border-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <h3 className="text-xl font-semibold text-slate-400 mb-2">Nenhum Resultado Disponível</h3>
            <p className="text-slate-500 max-w-md">Preencha os detalhes na aba "Projeto" e gere a documentação para visualizar os resultados aqui.</p>
        </div>
    );
  }

  return (
    <div className="animate-fade-in bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg p-6">
        <div className="border-b border-slate-700 mb-4 pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex space-x-1">
                    <button onClick={() => setActiveView('rendered')} className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${activeView === 'rendered' ? 'bg-slate-700 text-indigo-400' : 'text-slate-400 hover:bg-slate-700/50'}`}>Visualização Formatada</button>
                    <button onClick={() => setActiveView('raw')} className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${activeView === 'raw' ? 'bg-slate-700 text-indigo-400' : 'text-slate-400 hover:bg-slate-700/50'}`}>Markdown Raw</button>
                    {hasGraph && (
                      <button onClick={() => setActiveView('graph')} className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${activeView === 'graph' ? 'bg-slate-700 text-indigo-400' : 'text-slate-400 hover:bg-slate-700/50'}`}>Grafo</button>
                    )}
                </div>
                <div className="flex space-x-2">
                    <button onClick={handleCopy} className="flex items-center px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors border border-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Copiar
                    </button>
                    <button onClick={handleDownload} className="flex items-center px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors border border-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Baixar .md
                    </button>
                </div>
            </div>
        </div>

        {markdown && (
          <div className="mb-4">
            <ExportToolbar markdown={markdown} projectName={projectName} />
          </div>
        )}

        <div className={activeView === 'rendered' ? 'flex gap-8' : 'hidden'}>
            {toc.length > 0 && (
                <aside className="w-64 flex-shrink-0 hidden lg:block">
                    <div className="sticky top-24">
                        <h3 className="font-semibold text-slate-300 mb-3">Sumário</h3>
                        <nav className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                            {toc.map(item => (
                                <a key={item.id} href={`#${item.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className={`toc-link block transition-colors text-sm px-2 py-1.5 rounded-md ${getTOCLinkClass(item.level)}`}>{item.text}</a>
                            ))}
                        </nav>
                    </div>
                </aside>
            )}
            <div ref={renderedContentRef} className="markdown-body prose-invert max-w-none flex-1 min-w-0 prose-headings:text-indigo-300 prose-a:text-indigo-400 prose-strong:text-amber-300">
            </div>
        </div>

        <div className={activeView === 'raw' ? 'block' : 'hidden'}>
            <textarea
                readOnly
                value={markdown}
                className="w-full h-[calc(100vh-250px)] bg-slate-900 text-slate-300 font-mono text-sm p-4 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
        </div>

        <div className={activeView === 'graph' ? 'block' : 'hidden'}>
          <div ref={graphContainerRef} className="flex gap-4 h-[calc(100vh-250px)] relative">
            <div className="flex-1 relative">
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
    </div>
  );
};

export default ResultsTab;
