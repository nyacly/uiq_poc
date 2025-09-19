'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { MembershipTier, UserRole, UserStatus } from '@shared/schema'

type SerializedAdminUser = {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  membershipTier: MembershipTier
  displayName: string | null
  lastSignInAt: string | null
  createdAt: string
}

type UsersTableProps = {
  users: SerializedAdminUser[]
}

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'member', label: 'Member' },
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'admin', label: 'Admin' },
]

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '—'
  }

  return new Date(value).toLocaleString()
}

export function UsersTable({ users }: UsersTableProps) {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState(users)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return rows
    }

    const needle = query.trim().toLowerCase()
    return rows.filter((row) => {
      return (
        row.email.toLowerCase().includes(needle) ||
        (row.displayName ? row.displayName.toLowerCase().includes(needle) : false)
      )
    })
  }, [rows, query])

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setPendingId(userId)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error ?? 'Failed to update role')
      }

      setRows((previous) =>
        previous.map((row) => (row.id === userId ? { ...row, role } : row)),
      )
    } catch (error) {
      console.error('Failed to update user role', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update role')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-sm">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by email or name"
            aria-label="Search users"
          />
        </div>
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{filtered.length}</span> of{' '}
          <span className="font-medium text-gray-900">{rows.length}</span> records
        </p>
      </div>

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
                User
              </th>
              <th scope="col" className="px-4 py-3">
                Role
              </th>
              <th scope="col" className="px-4 py-3">
                Membership
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3">
                Last Sign In
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
            {filtered.map((user) => (
              <tr key={user.id} id={`user-${user.id}`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{user.displayName ?? 'Unknown user'}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={user.role}
                    onChange={(event) => handleRoleChange(user.id, event.target.value as UserRole)}
                    disabled={pendingId === user.id}
                    aria-label="Select user role"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                    {user.membershipTier}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{user.status}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(user.lastSignInAt)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(user.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    title="Additional user actions coming soon"
                  >
                    Manage
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
