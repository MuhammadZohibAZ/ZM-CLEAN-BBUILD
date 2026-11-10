import { type ProdDiv, type ProductGroupId, type ProductSel } from "../types";
import { FERTILIZER_TYPES } from "./fertilizer";

//  COMPLETE VERTICALS DATA

export const VERTICALS: Record<
  string,
  {
    icon: string;
    urdu: string;
    products: Record<string, string[]>;
  }
> = {
  Grains: {
    icon: "grains",
    urdu: "اناج",
    products: {
      Wheat: [
        "Wheat",
        "Maida",
        "Flour",
        "Wheat Bran",
        "Semolina",
        "Straw",
        "Sorghum",
        "Barley",
        "Oat",
        "Special Flour",
      ],
      Rice: [
        "1121 Basmati-1",
        "1121 Basmati-2",
        "1509 Steam",
        "1509 Sella",
        "386 Basmati-New",
        "386 Basmati-Old",
        "Irri 6",
        "Irri 9",
        "Super Basmati",
        "Sella 1121-1",
        "C-9 Basmati",
        "C-9 Steam",
        "C-9 White",
        "Rice Polish",
        "Broken Irri 6",
        "Rice Husk",
        "Super Kernel",
        "Punia Basmati-1",
        "Punia 1121-1",
        "Supri New",
        "Supri Old",
        "1121 Steam",
        "1509 White",
        "PP-7",
      ],
      Paddy: [
        "Paddy Irri 6",
        "Paddy Irri 9",
        "Paddy 1509",
        "Paddy Kainat-1121",
        "Paddy Super 515",
        "Paddy 386",
        "Paddy 1847",
        "Paddy C-9",
        "Paddy Super",
        "Paddy PP-7",
        "Paddy Diamond",
      ],
      Maize: [
        "Maize Grade A",
        "Maize Grade B",
        "Maize Grade C",
        "Corn Silage",
        "Popcorn",
      ],
      Cotton: [
        "Phutti Grade A",
        "Phutti Grade B",
        "Phutti Grade C",
        "Banola",
        "Banola Oil",
        "Banola Khal",
        "Lint Cotton",
      ],
      Sugar: [
        "Sugarcane",
        "Sugar (Mill)",
        "Sugar (Wholesale)",
        "Jaggery",
        "Brown Sugar",
        "Sugar (Retail)",
      ],
      Mustard: ["Sarson Seed", "Sarson Oil", "Sarson Khal"],
      Canola: ["Canola Seed", "Canola Oil", "Canola Meal"],
      Sunflower: ["Sunflower Seed", "Sunflower Oil", "Sunflower Meal"],
      Millet: ["Millet Grade A", "Millet Grade B", "Millet Grade C"],
      Pulses: [
        "Red Lentil",
        "Whole Red Lentil Large",
        "Whole Red Lentil Small",
        "Black Chickpea Large",
        "Black Chickpea Small",
        "Split Chickpea Large",
        "Kabuli Chickpea 7mm",
        "Kabuli Chickpea 9mm",
        "Whole Green Gram Large",
        "Split Green Gram Washed",
        "Whole Black Gram Small",
        "Pigeon Pea Large",
        "Red Kidney Bean Large",
        "White Kidney Bean Large",
      ],
      Sesame: ["Sesame Grade A", "Sesame Grade B", "Sesame Grade C"],
      Spices: [
        "Red Chilli",
        "Red Chilli Powder",
        "Coriander Seed",
        "Coriander Seed Powder",
        "White Cumin",
        "Black Cumin",
        "Turmeric",
        "Black Pepper",
        "Black Pepper Powder",
        "Fennel",
        "Cinnamon",
        "Clove",
        "Small Cardamom",
        "Large Black Cardamom",
        "Longi Chilli",
        "Hybrid Chilli",
      ],
      Dates: [
        "Ajwa Dates",
        "Aseel Dates",
        "Mazafati Dates",
        "Rabbi Dates",
        "Amber Dates",
        "Begum Jangi Dates",
        "Aseel Dry Dates",
        "Dhaki Dry Dates",
      ],
      Soybean: ["Soyabean Seed", "Soyabean Oil", "Soyabean Meal"],
    },
  },
  // Fruits, Vegetables, Dry Fruits, Herbals and Kiryana: every product below is
  // sold on its own (see PRODUCT_DIVISIONS). The by-product names are the data's
  // own (api by_products), matched exactly, so "Apple" never picks up "Pineapple".
  Fruits: {
    icon: "fruits",
    urdu: "پھل",
    products: {
      Mango: [
        "Mango Sindhri",
        "Mango White Chausa",
        "Mango Black Chausa",
        "Mango Anwar Ratol",
        "Mango Fajri",
        "Mango Daseri",
        "Mango Almas",
        "Mango Saroli",
        "Mango Langra",
        "Mango Surmai",
      ],
      Banana: ["Banana"],
      Citrus: ["Orange", "Mausambi", "Grapefruit", "Mandrin Orange", "Sweet Lime", "Fruiter"],
      Melon: ["Watermelon", "Kharbooza"],
      Apple: ["Apple", "Kala Kullu Apple"],
      Pomegranate: ["Pomegranate"],
      Grapes: ["Grapes"],
      Peach: ["Peach"],
      Apricot: ["Apricot"],
      Papaya: ["Papaya"],
      Cherry: ["Cherry"],
      Plum: ["Plum"],
      Falsa: ["Falsa"],
    },
  },
  Vegetables: {
    icon: "vegetables",
    urdu: "سبزیاں",
    products: {
      Potato: [
        "Potato (Mozika)",
        "Potato (Santa)",
        "Potato (Laal)",
        "Potato (Sufaid)",
        "Potato (Goli)",
        "Potato (Raveera)",
        "Potato (Beej)",
        "Potato (Lr)",
        "Potato (Stone)",
      ],
      Tomato: ["Tomato (Grade A)", "Tomato (Grade B)", "Tomato Grade C"],
      Onion: ["Onion - Grade A", "Onion - Grade B", "Onion - Grade C"],
      Garlic: ["Desi Garlic", "Garlic China", "Garlic G1", "Galic Harni"],
      Chilli: [
        "Desi Chilli",
        "Red Desi Chilli",
        "Green Chilli - Small",
        "Green Chilli - Medium",
        "Green Chilli - Large",
        "Hybird Chilli",
        "Longi Chilli",
        "Rich Star Chilli",
        "Shingri Chilli",
      ],
      Capsicum: ["Capsicum"],
      Cauliflower: ["Cauliflower"],
      Cabbage: ["Cabbage"],
      Brinjal: ["Gol Brinjal", "Long Brinjal"],
      Carrot: ["Carrot", "Chinese Carrot"],
      Spinach: ["Spinach"],
      Peas: ["Pea"],
      Guar: ["Guar"],
      Okra: ["Okra"],
      Cucumber: ["Cucumber"],
      "Bitter Gourd": ["Bitter Gourd"],
      "Bottle Gourd": ["Bottle Gourd", "Round Gourd"],
      "Ridge Gourd": ["Ridge Gourd"],
      Ginger: ["Ginger"],
      Lemon: ["Desi Lemon", "Lemon China"],
      Turnip: ["Turnip"],
      "Sweet Potato": ["Sweet Potato"],
      Broccoli: ["Broccoli"],
      "Salad Leaf": ["Salad Leaf"],
    },
  },
  "Agri Inputs": {
    icon: "agri-inputs",
    urdu: "زرعی ان پٹس",
    products: {
      // Fertilizer types (Urea, DAP, ...), each with its brand products (see fertilizer.ts).
      ...FERTILIZER_TYPES,
      Pesticide: [
        "Chlorphenapyr 36% SC",
        "Clothianidin 20% EC",
        "Mesotrione + Atrazine 50% WP",
        "Mesotrione + Atrazine 55% WP",
      ],
      Weedicide: [
        "S-Metolachlor 960EC 800ML",
        "Glyphosate",
        "Mesotrione + Atrazine 50% WP",
      ],
    },
  },
  "Dry Fruits": {
    icon: "dry-fruits",
    urdu: "خشک میوہ",
    products: {
      Almonds: ["Almond (American)", "Almond (Australian)", "Almond (Desi)"],
      Cashew: ["Cashew"],
      Walnut: ["Walnut"],
      Fig: ["Fig"],
      Pistachio: ["Pistachio"],
      Raisins: ["Large Raisins"],
    },
  },
  Herbals: {
    icon: "herbals",
    urdu: "جڑی بوٹیاں",
    products: {
      "Black Seed": ["Kalonji", "Kalonji Oil"],
      Psyllium: ["Ispaghol", "Ispaghol Husk"],
      Asafoetida: ["Hing"],
      "Basil Seed": ["Tukh Malanga"],
      "Chia Seed": ["Chia Seed"],
      Saffron: ["Zafran"],
      "Dry Lemon": ["Dry Lemon"],
      Salep: ["Salab Misri", "Saleb Panja"],
    },
  },
  Kiryana: {
    icon: "kiryana",
    urdu: "کریانہ",
    products: {
      Ghee: ["Asia ghee", "Dalda ghee", "Kashmir ghee", "Khyber ghee", "Sufi Ghee"],
    },
  },
};

export const SUBSCRIBED_PRODUCTS = new Set<string>([
  "Wheat", "Rice", "Cotton", "Maize", "Sugar", "Pulses", "Mustard", "Sesame",
  "Millet", "Paddy", "Dates", "Spices", "Edible Oil",
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

/** Every product costs the same per month (one price, no vertical bundles). */
export const PRODUCT_PRICE_PER_MONTH = 2000;

/** How products are grouped in "View All" and the Complete Profile list. */
export const PRODUCT_GROUPS: { id: ProductGroupId; en: string; ur: string }[] = [
  { id: "crops", en: "Crops", ur: "فصلیں" },
  { id: "fertilizer", en: "Fertilizer", ur: "کھاد" },
  { id: "fruits", en: "Fruits", ur: "پھل" },
  { id: "vegetables", en: "Vegetables", ur: "سبزیاں" },
  { id: "dry-fruits", en: "Dry Fruits", ur: "خشک میوہ" },
  { id: "herbs", en: "Herbs", ur: "جڑی بوٹیاں" },
  { id: "kiryana", en: "Kiryana", ur: "کریانہ" },
];

const crop = (name: string, byproducts: string[]): ProdDiv => ({ name, group: "crops", division: name, type: "product", byproducts });
/** The products of a data division that is sold product by product (Fruits → Mango, Banana, ...). */
const opened = (group: ProductGroupId, division: string, products: Record<string, string[]>): ProdDiv[] =>
  Object.entries(products).map(([name, byproducts]) => ({ name, group, division, type: "product", byproducts }));

/**
 * Every product the app sells, each on its own at PRODUCT_PRICE_PER_MONTH, in
 * Home / View All order. `division` is where its rates are in the data. Edible
 * Oil is one product that opens with its oils as tabs.
 */
export const PRODUCT_DIVISIONS: ProdDiv[] = [
  crop("Wheat", VERTICALS.Grains.products.Wheat),
  crop("Rice", VERTICALS.Grains.products.Rice),
  crop("Paddy", VERTICALS.Grains.products.Paddy),
  crop("Maize", VERTICALS.Grains.products.Maize),
  crop("Cotton", VERTICALS.Grains.products.Cotton),
  crop("Sugar", VERTICALS.Grains.products.Sugar),
  crop("Pulses", VERTICALS.Grains.products.Pulses),
  crop("Mustard", VERTICALS.Grains.products.Mustard),
  crop("Sesame", VERTICALS.Grains.products.Sesame),
  crop("Millet", VERTICALS.Grains.products.Millet),
  crop("Spices", VERTICALS.Grains.products.Spices),
  crop("Dates", VERTICALS.Grains.products.Dates),
  {
    name: "Edible Oil",
    group: "crops",
    division: "Edible Oil",
    type: "vertical",
    products: {
      Canola: VERTICALS.Grains.products.Canola,
      Soybean: VERTICALS.Grains.products.Soybean,
      Sunflower: VERTICALS.Grains.products.Sunflower,
      Arugula: ["Arugula Seed", "Arugula Oil"],
      Castor: ["Castor Bean", "Castor Oil"],
    },
  },
  ...opened("fertilizer", "Fertilizer", FERTILIZER_TYPES),
  ...opened("fruits", "Fruits", VERTICALS.Fruits.products),
  ...opened("vegetables", "Vegetable", VERTICALS.Vegetables.products),
  ...opened("dry-fruits", "Dry Fruit", VERTICALS["Dry Fruits"].products),
  ...opened("herbs", "Herbs", VERTICALS.Herbals.products),
  ...opened("kiryana", "Kiryana", VERTICALS.Kiryana.products),
];

/** A product by its name (case-insensitive). */
export function findProduct(name?: string | null): ProdDiv | undefined {
  const k = (name || "").toLowerCase().trim();
  return PRODUCT_DIVISIONS.find((d) => d.name.toLowerCase() === k);
}

/** Divisions whose by-products belong to separately sold products: matched by exact name. */
export const OPENED_DIVISIONS = new Set(PRODUCT_DIVISIONS.filter((d) => d.group !== "crops").map((d) => d.division));

/** The product a data by-product belongs to ("Vegetable" + "Potato (Laal)" → Potato), if any. */
export function productForByproduct(division: string, byproduct: string): ProdDiv | undefined {
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
  const b = norm(byproduct);
  return PRODUCT_DIVISIONS.find(
    (d) => d.division === division && (d.group === "crops" || (d.byproducts || []).some((x) => norm(x) === b)),
  );
}

export function getVerticalForProduct(productName: string): string {
  if (VERTICALS[productName]) return productName;
  if (productName === "Vegetable") return "Vegetables";
  if (productName === "Fruit") return "Fruits";
  if (productName === "Dry Fruit") return "Dry Fruits";
  if (productName === "Herbs" || productName === "Herb") return "Herbals";
  if (productName === "Grain") return "Grains";
  return (
    Object.entries(VERTICALS).find(([, vd]) => vd.products[productName])?.[0] ||
    "Grains"
  );
}

/** What the by-product screen opens with for a product (Edible Oil: one tab per oil). */
export function getProductSelectionsForDivision(divName: string): ProductSel[] {
  const div = findProduct(divName);
  if (div?.type === "vertical" && div.products) {
    return Object.keys(div.products).map((pName) => ({ vertical: div.name, product: pName }));
  }
  if (div && div.group !== "crops") return [{ vertical: div.division, product: div.name }];
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
  const DB_DIVISIONS = [
    "Wheat", "Maize", "Sesame", "Millet", "Cotton", "Paddy", "Rice",
    "Dates", "Mustard", "Spices", "Pulses", "Sugar", "Fertilizer",
    "Edible Oil", "Fruits", "Vegetable", "Dry Fruit", "Herbs", "Kiryana"
  ];
  if (product && DB_DIVISIONS.includes(product)) return product;
  if (vertical && DB_DIVISIONS.includes(vertical)) return vertical;
  if (vertical === "Dry Fruits") return "Dry Fruit";
  if (vertical === "Vegetables") return "Vegetable";
  if (vertical === "Herbals") return "Herbs";
  if (vertical === "Agri Inputs") return "Fertilizer";
  if (vertical === "Grains" && product) return product;
  for (const div of PRODUCT_DIVISIONS) {
    if (div.products && product && div.products[product]) {
      return div.name;
    }
  }
  return product || vertical || "Wheat";
}
