// Simple toast hook implementation
// UiQ Community Platform - Toast notifications

import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface UseToastReturn {
  toast: (options: Omit<Toast, 'id'>) => void
  toasts: Toast[]
  dismiss: (id: string) => void
}

let toasts: Toast[] = []
let listeners: Array<(toasts: Toast[]) => void> = []

const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = Math.random().toString(36).substr(2, 9)
  const newToast = { ...toast, id }
  toasts = [...toasts, newToast]
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    dismissToast(id)
  }, 5000)
  
  listeners.forEach(listener => listener(toasts))
}

const dismissToast = (id: string) => {
  toasts = toasts.filter(toast => toast.id !== id)
  listeners.forEach(listener => listener(toasts))
}

export function useToast(): UseToastReturn {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>(toasts)

  const subscribe = useCallback((listener: (toasts: Toast[]) => void) => {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  }, [])

  useState(() => {
    const unsubscribe = subscribe(setCurrentToasts)
    return unsubscribe
  })

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    addToast(options)
  }, [])

  const dismiss = useCallback((id: string) => {
    dismissToast(id)
  }, [])

  return {
    toast,
    toasts: currentToasts,
    dismiss
  }
}