jest.mock('@server/classifieds', () => {
  const actual = jest.requireActual('@server/classifieds')
  return {
    ...actual,
    listClassifieds: jest.fn(),
    createClassified: jest.fn(),
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
    typeof init?.body === 'string'
      ? init.body
      : init?.body !== undefined
      ? JSON.stringify(init.body)
      : undefined
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

import { GET as listClassifiedsRoute, POST as createClassifiedRoute } from '../route'
import {
  createClassified,
  listClassifieds,
  serializeClassified,
} from '@server/classifieds'
import { getSessionUser, requireUser, UnauthorizedError } from '@server/auth'
import { checkRateLimit } from '@/lib/rate-limiting'

const baseClassified = {
  id: '00000000-0000-0000-0000-000000000021',
  ownerId: '00000000-0000-0000-0000-000000000099',
  title: 'Gently Used Sofa',
  description: 'Comfortable three-seat sofa in great condition.',
  type: 'offer',
  status: 'published',
  category: 'furniture',
  price: '120.50',
  currency: 'AUD',
  location: 'Brisbane, QLD',
  expiresAt: new Date('2024-09-01T00:00:00Z'),
  contactInfo: {
    email: 'seller@example.com',
    phone: '+61000000000',
  },
  metadata: {
    images: [
      'https://images.example.com/classifieds/sofa-1.jpg',
      'https://images.example.com/classifieds/sofa-2.jpg',
    ],
  },
  createdAt: new Date('2024-07-01T12:00:00Z'),
  updatedAt: new Date('2024-07-02T12:00:00Z'),
} as const

describe('Classifieds API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/classifieds', () => {
    it('returns classifieds filtered by search parameters', async () => {
      const sessionUser = {
        id: 'member-1',
        role: 'member',
        email: 'member@example.com',
        status: 'active',
      }
      ;(getSessionUser as jest.Mock).mockResolvedValue(sessionUser)
      ;(listClassifieds as jest.Mock).mockResolvedValue([baseClassified])

      const response = await listClassifiedsRoute(
        createRequest(
          'http://localhost/api/classifieds?q=%20sofa%20&category=%20furniture%20',
        ),
      )

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload.classifieds).toHaveLength(1)
      expect(payload.classifieds[0]).toEqual(
        expect.objectContaining({
          id: baseClassified.id,
          title: baseClassified.title,
          price: 120.5,
          imageUrls: baseClassified.metadata.images,
        }),
      )
      expect(listClassifieds).toHaveBeenCalledWith({
        query: 'sofa',
        category: 'furniture',
        sessionUser,
      })
    })

    it('rejects invalid filters', async () => {
      const response = await listClassifiedsRoute(
        createRequest('http://localhost/api/classifieds?q=s'),
      )

      expect(response.status).toBe(400)
      const payload = await response.json()
      expect(payload.error).toBe('Invalid query parameters')
    })
  })

  describe('POST /api/classifieds', () => {
    it('requires authentication', async () => {
      ;(requireUser as jest.Mock).mockRejectedValue(new UnauthorizedError())

      const response = await createClassifiedRoute(
        createRequest('http://localhost/api/classifieds', {
          method: 'POST',
          body: {},
        }),
      )

      expect(response.status).toBe(401)
    })

    it('enforces rate limiting', async () => {
      const user = { id: 'user-1', role: 'member', email: 'user@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(user)
      const resetTime = new Date('2024-07-10T10:00:00Z')
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime,
        blocked: false,
      })

      const response = await createClassifiedRoute(
        createRequest('http://localhost/api/classifieds', {
          method: 'POST',
          body: {
            title: 'Gently Used Sofa',
            description: 'Comfortable three-seat sofa in great condition.',
          },
        }),
      )

      expect(response.status).toBe(429)
      const payload = await response.json()
      expect(payload.retryAfter).toBe(resetTime.toISOString())
    })

    it('validates payload before creating a classified', async () => {
      const user = { id: 'user-1', role: 'member', email: 'user@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(user)
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 9,
        resetTime: new Date('2024-07-10T10:00:00Z'),
        blocked: false,
      })

      const response = await createClassifiedRoute(
        createRequest('http://localhost/api/classifieds', {
          method: 'POST',
          body: {
            title: 'x',
            description: 'short',
          },
        }),
      )

      expect(response.status).toBe(400)
      const payload = await response.json()
      expect(payload.error).toBe('Validation failed')
      expect(createClassified).not.toHaveBeenCalled()
    })

    it('creates a classified listing when payload is valid', async () => {
      const user = { id: 'user-1', role: 'member', email: 'user@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(user)
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 9,
        resetTime: new Date('2024-07-10T10:00:00Z'),
        blocked: false,
      })
      ;(createClassified as jest.Mock).mockResolvedValue(baseClassified)

      const response = await createClassifiedRoute(
        createRequest('http://localhost/api/classifieds', {
          method: 'POST',
          body: {
            title: 'Gently Used Sofa',
            description: 'Comfortable three-seat sofa in great condition.',
            category: 'furniture',
            price: 120.5,
            currency: 'aud',
            imageUrls: baseClassified.metadata.images,
          },
        }),
      )

      expect(response.status).toBe(201)
      const payload = await response.json()
      expect(payload.classified).toEqual(serializeClassified(baseClassified))
      expect(createClassified).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Gently Used Sofa',
          category: 'furniture',
          imageUrls: baseClassified.metadata.images,
        }),
        user.id,
      )
    })
  })
})
