import { type ProdDiv, type ProductSel } from "../types";

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
        "Fine Flour",
        "Flour",
        "Bran",
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
        "Cotton Grade A",
        "Cotton Grade B",
        "Cotton Grade C",
        "Cotton Seed",
        "Cotton Seed Oil",
        "Cotton Seed Cake",
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
      Mustard: ["Mustard Seed", "Mustard Oil", "Mustard Cake"],
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
      Soybean: ["Soybean Seed", "Soybean Oil", "Soybean Meal"],
    },
  },
  Fruits: {
    icon: "fruits",
    urdu: "پھل",
    products: {
      Mango: [
        "Mango Sindhri",
        "Mango White Chunsa",
        "Mango Black Chunsa",
        "Mango Anwer Ratul",
        "Mango Fajri",
        "Mango Dasheri",
        "Mango Almas",
        "Mango Saroli",
      ],
      Banana: ["Banana"],
      Citrus: [
        "Orange",
        "Musambi",
        "Grapefruit",
        "Mandarin",
        "Sweet Lime",
        "Fruiter",
      ],
      Melon: ["Watermelon", "Melon"],
      Apple: ["Apple Kala Kullu", "Apple", "Apple Golden"],
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
        "Potato (Red)",
        "Potato (White)",
        "Potato (Goli)",
        "Potato (Raveera)",
        "Potato (Seed)",
      ],
      Tomato: ["Tomato (Grade A)", "Tomato (Grade B)", "Tomato (Grade C)"],
      Onion: ["Onion (Grade A)", "Onion (Grade B)", "Onion (Grade C)"],
      Garlic: ["Garlic Desi", "Garlic Chinese", "Garlic G1", "Garlic Harnai"],
      Chilli: [
        "Desi Chilli",
        "Green Chilli - Small",
        "Green Chilli - Medium",
        "Green Chilli - Large",
        "Capsicum",
      ],
      Cauliflower: ["Cauliflower"],
      Cabbage: ["Cabbage"],
      Brinjal: ["Brinjal Round", "Brinjal Long"],
      Carrot: ["Carrot"],
      Spinach: ["Spinach"],
      Peas: ["Peas"],
      Guar: ["Guar"],
      Okra: ["Okra"],
      Cucumber: ["Cucumber"],
      Bitter_Gourd: ["Bitter Gourd"],
      Bottle_Gourd: ["Bottle Gourd", "Round Gourd"],
      Ridge_Gourd: ["Ridge Gourd"],
      Ginger: ["Ginger"],
      Lemon: ["Lemon Desi", "Lemon China"],
      Turnip: ["Turnip"],
      "Sweet Potato": ["Sweet Potato"],
      Broccoli: ["Broccoli"],
    },
  },
  Livestock: {
    icon: "livestock",
    urdu: "مویشی",
    products: {
      "Cattle Market": ["Cow", "Buffalo", "Goat", "Camel"],
      "Slaughter House": ["Cow", "Buffalo", "Goat"],
      Poultry: ["Broiler", "Layer"],
      Dairy: ["Milk", "Yogurt", "Butter"],
      Fisheries: ["Rohu", "Catla", "Tilapia"],
      Feed: [
        "Alfalfa",
        "Rhode Grass",
        "Corn Silage",
        "Wheat Bran",
        "Canola Meal",
        "Soybean Meal",
        "Mustard Seed Cake",
        "Cotton Seed Cake",
        "Wheat Straw",
      ],
    },
  },
  "Agri Inputs": {
    icon: "agri-inputs",
    urdu: "زرعی ان پٹس",
    products: {
      Fertilizer: [
        "Urea",
        "DAP",
        "NP",
        "NPK",
        "SOP-G",
        "SSP",
        "MOP",
        "Ammonium Nitrate",
        "Ammonium Sulphate",
        "TSP",
        "CAN",
        "Zabardast Urea",
        "Pak Arab Guara",
      ],
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
      Raisins: ["Dried Raisins"],
    },
  },
  Herbals: {
    icon: "herbals",
    urdu: "جڑی بوٹیاں",
    products: {
      "Black Seed": ["Kalonji", "Kalonji Oil", "Black Seed", "Black Seed Oil"],
      Psyllium: ["Ispaghol Husk", "Ispaghol", "Psyllium Seed", "Psyllium Husk"],
      Asafoetida: ["Hing", "Asafoetida"],
      Honey: ["Honey"],
      "Carom Seed": ["Ajwain", "Carom Seed"],
      "Basil Seed": ["Tukh Malanga", "Basil Seed"],
      "Chia Seed": ["Chia Seed"],
      Saffron: ["Zafran", "Saffron"],
      Fennel: ["Saunf", "Fennel"],
      "Dry Lemon": ["Dry Lemon"],
    },
  },
  Kiryana: {
    icon: "kiryana",
    urdu: "کریانہ",
    products: {
      Wheat: ["Wheat", "Fine Flour", "Flour", "Semolina", "Special Flour"],
      Rice: [
        "1121 Basmati-1",
        "1121 Basmati-2",
        "Irri 6",
        "Irri 9",
        "C-9 Basmati",
        "C-9 Steam",
        "Rice Polish",
        "Supri New",
        "1509 Steam",
        "1121 Steam",
      ],
      Maize: ["Maize Grade A"],
      Millet: ["Millet Grade A"],
      Sugar: ["Sugar", "Jaggery"],
      Mustard: ["Mustard Oil"],
      Pulses: [
        "Red Lentil",
        "Black Chickpea Large",
        "Kabuli Chickpea 7mm",
        "Split Green Gram Washed",
      ],
      Spices: [
        "Red Chilli",
        "White Cumin",
        "Turmeric",
        "Black Pepper",
        "Coriander Seed",
        "Cinnamon",
        "Clove",
      ],
      Eggs: ["Eggs"],
    },
  },
};

export const SUBSCRIBED_PRODUCTS = new Set<string>([
  "Wheat", "Rice", "Cotton", "Maize", "Sugar", "Pulses", "Mustard", "Sesame",
  "Millet", "Paddy", "Dates", "Spices", "Dry Fruit", "Live Market", "Fruits",
  "Vegetable", "Livestock", "Fertilizer", "Edible Oil", "Kiryana", "Herbs"
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
  livestock: "Livestock",
  fertilizer: "Fertilizer",
  fertilizers: "Fertilizer",
  edibleoil: "Edible Oil",
  "edible oil": "Edible Oil",
  kiryana: "Kiryana",
  herbs: "Herbs",
  herbals: "Herbs",
};

export const PRODUCT_DIVISIONS: ProdDiv[] = [
  {
    name: "Wheat",
    type: "product",
    byproducts: VERTICALS.Grains.products.Wheat,
  },
  {
    name: "Maize",
    type: "product",
    byproducts: VERTICALS.Grains.products.Maize,
  },
  {
    name: "Sesame",
    type: "product",
    byproducts: VERTICALS.Grains.products.Sesame,
  },
  {
    name: "Millet",
    type: "product",
    byproducts: VERTICALS.Grains.products.Millet,
  },
  {
    name: "Cotton",
    type: "product",
    byproducts: VERTICALS.Grains.products.Cotton,
  },
  {
    name: "Paddy",
    type: "product",
    byproducts: VERTICALS.Grains.products.Paddy,
  },
  {
    name: "Rice",
    type: "product",
    byproducts: VERTICALS.Grains.products.Rice,
  },
  {
    name: "Edible Oil",
    type: "vertical",
    products: {
      Canola: VERTICALS.Grains.products.Canola,
      Soybean: VERTICALS.Grains.products.Soybean,
      Sunflower: VERTICALS.Grains.products.Sunflower,
      Arugula: ["Arugula Seed", "Arugula Oil"],
      Castor: ["Castor Bean", "Castor Oil"],
    },
  },
  {
    name: "Fertilizer",
    type: "product",
    byproducts: VERTICALS["Agri Inputs"].products.Fertilizer,
  },
  {
    name: "Livestock",
    type: "vertical",
    products: VERTICALS.Livestock.products,
  },
  {
    name: "Dates",
    type: "product",
    byproducts: VERTICALS.Grains.products.Dates,
  },
  {
    name: "Mustard",
    type: "product",
    byproducts: VERTICALS.Grains.products.Mustard,
  },
  {
    name: "Spices",
    type: "product",
    byproducts: VERTICALS.Grains.products.Spices,
  },
  {
    name: "Pulses",
    type: "product",
    byproducts: VERTICALS.Grains.products.Pulses,
  },
  {
    name: "Kiryana",
    type: "vertical",
    products: VERTICALS.Kiryana.products,
  },
  {
    name: "Sugar",
    type: "product",
    byproducts: VERTICALS.Grains.products.Sugar,
  },
  { name: "Fruits", type: "vertical", products: VERTICALS.Fruits.products },
  {
    name: "Vegetable",
    type: "vertical",
    products: VERTICALS.Vegetables.products,
  },
  {
    name: "Dry Fruit",
    type: "vertical",
    products: VERTICALS["Dry Fruits"].products,
  },
  { name: "Herbs", type: "vertical", products: VERTICALS.Herbals.products },
];

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

export function getProductSelectionsForDivision(divName: string): ProductSel[] {
  const div = PRODUCT_DIVISIONS.find(
    (d) => d.name === divName || d.name.toLowerCase() === divName.toLowerCase()
  );
  if (div) {
    if (div.type === "vertical" && div.products) {
      return Object.keys(div.products).map((pName) => ({
        vertical: div.name,
        product: pName,
      }));
    }
    const vName = getVerticalForProduct(div.name);
    return [{ vertical: vName, product: div.name }];
  }
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
    "Edible Oil", "Fruits", "Vegetable", "Dry Fruit", "Herbs", "Livestock", "Kiryana"
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
