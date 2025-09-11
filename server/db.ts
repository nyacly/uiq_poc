import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Session context for RLS policies
export async function setUserSession(userId: string | null) {
  if (userId) {
    await db.execute(sql`SET LOCAL app.user_id = ${userId}`);
  } else {
    await db.execute(sql`SET LOCAL app.user_id = ''`);
  }
}

// Create database connection with session context
export function createSessionDb(userId: string | null = null) {
  const sessionDb = drizzle({ client: pool, schema });
  
  // Set session context immediately for this connection
  if (userId) {
    sessionDb.execute(sql`SET LOCAL app.user_id = ${userId}`);
  }
  
  return sessionDb;
}
