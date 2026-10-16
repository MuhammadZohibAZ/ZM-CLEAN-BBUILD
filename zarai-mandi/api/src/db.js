import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// SQLITE_PATH overrides the default (e.g. to try a freshly built database).
const bundledPath = process.env.SQLITE_PATH
  ? path.resolve(process.env.SQLITE_PATH)
  : path.resolve(__dirname, "../db/zarai_mandi.sqlite");

// On Vercel the function's files are read-only, and SQLite (WAL mode) needs to
// write its side files, so the database is copied to /tmp once per cold start.
function writablePath() {
  if (!process.env.VERCEL) return bundledPath;
  const tmp = "/tmp/zarai_mandi.sqlite";
  if (!fs.existsSync(tmp)) fs.copyFileSync(bundledPath, tmp);
  return tmp;
}
const dbPath = writablePath();
const sqliteDb = new DatabaseSync(dbPath);

sqliteDb.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA cache_size = -64000;");

export const pool = {
  query: async (text, params = []) => {
    let sql = text;
    // Strip Postgres typecasts like ::numeric, ::text, etc.
    sql = sql.replace(/::[a-zA-Z_]+/g, "");

    const orderedParams = [];
    sql = sql.replace(/\$(\d+)/g, (_, idx) => {
      const paramIndex = parseInt(idx, 10) - 1;
      orderedParams.push(params[paramIndex]);
      return "?";
    });

    const finalParams = orderedParams.length > 0 ? orderedParams : params;
    const stmt = sqliteDb.prepare(sql);
    const rows = stmt.all(...finalParams);
    return { rows };
  }
};
