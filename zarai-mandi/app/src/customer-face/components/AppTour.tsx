import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { speakText, stopSpeaking } from "../shared/voice";

// ─── APP TUTORIAL ─────────────────────────────────────────────────────────────
// The first time Home opens, the app asks whether the user wants a tutorial.
// Yes: every screen, the first time it opens, shows an overview — all its parts
// lit and numbered at once, with a list of what each is. From there the user
// taps any number to learn about that part (and can keep using the screen), or
// picks "Guide me step by step": each button and filter one at a time, with
// "Try it" steps where the user taps the real button (a filter, a rate type, a
// period) and the next step shows what changed. No: nothing is shown.
// Account → App Tour turns the tutorial on again from the start.
// The test link takes ?tour=0 (no tutorial) or ?tour=1 (ask again, fresh).

const STORE_KEY = "zm_tutorial_v2";

export type TourScreen = "home" | "profile" | "viewall" | "account" | "product" | "rates" | "trends" | "news";
type Mode = "ask" | "on" | "off";
type Store = { mode: Mode; seen: TourScreen[] };

function readStore(): Store {
  try {
    const s = JSON.parse(window.localStorage.getItem(STORE_KEY) || "null");
    if (s && (s.mode === "on" || s.mode === "off" || s.mode === "ask")) return { mode: s.mode, seen: Array.isArray(s.seen) ? s.seen : [] };
  } catch {
    /* blocked storage: ask */
  }
  return { mode: "ask", seen: [] };
}
// Kept in memory too, so nothing repeats in a session where storage is blocked.
let store: Store | null = null;
const getStore = () => (store ??= readStore());
function saveStore(next: Partial<Store>) {
  store = { ...getStore(), ...next };
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* private mode */
  }
}
function markSeen(screen: TourScreen) {
  const s = getStore();
  if (!s.seen.includes(screen)) saveStore({ seen: [...s.seen, screen] });
}
/** Account → App Tour: the tutorial is on again, every screen from the start. */
export function resetScreenTips() {
  saveStore({ mode: "on", seen: [] });
}

type Txt = { en: string; ur: string };
type Step = {
  /** data-tour name or a CSS selector; none = a card in the middle */
  target?: string;
  title: Txt;
  body: Txt;
  /** "Try it": the user taps the lit part themselves (no Next button) */
  act?: Txt;
  /** the "Try it" step is done when this is true … */
  until?: () => boolean;
  /** … or when this value changes from what it was when the step began */
  watch?: () => string;
  /** the part closed without the change (e.g. a picker shut): go one step back */
  backIfGone?: boolean;
  /** this step leaves the screen: the walkthrough ends here */
  leaves?: boolean;
  /** how the part reads in the screen overview; false = not a part (a "this changed" step) */
  overview?: false | { title?: Txt; body?: Txt };
};

const t = (en: string, ur: string): Txt => ({ en, ur });
const sel = (s: string) => (/^[a-z][\w-]*$/.test(s) ? `[data-tour="${s}"]` : s);

/** On screen and not hidden (closed drawers keep their size but are hidden or moved off). */
function visibleEl(s: string): HTMLElement | null {
  const el = document.querySelector<HTMLElement>(sel(s));
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  if (r.right <= 1 || r.left >= window.innerWidth - 1) return null;
  if (getComputedStyle(el).visibility === "hidden") return null;
  return el;
}
/** Something else (a sticky header, the bottom bar) sits over the middle of its top or bottom edge. */
function covered(el: HTMLElement, r: DOMRect): boolean {
  const x = Math.min(Math.max(r.left + r.width / 2, 1), window.innerWidth - 1);
  for (const y of [r.top + Math.min(8, r.height / 2), r.bottom - Math.min(8, r.height / 2)]) {
    if (y < 0 || y > window.innerHeight) return true;
    const hit = document.elementsFromPoint(x, y).find((n) => !n.closest(".zm-tour"));
    if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) return true;
  }
  return false;
}
const text = (s: string) =>document.querySelector(sel(s))?.textContent?.trim() || "";

const FIRST_CARD = '[data-tour="bp-cards"] > :first-child';
const inCard = (part: string) => `${FIRST_CARD} [data-tour="${part}"]`;

// Which screen is on top, checked in this order (sheets and pages sit over Home).
const DETECT: [TourScreen, string][] = [
  ["profile", "profile-sheet"],
  ["account", "acc-profile"],
  ["viewall", "viewall-group"],
  ["trends", "rates-trends"],
  ["rates", "rates-hero"],
  ["product", FIRST_CARD],
  ["news", "reels-tabs"],
  ["home", "products"],
];
function topScreen(): TourScreen | null {
  for (const [s, q] of DETECT) if (visibleEl(q)) return s;
  return null;
}

// ─── THE STEPS, SCREEN BY SCREEN ─────────────────────────────────────────────

const STEPS: Record<TourScreen, Step[]> = {
  home: [
    { target: "lang", title: t("Language", "زبان"), body: t("Tap to switch the whole app between English and Urdu.", "پوری ایپ کو اردو اور انگریزی میں بدلنے کے لیے دبائیں۔") },
    { target: "voice", title: t("Voice", "آواز"), body: t("Turn voice on and the app reads out the rates and buttons you tap.", "آواز آن کریں تو ایپ ریٹس اور بٹن پڑھ کر سناتی ہے۔") },
    { target: "bell", title: t("Alerts", "الرٹس"), body: t("Market alerts and notices about your products come here.", "آپ کی مصنوعات کے منڈی الرٹس اور اطلاعات یہاں آتی ہیں۔") },
    { target: "account", title: t("Account & profile", "اکاؤنٹ اور پروفائل"), body: t("Your profile, subscriptions, language and help. 'App Tour' in here starts this tutorial again.", "آپ کی پروفائل، سبسکرپشن، زبان اور مدد۔ یہاں 'ایپ کا تعارف' سے یہ رہنمائی دوبارہ شروع ہوتی ہے۔") },
    { target: "edit-name", title: t("Your name and city", "آپ کا نام اور شہر"), body: t("Tap Edit to change your name and location.", "نام اور مقام بدلنے کے لیے ترمیم دبائیں۔") },
    { target: "search", title: t("Search", "تلاش"), body: t("Type any product, like cotton seed or flour, to jump straight to its rates.", "کوئی بھی چیز لکھیں، جیسے بنولہ یا آٹا، اور سیدھا اس کے ریٹس پر جائیں۔") },
    { target: "profile", title: t("Complete your profile", "پروفائل مکمل کریں"), body: t("3 short steps: pick products, choose months, pay. This unlocks every rate.", "3 آسان مراحل: مصنوعات چنیں، مہینے چنیں، ادائیگی کریں۔ اس سے تمام ریٹس کھل جاتے ہیں۔") },
    { target: "products-row", title: t("Your products", "آپ کی مصنوعات"), body: t("Swipe sideways for more. 'Active' means today's rates are in.", "مزید کے لیے دائیں بائیں سوائپ کریں۔ 'فعال' کا مطلب آج کے ریٹ آ گئے ہیں۔") },
    { target: "viewall", title: t("View All", "سب دیکھیں"), body: t("Every product in groups: Grains, Oils, Fruits, Vegetables and more.", "تمام مصنوعات گروپس میں: اناج، تیل، پھل، سبزیاں اور مزید۔") },
    { target: "favorites", title: t("Favourites", "پسندیدہ"), body: t("Rates you save with the ☆ star show up here, so you can see them first.", "جن ریٹس پر آپ ☆ ستارہ لگائیں وہ یہاں سب سے پہلے نظر آتے ہیں۔") },
    { target: "nav-home", title: t("Home", "ہوم"), body: t("Brings you back to this screen from anywhere.", "کہیں سے بھی اس اسکرین پر واپس لاتا ہے۔") },
    { target: "nav-news", title: t("Entertainment", "تفریح"), body: t("Short videos: mandi news, farming tips and harvest updates.", "مختصر ویڈیوز: منڈی کی خبریں، کاشتکاری کے مشورے اور فصل کی خبریں۔") },
    { target: "nav-settings", title: t("Settings", "ترتیبات"), body: t("Your account, language, help, and the App Tour.", "آپ کا اکاؤنٹ، زبان، مدد، اور ایپ کا تعارف۔") },
    {
      target: '[data-tour="products-row"] [data-home-product]',
      title: t("Let's open a product", "آئیں ایک پروڈکٹ کھولیں"),
      body: t("We'll keep going on the next screen.", "اگلی اسکرین پر رہنمائی جاری رہے گی۔"),
      act: t("Tap this product", "اس پروڈکٹ پر ٹیپ کریں"),
      until: () => !!visibleEl(FIRST_CARD) || !!visibleEl("bp-filters"),
      leaves: true,
      overview: { title: t("A product", "ایک پروڈکٹ"), body: t("Tap any product to see all its rates.", "کسی بھی پروڈکٹ کے تمام ریٹس دیکھنے کے لیے اس پر دبائیں۔") },
    },
  ],

  product: [
    { target: "bp-back", title: t("Back", "واپس"), body: t("Takes you back to the screen before.", "پچھلی اسکرین پر لے جاتا ہے۔") },
    { target: "bp-title", title: t("Product", "پروڈکٹ"), body: t("The product and how many by-products it has, e.g. Wheat → Flour, Bran, Maida.", "پروڈکٹ اور اس کی کتنی ضمنی مصنوعات ہیں، جیسے گندم ← آٹا، چوکر، میدہ۔") },
    { target: "bp-date", title: t("Date", "تاریخ"), body: t("Rates are for this day (Islamic date beside it). Tap to pick an earlier day.", "ریٹ اس دن کے ہیں (ساتھ اسلامی تاریخ)۔ پچھلا دن چننے کے لیے دبائیں۔") },
    { target: inCard("card-name"), title: t("One card per by-product", "ہر ضمنی مصنوع کا ایک کارڈ"), body: t("Its name, and the rate type the numbers are for (Stock, Mandi, Wholesale…).", "اس کا نام، اور کس ریٹ کی قسم کے یہ نمبر ہیں (اسٹاک، منڈی، ہول سیل…)۔") },
    { target: inCard("card-minmax"), title: t("Average min and max", "اوسط کم اور زیادہ"), body: t("The average lowest and highest rate today, per 40 kg.", "آج کا اوسط کم سے کم اور زیادہ سے زیادہ ریٹ، فی 40 کلو۔") },
    { target: inCard("card-arrival"), title: t("Arrival and quality", "آمد اور معیار"), body: t("Total bags that came into the mandis, and the crop or quality.", "منڈیوں میں آنے والی کل بوریاں، اور فصل یا معیار۔") },
    { target: inCard("card-loc"), title: t("Locations and time", "مقامات اور وقت"), body: t("How many mandis sent a rate, and how long ago it was updated.", "کتنی منڈیوں نے ریٹ بھیجا، اور کتنی دیر پہلے اپڈیٹ ہوا۔") },
    {
      target: "bp-filters",
      title: t("Filters", "فلٹر"),
      body: t("Let's try them. Filters change what every card shows.", "آئیں آزما کر دیکھیں۔ فلٹر سے ہر کارڈ کی معلومات بدلتی ہے۔"),
      act: t("Tap Filters", "فلٹر پر ٹیپ کریں"),
      until: () => !!visibleEl("bp-rate-types"),
      overview: { body: t("Rate type, attribute and company. They change what every card shows; the number says how many are on.", "ریٹ کی قسم، خصوصیت اور کمپنی۔ ان سے ہر کارڈ کی معلومات بدلتی ہے؛ نمبر بتاتا ہے کتنے فلٹر لگے ہیں۔") },
    },
    {
      target: "bp-rate-types",
      title: t("Rate type", "ریٹ کی قسم"),
      body: t("Stock, Mandi, Wholesale, Ex-Mill… each is a different price. Pick one and watch the cards.", "اسٹاک، منڈی، ہول سیل، ایکس مل… ہر ایک الگ قیمت ہے۔ ایک چنیں اور کارڈ دیکھیں۔"),
      act: t("Pick a rate type", "ریٹ کی قسم چنیں"),
      watch: () => text('[data-tour="bp-rate-types"] [aria-checked="true"]'),
      backIfGone: true,
    },
    { target: FIRST_CARD, title: t("The cards changed", "کارڈ بدل گئے"), body: t("Every card now shows that rate type only. Cards without it are hidden.", "اب ہر کارڈ صرف وہی ریٹ دکھا رہا ہے۔ جن کے پاس یہ ریٹ نہیں وہ چھپ گئے۔"), overview: false },
    { target: "bp-attrs", title: t("Special attribute", "خصوصی وصف"), body: t("Narrow down further: quality, crop year, moisture and more. Tap again to remove.", "مزید چھانٹیں: معیار، فصل کا سال، نمی وغیرہ۔ ہٹانے کے لیے دوبارہ دبائیں۔") },
    { target: "bp-company", title: t("Company", "کمپنی"), body: t("Show only the brands you want.", "صرف اپنی پسند کی کمپنیاں دکھائیں۔") },
    { target: "bp-reset", title: t("Reset", "ری سیٹ"), body: t("Clears every filter at once.", "تمام فلٹر ایک ساتھ صاف کرتا ہے۔") },
    {
      target: "bp-show",
      title: t("Show results", "نتائج دکھائیں"),
      body: t("Closes the filters so the cards use the whole screen.", "فلٹر بند کرتا ہے تاکہ کارڈ پوری اسکرین پر آئیں۔"),
      act: t("Tap Show results", "نتائج دکھائیں پر ٹیپ کریں"),
      until: () => !visibleEl("bp-drawer"),
    },
    { target: "bp-filters", title: t("Filters on", "فلٹر لگے ہوئے"), body: t("The number shows how many filters are on. Open Filters and tap Reset to see everything again.", "نمبر بتاتا ہے کتنے فلٹر لگے ہیں۔ سب دوبارہ دیکھنے کے لیے فلٹر کھول کر ری سیٹ دبائیں۔") },
    {
      target: FIRST_CARD,
      title: t("Every mandi's rate", "ہر منڈی کا ریٹ"),
      body: t("A card opens its rate in every mandi, with charts. We'll continue there.", "کارڈ کھولنے پر ہر منڈی کا ریٹ اور چارٹ آتے ہیں۔ رہنمائی وہیں جاری رہے گی۔"),
      act: t("Tap the card", "کارڈ پر ٹیپ کریں"),
      until: () => !!visibleEl("rates-hero"),
      leaves: true,
      overview: { title: t("A by-product card", "ضمنی مصنوع کا کارڈ"), body: t("Tap a card for its rate in every mandi, with charts.", "ہر منڈی کا ریٹ اور چارٹ دیکھنے کے لیے کارڈ پر دبائیں۔") },
    },
  ],

  rates: [
    { target: "rates-back", title: t("Back", "واپس"), body: t("Back to the cards.", "کارڈز پر واپس۔") },
    { target: "rates-title", title: t("Switch by-product", "ضمنی مصنوع بدلیں"), body: t("Tap the name to jump to another by-product of the same product.", "اسی پروڈکٹ کی دوسری ضمنی مصنوع پر جانے کے لیے نام دبائیں۔") },
    { target: "rates-star", title: t("Save to favourites", "پسندیدہ میں رکھیں"), body: t("Tap the star and this rate shows on Home under Favourites.", "ستارہ دبائیں تو یہ ریٹ ہوم پر پسندیدہ میں آ جائے گا۔") },
    { target: "rates-tabs", title: t("Overview and Trends", "جائزہ اور رجحانات"), body: t("Overview is today's rate. Trends shows how it moved over days and months.", "جائزہ میں آج کا ریٹ ہے۔ رجحانات میں دنوں اور مہینوں کا اتار چڑھاؤ۔") },
    { target: "rail-loc", title: t("Location", "مقام"), body: t("All of Pakistan, or pick a province, district or a single mandi.", "پورا پاکستان، یا کوئی صوبہ، ضلع یا ایک منڈی چنیں۔") },
    { target: "rail-day", title: t("Day", "دن"), body: t("The latest report day. Tap for a calendar of earlier days.", "تازہ رپورٹ کا دن۔ پچھلے دنوں کے کیلنڈر کے لیے دبائیں۔") },
    {
      target: "rail-rate",
      title: t("Rate type", "ریٹ کی قسم"),
      body: t("Let's change it and see the price change.", "آئیں اسے بدل کر قیمت میں فرق دیکھیں۔"),
      act: t("Tap Rate", "ریٹ پر ٹیپ کریں"),
      until: () => !!visibleEl("sheet"),
      overview: { body: t("Stock, Mandi, Wholesale… pick which price you see. A green filter is one you set; its ✕ clears it.", "اسٹاک، منڈی، ہول سیل… چنیں کون سی قیمت دیکھنی ہے۔ سبز فلٹر آپ کا لگایا ہوا ہے؛ اس کا ✕ اسے ہٹاتا ہے۔") },
    },
    {
      target: "sheet",
      title: t("Pick a rate type", "ریٹ کی قسم چنیں"),
      body: t("Each line says how many places reported that rate.", "ہر لائن بتاتی ہے کتنی جگہوں سے یہ ریٹ آیا۔"),
      act: t("Pick a different one", "کوئی اور چنیں"),
      watch: () => text("rail-rate"),
      backIfGone: true,
    },
    { target: "rates-hero", title: t("The price changed", "قیمت بدل گئی"), body: t("The big rate, the chart and the mandi list below now use the rate type you picked.", "بڑا ریٹ، چارٹ اور نیچے منڈیوں کی فہرست اب آپ کی چنی ہوئی قسم کے ہیں۔"), overview: false },
    { target: "rail-rate", title: t("Clear a filter", "فلٹر ہٹائیں"), body: t("A green filter is one you set. Its ✕ clears it and brings back all rates.", "سبز فلٹر آپ کا لگایا ہوا ہے۔ اس کا ✕ اسے ہٹا کر تمام ریٹس واپس لاتا ہے۔") },
    { target: "rail-quality", title: t("Attribute", "خصوصیات"), body: t("Quality, crop year, moisture and the like. Pick one or more.", "معیار، فصل کا سال، نمی وغیرہ۔ ایک یا زیادہ چنیں۔") },
    { target: "hero-listen", title: t("Listen", "سنیں"), body: t("Hear this rate read out loud.", "یہ ریٹ بول کر سنیں۔") },
    { target: "rates-hero", title: t("Today's rate", "آج کا ریٹ"), body: t("Average rate per 40 kg, the change since the last report, a 30-day line, and min, max and arrival.", "فی 40 کلو اوسط ریٹ، پچھلی رپورٹ سے فرق، 30 دن کی لکیر، اور کم، زیادہ اور آمد۔") },
    { target: "rates-dots", title: t("More pages", "مزید صفحات"), body: t("Swipe the rate card sideways for Best mandis and the Map.", "بہترین منڈیوں اور نقشے کے لیے ریٹ کارڈ کو سوائپ کریں۔") },
    { target: "mandi-view", title: t("Table or cards", "ٹیبل یا کارڈز"), body: t("See every mandi as a table or as a list of cards.", "ہر منڈی کو ٹیبل یا کارڈز کی شکل میں دیکھیں۔") },
    { target: "mandi-head", title: t("Sort and filter", "ترتیب اور فلٹر"), body: t("Tap a column heading to sort by price, arrival or name, or filter by it.", "قیمت، آمد یا نام سے ترتیب یا فلٹر کے لیے کالم کا عنوان دبائیں۔") },
    { target: '[data-tour="mandi-table"] tbody tr', title: t("One mandi", "ایک منڈی"), body: t("Each row is one mandi. Tap it for its own chart and history.", "ہر قطار ایک منڈی ہے۔ اس کا چارٹ اور تاریخ دیکھنے کے لیے دبائیں۔") },
    { target: "mandi-more", title: t("Show all", "سب دکھائیں"), body: t("Opens the rest of the list.", "باقی فہرست کھولتا ہے۔") },
    { target: "mandi-full", title: t("Full-screen table", "پوری اسکرین ٹیبل"), body: t("Turns the table sideways with every column.", "ٹیبل کو ہر کالم کے ساتھ پوری اسکرین پر کھولتا ہے۔") },
    {
      target: '[data-tour="rates-tabs"] [data-tab="trends"]',
      title: t("Trends", "رجحانات"),
      body: t("See how this rate moved. We'll continue there.", "دیکھیں یہ ریٹ کیسے بدلا۔ رہنمائی وہیں جاری رہے گی۔"),
      act: t("Tap Trends", "رجحانات پر ٹیپ کریں"),
      until: () => !!visibleEl("rates-trends"),
      leaves: true,
      overview: { body: t("Charts of how this rate moved over days and months.", "دنوں اور مہینوں میں اس ریٹ کے اتار چڑھاؤ کے چارٹ۔") },
    },
  ],

  trends: [
    { target: "tr-mode", title: t("Price or arrivals", "قیمت یا آمد"), body: t("Chart the price, or how many bags arrived.", "قیمت کا چارٹ، یا کتنی بوریاں آئیں۔") },
    {
      target: "tr-period",
      title: t("Period", "مدت"),
      body: t("1 day up to 1 year. Pick another one and watch the chart.", "1 دن سے 1 سال تک۔ کوئی اور مدت چنیں اور چارٹ دیکھیں۔"),
      act: t("Tap another period, e.g. 1M", "کوئی اور مدت دبائیں"),
      watch: () => text('[data-tour="tr-period"] [aria-pressed="true"]'),
      overview: { body: t("1 day up to 1 year. Picking another one redraws the chart.", "1 دن سے 1 سال تک۔ دوسری مدت چننے سے چارٹ بدل جاتا ہے۔") },
    },
    { target: "tr-chart", title: t("The chart changed", "چارٹ بدل گیا"), body: t("Drag for earlier days, hold to read a day's value.", "پچھلے دنوں کے لیے کھسکائیں، کسی دن کی قیمت کے لیے دبائے رکھیں۔"), overview: { title: t("Chart", "چارٹ") } },
    { target: "tr-custom", title: t("Your own dates", "اپنی تاریخیں"), body: t("Pick any start and end date.", "کوئی بھی شروع اور آخری تاریخ چنیں۔") },
    { target: "tr-type", title: t("Line or candles", "لائن یا کینڈل"), body: t("A simple line, or candles that show each day's low and high.", "سادہ لکیر، یا کینڈل جو ہر دن کا کم اور زیادہ دکھائیں۔") },
    { target: '[data-tour="tr-chart"] [data-tour="expand"]', title: t("Full screen", "پوری اسکرین"), body: t("Open the chart on the whole screen.", "چارٹ پوری اسکرین پر کھولیں۔") },
    { target: "tr-types", title: t("Every rate type", "ہر ریٹ کی قسم"), body: t("All rate types side by side. Tap one to chart it.", "تمام ریٹس ساتھ ساتھ۔ چارٹ کے لیے کسی پر دبائیں۔") },
    { target: "rates-tabs", title: t("Back to today", "آج پر واپس"), body: t("Overview brings back today's rate.", "جائزہ سے آج کا ریٹ واپس آتا ہے۔") },
  ],

  viewall: [
    { target: "viewall-back", title: t("Back", "واپس"), body: t("Back to Home.", "ہوم پر واپس۔") },
    { target: "viewall-group", title: t("Groups", "گروپس"), body: t("Products come in groups: Grains, Edible Oils, Fruits, Vegetables, Fertilizer, Dry Fruits, Herbs, Kiryana.", "مصنوعات گروپس میں ہیں: اناج، خوردنی تیل، پھل، سبزیاں، کھاد، خشک میوہ، جڑی بوٹیاں، کریانہ۔") },
    { target: "viewall-open", title: t("Open product", "کھلی پروڈکٹ"), body: t("A green ring means its rates are open. Tap to see them.", "سبز دائرہ مطلب ریٹ کھلے ہیں۔ دیکھنے کے لیے دبائیں۔") },
    { target: "viewall-locked", title: t("Locked product", "بند پروڈکٹ"), body: t("Grey with a lock needs a subscription. Tapping it starts subscribing.", "تالے والی سرمئی پروڈکٹ کے لیے سبسکرپشن چاہیے۔ دبانے سے سبسکرپشن شروع ہوتی ہے۔") },
    { target: "viewall-more", title: t("See more", "مزید دیکھیں"), body: t("Shows the rest of the group.", "گروپ کی باقی مصنوعات دکھاتا ہے۔") },
  ],

  profile: [
    { target: "profile-head", title: t("3 easy steps", "3 آسان مراحل"), body: t("Products, plan, payment. The bar shows which step you're on.", "مصنوعات، پلان، ادائیگی۔ پٹی بتاتی ہے آپ کس مرحلے پر ہیں۔") },
    { target: "profile-body", title: t("Choose", "چنیں"), body: t("Pick your products here. Every product is PKR 2,000 a month.", "یہاں اپنی مصنوعات چنیں۔ ہر پروڈکٹ 2,000 روپے ماہانہ۔") },
    { target: "profile-foot", title: t("Next", "اگلا"), body: t("Moves to the next step. Pay by JazzCash, Easypaisa, card or bank at the end.", "اگلے مرحلے پر لے جاتا ہے۔ آخر میں جاز کیش، ایزی پیسہ، کارڈ یا بینک سے ادائیگی۔") },
  ],

  news: [
    { target: "reels-tabs", title: t("Video types", "ویڈیوز کی اقسام"), body: t("Products, General Info and Baithak. Tap one to switch.", "مصنوعات، عام معلومات اور بیٹھک۔ بدلنے کے لیے دبائیں۔") },
    { target: "reels-filters", title: t("For you, saved, by product", "آپ کے لیے، محفوظ، پروڈکٹ"), body: t("Your feed, the videos you saved, or only one product's videos.", "آپ کی فیڈ، محفوظ کی ہوئی ویڈیوز، یا صرف ایک پروڈکٹ کی ویڈیوز۔") },
    { target: "reels-mute", title: t("Sound", "آواز"), body: t("Turn the sound on or off.", "آواز آن یا بند کریں۔") },
    { target: "reels-min", title: t("Mini player", "چھوٹا پلیئر"), body: t("Shrinks the video so you can keep watching while you check rates.", "ویڈیو چھوٹی ہو جاتی ہے تاکہ ریٹ دیکھتے ہوئے بھی چلتی رہے۔") },
    { target: "reel-actions", title: t("Like, save, share", "پسند، محفوظ، شیئر"), body: t("Like a video, save it for later, or send it to others.", "ویڈیو پسند کریں، بعد کے لیے محفوظ کریں، یا دوسروں کو بھیجیں۔") },
    { title: t("Next video", "اگلی ویڈیو"), body: t("Swipe up for the next video. Double-tap a video to like it.", "اگلی ویڈیو کے لیے اوپر سوائپ کریں۔ پسند کرنے کے لیے دو بار دبائیں۔") },
  ],

  account: [
    { target: "acc-profile", title: t("Your profile", "آپ کی پروفائل"), body: t("Name, email, city and your plan. Tap to edit.", "نام، ای میل، شہر اور آپ کا پلان۔ ترمیم کے لیے دبائیں۔") },
    { target: "acc-setup", title: t("Finish setup", "سیٹ اپ مکمل کریں"), body: t("How far your profile is, and a button to continue.", "پروفائل کتنی مکمل ہے، اور جاری رکھنے کا بٹن۔") },
    { target: "acc-account", title: t("Subscriptions", "سبسکرپشنز"), body: t("Your plans, and how to become a mandi representative.", "آپ کے پلان، اور منڈی نمائندہ بننے کا طریقہ۔") },
    { target: "acc-prefs", title: t("Voice & language", "آواز اور زبان"), body: t("English or Urdu, and voice on or off.", "انگریزی یا اردو، اور آواز آن یا بند۔") },
    { target: "acc-support", title: t("Help and App Tour", "مدد اور ایپ کا تعارف"), body: t("Contact us, and 'App Tour' to run this tutorial again.", "ہم سے رابطہ، اور یہ رہنمائی دوبارہ دیکھنے کے لیے 'ایپ کا تعارف'۔") },
    { target: "acc-legal", title: t("Legal", "قانونی"), body: t("Terms, privacy, and refunds.", "شرائط، رازداری، اور رقم کی واپسی۔") },
    { target: "acc-manage", title: t("Manage account", "اکاؤنٹ کا انتظام"), body: t("Pause or delete your account.", "اکاؤنٹ روکیں یا حذف کریں۔") },
    { target: "acc-logout", title: t("Log out", "لاگ آؤٹ"), body: t("Signs you out of this phone.", "اس فون سے سائن آؤٹ کرتا ہے۔") },
  ],
};

const C = {
  deep: "#064D40",
  primary: "#087F63",
  bright: "#2FAE68",
  mint: "#E8F5EF",
  ink: "#183B34",
  muted: "#52635F",
  glow: "#9BE7C0",
};

// ─── HOST: asks once, then runs each screen's walkthrough on its first visit ──

export function ScreenTips({ enabled }: { enabled: boolean }) {
  const [screen, setScreen] = useState<TourScreen | null>(null);
  const [guided, setGuided] = useState(false);
  const [asking, setAsking] = useState(false);
  const busy = useRef(false);
  busy.current = !!screen || asking;

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tour") === "1") saveStore({ mode: "ask", seen: [] });
  }, []);

  useEffect(() => {
    if (!enabled || new URLSearchParams(window.location.search).get("tour") === "0") return;
    let last: TourScreen | null = null;
    let since = 0;
    const id = window.setInterval(() => {
      if (busy.current) return;
      const s = topScreen();
      if (s !== last) {
        last = s;
        since = Date.now();
        return;
      }
      // Let the screen settle (data loaded, animations done) before starting.
      if (!s || Date.now() - since < 900) return;
      const { mode, seen } = getStore();
      if (mode === "ask" && s === "home") setAsking(true);
      else if (mode === "on" && !seen.includes(s)) setScreen(s);
    }, 250);
    return () => window.clearInterval(id);
  }, [enabled]);

  if (asking)
    return (
      <AskTutorial
        onAnswer={(yes) => {
          saveStore({ mode: yes ? "on" : "off" });
          setAsking(false);
          if (yes) {
            setGuided(false);
            setScreen("home");
          }
        }}
      />
    );
  if (!screen) return null;
  const close = (stopAll: boolean) => {
    markSeen(screen);
    if (stopAll) saveStore({ mode: "off" });
    setGuided(false);
    setScreen(null);
  };
  if (!guided) return <Overview key={`o-${screen}`} screen={screen} onGuide={() => setGuided(true)} onDone={close} />;
  return (
    <Walkthrough
      key={screen}
      screen={screen}
      steps={STEPS[screen]}
      onDone={close}
    />
  );
}

// ─── "Would you like a tutorial?" ────────────────────────────────────────────

function useTourLang() {
  const { lang, setLang } = useLang();
  const isUr = lang === "ur";
  return { lang, setLang, isUr, L: (x: Txt) => (isUr ? x.ur : x.en), font: isUr ? URDU_FONT : "'Inter', 'Poppins', sans-serif" };
}

function LangSwitch({ small }: { small?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div style={{ display: "flex", background: C.mint, borderRadius: 999, padding: 2, direction: "ltr", flexShrink: 0 }}>
      {(["en", "ur"] as const).map((l) => (
        <button
          key={l}
          onClick={() => {
            stopSpeaking();
            setLang(l);
          }}
          aria-pressed={lang === l}
          style={{
            height: small ? 26 : 30,
            padding: small ? "0 9px" : "0 12px",
            borderRadius: 999,
            fontSize: l === "ur" ? 13 : 11.5,
            fontWeight: 700,
            fontFamily: l === "ur" ? URDU_FONT : "'Inter', sans-serif",
            background: lang === l ? C.primary : "transparent",
            color: lang === l ? "#fff" : C.primary,
          }}
        >
          {l === "en" ? "EN" : "اردو"}
        </button>
      ))}
    </div>
  );
}

function SpeakerButton({ say, label }: { say: string; label: string }) {
  return (
    <button
      onClick={() => speakText(say)}
      aria-label={label}
      title={label}
      style={{ width: 30, height: 30, borderRadius: 999, background: C.mint, display: "grid", placeItems: "center", flexShrink: 0 }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M19 5a10 10 0 0 1 0 14" />
      </svg>
    </button>
  );
}

function Layer({ children, label }: { children: React.ReactNode; label: string }) {
  if (typeof document === "undefined") return null;
  // On <body>, above the app's bottom sheets (z 12000), so pickers can be part of a step.
  return createPortal(
    <div className="zm-tour" role="dialog" aria-modal="true" aria-label={label} style={{ position: "fixed", inset: 0, zIndex: 13000, pointerEvents: "none" }}>
      <style>{TOUR_CSS}</style>
      {children}
    </div>,
    document.body,
  );
}

function AskTutorial({ onAnswer }: { onAnswer: (yes: boolean) => void }) {
  const { isUr, L, font } = useTourLang();
  const title = t("Welcome to Zarai Mandi", "زرعی منڈی میں خوش آمدید");
  const body = t(
    "Would you like a tutorial? On each screen we'll first show you what's there. Then tap any part to learn about it, or let us guide you step by step.",
    "کیا آپ رہنمائی چاہتے ہیں؟ ہر اسکرین پر پہلے ہم دکھائیں گے کہ اس میں کیا ہے۔ پھر کسی بھی حصے کو دبا کر اس کے بارے میں جانیں، یا ہم آپ کو قدم بہ قدم لے چلیں۔",
  );
  useEffect(() => () => stopSpeaking(), []);
  return (
    <Layer label={L(title)}>
      <div className="zm-tour-ask" style={{ position: "absolute", inset: 0, background: "rgba(3, 30, 24, 0.82)" }} />
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 18, fontFamily: font }}>
        <div className="zm-tour-card" dir={isUr ? "rtl" : "ltr"} style={{ width: "100%", maxWidth: 380, background: "#fff", borderRadius: 24, padding: "18px 18px 16px", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${C.bright}, ${C.primary})`, display: "grid", placeItems: "center", flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z" />
              </svg>
            </div>
            <div style={{ flex: 1 }} />
            <LangSwitch />
            <SpeakerButton say={`${L(title)}. ${L(body)}`} label={isUr ? "سنیں" : "Listen"} />
          </div>
          <h2 style={{ margin: 0, fontSize: isUr ? 21 : 19.5, lineHeight: isUr ? 1.7 : 1.3, fontWeight: 800, color: C.ink }}>{L(title)}</h2>
          <p style={{ margin: "6px 0 16px", fontSize: isUr ? 15 : 14, lineHeight: isUr ? 1.9 : 1.55, color: C.muted }}>{L(body)}</p>
          <button
            onClick={() => {
              stopSpeaking();
              onAnswer(true);
            }}
            style={{ width: "100%", height: 48, borderRadius: 999, fontWeight: 800, fontSize: isUr ? 16.5 : 15.5, fontFamily: font, background: `linear-gradient(135deg, ${C.bright}, ${C.primary})`, color: "#fff", boxShadow: "0 6px 16px rgba(8,127,99,0.35)" }}
          >
            {isUr ? "جی ہاں، دکھائیں" : "Yes, show me"}
          </button>
          <button
            onClick={() => {
              stopSpeaking();
              onAnswer(false);
            }}
            style={{ width: "100%", height: 44, marginTop: 6, borderRadius: 999, fontWeight: 700, fontSize: isUr ? 15 : 14, fontFamily: font, background: "transparent", color: C.primary }}
          >
            {isUr ? "ابھی نہیں" : "No, thanks"}
          </button>
          <p style={{ margin: "6px 0 0", textAlign: "center", fontSize: isUr ? 12.5 : 11.5, lineHeight: isUr ? 1.8 : 1.4, color: C.muted }}>
            {isUr ? "بعد میں: اکاؤنٹ ← ایپ کا تعارف" : "Any time later: Account → App Tour"}
          </p>
        </div>
      </div>
    </Layer>
  );
}

// ─── SCREEN OVERVIEW: every part numbered at once; tap one, or be guided ─────

const SCREEN_INFO: Record<TourScreen, { name: Txt; about: Txt }> = {
  home: { name: t("Home", "ہوم"), about: t("Your products, search, favourites and alerts.", "آپ کی مصنوعات، تلاش، پسندیدہ اور الرٹس۔") },
  product: { name: t("Product rates", "پروڈکٹ کے ریٹ"), about: t("One card per by-product with today's average rate. Filters change what the cards show.", "ہر ضمنی مصنوع کا ایک کارڈ، آج کے اوسط ریٹ کے ساتھ۔ فلٹر سے کارڈز کی معلومات بدلتی ہے۔") },
  rates: { name: t("Rate details", "ریٹ کی تفصیل"), about: t("Today's rate, filters for place, day and rate type, and every mandi's rate.", "آج کا ریٹ، مقام، دن اور ریٹ کی قسم کے فلٹر، اور ہر منڈی کا ریٹ۔") },
  trends: { name: t("Trends", "رجحانات"), about: t("How this rate moved over days, months and the year.", "دنوں، مہینوں اور سال میں اس ریٹ کا اتار چڑھاؤ۔") },
  viewall: { name: t("All products", "تمام مصنوعات"), about: t("Every product, in groups.", "تمام مصنوعات، گروپس میں۔") },
  profile: { name: t("Complete profile", "پروفائل مکمل کریں"), about: t("Subscribe in 3 steps to unlock every rate.", "3 مراحل میں سبسکرائب کریں اور تمام ریٹس کھولیں۔") },
  news: { name: t("Videos", "ویڈیوز"), about: t("Short videos on mandi news and farming. Swipe up for the next one.", "منڈی کی خبروں اور کاشتکاری پر مختصر ویڈیوز۔ اگلی کے لیے اوپر سوائپ کریں۔") },
  account: { name: t("Account", "اکاؤنٹ"), about: t("Your profile, plans, language and help.", "آپ کی پروفائل، پلان، زبان اور مدد۔") },
};

type Part = { target: string; title: Txt; body: Txt };
function screenParts(screen: TourScreen): Part[] {
  const done = new Set<string>();
  const out: Part[] = [];
  for (const st of STEPS[screen]) {
    if (!st.target || st.overview === false || done.has(st.target)) continue;
    done.add(st.target);
    if (!visibleEl(st.target)) continue;
    out.push({ target: st.target, title: st.overview?.title ?? st.title, body: st.overview?.body ?? st.body });
  }
  return out;
}

const BADGE = 24;

function Overview({ screen, onGuide, onDone }: { screen: TourScreen; onGuide: () => void; onDone: (stopAll: boolean) => void }) {
  const { isUr, L, font } = useTourLang();
  const info = SCREEN_INFO[screen];
  const [parts, setParts] = useState<Part[]>(() => screenParts(screen));
  const [boxes, setBoxes] = useState<(Box | null)[]>([]);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [pick, setPick] = useState<number | null>(null);
  const [folded, setFolded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const partsRef = useRef(parts);
  partsRef.current = parts;
  const panelRef = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<Box | null>(null);

  const finish = useCallback(
    (stopAll = false) => {
      stopSpeaking();
      onDone(stopAll);
    },
    [onDone],
  );

  // Follow every part (scrolling, loading); leave if the user opened another screen.
  useEffect(() => {
    let away = 0;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const root = rootRef.current;
      if (!root) return;
      const rr = root.getBoundingClientRect();
      const scale = root.offsetWidth ? rr.width / root.offsetWidth : 1;
      const W = root.offsetWidth;
      const H = root.offsetHeight;
      setSize((z) => (z.w === W && z.h === H ? z : { w: W, h: H }));
      const pr = panelRef.current?.getBoundingClientRect();
      const pb = pr ? { x: (pr.left - rr.left) / scale, y: (pr.top - rr.top) / scale, w: pr.width / scale, h: pr.height / scale } : null;
      setPanel((o) => (o && pb && Math.abs(o.x - pb.x) + Math.abs(o.y - pb.y) + Math.abs(o.w - pb.w) + Math.abs(o.h - pb.h) < 1 ? o : pb));
      setBoxes(
        partsRef.current.map((p) => {
          const el = visibleEl(p.target);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          if (r.bottom < 4 || r.top > window.innerHeight - 4) return null;
          const x1 = Math.max(EDGE + PAD, (r.left - rr.left) / scale);
          const y1 = Math.max(EDGE + PAD, (r.top - rr.top) / scale);
          const x2 = Math.min(W - EDGE - PAD, (r.right - rr.left) / scale);
          const y2 = Math.min(H - EDGE - PAD, (r.bottom - rr.top) / scale);
          return { x: x1, y: y1, w: Math.max(8, x2 - x1), h: Math.max(8, y2 - y1) };
        }),
      );
    };
    const soon = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const id = window.setInterval(() => {
      const top = topScreen();
      if (top && top !== screen) {
        away ||= Date.now();
        if (Date.now() - away > 1200) finish();
        return;
      }
      away = 0;
      // Parts that appear late (data still loading) join the list.
      if (partsRef.current.length < STEPS[screen].length) {
        const now = screenParts(screen);
        if (now.length > partsRef.current.length) setParts(now);
      }
      measure();
    }, 200);
    measure();
    window.addEventListener("scroll", soon, true);
    window.addEventListener("resize", soon);
    return () => {
      window.clearInterval(id);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", soon, true);
      window.removeEventListener("resize", soon);
    };
  }, [screen, finish]);

  useEffect(() => () => stopSpeaking(), []);

  const choose = (i: number | null) => {
    stopSpeaking();
    setPick(i);
    if (i == null) return;
    const p = parts[i];
    const el = visibleEl(p.target);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const inNav = !!el.closest("nav") || p.target.startsWith("nav-");
    if (!inNav && (r.top < 0 || r.bottom > window.innerHeight - NAV_H || covered(el, r)) && r.height < window.innerHeight * 0.6) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };

  const { w: W, h: H } = size;
  const sb = pick != null ? boxes[pick] : null;
  // The panel sits at the bottom, or at the top when the chosen part is down there.
  const atTop = !!sb && sb.y + sb.h / 2 > H * 0.5;

  // Number badges at each part's starting corner, nudged apart so none overlap.
  // Corners in order: top-start, top-end, bottom-start, bottom-end; then step along the top.
  const placed: { x: number; y: number }[] = [];
  const hits = (x: number, y: number) =>
    placed.some((q) => Math.abs(q.x - x) < BADGE + 2 && Math.abs(q.y - y) < BADGE + 2) ||
    (!!panel && x + BADGE > panel.x && x < panel.x + panel.w && y + BADGE > panel.y && y < panel.y + panel.h);
  const clampX = (x: number) => Math.min(Math.max(2, x), W - BADGE - 2);
  const clampY = (y: number) => Math.min(Math.max(2, y), H - BADGE - 2);
  const badges = boxes.map((b, i) => {
    if (!b || (pick != null && pick !== i)) return null;
    const L0 = b.x - PAD - 6;
    const R0 = b.x + b.w + PAD - BADGE + 6;
    const T0 = b.y - PAD - 6;
    const B0 = b.y + b.h + PAD - BADGE + 6;
    const [s0, e0] = isUr ? [R0, L0] : [L0, R0];
    const tries: [number, number][] = [[s0, T0], [e0, T0], [s0, B0], [e0, B0]];
    for (let k = 1; k <= 6; k++) tries.push([s0 + (isUr ? -1 : 1) * k * (BADGE + 4), T0]);
    for (const [tx, ty] of tries) {
      const x = clampX(tx);
      const y = clampY(ty);
      if (!hits(x, y)) {
        placed.push({ x, y });
        return { x, y };
      }
    }
    return null; // under the panel, or no room: the list below still has it
  });

  const holes = (pick != null ? [sb] : boxes).filter((b): b is Box => !!b);
  const cur = pick != null ? parts[pick] : null;
  const spoken = cur ? `${L(cur.title)}. ${L(cur.body)}` : `${L(info.name)}. ${L(info.about)} ${parts.map((p, i) => `${i + 1}, ${L(p.title)}`).join(". ")}`;
  const small = { fontSize: isUr ? 12.5 : 11.5, lineHeight: isUr ? 1.8 : 1.4 };

  return (
    <Layer label={L(info.name)}>
      <div ref={rootRef} style={{ position: "absolute", inset: 0, fontFamily: font, pointerEvents: "none" }}>
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
          <defs>
            <mask id="zm-tour-holes">
              <rect width="100%" height="100%" fill="#fff" />
              {holes.map((b, i) => (
                <rect key={i} x={b.x - PAD} y={b.y - PAD} width={b.w + PAD * 2} height={b.h + PAD * 2} rx={Math.min(14, (b.h + PAD * 2) / 2)} fill="#000" />
              ))}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill={pick != null ? "rgba(3, 30, 24, 0.72)" : "rgba(3, 30, 24, 0.5)"} mask="url(#zm-tour-holes)" style={{ transition: "fill .2s" }} />
        </svg>

        {boxes.map((b, i) =>
          b && (pick == null || pick === i) ? (
            <div
              key={`r${i}`}
              className={pick === i ? "zm-tour-ring" : "zm-tour-ring-soft"}
              style={{ position: "absolute", left: b.x - PAD, top: b.y - PAD, width: b.w + PAD * 2, height: b.h + PAD * 2, borderRadius: Math.min(14, (b.h + PAD * 2) / 2) }}
            />
          ) : null,
        )}

        {badges.map((p, i) =>
          p && (pick == null || pick === i) ? (
            <button
              key={`b${i}`}
              className="zm-tour-badge"
              onClick={() => choose(pick === i ? null : i)}
              aria-label={`${i + 1}. ${L(parts[i].title)}`}
              aria-pressed={pick === i}
              style={{
                left: p.x,
                top: p.y,
                background: pick === i ? "#FFD66B" : C.bright,
                color: pick === i ? C.deep : "#fff",
              }}
            >
              {i + 1}
            </button>
          ) : null,
        )}

        <div
          ref={panelRef}
          className="zm-tour-card zm-tour-panel"
          dir={isUr ? "rtl" : "ltr"}
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            maxWidth: 440,
            margin: "0 auto",
            [atTop ? "top" : "bottom"]: 8,
            background: "#fff",
            borderRadius: 22,
            padding: "12px 14px",
            boxShadow: "0 18px 50px rgba(0,0,0,0.38)",
            maxHeight: H * 0.62,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {cur ? (
              <button onClick={() => choose(null)} style={{ display: "flex", alignItems: "center", gap: 4, height: 30, padding: "0 10px 0 6px", borderRadius: 999, background: C.mint, color: C.primary, fontWeight: 700, fontFamily: font, ...small }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isUr ? "scaleX(-1)" : undefined }}>
                  <path d="m15 18-6-6 6-6" />
                </svg>
                {isUr ? "تمام حصے" : "All parts"}
              </button>
            ) : (
              <h2 style={{ margin: 0, fontSize: isUr ? 17 : 16, lineHeight: isUr ? 1.6 : 1.3, fontWeight: 800, color: C.ink }}>{L(info.name)}</h2>
            )}
            <div style={{ flex: 1 }} />
            <LangSwitch small />
            <SpeakerButton say={spoken} label={isUr ? "سنیں" : "Listen"} />
            {!cur && (
              <button
                onClick={() => setFolded((f) => !f)}
                aria-label={folded ? (isUr ? "فہرست دکھائیں" : "Show list") : isUr ? "فہرست چھپائیں" : "Hide list"}
                aria-expanded={!folded}
                style={{ width: 30, height: 30, borderRadius: 999, background: "#F1F4F3", display: "grid", placeItems: "center", flexShrink: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: folded ? "rotate(180deg)" : undefined }}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            )}
            <button
              onClick={() => finish(true)}
              aria-label={isUr ? "رہنمائی بند کریں" : "End tutorial"}
              title={isUr ? "رہنمائی بند کریں" : "End tutorial"}
              style={{ width: 30, height: 30, borderRadius: 999, background: "#F1F4F3", display: "grid", placeItems: "center", flexShrink: 0 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.8" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {cur ? (
            <div key={`p${pick}`} className="zm-tour-fade" style={{ marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: BADGE, height: BADGE, borderRadius: 999, background: "#FFD66B", color: C.deep, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12, flexShrink: 0, fontFamily: "'Inter', sans-serif" }}>{pick! + 1}</span>
                <h3 style={{ margin: 0, fontSize: isUr ? 17.5 : 16, lineHeight: isUr ? 1.7 : 1.3, fontWeight: 800, color: C.ink }}>{L(cur.title)}</h3>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: isUr ? 14.5 : 13.5, lineHeight: isUr ? 1.9 : 1.5, color: C.muted }}>{L(cur.body)}</p>
              {!sb && <p style={{ margin: "4px 0 0", color: C.primary, fontWeight: 600, ...small }}>{isUr ? "یہ حصہ ابھی اسکرین پر نظر نہیں آ رہا۔" : "This part is off the screen right now."}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button disabled={pick === 0} onClick={() => choose(pick! - 1)} style={{ flex: 1, height: 40, borderRadius: 999, fontWeight: 700, fontFamily: font, background: "#F1F4F3", color: C.ink, opacity: pick === 0 ? 0.4 : 1, fontSize: isUr ? 14.5 : 13.5 }}>
                  {isUr ? "پچھلا" : "Previous"}
                </button>
                <button
                  onClick={() => choose(pick! + 1 < parts.length ? pick! + 1 : null)}
                  style={{ flex: 1, height: 40, borderRadius: 999, fontWeight: 800, fontFamily: font, background: `linear-gradient(135deg, ${C.bright}, ${C.primary})`, color: "#fff", fontSize: isUr ? 15 : 14 }}
                >
                  {pick! + 1 < parts.length ? (isUr ? "اگلا حصہ" : "Next part") : isUr ? "تمام حصے" : "All parts"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ margin: "4px 0 0", fontSize: isUr ? 14 : 13, lineHeight: isUr ? 1.85 : 1.45, color: C.muted }}>{L(info.about)}</p>
              {!folded && parts.length > 0 && (
                <>
                  <p style={{ margin: "8px 0 6px", color: C.primary, fontWeight: 700, ...small }}>
                    {isUr ? `اس اسکرین کے ${parts.length} حصے۔ جاننے کے لیے کوئی بھی نمبر دبائیں:` : `${parts.length} parts on this screen. Tap any number to learn about it:`}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, overflowY: "auto", minHeight: 0, flexShrink: 1, paddingBottom: 2 }}>
                    {parts.map((p, i) => (
                      <button
                        key={p.target}
                        onClick={() => choose(i)}
                        style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: isUr ? "0 4px 0 10px" : "0 10px 0 4px", borderRadius: 999, background: C.mint, color: C.ink, fontWeight: 600, fontFamily: font, fontSize: isUr ? 13 : 12.5, whiteSpace: "nowrap" }}
                      >
                        <span style={{ width: 24, height: 24, borderRadius: 999, background: C.bright, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 11.5, fontFamily: "'Inter', sans-serif" }}>{i + 1}</span>
                        {L(p.title)}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexShrink: 0 }}>
                <button
                  onClick={() => finish()}
                  style={{ flex: "0 0 auto", height: 44, padding: "0 18px", borderRadius: 999, fontWeight: 700, fontFamily: font, background: "#F1F4F3", color: C.ink, fontSize: isUr ? 14.5 : 13.5 }}
                >
                  {isUr ? "سمجھ گیا" : "Got it"}
                </button>
                <button
                  onClick={() => {
                    stopSpeaking();
                    onGuide();
                  }}
                  style={{ flex: 1, height: 44, borderRadius: 999, fontWeight: 800, fontFamily: font, background: `linear-gradient(135deg, ${C.bright}, ${C.primary})`, color: "#fff", boxShadow: "0 6px 16px rgba(8,127,99,0.3)", fontSize: isUr ? 15 : 14 }}
                >
                  {isUr ? "قدم بہ قدم دکھائیں" : "Guide me step by step"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layer>
  );
}

// ─── ONE SCREEN'S WALKTHROUGH ────────────────────────────────────────────────

type Box = { x: number; y: number; w: number; h: number };
const PAD = 6; // light around the part
const EDGE = 4; // keep the ring inside the screen
const NAV_H = 96; // bottom nav: scroll parts clear of it

function Walkthrough({ screen, steps, onDone }: { screen: TourScreen; steps: Step[]; onDone: (stopAll: boolean) => void }) {
  const { isUr, L, font, lang } = useTourLang();
  const [idx, setIdx] = useState(0);
  const dirRef = useRef<1 | -1>(1);
  const [box, setBox] = useState<Box | null>(null);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardPos, setCardPos] = useState<{ left: number; top: number; arrow: number | null; below: boolean } | null>(null);
  const step = steps[idx];

  const finish = useCallback(
    (stopAll = false) => {
      stopSpeaking();
      onDone(stopAll);
    },
    [onDone],
  );

  const idxRef = useRef(0);
  idxRef.current = idx;
  const go = useCallback(
    (d: 1 | -1) => {
      stopSpeaking();
      dirRef.current = d;
      const n = idxRef.current + d;
      if (n >= steps.length) finish();
      else setIdx(Math.max(0, n));
    },
    [steps.length, finish],
  );

  // Find the part, bring it into view, follow it while it moves; finish "Try it" steps.
  useEffect(() => {
    setReady(false);
    setBox(null);
    const started = Date.now();
    const startValue = step.watch?.();
    let found = false;
    let scrolled = false;
    let done = false;
    let away = 0;

    const tick = () => {
      if (done) return;
      // Left this screen some other way: stop here.
      const top = topScreen();
      if (top && top !== screen && !step.leaves) {
        away ||= Date.now();
        if (Date.now() - away > 1200) {
          done = true;
          finish();
          return;
        }
      } else away = 0;

      // "Try it" finished?
      if ((step.until && step.until()) || (step.watch && step.watch() !== startValue)) {
        done = true;
        if (step.leaves) finish();
        else window.setTimeout(() => go(1), 450);
        return;
      }

      if (!step.target) {
        setBox(null);
        setReady(true);
        return;
      }
      const el = visibleEl(step.target);
      if (!el) {
        if (found && step.backIfGone) {
          done = true;
          go(-1);
        } else if (!found && Date.now() - started > 1400) {
          // Not on this screen right now (e.g. no attributes for this product): skip it.
          done = true;
          if (dirRef.current === -1 && idx === 0) go(1);
          else go(dirRef.current);
        }
        return;
      }
      found = true;
      const root = rootRef.current;
      if (!root) return;
      const rr = root.getBoundingClientRect();
      const scale = root.offsetWidth ? rr.width / root.offsetWidth : 1;
      const W = root.offsetWidth;
      const H = root.offsetHeight;
      let r = el.getBoundingClientRect();
      if (!scrolled) {
        scrolled = true;
        const fixedNav = !!el.closest("nav") || step.target.startsWith("nav-");
        if (!fixedNav && (r.top < 0 || r.bottom > window.innerHeight - NAV_H || covered(el, r)) && r.height < window.innerHeight * 0.6) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          return; // measure once it has moved
        }
      }
      r = el.getBoundingClientRect();
      let x = (r.left - rr.left) / scale;
      let y = (r.top - rr.top) / scale;
      let w = r.width / scale;
      let h = r.height / scale;
      // Keep the light inside the screen (full-width parts were cut at the edges).
      const x2 = Math.min(W - EDGE - PAD, x + w);
      const y2 = Math.min(H - EDGE - PAD, y + h);
      x = Math.max(EDGE + PAD, x);
      y = Math.max(EDGE + PAD, y);
      w = Math.max(8, x2 - x);
      h = Math.max(8, y2 - y);
      setSize({ w: W, h: H });
      setBox((b) => (b && Math.abs(b.x - x) < 0.5 && Math.abs(b.y - y) < 0.5 && Math.abs(b.w - w) < 0.5 && Math.abs(b.h - h) < 0.5 ? b : { x, y, w, h }));
      setReady(true);
    };
    tick();
    const id = window.setInterval(tick, 140);
    return () => {
      done = true;
      window.clearInterval(id);
    };
  }, [idx, step, screen, go, finish]);

  // Card: next to the lit part, on the side with room; never over it when it fits.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || !ready) return;
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    const { w: W, h: H } = size;
    if (!box) {
      setCardPos({ left: (W - cw) / 2, top: Math.max(12, (H - ch) / 2), arrow: null, below: true });
      return;
    }
    const gap = 14;
    const top0 = box.y - PAD;
    const bot0 = box.y + box.h + PAD;
    const roomBelow = H - bot0 - gap - 8;
    const roomAbove = top0 - gap - 8;
    let below: boolean;
    let top: number;
    if (roomBelow >= ch) {
      below = true;
      top = bot0 + gap;
    } else if (roomAbove >= ch) {
      below = false;
      top = top0 - gap - ch;
    } else {
      // A tall part: the card sits over its bottom edge, still inside the screen.
      below = roomBelow >= roomAbove;
      top = below ? H - ch - 10 : 10;
    }
    const cx = box.x + box.w / 2;
    const left = Math.min(Math.max(10, cx - cw / 2), W - cw - 10);
    const fits = below ? top >= bot0 : top + ch <= top0;
    setCardPos({ left, top, arrow: fits ? Math.min(Math.max(22, cx - left), cw - 22) : null, below });
  }, [box, size, ready, idx, lang]);

  useEffect(() => () => stopSpeaking(), []);

  const isAct = !!step.act;
  const last = idx === steps.length - 1;
  const spoken = `${L(step.title)}. ${L(step.body)} ${step.act ? L(step.act) : ""}`;
  const hole = box ? { x: box.x - PAD, y: box.y - PAD, w: box.w + PAD * 2, h: box.h + PAD * 2 } : null;
  const radius = hole ? Math.min(18, hole.h / 2) : 0;

  return (
    <Layer label={L(step.title)}>
      <div ref={rootRef} style={{ position: "absolute", inset: 0, fontFamily: font, pointerEvents: "none" }}>
        {/* Dim everything except the lit part */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true">
          <defs>
            <mask id="zm-tour-hole">
              <rect width="100%" height="100%" fill="#fff" />
              {hole && <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx={radius} fill="#000" />}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(3, 30, 24, 0.78)" mask="url(#zm-tour-hole)" />
        </svg>

        {/* Taps: blocked everywhere, except on the lit part during "Try it" */}
        {isAct && hole ? (
          <>
            <div className="zm-tour-block" style={{ position: "absolute", left: 0, top: 0, right: 0, height: Math.max(0, hole.y) }} />
            <div className="zm-tour-block" style={{ position: "absolute", left: 0, top: hole.y + hole.h, right: 0, bottom: 0 }} />
            <div className="zm-tour-block" style={{ position: "absolute", left: 0, top: hole.y, width: Math.max(0, hole.x), height: hole.h }} />
            <div className="zm-tour-block" style={{ position: "absolute", left: hole.x + hole.w, top: hole.y, right: 0, height: hole.h }} />
          </>
        ) : (
          <div className="zm-tour-block" style={{ position: "absolute", inset: 0 }} />
        )}

        {hole && (
          <div
            key={`ring-${idx}`}
            className={`zm-tour-ring${isAct ? " zm-tour-ring-act" : ""}`}
            style={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h, borderRadius: radius }}
          />
        )}

        {ready && (
          <div
            key={`card-${idx}`}
            ref={cardRef}
            className="zm-tour-card"
            dir={isUr ? "rtl" : "ltr"}
            style={{
              position: "absolute",
              width: Math.min(360, size.w - 20),
              left: cardPos?.left ?? 10,
              top: cardPos?.top ?? 0,
              visibility: cardPos ? "visible" : "hidden",
            }}
          >
            {cardPos?.arrow != null && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: cardPos.arrow - 9,
                  [cardPos.below ? "top" : "bottom"]: -8,
                  width: 18,
                  height: 18,
                  background: "#fff",
                  transform: "rotate(45deg)",
                  borderRadius: 3,
                }}
              />
            )}
            <div style={{ position: "relative", background: "#fff", borderRadius: 20, padding: "12px 14px 12px", boxShadow: "0 18px 50px rgba(0,0,0,0.38)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: isUr ? 12.5 : 11.5, fontWeight: 700, color: C.primary, whiteSpace: "nowrap" }}>
                  {isUr ? `${idx + 1} / ${steps.length}` : `Step ${idx + 1} of ${steps.length}`}
                </span>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: C.mint, overflow: "hidden", direction: "ltr", transform: isUr ? "scaleX(-1)" : undefined }}>
                  <div style={{ width: `${((idx + 1) / steps.length) * 100}%`, height: "100%", background: C.bright, transition: "width .3s" }} />
                </div>
                <LangSwitch small />
                <SpeakerButton say={spoken} label={isUr ? "سنیں" : "Listen"} />
                <button
                  onClick={() => finish(true)}
                  aria-label={isUr ? "رہنمائی بند کریں" : "End tutorial"}
                  title={isUr ? "رہنمائی بند کریں" : "End tutorial"}
                  style={{ width: 30, height: 30, borderRadius: 999, background: "#F1F4F3", display: "grid", placeItems: "center", flexShrink: 0 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.8" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h2 style={{ margin: "8px 0 0", fontSize: isUr ? 18 : 16.5, lineHeight: isUr ? 1.7 : 1.3, fontWeight: 800, color: C.ink }}>{L(step.title)}</h2>
              <p style={{ margin: "2px 0 0", fontSize: isUr ? 14.5 : 13.5, lineHeight: isUr ? 1.9 : 1.5, color: C.muted }}>{L(step.body)}</p>

              {isAct && (
                <div className="zm-tour-act" style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 14, background: C.mint, color: C.deep, fontWeight: 800, fontSize: isUr ? 15 : 14 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M9 11V5a2 2 0 0 1 4 0v6" />
                    <path d="M13 10a2 2 0 0 1 4 0v2" />
                    <path d="M17 11a2 2 0 0 1 4 0v4a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L4.2 15.6a2 2 0 0 1 3.1-2.5L9 15" />
                  </svg>
                  <span>{isUr ? `آزمائیں: ${L(step.act!)}` : `Try it: ${L(step.act!)}`}</span>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                {idx > 0 && (
                  <button
                    onClick={() => go(-1)}
                    style={{ height: 40, padding: "0 16px", borderRadius: 999, fontWeight: 700, fontSize: isUr ? 14.5 : 13.5, fontFamily: font, background: "#F1F4F3", color: C.ink }}
                  >
                    {isUr ? "پیچھے" : "Back"}
                  </button>
                )}
                <div style={{ flex: 1 }} />
                {isAct ? (
                  <button
                    onClick={() => (step.leaves ? finish() : go(1))}
                    style={{ height: 40, padding: "0 14px", borderRadius: 999, fontWeight: 700, fontSize: isUr ? 14 : 13, fontFamily: font, background: "transparent", color: C.primary }}
                  >
                    {step.leaves ? (isUr ? "یہیں ختم کریں" : "Finish here") : isUr ? "یہ چھوڑیں" : "Skip this"}
                  </button>
                ) : (
                  <button
                    onClick={() => go(1)}
                    style={{ height: 40, padding: "0 22px", borderRadius: 999, fontWeight: 800, fontSize: isUr ? 15 : 14, fontFamily: font, background: `linear-gradient(135deg, ${C.bright}, ${C.primary})`, color: "#fff", boxShadow: "0 6px 16px rgba(8,127,99,0.3)" }}
                  >
                    {last ? (isUr ? "ختم" : "Done") : isUr ? "اگلا" : "Next"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layer>
  );
}

const TOUR_CSS = `
.zm-tour button { cursor: pointer; border: none; }
.zm-tour-block, .zm-tour-card, .zm-tour-ask, .zm-tour-badge { pointer-events: auto; }
.zm-tour-ring-soft { border: 2px solid ${C.glow}; pointer-events: none; box-shadow: 0 0 0 1px rgba(255,255,255,.25); }
.zm-tour-badge {
  position: absolute;
  width: ${BADGE}px; height: ${BADGE}px; border-radius: 999px;
  display: grid; place-items: center;
  font: 800 12px 'Inter', sans-serif;
  box-shadow: 0 0 0 2px #fff, 0 4px 10px rgba(0,0,0,.35);
  animation: zmTourRingIn .3s ease-out both;
}
.zm-tour-fade { animation: zmTourIn .25s ease-out both; }
.zm-tour-ring {
  position: absolute;
  border: 2.5px solid ${C.glow};
  pointer-events: none;
  transition: left .25s ease, top .25s ease, width .25s ease, height .25s ease;
  animation: zmTourRingIn .35s ease-out both;
}
.zm-tour-ring::after {
  content: "";
  position: absolute;
  inset: -3px;
  border-radius: inherit;
  border: 2.5px solid ${C.glow};
  animation: zmTourPulse 1.8s ease-out infinite;
}
.zm-tour-ring-act { border-color: #FFD66B; }
.zm-tour-ring-act::after { border-color: #FFD66B; animation-duration: 1.2s; }
@keyframes zmTourRingIn { from { opacity: 0; transform: scale(1.08); } }
@keyframes zmTourPulse { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.12); } }
.zm-tour-card { animation: zmTourIn .3s cubic-bezier(.2,.9,.3,1.2) both; }
@keyframes zmTourIn { from { opacity: 0; transform: translateY(10px) scale(.97); } }
.zm-tour-act { animation: zmTourNudge 1.6s ease-in-out infinite; }
@keyframes zmTourNudge { 0%, 100% { transform: none; } 50% { transform: translateY(-2px); } }
@media (prefers-reduced-motion: reduce) {
  .zm-tour *, .zm-tour-ring::after { animation: none !important; transition: none !important; }
}
`;
