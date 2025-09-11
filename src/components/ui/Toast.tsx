// UiQ Toast Component - Success, error, warning, info notifications
'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration || 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer() {
  const { toasts } = useToast()

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast()

  const variants = {
    success: {
      className: 'bg-success-50 border-success-200 text-success-800',
      icon: '✓'
    },
    error: {
      className: 'bg-error-50 border-error-200 text-error-800',
      icon: '✕'
    },
    warning: {
      className: 'bg-warning-50 border-warning-200 text-warning-800',
      icon: '⚠'
    },
    info: {
      className: 'bg-info-50 border-info-200 text-info-800',
      icon: 'ℹ'
    }
  }

  const variant = variants[toast.type]

  return (
    <div 
      className={cn(
        "border rounded-lg p-4 shadow-toast animate-slide-up",
        variant.className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-lg mt-0.5" aria-hidden="true">
          {variant.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-body-md mb-1">
            {toast.title}
          </div>
          {toast.description && (
            <div className="text-body-sm opacity-90">
              {toast.description}
            </div>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-body-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={() => removeToast(toast.id)}
          className="flex-shrink-0 text-lg opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// Helper hook for common toast patterns
export function useToastHelpers() {
  const { addToast } = useToast()

  return {
    success: (title: string, description?: string) => 
      addToast({ type: 'success', title, description }),
    
    error: (title: string, description?: string) => 
      addToast({ type: 'error', title, description, duration: 8000 }),
    
    warning: (title: string, description?: string) => 
      addToast({ type: 'warning', title, description }),
    
    info: (title: string, description?: string) => 
      addToast({ type: 'info', title, description }),
  }
}