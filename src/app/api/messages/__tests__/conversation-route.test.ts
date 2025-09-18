jest.mock('@server/messages', () => {
  const actual = jest.requireActual('@server/messages')
  return {
    ...actual,
    getConversationMessages: jest.fn(),
    addMessageToConversation: jest.fn(),
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
      if (serializedBody === undefined) {
        throw new Error('No JSON body present')
      }

      return JSON.parse(serializedBody)
    },
  } as unknown as Request
}

import { GET, POST } from '../[conversationId]/route'
import { HttpError, UnauthorizedError, requireUser } from '@server/auth'
import { checkRateLimit } from '@/lib/rate-limiting'
import {
  addMessageToConversation,
  getConversationMessages,
  serializeConversation,
  serializeMessage,
} from '@server/messages'

describe('/api/messages/[conversationId]', () => {
  const baseUser = {
    id: '77777777-7777-7777-7777-777777777777',
    email: 'member@example.com',
    role: 'member' as const,
    status: 'active' as const,
  }

  const conversationId = '88888888-8888-8888-8888-888888888888'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('requires authentication', async () => {
      ;(requireUser as jest.Mock).mockRejectedValue(new UnauthorizedError())

      const response = await GET(createRequest(`http://localhost/api/messages/${conversationId}`), {
        params: { conversationId },
      })

      expect(response.status).toBe(401)
    })

    it('rejects invalid ids', async () => {
      ;(requireUser as jest.Mock).mockResolvedValue(baseUser)

      const response = await GET(createRequest(`http://localhost/api/messages/not-a-uuid`), {
        params: { conversationId: 'not-a-uuid' },
      })

      expect(response.status).toBe(400)
      const payload = await response.json()
      expect(payload.error).toBe('Invalid conversation id')
    })

    it('returns serialized messages when authorized', async () => {
      ;(requireUser as jest.Mock).mockResolvedValue(baseUser)

      const conversation = {
        id: conversationId,
        createdBy: baseUser.id,
        topic: 'General chat',
        isGroup: false,
        createdAt: new Date('2024-02-01T12:00:00Z'),
        updatedAt: new Date('2024-02-01T12:00:00Z'),
        metadata: {},
      }

      const message = {
        id: '99999999-9999-9999-9999-999999999999',
        conversationId,
        senderId: baseUser.id,
        type: 'text',
        status: 'sent',
        body: 'Hello!',
        attachments: [],
        createdAt: new Date('2024-02-01T12:00:00Z'),
        updatedAt: new Date('2024-02-01T12:00:00Z'),
        deliveredAt: null,
        readAt: null,
      }

      ;(getConversationMessages as jest.Mock).mockResolvedValue({
        conversation,
        messages: [message],
        participant: null,
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

      const response = await GET(createRequest(`http://localhost/api/messages/${conversationId}`), {
        params: { conversationId },
      })

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload).toEqual({
        conversation: { id: conversation.id, topic: conversation.topic },
        messages: [{ id: message.id, body: message.body }],
        unreadCount: 0,
      })
    })

    it('propagates HttpError responses', async () => {
      ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
      ;(getConversationMessages as jest.Mock).mockRejectedValue(new HttpError(403, 'Forbidden'))

      const response = await GET(createRequest(`http://localhost/api/messages/${conversationId}`), {
        params: { conversationId },
      })

      expect(response.status).toBe(403)
      const payload = await response.json()
      expect(payload.error).toBe('Forbidden')
    })
  })

  describe('POST', () => {
    it('requires authentication', async () => {
      ;(requireUser as jest.Mock).mockRejectedValue(new UnauthorizedError())

      const response = await POST(
        createRequest(`http://localhost/api/messages/${conversationId}`, {
          method: 'POST',
          body: { body: 'Hello!' },
        }),
        { params: { conversationId } },
      )

      expect(response.status).toBe(401)
    })

    it('rejects invalid ids', async () => {
      ;(requireUser as jest.Mock).mockResolvedValue(baseUser)

      const response = await POST(
        createRequest(`http://localhost/api/messages/not-a-uuid`, {
          method: 'POST',
          body: { body: 'Hello!' },
        }),
        { params: { conversationId: 'not-a-uuid' } },
      )

      expect(response.status).toBe(400)
    })

    it('enforces rate limiting', async () => {
      ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: new Date('2024-03-01T00:00:00Z'),
        blocked: false,
      })

      const response = await POST(
        createRequest(`http://localhost/api/messages/${conversationId}`, {
          method: 'POST',
          body: { body: 'Hello!' },
        }),
        { params: { conversationId } },
      )

      expect(response.status).toBe(429)
      const payload = await response.json()
      expect(payload.error).toBe('Too many messages. Please try again later.')
    })

    it('validates payload', async () => {
      ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
      ;(checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true })

      const response = await POST(
        createRequest(`http://localhost/api/messages/${conversationId}`, {
          method: 'POST',
          body: { body: '' },
        }),
        { params: { conversationId } },
      )

      expect(response.status).toBe(400)
      const payload = await response.json()
      expect(payload.error).toBe('Validation failed')
    })

    it('creates a new message', async () => {
      ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
      ;(checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true })

      const conversation = {
        id: conversationId,
        createdBy: baseUser.id,
        topic: 'General chat',
        isGroup: false,
        createdAt: new Date('2024-02-01T12:00:00Z'),
        updatedAt: new Date('2024-02-01T12:00:00Z'),
        metadata: {},
      }

      const message = {
        id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        conversationId,
        senderId: baseUser.id,
        type: 'text',
        status: 'sent',
        body: 'Hello!',
        attachments: [],
        createdAt: new Date('2024-02-01T12:00:00Z'),
        updatedAt: new Date('2024-02-01T12:00:00Z'),
        deliveredAt: null,
        readAt: null,
      }

      ;(addMessageToConversation as jest.Mock).mockResolvedValue({
        conversation,
        message,
        unreadCount: 0,
      })

      ;(serializeMessage as jest.Mock).mockReturnValue({ id: message.id, body: message.body })

      const response = await POST(
        createRequest(`http://localhost/api/messages/${conversationId}`, {
          method: 'POST',
          body: { body: 'Hello!' },
        }),
        { params: { conversationId } },
      )

      expect(response.status).toBe(201)
      const payload = await response.json()
      expect(payload).toEqual({
        message: { id: message.id, body: message.body },
        unreadCount: 0,
      })

      expect(addMessageToConversation).toHaveBeenCalledWith(conversationId, { body: 'Hello!' }, baseUser)
    })

    it('handles HttpErrors from the server module', async () => {
      ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
      ;(checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true })
      ;(addMessageToConversation as jest.Mock).mockRejectedValue(new HttpError(403, 'Forbidden'))

      const response = await POST(
        createRequest(`http://localhost/api/messages/${conversationId}`, {
          method: 'POST',
          body: { body: 'Hello!' },
        }),
        { params: { conversationId } },
      )

      expect(response.status).toBe(403)
      const payload = await response.json()
      expect(payload.error).toBe('Forbidden')
    })

    it('rejects invalid JSON bodies', async () => {
      ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
      ;(checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true })

      const response = await POST(
        createRequest(`http://localhost/api/messages/${conversationId}`, {
          method: 'POST',
          body: '{',
        }),
        { params: { conversationId } },
      )

      expect(response.status).toBe(400)
      const payload = await response.json()
      expect(payload.error).toBe('Invalid JSON payload')
    })
  })
})
