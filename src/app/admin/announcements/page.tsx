import { listAdminAnnouncements } from '@server/admin'

import { AnnouncementsTable } from '../_components/AnnouncementsTable'

const serializeAnnouncements = async () => {
  const records = await listAdminAnnouncements()

  return records.map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    isApproved: announcement.isApproved,
    authorEmail: announcement.authorEmail,
    createdAt: announcement.createdAt.toISOString(),
    publishedAt: announcement.publishedAt ? announcement.publishedAt.toISOString() : null,
    type: announcement.type,
    audience: announcement.audience,
  }))
}

export default async function AdminAnnouncementsPage() {
  const announcements = await serializeAnnouncements()

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-gray-900">Announcements</h2>
        <p className="mt-1 text-sm text-gray-600">
          Approve or reject submissions before they surface across the community feeds.
        </p>
      </header>
      <AnnouncementsTable announcements={announcements} />
    </div>
  )
}
