import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X, Info } from 'lucide-react';
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message, duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Helper functions for easy toast creation
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast('success', message, duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().addToast('error', message, duration),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().addToast('warning', message, duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast('info', message, duration),
};

const toastConfig: Record<
  ToastType,
  { icon: typeof CheckCircle; bgColor: string; borderColor: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
  },
};

function ToastItem({ toast: toastData }: { toast: ToastMessage }) {
  const { removeToast } = useToastStore();
  const [isExiting, setIsExiting] = useState(false);

  const config = toastConfig[toastData.type];
  const Icon = config.icon;

  useEffect(() => {
    if (toastData.duration && toastData.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => removeToast(toastData.id), 300);
      }, toastData.duration);
      return () => clearTimeout(timer);
    }
  }, [toastData.id, toastData.duration, removeToast]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => removeToast(toastData.id), 300);
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-lg border shadow-lg min-w-80 max-w-md
        ${config.bgColor} ${config.borderColor}
        transition-all duration-300 ease-in-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />
      <p className="flex-1 text-sm text-gray-800">{toastData.message}</p>
      <button
        onClick={handleClose}
        className="p-1 hover:bg-black/5 rounded transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toastData) => (
        <ToastItem key={toastData.id} toast={toastData} />
      ))}
    </div>
  );
}
