export const ALL_RATE_TYPES = [
  "Mandi Rate",
  "Wholesale Rate",
  "Retail Rate",
  "Stock Rate",
  "Broker Rate",
  "Dealer Rate",
  "Farm Rate",
  "Mill Rate",
  "Ex-Mill Rate",
  "Mill Gate Rate",
  "Farm Gate Rate",
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
  "Ex-Mill Rate": "ایکس مل ریٹ",
  "Mill Gate Rate": "مل گیٹ ریٹ",
  "Farm Gate Rate": "فارم گیٹ ریٹ",
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
  "Ex-Mill Rate": "#7C2D12",   // Mill brick
  "Mill Gate Rate": "#92400E", // Mill gate amber
  "Farm Gate Rate": "#3F6212", // Farm gate olive
};
export const RATE_MULTS: Record<string, number> = {
  "Farm Rate": 0.88,
  "Broker Rate": 0.95,
  "Mill Rate": 1.0,
  "Stock Rate": 1.08,
  "Dealer Rate": 1.05,
  "Mandi Rate": 1.0,
  "Export Rate": 1.12,
  "Ex-Mill Rate": 1.0,
  "Mill Gate Rate": 1.0,
  "Farm Gate Rate": 0.9,
  "Retail Rate": 1.18,
  "Wholesale Rate": 1.02,
};
