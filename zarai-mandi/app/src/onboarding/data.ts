// Onboarding data: screens, cities, languages, professions, country codes and
// phone / email validation.

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

/** Urdu names for the professions (the stored value stays English). */
const PROFESSION_UR: Record<string, string> = {
  Farmer: "کسان",
  Stockist: "اسٹاکسٹ",
  Broker: "بروکر",
  "Commission Agent": "کمیشن ایجنٹ (آڑھتی)",
  Dealer: "ڈیلر",
  Wholesaler: "تھوک فروش",
  Retailer: "پرچون فروش",
  Exporter: "برآمد کنندہ",
  Importer: "درآمد کنندہ",
  Miller: "مل مالک",
  "Indenting Agents": "انڈینٹنگ ایجنٹ",
  "Commodity Brokerage House": "کموڈٹی بروکریج ہاؤس",
  "Commodity Data Provider / Data & Information Company": "کموڈٹی ڈیٹا فراہم کنندہ / ڈیٹا اور معلوماتی کمپنی",
  Other: "دیگر",
};

export function professionLabel(p: string, isUr: boolean): string {
  return isUr ? PROFESSION_UR[p] || p : p;
}

export const LANGUAGES = [
  { code: "en", native: "English", urdu: false },
  { code: "ur", native: "اردو", urdu: true },
  // { code: "pa", native: "پنجابی", urdu: true },
  // { code: "sd", native: "سنڌي", urdu: true },
  // { code: "bl", native: "بلوچی", urdu: true },
  // { code: "ps", native: "پښتو", urdu: true },
  // { code: "sk", native: "سرائیکی", urdu: true, centered: true },
];

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
