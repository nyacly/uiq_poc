import { test, expect } from '@playwright/test'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'

import { db, users, subscriptions } from '@/lib/db'
import type { NewUser, SubscriptionPlan, UserRole, UserStatus } from '@shared/schema'

const DEV_COOKIE = 'x-dev-user-id'

type SessionSummary = {
  id: string
  email: string
  role: UserRole
  status: UserStatus
}

type UserInsert = NewUser

type AuthHeaders = {
  cookie: string
}

const buildAuthHeaders = (userId: string): AuthHeaders => ({
  cookie: `${DEV_COOKIE}=${userId}`,
})

const createTestUser = async (overrides: Partial<UserInsert> = {}): Promise<SessionSummary> => {
  const data: UserInsert = {
    ...overrides,
    email: overrides.email ?? `playwright-${randomUUID()}@example.com`,
    role: overrides.role ?? 'member',
    status: overrides.status ?? 'active',
    membershipTier: (overrides.membershipTier ?? 'FREE') as SubscriptionPlan,
    metadata: overrides.metadata ?? {},
  }

  const [inserted] = await db
    .insert(users)
    .values(data)
    .returning({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
    })

  return inserted
}

const deleteTestUser = async (userId: string) => {
  await db.delete(users).where(eq(users.id, userId))
}

test.describe('Providers API happy path', () => {
  test('create → get → patch → delete provider flow', async ({ request }) => {
    const createdUsers: string[] = []

    try {
      const owner = await createTestUser()
      createdUsers.push(owner.id)

      const createResponse = await request.post('/api/providers', {
        data: {
          name: 'Playwright Plumbing Co.',
          description: 'Emergency plumbing services for automated tests.',
          services: ['Plumbing', 'Emergency repairs'],
          suburb: 'Testville',
          state: 'QLD',
          phone: '+61400000099',
          email: 'plumbing@example.com',
        },
        headers: buildAuthHeaders(owner.id),
      })

      expect(createResponse.status()).toBe(201)
      const createPayload = await createResponse.json()
      expect(createPayload.provider.name).toBe('Playwright Plumbing Co.')

      const providerId: string = createPayload.provider.id

      const getResponse = await request.get(`/api/providers/${providerId}`)
      expect(getResponse.status()).toBe(404)

      const ownerGetResponse = await request.get(`/api/providers/${providerId}`, {
        headers: buildAuthHeaders(owner.id),
      })
      expect(ownerGetResponse.status()).toBe(200)
      const ownerView = await ownerGetResponse.json()
      expect(ownerView.provider.id).toBe(providerId)

      const patchResponse = await request.patch(`/api/providers/${providerId}`, {
        data: {
          description: 'Updated description after QA review.',
          website: 'https://example.com',
        },
        headers: buildAuthHeaders(owner.id),
      })

      expect(patchResponse.status()).toBe(200)
      const patchPayload = await patchResponse.json()
      expect(patchPayload.provider.description).toBe('Updated description after QA review.')

      const deleteResponse = await request.delete(`/api/providers/${providerId}`, {
        headers: buildAuthHeaders(owner.id),
      })
      expect(deleteResponse.status()).toBe(204)

      const confirmResponse = await request.get(`/api/providers/${providerId}`, {
        headers: buildAuthHeaders(owner.id),
      })
      expect(confirmResponse.status()).toBe(404)
    } finally {
      for (const id of createdUsers) {
        await deleteTestUser(id)
      }
    }
  })
})

test.describe('Events API happy path', () => {
  test('create → list events flow', async ({ request }) => {
    const createdUsers: string[] = []

    try {
      const organiser = await createTestUser()
      createdUsers.push(organiser.id)

      const startAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      const endAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

      const createResponse = await request.post('/api/events', {
        data: {
          title: 'Playwright Launch Party',
          category: 'community',
          description: 'Gathering to celebrate end-to-end tests passing in production.',
          startAt,
          endAt,
          locationName: 'QA Hall',
          address: '1 Automation Way, Brisbane QLD',
          tags: ['testing', 'community'],
        },
        headers: buildAuthHeaders(organiser.id),
      })

      expect(createResponse.status()).toBe(201)
      const createPayload = await createResponse.json()
      const eventId: string = createPayload.event.id
      expect(createPayload.event.title).toBe('Playwright Launch Party')

      const listResponse = await request.get('/api/events?limit=20', {
        headers: buildAuthHeaders(organiser.id),
      })
      expect(listResponse.status()).toBe(200)
      const listPayload = await listResponse.json()
      const ids = listPayload.events.map((event: { id: string }) => event.id)
      expect(ids).toContain(eventId)
    } finally {
      for (const id of createdUsers) {
        await deleteTestUser(id)
      }
    }
  })
})

test.describe('Classifieds API happy path', () => {
  test('create → list classifieds flow', async ({ request }) => {
    const createdUsers: string[] = []

    try {
      const seller = await createTestUser()
      createdUsers.push(seller.id)

      const createResponse = await request.post('/api/classifieds', {
        data: {
          title: 'Playwright QA Laptop',
          description: 'Reliable laptop used exclusively for automated testing demos.',
          category: 'electronics',
          price: 999.99,
          currency: 'AUD',
          location: 'Brisbane',
        },
        headers: buildAuthHeaders(seller.id),
      })

      expect(createResponse.status()).toBe(201)
      const createPayload = await createResponse.json()
      const classifiedId: string = createPayload.classified.id
      expect(createPayload.classified.title).toBe('Playwright QA Laptop')

      const listResponse = await request.get('/api/classifieds', {
        headers: buildAuthHeaders(seller.id),
      })
      expect(listResponse.status()).toBe(200)
      const listPayload = await listResponse.json()
      const ids = listPayload.classifieds.map((classified: { id: string }) => classified.id)
      expect(ids).toContain(classifiedId)
    } finally {
      for (const id of createdUsers) {
        await deleteTestUser(id)
      }
    }
  })
})

test.describe('Messaging API happy path', () => {
  test('start → post → read conversation between two users', async ({ request }) => {
    const createdUsers: string[] = []

    try {
      const initiator = await createTestUser({ email: `initiator-${randomUUID()}@example.com` })
      const recipient = await createTestUser({ email: `recipient-${randomUUID()}@example.com` })
      createdUsers.push(initiator.id, recipient.id)

      const startResponse = await request.post('/api/messages/start', {
        data: {
          targetUserId: recipient.id,
          subject: 'Welcome to automated QA',
          firstMessage: 'Hello! This is an automated conversation starter.',
        },
        headers: buildAuthHeaders(initiator.id),
      })

      expect(startResponse.status()).toBe(201)
      const startPayload = await startResponse.json()
      const conversationId: string = startPayload.conversation.id
      expect(startPayload.message.body).toContain('automated conversation')
      expect(startPayload.unreadCount).toBe(0)

      const replyResponse = await request.post(`/api/messages/${conversationId}`, {
        data: {
          body: 'Great to hear from automation! Replying to confirm receipt.',
        },
        headers: buildAuthHeaders(recipient.id),
      })

      expect(replyResponse.status()).toBe(201)
      const replyPayload = await replyResponse.json()
      expect(replyPayload.message.body).toContain('confirm receipt')

      const readResponse = await request.get(`/api/messages/${conversationId}`, {
        headers: buildAuthHeaders(initiator.id),
      })

      expect(readResponse.status()).toBe(200)
      const readPayload = await readResponse.json()
      expect(readPayload.messages).toHaveLength(2)
      expect(readPayload.messages[1].body).toContain('confirm receipt')
      expect(readPayload.unreadCount).toBeGreaterThanOrEqual(0)
    } finally {
      for (const id of createdUsers) {
        await deleteTestUser(id)
      }
    }
  })
})

test.describe('Stripe webhook integration', () => {
  test('updates membership tier when subscription event received', async ({ request }) => {
    const createdUsers: string[] = []

    try {
      const member = await createTestUser()
      createdUsers.push(member.id)

      const subscriptionId = `sub_${randomUUID()}`
      const customerId = `cus_${randomUUID()}`
      const nowSeconds = Math.floor(Date.now() / 1000)

      const webhookResponse = await request.post('/api/stripe/webhook', {
        data: {
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: subscriptionId,
              status: 'active',
              customer: customerId,
              metadata: {
                userId: member.id,
                tier: 'PLUS',
              },
              current_period_start: nowSeconds,
              current_period_end: nowSeconds + 30 * 24 * 60 * 60,
              items: {
                data: [
                  {
                    price: {
                      metadata: { tier: 'PLUS' },
                    },
                  },
                ],
              },
            },
          },
        },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(webhookResponse.status()).toBe(200)
      const webhookPayload = await webhookResponse.json()
      expect(webhookPayload).toEqual({ received: true })

      const [updated] = await db
        .select({ membershipTier: users.membershipTier })
        .from(users)
        .where(eq(users.id, member.id))
        .limit(1)

      expect(updated?.membershipTier).toBe('PLUS')

      await db.delete(subscriptions).where(eq(subscriptions.userId, member.id))
    } finally {
      for (const id of createdUsers) {
        await deleteTestUser(id)
      }
    }
  })
})
