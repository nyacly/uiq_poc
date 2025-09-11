'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FocusTrap, LiveRegion, focusManagement } from '@/lib/accessibility'
import { AccessibleButton } from './AccessibleButton'

export interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children: ReactNode
  className?: string
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  initialFocus?: React.RefObject<HTMLElement>
  finalFocus?: React.RefObject<HTMLElement>
  role?: 'dialog' | 'alertdialog'
  testId?: string
}

const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  className,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  initialFocus,
  finalFocus,
  role = 'dialog',
  testId
}: AccessibleModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [focusTrap, setFocusTrap] = useState<FocusTrap | null>(null)
  const [previouslyFocusedElement, setPreviouslyFocusedElement] = useState<HTMLElement | null>(null)
  const [mounted, setMounted] = useState(false)

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Focus management
  useEffect(() => {
    if (!mounted) return

    if (isOpen) {
      // Store currently focused element
      setPreviouslyFocusedElement(focusManagement.storeFocus())
      
      // Announce modal opening
      const modalTitle = title || 'Dialog opened'
      LiveRegion.getInstance().announce(modalTitle, 'assertive')
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
      
      // Set up focus trap after modal renders
      const timer = setTimeout(() => {
        if (modalRef.current) {
          const trap = new FocusTrap(modalRef.current)
          trap.activate()
          setFocusTrap(trap)
          
          // Focus initial element
          if (initialFocus?.current) {
            initialFocus.current.focus()
          } else if (closeButtonRef.current && showCloseButton) {
            closeButtonRef.current.focus()
          }
        }
      }, 100)

      return () => clearTimeout(timer)
    } else {
      // Clean up when closing
      document.body.style.overflow = 'unset'
      
      if (focusTrap) {
        focusTrap.deactivate()
        setFocusTrap(null)
      }
      
      // Restore focus to previously focused element or specified element
      const elementToFocus = finalFocus?.current || previouslyFocusedElement
      if (elementToFocus) {
        focusManagement.restoreFocus(elementToFocus)
      }
    }
  }, [isOpen, mounted, title, initialFocus, finalFocus, showCloseButton, focusTrap, previouslyFocusedElement])

  // Keyboard event handling
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeOnEscape, onClose])

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && event.target === backdropRef.current) {
      onClose()
    }
  }

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl mx-4'
  }

  if (!mounted || !isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-testid={testId}
    >
      {/* Backdrop */}
      <div 
        ref={backdropRef}
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm",
          "transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className={cn(
          "relative bg-white rounded-lg shadow-xl w-full",
          "transition-all duration-200 motion-reduce:transition-none",
          "max-h-[90vh] overflow-hidden flex flex-col",
          sizes[size],
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0",
          className
        )}
        role={role}
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={description ? "modal-description" : undefined}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || description || showCloseButton) && (
          <div className="flex items-start justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex-1">
              {title && (
                <h2 
                  id="modal-title" 
                  className="text-xl font-semibold text-gray-900 pr-8"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p 
                  id="modal-description" 
                  className="text-sm text-gray-600 mt-1"
                >
                  {description}
                </p>
              )}
            </div>
            
            {showCloseButton && (
              <AccessibleButton
                ref={closeButtonRef}
                variant="text"
                size="sm"
                onClick={onClose}
                ariaLabel="Close dialog"
                icon={<X className="w-5 h-5" />}
                className="flex-shrink-0 -mr-2 -mt-2"
                testId={testId ? `${testId}-close` : 'modal-close'}
              />
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

// Accessible Alert Dialog variant
export interface AlertDialogProps extends Omit<AccessibleModalProps, 'role'> {
  severity?: 'info' | 'warning' | 'error' | 'success'
  primaryAction?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'danger'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

const AlertDialog = ({
  severity = 'info',
  primaryAction,
  secondaryAction,
  children,
  ...modalProps
}: AlertDialogProps) => {
  const severityConfig = {
    info: { icon: 'ℹ️', color: 'text-blue-600' },
    warning: { icon: '⚠️', color: 'text-yellow-600' },
    error: { icon: '❌', color: 'text-red-600' },
    success: { icon: '✅', color: 'text-green-600' }
  }

  const config = severityConfig[severity]

  return (
    <AccessibleModal
      {...modalProps}
      role="alertdialog"
      size="sm"
    >
      <div className="text-center">
        <div className={cn("text-4xl mb-4", config.color)}>
          {config.icon}
        </div>
        
        <div className="mb-6">
          {children}
        </div>
        
        {(primaryAction || secondaryAction) && (
          <div className="flex gap-3 justify-center">
            {secondaryAction && (
              <AccessibleButton
                variant="outline"
                onClick={secondaryAction.onClick}
                testId="alert-secondary-action"
              >
                {secondaryAction.label}
              </AccessibleButton>
            )}
            {primaryAction && (
              <AccessibleButton
                variant={primaryAction.variant || 'primary'}
                onClick={primaryAction.onClick}
                testId="alert-primary-action"
              >
                {primaryAction.label}
              </AccessibleButton>
            )}
          </div>
        )}
      </div>
    </AccessibleModal>
  )
}

AccessibleModal.displayName = 'AccessibleModal'

export { AccessibleModal, AlertDialog }