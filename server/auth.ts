import { eq } from 'drizzle-orm'
import { compare } from 'bcryptjs'
import NextAuth, { getServerSession, type NextAuthOptions, type User, type Account, type Session } from 'next-auth'
import { type JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { z } from 'zod'

import {
  db,
  profiles,
  users,
  type MembershipTier,
  type UserRole,
  type UserStatus,
} from '@/lib/db'

type UserRecord = typeof users.$inferSelect

const AUTH_SECRET = process.env.NEXTAUTH_SECRET ?? 'insecure-development-secret'

if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn(
    'NEXTAUTH_SECRET is not set. Falling back to an insecure development secret. Set NEXTAUTH_SECRET in your environment.',
  )
}

const credentialsSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
  })
  .strict()

const normaliseEmail = (email: string) => email.trim().toLowerCase()

type ProfileSeed = {
  userId: string
  displayName?: string | null
}

async function ensureProfileExists({ userId, displayName }: ProfileSeed) {
  const fallbackName = displayName?.trim()
    ? displayName.trim().slice(0, 160)
    : 'Community Member'

  await db
    .insert(profiles)
    .values({
      userId,
      displayName: fallbackName,
    })
    .onConflictDoNothing({ target: profiles.userId })
}

async function upsertUserForEmail(email: string, displayName?: string | null) {
  const normalisedEmail = normaliseEmail(email)
  const now = new Date()

  const [user] = await db
    .insert(users)
    .values({
      email: normalisedEmail,
      role: 'member',
      status: 'active',
      membershipTier: 'FREE',
      lastSignInAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        updatedAt: now,
        lastSignInAt: now,
      },
    })
    .returning({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      membershipTier: users.membershipTier,
    })

  if (!user) {
    throw new Error('Failed to upsert OAuth user')
  }

  await ensureProfileExists({ userId: user.id, displayName })

  return user
}

async function updateLastSignIn(userId: string) {
  const now = new Date()
  await db
    .update(users)
    .set({
      lastSignInAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
}

async function fetchUserByEmail(email: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      membershipTier: users.membershipTier,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  return user
}

export type SessionUser = Pick<
  UserRecord,
  'id' | 'email' | 'role' | 'status' | 'membershipTier'
>

export const authOptions: NextAuthOptions = {
  secret: AUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials)

        if (!parsed.success) {
          return null
        }

        const email = normaliseEmail(parsed.data.email)
        const candidate = await fetchUserByEmail(email)

        if (!candidate || !candidate.passwordHash) {
          return null
        }

        const passwordMatches = await compare(
          parsed.data.password,
          candidate.passwordHash,
        )

        if (!passwordMatches) {
          return null
        }

        await Promise.all([
          updateLastSignIn(candidate.id),
          ensureProfileExists({ userId: candidate.id }),
        ])

        const { passwordHash: _passwordHash, ...user } = candidate
        return user
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }: { user: User; account: Account | null }) {
      if (!account) {
        return false
      }

      if (account.provider === 'google') {
        if (!user.email) {
          return false
        }

        const upserted = await upsertUserForEmail(user.email, user.name)

        user.id = upserted.id
        user.email = upserted.email
        user.role = upserted.role
        user.status = upserted.status
        user.membershipTier = upserted.membershipTier
      }

      return true
    },
    async jwt({ token, user }: { token: JWT; user?: User | undefined }) {
      if (user) {
        token.sub = user.id
        token.email = user.email
        token.role = user.role
        token.status = user.status
        token.membershipTier = user.membershipTier
      }

      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub ?? ''
        session.user.email = token.email as string
        session.user.role = token.role as UserRole
        session.user.membershipTier = token.membershipTier as MembershipTier
        session.user.status = token.status as UserStatus
      }

      return session
    },
  },
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  authOptions.providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  )
}

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
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  const sessionUserId = session.user?.id

  if (!sessionUserId) {
    return null
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      membershipTier: users.membershipTier,
    })
    .from(users)
    .where(eq(users.id, sessionUserId))
    .limit(1)

  if (!user) {
    return null
  }

  return user
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
  ownerId: string | null | undefined,
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

