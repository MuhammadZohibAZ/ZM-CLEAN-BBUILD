import { REAL_MANDI_ROWS, REAL_FEED_MESSAGES } from "../../../data/realCommodityData";

import { VERTICALS } from "./catalog";
import { type FeedMsg, type LocationScope, type RichRow } from "../types";

// ─── Agricultural Commodity Matchers (Global) ───────────────────
export function isMatchProduct(excelProd: string, targetProds: string | string[]): boolean {
  if (!excelProd) return false;
  if (!targetProds) return true;
  const targetList = Array.isArray(targetProds) ? targetProds : [targetProds];
  if (targetList.length === 0) return true;
  const ep = excelProd.toLowerCase().trim();
  return targetList.some((tp) => {
    if (!tp) return false;
    const t = tp.toLowerCase().trim();
    if (ep === t || ep.includes(t) || t.includes(ep)) return true;
    if (t === "wheat" && ep.includes("wheat")) return true;
    if (t === "maize" && (ep.includes("maize") || ep.includes("corn"))) return true;
    if (t === "cotton" && (ep.includes("cotton") || ep.includes("phutti") || ep.includes("lint"))) return true;
    if (t === "paddy" && (ep === "rice" || ep.includes("paddy"))) return true;
    if (t === "rice" && (ep === "milled rice" || ep.includes("rice") || ep.includes("basmati") || ep.includes("irri"))) return true;
    if (
      ["edible oil", "edible oils", "mustard", "canola", "sunflower", "soybean", "taara meera", "taramira", "arugula", "castor"].includes(t) &&
      (ep === "edible oil" || ep.includes("oil") || ep.includes("mustard") || ep.includes("canola") || ep.includes("sunflower") || ep.includes("soybean") || ep.includes("sarson"))
    ) return true;
    if (
      ["fruits", "fruit", "mango", "banana", "citrus", "apple", "orange", "melon", "peach", "apricot", "plum", "cherry", "grapes", "pomegranate", "papaya", "watermelon", "falsa"].includes(t) &&
      (ep === "fruits" || ep.includes("fruit"))
    ) return true;
    if (
      ["vegetable", "vegetables", "potato", "tomato", "onion", "garlic", "ginger", "chilli", "chillies", "cucumber", "brinjal", "okra", "cabbage", "cauliflower", "pea", "lemon", "carrot", "spinach", "turnip"].includes(t) &&
      (ep === "vegetable" || ep === "chillies" || ep.includes("veg"))
    ) return true;
    if (
      ["dry fruit", "dry fruits", "dry-fruits", "almond", "walnut", "pistachio", "cashew", "fig", "raisins"].includes(t) &&
      (ep === "dry-fruits" || ep.includes("dry"))
    ) return true;
    if (
      ["spices", "spice"].includes(t) &&
      (ep === "spices" || ep === "chillies" || ep.includes("spice") || ep.includes("chilli"))
    ) return true;
    if (
      ["sugar", "gur", "shakar"].includes(t) &&
      (ep === "sugar" || ep.includes("sugar") || ep.includes("gur") || ep.includes("shakar"))
    ) return true;
    if (
      ["pulses", "pulse", "gram", "moong", "mash", "masoor"].includes(t) &&
      (ep === "pulses" || ep.includes("gram") || ep.includes("dal") || ep.includes("daal") || ep.includes("moong") || ep.includes("mash") || ep.includes("masoor"))
    ) return true;
    if (
      ["herbs", "herbals", "hing", "ispaghol", "kalonji"].includes(t) &&
      (ep === "herbals" || ep.includes("herb"))
    ) return true;
    if (
      ["kiryana", "clarified butter", "ghee"].includes(t) &&
      (ep === "clarified butter" || ep === "sugar" || ep === "spices" || ep === "pulses")
    ) return true;
    return false;
  });
}

export function isMatchByproduct(excelBp: string, targetBp: string): boolean {
  if (!targetBp || !excelBp) return true;
  const e = excelBp.toLowerCase().replace(/[-_()]/g, " ").replace(/\s+/g, " ").trim();
  const t = targetBp.toLowerCase().replace(/[-_()]/g, " ").replace(/\s+/g, " ").trim();
  if (e === t || e.includes(t) || t.includes(e)) return true;

  // Agricultural synonyms
  if ((t.includes("flour") || t.includes("atta")) && (e.includes("flour") || e.includes("atta"))) return true;
  if ((t.includes("bran") || t.includes("choker")) && (e.includes("bran") || e.includes("choker"))) return true;
  if ((t.includes("straw") || t.includes("bhoosa")) && (e.includes("straw") || e.includes("bhoosa"))) return true;
  if ((t.includes("sooji") || t.includes("semolina")) && (e.includes("sooji") || e.includes("semolina"))) return true;
  if ((t.includes("maida") || t.includes("fine flour")) && (e.includes("maida") || e.includes("fine flour") || e.includes("refined flour"))) return true;
  if (t.includes("grade a") && e.includes("grade a")) return true;
  if (t.includes("grade b") && e.includes("grade b")) return true;
  if (t.includes("grade c") && e.includes("grade c")) return true;
  if (t.includes("raw") && (e.includes("raw") || e === "wheat" || e === "maize" || e === "paddy" || e === "rice")) return true;
  return false;
}

//  MANDI ATTRIBUTE AVAILABILITY
// Which attribute options are physically available per mandi (for visual graying)
export const MANDI_ATTR_AVAILABLE: Record<
  string,
  {
    color: string[];
    variety: string[];
    spec: string[];
    condition: string[];
    newold: string[];
  }
> = {
  "Pakpattan Mandi": {
    color: ["Golden", "White"],
    variety: ["Sona Moti", "TD-1", "SurSabz", "Akbar"],
    spec: ["Seed Quality", "Retail"],
    condition: ["Dry", "Mix"],
    newold: ["New", "Old"],
  },
  "Lahore Mandi": {
    color: ["Golden", "White", "Yellow"],
    variety: ["Sona Moti", "TD-1", "Akbar", "Ujala", "Galaxy"],
    spec: ["Seed Quality", "Retail", "Damage"],
    condition: ["Wet", "Dry", "Mix"],
    newold: ["New", "Old"],
  },
  "Multan Mandi": {
    color: ["Golden", "Yellow"],
    variety: ["Sona Moti", "SurSabz", "Anaj", "Dilkush"],
    spec: ["Retail", "Damage"],
    condition: ["Dry", "Mix"],
    newold: ["New", "Old"],
  },
  "Faisalabad Grain Market": {
    color: ["Golden", "White"],
    variety: ["TD-1", "Ujala", "Arooj", "Subham"],
    spec: ["Seed Quality", "Retail"],
    condition: ["Wet", "Dry"],
    newold: ["New", "Old"],
  },
  "Rawalpindi Sabzi Mandi": {
    color: ["White", "Yellow"],
    variety: ["Akbar", "Anaj", "Galaxy"],
    spec: ["Retail"],
    condition: ["Dry"],
    newold: ["New", "Old"],
  },
  "Karachi Mandi": {
    color: ["Golden", "White", "Yellow"],
    variety: ["Sona Moti", "TD-1", "Akbar", "Anaj"],
    spec: ["Retail", "Seed Quality", "Damage"],
    condition: ["Dry", "Mix"],
    newold: ["New", "Old"],
  },
  "Sukkur Mandi": {
    color: ["Golden", "White"],
    variety: ["Sona Moti", "Anaj", "Dilkush"],
    spec: ["Retail", "Seed Quality"],
    condition: ["Dry", "Mix"],
    newold: ["New", "Old"],
  },
  "Hyderabad Mandi": {
    color: ["Golden", "White"],
    variety: ["Sona Moti", "TD-1", "Anaj"],
    spec: ["Retail", "Seed Quality"],
    condition: ["Dry", "Mix"],
    newold: ["New", "Old"],
  },
  "Peshawar Mandi": {
    color: ["Golden", "White", "Yellow"],
    variety: ["Sona Moti", "TD-1", "Akbar", "Anaj"],
    spec: ["Retail", "Seed Quality"],
    condition: ["Dry", "Mix"],
    newold: ["New", "Old"],
  },
  "Quetta Mandi": {
    color: ["Golden", "White"],
    variety: ["Sona Moti", "Anaj", "TD-1"],
    spec: ["Retail", "Damage"],
    condition: ["Dry"],
    newold: ["New", "Old"],
  },
  "Siranwali Mandi": {
    color: ["Golden", "White"],
    variety: ["Sona Moti", "TD-1", "Arooj", "Ujala"],
    spec: ["Seed Quality", "Retail"],
    condition: ["Wet", "Dry", "Mix"],
    newold: ["New", "Old"],
  },
  "Sargodha Mandi": {
    color: ["Golden", "White"],
    variety: ["Sona Moti", "TD-1", "Ujala", "Subham"],
    spec: ["Seed Quality", "Retail"],
    condition: ["Wet", "Dry"],
    newold: ["New", "Old"],
  },
};

// Attribute price multiplier — preserved at 1 to maintain 100% exact Excel rates
export function computeAttrMult(
  variety?: string | null,
  color?: string | null,
  newOld?: string | null,
  spec?: string | null,
  condition?: string | null,
): number {
  return 1;
}

// Canonical attributes helper — returns genuine row attributes without synthetic fillers
export function getMandiCanonicalAttrs(mandiName: string): {
  variety: string;
  color: string;
  newOld: string;
  spec: string;
  condition: string;
} {
  return {
    variety: "",
    color: "",
    newOld: "",
    spec: "",
    condition: "",
  };
}

// Attach canonical attributes for a mandi preserving exact real min/max and Excel fields
export function enrichRowWithAttrs(row: {
  product: string;
  byproduct: string;
  emoji: string;
  rateType: string;
  arrival: string;
  min: number;
  max: number;
  trend: "up" | "down" | "stable";
  trendPct: number;
  mandiName: string;
  mandiCity: string;
  province: string;
  vertical?: string;
  variety?: string;
  color?: string;
  spec?: string;
  condition?: string;
  newOld?: string;
  moisture?: string;
  origin?: string;
  area?: string;
  date?: string;
  quality?: string;
}): RichRow {
  return {
    ...row,
    variety: row.variety || "",
    color: row.color || "",
    newOld: row.newOld || "",
    spec: row.spec || "",
    condition: row.condition || "",
    quality: row.quality || "",
    moisture: row.moisture || "",
    origin: row.origin || "",
    area: row.area || "",
    min: row.min,
    max: row.max,
  };
}

//  COMPLETE LOCATIONS

export const LOCATIONS: Record<string, Record<string, string[]>> = {
  Punjab: {
    Okara: ["Okara Mandi", "Depalpur Mandi"],
    Pakpattan: ["Pakpattan Mandi", "Arifwala Mandi"],
    Kasur: ["Patoki Mandi"],
    Sahiwal: ["Sahiwal Mandi", "Chichawatni Mandi"],
    Vehari: ["Burewala Mandi", "Mailsi Mandi", "Vehari Mandi"],
    Khanewal: ["Khanewal Mandi", "Mian Channu Mandi"],
    Bahawalpur: ["Bahawalpur Mandi", "Yazman Mandi"],
    Bahawalnagar: [
      "Bahawalnagar Mandi",
      "Haroonabad Mandi",
      "Fort Abbas Mandi",
      "Chishtian Mandi",
      "Minchinabad Mandi",
    ],
    "Rahim Yar Khan": [
      "Rahim Yar Khan Mandi",
      "Sadiqabad Mandi",
      "Liaquatpur Mandi",
    ],
    Lodhran: ["Lodhran Mandi", "Dunyapur Mandi"],
    Multan: ["Multan Mandi"],
    Muzaffargarh: ["Muzaffargarh Mandi"],
    Layyah: ["Chowk Azam Mandi"],
    Rajanpur: ["Rajanpur Mandi"],
    "Dera Ghazi Khan": ["DG Khan Mandi"],
    Bhakkar: ["Bhakkar Mandi"],
    Mianwali: ["Mianwali Mandi"],
    Khushab: ["Khushab Mandi", "Quaidabad Mandi"],
    Jhang: ["Jhang Mandi", "Shorkot Mandi"],
    Chiniot: ["Chiniot Mandi"],
    Faisalabad: ["Faisalabad Mandi", "Samundri Mandi", "Jaranwala Mandi"],
    "Toba Tek Singh": ["Toba Tek Singh Mandi", "Gojra Mandi", "Kamalia Mandi"],
    Sargodha: ["Sargodha Mandi"],
    Gujranwala: ["Siranwali Mandi"],
    Sialkot: ["Sialkot Mandi", "Daska Mandi", "Pasrur Mandi"],
    Sheikhupura: [
      "Sheikhupura Mandi",
      "Muridke Mandi",
      "Sharqpur Mandi",
      "Faqirwali Mandi",
    ],
    "Nankana Sahib": ["Nankana Sahib Mandi", "Bucheki Mandi"],
    Hafizabad: ["Hafizabad Mandi", "Jalalpur Bhattian Mandi"],
    Lahore: ["Lahore Mandi"],
    "Mandi Bahauddin": ["Mandi Bahauddin Mandi"],
    Hasilpur: ["Hasilpur Mandi"],
    "Kahror Pacca": ["Kahror Pacca Mandi"],
    Ellahabad: ["Ellahabad Mandi"],
    "Haveli Lakha": ["Haveli Lakha Mandi"],
    "Dunga Bunga": ["Dunga Bunga Mandi"],
    Luddan: ["Luddan Mandi"],
    Qabula: ["Qabula Mandi"],
  },
  Sindh: {
    Ghotki: ["Ghotki Mandi"],
    "Shaheed Benazirabad": ["Nawabshah Mandi"],
    Sukkur: ["Sukkur Mandi", "Pano Aqil Mandi"],
    Shikarpur: ["Shikarpur Mandi"],
    Hyderabad: ["Hyderabad Mandi"],
    Mirpurkhas: ["Digri Mandi"],
    "Naushahro Feroze": ["Naushahro Feroze Mandi"],
    Khairpur: ["Khairpur Mandi"],
    Karachi: ["Karachi Mandi"],
    Umerkot: ["Kunri Mandi"],
    Thatta: ["Mirpur Sakro Mandi", "Gharo Mandi"],
    Sanghar: ["Sanghar Mandi", "Sinjhoro Mandi"],
  },
  KPK: {
    Khyber: ["Landi Kotal Mandi"],
    Peshawar: ["Peshawar Mandi"],
    Mansehra: ["Mansehra Mandi"],
    "Dera Ismail Khan": ["Dera Ismail Khan Mandi"],
    Buner: ["Buner Mandi"],
    Mardan: ["Mardan Mandi"],
  },
  Balochistan: {
    Quetta: ["Quetta Mandi"],
  },
};

export const ALL_MANDI_NAMES: string[] = Object.values(LOCATIONS).flatMap((d) =>
  Object.values(d).flat(),
);

// --- Province Background Maps & Helpers ---
export const PROVINCE_BG: Record<string, string> = {
  Pakistan: "/assets/backgrounds/bg_pakistan.jpg",
  Punjab: "/assets/backgrounds/bg_punjab.jpg",
  Sindh: "/assets/backgrounds/bg_sindh.jpg",
  KPK: "/assets/backgrounds/bg_kpk.jpg",
  Balochistan: "/assets/backgrounds/bg_balochistan.jpg",
};

export const PROVINCE_CARD_BG: Record<string, string> = {
  Punjab: "/assets/backgrounds/card_bg_punjab.png",
  Sindh: "/assets/backgrounds/card_bg_sindh.jpg",
  KPK: "/assets/backgrounds/card_bg_kpk.png",
  Balochistan: "/assets/backgrounds/card_bg_balochistan.png",
};

export function getProvinceFromLoc(loc?: { kind: LocationScope["kind"]; label: string }): string | null {
  if (!loc || loc.kind === "pakistan") return null;
  if (loc.kind === "province") return loc.label;
  const target = (loc.label || "").trim().toLowerCase();
  for (const [prov, dists] of Object.entries(LOCATIONS)) {
    if (prov.toLowerCase() === target) return prov;
    for (const [dist, mandis] of Object.entries(dists)) {
      if (dist.toLowerCase() === target) return prov;
      for (const m of mandis) {
        const cleanM = m.toLowerCase().replace(/\s*mandi\s*/gi, "").trim();
        if (m.toLowerCase() === target || cleanM === target || target.includes(cleanM)) {
          return prov;
        }
      }
    }
  }
  return null;
}

//  FEED MESSAGES

export const FEED_MESSAGES: FeedMsg[] = REAL_FEED_MESSAGES as FeedMsg[];

//  INITIAL MANDIS

export const INITIAL_MANDIS = [
  {
    id: "pakpattan",
    name: "Pakpattan Mandi",
    city: "Pakpattan",
    province: "Punjab",
    distance: "2.5 km",
    open: true,
    fav: true,
  },
  {
    id: "arifwala",
    name: "Arifwala Mandi",
    city: "Arifwala",
    province: "Punjab",
    distance: "18 km",
    open: true,
    fav: false,
  },
  {
    id: "sahiwal",
    name: "Sahiwal Mandi",
    city: "Sahiwal",
    province: "Punjab",
    distance: "38 km",
    open: true,
    fav: false,
  },
  {
    id: "lahore",
    name: "Lahore Mandi",
    city: "Lahore",
    province: "Punjab",
    distance: "112 km",
    open: true,
    fav: true,
  },
  {
    id: "multan",
    name: "Multan Mandi",
    city: "Multan",
    province: "Punjab",
    distance: "95 km",
    open: false,
    fav: false,
  },
  {
    id: "faisalabad",
    name: "Faisalabad Mandi",
    city: "Faisalabad",
    province: "Punjab",
    distance: "65 km",
    open: true,
    fav: false,
  },
  {
    id: "okara",
    name: "Okara Mandi",
    city: "Okara",
    province: "Punjab",
    distance: "52 km",
    open: true,
    fav: false,
  },
  {
    id: "ryk",
    name: "Rahim Yar Khan Mandi",
    city: "Rahim Yar Khan",
    province: "Punjab",
    distance: "140 km",
    open: false,
    fav: false,
  },
  {
    id: "chichawatni",
    name: "Chichawatni Mandi",
    city: "Chichawatni",
    province: "Punjab",
    distance: "44 km",
    open: true,
    fav: false,
  },
  {
    id: "bahawalpur",
    name: "Bahawalpur Mandi",
    city: "Bahawalpur",
    province: "Punjab",
    distance: "118 km",
    open: true,
    fav: false,
  },
  {
    id: "karachi",
    name: "Karachi Mandi",
    city: "Karachi",
    province: "Sindh",
    distance: "980 km",
    open: true,
    fav: false,
  },
  {
    id: "sukkur",
    name: "Sukkur Mandi",
    city: "Sukkur",
    province: "Sindh",
    distance: "540 km",
    open: true,
    fav: false,
  },
  {
    id: "hyderabad",
    name: "Hyderabad Mandi",
    city: "Hyderabad",
    province: "Sindh",
    distance: "860 km",
    open: true,
    fav: false,
  },
  {
    id: "peshawar",
    name: "Peshawar Mandi",
    city: "Peshawar",
    province: "KPK",
    distance: "420 km",
    open: true,
    fav: false,
  },
  {
    id: "quetta",
    name: "Quetta Mandi",
    city: "Quetta",
    province: "Balochistan",
    distance: "620 km",
    open: true,
    fav: false,
  },
  {
    id: "siranwali",
    name: "Siranwali Mandi",
    city: "Siranwali",
    province: "Punjab",
    distance: "180 km",
    open: true,
    fav: false,
  },
  {
    id: "sargodha",
    name: "Sargodha Mandi",
    city: "Sargodha",
    province: "Punjab",
    distance: "200 km",
    open: true,
    fav: false,
  },
  {
    id: "multan",
    name: "Multan Mandi",
    city: "Multan",
    province: "Punjab",
    distance: "95 km",
    open: false,
    fav: false,
  },
];
export type MandiItem = (typeof INITIAL_MANDIS)[0];

export const MANDI_ROWS: Record<string, any[]> = REAL_MANDI_ROWS;

// ─── HIGH PERFORMANCE PRE-INDEXED COMMODITY DATA (0ms Instant Lookups) ───
export const FLAT_ALL_MANDI_ROWS: RichRow[] = (() => {
  const list: RichRow[] = [];
  const entries = Object.entries(REAL_MANDI_ROWS);
  for (let i = 0; i < entries.length; i++) {
    const [mandiId, rows] = entries[i];
    const mandi = INITIAL_MANDIS.find((m) => m.id === mandiId);
    const mName = mandi?.name || rows[0]?.mandiName || mandiId;
    const mCity = mandi?.city || rows[0]?.mandiCity || mandiId;
    const mProv = mandi?.province || rows[0]?.province || "Punjab";
    for (let j = 0; j < rows.length; j++) {
      const r = rows[j];
      const vert = Object.entries(VERTICALS).find(([, vd]) => vd.products[r.product])?.[0] || "Grains";
      list.push(enrichRowWithAttrs({
        ...r,
        mandiName: mName,
        mandiCity: mCity,
        province: mProv,
        vertical: vert,
      }));
    }
  }
  return list;
})();

export const COMMODITY_ROWS_INDEX: Record<string, RichRow[]> = (() => {
  const index: Record<string, RichRow[]> = {};
  for (let i = 0; i < FLAT_ALL_MANDI_ROWS.length; i++) {
    const r = FLAT_ALL_MANDI_ROWS[i];
    const p = r.product.toLowerCase().trim();
    if (!index[p]) index[p] = [];
    index[p].push(r);
  }
  return index;
})();

export function getRowsForProducts(productNames: string[]): RichRow[] {
  if (!productNames || productNames.length === 0) return FLAT_ALL_MANDI_ROWS;
  const result: RichRow[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < productNames.length; i++) {
    const target = productNames[i];
    if (!target) continue;
    const targetNorm = target.toLowerCase().trim();
    for (const [prodKey, rows] of Object.entries(COMMODITY_ROWS_INDEX)) {
      if (isMatchProduct(prodKey, [targetNorm])) {
        if (!seen.has(prodKey)) {
          seen.add(prodKey);
          for (let j = 0; j < rows.length; j++) {
            result.push(rows[j]);
          }
        }
      }
    }
  }
  return result.length > 0 ? result : FLAT_ALL_MANDI_ROWS;
}
