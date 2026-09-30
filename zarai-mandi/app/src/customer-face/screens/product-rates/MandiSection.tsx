import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import { inDevicePreview, requestDeviceOrientation } from "../../../lib/device-orientation";
import { attrValue } from "./Filters";
import { arrow, shortRate, signed, stripMandi, type Fmt } from "./format";
import type { MandiEntry } from "./selectors";
import { C } from "./theme";
import type { AttrKey, ChangeInterval, SortKey } from "./types";
import { PickerSheet } from "./PickerSheet";
import { Sparkline, sparkTone } from "./Sparkline";
import { Icon } from "./ui";

const INTERVALS: ChangeInterval[] = [1, 3, 7, 30];
const SORTS: SortKey[] = ["priceHigh", "priceLow", "arrivalHigh", "arrivalLow", "change"];
const PREVIEW = 6;

export function MandiSection({
  f,
  t,
  tm,
  tr,
  entries,
  date,
  regionLabel,
  rateLabel,
  sort,
  onSort,
  interval,
  onInterval,
  selectedMandi,
  primary,
  onOpen,
  loading,
  mode,
}: {
  f: Fmt;
  t: (s: string) => string;
  tm: (s: string) => string;
  tr: (s: string) => string;
  entries: MandiEntry[];
  date: string;
  /** Province the list covers (follows the chosen location); none = all Pakistan. */
  regionLabel?: string;
  rateLabel?: string;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  interval: ChangeInterval;
  onInterval: (i: ChangeInterval) => void;
  selectedMandi?: string;
  primary: AttrKey;
  onOpen: (e: MandiEntry) => void;
  loading: boolean;
  /** Which view this slide shows (default: "table"). */
  mode?: "table" | "cards";
}) {
  const [viewMode, setViewMode] = useState<"table" | "cards">(mode || "table");
  const [picker, setPicker] = useState<"sort" | "priceSort" | "arrivalSort" | "interval" | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [landscape, setLandscape] = useState(true);

  useEffect(() => setShowAll(false), [regionLabel, date]);

  // Full-screen table. One rotation mechanism at a time:
  // - desktop phone mockup: ask the mockup to rotate (no CSS rotation);
  // - real phone: try the native orientation lock; if the screen is still
  //   portrait (lock unsupported / refused), rotate the layer with CSS.
  const preview = inDevicePreview();
  const [portraitScreen, setPortraitScreen] = useState(() => typeof window !== "undefined" && window.innerHeight > window.innerWidth);
  useEffect(() => {
    if (!fullscreen) return;
    const check = () => setPortraitScreen(window.innerHeight > window.innerWidth);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && setFullscreen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [fullscreen]);
  useEffect(() => {
    const want = fullscreen && landscape ? "landscape" : "portrait";
    if (preview) {
      requestDeviceOrientation(want);
      return;
    }
    const o = typeof screen !== "undefined" ? (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }) : undefined;
    try {
      if (fullscreen && landscape) o?.lock?.("landscape").catch(() => { });
      else o?.unlock?.();
    } catch {
      /* orientation lock unsupported */
    }
  }, [fullscreen, landscape, preview]);
  useEffect(() => () => {
    if (inDevicePreview()) requestDeviceOrientation("portrait");
    try {
      screen.orientation?.unlock?.();
    } catch {
      /* ignore */
    }
  }, []);
  const rotated = fullscreen && landscape && !preview && portraitScreen;

  const mandiCount = new Set(entries.map((e) => e.row.mandiName)).size;
  const visible = showAll ? entries : entries.slice(0, PREVIEW);
  const isSel = (e: MandiEntry) => !!selectedMandi && stripMandi(e.row.mandiName).toLowerCase() === stripMandi(selectedMandi).toLowerCase();

  const sortLabel: Record<SortKey, string> = {
    priceHigh: f.tx("Highest Price", "سب سے زیادہ قیمت"),
    priceLow: f.tx("Lowest Price", "سب سے کم قیمت"),
    arrivalHigh: f.tx("Highest Arrivals", "سب سے زیادہ آمد"),
    arrivalLow: f.tx("Lowest Arrivals", "سب سے کم آمد"),
    arrival: f.tx("Highest Arrivals", "سب سے زیادہ آمد"),
    change: f.tx("Biggest change", "سب سے بڑی تبدیلی"),
  };
  const intLabel = (i: ChangeInterval) =>
    i === 1 ? f.tx("Change: 1 day", "تبدیلی: ۱ دن") : f.tx(`Change: ${i} days`, `تبدیلی: ${f.digits(i)} دن`);

  const intOptionsLabel: Record<ChangeInterval, string> = {
    1: f.tx("1 day", "۱ دن"),
    3: f.tx("3 days", "۳ دن"),
    7: f.tx("7 days", "۷ دن"),
    30: f.tx("30 days", "۳۰ دن"),
  };

  const pillBtn = (active: boolean): CSSProperties => ({
    height: 34,
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "0 12px",
    borderRadius: 17,
    border: "none",
    flexShrink: 0,
    whiteSpace: "nowrap",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: f.font,
    background: active ? C.brand : C.surface,
    color: active ? "#FFFFFF" : C.ink2,
  });

  const tool: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    height: 32,
    padding: 0,
    borderRadius: 0,
    border: "none",
    background: "transparent",
    fontSize: 13,
    fontWeight: 600,
    color: C.ink2,
    whiteSpace: "nowrap",
    fontFamily: f.font,
  };

  const listForCols = fullscreen ? entries : visible;
  const specCols = useMemo(() => {
    const raw: { key: AttrKey | "unit" | "quality"; label: string }[] = [
      { key: primary, label: colLabel(f, primary) },
      ...(["newOld", "moisture", "color", "variety", "origin", "spec"] as AttrKey[]).filter((k) => k !== primary).map((k) => ({ key: k, label: colLabel(f, k) })),
      { key: "quality", label: f.tx("Attribute", "خصوصیات") },
      { key: "unit", label: f.tx("Unit", "اکائی") },
    ];
    const hasData = (key: AttrKey | "unit" | "quality") =>
      listForCols.some((e) => {
        const r = e.row;
        if (key === "unit") return Boolean(r.arrivalUnit && r.arrivalUnit.trim());
        if (key === "quality") return Boolean(r.quality && r.quality.trim());
        const v = r[key];
        return Boolean(v && String(v).trim());
      });
    const withData = raw.filter((c) => hasData(c.key));
    const withoutData = raw.filter((c) => !hasData(c.key));
    return [...withData, ...withoutData];
  }, [listForCols, primary, f]);

  const isPriceSorted = sort === "priceHigh" || sort === "priceLow";
  const isArrivalSorted = sort === "arrivalHigh" || sort === "arrivalLow" || sort === "arrival";

  const table = (
    <div data-zm-hscroll className="zm-hide-scrollbar" style={{ overflow: "auto", maxHeight: fullscreen ? "none" : 440, flex: fullscreen ? 1 : undefined, minHeight: 0, paddingBottom: fullscreen ? "env(safe-area-inset-bottom)" : undefined, overscrollBehavior: "contain" }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 640, width: "100%", fontSize: 13, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate" }}>
        <thead>
          <tr>
            {/* Mandi Name Header */}
            <th
              style={{
                position: "sticky",
                top: 0,
                insetInlineStart: 0,
                zIndex: 3,
                background: C.surfaceAlt,
                padding: "8px 8px",
                fontSize: 11.5,
                fontWeight: 700,
                color: C.ink2,
                borderBottom: `1px solid ${C.line}`,
                borderInlineEnd: `1px solid ${C.line}`,
                whiteSpace: "nowrap",
                textAlign: "start",
                minWidth: 85,
                maxWidth: 105,
              }}
            >
              {f.tx("Mandi", "منڈی")}
            </th>

            {/* Min – Max Header with Highest / Lowest Sort Filter */}
            <th
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                background: C.surfaceAlt,
                padding: "4px 3px",
                borderBottom: `1px solid ${C.line}`,
                whiteSpace: "nowrap",
                textAlign: "center",
                minWidth: 85,
              }}
            >
              <button
                type="button"
                onClick={() => setPicker("priceSort")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  background: isPriceSorted ? "rgba(16, 185, 129, 0.12)" : "transparent",
                  color: isPriceSorted ? C.brand : C.ink2,
                  border: isPriceSorted ? `1px solid ${C.brandBorder}` : "1px solid transparent",
                  borderRadius: 6,
                  padding: "3px 6px",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: f.font,
                  cursor: "pointer",
                }}
              >
                <span>
                  {sort === "priceHigh"
                    ? f.tx("Min–Max (High)", "کم–زیادہ (زیادہ)")
                    : sort === "priceLow"
                    ? f.tx("Min–Max (Low)", "کم–زیادہ (کم)")
                    : f.tx("Min–Max", "کم–زیادہ")}
                </span>
                <Icon name="chevDown" size={10} width={2.4} color={isPriceSorted ? C.brand : C.muted} />
              </button>
            </th>

            {/* Rate Header */}
            <th
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                background: C.surfaceAlt,
                padding: "8px 4px",
                fontSize: 11.5,
                fontWeight: 700,
                color: C.ink2,
                borderBottom: `1px solid ${C.line}`,
                whiteSpace: "nowrap",
                textAlign: "center",
                minWidth: 58,
              }}
            >
              {f.tx("Rate", "ریٹ")}
            </th>

            {/* Change Header with 1D, 3D, 7D, 30D Filter */}
            <th
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                background: C.surfaceAlt,
                padding: "4px 3px",
                borderBottom: `1px solid ${C.line}`,
                whiteSpace: "nowrap",
                textAlign: "center",
                minWidth: 70,
              }}
            >
              <button
                type="button"
                onClick={() => setPicker("interval")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  background: C.chip,
                  color: C.ink,
                  border: "1px solid transparent",
                  borderRadius: 6,
                  padding: "3px 6px",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: f.font,
                  cursor: "pointer",
                }}
              >
                <span>{f.tx(`Change (${interval}D)`, `تبدیلی (${f.digits(interval)}د)`)}</span>
                <Icon name="chevDown" size={10} width={2.4} color={C.muted} />
              </button>
            </th>

            {/* Arrival Header with Highest / Lowest Sort Filter */}
            <th
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                background: C.surfaceAlt,
                padding: "4px 6px",
                borderBottom: `1px solid ${C.line}`,
                whiteSpace: "nowrap",
                textAlign: "center",
                minWidth: 72,
              }}
            >
              <button
                type="button"
                onClick={() => setPicker("arrivalSort")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  background: isArrivalSorted ? "rgba(16, 185, 129, 0.12)" : "transparent",
                  color: isArrivalSorted ? C.brand : C.ink2,
                  border: isArrivalSorted ? `1px solid ${C.brandBorder}` : "1px solid transparent",
                  borderRadius: 6,
                  padding: "3px 6px",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: f.font,
                  cursor: "pointer",
                }}
              >
                <span>
                  {sort === "arrivalHigh" || sort === "arrival"
                    ? f.tx("Arrival (High)", "آمد (زیادہ)")
                    : sort === "arrivalLow"
                    ? f.tx("Arrival (Low)", "آمد (کم)")
                    : f.tx("Arrival", "آمد")}
                </span>
                <Icon name="chevDown" size={10} width={2.4} color={isArrivalSorted ? C.brand : C.muted} />
              </button>
            </th>

            {/* Spec Columns */}
            {specCols.map((c) => (
              <th
                key={c.key}
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                  background: C.surfaceAlt,
                  padding: "8px 10px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: C.ink2,
                  borderBottom: `1px solid ${C.line}`,
                  whiteSpace: "nowrap",
                  textAlign: "center",
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(fullscreen ? entries : visible).map((e) => {
            const r = e.row;
            const sel = isSel(e);
            const bg = sel ? C.brandTint : C.surface;
            const td: CSSProperties = { padding: "8px 4px", borderBottom: `1px solid ${C.lineSoft}`, whiteSpace: "nowrap", textAlign: "center", fontWeight: 500, color: C.ink2, background: bg };
            return (
              <tr key={e.key} onClick={() => onOpen(e)} style={{ cursor: "pointer" }}>
                <td style={{ ...td, position: "sticky", insetInlineStart: 0, zIndex: 1, textAlign: "start", fontWeight: 700, color: C.ink, borderInlineEnd: `1px solid ${C.line}`, padding: "8px 8px", minWidth: 85, maxWidth: 105, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {tm(stripMandi(r.mandiName))}
                </td>
                <td style={{ ...td, fontWeight: 700, color: C.brand, padding: "8px 4px", fontSize: 12.5 }}>{r.min > 0 ? `${f.num(r.min)} – ${f.num(r.max)}` : "—"}</td>
                <td style={{ ...td, padding: "8px 3px" }}>
                  <span style={{ padding: "2px 6px", borderRadius: 5, fontSize: 11.5, fontWeight: 600, color: C.ink2, background: C.chip }}>
                    {shortRate(tr(r.rateType))}
                  </span>
                </td>
                <td style={{ ...td, fontWeight: 700, color: changeColor(e.change), padding: "8px 4px", fontSize: 12 }}>{e.change === null ? "—" : `${arrow(e.change)} ${f.pct(e.change)}`}</td>
                <td style={{ ...td, color: r.arrival > 0 ? C.arrival : C.faint, fontWeight: 600, padding: "8px 6px", fontSize: 12.5 }}>{r.arrival > 0 ? f.num(r.arrival) : "—"}</td>
                {specCols.map((c) => (
                  <td key={c.key} style={{ ...td, padding: "8px 10px" }}>
                    {c.key === "unit" ? r.arrivalUnit : c.key === "quality" ? r.quality || "—" : r[c.key] ? attrValue(f, t, c.key, r[c.key] as string) : "—"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const showMoreBtn =
    entries.length > PREVIEW ? (
      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        style={{ width: "100%", height: 44, border: "none", borderTop: `1px solid ${C.lineSoft}`, background: "transparent", color: C.brand, fontSize: 13.5, fontWeight: 600, fontFamily: f.font }}
      >
        {showAll ? f.tx("Show fewer", "کم دکھائیں") : f.tx(`Show all ${entries.length}`, `تمام ${f.digits(entries.length)} دکھائیں`)}
      </button>
    ) : null;

  const cleanRate = rateLabel ? shortRate(rateLabel) : "";
  const sectionHeading = cleanRate
    ? f.tx(`${cleanRate} Rates`, `${cleanRate} ریٹس`)
    : f.tx("All Rates", "تمام ریٹس");

  return (
    <section aria-label={sectionHeading} style={{ paddingTop: 4 }}>
      <div style={{ padding: "0 16px 6px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: f.ur ? 1.6 : 1.2 }}>{sectionHeading}</h2>
          <span style={{ fontSize: 12, fontWeight: 500, color: C.muted, lineHeight: f.lh }}>
            {regionLabel
              ? f.tx(`${mandiCount} location${mandiCount === 1 ? "" : "s"} in ${regionLabel} · PKR per 40 kg`, `${regionLabel} میں ${f.digits(mandiCount)} مقامات · روپے فی ۴۰ کلو`)
              : f.tx(`${mandiCount} location${mandiCount === 1 ? "" : "s"} · PKR per 40 kg`, `${f.digits(mandiCount)} مقامات · روپے فی ۴۰ کلو`)}
          </span>
        </div>

        {/* View mode toggle: Table vs Cards */}
        <div
          role="group"
          aria-label={f.tx("View mode", "انداز")}
          style={{
            display: "inline-flex",
            padding: 3,
            borderRadius: 12,
            background: C.chip,
            gap: 2,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode("table")}
            aria-pressed={viewMode === "table"}
            title={f.tx("Table view", "ٹیبل")}
            style={{
              padding: "5px 9px",
              borderRadius: 9,
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: f.font,
              background: viewMode === "table" ? C.surface : "transparent",
              color: viewMode === "table" ? C.brand : C.muted,
              boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.07)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
            }}
          >
            <Icon name="table" size={13} width={2.2} color={viewMode === "table" ? C.brand : C.muted} />
            <span>{f.tx("Table", "ٹیبل")}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            aria-pressed={viewMode === "cards"}
            title={f.tx("Cards view", "کارڈز")}
            style={{
              padding: "5px 9px",
              borderRadius: 9,
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: f.font,
              background: viewMode === "cards" ? C.surface : "transparent",
              color: viewMode === "cards" ? C.brand : C.muted,
              boxShadow: viewMode === "cards" ? "0 1px 3px rgba(0,0,0,0.07)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
            }}
          >
            <Icon name="list" size={13} width={2.2} color={viewMode === "cards" ? C.brand : C.muted} />
            <span>{f.tx("Cards", "کارڈز")}</span>
          </button>
        </div>
      </div>

      {viewMode === "cards" && (
        <div data-zm-hscroll className="zm-hide-scrollbar" style={{ display: "flex", gap: 8, padding: "0 16px 12px", overflowX: "auto", scrollbarWidth: "none" }}>
          <button type="button" style={pillBtn(false)} onClick={() => setPicker("sort")}>
            <Icon name="sort" size={14} width={2.4} color={C.muted} />
            {sortLabel[sort]}
            <Icon name="chevDown" size={12} width={2.6} color={C.muted} />
          </button>
          <button type="button" style={pillBtn(false)} onClick={() => setPicker("interval")}>
            <Icon name="clock" size={14} width={2.4} color={C.muted} />
            {f.tx(`${interval}D change`, `${f.digits(interval)} دن تبدیلی`)}
            <Icon name="chevDown" size={12} width={2.6} color={C.muted} />
          </button>
        </div>
      )}

      {picker === "sort" && (
        <PickerSheet
          f={f}
          title={f.tx("Sort mandis by", "منڈیوں کی ترتیب")}
          value={[sort]}
          onChange={(v) => onSort(v[0] as SortKey)}
          onClose={() => setPicker(null)}
          options={SORTS.map((k) => ({ id: k, label: sortLabel[k] }))}
        />
      )}

      {picker === "priceSort" && (
        <PickerSheet
          f={f}
          title={f.tx("Sort by Price", "قیمت کے لحاظ سے ترتیب")}
          value={[sort === "priceHigh" || sort === "priceLow" ? sort : "priceHigh"]}
          onChange={(v) => onSort(v[0] as SortKey)}
          onClose={() => setPicker(null)}
          options={[
            { id: "priceHigh", label: f.tx("Highest Price", "سب سے زیادہ قیمت") },
            { id: "priceLow", label: f.tx("Lowest Price", "سب سے کم قیمت") },
          ]}
        />
      )}

      {picker === "arrivalSort" && (
        <PickerSheet
          f={f}
          title={f.tx("Sort by Arrival", "آمد کے لحاظ سے ترتیب")}
          value={[sort === "arrivalHigh" || sort === "arrivalLow" || sort === "arrival" ? (sort === "arrival" ? "arrivalHigh" : sort) : "arrivalHigh"]}
          onChange={(v) => onSort(v[0] as SortKey)}
          onClose={() => setPicker(null)}
          options={[
            { id: "arrivalHigh", label: f.tx("Highest Arrivals", "سب سے زیادہ آمد") },
            { id: "arrivalLow", label: f.tx("Lowest Arrivals", "سب سے کم آمد") },
          ]}
        />
      )}

      {picker === "interval" && (
        <PickerSheet
          f={f}
          title={f.tx("Price change interval", "قیمت میں تبدیلی کا دورانیہ")}
          value={[String(interval)]}
          onChange={(v) => onInterval(Number(v[0]) as ChangeInterval)}
          onClose={() => setPicker(null)}
          options={INTERVALS.map((i) => ({ id: String(i), label: intOptionsLabel[i] }))}
        />
      )}

      {loading ? (
        <div style={{ margin: "0 16px", borderRadius: 20, background: C.surface, overflow: "hidden" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} aria-busy="true" style={{ height: 68, borderTop: i ? `1px solid ${C.lineSoft}` : "none", display: "flex", alignItems: "center", gap: 12, padding: "0 16px" }}>
              <div className="zm-shimmer" style={{ flex: 1, height: 14, borderRadius: 7 }} />
              <div className="zm-shimmer" style={{ width: 90, height: 14, borderRadius: 7 }} />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div style={{ margin: "0 16px", padding: 24, borderRadius: 20, background: C.surface, textAlign: "center", fontSize: 14, fontWeight: 500, color: C.muted, lineHeight: f.lh }}>
          {f.tx("No mandi reported for the day and filters you picked.", "اس دن اور فلٹر کے لیے کسی منڈی کی رپورٹ نہیں۔")}
        </div>
      ) : viewMode === "table" ? (
        <div style={{ padding: "0 16px" }}>
          <div style={{ borderRadius: 20, background: C.surface, overflow: "hidden" }}>
            {table}
            {showMoreBtn}
          </div>
          <button
            type="button"
            onClick={() => {
              setLandscape(true);
              setFullscreen(true);
            }}
            style={{ marginTop: 10, width: "100%", height: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 24, border: "none", background: C.surface, color: C.ink, fontSize: 14, fontWeight: 600, fontFamily: f.font }}
          >
            <Icon name="landscape" size={16} color={C.ink2} width={2.2} />
            {f.tx(`Full-screen table · all ${entries.length}`, `پوری اسکرین ٹیبل · تمام ${f.digits(entries.length)}`)}
          </button>
        </div>
      ) : (
        <div style={{ margin: "0 16px", borderRadius: 20, background: C.surface, overflow: "hidden" }}>
          {visible.map((e, k) => (
            <MandiRow key={e.key} f={f} t={t} tm={tm} tr={tr} e={e} first={k === 0} index={k} selected={isSel(e)} primary={primary} onOpen={() => onOpen(e)} />
          ))}
          {showMoreBtn}
        </div>
      )}

      {fullscreen &&
        createPortal(
          <div
            dir={f.dir}
            role="dialog"
            aria-modal="true"
            aria-label={f.tx("Mandi rates table", "منڈی ریٹس ٹیبل")}
            className="zm-product-rates zm-fadein"
            style={{
              position: "fixed",
              zIndex: 10000,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: C.surface,
              color: C.ink,
              fontFamily: f.font,
              ...(rotated
                ? { top: "50%", left: "50%", width: "100dvh", height: "100dvw", transform: "translate(-50%, -50%) rotate(90deg)" }
                : { inset: 0 }),
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: rotated ? "8px max(12px, env(safe-area-inset-bottom)) 8px max(12px, env(safe-area-inset-top))" : "max(8px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 8px max(12px, env(safe-area-inset-left))",
                borderBottom: `1px solid ${C.line}`,
                background: C.surface,
                flexShrink: 0,
              }}
            >
              <button type="button" aria-label={f.tx("Close", "بند کریں")} onClick={() => setFullscreen(false)} style={{ width: 40, height: 40, borderRadius: 20, border: "none", background: C.chip, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="close" size={18} width={2.4} color={C.ink} />
              </button>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 700, fontSize: 15, lineHeight: f.lh, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.tx("Mandi rates", "منڈی ریٹس")}</span>
                <span style={{ fontWeight: 500, fontSize: 12, color: C.muted, lineHeight: f.lh, whiteSpace: "nowrap" }}>
                  {f.tx(`${f.day(date)} · ${entries.length} rows · PKR per 40 kg`, `${f.day(date)} · ${f.digits(entries.length)} قطاریں · روپے فی ۴۰ کلو`)}
                </span>
              </div>
              <div role="group" aria-label={f.tx("Orientation", "رخ")} style={{ display: "flex", gap: 2, padding: 3, borderRadius: 12, background: C.track, flexShrink: 0 }}>
                {([false, true] as const).map((l) => (
                  <button
                    key={String(l)}
                    type="button"
                    aria-pressed={landscape === l}
                    aria-label={l ? f.tx("Landscape", "افقی") : f.tx("Portrait", "عمودی")}
                    onClick={() => setLandscape(l)}
                    style={{
                      height: 32,
                      minWidth: 38,
                      justifyContent: "center",
                      padding: landscape ? "0 10px" : 0,
                      border: "none",
                      borderRadius: 9,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12.5,
                      fontWeight: 600,
                      fontFamily: f.font,
                      color: landscape === l ? C.ink : C.muted,
                      background: landscape === l ? C.surface : "transparent",
                      boxShadow: landscape === l ? "0 1px 3px rgba(15,26,23,0.12)" : "none",
                      transition: "background 200ms, color 200ms",
                    }}
                  >
                    <span aria-hidden style={{ width: l ? 14 : 9, height: l ? 9 : 14, borderRadius: 2.5, border: `1.8px solid currentColor` }} />
                    {landscape && (l ? f.tx("Landscape", "افقی") : f.tx("Portrait", "عمودی"))}
                  </button>
                ))}
              </div>
            </div>
            {table}
          </div>,
          document.body,
        )}
    </section>
  );
}

function changeColor(c: number | null) {
  if (c === null) return C.faint;
  return signed(c) > 0 ? C.up : signed(c) < 0 ? C.down : C.muted;
}

function colLabel(f: Fmt, k: AttrKey) {
  const L: Record<AttrKey, [string, string]> = {
    newOld: ["New / Old", "نئی / پرانی"],
    variety: ["Variety", "قسم"],
    moisture: ["Moisture", "نمی"],
    color: ["Color", "رنگ"],
    spec: ["Spec", "خصوصیت"],
    origin: ["Origin", "علاقہ"],
  };
  return f.tx(L[k][0], L[k][1]);
}

function MandiRow({
  f,
  t,
  tm,
  tr,
  e,
  first,
  index,
  selected,
  primary,
  onOpen,
}: {
  f: Fmt;
  t: (s: string) => string;
  tm: (s: string) => string;
  tr: (s: string) => string;
  e: MandiEntry;
  first: boolean;
  index: number;
  selected: boolean;
  primary: AttrKey;
  onOpen: () => void;
}) {
  const r = e.row;
  const order: AttrKey[] = [primary, ...(["newOld", "variety", "moisture", "color", "spec"] as AttrKey[]).filter((k) => k !== primary)];
  const extra = order
    .filter((k) => r[k])
    .map((k) => {
      const val = r[k] as string;
      if (k === "newOld") {
        return val.toLowerCase() === "new" ? f.tx("New", "نیا") : val.toLowerCase() === "old" ? f.tx("Old", "پرانا") : attrValue(f, t, k, val);
      }
      return attrValue(f, t, k, val);
    });
  const s = e.change === null ? 0 : signed(e.change);
  const sub = [...extra, r.arrival > 0 ? `${f.num(r.arrival)} ${f.tx("bags", "بوریاں")}` : ""].filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      onClick={onOpen}
      className="zm-rise zm-row"
      style={{
        animationDelay: `${Math.min(index, 10) * 35}ms`,
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        minHeight: 68,
        border: "none",
        borderTop: first ? "none" : `1px solid ${C.lineSoft}`,
        background: selected ? C.brandTint : C.surface,
        textAlign: "start",
        fontFamily: f.font,
        color: C.ink,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, lineHeight: f.lh, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {[tm(stripMandi(r.mandiName)), shortRate(tr(r.rateType))].filter(Boolean).join(" · ")}
          </span>
          {selected && (
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: C.brand, color: "#fff", flexShrink: 0 }}>{f.tx("Selected", "منتخب")}</span>
          )}
        </span>
        {sub ? (
          <span style={{ fontSize: 12.5, fontWeight: 500, color: C.muted, lineHeight: f.lh, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {sub}
          </span>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate", lineHeight: f.lh }}>
          {r.min > 0 ? (r.min === r.max ? f.num(r.min) : `${f.num(r.min)}–${f.num(r.max)}`) : "—"}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkline values={e.spark} tone={e.change === null ? sparkTone(e.spark) : s > 0 ? C.up : s < 0 ? C.down : C.faint} flip={f.ur} width={44} height={18} />
          {e.change !== null && s !== 0 ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 5,
                fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate",
                background: s > 0 ? C.upTint : C.downTint,
                color: s > 0 ? C.up : C.down,
              }}
            >
              {s > 0 ? "+" : "−"}
              {f.pct(e.change)}
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 500, color: C.faint }}>{e.change === null ? f.tx("new", "نئی") : f.tx("No change", "کوئی تبدیلی نہیں")}</span>
          )}
        </div>
      </div>
    </button>
  );
}

