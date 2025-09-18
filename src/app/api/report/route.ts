import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limiting'
import { HttpError, requireUser } from '@server/auth'
import {
  createReport,
  reportCreateSchema,
  serializeReport,
} from '@server/reports'

const RATE_LIMIT_ENDPOINT: Parameters<typeof checkRateLimit>[1] = 'report_submit'

// TODO: Surface submitted reports in the /admin moderation queue.
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
          error: 'Too many reports submitted. Please try again later.',
          retryAfter: rateLimit.resetTime.toISOString(),
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSeconds) },
        },
      )
    }

    const body = await request.json()
    const parsed = reportCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const report = await createReport({
      ...parsed.data,
      reporterId: user.id,
    })

    return NextResponse.json(
      { report: serializeReport(report) },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 },
      )
    }

    console.error('Failed to submit report', error)
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 },
    )
  }
}
