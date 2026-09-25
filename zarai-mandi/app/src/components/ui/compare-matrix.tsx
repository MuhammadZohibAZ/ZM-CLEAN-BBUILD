import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Comparison matrix — a table of tables, adapted from the "DarkMatrix" plan
 * table for Zarai Mandi. Price type is the only vertical axis.
 *
 *                 PUNJAB                        SINDH
 *              ╭───────────────────────╮   ╭───────────────────────╮  ← location box
 *              │╭─────────╮╭─────────╮ │   │╭─────────╮╭─────────╮ │
 *              ││ Wheat   ││ Maize   │ │   ││ Wheat   ││ Maize   │ │  ← product cards:
 *              ││ Flour ▾ ││ Grade A │ │   ││ Barley  ││ Grade A │ │    byproduct + special
 *   ╭────────╮ │├─────────┤├─────────┤ │   │├─────────┤├─────────┤ │
 *   │Avg min │ ││  5,325  ││  2,480  │ │   ││  4,230  ││  2,300  │ │  ← values; swipe a card
 *   │Avg max │ ││  …      ││  …      │ │   ││  …      ││  …      │ │    for the next byproduct
 *   ╰────────╯ │╰─────────╯╰─────────╯ │   │╰─────────╯╰─────────╯ │
 *   attributes ╰───────────────────────╯   ╰───────────────────────╯
 *
 * Every division is on screen at once, wrapping into rows of location boxes
 * when needed (4 provinces in portrait → 2 × 2). Each card keeps its position in
 * every price-type section. Cards with the same `syncKey` (one product across
 * locations) scroll together; other cards scroll independently.
 * `MandiMatrix` uses the same boxes and cards, listing every mandi per byproduct.
 */

export interface MatrixCell {
  value: React.ReactNode;
  note?: React.ReactNode;
  /** Numeric value used for the difference against the same item in the first division. */
  numeric?: number | null;
  /** Plain-text value for exports (PDF). */
  text?: string;
  empty?: boolean;
}

/** A byproduct's one special attribute (e.g. New / Old), shown with its name. */
export interface MatrixSpecial {
  label: string;
  value: string;
  /** Values with report counts; more than one makes the chip a picker. */
  options?: { value: string; count: number }[];
  onChange?: (value: string) => void;
}

export interface MatrixColumn {
  id: string;
  /** Same key in different panes = the same item (e.g. one byproduct in two provinces). */
  matchKey?: string;
  title: string;
  subtitle?: string;
  special?: MatrixSpecial;
  unit?: string;
  /** Cells keyed `${sectionId}:${rowId}`. */
  cells: Record<string, MatrixCell | undefined>;
}

export interface MatrixPane {
  id: string;
  title: string;
  color: string;
  columns: MatrixColumn[];
  /** Panes with the same key scroll together (and share one column list). Default: the pane's own id. */
  syncKey?: string;
}

/** An outer division (a location), holding one pane per product. */
export interface MatrixGroup {
  id: string;
  title: string;
  subtitle?: string;
  color: string;
  panes: MatrixPane[];
}

export interface MatrixRowDef {
  id: string;
  label: string;
  hint?: string;
  /** Show the difference against the same item in the first division. */
  compare?: boolean;
}

export interface MatrixSectionDef {
  id: string;
  label: string;
  hint?: string;
  rows: MatrixRowDef[];
}

/** One mandi's figures for one byproduct (mandi breakdown). */
export interface MandiEntry {
  id: string;
  name: string;
  district?: string;
  min: number | null;
  max: number | null;
  minText: string;
  maxText: string;
  reports: number;
  change?: string;
}

export interface MandiColumn {
  id: string;
  matchKey?: string;
  title: string;
  special?: MatrixSpecial;
  entries: MandiEntry[];
}

export interface MandiPane {
  id: string;
  title: string;
  color: string;
  columns: MandiColumn[];
  syncKey?: string;
}

export interface MandiGroup {
  id: string;
  title: string;
  subtitle?: string;
  color: string;
  panes: MandiPane[];
}

export interface CompareMatrixProps {
  groups: MatrixGroup[];
  sections: MatrixSectionDef[];
  eyebrow?: string;
  title?: string;
  /** One-line context, e.g. "All prices below are for Punjab". */
  context?: string;
  /** Height of any sticky bar above; section headers pin below it. */
  stickyTop?: number;
  className?: string;
}

const PANE_BAND_H = 22;
const COLHEAD_H = 40;
const SECTION_H = 30;
/** Location name above its box. */
const LABEL_H = 20;
const BOX_PAD = 4;
const GROUP_GAP = 8;
const PANE_GAP = 4;
const ATTR_GAP = 6;
/** Mandi list rows. */
const MANDI_ROW_H = 40;
const MANDI_LIST_ROWS = 9;

/** Value of `data-matrix-section` on each section heading (jump navigation). */
export const matrixSectionId = (sectionId: string) => `section|${sectionId}`;

export const matrixCellKey = (sectionId: string, rowId: string) => `${sectionId}:${rowId}`;

function useContainerWidth<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [width, setWidth] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Keeps scrollers of the same group on the same column index. Only the
 * scroller the user is touching leads (and snaps); the rest follow without
 * snapping. Each group reports its current column index.
 */
function useScrollSync() {
  const groups = React.useRef(new Map<string, Map<HTMLElement, number>>());
  const leaders = React.useRef(new Map<string, HTMLElement>());
  const frames = React.useRef(new Map<string, number>());
  const indicators = React.useRef(new Map<string, Set<HTMLElement>>());
  const fades = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [indexes, setIndexes] = React.useState<Record<string, number>>({});

  const sync = React.useMemo(() => {
    const members = (group: string) => {
      let m = groups.current.get(group);
      if (!m) groups.current.set(group, (m = new Map()));
      return m;
    };
    const lead = (group: string, el: HTMLElement) => {
      if (leaders.current.get(group) === el) return;
      leaders.current.set(group, el);
      for (const other of members(group).keys()) other.style.scrollSnapType = other === el ? "x mandatory" : "none";
    };
    /** Sizes/positions the group's scroll indicators from `el`; shows them briefly. */
    const paint = (group: string, el: HTMLElement, linger = 900) => {
      const bars = indicators.current.get(group);
      if (!bars?.size) return;
      const range = el.scrollWidth - el.clientWidth;
      const size = el.scrollWidth ? Math.min(1, el.clientWidth / el.scrollWidth) : 1;
      const at = range > 0 ? el.scrollLeft / range : 0;
      for (const bar of bars) {
        bar.style.setProperty("--thumb-size", `${size * 100}%`);
        bar.style.setProperty("--thumb-at", `${(at * (1 - size) * 100) / size}%`);
        bar.dataset.active = "true";
      }
      clearTimeout(fades.current.get(group));
      fades.current.set(group, setTimeout(() => bars.forEach((bar) => delete bar.dataset.active), linger));
    };
    return {
      lead,
      paint,
      /** Registers a scroll indicator for a group; returns its cleanup. */
      indicator(group: string, bar: HTMLElement) {
        const set = indicators.current.get(group) ?? new Set<HTMLElement>();
        set.add(bar);
        indicators.current.set(group, set);
        return () => {
          set.delete(bar);
        };
      },
      follow(group: string, el: HTMLElement) {
        if (leaders.current.get(group) !== el) return;
        paint(group, el);
        const scrollers = members(group);
        const index = el.scrollLeft / (scrollers.get(el) || 1);
        for (const [other, width] of scrollers) {
          if (other === el) continue;
          const target = index * width;
          if (Math.abs(other.scrollLeft - target) > 0.5) other.scrollLeft = target;
        }
        cancelAnimationFrame(frames.current.get(group) ?? 0);
        frames.current.set(
          group,
          requestAnimationFrame(() => {
            const rounded = Math.round(index);
            setIndexes((prev) => (prev[group] === rounded ? prev : { ...prev, [group]: rounded }));
          }),
        );
      },
      /** Registers a scroller in a group; returns its cleanup. */
      register(group: string, el: HTMLElement, columnWidth: number) {
        const first = members(group).size === 0;
        members(group).set(el, columnWidth);
        // First scroller of a group: show its indicator once as a "you can swipe" hint.
        if (first) setTimeout(() => paint(group, el, 1800), 300);
        return () => {
          members(group).delete(el);
          if (leaders.current.get(group) === el) leaders.current.delete(group);
        };
      },
      /** Scroll a group by whole columns (arrows; negative = back). */
      step(group: string, el: HTMLElement | undefined, columns: number) {
        if (!el) return;
        lead(group, el);
        el.scrollBy({ left: columns * (members(group).get(el) || el.clientWidth), behavior: "smooth" });
      },
      reset() {
        setIndexes({});
      },
    };
  }, []);

  return { sync, indexes };
}

type Sync = ReturnType<typeof useScrollSync>["sync"];
const groupOf = (pane: { id: string; syncKey?: string }) => pane.syncKey ?? pane.id;

function difference(base: number | null | undefined, value: number | null | undefined) {
  if (base == null || value == null || base === 0) return null;
  return ((value - base) / Math.abs(base)) * 100;
}

/** A horizontally scrolling strip that joins the sync group. */
function SyncScroller({
  sync,
  group,
  columnWidth,
  className,
  style,
  onElement,
  children,
  ...rest
}: {
  sync: Sync;
  columnWidth: number;
  onElement?: (el: HTMLDivElement | null) => void;
} & React.HTMLAttributes<HTMLDivElement> & { group: string }) {
  const [el, setEl] = React.useState<HTMLDivElement | null>(null);
  React.useEffect(() => {
    onElement?.(el);
    if (!el) return;
    return sync.register(group, el, columnWidth);
  }, [el, group, columnWidth, sync]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div
      ref={setEl}
      className={cn("zm-sync-scroller flex overflow-x-auto", className)}
      style={style}
      onPointerDown={() => el && sync.lead(group, el)}
      onTouchStart={() => el && sync.lead(group, el)}
      onWheel={() => el && sync.lead(group, el)}
      onScroll={() => el && sync.follow(group, el)}
      {...rest}
    >
      {children}
    </div>
  );
}

function SpecialChip({ special, color, byproduct, compact = false }: { special: MatrixSpecial; color: string; byproduct: string; compact?: boolean }) {
  const choosable = (special.options?.length ?? 0) > 1 && !!special.onChange;
  return (
    <span
      className="relative inline-flex max-w-full items-center gap-1 self-start rounded-full py-[2px] pl-[3px] pr-2 text-[10.5px] font-extrabold leading-tight"
      style={{ background: `${color}1f`, color, boxShadow: `inset 0 0 0 1px ${color}40` }}
      title={`${special.label}: ${special.value}`}
    >
      {!compact && (
        <span className="shrink-0 rounded-full px-1.5 py-px text-[8.5px] font-bold uppercase tracking-[0.04em] text-white" style={{ background: color }}>
          {special.label}
        </span>
      )}
      <span className="truncate">{special.value}</span>
      {choosable && (
        <>
          <ChevronDown className="size-3 shrink-0" aria-hidden />
          <select
            aria-label={`${byproduct}: ${special.label}`}
            value={special.value}
            onChange={(event) => special.onChange?.(event.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {special.options!.map((o) => (
              <option key={o.value} value={o.value}>
                {o.value} · {o.count} report{o.count === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </>
      )}
    </span>
  );
}

/** Thin bar under a pane's header: appears while swiping (and once as a hint), then fades. */
function ScrollIndicator({ sync, group, color }: { sync: Sync; group: string; color: string }) {
  const [el, setEl] = React.useState<HTMLDivElement | null>(null);
  React.useEffect(() => (el ? sync.indicator(group, el) : undefined), [el, group, sync]);
  return (
    <div ref={setEl} className="zm-scroll-indicator" aria-hidden="true" style={{ "--thumb-color": color } as React.CSSProperties}>
      <span />
    </div>
  );
}

type AnyPane = { id: string; title: string; color: string; syncKey?: string; columns: { id: string; matchKey?: string }[] };
type AnyGroup<P extends AnyPane> = { id: string; title: string; subtitle?: string; color: string; panes: P[] };
type Placement<P extends AnyPane> = { group: AnyGroup<P>; panes: P[] };

/**
 * Lays location boxes out in rows. Boxes stay whole when their product cards
 * fit (portrait: up to 2 boxes per row, wide: up to 4); a box with more products
 * than fit is split across rows. `labelWidth` is the attributes card (0 for the
 * mandi view).
 */
function layoutTiles<P extends AnyPane>(groups: AnyGroup<P>[], width: number, withLabels: boolean) {
  const compact = width < 640;
  const labelWidth = withLabels ? (compact ? 56 : 100) : 0;
  const attrGap = withLabels ? ATTR_GAP : 0;
  const minPane = withLabels ? (compact ? 64 : 118) : compact ? 76 : 150;
  const maxGroupsPerRow = compact ? 2 : 4;
  const panesPerGroup = Math.max(1, ...groups.map((g) => g.panes.length));
  // Width left for cards when `g` boxes share a row.
  const inner = (g: number, p: number) => width - labelWidth - attrGap - g * 2 * BOX_PAD - (g - 1) * GROUP_GAP - g * (p - 1) * PANE_GAP;

  let perRow = 1;
  for (let g = Math.min(maxGroupsPerRow, groups.length); g >= 1; g--)
    if (inner(g, panesPerGroup) / (g * panesPerGroup) >= minPane) {
      perRow = g;
      break;
    }

  let rows: Placement<P>[][];
  let paneWidth: number;
  if (inner(1, panesPerGroup) / panesPerGroup >= minPane || panesPerGroup === 1) {
    rows = [];
    for (let i = 0; i < groups.length; i += perRow) rows.push(groups.slice(i, i + perRow).map((group) => ({ group, panes: group.panes })));
    paneWidth = inner(perRow, panesPerGroup) / (perRow * panesPerGroup);
  } else {
    // Too many products for one row: split each box across rows.
    let fit = panesPerGroup;
    while (fit > 1 && inner(1, fit) / fit < minPane) fit--;
    rows = groups.flatMap((group) => {
      const parts: Placement<P>[][] = [];
      for (let i = 0; i < group.panes.length; i += fit) parts.push([{ group, panes: group.panes.slice(i, i + fit) }]);
      return parts;
    });
    paneWidth = inner(1, fit) / fit;
  }
  const narrow = paneWidth < 112;
  return {
    compact,
    narrow,
    labelWidth,
    attrGap,
    paneWidth,
    rows,
    rowH: compact ? 38 : 42,
    minColumn: compact ? 140 : 150,
    colHeadH: narrow ? 50 : COLHEAD_H,
  };
}

type Layout = ReturnType<typeof layoutTiles>;

/** Location name above its box, then the outlined box holding product cards. */
function LocationBox({ group, count, paneWidth, children }: { group: AnyGroup<AnyPane>; count: number; paneWidth: number; children: React.ReactNode }) {
  return (
    <div className="shrink-0" style={{ width: paneWidth * count + (count - 1) * PANE_GAP + 2 * BOX_PAD }}>
      <div className="flex items-end gap-1 px-1 pb-1" style={{ height: LABEL_H, color: group.color }}>
        <span className="size-1.5 shrink-0 self-center rounded-full" style={{ background: group.color }} aria-hidden />
        <span className="truncate text-[10.5px] font-extrabold uppercase tracking-[0.08em]">{group.title}</span>
        {group.subtitle && <span className="shrink-0 text-[9px] font-semibold text-[#8A9A95]">{group.subtitle}</span>}
      </div>
      <div
        className="flex rounded-[16px]"
        style={{ padding: BOX_PAD, gap: PANE_GAP, background: `${group.color}10`, boxShadow: `inset 0 0 0 1.5px ${group.color}` }}
      >
        {children}
      </div>
    </div>
  );
}

/** Product card header band: product name + position (whole band is "next" on narrow cards). */
function TileBand({
  title,
  color,
  count,
  perPane,
  index,
  compact,
  narrow,
  onStep,
}: {
  title: string;
  color: string;
  count: number;
  perPane: number;
  index: number;
  compact: boolean;
  narrow: boolean;
  onStep: (columns: number) => void;
}) {
  const style = { height: PANE_BAND_H, background: `${color}1c`, color, boxShadow: `inset 0 -2px 0 ${color}` };
  const next = () => onStep(index + perPane >= count ? -count : 1);
  if (narrow)
    return (
      <button
        type="button"
        onClick={count > perPane ? next : undefined}
        aria-label={count > perPane ? `${title}: next byproduct (${Math.min(index + 1, count)} of ${count})` : title}
        className="flex w-full items-center gap-1 px-1 text-left"
        style={style}
      >
        <span className="min-w-0 flex-1 truncate text-[10px] font-extrabold">{title}</span>
        {count > perPane && <span className="shrink-0 text-[9px] font-bold tabular-nums">{Math.min(index + 1, count)}/{count}</span>}
      </button>
    );
  return (
    <div className="flex items-center gap-0.5 pl-2 pr-0.5" style={style}>
      <span className={cn("min-w-0 flex-1 truncate font-extrabold", compact ? "text-[11px]" : "text-[12px]")}>{title}</span>
      {count > perPane && (
        <span className="flex shrink-0 items-center">
          {!compact && (
            <button type="button" aria-label={`Previous byproduct in ${title}`} disabled={index <= 0} onClick={() => onStep(-1)} className="grid size-4 place-items-center rounded-full disabled:opacity-35">
              <ChevronLeft className="size-3" aria-hidden />
            </button>
          )}
          <span className="min-w-[24px] text-center text-[9.5px] font-bold tabular-nums">
            {Math.min(index + 1, count)}/{count}
          </span>
          <button type="button" aria-label={`Next byproduct in ${title}`} onClick={next} className="grid size-4 place-items-center rounded-full">
            <ChevronRight className="size-3" aria-hidden />
          </button>
        </span>
      )}
    </div>
  );
}

/** Byproduct name + special attribute, one per inner column; swipes with the card. */
function ColumnHeads({
  columns,
  color,
  group,
  columnWidth,
  height,
  narrow,
  compact,
  sync,
  showIndicator,
}: {
  columns: { id: string; title: string; special?: MatrixSpecial; subtitle?: string }[];
  color: string;
  group: string;
  columnWidth: number;
  height: number;
  narrow: boolean;
  compact: boolean;
  sync: Sync;
  showIndicator: boolean;
}) {
  return (
    <div className="relative">
      <SyncScroller sync={sync} group={group} columnWidth={columnWidth} style={{ height }}>
        {columns.map((c) => (
          <div
            key={c.id}
            className="flex shrink-0 flex-col justify-center gap-[3px] border-r border-[#EEF3F0] px-1.5 last:border-r-0 [scroll-snap-align:start]"
            style={{ width: columnWidth, background: `${color}0a` }}
          >
            <span
              className={cn("block font-extrabold leading-tight text-[#183B34]", narrow ? "line-clamp-2 text-[10.5px] [overflow-wrap:anywhere]" : cn("truncate", compact ? "text-[11px]" : "text-[12px]"))}
              title={c.title}
            >
              {c.title}
            </span>
            {c.special ? (
              <SpecialChip special={c.special} color={color} byproduct={c.title} compact={narrow} />
            ) : (
              <span className="block truncate text-[9.5px] font-medium leading-tight text-[#8A9A95]">{c.subtitle || (narrow ? "—" : "No special attribute")}</span>
            )}
          </div>
        ))}
        {!columns.length && <div className="px-2 py-2 text-[10.5px] text-[#7A8A85]">No reports</div>}
      </SyncScroller>
      {showIndicator && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <ScrollIndicator sync={sync} group={group} color={color} />
        </div>
      )}
    </div>
  );
}

function Tile({
  pane,
  group,
  section,
  layout,
  columnWidth,
  perPane,
  index,
  sync,
  baseFor,
}: {
  pane: MatrixPane;
  group: MatrixGroup;
  section: MatrixSectionDef;
  layout: Layout;
  columnWidth: number;
  perPane: number;
  index: number;
  sync: Sync;
  baseFor: (column: MatrixColumn, paneId: string) => { column: MatrixColumn; title: string } | null;
}) {
  const key = groupOf(pane);
  const body = React.useRef<HTMLElement | null>(null);
  const count = pane.columns.length;
  const { narrow, compact, rowH } = layout;
  return (
    <div
      className="min-w-0 shrink-0 overflow-hidden rounded-[12px] bg-white"
      style={{ width: layout.paneWidth, boxShadow: `0 0 0 1.5px ${pane.color}66, 0 2px 8px rgba(24,59,52,0.06)` }}
    >
      <TileBand title={pane.title} color={pane.color} count={count} perPane={perPane} index={index} compact={compact} narrow={narrow} onStep={(n) => sync.step(key, body.current ?? undefined, n)} />
      <ColumnHeads columns={pane.columns} color={pane.color} group={key} columnWidth={columnWidth} height={layout.colHeadH} narrow={narrow} compact={compact} sync={sync} showIndicator={count > perPane} />
      <SyncScroller
        sync={sync}
        group={key}
        columnWidth={columnWidth}
        role="group"
        aria-label={`${group.title} · ${pane.title}, ${section.label}: swipe for more byproducts`}
        onElement={(el) => (body.current = el)}
      >
        {pane.columns.map((c) => {
          const base = baseFor(c, pane.id);
          return (
            <div key={c.id} className="shrink-0 border-r border-[#EEF3F0] last:border-r-0 [scroll-snap-align:start]" style={{ width: columnWidth }}>
              {section.rows.map((r) => {
                const cell = c.cells[matrixCellKey(section.id, r.id)];
                // Too narrow to read a % chip: left out on narrow cards (wider cards and landscape show it).
                const delta = r.compare && base && !narrow ? difference(base.column.cells[matrixCellKey(section.id, r.id)]?.numeric, cell?.numeric) : null;
                return (
                  <div
                    key={r.id}
                    className="flex flex-col justify-center border-b border-dashed border-[#DCE7E2] px-1.5 last:border-b-0"
                    style={{ height: rowH }}
                    aria-label={`${group.title}, ${pane.title}, ${c.title}, ${section.label}, ${r.label}`}
                  >
                    {!cell || cell.empty ? (
                      <span className="text-[#A6B3AE]" aria-label="Not reported">
                        —
                      </span>
                    ) : (
                      <>
                        <span className="flex min-w-0 items-baseline gap-1 whitespace-nowrap">
                          <span className={cn("font-extrabold tabular-nums leading-tight text-[#183B34]", compact ? "text-[12px]" : "text-[13px]")}>{cell.value}</span>
                          {delta !== null && Number.isFinite(delta) && (
                            <span className="truncate rounded bg-[#EEF2F0] px-0.5 text-[8.5px] font-bold tabular-nums text-[#3E524C]" title={`Difference vs ${base!.title}`}>
                              {delta > 0 ? "+" : ""}
                              {delta.toFixed(1)}%
                            </span>
                          )}
                        </span>
                        {cell.note && <span className="truncate text-[9px] leading-tight text-[#6B7C76]">{cell.note}</span>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </SyncScroller>
    </div>
  );
}

/** Keeps panes that scroll together on one column list (every item with data in any of them). */
function alignColumns<P extends AnyPane, G extends AnyGroup<P>>(groups: G[], hasData: (column: P["columns"][number]) => boolean): G[] {
  const live = new Map<string, Set<string>>();
  for (const g of groups)
    for (const p of g.panes) {
      const keys = live.get(groupOf(p)) ?? new Set<string>();
      p.columns.filter(hasData).forEach((c) => keys.add(c.matchKey ?? c.id));
      live.set(groupOf(p), keys);
    }
  return groups.map((g) => ({
    ...g,
    panes: g.panes.map((p) => ({ ...p, columns: p.columns.filter((c) => live.get(groupOf(p))!.has(c.matchKey ?? c.id)) })),
  }));
}

function SectionShell({
  id,
  label,
  hint,
  stickyTop,
  delay,
  children,
}: {
  id: string;
  label: string;
  hint?: React.ReactNode;
  stickyTop: number;
  delay: number;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: reduced ? 0 : delay, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-[18px] border border-[#D5E2DD] bg-white shadow-[0_4px_16px_rgba(24,59,52,0.05)] [overflow:clip]"
      aria-label={label}
    >
      {/* Section heading: pins below the app bar while its section is on screen. */}
      <div
        data-matrix-section={id}
        className="sticky z-20 flex items-center justify-between gap-2 border-b border-[#D5E2DD] bg-[#EAF5F1]/95 px-3 backdrop-blur"
        style={{ top: stickyTop, height: SECTION_H, scrollMarginTop: stickyTop }}
      >
        <span className="text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-[#0E645C]">{label}</span>
        {hint && <span className="truncate text-[10px] font-semibold text-[#52635F]">{hint}</span>}
      </div>
      <div className="flex flex-col gap-3 px-1 pb-2 pt-1.5">{children}</div>
    </motion.section>
  );
}

export function CompareMatrix({ groups, sections, eyebrow, title, context, stickyTop = 0, className }: CompareMatrixProps) {
  const [ref, width] = useContainerWidth<HTMLDivElement>();
  const { sync, indexes } = useScrollSync();
  // Section body has 4px side padding.
  const inner = Math.max(0, width - 8);

  const layoutKey = `${groups.map((g) => `${g.id}:${g.panes.length}`).join("|")}@${width}`;
  React.useEffect(() => sync.reset(), [layoutKey, sync]);

  const aligned = React.useMemo(
    () => alignColumns<MatrixPane, MatrixGroup>(groups, (c) => Object.values((c as MatrixColumn).cells).some((cell) => cell && !cell.empty)),
    [groups],
  );

  // Difference chips: compare an item with the same item in the first division that has it.
  const baseFor = React.useCallback(
    (column: MatrixColumn, paneId: string) => {
      const key = column.matchKey ?? column.id;
      for (const g of aligned)
        for (const p of g.panes) {
          const hit = p.columns.find((c) => (c.matchKey ?? c.id) === key && c.unit === column.unit);
          if (hit) return p.id === paneId ? null : { column: hit, title: g.panes.length > 1 ? `${g.title} ${p.title}` : g.title };
        }
      return null;
    },
    [aligned],
  );

  const shownSections = sections
    .map((s) => ({
      ...s,
      rows: s.rows.filter((r) =>
        aligned.some((g) =>
          g.panes.some((p) =>
            p.columns.some((c) => {
              const cell = c.cells[matrixCellKey(s.id, r.id)];
              return cell && !cell.empty;
            }),
          ),
        ),
      ),
    }))
    .filter((s) => s.rows.length);

  const layout = inner > 0 ? layoutTiles(aligned, inner, true) : null;

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {(title || eyebrow) && (
        <header className="mb-2.5 px-0.5">
          {eyebrow && <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#087F63]">{eyebrow}</span>}
          {title && <h3 className="text-[15px] font-extrabold leading-tight text-[#183B34]">{title}</h3>}
          {context && <p className="mt-0.5 text-[11px] font-medium text-[#52635F]">{context}</p>}
        </header>
      )}
      {layout && (
        <div className="flex flex-col gap-3.5">
          {shownSections.map((section, sIndex) => {
            const perPane = Math.max(1, Math.floor(layout.paneWidth / layout.minColumn));
            const columnWidth = layout.paneWidth / perPane;
            const headH = LABEL_H + BOX_PAD + PANE_BAND_H + layout.colHeadH;
            return (
              <SectionShell key={section.id} id={matrixSectionId(section.id)} label={section.label} hint={section.hint} stickyTop={stickyTop} delay={Math.min(sIndex, 5) * 0.04}>
                {layout.rows.map((row, rIndex) => (
                  <div key={rIndex} className="flex items-start" style={{ gap: layout.attrGap }}>
                    {/* Attributes card, level with the cards' value rows */}
                    <div className="shrink-0" style={{ width: layout.labelWidth, paddingTop: headH }}>
                      <div className="overflow-hidden rounded-[12px] bg-[#F4FAF7] shadow-[0_0_0_1.5px_#D5E2DD]">
                        {section.rows.map((r) => (
                          <div key={r.id} className={cn("flex flex-col justify-center border-b border-dashed border-[#DCE7E2] last:border-b-0", layout.compact ? "px-1.5" : "px-2")} style={{ height: layout.rowH }}>
                            <span className={cn("truncate font-bold leading-tight text-[#3E524C]", layout.compact ? "text-[10px]" : "text-[11.5px]")}>{r.label}</span>
                            {r.hint && <span className="truncate text-[8.5px] leading-tight text-[#8A9A95]">{r.hint}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex" style={{ gap: GROUP_GAP }}>
                      {row.map(({ group, panes }) => (
                        <LocationBox key={`${group.id}:${panes[0]?.id}`} group={group} count={panes.length} paneWidth={layout.paneWidth}>
                          {panes.map((pane) => (
                            <Tile
                              key={pane.id}
                              pane={pane}
                              group={group as MatrixGroup}
                              section={section}
                              layout={layout}
                              columnWidth={columnWidth}
                              perPane={perPane}
                              index={indexes[groupOf(pane)] ?? 0}
                              sync={sync}
                              baseFor={baseFor}
                            />
                          ))}
                        </LocationBox>
                      ))}
                    </div>
                  </div>
                ))}
              </SectionShell>
            );
          })}
          {!shownSections.length && <p className="rounded-[18px] border border-[#D5E2DD] bg-white px-4 py-5 text-center text-[12px] text-[#52635F]">No reports on this date.</p>}
        </div>
      )}
    </div>
  );
}

export interface MandiMatrixProps {
  groups: MandiGroup[];
  id: string;
  label: string;
  hint?: React.ReactNode;
  /** Controls shown under the heading (price type, sort). */
  controls?: React.ReactNode;
  stickyTop?: number;
  className?: string;
}

/** The same location boxes and product cards, with every mandi listed per byproduct. */
export function MandiMatrix({ groups, id, label, hint, controls, stickyTop = 0, className }: MandiMatrixProps) {
  const [ref, width] = useContainerWidth<HTMLDivElement>();
  const { sync, indexes } = useScrollSync();
  const inner = Math.max(0, width - 8);
  const layoutKey = `${groups.map((g) => `${g.id}:${g.panes.length}`).join("|")}@${width}`;
  React.useEffect(() => sync.reset(), [layoutKey, sync]);
  const aligned = React.useMemo(() => alignColumns<MandiPane, MandiGroup>(groups, (c) => (c as MandiColumn).entries.length > 0), [groups]);
  const layout = inner > 0 ? layoutTiles(aligned, inner, false) : null;
  if (!aligned.length) return null;

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <SectionShell id={id} label={label} hint={hint} stickyTop={stickyTop} delay={0}>
        {controls}
        {layout &&
          layout.rows.map((row, rIndex) => {
            const perPane = Math.max(1, Math.floor(layout.paneWidth / (layout.compact ? 150 : 190)));
            const columnWidth = layout.paneWidth / perPane;
            return (
              <div key={rIndex} className="flex" style={{ gap: GROUP_GAP }}>
                {row.map(({ group, panes }) => (
                  <LocationBox key={`${group.id}:${panes[0]?.id}`} group={group} count={panes.length} paneWidth={layout.paneWidth}>
                    {panes.map((pane) => (
                      <MandiTile
                        key={pane.id}
                        pane={pane}
                        group={group as MandiGroup}
                        layout={layout}
                        columnWidth={columnWidth}
                        perPane={perPane}
                        index={indexes[groupOf(pane)] ?? 0}
                        sync={sync}
                      />
                    ))}
                  </LocationBox>
                ))}
              </div>
            );
          })}
      </SectionShell>
    </div>
  );
}

function MandiTile({
  pane,
  group,
  layout,
  columnWidth,
  perPane,
  index,
  sync,
}: {
  pane: MandiPane;
  group: MandiGroup;
  layout: Layout;
  columnWidth: number;
  perPane: number;
  index: number;
  sync: Sync;
}) {
  const key = groupOf(pane);
  const body = React.useRef<HTMLElement | null>(null);
  const count = pane.columns.length;
  const tight = columnWidth < 120;
  return (
    <div
      className="min-w-0 shrink-0 overflow-hidden rounded-[12px] bg-white"
      style={{ width: layout.paneWidth, boxShadow: `0 0 0 1.5px ${pane.color}66, 0 2px 8px rgba(24,59,52,0.06)` }}
    >
      <TileBand title={pane.title} color={pane.color} count={count} perPane={perPane} index={index} compact={layout.compact} narrow={tight} onStep={(n) => sync.step(key, body.current ?? undefined, n)} />
      <ColumnHeads columns={pane.columns} color={pane.color} group={key} columnWidth={columnWidth} height={tight ? 50 : COLHEAD_H} narrow={tight} compact={layout.compact} sync={sync} showIndicator={count > perPane} />
      <SyncScroller sync={sync} group={key} columnWidth={columnWidth} role="group" aria-label={`${group.title} · ${pane.title} mandis: swipe for more byproducts`} onElement={(el) => (body.current = el)}>
        {pane.columns.map((c) => {
          const lows = c.entries.map((e) => e.min).filter((v): v is number => v !== null);
          const highs = c.entries.map((e) => e.max).filter((v): v is number => v !== null);
          const lo = lows.length ? Math.min(...lows) : 0;
          const hi = highs.length ? Math.max(...highs) : 0;
          const span = hi > lo ? hi - lo : 1;
          const highest = c.entries.length > 1 ? c.entries.reduce((a, b) => ((b.max ?? -Infinity) > (a.max ?? -Infinity) ? b : a)).id : "";
          const lowest = c.entries.length > 1 ? c.entries.reduce((a, b) => ((b.min ?? Infinity) < (a.min ?? Infinity) ? b : a)).id : "";
          return (
            <div key={c.id} className="shrink-0 border-r border-[#EEF3F0] last:border-r-0 [scroll-snap-align:start]" style={{ width: columnWidth }}>
              <div className="zm-mandi-scroll overflow-y-auto overscroll-contain" style={{ maxHeight: MANDI_ROW_H * MANDI_LIST_ROWS }} role="list" aria-label={`${c.title} mandis`}>
                {c.entries.map((e) => {
                  const a = e.min ?? e.max, b = e.max ?? e.min;
                  return (
                    <div key={e.id} role="listitem" className="flex flex-col justify-center gap-[3px] border-b border-dashed border-[#DCE7E2] px-1.5" style={{ height: MANDI_ROW_H }}>
                      <span className="flex min-w-0 items-baseline gap-1">
                        <span className={cn("min-w-0 flex-1 truncate font-bold text-[#183B34]", tight ? "text-[10px]" : "text-[11.5px]")} title={e.district && e.district !== e.name ? `${e.name}, ${e.district}` : e.name}>
                          {e.name}
                        </span>
                        {e.id === highest && <span className="shrink-0 rounded-full bg-[#FBF1DD] px-1 text-[8px] font-extrabold text-[#9A6A1F]" title="Highest price">▲</span>}
                        {e.id === lowest && <span className="shrink-0 rounded-full bg-[#E4F2EC] px-1 text-[8px] font-extrabold text-[#0E645C]" title="Lowest price">▼</span>}
                        {!tight && <span className="shrink-0 text-[11.5px] font-extrabold tabular-nums text-[#183B34]">{e.maxText}</span>}
                      </span>
                      <span className="flex items-center gap-1.5">
                        {tight ? (
                          <span className="shrink-0 text-[10px] font-extrabold tabular-nums text-[#183B34]">{e.maxText.replace(/\.\d+$/, "")}</span>
                        ) : (
                          <span className="shrink-0 text-[9px] tabular-nums text-[#6B7C76]">{e.minText} –</span>
                        )}
                        <span className="relative h-[5px] min-w-0 flex-1 rounded-full bg-[#EDF2EF]">
                          {a !== null && b !== null && (
                            <i className="absolute inset-y-0 rounded-full" style={{ left: `${((a - lo) / span) * 100}%`, width: `${Math.max(3, ((b - a) / span) * 100)}%`, background: pane.color }} />
                          )}
                        </span>
                        {!tight && e.change && <span className="shrink-0 text-[9px] font-bold tabular-nums text-[#52635F]">{e.change}</span>}
                      </span>
                    </div>
                  );
                })}
                {!c.entries.length && <p className="px-2 py-3 text-[10.5px] text-[#7A8A85]">No mandi reports</p>}
              </div>
              <div className="border-t border-[#EEF3F0] bg-[#F4FAF7] px-1.5 py-1 text-[9px] font-semibold text-[#52635F]">
                {c.entries.length} mandi{c.entries.length === 1 ? "" : "s"}
                {c.entries.length > MANDI_LIST_ROWS ? " · scroll" : ""}
              </div>
            </div>
          );
        })}
      </SyncScroller>
    </div>
  );
}

export default CompareMatrix;
