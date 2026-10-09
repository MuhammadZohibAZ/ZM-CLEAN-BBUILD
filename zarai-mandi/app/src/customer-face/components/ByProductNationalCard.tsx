import React, { useState, useRef, useEffect } from "react";
import { type CardStats, type CardSpecialAttr } from "../../lib/api";

import { getProductSpecialAttrType } from "../shared/data/byproductStats";
import { latestDatasetDay } from "../shared/data/datasetDates";
import { toUrduDigits, URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { type ByproductNationalStats, type SpecialAttrInfo } from "../shared/types";

// ─── SCROLL INTERSECTION ANIMATED COUNTER COMPONENT ──────────────────────────

export function AnimatedCounter({
  target,
  duration = 950,
  prefix = '',
  suffix = '',
  formatUrdu = false,
}: {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  formatUrdu?: boolean;
}) {
  const [count, setCount] = useState(0);
  const elRef = useRef<HTMLSpanElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!elRef.current || target <= 0) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          let startTime: number | null = null;
          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease-out cubic curve
            const ease = 1 - Math.pow(1 - progress, 3);
            const val = Math.round(ease * target);
            setCount(val);
            if (progress < 1) {
              window.requestAnimationFrame(animate);
            }
          };
          window.requestAnimationFrame(animate);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(elRef.current);
    return () => observer.disconnect();
  }, [target, duration]);

  const numStr = count.toLocaleString();
  const displayVal = formatUrdu ? toUrduDigits(numStr) : numStr;

  return (
    <span ref={elRef}>
      {prefix}{displayVal}{suffix}
    </span>
  );
}

// ─── REVAMPED FIGMA BY-PRODUCT NATIONAL CARD COMPONENT (2*2 GRID) ───────────

export const CARD_UPDATED_PRESETS = [
  { mins: 1, en: '1m ago', ur: '1 منٹ پہلے' },
  { mins: 4, en: '4m ago', ur: '4 منٹ پہلے' },
  { mins: 7, en: '7m ago', ur: '7 منٹ پہلے' },
  { mins: 10, en: '10m ago', ur: '10 منٹ پہلے' },
  { mins: 15, en: '15m ago', ur: '15 منٹ پہلے' },
  { mins: 22, en: '22m ago', ur: '22 منٹ پہلے' },
  { mins: 35, en: '35m ago', ur: '35 منٹ پہلے' },
  { mins: 45, en: '45m ago', ur: '45 منٹ پہلے' },
  { mins: 60, en: '1hr ago', ur: '1 گھنٹہ پہلے' },
  { mins: 120, en: '2hr ago', ur: '2 گھنٹے پہلے' },
];

export function getCardUpdatedPreset(seed: string | number | undefined) {
  const hash = typeof seed === 'number'
    ? seed
    : String(seed || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CARD_UPDATED_PRESETS[Math.abs(hash) % CARD_UPDATED_PRESETS.length];
}

export function getCardUpdatedMinutes(seed: string | number | undefined): number {
  return getCardUpdatedPreset(seed).mins;
}

export function getCardUpdatedAgo(
  seed: string | number | undefined,
  lang: string,
  selectedDate?: Date | null,
): string {
  if (selectedDate) {
    const refDate = latestDatasetDay();
    const d1 = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
    const d2 = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const diffMs = d1.getTime() - d2.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      if (diffDays === 1) {
        return lang === 'ur' ? '1 دن پہلے' : '1 day ago';
      }
      return lang === 'ur' ? `${toUrduDigits(diffDays)} دن پہلے` : `${diffDays} days ago`;
    }
  }
  const preset = getCardUpdatedPreset(seed);
  return lang === 'ur' ? preset.ur : preset.en;
}

export function CardStatCell({
  label,
  value,
  caption,
  valueColor = '#143B33',
  divider,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  caption?: React.ReactNode;
  valueColor?: string;
  divider?: boolean;
}) {
  return (
    <div
      className={`flex-1 min-w-0 flex flex-col justify-start py-0.5 ${divider ? 'ps-2 ms-1 border-s' : 'pe-1'}`}
      style={divider ? { borderColor: '#D9E7E1' } : undefined}
    >
      <span className="block text-[10px] font-bold text-[#52635F] leading-tight break-words">
        {label}
      </span>
      <span
        className="block font-black tracking-tight leading-tight my-0.5 break-words"
        style={{ color: valueColor, fontSize: 'clamp(11px, 3.2vw, 13px)' }}
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </span>
      {caption !== undefined && (
        <span className="block text-[8.5px] font-bold text-[#087F63] leading-tight break-words">
          {caption}
        </span>
      )}
    </div>
  );
}

export function LocationStatCell({
  marketCount,
  divider,
  fullWidth,
  lang,
}: {
  marketCount: number;
  divider?: boolean;
  fullWidth?: boolean;
  lang: string;
}) {
  const countDisplay = marketCount > 0 ? (
    <AnimatedCounter target={marketCount} suffix="+" formatUrdu={lang === 'ur'} />
  ) : (
    '0'
  );

  return (
    <div
      className={`flex-1 min-w-0 flex flex-col justify-center py-0.5 ${divider ? 'ps-2 ms-1 border-s' : 'pe-1'} ${fullWidth ? 'w-full' : ''}`}
      style={divider ? { borderColor: '#D9E7E1' } : undefined}
    >
      <span className="block text-[10px] font-bold text-[#52635F] leading-tight break-words">
        {lang === 'ur' ? 'مقامات' : 'Locations'}
      </span>

      <div className="flex items-center gap-1.5 my-0.5 whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-[#10B981]/25 animate-pulse flex-shrink-0" />
        <span
          className="font-black tracking-tight text-[#087F63] leading-none flex items-center gap-1"
          style={{ fontSize: 'clamp(11.5px, 3.2vw, 13px)' }}
        >
          <bdi dir="ltr">{countDisplay}</bdi>
          <span className="text-[10px] font-bold text-[#075E4F]">
            {lang === 'ur' ? 'فعال' : 'Active'}
          </span>
        </span>
      </div>
    </div>
  );
}

export const SPECIAL_ATTR_META: Record<string, { labelEn: string; labelUr: string; dotColor: string }> = {
  multi: { labelEn: "Attributes", labelUr: "اوصاف", dotColor: "#10B981" },
  moisture: { labelEn: "Moisture", labelUr: "نمی", dotColor: "#38BDF8" },
  newOld: { labelEn: "Crop", labelUr: "فصل", dotColor: "#F59E0B" },
  color: { labelEn: "Color", labelUr: "رنگ", dotColor: "#FBBF24" },
  variety: { labelEn: "Variety", labelUr: "قسم", dotColor: "#10B981" },
  spec: { labelEn: "Spec", labelUr: "تفصیل", dotColor: "#10B981" },
  quality: { labelEn: "Quality", labelUr: "معیار", dotColor: "#10B981" },
  origin: { labelEn: "Origin", labelUr: "علاقہ", dotColor: "#10B981" },
};

export const SPECIAL_ATTR_COLOR_URDU: Record<string, string> = {
  Brown: "براؤن",
  Golden: "سنہرا",
  White: "سفید",
  Yellow: "پیلا",
  Red: "سرخ",
  Green: "سبز",
  Black: "کالا",
};

export const SPECIAL_ATTR_SPEC_URDU: Record<string, string> = {
  Dry: "خشک",
  Fresh: "تازہ",
};

/**
 * Urdu for a special attribute value. Values come from the data in English
 * ("Seed Quality", "Storage", "Punjab"); use the dictionary's Urdu when it has one.
 */
export function specialAttrValueUr(attr: SpecialAttrInfo, tc: (name: string) => string): string {
  const translated = tc(attr.valueEn);
  return translated !== attr.valueEn ? translated : attr.valueUr;
}

export function apiSpecialAttrToUi(attr: CardSpecialAttr | null): SpecialAttrInfo | null {
  if (!attr) return null;
  const meta = SPECIAL_ATTR_META[attr.type] || { labelEn: attr.type, labelUr: attr.type, dotColor: "#10B981" };
  let valueUr = attr.value;
  if (attr.type === "newOld") {
    valueUr = attr.value.toLowerCase().includes("new") ? "نیا" : "پرانا";
  } else if (attr.type === "color") {
    valueUr = SPECIAL_ATTR_COLOR_URDU[attr.value] || attr.value;
  } else if (attr.type === "spec") {
    valueUr = SPECIAL_ATTR_SPEC_URDU[attr.value] || attr.value;
  } else if (attr.type === "moisture") {
    valueUr = toUrduDigits(attr.value);
  }
  return {
    type: attr.type,
    labelEn: meta.labelEn,
    labelUr: meta.labelUr,
    valueEn: attr.value,
    valueUr,
    dotColor: meta.dotColor,
  };
}

export function ByProductNationalCard({
  stats,
  product,
  vertical,
  selectedDate,
  onClick,
  onMorePriceTypesClick,
  onRateTypeChange,
}: {
  stats: ByproductNationalStats;
  product?: string;
  vertical?: string;
  selectedDate?: Date | null;
  onClick: () => void;
  onMorePriceTypesClick?: () => void;
  /** When set, the rate type under the name is a dropdown of the by-product's rate types. */
  onRateTypeChange?: (rateType: string) => void;
}) {
  const { lang, tc, tr } = useLang();

  // Resolve special attribute label and value
  const attrType = stats.specialAttr?.type || getProductSpecialAttrType(stats.byproduct, product || vertical || stats.product);
  const attrMeta = attrType ? SPECIAL_ATTR_META[attrType] : { labelEn: "Crop", labelUr: "فصل", dotColor: "#F59E0B" };
  const specialAttrLabel = lang === 'ur'
    ? (attrType === 'newOld' ? 'فصل' : (stats.specialAttr?.labelUr || attrMeta?.labelUr || 'فصل'))
    : (attrType === 'newOld' ? 'Crop' : (stats.specialAttr?.labelEn || attrMeta?.labelEn || 'Crop'));
  const hasAttrValue = Boolean(stats.specialAttr && (stats.specialAttr.valueEn || stats.specialAttr.valueUr));
  const specialAttrValue = hasAttrValue
    ? (lang === 'ur' ? specialAttrValueUr(stats.specialAttr!, tc) : stats.specialAttr!.valueEn)
    : '—';
  const specialAttrColor = hasAttrValue ? '#ff7b00ff' : undefined;

  // Arrival value: show bags count if > 0, otherwise show '—'
  const hasArrival = stats.hasData && stats.totalArrival > 0;
  // The unit is set smaller so long counts still fit beside the attribute cell.
  const arrivalValue = hasArrival
    ? (
      <>
        {lang === 'ur' ? toUrduDigits(stats.totalArrival.toLocaleString()) : stats.totalArrival.toLocaleString()}
        <span className="text-[10px] font-bold">{'\u00A0'}{lang === 'ur' ? 'تھیلے' : 'Bags'}</span>
      </>
    )
    : '—';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="relative w-full rounded-[16px] sm:rounded-[18px] overflow-hidden transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-[0_3px_12px_rgba(6,77,64,0.06)] hover:shadow-[0_6px_18px_rgba(6,77,64,0.11)] select-none flex flex-col p-2.5 sm:p-3"
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #D1E5DC',
      }}
    >
      {/* Top Header: Full Width Title & Rate Type (Always visible so by-product name is identifiable) */}
      <div className="relative z-10 w-full mb-1.5">
        <h3
          className={`text-[14px] sm:text-[15px] font-black leading-tight tracking-tight break-words ${
            !stats.hasData ? 'text-[#143B33]/90' : 'text-[#143B33]'
          }`}
          style={{
            fontFamily: lang === 'ur' ? URDU_FONT : "'Inter', sans-serif",
          }}
          title={tc(stats.byproduct)}
        >
          {tc(stats.byproduct)}
        </h3>
        <p
          className={`text-[10.5px] sm:text-[11px] font-bold mt-0.5 leading-tight break-words ${
            !stats.hasData ? 'text-[#087F63]/75' : 'text-[#087F63]'
          }`}
          style={{ fontFamily: lang === 'ur' ? URDU_FONT : 'inherit' }}
        >
          {onRateTypeChange && stats.allRateTypes.length > 1 ? (
            // A native select over the label: the phone's own picker, and taps
            // on it don't open the card.
            <span
              className="relative inline-flex items-center gap-1 rounded-full px-2 py-0.5 -ms-0.5"
              style={{ background: '#E8F8F3', border: '1px solid #BCE8D8' }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <span>{tr(stats.mostOccurringRateType)}</span>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#087F63" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <select
                aria-label={lang === 'ur' ? 'ریٹ کی قسم' : 'Rate type'}
                value={stats.mostOccurringRateType}
                onChange={(e) => onRateTypeChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                {stats.allRateTypes.map((rt) => (
                  <option key={rt} value={rt}>
                    {tr(rt)}
                  </option>
                ))}
              </select>
            </span>
          ) : (
            tr(stats.mostOccurringRateType)
          )}
        </p>
      </div>

      {/* Metric rows: 3 clean rows with overlay container */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-between">
        <div className={!stats.hasData ? 'opacity-35 select-none filter blur-[0.5px]' : ''}>
          {/* Row 1: Avg min | Avg max */}
          <div className="flex w-full">
            <CardStatCell
              label={lang === 'ur' ? 'اوسط کم' : 'Avg min'}
              value={
                stats.hasData && stats.avgMin > 0
                  ? lang === 'ur'
                    ? `روپے\u00A0${toUrduDigits(Math.round(stats.avgMin).toLocaleString())}`
                    : `Rs\u00A0${Math.round(stats.avgMin).toLocaleString()}`
                  : '—'
              }
              caption={lang === 'ur' ? 'فی 40 کلو' : 'per 40 kg'}
            />
            <CardStatCell
              divider
              label={lang === 'ur' ? 'اوسط زیادہ' : 'Avg max'}
              value={
                stats.hasData && stats.avgMax > 0
                  ? lang === 'ur'
                    ? `روپے\u00A0${toUrduDigits(Math.round(stats.avgMax).toLocaleString())}`
                    : `Rs\u00A0${Math.round(stats.avgMax).toLocaleString()}`
                  : '—'
              }
              caption={lang === 'ur' ? 'فی 40 کلو' : 'per 40 kg'}
            />
          </div>

          <div className="h-px w-full my-1.5" style={{ background: '#E7F0EB' }} />

          {/* Row 2: Total arrival | Special Attribute */}
          <div className="flex w-full">
            <CardStatCell
              label={lang === 'ur' ? 'کل آمد' : 'Total arrival'}
              value={arrivalValue}
              caption={lang === 'ur' ? 'فی 40 کلو' : 'per 40 kg'}
            />
            <CardStatCell
              divider
              label={specialAttrLabel}
              value={specialAttrValue}
              valueColor={specialAttrColor}
            />
          </div>

          <div className="h-px w-full my-1.5" style={{ background: '#E7F0EB' }} />

          {/* Row 3: Locations on Left + Time Pill on Bottom-Right */}
          <div className="flex items-end justify-between w-full">
            <LocationStatCell
              marketCount={stats.markets}
              lang={lang}
            />

            {/* Time Pill on Bottom-Right */}
            <div
              className="flex-shrink-0 flex items-center gap-1 text-[8.5px] sm:text-[9px] font-bold text-[#065F46] bg-[#E8F8F3] border border-[#BCE8D8] py-0.5 px-1.5 sm:px-2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.03)] mb-0.5"
              style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#087F63"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="whitespace-nowrap">
                {getCardUpdatedAgo(stats.catalogId || stats.byproduct, lang, cardStatsDay(stats, selectedDate))}
              </span>
            </div>
          </div>
        </div>

        {/* No Data Overlay covering only the metrics section */}
        {!stats.hasData && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-1.5 rounded-[12px] bg-white/65 backdrop-blur-[2px] pointer-events-none">
            <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-white/95 border border-[#D1E5DC] text-center shadow-[0_2px_8px_rgba(6,77,64,0.06)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]/50 flex-shrink-0" />
              <span
                className="text-[11px] sm:text-xs font-bold text-[#143B33]"
                style={{ fontFamily: lang === 'ur' ? URDU_FONT : 'inherit' }}
              >
                {lang === 'ur' ? 'ڈیٹا دستیاب نہیں ہے' : 'No Data Available'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function apiCardStatsToUi(raw: CardStats): ByproductNationalStats {
  const specialAttr = apiSpecialAttrToUi(raw.specialAttr);
  const specialAttrs = (raw.specialAttrs || [])
    .map(apiSpecialAttrToUi)
    .filter((a): a is SpecialAttrInfo => a !== null);

  return {
    hasData: raw.hasData,
    catalogId: raw.catalogId,
    product: raw.product,
    byproduct: raw.byproduct,
    mostOccurringRateType: raw.mostOccurringRateType,
    otherRateTypesCount: raw.otherRateTypesCount,
    allRateTypes: raw.allRateTypes,
    avgMin: raw.avgMin,
    avgMax: raw.avgMax,
    totalArrival: raw.totalArrival,
    markets: raw.markets,
    arrivalCoverage: raw.arrivalCoverage,
    specialAttr,
    specialAttrs,
    statsDate: raw.statsDate ? raw.statsDate.slice(0, 10) : null,
  };
}

/** The day a card's numbers describe: its report day when that is before the picked day. */
export function cardStatsDay(stats: ByproductNationalStats, selectedDate?: Date | null): Date | null {
  if (!stats.statsDate) return selectedDate ?? null;
  const [y, m, d] = stats.statsDate.split("-").map(Number);
  const day = new Date(y, m - 1, d);
  return !selectedDate || day < selectedDate ? day : selectedDate;
}

export function emptyByproductStats(division: string, byproduct: string): ByproductNationalStats {
  return {
    hasData: false,
    product: division,
    byproduct,
    mostOccurringRateType: "Mandi Rate",
    otherRateTypesCount: 0,
    allRateTypes: ["Mandi Rate"],
    avgMin: 0,
    avgMax: 0,
    totalArrival: 0,
    markets: 0,
    specialAttr: null,
  };
}
