import { REAL_DATES_TIMELINE } from "../../../data/realCommodityData";
import { fetchDatasetRange } from "../../../lib/api";

// The days the market data covers: every calendar day from the first to the
// last report in the API's database (a year of prices). Loaded once before the
// app renders (main.tsx); until then, or if the API can't be reached, it is the
// bundled one-month window. Charts, the date pill and "latest" all use it.

export const DATASET_DATES: string[] = [...REAL_DATES_TIMELINE];

export const firstDatasetDate = () => DATASET_DATES[0];
export const latestDatasetDate = () => DATASET_DATES[DATASET_DATES.length - 1];

/** The latest report day as a local Date (the app's "today"). */
export function latestDatasetDay(): Date {
  const [y, m, d] = latestDatasetDate().split("-").map(Number);
  return new Date(y, m - 1, d);
}

function calendarDays(first: string, last: string): string[] {
  const days: string[] = [];
  const cur = new Date(`${first}T00:00:00Z`);
  const end = new Date(`${last}T00:00:00Z`);
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

/** Fills DATASET_DATES from the API; keeps the bundled window on failure or timeout. */
export async function loadDatasetDates(timeoutMs = 4000): Promise<void> {
  try {
    const range = await Promise.race([
      fetchDatasetRange(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
    ]);
    if (!range?.first || !range?.last) return;
    const days = calendarDays(range.first.slice(0, 10), range.last.slice(0, 10));
    if (days.length) DATASET_DATES.splice(0, DATASET_DATES.length, ...days);
  } catch {
    // API unreachable: stay on the bundled window.
  }
}
