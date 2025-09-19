jest.mock('@server/admin', () => {
  const actual = jest.requireActual('@server/admin')
  return {
    ...actual,
    getAdminOverview: jest.fn(),
    searchAdminDirectory: jest.fn(),
  }
})

jest.mock('@server/auth', () => {
  const actual = jest.requireActual('@server/auth')
  return {
    ...actual,
    requireUser: jest.fn(),
  }
})

import { GET as overviewGet } from '../overview/route'
import { GET as searchGet } from '../search/route'
import { getAdminOverview, searchAdminDirectory } from '@server/admin'
import { requireUser, UnauthorizedError } from '@server/auth'

const createRequest = (url: string) => new Request(url)

describe('Admin API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/overview', () => {
    it('returns overview metrics for admin users', async () => {
      const adminUser = { id: 'admin-1', role: 'admin', email: 'admin@example.com', status: 'active' } as const
      ;(requireUser as jest.Mock).mockResolvedValue(adminUser)
      const overview = {
        users: 42,
        businesses: { verified: 10, unverified: 5 },
        events: { upcoming: 3 },
        classifieds: { active: 7 },
        reports: { open: 4 },
      }
      ;(getAdminOverview as jest.Mock).mockResolvedValue(overview)

      const response = await overviewGet()

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload).toEqual({ overview })
      expect(requireUser).toHaveBeenCalledTimes(1)
      expect(getAdminOverview).toHaveBeenCalledTimes(1)
    })

    it('rejects non-admin users with 403', async () => {
      const memberUser = { id: 'user-1', role: 'member', email: 'user@example.com', status: 'active' } as const
      ;(requireUser as jest.Mock).mockResolvedValue(memberUser)

      const response = await overviewGet()

      expect(response.status).toBe(403)
      const payload = await response.json()
      expect(payload.error).toBe('Forbidden')
      expect(getAdminOverview).not.toHaveBeenCalled()
    })

    it('requires authentication', async () => {
      ;(requireUser as jest.Mock).mockRejectedValue(new UnauthorizedError())

      const response = await overviewGet()

      expect(response.status).toBe(401)
      const payload = await response.json()
      expect(payload.error).toBe('Authentication required')
    })
  })

  describe('GET /api/admin/search', () => {
    it('runs search for admin users', async () => {
      const adminUser = { id: 'admin-1', role: 'admin', email: 'admin@example.com', status: 'active' } as const
      ;(requireUser as jest.Mock).mockResolvedValue(adminUser)
      const results = {
        users: [
          {
            id: 'user-1',
            email: 'amina@example.com',
            role: 'admin',
            status: 'active',
            displayName: 'Amina',
            createdAt: new Date('2024-01-01T00:00:00Z'),
          },
        ],
        businesses: [
          {
            id: 'biz-1',
            name: 'Sunrise Catering',
            email: 'orders@example.com',
            status: 'published',
            plan: 'premium',
            verified: true,
            createdAt: new Date('2024-01-05T00:00:00Z'),
          },
        ],
      }
      ;(searchAdminDirectory as jest.Mock).mockResolvedValue(results)

      const response = await searchGet(createRequest('http://localhost/api/admin/search?q=%20amina%20'))

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload).toEqual({
        results: {
          users: [
            {
              id: 'user-1',
              email: 'amina@example.com',
              role: 'admin',
              status: 'active',
              displayName: 'Amina',
              createdAt: results.users[0]!.createdAt.toISOString(),
            },
          ],
          businesses: [
            {
              id: 'biz-1',
              name: 'Sunrise Catering',
              email: 'orders@example.com',
              status: 'published',
              plan: 'premium',
              verified: true,
              createdAt: results.businesses[0]!.createdAt.toISOString(),
            },
          ],
        },
      })
      expect(searchAdminDirectory).toHaveBeenCalledWith('amina')
    })

    it('rejects non-admin users', async () => {
      const memberUser = { id: 'user-1', role: 'member', email: 'user@example.com', status: 'active' } as const
      ;(requireUser as jest.Mock).mockResolvedValue(memberUser)

      const response = await searchGet(createRequest('http://localhost/api/admin/search?q=amina'))

      expect(response.status).toBe(403)
      const payload = await response.json()
      expect(payload.error).toBe('Forbidden')
      expect(searchAdminDirectory).not.toHaveBeenCalled()
    })

    it('validates query parameters', async () => {
      const adminUser = { id: 'admin-1', role: 'admin', email: 'admin@example.com', status: 'active' } as const
      ;(requireUser as jest.Mock).mockResolvedValue(adminUser)

      const response = await searchGet(createRequest('http://localhost/api/admin/search?q=a'))

      expect(response.status).toBe(400)
      const payload = await response.json()
      expect(payload.error).toBe('Invalid query parameters')
      expect(searchAdminDirectory).not.toHaveBeenCalled()
    })

    it('requires authentication', async () => {
      ;(requireUser as jest.Mock).mockRejectedValue(new UnauthorizedError())

      const response = await searchGet(createRequest('http://localhost/api/admin/search?q=amina'))

      expect(response.status).toBe(401)
      const payload = await response.json()
      expect(payload.error).toBe('Authentication required')
    })
  })
})
