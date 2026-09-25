/**
 * Zarai Mandi Compare — the app's Compare tab (rendered by CustomerFaceApp through
 * CompareScreen, which supplies live market data). The host app owns navigation,
 * so this module renders only its own header and content.
 * Arithmetic and behaviour notes: zarai-mandi/docs/COMPARE_FUNCTIONALITY.md
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Tag, MapPin, CalendarDays, Maximize2, Pencil, Bookmark, FileDown, ChevronDown, X } from 'lucide-react';
import type { CSSProperties, FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode, PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import useMeasure from 'react-use-measure';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CompareMatrix, MandiMatrix, matrixCellKey, matrixSectionId, type MandiEntry, type MandiGroup, type MatrixCell, type MatrixColumn, type MatrixGroup, type MatrixSectionDef } from '../ui/compare-matrix';
import type { PdfBoard, PdfMandiTable } from './report-pdf';
import { inDevicePreview, requestDeviceOrientation } from '../../lib/device-orientation';
import './compare.css';
function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// Price channels as reported in the market export ("Mandi Rate" → "Mandi"), in display order.
export const PRICE_TYPES = ['Mandi', 'Wholesale', 'Broker', 'Stock', 'Retail', 'Ex-Mill', 'Mill Gate', 'Dealer'] as const;
export type PriceType = typeof PRICE_TYPES[number];
export interface AttributeDefinition { key: string; label?: string; kind: 'category' | 'number'; unit?: string; options?: string[]; required?: boolean }
export type AttributeFilter = { kind: 'category'; values: string[] } | { kind: 'number'; min?: string; max?: string };
/** The byproduct's one special attribute (same rule as the home cards), e.g. New / Old. */
export interface SpecialAttribute { key: string; label: string; kind: 'category' | 'number'; unit?: string }
export interface Byproduct { id: string; name: string; attributes?: AttributeDefinition[]; special?: SpecialAttribute }
export interface Product { id: string; name: string; imageUrl?: string; byproducts: Byproduct[] }
export interface Category { id: string; name: string; kind: 'product' | 'vertical'; products: Product[] }
export interface MarketLocation { id: string; name: string; province: string; district: string }
export interface MarketRow {
  id: string; productId: string; byproductId: string; locationId: string; priceType: PriceType;
  minPrice: number | string | null; maxPrice: number | string | null; unit: string;
  arrivalMt: number | string | null;
  /** Shared byproduct arrivals are displayed without being summed across price channels. */
  arrivalScope: 'byproduct' | 'channel';
  grade?: string; quality?: Record<string, string>;
  trendPct: number | null; trendPeriod: string; trendBasis: string;
  updatedAt: string;
  /** Stable ID of an arrival observation if it is repeated in several price rows. */
  arrivalObservationId?: string;
}
export type LocationScope = { kind: 'country' | 'province' | 'district' | 'mandi'; value: string; province?: string };
/** Selection format of the app's location filter sheet. */
export type PickedLocation = { kind: 'pakistan' | 'province' | 'district' | 'mandi'; label: string };
export interface LocationPickerProps { selected: PickedLocation[]; dataNames: Set<string>; onApply: (locations: PickedLocation[]) => void; onClose: () => void }
export interface ProductFilter { priceTypes: PriceType[]; byproductIds: string[]; grades: string[]; attributes?: Record<string, Record<string, AttributeFilter>> }
export interface CompareSelection { productIds: string[]; filters: Record<string, ProductFilter>; scopes: LocationScope[] }
export interface DecisionRequest { name: string; phone: string; note: string; selection: CompareSelection; reportDate: string; createdAt: string }
export interface ZaraiMandiCompareProps {
  categories: Category[]; locations: MarketLocation[];
  /** Observations for the currently selected products (loaded on demand by the host). */
  rows: MarketRow[];
  /** Called when the selected products change so the host can load their rows. */
  onProductIdsChange?: (productIds: string[]) => void;
  rowsLoading?: boolean;
  rowsError?: string;
  /** Short provenance line, e.g. "Market data 15 Aug – 14 Sep 2026". */
  dataLabel?: string;
  ownedCategoryIds?: string[];
  /** Line above the product grid, e.g. free-trial or subscription note. */
  accessNote?: string;
  /** Renders the app's location filter sheet (same as the product screens). */
  renderLocationPicker?: (props: LocationPickerProps) => ReactNode;
  onDecisionRequest?: (request: DecisionRequest) => Promise<void>;
  onExit?: () => void;
  /** Scope this key to the authenticated user. null disables persistence. */
  storageKey?: string | null;
}

function Crop({ product, size = 78 }: { product: Product; size?: number }) {
  return <span className="zm-crop-circle" style={{ width: size, height: size }} aria-hidden="true">{product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" /> : <Icon name="leaf" size={size * .5} />}</span>;
}
type IconName = 'back' | 'arrow' | 'search' | 'check' | 'pin' | 'leaf' | 'edit' | 'download' | 'bookmark' | 'headset' | 'home' | 'compare' | 'news' | 'voice' | 'chart' | 'close' | 'chevron';
function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    back: <path d="m15 5-7 7 7 7" />, arrow: <path d="M4 12h16m-6-6 6 6-6 6" />, search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    check: <path d="m5 12 4 4L19 6" />, pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
    leaf: <><path d="M5 19C1 7 11 3 21 3c0 10-4 20-16 16Z" /><path d="m3 21 13-13" /></>, edit: <><path d="m14 5 5 5M4 20l5-1L21 7l-5-5L4 14v6ZM13 20h8" /></>,
    download: <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />, bookmark: <path d="M6 3h12v18l-6-4-6 4Z" />, headset: <><path d="M4 14v-3a8 8 0 0 1 16 0v8l-6 3" /><rect x="2" y="11" width="4" height="8" rx="2" /><rect x="18" y="11" width="4" height="8" rx="2" /></>,
    home: <path d="m3 11 9-8 9 8v10h-6v-7H9v7H3Z" />, compare: <><rect x="3" y="3" width="7" height="18" rx="2" /><rect x="14" y="3" width="7" height="18" rx="2" /><path d="M6 8h1m-1 5h1m10-5h1m-1 5h1" /></>,
    news: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M7 8h10M7 12h10M7 16h6" /></>, voice: <><rect x="9" y="2" width="6" height="13" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>,
    chart: <><path d="M3 21h19M5 17V9h3v8m3 0V5h3v12m3 0V2h3v15" /></>, close: <path d="m6 6 12 12M18 6 6 18" />, chevron: <path d="m8 4 8 8-8 8" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const unique = <T,>(items: T[]) => [...new Set(items)];
const PROVINCE_META: Record<string, { sub: string; icon: string }> = {
  Punjab: { sub: 'Punjab Province', icon: '🏛️' }, Sindh: { sub: 'Sindh Province', icon: '🕌' },
  KPK: { sub: 'Khyber Pakhtunkhwa', icon: '🏔️' }, Balochistan: { sub: 'Balochistan Province', icon: '🏜️' },
};
const scopeKey = (s: LocationScope) => `${s.kind}:${s.province ?? ''}:${s.value}`;

const matchesScope = (l: MarketLocation, s: LocationScope) => s.kind === 'country' || (s.kind === 'province' ? l.province === s.value : s.kind === 'district' ? l.district === s.value && l.province === s.province : l.id === s.value);
function defaultFilter(p: Product): ProductFilter { return { priceTypes: [...PRICE_TYPES], byproductIds: p.byproducts.map(b => b.id), grades: [] }; }
export function withSharedPriceTypes(selection: CompareSelection, priceTypes: PriceType[]): CompareSelection {
  return { ...selection, filters: Object.fromEntries(Object.entries(selection.filters).map(([id, f]) => [id, { ...f, priceTypes: [...priceTypes] }])) };
}
function defaultSelection(): CompareSelection { return { productIds: [], filters: {}, scopes: [{ kind: 'country', value: 'Pakistan' }] }; }
export function resolveLocations(locations: MarketLocation[], scopes: LocationScope[]) { return locations.filter(l => scopes.some(s => matchesScope(l, s))); }
export function filterMarketRows(rows: MarketRow[], selection: CompareSelection, locations: MarketLocation[]) {
  const ids = new Set(resolveLocations(locations, selection.scopes).map(l => l.id));
  return rows.filter(r => { const f = selection.filters[r.productId]; return selection.productIds.includes(r.productId) && ids.has(r.locationId) && !!f && f.priceTypes.includes(r.priceType) && f.byproductIds.includes(r.byproductId) && (!f.grades.length || f.grades.includes(r.grade ?? 'Unspecified')) && matchesAttributes(r, f.attributes?.[r.byproductId]); });
}
const MISSING_ATTRIBUTE = '__missing__';
const NOT_REPORTED = 'Not reported';
function numericAttributeValue(raw: string | undefined) { if (raw === undefined || !raw.trim()) return null; const cleaned = raw.trim().replace(/\s*%$/, ''); return decimalParts(cleaned) ? cleaned : null; }
function compareDecimal(a: string, b: string) { const x = decimalParts(a)!, y = decimalParts(b)!; const scale = Math.max(x.scale, y.scale); const left = x.integer * 10n ** BigInt(scale - x.scale), right = y.integer * 10n ** BigInt(scale - y.scale); return left < right ? -1 : left > right ? 1 : 0; }
export function matchesAttributes(row: MarketRow, filters: Record<string, AttributeFilter> = {}) {
  return Object.entries(filters).every(([key, f]) => {
    const raw = key === '$grade' ? row.grade : row.quality?.[key];
    if (f.kind === 'category') return !f.values.length || f.values.includes(raw?.trim() || MISSING_ATTRIBUTE);
    const value = numericAttributeValue(raw); if (!f.min && !f.max) return true; if (value === null) return false;
    return (!f.min || compareDecimal(value, f.min) >= 0) && (!f.max || compareDecimal(value, f.max) <= 0);
  });
}
function cleanAttributes(input: ProductFilter['attributes'], p: Product): NonNullable<ProductFilter['attributes']> {
  const result: NonNullable<ProductFilter['attributes']> = {}; if (!input || typeof input !== 'object') return result;
  for (const b of p.byproducts) {
    const source = input[b.id]; if (!source || typeof source !== 'object') continue; const entries: [string, AttributeFilter][] = [];
    for (const [key, value] of Object.entries(source)) {
      if (!value || typeof value !== 'object') continue;
      if (value.kind === 'category' && Array.isArray(value.values)) entries.push([key, { kind: 'category', values: unique(value.values.filter(v => typeof v === 'string')) }]);
      if (value.kind === 'number') { const min = typeof value.min === 'string' && decimalParts(value.min) ? value.min : undefined, max = typeof value.max === 'string' && decimalParts(value.max) ? value.max : undefined; if (min || max) entries.push([key, { kind: 'number', min, max }]); }
    }
    result[b.id] = Object.fromEntries(entries);
  } return result;
}
export function attributeDefinitions(byproduct: Byproduct, rows: MarketRow[]): AttributeDefinition[] {
  const own = rows.filter(r => r.byproductId === byproduct.id); const defined = byproduct.attributes ?? [];
  const keys = unique([...defined.map(d => d.key), ...own.flatMap(r => Object.keys(r.quality ?? {}))]);
  return keys.map(key => defined.find(d => d.key === key) ?? { key, kind: /^moisture$/i.test(key) ? 'number' : 'category', unit: /^moisture$/i.test(key) ? '%' : undefined });
}

function cleanSelection(value: unknown, products: Product[], locations: MarketLocation[]): CompareSelection | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<CompareSelection>;
  if (!Array.isArray(v.productIds) || !v.filters || !Array.isArray(v.scopes)) return null;
  const productIds = unique(v.productIds.filter(id => products.some(p => p.id === id)));
  const filters: Record<string, ProductFilter> = {};
  for (const id of productIds) {
    const p = products.find(p => p.id === id)!; const f = v.filters[id];
    if (!f || !Array.isArray(f.priceTypes) || !Array.isArray(f.byproductIds) || !Array.isArray(f.grades)) return null;
    filters[id] = { priceTypes: unique(f.priceTypes.filter(t => PRICE_TYPES.includes(t))), byproductIds: unique(f.byproductIds.filter(b => p.byproducts.some(x => x.id === b))), grades: f.grades.filter(g => typeof g === 'string'), attributes: cleanAttributes(f.attributes, p) };
    if (!filters[id].priceTypes.length || !filters[id].byproductIds.length) filters[id] = defaultFilter(p);
  }
  const scopes = v.scopes.filter((s): s is LocationScope => !!s && typeof s === 'object' && ['country', 'province', 'district', 'mandi'].includes(s.kind) && typeof s.value === 'string' && locations.some(l => matchesScope(l, s)));
  const sharedTypes = PRICE_TYPES.filter(type => productIds.some(id => filters[id].priceTypes.includes(type)));
  return withSharedPriceTypes({ productIds, filters, scopes: scopes.length ? scopes : [{ kind: 'country', value: 'Pakistan' }] }, sharedTypes.length ? sharedTypes : [...PRICE_TYPES]);
}
function downloadFile(name: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null), id = useId();
  useEffect(() => { const el = ref.current; el?.showModal(); return () => el?.close(); }, []);
  return <dialog className="zm-modal" ref={ref} aria-labelledby={id} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="zm-modal-title"><h2 id={id}>{title}</h2><button className="zm-icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button></div>{children}
  </dialog>;
}
function Chip({ children, active, onClick, disabled = false }: { children: ReactNode; active?: boolean; onClick: () => void; disabled?: boolean }) { return <button className={`zm-chip ${active ? 'selected' : ''}`} aria-pressed={!!active} onClick={onClick} disabled={disabled}>{children}</button>; }

export interface ExactMean { value: string | null; count: number; numerator: string; denominator: string }
function decimalParts(value: number | string | null): { integer: bigint; scale: number } | null {
  if (value === null || (typeof value === 'number' && !Number.isFinite(value))) return null;
  const m = String(value).trim().match(/^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i); if (!m) return null;
  const exp = Number(m[4] ?? 0); if (!Number.isSafeInteger(exp) || Math.abs(exp) > 1000) return null;
  const fraction = m[3] ?? ''; let scale = fraction.length - exp; let integer = BigInt(m[2] + fraction) * (m[1] === '-' ? -1n : 1n);
  if (scale < 0) { integer *= 10n ** BigInt(-scale); scale = 0; } return { integer, scale };
}
/** Decimal arithmetic: no float summing; round once, half away from zero, at display. */
export function preciseMean(values: (number | string | null)[], digits = 2): ExactMean {
  if (!Number.isInteger(digits) || digits < 0 || digits > 10) throw new Error('digits must be 0–10');
  const parts = values.map(decimalParts).filter((p): p is NonNullable<typeof p> => p !== null);
  if (!parts.length) return { value: null, count: 0, numerator: '0', denominator: '0' };
  const scale = parts.reduce((max, p) => Math.max(max, p.scale), 0); const sum = parts.reduce((n, p) => n + p.integer * 10n ** BigInt(scale - p.scale), 0n);
  const denominator = BigInt(parts.length) * 10n ** BigInt(scale), factor = 10n ** BigInt(digits), absolute = sum < 0n ? -sum : sum;
  let result = absolute * factor / denominator; if ((absolute * factor % denominator) * 2n >= denominator) result++;
  const str = result.toString().padStart(digits + 1, '0'); return { value: (sum < 0n && result !== 0n ? '-' : '') + (digits ? str.slice(0, -digits) + '.' + str.slice(-digits) : str), count: parts.length, numerator: sum.toString(), denominator: denominator.toString() };
}
/** Column colours per selected product (app palette). */
const PRODUCT_TONES = ['#087F63', '#B9822E', '#2F6DB5', '#C94A43', '#7A4FB5', '#0B7F70'];
/** Pane colours per location. */
const LOCATION_TONES = ['#0E645C', '#2F6DB5', '#B9822E', '#7A4FB5', '#C94A43', '#0B7F70'];
const meanText = (m: ExactMean) => m.value === null ? '—' : m.value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
function priceText(m: ExactMean) { const text = meanText(m); const dot = text.indexOf('.'); return dot < 0 ? text : <>{text.slice(0, dot)}<small className="zm-decimals">{text.slice(dot)}</small></>; }
const validNonnegative = (v: number | string | null) => { const p = decimalParts(v); return p && p.integer >= 0n ? v : null; };
const decimalEqual = (a: number | string | null, b: number | string | null) => { const x = decimalParts(a), y = decimalParts(b); if (!x || !y) return x === y; const scale = Math.max(x.scale, y.scale); return x.integer * 10n ** BigInt(scale - x.scale) === y.integer * 10n ** BigInt(scale - y.scale); };
const pakistanDayCache = new Map<string, string>();
/** Calendar day in Pakistan time. Cached: formatting with Intl per row was the report's main stall. */
export const pakistanDay = (timestamp: string) => {
  let day = pakistanDayCache.get(timestamp);
  if (day === undefined) { day = Number.isFinite(Date.parse(timestamp)) ? new Date(timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }) : ''; pakistanDayCache.set(timestamp, day); }
  return day;
};
function categoricalQuality(r: MarketRow, definitions: AttributeDefinition[] = []): [string, string][] { return unique([...Object.keys(r.quality ?? {}), ...definitions.filter(d => d.kind === 'category').map(d => d.key)]).sort((a, b) => a.localeCompare(b)).filter(key => (definitions.find(d => d.key === key)?.kind ?? (/^moisture$/i.test(key) ? 'number' : 'category')) !== 'number').map(key => [key, r.quality?.[key]?.trim() || 'Not reported']); }
export const variantSignature = (r: MarketRow, definitions: AttributeDefinition[] = []) => JSON.stringify([r.productId, r.byproductId, r.priceType, r.unit.trim(), r.grade ?? '', categoricalQuality(r, definitions)]);
export function deduplicateObservations(rows: MarketRow[]) {
  const map = new Map<string, MarketRow>(), conflicts = new Set<string>(); let duplicates = 0;
  const signature = (r: MarketRow) => JSON.stringify({ ...r, quality: Object.fromEntries(Object.entries(r.quality ?? {}).sort(([a], [b]) => a.localeCompare(b))) });
  for (const row of rows) { const old = map.get(row.id); if (!old) map.set(row.id, row); else if (signature(old) === signature(row)) duplicates++; else conflicts.add(row.id); }
  return { rows: [...map.values()].filter(r => !conflicts.has(r.id)), duplicates, conflictingIds: conflicts.size };
}
export interface AggregateResult {
  min: ExactMean; max: ExactMean; arrivals: ExactMean; count: number; mandis: number; priceLocations: number; minLocations: number; maxLocations: number; oldest: string; latest: string;
  rejectedPrices: number; arrivalDuplicates: number; arrivalConflicts: number;
  trends: { label: string; mean: ExactMean }[]; quality: string[];
}
/** Call only with a single variantSignature. Input rows are observations, never averages. */
export function aggregateObservations(input: MarketRow[], definitions: AttributeDefinition[] = []): AggregateResult {
  const rows = deduplicateObservations(input).rows;
  if (new Set(rows.map(r => variantSignature(r, definitions))).size > 1) throw new Error('Cannot aggregate incompatible byproduct, channel, grade, specification or unit.');
  let rejectedPrices = 0;
  const priceRows = rows.map(r => {
    const min = validNonnegative(r.minPrice), max = validNonnegative(r.maxPrice); const a = decimalParts(min), b = decimalParts(max); const scale = Math.max(a?.scale ?? 0, b?.scale ?? 0);
    const invalidRange = !!a && !!b && a.integer * 10n ** BigInt(scale - a.scale) > b.integer * 10n ** BigInt(scale - b.scale);
    if (invalidRange || (r.minPrice !== null && min === null) || (r.maxPrice !== null && max === null)) rejectedPrices++;
    return { min: invalidRange ? null : min, max: invalidRange ? null : max };
  });
  const arrivalMap = new Map<string, number | string | null>(), arrivalConflicts = new Set<string>(); let arrivalDuplicates = 0;
  for (const r of rows) {
    const key = r.arrivalObservationId ?? `row:${r.id}`; const value = validNonnegative(r.arrivalMt);
    if (!arrivalMap.has(key)) arrivalMap.set(key, value); else { arrivalDuplicates++; if (!decimalEqual(arrivalMap.get(key) ?? null, value)) arrivalConflicts.add(key); }
  }
  const trendGroups = new Map<string, (number | null)[]>(); for (const r of rows) { const key = `${r.trendPeriod} · ${r.trendBasis}`; const values = trendGroups.get(key) ?? []; values.push(r.trendPct); trendGroups.set(key, values); }
  const qualityKeys = unique(rows.flatMap(r => Object.keys(r.quality ?? {}))); const quality = qualityKeys.map(key => {
    const values = rows.map(r => r.quality?.[key]).filter((v): v is string => v !== undefined); const def = definitions.find(d => d.key === key); const numeric = def?.kind === 'number' || (!def && /^moisture$/i.test(key));
    if (numeric) { const mean = preciseMean(values.map(v => numericAttributeValue(v))); return `${def?.label ?? key}: mean ${meanText(mean)}${def?.unit ?? (/^moisture$/i.test(key) ? '%' : '')} · n=${mean.count}`; }
    return `${def?.label ?? key}: ${unique(values).join(', ')}`;
  });
  const dates = rows.filter(r => Number.isFinite(Date.parse(r.updatedAt))).map(r => r.updatedAt).sort((a, b) => Date.parse(a) - Date.parse(b));
  return { min: preciseMean(priceRows.map(r => r.min)), max: preciseMean(priceRows.map(r => r.max)), arrivals: preciseMean([...arrivalMap].filter(([id]) => !arrivalConflicts.has(id)).map(([, v]) => v)), count: rows.length, mandis: unique(rows.map(r => r.locationId)).length, minLocations: unique(rows.filter((_, i) => priceRows[i].min !== null).map(r => r.locationId)).length, maxLocations: unique(rows.filter((_, i) => priceRows[i].max !== null).map(r => r.locationId)).length, priceLocations: unique(rows.filter((_, i) => priceRows[i].min !== null || priceRows[i].max !== null).map(r => r.locationId)).length, oldest: dates[0] ?? '', latest: dates.at(-1) ?? '', rejectedPrices, arrivalDuplicates, arrivalConflicts: arrivalConflicts.size, trends: [...trendGroups].map(([label, values]) => ({ label, mean: preciseMean(values) })), quality };
}
export function resolveComparisonScopes(scopes: LocationScope[], locations: MarketLocation[]): LocationScope[] {
  const selected = unique(scopes.map(scopeKey)).map(key => scopes.find(s => scopeKey(s) === key)!);
  if (selected.length !== 1) return selected;
  if (selected[0].kind === 'country') return unique(locations.map(l => l.province)).map(value => ({ kind: 'province', value }));

  return selected;
}

interface ReportHeading { id: string; label: string; shortLabel: string }
function HeadingNavigator({ headings, activeId, onSelect, kind }: { headings: ReportHeading[]; activeId: string; onSelect: (id: string) => void; kind: string }) {
  const current = Math.max(0, headings.findIndex(h => h.id === activeId));
  const [candidate, setCandidate] = useState(-1), [previewTop, setPreviewTop] = useState(0), [holding, setHolding] = useState(false);
  const rail = useRef<HTMLElement>(null), marks = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null), gesture = useRef(false), suppress = useRef(false), selected = useRef(-1), point = useRef({ x: 0, y: 0 }), start = useRef({ x: 0, y: 0 });
  const tooltipId = useId();
  const clearTimer = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  const choose = (i: number) => { selected.current = i; setCandidate(i); const button = marks.current?.querySelector<HTMLElement>(`[data-heading="${i}"]`); const r = rail.current?.getBoundingClientRect(); if (button && r) setPreviewTop(Math.max(12, Math.min(r.height - 12, button.getBoundingClientRect().top - r.top + 12))); };
  const close = () => { clearTimer(); gesture.current = false; setHolding(false); choose(-1); };
  const jump = (i: number) => { close(); if (headings[i]) onSelect(headings[i].id); };
  useEffect(() => () => clearTimer(), []);
  useEffect(() => { const button = marks.current?.querySelector<HTMLElement>(`[data-heading="${current}"]`); if (button && marks.current) marks.current.scrollTop = button.offsetTop - marks.current.clientHeight / 2 + 12; }, [current]);
  useEffect(() => { const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); }; window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape); }, []);
  const hit = () => { const r = marks.current?.getBoundingClientRect(); if (!r || point.current.x < r.left - 28 || point.current.x > r.right + 20 || point.current.y < r.top || point.current.y > r.bottom) { choose(-1); return; } let index = -1; marks.current?.querySelectorAll<HTMLElement>('[data-heading]').forEach(button => { const b = button.getBoundingClientRect(); if (point.current.y >= b.top && point.current.y < b.bottom) index = Number(button.dataset.heading); }); choose(index); };
  useEffect(() => { if (!holding) return; let frame = 0; const tick = () => { const list = marks.current, r = list?.getBoundingClientRect(); if (list && r && point.current.x >= r.left - 28 && point.current.x <= r.right + 20) { if (point.current.y >= r.top && point.current.y < r.top + 20) list.scrollTop -= 4; else if (point.current.y <= r.bottom && point.current.y > r.bottom - 20) list.scrollTop += 4; } hit(); frame = requestAnimationFrame(tick); }; frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame); }, [holding]);
  function down(e: ReactPointerEvent<HTMLButtonElement>, i: number) { if (e.button !== 0) return; clearTimer(); suppress.current = false; point.current = { x: e.clientX, y: e.clientY }; start.current = point.current; e.currentTarget.setPointerCapture(e.pointerId); timer.current = setTimeout(() => { gesture.current = true; suppress.current = true; setHolding(true); choose(i); }, 350); }
  function move(e: ReactPointerEvent<HTMLButtonElement>) { point.current = { x: e.clientX, y: e.clientY }; if (gesture.current) { e.preventDefault(); hit(); } else if (timer.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 12) { clearTimer(); suppress.current = true; } }
  function up(e: ReactPointerEvent<HTMLButtonElement>) { clearTimer(); if (gesture.current) { hit(); const index = selected.current; index >= 0 ? jump(index) : close(); } if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }
  return <aside ref={rail} className="zm-heading-navigator" aria-label={`${kind} navigator`} onPointerLeave={e => { if (e.pointerType === 'mouse' && !gesture.current) choose(-1); }}>
    <div className="zm-heading-marks" ref={marks} role="navigation" aria-label={`Jump to ${kind.toLowerCase()}. Hover or hold and slide.`}>{headings.map((h, i) => <button key={h.id} data-heading={i} className={`zm-heading-mark ${candidate === i ? 'highlighted' : ''}`} aria-label={`Show ${h.label}`} aria-current={current === i ? 'true' : undefined} aria-describedby={candidate === i ? tooltipId : undefined}
      onPointerEnter={e => { if (e.pointerType === 'mouse' && !gesture.current) choose(i); }} onFocus={() => choose(i)} onBlur={() => { if (!gesture.current) choose(-1); }}
      onPointerDown={e => down(e, i)} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { suppress.current = true; close(); }} onContextMenu={e => e.preventDefault()}
      onClick={() => { if (suppress.current) { suppress.current = false; return; } jump(i); }}
      onKeyDown={(e: ReactKeyboardEvent) => { let next = i; if (e.key === 'ArrowDown') next = Math.min(headings.length - 1, i + 1); else if (e.key === 'ArrowUp') next = Math.max(0, i - 1); else if (e.key === 'Home') next = 0; else if (e.key === 'End') next = headings.length - 1; else return; e.preventDefault(); const button = marks.current?.querySelector<HTMLButtonElement>(`[data-heading="${next}"]`); button?.scrollIntoView({ block: 'nearest' }); button?.focus({ preventScroll: true }); }}><span aria-hidden="true" /><strong>{h.label}</strong></button>)}</div>
    {candidate >= 0 && headings[candidate] && <div id={tooltipId} className="zm-heading-preview" role="tooltip" style={{ top: previewTop }}><strong>{headings[candidate].shortLabel}</strong><small>{holding ? 'Release to jump · move away to cancel' : `${kind} · click or hold and slide`}</small></div>}
  </aside>;
}

type ReportFilterMode = 'byproduct' | 'price' | 'attribute';
function FilterChoice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" className={`zm-filter-option ${active ? 'selected' : ''}`} role="checkbox" aria-checked={active} onClick={onClick}>
    {active && <motion.span layout className="zm-filter-option-bar" />}<span>{children}</span><span className="zm-option-check" aria-hidden="true">{active ? <Icon name="check" size={14} /> : null}</span>
  </button>;
}
function ReportFilterFields({ mode, selection, products, rows, onApply }: { mode: ReportFilterMode; selection: CompareSelection; products: Product[]; rows: MarketRow[]; onApply: (s: CompareSelection) => void }) {
  const [draft, setDraft] = useState<CompareSelection>(() => JSON.parse(JSON.stringify(selection))), [error, setError] = useState('');
  const change = (id: string, next: ProductFilter) => { setDraft(prev => ({ ...prev, filters: { ...prev.filters, [id]: next } })); setError(''); };
  function choose(p: Product, key: 'priceTypes' | 'byproductIds', value: string, all: string[]) { const f = draft.filters[p.id], current = f[key] as string[]; const next = all.every(v => current.includes(v)) ? [value] : current.includes(value) ? current.filter(v => v !== value) : [...current, value]; if (!next.length) { setError('Keep at least one option for each product.'); return; } change(p.id, { ...f, [key]: next }); }
  function attribute(p: Product, b: Byproduct, key: string, next: AttributeFilter | undefined) { const f = draft.filters[p.id], byproduct = { ...f.attributes?.[b.id] }; if (next) byproduct[key] = next; else delete byproduct[key]; change(p.id, { ...f, grades: key === '$grade' ? [] : f.grades, attributes: { ...f.attributes, [b.id]: byproduct } }); }
  function apply() {
    for (const p of products) for (const b of p.byproducts.filter(b => draft.filters[p.id].byproductIds.includes(b.id))) for (const f of Object.values(draft.filters[p.id].attributes?.[b.id] ?? {})) {
      if (f.kind !== 'number') continue;
      if ((f.min && !decimalParts(f.min)) || (f.max && !decimalParts(f.max))) { setError('Enter valid decimal bounds, without units.'); return; }
      if (f.min && f.max && compareDecimal(f.min, f.max) > 0) { setError('Minimum cannot be greater than maximum.'); return; }
    }
    onApply(draft);
  }
  return <div className="zm-filter-fields"><p className="zm-subtle">{mode === 'attribute' ? 'Quality filters apply to each byproduct.' : mode === 'price' ? 'Applies to every product in this comparison.' : 'Choose the byproducts to show.'}</p>
    {mode === 'price' ? <fieldset className="zm-filter-group" aria-label="Price types"><legend className="zm-sr-only">Price types</legend><div className="zm-option-list"><FilterChoice active={draft.filters[products[0].id].priceTypes.length === PRICE_TYPES.length} onClick={() => setDraft(prev => withSharedPriceTypes(prev, [...PRICE_TYPES]))}>All price types</FilterChoice>{PRICE_TYPES.map(type => <FilterChoice key={type} active={draft.filters[products[0].id].priceTypes.includes(type)} onClick={() => { const current = draft.filters[products[0].id].priceTypes; const next = current.length === PRICE_TYPES.length ? [type] : current.includes(type) ? current.filter(t => t !== type) : [...current, type]; if (!next.length) { setError("Keep at least one price type."); return; } setError(""); setDraft(prev => withSharedPriceTypes(prev, next)); }}>{type}</FilterChoice>)}</div></fieldset> : products.map(p => {
      const f = draft.filters[p.id]; return <section className="zm-dialog-product" key={p.id} aria-label={`${p.name} report filters`}><h3>{p.name}</h3>
        {mode === 'byproduct' ? <fieldset className="zm-filter-group"><legend>Byproducts</legend><div className="zm-option-list"><FilterChoice active={f.byproductIds.length === p.byproducts.length} onClick={() => change(p.id, { ...f, byproductIds: p.byproducts.map(b => b.id) })}>All</FilterChoice>{p.byproducts.map(option => <FilterChoice key={option.id} active={f.byproductIds.includes(option.id)} onClick={() => choose(p, 'byproductIds', option.id, p.byproducts.map(b => b.id))}>{option.name}</FilterChoice>)}</div></fieldset> :
          p.byproducts.filter(b => f.byproductIds.includes(b.id)).map(b => {
            const own = rows.filter(r => r.productId === p.id && r.byproductId === b.id); const definitions = attributeDefinitions(b, own); if (own.some(r => r.grade)) definitions.unshift({ key: '$grade', label: 'Grade', kind: 'category' });
            return <section key={b.id} className="zm-attribute-section" aria-label={`${p.name} ${b.name} attributes`}><h4>{b.name}</h4>{!definitions.length && <p className="zm-subtle">No special attributes reported for this byproduct.</p>}{definitions.map(d => { const value = f.attributes?.[b.id]?.[d.key] ?? (d.key === '$grade' && f.grades.length ? { kind: 'category' as const, values: f.grades } : undefined), label = d.label ?? d.key; return <fieldset key={d.key} className="zm-filter-group" aria-label={`${label}${d.unit ? ` (${d.unit})` : ""}`}><legend>{label}{d.unit ? ` (${d.unit})` : ''}</legend>{d.kind === 'category' ? <div className="zm-option-list"><FilterChoice active={!value || value.kind === 'category' && !value.values.length} onClick={() => attribute(p, b, d.key, undefined)}>All</FilterChoice>{unique([...(d.options ?? []), ...own.map(r => (d.key === '$grade' ? r.grade : r.quality?.[d.key])?.trim() || MISSING_ATTRIBUTE)]).map(option => <FilterChoice key={option} active={value?.kind === 'category' && value.values.includes(option)} onClick={() => { const values = value?.kind === 'category' ? value.values : []; attribute(p, b, d.key, { kind: 'category', values: values.includes(option) ? values.filter(v => v !== option) : [...values, option] }); }}>{option === MISSING_ATTRIBUTE ? 'Not reported' : option}</FilterChoice>)}</div> : <div className="zm-range-fields"><label>Minimum<input inputMode="decimal" aria-label={`${label} minimum${d.unit ? ' (' + d.unit + ')' : ''}`} value={value?.kind === 'number' ? value.min ?? '' : ''} placeholder="Any" onChange={e => attribute(p, b, d.key, { kind: 'number', min: e.target.value, max: value?.kind === 'number' ? value.max : undefined })} /></label><span>to</span><label>Maximum<input inputMode="decimal" aria-label={`${label} maximum${d.unit ? ' (' + d.unit + ')' : ''}`} value={value?.kind === 'number' ? value.max ?? '' : ''} placeholder="Any" onChange={e => attribute(p, b, d.key, { kind: 'number', min: value?.kind === 'number' ? value.min : undefined, max: e.target.value })} /></label></div>}</fieldset>; })}
            </section>;
          })}
      </section>;
    })}
    {error && <p role="alert" className="zm-error">{error}</p>}<div className="zm-filter-actions"><button className="zm-chip" onClick={() => { setError(''); setDraft(prev => ({ ...prev, filters: Object.fromEntries(Object.entries(prev.filters).map(([id, f]) => [id, mode === 'attribute' ? { ...f, attributes: {}, grades: [] } : mode === 'price' ? { ...f, priceTypes: [...PRICE_TYPES] } : { ...f, byproductIds: products.find(p => p.id === id)?.byproducts.map(b => b.id) ?? f.byproductIds }])) })); }}>Reset {mode === 'attribute' ? 'attributes' : mode === 'price' ? 'price types' : 'byproducts'}</button><button className="zm-primary" onClick={apply}>Apply filters</button></div>
  </div>;
}

export default function ZaraiMandiCompare(props: ZaraiMandiCompareProps) {
  const { categories, locations, rows, onProductIdsChange, rowsLoading = false, rowsError, dataLabel, ownedCategoryIds, accessNote, renderLocationPicker, onDecisionRequest, onExit, storageKey = 'zarai-mandi-compare-v1' } = props;
  const availableCategories = useMemo(() => categories.filter(c => !ownedCategoryIds || ownedCategoryIds.includes(c.id)), [categories, ownedCategoryIds]);
  const products = useMemo(() => availableCategories.flatMap(c => c.products), [availableCategories]);
  const [selection, setSelection] = useState<CompareSelection>(defaultSelection);
  const [reportDate, setReportDate] = useState('');
  const [viewKey, setViewKey] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const sync = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync); return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  async function landscape() {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
    if (document.fullscreenElement) { orientation?.unlock?.(); await document.exitFullscreen().catch(() => { }); return; }
    try {
      if (!document.documentElement.requestFullscreen) throw new Error('Fullscreen unavailable');
      await document.documentElement.requestFullscreen();
      if (orientation?.lock) await orientation.lock('landscape');
      else if (innerHeight > innerWidth) setNotice('Turn your phone sideways for a wider comparison.');
    } catch { setNotice('Turn your phone sideways for a wider comparison. Your browser controls screen rotation.'); }
  }
  const [reportFilter, setReportFilter] = useState<ReportFilterMode | null>(null);
  const reportId = useId().replace(/:/g, '');
  const [stage, setStage] = useState<'select' | 'refine' | 'report'>('select');
  // The report reads best in landscape: prompt to rotate; inside the desktop
  // phone mockup the mockup itself rotates, and turns back when leaving.
  const [isLandscape, setIsLandscape] = useState(() => window.matchMedia('(orientation: landscape)').matches);
  const [rotateDismissed, setRotateDismissed] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(orientation: landscape)'); const sync = () => setIsLandscape(query.matches);
    query.addEventListener('change', sync); return () => query.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (stage !== 'report') { requestDeviceOrientation('portrait'); setRotateDismissed(false); return; }
    if (rotateDismissed || !inDevicePreview()) return;
    const id = setTimeout(() => requestDeviceOrientation('landscape'), 1400); return () => clearTimeout(id);
  }, [stage, rotateDismissed]);
  useEffect(() => () => requestDeviceOrientation('portrait'), []);
  // Lets the app shell hide its bottom nav while this report is shown in landscape.
  useEffect(() => {
    if (stage !== 'report') return;
    document.documentElement.dataset.zmCompareReport = '1';
    return () => { delete document.documentElement.dataset.zmCompareReport; };
  }, [stage]);
  const rotated = inDevicePreview() ? isLandscape : fullscreen;
  function toggleRotation() {
    if (!inDevicePreview()) { void landscape(); return; }
    if (isLandscape) { setRotateDismissed(true); requestDeviceOrientation('portrait'); } else requestDeviceOrientation('landscape');
  }
  const [query, setQuery] = useState('');
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [specialChoice, setSpecialChoice] = useState<Record<string, string>>({});
  const [pdfBusy, setPdfBusy] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [notice, setNotice] = useState(''), [saved, setSaved] = useState<CompareSelection | null>(null);
  const [sending, setSending] = useState(false), [decisionError, setDecisionError] = useState('');
  const root = useRef<HTMLElement>(null), heading = useRef<HTMLHeadingElement>(null);
  // The report header is sticky; the matrix's column header pins just below it.
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  useEffect(() => {
    const el = headerRef.current; if (!el) return;
    const observer = new ResizeObserver(() => setHeaderHeight(el.offsetHeight)); observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const overview = useRef<HTMLElement>(null), summary = useRef<HTMLElement>(null);
  const lastToggle = useRef<HTMLButtonElement | null>(null);
  const effective = useMemo(() => cleanSelection(selection, products, locations) ?? defaultSelection(), [selection, products, locations]);
  const productIdsKey = effective.productIds.join('|');
  useEffect(() => { onProductIdsChange?.(effective.productIds); }, [productIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const selectedProducts = useMemo(() => products.filter(p => effective.productIds.includes(p.id)), [products, effective.productIds]);
  const selectedLocations = useMemo(() => resolveLocations(locations, effective.scopes), [locations, effective.scopes]);
  const eligibleRows = useMemo(() => rows.filter(r => { const b = products.find(p => p.id === r.productId)?.byproducts.find(b => b.id === r.byproductId); return !!b && (b.attributes ?? []).every(d => !d.required || (d.kind === 'number' ? numericAttributeValue(r.quality?.[d.key]) !== null : !!r.quality?.[d.key]?.trim())); }), [rows, products]);
  const matchingRows = useMemo(() => filterMarketRows(eligibleRows, effective, locations), [eligibleRows, effective, locations]);
  const availableDays = useMemo(() => unique(eligibleRows.filter(r => effective.productIds.includes(r.productId) && selectedLocations.some(l => l.id === r.locationId)).map(r => pakistanDay(r.updatedAt)).filter(Boolean)).sort().reverse(), [eligibleRows, effective.productIds, selectedLocations]);
  const activeDay = reportDate || availableDays[0] || '';
  const audit = useMemo(() => deduplicateObservations(matchingRows.filter(r => pakistanDay(r.updatedAt) === activeDay && activeDay !== '')), [matchingRows, activeDay]);
  const filteredRows = audit.rows;
  const comparisonScopes = useMemo(() => resolveComparisonScopes(effective.scopes, locations), [effective.scopes, locations]);
  const provinces = unique(locations.map(l => l.province));
  const selectedProvinces = unique(selectedLocations.map(l => l.province));
  const reportingLocations = unique(filteredRows.map(r => r.locationId));
  const typeList = PRICE_TYPES.filter(t => selectedProducts.some(p => effective.filters[p.id]?.priceTypes.includes(t)));
  const byproductCount = selectedProducts.reduce((n, p) => n + (effective.filters[p.id]?.byproductIds.length ?? 0), 0);
  const scopeLabel = (s: LocationScope) => s.kind === 'country' ? 'All Pakistan' : s.kind === 'mandi' ? locations.find(l => l.id === s.value)?.name ?? s.value : s.kind === 'district' ? `${s.value} District, ${s.province}` : s.value;
  const selectionLabel = effective.scopes.map(scopeLabel).join(', ');
  useEffect(() => { if (!storageKey) { setSaved(null); return; } try { const raw = localStorage.getItem(storageKey); setSaved(raw ? cleanSelection(JSON.parse(raw), products, locations) : null); } catch { setSaved(null); } }, [storageKey, products, locations]);
  useEffect(() => { root.current?.scrollTo({ top: 0 }); root.current?.querySelector('.zm-report-phone')?.scrollTo({ top: 0 }); heading.current?.focus({ preventScroll: true }); }, [stage]);
  useEffect(() => { if (!notice) return; const id = setTimeout(() => setNotice(''), 5000); return () => clearTimeout(id); }, [notice]);
  const persist = (s: CompareSelection) => { if (!storageKey) { setNotice('Saving is disabled for this session.'); return; } try { localStorage.setItem(storageKey, JSON.stringify(s)); setSaved(s); setNotice('Comparison saved on this device.'); } catch { setNotice('Could not save on this device. You can still compare.'); } };
  const toggleProduct = (p: Product) => setSelection(prev => prev.productIds.includes(p.id) ? { ...prev, productIds: prev.productIds.filter(id => id !== p.id) } : { ...prev, productIds: [...prev.productIds, p.id], filters: { ...prev.filters, [p.id]: { ...(prev.filters[p.id] ?? defaultFilter(p)), priceTypes: prev.filters[prev.productIds[0]]?.priceTypes ?? [...PRICE_TYPES] } } });
  const updateFilter = (id: string, key: 'priceTypes' | 'byproductIds' | 'grades', values: string[]) => setSelection(prev => ({ ...prev, filters: { ...prev.filters, [id]: { ...prev.filters[id], [key]: values } } }));
  const toggleFilter = (p: Product, key: 'priceTypes' | 'byproductIds' | 'grades', value: string) => {
    const current = effective.filters[p.id][key] as string[];
    const allOptions = key === 'priceTypes' ? PRICE_TYPES : key === 'byproductIds' ? p.byproducts.map(b => b.id) : [];
    const wasAll = key !== 'grades' && allOptions.every(option => current.includes(option));
    const next = wasAll ? [value] : current.includes(value) ? current.filter(x => x !== value) : [...current, value];
    if (key !== 'grades' && !next.length) { setNotice('Keep at least one option selected.'); return; }
    updateFilter(p.id, key, next);
  };
  /** Maps the app's location sheet selection onto compare scopes (mandis matched by name). */
  function applyPickedLocations(picked: PickedLocation[]) {
    const norm = (name: string) => name.toLowerCase().replace(/\s*mandi$/i, '').trim();
    const scopes: LocationScope[] = []; let skipped = 0;
    if (!picked.some(l => l.kind === 'pakistan')) for (const l of picked) {
      if (l.kind === 'province') { if (provinces.includes(l.label)) scopes.push({ kind: 'province', value: l.label }); else skipped++; }
      else if (l.kind === 'district') { const loc = locations.find(x => x.district.toLowerCase() === l.label.toLowerCase()); if (loc) scopes.push({ kind: 'district', value: loc.district, province: loc.province }); else skipped++; }
      else if (l.kind === 'mandi') { const loc = locations.find(x => norm(x.name) === norm(l.label)); if (loc) scopes.push({ kind: 'mandi', value: loc.id, province: loc.province }); else skipped++; }
    }
    setSelection(prev => ({ ...prev, scopes: scopes.length ? unique(scopes.map(scopeKey)).map(k => scopes.find(x => scopeKey(x) === k)!) : [{ kind: 'country', value: 'Pakistan' }] }));
    if (skipped) setNotice(`${skipped} location${skipped === 1 ? ' has' : 's have'} no market reports this period and ${skipped === 1 ? 'was' : 'were'} skipped.`);
  }
  const openReport = () => { if (!selectedProducts.length) return; setSelection(effective); setStage('report'); };
  const jump = (ref: { current: HTMLElement | null }) => { ref.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); ref.current?.focus({ preventScroll: true }); };
  const removeProduct = (id: string) => { const next = { ...effective, productIds: effective.productIds.filter(x => x !== id) }; setSelection(next); if (!next.productIds.length) setStage('select'); };
  const reset = () => { setSelection(defaultSelection()); setStage('select'); setQuery(''); setReportDate(''); setViewKey(''); };
  async function submitDecision(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setDecisionError(''); const data = new FormData(e.currentTarget);
    const request: DecisionRequest = { name: String(data.get('name') ?? '').trim(), phone: String(data.get('phone') ?? '').trim(), note: String(data.get('note') ?? '').trim(), selection: effective, reportDate: activeDay, createdAt: new Date().toISOString() };
    if (!request.name || request.phone.replace(/\D/g, '').length < 7) { setDecisionError('Enter your name and a valid contact number.'); return; }
    if (!onDecisionRequest) { downloadFile('Zarai-Mandi-Decision-Request.json', JSON.stringify(request, null, 2), 'application/json'); setShowDecision(false); setNotice('Request downloaded. It has not been sent to a team.'); return; }
    setSending(true); try { await onDecisionRequest(request); setShowDecision(false); setNotice('Your request has been sent to the market team.'); } catch { setDecisionError('The request could not be sent. Please try again.'); } finally { setSending(false); }
  }
  function filterGroup(p: Product, label: string, key: 'priceTypes' | 'byproductIds' | 'grades', options: { id: string; label: string }[]) {
    const values = effective.filters[p.id][key] as string[], all = key === 'grades' ? values.length === 0 : options.every(o => values.includes(o.id));
    return <fieldset className="zm-filter-group"><legend>{label}</legend><div className="zm-chips">
      <Chip active={all} onClick={() => updateFilter(p.id, key, key === 'grades' ? [] : options.map(o => o.id))}>All</Chip>
      {options.map(o => <Chip key={o.id} active={!all && values.includes(o.id)} onClick={() => toggleFilter(p, key, o.id)}>{o.label}</Chip>)}
    </div></fieldset>;
  }
  const scopeColumns = useMemo(() => comparisonScopes.map(scope => ({ scope, key: scopeKey(scope), label: scopeLabel(scope), ids: new Set(locations.filter(l => matchesScope(l, scope)).map(l => l.id)) })), [comparisonScopes, locations]);
  const hasOverlap = scopeColumns.some((c, i) => scopeColumns.slice(i + 1).some(other => [...c.ids].some(id => other.ids.has(id))));
  // One column per byproduct. Only its special attribute separates observations:
  // the chosen value (default: the one with most reports) applies everywhere.
  const variants = useMemo(() => selectedProducts.flatMap(p => p.byproducts.filter(b => effective.filters[p.id].byproductIds.includes(b.id)).map(b => {
    const rs = filteredRows.filter(r => r.productId === p.id && r.byproductId === b.id);
    const sp = b.special;
    const valueOf = (r: MarketRow) => (sp ? r.quality?.[sp.key]?.trim() : '') || NOT_REPORTED;
    let options: { value: string; count: number }[] = [], chosen = '', records = rs;
    if (sp?.kind === 'category') {
      const counts = new Map<string, number>(); for (const r of rs) counts.set(valueOf(r), (counts.get(valueOf(r)) ?? 0) + 1);
      options = [...counts].map(([value, count]) => ({ value, count })).sort((a, b) => Number(a.value === NOT_REPORTED) - Number(b.value === NOT_REPORTED) || b.count - a.count);
      chosen = options.some(o => o.value === specialChoice[b.id]) ? specialChoice[b.id] : options[0]?.value ?? NOT_REPORTED;
      records = rs.filter(r => valueOf(r) === chosen);
    }
    const observations = records.map(r => ({ ...r, grade: undefined, quality: !sp ? {} : sp.kind === 'category' ? { [sp.key]: chosen } : r.quality?.[sp.key] ? { [sp.key]: r.quality[sp.key] } : {} }));
    let specialValue = chosen;
    if (sp?.kind === 'number') { const mean = preciseMean(rs.map(r => numericAttributeValue(r.quality?.[sp.key])), 1); specialValue = mean.value === null ? NOT_REPORTED : `avg ${mean.value}${sp.unit ?? ''}`; }
    return {
      key: `${p.id}|${b.id}`, product: p, byproduct: b, unit: rs[0]?.unit ?? '40 kg',
      special: sp ? { label: sp.label, value: specialValue, options } : undefined, observations,
      channels: effective.filters[p.id].priceTypes.map(priceType => ({ priceType, cells: scopeColumns.map(col => ({ ...col, result: aggregateObservations(observations.filter(r => r.priceType === priceType && col.ids.has(r.locationId)), []) })) })),
    };
  })), [selectedProducts, effective.filters, filteredRows, scopeColumns, specialChoice]);
  // The only filter on the refine screen and the report: price type (byproducts are
  // picked per product; quality is each byproduct's special attribute in the sheet).
  function filterControls() {
    const summary = typeList.length === PRICE_TYPES.length ? 'All' : typeList.length === 1 ? typeList[0] : `${typeList.length} selected`;
    return <div className="zm-report-filters zm-price-filter" role="group" aria-label="Report filters">
      <SmoothDropdown label="Price type" summary={summary} ariaLabel="Filter price types" icon={<Tag size={16} />} className="zm-filter-price" open={reportFilter === 'price'} onOpenChange={open => setReportFilter(open ? 'price' : null)}>
        {reportFilter === 'price' && <ReportFilterFields mode="price" selection={effective} products={selectedProducts} rows={eligibleRows} onApply={next => { setSelection(next); setReportFilter(null); setNotice('Price types applied.'); }} />}
      </SmoothDropdown>
    </div>;
  }
  async function downloadPdf() {
    setPdfBusy(true);
    try {
      const { downloadComparisonPdf } = await import('./report-pdf');
      const single = selectedProducts.length === 1;
      const boards: PdfBoard[] = single
        ? [{ id: 'all', title: selectedProducts[0].name, panes: reportGroups.map(g => ({ ...g.panes[0], title: g.title })) }]
        : reportGroups.map(g => ({ id: g.id, title: g.title, context: `All prices below are for ${g.title}`, panes: g.panes }));
      await downloadComparisonPdf(boards, reportSections, mandiPdfTables(), {
        title: selectedProducts.map(p => p.name).join(' vs '),
        locations: scopeColumns.map(c => c.label).join(', '),
        date: activeDay ? new Date(activeDay + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
        priceTypes: typeList.length === PRICE_TYPES.length ? 'All' : typeList.join(', '),
        generatedAt: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      }, `Zarai-Mandi-Comparison-${activeDay || 'report'}.pdf`);
      setNotice('PDF report downloaded.');
    } catch { setNotice('The PDF could not be created. Please try again.'); } finally { setPdfBusy(false); }
  }
  // ── Report matrix: price type sections × tiles (locations → products) ──
  const typeKey = typeList.join('|');
  const dayLabel = activeDay ? new Date(activeDay + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
  const reportSections: MatrixSectionDef[] = useMemo(() => {
    const unit = variants[0]?.unit ?? '40 kg';
    return typeList.map(type => ({ id: `rate:${type}`, label: `${type} rate`, hint: `Rs / ${unit} · ${dayLabel}`, rows: [
      { id: 'min', label: 'Avg min', hint: 'Rs/40kg', compare: true },
      { id: 'max', label: 'Avg max', hint: 'Rs/40kg', compare: true },
      { id: 'arrivals', label: 'Arrivals', hint: 'MT/report', compare: true },
      { id: 'mandis', label: 'Mandis', hint: 'reporting' },
      { id: 'change', label: 'Change', hint: 'vs prev.' },
    ] }));
  }, [typeKey, variants, dayLabel]); // eslint-disable-line react-hooks/exhaustive-deps
  // Busiest locations first (left, then top).
  const orderedScopes = useMemo(() => scopeColumns.map((c, i) => ({ c, i, n: filteredRows.filter(r => c.ids.has(r.locationId)).length })).sort((a, b) => b.n - a.n), [scopeColumns, filteredRows]);
  const reportGroups: MatrixGroup[] = useMemo(() => {
    const reports = (n: number) => `${n} rep.`;
    const empty: MatrixCell = { value: null, empty: true };
    const column = (v: typeof variants[number], scopeIndex: number, mandis: number): MatrixColumn => {
      const cells: Record<string, MatrixCell> = {};
      for (const type of typeList) {
        const r = v.channels.find(c => c.priceType === type)?.cells[scopeIndex]?.result;
        const key = (row: string) => matrixCellKey(`rate:${type}`, row);
        const t = r?.trends.find(x => x.mean.value !== null);
        const change = t?.mean.value != null ? `${t.mean.value.startsWith('-') ? '' : '+'}${meanText(t.mean)}%` : '';
        cells[key('min')] = r?.min.value != null ? { value: priceText(r.min), text: meanText(r.min), numeric: Number(r.min.value), note: reports(r.min.count) } : empty;
        cells[key('max')] = r?.max.value != null ? { value: priceText(r.max), text: meanText(r.max), numeric: Number(r.max.value), note: reports(r.max.count) } : empty;
        cells[key('arrivals')] = r?.arrivals.value != null ? { value: meanText(r.arrivals), text: meanText(r.arrivals), numeric: Number(r.arrivals.value), note: reports(r.arrivals.count) } : empty;
        cells[key('mandis')] = r?.count ? { value: r.priceLocations, text: `${r.priceLocations} of ${mandis}`, note: `of ${mandis}` } : empty;
        cells[key('change')] = change ? { value: change, text: change, note: `avg ${reports(t!.mean.count)}` } : empty;
      }
      const special = v.special && { ...v.special, onChange: v.special.options.length > 1 ? (value: string) => setSpecialChoice(prev => ({ ...prev, [v.byproduct.id]: value })) : undefined };
      return { id: `${v.key}@${scopeIndex}`, matchKey: v.key, title: v.byproduct.name, special, unit: v.unit, cells };
    };
    const ofProduct = (p: Product) => variants.filter(v => v.product.id === p.id);
    const single = selectedProducts.length === 1;
    // Locations are the outer divisions; inside each, one tile per product.
    // One product: its tiles move together across locations. Several: every tile scrolls on its own.
    return orderedScopes.map(({ c, i }, k) => ({
      id: c.key, title: c.label, subtitle: `${c.ids.size} mandis`, color: LOCATION_TONES[k % LOCATION_TONES.length],
      panes: selectedProducts.map((p, pk) => ({
        id: `${p.id}@${c.key}`, syncKey: single ? `product:${p.id}` : `${p.id}@${c.key}`, title: p.name,
        color: single ? LOCATION_TONES[k % LOCATION_TONES.length] : PRODUCT_TONES[pk % PRODUCT_TONES.length],
        columns: ofProduct(p).map(v => column(v, i, c.ids.size)),
      })),
    }));
  }, [variants, selectedProducts, orderedScopes, typeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const matrixIntro = useMemo(() => {
    const products = selectedProducts.map(p => p.name).join(' vs '), n = orderedScopes.length;
    if (n === 1) return { eyebrow: `${selectedProducts.length} product${selectedProducts.length === 1 ? '' : 's'} · ${dayLabel}`, title: products, context: `All prices below are for ${orderedScopes[0].c.label}` };
    return { eyebrow: `${n} locations${selectedProducts.length > 1 ? ` × ${selectedProducts.length} products` : ''} · ${dayLabel}`, title: products,
      context: selectedProducts.length > 1 ? 'Each location holds every product; each tile scrolls on its own.' : 'Locations side by side — swipe and they move together.' };
  }, [selectedProducts, orderedScopes, dayLabel]);
  // ── Mandi breakdown: same boxes/cards, every mandi per byproduct for one price type ──
  const [mandiTypeChoice, setMandiTypeChoice] = useState('');
  const [mandiSort, setMandiSort] = useState<'max-desc' | 'max-asc' | 'name'>('max-desc');
  const mandiTypeCounts = useMemo(() => typeList.map(t => ({ t, n: variants.reduce((sum, v) => sum + v.observations.filter(r => r.priceType === t).length, 0) })).filter(x => x.n > 0), [variants, typeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const mandiType = mandiTypeCounts.find(x => x.t === mandiTypeChoice)?.t ?? [...mandiTypeCounts].sort((a, b) => b.n - a.n)[0]?.t;
  const mandiGroups: MandiGroup[] = useMemo(() => {
    if (!mandiType) return [];
    const single = selectedProducts.length === 1;
    const change = (r: AggregateResult) => { const t = r.trends.find(x => x.mean.value !== null); return t?.mean.value != null ? `${t.mean.value.startsWith('-') ? '' : '+'}${meanText(t.mean)}%` : undefined; };
    const sortEntries = (entries: MandiEntry[]) => entries.sort((a, b) => mandiSort === 'name' ? a.name.localeCompare(b.name) : ((mandiSort === 'max-asc' ? 1 : -1) * ((a.max ?? (mandiSort === 'max-asc' ? Infinity : -Infinity)) - (b.max ?? (mandiSort === 'max-asc' ? Infinity : -Infinity)))));
    return orderedScopes.map(({ c }, k) => ({ c, k })).filter(({ c }) => c.ids.size > 1).map(({ c, k }) => ({
      id: `m:${c.key}`, title: c.label, subtitle: `${c.ids.size} mandis`, color: LOCATION_TONES[k % LOCATION_TONES.length],
      panes: selectedProducts.map((p, pk) => ({
        id: `m:${p.id}@${c.key}`, syncKey: single ? `m:product:${p.id}` : `m:${p.id}@${c.key}`, title: p.name,
        color: single ? LOCATION_TONES[k % LOCATION_TONES.length] : PRODUCT_TONES[pk % PRODUCT_TONES.length],
        columns: variants.filter(v => v.product.id === p.id).map(v => {
          const byMandi = new Map<string, MarketRow[]>();
          for (const r of v.observations) if (r.priceType === mandiType && c.ids.has(r.locationId)) byMandi.set(r.locationId, [...(byMandi.get(r.locationId) ?? []), r]);
          const entries = sortEntries([...byMandi].map(([id, rs]): MandiEntry => {
            const loc = locations.find(l => l.id === id), res = aggregateObservations(rs, []);
            return { id, name: loc?.name ?? id, district: loc?.district, min: res.min.value === null ? null : Number(res.min.value), max: res.max.value === null ? null : Number(res.max.value), minText: meanText(res.min), maxText: meanText(res.max), reports: res.count, change: change(res) };
          }));
          const special = v.special && { ...v.special, onChange: v.special.options.length > 1 ? (value: string) => setSpecialChoice(prev => ({ ...prev, [v.byproduct.id]: value })) : undefined };
          return { id: `m:${v.key}@${c.key}`, matchKey: v.key, title: v.byproduct.name, special, entries };
        }),
      })),
    }));
  }, [variants, selectedProducts, orderedScopes, mandiType, mandiSort, locations]);
  const mandiPdfTables = (): PdfMandiTable[] => mandiGroups.flatMap(g => g.panes.flatMap(p => p.columns.filter(c => c.entries.length).map(c => ({
    title: `${g.title} · ${p.title} ${c.title}${c.special ? ` (${c.special.label}: ${c.special.value})` : ''}`,
    subtitle: `${mandiType} rate · ${c.entries.length} of ${g.subtitle} reporting`,
    head: ['Mandi', 'District', 'Avg min', 'Avg max', 'Reports', 'Change'],
    rows: c.entries.map(e => [e.name, e.district ?? '', e.minText, e.maxText, String(e.reports), e.change ?? '—']),
  }))));
  const navigationItems: ReportHeading[] = useMemo(() => {
    const has = (sectionId: string) => reportGroups.some(g => g.panes.some(p => p.columns.some(col => ['min', 'max', 'arrivals', 'mandis', 'change'].some(r => { const cell = col.cells[matrixCellKey(sectionId, r)]; return !!cell && !cell.empty; }))));
    const items = reportSections.filter(sec => has(sec.id)).map(sec => ({ id: matrixSectionId(sec.id), label: sec.label, shortLabel: sec.label }));
    return [...items, ...(mandiGroups.length ? [{ id: 'mandis', label: 'Mandi breakdown', shortLabel: 'Mandis' }] : []), { id: 'summary', label: 'Summary', shortLabel: 'Summary' }];
  }, [reportGroups, reportSections, mandiGroups.length]);
  const activeView = navigationItems.find(item => item.id === viewKey) ?? navigationItems[0];
  const navigateView = (key: string) => {
    const node = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-matrix-section]') ?? []).find(el => el.dataset.matrixSection === key);
    if (node) { setViewKey(key); node.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
  };
  const navigationKey = navigationItems.map(h => h.id).join('|');
  useEffect(() => {
    if (stage !== 'report') return;
    const pane = root.current?.querySelector('.zm-report-phone');
    const targets = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-matrix-section]') ?? []);
    if (!pane || !targets.length) return;
    let frame = 0;
    const sync = () => {
      const top = root.current?.querySelector('.zm-header')?.getBoundingClientRect().bottom ?? pane.getBoundingClientRect().top;
      let current = targets[0];
      for (const target of targets) { if (target.getBoundingClientRect().top <= top + 28) current = target; else break; }
      setViewKey(current.dataset.matrixSection ?? '');
    };
    const queue = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(sync); };
    pane.addEventListener('scroll', queue, { passive: true }); window.addEventListener('resize', queue); queue();
    return () => { cancelAnimationFrame(frame); pane.removeEventListener('scroll', queue); window.removeEventListener('resize', queue); };
  }, [stage, navigationKey]);
  function matrixReport() {
    if (!variants.length || !filteredRows.length) return null;
    return <section className="zm-matrix-report" aria-label="Comparison data">
      <CompareMatrix groups={reportGroups} sections={reportSections} eyebrow={matrixIntro.eyebrow} title={matrixIntro.title} context={matrixIntro.context} stickyTop={stage === 'report' ? headerHeight : 0} />
      <p className="zm-ledger-foot">— Not reported. Prices are means of every valid report on the selected day. % chips compare the same byproduct with the first location; they are not recommendations.</p>
      {mandiGroups.length > 0 && <div className="zm-mandi-breakdown">
        <MandiMatrix groups={mandiGroups} id="mandis" label="Mandi breakdown" hint={`${mandiType} rate · ${dayLabel}`} stickyTop={stage === 'report' ? headerHeight : 0}
          controls={<div className="zm-mandi-controls">
            <div className="zm-mandi-types" role="radiogroup" aria-label="Price type for mandis">{mandiTypeCounts.map(({ t, n }) => <button key={t} type="button" role="radio" aria-checked={t === mandiType} className={t === mandiType ? 'on' : ''} onClick={() => setMandiTypeChoice(t)}>{t}<small>{n}</small></button>)}</div>
            <div className="zm-mandi-sorts" role="radiogroup" aria-label="Sort mandis">{([['max-desc', 'Highest'], ['max-asc', 'Lowest'], ['name', 'A–Z']] as const).map(([value, text]) => <button key={value} type="button" role="radio" aria-checked={mandiSort === value} className={mandiSort === value ? 'on' : ''} onClick={() => setMandiSort(value)}>{text}</button>)}</div>
          </div>} />
      </div>}
    </section>;
  }

  return <main className={`zm-module zm-embedded ${stage === 'report' ? 'zm-report-layout' : ''}`} ref={root}>
    <div className={`zm-phone ${stage === 'report' ? 'zm-report-phone' : ''}`}>
      <header className="zm-header" ref={headerRef}>
        {(stage !== 'select' || onExit) && <button className="zm-icon-button" aria-label="Back" onClick={() => stage === 'report' ? setStage('refine') : stage === 'refine' ? setStage('select') : onExit?.()}><Icon name="back" /></button>}
        <div>{stage === 'report' && <span className="zm-header-kicker">Comparison report</span>}<h1 ref={heading} tabIndex={-1}>{stage === 'select' ? 'Compare' : stage === 'refine' ? 'Refine Comparison' : selectedProducts.map(p => p.name).join(' vs ')}</h1><p>{stage === 'select' ? 'Select products to compare.' : stage === 'refine' ? 'Choose byproducts, price types and locations.' : ''}</p></div>
        {stage === 'report' && <button className="zm-edit" aria-label="Edit comparison" onClick={() => setStage('refine')}><Pencil size={18} /> <span>Edit</span></button>}
      </header>
      {dataLabel && stage !== 'report' && <div className="zm-demo zm-data-label"><span />{dataLabel}</div>}

      {stage === 'select' && <div className="zm-content">
        <p className="zm-access">{accessNote ?? (ownedCategoryIds ? 'Only your purchased categories are shown.' : 'Choose one or more products, then compare their byproducts.')}</p>
        {saved?.productIds.length ? <button className="zm-repeat" onClick={() => { setSelection(saved); setStage('report'); }}><Icon name="bookmark" size={17} /><span>Repeat saved comparison<small>{saved.productIds.map(id => products.find(p => p.id === id)?.name).join(' + ')}</small></span><Icon name="arrow" size={17} /></button> : null}
        <label className="zm-search"><Icon name="search" size={18} /><input aria-label="Search products" placeholder="Search products…" value={query} onChange={e => setQuery(e.target.value)} /></label>
        <div className="zm-circle-grid">{products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).map(p => { const on = effective.productIds.includes(p.id); return <button key={p.id} className={`zm-circle-card ${on ? 'selected' : ''}`} aria-pressed={on} onClick={() => toggleProduct(p)}><span className="zm-circle">{p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" /> : <Icon name="leaf" size={28} />}{on && <span className="zm-circle-check"><Icon name="check" size={11} /></span>}</span><strong>{p.name}</strong></button>; })}</div>
        {!products.some(p => p.name.toLowerCase().includes(query.toLowerCase())) && !availableCategories.some(c => c.kind === 'vertical' && c.name.toLowerCase().includes(query.toLowerCase())) && <div className="zm-empty">No matching products in your access.</div>}
        <div className="zm-select-footer"><strong>{selectedProducts.length} product{selectedProducts.length === 1 ? '' : 's'} selected</strong><div className="zm-chips">{selectedProducts.map(p => <button className="zm-chip soft" key={p.id} onClick={() => removeProduct(p.id)} aria-label={`Remove ${p.name}`}>{p.name} ×</button>)}</div><button className="zm-primary" disabled={!selectedProducts.length} onClick={() => setStage('refine')}>Continue <Icon name="arrow" /></button><button className="zm-quick-compare" disabled={!selectedProducts.length} onClick={openReport}>Compare now · {selectionLabel}</button></div>
      </div>}

      {stage === 'refine' && <div className="zm-content">
        {!selectedProducts.length ? <div className="zm-empty">Select a product to continue.<button className="zm-primary" onClick={() => setStage('select')}>Choose products</button></div> : <>
          {filterControls()}
          {selectedProducts.map(p => {
            const category = availableCategories.find(c => c.products.some(x => x.id === p.id)); return <section className="zm-product-filters" key={p.id} aria-label={`${p.name} filters`}>
              <div className="zm-product-heading"><Crop product={p} size={43} /><div><h2>{p.name} Filters</h2>{category?.kind === 'vertical' && <small>{category.name} → {p.name}</small>}</div></div>
              <div className="zm-white-card">{filterGroup(p, 'Byproducts', 'byproductIds', p.byproducts.map(b => ({ id: b.id, label: b.name })))}</div>
            </section>;
          })}
          <section className="zm-location-section"><h2>Location <small>for all products</small></h2>
            <button type="button" className="zm-loc-pill" onClick={() => setLocationPickerOpen(true)} aria-haspopup="dialog">
              <span className="zm-loc-pill-icon" aria-hidden="true"><MapPin size={16} /></span>
              <span className="zm-loc-pill-text"><b>{selectionLabel}</b><small>{selectedLocations.length} mandis · tap to change</small></span>
              <ChevronDown size={16} aria-hidden="true" />
            </button>
          </section>
          <div className="zm-selection-summary"><Icon name="compare" size={18} /><div><strong>Your Selection</strong><p>{selectedProducts.map(p => p.name).join(', ')}<br />{selectionLabel}</p></div><div><strong>{byproductCount} byproducts</strong><p>{typeList.length} price types<br />{selectedLocations.length} mandis</p></div></div>
          <button className="zm-primary" onClick={openReport}>Compare <Icon name="arrow" /></button>
        </>}
      </div>}

      {stage === 'report' && <div className="zm-content zm-report">
        <section className="zm-hero" aria-label="Report summary">
          <div className="zm-hero-glow" aria-hidden="true" />
          <div className="zm-hero-top">
            <div className="zm-hero-avatars" aria-hidden="true">{selectedProducts.slice(0, 4).map(p => <span key={p.id}>{p.imageUrl ? <img src={p.imageUrl} alt="" /> : <Icon name="leaf" size={16} />}</span>)}</div>
            <span className="zm-hero-kicker">Market comparison · PKT</span>
          </div>
          <h2 className="zm-hero-title">{selectedProducts.map(p => p.name).join(' vs ')}</h2>
          <p className="zm-hero-where"><MapPin size={13} aria-hidden="true" />{scopeColumns.map(c => c.label).join(' · ')}</p>
          <div className="zm-hero-controls">
            <label className="zm-hero-pill"><CalendarDays size={14} aria-hidden="true" /><select aria-label="Report date" value={activeDay} onChange={e => setReportDate(e.target.value)}>{unique([activeDay, ...availableDays].filter(Boolean)).map(day => <option key={day} value={day}>{new Date(day + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</option>)}{!availableDays.length && <option value="">No dated records</option>}</select><ChevronDown size={13} aria-hidden="true" /></label>
            {filterControls()}
          </div>
          <div className="zm-hero-stats">
            <div><b>{variants.length}</b><span>Byproducts</span></div>
            <div><b>{reportingLocations.length}</b><span>Mandis reporting</span></div>
            <div><b>{filteredRows.length}</b><span>Reports</span></div>
          </div>
          <div className="zm-hero-actions">
            <button type="button" className="zm-hero-btn primary" onClick={downloadPdf} disabled={!filteredRows.length || pdfBusy}><FileDown size={15} aria-hidden="true" />{pdfBusy ? 'Preparing…' : 'Download PDF'}</button>
            <button type="button" className="zm-hero-btn" onClick={() => persist(effective)}><Bookmark size={15} aria-hidden="true" />Save</button>
            <button type="button" className="zm-hero-btn" onClick={toggleRotation} aria-label={rotated ? 'Back to portrait' : 'Landscape view'}><Maximize2 size={15} aria-hidden="true" />{rotated ? 'Portrait' : 'Landscape'}</button>
          </div>
        </section>
        <section ref={overview} id={`${reportId}-overview`} tabIndex={-1} className="zm-report-section" aria-label="Comparison report top">
          {hasOverlap && <p className="zm-aggregate-caution">Selected areas overlap. A mandi may contribute to more than one column; columns are not added together.</p>}
          {(audit.duplicates > 0 || audit.conflictingIds > 0) && <p className="zm-aggregate-caution">{audit.duplicates} repeated rows removed. {audit.conflictingIds} conflicting record IDs excluded.</p>}
          {rowsLoading && <div className="zm-empty zm-loading" role="status"><span className="zm-spinner" aria-hidden="true" /><h3>Loading market reports…</h3></div>}
          {rowsError && !rowsLoading && <div className="zm-empty" role="alert"><h3>Couldn’t load market reports</h3><p>{rowsError}</p></div>}
          {!rowsLoading && !rowsError && !filteredRows.length && <div className="zm-empty"><Icon name="search" size={28} /><h3>No reports match this selection</h3><p>Choose another grade, price type, or location.</p><button className="zm-primary" onClick={() => setStage('refine')}>Edit filters</button></div>}
        </section>
        <div className="zm-finance-surface">{matrixReport()}</div>
        <section ref={summary} id={`${reportId}-summary`} tabIndex={-1} data-matrix-section="summary" className="zm-report-section zm-summary" aria-label="Comparison summary"><div className="zm-section-heading"><span>05 / END OF REPORT</span><h2>Comparison Summary</h2></div>
          <div className="zm-summary-products">{selectedProducts.map(p => <div key={p.id} className="zm-white-card"><Crop product={p} size={58} /><div><h3>{p.name}</h3><p>{effective.filters[p.id].byproductIds.length} byproducts<br />{effective.filters[p.id].priceTypes.length} price types<br />{unique(filteredRows.filter(r => r.productId === p.id).map(r => r.locationId)).length} reporting mandis</p></div></div>)}</div>
          <div className="zm-white-card zm-covered"><h3><Icon name="pin" size={18} /> Provinces Covered</h3><div className="zm-province-pills">{selectedProvinces.map(p => <div key={p}><strong>{p}</strong><small>{selectedLocations.filter(l => l.province === p).length} selected mandis</small></div>)}</div></div>
          <div className="zm-summary-info"><Icon name="chart" size={30} /><p>{filteredRows.length} distinct source observations · {variants.length} byproduct columns · {reportingLocations.length} reporting mandis. Means are calculated from source rows, never from already-rounded averages.</p></div>
          <div className="zm-farm-art"><p lang="ur" dir="rtl">بہتر معلومات<br />بہتر فیصلے</p><small>Better Information<br />Better Decisions</small><svg viewBox="0 0 400 125" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M0 64Q100 5 220 68T400 70M0 88Q135 33 280 100M0 112Q110 70 240 125M80 125q90-75 250-40M172 125q100-53 228-23M12 34h45m210-8h38M298 65V43l19-18 20 18v27m-25-2V48h10v18" /><path d="M58 75V37m0 16-9-9m9 1 10-11M365 79V36m0 23-11-12m11 1 11-9" /><circle cx="57" cy="25" r="10" /><path d="m198 29 7-4 7 4m-38 9 7-4 7 4" /></g></svg></div>
          <button className="zm-primary" onClick={() => { lastToggle.current = document.activeElement as HTMLButtonElement; setShowDecision(true); }}><Icon name="headset" /> Get Market Decision <Icon name="arrow" /></button><p className="zm-decision-caption"><Icon name="headset" size={16} />{onDecisionRequest ? 'Send your comparison to the team for a human review.' : 'Prepare a request for your market team. It downloads as a file until a team inbox is connected.'}</p>
          <div className="zm-summary-actions"><button onClick={() => jump(overview)}>Back to report ↑</button><button onClick={reset}>New comparison</button></div>
        </section>
      </div>}
    </div>

    {stage === 'report' && activeView && navigationItems.length > 1 && <HeadingNavigator headings={navigationItems} activeId={activeView.id} onSelect={navigateView} kind="Sections" />}
    {stage === 'report' && !isLandscape && !rotateDismissed && <div className="zm-rotate-prompt" role="dialog" aria-modal="true" aria-labelledby={`${reportId}-rotate`}>
      <div className="zm-rotate-card">
        <span className="zm-rotate-phone" aria-hidden="true"><i /></span>
        <h2 id={`${reportId}-rotate`}>Rotate your phone</h2>
        <p>The comparison sheet shows every column side by side in landscape.</p>
        <button className="zm-primary" onClick={toggleRotation}>Rotate</button>
        <button className="zm-rotate-skip" onClick={() => setRotateDismissed(true)}>Keep portrait</button>
      </div>
    </div>}
    {notice && <div className="zm-toast" role="status">{notice}</div>}
    {locationPickerOpen && renderLocationPicker?.({
      selected: effective.scopes.flatMap((sc): PickedLocation[] => sc.kind === 'country' ? [] : sc.kind === 'mandi' ? [{ kind: 'mandi', label: `${locations.find(l => l.id === sc.value)?.name ?? sc.value} Mandi` }] : [{ kind: sc.kind, label: sc.value }]),
      dataNames: new Set(locations.flatMap(l => [l.name.toLowerCase(), l.district.toLowerCase()])),
      onApply: picked => { applyPickedLocations(picked); setLocationPickerOpen(false); },
      onClose: () => setLocationPickerOpen(false),
    })}
    {showDecision && <Modal title="Get Market Decision" onClose={() => { if (!sending) { setShowDecision(false); lastToggle.current?.focus(); } }}><p className="zm-subtle">{onDecisionRequest ? 'The market team will receive your selection and contact details.' : 'No service is connected. Download a request containing your selection and contact details.'}</p><form onSubmit={submitDecision}><label className="zm-field">Your name<input name="name" required autoComplete="name" maxLength={100} /></label><label className="zm-field">Contact number<input name="phone" required type="tel" autoComplete="tel" placeholder="+92 …" maxLength={30} /></label><label className="zm-field">What would you like to discuss?<textarea name="note" rows={3} maxLength={1000} placeholder="Tell the team what you are comparing…" /></label>{decisionError && <p role="alert" className="zm-error">{decisionError}</p>}<button className="zm-primary" disabled={sending}>{sending ? 'Sending…' : onDecisionRequest ? 'Send to market team' : 'Download request'}<Icon name="arrow" /></button></form></Modal>}
  </main>;
}




interface SmoothDropdownProps {
  label?: string;
  summary?: string;
  ariaLabel?: string;
  icon?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
  className?: string;
}

/** The supplied expanding menu, adapted for labelled filter triggers and form content.
 * Controlled or local state; no provider required. Portal prevents table/scroll clipping.
 */
function SmoothDropdown({ label = 'Filter', summary = '', ariaLabel, icon, open: controlledOpen, onOpenChange, children, className }: SmoothDropdownProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = controlledOpen ?? localOpen;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [contentRef, contentBounds] = useMeasure();
  const [bounds, setBounds] = useState({ left: 12, top: 12, width: 320, triggerWidth: 160, triggerHeight: 52, maxHeight: 500 });
  const wasOpen = useRef(false);
  const reduced = useReducedMotion();
  const id = useId();
  const change = (next: boolean) => { setLocalOpen(next); onOpenChange?.(next); };
  const close = () => { change(false); triggerRef.current?.focus({ preventScroll: true }); };
  useEffect(() => {
    if (!isOpen) { if (wasOpen.current) triggerRef.current?.focus({ preventScroll: true }); wasOpen.current = false; return; }
    wasOpen.current = true;
    const position = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      const width = Math.min(360, innerWidth - 24);
      const top = Math.max(12, Math.min(r.top, innerHeight - 320));
      setBounds({ left: Math.min(Math.max(12, r.left), innerWidth - width - 12), top, width, triggerWidth: r.width, triggerHeight: r.height, maxHeight: innerHeight - top - 12 });
    };
    position(); window.addEventListener('resize', position);
    const outside = (event: PointerEvent) => { if (!panelRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) close(); };
    document.addEventListener('pointerdown', outside);
    const focus = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    return () => { window.removeEventListener('resize', position); document.removeEventListener('pointerdown', outside); cancelAnimationFrame(focus); };
  }, [isOpen]);
  const spring = reduced ? { duration: 0 } : { type: 'spring' as const, damping: 34, stiffness: 380, mass: 0.8 };
  return <div className={cn('smooth-dropdown relative min-w-0', className)}>
    <button ref={triggerRef} type="button" className="smooth-trigger" aria-label={ariaLabel ?? `Choose ${label}`} aria-haspopup="dialog" aria-expanded={isOpen} aria-controls={isOpen ? id : undefined} onClick={() => change(!isOpen)}>
      {icon && <span className="smooth-trigger-icon" aria-hidden="true">{icon}</span>}
      <span className="smooth-trigger-copy"><span>{label}</span><strong>{summary}</strong></span><ChevronDown size={16} aria-hidden="true" />
    </button>
    {typeof document !== 'undefined' && createPortal(<AnimatePresence>{isOpen && <motion.div ref={panelRef} id={id} role="dialog" aria-modal="true" aria-label={`${label} filters`} tabIndex={-1}
      initial={reduced ? false : { opacity: 0, width: bounds.triggerWidth, height: bounds.triggerHeight, borderRadius: 12 }}
      animate={{ opacity: 1, width: bounds.width, height: Math.min(Math.max(100, contentBounds.height + 2), bounds.maxHeight), borderRadius: 18 }}
      exit={{ opacity: 0, scale: reduced ? 1 : 0.97, transition: { duration: reduced ? 0 : 0.12 } }}
      transition={spring} className="smooth-panel fixed z-50 overflow-hidden border shadow-xl"
      style={{ left: bounds.left, top: bounds.top, maxWidth: 'calc(100vw - 24px)', maxHeight: bounds.maxHeight, transformOrigin: 'top left' }}
      onKeyDown={(e: ReactKeyboardEvent) => {
        if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
        if (e.key !== 'Tab') return;
        const focusables = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]') ?? []).filter(el => el.getClientRects().length);
        const first = focusables[0], last = focusables.at(-1);
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || document.activeElement === panelRef.current)) { e.preventDefault(); first?.focus(); }
      }}>
      <div className="smooth-panel-scroll" style={{ maxHeight: bounds.maxHeight - 2 }}>
        <div ref={contentRef}>
          <div className="smooth-panel-heading"><div>{icon}<span>{label}<small>{summary}</small></span></div><button type="button" aria-label="Close filters" onClick={close}><X size={20} /></button></div>
          <motion.div initial={{ opacity: 0, y: reduced ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.2, delay: reduced ? 0 : 0.06 }} className="smooth-panel-content">
            {children}
          </motion.div>
        </div>
      </div>
    </motion.div>}</AnimatePresence>, document.body)}
  </div>;
}

