export function getMonthlyDiscount(months: number): number {
  if (months <= 1) return 0;
  if (months === 2) return 0.05; // 5% for 2 months
  if (months === 3) return 0.1; // 10% for 3 months
  if (months === 4 || months === 5) return 0.125; // 12.5% for 4 and 5 months
  if (months === 6) return 0.15; // 15% for 6 months
  if (months === 7 || months === 8) return 0.175; // 17.5% for 7 and 8 months
  if (months >= 9 && months <= 11) return 0.2; // 20% for 9, 10, 11 months
  if (months >= 12) return 0.25; // 25% for 12 months
  return 0;
}



// ─── BILLING / SUBSCRIPTION SCREEN (MATCHING ONBOARDING) ─────────────────────
export const DURATION_MONTHS_BILLING = [1, 3, 6, 12];
export const DURATION_LABELS_BILLING = ["1 Month", "3 Months", "6 Months", "1 Year"];
export const DISCOUNTS_BILLING = [0, 0.1, 0.15, 0.25];
