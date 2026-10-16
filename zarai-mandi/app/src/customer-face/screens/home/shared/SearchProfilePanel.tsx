import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { LockIconSVG } from "../../../components/icons";
import { toUrduDigits, URDU_FONT, useLang } from "../../../shared/i18n/LangProvider";

// One line on the bottom edge of the Home hero: an inline search field and,
// until the profile is complete, a "Complete profile" chip beside it.
//  - Search never leaves Home: typing picks the best-matching by-product
//    automatically (the rail switches product and the ring spins to it) and
//    lists the other matches underneath.
//  - The profile chip pings, shows a "!" and nudges now and then, to prompt
//    completing the profile. It folds away while searching and once complete.

const HEIGHT = 58;
const AUTO_PICK_MS = 60;

/** Height below the hero edge, so the page can leave room for it. */
export const panelHeight = (_showProfile: boolean) => HEIGHT;

const EXAMPLES = {
  en: ["wheat", "basmati rice", "tomato", "cotton seed", "maize", "mango"],
  ur: ["گندم", "باسمتی چاول", "ٹماٹر", "بنولہ", "مکئی", "آم"],
};

export type SearchEntry = {
  /** Home product (rail) the by-product belongs to. */
  product: string;
  byproduct: string;
  label: string;
  productLabel: string;
  iconSrc: string;
  locked: boolean;
  hasData: boolean;
  /** A product (Home row) rather than a by-product. */
  kind?: "product" | "byproduct";
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, " ").trim();

function rank(entries: SearchEntry[], query: string): SearchEntry[] {
  const q = norm(query);
  if (!q) return [];
  const scored: { e: SearchEntry; score: number }[] = [];
  for (const e of entries) {
    const names = [norm(e.byproduct), norm(e.label)];
    let score = -1;
    for (const n of names) {
      if (n === q) score = Math.max(score, 5);
      else if (n.startsWith(q)) score = Math.max(score, 4);
      else if (n.split(" ").some((w) => w.startsWith(q))) score = Math.max(score, 3);
      else if (n.includes(q)) score = Math.max(score, 2);
    }
    if (score < 0) continue;
    // Prefer products on a tie, then unlocked by-products that have data.
    scored.push({ e, score: score * 4 + (e.kind === "product" ? 3 : 0) + (e.locked ? 0 : 2) + (e.hasData ? 1 : 0) });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.e.label.length - b.e.label.length)
    .slice(0, 10)
    .map((x) => x.e);
}

export function SearchProfilePanel({
  entries,
  onPick,
  onLockedPick,
  showProfile,
  step,
  totalSteps,
  onOpenProfile,
  mode = "inline",
}: {
  entries: SearchEntry[];
  /** Show this by-product on the ring. `final` = user confirmed (tap / Enter). */
  onPick: (entry: SearchEntry, final: boolean) => void;
  onLockedPick: (entry: SearchEntry) => void;
  showProfile: boolean;
  step: number;
  totalSteps: number;
  onOpenProfile: () => void;
  /**
   * "inline": the best match is shown inside the bar and picked live as you
   * type (alternative Home). "list": suggestions drop down under the bar and
   * nothing is picked until one is tapped (original Home).
   */
  mode?: "inline" | "list";
}) {
  const listMode = mode === "list";
  const { lang } = useLang();
  const isUr = lang === "ur";
  const font = isUr ? URDU_FONT : "'Inter', sans-serif";
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const searching = focused || query.length > 0;

  // Placeholder cycles through example searches while idle.
  const examples = isUr ? EXAMPLES.ur : EXAMPLES.en;
  const [exampleIdx, setExampleIdx] = useState(0);
  useEffect(() => {
    if (reduceMotion || searching) return;
    const id = window.setInterval(() => setExampleIdx((i) => (i + 1) % examples.length), 2600);
    return () => window.clearInterval(id);
  }, [reduceMotion, searching, examples.length]);

  const results = useMemo(() => rank(entries, query), [entries, query]);
  const topMatch = useMemo(() => results.find((r) => !r.locked) || results[0], [results]);

  // Live: as user types, automatically select the best match on the carousel directly
  const lastAuto = useRef("");
  useEffect(() => {
    if (listMode) return;
    if (!topMatch || !query.trim()) {
      lastAuto.current = "";
      return;
    }
    const key = `${topMatch.product}|${topMatch.byproduct}`;
    if (key === lastAuto.current) return;
    const id = window.setTimeout(() => {
      lastAuto.current = key;
      onPick(topMatch, false);
    }, AUTO_PICK_MS);
    return () => window.clearTimeout(id);
  }, [topMatch, query, onPick, listMode]);

  const finish = () => {
    setQuery("");
    lastAuto.current = "";
    setFocused(false);
    inputRef.current?.blur();
  };
  const choose = (e: SearchEntry) => {
    if (e.locked) onLockedPick(e);
    else onPick(e, true);
    if (listMode) setQuery("");
    setFocused(false);
    inputRef.current?.blur();
  };

  const ring = 2 * Math.PI * 14;
  const done = Math.min(1, Math.max(0, step / totalSteps));
  const showChip = showProfile && !query.trim();

  return (
    <div
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        top: `calc(100% - ${HEIGHT / 2}px)`,
        zIndex: 30,
      }}
    >
      <div
        className="flex items-stretch"
        style={{
          height: HEIGHT,
          padding: 6,
          gap: 6,
          borderRadius: 999,
          background: "#FFFFFF",
          boxShadow: searching ? "0 0 0 3px rgba(8, 127, 99, 0.18), 0 10px 28px rgba(6, 45, 36, 0.18)" : "0 10px 28px rgba(6, 45, 36, 0.16)",
          transition: "box-shadow 0.2s ease",
        }}
      >
        {/* Search field */}
        <label
          className="flex-1 min-w-0 flex items-center gap-2 rounded-full cursor-text"
          style={{ padding: "0 8px 0 5px", background: "#F2F7F4" }}
        >
          <span
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, background: "#087F63", boxShadow: "0 3px 8px rgba(8, 127, 99, 0.35)" }}
          >
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="6.5" stroke="#FFFFFF" strokeWidth="2.6" />
              <path d="M16 16L21 21" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </span>

          <span className="relative flex-1 min-w-0 flex items-center" style={{ height: 36, fontFamily: font }}>
            {/* Animated example placeholder while idle */}
            {!searching && (
              <span className="pointer-events-none absolute inset-0 flex items-center gap-1 overflow-hidden">
                <span className="flex-shrink-0" style={{ fontSize: isUr ? 15 : 14, color: "#6B7C77", fontWeight: 600 }}>
                  {isUr ? "تلاش:" : "Search"}
                </span>
                <span className="relative flex-1 min-w-0" style={{ height: 22 }}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={`${lang}-${exampleIdx}`}
                      className="absolute inset-0 truncate"
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -12, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      style={{ fontSize: isUr ? 15 : 14, color: "#183B34", fontWeight: 700, lineHeight: "22px" }}
                    >
                      {examples[exampleIdx]}…
                    </motion.span>
                  </AnimatePresence>
                </span>
              </span>
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (topMatch) choose(topMatch);
                  else inputRef.current?.blur();
                }
                if (e.key === "Escape") finish();
              }}
              placeholder={searching ? (isUr ? "ضمنی مصنوع لکھیں…" : "Type a by-product…") : ""}
              aria-label={isUr ? "ضمنی مصنوع تلاش کریں" : "Search by-products"}
              className="relative w-full bg-transparent outline-none"
              style={{ fontSize: isUr ? 16 : 15, fontWeight: 700, color: "#183B34", fontFamily: font }}
            />
          </span>

          {/* Inline Selection Indicator directly inside search bar (inline mode) */}
          {!listMode && query.trim() && (
            topMatch ? (
              <div
                className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-sm"
                style={{
                  background: topMatch.locked ? "rgba(254, 243, 199, 0.95)" : "rgba(226, 242, 236, 0.95)",
                  color: topMatch.locked ? "#92400E" : "#087F63",
                  border: topMatch.locked ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid rgba(16, 185, 129, 0.35)",
                  fontFamily: font,
                }}
              >
                {topMatch.locked ? (
                  <LockIconSVG size={11} color="#92400E" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#087F63] animate-pulse" />
                )}
                <span className="max-w-[110px] sm:max-w-[140px] truncate">{topMatch.label}</span>
              </div>
            ) : (
              <div
                className="flex-shrink-0 flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: "#FEE2E2", color: "#B91C1C", fontFamily: font }}
              >
                <span>{isUr ? "کوئی نتیجہ نہیں" : "No match"}</span>
              </div>
            )
          )}

          {query && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery("");
                lastAuto.current = "";
                inputRef.current?.focus();
              }}
              aria-label={isUr ? "صاف کریں" : "Clear"}
              className="flex-shrink-0 flex items-center justify-center rounded-full transition active:scale-90"
              style={{ width: 26, height: 26, background: "#DDEAE3" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#183B34" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </label>

        {/* Complete profile: yellow chip with a "!" (static, no animation) */}
        <AnimatePresence initial={false}>
          {showChip && (
            <motion.button
              key="profile"
              type="button"
              onClick={onOpenProfile}
              className="tap-target relative flex-shrink-0 flex items-center gap-2 rounded-full text-start"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isUr ? 150 : 142, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              style={{ padding: "0 12px 0 4px", background: "#FFF5E6", border: "1px solid #F6D9A6", overflow: "visible" }}
              aria-label={isUr ? "پروفائل مکمل کریں" : "Complete your profile"}
            >
              <span className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 36, height: 36 }}>
                <svg width="36" height="36" viewBox="0 0 36 36" className="absolute inset-0" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="14" fill="#FFFFFF" stroke="#F3E3C6" strokeWidth="3.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={ring}
                    strokeDashoffset={ring * (1 - done)}
                    style={{ transition: "stroke-dashoffset 0.4s ease" }}
                  />
                </svg>
                <span style={{ position: "relative", fontSize: 11, fontWeight: 800, color: "#7C4A03" }}>
                  {isUr ? `${toUrduDigits(step)}/${toUrduDigits(totalSteps)}` : `${step}/${totalSteps}`}
                </span>
              </span>
              <span
                className="flex flex-col whitespace-nowrap overflow-hidden"
                style={{ fontSize: isUr ? 13 : 12, fontWeight: 800, color: "#7C4A03", lineHeight: 1.15, fontFamily: isUr ? URDU_FONT : "inherit" }}
              >
                <span>{isUr ? "پروفائل" : "Complete"}</span>
                <span>{isUr ? "مکمل کریں" : "profile"}</span>
              </span>
              {/* "!" — something to do */}
              <span
                aria-hidden
                className="absolute flex items-center justify-center rounded-full"
                style={{
                  top: -6,
                  [isUr ? "left" : "right"]: -4,
                  width: 18,
                  height: 18,
                  background: "#E11D48",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 900,
                  border: "2px solid #FFFFFF",
                  boxShadow: "0 2px 6px rgba(225, 29, 72, 0.4)",
                }}
              >
                !
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestions under the bar (list mode) */}
      {listMode && searching && query.trim() && (
        <div
          role="listbox"
          aria-label={isUr ? "تجاویز" : "Suggestions"}
          className="overflow-hidden"
          style={{
            marginTop: 8,
            borderRadius: 18,
            background: "#FFFFFF",
            boxShadow: "0 14px 34px rgba(6, 45, 36, 0.20)",
            maxHeight: 340,
            overflowY: "auto",
            fontFamily: font,
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: "14px 16px", fontSize: 13.5, fontWeight: 600, color: "#6B7C77" }}>
              {isUr ? "کوئی نتیجہ نہیں ملا" : "No match found"}
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.kind || "byproduct"}|${r.product}|${r.byproduct}`}
                type="button"
                role="option"
                aria-selected={i === 0}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(r)}
                className="w-full flex items-center gap-3 text-start transition active:bg-[#EEF6F2]"
                style={{ padding: "9px 14px", borderTop: i ? "1px solid #EEF3F0" : "none", background: "#FFFFFF" }}
              >
                <span className="flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ width: 38, height: 38, borderRadius: r.kind === "product" ? 19 : 12, background: "#F2F7F4" }}>
                  <img src={r.iconSrc} alt="" style={{ width: "82%", height: "82%", objectFit: "contain" }} />
                </span>
                <span className="flex-1 min-w-0 flex flex-col">
                  <span className="truncate" style={{ fontSize: isUr ? 15 : 14, fontWeight: 700, color: "#183B34" }}>{r.label}</span>
                  <span className="truncate" style={{ fontSize: isUr ? 12.5 : 11.5, fontWeight: 600, color: "#6B7C77" }}>
                    {r.kind === "product" ? (isUr ? "پروڈکٹ" : "Product") : r.productLabel}
                  </span>
                </span>
                {r.locked && <LockIconSVG size={13} color="#92400E" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
