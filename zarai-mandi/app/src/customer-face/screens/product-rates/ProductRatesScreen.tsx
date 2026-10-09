import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ExpandableMandiMapCard from "../../../components/ExpandableMandiMapCard";
import type { MapByProductRecord } from "../../../components/ZaraiMandiMap";
import { getDeclaredMoistureBand, getProductSpecialAttrType } from "../../shared/data/byproductStats";
import { getDivisionForProduct, isProductTodayOnly } from "../../shared/data/catalog";
import { getProvinceFromLoc } from "../../shared/data/mandis";
import { ALL_RATE_TYPES } from "../../shared/data/rates";
import { URDU_FONT, useLang } from "../../shared/i18n/LangProvider";
import type { LocationScope } from "../../shared/types";
import { speakText } from "../../shared/voice";
import { MultiLocSheet } from "../../sheets/MultiLocSheet";
import { AppBar, type Tab } from "./AppBar";
import { BestPlaces } from "./BestPlaces";
import { FilterDock, type FilterUiProps } from "./FilterDock";
import { FilterDrawer } from "./FilterDrawer";
import { FilterRail } from "./FilterRail";
import { makeFmt, shortRate, stripMandi } from "./format";
import { MandiDetailSheet } from "./MandiDetailSheet";
import { MandiSection } from "./MandiSection";
import { PriceHero } from "./PriceHero";
import { PickerSheet } from "./PickerSheet";
import {
  ALL_RATES,
  dateBefore,
  filterOptions,
  inScope,
  mandiEntries,
  passesFilters,
  primaryAttr,
  sortEntries,
  statsFor,
} from "./selectors";
import { C, ensureFonts } from "./theme";
import { attrLabel, attrValue } from "./Filters";
import { TrendsTab } from "./TrendsTab";
import type { AttrFilters, AttrKey, ChangeInterval, MarketRow, ProductRatesProps, SortKey } from "./types";
import { TIMELINE, useMarketData } from "./useMarketData";
import "./productRates.css";
import { Swiper3D } from "./Swiper3D";

const SPARK_DAYS = 30;

// Which filter UI the Overview uses. All three are complete:
//   "rail"   – always-visible bar under the tabs (current)
//   "drawer" – pull-down drawer with a summary grip
//   "dock"   – floating island at the bottom
const FILTER_UI = "rail" as "rail" | "drawer" | "dock";

const PAKISTAN: LocationScope = { kind: "pakistan", label: "All Pakistan" };

function normaliseRate(raw?: string) {
  const r = (raw || "").trim().toLowerCase();
  if (!r) return ALL_RATES;
  return ALL_RATE_TYPES.find((t) => t.toLowerCase() === r || t.toLowerCase().startsWith(r)) || ALL_RATES;
}

/**
 * Product Rates: one by-product's prices across Pakistan.
 * Overview answers "what is the rate today, here" first, then lists every
 * mandi; Trends shows how rates and arrivals moved over the reported month.
 */
export function ProductRatesScreen({
  vertical,
  product,
  byproduct,
  onBack,
  push,
  isPickedBP = () => false,
  togglePickBP = () => { },
  initialRateType,
  initialMandi,
  initialVariety,
  initialNewOld,
  initialColor,
  initialSpec,
  initialCondition,
  initialOrigin,
  initialMoisture,
  initialStatDate,
}: ProductRatesProps) {
  const { lang, t, tc, tm, tr, voiceEnabled } = useLang();
  const f = makeFmt(lang);
  useEffect(ensureFonts, []);

  const name = byproduct || product;
  const [tab, setTab] = useState<Tab>("overview");
  const [scope, setScope] = useState<LocationScope>(initialMandi ? { kind: "mandi", label: initialMandi } : PAKISTAN);
  const [rate, setRate] = useState(() => normaliseRate(initialRateType));
  const [filters, setFilters] = useState<AttrFilters>(() => ({
    variety: initialVariety || undefined,
    newOld: initialNewOld || undefined,
    color: initialColor || undefined,
    spec: initialSpec || undefined,
    quality: initialCondition || undefined,
    origin: initialOrigin || undefined,
    moisture: initialMoisture || undefined,
  }));
  // The rate and attributes the tapped card opened with. While they're unchanged
  // the filter rail shows a dropdown arrow, not a clear ✕.
  const arrival = useRef({ rate, filters }).current;
  const sameFilters = (a: AttrFilters, b: AttrFilters) =>
    [...new Set([...Object.keys(a), ...Object.keys(b)])].every((k) => (a[k as keyof AttrFilters] || undefined) === (b[k as keyof AttrFilters] || undefined));
  const [date, setDate] = useState<string>("");
  const [listProvince, setListProvince] = useState<string | null>(null);
  // Mandi table: nothing selected by default (reports in their own order).
  const [sort, setSort] = useState<SortKey>("none");
  const [interval, setChangeInterval] = useState<ChangeInterval>(1);
  const [locSheet, setLocSheet] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [ovPage, setOvPage] = useState(0);
  const [headerCompact, setHeaderCompact] = useState(false);
  const [detail, setDetail] = useState<{ mandi: string; rate: string } | null>(null);

  const say = (en: string, ur: string) => voiceEnabled && speakText(f.tx(en, ur));

  const { rows, dates, timelines, loading, error } = useMarketData(getDivisionForProduct(vertical, product), name, scope);
  const latest = dates[dates.length - 1] || TIMELINE[TIMELINE.length - 1];
  const lockHistory = isProductTodayOnly(product);

  // Pick the starting day once reports arrive: the requested day if it has
  // reports (and history is not locked), otherwise the latest day with reports
  // for the card's rate and attribute (the newest day can be a partial export).
  useEffect(() => {
    if (!dates.length) return;
    const wanted = initialStatDate ? initialStatDate.slice(0, 10) : "";
    if (!date || !dates.includes(date) || (lockHistory && date !== latest)) {
      if (lockHistory) return setDate(latest);
      const matching = new Set(rows.filter((r) => passesFilters(r, arrival.filters, arrival.rate)).map((r) => r.date));
      const upTo = dates.includes(wanted) ? wanted : latest;
      setDate([...dates].reverse().find((d) => d <= upTo && matching.has(d)) || upTo);
    }
  }, [dates, latest, lockHistory]); // eslint-disable-line react-hooks/exhaustive-deps
  const day = date || latest;

  // The mandi list covers the chosen location's province (all of Pakistan by default).
  useEffect(() => {
    setListProvince(scope.kind === "pakistan" ? null : getProvinceFromLoc(scope) || null);
  }, [scope.kind, scope.label]);

  // ─── Derived data ─────────────────────────────────────────────
  const keep = (r: MarketRow) => passesFilters(r, filters, rate);
  // Mandi + district names that have reports, so the location sheet lists them first.
  const dataMandiNames = useMemo(
    () => new Set(rows.flatMap((r) => [r.mandiName, r.district].filter(Boolean).map((x) => x.toLowerCase().trim()))),
    [rows],
  );
  const scopeFilter = useCallback((r: MarketRow) => inScope(r, scope), [scope]);
  const scopeRows = useMemo(() => rows.filter((r) => inScope(r, scope)), [rows, scope]);
  const dayRows = scopeRows.filter((r) => r.date === day && keep(r));
  const stats = statsFor(dayRows);
  const prevDay = dateBefore(dates, day, 1);
  const prevStats = prevDay ? statsFor(scopeRows.filter((r) => r.date === prevDay && keep(r))) : null;
  const nationalDayRows = useMemo(() => rows.filter((r) => r.date === day && passesFilters(r, filters, ALL_RATES)), [rows, day, filters]);
  const nationalMid = statsFor(rows.filter((r) => r.date === day && keep(r))).mid;

  const scopeDayAnyRate = scopeRows.filter((r) => r.date === day && passesFilters(r, filters, ALL_RATES));
  const availableRates = new Set(scopeDayAnyRate.map((r) => r.rateType));
  const filterGroups = filterOptions(scopeRows.filter((r) => r.date === day && passesFilters(r, {}, rate)));

  const entries = useMemo(
    () =>
      sortEntries(
        mandiEntries(rows, dates, day, interval, (r) => passesFilters(r, filters, rate) && (!listProvince || r.province === listProvince)),
        sort,
        scope.kind === "mandi" ? scope.label : undefined,
      ),
    [rows, dates, day, interval, filters, rate, listProvince, sort, scope],
  );

  // Same maths as the headline number, so tapping a day shows matching values.
  const sparkSource = useMemo(() => {
    const byDay = new Map<string, MarketRow[]>();
    for (const r of scopeRows) {
      if (!passesFilters(r, filters, rate)) continue;
      byDay.set(r.date, [...(byDay.get(r.date) || []), r]);
    }
    return TIMELINE.map((d) => statsFor(byDay.get(d) || []).mid);
  }, [scopeRows, filters, rate]);

  // The hero sparkline shows a month (the year lives in the Trends tab). It ends
  // on the latest day and only moves back when an older day is picked.
  const [sparkEnd, setSparkEnd] = useState(() => TIMELINE.length);
  useEffect(() => {
    const i = TIMELINE.indexOf(day);
    if (i < 0) return;
    setSparkEnd((end) => (i >= end - SPARK_DAYS && i < end ? end : Math.min(TIMELINE.length, i + 1 + Math.floor(SPARK_DAYS / 2))));
  }, [day]);
  const sparkStart = Math.max(0, sparkEnd - SPARK_DAYS);
  const sparkDates = TIMELINE.slice(sparkStart, sparkEnd);

  // ─── Labels ───────────────────────────────────────────────────
  const scopeRow = scopeRows[0];
  const province =
    scope.kind === "pakistan" ? "Pakistan" : scope.kind === "province" ? scope.label : scopeRow?.province || getProvinceFromLoc(scope) || "Pakistan";
  const locationLabel =
    scope.kind === "pakistan"
      ? f.tx("All Pakistan", "پورا پاکستان")
      : scope.kind === "province"
        ? f.tx(`${scope.label} province`, `صوبہ ${tm(scope.label)}`)
        : scope.kind === "district"
          ? f.tx(`${scope.label} district`, `ضلع ${tm(scope.label)}`)
          : f.tx(`${stripMandi(scope.label)} Mandi`, `${tm(stripMandi(scope.label))} منڈی`);
  const bandLabel =
    (scope.kind === "mandi" || scope.kind === "district") && scopeRow
      ? // District / province add context the pill doesn't show (skip repeats).
      [scopeRow.district, scopeRow.province]
        .filter((x, k, a) => x && a.indexOf(x) === k && x.toLowerCase() !== stripMandi(scope.label).toLowerCase())
        .map((x) => tm(x))
        .join(", ")
      : locationLabel;
  // The pill only needs the place name ("Multan"), not "Multan Mandi".
  const pillLabel = scope.kind === "mandi" ? tm(stripMandi(scope.label)) : locationLabel;
  const rateLabel = rate === ALL_RATES ? f.tx("All rate types", "تمام ریٹ") : f.tx(`${shortRate(rate)} rate`, tr(rate));

  const heroChange = prevStats && prevStats.mid > 0 && stats.mid > 0 ? ((stats.mid - prevStats.mid) / prevStats.mid) * 100 : null;
  const heroDir = heroChange === null ? 0 : heroChange > 0.05 ? 1 : heroChange < -0.05 ? -1 : 0;
  const heroChangeText =
    heroChange === null
      ? ""
      : heroDir === 0
        ? f.tx("No change", "کوئی تبدیلی نہیں")
        : `${heroDir > 0 ? "▲" : "▼"} ${f.pct(heroChange)}`;

  const speakHero = () => {
    if (!stats.count) return;
    speakText(
      f.tx(
        `${name} in ${locationLabel}, ${rateLabel}, ${Math.round(stats.min)} to ${Math.round(stats.max)} rupees per 40 kilo`,
        `${tc(name)}، ${locationLabel}، ${rateLabel}، ${Math.round(stats.min)} سے ${Math.round(stats.max)} روپے فی چالیس کلو`,
      ),
    );
  };

  // Map pins follow the screen's filters (rate type + attributes), like the
  // table and charts. "All" = the same by-product and rate type with every
  // value of its special attribute (e.g. New and Old), a colour per value.
  const toMapRecord = (r: MarketRow): MapByProductRecord => ({
    mandiName: r.mandiName,
    district: r.district,
    province: r.province,
    rateType: r.rateType,
    min: r.min,
    max: r.max,
    arrival: r.arrival,
    date: r.date,
    newOld: r.newOld,
    variety: r.variety,
    color: r.color,
  });
  const mapRecords: MapByProductRecord[] = useMemo(() => rows.filter(keep).map(toMapRecord), [rows, filters, rate]);
  const mapColorKey = (primaryAttr(getProductSpecialAttrType(byproduct, product)) ?? "newOld") as keyof MapByProductRecord;

  const pickItem = {
    vertical,
    product,
    byproduct: name,
    mandiName: scope.kind === "mandi" ? scope.label : undefined,
    rateType: rate === ALL_RATES ? undefined : rate,
  };
  const picked = isPickedBP(pickItem);

  // Filters: shared props for whichever filter surface is active.
  const filterUi: FilterUiProps = {
    f,
    t,
    locationLabel: pillLabel,
    onOpenLocation: () => {
      setLocSheet(true);
      say("Select location", "مقام کا انتخاب");
    },
    dates,
    date: day,
    latest,
    onDate: setDate,
    lockHistory,
    rate,
    rates: [
      { id: ALL_RATES, label: f.tx("All rates", "تمام ریٹ"), count: new Set(scopeDayAnyRate.map((r) => r.mandiName)).size },
      ...[...ALL_RATE_TYPES]
        .map((rt) => ({ id: rt, label: shortRate(tr(rt)), count: new Set(scopeDayAnyRate.filter((r) => r.rateType === rt).map((r) => r.mandiName)).size }))
        .sort((a, b) => Number(b.count > 0) - Number(a.count > 0)),
    ],
    onRate: setRate,
    groups: filterGroups,
    filters,
    onFilters: setFilters,
    rateFromCard: rate !== ALL_RATES && rate === arrival.rate,
    filtersFromCard: Object.values(filters).some(Boolean) && sameFilters(filters, arrival.filters),
    resultCount: stats.mandis,
    isDefault: scope.kind === "pakistan" && day === latest && rate === ALL_RATES && !Object.values(filters).some(Boolean),
    locationActive: scope.kind !== "pakistan",
    onClearLocation: () => setScope(PAKISTAN),
    onReset: () => {
      setScope(PAKISTAN);
      setDate(latest);
      setRate(ALL_RATES);
      setFilters({});
    },
  };

  // Active attributes for PriceHero card (both initial from by-product card and any filter attributes chosen)
  const activeAttrs = useMemo(() => {
    const list: Array<{ key: string; label: string; value: string; display: string }> = [];
    const targetType = getProductSpecialAttrType(byproduct, product);
    const primaryKey = primaryAttr(targetType);

    // 1. Any filters explicitly set by user (or initialized from card)
    const filterKeys = (Object.keys(filters) as AttrKey[]).filter((k) => Boolean(filters[k]));
    for (const key of filterKeys) {
      const val = filters[key]!;
      const label = attrLabel(f, key);
      const translatedVal = attrValue(f, t, key, val);
      let display = translatedVal;
      if (key === "newOld") {
        display = val.toLowerCase() === "new" ? f.tx("New", "نیا") : val.toLowerCase() === "old" ? f.tx("Old", "پرانا") : translatedVal;
      }
      list.push({ key, label, value: val, display });
    }

    // 2. A maize grade's declared moisture band (A 11-14%, B 14-16%, ...) describes the grade.
    const band = primaryKey === "moisture" ? getDeclaredMoistureBand(byproduct) : null;
    if (band && !filters.moisture) {
      list.push({ key: "moisture", label: attrLabel(f, "moisture"), value: band, display: attrValue(f, t, "moisture", band) });
    }

    // 3. If no filter is set for the byproduct's primary special attribute, check if all day rows share a single unique attribute
    if (primaryKey && !filters[primaryKey] && !band) {
      const uniqueValues = Array.from(
        new Set(dayRows.map((r) => r[primaryKey] as string).filter(Boolean))
      );
      if (uniqueValues.length === 1) {
        const val = uniqueValues[0];
        const label = attrLabel(f, primaryKey);
        const translatedVal = attrValue(f, t, primaryKey, val);
        let display = translatedVal;
        if (primaryKey === "newOld") {
          display = val.toLowerCase() === "new" ? f.tx("New", "نیا") : val.toLowerCase() === "old" ? f.tx("Old", "پرانا") : translatedVal;
        }
        if (!list.some((item) => item.key === primaryKey)) {
          list.push({ key: primaryKey, label, value: val, display });
        }
      }
    }

    return list;
  }, [byproduct, product, dayRows, filters, f, t]);

  return (
    <div
      className="zm-product-rates flex flex-col h-full min-h-0 overflow-hidden screen-enter"
      dir={f.dir}
      style={{ position: "relative", background: C.ground, color: C.ink, fontFamily: f.font, width: "100%", minWidth: 0, maxWidth: "100%" }}
    >
      <AppBar
        f={f}
        title={tc(name)}
        vertical={vertical}
        iconName={name}
        picked={picked}
        onBack={onBack}
        onToggleFav={() => {
          togglePickBP(pickItem);
          say(picked ? "Removed from favourites" : "Added to favourites", picked ? "پسندیدہ سے ہٹا دیا گیا" : "پسندیدہ میں شامل کر دیا گیا");
        }}
        tab={tab}
        onTab={(next) => {
          setTab(next);
          setHeaderCompact(false);
          say(next === "overview" ? "Overview" : "Trends", next === "overview" ? "جائزہ" : "رجحانات");
        }}
        compact={headerCompact && tab === "overview" && stats.count > 0 ? { price: f.rs(stats.mid), change: heroChangeText, dir: heroDir } : null}
      />

      <div
        ref={scrollRef}
        className="zm-hide-scrollbar"
        onScroll={(e) => {
          const on = e.currentTarget.scrollTop > 330;
          if (on !== headerCompact) setHeaderCompact(on);
        }}
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
        }}
      >
        {FILTER_UI === "rail" && <FilterRail {...filterUi} showDate={tab === "overview"} />}
        {tab === "overview" && FILTER_UI === "drawer" && <FilterDrawer {...filterUi} scrollRef={scrollRef} />}

        {error && (
          <div role="alert" style={{ margin: "0 16px 12px", padding: "12px 14px", borderRadius: 14, background: C.downTint, color: C.down, fontSize: 13, fontWeight: 600 }}>
            {f.tx("Could not load rates. Check your connection and try again.", "ریٹس لوڈ نہیں ہو سکے۔ انٹرنیٹ چیک کریں۔")}
          </div>
        )}

        {tab === "overview" ? (
          <div key="overview" className="zm-tab-in" style={{ display: "flex", flexDirection: "column" }}>
            <Swiper3D
              f={f}
              label={f.tx("Overview cards", "جائزہ کارڈز")}
              index={ovPage}
              onIndex={setOvPage}
              pages={[
                {
                  key: "price-hero",
                  label: f.tx("Price overview", "قیمت کا جائزہ"),
                  node: (
                    <PriceHero
                      f={f}
                      bandLabel={scope.kind === "mandi" || scope.kind === "district" ? bandLabel : ""}
                      rateLabel={rate === ALL_RATES ? "" : rateLabel}
                      date={day}
                      isLatest={day === latest}
                      prevDate={prevDay}
                      onPickDay={(i) => {
                        const d = sparkDates[i];
                        if (dates.includes(d) && !(lockHistory && d !== latest)) setDate(d);
                      }}
                      stats={stats}
                      prev={prevStats}
                      nationalMid={nationalMid}
                      isMandi={scope.kind === "mandi"}
                      spark={{ dates: sparkDates, series: [{ color: C.brand, values: sparkSource.slice(sparkStart, sparkEnd) }], idx: Math.max(0, sparkDates.indexOf(day)) }}
                      onListen={speakHero}
                      lockHistory={lockHistory}
                      onSubscribe={() => push?.({ id: "billing", product, vertical })}
                      loading={loading}
                      emptyMessage={f.tx(`No reports for ${locationLabel} on ${f.day(day)} with these choices.`, `${f.day(day)} کو ${locationLabel} کی کوئی رپورٹ نہیں۔`)}
                      onClearScope={() => setScope(PAKISTAN)}
                      activeAttrs={activeAttrs}
                    />
                  ),
                },
                {
                  key: "best-map",
                  label: f.tx("Best Places & Map", "بہترین منڈیاں اور نقشہ"),
                  node: (
                    <div style={{ padding: "16px 6px 0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                      {!loading && (
                        <BestPlaces
                          f={f}
                          tm={tm}
                          tr={tr}
                          dayRows={nationalDayRows}
                          rate={rate}
                          onOpen={(mandi, rt) => setDetail({ mandi, rate: rt })}
                          compact
                        />
                      )}

                      <ExpandableMandiMapCard
                        mandiName={scope.kind === "pakistan" ? f.tx("All Pakistan", "پورا پاکستان") : scope.label}
                        provinceName={province === "Pakistan" ? undefined : province}
                        commodityName={tc(name)}
                        records={mapRecords}
                        day={day}
                        colorKey={mapColorKey}
                        filterBar={<FilterRail {...filterUi} showDate variant="map" />}
                        focusMandiName={scope.kind === "mandi" || scope.kind === "district" ? scope.label : undefined}
                        focusProvinceName={scope.kind === "province" ? scope.label : undefined}
                        lang={lang}
                        urduFont={URDU_FONT}
                        onSelectMandi={(name) => setDetail({ mandi: name, rate })}
                        compact
                      />
                    </div>
                  ),
                },
              ]}
            />

            <MandiSection
              f={f}
              t={t}
              tm={tm}
              tr={tr}
              entries={entries}
              date={day}
              regionLabel={listProvince ? tm(listProvince) : undefined}
              rateLabel={rate === ALL_RATES ? "" : rateLabel}
              rate={rate}
              rates={filterUi.rates}
              onRate={setRate}
              sort={sort}
              onSort={setSort}
              interval={interval}
              onInterval={setChangeInterval}
              selectedMandi={scope.kind === "mandi" ? scope.label : undefined}
              primary={primaryAttr(getProductSpecialAttrType(byproduct, product))}
              loading={loading}
              onOpen={(e) => {
                setDetail({ mandi: e.row.mandiName, rate: e.row.rateType });
                const m = stripMandi(e.row.mandiName);
                say(
                  `${m} Mandi, ${e.row.rateType}, ${Math.round(e.row.min)} to ${Math.round(e.row.max)} rupees`,
                  `${tm(m)} منڈی، ${shortRate(tr(e.row.rateType))}، ریٹ ${Math.round(e.row.min)} سے ${Math.round(e.row.max)} روپے`,
                );
              }}
            />
            <div style={{ height: FILTER_UI === "dock" ? 116 : "calc(env(safe-area-inset-bottom, 0px) + 96px)" }} />
          </div>
        ) : (
          <div key="trends" className="zm-tab-in" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)" }}>
            <TrendsTab
              f={f}
              tr={tr}
              tm={tm}
              lang={lang}
              timelines={timelines}
              allRows={rows}
              initialRate={rate}
              filters={filters}
              scopeProvinceFilter={scopeFilter}
              onOpenMandi={(mandi, rt) => setDetail({ mandi, rate: rt })}
              locationLabel={pillLabel}
              onOpenLocation={() => setLocSheet(true)}
              activeAttrs={activeAttrs}
            />
          </div>
        )}
      </div>

      {tab === "overview" && FILTER_UI === "dock" && <FilterDock {...filterUi} />}

      {locSheet && (
        <MultiLocSheet
          singleSelect
          selected={scope.kind !== "pakistan" ? [scope] : []}
          dataMandiNames={dataMandiNames}
          onApply={(locs) => {
            setScope(locs.length === 0 || locs.some((x) => x.kind === "pakistan") ? PAKISTAN : locs[0]);
            setLocSheet(false);
          }}
          onClose={() => setLocSheet(false)}
        />
      )}

      {detail && (
        <MandiDetailSheet
          f={f}
          t={t}
          tm={tm}
          tr={tr}
          byproductName={tc(name)}
          byproductIcon={name}
          vertical={vertical}
          mandiName={detail.mandi}
          initialRate={detail.rate}
          allRows={rows}
          dates={dates}
          date={day}
          onClose={() => setDetail(null)}
          onListen={(text) => speakText(text)}
          onSetLocation={() => {
            setScope({ kind: "mandi", label: detail.mandi });
            setDetail(null);
          }}
        />
      )}
    </div>
  );
}

// Kept for anything that still relies on the old exports.
export const fmt = (n: number) => (n >= 100000 ? `Rs.${(n / 100000).toFixed(1)}L` : `Rs.${n.toLocaleString("en-PK")}`);
