import { randomUUID } from 'crypto'

import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'

import { db, serviceProviders, type InsertServiceProvider } from '@/lib/db'
import { generateSlug } from '@/lib/utils'
import type { UserRole } from '@shared/schema'

const MAX_SEARCH_RESULTS = 50

const baseProviderSchema = z.object({
  name: z.string().trim().min(2).max(255),
  description: z.string().trim().max(2000).optional(),
  services: z.array(z.string().trim().min(1).max(120)).max(25).optional(),
  baseLocation: z.string().trim().min(2).max(255).optional(),
  suburb: z.string().trim().min(2).max(120).optional(),
  state: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(3).max(32).optional(),
  email: z.string().trim().email().max(255).optional(),
  website: z.string().trim().url().max(512).optional(),
  whatsapp: z.string().trim().min(5).max(64).optional(),
  metadata: z.record(z.any()).optional(),
})

export const providerCreateSchema = baseProviderSchema

export const providerUpdateSchema = baseProviderSchema
  .partial()
  .extend({
    isVerified: z.boolean().optional(),
  })

export type ProviderCreateInput = z.infer<typeof providerCreateSchema>
export type ProviderUpdateInput = z.infer<typeof providerUpdateSchema>

export type ProviderListOptions = {
  query?: string | null
  suburb?: string | null
  category?: string | null
  limit?: number
  sessionUser?: { id: string; role: UserRole } | null
}

export type GeocodedLocation = {
  latitude: number
  longitude: number
  suburb?: string | null
}

const formatCoordinate = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined
  }

  return value.toFixed(6)
}

const MAX_SLUG_ATTEMPTS = 20

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

const normaliseServices = (services?: string[]) => {
  if (!services) {
    return [] as string[]
  }

  const deduped = new Set<string>()
  for (const entry of services) {
    const trimmed = entry.trim()
    if (trimmed.length > 0) {
      deduped.add(trimmed)
    }
  }

  return Array.from(deduped)
}

const normaliseMetadata = (metadata?: Record<string, unknown>) => {
  if (!metadata) {
    return {}
  }

  try {
    return JSON.parse(JSON.stringify(metadata))
  } catch {
    return {}
  }
}

async function slugExists(slug: string, excludeId?: string) {
  const existing = await db
    .select({ id: serviceProviders.id })
    .from(serviceProviders)
    .where(eq(serviceProviders.slug, slug))
    .limit(1)

  if (existing.length === 0) {
    return false
  }

  if (excludeId && existing[0].id === excludeId) {
    return false
  }

  return true
}

export async function generateUniqueProviderSlug(name: string, excludeId?: string) {
  const baseSlug = (() => {
    const generated = generateSlug(name)
    if (generated.length > 0) {
      return generated
    }
    return `provider-${randomUUID().slice(0, 8)}`
  })()

  let candidate = baseSlug
  let attempt = 0

  while (attempt < MAX_SLUG_ATTEMPTS && (await slugExists(candidate, excludeId))) {
    attempt += 1
    candidate = `${baseSlug}-${attempt}`
  }

  if (await slugExists(candidate, excludeId)) {
    return `${baseSlug}-${randomUUID().slice(0, 6)}`
  }

  return candidate
}

export async function listProviders(options: ProviderListOptions = {}) {
  const { query, suburb, category, limit = MAX_SEARCH_RESULTS, sessionUser } = options
  const conditions: SQL<unknown>[] = []

  if (query && query.trim().length > 0) {
    const pattern = `%${query.trim()}%`
    // TODO: Replace with Postgres full-text search when dedicated indexes are available.
    conditions.push(
      or(
        ilike(serviceProviders.name, pattern),
        ilike(serviceProviders.description, pattern),
        ilike(serviceProviders.baseLocation, pattern),
      ),
    )
  }

  if (suburb && suburb.trim().length > 0) {
    conditions.push(ilike(serviceProviders.suburb, `%${suburb.trim()}%`))
  }

  if (category && category.trim().length > 0) {
    const pattern = `%${category.trim()}%`
    conditions.push(
      sql`EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(${serviceProviders.services}) AS service
        WHERE service ILIKE ${pattern}
      )`,
    )
  }

  if (!sessionUser || sessionUser.role !== 'admin') {
    if (sessionUser) {
      conditions.push(
        or(
          eq(serviceProviders.isVerified, true),
          eq(serviceProviders.userId, sessionUser.id),
        ),
      )
    } else {
      conditions.push(eq(serviceProviders.isVerified, true))
    }
  }

  let queryBuilder = db
    .select()
    .from(serviceProviders)
    .orderBy(desc(serviceProviders.createdAt))
    .limit(Math.max(1, Math.min(MAX_SEARCH_RESULTS, limit)))

  if (conditions.length === 1) {
    queryBuilder = queryBuilder.where(conditions[0])
  } else if (conditions.length > 1) {
    queryBuilder = queryBuilder.where(and(...conditions))
  }

  return queryBuilder
}

export async function getProviderById(id: string) {
  const [provider] = await db
    .select()
    .from(serviceProviders)
    .where(eq(serviceProviders.id, id))
    .limit(1)

  return provider
}

export async function createProvider(
  input: ProviderCreateInput,
  ownerId: string,
  geocoded?: GeocodedLocation | null,
) {
  const data = providerCreateSchema.parse(input)
  const now = new Date()
  const slug = await generateUniqueProviderSlug(data.name)

  const values: InsertServiceProvider = {
    userId: ownerId,
    name: data.name.trim(),
    slug,
    description: normaliseOptionalString(data.description) ?? null,
    services: normaliseServices(data.services),
    baseLocation: normaliseOptionalString(data.baseLocation),
    suburb: normaliseOptionalString(data.suburb),
    state: normaliseOptionalString(data.state),
    phone: normaliseOptionalString(data.phone),
    email: normaliseOptionalString(data.email),
    website: normaliseOptionalString(data.website),
    whatsapp: normaliseOptionalString(data.whatsapp),
    metadata: normaliseMetadata(data.metadata),
    isVerified: false,
    createdAt: now,
    updatedAt: now,
  }

  if (geocoded) {
    const latitude = formatCoordinate(geocoded.latitude)
    const longitude = formatCoordinate(geocoded.longitude)

    if (latitude !== undefined) {
      values.latitude = latitude
    }

    if (longitude !== undefined) {
      values.longitude = longitude
    }

    const geocodedSuburb = normaliseOptionalString(geocoded.suburb)
    if (geocodedSuburb !== undefined) {
      values.suburb = geocodedSuburb
    }
  }

  const [provider] = await db
    .insert(serviceProviders)
    .values(values)
    .returning()

  return provider
}

export async function updateProvider(
  id: string,
  input: ProviderUpdateInput,
  geocoded?: GeocodedLocation | null,
) {
  const data = providerUpdateSchema.parse(input)
  const updates: Partial<InsertServiceProvider> = {
    updatedAt: new Date(),
  }

  if (data.name !== undefined) {
    updates.name = data.name.trim()
    updates.slug = await generateUniqueProviderSlug(data.name, id)
  }

  if (data.description !== undefined) {
    updates.description = normaliseOptionalString(data.description) ?? null
  }

  if (data.services !== undefined) {
    updates.services = normaliseServices(data.services)
  }

  if (data.baseLocation !== undefined) {
    updates.baseLocation = normaliseOptionalString(data.baseLocation)
  }

  if (data.suburb !== undefined) {
    updates.suburb = normaliseOptionalString(data.suburb)
  }

  if (data.state !== undefined) {
    updates.state = normaliseOptionalString(data.state)
  }

  if (data.phone !== undefined) {
    updates.phone = normaliseOptionalString(data.phone)
  }

  if (data.email !== undefined) {
    updates.email = normaliseOptionalString(data.email)
  }

  if (data.website !== undefined) {
    updates.website = normaliseOptionalString(data.website)
  }

  if (data.whatsapp !== undefined) {
    updates.whatsapp = normaliseOptionalString(data.whatsapp)
  }

  if (data.metadata !== undefined) {
    updates.metadata = normaliseMetadata(data.metadata)
  }

  if (data.isVerified !== undefined) {
    updates.isVerified = data.isVerified
  }

  if (geocoded) {
    const latitude = formatCoordinate(geocoded.latitude)
    const longitude = formatCoordinate(geocoded.longitude)

    if (latitude !== undefined) {
      updates.latitude = latitude
    }

    if (longitude !== undefined) {
      updates.longitude = longitude
    }

    const geocodedSuburb = normaliseOptionalString(geocoded.suburb)
    if (geocodedSuburb !== undefined) {
      updates.suburb = geocodedSuburb
    }
  }

  const [provider] = await db
    .update(serviceProviders)
    .set(updates)
    .where(eq(serviceProviders.id, id))
    .returning()

  return provider
}

export async function deleteProvider(id: string) {
  await db.delete(serviceProviders).where(eq(serviceProviders.id, id))
}
