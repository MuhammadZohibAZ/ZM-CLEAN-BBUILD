export const ALL_RATE_TYPES = [
  "Mandi Rate",
  "Wholesale Rate",
  "Retail Rate",
  "Stock Rate",
  "Broker Rate",
  "Dealer Rate",
  "Farm Rate",
  "Mill Rate",
  "Export Rate",
];
export const RATE_TYPE_URDU: Record<string, string> = {
  "Farm Rate": "فارم ریٹ",
  "Broker Rate": "بروکر ریٹ",
  "Mill Rate": "مل ریٹ",
  "Stock Rate": "اسٹاک ریٹ",
  "Dealer Rate": "ڈیلر ریٹ",
  "Mandi Rate": "منڈی ریٹ",
  "Export Rate": "برآمد ریٹ",
  "Retail Rate": "خردہ ریٹ",
  "Wholesale Rate": "ہول سیل ریٹ",
};
export const RATE_COLORS: Record<string, string> = {
  "Mandi Rate": "#0E645C",     // Zarai Mandi Deep Forest Emerald
  "Farm Rate": "#4D7C0F",      // Lush Crop / Farm Foliage Olive Green
  "Wholesale Rate": "#1E5E7A", // Canal Irrigation / River Slate Teal
  "Mill Rate": "#B45309",      // Golden Harvest Grain / Amber Wheat
  "Retail Rate": "#A16207",    // Sunlit Stalk / Golden Ochre
  "Stock Rate": "#C94A43",     // Zarai Mandi Terracotta Red / Brick Silo
  "Dealer Rate": "#D97706",    // Warm Field Amber / Harvest Sun
  "Broker Rate": "#334155",    // Fertile Dark Soil / Slate Charcoal
  "Export Rate": "#1E3A5F",    // Deep Port Navy / Maritime Trade
};
export const RATE_MULTS: Record<string, number> = {
  "Farm Rate": 0.88,
  "Broker Rate": 0.95,
  "Mill Rate": 1.0,
  "Stock Rate": 1.08,
  "Dealer Rate": 1.05,
  "Mandi Rate": 1.0,
  "Export Rate": 1.12,
  "Retail Rate": 1.18,
  "Wholesale Rate": 1.02,
};
