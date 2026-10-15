// Onboarding data: product / city / language lists, pricing and contact validation.

import cotton200 from "../icons/products/cotton200.png";
import dates200 from "../icons/products/dates200.png";
import dryfruits200 from "../icons/products/dryfruits200.png";
import edible200 from "../icons/products/edible200.png";
import fertilizers200 from "../icons/products/fertilizers.png";
import fruits200 from "../icons/products/fruits200.png";
import herbals200 from "../icons/products/herbals200.png";
import maize200 from "../icons/products/maize200.png";
import millet200 from "../icons/products/millet200.png";
import mustard200 from "../icons/products/mustard200.png";
import paddy200 from "../icons/products/paddy200.png";
import pulses200 from "../icons/products/pulses200.png";
import rice200 from "../icons/products/rice200.png";
import sesame200 from "../icons/products/sesame200.png";
import spices200 from "../icons/products/spices200.png";
import sugar200 from "../icons/products/sugar200.png";
import vegetables200 from "../icons/products/vegetables200.png";
import wheat200 from "../icons/products/wheat200.png";
import kiryana200 from "../icons/products/kiryana200.png";
import livestock200 from "./icons/livestock200.png";
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

// ─── Types ────────────────────────────────────────────────────────────────────
export type Screen =
  | "lang"
  | "role"
  | "account"
  | "interests"
  | "location"
  | "subscription"
  | "payment"
  | "loading"
  | "rep-pending"
  | "dashboard";

export type Role = "customer" | "representative";

// ─── Data ─────────────────────────────────────────────────────────────────────
export const CITIES: { city: string; district: string; province: string }[] = [
  { city: "Lahore", district: "Lahore", province: "Punjab" },
  { city: "Faisalabad", district: "Faisalabad", province: "Punjab" },
  { city: "Rawalpindi", district: "Rawalpindi", province: "Punjab" },
  { city: "Multan", district: "Multan", province: "Punjab" },
  { city: "Gujranwala", district: "Gujranwala", province: "Punjab" },
  { city: "Sialkot", district: "Sialkot", province: "Punjab" },
  { city: "Bahawalpur", district: "Bahawalpur", province: "Punjab" },
  { city: "Okara", district: "Okara", province: "Punjab" },
  { city: "Sahiwal", district: "Sahiwal", province: "Punjab" },
  { city: "Sargodha", district: "Sargodha", province: "Punjab" },
  { city: "Sheikhupura", district: "Sheikhupura", province: "Punjab" },
  { city: "Rahim Yar Khan", district: "Rahim Yar Khan", province: "Punjab" },
  { city: "Jhang", district: "Jhang", province: "Punjab" },
  { city: "Gujrat", district: "Gujrat", province: "Punjab" },
  { city: "Kasur", district: "Kasur", province: "Punjab" },
  { city: "Chiniot", district: "Chiniot", province: "Punjab" },
  { city: "Khanewal", district: "Khanewal", province: "Punjab" },
  { city: "Mandi Bahauddin", district: "Mandi Bahauddin", province: "Punjab" },
  { city: "Pakpattan", district: "Pakpattan", province: "Punjab" },
  { city: "Vehari", district: "Vehari", province: "Punjab" },
  { city: "Muzaffargarh", district: "Muzaffargarh", province: "Punjab" },
  { city: "Lodhran", district: "Lodhran", province: "Punjab" },
  { city: "Chakwal", district: "Chakwal", province: "Punjab" },
  { city: "Attock", district: "Attock", province: "Punjab" },
  { city: "Jhelum", district: "Jhelum", province: "Punjab" },
  { city: "Karachi", district: "Karachi", province: "Sindh" },
  { city: "Hyderabad", district: "Hyderabad", province: "Sindh" },
  { city: "Sukkur", district: "Sukkur", province: "Sindh" },
  { city: "Larkana", district: "Larkana", province: "Sindh" },
  { city: "Nawabshah", district: "Nawabshah", province: "Sindh" },
  { city: "Mirpurkhas", district: "Mirpurkhas", province: "Sindh" },
  { city: "Jacobabad", district: "Jacobabad", province: "Sindh" },
  { city: "Shikarpur", district: "Shikarpur", province: "Sindh" },
  { city: "Khairpur", district: "Khairpur", province: "Sindh" },
  { city: "Dadu", district: "Dadu", province: "Sindh" },
  { city: "Umerkot", district: "Umerkot", province: "Sindh" },
  { city: "Tharparkar", district: "Tharparkar", province: "Sindh" },
  { city: "Peshawar", district: "Peshawar", province: "KPK" },
  { city: "Mardan", district: "Mardan", province: "KPK" },
  { city: "Abbottabad", district: "Abbottabad", province: "KPK" },
  { city: "Swat", district: "Swat", province: "KPK" },
  { city: "Nowshera", district: "Nowshera", province: "KPK" },
  { city: "Charsadda", district: "Charsadda", province: "KPK" },
  { city: "Kohat", district: "Kohat", province: "KPK" },
  { city: "Mansehra", district: "Mansehra", province: "KPK" },
  { city: "Dera Ismail Khan", district: "D.I. Khan", province: "KPK" },
  { city: "Haripur", district: "Haripur", province: "KPK" },
  { city: "Quetta", district: "Quetta", province: "Balochistan" },
  { city: "Gwadar", district: "Gwadar", province: "Balochistan" },
  { city: "Khuzdar", district: "Khuzdar", province: "Balochistan" },
  { city: "Hub", district: "Lasbela", province: "Balochistan" },
  { city: "Turbat", district: "Kech", province: "Balochistan" },
  { city: "Chaman", district: "Qilla Abdullah", province: "Balochistan" },
  { city: "Zhob", district: "Zhob", province: "Balochistan" },
  { city: "Muzaffarabad", district: "Muzaffarabad", province: "AJK" },
  { city: "Mirpur", district: "Mirpur", province: "AJK" },
  { city: "Rawalakot", district: "Poonch", province: "AJK" },
  { city: "Gilgit", district: "Gilgit", province: "Gilgit-Baltistan" },
  { city: "Skardu", district: "Skardu", province: "Gilgit-Baltistan" },
];

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

export const REP_PROFESSIONS = [
  "Farmer",
  "Stockist",
  "Broker",
  "Commission Agent",
  "Dealer",
  "Wholesaler",
  "Retailer",
  "Exporter",
  "Importer",
  "Miller",
  "Indenting Agents",
  "Commodity Brokerage House",
  "Commodity Data Provider / Data & Information Company",
  "Other",
];

export const LANGUAGES = [
  { code: "en", native: "English", urdu: false },
  { code: "ur", native: "اردو", urdu: true },
  // { code: "pa", native: "پنجابی", urdu: true },
  // { code: "sd", native: "سنڌي", urdu: true },
  // { code: "bl", native: "بلوچی", urdu: true },
  // { code: "ps", native: "پښتو", urdu: true },
  // { code: "sk", native: "سرائیکی", urdu: true, centered: true },
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

// ─── Shared registration helpers ────────────────────────────────────────────────
export const COUNTRY_CODES = [
  {
    code: "+92",
    flag: "🇵🇰",
    country: "Pakistan",
    digits: 10,
    hint: "03XX XXXXXXX",
  },
  { code: "+91", flag: "🇮🇳", country: "India", digits: 10, hint: "XXXXXXXXXX" },
  { code: "+971", flag: "🇦🇪", country: "UAE", digits: 9, hint: "XX XXX XXXX" },
  {
    code: "+966",
    flag: "🇸🇦",
    country: "Saudi Arabia",
    digits: 9,
    hint: "XX XXX XXXX",
  },
  { code: "+44", flag: "🇬🇧", country: "UK", digits: 10, hint: "XXXX XXXXXX" },
  {
    code: "+1",
    flag: "🇺🇸",
    country: "USA / Canada",
    digits: 10,
    hint: "XXX XXX XXXX",
  },
];

// Sample Google accounts for the picker
export const GOOGLE_SAMPLE_ACCOUNTS = [
  {
    email: "ahmed.khan@gmail.com",
    name: "Ahmed Khan",
    initials: "AK",
    color: "#1a73e8",
  },
  {
    email: "fatima.ali@gmail.com",
    name: "Fatima Ali",
    initials: "FA",
    color: "#e34c26",
  },
  {
    email: "zm.user@gmail.com",
    name: "ZM User",
    initials: "ZU",
    color: "#34a853",
  },
];

export const PROFESSIONS = REP_PROFESSIONS;

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function getPhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizePhone(value: string, countryCode: string) {
  const digits = getPhoneDigits(value);
  const trimmed = digits.startsWith("0") ? digits.slice(1) : digits;
  return `${countryCode}${trimmed}`;
}

export function isValidPhone(value: string, countryCode = "+92") {
  const cc = COUNTRY_CODES.find((c) => c.code === countryCode);
  if (!cc) return false;
  const digits = getPhoneDigits(value);
  const trimmed = digits.startsWith("0") ? digits.slice(1) : digits;
  return trimmed.length === cc.digits;
}

// ─── Tabbed contact input: Phone tab + Email tab ──────────────────────────────
export type ContactInputTab = "phone" | "email";
