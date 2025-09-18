import { z } from 'zod'

import { rsvpStatuses } from '../schema'

const isoDateTimeWithOffset = z.string().datetime({ offset: true })

export const rsvpSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(rsvpStatuses),
  guestCount: z.number().int().min(1),
  respondedAt: isoDateTimeWithOffset,
  notes: z.string().trim().min(1).max(2000).optional().nullable(),
})

export const rsvpCreateSchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(rsvpStatuses).optional(),
  guestCount: z.number().int().min(1).max(20).default(1),
  notes: z.string().trim().min(1).max(2000).optional(),
})

export const rsvpUpdateSchema = z
  .object({
    status: z.enum(rsvpStatuses).optional(),
    guestCount: z.number().int().min(1).max(20).optional(),
    notes: z.string().trim().min(1).max(2000).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided when updating an RSVP',
  })

export type RsvpModel = z.infer<typeof rsvpSchema>
export type CreateRsvpInput = z.infer<typeof rsvpCreateSchema>
export type UpdateRsvpInput = z.infer<typeof rsvpUpdateSchema>
