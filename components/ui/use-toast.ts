// Simple toast hook implementation
import { useState } from 'react';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = (props: ToastProps) => {
    // In a real implementation, this would display a toast notification
    // For now, we'll just log to console
    console.log(`TOAST: ${props.title} - ${props.description}`);
    setToasts((prev) => [...prev, props]);
    
    // In a real implementation, we'd return methods to dismiss the toast
    return {
      id: Date.now(),
      dismiss: () => {},
    };
  };

  return {
    toast,
    toasts,
  };
}
