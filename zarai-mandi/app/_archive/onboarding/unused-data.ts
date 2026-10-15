// Onboarding data only the archived steps (interests, subscription, payment) used.

import cotton200 from "../../src/icons/products/cotton200.png";
import dates200 from "../../src/icons/products/dates200.png";
import dryfruits200 from "../../src/icons/products/dryfruits200.png";
import edible200 from "../../src/icons/products/edible200.png";
import fertilizers200 from "../../src/icons/products/fertilizers.png";
import fruits200 from "../../src/icons/products/fruits200.png";
import herbals200 from "../../src/icons/products/herbals200.png";
import maize200 from "../../src/icons/products/maize200.png";
import millet200 from "../../src/icons/products/millet200.png";
import mustard200 from "../../src/icons/products/mustard200.png";
import paddy200 from "../../src/icons/products/paddy200.png";
import pulses200 from "../../src/icons/products/pulses200.png";
import rice200 from "../../src/icons/products/rice200.png";
import sesame200 from "../../src/icons/products/sesame200.png";
import spices200 from "../../src/icons/products/spices200.png";
import sugar200 from "../../src/icons/products/sugar200.png";
import vegetables200 from "../../src/icons/products/vegetables200.png";
import wheat200 from "../../src/icons/products/wheat200.png";
import kiryana200 from "../../src/icons/products/kiryana200.png";
import livestock200 from "../../src/onboarding/icons/livestock200.png";
import livemarket200 from "./icons/livemarket200.png";

export const ICONS: Record<string, string> = {
  wheat: wheat200,
  rice: rice200,
  cotton: cotton200,
  maize: maize200,
  sugar: sugar200,
  pulses: pulses200,
  mustard: mustard200,
  sesame: sesame200,
  millet: millet200,
  paddy: paddy200,
  dates: dates200,
  spices: spices200,
  dryfruit: dryfruits200,
  livemarket: livemarket200,
  fruits: fruits200,
  vegetables: vegetables200,
  livestock: livestock200,
  fertilizer: fertilizers200,
  edibleoil: edible200,
  kiryana: kiryana200,
  herbs: herbals200,
};

export const PROVINCES = ["Punjab", "Sindh", "KPK", "Balochistan"];

export const PRODUCTS = [
  { id: "wheat", label: "Wheat", price: 3000 },
  { id: "maize", label: "Maize", price: 3000 },
  { id: "sesame", label: "Sesame", price: 3000 },
  { id: "millet", label: "Millet", price: 3000 },
  { id: "cotton", label: "Cotton", price: 3000 },
  { id: "paddy", label: "Paddy", price: 3000 },
  { id: "rice", label: "Rice", price: 3000 },
  { id: "edibleoil", label: "Edible Oil", price: 5000 },
  { id: "fertilizer", label: "Fertilizer", price: 5000 },
  { id: "livestock", label: "Livestock", price: 5000 },
  { id: "livemarket", label: "Live Market", price: 3000 },
  { id: "dates", label: "Dates", price: 3000 },
  { id: "mustard", label: "Mustard", price: 3000 },
  { id: "spices", label: "Spices", price: 3000 },
  { id: "pulses", label: "Pulses", price: 3000 },
  { id: "kiryana", label: "Kiryana", price: 5000 },
  { id: "sugar", label: "Sugarcane/Sugar", price: 3000 },
  { id: "fruits", label: "Fruits", price: 5000 },
  { id: "vegetables", label: "Vegetable", price: 5000 },
  { id: "dryfruit", label: "Dry Fruit", price: 3000 },
  { id: "herbs", label: "Herbs", price: 3000 },
];

// Rep products in the specified order with updated labels
export const REP_PRODUCTS = [
  { id: "wheat", label: "Wheat" },
  { id: "maize", label: "Maize" },
  { id: "sesame", label: "Sesame" },
  { id: "millet", label: "Millet" },
  { id: "cotton", label: "Cotton" },
  { id: "paddy", label: "Paddy" },
  { id: "rice", label: "Rice" },
  { id: "edibleoil", label: "Edible Oil" },
  { id: "fertilizer", label: "Fertilizer" },
  { id: "livestock", label: "Livestock" },
  { id: "livemarket", label: "Live Market" },
  { id: "dates", label: "Dates" },
  { id: "mustard", label: "Mustard" },
  { id: "spices", label: "Spices" },
  { id: "pulses", label: "Pulses" },
  { id: "kiryana", label: "Kiryana" },
  { id: "sugar", label: "Sugar" },
  { id: "fruits", label: "Fruits" },
  { id: "vegetables", label: "Vegetable" },
  { id: "dryfruit", label: "Dry Fruit" },
  { id: "herbs", label: "Herbs" },
];

export const DURATION_MONTHS = [1, 3, 6, 12];

export const DURATION_LABELS = ["1 Month", "3 Months", "6 Months", "1 Year"];

export const DISCOUNTS = [0, 0.1, 0.15, 0.25];

export function calcPricing(selectedIds: string[], durIdx: number) {
  const monthlyTotal = selectedIds.reduce((sum, id) => {
    const p = PRODUCTS.find((x) => x.id === id);
    return sum + (p?.price ?? 0);
  }, 0);
  const months = DURATION_MONTHS[durIdx];
  const discount = DISCOUNTS[durIdx];
  const regularTotal = monthlyTotal * months;
  const discountAmt = Math.round(regularTotal * discount);
  const finalTotal = regularTotal - discountAmt;
  return {
    monthlyTotal,
    months,
    discount,
    regularTotal,
    discountAmt,
    finalTotal,
  };
}
