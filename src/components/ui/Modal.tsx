// UiQ Modal Component - Accessible dialog component
'use client'
import { ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children: ReactNode
  className?: string
  closeOnBackdrop?: boolean
  showCloseButton?: boolean
}

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  className,
  closeOnBackdrop = true,
  showCloseButton = true
}: ModalProps) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl mx-4'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-accent-900/50 backdrop-blur-sm animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className={cn(
          "relative bg-white rounded-2xl shadow-modal animate-scale-in w-full",
          sizes[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={description ? "modal-description" : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-surface-200">
            <div>
              {title && (
                <h2 id="modal-title" className="text-h2 font-semibold text-accent-900">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="text-body-md text-accent-600 mt-1">
                  {description}
                </p>
              )}
            </div>
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 text-accent-500 hover:text-accent-700 hover:bg-surface-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

// Confirmation Modal Helper
export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
}

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "info"
}: ConfirmModalProps) => {
  const variants = {
    danger: {
      confirmClass: "bg-error-600 hover:bg-error-700 text-white",
      icon: "⚠"
    },
    warning: {
      confirmClass: "bg-warning-500 hover:bg-warning-600 text-white", 
      icon: "⚠"
    },
    info: {
      confirmClass: "bg-primary-600 hover:bg-primary-700 text-white",
      icon: "ℹ"
    }
  }

  const config = variants[variant]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className="text-4xl mb-4">{config.icon}</div>
        <h3 className="text-h3 font-semibold text-accent-900 mb-3">
          {title}
        </h3>
        <p className="text-body-md text-accent-600 mb-6">
          {description}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 text-body-md font-medium text-accent-700 bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={cn(
              "px-6 py-2 text-body-md font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
              config.confirmClass
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export { Modal, ConfirmModal }