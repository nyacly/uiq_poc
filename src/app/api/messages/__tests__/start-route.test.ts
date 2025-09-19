jest.mock('@server/messages', () => {
  const actual = jest.requireActual('@server/messages')
  return {
    ...actual,
    startConversation: jest.fn(),
    serializeConversation: jest.fn(),
    serializeMessage: jest.fn(),
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

jest.mock('@server/usage', () => {
  const actual = jest.requireActual('@server/usage')
  return {
    ...actual,
    getUserSubscriptionTier: jest.fn(),
    getUsageCount: jest.fn(),
    incrementUsage: jest.fn(),
  }
})

const createRequest = (url: string, init?: { method?: string; body?: unknown; headers?: Record<string, string> }) => {
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
      if (serializedBody === undefined) {
        throw new Error('No JSON body present')
      }

      return JSON.parse(serializedBody)
    },
  } as unknown as Request
}

import { POST as startConversationRoute } from '../start/route'
import { HttpError, UnauthorizedError, requireUser } from '@server/auth'
import { checkRateLimit } from '@/lib/rate-limiting'
import { startConversation, serializeConversation, serializeMessage } from '@server/messages'
import {
  checkQuota,
  getUserSubscriptionTier,
  getUsageCount,
  incrementUsage,
} from '@server/usage'

describe('POST /api/messages/start', () => {
  const baseUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'initiator@example.com',
    role: 'member' as const,
    status: 'active' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getUserSubscriptionTier as jest.Mock).mockResolvedValue('free')
    ;(getUsageCount as jest.Mock).mockResolvedValue(0)
    ;(incrementUsage as jest.Mock).mockResolvedValue(1)
  })

  it('requires authentication', async () => {
    ;(requireUser as jest.Mock).mockRejectedValue(new UnauthorizedError())

    const response = await startConversationRoute(
      createRequest('http://localhost/api/messages/start', {
        method: 'POST',
        body: {},
      }),
    )

    expect(response.status).toBe(401)
  })

  it('enforces rate limiting', async () => {
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
    ;(checkRateLimit as jest.Mock).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: new Date('2024-01-01T00:00:00Z'),
      blocked: false,
    })

    const response = await startConversationRoute(
      createRequest('http://localhost/api/messages/start', {
        body: {
          targetUserId: '22222222-2222-2222-2222-222222222222',
          firstMessage: 'Hello there',
        },
      }),
    )

    expect(response.status).toBe(429)
    const payload = await response.json()
    expect(payload.error).toBe('Too many messages. Please try again later.')
  })

  it('rejects invalid payloads', async () => {
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
    ;(checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true })

    const response = await startConversationRoute(
      createRequest('http://localhost/api/messages/start', {
        body: {
          targetUserId: 'not-a-uuid',
          firstMessage: '',
        },
      }),
    )

    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.error).toBe('Validation failed')
  })

  it('returns 429 when the free plan daily message quota is reached', async () => {
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
    ;(checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true })
    ;(getUserSubscriptionTier as jest.Mock).mockResolvedValue('free')

    const quota = checkQuota('free', 'messages')
    expect(quota.limit).not.toBeNull()
    ;(getUsageCount as jest.Mock).mockResolvedValue(quota.limit)

    const response = await startConversationRoute(
      createRequest('http://localhost/api/messages/start', {
        body: {
          targetUserId: '22222222-2222-2222-2222-222222222222',
          firstMessage: 'Hello there',
        },
      }),
    )

    expect(response.status).toBe(429)
    const payload = await response.json()
    expect(payload.error).toMatch(/messaging/i)
    expect(payload.limit).toBe(quota.limit)
    expect(payload.period).toBe(quota.period)
    expect(startConversation).not.toHaveBeenCalled()
    expect(incrementUsage).not.toHaveBeenCalled()
  })

  it('creates a conversation and returns serialized data', async () => {
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
    ;(checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true })

    const conversation = {
      id: '33333333-3333-3333-3333-333333333333',
      createdBy: baseUser.id,
      topic: 'Inquiry about listing',
      isGroup: false,
      createdAt: new Date('2024-01-02T10:00:00Z'),
      updatedAt: new Date('2024-01-02T10:00:00Z'),
      metadata: {},
    }

    const message = {
      id: '44444444-4444-4444-4444-444444444444',
      conversationId: conversation.id,
      senderId: baseUser.id,
      type: 'text',
      status: 'sent',
      body: 'Hello there',
      attachments: [],
      createdAt: new Date('2024-01-02T10:00:00Z'),
      updatedAt: new Date('2024-01-02T10:00:00Z'),
      deliveredAt: null,
      readAt: null,
    }

    ;(startConversation as jest.Mock).mockResolvedValue({
      conversation,
      participants: [],
      message,
      unreadCount: 0,
    })

    ;(serializeConversation as jest.Mock).mockReturnValue({
      id: conversation.id,
      topic: conversation.topic,
    })

    ;(serializeMessage as jest.Mock).mockReturnValue({
      id: message.id,
      body: message.body,
    })

    const response = await startConversationRoute(
      createRequest('http://localhost/api/messages/start', {
        body: {
          targetUserId: '22222222-2222-2222-2222-222222222222',
          subject: 'Inquiry about listing',
          context: { type: 'classified', entityId: '55555555-5555-5555-5555-555555555555' },
          firstMessage: 'Hello there',
        },
      }),
    )

    expect(response.status).toBe(201)
    const payload = await response.json()
    expect(payload).toEqual({
      conversation: { id: conversation.id, topic: conversation.topic },
      message: { id: message.id, body: message.body },
      unreadCount: 0,
    })

    expect(startConversation).toHaveBeenCalledWith(
      {
        targetUserId: '22222222-2222-2222-2222-222222222222',
        subject: 'Inquiry about listing',
        context: { type: 'classified', entityId: '55555555-5555-5555-5555-555555555555' },
        firstMessage: 'Hello there',
      },
      baseUser,
    )
    expect(incrementUsage).toHaveBeenCalledWith(baseUser.id, 'day', 'messages')
  })

  it('handles server errors gracefully', async () => {
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
    ;(checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true })
    ;(startConversation as jest.Mock).mockRejectedValue(new HttpError(404, 'Target user not found'))

    const response = await startConversationRoute(
      createRequest('http://localhost/api/messages/start', {
        body: {
          targetUserId: '22222222-2222-2222-2222-222222222222',
          firstMessage: 'Hello there',
        },
      }),
    )

    expect(response.status).toBe(404)
    const payload = await response.json()
    expect(payload.error).toBe('Target user not found')
  })

  it('rejects invalid JSON payloads', async () => {
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
    ;(checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true })

    const response = await startConversationRoute(
      createRequest('http://localhost/api/messages/start', {
        body: '{',
      }),
    )

    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.error).toBe('Invalid JSON payload')
  })
})
