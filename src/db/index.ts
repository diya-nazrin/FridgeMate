import "server-only";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const pool = new Pool({
  connectionString,
  max: 5,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool);