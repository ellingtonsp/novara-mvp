import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border p-4 transform transition-all duration-300";
    
    if (!isVisible) {
      return `${baseStyles} translate-x-full opacity-0`;
    }
    
    return `${baseStyles} translate-x-0 opacity-100`;
  };

  const getIconStyles = () => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  const getBorderStyles = () => {
    switch (type) {
      case 'success':
        return 'border-green-200';
      case 'warning':
        return 'border-yellow-200';
      case 'error':
        return 'border-red-200';
      default:
        return 'border-blue-200';
    }
  };

  return (
    <div className={`${getToastStyles()} ${getBorderStyles()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// Toast manager for global toast notifications
interface ToastManagerProps {
  children: React.ReactNode;
}

interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
}

export const ToastManager: React.FC<ToastManagerProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Expose showToast globally
  React.useEffect(() => {
    (window as any).showToast = showToast;
    return () => {
      delete (window as any).showToast;
    };
  }, []);

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </>
  );
};

// Utility function to show toast
export const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 3000) => {
  if (typeof window !== 'undefined' && (window as any).showToast) {
    (window as any).showToast(message, type, duration);
  } else {
    // Fallback to console in development
    console.log(`[Toast] ${type.toUpperCase()}: ${message}`);
  }
}; 