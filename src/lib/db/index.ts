// Database connection and configuration
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../../shared/schema'

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_CONNECTION_STRING ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL

const isPostgresUrl =
  typeof connectionString === 'string' &&
  /^postgres(ql)?:\/\//i.test(connectionString)

let dbInstance: PostgresJsDatabase<typeof schema>

if (isPostgresUrl && connectionString) {
  const client = postgres(connectionString, {
    prepare: false,
    max: 10,
  })

  dbInstance = drizzle(client, { schema })
} else {
  if (connectionString) {
    console.warn(
      'DATABASE_URL does not appear to be a PostgreSQL connection string. Drizzle will be disabled until a valid PostgreSQL URL is provided.',
    )
  } else {
    console.warn(
      'No PostgreSQL connection string found. Drizzle will be disabled until POSTGRES_URL or DATABASE_URL is set.',
    )
  }

  dbInstance = new Proxy({}, {
    get() {
      throw new Error(
        'PostgreSQL connection is not configured. Set POSTGRES_URL (or DATABASE_URL) to a valid PostgreSQL connection string to enable database access.',
      )
    },
  }) as PostgresJsDatabase<typeof schema>
}

export const db = dbInstance

// Export schema for convenience
export * from '../../../shared/schema'