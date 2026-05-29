
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { GanttTask, KanbanTask } from '../types';

declare const Gantt: any;
declare const dragula: any;

interface ProjectVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdownContent: string;
}

const parseGanttTasks = (markdown: string): GanttTask[] => {
    if (!markdown) return [];
    const ganttSectionMatch = markdown.match(/3\.2\. Cronograma de Gantt \(Estimado\)[\s\S]*?(\|---[\s\S]*?)\n\n/);
    if (!ganttSectionMatch) return [];

    const tableRows = ganttSectionMatch[1].split('\n').slice(2); // Skip header and separator
    const tasks: GanttTask[] = [];

    tableRows.forEach(row => {
        const columns = row.split('|').map(c => c.trim());
        if (columns.length >= 5 && columns[1]) {
            const startDate = new Date(columns[2] || new Date());
            const endDate = new Date(columns[3] || new Date());
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                tasks.push({
                    id: columns[1],
                    name: columns[1],
                    start: columns[2],
                    end: columns[3],
                    progress: Math.floor(Math.random() * 100), // Random progress for visualization
                });
            }
        }
    });
    return tasks;
};

const parseKanbanTasks = (markdown: string): Record<string, KanbanTask[]> => {
    if (!markdown) return { pendente: [], emProgresso: [], emRevisao: [], bloqueado: [], concluido: [] };
    const wbsSectionMatch = markdown.match(/3\.1\. Work Breakdown Structure \(WBS\)[\s\S]*?(?=### 3\.2|### 4\.)/);
    if (!wbsSectionMatch) return { pendente: [], emProgresso: [], emRevisao: [], bloqueado: [], concluido: [] };

    const taskLines = wbsSectionMatch[0].match(/^\s*\d+\.\d+\..*$/gm) || [];
    const tasks = taskLines.map((line, index) => ({
        id: `task-${index}`,
        content: line.trim()
    }));
    
    // Distribute tasks randomly for demonstration
    const pendente = tasks.slice(0, Math.ceil(tasks.length / 3));
    const emProgresso = tasks.slice(Math.ceil(tasks.length / 3), Math.ceil(tasks.length / 3) * 2);
    const concluido = tasks.slice(Math.ceil(tasks.length / 3) * 2);

    return { pendente, emProgresso, emRevisao: [], bloqueado: [], concluido };
};


const ProjectVisualizerModal: React.FC<ProjectVisualizerModalProps> = ({ isOpen, onClose, markdownContent }) => {
  const [activeView, setActiveView] = useState<'gantt' | 'kanban'>('gantt');
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);
  const dragulaInstance = useRef<any>(null);

  const ganttTasks = useMemo(() => parseGanttTasks(markdownContent), [markdownContent]);
  const [kanbanTasks, setKanbanTasks] = useState(parseKanbanTasks(markdownContent));

  useEffect(() => {
    setKanbanTasks(parseKanbanTasks(markdownContent));
  }, [markdownContent])

  useEffect(() => {
    if (isOpen && activeView === 'gantt' && ganttRef.current && ganttTasks.length > 0 && !ganttInstance.current) {
        if (typeof Gantt !== 'undefined') {
            ganttInstance.current = new Gantt(ganttRef.current, ganttTasks, {
                header_height: 50,
                column_width: 30,
                step: 24,
                view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
                bar_height: 20,
                bar_corner_radius: 3,
                arrow_curve: 5,
                padding: 18,
                view_mode: 'Week',
                date_format: 'YYYY-MM-DD',
                language: 'pt',
            });
        }
    }

    if (isOpen && activeView === 'kanban' && !dragulaInstance.current) {
        if (typeof dragula !== 'undefined') {
            const containers = Array.from(document.querySelectorAll('[id^="kanban-"]'));
            if(containers.length > 0) {
                dragulaInstance.current = dragula(containers);
            }
        }
    }
    
    // Cleanup
    return () => {
        if (dragulaInstance.current) {
            dragulaInstance.current.destroy();
            dragulaInstance.current = null;
        }
        if(ganttInstance.current) {
             ganttInstance.current.clear();
             ganttInstance.current = null;
        }
    };
  }, [isOpen, activeView, ganttTasks]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
            <h2 className="text-2xl font-bold text-white">Visualizador de Projeto</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        
        <div className="px-6 pt-4 border-b border-slate-700 flex-shrink-0">
            <div className="flex space-x-1">
                <button onClick={() => setActiveView('gantt')} className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${activeView === 'gantt' ? 'bg-slate-700 text-indigo-400' : 'text-slate-400 hover:bg-slate-700/50'}`}>Diagrama de Gantt</button>
                <button onClick={() => setActiveView('kanban')} className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${activeView === 'kanban' ? 'bg-slate-700 text-indigo-400' : 'text-slate-400 hover:bg-slate-700/50'}`}>Quadro Kanban</button>
            </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
            <div className={activeView === 'gantt' ? 'block' : 'hidden'}>
                {ganttTasks.length > 0 ? (
                    <div ref={ganttRef} className="text-slate-300"></div>
                ) : (
                    <p className="text-slate-400 text-center">Nenhuma tarefa de cronograma encontrada na Seção 3.2 do documento.</p>
                )}
            </div>
            <div className={activeView === 'kanban' ? 'block' : 'hidden'}>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(kanbanTasks).map(([status, tasks]) => (
                        <div key={status} className="bg-slate-900/50 p-3 rounded-lg">
                            <h3 className="font-semibold text-sm text-indigo-300 mb-3 text-center uppercase tracking-wider">{status.replace(/([A-Z])/g, ' $1').trim()}</h3>
                            <div id={`kanban-${status.toLowerCase()}`} className="space-y-3 min-h-[200px] p-1">
                                {/* Fix: Add type assertion to 'tasks' to resolve incorrect type inference. */}
                                {(tasks as KanbanTask[]).map(task => (
                                    <div key={task.id} className="bg-slate-700 p-3 rounded-md shadow-md cursor-grab text-sm text-slate-200">{task.content}</div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectVisualizerModal;