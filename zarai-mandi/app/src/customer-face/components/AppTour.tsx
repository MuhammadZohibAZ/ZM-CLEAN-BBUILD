import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { speakText, stopSpeaking } from "../shared/voice";

// ─── SCREEN TIPS (APP TOUR) ───────────────────────────────────────────────────
// Each screen has its own tips: all its main parts lit up at once with a short
// label each, and one card with "Got it" (one tap per screen). Shown the first
// time the user lands on that screen (remembered per screen on this device).
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
type Side = "below" | "above" | "left" | "right";
/** One lit part of the screen, with an optional short label beside it. */
type Mark = { target: string; label?: Txt; side?: Side };
/** Everything a screen explains, shown at once: lit parts + one card. */
type Tip = { marks: Mark[]; title: Txt; body: Txt };

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

const TIPS: Record<TourScreen, Tip> = {
  home: {
    marks: [
      { target: "account", side: "below", label: { en: "Account & profile", ur: "اکاؤنٹ اور پروفائل" } },
      { target: "bell", side: "left", label: { en: "Alerts", ur: "الرٹس" } },
      { target: "search", side: "above", label: { en: "Search any product", ur: "کوئی بھی چیز تلاش کریں" } },
      { target: "profile", side: "above", label: { en: "Subscribe here", ur: "یہاں سبسکرائب کریں" } },
      { target: "products", side: "below", label: { en: "Tap a product for its rates", ur: "ریٹس کے لیے پروڈکٹ پر ٹیپ کریں" } },
      { target: "nav-news", side: "above", label: { en: "Videos", ur: "ویڈیوز" } },
      { target: "nav-settings", side: "above", label: { en: "Settings", ur: "ترتیبات" } },
    ],
    title: { en: "Welcome to Zarai Mandi", ur: "زرعی منڈی میں خوش آمدید" },
    body: {
      en: "Today's mandi rates from all over Pakistan. 'View All' shows every product, and rates you star appear under Favourites. Each screen shows its own tips the first time.",
      ur: "پورے پاکستان کی منڈیوں کے آج کے ریٹس۔ 'سب دیکھیں' میں تمام مصنوعات ہیں، اور جن ریٹس پر آپ ستارہ لگائیں وہ پسندیدہ میں آتے ہیں۔ ہر اسکرین پہلی بار اپنی رہنمائی خود دکھائے گی۔",
    },
  },
  product: {
    marks: [
      { target: "bp-date", side: "left", label: { en: "Change the date", ur: "تاریخ بدلیں" } },
      { target: "bp-filters", side: "right", label: { en: "Filter by rate type", ur: "ریٹ کی قسم سے فلٹر" } },
      { target: FIRST_CARD, side: "below", label: { en: "Tap a card for every mandi", ur: "ہر منڈی کے لیے کارڈ پر ٹیپ کریں" } },
    ],
    title: { en: "One card per item", ur: "ہر چیز کا ایک کارڈ" },
    body: {
      en: "Each card shows today's average min and max rate, total arrival, and how many mandis reported.",
      ur: "ہر کارڈ میں آج کا اوسط کم اور زیادہ ریٹ، کل آمد، اور کتنی منڈیوں نے ریٹ دیا۔",
    },
  },
  rates: {
    marks: [
      { target: "rates-star", side: "left", label: { en: "Save to favourites", ur: "پسندیدہ میں رکھیں" } },
      { target: '[data-tour="rates-tabs"] [data-tab="trends"]', side: "left", label: { en: "Rate over time", ur: "وقت کے ساتھ ریٹ" } },
      { target: "rates-filters", side: "below", label: { en: "Location, day and rate type", ur: "مقام، دن اور ریٹ کی قسم" } },
      { target: "rates-next" }, // its own text already says "Swipe for best mandis & map"
    ],
    title: { en: "Today's rate", ur: "آج کا ریٹ" },
    body: {
      en: "The average rate and its change since the last day. Scroll down for every mandi's rate; tap a mandi for its detail.",
      ur: "اوسط ریٹ اور پچھلے دن سے فرق۔ ہر منڈی کا ریٹ دیکھنے کے لیے نیچے جائیں؛ تفصیل کے لیے منڈی پر ٹیپ کریں۔",
    },
  },
  trends: {
    marks: [{ target: "rates-trends" }],
    title: { en: "Trends", ur: "رجحانات" },
    body: {
      en: "Pick a period (1 day to 1 year) to see the rate or arrivals over time, and compare every rate type below.",
      ur: "مدت چنیں (1 دن سے 1 سال) اور وقت کے ساتھ ریٹ یا آمد دیکھیں، اور نیچے ہر قسم کے ریٹ کا موازنہ کریں۔",
    },
  },
  viewall: {
    marks: [{ target: "viewall-group" }],
    title: { en: "All products, in groups", ur: "تمام مصنوعات، گروپس میں" },
    body: {
      en: "Grains, Edible Oils, Fruits, Vegetables, Fertilizer, Dry Fruits, Herbs and Kiryana. 'See more' opens a group.",
      ur: "اناج، خوردنی تیل، پھل، سبزیاں، کھاد، خشک میوہ، جڑی بوٹیاں اور کریانہ۔ 'مزید دیکھیں' سے گروپ کھولیں۔",
    },
  },
  profile: {
    marks: [{ target: "profile-sheet" }],
    title: { en: "3 easy steps", ur: "3 آسان مراحل" },
    body: {
      en: "Pick your products, choose the months, then pay by JazzCash, Easypaisa, card or bank. Every product is PKR 2,000 a month.",
      ur: "مصنوعات چنیں، مہینے چنیں، پھر جاز کیش، ایزی پیسہ، کارڈ یا بینک سے ادائیگی کریں۔ ہر پروڈکٹ 2,000 روپے ماہانہ۔",
    },
  },
  news: {
    marks: [{ target: "reels-tabs" }],
    title: { en: "Videos", ur: "ویڈیوز" },
    body: {
      en: "Farming tips, market news and harvest videos. Pick a category up here and swipe up for the next video.",
      ur: "کاشتکاری کے مشورے، منڈی کی خبریں اور کٹائی کی ویڈیوز۔ اوپر سے قسم چنیں اور اگلی ویڈیو کے لیے اوپر سوائپ کریں۔",
    },
  },
  account: {
    marks: [
      { target: "acc-profile", side: "below", label: { en: "Edit your profile", ur: "پروفائل میں تبدیلی" } },
      { target: "acc-account", side: "above", label: { en: "Your subscriptions", ur: "آپ کی سبسکرپشنز" } },
    ],
    title: { en: "Your account", ur: "آپ کا اکاؤنٹ" },
    body: {
      en: "Further down: English / Urdu and voice, help, and 'App Tour', which shows every screen's tips again.",
      ur: "نیچے: انگریزی / اردو اور آواز، مدد، اور 'ایپ کا تعارف' جو ہر اسکرین کی رہنمائی دوبارہ دکھاتا ہے۔",
    },
  },
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

const sel = (t: string) => (t.startsWith("[") ? t : `[data-tour="${t}"]`);
function visibleEl(t: string): HTMLElement | null {
  const el = document.querySelector<HTMLElement>(sel(t));
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? el : null;
}
function topScreen(): TourScreen | null {
  for (const [s, t] of DETECT) if (visibleEl(t)) return s;
  return null;
}

// ─── HOST: watches which screen is up and shows its tips once ────────────────

export function ScreenTips({ enabled }: { enabled: boolean }) {
  const [screen, setScreen] = useState<TourScreen | null>(null);
  const openRef = useRef(false);
  openRef.current = !!screen;

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tour") === "1") resetScreenTips();
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
      tip={TIPS[screen]}
      onClose={() => {
        markSeen(screen);
        setScreen(null);
      }}
    />
  );
}

type Box = { x: number; y: number; w: number; h: number };
type Lit = { box: Box; mark: Mark };

const PAD = 5; // light around each part
const LABEL_H = 30;

function TipsOverlay({ tip, onClose }: { tip: Tip; onClose: () => void }) {
  const { lang, setLang } = useLang();
  const isUr = lang === "ur";
  const L = (t: Txt) => (isUr ? t.ur : t.en);
  const font = isUr ? URDU_FONT : "'Inter', 'Poppins', sans-serif";

  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState<Lit[] | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [cardTop, setCardTop] = useState<number | null>(null);

  // Measure every part on screen now (correct under CSS zoom too).
  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const rr = root.getBoundingClientRect();
    const scale = root.offsetWidth ? rr.width / root.offsetWidth : 1;
    const w = root.offsetWidth;
    const h = root.offsetHeight;
    setSize({ w, h });
    const out: Lit[] = [];
    for (const mark of tip.marks) {
      const el = visibleEl(mark.target);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      let y = (r.top - rr.top) / scale;
      let bh = r.height / scale;
      if (y < 6) {
        bh -= 6 - y;
        y = 6;
      }
      if (y > h - 20 || bh < 8) continue; // off screen
      // A tall single part: light its top part so the card fits under it.
      bh = Math.min(bh, tip.marks.length === 1 ? Math.max(60, h * 0.45) : h - y - 6);
      out.push({ mark, box: { x: (r.left - rr.left) / scale, y, w: r.width / scale, h: bh } });
    }
    setLit(out);
  }, [tip]);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // Label positions.
  const labels = (lit || [])
    .filter((l) => l.mark.label)
    .map((l) => {
      const b = l.box;
      let side = l.mark.side || "below";
      // Left/right mean before/after in reading order, so they mirror in Urdu.
      if (isUr && side === "left") side = "right";
      else if (isUr && side === "right") side = "left";
      // No room beside it: put the label underneath instead.
      if ((side === "left" && b.x < 130) || (side === "right" && size.w - (b.x + b.w) < 130)) side = "below";
      const style: React.CSSProperties = { position: "absolute" };
      let top = 0;
      if (side === "below" || side === "above") {
        top = side === "below" ? b.y + b.h + PAD + 8 : b.y - PAD - 8 - LABEL_H;
        const cx = b.x + b.w / 2;
        if (cx < size.w * 0.3) style.left = Math.max(10, b.x);
        else if (cx > size.w * 0.7) style.right = Math.max(10, size.w - (b.x + b.w));
        else {
          style.left = cx;
          style.transform = "translateX(-50%)";
        }
      } else {
        top = b.y + b.h / 2 - LABEL_H / 2;
        if (side === "left") style.right = size.w - b.x + PAD + 8;
        else style.left = b.x + b.w + PAD + 8;
      }
      style.top = top;
      return { l, style, top };
    });

  // Card: in the biggest free band between lit parts and labels.
  useLayoutEffect(() => {
    if (!lit || !size.h || !cardRef.current) return;
    const ch = cardRef.current.offsetHeight;
    const busy: [number, number][] = [
      ...lit.map((l) => [l.box.y - PAD - 6, l.box.y + l.box.h + PAD + 6] as [number, number]),
      ...labels.map((x) => [x.top - 4, x.top + LABEL_H + 4] as [number, number]),
    ].sort((a, b) => a[0] - b[0]);
    let best: [number, number] = [0, 0];
    let cur = 8;
    for (const [a, b] of busy) {
      if (a - cur > best[1] - best[0]) best = [cur, a];
      cur = Math.max(cur, b);
    }
    if (size.h - 8 - cur > best[1] - best[0]) best = [cur, size.h - 8];
    const room = best[1] - best[0];
    setCardTop(room >= ch ? best[0] + (room - ch) / 2 : Math.max(8, size.h - ch - 96));
  }, [lit, size, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopSpeaking(), []);

  const done = () => {
    stopSpeaking();
    onClose();
  };

  const spoken = `${L(tip.title)}. ${L(tip.body)} ${labels.map((x) => L(x.l.mark.label!)).join(". ")}`;

  return (
    <div
      ref={rootRef}
      className="zm-tour"
      role="dialog"
      aria-modal="true"
      aria-label={L(tip.title)}
      style={{ position: "absolute", inset: 0, zIndex: 500, fontFamily: font }}
    >
      <style>{TOUR_CSS}</style>

      {/* Dim everything except the lit parts */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
        <defs>
          <mask id="zm-tour-holes">
            <rect width="100%" height="100%" fill="#fff" />
            {(lit || []).map((l, k) => (
              <rect
                key={k}
                x={l.box.x - PAD}
                y={l.box.y - PAD}
                width={l.box.w + PAD * 2}
                height={l.box.h + PAD * 2}
                rx={Math.min(22, (l.box.h + PAD * 2) / 2)}
                fill="#000"
              />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(3, 30, 24, 0.8)" mask="url(#zm-tour-holes)" />
      </svg>

      {(lit || []).map((l, k) => (
        <div
          key={k}
          className="zm-tour-ring"
          style={{
            left: l.box.x - PAD,
            top: l.box.y - PAD,
            width: l.box.w + PAD * 2,
            height: l.box.h + PAD * 2,
            borderRadius: Math.min(22, (l.box.h + PAD * 2) / 2),
            animationDelay: `${k * 0.12}s`,
          }}
        />
      ))}

      {labels.map((x, k) => (
        <div
          key={k}
          className="zm-tour-label"
          dir={isUr ? "rtl" : "ltr"}
          style={{
            ...x.style,
            height: LABEL_H,
            fontSize: isUr ? 13.5 : 12.5,
            animationDelay: `${0.1 + k * 0.08}s`,
          }}
        >
          {L(x.l.mark.label!)}
        </div>
      ))}

      {/* The one card for this screen */}
      {lit && (
        <div
          ref={cardRef}
          className="zm-tour-card"
          dir={isUr ? "rtl" : "ltr"}
          style={{ position: "absolute", left: 16, right: 16, top: cardTop ?? 0, visibility: cardTop == null ? "hidden" : "visible" }}
        >
          <div style={{ background: "#fff", borderRadius: 22, padding: "14px 16px 12px", boxShadow: "0 18px 50px rgba(0,0,0,0.35)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <h2 style={{ flex: 1, fontSize: isUr ? 19 : 17.5, lineHeight: isUr ? 1.7 : 1.3, fontWeight: 800, color: C.ink, margin: 0 }}>{L(tip.title)}</h2>
              <div style={{ display: "flex", background: C.mint, borderRadius: 999, padding: 2, direction: "ltr", flexShrink: 0 }}>
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
                onClick={() => speakText(spoken)}
                aria-label={isUr ? "سنیں" : "Listen"}
                title={isUr ? "سنیں" : "Listen"}
                style={{ width: 32, height: 32, borderRadius: 999, background: C.mint, display: "grid", placeItems: "center", flexShrink: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  <path d="M19 5a10 10 0 0 1 0 14" />
                </svg>
              </button>
            </div>
            <p style={{ fontSize: isUr ? 14.5 : 13.5, lineHeight: isUr ? 1.9 : 1.5, color: C.muted, margin: "4px 0 12px" }}>{L(tip.body)}</p>
            <button
              onClick={done}
              style={{
                width: "100%",
                height: 42,
                borderRadius: 999,
                fontWeight: 700,
                fontSize: isUr ? 15.5 : 14.5,
                fontFamily: font,
                background: `linear-gradient(135deg, ${C.bright}, ${C.primary})`,
                color: "#fff",
                boxShadow: "0 6px 16px rgba(8,127,99,0.35)",
              }}
            >
              {isUr ? "سمجھ گیا" : "Got it"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const TOUR_CSS = `
.zm-tour button { cursor: pointer; border: none; }
.zm-tour-ring {
  position: absolute;
  border: 2.5px solid ${C.glow};
  pointer-events: none;
  animation: zmTourRingIn .4s ease-out both;
}
.zm-tour-ring::after {
  content: "";
  position: absolute;
  inset: -3px;
  border-radius: inherit;
  border: 2.5px solid ${C.glow};
  animation: zmTourPulse 1.8s ease-out infinite;
}
@keyframes zmTourRingIn { from { opacity: 0; transform: scale(1.08); } }
@keyframes zmTourPulse { 0% { opacity: .85; transform: scale(1); } 100% { opacity: 0; transform: scale(1.1); } }
.zm-tour-label {
  display: flex; align-items: center; white-space: nowrap;
  padding: 0 11px; border-radius: 999px;
  background: #fff; color: ${C.deep}; font-weight: 700;
  border: 1.5px solid ${C.glow};
  box-shadow: 0 6px 16px rgba(0,0,0,.25);
  pointer-events: none;
  animation: zmTourPop .35s cubic-bezier(.2,.9,.3,1.3) both;
}
.zm-tour-card { animation: zmTourIn .35s cubic-bezier(.2,.9,.3,1.2) both; }
@keyframes zmTourIn { from { opacity: 0; transform: translateY(12px) scale(.97); } }
@keyframes zmTourPop { from { opacity: 0; transform: scale(.85); } }
.zm-tour-label[style*="translateX(-50%)"] { animation-name: zmTourPopC; }
@keyframes zmTourPopC { from { opacity: 0; transform: translateX(-50%) scale(.85); } }
@media (prefers-reduced-motion: reduce) {
  .zm-tour *, .zm-tour-ring::after { animation: none !important; }
}
`;
