import { and, desc, eq, or, type SQL } from 'drizzle-orm'
import { z } from 'zod'

import { announcements, db, type Announcement, type NewAnnouncement } from '@/lib/db'
import {
  announcementAudiences,
  announcementTypes,
  type UserRole,
} from '@shared/schema'

const MAX_BODY_LENGTH = 10_000
const MAX_TITLE_LENGTH = 255
const MAX_LIST_LIMIT = 50

const nonEmptyTrimmedString = (min: number, max: number) =>
  z.string().trim().min(min).max(max)

const normaliseOptionalEnum = <T extends string>(value: T | undefined, fallback: T) =>
  value ?? fallback

const sanitizeExtra = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {} as Record<string, unknown>
  }

  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
  } catch {
    return {} as Record<string, unknown>
  }
}

const sanitizeAttachments = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as unknown[]
  }

  try {
    return JSON.parse(JSON.stringify(value)) as unknown[]
  } catch {
    return [] as unknown[]
  }
}

export const announcementCreateSchema = z.object({
  type: z.enum(announcementTypes),
  title: nonEmptyTrimmedString(3, MAX_TITLE_LENGTH),
  body: nonEmptyTrimmedString(1, MAX_BODY_LENGTH),
  audience: z.enum(announcementAudiences).optional(),
  extra: z.record(z.unknown()).optional(),
})

export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>

export type AnnouncementListOptions = {
  limit?: number
  sessionUser?: { id: string; role: UserRole } | null
}

export async function listAnnouncements(options: AnnouncementListOptions = {}) {
  const { limit = MAX_LIST_LIMIT, sessionUser } = options
  const normalizedLimit = Math.max(1, Math.min(MAX_LIST_LIMIT, limit))

  const filters: SQL[] = []

  if (!sessionUser || sessionUser.role !== 'admin') {
    if (sessionUser) {
      filters.push(or(eq(announcements.isApproved, true), eq(announcements.authorId, sessionUser.id)))
    } else {
      filters.push(eq(announcements.isApproved, true))
    }
  }

  let query = db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt))
    .limit(normalizedLimit)

  if (filters.length === 1) {
    query = query.where(filters[0])
  } else if (filters.length > 1) {
    query = query.where(and(...filters))
  }

  return query
}

export async function createAnnouncement(
  input: AnnouncementCreateInput,
  author: { id: string; role: UserRole },
) {
  const payload = announcementCreateSchema.parse(input)
  const now = new Date()
  const isApproved = author.role === 'admin'

  const values: NewAnnouncement = {
    authorId: author.id,
    title: payload.title.trim(),
    body: payload.body.trim(),
    type: payload.type,
    audience: normaliseOptionalEnum(payload.audience, 'public'),
    isApproved,
    publishedAt: isApproved ? now : null,
    extra: sanitizeExtra(payload.extra),
  }

  const [announcement] = await db.insert(announcements).values(values).returning()

  return announcement
}

export const serializeAnnouncement = (announcement: Announcement) => {
  return {
    id: announcement.id,
    authorId: announcement.authorId,
    title: announcement.title,
    body: announcement.body,
    type: announcement.type,
    audience: announcement.audience,
    isApproved: announcement.isApproved,
    publishedAt: announcement.publishedAt ? announcement.publishedAt.toISOString() : null,
    expiresAt: announcement.expiresAt ? announcement.expiresAt.toISOString() : null,
    attachments: sanitizeAttachments(announcement.attachments),
    extra: sanitizeExtra(announcement.extra),
    createdAt: announcement.createdAt.toISOString(),
    updatedAt: announcement.updatedAt.toISOString(),
  }
}

export type SerializedAnnouncement = ReturnType<typeof serializeAnnouncement>

