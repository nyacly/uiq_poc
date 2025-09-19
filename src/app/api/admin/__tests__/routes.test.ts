jest.mock('@server/admin', () => {
  const actual = jest.requireActual('@server/admin')
  return {
    ...actual,
    getAdminOverview: jest.fn(),
    searchAdminDirectory: jest.fn(),
    updateUserRole: jest.fn(),
    setBusinessVerification: jest.fn(),
    setBusinessPremium: jest.fn(),
    setAnnouncementApproval: jest.fn(),
    setClassifiedVisibility: jest.fn(),
    updateReportStatus: jest.fn(),
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

import { GET as overviewGet } from '../overview/route'
import { GET as searchGet } from '../search/route'
import { PATCH as userRolePatch } from '../users/[userId]/role/route'
import { PATCH as businessVerificationPatch } from '../businesses/[businessId]/verification/route'
import { PATCH as businessPlanPatch } from '../businesses/[businessId]/plan/route'
import { PATCH as announcementApprovalPatch } from '../announcements/[announcementId]/approval/route'
import { PATCH as classifiedVisibilityPatch } from '../classifieds/[classifiedId]/visibility/route'
import { PATCH as reportStatusPatch } from '../reports/[reportId]/status/route'
import {
  getAdminOverview,
  searchAdminDirectory,
  setAnnouncementApproval,
  setBusinessPremium,
  setBusinessVerification,
  setClassifiedVisibility,
  updateReportStatus,
  updateUserRole,
} from '@server/admin'
import { requireUser, UnauthorizedError } from '@server/auth'
import { checkRateLimit } from '@/lib/rate-limiting'

const createRequest = (url: string) => new Request(url)
const createJsonRequest = (url: string, body: unknown) =>
  new Request(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('Admin API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(checkRateLimit as jest.Mock).mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetTime: new Date(Date.now() + 60_000),
      blocked: false,
    })
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

  describe('PATCH /api/admin/users/:id/role', () => {
    it('updates the user role for admin', async () => {
      const adminUser = { id: 'admin-1', role: 'admin', email: 'admin@example.com', status: 'active' } as const
      ;(requireUser as jest.Mock).mockResolvedValue(adminUser)

      const response = await userRolePatch(
        createJsonRequest('http://localhost/api/admin/users/u-1/role', { role: 'business_owner' }),
        { params: { userId: '11111111-1111-1111-1111-111111111111' } },
      )

      expect(response.status).toBe(200)
      expect(updateUserRole).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111', 'business_owner')
    })

    it('rejects non-admin users', async () => {
      const memberUser = { id: 'user-1', role: 'member', email: 'user@example.com', status: 'active' } as const
      ;(requireUser as jest.Mock).mockResolvedValue(memberUser)

      const response = await userRolePatch(
        createJsonRequest('http://localhost/api/admin/users/u-1/role', { role: 'admin' }),
        { params: { userId: '11111111-1111-1111-1111-111111111111' } },
      )

      expect(response.status).toBe(403)
      expect(updateUserRole).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /api/admin/businesses/:id/verification', () => {
    it('toggles verification for admin', async () => {
      const adminUser = { id: 'admin-1', role: 'admin', email: 'admin@example.com', status: 'active' } as const
      ;(requireUser as jest.Mock).mockResolvedValue(adminUser)
      ;(setBusinessVerification as jest.Mock).mockResolvedValue('published')

      const response = await businessVerificationPatch(
        createJsonRequest('http://localhost/api/admin/businesses/b-1/verification', { verified: true }),
        { params: { businessId: '22222222-2222-2222-2222-222222222222' } },
      )

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload).toEqual({ status: 'published', verified: true })
      expect(setBusinessVerification).toHaveBeenCalledWith('22222222-2222-2222-2222-222222222222', true)
    })

    it('rejects non-admin users', async () => {
      const memberUser = { id: 'user-1', role: 'member', email: 'user@example.com', status: 'active' } as const
      ;(requireUser as jest.Mock).mockResolvedValue(memberUser)

      const response = await businessVerificationPatch(
        createJsonRequest('http://localhost/api/admin/businesses/b-1/verification', { verified: true }),
        { params: { businessId: '22222222-2222-2222-2222-222222222222' } },
      )

      expect(response.status).toBe(403)
      expect(setBusinessVerification).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /api/admin/businesses/:id/plan', () => {
    it('updates the business plan toggle', async () => {
      const adminUser = { id: 'admin-1', role: 'admin', email: 'admin@example.com', status: 'active' } as const
      ;(requireUser as jest.Mock).mockResolvedValue(adminUser)
      ;(setBusinessPremium as jest.Mock).mockResolvedValue('premium')

      const response = await businessPlanPatch(
        createJsonRequest('http://localhost/api/admin/businesses/b-1/plan', { premium: true }),
        { params: { businessId: '33333333-3333-3333-3333-333333333333' } },
      )

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload).toEqual({ plan: 'premium' })
      expect(setBusinessPremium).toHaveBeenCalledWith('33333333-3333-3333-3333-333333333333', true)
    })
  })

  describe('PATCH /api/admin/announcements/:id/approval', () => {
    it('approves announcements', async () => {
      const adminUser = { id: 'admin-1', role: 'admin', email: 'admin@example.com', status: 'active' } as const
      ;(requireUser as jest.Mock).mockResolvedValue(adminUser)
      const now = new Date()
      ;(setAnnouncementApproval as jest.Mock).mockResolvedValue({ isApproved: true, publishedAt: now })

      const response = await announcementApprovalPatch(
        createJsonRequest('http://localhost/api/admin/announcements/a-1/approval', { approved: true }),
        { params: { announcementId: '44444444-4444-4444-4444-444444444444' } },
      )

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload).toEqual({ isApproved: true, publishedAt: now.toISOString() })
      expect(setAnnouncementApproval).toHaveBeenCalledWith('44444444-4444-4444-4444-444444444444', true)
    })
  })

  describe('PATCH /api/admin/classifieds/:id/visibility', () => {
    it('hides classifieds', async () => {
      const adminUser = { id: 'admin-1', role: 'admin', email: 'admin@example.com', status: 'active' } as const
      ;(requireUser as jest.Mock).mockResolvedValue(adminUser)
      ;(setClassifiedVisibility as jest.Mock).mockResolvedValue('archived')

      const response = await classifiedVisibilityPatch(
        createJsonRequest('http://localhost/api/admin/classifieds/c-1/visibility', { hidden: true }),
        { params: { classifiedId: '55555555-5555-5555-5555-555555555555' } },
      )

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload).toEqual({ status: 'archived' })
      expect(setClassifiedVisibility).toHaveBeenCalledWith('55555555-5555-5555-5555-555555555555', true)
    })
  })

  describe('PATCH /api/admin/reports/:id/status', () => {
    it('updates report status', async () => {
      const adminUser = { id: 'admin-1', role: 'admin', email: 'admin@example.com', status: 'active' } as const
      ;(requireUser as jest.Mock).mockResolvedValue(adminUser)
      ;(updateReportStatus as jest.Mock).mockResolvedValue('resolved')

      const response = await reportStatusPatch(
        createJsonRequest('http://localhost/api/admin/reports/r-1/status', {
          status: 'resolved',
          resolution: 'Addressed by admin',
        }),
        { params: { reportId: '66666666-6666-6666-6666-666666666666' } },
      )

      expect(response.status).toBe(200)
      const payload = await response.json()
      expect(payload).toEqual({ status: 'resolved' })
      expect(updateReportStatus).toHaveBeenCalledWith(
        '66666666-6666-6666-6666-666666666666',
        'resolved',
        'Addressed by admin',
      )
    })
  })
})
