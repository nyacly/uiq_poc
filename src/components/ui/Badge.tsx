// UiQ Badge Component - Verified, Premium, Member+ variants
import { cn } from '@/lib/utils'

export interface BadgeProps {
  variant?: 'verified' | 'premium' | 'member-plus' | 'new' | 'featured' | 'urgent' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
}

const Badge = ({ variant = 'verified', size = 'md', className, children }: BadgeProps) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full transition-all duration-200'
  
  const variants = {
    verified: 'bg-success-100 text-success-700 border border-success-200',
    premium: 'bg-secondary-100 text-secondary-800 border border-secondary-300',
    'member-plus': 'bg-primary-100 text-primary-700 border border-primary-200',
    new: 'bg-info-100 text-info-700 border border-info-200',
    featured: 'bg-accent-100 text-accent-700 border border-accent-300',
    urgent: 'bg-error-100 text-error-700 border border-error-200',
    outline: 'bg-white text-accent-700 border border-accent-200'
  }
  
  const sizes = {
    sm: 'px-2 py-1 text-caption-sm',
    md: 'px-2.5 py-1 text-caption-md',
    lg: 'px-3 py-1.5 text-caption-lg'
  }

  const icons = {
    verified: '✓',
    premium: '★',
    'member-plus': '♦',
    new: '•',
    featured: '◆',
    urgent: '!',
    outline: '∘'
  }

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)}>
      <span className="mr-1" aria-hidden="true">{icons[variant]}</span>
      {children}
    </span>
  )
}

export { Badge }