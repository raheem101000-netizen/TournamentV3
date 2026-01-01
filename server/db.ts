import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL must be set. Did you forget to provision a database?");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("[DB] Initializing database connection...");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 100,              // INCREASED: default 10 → 100 for 1000+ concurrent users
  min: 10,               // Keep minimum 10 connections ready
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test pool connection
pool.on('error', (err) => {
  console.error('[DB] Pool error:', err);
});

export const db = drizzle({ client: pool, schema });

console.log("[DB] Database connection initialized");
