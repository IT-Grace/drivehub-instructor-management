// Database connection for PostgreSQL
// Referenced from javascript_database blueprint

import dotenv from "dotenv";
dotenv.config();

import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Use regular PostgreSQL for local development, Neon for production
const isLocalDatabase = process.env.DATABASE_URL.includes("localhost");

let db: any;
let pool: any;

if (isLocalDatabase) {
  // Local PostgreSQL setup
  console.log("🔧 Using local PostgreSQL database");
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");

  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
} else {
  // Neon serverless setup
  console.log("☁️ Using Neon serverless database");
  const { Pool, neonConfig } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  const ws = await import("ws");

  neonConfig.webSocketConstructor = ws.default;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { db, pool };
