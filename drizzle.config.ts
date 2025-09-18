import { defineConfig } from "drizzle-kit";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_CONNECTION_STRING ||
  process.env.NEON_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL (or POSTGRES_URL/POSTGRES_CONNECTION_STRING/NEON_DATABASE_URL) must be set to run Drizzle migrations.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./shared/schema.ts",
  out: "./drizzle",
  strict: true,
  dbCredentials: {
    url: connectionString,
  },
});
