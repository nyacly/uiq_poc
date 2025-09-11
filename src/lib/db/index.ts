// Database connection and configuration
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../../shared/schema'

// Get database URL from environment
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Create postgres client
const client = postgres(connectionString, { 
  prepare: false,
  max: 10 
})

// Create drizzle instance with schema
export const db = drizzle(client, { schema })

// Export schema for convenience
export * from '../../../shared/schema'