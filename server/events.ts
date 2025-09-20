import { and, asc, eq, or, type SQL } from 'drizzle-orm'
import { z } from 'zod'

import { db, events, type InsertEvent } from '@/lib/db'
import {
  eventStatuses,
  eventVisibilities,
  type Event,
  type UserRole,
} from '@shared/schema'

import { HttpError } from './auth'

const isoDateTimeWithOffset = z.string().datetime({ offset: true })
const nonEmptyTrimmedString = (min: number, max: number) =>
  z.string().trim().min(min).max(max)

const coordinateSchema = {
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
}

const tagsSchema = z.array(nonEmptyTrimmedString(1, 50)).max(25)

const createBaseSchema = z.object({
  title: nonEmptyTrimmedString(3, 255),
  category: nonEmptyTrimmedString(2, 120),
  description: nonEmptyTrimmedString(10, 5000),
  visibility: z.enum(eventVisibilities).optional(),
  status: z.enum(eventStatuses).optional(),
  capacity: z.number().int().min(1).max(100_000).optional(),
  rsvpDeadline: isoDateTimeWithOffset.optional(),
  locationName: nonEmptyTrimmedString(2, 255).optional(),
  address: nonEmptyTrimmedString(5, 2000).optional(),
  latitude: coordinateSchema.latitude.optional(),
  longitude: coordinateSchema.longitude.optional(),
  tags: tagsSchema.optional(),
  businessId: z.string().uuid().optional(),
})

export const eventCreateSchema = createBaseSchema
  .extend({
    startAt: isoDateTimeWithOffset,
    endAt: isoDateTimeWithOffset.optional(),
  })
  .superRefine((value, ctx) => {
    const start = new Date(value.startAt)
    const end = value.endAt ? new Date(value.endAt) : null

    if (end && end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endAt'],
        message: 'Event end time must be after the start time',
      })
    }

    if (value.rsvpDeadline) {
      const deadline = new Date(value.rsvpDeadline)
      if (deadline > start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rsvpDeadline'],
          message: 'RSVP deadline must be before the event start time',
        })
      }
    }
  })

const nullableStringField = (schema: z.ZodString) => schema.optional().nullable()

export const eventUpdateSchema = createBaseSchema
  .partial()
  .extend({
    startAt: isoDateTimeWithOffset.optional(),
    endAt: isoDateTimeWithOffset.optional().nullable(),
    rsvpDeadline: isoDateTimeWithOffset.optional().nullable(),
    capacity: z.number().int().min(1).max(100_000).optional().nullable(),
    locationName: nullableStringField(nonEmptyTrimmedString(2, 255)),
    address: nullableStringField(nonEmptyTrimmedString(5, 2000)),
    latitude: coordinateSchema.latitude.optional().nullable(),
    longitude: coordinateSchema.longitude.optional().nullable(),
    businessId: z.string().uuid().optional().nullable(),
    tags: tagsSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided to update an event',
  })

export type EventCreateInput = z.infer<typeof eventCreateSchema>
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>

export type EventListOptions = {
  category?: string | null
  limit?: number
  sessionUser?: { id: string; role: UserRole } | null
}

const normaliseOptionalString = (value?: string | null) => {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const normaliseTags = (value?: string[]) => {
  if (!value) {
    return [] as string[]
  }

  const deduped = new Set<string>()
  for (const entry of value) {
    const trimmed = entry.trim()
    if (trimmed.length > 0) {
      deduped.add(trimmed)
    }
  }

  return Array.from(deduped)
}

const toUtcDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'Invalid date value received')
  }

  return new Date(date.toISOString())
}

const toNumericString = (value?: number | null) => {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  return value.toString()
}

export async function listEvents(options: EventListOptions = {}) {
  const { category, limit = 100, sessionUser } = options
  const conditions: SQL[] = []

  if (category && category.trim().length > 0) {
    conditions.push(eq(events.category, category.trim()))
  }

  if (!sessionUser || sessionUser.role !== 'admin') {
    if (sessionUser) {
      conditions.push(
        or(eq(events.organizerId, sessionUser.id), eq(events.status, 'published')),
      )

      conditions.push(
        or(
          eq(events.organizerId, sessionUser.id),
          eq(events.visibility, 'public'),
          eq(events.visibility, 'members'),
        ),
      )
    } else {
      conditions.push(eq(events.status, 'published'))
      conditions.push(eq(events.visibility, 'public'))
    }
  }

  const qb = db.select().from(events)

  if (conditions.length > 0) {
    const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions.filter(c => c));
    return qb.where(whereCondition).orderBy(asc(events.startAt)).limit(Math.max(1, Math.min(500, limit)))
  } else {
    return qb.orderBy(asc(events.startAt)).limit(Math.max(1, Math.min(500, limit)))
  }
}

export async function getEventById(id: string) {
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1)

  return event
}

export async function createEvent(input: EventCreateInput, organizerId: string) {
  const now = new Date()
  const startAt = toUtcDate(input.startAt)
  const endAt = input.endAt ? toUtcDate(input.endAt) : null

  if (endAt && endAt <= startAt) {
    throw new HttpError(400, 'Event end time must be after the start time')
  }

  const rsvpDeadline = input.rsvpDeadline ? toUtcDate(input.rsvpDeadline) : null

  if (rsvpDeadline && rsvpDeadline > startAt) {
    throw new HttpError(400, 'RSVP deadline must be before the event start time')
  }

  const values: InsertEvent = {
    organizerId,
    businessId: input.businessId ?? null,
    title: input.title.trim(),
    category: input.category.trim(),
    description: input.description.trim(),
    status: input.status ?? 'draft',
    visibility: input.visibility ?? 'public',
    capacity: input.capacity ?? null,
    rsvpDeadline,
    locationName: normaliseOptionalString(input.locationName) ?? null,
    address: normaliseOptionalString(input.address) ?? null,
    latitude: toNumericString(input.latitude) ?? null,
    longitude: toNumericString(input.longitude) ?? null,
    startAt,
    endAt,
    tags: normaliseTags(input.tags),
    createdAt: now,
    updatedAt: now,
  }

  const [event] = await db
    .insert(events)
    .values(values)
    .returning()

  return event
}

export async function updateEvent(event: Event, input: EventUpdateInput) {
  const updates: Partial<InsertEvent> = {
    updatedAt: new Date(),
  }

  if (input.title !== undefined) {
    updates.title = input.title.trim()
  }

  if (input.category !== undefined) {
    updates.category = input.category.trim()
  }

  if (input.description !== undefined) {
    updates.description = input.description.trim()
  }

  if (input.status !== undefined) {
    updates.status = input.status
  }

  if (input.visibility !== undefined) {
    updates.visibility = input.visibility
  }

  if (input.capacity !== undefined) {
    updates.capacity = input.capacity ?? null
  }

  let nextStart = event.startAt
  if (input.startAt !== undefined) {
    nextStart = toUtcDate(input.startAt)
    updates.startAt = nextStart
  }

  let nextEnd = event.endAt
  if (input.endAt !== undefined) {
    if (input.endAt === null) {
      nextEnd = null
      updates.endAt = null
    } else {
      nextEnd = toUtcDate(input.endAt)
      updates.endAt = nextEnd
    }
  }

  if (nextEnd && nextEnd <= nextStart) {
    throw new HttpError(400, 'Event end time must be after the start time')
  }

  if (input.rsvpDeadline !== undefined) {
    if (input.rsvpDeadline === null) {
      updates.rsvpDeadline = null
    } else {
      const deadline = toUtcDate(input.rsvpDeadline)
      if (deadline > nextStart) {
        throw new HttpError(400, 'RSVP deadline must be before the event start time')
      }
      updates.rsvpDeadline = deadline
    }
  } else if (updates.startAt && event.rsvpDeadline && event.rsvpDeadline > nextStart) {
    throw new HttpError(400, 'RSVP deadline must be before the event start time')
  }

  if (input.locationName !== undefined) {
    updates.locationName = normaliseOptionalString(input.locationName) ?? null
  }

  if (input.address !== undefined) {
    updates.address = normaliseOptionalString(input.address) ?? null
  }

  if (input.latitude !== undefined) {
    updates.latitude = toNumericString(input.latitude) ?? null
  }

  if (input.longitude !== undefined) {
    updates.longitude = toNumericString(input.longitude) ?? null
  }

  if (input.tags !== undefined) {
    updates.tags = normaliseTags(input.tags)
  }

  if (input.businessId !== undefined) {
    updates.businessId = input.businessId ?? null
  }

  const [updated] = await db
    .update(events)
    .set(updates)
    .where(eq(events.id, event.id))
    .returning()

  return updated
}

export async function deleteEvent(id: string) {
  await db.delete(events).where(eq(events.id, id))
}

export const serializeEvent = (event: Event) => {
  const tags = Array.isArray(event.tags)
    ? event.tags.filter((entry): entry is string => typeof entry === 'string')
    : []

  return {
    id: event.id,
    organizerId: event.organizerId,
    businessId: event.businessId,
    title: event.title,
    category: event.category,
    description: event.description,
    status: event.status,
    visibility: event.visibility,
    capacity: event.capacity,
    rsvpDeadline: event.rsvpDeadline ? event.rsvpDeadline.toISOString() : null,
    locationName: event.locationName,
    address: event.address,
    latitude: event.latitude,
    longitude: event.longitude,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt ? event.endAt.toISOString() : null,
    tags,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  }
}
