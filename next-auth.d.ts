import type { MembershipTier, UserRole, UserStatus } from '@shared/schema'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      role: UserRole
      status: UserStatus
      membershipTier: MembershipTier
      name?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    email: string
    role: UserRole
    status: UserStatus
    membershipTier: MembershipTier
    name?: string | null
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole
    status?: UserStatus
    membershipTier?: MembershipTier
  }
}
