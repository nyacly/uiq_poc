'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import type { ReportStatus, ReportTargetType } from '@shared/schema'

type SerializedAdminReport = {
  id: string
  reporterEmail: string
  targetType: ReportTargetType
  targetLabel: string
  targetUrl: string | null
  status: ReportStatus
  reason: string
  createdAt: string
}

type ReportsTableProps = {
  reports: SerializedAdminReport[]
}

const formatDate = (value: string) => new Date(value).toLocaleString()

const RESOLUTION_MESSAGES: Record<'resolved' | 'dismissed', string> = {
  resolved: 'Marked as resolved via admin dashboard',
  dismissed: 'Closed by admin via dashboard',
}

export function ReportsTable({ reports }: ReportsTableProps) {
  const [rows, setRows] = useState(reports)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const updateStatus = async (
    reportId: string,
    status: 'resolved' | 'dismissed',
  ) => {
    setPendingId(reportId)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/admin/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution: RESOLUTION_MESSAGES[status] }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Failed to update report')
      }

      const payload = await response.json()

      setRows((previous) =>
        previous.map((row) =>
          row.id === reportId ? { ...row, status: payload.status as ReportStatus } : row,
        ),
      )
    } catch (error) {
      console.error('Failed to update report status', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update report')
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
                Target
              </th>
              <th scope="col" className="px-4 py-3">
                Reporter
              </th>
              <th scope="col" className="px-4 py-3">
                Reason
              </th>
              <th scope="col" className="px-4 py-3">
                Created
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((report) => (
              <tr key={report.id} id={`report-${report.id}`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{report.targetLabel}</div>
                  <div className="text-xs text-gray-500 capitalize">{report.targetType}</div>
                  {report.targetUrl ? (
                    <Link
                      href={report.targetUrl}
                      className="text-xs font-medium text-primary-600 hover:underline"
                    >
                      View entity
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-400">No link available</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{report.reporterEmail}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{report.reason}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(report.createdAt)}</td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{report.status}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => updateStatus(report.id, 'resolved')}
                      disabled={pendingId === report.id || report.status === 'resolved'}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(report.id, 'dismissed')}
                      disabled={pendingId === report.id || report.status === 'dismissed'}
                    >
                      Close
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
