'use client'

import { ButtonHTMLAttributes, forwardRef, useRef } from 'react'
import { cn } from '@/lib/utils'
import { LiveRegion } from '@/lib/accessibility'

export interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  tooltip?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  announceOnClick?: string
  testId?: string
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading, 
    icon,
    iconPosition = 'left',
    tooltip,
    ariaLabel,
    ariaDescribedBy,
    announceOnClick,
    testId,
    children, 
    disabled, 
    onClick,
    ...props 
  }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const isDisabled = disabled || loading

    // Enhanced base styles with proper focus indicators and contrast
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'relative overflow-hidden',
      // High contrast focus ring for visibility
      'focus:ring-blue-500 focus:ring-offset-white',
      // Ensure proper touch targets (44px minimum)
      'min-h-[44px] touch-manipulation',
      // Reduced motion support
      'motion-reduce:transition-none'
    )
    
    const variants = {
      primary: cn(
        'bg-red-600 text-white border-2 border-red-600',
        'hover:bg-red-700 hover:border-red-700',
        'active:bg-red-800 active:border-red-800',
        'focus:ring-red-500'
      ),
      secondary: cn(
        'bg-gray-100 text-gray-900 border-2 border-gray-300',
        'hover:bg-gray-200 hover:border-gray-400',
        'active:bg-gray-300 active:border-gray-500',
        'focus:ring-gray-500'
      ),
      outline: cn(
        'border-2 border-red-600 text-red-600 bg-white',
        'hover:bg-red-50 hover:border-red-700 hover:text-red-700',
        'active:bg-red-100 active:border-red-800 active:text-red-800',
        'focus:ring-red-500'
      ),
      text: cn(
        'text-red-600 bg-transparent border-2 border-transparent',
        'hover:text-red-700 hover:bg-red-50',
        'active:text-red-800 active:bg-red-100',
        'focus:ring-red-500 focus:ring-offset-0'
      ),
      danger: cn(
        'bg-red-600 text-white border-2 border-red-600',
        'hover:bg-red-700 hover:border-red-700',
        'active:bg-red-800 active:border-red-800',
        'focus:ring-red-500'
      )
    }
    
    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-md min-h-[40px] gap-2',
      md: 'px-6 py-3 text-base rounded-lg min-h-[44px] gap-2',
      lg: 'px-8 py-4 text-lg rounded-xl min-h-[48px] gap-3'
    }

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) return

      // Announce action to screen readers
      if (announceOnClick) {
        LiveRegion.getInstance().announce(announceOnClick, 'polite')
      }

      onClick?.(event)
    }

    // Loading spinner component
    const LoadingSpinner = () => (
      <svg
        className={cn(
          'animate-spin',
          size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    )

    return (
      <button
        ref={ref || buttonRef}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isDisabled}
        onClick={handleClick}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-describedby={ariaDescribedBy}
        aria-busy={loading}
        title={tooltip}
        data-testid={testId}
        {...props}
      >
        {/* Loading state */}
        {loading && (
          <>
            <LoadingSpinner />
            <span className="sr-only">Loading...</span>
          </>
        )}
        
        {/* Icon before content */}
        {!loading && icon && iconPosition === 'left' && (
          <span className="flex-shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
        
        {/* Button content */}
        {!loading && children && (
          <span className={cn(icon && 'truncate')}>
            {children}
          </span>
        )}
        
        {/* Icon after content */}
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'

export { AccessibleButton }