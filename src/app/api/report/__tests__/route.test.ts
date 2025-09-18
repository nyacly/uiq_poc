jest.mock('@server/reports', () => {
  const actual = jest.requireActual('@server/reports')
  return {
    ...actual,
    createReport: jest.fn(),
  }
})

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
    method: init?.method ?? 'POST',
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

import { POST as createReportRoute } from '../route'
import { createReport } from '@server/reports'
import { requireUser, UnauthorizedError } from '@server/auth'
import { checkRateLimit } from '@/lib/rate-limiting'

describe('POST /api/report', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('requires authentication', async () => {
    ;(requireUser as jest.Mock).mockRejectedValue(new UnauthorizedError())

    const response = await createReportRoute(
      createRequest('http://localhost/api/report', {
        method: 'POST',
        body: {
          targetType: 'user',
          targetId: '00000000-0000-0000-0000-000000000111',
          reason: 'spam',
        },
      }),
    )

    expect(response.status).toBe(401)
  })

  it('enforces rate limiting', async () => {
    const user = {
      id: 'user-123',
      role: 'member',
      email: 'member@example.com',
      status: 'active',
    }
    ;(requireUser as jest.Mock).mockResolvedValue(user)

    const resetTime = new Date('2024-07-11T10:00:00Z')
    ;(checkRateLimit as jest.Mock).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime,
      blocked: false,
    })

    const response = await createReportRoute(
      createRequest('http://localhost/api/report', {
        method: 'POST',
        body: {
          targetType: 'user',
          targetId: '00000000-0000-0000-0000-000000000222',
          reason: 'spam content',
        },
      }),
    )

    expect(response.status).toBe(429)
    const payload = await response.json()
    expect(payload.retryAfter).toBe(resetTime.toISOString())
  })

  it('validates the incoming payload', async () => {
    const user = {
      id: 'user-456',
      role: 'member',
      email: 'member@example.com',
      status: 'active',
    }
    ;(requireUser as jest.Mock).mockResolvedValue(user)
    ;(checkRateLimit as jest.Mock).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: new Date('2024-07-11T10:00:00Z'),
      blocked: false,
    })

    const response = await createReportRoute(
      createRequest('http://localhost/api/report', {
        method: 'POST',
        body: {
          targetType: 'user',
          targetId: '00000000-0000-0000-0000-000000000333',
          reason: 'no',
        },
      }),
    )

    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.error).toBe('Validation failed')
  })

  it('creates a report when validation passes', async () => {
    const user = {
      id: 'user-789',
      role: 'member',
      email: 'member@example.com',
      status: 'active',
    }
    ;(requireUser as jest.Mock).mockResolvedValue(user)
    ;(checkRateLimit as jest.Mock).mockResolvedValue({
      allowed: true,
      remaining: 8,
      resetTime: new Date('2024-07-11T10:10:00Z'),
      blocked: false,
    })

    const createdAt = new Date('2024-07-01T12:00:00Z')
    const updatedAt = new Date('2024-07-01T12:00:00Z')

    ;(createReport as jest.Mock).mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000444',
      reporterId: user.id,
      targetType: 'user',
      targetId: '00000000-0000-0000-0000-000000000555',
      reason: 'harassment',
      status: 'open',
      details: null,
      resolution: null,
      createdAt,
      updatedAt,
      metadata: {},
    })

    const response = await createReportRoute(
      createRequest('http://localhost/api/report', {
        method: 'POST',
        body: {
          targetType: 'user',
          targetId: '00000000-0000-0000-0000-000000000555',
          reason: 'harassment',
        },
      }),
    )

    expect(createReport).toHaveBeenCalledWith({
      targetType: 'user',
      targetId: '00000000-0000-0000-0000-000000000555',
      reason: 'harassment',
      reporterId: user.id,
    })

    expect(response.status).toBe(201)
    const payload = await response.json()
    expect(payload.report).toEqual({
      id: '00000000-0000-0000-0000-000000000444',
      reporterId: user.id,
      targetType: 'user',
      targetId: '00000000-0000-0000-0000-000000000555',
      reason: 'harassment',
      status: 'open',
      details: null,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    })
  })
})
