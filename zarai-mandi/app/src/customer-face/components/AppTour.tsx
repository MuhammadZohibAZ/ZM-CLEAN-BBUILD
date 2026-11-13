import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { speakText, stopSpeaking } from "../shared/voice";

// ─── SCREEN TIPS (APP TOUR) ───────────────────────────────────────────────────
// Each screen has its own short tour of just its features. It plays the first
// time the user lands on that screen (remembered per screen on this device),
// lighting up one part at a time (elements marked data-tour="…").
// Settings → App Tour clears the memory, so every screen shows its tips again.
// The test link takes ?tour=0 (no tips) or ?tour=1 (start fresh).

const SEEN_KEY = "zm_screen_tips_v1";

export type TourScreen = "home" | "profile" | "viewall" | "account" | "product" | "rates" | "trends" | "news";

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(SEEN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}
function writeSeen(s: Set<string>) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...s]));
  } catch {
    /* private mode: tips may show again next visit */
  }
}
// Kept in memory too, so tips don't repeat in a session where storage is blocked.
let seenCache: Set<string> | null = null;
const seen = () => (seenCache ??= readSeen());
function markSeen(screen: TourScreen) {
  seen().add(screen);
  writeSeen(seen());
}
/** Settings → App Tour: every screen shows its tips again. */
export function resetScreenTips() {
  seenCache = new Set();
  writeSeen(seenCache);
}

type Txt = { en: string; ur: string };
type Step = {
  /** data-tour value (or a CSS selector starting with "[") to light up; none = a centred card. */
  target?: string;
  art?: boolean;
  title: Txt;
  body: Txt;
};

const FIRST_CARD = '[data-tour="bp-cards"] > :first-child';

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

const TIPS: Record<TourScreen, Step[]> = {
  home: [
    {
      art: true,
      title: { en: "Welcome to Zarai Mandi", ur: "زرعی منڈی میں خوش آمدید" },
      body: {
        en: "Today's mandi rates from all over Pakistan, in one app. Here's a quick look at this screen.",
        ur: "پورے پاکستان کی منڈیوں کے آج کے ریٹس، ایک ہی ایپ میں۔ آئیے اس اسکرین پر ایک نظر ڈالیں۔",
      },
    },
    {
      target: "account",
      title: { en: "Account and profile", ur: "اکاؤنٹ اور پروفائل" },
      body: {
        en: "Tap your photo for your profile, subscriptions, language, voice and help.",
        ur: "اپنی تصویر پر ٹیپ کریں: پروفائل، سبسکرپشنز، زبان، آواز اور مدد۔",
      },
    },
    {
      target: "bell",
      title: { en: "Notifications", ur: "نوٹیفکیشنز" },
      body: { en: "Rate alerts and mandi news arrive here.", ur: "ریٹ الرٹس اور منڈی کی خبریں یہاں آتی ہیں۔" },
    },
    {
      target: "search",
      title: { en: "Search", ur: "تلاش" },
      body: {
        en: "Type a product or item in English or Urdu, like Wheat, Kinnow or Urea, and go straight to its rates.",
        ur: "انگریزی یا اردو میں کسی چیز کا نام لکھیں، جیسے گندم، کینو یا یوریا، اور سیدھا اس کے ریٹس پر جائیں۔",
      },
    },
    {
      target: "profile",
      title: { en: "Complete your profile", ur: "اپنی پروفائل مکمل کریں" },
      body: {
        en: "Choose your products and plan here. Every product is PKR 2,000 a month.",
        ur: "یہاں اپنی مصنوعات اور پلان چنیں۔ ہر پروڈکٹ 2,000 روپے ماہانہ ہے۔",
      },
    },
    {
      target: "products",
      title: { en: "Your products", ur: "آپ کی مصنوعات" },
      body: {
        en: "Each circle is a product. Tap one to see its rates; ones with a lock need a subscription.",
        ur: "ہر دائرہ ایک پروڈکٹ ہے۔ ریٹس دیکھنے کے لیے ٹیپ کریں؛ تالے والی کے لیے سبسکرپشن چاہیے۔",
      },
    },
    {
      target: "viewall",
      title: { en: "View All", ur: "سب دیکھیں" },
      body: { en: "Every product, in groups.", ur: "تمام مصنوعات، گروپس میں۔" },
    },
    {
      target: "favorites",
      title: { en: "Favourites", ur: "پسندیدہ" },
      body: {
        en: "Items you star on a rate screen appear here, one tap from today's rate.",
        ur: "ریٹ اسکرین پر جن چیزوں پر آپ ستارہ لگائیں وہ یہاں آتی ہیں، آج کا ریٹ ایک ٹیپ پر۔",
      },
    },
    {
      target: "nav-news",
      title: { en: "Entertainment", ur: "تفریح" },
      body: { en: "Short videos: farming tips and market news.", ur: "مختصر ویڈیوز: کاشتکاری کے مشورے اور منڈی کی خبریں۔" },
    },
    {
      target: "nav-settings",
      title: { en: "Settings", ur: "ترتیبات" },
      body: {
        en: "Your account. Each screen shows you its own tips the first time; replay them from here with App Tour.",
        ur: "آپ کا اکاؤنٹ۔ ہر اسکرین پہلی بار اپنی رہنمائی خود دکھائے گی؛ 'ایپ کا تعارف' سے یہ دوبارہ دیکھیں۔",
      },
    },
  ],
  profile: [
    {
      target: "profile-sheet",
      title: { en: "3 easy steps", ur: "3 آسان مراحل" },
      body: {
        en: "1. Pick the products you trade.  2. Choose how many months.  3. Pay by JazzCash, Easypaisa, card or bank. Every product is PKR 2,000 a month.",
        ur: "1۔ اپنی مصنوعات چنیں۔  2۔ مہینے چنیں۔  3۔ جاز کیش، ایزی پیسہ، کارڈ یا بینک سے ادائیگی کریں۔ ہر پروڈکٹ 2,000 روپے ماہانہ۔",
      },
    },
  ],
  viewall: [
    {
      target: "viewall-group",
      title: { en: "All products, in groups", ur: "تمام مصنوعات، گروپس میں" },
      body: {
        en: "Grains, Edible Oils, Fruits, Vegetables, Fertilizer, Dry Fruits, Herbs and Kiryana. Tap 'See more' to open a group, and any product to see it.",
        ur: "اناج، خوردنی تیل، پھل، سبزیاں، کھاد، خشک میوہ، جڑی بوٹیاں اور کریانہ۔ گروپ کھولنے کے لیے 'مزید دیکھیں' اور کسی بھی پروڈکٹ پر ٹیپ کریں۔",
      },
    },
  ],
  account: [
    {
      target: "acc-profile",
      title: { en: "Your profile", ur: "آپ کی پروفائل" },
      body: { en: "Tap to change your name, number or area.", ur: "نام، نمبر یا علاقہ بدلنے کے لیے ٹیپ کریں۔" },
    },
    {
      target: "acc-account",
      title: { en: "Subscriptions", ur: "سبسکرپشنز" },
      body: {
        en: "See and renew your products, or register as a representative for your mandi.",
        ur: "اپنی مصنوعات دیکھیں اور تجدید کریں، یا اپنی منڈی کے نمائندہ بنیں۔",
      },
    },
    {
      target: "acc-prefs",
      title: { en: "Language and voice", ur: "زبان اور آواز" },
      body: {
        en: "Switch between English and Urdu, and turn on voice so the app reads rates aloud.",
        ur: "انگریزی اور اردو میں بدلیں، اور آواز آن کریں تاکہ ایپ ریٹس پڑھ کر سنائے۔",
      },
    },
    {
      target: "acc-support",
      title: { en: "Help, and the App Tour", ur: "مدد، اور ایپ کا تعارف" },
      body: {
        en: "Contact us on WhatsApp or the helpline. App Tour shows every screen's tips again.",
        ur: "واٹس ایپ یا ہیلپ لائن پر رابطہ کریں۔ 'ایپ کا تعارف' ہر اسکرین کی رہنمائی دوبارہ دکھاتا ہے۔",
      },
    },
  ],
  product: [
    {
      target: FIRST_CARD,
      title: { en: "One card per item", ur: "ہر چیز کا ایک کارڈ" },
      body: {
        en: "Each card shows today's average min and max rate, total arrival, and how many mandis reported. Tap a card for every mandi's rate.",
        ur: "ہر کارڈ میں آج کا اوسط کم اور زیادہ ریٹ، کل آمد، اور کتنی منڈیوں نے ریٹ دیا۔ ہر منڈی کا ریٹ دیکھنے کے لیے کارڈ پر ٹیپ کریں۔",
      },
    },
    {
      target: "bp-filters",
      title: { en: "Filters", ur: "فلٹر" },
      body: {
        en: "Show only one rate type (mandi, wholesale, retail…) or one quality, crop or company.",
        ur: "صرف ایک قسم کا ریٹ (منڈی، ہول سیل، ریٹیل…) یا ایک کوالٹی، فصل یا کمپنی دیکھیں۔",
      },
    },
    {
      target: "bp-date",
      title: { en: "Pick a date", ur: "تاریخ چنیں" },
      body: {
        en: "Rates are for today. Tap the date to see an earlier day.",
        ur: "ریٹس آج کے ہیں۔ پچھلے دن کے ریٹ دیکھنے کے لیے تاریخ پر ٹیپ کریں۔",
      },
    },
  ],
  rates: [
    {
      target: "rates-hero",
      title: { en: "Today's rate", ur: "آج کا ریٹ" },
      body: {
        en: "The average rate, how much it moved since the last day, the last month's line, and min, max and arrival.",
        ur: "اوسط ریٹ، پچھلے دن سے فرق، پچھلے مہینے کی لکیر، اور کم، زیادہ اور آمد۔",
      },
    },
    {
      target: "rates-next",
      title: { en: "Best mandis and map", ur: "بہترین منڈیاں اور نقشہ" },
      body: {
        en: "Swipe the card to see where the rate is highest today, and every mandi on the map.",
        ur: "کارڈ کو سوائپ کریں: آج کہاں ریٹ سب سے زیادہ ہے، اور نقشے پر ہر منڈی۔",
      },
    },
    {
      target: "rates-filters",
      title: { en: "Location, day and rate", ur: "مقام، دن اور ریٹ" },
      body: {
        en: "Choose a province, district or one mandi, a day, and the rate type. Every number on the screen follows your choice.",
        ur: "صوبہ، ضلع یا کوئی ایک منڈی، دن اور ریٹ کی قسم چنیں۔ اسکرین کا ہر نمبر آپ کے انتخاب کے مطابق بدلتا ہے۔",
      },
    },
    {
      target: "rates-mandis",
      title: { en: "Every mandi's rate", ur: "ہر منڈی کا ریٹ" },
      body: {
        en: "A row for each mandi with its rate and change. Sort the columns, switch to cards, or tap a mandi for its detail.",
        ur: "ہر منڈی کی قطار، ریٹ اور فرق کے ساتھ۔ کالم ترتیب دیں، کارڈز پر جائیں، یا تفصیل کے لیے منڈی پر ٹیپ کریں۔",
      },
    },
    {
      target: "rates-star",
      title: { en: "Save to favourites", ur: "پسندیدہ میں محفوظ کریں" },
      body: {
        en: "Tap the star and this item is kept on your Home screen.",
        ur: "ستارے پر ٹیپ کریں اور یہ چیز آپ کی ہوم اسکرین پر رہے گی۔",
      },
    },
    {
      target: "rates-tabs",
      title: { en: "Trends", ur: "رجحانات" },
      body: {
        en: "Open Trends to see how the rate moved over time.",
        ur: "وقت کے ساتھ ریٹ کیسے بدلا، یہ دیکھنے کے لیے رجحانات کھولیں۔",
      },
    },
  ],
  trends: [
    {
      target: "rates-trends",
      title: { en: "Trends", ur: "رجحانات" },
      body: {
        en: "Pick a period (1 day to 1 year) to see the rate or arrivals over time, and compare every rate type below.",
        ur: "مدت چنیں (1 دن سے 1 سال) اور وقت کے ساتھ ریٹ یا آمد دیکھیں، اور نیچے ہر قسم کے ریٹ کا موازنہ کریں۔",
      },
    },
  ],
  news: [
    {
      target: "reels-tabs",
      title: { en: "Videos", ur: "ویڈیوز" },
      body: {
        en: "Farming tips, market news and harvest videos. Pick a category up here and swipe up for the next video.",
        ur: "کاشتکاری کے مشورے، منڈی کی خبریں اور کٹائی کی ویڈیوز۔ اوپر سے قسم چنیں اور اگلی ویڈیو کے لیے اوپر سوائپ کریں۔",
      },
    },
  ],
};

const C = {
  deep: "#064D40",
  primary: "#087F63",
  bright: "#2FAE68",
  mint: "#E8F5EF",
  ink: "#183B34",
  muted: "#52635F",
};

const sel = (t: string) => (t.startsWith("[") ? t : `[data-tour="${t}"]`);
function visibleEl(t: string): HTMLElement | null {
  const el = document.querySelector<HTMLElement>(sel(t));
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? el : null;
}
const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
function topScreen(): TourScreen | null {
  for (const [s, t] of DETECT) if (visibleEl(t)) return s;
  return null;
}

// ─── HOST: watches which screen is up and starts its tips once ───────────────

export function ScreenTips({ enabled }: { enabled: boolean }) {
  const [screen, setScreen] = useState<TourScreen | null>(null);
  const openRef = useRef(false);
  openRef.current = !!screen;

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("tour");
    if (q === "1") resetScreenTips();
  }, []);

  useEffect(() => {
    if (!enabled || new URLSearchParams(window.location.search).get("tour") === "0") return;
    let last: TourScreen | null = null;
    let since = 0;
    const id = window.setInterval(() => {
      if (openRef.current) return;
      const s = topScreen();
      if (s !== last) {
        last = s;
        since = Date.now();
        return;
      }
      // Let the screen settle (data loaded, animations done) before starting.
      if (s && !seen().has(s) && Date.now() - since > 900) setScreen(s);
    }, 250);
    return () => window.clearInterval(id);
  }, [enabled]);

  if (!screen) return null;
  return (
    <TipsOverlay
      key={screen}
      steps={TIPS[screen]}
      onClose={() => {
        markSeen(screen);
        setScreen(null);
      }}
    />
  );
}

type Box = { x: number; y: number; w: number; h: number };

function TipsOverlay({ steps: all, onClose }: { steps: Step[]; onClose: () => void }) {
  const { lang, setLang } = useLang();
  const isUr = lang === "ur";
  const L = (t: Txt) => (isUr ? t.ur : t.en);
  const font = isUr ? URDU_FONT : "'Inter', 'Poppins', sans-serif";

  // Only the parts this screen has right now (e.g. no profile chip once it's done).
  const [steps] = useState(() => all.filter((s) => !s.target || visibleEl(s.target)));
  const rootRef = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(-1);
  const [box, setBox] = useState<Box | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const runRef = useRef(0);

  // Measure the lit element relative to the overlay (correct under CSS zoom too).
  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const rr = root.getBoundingClientRect();
    const scale = root.offsetWidth ? rr.width / root.offsetWidth : 1;
    const h = root.offsetHeight;
    setSize({ w: root.offsetWidth, h });
    const s = steps[i];
    const el = s?.target ? visibleEl(s.target) : null;
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
  }, [i, steps]);

  useLayoutEffect(() => {
    const run = ++runRef.current;
    const s = steps[i];
    if (!s) return;
    setShown(-1);
    (async () => {
      const el = s.target ? visibleEl(s.target) : null;
      if (el) {
        el.scrollIntoView({ block: el.getBoundingClientRect().height > 300 ? "start" : "center", inline: "nearest" });
        await sleep(300);
      }
      if (run !== runRef.current) return;
      measure();
      setShown(i);
    })();
  }, [i, steps, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    if (steps.length === 0) onClose();
    return () => stopSpeaking();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    runRef.current++;
    stopSpeaking();
    onClose();
  };
  const go = (d: number) => {
    stopSpeaking();
    const next = i + d;
    if (next >= steps.length) return finish();
    if (next >= 0) setI(next);
  };

  const step = steps[i];
  if (!step) return null;
  const ready = shown === i;
  const isLast = i === steps.length - 1;
  const litBox = ready ? box : null;

  // Card placement: under the lit element if it fits, else above, else at the bottom.
  const PAD = 6;
  const GAP = 14;
  const NEED = 210;
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
    height: 40,
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
      aria-label={isUr ? "رہنمائی" : "Tips"}
      style={{ position: "absolute", inset: 0, zIndex: 500, fontFamily: font }}
    >
      <style>{TOUR_CSS}</style>

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
        <div style={{ position: "absolute", inset: 0, background: "rgba(3, 30, 24, 0.78)" }} />
      )}

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
            {step.art && (
              <div
                className="zm-tour-pop"
                style={{
                  height: 104,
                  borderRadius: 16,
                  marginBottom: 12,
                  background: `linear-gradient(150deg, ${C.bright}, ${C.deep})`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <div style={{ fontSize: 40, lineHeight: 1 }}>🌾</div>
                <div style={{ marginTop: 8, fontWeight: 800, fontSize: isUr ? 18 : 16 }}>{isUr ? "زرعی منڈی" : "Zarai Mandi"}</div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              {steps.length > 1 && (
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
                  {i + 1} / {steps.length}
                </span>
              )}
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

            {steps.length > 1 && (
              <div style={{ display: "flex", gap: 4, margin: "12px 0 0", direction: "ltr" }}>
                {steps.map((_, k) => (
                  <span key={k} style={{ flex: 1, height: 5, borderRadius: 999, background: k <= i ? C.bright : "#E3ECE8", transition: "background .3s" }} />
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center", marginTop: 10 }}>
              {!isLast && (
                <button
                  onClick={finish}
                  style={{ marginInlineEnd: "auto", height: 40, padding: "0 6px", background: "transparent", color: C.muted, fontWeight: 700, fontSize: isUr ? 14.5 : 13.5, fontFamily: font }}
                >
                  {isUr ? "چھوڑیں" : "Skip"}
                </button>
              )}
              {i > 0 && (
                <button onClick={() => go(-1)} style={btn(false)}>
                  {isUr ? "پیچھے" : "Back"}
                </button>
              )}
              <button onClick={() => go(1)} style={{ ...btn(true), flex: isLast && i === 0 ? 1 : undefined }}>
                {isLast ? (isUr ? "سمجھ گیا" : "Got it") : isUr ? "اگلا" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
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
@keyframes zmTourPop { from { opacity: 0; transform: scale(.9) translateY(6px); } }
@media (prefers-reduced-motion: reduce) {
  .zm-tour *, .zm-tour-spot::after { animation: none !important; transition: none !important; }
}
`;
