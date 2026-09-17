import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://zarai_mandi:zarai_mandi_dev@localhost:5432/zarai_mandi",
  max: 10,
  idleTimeoutMillis: 30_000,
});
