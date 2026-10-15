// Monthly base price per product for the Billing screen.

export const product_BASE_PRICES: Record<string, number> = {
  wheat: 3000,
  maize: 3000,
  sesame: 3000,
  millet: 3000,
  cotton: 3000,
  paddy: 3000,
  rice: 3000,
  edibleoil: 5000,
  "edible oil": 5000,
  fertilizer: 5000,
  livestock: 5000,
  livemarket: 3000,
  "live market": 3000,
  dates: 3000,
  mustard: 3000,
  spices: 3000,
  pulses: 3000,
  kiryana: 5000,
  sugar: 3000,
  sugarcane: 3000,
  fruits: 5000,
  fruit: 5000,
  vegetables: 5000,
  vegetable: 5000,
  dryfruit: 3000,
  "dry fruit": 3000,
  herbs: 3000,
  herbals: 3000,
};

export function getproductBasePrice(product: string): number {
  const k = (product || "").toLowerCase().trim();
  if (product_BASE_PRICES[k] !== undefined) return product_BASE_PRICES[k];
  for (const [key, price] of Object.entries(product_BASE_PRICES)) {
    if (k.includes(key) || key.includes(k)) return price;
  }
  return 3000;
}
