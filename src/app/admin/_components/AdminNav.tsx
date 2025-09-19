'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

export type AdminNavItem = {
  name: string
  href: string
}

type AdminNavProps = {
  items: readonly AdminNavItem[]
}

export function AdminNav({ items }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-3 border-b border-gray-200 pb-3">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50',
            )}
          >
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
