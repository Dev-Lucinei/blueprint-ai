import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  /** Remove padding interno (para cards com header/body customizados) */
  noPadding?: boolean;
  /** Adiciona glow sutil no hover (para cards interativos) */
  glowOnHover?: boolean;
}

export function Card({
  title,
  children,
  className = '',
  hover = false,
  noPadding = false,
  glowOnHover = false,
}: CardProps) {
  const hoverClasses = hover
    ? 'hover:bg-[var(--bg-card-hover)] cursor-pointer'
    : '';
  const glowClasses = glowOnHover
    ? 'hover:shadow-[0_0_20px_var(--accent-glow)]'
    : '';

  return (
    <div
      className={`
        bg-[var(--bg-card)] rounded-xl
        ${noPadding ? '' : 'p-6'}
        transition-all duration-200 ease-in-out
        ${hoverClasses} ${glowClasses} ${className}
      `}
    >
      {title && (
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
}
