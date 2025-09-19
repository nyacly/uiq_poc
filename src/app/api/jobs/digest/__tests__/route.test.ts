jest.mock('@server/notifications', () => {
  const actual = jest.requireActual('@server/notifications')
  return {
    ...actual,
    runWeeklyDigestJob: jest.fn(),
  }
})

const createRequest = (url: string, init?: { method?: string; headers?: Record<string, string> }) => {
  return {
    url,
    method: init?.method ?? 'GET',
    headers: {
      get(name: string) {
        const value = init?.headers?.[name]
        return value ?? null
      },
    },
  } as unknown as Request
}

import { GET, POST } from '../route'
import { runWeeklyDigestJob } from '@server/notifications'

describe('/api/jobs/digest', () => {
  const originalSecret = process.env.CRON_SECRET

  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.CRON_SECRET
  })

  afterEach(() => {
    if (typeof originalSecret === 'string') {
      process.env.CRON_SECRET = originalSecret
    } else {
      delete process.env.CRON_SECRET
    }
  })

  it('rejects unauthorized requests when a secret is configured', async () => {
    process.env.CRON_SECRET = 'secret-token'

    const response = await POST(
      createRequest('http://localhost/api/jobs/digest', {
        method: 'POST',
      }),
    )

    expect(response.status).toBe(401)
    expect(runWeeklyDigestJob).not.toHaveBeenCalled()
  })

  it('runs the job and returns the result', async () => {
    process.env.CRON_SECRET = 'secret-token'
    ;(runWeeklyDigestJob as jest.Mock).mockResolvedValue({ sent: 5, checked: 8 })

    const response = await GET(
      createRequest('http://localhost/api/jobs/digest', {
        headers: { authorization: 'Bearer secret-token' },
      }),
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.ok).toBe(true)
    expect(payload.result).toEqual({ sent: 5, checked: 8 })
    expect(runWeeklyDigestJob).toHaveBeenCalled()
  })
})
