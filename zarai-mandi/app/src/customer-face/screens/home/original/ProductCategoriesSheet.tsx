import { useState } from "react";

import {
  getProductSelectionsForDivision,
  PRODUCT_DIVISIONS,
  PRODUCT_GROUPS,
} from "../../../shared/data/catalog";
import { getproductIconSrc } from "../../../shared/data/icons";
import { getProductPngIcon } from "../../../shared/data/productPngIcons";
import { toUrduDigits, URDU_FONT, useLang } from "../../../shared/i18n/LangProvider";
import type { Screen } from "../../../shared/types";
import { TRIAL_DAYS, TRIAL_HISTORY_DAYS, type TrialStatus } from "../../../shared/productTrials";

type Division = (typeof PRODUCT_DIVISIONS)[number];

/** Products a group card shows before "See more" (two rows). */
const PREVIEW = 6;

/**
 * "View All" (full screen): every product, one card per group (Crops, Fertilizer,
 * Fruits, ...) showing two rows and "See more". Tap an unlocked product to open
 * its by-products (Back returns here), a locked one to choose between a free
 * trial of that product (once the account's own trial is over) and subscribing.
 */
export function ProductCategoriesSheet({
  activeProducts,
  lockedProducts,
  isAccessible,
  getVerticalForProduct,
  handleLockedProductClick,
  onClose,
  push,
  trialOf = () => null,
  trialEnd = () => undefined,
  onStartTrial,
}: {
  activeProducts: Division[];
  lockedProducts: Division[];
  isAccessible: (name: string) => boolean;
  getVerticalForProduct: (name: string) => string;
  handleLockedProductClick: (divName: string, verticalFor?: string) => void;
  onClose: () => void;
  push: (s: Screen) => void;
  /** A product's own free trial (null: it can't have one, e.g. the account is still on its trial). */
  trialOf?: (name: string) => TrialStatus | null;
  trialEnd?: (name: string) => number | undefined;
  onStartTrial?: (name: string) => void;
}) {
  const { lang, tc } = useLang();
  const ur = lang === "ur";
  const font = ur ? URDU_FONT : "inherit";
  // The locked product the user tapped: free trial or subscribe.
  const [ask, setAsk] = useState<Division | null>(null);
  const openProduct = (name: string) => push({ id: "byproduct-combined", products: getProductSelectionsForDivision(name), active: 0 });
  const subscribe = (div: Division) => {
    onClose();
    handleLockedProductClick(div.name, getVerticalForProduct(div.name));
  };
  const all = [...activeProducts, ...lockedProducts];
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const tile = (div: Division) => {
    const verticalFor = getVerticalForProduct(div.name);
    const unlocked = isAccessible(div.name);
    return (
      <button
        key={div.name}
        data-tour={unlocked ? "viewall-open" : "viewall-locked"}
        onClick={() => {
          if (unlocked) openProduct(div.name);
          else if (trialOf(div.name) && onStartTrial) setAsk(div);
          else subscribe(div);
        }}
        className="flex flex-col items-center tap-target min-w-0"
      >
        <div
          style={{
            width: "clamp(62px, 17vw, 74px)",
            height: "clamp(62px, 17vw, 74px)",
            borderRadius: "50%",
            border: unlocked ? "2.5px solid #087F63" : "1.5px solid #BDD9CD",
            background: unlocked ? "#F4FAF7" : "#E4EFE9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: unlocked ? "0 4px 12px rgba(8,127,99,0.16)" : "0 2px 6px rgba(18,65,48,0.06)",
          }}
        >
          <img
            src={getProductPngIcon(div.name) ?? getproductIconSrc(div.name, verticalFor)}
            alt=""
            style={{ width: "70%", height: "70%", objectFit: "contain", opacity: unlocked ? 1 : 0.55 }}
          />
          {unlocked && trialOf(div.name) === "active" && (
            <span
              style={{
                position: "absolute",
                bottom: -6,
                left: "50%",
                transform: "translateX(-50%)",
                padding: "1px 7px",
                borderRadius: 999,
                background: "#F5B83D",
                color: "#3D2A00",
                border: "2px solid #FFFFFF",
                fontSize: 9.5,
                fontWeight: 800,
                whiteSpace: "nowrap",
                fontFamily: font,
              }}
            >
              {ur ? "ٹرائل" : "Trial"}
            </span>
          )}
          {!unlocked && (
            <span
              style={{
                position: "absolute",
                bottom: -2,
                insetInlineEnd: -2,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#7A8D85",
                color: "#fff",
                border: "2px solid #FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
              }}
            >
              🔒
            </span>
          )}
        </div>
        <span
          className="text-center break-words w-full"
          style={{
            marginTop: 5,
            fontSize: 12,
            fontWeight: 800,
            color: unlocked ? "#183B34" : "#6B7C76",
            fontFamily: lang === "ur" ? URDU_FONT : "inherit",
            lineHeight: lang === "ur" ? 1.7 : 1.15,
          }}
        >
          {tc(div.name)}
        </span>
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 flex flex-col screen-enter"
      style={{ zIndex: 340, background: "#F1F7F4" }}
    >
      <header
        className="flex-shrink-0 flex items-center gap-2 px-4 pb-3"
        style={{
          paddingTop: "max(36px, calc(var(--zm-bleed-top) + 10px))",
          background: "rgba(244, 250, 247, 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(213, 226, 221, 0.8)",
        }}
      >
        <button
          data-tour="viewall-back"
          onClick={() => onClose()}
          className="tap-target zm-beam-border w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 text-[#183B34] transition active:scale-95"
          style={{
            background: "rgba(255, 255, 255, 0.7)",
            border: "1.2px solid rgba(16, 185, 129, 0.4)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {lang === "ur" ? "→" : "←"}
        </button>
        <h2
          className="text-[16px] font-black text-[#143B33]"
          style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
        >
          {lang === "ur" ? "تمام مصنوعات" : "All Products"}
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8 flex flex-col gap-3">
        {PRODUCT_GROUPS.map((g) => {
          const items = all.filter((d) => d.group === g.id);
          if (items.length === 0) return null;
          const isOpen = open.has(g.id) || items.length <= PREVIEW;
          return (
            <section
              key={g.id}
              data-tour={g.id === "crops" ? "viewall-group" : undefined}
              className="rounded-[18px] bg-white px-3 pt-3 pb-2"
              style={{ border: "1.5px solid #D1E5DC", boxShadow: "0 3px 12px rgba(6,77,64,0.06)" }}
            >
              <div className="flex items-baseline justify-between gap-2 px-1 mb-2.5">
                <h3
                  className="text-[15px] font-black text-[#143B33]"
                  style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                >
                  {lang === "ur" ? g.ur : g.en}
                </h3>
                <span
                  className="text-[11px] font-bold text-[#52635F]"
                  style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                >
                  {lang === "ur" ? `${toUrduDigits(items.length)} مصنوعات` : `${items.length} product${items.length === 1 ? "" : "s"}`}
                </span>
              </div>
              <div className="grid gap-x-2 gap-y-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                {(isOpen ? items : items.slice(0, PREVIEW)).map(tile)}
              </div>
              {items.length > PREVIEW && (
                <button
                  type="button"
                  onClick={() => toggle(g.id)}
                  aria-expanded={isOpen}
                  data-tour={g.id === "crops" ? "viewall-more" : undefined}
                  className="tap-target w-full mt-1.5 py-2 rounded-xl flex items-center justify-center gap-1 text-[12.5px] font-bold text-[#087F63] active:bg-[#E8F8F3]"
                  style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                >
                  {isOpen
                    ? lang === "ur" ? "کم دکھائیں" : "See less"
                    : lang === "ur"
                      ? `مزید دیکھیں (${toUrduDigits(items.length - PREVIEW)})`
                      : `See more (${items.length - PREVIEW})`}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: isOpen ? "rotate(180deg)" : undefined }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
            </section>
          );
        })}
      </div>

      {ask && (
        <TrialAsk
          div={ask}
          status={trialOf(ask.name) ?? "none"}
          end={trialEnd(ask.name)}
          ur={ur}
          font={font}
          name={tc(ask.name)}
          icon={getProductPngIcon(ask.name) ?? getproductIconSrc(ask.name, getVerticalForProduct(ask.name))}
          onStart={() => onStartTrial?.(ask.name)}
          onOpen={() => {
            const name = ask.name;
            setAsk(null);
            openProduct(name);
          }}
          onSubscribe={() => {
            const d = ask;
            setAsk(null);
            subscribe(d);
          }}
          onCancel={() => setAsk(null)}
        />
      )}
    </div>
  );
}

/** Locked product in View All: ask for its free trial, or subscribe. */
function TrialAsk({
  status,
  end,
  ur,
  font,
  name,
  icon,
  onStart,
  onOpen,
  onSubscribe,
  onCancel,
}: {
  div: Division;
  status: TrialStatus;
  end?: number;
  ur: boolean;
  font: string;
  name: string;
  icon: string;
  onStart: () => void;
  onOpen: () => void;
  onSubscribe: () => void;
  onCancel: () => void;
}) {
  const D = (n: number) => (ur ? toUrduDigits(n) : String(n));
  const endText = end
    ? new Date(end).toLocaleString(ur ? "ur-PK" : "en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : "";
  const btn = { width: "100%", height: 48, borderRadius: 999, fontWeight: 800, fontSize: ur ? 16 : 15, fontFamily: font } as const;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={name}
      onClick={onCancel}
      className="fixed inset-0 flex items-end justify-center"
      style={{ zIndex: 360, background: "rgba(3, 30, 24, 0.55)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir={ur ? "rtl" : "ltr"}
        className="w-full"
        style={{ maxWidth: 480, background: "#FFFFFF", borderRadius: "24px 24px 0 0", padding: "18px 18px max(18px, env(safe-area-inset-bottom))", fontFamily: font, boxShadow: "0 -10px 40px rgba(0,0,0,0.25)" }}
      >
        <div className="flex items-center gap-3">
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: "#F4FAF7", border: "2px solid #BDD9CD", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <img src={icon} alt="" style={{ width: "70%", height: "70%", objectFit: "contain" }} />
          </div>
          <div className="min-w-0">
            <h3 style={{ margin: 0, fontSize: ur ? 19 : 17.5, fontWeight: 900, color: "#143B33", lineHeight: ur ? 1.7 : 1.25 }}>{name}</h3>
            <p style={{ margin: 0, fontSize: ur ? 13.5 : 12.5, fontWeight: 700, color: status === "active" ? "#087F63" : "#6B7C76", lineHeight: ur ? 1.8 : 1.4 }}>
              {status === "active" ? (ur ? "مفت ٹرائل جاری ہے" : "Free trial on") : ur ? "🔒 آپ کے پلان میں شامل نہیں" : "🔒 Not in your plan"}
            </p>
          </div>
        </div>

        {status === "active" ? (
          <>
            <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 16, background: "#E8F5EF", color: "#0B4A3B", fontSize: ur ? 14.5 : 13.5, lineHeight: ur ? 1.9 : 1.5 }}>
              {ur
                ? `آپ ${D(TRIAL_DAYS)} دن تک ${name} کے پچھلے ہفتے کے ریٹ مفت دیکھ سکتے ہیں۔`
                : `For ${TRIAL_DAYS} days you can see ${name}'s rates from the last week, free.`}
              {endText && <div style={{ marginTop: 4, fontWeight: 800 }}>{ur ? `ختم: ${endText}` : `Ends ${endText}`}</div>}
            </div>
            <button onClick={onOpen} style={{ ...btn, marginTop: 14, background: "linear-gradient(135deg, #2FAE68, #087F63)", color: "#fff", boxShadow: "0 6px 16px rgba(8,127,99,0.3)" }}>
              {ur ? `${name} کھولیں` : `Open ${name}`}
            </button>
          </>
        ) : (
          <>
            {status === "none" ? (
              <>
                <p style={{ margin: "14px 0 0", fontSize: ur ? 14.5 : 13.5, lineHeight: ur ? 1.9 : 1.5, color: "#52635F" }}>
                  {ur
                    ? `خریدنے سے پہلے آزمائیں: ${D(TRIAL_DAYS)} دن کے لیے ${name} کے پچھلے ${D(TRIAL_HISTORY_DAYS)} دن کے ریٹ مفت دیکھیں۔`
                    : `Try before you buy: see ${name}'s rates from the last ${TRIAL_HISTORY_DAYS} days, free for ${TRIAL_DAYS} days.`}
                </p>
                <button onClick={onStart} style={{ ...btn, marginTop: 14, background: "linear-gradient(135deg, #2FAE68, #087F63)", color: "#fff", boxShadow: "0 6px 16px rgba(8,127,99,0.3)" }}>
                  {ur ? "مفت ٹرائل کی درخواست کریں" : "Request free trial"}
                </button>
              </>
            ) : (
              <p style={{ margin: "14px 0 0", padding: "10px 14px", borderRadius: 14, background: "#F6F1E7", fontSize: ur ? 14 : 13, lineHeight: ur ? 1.9 : 1.5, color: "#6B5A2E" }}>
                {ur ? `${name} کا مفت ٹرائل استعمال ہو چکا ہے۔` : `You've already used the free trial for ${name}.`}
              </p>
            )}
            <button
              onClick={onSubscribe}
              style={{ ...btn, marginTop: 8, background: status === "none" ? "#FFFFFF" : "linear-gradient(135deg, #2FAE68, #087F63)", color: status === "none" ? "#087F63" : "#fff", border: status === "none" ? "1.5px solid #087F63" : "none" }}
            >
              {ur ? "سبسکرائب کریں · 2,000 روپے ماہانہ" : "Subscribe · PKR 2,000 / month"}
            </button>
          </>
        )}
        <button onClick={onCancel} style={{ ...btn, height: 42, marginTop: 4, background: "transparent", color: "#52635F", fontWeight: 700 }}>
          {ur ? "واپس" : "Not now"}
        </button>
      </div>
    </div>
  );
}
