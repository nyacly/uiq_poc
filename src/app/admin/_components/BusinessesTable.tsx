'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { BusinessPlan, BusinessStatus } from '@shared/schema'

type SerializedAdminBusiness = {
  id: string
  name: string
  email: string | null
  status: BusinessStatus
  plan: BusinessPlan
  ownerEmail: string
  createdAt: string
  verified: boolean
  premium: boolean
}

type BusinessesTableProps = {
  businesses: SerializedAdminBusiness[]
}

const formatDate = (value: string) => new Date(value).toLocaleDateString()

export function BusinessesTable({ businesses }: BusinessesTableProps) {
  const [rows, setRows] = useState(businesses)
  const [query, setQuery] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return rows
    }

    const needle = query.trim().toLowerCase()
    return rows.filter((row) => row.name.toLowerCase().includes(needle))
  }, [rows, query])

  const toggleVerification = async (businessId: string, verified: boolean) => {
    setPendingId(businessId)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/verification`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Failed to update verification')
      }

      const payload = await response.json()

      setRows((previous) =>
        previous.map((row) =>
          row.id === businessId
            ? { ...row, verified: payload.verified as boolean, status: payload.status as BusinessStatus }
            : row,
        ),
      )
    } catch (error) {
      console.error('Failed to update business verification', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update verification')
    } finally {
      setPendingId(null)
    }
  }

  const togglePremium = async (businessId: string, premium: boolean) => {
    setPendingId(businessId)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ premium }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Failed to update plan')
      }

      const payload = await response.json()

      setRows((previous) =>
        previous.map((row) =>
          row.id === businessId
            ? { ...row, premium, plan: payload.plan as BusinessPlan }
            : row,
        ),
      )
    } catch (error) {
      console.error('Failed to update business premium flag', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update premium flag')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-sm">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by business name"
            aria-label="Search businesses"
          />
        </div>
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{filtered.length}</span> of{' '}
          <span className="font-medium text-gray-900">{rows.length}</span> businesses
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th scope="col" className="px-4 py-3">
                Business
              </th>
              <th scope="col" className="px-4 py-3">
                Owner
              </th>
              <th scope="col" className="px-4 py-3">
                Plan
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3">
                Created
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((business) => (
              <tr key={business.id} id={`business-${business.id}`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{business.name}</div>
                  <div className="text-xs text-gray-500">{business.email ?? 'No email'}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{business.ownerEmail}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      business.premium
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {business.plan.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                  {business.verified ? 'Published' : business.status}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(business.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant={business.verified ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => toggleVerification(business.id, !business.verified)}
                      loading={pendingId === business.id}
                    >
                      {business.verified ? 'Unverify' : 'Verify'}
                    </Button>
                    <Button
                      variant={business.premium ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => togglePremium(business.id, !business.premium)}
                      disabled={pendingId === business.id}
                    >
                      {business.premium ? 'Set Standard' : 'Mark Premium'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
