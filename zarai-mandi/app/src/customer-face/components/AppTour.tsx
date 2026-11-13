import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { speakText, stopSpeaking } from "../shared/voice";

// ─── APP TOUR ─────────────────────────────────────────────────────────────────
// A guided walk through the whole app for a new user, like a game tutorial.
// The tour moves the app itself: it opens Complete Profile, View All, a
// product, its rates, Trends, Entertainment and Settings by tapping the app's
// own buttons, lights up one part at a time (elements marked data-tour="…"),
// explains it, and brings the user back Home. English and Urdu.
// Shown once on a device's first visit; replayed from Settings → App Tour.

const TOUR_SEEN_KEY = "zm_tour_seen_v1";

export function tourSeen(): boolean {
  try {
    return window.localStorage.getItem(TOUR_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
function markTourSeen() {
  try {
    window.localStorage.setItem(TOUR_SEEN_KEY, "1");
  } catch {
    /* private mode: the tour may show again next visit */
  }
}

/** What the tour may ask the app to do (CustomerFaceApp supplies these). */
export type TourControls = {
  /** Back to a clean Home: closes sheets, pages and other tabs. */
  home: () => void;
  openProfile: () => void;
  openNews: () => void;
  openAccount: () => void;
};

// Screens the tour can stand on, each reached from its parent.
type ScreenKey = "home" | "profile" | "viewall" | "product" | "rates" | "rates-best" | "trends" | "news" | "account";
const PARENT: Record<ScreenKey, ScreenKey | null> = {
  home: null,
  profile: "home",
  viewall: "home",
  product: "home",
  rates: "product",
  "rates-best": "rates",
  trends: "rates",
  news: "home",
  account: "home",
};
const pathTo = (s: ScreenKey): ScreenKey[] => {
  const out: ScreenKey[] = [];
  for (let k: ScreenKey | null = s; k; k = PARENT[k]) out.unshift(k);
  return out;
};

type Txt = { en: string; ur: string };
type Step = {
  screen: ScreenKey;
  /** data-tour value (or a CSS selector starting with "[") to light up; none = a centred card. */
  target?: string;
  art?: "welcome" | "done";
  title: Txt;
  body: Txt;
};

const FIRST_CARD = '[data-tour="bp-cards"] > :first-child';

const STEPS: Step[] = [
  {
    screen: "home",
    art: "welcome",
    title: { en: "Welcome to Zarai Mandi", ur: "زرعی منڈی میں خوش آمدید" },
    body: {
      en: "Today's mandi rates from all over Pakistan, in one app. We'll walk you through every screen and bring you back here.",
      ur: "پورے پاکستان کی منڈیوں کے آج کے ریٹس، ایک ہی ایپ میں۔ ہم آپ کو ہر اسکرین دکھائیں گے اور پھر یہیں واپس لے آئیں گے۔",
    },
  },
  // ── Home ──
  {
    screen: "home",
    target: "account",
    title: { en: "Your account", ur: "آپ کا اکاؤنٹ" },
    body: {
      en: "Your photo opens your account: profile, subscriptions, language, voice and help.",
      ur: "آپ کی تصویر اکاؤنٹ کھولتی ہے: پروفائل، سبسکرپشنز، زبان، آواز اور مدد۔",
    },
  },
  {
    screen: "home",
    target: "bell",
    title: { en: "Notifications", ur: "نوٹیفکیشنز" },
    body: { en: "Rate alerts and mandi news arrive here.", ur: "ریٹ الرٹس اور منڈی کی خبریں یہاں آتی ہیں۔" },
  },
  {
    screen: "home",
    target: "search",
    title: { en: "Search anything", ur: "کچھ بھی تلاش کریں" },
    body: {
      en: "Type a product or item in English or Urdu, like Wheat, Kinnow or Urea, and go straight to its rates.",
      ur: "انگریزی یا اردو میں کسی چیز کا نام لکھیں، جیسے گندم، کینو یا یوریا، اور سیدھا اس کے ریٹس پر جائیں۔",
    },
  },
  {
    screen: "home",
    target: "profile",
    title: { en: "Complete your profile", ur: "اپنی پروفائل مکمل کریں" },
    body: {
      en: "This button sets up your subscription. Let's open it.",
      ur: "اس بٹن سے آپ اپنی سبسکرپشن بناتے ہیں۔ آئیے اسے کھولیں۔",
    },
  },
  {
    screen: "profile",
    target: "profile-sheet",
    title: { en: "3 easy steps", ur: "3 آسان مراحل" },
    body: {
      en: "1. Pick the products you trade.  2. Choose how many months.  3. Pay by JazzCash, Easypaisa, card or bank. Every product is PKR 2,000 a month.",
      ur: "1۔ اپنی مصنوعات چنیں۔  2۔ مہینے چنیں۔  3۔ جاز کیش، ایزی پیسہ، کارڈ یا بینک سے ادائیگی کریں۔ ہر پروڈکٹ 2,000 روپے ماہانہ۔",
    },
  },
  {
    screen: "home",
    target: "products",
    title: { en: "Your products", ur: "آپ کی مصنوعات" },
    body: {
      en: "Each circle is a product. Open ones show their rates; ones with a lock need a subscription.",
      ur: "ہر دائرہ ایک پروڈکٹ ہے۔ کھلی مصنوعات کے ریٹس نظر آتے ہیں، تالے والی کے لیے سبسکرپشن چاہیے۔",
    },
  },
  {
    screen: "home",
    target: "viewall",
    title: { en: "View All", ur: "سب دیکھیں" },
    body: { en: "This opens every product. Let's look.", ur: "یہاں تمام مصنوعات ہیں۔ آئیے دیکھیں۔" },
  },
  {
    screen: "viewall",
    target: "viewall-group",
    title: { en: "All products, in groups", ur: "تمام مصنوعات، گروپس میں" },
    body: {
      en: "Grains, Edible Oils, Fruits, Vegetables, Fertilizer, Dry Fruits, Herbs and Kiryana. Tap 'See more' to open a group, and any product to see it.",
      ur: "اناج، خوردنی تیل، پھل، سبزیاں، کھاد، خشک میوہ، جڑی بوٹیاں اور کریانہ۔ گروپ کھولنے کے لیے 'مزید دیکھیں' اور کسی بھی پروڈکٹ پر ٹیپ کریں۔",
    },
  },
  // ── A product ──
  {
    screen: "product",
    target: FIRST_CARD,
    title: { en: "Inside a product", ur: "پروڈکٹ کے اندر" },
    body: {
      en: "Here is Wheat. Each card is one item: today's average min and max rate, total arrival, and how many mandis reported.",
      ur: "یہ گندم ہے۔ ہر کارڈ ایک چیز ہے: آج کا اوسط کم اور زیادہ ریٹ، کل آمد، اور کتنی منڈیوں نے ریٹ دیا۔",
    },
  },
  {
    screen: "product",
    target: "bp-filters",
    title: { en: "Filters", ur: "فلٹر" },
    body: {
      en: "Show only one rate type (mandi, wholesale, retail…) or one quality, crop or company.",
      ur: "صرف ایک قسم کا ریٹ (منڈی، ہول سیل، ریٹیل…) یا ایک کوالٹی، فصل یا کمپنی دیکھیں۔",
    },
  },
  {
    screen: "product",
    target: "bp-date",
    title: { en: "Pick a date", ur: "تاریخ چنیں" },
    body: {
      en: "Rates are for today. Tap the date to see an earlier day.",
      ur: "ریٹس آج کے ہیں۔ پچھلے دن کے ریٹ دیکھنے کے لیے تاریخ پر ٹیپ کریں۔",
    },
  },
  // ── Rates ──
  {
    screen: "rates",
    target: "rates-hero",
    title: { en: "The rate screen", ur: "ریٹ کی اسکرین" },
    body: {
      en: "Tapping a card opens this: the average rate, how much it moved since the last day, the last month's line, and min, max and arrival.",
      ur: "کارڈ پر ٹیپ کرنے سے یہ کھلتی ہے: اوسط ریٹ، پچھلے دن سے فرق، پچھلے مہینے کی لکیر، اور کم، زیادہ اور آمد۔",
    },
  },
  {
    screen: "rates",
    target: "rates-filters",
    title: { en: "Location, day and rate", ur: "مقام، دن اور ریٹ" },
    body: {
      en: "Choose a province, district or one mandi, a day, and the rate type. Every number on the screen follows your choice.",
      ur: "صوبہ، ضلع یا کوئی ایک منڈی، دن اور ریٹ کی قسم چنیں۔ اسکرین کا ہر نمبر آپ کے انتخاب کے مطابق بدلتا ہے۔",
    },
  },
  {
    screen: "rates-best",
    target: "rates-hero",
    title: { en: "Best mandis and map", ur: "بہترین منڈیاں اور نقشہ" },
    body: {
      en: "Swipe the card to see where the rate is highest today, and every mandi on the map of Pakistan.",
      ur: "کارڈ کو سوائپ کریں: آج کہاں ریٹ سب سے زیادہ ہے، اور پاکستان کے نقشے پر ہر منڈی۔",
    },
  },
  {
    screen: "rates",
    target: "rates-mandis",
    title: { en: "Every mandi's rate", ur: "ہر منڈی کا ریٹ" },
    body: {
      en: "A row for each mandi with its rate and change. Sort the columns, switch to cards, or tap a mandi for its full detail.",
      ur: "ہر منڈی کی قطار، ریٹ اور فرق کے ساتھ۔ کالم ترتیب دیں، کارڈز پر جائیں، یا مکمل تفصیل کے لیے منڈی پر ٹیپ کریں۔",
    },
  },
  {
    screen: "rates",
    target: "rates-star",
    title: { en: "Save to favourites", ur: "پسندیدہ میں محفوظ کریں" },
    body: {
      en: "Tap the star and this item is kept on your Home screen.",
      ur: "ستارے پر ٹیپ کریں اور یہ چیز آپ کی ہوم اسکرین پر رہے گی۔",
    },
  },
  {
    screen: "trends",
    target: "rates-trends",
    title: { en: "Trends", ur: "رجحانات" },
    body: {
      en: "The Trends tab shows how the rate moved day by day, and compares every rate type.",
      ur: "رجحانات میں دیکھیں کہ ریٹ دن بہ دن کیسے بدلا، اور ہر قسم کے ریٹ کا موازنہ۔",
    },
  },
  // ── Back Home ──
  {
    screen: "home",
    target: "favorites",
    title: { en: "Favourites", ur: "پسندیدہ" },
    body: {
      en: "Back on Home: items you star appear here, one tap from today's rate.",
      ur: "واپس ہوم پر: جن چیزوں پر آپ ستارہ لگائیں وہ یہاں آتی ہیں، آج کا ریٹ ایک ٹیپ پر۔",
    },
  },
  {
    screen: "home",
    target: "nav-news",
    title: { en: "Entertainment", ur: "تفریح" },
    body: { en: "This tab has short videos. Let's open it.", ur: "اس حصے میں مختصر ویڈیوز ہیں۔ آئیے کھولیں۔" },
  },
  {
    screen: "news",
    target: "reels-tabs",
    title: { en: "Videos", ur: "ویڈیوز" },
    body: {
      en: "Farming tips, market news and harvest videos. Pick a category up here and swipe up for the next video.",
      ur: "کاشتکاری کے مشورے، منڈی کی خبریں اور کٹائی کی ویڈیوز۔ اوپر سے قسم چنیں اور اگلی ویڈیو کے لیے اوپر سوائپ کریں۔",
    },
  },
  {
    screen: "home",
    target: "nav-settings",
    title: { en: "Settings", ur: "ترتیبات" },
    body: { en: "Your account lives here. Let's open it.", ur: "آپ کا اکاؤنٹ یہاں ہے۔ آئیے کھولیں۔" },
  },
  {
    screen: "account",
    target: "acc-profile",
    title: { en: "Your profile", ur: "آپ کی پروفائل" },
    body: { en: "Tap to change your name, number or area.", ur: "نام، نمبر یا علاقہ بدلنے کے لیے ٹیپ کریں۔" },
  },
  {
    screen: "account",
    target: "acc-account",
    title: { en: "Subscriptions", ur: "سبسکرپشنز" },
    body: {
      en: "See and renew your products, or register as a representative for your mandi.",
      ur: "اپنی مصنوعات دیکھیں اور تجدید کریں، یا اپنی منڈی کے نمائندہ بنیں۔",
    },
  },
  {
    screen: "account",
    target: "acc-prefs",
    title: { en: "Language and voice", ur: "زبان اور آواز" },
    body: {
      en: "Switch between English and Urdu, and turn on voice so the app reads rates aloud.",
      ur: "انگریزی اور اردو میں بدلیں، اور آواز آن کریں تاکہ ایپ ریٹس پڑھ کر سنائے۔",
    },
  },
  {
    screen: "account",
    target: "acc-support",
    title: { en: "Help, and this tour", ur: "مدد، اور یہ تعارف" },
    body: {
      en: "Contact us on WhatsApp or the helpline, and replay this tour from App Tour.",
      ur: "واٹس ایپ یا ہیلپ لائن پر رابطہ کریں، اور 'ایپ کا تعارف' سے یہ تعارف دوبارہ دیکھیں۔",
    },
  },
  {
    screen: "home",
    art: "done",
    title: { en: "You're all set!", ur: "آپ تیار ہیں!" },
    body: {
      en: "That's the whole app. To see this tour again, go to Settings → App Tour.",
      ur: "یہ تھی پوری ایپ۔ یہ تعارف دوبارہ دیکھنے کے لیے ترتیبات ← ایپ کا تعارف پر جائیں۔",
    },
  },
];

const C = {
  deep: "#064D40",
  primary: "#087F63",
  bright: "#2FAE68",
  mint: "#E8F5EF",
  ink: "#183B34",
  muted: "#52635F",
  gold: "#F5B82E",
};

const sel = (t: string) => (t.startsWith("[") ? t : `[data-tour="${t}"]`);
function visibleEl(t: string): HTMLElement | null {
  const el = document.querySelector<HTMLElement>(sel(t));
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? el : null;
}
const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
async function waitFor(t: string, ms = 6000): Promise<HTMLElement | null> {
  const end = Date.now() + ms;
  for (;;) {
    const el = visibleEl(t);
    if (el || Date.now() > end) return el;
    await sleep(100);
  }
}
async function tap(t: string, ms?: number): Promise<boolean> {
  const el = await waitFor(t, ms);
  el?.click();
  return !!el;
}

type Box = { x: number; y: number; w: number; h: number };

export function AppTour({ controls, onClose }: { controls: TourControls; onClose: () => void }) {
  const { lang, setLang } = useLang();
  const isUr = lang === "ur";
  const L = (t: Txt) => (isUr ? t.ur : t.en);
  const font = isUr ? URDU_FONT : "'Inter', 'Poppins', sans-serif";

  const rootRef = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(-1); // the step whose card is up (-1 while moving)
  const [box, setBox] = useState<Box | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const dirRef = useRef(1);
  const screenRef = useRef<ScreenKey>("home");
  const runRef = useRef(0);
  const ctl = useRef(controls);
  ctl.current = controls;

  // Move the app to a screen by tapping its own buttons.
  const goScreen = useCallback(async (to: ScreenKey, run: number): Promise<boolean> => {
    const from = screenRef.current;
    if (from === to) return true;
    const want = pathTo(to);
    const have = pathTo(from);
    let start = 1;
    if (have.every((k, n) => want[n] === k)) {
      start = have.length; // carry on down from here
    } else {
      ctl.current.home();
      screenRef.current = "home";
      await sleep(250);
      if (!(await waitFor("products"))) return false;
    }
    for (const k of want.slice(start)) {
      if (run !== runRef.current) return false;
      let ok = false;
      if (k === "profile") {
        ctl.current.openProfile();
        ok = !!(await waitFor("profile-sheet"));
      } else if (k === "viewall") {
        ok = (await tap("viewall")) && !!(await waitFor("viewall-group"));
      } else if (k === "product") {
        const el =
          visibleEl('[data-tour="products"] [data-home-product="Wheat"]') ||
          visibleEl('[data-tour="products"] [data-home-product]');
        el?.click();
        ok = !!el && !!(await waitFor(FIRST_CARD, 10000));
      } else if (k === "rates") {
        ok = (await tap(FIRST_CARD)) && !!(await waitFor("rates-hero", 10000));
        if (ok) await sleep(600);
      } else if (k === "rates-best") {
        ok = await tap("rates-next");
        await sleep(700);
      } else if (k === "trends") {
        const tabs = document.querySelectorAll<HTMLElement>('[data-tour="rates-tabs"] [role="tab"]');
        tabs[1]?.click();
        ok = !!tabs[1] && !!(await waitFor("rates-trends", 8000));
      } else if (k === "news") {
        ctl.current.openNews();
        ok = !!(await waitFor("reels-tabs"));
      } else if (k === "account") {
        ctl.current.openAccount();
        ok = !!(await waitFor("acc-profile"));
      }
      if (!ok) return false;
      screenRef.current = k;
    }
    return true;
  }, []);

  // Measure the lit element relative to the tour (correct under CSS zoom too).
  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const rr = root.getBoundingClientRect();
    const scale = root.offsetWidth ? rr.width / root.offsetWidth : 1;
    const h = root.offsetHeight;
    setSize({ w: root.offsetWidth, h });
    const s = STEPS[i];
    const el = s.target ? visibleEl(s.target) : null;
    if (!el) {
      setBox(null);
      return;
    }
    const r = el.getBoundingClientRect();
    let y = (r.top - rr.top) / scale;
    let bh = r.height / scale;
    // A tall element: light only its top part, so the card fits too.
    if (y < 8) {
      bh -= 8 - y;
      y = 8;
    }
    bh = Math.min(bh, Math.max(60, h * 0.42));
    setBox({ x: (r.left - rr.left) / scale, y, w: r.width / scale, h: bh });
  }, [i]);

  // Each step: move the app, wait for the part, scroll it into view, light it up.
  useLayoutEffect(() => {
    const run = ++runRef.current;
    const s = STEPS[i];
    setShown(-1);
    (async () => {
      const ok = await goScreen(s.screen, run);
      if (run !== runRef.current) return;
      const el = ok && s.target ? await waitFor(s.target, 3000) : null;
      if (run !== runRef.current) return;
      if (!ok || (s.target && !el)) {
        // Not available (e.g. the profile chip once the profile is done): skip it.
        const next = i + dirRef.current;
        if (next >= 0 && next < STEPS.length) setI(next);
        else setShown(i);
        return;
      }
      if (el) {
        el.scrollIntoView({ block: el.getBoundingClientRect().height > 300 ? "start" : "center", inline: "nearest" });
        await sleep(350);
      }
      if (run !== runRef.current) return;
      measure();
      setShown(i);
    })();
  }, [i, goScreen, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(
    () => () => {
      runRef.current++;
      stopSpeaking();
    },
    [],
  );

  const finish = () => {
    runRef.current++;
    markTourSeen();
    stopSpeaking();
    ctl.current.home();
    onClose();
  };
  const go = (d: number) => {
    stopSpeaking();
    dirRef.current = d;
    const next = i + d;
    if (next >= STEPS.length) return finish();
    if (next >= 0) setI(next);
  };

  const step = STEPS[i];
  const ready = shown === i;
  const isFirst = i === 0;
  const isLast = i === STEPS.length - 1;
  const litBox = ready ? box : null;

  // Card placement: under the lit element if it fits, else above, else at the bottom.
  const PAD = 6;
  const GAP = 14;
  const NEED = 230;
  let cardStyle: React.CSSProperties = { left: 16, right: 16, top: "50%", transform: "translateY(-50%)" };
  let arrow: { side: "top" | "bottom"; x: number } | null = null;
  if (litBox && size.h) {
    const below = litBox.y + litBox.h + PAD + GAP;
    const aboveEdge = litBox.y - PAD - GAP;
    const cx = Math.min(Math.max(litBox.x + litBox.w / 2, 40), size.w - 40);
    if (size.h - below > NEED) {
      cardStyle = { left: 16, right: 16, top: below };
      arrow = { side: "top", x: cx };
    } else if (aboveEdge > NEED) {
      cardStyle = { left: 16, right: 16, bottom: size.h - aboveEdge };
      arrow = { side: "bottom", x: cx };
    } else {
      cardStyle = { left: 16, right: 16, bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" };
    }
  }

  const btn = (primary: boolean): React.CSSProperties => ({
    height: 42,
    padding: "0 18px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: isUr ? 15 : 14,
    fontFamily: font,
    border: primary ? "none" : `1.5px solid ${C.primary}33`,
    background: primary ? `linear-gradient(135deg, ${C.bright}, ${C.primary})` : "#fff",
    color: primary ? "#fff" : C.primary,
    boxShadow: primary ? "0 6px 16px rgba(8,127,99,0.35)" : "none",
  });

  return (
    <div
      ref={rootRef}
      className="zm-tour"
      role="dialog"
      aria-modal="true"
      aria-label={isUr ? "ایپ کا تعارف" : "App tour"}
      style={{ position: "absolute", inset: 0, zIndex: 500, fontFamily: font }}
    >
      <style>{TOUR_CSS}</style>

      {/* Dim layer with a hole over the lit element */}
      {litBox ? (
        <div
          className="zm-tour-spot"
          style={{
            left: litBox.x - PAD,
            top: litBox.y - PAD,
            width: litBox.w + PAD * 2,
            height: litBox.h + PAD * 2,
            borderRadius: Math.min(26, (litBox.h + PAD * 2) / 2),
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: ready ? "rgba(3, 30, 24, 0.78)" : "rgba(3, 30, 24, 0.3)",
            transition: "background .3s",
          }}
        />
      )}

      {/* Moving between screens */}
      {!ready && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <span className="zm-tour-spinner" />
        </div>
      )}

      {/* The card */}
      {ready && (
        <div key={i} className="zm-tour-card" dir={isUr ? "rtl" : "ltr"} style={{ position: "absolute", zIndex: 2, ...cardStyle }}>
          {arrow && (
            <span
              style={{
                position: "absolute",
                left: arrow.x - 24,
                [arrow.side]: -8,
                width: 16,
                height: 16,
                background: "#fff",
                transform: "rotate(45deg)",
                borderRadius: 3,
              }}
            />
          )}
          <div style={{ position: "relative", background: "#fff", borderRadius: 22, padding: "14px 16px 12px", boxShadow: "0 18px 50px rgba(0,0,0,0.35)" }}>
            {step.art && <Art kind={step.art} isUr={isUr} />}

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: C.primary,
                  background: C.mint,
                  borderRadius: 999,
                  padding: "3px 9px",
                  fontFamily: "'Inter', sans-serif",
                  direction: "ltr",
                }}
              >
                {i + 1} / {STEPS.length}
              </span>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", background: C.mint, borderRadius: 999, padding: 2, direction: "ltr" }}>
                {(["en", "ur"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      stopSpeaking();
                      setLang(l);
                      window.setTimeout(measure, 150);
                    }}
                    aria-pressed={lang === l}
                    style={{
                      height: 28,
                      padding: "0 10px",
                      borderRadius: 999,
                      fontSize: l === "ur" ? 13.5 : 12,
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
              <button
                onClick={() => speakText(`${L(step.title)}. ${L(step.body)}`)}
                aria-label={isUr ? "سنیں" : "Listen"}
                title={isUr ? "سنیں" : "Listen"}
                style={{ width: 32, height: 32, borderRadius: 999, background: C.mint, display: "grid", placeItems: "center" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  <path d="M19 5a10 10 0 0 1 0 14" />
                </svg>
              </button>
            </div>

            <h2 style={{ fontSize: isUr ? 20 : 18.5, lineHeight: isUr ? 1.7 : 1.25, fontWeight: 800, color: C.ink, margin: 0 }}>{L(step.title)}</h2>
            <p style={{ fontSize: isUr ? 15 : 14, lineHeight: isUr ? 1.9 : 1.5, color: C.muted, margin: "3px 0 0" }}>{L(step.body)}</p>

            {/* Progress */}
            <div style={{ height: 5, borderRadius: 999, background: "#E3ECE8", margin: "12px 0 10px", overflow: "hidden", direction: "ltr" }}>
              <div style={{ height: "100%", width: `${((i + 1) / STEPS.length) * 100}%`, background: C.bright, borderRadius: 999, transition: "width .35s" }} />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
              {!isLast && (
                <button
                  onClick={finish}
                  style={{ marginInlineEnd: "auto", height: 42, padding: "0 6px", background: "transparent", color: C.muted, fontWeight: 700, fontSize: isUr ? 14.5 : 13.5, fontFamily: font }}
                >
                  {isUr ? "چھوڑیں" : "Skip"}
                </button>
              )}
              {!isFirst && !isLast && (
                <button onClick={() => go(-1)} style={btn(false)}>
                  {isUr ? "پیچھے" : "Back"}
                </button>
              )}
              <button onClick={() => go(1)} style={{ ...btn(true), flex: isLast ? 1 : undefined }}>
                {isFirst ? (isUr ? "تعارف شروع کریں" : "Start the tour") : isLast ? (isUr ? "ایپ استعمال کریں" : "Start using the app") : isUr ? "اگلا" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Art({ kind, isUr }: { kind: "welcome" | "done"; isUr: boolean }) {
  const tx = (en: string, ur: string) => (isUr ? ur : en);
  return (
    <div
      style={{
        position: "relative",
        height: 116,
        borderRadius: 16,
        marginBottom: 12,
        overflow: "hidden",
        background: `linear-gradient(150deg, ${C.bright}, ${C.deep})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {kind === "done" &&
        Array.from({ length: 14 }).map((_, k) => (
          <span
            key={k}
            className="zm-tour-confetti"
            style={{
              left: `${6 + ((k * 37) % 88)}%`,
              background: [C.gold, "#fff", "#9BE7C0", "#FFD6A5"][k % 4],
              animationDelay: `${(k % 7) * 0.12}s`,
            }}
          />
        ))}
      <div className="zm-tour-pop" style={{ textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 44, lineHeight: 1 }}>{kind === "done" ? "🎉" : "🌾"}</div>
        <div style={{ marginTop: 8, fontWeight: 800, fontSize: isUr ? 18 : 16, fontFamily: isUr ? URDU_FONT : "inherit" }}>
          {kind === "done" ? tx("Tour complete", "تعارف مکمل") : tx("Zarai Mandi", "زرعی منڈی")}
        </div>
        {kind === "welcome" && (
          <div style={{ marginTop: 2, fontSize: isUr ? 13 : 12, opacity: 0.85, fontFamily: isUr ? URDU_FONT : "inherit" }}>
            {tx("A walk through every screen", "ہر اسکرین کا جائزہ")}
          </div>
        )}
      </div>
    </div>
  );
}

const TOUR_CSS = `
.zm-tour button { cursor: pointer; border: none; }
.zm-tour-spot {
  position: absolute;
  box-shadow: 0 0 0 9999px rgba(3, 30, 24, 0.78);
  outline: 3px solid #9BE7C0;
  transition: left .35s ease, top .35s ease, width .35s ease, height .35s ease, border-radius .35s ease;
  pointer-events: none;
}
.zm-tour-spot::after {
  content: "";
  position: absolute;
  inset: -3px;
  border-radius: inherit;
  border: 3px solid #9BE7C0;
  animation: zmTourPulse 1.6s ease-out infinite;
}
@keyframes zmTourPulse { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.12); } }
.zm-tour-card { animation: zmTourIn .32s cubic-bezier(.2,.9,.3,1.2) both; }
@keyframes zmTourIn { from { opacity: 0; transform: translateY(10px) scale(.97); } }
.zm-tour-card[style*="translateY(-50%)"] { animation-name: zmTourInCenter; }
@keyframes zmTourInCenter { from { opacity: 0; transform: translateY(calc(-50% + 10px)) scale(.97); } }
.zm-tour-pop { animation: zmTourPop .45s cubic-bezier(.2,.9,.3,1.3) both; }
@keyframes zmTourPop { from { opacity: 0; transform: scale(.8) translateY(6px); } }
.zm-tour-spinner {
  width: 34px; height: 34px; border-radius: 50%;
  border: 3px solid rgba(255,255,255,.35); border-top-color: #fff;
  animation: zmTourSpin .8s linear infinite;
}
@keyframes zmTourSpin { to { transform: rotate(360deg); } }
.zm-tour-confetti {
  position: absolute; top: -10px; width: 7px; height: 11px; border-radius: 2px;
  animation: zmTourFall 1.6s ease-in infinite;
}
@keyframes zmTourFall { to { transform: translateY(140px) rotate(320deg); opacity: .2; } }
@media (prefers-reduced-motion: reduce) {
  .zm-tour *, .zm-tour-spot::after { animation: none !important; transition: none !important; }
}
`;
