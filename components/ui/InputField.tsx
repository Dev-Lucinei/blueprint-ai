import React from 'react';

interface InputFieldProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Ícone opcional à esquerda */
  icon?: React.ReactNode;
}

export function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  className = '',
  icon,
}: InputFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          {label}
          {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            block w-full p-3 rounded-lg text-sm
            bg-[var(--bg-input)] text-[var(--text-primary)]
            placeholder:text-[var(--text-muted)]
            border border-[var(--border-subtle)]
            focus:border-[var(--border-focus)]
            focus:shadow-[0_0_0_3px_var(--accent-glow)]
            focus:outline-none
            transition-all duration-150 ease-in-out
            disabled:opacity-40 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
          `}
        />
      </div>
    </div>
  );
}
