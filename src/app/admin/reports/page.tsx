import { listAdminReports } from '@server/admin'

import { ReportsTable } from '../_components/ReportsTable'

const serializeReports = async () => {
  const records = await listAdminReports()

  return records.map((report) => ({
    id: report.id,
    reporterEmail: report.reporterEmail,
    targetType: report.targetType,
    targetLabel: report.targetLabel,
    targetUrl: report.targetUrl,
    status: report.status,
    reason: report.reason,
    createdAt: report.createdAt.toISOString(),
  }))
}

export default async function AdminReportsPage() {
  const reports = await serializeReports()

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
        <p className="mt-1 text-sm text-gray-600">
          Resolve community reports, escalate issues, and provide closure for members.
        </p>
      </header>
      <ReportsTable reports={reports} />
    </div>
  )
}
