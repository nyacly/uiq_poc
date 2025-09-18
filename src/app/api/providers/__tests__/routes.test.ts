jest.mock('@server/providers', () => {
  const actual = jest.requireActual('@server/providers')
  return {
    ...actual,
    listProviders: jest.fn(),
    createProvider: jest.fn(),
    updateProvider: jest.fn(),
    deleteProvider: jest.fn(),
    getProviderById: jest.fn(),
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

import { GET as listProvidersGet, POST as listProvidersPost } from '../route'
import {
  DELETE as providerDelete,
  GET as providerGet,
  PATCH as providerPatch,
} from '../[id]/route'
import {
  createProvider,
  deleteProvider,
  getProviderById,
  listProviders,
  updateProvider,
} from '@server/providers'
import {
  ensureOwnerOrAdmin,
  getSessionUser,
  requireUser,
  UnauthorizedError,
} from '@server/auth'
import { checkRateLimit } from '@/lib/rate-limiting'

describe('Providers API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/providers', () => {
    it('returns providers matching search filters', async () => {
      const mockSession = { id: 'admin-1', role: 'admin', email: 'a@example.com', status: 'active' }
      ;(getSessionUser as jest.Mock).mockResolvedValue(mockSession)
      const providers = [
        { id: 'p1', name: 'Alpha Plumbing', userId: 'owner-1', isVerified: true },
      ]
      ;(listProviders as jest.Mock).mockResolvedValue(providers)

      const response = await listProvidersGet(createRequest('http://localhost/api/providers?q=plumber&suburb=CBD'))

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload).toEqual({ providers })
      expect(listProviders).toHaveBeenCalledWith({
        query: 'plumber',
        suburb: 'CBD',
        sessionUser: mockSession,
      })
    })

    it('rejects invalid query parameters', async () => {
      const response = await listProvidersGet(createRequest('http://localhost/api/providers?q=a'))

      expect(response.status).toBe(400)
      const payload = await response.json()
      expect(payload.error).toBe('Invalid query parameters')
    })
  })

  describe('POST /api/providers', () => {
    it('requires authentication', async () => {
      ;(requireUser as jest.Mock).mockRejectedValue(new UnauthorizedError())

      const response = await listProvidersPost(
        createRequest('http://localhost/api/providers', {
          method: 'POST',
          body: { name: 'Test Provider' },
        }),
      )

      expect(response.status).toBe(401)
    })

    it('creates a provider when payload is valid', async () => {
      const user = { id: 'user-1', role: 'member', email: 'user@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(user)
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: new Date(Date.now() + 60_000),
        blocked: false,
      })
      const providerRecord = {
        id: 'provider-1',
        userId: user.id,
        name: 'Test Provider',
        slug: 'test-provider',
        services: [],
        isVerified: false,
      }
      ;(createProvider as jest.Mock).mockResolvedValue(providerRecord)

      const response = await listProvidersPost(
        createRequest('http://localhost/api/providers', {
          method: 'POST',
          body: { name: 'Test Provider' },
        }),
      )

      expect(response.status).toBe(201)
      const payload = await response.json()
      expect(payload).toEqual({ provider: providerRecord })
      expect(createProvider).toHaveBeenCalledWith({ name: 'Test Provider' }, user.id)
    })

    it('enforces rate limiting', async () => {
      const user = { id: 'user-1', role: 'member', email: 'user@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(user)
      const resetTime = new Date(Date.now() + 120_000)
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime,
        blocked: false,
      })

      const response = await listProvidersPost(
        createRequest('http://localhost/api/providers', {
          method: 'POST',
          body: { name: 'Test Provider' },
        }),
      )

      expect(response.status).toBe(429)
      const payload = await response.json()
      expect(payload.retryAfter).toBe(resetTime.toISOString())
    })
  })

  describe('GET /api/providers/[id]', () => {
    it('hides unverified providers from anonymous visitors', async () => {
      ;(getProviderById as jest.Mock).mockResolvedValue({
        id: 'provider-1',
        userId: 'owner-1',
        name: 'Secret Provider',
        slug: 'secret-provider',
        isVerified: false,
      })
      ;(getSessionUser as jest.Mock).mockResolvedValue(null)

      const response = await providerGet(createRequest('http://localhost/api/providers/provider-1'), {
        params: { id: 'provider-1' },
      })

      expect(response.status).toBe(404)
    })

    it('returns unverified providers to their owner', async () => {
      ;(getProviderById as jest.Mock).mockResolvedValue({
        id: 'provider-1',
        userId: 'owner-1',
        name: 'Secret Provider',
        slug: 'secret-provider',
        isVerified: false,
      })
      const session = { id: 'owner-1', role: 'member', email: 'owner@example.com', status: 'active' }
      ;(getSessionUser as jest.Mock).mockResolvedValue(session)

      const response = await providerGet(createRequest('http://localhost/api/providers/provider-1'), {
        params: { id: 'provider-1' },
      })

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload.provider.id).toBe('provider-1')
    })
  })

  describe('PATCH /api/providers/[id]', () => {
    it('prevents non-admins from toggling verification', async () => {
      const session = { id: 'owner-1', role: 'member', email: 'owner@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(session)
      ;(getProviderById as jest.Mock).mockResolvedValue({
        id: 'provider-1',
        userId: 'owner-1',
        name: 'Provider',
        slug: 'provider',
        isVerified: false,
      })
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: new Date(Date.now() + 60_000),
        blocked: false,
      })

      const response = await providerPatch(
        createRequest('http://localhost/api/providers/provider-1', {
          method: 'PATCH',
          body: { isVerified: true },
        }),
        { params: { id: 'provider-1' } },
      )

      expect(response.status).toBe(403)
      expect(updateProvider).not.toHaveBeenCalled()
      expect(ensureOwnerOrAdmin).toHaveBeenCalledWith(session, 'owner-1')
    })

    it('updates provider data for authorised users', async () => {
      const session = { id: 'admin-1', role: 'admin', email: 'admin@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(session)
      ;(getProviderById as jest.Mock).mockResolvedValue({
        id: 'provider-1',
        userId: 'owner-1',
        name: 'Provider',
        slug: 'provider',
        isVerified: false,
      })
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: new Date(Date.now() + 60_000),
        blocked: false,
      })
      const updatedRecord = {
        id: 'provider-1',
        userId: 'owner-1',
        name: 'Updated Provider',
        slug: 'updated-provider',
        isVerified: true,
      }
      ;(updateProvider as jest.Mock).mockResolvedValue(updatedRecord)

      const response = await providerPatch(
        createRequest('http://localhost/api/providers/provider-1', {
          method: 'PATCH',
          body: { name: 'Updated Provider', isVerified: true },
        }),
        { params: { id: 'provider-1' } },
      )

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload.provider).toEqual(updatedRecord)
      expect(updateProvider).toHaveBeenCalledWith('provider-1', {
        name: 'Updated Provider',
        isVerified: true,
      })
      expect(ensureOwnerOrAdmin).toHaveBeenCalledWith(session, 'owner-1')
    })
  })

  describe('DELETE /api/providers/[id]', () => {
    it('removes provider when authorised', async () => {
      const session = { id: 'admin-1', role: 'admin', email: 'admin@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(session)
      ;(getProviderById as jest.Mock).mockResolvedValue({
        id: 'provider-1',
        userId: 'owner-1',
        name: 'Provider',
        slug: 'provider',
        isVerified: true,
      })
      ;(checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: new Date(Date.now() + 60_000),
        blocked: false,
      })

      const response = await providerDelete(
        createRequest('http://localhost/api/providers/provider-1', { method: 'DELETE' }),
        { params: { id: 'provider-1' } },
      )

      expect(response.status).toBe(204)
      expect(deleteProvider).toHaveBeenCalledWith('provider-1')
      expect(ensureOwnerOrAdmin).toHaveBeenCalledWith(session, 'owner-1')
    })

    it('returns 404 when provider does not exist', async () => {
      const session = { id: 'admin-1', role: 'admin', email: 'admin@example.com', status: 'active' }
      ;(requireUser as jest.Mock).mockResolvedValue(session)
      ;(getProviderById as jest.Mock).mockResolvedValue(undefined)

      const response = await providerDelete(
        createRequest('http://localhost/api/providers/provider-1', { method: 'DELETE' }),
        { params: { id: 'provider-1' } },
      )

      expect(response.status).toBe(404)
      expect(deleteProvider).not.toHaveBeenCalled()
    })
  })
})
