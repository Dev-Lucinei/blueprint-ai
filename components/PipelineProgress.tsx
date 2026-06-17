import React, { useEffect, useState } from 'react';
import { Search, Layers, Cpu, Map, Check, Loader2, AlertCircle } from 'lucide-react';

interface Step {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

interface PipelineProgressProps {
  steps: Step[];
}

const stepIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  scout: Search,
  archaeologist: Layers,
  architect: Cpu,
  cartographer: Map,
};

const PipelineProgress: React.FC<PipelineProgressProps> = ({ steps }) => {
  return (
    <div className="w-full">
      {/* ===== DESKTOP: Layout Horizontal ===== */}
      <div className="hidden md:flex items-center justify-between gap-2">
        {steps.map((step, i) => {
          const Icon = stepIcons[step.id] || Search;
          const isLast = i === steps.length - 1;
          const prevDone = i > 0 && steps[i - 1].status === 'done';
          const isCurrent = step.status === 'running';

          return (
            <React.Fragment key={step.id}>
              {/* Step Card — 80x80px, border-radius 12px */}
              <div className="flex flex-col items-center gap-2.5">
                <div
                  className={`
                    relative flex items-center justify-center
                    rounded-xl border-2 transition-all duration-300
                    ${isCurrent ? 'animate-pulse-glow' : ''}
                  `}
                  style={{
                    width: 80,
                    height: 80,
                    backgroundColor: getStatusBg(step.status),
                    borderColor: getStatusBorder(step.status),
                    boxShadow: isCurrent
                      ? '0 0 20px var(--accent-glow)'
                      : step.status === 'done'
                      ? '0 0 8px rgba(16, 185, 129, 0.2)'
                      : 'none',
                  }}
                  role="status"
                  aria-label={`${step.name}: ${getStatusLabel(step.status)}`}
                >
                  {/* Ícone do step */}
                  {step.status === 'done' ? (
                    <Check
                      className="w-6 h-6 transition-colors duration-300"
                      style={{ color: 'var(--success)' }}
                      aria-hidden="true"
                    />
                  ) : step.status === 'running' ? (
                    <Loader2
                      className="w-6 h-6 animate-spin transition-colors duration-300"
                      style={{ color: 'var(--accent)' }}
                      aria-hidden="true"
                    />
                  ) : step.status === 'error' ? (
                    <AlertCircle
                      className="w-6 h-6 transition-colors duration-300"
                      style={{ color: 'var(--danger)' }}
                      aria-hidden="true"
                    />
                  ) : (
                    <Icon
                      className="w-6 h-6 transition-colors duration-300"
                      style={{ color: 'var(--text-muted)' }}
                      aria-hidden="true"
                    />
                  )}

                  {/* Pulse ring no step ativo */}
                  {isCurrent && (
                    <div
                      className="absolute inset-0 rounded-xl border-2 border-[var(--accent)] opacity-30"
                      style={{
                        animation: 'pulse-glow 2s ease-in-out infinite',
                      }}
                    />
                  )}
                </div>

                {/* Label — 11px, uppercase */}
                <span
                  className="font-semibold uppercase tracking-wider transition-colors duration-300"
                  style={{
                    fontSize: 11,
                    color: getLabelColor(step.status),
                  }}
                >
                  {step.name}
                </span>
              </div>

              {/* Conector dinâmico entre steps */}
              {!isLast && (
                <ConnectorLine
                  isCompleted={step.status === 'done'}
                  isCurrent={isCurrent}
                  isNextDone={steps[i + 1]?.status === 'done'}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ===== MOBILE: Layout Vertical ===== */}
      <div className="flex flex-col md:hidden">
        {steps.map((step, i) => {
          const Icon = stepIcons[step.id] || Search;
          const isLast = i === steps.length - 1;
          const prevDone = i > 0 && steps[i - 1].status === 'done';
          const isCurrent = step.status === 'running';

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-4 py-3">
                {/* Step Card — 56x56px mobile */}
                <div
                  className={`
                    relative flex items-center justify-center flex-shrink-0
                    rounded-xl border-2 transition-all duration-300
                    ${isCurrent ? 'animate-pulse-glow' : ''}
                  `}
                  style={{
                    width: 56,
                    height: 56,
                    backgroundColor: getStatusBg(step.status),
                    borderColor: getStatusBorder(step.status),
                    boxShadow: isCurrent ? '0 0 16px var(--accent-glow)' : 'none',
                  }}
                >
                  {step.status === 'done' ? (
                    <Check className="w-5 h-5" style={{ color: 'var(--success)' }} />
                  ) : step.status === 'running' ? (
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--accent)' }} />
                  ) : step.status === 'error' ? (
                    <AlertCircle className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                  ) : (
                    <Icon className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>

                <div className="flex flex-col">
                  <span
                    className="font-semibold transition-colors duration-300"
                    style={{ color: getLabelColor(step.status) }}
                  >
                    {step.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {getStatusLabel(step.status)}
                  </span>
                </div>
              </div>

              {/* Conector vertical */}
              {!isLast && (
                <div
                  className="ml-[28px] w-0.5 rounded transition-colors duration-300"
                  style={{
                    height: 24,
                    backgroundColor: step.status === 'done' ? 'var(--success)' : 'var(--border-subtle)',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/* ===== Conector Horizontal Animado ===== */
function ConnectorLine({
  isCompleted,
  isCurrent,
  isNextDone,
}: {
  isCompleted: boolean;
  isCurrent: boolean;
  isNextDone: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const bgColor = isCompleted ? 'var(--success)' : 'var(--border-subtle)';

  return (
    <div className="flex-1 mx-1 flex items-center" style={{ height: 3 }}>
      <div
        className="w-full rounded-full transition-colors duration-500"
        style={{
          height: 3,
          backgroundColor: bgColor,
          /* Animação de preenchimento quando concluído */
          transform: mounted && isCompleted ? 'scaleX(1)' : isCompleted ? 'scaleX(0)' : 'scaleX(1)',
          transformOrigin: 'left center',
          transition: 'transform 500ms ease-in-out, background-color 300ms',
        }}
      />
    </div>
  );
}

/* ===== Helpers ===== */
function getStatusBg(status: Step['status']): string {
  switch (status) {
    case 'done':
      return 'color-mix(in srgb, var(--success) 15%, transparent)';
    case 'running':
      return 'var(--accent-glow)';
    case 'error':
      return 'color-mix(in srgb, var(--danger) 15%, transparent)';
    default:
      return 'var(--bg-input)';
  }
}

function getStatusBorder(status: Step['status']): string {
  switch (status) {
    case 'done':
      return 'var(--success)';
    case 'running':
      return 'var(--accent)';
    case 'error':
      return 'var(--danger)';
    default:
      return 'var(--border-subtle)';
  }
}

function getLabelColor(status: Step['status']): string {
  switch (status) {
    case 'done':
      return 'var(--success)';
    case 'running':
      return 'var(--accent)';
    case 'error':
      return 'var(--danger)';
    default:
      return 'var(--text-secondary)';
  }
}

function getStatusLabel(status: Step['status']): string {
  switch (status) {
    case 'done':
      return 'Concluído';
    case 'running':
      return 'Em execução';
    case 'error':
      return 'Erro';
    default:
      return 'Pendente';
  }
}

export default PipelineProgress;
