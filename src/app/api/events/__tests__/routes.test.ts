jest.mock('@server/events', () => {
  const actual = jest.requireActual('@server/events')
  return {
    ...actual,
    listEvents: jest.fn(),
    createEvent: jest.fn(),
    getEventById: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
  }
})

jest.mock('@server/auth', () => {
  const actual = jest.requireActual('@server/auth')
  return {
    ...actual,
    getSessionUser: jest.fn(),
    requireUser: jest.fn(),
    ensureOwnerOrAdmin: jest.fn(),
  }
})

jest.mock('@/lib/rate-limiting', () => ({
  checkRateLimit: jest.fn(),
}))

const createRequest = (
  url: string,
  init?: { method?: string; body?: unknown; headers?: Record<string, string> },
) => {
  const serializedBody =
    typeof init?.body === 'string' ? init.body : init?.body !== undefined ? JSON.stringify(init.body) : undefined
  const headerStore = new Map<string, string>()

  if (init?.headers) {
    for (const [key, value] of Object.entries(init.headers)) {
      headerStore.set(key.toLowerCase(), value)
    }
  }

  if (serializedBody && !headerStore.has('content-type')) {
    headerStore.set('content-type', 'application/json')
  }

  return {
    url,
    method: init?.method ?? 'GET',
    headers: {
      get(name: string) {
        return headerStore.get(name.toLowerCase()) ?? null
      },
      has(name: string) {
        return headerStore.has(name.toLowerCase())
      },
    },
    async json() {
      if (!serializedBody) {
        throw new Error('No JSON body present')
      }
      return JSON.parse(serializedBody)
    },
    async text() {
      return serializedBody ?? ''
    },
  } as unknown as Request
}

import { GET as listEventsGet, POST as createEventPost } from '../route'
import {
  DELETE as deleteEventRoute,
  GET as getEventRoute,
  PATCH as updateEventRoute,
} from '../[id]/route'
import {
  createEvent,
  deleteEvent,
  getEventById,
  listEvents,
  updateEvent,
} from '@server/events'
import {
  ensureOwnerOrAdmin,
  getSessionUser,
  requireUser,
  UnauthorizedError,
} from '@server/auth'
import { checkRateLimit } from '@/lib/rate-limiting'

const baseEvent = {
  id: '00000000-0000-0000-0000-000000000001',
  organizerId: '00000000-0000-0000-0000-000000000010',
  businessId: null,
  title: 'Community Gathering',
  category: 'community',
  description: 'An extended description of the community gathering event.',
  status: 'published',
  visibility: 'public',
  capacity: 120,
  rsvpDeadline: new Date('2024-08-10T10:00:00Z'),
  locationName: 'Community Hall',
  address: '123 Main Street, Brisbane',
  latitude: '12.345678',
  longitude: '123.456789',
  startAt: new Date('2024-08-15T18:00:00Z'),
  endAt: new Date('2024-08-15T21:00:00Z'),
  tags: ['community', 'meetup'],
  createdAt: new Date('2024-07-01T00:00:00Z'),
  updatedAt: new Date('2024-07-05T00:00:00Z'),
} as const

describe('Events API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/events', () => {
    it('returns events filtered by category', async () => {
      const sessionUser = { id: 'admin-1', role: 'admin', email: 'admin@example.com', status: 'active' }
      ;(getSessionUser as jest.Mock).mockResolvedValue(sessionUser)
      ;(listEvents as jest.Mock).mockResolvedValue([baseEvent])

      const response = await listEventsGet(createRequest('http://localhost/api/events?category=community&limit=10'))

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload.events).toHaveLength(1)
      expect(payload.events[0]).toEqual(
        expect.objectContaining({
          id: baseEvent.id,
          category: baseEvent.category,
          startAt: baseEvent.startAt.toISOString(),
        }),
      )
      expect(listEvents).toHaveBeenCalledWith({
        category: 'community',
        limit: 10,
        sessionUser,
      })
    })

    it('rejects invalid filters', async () => {
      const response = await listEventsGet(createRequest('http://localhost/api/events?category=c'))

      expect(response.status).toBe(400)
      const payload = await response.json()
      expect(payload.error).toBe('Invalid query parameters')
    })
  })

  describe('POST /api/events', () => {
    it('requires authentication', async () => {
      ;(requireUser as jest.Mock).mockRejectedValue(new UnauthorizedError())

      const response = await createEventPost(
        createRequest('http://localhost/api/events', {
          method: 'POST',
          body: {},
        }),
      )

      expect(response.status).toBe(401)
    })

    it('enforces rate limiting', async () => {
      const user = { id: 'user-1', role: 'member', email: 'user@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(user)
      const resetTime = new Date('2024-07-06T10:00:00Z')
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime,
        blocked: false,
      })

      const response = await createEventPost(
        createRequest('http://localhost/api/events', {
          method: 'POST',
          body: {
            title: 'Community Gathering',
            category: 'community',
            description: 'An extended description of the community gathering event.',
            startAt: '2024-08-15T18:00:00Z',
            endAt: '2024-08-15T21:00:00Z',
          },
        }),
      )

      expect(response.status).toBe(429)
      const payload = await response.json()
      expect(payload.retryAfter).toBe(resetTime.toISOString())
    })

    it('creates an event when payload is valid', async () => {
      const user = { id: 'user-1', role: 'member', email: 'user@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(user)
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: new Date('2024-07-06T10:00:00Z'),
        blocked: false,
      })
      ;(createEvent as jest.Mock).mockResolvedValue(baseEvent)

      const response = await createEventPost(
        createRequest('http://localhost/api/events', {
          method: 'POST',
          body: {
            title: 'Community Gathering',
            category: 'community',
            description: 'An extended description of the community gathering event.',
            startAt: '2024-08-15T18:00:00Z',
            endAt: '2024-08-15T21:00:00Z',
            visibility: 'public',
            status: 'published',
          },
        }),
      )

      expect(response.status).toBe(201)
      const payload = await response.json()
      expect(payload.event.title).toBe(baseEvent.title)
      expect(payload.event.startAt).toBe(baseEvent.startAt.toISOString())
      expect(createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Community Gathering',
          category: 'community',
        }),
        user.id,
      )
    })
  })

  describe('GET /api/events/[id]', () => {
    it('returns a published public event to anonymous visitors', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(null)
      ;(getEventById as jest.Mock).mockResolvedValue(baseEvent)

      const response = await getEventRoute(
        createRequest('http://localhost/api/events/00000000-0000-0000-0000-000000000001'),
        { params: { id: baseEvent.id } },
      )

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload.event.id).toBe(baseEvent.id)
      expect(payload.event.visibility).toBe('public')
    })

    it('hides private events from unauthorised users', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(null)
      ;(getEventById as jest.Mock).mockResolvedValue({
        ...baseEvent,
        status: 'published',
        visibility: 'private',
      })

      const response = await getEventRoute(
        createRequest('http://localhost/api/events/00000000-0000-0000-0000-000000000001'),
        { params: { id: baseEvent.id } },
      )

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/events/[id]', () => {
    it('updates an event when authorised', async () => {
      const user = { id: baseEvent.organizerId, role: 'member', email: 'user@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(user)
      ;(getEventById as jest.Mock).mockResolvedValue(baseEvent)
      ;(ensureOwnerOrAdmin as jest.Mock).mockImplementation(() => {})
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 3,
        resetTime: new Date('2024-07-06T10:00:00Z'),
        blocked: false,
      })
      const updated = {
        ...baseEvent,
        title: 'Updated Community Gathering',
        updatedAt: new Date('2024-07-06T00:00:00Z'),
      }
      ;(updateEvent as jest.Mock).mockResolvedValue(updated)

      const response = await updateEventRoute(
        createRequest('http://localhost/api/events/00000000-0000-0000-0000-000000000001', {
          method: 'PATCH',
          body: { title: 'Updated Community Gathering' },
        }),
        { params: { id: baseEvent.id } },
      )

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload.event.title).toBe('Updated Community Gathering')
      expect(updateEvent).toHaveBeenCalledWith(baseEvent, { title: 'Updated Community Gathering' })
    })
  })

  describe('DELETE /api/events/[id]', () => {
    it('deletes an event when authorised', async () => {
      const user = { id: baseEvent.organizerId, role: 'member', email: 'user@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(user)
      ;(getEventById as jest.Mock).mockResolvedValue(baseEvent)
      ;(ensureOwnerOrAdmin as jest.Mock).mockImplementation(() => {})
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 2,
        resetTime: new Date('2024-07-06T10:00:00Z'),
        blocked: false,
      })

        const response = await deleteEventRoute(
          createRequest('http://localhost/api/events/00000000-0000-0000-0000-000000000001'),
          {
            params: { id: baseEvent.id },
          },
        )

      expect(response.status).toBe(204)
      expect(deleteEvent).toHaveBeenCalledWith(baseEvent.id)
    })

    it('returns 404 when the event does not exist', async () => {
      const user = { id: baseEvent.organizerId, role: 'member', email: 'user@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(user)
      ;(getEventById as jest.Mock).mockResolvedValue(undefined)

      const response = await deleteEventRoute(
        createRequest('http://localhost/api/events/00000000-0000-0000-0000-000000000001'),
        {
          params: { id: baseEvent.id },
        },
      )

      expect(response.status).toBe(404)
    })
  })
})
