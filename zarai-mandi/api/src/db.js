import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../db/zarai_mandi.sqlite");
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
