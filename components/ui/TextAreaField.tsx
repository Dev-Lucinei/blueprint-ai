import React from 'react';

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  className?: string;
}

export function TextAreaField({ label, value, onChange, placeholder, rows = 4, required = false, className = '' }: TextAreaFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="mt-1 block w-full p-3 bg-slate-900/70 border border-slate-600 rounded-lg text-slate-100 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 transition"
      ></textarea>
    </div>
  );
}