import { listAdminUsers } from '@server/admin'

import { UsersTable } from '../_components/UsersTable'

const serializeUsers = async () => {
  const records = await listAdminUsers()

  return records.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    membershipTier: user.membershipTier,
    displayName: user.displayName,
    lastSignInAt: user.lastSignInAt ? user.lastSignInAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  }))
}

export default async function AdminUsersPage() {
  const users = await serializeUsers()

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-gray-900">Users</h2>
        <p className="mt-1 text-sm text-gray-600">
          Review member accounts, adjust roles, and monitor subscription tiers.
        </p>
      </header>
      <UsersTable users={users} />
    </div>
  )
}
