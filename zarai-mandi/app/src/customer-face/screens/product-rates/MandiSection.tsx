import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

import { attrValue } from "./Filters";
import { arrow, bagSize, shortRate, signed, stripMandi, type Fmt } from "./format";
import { ALL_RATES, ATTR_KEYS, type MandiEntry } from "./selectors";
import { C } from "./theme";
import type { AttrFilters, AttrKey, ChangeInterval, SortKey } from "./types";
import { PickerSheet } from "./PickerSheet";
import { FullscreenLayer } from "./FullscreenLayer";
import { EmptyActions, type EmptyAction } from "./PriceHero";
import { RangeSheet } from "./RangeSheet";
import { Sparkline, sparkTone } from "./Sparkline";
import { Icon } from "./ui";

const INTERVALS: ChangeInterval[] = [1, 3, 7, 30];
const SORTS: SortKey[] = ["none", "priceHigh", "priceLow", "arrivalHigh", "arrivalLow", "change", "nameAZ", "nameZA"];
/** Columns whose header filters by value (the rest sort). */
type ValueCol = "rate" | AttrKey | "unit" | "quality";
const PREVIEW = 6;
export const cleanQuality = (q?: string | null) => (q || "").replace(/\s*(Quality|معیار)$/i, "").trim();

export function MandiSection({
  f,
  t,
  tm,
  tr,
  entries: entriesIn,
  date,
  periodLabel,
  datePicker,
  regionLabel,
  sort,
  onSort,
  interval,
  onInterval,
  selectedMandi,
  primary,
  onOpen,
  loading,
  emptyNote,
  mode,
  rate,
  railFilters,
}: {
  f: Fmt;
  t: (s: string) => string;
  tm: (s: string) => string;
  tr: (s: string) => string;
  entries: MandiEntry[];
  date: string;
  /** Province the list covers (follows the chosen location); none = all Pakistan. */
  regionLabel?: string;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  interval: ChangeInterval;
  onInterval: (i: ChangeInterval) => void;
  selectedMandi?: string;
  primary: AttrKey | null;
  onOpen: (e: MandiEntry) => void;
  loading: boolean;
  /** Why the day is empty and ways out (shared with the price card). */
  emptyNote?: { message: string; actions: EmptyAction[] } | null;
  /** Which view this slide shows (default: "table"). */
  mode?: "table" | "cards";
  /** A custom period in place of the single day (e.g. "12 Sep – 22 Sep"). */
  periodLabel?: string;
  /** Full-screen table's calendar button: a day or a date range for the table only (the columns filter the rest). */
  datePicker?: {
    dates: string[];
    latest: string;
    onDate: (d: string) => void;
    dayRange: { start: string; end: string } | null;
    onDayRange: (r: { start: string; end: string } | null) => void;
    lockHistory: boolean;
  };
  /**
   * The filter rail's rate type and attributes. `entries` are not narrowed by
   * them: the table applies them itself, so a column header can list every
   * value and override the rail for the table only.
   */
  rate?: string;
  railFilters?: AttrFilters;
}) {
  const [viewMode, setViewMode] = useState<"table" | "cards">(mode || "table");
  const [picker, setPicker] = useState<string | null>(null);
  // Per-column value filters set from the table headers (none by default).
  // They narrow the table only; the price card above follows the filter rail.
  // undefined = follow the rail, "" = all values, anything else = that value.
  const [colFilters, setColFilters] = useState<Partial<Record<ValueCol, string>>>({});
  // A change in the filter rail replaces the table's own column filters.
  const railKey = JSON.stringify([rate, railFilters]);
  useEffect(() => setColFilters({}), [railKey]);
  const railValue = (k: ValueCol): string =>
    k === "rate" ? (rate && rate !== ALL_RATES ? rate : "") : k === "unit" ? "" : railFilters?.[k as AttrKey] || "";
  const colValue = (k: ValueCol): string => colFilters[k] ?? railValue(k);
  const shownRate = colValue("rate");
  const rateHeaderLabel = shownRate ? shortRate(tr(shownRate)) : f.tx("Rate", "ریٹ");
  const cellValue = (e: MandiEntry, key: ValueCol): string => {
    const r = e.row;
    if (key === "rate") return r.rateType || "";
    if (key === "unit") return (r.arrivalUnit || "").trim();
    if (key === "quality") return (r.quality || "").trim();
    return String(r[key] ?? "").trim();
  };
  // Same matching as the rail (selectors.passesFilters): case and % ignored.
  const norm = (v: string) => v.toLowerCase().replace(/[%%]/g, "").trim();
  const VALUE_COLS: ValueCol[] = ["rate", ...ATTR_KEYS, "unit"];
  const passes = (e: MandiEntry, value: (k: ValueCol) => string, skip?: ValueCol) =>
    VALUE_COLS.every((k) => {
      const v = k === skip ? "" : value(k);
      return !v || norm(cellValue(e, k)) === norm(v);
    });
  const entries = useMemo(
    () => entriesIn.filter((e) => passes(e, colValue)),
    [entriesIn, colFilters, railKey], // eslint-disable-line react-hooks/exhaustive-deps
  );
  // Every value of the column, for the rows the other columns keep.
  const valueOptions = (key: ValueCol) => {
    const counts = new Map<string, number>();
    for (const e of entriesIn) {
      if (!passes(e, colValue, key)) continue;
      const v = cellValue(e, key);
      if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1]);
  };
  const [showAll, setShowAll] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const closeFullscreen = useCallback(() => setFullscreen(false), []);
  const [calOpen, setCalOpen] = useState(false);

  useEffect(() => setShowAll(false), [regionLabel, date]);

  const mandiCount = new Set(entries.map((e) => e.row.mandiName)).size;
  const visible = showAll ? entries : entries.slice(0, PREVIEW);
  const isSel = (e: MandiEntry) => !!selectedMandi && stripMandi(e.row.mandiName).toLowerCase() === stripMandi(selectedMandi).toLowerCase();

  const sortLabel: Record<SortKey, string> = {
    none: f.tx("Sort", "ترتیب"),
    nameAZ: f.tx("Mandi A → Z", "منڈی ا → ی"),
    nameZA: f.tx("Mandi Z → A", "منڈی ی → ا"),
    priceHigh: f.tx("Highest Price", "سب سے زیادہ قیمت"),
    priceLow: f.tx("Lowest Price", "سب سے کم قیمت"),
    arrivalHigh: f.tx("Highest Arrivals", "سب سے زیادہ آمد"),
    arrivalLow: f.tx("Lowest Arrivals", "سب سے کم آمد"),
    arrival: f.tx("Highest Arrivals", "سب سے زیادہ آمد"),
    change: f.tx("Biggest change", "سب سے بڑی تبدیلی"),
  };
  const intLabel = (i: ChangeInterval) =>
    i === 1 ? f.tx("Change: 1 day", "تبدیلی: 1 دن") : f.tx(`Change: ${i} days`, `تبدیلی: ${f.digits(i)} دن`);

  const intOptionsLabel: Record<ChangeInterval, string> = {
    1: f.tx("1 day", "1 دن"),
    3: f.tx("3 days", "3 دن"),
    7: f.tx("7 days", "7 دن"),
    30: f.tx("30 days", "30 دن"),
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
    // The by-product's special attribute first, then the rest (quality has its own cleaned column).
    const raw: { key: AttrKey | "unit"; label: string }[] = [
      ...(primary ? [{ key: primary, label: colLabel(f, primary) }] : []),
      ...(["newOld", "moisture", "color", "variety", "origin", "spec", "quality"] as AttrKey[]).filter((k) => k !== primary).map((k) => ({ key: k, label: colLabel(f, k) })),
      { key: "unit", label: f.tx("Bag size", "بوری کا وزن") },
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

  // Every column header is the same control: neutral by default, green when set.
  const thBase: CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 2,
    background: C.surfaceAlt,
    padding: "4px 3px",
    borderBottom: `1px solid ${C.line}`,
    whiteSpace: "nowrap",
    textAlign: "center",
  };
  const headBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        background: active ? "rgba(16, 185, 129, 0.12)" : "transparent",
        color: active ? C.brand : C.ink2,
        border: active ? `1px solid ${C.brandBorder}` : "1px solid transparent",
        borderRadius: 6,
        padding: "3px 6px",
        fontSize: 11,
        fontWeight: 700,
        fontFamily: f.font,
        cursor: "pointer",
        maxWidth: 150,
      }}
    >
      <span style={{ overflowWrap: "break-word", }}>{label}</span>
      <Icon name="chevDown" size={10} width={2.4} color={active ? C.brand : C.muted} />
    </button>
  );

  const isPriceSorted = sort === "priceHigh" || sort === "priceLow";
  const isArrivalSorted = sort === "arrivalHigh" || sort === "arrivalLow" || sort === "arrival";
  // Arrivals are counts of bags: "40 kg bags" when every row uses one bag size,
  // else just "bags" (the Bag size column then gives each row's).
  const bagUnits = [...new Set(entries.map((e) => (e.row.arrivalUnit || "").trim()).filter(Boolean))];
  const arrivalUnitLabel = bagUnits.length === 1 ? bagSize(f, bagUnits[0]) : f.tx("bags", "بوریاں");

  const table = (
    // The table is laid out left-to-right in both languages (mandi pinned on the
    // left); the scroll box must match or Urdu opens it scrolled to the far end.
    <div data-zm-hscroll className="zm-hide-scrollbar" style={{ direction: f.dir, overflow: "auto", maxHeight: fullscreen ? "none" : 440, flex: fullscreen ? 1 : undefined, minHeight: 0, paddingBottom: fullscreen ? "env(safe-area-inset-bottom)" : undefined, overscrollBehavior: "contain" }}>
      {/* Reads in the app's direction: in Urdu the mandi column is pinned on the
          right and the table scrolls right to left. Compact rows in both
          languages (Urdu text otherwise inherits a tall line height). */}
      <table dir={f.dir} style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 640, width: "100%", fontSize: 13, fontVariantNumeric: "tabular-nums", lineHeight: 1.35 }}>
        <thead>
          <tr>
            <th style={{ ...thBase, insetInlineStart: 0, zIndex: 3, textAlign: "start", borderInlineEnd: `1px solid ${C.line}`, minWidth: 96, maxWidth: 128, padding: "4px 5px" }}>
              {headBtn(
                sort === "nameAZ" ? f.tx("Mandi A→Z", "منڈی ا→ی") : sort === "nameZA" ? f.tx("Mandi Z→A", "منڈی ی→ا") : f.tx("Mandi", "منڈی"),
                sort === "nameAZ" || sort === "nameZA",
                () => setPicker("nameSort"),
              )}
            </th>
            <th style={{ ...thBase, minWidth: 85 }}>
              {headBtn(
                sort === "priceHigh" ? f.tx("Min–Max (High)", "کم–زیادہ (زیادہ)") : sort === "priceLow" ? f.tx("Min–Max (Low)", "کم–زیادہ (کم)") : f.tx("Min–Max", "کم–زیادہ"),
                isPriceSorted,
                () => setPicker("priceSort"),
              )}
            </th>
            <th style={{ ...thBase, minWidth: 58 }}>
              {headBtn(rateHeaderLabel, colFilters.rate !== undefined, () => setPicker("col:rate"))}
            </th>
            <th style={{ ...thBase, minWidth: 70 }}>
              {headBtn(
                sort === "change" ? f.tx(`Change (${interval}D) ↕`, `تبدیلی (${f.digits(interval)} دن) ↕`) : f.tx(`Change (${interval}D)`, `تبدیلی (${f.digits(interval)} دن)`),
                sort === "change" || interval !== 1,
                () => setPicker("interval"),
              )}
            </th>
            <th style={{ ...thBase, minWidth: 72 }}>
              {headBtn(
                sort === "arrivalHigh" || sort === "arrival" ? f.tx("Arrival (High)", "آمد (زیادہ)") : sort === "arrivalLow" ? f.tx("Arrival (Low)", "آمد (کم)") : f.tx(`Arrival (${arrivalUnitLabel})`, `آمد (${arrivalUnitLabel})`),
                isArrivalSorted,
                () => setPicker("arrivalSort"),
              )}
            </th>
            {specCols.map((c) => {
              const v = colValue(c.key);
              return (
                <th key={c.key} style={{ ...thBase }}>
                  {headBtn(
                    v ? (c.key === "unit" ? f.unit(v) : c.key === "quality" ? t(cleanQuality(v)) : attrValue(f, t, c.key as AttrKey, v)) : c.label,
                    colFilters[c.key] !== undefined,
                    () => setPicker(`col:${c.key}`),
                  )}
                </th>
              );
            })}
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
                <td style={{ ...td, position: "sticky", insetInlineStart: 0, zIndex: 1, textAlign: "start", fontWeight: 700, color: C.ink, borderInlineEnd: `1px solid ${C.line}`, padding: "8px 8px", minWidth: 96, maxWidth: 128, whiteSpace: "normal", overflowWrap: "break-word", lineHeight: 1.25 }}>
                  {tm(stripMandi(r.mandiName))}
                </td>
                <td style={{ ...td, fontWeight: 700, color: C.brand, padding: "8px 4px", fontSize: 12.5 }}><bdi dir="ltr">{r.min > 0 ? `${f.num(r.min)} – ${f.num(r.max)}` : "—"}</bdi></td>
                <td style={{ ...td, padding: "8px 3px" }}>
                  <span style={{ padding: "2px 6px", borderRadius: 5, fontSize: 11.5, fontWeight: 600, color: C.ink2, background: C.chip }}>
                    {shortRate(tr(r.rateType))}
                  </span>
                </td>
                <td style={{ ...td, fontWeight: 700, color: changeColor(e.change), padding: "8px 4px", fontSize: 12 }}>{e.change === null ? (
                  // No earlier report from this mandi in the window: its first one.
                  <span title={f.tx("First report from this mandi", "اس منڈی کی پہلی رپورٹ")} style={{ fontWeight: 600, color: C.faint, fontSize: 11 }}>{f.tx("1st report", "پہلی رپورٹ")}</span>
                ) : <bdi dir="ltr">{`${arrow(e.change)} ${f.pct(e.change)}`}</bdi>}</td>
                <td style={{ ...td, color: r.arrival > 0 ? C.arrival : C.faint, fontWeight: 600, padding: "8px 6px", fontSize: 12.5 }}>
                  {r.arrival > 0 ? f.num(r.arrival) : "—"}
                </td>
                {specCols.map((c) => (
                  <td key={c.key} style={{ ...td, padding: "8px 10px" }}>
                    {c.key === "unit" ? f.unit(r.arrivalUnit || "") || "—" : c.key === "quality" ? t(cleanQuality(r.quality)) || "—" : r[c.key] ? attrValue(f, t, c.key, r[c.key] as string) : "—"}
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

  // The table's rate type (its own Rate column filter, else the rail's).
  const cleanRate = shownRate ? shortRate(tr(shownRate)) : "";
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
              ? f.tx(`${mandiCount} location${mandiCount === 1 ? "" : "s"} in ${regionLabel} · PKR ${f.per}`, `${regionLabel} میں ${f.digits(mandiCount)} مقامات · روپے ${f.per}`)
              : f.tx(`${mandiCount} location${mandiCount === 1 ? "" : "s"} · PKR ${f.per}`, `${f.digits(mandiCount)} مقامات · روپے ${f.per}`)}
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
          <button type="button" style={pillBtn(sort !== "none")} onClick={() => setPicker("sort")}>
            <Icon name="sort" size={14} width={2.4} color={sort !== "none" ? "#FFFFFF" : C.muted} />
            {sortLabel[sort]}
            <Icon name="chevDown" size={12} width={2.6} color={C.muted} />
          </button>
          <button type="button" style={pillBtn(interval !== 1)} onClick={() => setPicker("interval")}>
            <Icon name="clock" size={14} width={2.4} color={interval !== 1 ? "#FFFFFF" : C.muted} />
            {f.tx(`${interval}D change`, `${f.digits(interval)} دن تبدیلی`)}
            <Icon name="chevDown" size={12} width={2.6} color={interval !== 1 ? "#FFFFFF" : C.muted} />
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
          value={[sort === "priceHigh" || sort === "priceLow" ? sort : "none"]}
          onChange={(v) => onSort(v[0] as SortKey)}
          onClose={() => setPicker(null)}
          options={[
            { id: "none", label: f.tx("No sorting", "ترتیب نہیں") },
            { id: "priceHigh", label: f.tx("Highest Price", "سب سے زیادہ قیمت") },
            { id: "priceLow", label: f.tx("Lowest Price", "سب سے کم قیمت") },
          ]}
        />
      )}

      {picker === "arrivalSort" && (
        <PickerSheet
          f={f}
          title={f.tx("Sort by Arrival", "آمد کے لحاظ سے ترتیب")}
          value={[sort === "arrivalHigh" || sort === "arrivalLow" || sort === "arrival" ? (sort === "arrival" ? "arrivalHigh" : sort) : "none"]}
          onChange={(v) => onSort(v[0] as SortKey)}
          onClose={() => setPicker(null)}
          options={[
            { id: "none", label: f.tx("No sorting", "ترتیب نہیں") },
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
          footer={
            <button
              type="button"
              onClick={() => {
                onSort(sort === "change" ? "none" : "change");
                setPicker(null);
              }}
              style={{ flex: 1, height: 48, borderRadius: 14, border: `1.5px solid ${C.brand}`, background: sort === "change" ? C.brand : C.surface, color: sort === "change" ? "#FFFFFF" : C.brandDeep, fontSize: 15, fontWeight: 600, fontFamily: f.font }}
            >
              {sort === "change" ? f.tx("Stop sorting by change", "تبدیلی کی ترتیب ختم کریں") : f.tx("Sort by biggest change", "سب سے بڑی تبدیلی پہلے")}
            </button>
          }
        />
      )}

      {picker === "nameSort" && (
        <PickerSheet
          f={f}
          title={f.tx("Sort by mandi name", "منڈی کے نام سے ترتیب")}
          value={[sort === "nameAZ" || sort === "nameZA" ? sort : "none"]}
          onChange={(v) => onSort(v[0] as SortKey)}
          onClose={() => setPicker(null)}
          options={[
            { id: "none", label: f.tx("No sorting", "ترتیب نہیں") },
            { id: "nameAZ", label: f.tx("A → Z", "ا → ی") },
            { id: "nameZA", label: f.tx("Z → A", "ی → ا") },
          ]}
        />
      )}

      {picker?.startsWith("col:") && (() => {
        const key = picker.slice(4) as ValueCol;
        const label = key === "rate" ? f.tx("Rate type", "ریٹ کی قسم") : specCols.find((c) => c.key === key)?.label ?? key;
        const show = (v: string) =>
          key === "rate" ? shortRate(tr(v)) : key === "unit" ? f.unit(v) : key === "quality" ? t(cleanQuality(v)) : attrValue(f, t, key as AttrKey, v);
        return (
          <PickerSheet
            f={f}
            title={f.tx(`Filter by ${label}`, `${label} سے فلٹر`)}
            value={[colValue(key) || "__all"]}
            onChange={(v) => {
              const next = v[0] === "__all" ? "" : v[0];
              // Back to the rail's value = no table filter for this column.
              setColFilters((prev) => ({ ...prev, [key]: norm(next) === norm(railValue(key)) ? undefined : next }));
            }}
            onClose={() => setPicker(null)}
            options={[
              { id: "__all", label: f.tx("All", "تمام") },
              ...valueOptions(key).map(([v, n]) => ({ id: v, label: `${show(v)} · ${f.digits(n)}` })),
            ]}
          />
        );
      })()}

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
          {emptyNote ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              <span>{emptyNote.message}</span>
              <EmptyActions f={f} actions={emptyNote.actions} center />
            </div>
          ) : (
            f.tx("No mandi reported for the day and filters you picked.", "اس دن اور فلٹر کے لیے کسی منڈی کی رپورٹ نہیں۔")
          )}
        </div>
      ) : viewMode === "table" ? (
        <div style={{ padding: "0 16px" }}>
          <div style={{ borderRadius: 20, background: C.surface, overflow: "hidden" }}>
            {table}
            {showMoreBtn}
          </div>
          <button
            type="button"
            onClick={() => setFullscreen(true)}
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

      {fullscreen && (
        <FullscreenLayer
          f={f}
          title={f.tx("Mandi rates", "منڈی ریٹس")}
          // The date / period sits on the calendar button beside it.
          subtitle={
            datePicker
              ? f.tx(`${entries.length} rows · PKR ${f.per}`, `${f.digits(entries.length)} قطاریں · روپے ${f.per}`)
              : f.tx(`${periodLabel || f.day(date)} · ${entries.length} rows · PKR ${f.per}`, `${periodLabel || f.day(date)} · ${f.digits(entries.length)} قطاریں · روپے ${f.per}`)
          }
          actions={
            <>
        {datePicker && (
          <button
            type="button"
            onClick={() => setCalOpen(true)}
            aria-label={f.tx(`Dates: ${periodLabel || f.day(date)}`, `تاریخیں: ${periodLabel || f.day(date)}`)}
            style={{
              height: 38,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 12px",
              borderRadius: 12,
              border: `1px solid ${datePicker.dayRange || date !== datePicker.latest ? C.brand : C.line}`,
              background: datePicker.dayRange || date !== datePicker.latest ? C.brandTint : C.surface,
              color: C.brandDeep,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: f.font,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <Icon name="calendar" size={16} width={2.2} color={C.brandDeep} />
            {periodLabel || f.day(date)}
          </button>
        )}
            </>
          }
          onClose={closeFullscreen}
        >
          {table}
        </FullscreenLayer>
      )}
      {calOpen && datePicker && (
        <RangeSheet
          f={f}
          dates={datePicker.dates}
          day={date}
          onPickDay={(d) => {
            datePicker.onDayRange(null);
            datePicker.onDate(d);
          }}
          dayDisabled={(d) => datePicker.lockHistory && d !== datePicker.latest}
          allowRange={!datePicker.lockHistory}
          initialMode={datePicker.dayRange ? "range" : "day"}
          value={datePicker.dayRange || { start: datePicker.dates[Math.max(0, datePicker.dates.indexOf(date) - 6)] || date, end: date }}
          onApply={(r) => datePicker.onDayRange(r)}
          onClose={() => setCalOpen(false)}
        />
      )}
    </section>
  );
}

function changeColor(c: number | null) {
  if (c === null) return C.faint;
  return signed(c) > 0 ? C.up : signed(c) < 0 ? C.down : C.muted;
}

/** Column titles for the attribute columns (also used by the mandi detail history table). */
export function colLabel(f: Fmt, k: AttrKey) {
  const L: Record<AttrKey, [string, string]> = {
    newOld: ["Crop", "فصل"],
    variety: ["Variety", "قسم"],
    moisture: ["Moisture", "نمی"],
    color: ["Color", "رنگ"],
    spec: ["Spec", "خصوصیت"],
    origin: ["Origin", "علاقہ"],
    quality: ["Quality", "معیار"],
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
  primary: AttrKey | null;
  onOpen: () => void;
}) {
  const r = e.row;
  const order: AttrKey[] = [...(primary ? [primary] : []), ...(["newOld", "variety", "moisture", "color", "spec"] as AttrKey[]).filter((k) => k !== primary)];
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
          <span style={{ overflowWrap: "break-word", fontSize: 15, fontWeight: 600, lineHeight: f.lh, whiteSpace: "normal", }}>
            {[tm(stripMandi(r.mandiName)), shortRate(tr(r.rateType))].filter(Boolean).join(" · ")}
          </span>
          {selected && (
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: C.brand, color: "#fff", flexShrink: 0 }}>{f.tx("Selected", "منتخب")}</span>
          )}
        </span>
        {sub ? (
          <span style={{ overflowWrap: "break-word", fontSize: 12.5, fontWeight: 500, color: C.muted, lineHeight: f.lh, whiteSpace: "normal", }}>
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
            <span style={{ fontSize: 12, fontWeight: 500, color: C.faint }}>{e.change === null ? f.tx("First report", "پہلی رپورٹ") : f.tx("No change", "کوئی تبدیلی نہیں")}</span>
          )}
        </div>
      </div>
    </button>
  );
}

