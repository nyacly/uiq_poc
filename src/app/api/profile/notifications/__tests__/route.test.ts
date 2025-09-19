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

jest.mock('@server/notifications', () => {
  const actual = jest.requireActual('@server/notifications')
  return {
    ...actual,
    getNotificationPreferences: jest.fn(),
    updateNotificationPreferences: jest.fn(),
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
    method: init?.method ?? 'GET',
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

import { GET, PATCH } from '../route'
import { checkRateLimit } from '@/lib/rate-limiting'
import { requireUser, UnauthorizedError } from '@server/auth'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@server/notifications'

const baseUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'member@example.com',
  role: 'member' as const,
}

describe('GET /api/profile/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('requires authentication', async () => {
    ;(requireUser as jest.Mock).mockRejectedValue(new UnauthorizedError())

    const response = await GET(createRequest('http://localhost/api/profile/notifications'))

    expect(response.status).toBe(401)
  })

  it('returns preferences for the current user', async () => {
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
    ;(getNotificationPreferences as jest.Mock).mockResolvedValue({
      email: true,
      sms: false,
      digest: 'weekly',
    })

    const response = await GET(createRequest('http://localhost/api/profile/notifications'))

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.preferences).toEqual({ email: true, sms: false, digest: 'weekly' })
    expect(getNotificationPreferences).toHaveBeenCalledWith(baseUser.id)
  })
})

describe('PATCH /api/profile/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
    ;(checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true })
  })

  it('validates payloads', async () => {
    const response = await PATCH(
      createRequest('http://localhost/api/profile/notifications', {
        method: 'PATCH',
        body: {},
      }),
    )

    expect(response.status).toBe(400)
    expect(updateNotificationPreferences).not.toHaveBeenCalled()
  })

  it('enforces rate limits', async () => {
    ;(checkRateLimit as jest.Mock).mockResolvedValue({
      allowed: false,
      resetTime: new Date('2024-01-01T00:00:00Z'),
    })

    const response = await PATCH(
      createRequest('http://localhost/api/profile/notifications', {
        method: 'PATCH',
        body: { email: false },
      }),
    )

    expect(response.status).toBe(429)
    expect(updateNotificationPreferences).not.toHaveBeenCalled()
  })

  it('updates preferences and returns the new values', async () => {
    ;(updateNotificationPreferences as jest.Mock).mockResolvedValue({
      email: false,
      sms: true,
      digest: 'weekly',
    })

    const response = await PATCH(
      createRequest('http://localhost/api/profile/notifications', {
        method: 'PATCH',
        body: { email: false, sms: true },
      }),
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.preferences).toEqual({ email: false, sms: true, digest: 'weekly' })
    expect(updateNotificationPreferences).toHaveBeenCalledWith(baseUser.id, {
      email: false,
      sms: true,
    })
  })
})
