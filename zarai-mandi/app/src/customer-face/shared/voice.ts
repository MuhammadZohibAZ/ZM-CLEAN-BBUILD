import { speakUrdu } from "../../components/VoiceAssistant";

import { appLang } from "./i18n/LangProvider";
import { AUTO_URDU_DICT } from "./i18n/urduDictionary";

export let globalVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  globalVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    globalVoices = window.speechSynthesis.getVoices();
  };
}

export function getBestVoice(isUrdu: boolean): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = globalVoices.length > 0 ? globalVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  if (isUrdu) {
    // 1. Exact match for Azure / MS Uzma Neural
    const uzma = voices.find((v) =>
      v.name.toLowerCase().includes("uzma") ||
      v.name.toLowerCase().includes("uzmaneural")
    );
    if (uzma) return uzma;

    // 2. Exact match for ur-PK
    const urPk = voices.find((v) =>
      v.lang.toLowerCase() === "ur-pk" || v.lang.toLowerCase() === "ur_pk"
    );
    if (urPk) return urPk;

    // 3. Asad Neural or other Urdu voices
    const urduVoice = voices.find((v) =>
      v.name.toLowerCase().includes("asad") ||
      v.lang.toLowerCase().startsWith("ur") ||
      v.name.toLowerCase().includes("urdu")
    );
    if (urduVoice) return urduVoice;

    // 4. Subcontinent natural voices (e.g. Swara / Madhur / Hindi which accurately pronounce Urdu vocabulary)
    const hiVoice = voices.find((v) =>
      v.name.toLowerCase().includes("swara") ||
      v.name.toLowerCase().includes("madhur") ||
      v.lang.toLowerCase().startsWith("hi")
    );
    if (hiVoice) return hiVoice;

    // 5. Arabic / Persian fallback
    const fallback = voices.find((v) =>
      v.lang.toLowerCase().startsWith("ar") || v.lang.toLowerCase().startsWith("fa")
    );
    if (fallback) return fallback;
  } else {
    const en =
      voices.find((v) =>
        v.name.toLowerCase().includes("natural") && v.lang.toLowerCase().startsWith("en")
      ) ||
      voices.find((v) => v.lang.toLowerCase() === "en-us" || v.lang.toLowerCase().startsWith("en"));
    if (en) return en;
  }

  return null;
}

export function translateVoiceUrdu(text: string): string {
  if (!text) return "";
  const trimmed = text.trim();

  const PHRASES: Record<string, string> = {
    Wheat: "گندم",
    wheat: "گندم",
    Paddy: "پھٹی",
    paddy: "پھٹی",
    Cotton: "کپاس",
    cotton: "کپاس",
    Rice: "چاول",
    rice: "چاول",
    Maize: "مکئی",
    maize: "مکئی",
    Sesame: "تل",
    sesame: "تل",
    Mustard: "سرسوں",
    mustard: "سرسوں",
    Millet: "باجرہ",
    millet: "باجرہ",
    Sugarcane: "گنا",
    sugarcane: "گنا",
    Sugar: "چینی",
    sugar: "چینی",
    Kiryana: "کریانہ",
    kiryana: "کریانہ",
    Livestock: "مویشی",
    livestock: "مویشی",
    Fertilizers: "کھاد",
    fertilizers: "کھاد",
    Vegetables: "سبزیاں",
    vegetables: "سبزیاں",
    Fruits: "پھل",
    fruits: "پھل",
    "Dry-Fruits": "خشک میوہ جات",
    Herbals: "جڑی بوٹیاں",
    "Edible Oil": "خوردنی تیل",
    "Voice On": "آواز فعال ہے",
    "Voice Off": "آواز بند ہے",
    "Voice": "آواز",
    "English": "انگریزی",
    "Urdu": "اردو",
    "Notifications": "اطلاعات اور پیغامات",
    "Profile": "پروفائل",
    "Edit Profile": "پروفائل میں ترمیم",
    "Select location": "مقام منتخب کریں",
    "Select Mandi": "منڈی کا انتخاب کریں",
    "All Pakistan": "پورا پاکستان",
    "All Pakistan selected.": "پورا پاکستان منتخب کیا گیا۔",
    "All Pakistan prices": "پورے پاکستان کی قیمتیں",
    "Prices of my country shown.": "پورے ملک کے ریٹس دکھائے جا رہے ہیں۔",
    "All products selected. All prices are shown.":
      "تمام مصنوعات منتخب ہیں۔ تمام قیمتیں دکھائی جا رہی ہیں۔",
    "All byproducts shown.": "تمام ضمنی مصنوعات دکھائی جا رہی ہیں۔",
    "All byproducts": "تمام ضمنی مصنوعات",
    "All price types are shown.": "تمام ریٹس دکھائے جا رہے ہیں۔",
    "Search. Find any product or byproduct by name to see its prices.":
      "تلاش۔ کسی بھی فصل یا ضمنی پیداوار کا نام بول کر ریٹ معلوم کریں۔",
    "Product. Select a crop or product to discover its byproduct prices.":
      "اجناس۔ اپنی پسندیدہ فصل منتخب کریں اور تمام منڈیوں کے تازہ ریٹس دیکھیں۔",
    "Live Market. See real-time prices from active mandis across Pakistan.":
      "لائیو مارکیٹ۔ پاکستان کی تمام منڈیوں کے تازہ ترین لائیو ریٹس دیکھیں۔",
    "Mandi. Browse all markets across Pakistan and see today's rates.":
      "منڈیاں۔ پاکستان بھر کی منڈیوں کی فہرست اور آج کے ریٹس دیکھیں۔",
    "Notification bell. All market updates and alerts are shown here.":
      "اطلاعات۔ تمام اہم مارکیٹ اپڈیٹس اور خبریں یہاں ملیں گی۔",
    "Your Picks. Your favourite byproducts are shown here on your homescreen.":
      "آپ کی پسند۔ آپ کی پسندیدہ اجناس کے ریٹس یہاں ملیں گے۔",
    "This product is locked. Please upgrade to access it.":
      "یہ مصنوع مقفل ہے۔ مکمل معلومات کے لیے اکاؤنٹ اپگریڈ کریں۔",
    "This product is locked": "یہ مصنوع مقفل ہے",
    "Mandi Map": "منڈی کا نقشہ",
    "Map View": "نقشہ دیکھیں",
    "Map View clicked": "نقشہ کھولا گیا",
    "Filter Mandis": "منڈیاں فلٹر کریں",
    "Show Nearby": "قریبی منڈیاں دیکھیں",
    "Today's Overview": "آج کا جائزہ",
    "Daily Rates": "روزانہ ریٹس",
    "Price Trend": "قیمتوں کا رجحان",
    "Arrival Trend": "آمد کا رجحان",
    "Overview": "جائزہ",
    "Crops & Markets": "فصلیں اور منڈیاں",
    "Operating Hours": "کاروباری اوقات",
    "Active Listings": "فعال لاٹس",
    "Market Status": "مارکیٹ کی صورتحال",
    "Open Now": "مارکیٹ کھلی ہے",
    "Closed": "مارکیٹ بند ہے",
    "Variety": "ورائٹی",
    "New/Old": "نئی پرانی فصل",
    "Color": "رنگت",
    "Spec": "گریڈ اور معیار",
    "Condition": "حالت",
    "Rate Type": "ریٹ کی قسم",
    "Retail Rate": "ریٹیل ریٹ",
    "Wholesale Rate": "ہول سیل ریٹ",
    "Mill Rate": "مل ریٹ",
    "Delivery Rate": "ڈیلیوری ریٹ",
    "Retail": "ریٹیل",
    "Wholesale": "ہول سیل",
    "Mill": "مل",
    "Delivery": "ڈیلیوری",
    "Dry": "خشک",
    "Moist": "نمی دار",
    "New": "نیا مال",
    "Old": "پرانا مال",
    "Saved": "محفوظ شدہ",
    "Save": "محفوظ کریں",
    "Directions": "راستہ معلوم کریں",
    "Share": "شیئر کریں",
    "Back": "واپس",
    "Clear all": "تمام فلٹرز صاف کریں",
    "Clear (Today)": "آج کی تاریخ",
    "24 Hours": "چوبیس گھنٹے",
    "72 Hours": "بہتر گھنٹے",
    "Weekly": "ہفتہ وار",
    "Monthly": "ماہانہ",
    "Punjab": "پنجاب",
    "Sindh": "سندھ",
    "KPK": "خیبر پختونخوا",
    "Khyber Pakhtunkhwa": "خیبر پختونخوا",
    "Balochistan": "بلوچستان",
    "Pakpattan": "پاکپتن",
    "Okara": "اوکاڑہ",
    "Sahiwal": "ساہیوال",
    "Faisalabad": "فیصل آباد",
    "Multan": "ملتان",
    "Lahore": "لاہور",
    "Bahawalpur": "بہاولپور",
    "Rahim Yar Khan": "رحیم یار خان",
    "Ghotki": "گھوٹکی",
    "Sukkur": "سکھر",
    "Nawabshah": "نوابشاہ",
    "Hyderabad": "حیدرآباد",
    "Karachi": "کراچی",
    "Peshawar": "پشاور",
    "Quetta": "کوئٹہ",
  };

  if (PHRASES[trimmed]) return PHRASES[trimmed];
  if (AUTO_URDU_DICT[trimmed]) return AUTO_URDU_DICT[trimmed];

  // If text already contains Urdu characters, return as is
  if (/[\u0600-\u06FF]/.test(text)) return text;

  // Dynamic patterns
  let m = trimmed.match(/^Prices of (.*?) district are shown\.$/i);
  if (m) {
    const d = AUTO_URDU_DICT[m[1]] || m[1];
    return `ضلع ${d} کی قیمتیں دکھائی جا رہی ہیں۔`;
  }

  m = trimmed.match(/^Prices of (.*?) are shown\.$/i);
  if (m) {
    const item = AUTO_URDU_DICT[m[1]] || m[1];
    return `${item} کی قیمتیں دکھائی جا رہی ہیں۔`;
  }

  m = trimmed.match(/^Prices for (.*?)$/i);
  if (m) {
    const item = AUTO_URDU_DICT[m[1]] || m[1];
    return `${item} کی قیمتیں دکھائی جا رہی ہیں۔`;
  }

  m = trimmed.match(/^All (.*?) byproduct prices are shown\.$/i);
  if (m) {
    const c = AUTO_URDU_DICT[m[1]] || m[1];
    return `${c} کی تمام ضمنی مصنوعات کے ریٹس دکھائے جا رہے ہیں۔`;
  }

  m = trimmed.match(/^All byproducts of (.*?) shown\.$/i);
  if (m) {
    const c = AUTO_URDU_DICT[m[1]] || m[1];
    return `${c} کی تمام ضمنی مصنوعات دکھائی جا رہی ہیں۔`;
  }

  m = trimmed.match(/^All (.*?) rates are shown\.$/i);
  if (m) {
    const rt = AUTO_URDU_DICT[m[1]] || m[1];
    return `تمام ${rt} دکھائے جا رہے ہیں۔`;
  }

  m = trimmed.match(/^Prices of (\d+) locations are shown\.$/i);
  if (m) {
    return `${m[1]} مقامات کی قیمتیں دکھائی جا رہی ہیں۔`;
  }

  m = trimmed.match(/^(.*?) Province selected$/i);
  if (m) {
    const p = AUTO_URDU_DICT[m[1]] || m[1];
    return `صوبہ ${p} منتخب کیا گیا۔`;
  }

  m = trimmed.match(/^(.*?) District$/i);
  if (m) {
    const d = AUTO_URDU_DICT[m[1]] || m[1];
    return `ضلع ${d}`;
  }

  m = trimmed.match(/^(.*?) Mandi unselected$/i);
  if (m) {
    const mName = AUTO_URDU_DICT[m[1]] || m[1];
    return `${mName} منڈی ہٹا دی گئی۔`;
  }

  m = trimmed.match(/^(.*?) Mandi$/i);
  if (m) {
    const mName = AUTO_URDU_DICT[m[1]] || m[1];
    return `${mName} منڈی`;
  }

  m = trimmed.match(/^Mandis in (.*?) unselected$/i);
  if (m) {
    const d = AUTO_URDU_DICT[m[1]] || m[1];
    return `ضلع ${d} کی تمام منڈیاں غیر منتخب ہو گئیں۔`;
  }

  m = trimmed.match(/^All mandis in (.*?) selected$/i);
  if (m) {
    const d = AUTO_URDU_DICT[m[1]] || m[1];
    return `ضلع ${d} کی تمام منڈیاں منتخب ہو گئیں۔`;
  }

  m = trimmed.match(/^(.*?), (.*?)\. Min rate (.*?), Max rate (.*?) rupees\.$/i);
  if (m) {
    const crop = AUTO_URDU_DICT[m[1]] || m[1];
    const mandi = AUTO_URDU_DICT[m[2]] || m[2];
    return `${crop}، ${mandi}۔ کم سے کم ریٹ ${m[3]}، زیادہ سے زیادہ ${m[4]} روپے`;
  }

  m = trimmed.match(/^(.*?) Mandi, (.*?) rate, (.*?) to (.*?) rupees$/i);
  if (m) {
    const mandi = AUTO_URDU_DICT[m[1]] || m[1];
    const rt = AUTO_URDU_DICT[m[2]] || m[2];
    return `${mandi} منڈی، ${rt} ریٹ، ${m[3]} سے ${m[4]} روپے`;
  }

  m = trimmed.match(/^Opened (.*?) map for (.*?)$/i);
  if (m) {
    const crop = AUTO_URDU_DICT[m[1]] || m[1];
    const mandi = AUTO_URDU_DICT[m[2]] || m[2];
    return `${mandi} میں ${crop} کا نقشہ کھل گیا۔`;
  }

  return AUTO_URDU_DICT[trimmed] || trimmed;
}

export let activeGlobalAudio: HTMLAudioElement | null = null;

export function stopSpeaking() {
  if (activeGlobalAudio) {
    activeGlobalAudio.pause();
    activeGlobalAudio.currentTime = 0;
    activeGlobalAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakText(text: string) {
  stopSpeaking();

  let textToSpeak = text;
  if (appLang === "ur") {
    textToSpeak = translateVoiceUrdu(text);
  }

  // Clean text of non-pronounceable glyphs
  textToSpeak = textToSpeak
    .replace(/<[^>]+>/g, " ")
    .replace(/[•★✓›‹→←▲▼🌾·]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!textToSpeak) return;

  const isUrdu = appLang === "ur";
  speakUrdu(textToSpeak, { lang: isUrdu ? "ur-PK" : "en-US" })
    .then((audio) => {
      activeGlobalAudio = audio;
    })
    .catch((err) => {
      console.warn("speakText error:", err);
    });
}
