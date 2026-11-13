import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { speakText, stopSpeaking } from "../shared/voice";

// ─── APP TOUR ─────────────────────────────────────────────────────────────────
// A step-by-step orientation for a new user, like a game tutorial: each step
// either shines a light on one part of Home (an element marked data-tour="…")
// or shows a small picture of a screen further in. English and Urdu.
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

type Txt = { en: string; ur: string };
type Scene = "welcome" | "product" | "rates" | "trends" | "plan" | "done";
type Step = {
  /** data-tour value of the element to light up; none = a centred card. */
  target?: string;
  scene?: Scene;
  title: Txt;
  body: Txt;
};

const STEPS: Step[] = [
  {
    scene: "welcome",
    title: { en: "Welcome to Zarai Mandi", ur: "زرعی منڈی میں خوش آمدید" },
    body: {
      en: "Today's mandi rates from all over Pakistan, in one app. Let's take a quick tour so you know where everything is.",
      ur: "پورے پاکستان کی منڈیوں کے آج کے ریٹس، ایک ہی ایپ میں۔ آئیے ایک مختصر تعارف دیکھیں تاکہ آپ کو ہر چیز کا پتا چل جائے۔",
    },
  },
  {
    target: "account",
    title: { en: "Your account", ur: "آپ کا اکاؤنٹ" },
    body: {
      en: "Tap your photo to open your profile, subscriptions, language and voice, help, and this tour again.",
      ur: "اپنی تصویر پر ٹیپ کریں: پروفائل، سبسکرپشنز، زبان اور آواز، مدد، اور یہ تعارف دوبارہ۔",
    },
  },
  {
    target: "bell",
    title: { en: "Notifications", ur: "نوٹیفکیشنز" },
    body: {
      en: "Rate alerts and mandi news arrive here.",
      ur: "ریٹ الرٹس اور منڈی کی خبریں یہاں آتی ہیں۔",
    },
  },
  {
    target: "search",
    title: { en: "Search anything", ur: "کچھ بھی تلاش کریں" },
    body: {
      en: "Type a product or item in English or Urdu, like Wheat, Kinnow or Urea, and go straight to its rates.",
      ur: "انگریزی یا اردو میں کسی چیز کا نام لکھیں، جیسے گندم، کینو یا یوریا، اور سیدھا اس کے ریٹس پر جائیں۔",
    },
  },
  {
    target: "profile",
    title: { en: "Complete your profile", ur: "اپنی پروفائل مکمل کریں" },
    body: {
      en: "Choose your area, your mandis and the products you want. Each product is PKR 2,000 a month.",
      ur: "اپنا علاقہ، منڈیاں اور مصنوعات چنیں۔ ہر پروڈکٹ 2,000 روپے ماہانہ ہے۔",
    },
  },
  {
    target: "products",
    title: { en: "Your products", ur: "آپ کی مصنوعات" },
    body: {
      en: "Each circle is a product. Open ones show their rates; ones with a lock need a subscription. Tap a circle to open it.",
      ur: "ہر دائرہ ایک پروڈکٹ ہے۔ کھلی مصنوعات کے ریٹس نظر آتے ہیں، تالے والی کے لیے سبسکرپشن چاہیے۔ کھولنے کے لیے دائرے پر ٹیپ کریں۔",
    },
  },
  {
    target: "viewall",
    title: { en: "View All", ur: "سب دیکھیں" },
    body: {
      en: "Every product in groups: Grains, Edible Oils, Fruits, Vegetables, Fertilizer, Dry Fruits, Herbs and Kiryana.",
      ur: "تمام مصنوعات گروپس میں: اناج، خوردنی تیل، پھل، سبزیاں، کھاد، خشک میوہ، جڑی بوٹیاں اور کریانہ۔",
    },
  },
  {
    scene: "product",
    title: { en: "Inside a product", ur: "پروڈکٹ کے اندر" },
    body: {
      en: "A product shows a card for each of its items, with the national average rate, the change, arrival, and how many mandis reported.",
      ur: "ہر پروڈکٹ میں اس کی ہر چیز کا کارڈ ہوتا ہے: ملکی اوسط ریٹ، اتار چڑھاؤ، آمد، اور کتنی منڈیوں نے ریٹ دیا۔",
    },
  },
  {
    scene: "rates",
    title: { en: "Rates in every mandi", ur: "ہر منڈی کا ریٹ" },
    body: {
      en: "Tap a card for the full picture: the average, the best mandis to sell in, a map, and each mandi's rate. Filter by province, district or rate type.",
      ur: "مکمل تفصیل کے لیے کارڈ پر ٹیپ کریں: اوسط، فروخت کے لیے بہترین منڈیاں، نقشہ اور ہر منڈی کا ریٹ۔ صوبہ، ضلع یا ریٹ کی قسم سے فلٹر کریں۔",
    },
  },
  {
    scene: "trends",
    title: { en: "Trends and favourites", ur: "رجحانات اور پسندیدہ" },
    body: {
      en: "The Trends tab shows how the rate has moved over time. Tap the star to save an item to your Favourites.",
      ur: "رجحانات والے حصے میں دیکھیں کہ ریٹ وقت کے ساتھ کیسے بدلا۔ ستارے پر ٹیپ کر کے چیز کو پسندیدہ میں محفوظ کریں۔",
    },
  },
  {
    target: "favorites",
    title: { en: "Favourites", ur: "پسندیدہ" },
    body: {
      en: "Items you star appear here on Home, so today's rate is one tap away.",
      ur: "جن چیزوں پر آپ ستارہ لگائیں وہ یہاں ہوم پر نظر آتی ہیں، تاکہ آج کا ریٹ ایک ٹیپ پر ہو۔",
    },
  },
  {
    scene: "plan",
    title: { en: "Simple pricing", ur: "آسان قیمت" },
    body: {
      en: "Every product is PKR 2,000 a month. Pick only what you trade, and pay with JazzCash, Easypaisa or card.",
      ur: "ہر پروڈکٹ 2,000 روپے ماہانہ۔ صرف وہی چنیں جس کا آپ کاروبار کرتے ہیں، اور جاز کیش، ایزی پیسہ یا کارڈ سے ادائیگی کریں۔",
    },
  },
  {
    target: "nav-news",
    title: { en: "Entertainment", ur: "تفریح" },
    body: {
      en: "Short videos with farming tips and market news.",
      ur: "کاشتکاری کے مشوروں اور منڈی کی خبروں کی مختصر ویڈیوز۔",
    },
  },
  {
    target: "nav-settings",
    title: { en: "Settings", ur: "ترتیبات" },
    body: {
      en: "Your account, language, voice and help. You can replay this tour from here at any time.",
      ur: "آپ کا اکاؤنٹ، زبان، آواز اور مدد۔ یہ تعارف آپ یہاں سے کبھی بھی دوبارہ دیکھ سکتے ہیں۔",
    },
  },
  {
    scene: "done",
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
  up: "#16A34A",
  down: "#DC2626",
};

type Box = { x: number; y: number; w: number; h: number };

export function AppTour({ onClose }: { onClose: () => void }) {
  const { lang, setLang } = useLang();
  const isUr = lang === "ur";
  const L = (t: Txt) => (isUr ? t.ur : t.en);
  const font = isUr ? URDU_FONT : "'Inter', 'Poppins', sans-serif";

  const rootRef = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const dirRef = useRef(1);

  // Steps whose element is not on screen (e.g. the profile chip once the profile is done) are skipped.
  const findTarget = useCallback((s: Step): HTMLElement | null => {
    if (!s.target) return null;
    const el = document.querySelector<HTMLElement>(`[data-tour="${s.target}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? el : null;
  }, []);

  const step = STEPS[i];

  // Measure the lit element relative to the tour (correct under CSS zoom too).
  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const rr = root.getBoundingClientRect();
    const scale = root.offsetWidth ? rr.width / root.offsetWidth : 1;
    setSize({ w: root.offsetWidth, h: root.offsetHeight });
    const el = findTarget(STEPS[i]);
    if (!el) {
      setBox(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setBox({
      x: (r.left - rr.left) / scale,
      y: (r.top - rr.top) / scale,
      w: r.width / scale,
      h: r.height / scale,
    });
  }, [i, findTarget]);

  useLayoutEffect(() => {
    const s = STEPS[i];
    if (s.target && !findTarget(s)) {
      // Not on screen: move on in the direction the user was going.
      const next = i + dirRef.current;
      if (next >= 0 && next < STEPS.length) setI(next);
      return;
    }
    const el = findTarget(s);
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
    measure();
    const id = window.setTimeout(measure, 260);
    return () => window.clearTimeout(id);
  }, [i, findTarget, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => () => stopSpeaking(), []);

  const finish = () => {
    markTourSeen();
    stopSpeaking();
    onClose();
  };
  const go = (d: number) => {
    stopSpeaking();
    dirRef.current = d;
    const next = i + d;
    if (next >= STEPS.length) return finish();
    if (next >= 0) setI(next);
  };

  // Count only the steps that will show, for "3 / 12".
  const visible = STEPS.map((s, k) => ({ s, k })).filter(({ s }) => !s.target || !!findTarget(s));
  const pos = Math.max(0, visible.findIndex((v) => v.k === i));
  const total = visible.length;
  const isFirst = i === 0;
  const isLast = i === STEPS.length - 1;

  // Card placement: under the lit element if it fits, else above it.
  const PAD = 8;
  const CARD_GAP = 14;
  let cardStyle: React.CSSProperties = { left: 16, right: 16, top: "50%", transform: "translateY(-50%)" };
  let arrow: { side: "top" | "bottom"; x: number } | null = null;
  if (box && size.h) {
    const below = box.y + box.h + PAD + CARD_GAP;
    const roomBelow = size.h - below;
    const cx = Math.min(Math.max(box.x + box.w / 2, 36), size.w - 36);
    if (roomBelow > 250) {
      cardStyle = { left: 16, right: 16, top: below };
      arrow = { side: "top", x: cx };
    } else {
      cardStyle = { left: 16, right: 16, bottom: size.h - (box.y - PAD - CARD_GAP) };
      arrow = { side: "bottom", x: cx };
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
      style={{ position: "absolute", inset: 0, zIndex: 200, fontFamily: font }}
    >
      <style>{TOUR_CSS}</style>

      {/* Dim layer with a hole over the lit element */}
      {box ? (
        <div
          className="zm-tour-spot"
          style={{
            left: box.x - PAD,
            top: box.y - PAD,
            width: box.w + PAD * 2,
            height: box.h + PAD * 2,
            borderRadius: Math.min(28, (box.h + PAD * 2) / 2),
          }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "rgba(3, 30, 24, 0.78)" }} />
      )}

      {/* The card */}
      <div
        key={i}
        className="zm-tour-card"
        dir={isUr ? "rtl" : "ltr"}
        style={{ position: "absolute", zIndex: 2, ...cardStyle }}
      >
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
        <div
          style={{
            position: "relative",
            background: "#fff",
            borderRadius: 22,
            padding: "16px 16px 14px",
            boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
          }}
        >
          {step.scene && <SceneArt scene={step.scene} isUr={isUr} />}

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
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
              {pos + 1} / {total}
            </span>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", background: C.mint, borderRadius: 999, padding: 2, direction: "ltr" }}>
              {(["en", "ur"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    stopSpeaking();
                    setLang(l);
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

          <h2
            style={{
              fontSize: isUr ? 21 : 19,
              lineHeight: isUr ? 1.7 : 1.25,
              fontWeight: 800,
              color: C.ink,
              margin: 0,
            }}
          >
            {L(step.title)}
          </h2>
          <p
            style={{
              fontSize: isUr ? 15.5 : 14.5,
              lineHeight: isUr ? 1.95 : 1.5,
              color: C.muted,
              margin: "4px 0 0",
            }}
          >
            {L(step.body)}
          </p>

          {/* Progress */}
          <div style={{ display: "flex", gap: 4, margin: "14px 0 12px", direction: "ltr" }}>
            {visible.map((v, k) => (
              <span
                key={v.k}
                style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 999,
                  background: k <= pos ? C.bright : "#E3ECE8",
                  transition: "background 0.3s",
                }}
              />
            ))}
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
    </div>
  );
}

// ─── Small pictures of the screens the tour can't point at on Home ──────────

function SceneArt({ scene, isUr }: { scene: Scene; isUr: boolean }) {
  const tx = (en: string, ur: string) => (isUr ? ur : en);
  const frame: React.CSSProperties = {
    position: "relative",
    height: 132,
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    background: `linear-gradient(160deg, ${C.mint}, #F7FBF9)`,
    border: "1px solid #DCEBE4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const card: React.CSSProperties = {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(6,60,48,0.12)",
    padding: "8px 10px",
  };
  const bar = (w: number | string, c = "#DCE7E2", h = 7): React.CSSProperties => ({ width: w, height: h, borderRadius: 4, background: c });

  if (scene === "welcome" || scene === "done") {
    return (
      <div style={{ ...frame, background: `linear-gradient(150deg, ${C.bright}, ${C.deep})` }}>
        {scene === "done" &&
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
          <div style={{ fontSize: 46, lineHeight: 1 }}>{scene === "done" ? "🎉" : "🌾"}</div>
          <div style={{ marginTop: 8, fontWeight: 800, fontSize: isUr ? 18 : 16, fontFamily: isUr ? URDU_FONT : "inherit" }}>
            {scene === "done" ? tx("Tour complete", "تعارف مکمل") : tx("Zarai Mandi", "زرعی منڈی")}
          </div>
          {scene === "welcome" && (
            <div style={{ marginTop: 2, fontSize: isUr ? 13 : 12, opacity: 0.85, fontFamily: isUr ? URDU_FONT : "inherit" }}>
              {tx("About 1 minute", "تقریباً 1 منٹ")}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (scene === "product") {
    return (
      <div style={frame}>
        <div style={{ display: "flex", gap: 8, direction: "ltr" }}>
          {[
            { n: tx("Wheat", "گندم"), p: "4,250", up: true },
            { n: tx("Atta", "آٹا"), p: "5,100", up: false },
          ].map((c, k) => (
            <div key={k} className="zm-tour-pop" style={{ ...card, width: 112, animationDelay: `${k * 0.12}s` }}>
              <div style={{ fontSize: isUr ? 13 : 11.5, fontWeight: 800, color: C.ink, fontFamily: isUr ? URDU_FONT : "inherit" }}>{c.n}</div>
              <div style={{ fontSize: 9.5, color: C.muted, marginTop: 2 }}>PKR / 40 kg</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.ink, fontFamily: "'Inter', sans-serif" }}>{c.p}</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: c.up ? C.up : C.down }}>{c.up ? "▲ 2.1%" : "▼ 0.8%"}</div>
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                <span style={bar("50%")} />
                <span style={bar("30%")} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (scene === "rates") {
    return (
      <div style={{ ...frame, justifyContent: "space-around", direction: "ltr", padding: "0 10px" }}>
        <div className="zm-tour-pop" style={{ ...card, width: 120 }}>
          <div style={{ fontSize: 9.5, color: C.muted }}>{tx("Average", "اوسط")}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, fontFamily: "'Inter', sans-serif" }}>4,250</div>
          {[[tx("Okara", "اوکاڑہ"), "4,400"], [tx("Multan", "ملتان"), "4,320"], [tx("Sahiwal", "ساہیوال"), "4,280"]].map(([m, p], k) => (
            <div key={m} style={{ display: "flex", justifyContent: "space-between", fontSize: isUr ? 11 : 10, marginTop: 4, color: C.ink, fontFamily: isUr ? URDU_FONT : "inherit" }}>
              <span>
                <span style={{ color: C.gold }}>{k === 0 ? "★ " : "• "}</span>
                {m}
              </span>
              <b>{p}</b>
            </div>
          ))}
        </div>
        <svg className="zm-tour-pop" width="92" height="104" viewBox="0 0 92 104" style={{ animationDelay: "0.12s" }}>
          <path
            d="M58 4 74 14 70 30 84 40 80 58 66 66 62 84 44 100 26 92 18 76 6 70 10 56 24 50 30 36 44 30 50 14Z"
            fill="#CFE8DC"
            stroke={C.primary}
            strokeWidth="1.5"
          />
          {[
            [56, 46],
            [44, 62],
            [36, 74],
            [62, 30],
          ].map(([x, y], k) => (
            <circle key={k} cx={x} cy={y} r={k === 0 ? 5 : 3.5} fill={k === 0 ? C.gold : C.primary} className={k === 0 ? "zm-tour-ping" : undefined} />
          ))}
        </svg>
      </div>
    );
  }

  if (scene === "trends") {
    return (
      <div style={{ ...frame, direction: "ltr" }}>
        <div className="zm-tour-pop" style={{ ...card, width: 220, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 4 }}>
              <span style={{ fontSize: 9.5, padding: "2px 7px", borderRadius: 999, background: "#EEF3F1", color: C.muted }}>{tx("Overview", "جائزہ")}</span>
              <span style={{ fontSize: 9.5, padding: "2px 7px", borderRadius: 999, background: C.primary, color: "#fff" }}>{tx("Trends", "رجحانات")}</span>
            </div>
            <span className="zm-tour-ping" style={{ fontSize: 18, color: C.gold, lineHeight: 1 }}>★</span>
          </div>
          <svg width="200" height="64" viewBox="0 0 200 64" style={{ marginTop: 6 }}>
            <path d="M0 50 C25 46 35 30 60 34 S100 52 120 30 S165 10 200 14" fill="none" stroke={C.bright} strokeWidth="3" strokeLinecap="round" className="zm-tour-draw" />
            <path d="M0 50 C25 46 35 30 60 34 S100 52 120 30 S165 10 200 14 V64 H0Z" fill={`${C.bright}22`} />
          </svg>
        </div>
      </div>
    );
  }

  // plan
  return (
    <div style={{ ...frame, gap: 8, direction: "ltr" }}>
      {[
        { n: tx("Wheat", "گندم"), e: "🌾" },
        { n: tx("Mango", "آم"), e: "🥭" },
        { n: tx("Urea", "یوریا"), e: "🧪" },
      ].map((p, k) => (
        <div key={k} className="zm-tour-pop" style={{ ...card, width: 78, textAlign: "center", animationDelay: `${k * 0.1}s` }}>
          <div style={{ fontSize: 24 }}>{p.e}</div>
          <div style={{ fontSize: isUr ? 12.5 : 11, fontWeight: 700, color: C.ink, fontFamily: isUr ? URDU_FONT : "inherit" }}>{p.n}</div>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.primary, marginTop: 2 }}>PKR 2,000</div>
          <div style={{ fontSize: 8.5, color: C.muted }}>{tx("/ month", "/ ماہانہ")}</div>
        </div>
      ))}
    </div>
  );
}

const TOUR_CSS = `
.zm-tour button { cursor: pointer; border: none; }
.zm-tour-spot {
  position: absolute;
  box-shadow: 0 0 0 9999px rgba(3, 30, 24, 0.78);
  outline: 3px solid #9BE7C0;
  outline-offset: 0;
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
@keyframes zmTourPulse { 0% { opacity: .9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.18); } }
.zm-tour-card { animation: zmTourIn .32s cubic-bezier(.2,.9,.3,1.2) both; }
@keyframes zmTourIn { from { opacity: 0; transform: translateY(10px) scale(.97); } }
.zm-tour-card[style*="translateY(-50%)"] { animation-name: zmTourInCenter; }
@keyframes zmTourInCenter { from { opacity: 0; transform: translateY(calc(-50% + 10px)) scale(.97); } }
.zm-tour-pop { animation: zmTourPop .45s cubic-bezier(.2,.9,.3,1.3) both; }
@keyframes zmTourPop { from { opacity: 0; transform: scale(.8) translateY(6px); } }
.zm-tour-ping { animation: zmTourPing 1.2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
@keyframes zmTourPing { 50% { transform: scale(1.35); } }
.zm-tour-draw { stroke-dasharray: 260; stroke-dashoffset: 260; animation: zmTourDraw 1.1s .2s ease-out forwards; }
@keyframes zmTourDraw { to { stroke-dashoffset: 0; } }
.zm-tour-confetti {
  position: absolute; top: -10px; width: 7px; height: 11px; border-radius: 2px;
  animation: zmTourFall 1.6s ease-in infinite;
}
@keyframes zmTourFall { to { transform: translateY(150px) rotate(320deg); opacity: .2; } }
@media (prefers-reduced-motion: reduce) {
  .zm-tour *, .zm-tour-spot::after { animation: none !important; transition: none !important; }
  .zm-tour-draw { stroke-dashoffset: 0; }
}
`;
