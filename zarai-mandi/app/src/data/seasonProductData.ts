// Season Product and By-Product Data Availability
// Source: Crops Seasons (1)(4).xlsx

import fruitsImg from "../fruits200.png";
import vegetablesImg from "../vegetables200.png";
import wheatImg from "../wheat200.png";
import riceImg from "../rice200.png";
import pulsesImg from "../pulses200.png";
import maizeImg from "../maize200.png";
import cottonImg from "../cotton200.png";
import spicesImg from "../spices200.png";
import sesameImg from "../sesame200.png";
import dryfruitsImg from "../dryfruits200.png";
import datesImg from "../dates200.png";
import sugarImg from "../sugar200.png";
import edibleImg from "../edible200.png";
import herbalsImg from "../herbals200.png";
import milletImg from "../millet200.png";
import livestockImg from "../livestock200.png";
import kiryanaImg from "../kiryana200.png";
import appleImg from "../icons/apple.jpg";
import bananaImg from "../icons/banana.jpg";
import grapesImg from "../icons/grapes.jpg";
import mangoImg from "../icons/mango.jpg";

export interface SeasonVariety {
  name: string;
  nameUr: string;
  months: string[]; // ["Jan", "Feb", ...]
}

export interface SeasonPackage {
  id: string;
  name: string;
  nameUr: string;
  type: "vertical" | "product";
  icon: string;
  pricePerMonth: number;
  varieties: SeasonVariety[];
}

export const MONTH_KEYS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const MONTH_NAMES_UR = [
  "جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون",
  "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"
];

const ALL_MONTHS = [...MONTH_KEYS];

export const SEASON_PACKAGES: SeasonPackage[] = [
  // ─── 5 VERTICALS (WITH EXPANDABLE BY-PRODUCTS PREVIEW) ───────────────────
  {
    id: "fruits",
    name: "Fruits",
    nameUr: "پھل",
    type: "vertical",
    icon: fruitsImg,
    pricePerMonth: 5000,
    varieties: [
      { name: "Apple", nameUr: "سیب", months: ["Jan", "Feb", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
      { name: "Banana", nameUr: "کیلا", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
      { name: "Grapes", nameUr: "انگور", months: ["May", "Jun", "Jul", "Aug", "Sep"] },
      { name: "Mango Sindhri", nameUr: "سندھڑی آم", months: ["May", "Jun", "Jul", "Aug", "Sep"] },
      { name: "Mango White Chunsa", nameUr: "سفید چونسہ", months: ["May", "Jun", "Jul", "Aug", "Sep"] },
      { name: "Mango Black Chunsa", nameUr: "کالا چونسہ", months: ["May", "Jun", "Jul", "Aug", "Sep"] },
      { name: "Mango Dasheri", nameUr: "دسیری آم", months: ["Jun", "Jul", "Aug", "Sep"] },
      { name: "Mango Anwer Ratul", nameUr: "انور رٹول", months: ["May", "Jun", "Jul", "Aug", "Sep"] },
      { name: "Mango Fajri", nameUr: "فجری آم", months: ["May", "Jun", "Jul", "Aug", "Sep"] },
      { name: "Mango Saroli", nameUr: "سرولی آم", months: ["Jun", "Jul", "Aug", "Sep"] },
      { name: "Mango Almas", nameUr: "الماس آم", months: ["Jun", "Jul"] },
      { name: "Oranges", nameUr: "مالٹا", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
      { name: "Mausambi", nameUr: "موسمبی", months: ["Jan", "Feb", "Jul", "Aug", "Sep"] },
      { name: "Fruiter", nameUr: "فروٹر", months: ["Jan", "Feb", "Jul", "Sep"] },
      { name: "Grapefruit", nameUr: "گریپ فروٹ", months: ["Jan", "Feb", "Aug", "Sep"] },
      { name: "Sweet Lime", nameUr: "میٹھا", months: ["Jan", "Feb", "Mar", "Jul", "Aug", "Sep"] },
      { name: "Pomegranate", nameUr: "انار", months: ["Feb", "Jul", "Aug", "Sep"] },
      { name: "Watermelon", nameUr: "تربوز", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
      { name: "Kharbooza", nameUr: "خربوزہ", months: ["Jan", "Feb", "Apr", "May", "Jun", "Jul"] },
      { name: "Papaya", nameUr: "پپیتا", months: ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
      { name: "Peach", nameUr: "آڑو", months: ["Jun", "Jul", "Aug", "Sep"] },
      { name: "Plum", nameUr: "آلو بخارا", months: ["Jun", "Jul", "Aug", "Sep"] },
      { name: "Apricot", nameUr: "خوبانی", months: ["Jun", "Jul", "Aug", "Sep"] },
      { name: "Cherry", nameUr: "چیری", months: ["Jun", "Jul", "Aug", "Sep"] },
      { name: "Falsa", nameUr: "فالسہ", months: ["Jun", "Jul", "Aug", "Sep"] },
      { name: "Kala Kullu Apple", nameUr: "کالا کلو سیب", months: ["Jun", "Jul", "Aug", "Sep"] },
    ],
  },
  {
    id: "vegetables",
    name: "Vegetables",
    nameUr: "سبزیاں",
    type: "vertical",
    icon: vegetablesImg,
    pricePerMonth: 5000,
    varieties: [
      { name: "Tomato", nameUr: "ٹماٹر", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Onion", nameUr: "پیاز", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Potato", nameUr: "آلو", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Garlic Desi", nameUr: "دیسی لہسن", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Ginger", nameUr: "ادرک", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Cucumber", nameUr: "کھیرا", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Pea", nameUr: "مٹر", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Cauliflower", nameUr: "پھول گوبھی", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Cabbage", nameUr: "بند گوبھی", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Carrot", nameUr: "گاجر", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Capsicum", nameUr: "شملہ مرچ", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Spinach", nameUr: "پالک", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Turnip", nameUr: "شلجم", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Bottle Gourd", nameUr: "لوکی کدو", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Brinjal", nameUr: "بینگن", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Okra", nameUr: "بھنڈی", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Dec"] },
      { name: "Ridge Gourd", nameUr: "توری", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Dec"] },
      { name: "Bitter Gourd", nameUr: "کریلا", months: ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
      { name: "Lemon", nameUr: "لیموں", months: ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
      { name: "Broccoli", nameUr: "بروکلی", months: ["Feb", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
    ],
  },
  {
    id: "edible_oils",
    name: "Edible Oils",
    nameUr: "کھانے کا تیل",
    type: "vertical",
    icon: edibleImg,
    pricePerMonth: 5000,
    varieties: [
      { name: "Mustard Oil", nameUr: "سرسوں کا تیل", months: ALL_MONTHS },
      { name: "Canola Oil", nameUr: "کینولا تیل", months: ALL_MONTHS },
      { name: "Sunflower Oil", nameUr: "سورج مکھی تیل", months: ALL_MONTHS },
      { name: "Soybean Oil", nameUr: "سویا بین تیل", months: ALL_MONTHS },
      { name: "Mustard Seed", nameUr: "سرسوں بیج", months: ALL_MONTHS },
      { name: "Canola Seed", nameUr: "کینولا بیج", months: ALL_MONTHS },
      { name: "Mustard Cake (Khal)", nameUr: "سرسوں کھل", months: ALL_MONTHS },
      { name: "Taara Meera Oil", nameUr: "تارا میرا تیل", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
    ],
  },
  {
    id: "livestock",
    name: "Livestock",
    nameUr: "لائیو اسٹاک",
    type: "vertical",
    icon: livestockImg,
    pricePerMonth: 5000,
    varieties: [
      { name: "Cow (Desi/Sahiwal)", nameUr: "گائے (دیسی/ساہیوال)", months: ALL_MONTHS },
      { name: "Buffalo (Nili Ravi)", nameUr: "بھینس (نیلی راوی)", months: ALL_MONTHS },
      { name: "Goat (Teddy/Beetal)", nameUr: "بکرا (ٹیڈی/بیتل)", months: ALL_MONTHS },
      { name: "Sheep (Dumba/Kajli)", nameUr: "دنبہ / کجلی", months: ALL_MONTHS },
      { name: "Bull (Qurbani)", nameUr: "قربانی بیل", months: ["May", "Jun", "Jul", "Aug"] },
      { name: "Calf (Wachha)", nameUr: "بچھڑا", months: ALL_MONTHS },
    ],
  },
  {
    id: "kiryana",
    name: "Kiryana",
    nameUr: "کریانہ",
    type: "vertical",
    icon: kiryanaImg,
    pricePerMonth: 5000,
    varieties: [
      { name: "Tea (Chai Patti)", nameUr: "چائے پتی", months: ALL_MONTHS },
      { name: "Salt (Namak)", nameUr: "نمک", months: ALL_MONTHS },
      { name: "Dry Spices Mix", nameUr: "مکس گرم مصالحہ", months: ALL_MONTHS },
      { name: "Vermicelli (Sawaiyan)", nameUr: "سویاں", months: ALL_MONTHS },
      { name: "Baking Soda", nameUr: "میٹھا سوڈا", months: ALL_MONTHS },
      { name: "Vinegar (Sirka)", nameUr: "سرکہ", months: ALL_MONTHS },
    ],
  },

  // ─── PRODUCT-WISE SUBSCRIPTIONS (DIRECT PRODUCTS IN 2-COLUMN GRID) ─────────
  {
    id: "wheat",
    name: "Wheat",
    nameUr: "گندم",
    type: "product",
    icon: wheatImg,
    pricePerMonth: 3000,
    varieties: [
      { name: "Wheat (Gandum)", nameUr: "گندم", months: ALL_MONTHS },
      { name: "Flour (Atta)", nameUr: "آٹا", months: ALL_MONTHS },
      { name: "Refined Flour (Maida)", nameUr: "میدہ", months: ALL_MONTHS },
      { name: "Wheat Straw (Toori)", nameUr: "توڑی", months: ALL_MONTHS },
      { name: "Sooji", nameUr: "سوجی", months: ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
    ],
  },
  {
    id: "maize",
    name: "Maize",
    nameUr: "مکئی",
    type: "product",
    icon: maizeImg,
    pricePerMonth: 3000,
    varieties: [
      { name: "Maize - Grade A", nameUr: "مکئی گریڈ A", months: ALL_MONTHS },
      { name: "Maize - Grade B", nameUr: "مکئی گریڈ B", months: ALL_MONTHS },
      { name: "Corn Silage", nameUr: "مکئی سائیلج", months: ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
    ],
  },
  {
    id: "rice",
    name: "Rice",
    nameUr: "چاول",
    type: "product",
    icon: riceImg,
    pricePerMonth: 3000,
    varieties: [
      { name: "Super Basmati", nameUr: "سپر باسپتی", months: ALL_MONTHS },
      { name: "Kainat 1121", nameUr: "کائنات ۱۱۲۱", months: ALL_MONTHS },
      { name: "1509 Sella", nameUr: "۱۵۰۹ سیلا", months: ALL_MONTHS },
      { name: "Irri 6", nameUr: "اری ۶", months: ALL_MONTHS },
      { name: "Paddy 1509", nameUr: "دھان ۱۵۰۹", months: ALL_MONTHS },
      { name: "Paddy Super", nameUr: "دھان سپر", months: ALL_MONTHS },
    ],
  },
  {
    id: "pulses",
    name: "Pulses",
    nameUr: "دالیں",
    type: "product",
    icon: pulsesImg,
    pricePerMonth: 3000,
    varieties: [
      { name: "Moong Washed", nameUr: "دھلی مونگ", months: ALL_MONTHS },
      { name: "Masoor Red", nameUr: "دال مسور لال", months: ALL_MONTHS },
      { name: "Mash Washed", nameUr: "دھلی ماش", months: ALL_MONTHS },
      { name: "Gram Pulse (Daal Chana)", nameUr: "دال چنا", months: ALL_MONTHS },
      { name: "Gram White (Kabuli)", nameUr: "سفید چنا", months: ALL_MONTHS },
      { name: "Red Lubya", nameUr: "لال لوبیا", months: ALL_MONTHS },
    ],
  },
  {
    id: "sugar",
    name: "Sugar",
    nameUr: "چینی",
    type: "product",
    icon: sugarImg,
    pricePerMonth: 3000,
    varieties: [
      { name: "Refined Sugar", nameUr: "ریفائنڈ چینی", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
      { name: "Jaggery (Gur)", nameUr: "گڑ", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Shakkar", nameUr: "شکر", months: ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
    ],
  },
  {
    id: "millet",
    name: "Millet",
    nameUr: "باجرہ",
    type: "product",
    icon: milletImg,
    pricePerMonth: 3000,
    varieties: [
      { name: "Millet - Grade A", nameUr: "باجرہ گریڈ A", months: ALL_MONTHS },
      { name: "Millet - Grade B", nameUr: "باجرہ گریڈ B", months: ALL_MONTHS },
      { name: "Millet - Grade C", nameUr: "باجرہ گریڈ C", months: ["Apr", "Oct", "Nov", "Dec"] },
    ],
  },
  {
    id: "cotton",
    name: "Cotton",
    nameUr: "کپاس",
    type: "product",
    icon: cottonImg,
    pricePerMonth: 3000,
    varieties: [
      { name: "Seed Cotton (Phutti)", nameUr: "پھٹی", months: ALL_MONTHS },
      { name: "Cottonseed (Banola)", nameUr: "بنولہ", months: ALL_MONTHS },
      { name: "Cottonseed Cake", nameUr: "بنولہ کھل", months: ALL_MONTHS },
      { name: "Cottonseed Oil", nameUr: "بنولہ تیل", months: ALL_MONTHS },
    ],
  },
  {
    id: "sesame",
    name: "Sesame",
    nameUr: "تل",
    type: "product",
    icon: sesameImg,
    pricePerMonth: 3000,
    varieties: [
      { name: "Sesame - Grade A", nameUr: "تل گریڈ A", months: ALL_MONTHS },
      { name: "Sesame - Grade B", nameUr: "تل گریڈ B", months: ALL_MONTHS },
    ],
  },
  {
    id: "spices",
    name: "Spices",
    nameUr: "مصالحہ جات",
    type: "product",
    icon: spicesImg,
    pricePerMonth: 3000,
    varieties: [
      { name: "Red Chilli", nameUr: "لال مرچ", months: ALL_MONTHS },
      { name: "Turmeric (Haldi)", nameUr: "ہلدی", months: ALL_MONTHS },
      { name: "Coriander", nameUr: "خشک دھنیا", months: ALL_MONTHS },
      { name: "Cumin (Zeera)", nameUr: "زیرہ", months: ALL_MONTHS },
      { name: "Black Pepper", nameUr: "کالی مرچ", months: ALL_MONTHS },
    ],
  },
  {
    id: "dry_fruits",
    name: "Dry Fruits",
    nameUr: "خشک میوہ جات",
    type: "product",
    icon: dryfruitsImg,
    pricePerMonth: 3000,
    varieties: [
      { name: "Almond", nameUr: "بادام", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Pistachio", nameUr: "پستہ", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Cashew", nameUr: "کاجو", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Walnut", nameUr: "اخروٹ", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
    ],
  },
  {
    id: "dates",
    name: "Dates",
    nameUr: "کھجور",
    type: "product",
    icon: datesImg,
    pricePerMonth: 3000,
    varieties: [
      { name: "Aseel Dates", nameUr: "اصیل کھجور", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Aseel Chuara", nameUr: "اصیل چھوہارا", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Mazafati Dates", nameUr: "مضافاتی کھجور", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Zahidi Dates", nameUr: "زاہدی کھجور", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
    ],
  },
  {
    id: "herbals",
    name: "Herbals",
    nameUr: "جڑی بوٹیاں",
    type: "product",
    icon: herbalsImg,
    pricePerMonth: 3000,
    varieties: [
      { name: "Ispaghol Husk", nameUr: "اسپغول چھلکا", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Nov", "Dec"] },
      { name: "Kalonji", nameUr: "کلونجی", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Dec"] },
      { name: "Chia Seed", nameUr: "چیا سیڈز", months: ["Jan", "Jul", "Sep", "Oct", "Nov", "Dec"] },
      { name: "Tukh Malanga", nameUr: "تخم ملنگا", months: ["Jan", "Feb", "Sep", "Oct", "Nov", "Dec"] },
    ],
  },
];

/**
 * Returns list of packages that have at least 1 variety active in the given month.
 * Also attaches the list of active varieties for that month.
 */
export function getPackagesForMonth(monthKey: string) {
  return SEASON_PACKAGES.map((pkg) => {
    const activeVarieties = pkg.varieties.filter((v) => v.months.includes(monthKey));
    return {
      ...pkg,
      activeVarieties,
      varietyCount: activeVarieties.length,
      isAvailable: activeVarieties.length > 0,
    };
  })
    .filter((pkg) => pkg.isAvailable)
    .sort((a, b) => b.varietyCount - a.varietyCount);
}

export function getVarietyIcon(pkgId: string, varietyName: string): string {
  const v = (varietyName || "").toLowerCase().trim();
  if (pkgId === "fruits") {
    if (v.includes("apple")) return appleImg;
    if (v.includes("banana")) return bananaImg;
    if (v.includes("grape")) return grapesImg;
    if (v.includes("mango")) return mangoImg;
    return fruitsImg;
  }
  if (pkgId === "vegetables") {
    if (v.includes("tomato")) return "/src/icons/by-products/vegetables/Tomato.png";
    if (v.includes("onion")) return "/src/icons/by-products/vegetables/Onion.png";
    if (v.includes("potato")) return "/src/icons/by-products/vegetables/Potato-Red.png";
    if (v.includes("garlic")) return "/src/icons/by-products/vegetables/Garlic-Desi.png";
    if (v.includes("ginger")) return "/src/icons/by-products/vegetables/Ginger.png";
    if (v.includes("cucumber")) return "/src/icons/by-products/vegetables/Cucumber.png";
    if (v.includes("carrot")) return "/src/icons/by-products/vegetables/Carrot.png";
    if (v.includes("pea")) return "/src/icons/by-products/vegetables/Peas.png";
    if (v.includes("cauliflower")) return "/src/icons/by-products/vegetables/Cauliflower.png";
    if (v.includes("cabbage")) return "/src/icons/by-products/vegetables/Cabbage.png";
    if (v.includes("capsicum")) return "/src/icons/by-products/vegetables/Capsicum.png";
    if (v.includes("spinach")) return "/src/icons/by-products/vegetables/Spinach.png";
    if (v.includes("turnip")) return "/src/icons/by-products/vegetables/Turnip.png";
    if (v.includes("okra")) return "/src/icons/by-products/vegetables/Okra.png";
    if (v.includes("gourd")) return "/src/icons/by-products/vegetables/Bottle-Gourd.png";
    if (v.includes("brinjal")) return "/src/icons/by-products/vegetables/Brinjal-Round.png";
    if (v.includes("broccoli")) return "/src/icons/by-products/vegetables/Broccoli.png";
    return vegetablesImg;
  }
  if (pkgId === "edible_oils" || pkgId === "edible") {
    if (v.includes("mustard oil")) return "/src/icons/by-products/mustard/Mustard-Oil.png";
    if (v.includes("canola oil")) return "/src/icons/by-products/edibleoils/Canola-Oil.png";
    if (v.includes("sunflower oil")) return "/src/icons/by-products/edibleoils/Sunflower-Oil.png";
    if (v.includes("soybean")) return "/src/icons/by-products/edibleoils/Soybean.png";
    if (v.includes("mustard seed")) return "/src/icons/by-products/mustard/Mustard-Seed.png";
    if (v.includes("canola seed")) return "/src/icons/by-products/edibleoils/Canola-Seed.png";
    if (v.includes("cake") || v.includes("khal")) return "/src/icons/by-products/mustard/Mustard-Cake.png";
    return edibleImg;
  }
  if (pkgId === "livestock") return livestockImg;
  if (pkgId === "kiryana") return kiryanaImg;
  return fruitsImg;
}

