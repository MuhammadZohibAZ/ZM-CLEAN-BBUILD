import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { speakText, stopSpeaking } from "../shared/voice";

// ─── APP TUTORIAL ─────────────────────────────────────────────────────────────
// The first time Home opens, the app asks whether the user wants a quick tour.
// Yes: a short guided walk through the main path only — Home (products,
// favourites, the menu bar), a product's cards, and a by-product's rates —
// a few steps per screen, then the user explores the rest alone. The last step
// on Home and on the cards screen has the user tap through to the next screen.
// No: nothing is shown. Settings → App Tour runs it again.
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
function topScreen(): TourScreen | null {
  for (const [s, q] of DETECT) if (visibleEl(q)) return s;
  return null;
}

// ─── THE STEPS, SCREEN BY SCREEN ─────────────────────────────────────────────

const STEPS: Partial<Record<TourScreen, Step[]>> = {
  home: [
    {
      target: "products-row",
      title: t("Your products", "آپ کی مصنوعات"),
      body: t("Each circle is a product. Tap one to see today's rates. Swipe sideways for more.", "ہر دائرہ ایک پروڈکٹ ہے۔ آج کے ریٹ دیکھنے کے لیے اس پر دبائیں۔ مزید کے لیے دائیں بائیں سوائپ کریں۔"),
    },
    {
      target: "favorites",
      title: t("Favourites", "پسندیدہ"),
      body: t("Rates you save with the ☆ star show up here, so you see them first.", "جن ریٹس پر آپ ☆ ستارہ لگائیں وہ یہاں سب سے پہلے نظر آتے ہیں۔"),
    },
    {
      target: "navbar",
      title: t("Menu bar", "مینو بار"),
      body: t("Home brings you back here. Entertainment has short videos and mandi news. Settings has your account, language and help.", "ہوم سے یہاں واپس آئیں۔ تفریح میں مختصر ویڈیوز اور منڈی کی خبریں ہیں۔ ترتیبات میں آپ کا اکاؤنٹ، زبان اور مدد ہے۔"),
    },
    {
      target: '[data-tour="products-row"] [data-home-product]',
      title: t("Open a product", "ایک پروڈکٹ کھولیں"),
      body: t("We'll continue on the next screen.", "رہنمائی اگلی اسکرین پر جاری رہے گی۔"),
      act: t("Tap this product", "اس پروڈکٹ پر ٹیپ کریں"),
      until: () => !!visibleEl(FIRST_CARD) || !!visibleEl("bp-filters"),
      leaves: true,
    },
  ],

  product: [
    {
      target: FIRST_CARD,
      title: t("One card per by-product", "ہر ضمنی مصنوع کا ایک کارڈ"),
      body: t("E.g. Wheat → Flour, Bran, Maida. Each card shows today's average low and high rate per 40 kg, and how many mandis reported it.", "جیسے گندم ← آٹا، چوکر، میدہ۔ ہر کارڈ پر آج کا اوسط کم اور زیادہ ریٹ فی 40 کلو، اور کتنی منڈیوں نے ریٹ دیا۔"),
    },
    {
      target: "bp-filters",
      title: t("Filters", "فلٹر"),
      body: t("Pick a rate type (Mandi, Wholesale, Stock…) or quality, and every card changes to match.", "ریٹ کی قسم (منڈی، ہول سیل، اسٹاک…) یا معیار چنیں، اور ہر کارڈ اسی کے مطابق بدل جاتا ہے۔"),
    },
    {
      target: FIRST_CARD,
      title: t("Every mandi's rate", "ہر منڈی کا ریٹ"),
      body: t("A card opens its rate in every mandi. We'll continue there.", "کارڈ کھولنے پر ہر منڈی کا ریٹ آتا ہے۔ رہنمائی وہیں جاری رہے گی۔"),
      act: t("Tap the card", "کارڈ پر ٹیپ کریں"),
      until: () => !!visibleEl("rates-hero"),
      leaves: true,
    },
  ],

  rates: [
    {
      target: "rates-hero",
      title: t("Today's rate", "آج کا ریٹ"),
      body: t("The average rate per 40 kg, the change since the last report, and a 30-day line.", "فی 40 کلو اوسط ریٹ، پچھلی رپورٹ سے فرق، اور 30 دن کی لکیر۔"),
    },
    {
      target: "rates-filters",
      title: t("Filters", "فلٹر"),
      body: t("Change the place (all Pakistan, a district or one mandi), the day, the rate type or quality. The rate and the list below follow.", "مقام (پورا پاکستان، ضلع یا ایک منڈی)، دن، ریٹ کی قسم یا معیار بدلیں۔ ریٹ اور نیچے کی فہرست اسی کے مطابق بدلتی ہے۔"),
    },
    {
      target: '[data-tour="mandi-table"] tbody tr',
      title: t("Every mandi", "ہر منڈی"),
      body: t("Each row is one mandi's rate today. Tap a row for its history.", "ہر قطار ایک منڈی کا آج کا ریٹ ہے۔ اس کی تاریخ دیکھنے کے لیے دبائیں۔"),
    },
    {
      target: '[data-tour="rates-tabs"] [data-tab="trends"]',
      title: t("Trends", "رجحانات"),
      body: t("How this rate moved over weeks and months. That's the tour — the rest is yours to explore. Settings → App Tour shows it again.", "یہ ریٹ ہفتوں اور مہینوں میں کیسے بدلا۔ رہنمائی مکمل — باقی خود دیکھیں۔ ترتیبات ← ایپ کا تعارف سے دوبارہ دیکھیں۔"),
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
  glow: "#9BE7C0",
};

// ─── HOST: asks once, then runs each screen's walkthrough on its first visit ──

export function ScreenTips({ enabled }: { enabled: boolean }) {
  const [screen, setScreen] = useState<TourScreen | null>(null);
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
      else if (mode === "on" && STEPS[s] && !seen.includes(s)) setScreen(s);
    }, 250);
    return () => window.clearInterval(id);
  }, [enabled]);

  if (asking)
    return (
      <AskTutorial
        onAnswer={(yes) => {
          saveStore({ mode: yes ? "on" : "off" });
          setAsking(false);
          if (yes) setScreen("home");
        }}
      />
    );
  if (!screen) return null;
  const close = (stopAll: boolean) => {
    markSeen(screen);
    if (stopAll) saveStore({ mode: "off" });
    setScreen(null);
  };
  return (
    <Walkthrough
      key={screen}
      screen={screen}
      steps={STEPS[screen] ?? []}
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
    "Want a quick tour? In about a minute we'll show you the main things: your products, their rates, and the filters.",
    "کیا آپ مختصر تعارف چاہتے ہیں؟ تقریباً ایک منٹ میں ہم اہم چیزیں دکھائیں گے: آپ کی مصنوعات، ان کے ریٹ، اور فلٹر۔",
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
.zm-tour-block, .zm-tour-card, .zm-tour-ask { pointer-events: auto; }
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
