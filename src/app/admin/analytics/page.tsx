import { and, eq, gte, sql } from 'drizzle-orm'
import { format } from 'date-fns'
import type { Metadata } from 'next'

import { db, analyticsEvents } from '@/lib/db'
import { buildPageMetadata } from '@/lib/metadata'
import { SimpleLineChart } from '@/components/charts/SimpleLineChart'

const WEEKS_TO_PLOT = 8

function startOfCurrentWeek(): Date {
  const date = new Date()
  const day = date.getUTCDay()
  const diff = (day + 6) % 7
  date.setUTCDate(date.getUTCDate() - diff)
  date.setUTCHours(0, 0, 0, 0)
  return date
}

async function getWeeklyPageViews() {
  const weekFloor = new Date(startOfCurrentWeek())
  weekFloor.setUTCDate(weekFloor.getUTCDate() - (WEEKS_TO_PLOT - 1) * 7)

  const rows = await db
    .select({
      weekStart: sql<Date>`date_trunc('week', ${analyticsEvents.createdAt})`,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.kind, 'page_view'),
        gte(analyticsEvents.createdAt, weekFloor),
      ),
    )
    .groupBy(sql`date_trunc('week', ${analyticsEvents.createdAt})`)
    .orderBy(sql`date_trunc('week', ${analyticsEvents.createdAt})`)

  const countsByIsoWeek = new Map<string, number>()

  for (const row of rows) {
    const weekStart = new Date(row.weekStart as unknown as Date)
    const key = weekStart.toISOString().slice(0, 10)
    countsByIsoWeek.set(key, Number(row.count))
  }

  const series: { label: string; value: number }[] = []
  const today = startOfCurrentWeek()

  for (let index = WEEKS_TO_PLOT - 1; index >= 0; index -= 1) {
    const weekDate = new Date(today)
    weekDate.setUTCDate(today.getUTCDate() - index * 7)
    const key = weekDate.toISOString().slice(0, 10)
    const value = countsByIsoWeek.get(key) ?? 0
    series.push({ label: format(weekDate, 'MMM d'), value })
  }

  return series
}

export default async function AdminAnalyticsPage() {
  const weeklySeries = await getWeeklyPageViews()
  const totalViews = weeklySeries.reduce((sum, point) => sum + point.value, 0)
  const latestWeek = weeklySeries.at(-1)?.value ?? 0
  const previousWeek = weeklySeries.at(-2)?.value ?? 0
  const delta = latestWeek - previousWeek

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Engagement analytics</h2>
        <p className="text-sm text-gray-600">
          Lightweight tracking of page views across the platform. Use this to spot engagement trends and plan campaigns.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Views (last 7 days)</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{latestWeek}</p>
          <p className="mt-1 text-xs text-gray-500">
            {delta === 0
              ? 'No change from previous week'
              : delta > 0
              ? `Up ${delta} week over week`
              : `Down ${Math.abs(delta)} vs previous week`}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total views (last {WEEKS_TO_PLOT} weeks)</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{totalViews}</p>
          <p className="mt-1 text-xs text-gray-500">Aggregated from lightweight page view events.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Average per week</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {Math.round(totalViews / (weeklySeries.length || 1))}
          </p>
          <p className="mt-1 text-xs text-gray-500">Baseline to gauge marketing pushes.</p>
        </div>
      </section>

      <SimpleLineChart data={weeklySeries} />

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">Week starting</th>
              <th scope="col" className="px-4 py-3 text-left">Page views</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {weeklySeries.map((point) => (
              <tr key={point.label}>
                <td className="px-4 py-3 text-gray-700">{point.label}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{point.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Analytics overview',
    description: 'Track weekly UiQ page views and identify engagement trends.',
    path: '/admin/analytics',
    category: 'Administration',
  })
}
