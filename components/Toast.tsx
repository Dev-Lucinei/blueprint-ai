import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const typeStyles = {
    success: {
      bg: 'bg-[var(--success)]/15 border-[var(--success)]',
      text: 'text-[var(--success)]',
      icon: <CheckCircle className="w-5 h-5" />,
    },
    error: {
      bg: 'bg-[var(--danger)]/15 border-[var(--danger)]',
      text: 'text-[var(--danger)]',
      icon: <XCircle className="w-5 h-5" />,
    },
    info: {
      bg: 'bg-[var(--accent)]/15 border-[var(--accent)]',
      text: 'text-[var(--accent-light)]',
      icon: <Info className="w-5 h-5" />,
    },
  };

  const styles = typeStyles[type];

  return (
    <div
      className={`
        fixed top-20 right-6 z-50
        px-4 py-3 rounded-lg border
        shadow-lg animate-slide-in
        ${styles.bg} ${styles.text}
      `}
      role="alert"
    >
      <div className="flex items-center gap-2">
        {styles.icon}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Toast;
