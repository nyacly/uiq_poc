// UiQ Chip/Tag Component - For categories, skills, tags
import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  removable?: boolean
  selected?: boolean
  onRemove?: () => void
}

const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    removable = false,
    selected = false,
    onRemove,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
    
    const variants = {
      default: selected 
        ? 'bg-accent-100 text-accent-800 border border-accent-300' 
        : 'bg-surface-100 text-accent-700 border border-surface-300 hover:bg-surface-200',
      primary: selected
        ? 'bg-primary-600 text-white border border-primary-600'
        : 'bg-primary-100 text-primary-700 border border-primary-200 hover:bg-primary-200',
      secondary: selected
        ? 'bg-secondary-600 text-accent-900 border border-secondary-600'
        : 'bg-secondary-100 text-secondary-800 border border-secondary-200 hover:bg-secondary-200',
      outline: selected
        ? 'bg-primary-50 border-2 border-primary-500 text-primary-700'
        : 'bg-transparent border-2 border-accent-300 text-accent-700 hover:border-primary-400 hover:text-primary-600'
    }
    
    const sizes = {
      sm: 'px-2.5 py-1 text-caption-sm',
      md: 'px-3 py-1.5 text-caption-md', 
      lg: 'px-4 py-2 text-caption-lg'
    }

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {children}
        {removable && (
          <button
            type="button"
            className="ml-1.5 -mr-1 p-0.5 rounded-full hover:bg-black/10 focus:outline-none focus:bg-black/10"
            onClick={(e) => {
              e.stopPropagation()
              onRemove?.()
            }}
            aria-label="Remove"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </button>
    )
  }
)

Chip.displayName = 'Chip'

export { Chip }