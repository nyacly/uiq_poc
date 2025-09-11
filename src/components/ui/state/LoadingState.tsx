// UiQ Loading States - Skeletons and spinners
import { cn } from '@/lib/utils'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export interface SkeletonProps {
  className?: string
  lines?: number
  avatar?: boolean
  card?: boolean
}

const LoadingSpinner = ({ size = 'md', className }: LoadingSpinnerProps) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-surface-200 border-t-primary-600",
        sizes[size]
      )} />
    </div>
  )
}

const Skeleton = ({ className, lines = 3, avatar = false, card = false }: SkeletonProps) => {
  if (card) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="bg-surface-200 rounded-lg h-48 mb-4"></div>
        <div className="space-y-3">
          <div className="bg-surface-200 rounded h-4 w-3/4"></div>
          <div className="bg-surface-200 rounded h-4 w-1/2"></div>
          <div className="bg-surface-200 rounded h-4 w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("animate-pulse", className)}>
      {avatar && (
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-surface-200 rounded-full h-10 w-10"></div>
          <div className="space-y-2 flex-1">
            <div className="bg-surface-200 rounded h-4 w-1/4"></div>
            <div className="bg-surface-200 rounded h-3 w-1/3"></div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "bg-surface-200 rounded h-4",
              i === lines - 1 ? "w-2/3" : "w-full"
            )}
          />
        ))}
      </div>
    </div>
  )
}

const PageLoader = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <LoadingSpinner size="xl" className="mb-4" />
      <p className="text-body-lg text-accent-600">{message}</p>
    </div>
  )
}

const InlineLoader = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <div className="flex items-center justify-center py-8 px-4">
      <LoadingSpinner size="md" className="mr-3" />
      <p className="text-body-md text-accent-600">{message}</p>
    </div>
  )
}

export { LoadingSpinner, Skeleton, PageLoader, InlineLoader }