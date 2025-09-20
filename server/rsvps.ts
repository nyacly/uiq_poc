import { and, eq } from 'drizzle-orm'

import { db, events, rsvps, users } from '@/lib/db'
import { HttpError } from '@server/auth'
import {
  buildAbsoluteUrl,
  getNotificationPreferences,
  notifyEmail,
  notifySms,
} from '@server/notifications'
import type { CreateRsvpInput } from '@shared/models/rsvp'
import { rsvpCreateSchema } from '@shared/models/rsvp'
import type { Event, Rsvp, UserRole } from '@shared/schema'

export type MinimalUser = { id: string; role: UserRole }

export async function createEventRsvp(
  input: CreateRsvpInput,
  user: MinimalUser,
) {
  const payload = rsvpCreateSchema.parse(input)

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, payload.eventId))
    .limit(1)

  if (!event) {
    throw new HttpError(404, 'Event not found')
  }

  if (event.organizerId !== user.id && user.role !== 'admin') {
    if (event.status !== 'published') {
      throw new HttpError(403, 'You do not have permission to RSVP to this event')
    }
  }

  const now = new Date()
  const deadline = event.rsvpDeadline ?? event.startAt

  if (deadline && deadline < now) {
    throw new HttpError(400, 'RSVP deadline has passed')
  }

  const [existing] = await db
    .select({ id: rsvps.id })
    .from(rsvps)
    .where(and(eq(rsvps.eventId, event.id), eq(rsvps.userId, user.id)))
    .limit(1)

  if (existing) {
    throw new HttpError(409, 'You have already responded to this event')
  }

  const [created] = await db
    .insert(rsvps)
    .values({
      eventId: event.id,
      userId: user.id,
      status: payload.status ?? 'confirmed',
      guestCount: payload.guestCount ?? 1,
      notes: payload.notes ?? null,
    })
    .returning()

  await sendRsvpNotifications(user.id, created, event)

  return created
}

async function sendRsvpNotifications(userId: string, rsvp: Rsvp, event: Event) {
  const eventUrl = buildAbsoluteUrl(`/events/${event.id}`)
  const location = event.locationName ?? event.address ?? null

  await notifyEmail(userId, `RSVP confirmed: ${event.title}`, {
    template: 'rsvpConfirmation',
    eventTitle: event.title,
    eventStartAt: event.startAt,
    eventLocation: location,
    rsvpStatus: rsvp.status,
    guestCount: rsvp.guestCount,
    eventUrl,
  })
}

export const serializeRsvp = (record: Rsvp) => ({
  id: record.id,
  eventId: record.eventId,
  userId: record.userId,
  status: record.status,
  guestCount: record.guestCount,
  notes: record.notes ?? null,
  respondedAt: record.respondedAt.toISOString(),
})
