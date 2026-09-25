import { VERTICALS } from "./catalog";

//  CORRECTED IMAGE PATHS
// These match the actual Figma/project file structure:
//   src/icons/products/wheat200.png
//   src/icons/by-products/cotton/Cotton-A.png

export const PRODUCTS_PATH = "/src/icons/products";
export const BYPRODUCTS_PATH = "/src/icons/by-products";

export const HOME_ICONS = {
  products: "/src/icons/products.png",
  liveMarket: "/src/icons/liveMarket.png",
  mandi: "/src/icons/mandi.png",
  homeHeader: "/src/icons/farm.png",
};

export const ICON_PATHS: Record<string, string> = {
  //  Vertical / product-level icons
  grains: `${PRODUCTS_PATH}/wheat200.png`,
  Grains: `${PRODUCTS_PATH}/wheat200.png`,
  fruits: `${PRODUCTS_PATH}/fruits200.png`,
  Fruits: `${PRODUCTS_PATH}/fruits200.png`,
  Fruit: `${PRODUCTS_PATH}/fruits200.png`,
  fruit: `${PRODUCTS_PATH}/fruits200.png`,
  vegetables: `${PRODUCTS_PATH}/vegetables200.png`,
  Vegetables: `${PRODUCTS_PATH}/vegetables200.png`,
  vegetable: `${PRODUCTS_PATH}/vegetables200.png`,
  Vegetable: `${PRODUCTS_PATH}/vegetables200.png`,
  livestock: `${PRODUCTS_PATH}/livestock200.png`,
  Livestock: `${PRODUCTS_PATH}/livestock200.png`,
  livesyock: `${PRODUCTS_PATH}/livestock200.png`,
  Livesyock: `${PRODUCTS_PATH}/livestock200.png`,
  liveestock: `${PRODUCTS_PATH}/livestock200.png`,
  Liveestock: `${PRODUCTS_PATH}/livestock200.png`,
  liveestockk: `${PRODUCTS_PATH}/livestock200.png`,
  "agri-inputs": `${PRODUCTS_PATH}/fertilizers.png`,
  "Agri Inputs": `${PRODUCTS_PATH}/fertilizers.png`,
  "dry-fruits": `${PRODUCTS_PATH}/dryfruits200.png`,
  "Dry Fruits": `${PRODUCTS_PATH}/dryfruits200.png`,
  "Dry-Fruits": `${PRODUCTS_PATH}/dryfruits200.png`,
  dryfruits: `${PRODUCTS_PATH}/dryfruits200.png`,
  dryfruit: `${PRODUCTS_PATH}/dryfruits200.png`,
  "dry fruit": `${PRODUCTS_PATH}/dryfruits200.png`,
  "Dry Fruit": `${PRODUCTS_PATH}/dryfruits200.png`,
  DryFruits: `${PRODUCTS_PATH}/dryfruits200.png`,
  DryFruit: `${PRODUCTS_PATH}/dryfruits200.png`,
  herbals: `${PRODUCTS_PATH}/herbals200.png`,
  Herbals: `${PRODUCTS_PATH}/herbals200.png`,
  herbal: `${PRODUCTS_PATH}/herbals200.png`,
  Herbal: `${PRODUCTS_PATH}/herbals200.png`,
  herbs: `${PRODUCTS_PATH}/herbals200.png`,
  Herbs: `${PRODUCTS_PATH}/herbals200.png`,
  herb: `${PRODUCTS_PATH}/herbals200.png`,
  Herb: `${PRODUCTS_PATH}/herbals200.png`,
  kiryana: `${PRODUCTS_PATH}/kiryana200.png`,
  Kiryana: `${PRODUCTS_PATH}/kiryana200.png`,
  wheat: `${PRODUCTS_PATH}/wheat200.png`,
  rice: `${PRODUCTS_PATH}/rice200.png`,
  paddy: `${PRODUCTS_PATH}/paddy200.png`,
  maize: `${PRODUCTS_PATH}/maize200.png`,
  cotton: `${PRODUCTS_PATH}/cotton200.png`,
  sugar: `${PRODUCTS_PATH}/sugar200.png`,
  mustard: `${PRODUCTS_PATH}/mustard200.png`,
  canola: `${PRODUCTS_PATH}/edible200.png`,
  sunflower: `${PRODUCTS_PATH}/edible200.png`,
  millet: `${PRODUCTS_PATH}/millet200.png`,
  sesame: `${PRODUCTS_PATH}/sesame200.png`,
  pulses: `${PRODUCTS_PATH}/pulses200.png`,
  spices: `${PRODUCTS_PATH}/spices200.png`,
  mango: `${PRODUCTS_PATH}/fruits200.png`,
  banana: `${PRODUCTS_PATH}/fruits200.png`,
  citrus: `${PRODUCTS_PATH}/fruits200.png`,
  melon: `${PRODUCTS_PATH}/fruits200.png`,
  apple: `${PRODUCTS_PATH}/fruits200.png`,
  pomegranate: `${PRODUCTS_PATH}/fruits200.png`,
  grape: `${PRODUCTS_PATH}/fruits200.png`,
  peach: `${PRODUCTS_PATH}/fruits200.png`,
  apricot: `${PRODUCTS_PATH}/fruits200.png`,
  papaya: `${PRODUCTS_PATH}/fruits200.png`,
  cherry: `${PRODUCTS_PATH}/fruits200.png`,
  plum: `${PRODUCTS_PATH}/fruits200.png`,
  falsa: `${PRODUCTS_PATH}/fruits200.png`,
  potato: `${PRODUCTS_PATH}/vegetables200.png`,
  tomato: `${PRODUCTS_PATH}/vegetables200.png`,
  onion: `${PRODUCTS_PATH}/vegetables200.png`,
  garlic: `${PRODUCTS_PATH}/vegetables200.png`,
  chilli: `${PRODUCTS_PATH}/chillies200.png`,
  brinjal: `${PRODUCTS_PATH}/vegetables200.png`,
  guar: `${PRODUCTS_PATH}/vegetables200.png`,
  lemon: `${PRODUCTS_PATH}/vegetables200.png`,
  "bitter-gourd": `${PRODUCTS_PATH}/vegetables200.png`,
  gourd: `${PRODUCTS_PATH}/vegetables200.png`,
  ginger: `${PRODUCTS_PATH}/vegetables200.png`,
  "sweet-potato": `${PRODUCTS_PATH}/vegetables200.png`,
  "salad-leaves": `${PRODUCTS_PATH}/vegetables200.png`,
  "cattle-market": `${PRODUCTS_PATH}/livestock200.png`,
  "slaughter-house": `${PRODUCTS_PATH}/livestock200.png`,
  slaughter: `${PRODUCTS_PATH}/livestock200.png`,
  poultry: `${PRODUCTS_PATH}/livestock200.png`,
  dairy: `${PRODUCTS_PATH}/livestock200.png`,
  fisheries: `${PRODUCTS_PATH}/livestock200.png`,
  feed: `${PRODUCTS_PATH}/livestock200.png`,
  cattle: `${PRODUCTS_PATH}/livestock200.png`,
  buffalo: `${PRODUCTS_PATH}/livestock200.png`,
  goat: `${PRODUCTS_PATH}/livestock200.png`,
  camel: `${PRODUCTS_PATH}/livestock200.png`,
  chicken: `${PRODUCTS_PATH}/livestock200.png`,
  milk: `${PRODUCTS_PATH}/livestock200.png`,
  eggs: `${PRODUCTS_PATH}/livestock200.png`,
  alfalfa: `${PRODUCTS_PATH}/livestock200.png`,
  "rhode-grass": `${PRODUCTS_PATH}/livestock200.png`,
  fertilizer: `${PRODUCTS_PATH}/fertilizers.png`,
  pesticide: `${PRODUCTS_PATH}/fertilizers.png`,
  herbicide: `${PRODUCTS_PATH}/fertilizers.png`,
  weedicide: `${PRODUCTS_PATH}/fertilizers.png`,
  almond: `${PRODUCTS_PATH}/dryfruits200.png`,
  almonds: `${PRODUCTS_PATH}/dryfruits200.png`,
  Almonds: `${PRODUCTS_PATH}/dryfruits200.png`,
  cashew: `${PRODUCTS_PATH}/dryfruits200.png`,
  walnut: `${PRODUCTS_PATH}/dryfruits200.png`,
  fig: `${PRODUCTS_PATH}/dryfruits200.png`,
  pistachio: `${PRODUCTS_PATH}/dryfruits200.png`,
  raisin: `${PRODUCTS_PATH}/dryfruits200.png`,
  raisins: `${PRODUCTS_PATH}/dryfruits200.png`,
  Raisins: `${PRODUCTS_PATH}/dryfruits200.png`,
  honey: `${PRODUCTS_PATH}/herbals200.png`,
  Honey: `${PRODUCTS_PATH}/herbals200.png`,
  psyllium: `${PRODUCTS_PATH}/herbals200.png`,
  Psyllium: `${PRODUCTS_PATH}/herbals200.png`,
  "black-seed": `${PRODUCTS_PATH}/herbals200.png`,
  "Black Seed": `${PRODUCTS_PATH}/herbals200.png`,
  "basil-seed": `${PRODUCTS_PATH}/herbals200.png`,
  "Basil Seed": `${PRODUCTS_PATH}/herbals200.png`,
  "chia-seed": `${PRODUCTS_PATH}/herbals200.png`,
  "Chia Seed": `${PRODUCTS_PATH}/herbals200.png`,
  saffron: `${PRODUCTS_PATH}/herbals200.png`,
  Saffron: `${PRODUCTS_PATH}/herbals200.png`,
  asafoetida: `${PRODUCTS_PATH}/herbals200.png`,
  Asafoetida: `${PRODUCTS_PATH}/herbals200.png`,
  "corom-seed": `${PRODUCTS_PATH}/herbals200.png`,
  "carom-seed": `${PRODUCTS_PATH}/herbals200.png`,
  "Carom Seed": `${PRODUCTS_PATH}/herbals200.png`,
  "dry-lemon": `${PRODUCTS_PATH}/herbals200.png`,
  "Dry Lemon": `${PRODUCTS_PATH}/herbals200.png`,
  arugula: `${PRODUCTS_PATH}/edible200.png`,
  castor: `${PRODUCTS_PATH}/edible200.png`,
  soybean: `${PRODUCTS_PATH}/edible200.png`,
  Plum: `${PRODUCTS_PATH}/fruits200.png`,
  Grapes: `${PRODUCTS_PATH}/fruits200.png`,
  seed: `${PRODUCTS_PATH}/wheat200.png`,
  "2": `${PRODUCTS_PATH}/wheat200.png`,

  //  By-product icons – Cotton
  "Cotton-A": `${BYPRODUCTS_PATH}/cotton/Cotton-A.png`,
  "Cotton-B": `${BYPRODUCTS_PATH}/cotton/Cotton-B.png`,
  "Cotton-C": `${BYPRODUCTS_PATH}/cotton/Cotton-C.png`,
  "Cotton-Seed": `${BYPRODUCTS_PATH}/cotton/Cotton-Seed.png`,
  "Cotton-Seed-Oil": `${BYPRODUCTS_PATH}/cotton/Cotton-Seed-Oil.png`,
  "Cotton-Seed-Cake": `${BYPRODUCTS_PATH}/cotton/Cotton-Seed-Cake.png`,
  "Lint-Cotton": `${BYPRODUCTS_PATH}/cotton/Lint-Cotton.png`,

  //  By-product icons – Sesame
  "Sesame-A": `${BYPRODUCTS_PATH}/sesame/Sesame-A.png`,
  "Sesame-B": `${BYPRODUCTS_PATH}/sesame/Sesame-B.png`,
  "Sesame-C": `${BYPRODUCTS_PATH}/sesame/Sesame-C.png`,
  "Sesame-Oil": `${BYPRODUCTS_PATH}/sesame/Sesame-Oil.png`,
  "Sesame": `${BYPRODUCTS_PATH}/sesame/Sesame.png`,

  //  By-product icons – Wheat
  Bran: `${BYPRODUCTS_PATH}/wheat/Bran.png`,
  "Wheat-Bran": `${BYPRODUCTS_PATH}/wheat/Bran.png`,
  "Wheat Bran": `${BYPRODUCTS_PATH}/wheat/Bran.png`,
  "Fine-Flour": `${BYPRODUCTS_PATH}/wheat/Fine-Flour.png`,
  "Refined-Flour": `${BYPRODUCTS_PATH}/wheat/Fine-Flour.png`,
  "Fine Flour": `${BYPRODUCTS_PATH}/wheat/Fine-Flour.png`,
  "Refined Flour": `${BYPRODUCTS_PATH}/wheat/Fine-Flour.png`,
  Maida: `${BYPRODUCTS_PATH}/wheat/Fine-Flour.png`,
  Flour: `${BYPRODUCTS_PATH}/wheat/Flour.png`,
  Atta: `${BYPRODUCTS_PATH}/wheat/Flour.png`,
  Semolina: `${BYPRODUCTS_PATH}/wheat/Semolina.png`,
  Sooji: `${BYPRODUCTS_PATH}/wheat/Semolina.png`,
  Suji: `${BYPRODUCTS_PATH}/wheat/Semolina.png`,
  Straw: `${BYPRODUCTS_PATH}/wheat/Straw.png`,
  "Wheat-Straw": `${BYPRODUCTS_PATH}/wheat/Straw.png`,
  "Wheat Straw": `${BYPRODUCTS_PATH}/wheat/Straw.png`,
  Sorghum: `${BYPRODUCTS_PATH}/wheat/Sorghum.png`,
  Barley: `${BYPRODUCTS_PATH}/wheat/Barley.png`,
  Oat: `${BYPRODUCTS_PATH}/wheat/Oat.png`,
  "Special-Flour": `${BYPRODUCTS_PATH}/wheat/Special-Flour.png`,
  "Flour-Special": `${BYPRODUCTS_PATH}/wheat/Special-Flour.png`,
  "Special Flour": `${BYPRODUCTS_PATH}/wheat/Special-Flour.png`,
  "Flour Special": `${BYPRODUCTS_PATH}/wheat/Special-Flour.png`,
  Wheat: `${BYPRODUCTS_PATH}/wheat/Wheat.png`,

  //  By-product icons – Maize
  "Corn-Silage": `${BYPRODUCTS_PATH}/maize/Corn-Silage.png`,
  Popcorn: `${BYPRODUCTS_PATH}/maize/Popcorn.png`,
  "Maize-A": `${BYPRODUCTS_PATH}/maize/Maize-A.png`,
  "Maize-B": `${BYPRODUCTS_PATH}/maize/Maize-B.png`,
  "Maize-C": `${BYPRODUCTS_PATH}/maize/Maize-C.png`,
  "Maize-D": `${BYPRODUCTS_PATH}/maize/Maize-D.png`,
  "Corn-Starch": `${BYPRODUCTS_PATH}/maize/Corn-Starch.png`,
  "Popcorn-2": `${BYPRODUCTS_PATH}/maize/Popcorn.png`,

  //  By-product icons – Sugar
  Sugarcane: `${BYPRODUCTS_PATH}/sugar/Sugarcane.png`,
  Jaggery: `${BYPRODUCTS_PATH}/sugar/Jaggery.png`,
  "Brown-Sugar": `${BYPRODUCTS_PATH}/sugar/Brown-Sugar.png`,
  Sugar: `${BYPRODUCTS_PATH}/sugar/Sugar.png`,

  //  By-product icons – Mustard
  "Mustard-Seed": `${BYPRODUCTS_PATH}/mustard/Mustard-Seed.png`,
  "Mustard-Oil": `${BYPRODUCTS_PATH}/mustard/Mustard-Oil.png`,
  "Mustard-Cake": `${BYPRODUCTS_PATH}/mustard/Mustard-Cake.png`,

  //  By-product icons – Edible Oils (folder = edibleoils, no space)
  "Canola-Seed": `${BYPRODUCTS_PATH}/edibleoils/Canola-Seed.png`,
  "Canola-Oil": `${BYPRODUCTS_PATH}/edibleoils/Canola-Oil.png`,
  "Canola-Meal": `${BYPRODUCTS_PATH}/edibleoils/Canola-Meal.png`,
  "Sunflower-Seed": `${BYPRODUCTS_PATH}/edibleoils/Sunflower-Seed.png`,
  "Sunflower-Oil": `${BYPRODUCTS_PATH}/edibleoils/Sunflower-Oil.png`,
  "Sunflower-Meal": `${BYPRODUCTS_PATH}/edibleoils/Sunflower-Meal.png`,
  Arugula: `${BYPRODUCTS_PATH}/edibleoils/Arugula.png`,
  Castor: `${BYPRODUCTS_PATH}/edibleoils/Castor.png`,
  Soybean: `${BYPRODUCTS_PATH}/edibleoils/Soybean.png`,

  //  By-product icons – Pulses (no pulses/ subfolder — fall back to products)
  "Red-Lentils": `${PRODUCTS_PATH}/pulses200.png`,
  "Red-Lentils-Whole": `${PRODUCTS_PATH}/pulses200.png`,
  "Gram-Black": `${PRODUCTS_PATH}/pulses200.png`,
  "Gram-Pulse": `${PRODUCTS_PATH}/pulses200.png`,
  "Gram-White": `${PRODUCTS_PATH}/pulses200.png`,
  "Mung-Whole": `${PRODUCTS_PATH}/pulses200.png`,
  "Mung-Washed": `${PRODUCTS_PATH}/pulses200.png`,
  "Mash-Whole": `${PRODUCTS_PATH}/pulses200.png`,
  "Mash-Washed": `${PRODUCTS_PATH}/pulses200.png`,
  "Mash-Shell": `${PRODUCTS_PATH}/pulses200.png`,
  "Mung-Shell": `${PRODUCTS_PATH}/pulses200.png`,
  "Red-Kidney-Bean": `${PRODUCTS_PATH}/pulses200.png`,
  "White-Kidney-Bean": `${PRODUCTS_PATH}/pulses200.png`,
  Pigeon: `${PRODUCTS_PATH}/pulses200.png`,

  //  By-product icons – Spices (no spices/ subfolder — fall back to products)
  "Red-Chilli": `${PRODUCTS_PATH}/chillies200.png`,
  "Red-Chilli-Powder": `${PRODUCTS_PATH}/chillies200.png`,
  "Green-Chilli": `${PRODUCTS_PATH}/chillies200.png`,
  "White-Cumin": `${PRODUCTS_PATH}/spices200.png`,
  "Black-Cumin": `${PRODUCTS_PATH}/spices200.png`,
  Turmeric: `${PRODUCTS_PATH}/spices200.png`,
  "Black-Pepper": `${PRODUCTS_PATH}/spices200.png`,
  "Black-Pepper-Powder": `${PRODUCTS_PATH}/spices200.png`,
  Fennel: `${PRODUCTS_PATH}/spices200.png`,
  Cinnamon: `${PRODUCTS_PATH}/spices200.png`,
  Clove: `${PRODUCTS_PATH}/spices200.png`,
  "Small-Cardamom": `${PRODUCTS_PATH}/spices200.png`,
  "Large-Cardamom": `${PRODUCTS_PATH}/spices200.png`,
  Coriander: `${PRODUCTS_PATH}/spices200.png`,
  "Coriander-Powder": `${PRODUCTS_PATH}/spices200.png`,

  //  By-product icons – Dates
  Ajwa: `${BYPRODUCTS_PATH}/dates/Ajwa.png`,
  Aseel: `${BYPRODUCTS_PATH}/dates/Aseel.png`,
  "Aseel-Dried": `${BYPRODUCTS_PATH}/dates/Aseel-Dried.png`,
  Mazafati: `${BYPRODUCTS_PATH}/dates/Mazafati.png`,
  "Rabbi-Dates": `${BYPRODUCTS_PATH}/dates/Rabbi-Dates.png`,
  Amber: `${BYPRODUCTS_PATH}/dates/Amber.png`,
  "Begum-Jangi": `${BYPRODUCTS_PATH}/dates/Begum-Jangi.png`,
  "Dhaki-Dried": `${BYPRODUCTS_PATH}/dates/Dhaki-Dried.png`,
  "Zahidi-Dates": `${BYPRODUCTS_PATH}/dates/Zahidi-Dates.png`,
  "Sharifa-Dates": `${BYPRODUCTS_PATH}/dates/Sharifa-Dates.png`,
  Karbala: `${BYPRODUCTS_PATH}/dates/Karbala.png`,
  "Black-Aseel-Dried": `${BYPRODUCTS_PATH}/dates/Black-Aseel-Dried.png`,
  "Rangkat-Aseel-Dried": `${BYPRODUCTS_PATH}/dates/Rangkat-Aseel-Dried.png`,
  "Rangkat-Black-Aseel-Dried": `${BYPRODUCTS_PATH}/dates/Rangkat-Black-Aseel-Dried.png`,
  "Rangkat-Dhaki-Dried": `${BYPRODUCTS_PATH}/dates/Rangkat-Dhaki-Dried.png`,
  "Nar-Dried": `${BYPRODUCTS_PATH}/dates/Nar-Dried.png`,
  Jaifal: `${PRODUCTS_PATH}/dryfruits200.png`, // not in dates/ folder, fallback
  Jamsor: `${BYPRODUCTS_PATH}/dates/Jamsor.png`,
  Kupra: `${BYPRODUCTS_PATH}/dates/Kupra.png`,

  //  By-product icons – Fruits (no fruits/ subfolder — use products/fruits200.png)
  "Mango-Sindhri": `${PRODUCTS_PATH}/fruits200.png`,
  "Mango-White-Chaunsa": `${PRODUCTS_PATH}/fruits200.png`,
  "Mango-Black-Chaunsa": `${PRODUCTS_PATH}/fruits200.png`,
  "Mango-Anwar-Ratul": `${PRODUCTS_PATH}/fruits200.png`,
  "Mango-Fajri": `${PRODUCTS_PATH}/fruits200.png`,
  Oranges: `${PRODUCTS_PATH}/fruits200.png`,
  Mausambi: `${PRODUCTS_PATH}/fruits200.png`,
  Grapefruit: `${PRODUCTS_PATH}/fruits200.png`,
  "Sweet-Lime": `${PRODUCTS_PATH}/fruits200.png`,
  Fruiter: `${PRODUCTS_PATH}/fruits200.png`,
  Watermelon: `${PRODUCTS_PATH}/fruits200.png`,
  Apple: `${PRODUCTS_PATH}/fruits200.png`,
  Apricot: `${PRODUCTS_PATH}/fruits200.png`,
  Banana: `${PRODUCTS_PATH}/fruits200.png`,
  Cherry: `${PRODUCTS_PATH}/fruits200.png`,
  Falsa: `${PRODUCTS_PATH}/fruits200.png`,
  Melon: `${PRODUCTS_PATH}/fruits200.png`,
  Papaya: `${PRODUCTS_PATH}/fruits200.png`,
  Peach: `${PRODUCTS_PATH}/fruits200.png`,
  Pomegranate: `${PRODUCTS_PATH}/fruits200.png`,

  //  By-product icons – Vegetables
  Capsicum: `${BYPRODUCTS_PATH}/vegetables/Capsicum.png`,
  Cauliflower: `${BYPRODUCTS_PATH}/vegetables/Cauliflower.png`,
  cabbage: `${BYPRODUCTS_PATH}/vegetables/Cabbage.png`,
  "Brinjal-Round": `${BYPRODUCTS_PATH}/vegetables/Brinjal-Round.png`,
  "Brinjal-Long": `${BYPRODUCTS_PATH}/vegetables/Brinjal-Long.png`,
  carrot: `${BYPRODUCTS_PATH}/vegetables/Carrot.png`,
  spinach: `${BYPRODUCTS_PATH}/vegetables/Spinach.png`,
  peas: `${BYPRODUCTS_PATH}/vegetables/Peas.png`,
  okra: `${BYPRODUCTS_PATH}/vegetables/Okra.png`,
  cucumber: `${BYPRODUCTS_PATH}/vegetables/Cucumber.png`,
  "Bottle-Gourd": `${BYPRODUCTS_PATH}/vegetables/Bottle-Gourd.png`,
  "Ridge-Gourd": `${BYPRODUCTS_PATH}/vegetables/Ridge-Gourd.png`,
  "Round-Gourd": `${BYPRODUCTS_PATH}/vegetables/Round-Gourd.png`,
  turnip: `${BYPRODUCTS_PATH}/vegetables/Turnip.png`,
  Broccoli: `${BYPRODUCTS_PATH}/vegetables/Broccoli.png`,
  Onion: `${BYPRODUCTS_PATH}/vegetables/Onion.png`,
  Tomato: `${BYPRODUCTS_PATH}/vegetables/Tomato.png`,
  "Garlic-Desi": `${BYPRODUCTS_PATH}/vegetables/Garlic-Desi.png`,
  "Garlic-Chinese": `${BYPRODUCTS_PATH}/vegetables/Garlic-Chinese.png`,
  Ginger: `${BYPRODUCTS_PATH}/vegetables/Ginger.png`,
  Spinach: `${BYPRODUCTS_PATH}/vegetables/Spinach.png`,
  // Potato variants
  "Potato-Goli": `${BYPRODUCTS_PATH}/vegetables/Potato-Goli.png`,
  "Potato-Santa": `${BYPRODUCTS_PATH}/vegetables/Potato-Santa.png`,
  "Potato-Red": `${BYPRODUCTS_PATH}/vegetables/Potato-Red.png`,
  "Potato-White": `${BYPRODUCTS_PATH}/vegetables/Potato-White.png`,
  "Potato-Raveera": `${BYPRODUCTS_PATH}/vegetables/Potato-Raveera.png`,
  "Potato-Seed": `${BYPRODUCTS_PATH}/vegetables/Potato-Seed.png`,
  "Potato-Mozika": `${BYPRODUCTS_PATH}/vegetables/Potato-Mozika.png`,
  "Potato-LR": `${BYPRODUCTS_PATH}/vegetables/Potato-LR.png`,
  "Potato-Stone": `${BYPRODUCTS_PATH}/vegetables/Potato-Stone.png`,

  //  By-product icons – Fertilizers (actual folder = fertilizers)
  Urea: `${BYPRODUCTS_PATH}/fertilizers/Urea.png`,
  "Zabardast-Urea": `${BYPRODUCTS_PATH}/fertilizers/Zabardast-Urea.png`,
  DAP: `${BYPRODUCTS_PATH}/fertilizers/DAP.png`,
  NP: `${BYPRODUCTS_PATH}/fertilizers/NP.png`,
  NPK: `${BYPRODUCTS_PATH}/fertilizers/NPK.png`,
  SSP: `${BYPRODUCTS_PATH}/fertilizers/SSP.png`,
  MOP: `${BYPRODUCTS_PATH}/fertilizers/MOP.png`,
  TSP: `${BYPRODUCTS_PATH}/fertilizers/TSP.png`,
  CAN: `${BYPRODUCTS_PATH}/fertilizers/CAN.png`,
  "SOP-G": `${BYPRODUCTS_PATH}/fertilizers/SOP-G.png`,
  "Ammonium-Nitrate": `${BYPRODUCTS_PATH}/fertilizers/Ammonium-Nitrate.png`,
  "Ammonium-Sulphate": `${BYPRODUCTS_PATH}/fertilizers/Ammonium-Sulphate.png`,
  "Pak-Arab-Guara": `${BYPRODUCTS_PATH}/fertilizers/Pak-Arab-Guara.png`,
  Enrich: `${BYPRODUCTS_PATH}/fertilizers/Enrich.png`,

  //  Weedicides/Pesticides (no weedicides/ subfolder — fall back to fertilizers product icon)
  "Chlorfenapyr-36SC": `${PRODUCTS_PATH}/fertilizers.png`,
  "Clothianidin-20EC": `${PRODUCTS_PATH}/fertilizers.png`,
  "Mesotrione-Atrazine-50WP": `${PRODUCTS_PATH}/fertilizers.png`,
  "Mesotrione-Atrazine-55WP": `${PRODUCTS_PATH}/fertilizers.png`,
  "S-metolachlor": `${PRODUCTS_PATH}/fertilizers.png`,
  cigarete: `${PRODUCTS_PATH}/fertilizers.png`,

  //  By-product icons – Dry Fruits
  "Almond-American": `${BYPRODUCTS_PATH}/dryfruits/Almond-American.png`,
  "Almond-Australian": `${BYPRODUCTS_PATH}/dryfruits/Almond-Australian.png`,
  "Almond-Desi": `${BYPRODUCTS_PATH}/dryfruits/Almond-Desi.png`,
  "Dried-Raisins": `${BYPRODUCTS_PATH}/dryfruits/Dried-Raisins.png`,
  Cashew: `${BYPRODUCTS_PATH}/dryfruits/Cashew.png`,
  Walnut: `${BYPRODUCTS_PATH}/dryfruits/Walnut.png`,
  Fig: `${BYPRODUCTS_PATH}/dryfruits/Fig.png`,
  Pistachio: `${BYPRODUCTS_PATH}/dryfruits/Pistachio.png`,

  //  Livestock fallback
  alfalfa2: `${PRODUCTS_PATH}/livestock200.png`,
  buffalo2: `${PRODUCTS_PATH}/livestock200.png`,
  camel2: `${PRODUCTS_PATH}/livestock200.png`,
  cattle2: `${PRODUCTS_PATH}/livestock200.png`,
  chicken2: `${PRODUCTS_PATH}/livestock200.png`,
  goat2: `${PRODUCTS_PATH}/livestock200.png`,
  milk2: `${PRODUCTS_PATH}/livestock200.png`,
  "rhode-grass2": `${PRODUCTS_PATH}/livestock200.png`,
  slaughter2: `${PRODUCTS_PATH}/livestock200.png`,
};

// Map friendly product names to sprite keys
export const product_SPRITE_KEY: Record<string, string> = {
  // Verticals
  Grains: "grains",
  grains: "grains",
  Fruits: "fruits",
  fruits: "fruits",
  Fruit: "fruits",
  fruit: "fruits",
  Vegetables: "vegetables",
  vegetables: "vegetables",
  Vegetable: "vegetables",
  vegetable: "vegetables",
  Livestock: "livestock",
  livestock: "livestock",
  livesyock: "livestock",
  Livesyock: "livestock",
  liveestock: "livestock",
  Liveestock: "livestock",
  "Agri Inputs": "agri-inputs",
  "agri-inputs": "agri-inputs",
  "Dry Fruits": "dry-fruits",
  "Dry-Fruits": "dry-fruits",
  "dry-fruits": "dry-fruits",
  dryfruits: "dry-fruits",
  dryfruit: "dry-fruits",
  "Dry Fruit": "dry-fruits",
  DryFruits: "dry-fruits",
  DryFruit: "dry-fruits",
  Herbals: "herbals",
  herbals: "herbals",
  Herbal: "herbals",
  herbal: "herbals",
  Herbs: "herbals",
  herbs: "herbals",
  Herb: "herbals",
  herb: "herbals",
  Kiryana: "kiryana",
  kiryana: "kiryana",
  // Wheat & byproducts
  Wheat: "wheat",
  "Wheat Bran": "Bran",
  Bran: "Bran",
  "Fine Flour": "Fine-Flour",
  "Refined Flour": "Fine-Flour",
  "Fine-Flour": "Fine-Flour",
  "Refined-Flour": "Fine-Flour",
  Flour: "Flour",
  "Special Flour": "Special-Flour",
  "Flour Special": "Special-Flour",
  "Special-Flour": "Special-Flour",
  "Flour-Special": "Special-Flour",
  Maida: "Fine-Flour",
  Semolina: "Semolina",
  Sooji: "Semolina",
  Suji: "Semolina",
  Straw: "Straw",
  "Wheat Straw": "Straw",
  Sorghum: "Sorghum",
  Barley: "Barley",
  Oat: "Oat",
  // Rice / Paddy / Maize
  Rice: "rice",
  Paddy: "paddy",
  Maize: "maize",
  "Corn Silage": "Corn-Silage",
  Popcorn: "Popcorn",
  "Maize Grade A": "Maize-A",
  "Maize Grade B": "Maize-B",
  "Maize Grade C": "Maize-C",
  "Maize Grade D": "Maize-D",
  // Cotton
  Cotton: "cotton",
  "Cotton Grade A": "Cotton-A",
  "Cotton Grade B": "Cotton-B",
  "Cotton Grade C": "Cotton-C",
  "Cotton Seed": "Cotton-Seed",
  "Cotton Seed Oil": "Cotton-Seed-Oil",
  "Cotton Seed Cake": "Cotton-Seed-Cake",
  "Lint Cotton": "Lint-Cotton",
  // Sugar
  Sugar: "sugar",
  "Sugar (Mill)": "sugar",
  "Sugar (Wholesale)": "sugar",
  "Sugar (Retail)": "sugar",
  Sugarcane: "Sugarcane",
  Jaggery: "Jaggery",
  "Brown Sugar": "Brown-Sugar",
  // Mustard
  Mustard: "mustard",
  "Mustard Seed": "Mustard-Seed",
  "Mustard Oil": "Mustard-Oil",
  "Mustard Cake": "Mustard-Cake",
  // Canola
  Canola: "canola",
  "Canola Seed": "Canola-Seed",
  "Canola Oil": "Canola-Oil",
  "Canola Meal": "Canola-Meal",
  // Sunflower
  Sunflower: "sunflower",
  "Sunflower Seed": "Sunflower-Seed",
  "Sunflower Oil": "Sunflower-Oil",
  "Sunflower Meal": "Sunflower-Meal",
  // Millet / Sesame
  Millet: "millet",
  "Millet Grade A": "millet",
  "Millet Grade B": "millet",
  "Millet Grade C": "millet",
  Sesame: "sesame",
  "Sesame Grade A": "Sesame-A",
  "Sesame Grade B": "Sesame-B",
  "Sesame Grade C": "Sesame-C",
  // Pulses
  Pulses: "pulses",
  "Red Lentil": "Red-Lentils",
  "Whole Red Lentil Large": "Red-Lentils",
  "Whole Red Lentil Small": "Red-Lentils",
  "Black Chickpea Large": "Gram-Black",
  "Black Chickpea Small": "Gram-Black",
  "Split Chickpea Large": "Gram-Pulse",
  "Kabuli Chickpea 7mm": "Gram-White",
  "Kabuli Chickpea 9mm": "Gram-White",
  "Whole Green Gram Large": "Mung-Whole",
  "Split Green Gram Washed": "Mung-Washed",
  "Whole Black Gram Small": "Mash-Whole",
  "Pigeon Pea Large": "Gram-Pulse",
  "Red Kidney Bean Large": "Red-Kidney-Bean",
  "White Kidney Bean Large": "White-Kidney-Bean",
  // Spices
  Spices: "spices",
  "Red Chilli": "Red-Chilli",
  "Red Chilli Powder": "Red-Chilli-Powder",
  "Coriander Seed": "Coriander",
  "Coriander Seed Powder": "Coriander-Powder",
  "White Cumin": "White-Cumin",
  "Black Cumin": "Black-Cumin",
  Turmeric: "Turmeric",
  "Black Pepper": "Black-Pepper",
  "Black Pepper Powder": "Black-Pepper-Powder",
  Fennel: "Fennel",
  Cinnamon: "Cinnamon",
  Clove: "Clove",
  "Small Cardamom": "Small-Cardamom",
  "Large Black Cardamom": "Large-Cardamom",
  "Longi Chilli": "chilli",
  "Hybrid Chilli": "chilli",
  // Dates
  Dates: "Aseel",
  "Ajwa Dates": "Ajwa",
  "Aseel Dates": "Aseel",
  "Mazafati Dates": "Mazafati",
  "Rabbi Dates": "Rabbi-Dates",
  "Amber Dates": "Amber",
  "Begum Jangi Dates": "Begum-Jangi",
  "Aseel Dry Dates": "Aseel-Dried",
  "Dhaki Dry Dates": "Dhaki-Dried",
  // Soybean
  Soybean: "soybean",
  "Soybean Seed": "soybean",
  "Soybean Oil": "soybean",
  "Soybean Meal": "soybean",
  // Edible Oils
  "Edible Oil": "canola",
  Arugula: "Arugula",
  "Arugula Seed": "Arugula",
  "Arugula Oil": "Arugula",
  Castor: "Castor",
  "Castor Bean": "Castor",
  "Castor Oil": "Castor",
  // Fruits
  Mango: "mango",
  "Mango Sindhri": "Mango-Sindhri",
  "Mango White Chunsa": "Mango-White-Chaunsa",
  "Mango Black Chunsa": "Mango-Black-Chaunsa",
  "Mango Anwer Ratul": "Mango-Anwar-Ratul",
  "Mango Fajri": "Mango-Fajri",
  "Mango Dasheri": "mango",
  "Mango Almas": "mango",
  "Mango Saroli": "mango",
  Banana: "Banana",
  Citrus: "citrus",
  Orange: "Oranges",
  Musambi: "Mausambi",
  Grapefruit: "Grapefruit",
  Mandarin: "Oranges",
  "Sweet Lime": "Sweet-Lime",
  Fruiter: "Fruiter",
  Melon: "melon",
  Watermelon: "Watermelon",
  Apple: "Apple",
  "Apple Kala Kullu": "Apple",
  "Apple Golden": "Apple",
  Pomegranate: "Pomegranate",
  Grapes: "Grapes",
  Peach: "Peach",
  Apricot: "Apricot",
  Papaya: "Papaya",
  Cherry: "Cherry",
  Plum: "Plum",
  Falsa: "Falsa",
  // Vegetables
  Potato: "potato",
  "Potato (Mozika)": "Potato-Mozika",
  "Potato (Santa)": "Potato-Santa",
  "Potato (Red)": "Potato-Red",
  "Potato (White)": "Potato-White",
  "Potato (Goli)": "Potato-Goli",
  "Potato (Raveera)": "Potato-Raveera",
  "Potato (Seed)": "Potato-Seed",
  Tomato: "Tomato",
  "Tomato (Grade A)": "Tomato",
  "Tomato (Grade B)": "Tomato",
  "Tomato (Grade C)": "Tomato",
  Onion: "Onion",
  "Onion (Grade A)": "Onion",
  "Onion (Grade B)": "Onion",
  "Onion (Grade C)": "Onion",
  Garlic: "garlic",
  "Garlic Desi": "Garlic-Desi",
  "Garlic Chinese": "Garlic-Chinese",
  "Garlic G1": "garlic",
  "Garlic Harnai": "garlic",
  Chilli: "chilli",
  "Desi Chilli": "chilli",
  "Green Chilli - Small": "Green-Chilli",
  "Green Chilli - Medium": "Green-Chilli",
  "Green Chilli - Large": "Green-Chilli",
  Capsicum: "Capsicum",
  Cauliflower: "Cauliflower",
  Cabbage: "cabbage",
  Brinjal: "brinjal",
  "Brinjal Round": "Brinjal-Round",
  "Brinjal Long": "Brinjal-Long",
  Carrot: "carrot",
  Spinach: "spinach",
  Peas: "peas",
  Guar: "guar",
  Okra: "okra",
  Cucumber: "cucumber",
  "Bitter Gourd": "bitter-gourd",
  "Bottle Gourd": "Bottle-Gourd",
  "Round Gourd": "Round-Gourd",
  "Ridge Gourd": "Ridge-Gourd",
  Ginger: "Ginger",
  "Lemon Desi": "lemon",
  "Lemon China": "lemon",
  Lemon: "lemon",
  Turnip: "turnip",
  "Sweet Potato": "sweet-potato",
  Broccoli: "Broccoli",
  // Livestock
  "Cattle Market": "cattle-market",
  "Slaughter House": "slaughter-house",
  Poultry: "poultry",
  Dairy: "dairy",
  Fisheries: "fisheries",
  Feed: "feed",
  Cow: "cattle",
  Buffalo: "buffalo",
  Goat: "goat",
  Camel: "camel",
  Broiler: "chicken",
  Layer: "chicken",
  Milk: "milk",
  Yogurt: "milk",
  Butter: "dairy",
  Rohu: "fisheries",
  Catla: "fisheries",
  Tilapia: "fisheries",
  Alfalfa: "alfalfa",
  "Rhode Grass": "rhode-grass",
  "Canola Meal Feed": "Canola-Meal",
  "Mustard Seed Cake": "Mustard-Cake",
  "Cotton Seed Cake Feed": "Cotton-Seed-Cake",
  Eggs: "eggs",
  // Agri Inputs
  Fertilizer: "fertilizer",
  Pesticide: "pesticide",
  Weedicide: "weedicide",
  Herbicide: "herbicide",
  Urea: "Urea",
  "Zabardast Urea": "Zabardast-Urea",
  DAP: "DAP",
  NP: "NP",
  NPK: "NPK",
  SSP: "SSP",
  MOP: "MOP",
  TSP: "TSP",
  CAN: "CAN",
  "SOP-G": "SOP-G",
  "Ammonium Nitrate": "Ammonium-Nitrate",
  "Ammonium Sulphate": "Ammonium-Sulphate",
  "Pak Arab Guara": "Pak-Arab-Guara",
  "Chlorphenapyr 36% SC": "Chlorfenapyr-36SC",
  "Clothianidin 20% EC": "Clothianidin-20EC",
  "Mesotrione + Atrazine 50% WP": "Mesotrione-Atrazine-50WP",
  "Mesotrione + Atrazine 55% WP": "Mesotrione-Atrazine-55WP",
  "S-Metolachlor 960EC 800ML": "S-metolachlor",
  Glyphosate: "weedicide",
  // Dry Fruits
  Almonds: "almond",
  "Almond (American)": "Almond-American",
  "Almond (Australian)": "Almond-Australian",
  "Almond (Desi)": "Almond-Desi",
  Cashew: "Cashew",
  Walnut: "Walnut",
  Fig: "Fig",
  Pistachio: "Pistachio",
  Raisins: "raisin",
  "Dried Raisins": "Dried-Raisins",
  // Herbals
  Honey: "honey",
  Psyllium: "psyllium",
  "Psyllium Seed": "psyllium",
  "Psyllium Husk": "psyllium",
  "Black Seed": "black-seed",
  "Black Seed Oil": "black-seed",
  "Carom Seed": "corom-seed",
  "Basil Seed": "basil-seed",
  "Chia Seed": "chia-seed",
  Saffron: "saffron",
  Asafoetida: "asafoetida",
  // Kiryana specific
  "Rice Polish": "rice",
  "Broken Irri 6": "rice",
};

export function getproductIconSrc(
  name?: string | null,
  vertical?: string | null,
): string {
  if (!name && !vertical)
    return ICON_PATHS.wheat || `${PRODUCTS_PATH}/wheat200.png`;

  const n = (name || "").trim();
  const lower = n.toLowerCase();
  const clean = lower.replace(/[^a-z0-9]+/g, "");

  // 1. COTTON SPECIALIZED MATCHING
  if (
    lower.includes("cotton") ||
    lower.includes("phutti") ||
    lower.includes("binola") ||
    (vertical && vertical.toLowerCase() === "cotton")
  ) {
    if (lower.includes("cake") || lower.includes("khal"))
      return ICON_PATHS["Cotton-Seed-Cake"];
    if (lower.includes("oil") || lower.includes("tail"))
      return ICON_PATHS["Cotton-Seed-Oil"];
    if (lower.includes("lint") || lower.includes("rui"))
      return ICON_PATHS["Lint-Cotton"];
    if (
      clean === "cottonseed" ||
      (lower.includes("seed") &&
        !lower.includes("seed cotton") &&
        !lower.includes("seedcotton"))
    ) {
      return ICON_PATHS["Cotton-Seed"];
    }
    if (
      lower.includes("grade a") ||
      lower.includes("grade-a") ||
      lower.endsWith(" a") ||
      lower.includes("- a")
    )
      return ICON_PATHS["Cotton-A"];
    if (
      lower.includes("grade b") ||
      lower.includes("grade-b") ||
      lower.endsWith(" b") ||
      lower.includes("- b")
    )
      return ICON_PATHS["Cotton-B"];
    if (
      lower.includes("grade c") ||
      lower.includes("grade-c") ||
      lower.endsWith(" c") ||
      lower.includes("- c")
    )
      return ICON_PATHS["Cotton-C"];
    return `${PRODUCTS_PATH}/cotton200.png`;
  }

  // 2. SESAME SPECIALIZED MATCHING
  if (
    lower.includes("sesame") ||
    lower.includes("til") ||
    (vertical && vertical.toLowerCase() === "sesame")
  ) {
    if (lower.includes("oil") || lower.includes("tail"))
      return ICON_PATHS["Sesame-Oil"];
    if (
      lower.includes("grade a") ||
      lower.includes("grade-a") ||
      lower.endsWith(" a") ||
      lower.includes("- a") ||
      lower.includes("white") ||
      lower.includes("safaid")
    )
      return ICON_PATHS["Sesame-A"];
    if (
      lower.includes("grade b") ||
      lower.includes("grade-b") ||
      lower.endsWith(" b") ||
      lower.includes("- b") ||
      lower.includes("golden") ||
      lower.includes("bhura")
    )
      return ICON_PATHS["Sesame-B"];
    if (
      lower.includes("grade c") ||
      lower.includes("grade-c") ||
      lower.endsWith(" c") ||
      lower.includes("- c") ||
      lower.includes("black") ||
      lower.includes("kala")
    )
      return ICON_PATHS["Sesame-C"];
    return ICON_PATHS["Sesame"] || `${PRODUCTS_PATH}/sesame200.png`;
  }

  // 3. MAIZE SPECIALIZED MATCHING
  if (
    lower.includes("maize") ||
    lower.includes("corn") ||
    lower.includes("makai") ||
    (vertical && vertical.toLowerCase() === "maize")
  ) {
    if (lower.includes("silage")) return ICON_PATHS["Corn-Silage"];
    if (lower.includes("starch")) return ICON_PATHS["Corn-Starch"];
    if (lower.includes("popcorn")) return ICON_PATHS["Popcorn"];
    if (
      lower.includes("grade a") ||
      lower.includes("grade-a") ||
      lower.endsWith(" a") ||
      lower.includes("- a")
    )
      return ICON_PATHS["Maize-A"];
    if (
      lower.includes("grade b") ||
      lower.includes("grade-b") ||
      lower.endsWith(" b") ||
      lower.includes("- b")
    )
      return ICON_PATHS["Maize-B"];
    if (
      lower.includes("grade c") ||
      lower.includes("grade-c") ||
      lower.endsWith(" c") ||
      lower.includes("- c")
    )
      return ICON_PATHS["Maize-C"];
    if (
      lower.includes("grade d") ||
      lower.includes("grade-d") ||
      lower.endsWith(" d") ||
      lower.includes("- d")
    )
      return ICON_PATHS["Maize-D"];
    return `${PRODUCTS_PATH}/maize200.png`;
  }

  // 4. MUSTARD SPECIALIZED MATCHING
  if (
    lower.includes("mustard") ||
    lower.includes("sarson") ||
    (vertical && vertical.toLowerCase() === "mustard")
  ) {
    if (lower.includes("cake") || lower.includes("khal"))
      return ICON_PATHS["Mustard-Cake"];
    if (lower.includes("oil") || lower.includes("tail"))
      return ICON_PATHS["Mustard-Oil"];
    return ICON_PATHS["Mustard-Seed"];
  }

  // 5. SUGAR SPECIALIZED MATCHING
  if (
    lower.includes("sugar") ||
    lower.includes("jaggery") ||
    lower.includes("gur") ||
    lower.includes("shakkar") ||
    lower.includes("cheeni") ||
    (vertical && vertical.toLowerCase().includes("sugar"))
  ) {
    if (lower.includes("cane") || lower.includes("ganna"))
      return ICON_PATHS["Sugarcane"];
    if (lower.includes("jaggery") || lower.includes("gur"))
      return ICON_PATHS["Jaggery"];
    if (lower.includes("shakkar") || lower.includes("brown"))
      return ICON_PATHS["Brown-Sugar"];
    return ICON_PATHS["Sugar"];
  }

  // 6. WHEAT SPECIALIZED MATCHING
  if (
    lower.includes("wheat") ||
    (vertical && vertical.toLowerCase() === "wheat")
  ) {
    if (
      clean.includes("specialflour") ||
      (lower.includes("flour") && lower.includes("special"))
    )
      return ICON_PATHS["Special-Flour"];
    if (
      clean.includes("refinedflour") ||
      clean.includes("fineflour") ||
      lower.includes("maida")
    )
      return ICON_PATHS["Fine-Flour"];
    if (clean === "flour" || lower.includes("atta")) return ICON_PATHS["Flour"];
    if (
      lower.includes("sooji") ||
      lower.includes("semolina") ||
      lower.includes("suji")
    )
      return ICON_PATHS["Semolina"];
    if (lower.includes("bran") || lower.includes("choker"))
      return ICON_PATHS["Bran"];
    if (
      lower.includes("straw") ||
      lower.includes("toori") ||
      lower.includes("bhusa")
    )
      return ICON_PATHS["Straw"];
    if (lower.includes("sorghum") || lower.includes("jowar"))
      return ICON_PATHS["Sorghum"];
    if (lower.includes("barley") || lower.includes("jau"))
      return ICON_PATHS["Barley"];
    if (lower.includes("oat") || lower.includes("jawi"))
      return ICON_PATHS["Oat"];
    return ICON_PATHS["Wheat"];
  }

  // 7. DATES SPECIALIZED MATCHING
  if (
    lower.includes("date") ||
    lower.includes("khajoor") ||
    lower.includes("chuara") ||
    (vertical && vertical.toLowerCase() === "dates")
  ) {
    if (lower.includes("ajwa")) return ICON_PATHS["Ajwa"];
    if (lower.includes("amber")) return ICON_PATHS["Amber"];
    if (lower.includes("black aseel") || lower.includes("black-aseel"))
      return ICON_PATHS["Black-Aseel-Dried"];
    if (lower.includes("rangkat") && lower.includes("aseel"))
      return ICON_PATHS["Rangkat-Aseel-Dried"];
    if (lower.includes("rangkat") && lower.includes("dhaki"))
      return ICON_PATHS["Rangkat-Dhaki-Dried"];
    if (
      lower.includes("aseel") &&
      (lower.includes("chuara") ||
        lower.includes("dry") ||
        lower.includes("dried"))
    )
      return ICON_PATHS["Aseel-Dried"];
    if (lower.includes("aseel")) return ICON_PATHS["Aseel"];
    if (lower.includes("begum") || lower.includes("jangi"))
      return ICON_PATHS["Begum-Jangi"];
    if (lower.includes("dhaki")) return ICON_PATHS["Dhaki-Dried"];
    if (lower.includes("jamsor")) return ICON_PATHS["Jamsor"];
    if (lower.includes("karbala")) return ICON_PATHS["Karbala"];
    if (lower.includes("kupra")) return ICON_PATHS["Kupra"];
    if (lower.includes("mazafati")) return ICON_PATHS["Mazafati"];
    if (lower.includes("nar")) return ICON_PATHS["Nar-Dried"];
    if (lower.includes("rabbi")) return ICON_PATHS["Rabbi-Dates"];
    if (lower.includes("sharifa")) return ICON_PATHS["Sharifa-Dates"];
    if (lower.includes("zahidi")) return ICON_PATHS["Zahidi-Dates"];
    return `${PRODUCTS_PATH}/dates200.png`;
  }

  // 8. DRY FRUITS SPECIALIZED MATCHING
  if (lower.includes("almond") || lower.includes("badam")) {
    if (lower.includes("american")) return ICON_PATHS["Almond-American"];
    if (lower.includes("australian")) return ICON_PATHS["Almond-Australian"];
    return ICON_PATHS["Almond-Desi"];
  }
  if (lower.includes("cashew") || lower.includes("kaju"))
    return ICON_PATHS["Cashew"];
  if (lower.includes("walnut") || lower.includes("akhrot"))
    return ICON_PATHS["Walnut"];
  if (lower.includes("fig") || lower.includes("anjeer"))
    return ICON_PATHS["Fig"];
  if (lower.includes("pistachio") || lower.includes("pista"))
    return ICON_PATHS["Pistachio"];
  if (lower.includes("raisin") || lower.includes("kishmish"))
    return ICON_PATHS["Dried-Raisins"];

  // 9. EDIBLE OILS SPECIALIZED MATCHING
  if (lower.includes("canola")) {
    if (lower.includes("meal")) return ICON_PATHS["Canola-Meal"];
    if (lower.includes("oil")) return ICON_PATHS["Canola-Oil"];
    return ICON_PATHS["Canola-Seed"];
  }
  if (lower.includes("sunflower") || lower.includes("surajmukhi")) {
    if (lower.includes("meal")) return ICON_PATHS["Sunflower-Meal"];
    if (lower.includes("oil")) return ICON_PATHS["Sunflower-Oil"];
    return ICON_PATHS["Sunflower-Seed"];
  }
  if (
    lower.includes("taara") ||
    lower.includes("meera") ||
    lower.includes("arugula") ||
    lower.includes("taramira")
  ) {
    return ICON_PATHS["Arugula"];
  }
  if (lower.includes("castor") || lower.includes("arand"))
    return ICON_PATHS["Castor"];
  if (lower.includes("soy") || lower.includes("soya"))
    return ICON_PATHS["Soybean"];
  if (lower.includes("camelina")) return ICON_PATHS["Canola-Seed"];

  // 10. FERTILIZERS SPECIALIZED MATCHING
  if (lower.includes("urea")) {
    if (lower.includes("zabardast")) return ICON_PATHS["Zabardast-Urea"];
    return ICON_PATHS["Urea"];
  }
  if (lower.includes("dap")) return ICON_PATHS["DAP"];
  if (lower.includes("npk")) return ICON_PATHS["NPK"];
  if (lower.includes("np")) return ICON_PATHS["NP"];
  if (lower.includes("ssp")) return ICON_PATHS["SSP"];
  if (lower.includes("mop")) return ICON_PATHS["MOP"];
  if (lower.includes("tsp")) return ICON_PATHS["TSP"];
  if (lower.includes("can")) return ICON_PATHS["CAN"];
  if (lower.includes("sop")) return ICON_PATHS["SOP-G"];
  if (
    lower.includes("ammonium sulphate") ||
    lower.includes("ammonium-sulphate")
  )
    return ICON_PATHS["Ammonium-Sulphate"];
  if (lower.includes("nitrate")) return ICON_PATHS["Ammonium-Nitrate"];
  if (lower.includes("guara")) return ICON_PATHS["Pak-Arab-Guara"];
  if (lower.includes("enrich")) return ICON_PATHS["Enrich"];

  // 11. VEGETABLES SPECIALIZED MATCHING
  if (lower.includes("potato") || lower.includes("aloo")) {
    if (lower.includes("goli")) return ICON_PATHS["Potato-Goli"];
    if (lower.includes("santa")) return ICON_PATHS["Potato-Santa"];
    if (lower.includes("red") || lower.includes("laal"))
      return ICON_PATHS["Potato-Red"];
    if (lower.includes("white") || lower.includes("sufaid"))
      return ICON_PATHS["Potato-White"];
    if (lower.includes("mozika")) return ICON_PATHS["Potato-Mozika"];
    if (lower.includes("lr")) return ICON_PATHS["Potato-LR"];
    if (lower.includes("raveera")) return ICON_PATHS["Potato-Raveera"];
    if (lower.includes("seed") || lower.includes("beej"))
      return ICON_PATHS["Potato-Seed"];
    if (
      lower.includes("stone") ||
      lower.includes("astras") ||
      lower.includes("curda") ||
      lower.includes("ismi")
    )
      return ICON_PATHS["Potato-Stone"];
    return `${PRODUCTS_PATH}/vegetables200.png`;
  }
  if (lower.includes("onion") || lower.includes("pyaz"))
    return ICON_PATHS["Onion"];
  if (lower.includes("tomato") || lower.includes("tamatar"))
    return ICON_PATHS["Tomato"];
  if (lower.includes("garlic") || lower.includes("lehsan")) {
    if (
      lower.includes("china") ||
      lower.includes("chinese") ||
      lower.includes("g1")
    )
      return ICON_PATHS["Garlic-Chinese"];
    return ICON_PATHS["Garlic-Desi"];
  }
  if (lower.includes("ginger") || lower.includes("adrak"))
    return ICON_PATHS["Ginger"];
  if (lower.includes("chilli") || lower.includes("mirch"))
    return (
      ICON_PATHS["Green-Chilli"] || `${PRODUCTS_PATH}/chillies200.png`
    );
  if (lower.includes("bottle gourd") || lower.includes("kaddu"))
    return ICON_PATHS["Bottle-Gourd"];
  if (lower.includes("ridge gourd") || lower.includes("tori"))
    return ICON_PATHS["Ridge-Gourd"];
  if (lower.includes("round gourd") || lower.includes("tinda"))
    return ICON_PATHS["Round-Gourd"];
  if (lower.includes("brinjal") || lower.includes("baingan")) {
    if (lower.includes("long") || lower.includes("lamba"))
      return ICON_PATHS["Brinjal-Long"];
    return ICON_PATHS["Brinjal-Round"];
  }
  if (lower.includes("capsicum") || lower.includes("shimla"))
    return ICON_PATHS["Capsicum"];
  if (lower.includes("cauliflower") || lower.includes("phool gobhi"))
    return ICON_PATHS["Cauliflower"];
  if (lower.includes("cabbage") || lower.includes("band gobhi"))
    return ICON_PATHS["cabbage"];
  if (lower.includes("carrot") || lower.includes("gajar"))
    return ICON_PATHS["carrot"];
  if (lower.includes("spinach") || lower.includes("palak"))
    return ICON_PATHS["spinach"];
  if (lower.includes("pea") || lower.includes("matar"))
    return ICON_PATHS["peas"];
  if (lower.includes("okra") || lower.includes("bhindi"))
    return ICON_PATHS["okra"];
  if (lower.includes("cucumber") || lower.includes("kheera"))
    return ICON_PATHS["cucumber"];
  if (lower.includes("turnip") || lower.includes("shalgam"))
    return ICON_PATHS["turnip"];
  if (lower.includes("broccoli")) return ICON_PATHS["Broccoli"];

  // 12. PADDY & RICE
  if (
    lower.includes("paddy") ||
    lower.includes("dhan") ||
    (vertical && vertical.toLowerCase() === "paddy")
  ) {
    return `${PRODUCTS_PATH}/paddy200.png`;
  }
  if (
    lower.includes("rice") ||
    lower.includes("chawal") ||
    (vertical && vertical.toLowerCase() === "rice")
  ) {
    return `${PRODUCTS_PATH}/rice200.png`;
  }

  // 13. Direct / Cleaned Lookups
  if (ICON_PATHS[n]) return ICON_PATHS[n];
  if (ICON_PATHS[lower]) return ICON_PATHS[lower];

  // 14. Vertical Fallback
  if (vertical) {
    const vLower = vertical.trim().toLowerCase();
    if (ICON_PATHS[vLower]) return ICON_PATHS[vLower];
    if (vLower === "grains") return `${PRODUCTS_PATH}/wheat200.png`;
    if (
      vLower === "fruits" ||
      vLower === "fruit"
    )
      return `${PRODUCTS_PATH}/fruits200.png`;
    if (
      vLower === "vegetable" ||
      vLower === "vegetables"
    )
      return `${PRODUCTS_PATH}/vegetables200.png`;
    if (
      vLower === "dry fruit" ||
      vLower === "dry fruits" ||
      vLower === "dryfruit" ||
      vLower === "dryfruits"
    )
      return `${PRODUCTS_PATH}/dryfruits200.png`;
    if (
      vLower === "herbs" ||
      vLower === "herbals" ||
      vLower === "herbal" ||
      vLower === "herb"
    )
      return `${PRODUCTS_PATH}/herbals200.png`;
    if (vLower === "livestock") return `${PRODUCTS_PATH}/livestock200.png`;
    if (vLower === "kiryana") return `${PRODUCTS_PATH}/kiryana200.png`;
    if (vLower === "spices") return `${PRODUCTS_PATH}/spices200.png`;
    if (vLower === "pulses") return `${PRODUCTS_PATH}/pulses200.png`;
    if (vLower === "fertilizer" || vLower === "fertilizers")
      return `${PRODUCTS_PATH}/fertilizers.png`;
  }

  return ICON_PATHS.wheat || `${PRODUCTS_PATH}/wheat200.png`;
}

export const REAL_product_IMAGES: Record<string, string> = new Proxy(
  {},
  {
    get: (_, prop: string) => getproductIconSrc(prop),
  },
) as Record<string, string>;

export function getSpriteKey(name: string, vertical?: string): string | null {
  return (
    product_SPRITE_KEY[name] ||
    (vertical ? product_SPRITE_KEY[vertical] : null) ||
    null
  );
}

export const getVerticalIcon = (v: string) => VERTICALS[v]?.icon || "grains";
