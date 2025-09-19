import { listAdminBusinesses } from '@server/admin'

import { BusinessesTable } from '../_components/BusinessesTable'

const serializeBusinesses = async () => {
  const records = await listAdminBusinesses()

  return records.map((business) => ({
    id: business.id,
    name: business.name,
    email: business.email,
    status: business.status,
    plan: business.plan,
    ownerEmail: business.ownerEmail,
    createdAt: business.createdAt.toISOString(),
    verified: business.status === 'published',
    premium: business.plan === 'premium',
  }))
}

export default async function AdminBusinessesPage() {
  const businesses = await serializeBusinesses()

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-gray-900">Businesses</h2>
        <p className="mt-1 text-sm text-gray-600">
          Verify listings and manage premium placement for featured businesses. Stripe remains the source of truth for billing
          status; this toggle is for visibility only.
        </p>
      </header>
      <BusinessesTable businesses={businesses} />
    </div>
  )
}
