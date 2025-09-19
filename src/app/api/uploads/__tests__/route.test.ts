jest.mock('@server/storage', () => {
  const actual = jest.requireActual('@server/storage')
  return {
    ...actual,
    saveImageDev: jest.fn(),
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

const createRequest = (file?: File) => {
  const formData = new FormData()
  if (file) {
    formData.set('file', file)
  }

  return {
    method: 'POST',
    url: 'http://localhost/api/uploads',
    async formData() {
      return formData
    },
  } as unknown as Request
}

import { POST as uploadRoute } from '../route'
import { SUPPORTED_IMAGE_MIME_TYPES, saveImageDev } from '@server/storage'
import { requireUser, UnauthorizedError } from '@server/auth'
import { checkRateLimit } from '@/lib/rate-limiting'

describe('POST /api/uploads', () => {
  const baseUser = {
    id: '12345678-1234-5678-1234-567812345678',
    email: 'user@example.com',
    role: 'member' as const,
    status: 'active' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('requires authentication', async () => {
    ;(requireUser as jest.Mock).mockRejectedValue(new UnauthorizedError())

    const response = await uploadRoute(createRequest())

    expect(response.status).toBe(401)
    expect(saveImageDev).not.toHaveBeenCalled()
  })

  it('enforces rate limits', async () => {
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
    ;(checkRateLimit as jest.Mock).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: new Date('2024-01-01T00:00:00Z'),
      blocked: false,
    })

    const validMimeType = Array.from(SUPPORTED_IMAGE_MIME_TYPES.keys())[0] ?? 'image/png'
    const file = new File(['image-bytes'], 'photo.png', { type: validMimeType })

    const response = await uploadRoute(createRequest(file))

    expect(response.status).toBe(429)
    const payload = await response.json()
    expect(payload.error).toMatch(/too many uploads/i)
    expect(saveImageDev).not.toHaveBeenCalled()
  })

  it('rejects invalid files', async () => {
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
    ;(checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true })

    const file = new File(['not-an-image'], 'document.pdf', {
      type: 'application/pdf',
    })

    const response = await uploadRoute(createRequest(file))

    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.error).toBe('Validation failed')
    expect(payload.details.fieldErrors.file).toBeDefined()
    expect(saveImageDev).not.toHaveBeenCalled()
  })

  it('requires a file to be provided', async () => {
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
    ;(checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true })

    const response = await uploadRoute(createRequest())

    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.error).toBe('Validation failed')
    expect(payload.details.fieldErrors.file).toBeDefined()
    expect(saveImageDev).not.toHaveBeenCalled()
  })

  it('saves the file and returns a URL', async () => {
    ;(requireUser as jest.Mock).mockResolvedValue(baseUser)
    ;(checkRateLimit as jest.Mock).mockResolvedValue({ allowed: true })
    ;(saveImageDev as jest.Mock).mockResolvedValue('/assets/photo.png')

    const validMimeType = Array.from(SUPPORTED_IMAGE_MIME_TYPES.keys())[0] ?? 'image/png'
    const file = new File(['image-bytes'], 'photo.png', { type: validMimeType })

    const response = await uploadRoute(createRequest(file))

    expect(response.status).toBe(201)
    const payload = await response.json()
    expect(payload.url).toBe('/assets/photo.png')
    expect(saveImageDev).toHaveBeenCalledTimes(1)
    expect(saveImageDev).toHaveBeenCalledWith(file)
  })
})
