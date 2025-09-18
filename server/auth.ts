import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db, users } from '@/lib/db'
import type { UserRole } from '@shared/schema'

const DEV_USER_COOKIE = 'x-dev-user-id'

type UserRecord = typeof users.$inferSelect

export type SessionUser = Pick<UserRecord, 'id' | 'email' | 'role' | 'status'>

export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'HttpError'
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Authentication required') {
    super(401, message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message)
    this.name = 'ForbiddenError'
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const rawUserId = cookieStore.get(DEV_USER_COOKIE)?.value?.trim()

  if (!rawUserId) {
    return null
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status
      })
      .from(users)
      .where(eq(users.id, rawUserId))
      .limit(1)

    if (!user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Failed to resolve session user from cookie', error)
    return null
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()

  if (!user) {
    throw new UnauthorizedError()
  }

  return user
}

export function ensureOwnerOrAdmin(
  user: Pick<SessionUser, 'id' | 'role'>,
  ownerId: string | null | undefined
): void {
  if (!ownerId) {
    throw new ForbiddenError('Resource is missing ownership information')
  }

  if (user.role === 'admin') {
    return
  }

  if (user.id !== ownerId) {
    throw new ForbiddenError('You do not have permission to modify this resource')
  }
}

export function isAdmin(user: { role: UserRole }): boolean {
  return user.role === 'admin'
}
