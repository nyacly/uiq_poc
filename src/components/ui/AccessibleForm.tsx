'use client'

import { 
  forwardRef, 
  InputHTMLAttributes, 
  TextareaHTMLAttributes, 
  SelectHTMLAttributes,
  useState,
  useId,
  ReactNode
} from 'react'
import { cn } from '@/lib/utils'
import { LiveRegion } from '@/lib/accessibility'

// Form Field Container
interface FormFieldProps {
  children: ReactNode
  className?: string
  testId?: string
}

const FormField = ({ children, className, testId }: FormFieldProps) => (
  <div className={cn('space-y-2', className)} data-testid={testId}>
    {children}
  </div>
)

// Accessible Label
interface FormLabelProps {
  htmlFor: string
  required?: boolean
  children: ReactNode
  className?: string
}

const FormLabel = ({ htmlFor, required, children, className }: FormLabelProps) => (
  <label 
    htmlFor={htmlFor}
    className={cn(
      'block text-sm font-medium text-gray-700',
      'focus-within:text-gray-900',
      className
    )}
  >
    {children}
    {required && (
      <span 
        className="text-red-500 ml-1" 
        aria-label="required"
        title="This field is required"
      >
        *
      </span>
    )}
  </label>
)

// Form Description/Help Text
interface FormDescriptionProps {
  id: string
  children: ReactNode
  className?: string
}

const FormDescription = ({ id, children, className }: FormDescriptionProps) => (
  <p 
    id={id}
    className={cn('text-sm text-gray-600', className)}
  >
    {children}
  </p>
)

// Error Message
interface FormErrorProps {
  id: string
  children: ReactNode
  className?: string
}

const FormError = ({ id, children, className }: FormErrorProps) => (
  <p 
    id={id}
    className={cn('text-sm text-red-700 flex items-center gap-1', className)}
    role="alert"
    aria-live="polite"
  >
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {children}
  </p>
)

// Accessible Input
export interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
  error?: string
  required?: boolean
  testId?: string
}

const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ 
    label, 
    description, 
    error, 
    required, 
    className, 
    testId,
    type = 'text',
    ...props 
  }, ref) => {
    const id = useId()
    const descriptionId = description ? `${id}-description` : undefined
    const errorId = error ? `${id}-error` : undefined
    
    const [hasInteracted, setHasInteracted] = useState(false)

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setHasInteracted(true)
      props.onBlur?.(e)
      
      // Announce validation result
      if (error) {
        LiveRegion.getInstance().announce(`${label} has an error: ${error}`, 'assertive')
      } else if (required && e.target.value) {
        LiveRegion.getInstance().announce(`${label} is valid`, 'polite')
      }
    }

    return (
      <FormField testId={testId}>
        <FormLabel htmlFor={id} required={required}>
          {label}
        </FormLabel>
        
        {description && (
          <FormDescription id={descriptionId}>
            {description}
          </FormDescription>
        )}
        
        <input
          ref={ref}
          id={id}
          type={type}
          className={cn(
            'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'placeholder-gray-400',
            'transition-colors duration-200',
            // High contrast mode support
            'focus:ring-offset-2',
            // Error state
            error && hasInteracted && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            // Success state for required fields
            required && !error && hasInteracted && props.value && 'border-green-300 focus:border-green-500 focus:ring-green-500',
            className
          )}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={!!error}
          aria-required={required}
          required={required}
          onBlur={handleBlur}
          {...props}
        />
        
        {error && (
          <FormError id={errorId!}>
            {error}
          </FormError>
        )}
      </FormField>
    )
  }
)

// Accessible Textarea
export interface AccessibleTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  description?: string
  error?: string
  required?: boolean
  maxLength?: number
  testId?: string
}

const AccessibleTextarea = forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({ 
    label, 
    description, 
    error, 
    required, 
    maxLength,
    className, 
    testId,
    value,
    ...props 
  }, ref) => {
    const id = useId()
    const descriptionId = description ? `${id}-description` : undefined
    const errorId = error ? `${id}-error` : undefined
    const counterId = maxLength ? `${id}-counter` : undefined
    
    const [hasInteracted, setHasInteracted] = useState(false)
    const currentLength = typeof value === 'string' ? value.length : 0

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setHasInteracted(true)
      props.onBlur?.(e)
      
      // Announce validation result
      if (error) {
        LiveRegion.getInstance().announce(`${label} has an error: ${error}`, 'assertive')
      } else if (required && e.target.value) {
        LiveRegion.getInstance().announce(`${label} is valid`, 'polite')
      }
    }

    return (
      <FormField testId={testId}>
        <FormLabel htmlFor={id} required={required}>
          {label}
        </FormLabel>
        
        {description && (
          <FormDescription id={descriptionId}>
            {description}
          </FormDescription>
        )}
        
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'placeholder-gray-400',
            'transition-colors duration-200',
            'resize-vertical min-h-[120px]',
            // High contrast mode support
            'focus:ring-offset-2',
            // Error state
            error && hasInteracted && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            // Success state for required fields
            required && !error && hasInteracted && value && 'border-green-300 focus:border-green-500 focus:ring-green-500',
            className
          )}
          aria-describedby={[descriptionId, errorId, counterId].filter(Boolean).join(' ') || undefined}
          aria-invalid={!!error}
          aria-required={required}
          maxLength={maxLength}
          value={value}
          onBlur={handleBlur}
          {...props}
        />
        
        {maxLength && (
          <div 
            id={counterId}
            className="text-sm text-gray-500 text-right"
            aria-live="polite"
          >
            {currentLength}/{maxLength} characters
          </div>
        )}
        
        {error && (
          <FormError id={errorId!}>
            {error}
          </FormError>
        )}
      </FormField>
    )
  }
)

// Accessible Select
export interface AccessibleSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  description?: string
  error?: string
  required?: boolean
  placeholder?: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
  testId?: string
}

const AccessibleSelect = forwardRef<HTMLSelectElement, AccessibleSelectProps>(
  ({ 
    label, 
    description, 
    error, 
    required, 
    placeholder,
    options,
    className, 
    testId,
    ...props 
  }, ref) => {
    const id = useId()
    const descriptionId = description ? `${id}-description` : undefined
    const errorId = error ? `${id}-error` : undefined
    
    const [hasInteracted, setHasInteracted] = useState(false)

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setHasInteracted(true)
      props.onBlur?.(e)
      
      // Announce validation result
      if (error) {
        LiveRegion.getInstance().announce(`${label} has an error: ${error}`, 'assertive')
      } else if (required && e.target.value) {
        LiveRegion.getInstance().announce(`${label} is valid`, 'polite')
      }
    }

    return (
      <FormField testId={testId}>
        <FormLabel htmlFor={id} required={required}>
          {label}
        </FormLabel>
        
        {description && (
          <FormDescription id={descriptionId}>
            {description}
          </FormDescription>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
              'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              'bg-white appearance-none',
              'transition-colors duration-200',
              // High contrast mode support
              'focus:ring-offset-2',
              // Error state
              error && hasInteracted && 'border-red-300 focus:border-red-500 focus:ring-red-500',
              // Success state for required fields
              required && !error && hasInteracted && props.value && 'border-green-300 focus:border-green-500 focus:ring-green-500',
              className
            )}
            aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
            aria-invalid={!!error}
            aria-required={required}
            onBlur={handleBlur}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {error && (
          <FormError id={errorId!}>
            {error}
          </FormError>
        )}
      </FormField>
    )
  }
)

// Accessible Checkbox
export interface AccessibleCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  description?: string
  error?: string
  testId?: string
}

const AccessibleCheckbox = forwardRef<HTMLInputElement, AccessibleCheckboxProps>(
  ({ 
    label, 
    description, 
    error, 
    className, 
    testId,
    ...props 
  }, ref) => {
    const id = useId()
    const descriptionId = description ? `${id}-description` : undefined
    const errorId = error ? `${id}-error` : undefined

    return (
      <FormField testId={testId}>
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className={cn(
              'mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded',
              'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200',
              className
            )}
            aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
            aria-invalid={!!error}
            {...props}
          />
          
          <div className="flex-1">
            <FormLabel htmlFor={id} className="text-sm leading-5">
              {label}
            </FormLabel>
            
            {description && (
              <FormDescription id={descriptionId}>
                {description}
              </FormDescription>
            )}
            
            {error && (
              <FormError id={errorId!}>
                {error}
              </FormError>
            )}
          </div>
        </div>
      </FormField>
    )
  }
)

// Set display names
AccessibleInput.displayName = 'AccessibleInput'
AccessibleTextarea.displayName = 'AccessibleTextarea'
AccessibleSelect.displayName = 'AccessibleSelect'
AccessibleCheckbox.displayName = 'AccessibleCheckbox'

export {
  FormField,
  FormLabel,
  FormDescription,
  FormError,
  AccessibleInput,
  AccessibleTextarea,
  AccessibleSelect,
  AccessibleCheckbox
}