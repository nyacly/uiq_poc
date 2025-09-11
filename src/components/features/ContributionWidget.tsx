'use client'

import { useState } from 'react'
import { Heart, Shield, Users, DollarSign, ExternalLink, Eye } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { cn } from '@/lib/utils'

// Contribution data interfaces
interface Contribution {
  id: string
  amount: number
  currency: string
  contributorName?: string
  isAnonymous: boolean
  message?: string
  timestamp: Date
  verified: boolean
}

interface TransparencyUpdate {
  id: string
  date: Date
  title: string
  description: string
  amount?: number
  receiptUrl?: string
  verifiedBy: string
}

interface ContributionCause {
  id: string
  type: 'bereavement' | 'emergency' | 'community'
  title: string
  description: string
  targetAmount: number
  currentAmount: number
  currency: string
  beneficiaryName: string
  verificationBadge: boolean
  deadline?: Date
  story: string
  bankDetails?: {
    accountName: string
    bsb: string
    accountNumber: string
    bankName: string
  }
  paypalEmail?: string
  stripeConnectId?: string
  transparencyUpdates: TransparencyUpdate[]
  contributions: Contribution[]
}

export interface ContributionWidgetProps {
  cause: ContributionCause
  onPledge?: (amount: number, method: string) => void
  className?: string
  compact?: boolean
}

// Predefined contribution amounts in AUD
const SUGGESTED_AMOUNTS = [25, 50, 100, 250, 500, 1000]

const ContributionWidget = ({ 
  cause, 
  onPledge, 
  className = '', 
  compact = false 
}: ContributionWidgetProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [showPledgeModal, setShowPledgeModal] = useState(false)
  const [showContributors, setShowContributors] = useState(false)
  const [showTransparency, setShowTransparency] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)

  // Calculate progress percentage
  const progressPercentage = Math.min((cause.currentAmount / cause.targetAmount) * 100, 100)
  const remainingAmount = Math.max(cause.targetAmount - cause.currentAmount, 0)

  // Get final contribution amount (selected or custom)
  const getContributionAmount = () => {
    if (selectedAmount) return selectedAmount
    if (customAmount) return parseFloat(customAmount)
    return 0
  }

  // Handle pledge submission
  const handlePledge = (method: string) => {
    const amount = getContributionAmount()
    if (amount > 0 && onPledge) {
      onPledge(amount, method)
      setShowPledgeModal(false)
      setSelectedAmount(null)
      setCustomAmount('')
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: cause.currency || 'AUD'
    }).format(amount)
  }

  // Payment method buttons
  const PaymentMethods = ({ inModal = false }: { inModal?: boolean }) => (
    <div className="space-y-3">
      {/* Bank Transfer */}
      {cause.bankDetails && (
        <Button
          variant={inModal ? "outline" : "primary"}
          size={inModal ? "md" : "sm"}
          className={cn(
            "w-full justify-between",
            inModal && selectedPaymentMethod === 'bank' && "border-blue-500 bg-blue-50"
          )}
          onClick={() => inModal ? setSelectedPaymentMethod('bank') : handlePledge('bank')}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>Bank Transfer</span>
          </div>
          <ExternalLink className="w-4 h-4" />
        </Button>
      )}

      {/* PayPal */}
      {cause.paypalEmail && (
        <Button
          variant={inModal ? "outline" : "primary"}
          size={inModal ? "md" : "sm"}
          className={cn(
            "w-full justify-between bg-[#0070ba] hover:bg-[#005ea6] text-white",
            inModal && selectedPaymentMethod === 'paypal' && "border-[#0070ba] bg-blue-50"
          )}
          onClick={() => inModal ? setSelectedPaymentMethod('paypal') : handlePledge('paypal')}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.9.9 0 0 0-.633.302.75.75 0 0 0-.153.666l1.12 7.106a.641.641 0 0 0 .633.524h4.006a.9.9 0 0 0 .885-.74l.747-4.73a.9.9 0 0 1 .885-.74h.93c3.53 0 6.29-1.43 7.082-5.57.29-1.52.072-2.78-.526-3.738z"/>
            </svg>
            <span>PayPal</span>
          </div>
          <ExternalLink className="w-4 h-4" />
        </Button>
      )}

      {/* Stripe (Credit/Debit Card) */}
      {cause.stripeConnectId && (
        <Button
          variant={inModal ? "outline" : "primary"}
          size={inModal ? "md" : "sm"}
          className={cn(
            "w-full justify-between bg-[#635bff] hover:bg-[#5a52ff] text-white",
            inModal && selectedPaymentMethod === 'stripe' && "border-[#635bff] bg-blue-50"
          )}
          onClick={() => inModal ? setSelectedPaymentMethod('stripe') : handlePledge('stripe')}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
            </svg>
            <span>Card Payment</span>
          </div>
          <ExternalLink className="w-4 h-4" />
        </Button>
      )}
    </div>
  )

  // Recent contributors list
  const RecentContributors = () => (
    <div className="space-y-3">
      {cause.contributions.slice(0, 5).map((contribution) => (
        <div key={contribution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {contribution.isAnonymous ? 'Anonymous Supporter' : (contribution.contributorName || 'Community Member')}
              </p>
              <p className="text-xs text-gray-500">
                {contribution.timestamp.toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(contribution.amount)}
            </p>
            {contribution.verified && (
              <Shield className="w-3 h-3 text-green-600 ml-auto" />
            )}
          </div>
        </div>
      ))}
    </div>
  )

  if (compact) {
    return (
      <Card className={cn("p-4 border-l-4 border-l-red-500", className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-sm">{cause.title}</h3>
          {cause.verificationBadge && (
            <Shield className="w-4 h-4 text-green-600" />
          )}
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Raised</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{formatCurrency(cause.currentAmount)}</span>
            <span>{formatCurrency(cause.targetAmount)}</span>
          </div>
        </div>

        <Button
          size="sm"
          className="w-full"
          onClick={() => setShowPledgeModal(true)}
        >
          Contribute Now
        </Button>
      </Card>
    )
  }

  return (
    <>
      <Card className={cn("p-6", className)}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-gray-900">{cause.title}</h2>
              {cause.verificationBadge && (
                <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  <Shield className="w-3 h-3" />
                  <span>Verified</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-2">{cause.description}</p>
            <p className="text-sm text-gray-500">
              Beneficiary: <span className="font-medium">{cause.beneficiaryName}</span>
            </p>
          </div>
          <div className="ml-4 text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(cause.currentAmount)}
            </div>
            <div className="text-sm text-gray-500">
              of {formatCurrency(cause.targetAmount)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{Math.round(progressPercentage)}% funded</span>
            <span>{cause.contributions.length} contributor{cause.contributions.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {remainingAmount > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {formatCurrency(remainingAmount)} remaining to reach goal
            </p>
          )}
        </div>

        {/* Amount Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Choose Amount</h3>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {SUGGESTED_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant={selectedAmount === amount ? "primary" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedAmount(amount)
                  setCustomAmount('')
                }}
                className="text-sm"
              >
                {formatCurrency(amount)}
              </Button>
            ))}
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value)
                setSelectedAmount(null)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              min="1"
              step="1"
            />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Methods</h3>
          <PaymentMethods />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            className="flex-1"
            onClick={() => setShowPledgeModal(true)}
            disabled={getContributionAmount() === 0}
          >
            <Heart className="w-4 h-4 mr-2" />
            Contribute {getContributionAmount() > 0 && formatCurrency(getContributionAmount())}
          </Button>
        </div>

        {/* Additional Actions */}
        <div className="flex gap-2 text-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowContributors(true)}
            className="flex-1"
          >
            <Users className="w-4 h-4 mr-1" />
            Contributors ({cause.contributions.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTransparency(true)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            Transparency
          </Button>
        </div>

        {/* Compliance Notice */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
          <p className="font-medium mb-1">Contribution Guidelines:</p>
          <ul className="space-y-1">
            <li>• All contributions are voluntary and non-refundable</li>
            <li>• Funds will be transferred directly to the verified beneficiary</li>
            <li>• UiQ Community Platform facilitates but does not guarantee outcomes</li>
            <li>• Tax deductibility depends on your local jurisdiction</li>
          </ul>
        </div>
      </Card>

      {/* Pledge Confirmation Modal */}
      <Modal
        isOpen={showPledgeModal}
        onClose={() => setShowPledgeModal(false)}
        title="Confirm Your Contribution"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(getContributionAmount())}
            </div>
            <p className="text-sm text-gray-600">Contributing to: {cause.title}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Select Payment Method</h4>
            <PaymentMethods inModal />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowPledgeModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedPaymentMethod}
              onClick={() => selectedPaymentMethod && handlePledge(selectedPaymentMethod)}
            >
              Proceed
            </Button>
          </div>
        </div>
      </Modal>

      {/* Contributors Modal */}
      <Modal
        isOpen={showContributors}
        onClose={() => setShowContributors(false)}
        title="Recent Contributors"
        className="max-w-lg"
      >
        <RecentContributors />
      </Modal>

      {/* Transparency Modal */}
      <Modal
        isOpen={showTransparency}
        onClose={() => setShowTransparency(false)}
        title="Transparency Updates"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {cause.transparencyUpdates.map((update) => (
            <div key={update.id} className="border-l-4 border-l-blue-500 pl-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{update.title}</h4>
                <span className="text-sm text-gray-500">
                  {update.date.toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{update.description}</p>
              {update.amount && (
                <p className="text-sm font-medium text-green-600">
                  Amount: {formatCurrency(update.amount)}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Verified by: {update.verifiedBy}
              </p>
            </div>
          ))}
        </div>
      </Modal>
    </>
  )
}

export { ContributionWidget }

// Export types for use in other components
export type { ContributionCause, Contribution, TransparencyUpdate }