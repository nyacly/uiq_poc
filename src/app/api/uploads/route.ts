import { NextResponse } from 'next/server'
import { z } from 'zod'

import { checkRateLimit } from '@/lib/rate-limiting'
import { HttpError, requireUser, UnauthorizedError } from '@server/auth'
import { saveImageDev, SUPPORTED_IMAGE_MIME_TYPES } from '@server/storage'

const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024
const RATE_LIMIT_ENDPOINT: Parameters<typeof checkRateLimit>[1] = 'upload_media'

const fileSchema = z
  .instanceof(File, { message: 'File upload is required' })
  .superRefine((file, ctx) => {
    if (file.size === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Uploaded file is empty',
      })
      return
    }

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Uploaded file exceeds the 5MB size limit',
      })
    }

    if (!SUPPORTED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only image uploads are supported',
      })
    }
  })

const uploadSchema = z.object({
  file: fileSchema,
})

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const user = await requireUser()

    const rateLimit = await checkRateLimit(user.id, RATE_LIMIT_ENDPOINT)
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 1000),
      )

      return NextResponse.json(
        {
          error: 'Too many uploads. Please try again later.',
          retryAfter: rateLimit.resetTime.toISOString(),
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSeconds) },
        },
      )
    }

    const formData = await request.formData()
    const parsed = uploadSchema.safeParse({ file: formData.get('file') })

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const url = await saveImageDev(parsed.data.file)

    return NextResponse.json({ url }, { status: 201 })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Failed to upload image', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
