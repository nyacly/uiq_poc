import { and, desc, eq, ilike, or, type SQL } from 'drizzle-orm'
import { z } from 'zod'

import { db, classifieds, type InsertClassified } from '@/lib/db'
import {
  classifiedStatuses,
  classifiedTypes,
  type Classified,
  type UserRole,
} from '@shared/schema'

import { HttpError } from './auth'

const nonEmptyTrimmedString = (min: number, max: number) =>
  z.string().trim().min(min).max(max)

const isoDateTimeWithOffset = z.string().datetime({ offset: true })

const priceSchema = z
  .coerce.number({ invalid_type_error: 'Price must be a number' })
  .min(0, 'Price cannot be negative')
  .max(1_000_000, 'Price exceeds the supported range')
  .refine((value) => Number.isFinite(value) && Number.parseFloat(value.toFixed(2)) === value, {
    message: 'Price must have at most two decimal places',
  })

const contactInfoSchema = z
  .record(z.string().trim().min(1).max(255))
  .optional()

const metadataSchema = z.record(z.unknown()).optional()

const imageUrlsSchema = z
  .array(z.string().trim().url().max(2048))
  .max(10)
  .optional()

export const classifiedCreateSchema = z.object({
  title: nonEmptyTrimmedString(3, 255),
  description: nonEmptyTrimmedString(10, 10_000),
  category: nonEmptyTrimmedString(2, 120).optional(),
  type: z.enum(classifiedTypes).optional(),
  status: z.enum(classifiedStatuses).optional(),
  price: priceSchema.optional(),
  currency: z
    .string()
    .trim()
    .length(3)
    .optional(),
  location: nonEmptyTrimmedString(2, 255).optional(),
  expiresAt: isoDateTimeWithOffset.optional(),
  contactInfo: contactInfoSchema,
  metadata: metadataSchema,
  imageUrls: imageUrlsSchema,
})

export type ClassifiedCreateInput = z.infer<typeof classifiedCreateSchema>

export type ClassifiedListOptions = {
  query?: string | null
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

const normaliseCurrency = (value?: string) => {
  if (!value) {
    return 'USD'
  }

  return value.trim().toUpperCase()
}

const normaliseContactInfo = (
  value?: Record<string, string>,
): Record<string, string> => {
  if (!value) {
    return {}
  }

  const entries: Record<string, string> = {}

  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = rawKey.trim()
    const val = rawValue.trim()

    if (key.length > 0 && val.length > 0) {
      entries[key] = val
    }
  }

  return entries
}

const normaliseMetadata = (value?: Record<string, unknown>) => {
  if (!value) {
    return {}
  }

  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
  } catch {
    return {}
  }
}

const normaliseImageUrls = (value?: string[]) => {
  if (!value) {
    return [] as string[]
  }

  const urls = [] as string[]
  const seen = new Set<string>()

  for (const entry of value) {
    const trimmed = entry.trim()
    if (trimmed.length === 0) {
      continue
    }

    if (!seen.has(trimmed)) {
      urls.push(trimmed)
      seen.add(trimmed)
    }
  }

  return urls
}

const toUtcDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'Invalid date value received')
  }

  return new Date(date.toISOString())
}

const toNumericString = (value?: number) => {
  if (value === undefined) {
    return undefined
  }

  const scaled = Math.round(value * 100)
  return (scaled / 100).toFixed(2)
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const extractContactInfo = (value: unknown): Record<string, string> => {
  if (!isPlainObject(value)) {
    return {}
  }

  const result: Record<string, string> = {}
  for (const [key, rawValue] of Object.entries(value)) {
    if (typeof rawValue === 'string') {
      const trimmedKey = key.trim()
      const trimmedValue = rawValue.trim()
      if (trimmedKey.length > 0 && trimmedValue.length > 0) {
        result[trimmedKey] = trimmedValue
      }
    }
  }

  return result
}

const extractImageUrls = (metadata: unknown): string[] => {
  if (!isPlainObject(metadata)) {
    return []
  }

  const images = metadata.images

  if (!Array.isArray(images)) {
    return []
  }

  const urls: string[] = []
  for (const entry of images) {
    if (typeof entry === 'string') {
      const trimmed = entry.trim()
      if (trimmed.length > 0) {
        urls.push(trimmed)
      }
    }
  }

  return urls
}

export async function listClassifieds(options: ClassifiedListOptions = {}) {
  const { query, category, limit = 50, sessionUser } = options
  const conditions: SQL[] = []

  if (query && query.trim().length > 0) {
    conditions.push(ilike(classifieds.title, `%${query.trim()}%`))
  }

  if (category && category.trim().length > 0) {
    conditions.push(eq(classifieds.category, category.trim()))
  }

  if (!sessionUser || sessionUser.role !== 'admin') {
    if (sessionUser) {
      conditions.push(
        or(eq(classifieds.ownerId, sessionUser.id), eq(classifieds.status, 'published')),
      )
    } else {
      conditions.push(eq(classifieds.status, 'published'))
    }
  }

  const qb = db.select().from(classifieds)

  if (conditions.length > 0) {
    const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions.filter(c => c));
    return qb.where(whereCondition).orderBy(desc(classifieds.createdAt)).limit(Math.max(1, Math.min(100, limit)))
  } else {
    return qb.orderBy(desc(classifieds.createdAt)).limit(Math.max(1, Math.min(100, limit)))
  }
}

export async function createClassified(
  input: ClassifiedCreateInput,
  ownerId: string,
) {
  const now = new Date()
  const metadata = normaliseMetadata(input.metadata)
  const imageUrls = normaliseImageUrls(input.imageUrls)

  if (imageUrls.length > 0) {
    metadata.images = imageUrls
  }

  const values: InsertClassified = {
    ownerId,
    title: input.title.trim(),
    description: input.description.trim(),
    type: input.type ?? 'offer',
    status: input.status ?? 'draft',
    category: normaliseOptionalString(input.category) ?? null,
    price:
      input.price !== undefined ? toNumericString(input.price) ?? null : null,
    currency: normaliseCurrency(input.currency),
    location: normaliseOptionalString(input.location) ?? null,
    expiresAt: input.expiresAt ? toUtcDate(input.expiresAt) : null,
    contactInfo: normaliseContactInfo(input.contactInfo),
    metadata,
    createdAt: now,
    updatedAt: now,
  }

  const [classified] = await db
    .insert(classifieds)
    .values(values)
    .returning()

  return classified
}

export const serializeClassified = (classified: Classified) => {
  const price = classified.price ? Number.parseFloat(classified.price) : null

  return {
    id: classified.id,
    ownerId: classified.ownerId,
    title: classified.title,
    description: classified.description,
    type: classified.type,
    status: classified.status,
    category: classified.category,
    price,
    currency: classified.currency,
    location: classified.location,
    expiresAt: classified.expiresAt ? classified.expiresAt.toISOString() : null,
    contactInfo: extractContactInfo(classified.contactInfo),
    imageUrls: extractImageUrls(classified.metadata),
    createdAt: classified.createdAt.toISOString(),
    updatedAt: classified.updatedAt.toISOString(),
  }
}
