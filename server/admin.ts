import { and, desc, eq, gte, gt, ilike, isNull, ne, or, sql } from 'drizzle-orm'

import {
  businesses,
  classifieds,
  db,
  events,
  profiles,
  reports,
  users,
} from '@/lib/db'

const COUNT_COLUMN = sql<number>`cast(count(*) as integer)`

const extractCount = (rows: Array<{ count: number }>): number => {
  if (!rows.length) {
    return 0
  }

  const value = Number(rows[0]?.count ?? 0)
  return Number.isFinite(value) ? value : 0
}

export type AdminOverview = {
  users: number
  businesses: {
    verified: number
    unverified: number
  }
  events: {
    upcoming: number
  }
  classifieds: {
    active: number
  }
  reports: {
    open: number
  }
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const now = new Date()

  const [userRows, verifiedBusinessRows, unverifiedBusinessRows, upcomingEventRows, activeClassifiedRows, openReportRows] =
    await Promise.all([
      db.select({ count: COUNT_COLUMN }).from(users),
      db.select({ count: COUNT_COLUMN }).from(businesses).where(eq(businesses.status, 'published')),
      db.select({ count: COUNT_COLUMN }).from(businesses).where(ne(businesses.status, 'published')),
      db
        .select({ count: COUNT_COLUMN })
        .from(events)
        .where(and(eq(events.status, 'published'), gte(events.startAt, now))),
      db
        .select({ count: COUNT_COLUMN })
        .from(classifieds)
        .where(
          and(
            eq(classifieds.status, 'published'),
            or(isNull(classifieds.expiresAt), gt(classifieds.expiresAt, now)),
          ),
        ),
      db.select({ count: COUNT_COLUMN }).from(reports).where(eq(reports.status, 'open')),
    ])

  return {
    users: extractCount(userRows),
    businesses: {
      verified: extractCount(verifiedBusinessRows),
      unverified: extractCount(unverifiedBusinessRows),
    },
    events: {
      upcoming: extractCount(upcomingEventRows),
    },
    classifieds: {
      active: extractCount(activeClassifiedRows),
    },
    reports: {
      open: extractCount(openReportRows),
    },
  }
}

const MAX_SEARCH_RESULTS = 25

const escapeLikePattern = (value: string) => value.replace(/[%_]/g, '\\$&')

export type AdminSearchResults = {
  users: Array<{
    id: string
    email: string
    role: string
    status: string
    displayName: string | null
    createdAt: Date
  }>
  businesses: Array<{
    id: string
    name: string
    email: string | null
    status: string
    plan: string
    verified: boolean
    createdAt: Date
  }>
}

export async function searchAdminDirectory(query: string, options: { limit?: number } = {}): Promise<AdminSearchResults> {
  const trimmed = query.trim()

  if (trimmed.length === 0) {
    return { users: [], businesses: [] }
  }

  const limit = Math.max(1, Math.min(MAX_SEARCH_RESULTS, options.limit ?? MAX_SEARCH_RESULTS))
  const pattern = `%${escapeLikePattern(trimmed)}%`

  const [userRows, businessRows] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        displayName: profiles.displayName,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(or(ilike(users.email, pattern), ilike(profiles.displayName, pattern)))
      .orderBy(desc(users.createdAt))
      .limit(limit),
    db
      .select({
        id: businesses.id,
        name: businesses.name,
        email: businesses.email,
        status: businesses.status,
        plan: businesses.plan,
        createdAt: businesses.createdAt,
      })
      .from(businesses)
      .where(or(ilike(businesses.name, pattern), ilike(businesses.email, pattern)))
      .orderBy(desc(businesses.createdAt))
      .limit(limit),
  ])

  return {
    users: userRows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      displayName: row.displayName ?? null,
      createdAt: row.createdAt,
    })),
    businesses: businessRows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      status: row.status,
      plan: row.plan,
      verified: row.status === 'published',
      createdAt: row.createdAt,
    })),
  }
}
