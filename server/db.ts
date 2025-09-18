import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_CONNECTION_STRING ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL;

const isPostgresUrl =
  typeof connectionString === "string" &&
  /^postgres(ql)?:\/\//i.test(connectionString);

neonConfig.webSocketConstructor = ws;

let poolInstance: Pool | null = null;
let dbInstance: NeonHttpDatabase<typeof schema>;

if (isPostgresUrl && connectionString) {
  poolInstance = new Pool({ connectionString });
  dbInstance = drizzle({ client: poolInstance, schema });
} else {
  if (connectionString) {
    console.warn(
      "DATABASE_URL does not appear to be a PostgreSQL connection string. Neon client will be disabled until a valid connection string is provided.",
    );
  } else {
    console.warn(
      "No PostgreSQL connection string found. Neon client will be disabled until POSTGRES_URL or DATABASE_URL is set.",
    );
  }

  dbInstance = new Proxy({}, {
    get() {
      throw new Error(
        "PostgreSQL connection is not configured. Set POSTGRES_URL (or DATABASE_URL) to a valid PostgreSQL connection string to enable server-side database access.",
      );
    },
  }) as NeonHttpDatabase<typeof schema>;
}

export const pool = poolInstance;
export const db = dbInstance;

// Session context for RLS policies
export async function setUserSession(userId: string | null) {
  if (!isPostgresUrl || !poolInstance) {
    console.warn('Skipping setUserSession because PostgreSQL connection is not configured.');
    return;
  }

  if (userId) {
    await db.execute(sql`SET LOCAL app.user_id = ${userId}`);
  } else {
    await db.execute(sql`SET LOCAL app.user_id = ''`);
  }
}

// Create database connection with session context
export function createSessionDb(userId: string | null = null) {
  if (!isPostgresUrl || !poolInstance) {
    throw new Error('Cannot create session database because PostgreSQL connection is not configured.');
  }

  const sessionDb = drizzle({ client: poolInstance, schema });

  // Set session context immediately for this connection
  if (userId) {
    sessionDb.execute(sql`SET LOCAL app.user_id = ${userId}`);
  }

  return sessionDb;
}
