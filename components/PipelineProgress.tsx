import React from 'react';
import { CheckCircle, Loader2, XCircle, Circle } from 'lucide-react';

interface Step {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

interface PipelineProgressProps {
  steps: Step[];
}

const statusStyles = {
  done: {
    icon: CheckCircle,
    iconClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/40',
    textClass: 'text-emerald-300',
    label: 'Concluído',
  },
  running: {
    icon: Loader2,
    iconClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10 border-blue-500/40',
    textClass: 'text-blue-300',
    label: 'Em execução',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-red-400',
    bgClass: 'bg-red-500/10 border-red-500/40',
    textClass: 'text-red-300',
    label: 'Erro',
  },
  pending: {
    icon: Circle,
    iconClass: 'text-slate-500',
    bgClass: 'bg-slate-800/50 border-slate-700/50',
    textClass: 'text-slate-400',
    label: 'Pendente',
  },
};

const PipelineProgress: React.FC<PipelineProgressProps> = ({ steps }) => {
  return (
    <div className="w-full">
      <div className="hidden md:flex items-center justify-between gap-2">
        {steps.map((step, i) => {
          const s = statusStyles[step.status];
          const Icon = s.icon;
          const isLast = i === steps.length - 1;
          const connectorDone = i > 0 && steps[i - 1].status === 'done';

          return (
            <React.Fragment key={step.id}>
              <div
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-500 min-w-[120px] flex-1 ${s.bgClass}`}
                role="status"
                aria-label={`${step.name}: ${s.label}`}
              >
                <Icon
                  className={`w-7 h-7 ${s.iconClass} ${step.status === 'running' ? 'animate-spin' : ''} transition-colors duration-300`}
                  aria-hidden="true"
                />
                <span className={`text-xs font-semibold uppercase tracking-wider ${s.textClass} transition-colors duration-300`}>
                  {step.name}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`h-0.5 flex-1 rounded transition-colors duration-500 ${connectorDone ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex flex-col md:hidden">
        {steps.map((step, i) => {
          const s = statusStyles[step.status];
          const Icon = s.icon;
          const isLast = i === steps.length - 1;
          const connectorDone = i > 0 && steps[i - 1].status === 'done';

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-4 py-3">
                <div className={`p-2.5 rounded-full border transition-all duration-500 ${s.bgClass}`}>
                  <Icon
                    className={`w-5 h-5 ${s.iconClass} ${step.status === 'running' ? 'animate-spin' : ''} transition-colors duration-300`}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-semibold ${s.textClass} transition-colors duration-300`}>{step.name}</span>
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
              </div>
              {!isLast && (
                <div
                  className={`ml-[26px] w-0.5 h-6 rounded transition-colors duration-500 ${connectorDone ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineProgress;
