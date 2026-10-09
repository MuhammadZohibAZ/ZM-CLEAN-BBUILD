import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { attrLabel, attrValue } from "./Filters";
import type { Fmt } from "./format";
import { C } from "./theme";
import type { AttrFilters, AttrKey } from "./types";
import { Icon } from "./ui";

// Light island in the app theme: mint-to-white glass, brand green accents
// and the soft green glow used on the map card.
const G = {
  bg: "linear-gradient(180deg, rgba(236,247,241,0.96) 0%, rgba(255,255,255,0.97) 60%)",
  line: C.line,
  text: C.ink,
  sub: C.muted,
  faint: C.faint,
  token: C.chip,
  accent: C.brand,
  glow: "0 14px 34px -10px rgba(15,26,23,0.28), 0 0 0 1px rgba(8,127,99,0.22), 0 0 24px rgba(8,127,99,0.22)",
};
const SPRING = { type: "spring" as const, stiffness: 420, damping: 36, mass: 0.9 };

export type DockRate = { id: string; label: string; count: number };
export type DockGroup = { key: AttrKey; options: { value: string; count: number }[] };

/**
 * Floating filter island. Collapsed: a glass capsule at the bottom showing
 * WHERE · WHEN · RATE (+ a badge for quality filters). Tap it and it morphs
 * in place into the filter panel; changes apply live.
 */
export function FilterDock({
  f,
  t,
  locationLabel,
  onOpenLocation,
  dates,
  date,
  latest,
  onDate,
  lockHistory,
  rate,
  rates,
  onRate,
  groups,
  filters,
  onFilters,
  resultCount,
  onReset,
  isDefault,
}: {
  f: Fmt;
  t: (s: string) => string;
  locationLabel: string;
  onOpenLocation: () => void;
  dates: string[];
  date: string;
  latest: string;
  onDate: (d: string) => void;
  lockHistory: boolean;
  rate: string;
  rates: DockRate[];
  onRate: (id: string) => void;
  groups: DockGroup[];
  filters: AttrFilters;
  onFilters: (v: AttrFilters) => void;
  resultCount: number;
  onReset: () => void;
  isDefault: boolean;
}) {
  const [open, setOpen] = useState(false);
  const qualityCount = Object.values(filters).filter(Boolean).length;
  const rateShort = rates.find((r) => r.id === rate)?.label || rate;
  const isLatest = date === latest;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const haptic = () => {
    try {
      navigator.vibrate?.(5);
    } catch {
      /* no haptics */
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setOpen(false)}
            style={{ position: "absolute", inset: 0, zIndex: 70, background: "rgba(15,26,23,0.18)", backdropFilter: "blur(3px)" }}
          />
        )}
      </AnimatePresence>

      <div
        style={{
          position: "absolute",
          insetInline: 0,
          bottom: 0,
          zIndex: 71,
          display: "flex",
          justifyContent: "center",
          padding: "0 12px max(14px, env(safe-area-inset-bottom))",
          pointerEvents: "none",
        }}
      >
        <motion.div
          layout
          transition={SPRING}
          dir={f.dir}
          role={open ? "dialog" : undefined}
          aria-label={open ? f.tx("Refine rates", "ریٹس فلٹر کریں") : undefined}
          style={{
            pointerEvents: "auto",
            width: open ? "100%" : "auto",
            maxWidth: open ? 520 : "calc(100% - 24px)",
            borderRadius: open ? 28 : 26,
            background: G.bg,
            backdropFilter: "blur(18px) saturate(1.4)",
            WebkitBackdropFilter: "blur(18px) saturate(1.4)",
            boxShadow: G.glow,
            border: "1px solid #E1ECE6",
            color: G.text,
            fontFamily: f.font,
            overflow: "hidden",
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {!open ? (
              <motion.button
                key="capsule"
                layout="position"
                type="button"
                aria-expanded={false}
                aria-label={f.tx(`Filters: ${locationLabel}, ${f.day(date)}, ${rateShort}`, `فلٹر: ${locationLabel}، ${f.day(date)}، ${rateShort}`)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                onClick={() => {
                  haptic();
                  setOpen(true);
                }}
                style={{ display: "flex", alignItems: "center", gap: 8, height: 52, maxWidth: "100%", padding: "0 8px 0 16px", paddingInlineStart: 16, paddingInlineEnd: 8, border: "none", background: "transparent", color: G.text, fontFamily: f.font }}
              >
                <Icon name="pin" size={16} width={2.3} color={G.accent} />
                <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, fontSize: 14, fontWeight: 600, lineHeight: f.lh, whiteSpace: "nowrap" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>{locationLabel}</span>
                  <Dot />
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {f.day(date)}
                    {isLatest && <span aria-hidden style={{ width: 6, height: 6, borderRadius: 3, background: G.accent, boxShadow: "0 0 8px rgba(8,127,99,0.6)" }} />}
                  </span>
                  <Dot />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90, color: rate === rates[0]?.id ? G.sub : G.text }}>{rateShort}</span>
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    height: 36,
                    minWidth: 36,
                    padding: qualityCount ? "0 10px" : 0,
                    borderRadius: 18,
                    background: qualityCount ? C.brand : G.token,
                    flexShrink: 0,
                    marginInlineStart: 4,
                  }}
                >
                  <Icon name="filter" size={15} width={2.4} color={qualityCount ? "#FFFFFF" : C.ink} />
                  {!!qualityCount && <span style={{ fontSize: 12.5, fontWeight: 700, color: "#FFFFFF" }}>{f.digits(qualityCount)}</span>}
                </span>
              </motion.button>
            ) : (
              <motion.div
                key="panel"
                layout="position"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.08, duration: 0.22 } }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                style={{ display: "flex", flexDirection: "column", maxHeight: "min(72dvh, 620px)" }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 14px 6px 18px", paddingInlineStart: 18, paddingInlineEnd: 14 }}>
                  <span style={{ flex: 1, fontSize: 18, fontWeight: 700, lineHeight: f.ur ? 1.8 : 1.3 }}>{f.tx("Refine rates", "ریٹس فلٹر کریں")}</span>
                  {!isDefault && (
                    <button type="button" onClick={onReset} style={{ height: 36, padding: "0 12px", border: "none", borderRadius: 18, background: G.token, color: G.text, fontSize: 13, fontWeight: 600, fontFamily: f.font }}>
                      {f.tx("Reset", "صاف کریں")}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={f.tx("Close", "بند کریں")}
                    onClick={() => setOpen(false)}
                    style={{ width: 36, height: 36, border: "none", borderRadius: 18, background: G.token, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Icon name="chevDown" size={16} width={2.6} color={C.ink} />
                  </button>
                </div>

                <div className="zm-hide-scrollbar" style={{ overflowY: "auto", padding: "4px 0 8px", overscrollBehavior: "contain" }}>
                  <FilterFields
                    f={f}
                    t={t}
                    locationLabel={locationLabel}
                    onOpenLocation={() => {
                      setOpen(false);
                      onOpenLocation();
                    }}
                    dates={dates}
                    date={date}
                    latest={latest}
                    onDate={onDate}
                    lockHistory={lockHistory}
                    rate={rate}
                    rates={rates}
                    onRate={onRate}
                    groups={groups}
                    filters={filters}
                    onFilters={onFilters}
                  />
                </div>

                <div style={{ padding: "8px 14px 14px" }}>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    style={{ width: "100%", height: 52, border: "none", borderRadius: 18, background: C.brand, color: "#FFFFFF", fontSize: 15, fontWeight: 600, fontFamily: f.font, boxShadow: "0 8px 22px -6px rgba(8,127,99,0.7)" }}
                  >
                    {resultCount > 0
                      ? f.tx(`Show ${resultCount} location${resultCount === 1 ? "" : "s"}`, `${f.digits(resultCount)} مقامات دکھائیں`)
                      : f.tx("No locations match · adjust filters", "کوئی مقام نہیں · فلٹر بدلیں")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}

function Dot() {
  return <span aria-hidden style={{ width: 3, height: 3, borderRadius: 2, background: G.faint, flexShrink: 0 }} />;
}

function Section({ f, label, children }: { f: Fmt; label: string; children: ReactNode }) {
  return (
    <div style={{ padding: "10px 0 6px" }}>
      <div style={{ padding: "0 18px 8px", fontSize: 12.5, fontWeight: 600, color: G.sub, lineHeight: f.lh }}>{label}</div>
      {children}
    </div>
  );
}

function Rail({ children }: { children: ReactNode }) {
  return (
    <div className="zm-hide-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 18px", scrollbarWidth: "none" }}>
      {children}
    </div>
  );
}

function Token({ f, on, disabled, count, onClick, children }: { f: Fmt; on: boolean; disabled?: boolean; count?: number; onClick: () => void; children: ReactNode }) {
  const style: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 7,
    height: 40,
    padding: "0 14px",
    flexShrink: 0,
    border: "none",
    borderRadius: 14,
    whiteSpace: "nowrap",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: f.font,
    color: on ? "#FFFFFF" : disabled ? G.faint : G.text,
    background: on ? C.brand : G.token,
    boxShadow: on ? "0 6px 16px -6px rgba(8,127,99,0.65)" : "none",
    transition: "background 200ms, box-shadow 200ms, transform 120ms",
    opacity: disabled ? 0.6 : 1,
  };
  return (
    <button type="button" aria-pressed={on} disabled={disabled} onClick={onClick} style={style}>
      {children}
      {count !== undefined && <span style={{ fontSize: 12, fontWeight: 600, color: on ? "rgba(255,255,255,0.8)" : G.faint }}>{f.digits(count)}</span>}
    </button>
  );
}

/** Report days as a snapping rail; the selected day scrolls into view. */
function DayRail({ f, dates, date, latest, lockHistory, onDate }: { f: Fmt; dates: string[]; date: string; latest: string; lockHistory: boolean; onDate: (d: string) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>("[data-on='true']");
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [date]);
  return (
    <div ref={ref} className="zm-hide-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 18px", scrollbarWidth: "none", scrollSnapType: "x proximity", direction: "ltr" }}>
      {dates.map((d) => {
        const on = d === date;
        const locked = lockHistory && d !== latest;
        const dt = new Date(d);
        const wd = isNaN(dt.getTime()) ? "" : dt.toLocaleDateString(f.ur ? "ur-PK" : "en-GB", { weekday: "short" });
        return (
          <button
            key={d}
            type="button"
            data-on={on}
            aria-pressed={on}
            disabled={locked}
            onClick={() => onDate(d)}
            style={{
              flexShrink: 0,
              width: 64,
              height: 64,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              border: "none",
              borderRadius: 16,
              scrollSnapAlign: "center",
              background: on ? C.brand : G.token,
              boxShadow: on ? "0 6px 16px -6px rgba(8,127,99,0.65)" : "none",
              color: on ? "#FFFFFF" : C.ink,
              opacity: locked ? 0.4 : 1,
              fontFamily: f.font,
              position: "relative",
            }}
          >
            <span style={{ fontSize: 11.5, fontWeight: 600, color: on ? "rgba(255,255,255,0.85)" : G.sub }}>{wd}</span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{f.day(d)}</span>
            {d === latest && <span aria-label={f.tx("latest", "تازہ ترین")} style={{ position: "absolute", top: 6, right: 8, width: 6, height: 6, borderRadius: 3, background: on ? "#FFFFFF" : G.accent, boxShadow: on ? "none" : "0 0 8px rgba(8,127,99,0.6)" }} />}
            {locked && (
              <span style={{ position: "absolute", top: 5, right: 6 }}>
                <Icon name="lock" size={11} color={C.muted} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Props shared by every filter surface (dock, drawer). */
export type FilterUiProps = {
  f: Fmt;
  t: (s: string) => string;
  locationLabel: string;
  onOpenLocation: () => void;
  dates: string[];
  date: string;
  latest: string;
  onDate: (d: string) => void;
  lockHistory: boolean;
  rate: string;
  rates: DockRate[];
  onRate: (id: string) => void;
  groups: DockGroup[];
  filters: AttrFilters;
  onFilters: (v: AttrFilters) => void;
  resultCount: number;
  onReset: () => void;
  isDefault: boolean;
  /** A specific place is chosen (not all of Pakistan). */
  locationActive?: boolean;
  /** Back to all of Pakistan. */
  onClearLocation?: () => void;
  /** The rate / attributes are still the ones the tapped card opened with (no clear ✕ yet). */
  rateFromCard?: boolean;
  filtersFromCard?: boolean;
};

function tick() {
  try {
    navigator.vibrate?.(5);
  } catch {
    /* no haptics */
  }
}

/** Where · Report day · Rate type · Quality — the filter fields themselves. */
export function FilterFields({
  f,
  t,
  locationLabel,
  onOpenLocation,
  dates,
  date,
  latest,
  onDate,
  lockHistory,
  rate,
  rates,
  onRate,
  groups,
  filters,
  onFilters,
}: Omit<FilterUiProps, "resultCount" | "onReset" | "isDefault">) {
  return (
    <>
      <Section f={f} label={f.tx("Where", "کہاں")}>
        <button
          type="button"
          onClick={onOpenLocation}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "calc(100% - 36px)", margin: "0 18px", height: 48, padding: "0 14px", border: "none", borderRadius: 16, background: G.token, color: G.text, fontFamily: f.font, textAlign: "start" }}
        >
          <Icon name="pin" size={17} width={2.3} color={G.accent} />
          <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: f.lh }}>{locationLabel}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: G.accent }}>{f.tx("Change", "تبدیل")}</span>
          <Icon name="chevRight" size={14} width={2.6} color={G.accent} />
        </button>
      </Section>

      <Section f={f} label={f.tx("Report day", "رپورٹ کا دن")}>
        <DayRail f={f} dates={dates} date={date} latest={latest} lockHistory={lockHistory} onDate={(d) => (tick(), onDate(d))} />
      </Section>

      <Section f={f} label={f.tx("Rate type", "ریٹ کی قسم")}>
        <Rail>
          {rates.map((r) => (
            <Token key={r.id} f={f} on={rate === r.id} disabled={!r.count} onClick={() => (tick(), onRate(r.id))} count={r.count}>
              {r.label}
            </Token>
          ))}
        </Rail>
      </Section>

      {groups.map((g) => (
        <Section key={g.key} f={f} label={attrLabel(f, g.key)}>
          <Rail>
            {g.options.map((o) => {
              const on = filters[g.key] === o.value;
              return (
                <Token key={o.value} f={f} on={on} count={o.count} onClick={() => (tick(), onFilters({ ...filters, [g.key]: on ? undefined : o.value }))}>
                  {attrValue(f, t, g.key, o.value)}
                </Token>
              );
            })}
          </Rail>
        </Section>
      ))}
    </>
  );
}

/** Theme tokens shared with other filter surfaces. */
export const FILTER_THEME = G;
