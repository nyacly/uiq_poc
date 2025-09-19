jest.mock('@server/auth', () => {
  const actual = jest.requireActual('@server/auth')
  return {
    ...actual,
    requireUser: jest.fn(),
  }
})

jest.mock('@/lib/rate-limiting', () => ({
  checkRateLimit: jest.fn(),
}))

jest.mock('@server/rsvps', () => {
  const actual = jest.requireActual('@server/rsvps')
  return {
    ...actual,
    createEventRsvp: jest.fn(),
    serializeRsvp: jest.fn(),
  }
})

const createRequest = (url: string, init?: { method?: string; body?: unknown }) => {
  const serializedBody =
    typeof init?.body === 'string'
      ? init.body
      : init?.body !== undefined
        ? JSON.stringify(init.body)
        : undefined

  return {
    url,
    method: init?.method ?? 'POST',
    headers: {
      get(name: string) {
        if (serializedBody && name.toLowerCase() === 'content-type') {
          return 'application/json'
        }
        return null
      },
    },
    async json() {
      if (!serializedBody) {
        throw new Error('No body provided')
      }
      return JSON.parse(serializedBody)
    },
  } as unknown as Request
}

import { POST } from '../route'
import { checkRateLimit } from '@/lib/rate-limiting'
import { requireUser, UnauthorizedError } from '@server/auth'
import { createEventRsvp, serializeRsvp } from '@server/rsvps'

describe('POST /api/events/:eventId/rsvps', () => {
  const baseUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'member@example.com',
    role: 'member' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true })
    ;(serializeRsvp as jest.Mock).mockImplementation((value) => value)
  })

  it('requires authentication', async () => {
    ;(requireUser as jest.Mock).mockRejectedValue(new UnauthorizedError())

    const response = await POST(
      createRequest('http://localhost/api/events/not-a-uuid/rsvps', {
        body: {},
      }),
      { params: { eventId: 'f1b6dbde-2c90-4bf9-8a2a-0e63ab4a1c5d' } },
    )

    expect(response.status).toBe(401)
  })

  it('validates the event id parameter', async () => {
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)

    const response = await POST(
      createRequest('http://localhost/api/events/not-a-uuid/rsvps', {
        body: {},
      }),
      { params: { eventId: 'not-a-uuid' } },
    )

    expect(response.status).toBe(400)
    expect(createEventRsvp).not.toHaveBeenCalled()
  })

  it('enforces rate limits', async () => {
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
    ;(checkRateLimit as jest.Mock).mockResolvedValue({
      allowed: false,
      resetTime: new Date('2024-01-01T00:00:00Z'),
    })

    const response = await POST(
      createRequest('http://localhost/api/events/event-id/rsvps', {
        body: { guestCount: 2 },
      }),
      { params: { eventId: 'f1b6dbde-2c90-4bf9-8a2a-0e63ab4a1c5d' } },
    )

    expect(response.status).toBe(429)
    expect(createEventRsvp).not.toHaveBeenCalled()
  })

  it('validates the request payload', async () => {
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)

    const response = await POST(
      createRequest('http://localhost/api/events/event-id/rsvps', {
        body: { guestCount: 0 },
      }),
      { params: { eventId: 'f1b6dbde-2c90-4bf9-8a2a-0e63ab4a1c5d' } },
    )

    expect(response.status).toBe(400)
    expect(createEventRsvp).not.toHaveBeenCalled()
  })

  it('creates an RSVP', async () => {
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
    const rsvp = {
      id: '99999999-9999-4999-9999-999999999999',
      eventId: 'f1b6dbde-2c90-4bf9-8a2a-0e63ab4a1c5d',
      userId: baseUser.id,
      status: 'confirmed',
      guestCount: 2,
      notes: null,
      respondedAt: new Date('2024-01-01T10:00:00Z'),
    }
    ;(createEventRsvp as jest.Mock).mockResolvedValue(rsvp)
    const serialized = {
      ...rsvp,
      respondedAt: rsvp.respondedAt.toISOString(),
    }
    ;(serializeRsvp as jest.Mock).mockReturnValue(serialized)

    const response = await POST(
      createRequest('http://localhost/api/events/event-id/rsvps', {
        body: { guestCount: 2 },
      }),
      { params: { eventId: 'f1b6dbde-2c90-4bf9-8a2a-0e63ab4a1c5d' } },
    )

    expect(response.status).toBe(201)
    expect(createEventRsvp).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'f1b6dbde-2c90-4bf9-8a2a-0e63ab4a1c5d', guestCount: 2 }),
      baseUser,
    )
    const payload = await response.json()
    expect(payload.rsvp).toEqual(serialized)
  })
})
