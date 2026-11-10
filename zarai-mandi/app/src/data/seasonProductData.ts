// Season Product and By-Product Data Availability
// Source: Crops Seasons (1)(4).xlsx

import {
  getVerticalForProduct,
  PRODUCT_DIVISIONS,
  PRODUCT_PRICE_PER_MONTH,
} from "../customer-face/shared/data/catalog";
import { getproductIconSrc } from "../customer-face/shared/data/icons";
import type { ProdDiv, ProductGroupId } from "../customer-face/shared/types";

import fruitsImg from "../icons/products/fruits200.png";
import vegetablesImg from "../icons/products/vegetables200.png";
import wheatImg from "../icons/products/wheat200.png";
import riceImg from "../icons/products/rice200.png";
import pulsesImg from "../icons/products/pulses200.png";
import maizeImg from "../icons/products/maize200.png";
import cottonImg from "../icons/products/cotton200.png";
import spicesImg from "../icons/products/spices200.png";
import sesameImg from "../icons/products/sesame200.png";
import dryfruitsImg from "../icons/products/dryfruits200.png";
import datesImg from "../icons/products/dates200.png";
import sugarImg from "../icons/products/sugar200.png";
import edibleImg from "../icons/products/edible200.png";
import herbalsImg from "../icons/products/herbals200.png";
import milletImg from "../icons/products/millet200.png";
import kiryanaImg from "../icons/products/kiryana200.png";

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

// Which months each crop / fruit / vegetable is in season (the source sheet).
const SEASON_SOURCE: SeasonPackage[] = [
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
      { name: "Kainat 1121", nameUr: "کائنات 1121", months: ALL_MONTHS },
      { name: "1509 Sella", nameUr: "1509 سیلا", months: ALL_MONTHS },
      { name: "Irri 6", nameUr: "اری 6", months: ALL_MONTHS },
      { name: "Paddy 1509", nameUr: "دھان 1509", months: ALL_MONTHS },
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

/** A product in the Complete Profile list: every product sold on its own, one price. */
export interface SeasonProduct {
  id: string;
  name: string;
  group: ProductGroupId;
  icon: string;
  pricePerMonth: number;
  /** Months it is in season (all year unless the season sheet says otherwise). */
  months: string[];
}

const normName = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
const SOURCE_FOR_GROUP: Partial<Record<ProductGroupId, string>> = { fruits: "fruits", vegetables: "vegetables" };

/** A product's months: its fruit / vegetable varieties' months, or its crop package's. */
function monthsFor(d: ProdDiv): string[] {
  const names = [d.name, ...(d.byproducts || [])].map(normName);
  const source = SOURCE_FOR_GROUP[d.group];
  const varieties = source
    ? (SEASON_SOURCE.find((p) => p.id === source)?.varieties || []).filter((v) =>
        names.some((n) => n.includes(normName(v.name)) || normName(v.name).includes(n)),
      )
    : d.group === "crops"
      ? SEASON_SOURCE.find((p) => p.type === "product" && normName(p.name) === normName(d.name))?.varieties || []
      : [];
  const months = new Set(varieties.flatMap((v) => v.months));
  return months.size ? MONTH_KEYS.filter((m) => months.has(m)) : [...ALL_MONTHS];
}

export const SEASON_PACKAGES: SeasonProduct[] = PRODUCT_DIVISIONS.map((d) => ({
  id: d.name.toLowerCase(),
  name: d.name,
  group: d.group,
  icon: getproductIconSrc(d.name, getVerticalForProduct(d.name)),
  pricePerMonth: PRODUCT_PRICE_PER_MONTH,
  months: monthsFor(d),
}));

/** The products in season in a month, in catalog order. */
export function getPackagesForMonth(monthKey: string): SeasonProduct[] {
  return SEASON_PACKAGES.filter((p) => p.months.includes(monthKey));
}
