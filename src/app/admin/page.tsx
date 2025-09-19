import { getAdminOverview } from '@server/admin'

const overviewCards = (
  overview: Awaited<ReturnType<typeof getAdminOverview>>,
) => [
  {
    title: 'Total Users',
    value: overview.users,
    description: 'Registered members in the community.',
  },
  {
    title: 'Verified Businesses',
    value: overview.businesses.verified,
    description: 'Published directory listings.',
  },
  {
    title: 'Businesses Pending Review',
    value: overview.businesses.unverified,
    description: 'Awaiting moderation before publishing.',
  },
  {
    title: 'Upcoming Events',
    value: overview.events.upcoming,
    description: 'Live and scheduled events.',
  },
  {
    title: 'Active Classifieds',
    value: overview.classifieds.active,
    description: 'Listings currently visible to members.',
  },
  {
    title: 'Open Reports',
    value: overview.reports.open,
    description: 'Moderation items requiring attention.',
  },
]

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview()
  const cards = overviewCards(overview)

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
        <p className="mt-1 text-sm text-gray-600">
          Snapshot of key metrics across the UiQ Community Platform.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <p className="mt-3 text-3xl font-semibold text-gray-900">{card.value}</p>
              <p className="mt-2 text-sm text-gray-600">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-primary-100 bg-primary-50/60 p-5">
        <h3 className="text-lg font-semibold text-primary-900">Admin Guidance</h3>
        <p className="mt-2 text-sm text-primary-800">
          All moderation actions are audited. Ensure that approval and verification decisions adhere to community guidelines and
          respect member privacy.
        </p>
      </section>
    </div>
  )
}
