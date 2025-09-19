'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import type { ClassifiedStatus } from '@shared/schema'

type SerializedAdminClassified = {
  id: string
  title: string
  status: ClassifiedStatus
  ownerEmail: string
  createdAt: string
}

type ClassifiedsTableProps = {
  classifieds: SerializedAdminClassified[]
}

const formatDate = (value: string) => new Date(value).toLocaleString()

export function ClassifiedsTable({ classifieds }: ClassifiedsTableProps) {
  const [rows, setRows] = useState(classifieds)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const toggleVisibility = async (classifiedId: string, hidden: boolean) => {
    setPendingId(classifiedId)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/admin/classifieds/${classifiedId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Failed to update classified')
      }

      const payload = await response.json()

      setRows((previous) =>
        previous.map((row) =>
          row.id === classifiedId ? { ...row, status: payload.status as ClassifiedStatus } : row,
        ),
      )
    } catch (error) {
      console.error('Failed to update classified visibility', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update classified')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-4">
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
                Title
              </th>
              <th scope="col" className="px-4 py-3">
                Owner
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
            {rows.map((classified) => {
              const hidden = classified.status !== 'published'

              return (
                <tr key={classified.id} id={`classified-${classified.id}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{classified.title}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{classified.ownerEmail}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{classified.status}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(classified.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant={hidden ? 'secondary' : 'outline'}
                      onClick={() => toggleVisibility(classified.id, !hidden)}
                      loading={pendingId === classified.id}
                    >
                      {hidden ? 'Unhide' : 'Hide'}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
