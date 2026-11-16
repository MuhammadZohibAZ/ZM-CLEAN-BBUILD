import { type ProdDiv, type ProductGroupId, type ProductSel } from "../types";
import sheet from "./productSheet.json";

// The product list comes from data/Verticals-Products-ByProducts-Pricing.xlsx
// (generated into productSheet.json by data/build_product_sheet.py): verticals,
// products (each its own subscription, with its price) and their by-products,
// named by the data (api by_products) so rates load; display names are in
// sheet.names (see LangProvider tc).

type SheetProduct = { name: string; en: string; ur: string; group: ProductGroupId; division: string; price: number; byproducts: string[] };
type SheetGroup = { id: ProductGroupId; en: string; ur: string };
const SHEET = sheet as unknown as { groups: SheetGroup[]; products: SheetProduct[]; names: Record<string, { en: string; ur: string }> };

/** Sprite key for each group's vertical icon. */
const GROUP_ICON: Record<ProductGroupId, string> = {
  crops: "grains", vegetables: "vegetables", fruits: "fruits", "dry-fruits": "dry-fruits", herbs: "herbals",
  pulses: "grains", spices: "grains", "edible-oils": "grains", kiryana: "kiryana", "agri-inputs": "agri-inputs",
};

//  COMPLETE VERTICALS DATA: vertical (group) -> product -> by-products.
export const VERTICALS: Record<
  string,
  {
    icon: string;
    urdu: string;
    products: Record<string, string[]>;
  }
> = Object.fromEntries(
  SHEET.groups.map((g) => [
    g.en,
    {
      icon: GROUP_ICON[g.id] || "grains",
      urdu: g.ur,
      products: Object.fromEntries(SHEET.products.filter((p) => p.group === g.id).map((p) => [p.name, p.byproducts])),
    },
  ]),
);

/** Display names from the sheet (English / Urdu), keyed by the data's name. */
export const SHEET_NAMES: Record<string, { en: string; ur: string }> = SHEET.names;


export const SUBSCRIBED_PRODUCTS = new Set<string>([
  "Wheat", "Rice", "Cotton", "Maize", "Sugar", "Mustard", "Sesame",
  "Millet", "Paddy", "Dates",
]);

export const TODAY_ONLY_PRODUCTS = new Set<string>([]);

export function isProductSubscribed(name: string): boolean {
  return true; // Unlocked for 2-day Free Trial
}

export function isProductTodayOnly(name: string): boolean {
  return false;
}

export function isProductAccessible(name: string): boolean {
  return true; // All products accessible during Free Trial
}

export const PRODUCT_ID_TO_NAME: Record<string, string> = {
  wheat: "Wheat",
  rice: "Rice",
  cotton: "Cotton",
  maize: "Maize",
  sugar: "Sugar",
  sugarcane: "Sugar",
  pulses: "Pulses",
  mustard: "Mustard",
  sesame: "Sesame",
  millet: "Millet",
  paddy: "Paddy",
  dates: "Dates",
  spices: "Spices",
  dryfruit: "Dry Fruit",
  "dry fruit": "Dry Fruit",
  livemarket: "Live Market",
  "live market": "Live Market",
  fruits: "Fruits",
  fruit: "Fruits",
  vegetables: "Vegetable",
  vegetable: "Vegetable",
  fertilizer: "Fertilizer",
  fertilizers: "Fertilizer",
  edibleoil: "Edible Oil",
  "edible oil": "Edible Oil",
  kiryana: "Kiryana",
  herbs: "Herbs",
  herbals: "Herbs",
};

/** Every product's monthly price (the sheet gives each product its own; all are PKR 2,000 today). */
export const PRODUCT_PRICES: Record<string, number> = Object.fromEntries(SHEET.products.map((p) => [p.name, p.price]));
export const PRODUCT_PRICE_PER_MONTH = SHEET.products[0]?.price ?? 2000;
export const productPrice = (name: string) => PRODUCT_PRICES[name] ?? PRODUCT_PRICE_PER_MONTH;

/** How products are grouped in "View All" and the Complete Profile list (the sheet's verticals). */
export const PRODUCT_GROUPS: SheetGroup[] = SHEET.groups;

/**
 * Every product the app sells, each its own subscription, in Home / View All
 * order (by group, then the sheet's order). `division` is where its rates are in
 * the data.
 */
export const PRODUCT_DIVISIONS: ProdDiv[] = SHEET.products.map((p) => ({
  name: p.name,
  group: p.group,
  division: p.division,
  type: "product",
  byproducts: p.byproducts,
}));

/** A product sold out of a bigger data division (Potato in Vegetable, Canola in Edible Oil). */
/** Divisions more than one product draws from (Pulses: Pulses, Kidney Beans, Mung Bean, Moongi). */
const SHARED_DIVISIONS = new Set(
  PRODUCT_DIVISIONS.map((d) => d.division).filter((div, i, all) => all.indexOf(div) !== i),
);
/** A product that shows only its own by-products: sold out of a bigger or shared data division. */
export const isOpenedProduct = (d: ProdDiv) => d.division !== d.name || SHARED_DIVISIONS.has(d.division);

/** A product by its name (case-insensitive). */
export function findProduct(name?: string | null): ProdDiv | undefined {
  const k = (name || "").toLowerCase().trim();
  return PRODUCT_DIVISIONS.find((d) => d.name.toLowerCase() === k);
}

/** Divisions whose by-products belong to separately sold products: matched by exact name. */
export const OPENED_DIVISIONS = new Set(PRODUCT_DIVISIONS.filter(isOpenedProduct).map((d) => d.division));

/** The product a data by-product belongs to ("Vegetable" + "Potato (Laal)" → Potato), if any. */
export function productForByproduct(division: string, byproduct: string): ProdDiv | undefined {
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
  const b = norm(byproduct);
  return PRODUCT_DIVISIONS.find(
    (d) => d.division === division && (!isOpenedProduct(d) || (d.byproducts || []).some((x) => norm(x) === b)),
  );
}

export function getVerticalForProduct(productName: string): string {
  if (VERTICALS[productName]) return productName;
  if (productName === "Vegetable") return "Vegetables";
  if (productName === "Fruit") return "Fruits";
  if (productName === "Dry Fruit") return "Dry Fruits";
  if (productName === "Herbs" || productName === "Herb") return "Herbals";
  if (productName === "Grain") return "Grains";
  if (productName === "Kiryana") return "Grocery";
  if (/^(agri.?inputs?|fertili[sz]ers?|pesticides?)$/i.test(productName)) return "Agri-Inputs";
  return (
    Object.entries(VERTICALS).find(([, vd]) => vd.products[productName])?.[0] ||
    "Grains"
  );
}

/** What the by-product screen opens with for a product. */
export function getProductSelectionsForDivision(divName: string): ProductSel[] {
  const div = findProduct(divName);
  if (div?.type === "vertical" && div.products) {
    return Object.keys(div.products).map((pName) => ({ vertical: div.name, product: pName }));
  }
  if (div && isOpenedProduct(div)) return [{ vertical: div.division, product: div.name }];
  if (div) return [{ vertical: getVerticalForProduct(div.name), product: div.name }];
  const vert = VERTICALS[divName];
  if (vert && vert.products) {
    return Object.keys(vert.products).map((pName) => ({
      vertical: divName,
      product: pName,
    }));
  }
  const vName = getVerticalForProduct(divName);
  return [{ vertical: vName, product: divName }];
}

export function getDivisionForProduct(vertical?: string, product?: string): string {
  // A product the app sells knows its own division (Gram -> Pulses, Egg Tray -> Classification pending).
  const known = findProduct(product);
  if (known) return known.division;
  const DB_DIVISIONS = [
    "Wheat", "Maize", "Sesame", "Millet", "Cotton", "Paddy", "Rice",
    "Dates", "Mustard", "Spices", "Pulses", "Sugar", "Fertilizer",
    "Edible Oil", "Fruits", "Vegetable", "Dry Fruit", "Herbs", "Kiryana", "Classification pending"
  ];
  if (product && DB_DIVISIONS.includes(product)) return product;
  if (vertical && DB_DIVISIONS.includes(vertical)) return vertical;
  if (vertical === "Dry Fruits") return "Dry Fruit";
  if (vertical === "Vegetables") return "Vegetable";
  if (vertical === "Herbals") return "Herbs";
  if (vertical === "Agri Inputs" || vertical === "Agri-Inputs") return "Fertilizer";
  if (vertical === "Grocery") return "Kiryana";
  if (vertical === "Edible Oils") return "Edible Oil";
  if (vertical === "Grains" && product) return product;
  for (const div of PRODUCT_DIVISIONS) {
    if (div.products && product && div.products[product]) {
      return div.name;
    }
  }
  return product || vertical || "Wheat";
}
