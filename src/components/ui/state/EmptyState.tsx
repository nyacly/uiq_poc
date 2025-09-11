// UiQ Empty States - For when no content is available
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '../Button'

export interface EmptyStateProps {
  icon?: ReactNode | string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'outline'
  }
  className?: string
}

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) => {
  const defaultIcon = (
    <svg className="w-16 h-16 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4 text-center",
      className
    )}>
      <div className="mb-6">
        {icon ? (
          typeof icon === 'string' ? (
            <div className="text-6xl mb-4">{icon}</div>
          ) : (
            icon
          )
        ) : (
          defaultIcon
        )}
      </div>
      
      <h3 className="text-h3 font-semibold text-accent-900 mb-3 max-w-md">
        {title}
      </h3>
      
      {description && (
        <p className="text-body-lg text-accent-600 mb-8 max-w-lg">
          {description}
        </p>
      )}
      
      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Specific empty states for UiQ community
const NoBusinessesFound = ({ onAddBusiness }: { onAddBusiness?: () => void }) => (
  <EmptyState
    icon="🏢"
    title="No businesses found"
    description="Be the first to add your business to the UiQ community directory and connect with fellow Ugandans in Queensland."
    action={onAddBusiness ? {
      label: "Add Your Business",
      onClick: onAddBusiness,
      variant: "primary"
    } : undefined}
  />
)

const NoEventsFound = ({ onCreateEvent }: { onCreateEvent?: () => void }) => (
  <EmptyState
    icon="📅"
    title="No events scheduled"
    description="Stay connected with the UiQ community by organizing cultural events, meetups, and celebrations."
    action={onCreateEvent ? {
      label: "Create Event",
      onClick: onCreateEvent,
      variant: "primary"
    } : undefined}
  />
)

const NoOpportunitiesFound = ({ onAddOpportunity }: { onAddOpportunity?: () => void }) => (
  <EmptyState
    icon="🎯"
    title="No opportunities available"
    description="Share scholarships, job openings, grants, and programs to help our community grow and thrive."
    action={onAddOpportunity ? {
      label: "Post Opportunity",
      onClick: onAddOpportunity,
      variant: "primary"
    } : undefined}
  />
)

const NoClassifiedsFound = ({ onPostListing }: { onPostListing?: () => void }) => (
  <EmptyState
    icon="🏷️"
    title="No listings found"
    description="Start selling, buying, or finding housing within the trusted UiQ community network."
    action={onPostListing ? {
      label: "Post Listing",
      onClick: onPostListing,
      variant: "primary"
    } : undefined}
  />
)

export { 
  EmptyState, 
  NoBusinessesFound, 
  NoEventsFound, 
  NoOpportunitiesFound, 
  NoClassifiedsFound 
}