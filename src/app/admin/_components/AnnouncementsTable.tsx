'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import type { AnnouncementAudience, AnnouncementType } from '@shared/schema'

type SerializedAdminAnnouncement = {
  id: string
  title: string
  isApproved: boolean
  authorEmail: string
  createdAt: string
  publishedAt: string | null
  type: AnnouncementType
  audience: AnnouncementAudience
}

type AnnouncementsTableProps = {
  announcements: SerializedAdminAnnouncement[]
}

const formatDate = (value: string | null) => {
  if (!value) {
    return 'Pending'
  }

  return new Date(value).toLocaleString()
}

export function AnnouncementsTable({ announcements }: AnnouncementsTableProps) {
  const [rows, setRows] = useState(announcements)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const updateApproval = async (announcementId: string, approved: boolean) => {
    setPendingId(announcementId)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/admin/announcements/${announcementId}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Failed to update announcement approval')
      }

      const payload = await response.json()

      setRows((previous) =>
        previous.map((row) =>
          row.id === announcementId
            ? {
                ...row,
                isApproved: payload.isApproved as boolean,
                publishedAt: payload.publishedAt,
              }
            : row,
        ),
      )
    } catch (error) {
      console.error('Failed to update announcement approval', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update announcement')
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
                Type
              </th>
              <th scope="col" className="px-4 py-3">
                Audience
              </th>
              <th scope="col" className="px-4 py-3">
                Author
              </th>
              <th scope="col" className="px-4 py-3">
                Published
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((announcement) => (
              <tr key={announcement.id} id={`announcement-${announcement.id}`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{announcement.title}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{announcement.type}</td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{announcement.audience}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{announcement.authorEmail}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(announcement.publishedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant={announcement.isApproved ? 'outline' : 'primary'}
                      onClick={() => updateApproval(announcement.id, true)}
                      disabled={pendingId === announcement.id || announcement.isApproved}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateApproval(announcement.id, false)}
                      disabled={pendingId === announcement.id || !announcement.isApproved}
                    >
                      Reject
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
