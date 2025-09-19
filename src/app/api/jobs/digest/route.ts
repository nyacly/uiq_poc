import { NextResponse } from 'next/server'

import { runWeeklyDigestJob } from '@server/notifications'

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return true
  }

  const header = request.headers.get('authorization')
  if (!header) {
    return false
  }

  const [scheme, value] = header.split(' ')
  if (scheme !== 'Bearer') {
    return false
  }

  return value === secret
}

async function handleRequest(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runWeeklyDigestJob()
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    console.error('Failed to run weekly digest job', error)
    return NextResponse.json(
      { error: 'Failed to run weekly digest' },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  return handleRequest(request)
}

export async function POST(request: Request) {
  return handleRequest(request)
}
