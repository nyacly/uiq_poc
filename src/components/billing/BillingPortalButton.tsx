'use client'

import { useState } from 'react'
import { AccessibleButton, type AccessibleButtonProps } from '@/components/ui/AccessibleButton'
import { useToast } from '@/hooks/use-toast'

interface BillingPortalButtonProps {
  businessId?: string
  className?: string
  children?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: AccessibleButtonProps['size']
}

export function BillingPortalButton({
  businessId,
  className,
  children,
  variant = 'outline',
  size = 'md'
}: BillingPortalButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleOpenPortal = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          returnUrl: window.location.href
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "No Billing Information",
            description: "Please subscribe to a plan first to manage your billing.",
            variant: "destructive",
          })
          return
        }
        throw new Error(data.error || 'Failed to open billing portal')
      }

      // Redirect to Stripe billing portal
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No billing portal URL returned')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access billing portal. Please try again.'
      console.error('Billing portal error:', error)
      toast({
        title: "Billing Portal Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AccessibleButton
      onClick={handleOpenPortal}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? 'Opening...' : children || 'Manage Billing'}
    </AccessibleButton>
  )
}