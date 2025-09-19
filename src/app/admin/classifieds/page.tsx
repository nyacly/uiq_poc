import { listAdminClassifieds } from '@server/admin'

import { ClassifiedsTable } from '../_components/ClassifiedsTable'

const serializeClassifieds = async () => {
  const records = await listAdminClassifieds()

  return records.map((classified) => ({
    id: classified.id,
    title: classified.title,
    status: classified.status,
    ownerEmail: classified.ownerEmail,
    createdAt: classified.createdAt.toISOString(),
  }))
}

export default async function AdminClassifiedsPage() {
  const classifieds = await serializeClassifieds()

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-gray-900">Classifieds</h2>
        <p className="mt-1 text-sm text-gray-600">
          Hide or restore listings that fall outside community standards.
        </p>
      </header>
      <ClassifiedsTable classifieds={classifieds} />
    </div>
  )
}
