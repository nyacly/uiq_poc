import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'

import { db, profiles, users } from '@/lib/db'

const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().trim().min(1).max(160),
  })
  .strict()

const normaliseEmail = (email: string) => email.trim().toLowerCase()

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const parsed = signupSchema.safeParse(payload)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const email = normaliseEmail(parsed.data.email)

    const [existing] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 },
      )
    }

    const passwordHash = await hash(parsed.data.password, 12)
    const now = new Date()

    const userId = await db.transaction(async (tx) => {
      let targetUserId = existing?.id

      if (!targetUserId) {
        const [created] = await tx
          .insert(users)
          .values({
            email,
            passwordHash,
            role: 'member',
            status: 'active',
            membershipTier: 'FREE',
            lastSignInAt: now,
            updatedAt: now,
          })
          .returning({ id: users.id })

        if (!created) {
          throw new Error('Failed to create user account')
        }

        targetUserId = created.id
      } else {
        await tx
          .update(users)
          .set({ passwordHash, updatedAt: now })
          .where(eq(users.id, targetUserId))
      }

      await tx
        .insert(profiles)
        .values({ userId: targetUserId, displayName: parsed.data.displayName })
        .onConflictDoUpdate({
          target: profiles.userId,
          set: { displayName: parsed.data.displayName, updatedAt: now },
        })

      return targetUserId
    })

    return NextResponse.json(
      { message: 'Account created successfully', userId },
      { status: existing ? 200 : 201 },
    )
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 },
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
