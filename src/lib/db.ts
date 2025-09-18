export * from './db/index'

import { PrismaClient } from '@prisma/client'

const SQLITE_ENV_VAR = 'SQLITE_DATABASE_URL'
const FALLBACK_SQLITE_URL = 'file:./prisma/dev.db'

const hasSqliteUrl = (url: string | undefined): url is string =>
  typeof url === 'string' && url.trim().length > 0

const ensureSqliteUrl = () => {
  if (!hasSqliteUrl(process.env[SQLITE_ENV_VAR])) {
    const databaseUrl = process.env.DATABASE_URL

    if (hasSqliteUrl(databaseUrl) && databaseUrl.startsWith('file:')) {
      process.env[SQLITE_ENV_VAR] = databaseUrl
    } else {
      if (hasSqliteUrl(databaseUrl) && !databaseUrl.startsWith('file:')) {
        console.warn(
          'DATABASE_URL is configured for a non-SQLite datasource. Falling back to a local SQLite file for Prisma until migration is complete.',
        )
      }

      process.env[SQLITE_ENV_VAR] = FALLBACK_SQLITE_URL
    }
  }

  const sqliteUrl = process.env[SQLITE_ENV_VAR]

  if (!hasSqliteUrl(sqliteUrl) || !sqliteUrl.startsWith('file:')) {
    throw new Error(
      `Invalid SQLite connection string provided. Expected a value starting with "file:" for ${SQLITE_ENV_VAR}.`,
    )
  }
}

ensureSqliteUrl()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

