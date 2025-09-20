import { and, desc, eq, gte, gt, ilike, inArray, isNull, ne, or, sql } from 'drizzle-orm'

import {
  announcements,
  businesses,
  classifieds,
  db,
  events,
  messages,
  profiles,
  reports,
  users,
} from '@/lib/db'
import { buildAbsoluteUrl, notifyEmail } from '@server/notifications'
import { HttpError } from './auth'
import {
  userRoles,
  type AnnouncementAudience,
  type AnnouncementType,
  type BusinessPlan,
  type BusinessStatus,
  type ClassifiedStatus,
  type MembershipTier,
  type ReportStatus,
  type ReportTargetType,
  type UserRole,
  type UserStatus,
} from '@shared/schema'

const ADMIN_DEFAULT_LIMIT = 50

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

const sanitizeLimit = (limit?: number) => Math.max(1, Math.min(ADMIN_DEFAULT_LIMIT, limit ?? ADMIN_DEFAULT_LIMIT))

export type AdminUserRecord = {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  membershipTier: MembershipTier
  displayName: string | null
  lastSignInAt: Date | null
  createdAt: Date
}

export async function listAdminUsers(options: { limit?: number; search?: string } = {}): Promise<AdminUserRecord[]> {
  const limit = sanitizeLimit(options.limit)
  const conditions: Array<ReturnType<typeof ilike>> = []

  if (options.search?.trim()) {
    const pattern = `%${escapeLikePattern(options.search.trim())}%`
    conditions.push(ilike(users.email, pattern))
    conditions.push(ilike(profiles.displayName, pattern))
  }

  const qb = db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      membershipTier: users.membershipTier,
      lastSignInAt: users.lastSignInAt,
      createdAt: users.createdAt,
      displayName: profiles.displayName,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))

  if (conditions.length > 0) {
    const whereCondition = conditions.length === 1 ? conditions[0] : or(...conditions);
    const rows = await qb.where(whereCondition).orderBy(desc(users.createdAt)).limit(limit);
    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      membershipTier: row.membershipTier,
      displayName: row.displayName ?? null,
      lastSignInAt: row.lastSignInAt ?? null,
      createdAt: row.createdAt,
    }))
  } else {
    const rows = await qb.orderBy(desc(users.createdAt)).limit(limit);
    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      membershipTier: row.membershipTier,
      displayName: row.displayName ?? null,
      lastSignInAt: row.lastSignInAt ?? null,
      createdAt: row.createdAt,
    }))
  }

}

export async function updateUserRole(userId: string, nextRole: UserRole): Promise<void> {
  if (!userRoles.includes(nextRole)) {
    throw new HttpError(400, 'Unsupported role requested')
  }

  const [updated] = await db
    .update(users)
    .set({ role: nextRole, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id })

  if (!updated) {
    throw new HttpError(404, 'User not found')
  }
}

export type AdminBusinessRecord = {
  id: string
  name: string
  email: string | null
  status: BusinessStatus
  plan: BusinessPlan
  ownerId: string
  ownerEmail: string
  createdAt: Date
}

export async function listAdminBusinesses(options: { limit?: number; search?: string } = {}): Promise<AdminBusinessRecord[]> {
  const limit = sanitizeLimit(options.limit)
  const filters: Array<ReturnType<typeof ilike>> = []

  if (options.search?.trim()) {
    const pattern = `%${escapeLikePattern(options.search.trim())}%`
    filters.push(ilike(businesses.name, pattern))
    filters.push(ilike(businesses.email, pattern))
  }

  const qb = db
    .select({
      id: businesses.id,
      name: businesses.name,
      email: businesses.email,
      status: businesses.status,
      plan: businesses.plan,
      ownerId: businesses.ownerId,
      ownerEmail: users.email,
      createdAt: businesses.createdAt,
    })
    .from(businesses)
    .innerJoin(users, eq(users.id, businesses.ownerId))

  if (filters.length > 0) {
    const whereCondition = filters.length === 1 ? filters[0] : or(...filters);
    const rows = await qb.where(whereCondition).orderBy(desc(businesses.createdAt)).limit(limit);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      status: row.status,
      plan: row.plan,
      ownerId: row.ownerId,
      ownerEmail: row.ownerEmail,
      createdAt: row.createdAt,
    }))
  } else {
    const rows = await qb.orderBy(desc(businesses.createdAt)).limit(limit);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      status: row.status,
      plan: row.plan,
      ownerId: row.ownerId,
      ownerEmail: row.ownerEmail,
      createdAt: row.createdAt,
    }))
  }

}

export async function setBusinessVerification(businessId: string, verified: boolean): Promise<BusinessStatus> {
  const nextStatus: BusinessStatus = verified ? 'published' : 'review'

  const [updated] = await db
    .update(businesses)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(businesses.id, businessId))
    .returning({ status: businesses.status })

  if (!updated) {
    throw new HttpError(404, 'Business not found')
  }

  return updated.status
}

export async function setBusinessPremium(businessId: string, premium: boolean): Promise<BusinessPlan> {
  const nextPlan: BusinessPlan = premium ? 'premium' : 'standard'

  const [updated] = await db
    .update(businesses)
    .set({ plan: nextPlan, updatedAt: new Date() })
    .where(eq(businesses.id, businessId))
    .returning({ plan: businesses.plan })

  if (!updated) {
    throw new HttpError(404, 'Business not found')
  }

  return updated.plan
}

export type AdminAnnouncementRecord = {
  id: string
  title: string
  isApproved: boolean
  authorId: string
  authorEmail: string
  createdAt: Date
  publishedAt: Date | null
  type: AnnouncementType
  audience: AnnouncementAudience
}

export async function listAdminAnnouncements(options: { limit?: number } = {}): Promise<AdminAnnouncementRecord[]> {
  const limit = sanitizeLimit(options.limit)

  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      isApproved: announcements.isApproved,
      authorId: announcements.authorId,
      authorEmail: users.email,
      createdAt: announcements.createdAt,
      publishedAt: announcements.publishedAt,
      type: announcements.type,
      audience: announcements.audience,
    })
    .from(announcements)
    .innerJoin(users, eq(users.id, announcements.authorId))
    .orderBy(desc(announcements.createdAt))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    isApproved: row.isApproved,
    authorId: row.authorId,
    authorEmail: row.authorEmail,
    createdAt: row.createdAt,
    publishedAt: row.publishedAt ?? null,
    type: row.type,
    audience: row.audience,
  }))
}

export async function setAnnouncementApproval(
  announcementId: string,
  approved: boolean,
): Promise<{ isApproved: boolean; publishedAt: Date | null }> {
  const now = new Date()
  const [updated] = await db
    .update(announcements)
    .set({
      isApproved: approved,
      publishedAt: approved ? now : null,
      updatedAt: now,
    })
    .where(eq(announcements.id, announcementId))
    .returning({
      isApproved: announcements.isApproved,
      publishedAt: announcements.publishedAt,
      authorId: announcements.authorId,
      title: announcements.title,
    })

  if (!updated) {
    throw new HttpError(404, 'Announcement not found')
  }

  const subject = approved
    ? 'Your announcement was approved'
    : 'Your announcement needs attention'

  void notifyEmail(updated.authorId, subject, {
    template: 'adminAction',
    action: approved ? 'approved' : 'takedown',
    entityType: 'announcement',
    entityTitle: updated.title,
    manageUrl: buildAbsoluteUrl(`/announcements/${announcementId}`),
    note: approved
      ? null
      : 'Please review and update your announcement to meet our guidelines.',
  })

  return {
    isApproved: updated.isApproved,
    publishedAt: updated.publishedAt ?? null,
  }
}

export type AdminClassifiedRecord = {
  id: string
  title: string
  status: ClassifiedStatus
  ownerId: string
  ownerEmail: string
  createdAt: Date
}

export async function listAdminClassifieds(options: { limit?: number } = {}): Promise<AdminClassifiedRecord[]> {
  const limit = sanitizeLimit(options.limit)

  const rows = await db
    .select({
      id: classifieds.id,
      title: classifieds.title,
      status: classifieds.status,
      ownerId: classifieds.ownerId,
      ownerEmail: users.email,
      createdAt: classifieds.createdAt,
    })
    .from(classifieds)
    .innerJoin(users, eq(users.id, classifieds.ownerId))
    .orderBy(desc(classifieds.createdAt))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    ownerId: row.ownerId,
    ownerEmail: row.ownerEmail,
    createdAt: row.createdAt,
  }))
}

export async function setClassifiedVisibility(classifiedId: string, hidden: boolean): Promise<ClassifiedStatus> {
  const nextStatus: ClassifiedStatus = hidden ? 'archived' : 'published'

  const [updated] = await db
    .update(classifieds)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(classifieds.id, classifiedId))
    .returning({ status: classifieds.status })

  if (!updated) {
    throw new HttpError(404, 'Classified not found')
  }

  return updated.status
}

export type AdminReportRecord = {
  id: string
  reporterId: string
  reporterEmail: string
  targetType: ReportTargetType
  targetId: string
  status: ReportStatus
  reason: string
  createdAt: Date
  targetLabel: string
  targetUrl: string | null
}

const REPORT_ADMIN_SECTIONS: Partial<Record<ReportTargetType, string>> = {
  user: '/admin/users',
  business: '/admin/businesses',
  announcement: '/admin/announcements',
  classified: '/admin/classifieds',
}

const REPORT_PUBLIC_SECTIONS: Partial<Record<ReportTargetType, string>> = {
  event: '/events',
  message: '/messages',
}

const buildReportTargetUrl = (targetType: ReportTargetType, targetId: string): string | null => {
  const adminBase = REPORT_ADMIN_SECTIONS[targetType]
  if (adminBase) {
    return `${adminBase}#${targetId}`
  }

  const publicBase = REPORT_PUBLIC_SECTIONS[targetType]
  if (publicBase) {
    return publicBase
  }

  return null
}

export async function listAdminReports(options: { limit?: number } = {}): Promise<AdminReportRecord[]> {
  const limit = sanitizeLimit(options.limit)

  const rows = await db
    .select({
      id: reports.id,
      reporterId: reports.reporterId,
      reporterEmail: users.email,
      targetType: reports.targetType,
      targetId: reports.targetId,
      status: reports.status,
      reason: reports.reason,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .innerJoin(users, eq(users.id, reports.reporterId))
    .orderBy(desc(reports.createdAt))
    .limit(limit)

  const targetsByType = rows.reduce<Record<ReportTargetType, Set<string>>>((acc, row) => {
    if (!acc[row.targetType]) {
      acc[row.targetType] = new Set<string>()
    }
    acc[row.targetType].add(row.targetId)
    return acc
  }, {} as Record<ReportTargetType, Set<string>>)

  const [userTargets, businessTargets, announcementTargets, classifiedTargets, eventTargets, messageTargets] = await Promise.all([
    targetsByType.user?.size
      ? db
          .select({ id: users.id, email: users.email, displayName: profiles.displayName })
          .from(users)
          .leftJoin(profiles, eq(profiles.userId, users.id))
          .where(inArray(users.id, Array.from(targetsByType.user)))
      : Promise.resolve([]),
    targetsByType.business?.size
      ? db
          .select({ id: businesses.id, name: businesses.name })
          .from(businesses)
          .where(inArray(businesses.id, Array.from(targetsByType.business)))
      : Promise.resolve([]),
    targetsByType.announcement?.size
      ? db
          .select({ id: announcements.id, title: announcements.title })
          .from(announcements)
          .where(inArray(announcements.id, Array.from(targetsByType.announcement)))
      : Promise.resolve([]),
    targetsByType.classified?.size
      ? db
          .select({ id: classifieds.id, title: classifieds.title })
          .from(classifieds)
          .where(inArray(classifieds.id, Array.from(targetsByType.classified)))
      : Promise.resolve([]),
    targetsByType.event?.size
      ? db
          .select({ id: events.id, title: events.title })
          .from(events)
          .where(inArray(events.id, Array.from(targetsByType.event)))
      : Promise.resolve([]),
    targetsByType.message?.size
      ? db
          .select({ id: messages.id, body: messages.body })
          .from(messages)
          .where(inArray(messages.id, Array.from(targetsByType.message)))
      : Promise.resolve([]),
  ])

  const userMap = new Map<string, string>(
    userTargets.map((row) => [row.id, row.displayName ?? row.email ?? row.id]),
  )
  const businessMap = new Map<string, string>(businessTargets.map((row) => [row.id, row.name]))
  const announcementMap = new Map<string, string>(announcementTargets.map((row) => [row.id, row.title]))
  const classifiedMap = new Map<string, string>(classifiedTargets.map((row) => [row.id, row.title]))
  const eventMap = new Map<string, string>(eventTargets.map((row) => [row.id, row.title]))
  const messageMap = new Map<string, string>(
    messageTargets.map((row) => [row.id, row.body.slice(0, 80)]),
  )

  return rows.map((row) => {
    let targetLabel: string

    switch (row.targetType) {
      case 'user':
        targetLabel = userMap.get(row.targetId) ?? `User ${row.targetId}`
        break
      case 'business':
        targetLabel = businessMap.get(row.targetId) ?? `Business ${row.targetId}`
        break
      case 'announcement':
        targetLabel = announcementMap.get(row.targetId) ?? `Announcement ${row.targetId}`
        break
      case 'classified':
        targetLabel = classifiedMap.get(row.targetId) ?? `Classified ${row.targetId}`
        break
      case 'event':
        targetLabel = eventMap.get(row.targetId) ?? `Event ${row.targetId}`
        break
      case 'message':
        targetLabel = messageMap.get(row.targetId) ?? `Message ${row.targetId}`
        break
      default:
        targetLabel = row.targetId
    }

    return {
      id: row.id,
      reporterId: row.reporterId,
      reporterEmail: row.reporterEmail,
      targetType: row.targetType,
      targetId: row.targetId,
      status: row.status,
      reason: row.reason,
      createdAt: row.createdAt,
      targetLabel,
      targetUrl: buildReportTargetUrl(row.targetType, row.targetId),
    }
  })
}

export async function updateReportStatus(
  reportId: string,
  status: Extract<ReportStatus, 'resolved' | 'dismissed'>,
  resolution?: string,
): Promise<ReportStatus> {
  if (!['resolved', 'dismissed'].includes(status)) {
    throw new HttpError(400, 'Unsupported report status transition')
  }

  const [updated] = await db
    .update(reports)
    .set({
      status,
      resolution: resolution ?? null,
      updatedAt: new Date(),
    })
    .where(eq(reports.id, reportId))
    .returning({ status: reports.status })

  if (!updated) {
    throw new HttpError(404, 'Report not found')
  }

  return updated.status
}
