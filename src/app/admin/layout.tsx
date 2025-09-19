import type { ReactNode } from 'react'
import { redirect, notFound } from 'next/navigation'

import { AdminNav } from './_components/AdminNav'
import { requireUser, UnauthorizedError } from '@server/auth'

export const adminNavItems = [
  { name: 'Overview', href: '/admin' },
  { name: 'Analytics', href: '/admin/analytics' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Businesses', href: '/admin/businesses' },
  { name: 'Announcements', href: '/admin/announcements' },
  { name: 'Classifieds', href: '/admin/classifieds' },
  { name: 'Reports', href: '/admin/reports' },
] as const

type AdminLayoutProps = {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  try {
    const user = await requireUser()

    if (user.role !== 'admin') {
      notFound()
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/auth/signin')
    }

    throw error
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Administrative</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">UiQ Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage users, businesses, and community content. Actions are logged and subject to rate limiting.
        </p>
      </header>
      <AdminNav items={adminNavItems} />
      <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm p-6">{children}</div>
    </div>
  )
}
