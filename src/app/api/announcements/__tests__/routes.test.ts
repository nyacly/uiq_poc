jest.mock('@server/announcements', () => {
  const actual = jest.requireActual('@server/announcements')
  return {
    ...actual,
    listAnnouncements: jest.fn(),
    createAnnouncement: jest.fn(),
    serializeAnnouncement: jest.fn((value: unknown) => value),
  }
})

jest.mock('@server/auth', () => {
  const actual = jest.requireActual('@server/auth')
  return {
    ...actual,
    getSessionUser: jest.fn(),
    requireUser: jest.fn(),
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

import { GET as listAnnouncementsRoute, POST as createAnnouncementRoute } from '../route'
import {
  createAnnouncement,
  listAnnouncements,
  serializeAnnouncement,
} from '@server/announcements'
import { getSessionUser, requireUser, UnauthorizedError } from '@server/auth'
import { checkRateLimit } from '@/lib/rate-limiting'

describe('Announcements API routes', () => {
  const baseAnnouncement = {
    id: '00000000-0000-0000-0000-000000000001',
    authorId: '00000000-0000-0000-0000-000000000999',
    title: 'Important Update',
    body: 'This is a critical update for the community.',
    type: 'urgent',
    audience: 'public',
    isApproved: true,
    publishedAt: new Date('2024-07-01T10:00:00Z'),
    expiresAt: null,
    attachments: [],
    extra: { severity: 'high' },
    createdAt: new Date('2024-07-01T09:00:00Z'),
    updatedAt: new Date('2024-07-01T09:30:00Z'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/announcements', () => {
    it('returns announcements for the current session user', async () => {
      const sessionUser = { id: 'admin-1', role: 'admin', email: 'admin@example.com', status: 'active' }
      ;(getSessionUser as jest.Mock).mockResolvedValue(sessionUser)
      ;(listAnnouncements as jest.Mock).mockResolvedValue([baseAnnouncement])
      ;(serializeAnnouncement as jest.Mock).mockReturnValue({
        id: baseAnnouncement.id,
        title: baseAnnouncement.title,
      })

      const response = await listAnnouncementsRoute(createRequest('http://localhost/api/announcements'))

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload.announcements).toEqual([
        expect.objectContaining({ id: baseAnnouncement.id, title: baseAnnouncement.title }),
      ])
      expect(listAnnouncements).toHaveBeenCalledWith({ sessionUser })
    })

    it('handles unexpected failures gracefully', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(null)
      ;(listAnnouncements as jest.Mock).mockRejectedValue(new Error('database unavailable'))

      const response = await listAnnouncementsRoute(createRequest('http://localhost/api/announcements'))

      expect(response.status).toBe(500)
      const payload = await response.json()
      expect(payload.error).toBe('Failed to load announcements')
    })
  })

  describe('POST /api/announcements', () => {
    it('requires authentication', async () => {
      ;(requireUser as jest.Mock).mockRejectedValue(new UnauthorizedError())

      const response = await createAnnouncementRoute(
        createRequest('http://localhost/api/announcements', {
          method: 'POST',
          body: {},
        }),
      )

      expect(response.status).toBe(401)
    })

    it('enforces rate limiting when submissions are too frequent', async () => {
      const user = { id: 'user-1', role: 'member', email: 'user@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(user)
      const resetTime = new Date('2024-07-02T10:00:00Z')
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime,
        blocked: false,
      })

      const response = await createAnnouncementRoute(
        createRequest('http://localhost/api/announcements', {
          method: 'POST',
          body: {
            type: 'general',
            title: 'Community Update',
            body: 'Welcome to the community!',
          },
        }),
      )

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBeDefined()
      const payload = await response.json()
      expect(payload.retryAfter).toBe(resetTime.toISOString())
    })

    it('validates the incoming payload', async () => {
      const user = { id: 'user-1', role: 'member', email: 'user@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(user)
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 10,
        resetTime: new Date('2024-07-02T10:00:00Z'),
        blocked: false,
      })

      const response = await createAnnouncementRoute(
        createRequest('http://localhost/api/announcements', {
          method: 'POST',
          body: {
            type: 'unknown-type',
            title: 'Hi',
            body: 'Short body',
          },
        }),
      )

      expect(response.status).toBe(400)
      const payload = await response.json()
      expect(payload.error).toBe('Validation failed')
    })

    it('creates an announcement when payload is valid', async () => {
      const user = { id: 'admin-1', role: 'admin', email: 'admin@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(user)
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 11,
        resetTime: new Date('2024-07-02T10:00:00Z'),
        blocked: false,
      })

      ;(createAnnouncement as jest.Mock).mockResolvedValue(baseAnnouncement)
      ;(serializeAnnouncement as jest.Mock).mockReturnValue({
        id: baseAnnouncement.id,
        title: baseAnnouncement.title,
        isApproved: baseAnnouncement.isApproved,
      })

      const response = await createAnnouncementRoute(
        createRequest('http://localhost/api/announcements', {
          method: 'POST',
          body: {
            type: 'urgent',
            title: 'Important Update',
            body: 'This is a critical update for the community.',
            extra: { severity: 'high' },
          },
        }),
      )

      expect(response.status).toBe(201)
      const payload = await response.json()
      expect(payload.announcement).toEqual(
        expect.objectContaining({ id: baseAnnouncement.id, isApproved: true }),
      )
      expect(createAnnouncement).toHaveBeenCalledWith(
        {
          type: 'urgent',
          title: 'Important Update',
          body: 'This is a critical update for the community.',
          extra: { severity: 'high' },
        },
        user,
      )
    })
  })
})
