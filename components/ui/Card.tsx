import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg ${className}`}>
      {children}
    </div>
  );
}