import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'icon' | 'accent-outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-[var(--accent)] text-white hover:bg-[var(--accent-light)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
  ghost:
    'bg-transparent border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]',
  danger:
    'bg-[var(--danger)] text-white hover:brightness-90 focus:ring-2 focus:ring-[var(--danger)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
  icon: 'bg-[var(--accent)] text-white w-10 h-10 flex items-center justify-center hover:bg-[var(--accent-light)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
  'accent-outline':
    'bg-transparent border border-[var(--accent)] text-[var(--accent-light)] hover:bg-[var(--accent-glow)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
  'accent-active':
    'bg-[var(--accent-glow)] border border-[var(--accent)] text-[var(--accent-light)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const isIconOnly = variant === 'icon';
  const baseClasses = [
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
    'transition-all duration-150 ease-in-out',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
    variantStyles[variant],
    isIconOnly ? '' : sizeStyles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={baseClasses} disabled={disabled} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
