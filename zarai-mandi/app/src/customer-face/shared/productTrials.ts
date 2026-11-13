// Free trial of one product, asked for from View All after the account's own
// free trial is over (the user subscribed to some products, not this one).
// A trial lasts TRIAL_DAYS and shows the product's rates from the last week.
// One trial per product. Kept on this phone (localStorage) for now.

export const TRIAL_DAYS = 2;
export const TRIAL_HISTORY_DAYS = 7;
const KEY = "zm_product_trials";
const DAY = 24 * 60 * 60 * 1000;

export type Trials = Record<string, { start: number; end: number }>;
export type TrialStatus = "none" | "active" | "used";

export function readTrials(): Trials {
  try {
    const t = JSON.parse(window.localStorage.getItem(KEY) || "{}");
    return t && typeof t === "object" ? t : {};
  } catch {
    return {};
  }
}

export function startTrial(trials: Trials, product: string, now = Date.now()): Trials {
  const next = { ...trials, [product]: { start: now, end: now + TRIAL_DAYS * DAY } };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode: the trial lasts this session */
  }
  return next;
}

export function trialStatus(trials: Trials, product: string, now = Date.now()): TrialStatus {
  const t = trials[product];
  if (!t) return "none";
  return now < t.end ? "active" : "used";
}
