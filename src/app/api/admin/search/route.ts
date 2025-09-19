import { NextResponse } from 'next/server'
import { z } from 'zod'

import { HttpError, requireUser } from '@server/auth'
import { searchAdminDirectory } from '@server/admin'

const querySchema = z.object({
  q: z.string().trim().min(2).max(255),
})

export async function GET(request: Request) {
  try {
    const user = await requireUser()

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({ q: searchParams.get('q') })

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const results = await searchAdminDirectory(parsed.data.q)

    return NextResponse.json({ results })
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Failed to run admin search', error)
    return NextResponse.json({ error: 'Failed to run admin search' }, { status: 500 })
  }
}
