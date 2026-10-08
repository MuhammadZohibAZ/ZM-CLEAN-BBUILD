import { REAL_DATES_TIMELINE, getExcelTimeline } from "../../../data/realCommodityData";

import { getRowsForProducts, isMatchByproduct } from "./mandis";
import { toUrduDigits } from "../i18n/LangProvider";
import specialAttributeSections from "./specialAttributes.json";
import { type ByproductNationalStats, type LocationScope, type SpecialAttrInfo } from "../types";

// User-designated special attribute per product/by-product, shared with the API
// (api/src/aggregate.js) so cards show the same attribute everywhere. Keys are
// normalized names (lowercase, alphanumeric only); see specialAttributes.json.
export const SPECIAL_PRODUCT_ATTRIBUTES: Record<string, SpecialAttrInfo['type'] | null> = Object.assign(
  {},
  ...Object.entries(specialAttributeSections)
    .filter(([section]) => !section.startsWith('_'))
    .map(([, entries]) => entries as Record<string, SpecialAttrInfo['type'] | null>)
);

export function getProductSpecialAttrType(
  byproduct?: string | null,
  product?: string | null
): SpecialAttrInfo['type'] | null {
  const norm = (s?: string | null) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const k1 = norm(byproduct);
  const k2 = norm(product);
  if (k1 in SPECIAL_PRODUCT_ATTRIBUTES) return SPECIAL_PRODUCT_ATTRIBUTES[k1];
  if (k2 in SPECIAL_PRODUCT_ATTRIBUTES) return SPECIAL_PRODUCT_ATTRIBUTES[k2];
  return null;
}

export function calculateByproductSummary(
  targetProduct: string,
  targetByproduct: string,
  locationScope?: LocationScope,
  selectedDate?: Date | null
): ByproductNationalStats {
  const pRows = getRowsForProducts([targetProduct]);
  const curDate = selectedDate || new Date(2026, 8, 14);
  const curDateStr = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, '0')}-${String(curDate.getDate()).padStart(2, '0')}`;
  const isDateInRange = curDateStr >= '2026-08-15' && curDateStr <= '2026-09-14';
  const dateIdx = isDateInRange ? REAL_DATES_TIMELINE.indexOf(curDateStr) : -1;

  if (!isDateInRange || dateIdx === -1) {
    return {
      hasData: false,
      product: targetProduct,
      byproduct: targetByproduct,
      mostOccurringRateType: 'Mandi Rate',
      otherRateTypesCount: 0,
      allRateTypes: ['Mandi Rate'],
      avgMin: 0,
      avgMax: 0,
      totalArrival: 0,
      markets: 0,
      specialAttr: null,
    };
  }

  const matchRows = pRows.filter((r) => {
    if (!isMatchByproduct(r.byproduct, targetByproduct)) return false;
    if (locationScope && locationScope.kind !== 'pakistan') {
      if (
        locationScope.kind === 'province' &&
        r.province.toLowerCase() !== locationScope.label.toLowerCase()
      )
        return false;
      if (
        locationScope.kind === 'district' &&
        r.mandiCity.toLowerCase() !== locationScope.label.toLowerCase() &&
        !r.mandiName.toLowerCase().includes(locationScope.label.toLowerCase())
      )
        return false;
      if (
        locationScope.kind === 'mandi' &&
        r.mandiName.toLowerCase() !== locationScope.label.toLowerCase() &&
        r.mandiCity.toLowerCase() !== locationScope.label.toLowerCase()
      )
        return false;
    }
    return true;
  });

  if (matchRows.length === 0) {
    return {
      hasData: false,
      product: targetProduct,
      byproduct: targetByproduct,
      mostOccurringRateType: 'Mandi Rate',
      otherRateTypesCount: 0,
      allRateTypes: ['Mandi Rate'],
      avgMin: 0,
      avgMax: 0,
      totalArrival: 0,
      markets: 0,
      specialAttr: null,
    };
  }

  // Count occurrences of price types in dataset
  const rtCounts: Record<string, number> = {};
  for (let i = 0; i < matchRows.length; i++) {
    const rt = matchRows[i].rateType || 'Mandi Rate';
    rtCounts[rt] = (rtCounts[rt] || 0) + 1;
  }
  const sortedRts = Object.entries(rtCounts).sort((a, b) => b[1] - a[1]);
  const mostOccurringRateType = sortedRts[0]?.[0] || 'Mandi Rate';
  const distinctRateTypes = Object.keys(rtCounts);

  // Rows for most occurring rate type
  const rtRows = matchRows.filter(
    (r) => (r.rateType || 'Mandi Rate') === mostOccurringRateType
  );

  let specialAttr: SpecialAttrInfo | null = null;
  const targetAttrType = getProductSpecialAttrType(targetByproduct, targetProduct);

  if (targetAttrType) {
    const valCounts: Record<string, number> = {};
    for (let i = 0; i < rtRows.length; i++) {
      const r = rtRows[i];
      let val = '';
      if (targetAttrType === 'moisture') val = r.moisture || '';
      else if (targetAttrType === 'newOld') val = r.newOld || '';
      else if (targetAttrType === 'color') val = r.color || '';
      else if (targetAttrType === 'variety') val = r.variety || '';
      else if (targetAttrType === 'spec') val = r.spec || '';
      else if (targetAttrType === 'origin') val = r.origin || r.province || '';
      else if (targetAttrType === 'quality') val = r.quality || '';

      const cleanVal = (val || '').trim();
      if (cleanVal && cleanVal.toLowerCase() !== 'null') {
        valCounts[cleanVal] = (valCounts[cleanVal] || 0) + 1;
      }
    }

    const sortedVals = Object.entries(valCounts).sort((a, b) => b[1] - a[1]);
    if (sortedVals.length > 0) {
      const topVal = sortedVals[0][0];
      if (targetAttrType === 'moisture') {
        specialAttr = {
          type: 'moisture',
          labelEn: 'Moisture',
          labelUr: 'نمی',
          valueEn: topVal.includes('%') ? topVal : topVal + '%',
          valueUr: topVal.includes('%') ? toUrduDigits(topVal) : toUrduDigits(topVal) + '%',
          dotColor: '#38BDF8',
          filterFn: (r) => (r.moisture || '').trim() === topVal,
        };
      } else if (targetAttrType === 'newOld') {
        const isNew = topVal.toLowerCase().includes('new');
        specialAttr = {
          type: 'newOld',
          labelEn: 'Crop',
          labelUr: 'فصل',
          valueEn: isNew ? 'New' : 'Old',
          valueUr: isNew ? 'نیا' : 'پرانا',
          dotColor: '#F59E0B',
          filterFn: (r) => (r.newOld || '').toLowerCase().includes(isNew ? 'new' : 'old'),
        };
      } else if (targetAttrType === 'color') {
        const colorUrduMap: Record<string, string> = {
          Brown: "براؤن",
          Golden: "سنہرا",
          White: "سفید",
          Yellow: "پیلا",
          Red: "سرخ",
          Green: "سبز",
          Black: "کالا",
        };
        specialAttr = {
          type: 'color',
          labelEn: 'Color',
          labelUr: 'رنگ',
          valueEn: topVal,
          valueUr: colorUrduMap[topVal] || topVal,
          dotColor: '#FBBF24',
          filterFn: (r) => (r.color || '').trim().toLowerCase() === topVal.toLowerCase(),
        };
      } else if (targetAttrType === 'variety') {
        specialAttr = {
          type: 'variety',
          labelEn: 'Variety',
          labelUr: 'قسم',
          valueEn: topVal,
          valueUr: topVal,
          dotColor: '#10B981',
          filterFn: (r) => (r.variety || '').trim() === topVal,
        };
      } else if (targetAttrType === 'spec') {
        const specUrduMap: Record<string, string> = {
          Dry: "خشک",
          Fresh: "تازہ",
        };
        specialAttr = {
          type: 'spec',
          labelEn: 'Spec',
          labelUr: 'تفصیل',
          valueEn: topVal,
          valueUr: specUrduMap[topVal] || topVal,
          dotColor: '#EF4444',
          filterFn: (r) => (r.spec || '').trim() === topVal,
        };
      } else if (targetAttrType === 'origin') {
        specialAttr = {
          type: 'origin',
          labelEn: 'Origin',
          labelUr: 'علاقہ',
          valueEn: topVal,
          valueUr: topVal,
          dotColor: '#10B981',
          filterFn: (r) => (r.origin || '').trim() === topVal || (r.province || '').trim() === topVal,
        };
      } else if (targetAttrType === 'quality') {
        specialAttr = {
          type: 'quality',
          labelEn: 'Quality',
          labelUr: 'معیار',
          valueEn: topVal,
          valueUr: topVal,
          dotColor: '#10B981',
          filterFn: (r) => (r.quality || '').trim() === topVal,
        };
      }
    }
  }

  // The timeline index is keyed by the dataset's product (e.g. "Vegetable"),
  // which differs from a vertical's sub-product (e.g. "Potato"); looking it up
  // by the sub-product misses and falls back to placeholder prices.
  const dataProduct = matchRows[0]?.product || targetProduct;

  // Exact Excel Timeline indexing for 100% calculation consistency across all screens
  const timeline = getExcelTimeline({
    product: dataProduct,
    byproduct: targetByproduct,
    locationLabel: locationScope?.label,
    locationKind: locationScope?.kind,
    rateType: mostOccurringRateType,
    range: 'year',
  });

  const avgMin = timeline.mins[dateIdx] ?? 0;
  const avgMax = timeline.maxs[dateIdx] ?? 0;
  const totalArrival = timeline.arrivals[dateIdx] ?? 0;

  // Active markets count
  const dateRows = matchRows.filter((r) => r.date === curDateStr);
  const marketSet = new Set<string>();
  for (let i = 0; i < dateRows.length; i++) {
    const r = dateRows[i];
    marketSet.add(r.mandiName || r.mandiCity || 'Mandi');
  }
  const markets = marketSet.size > 0 ? marketSet.size : (avgMin > 0 ? 30 : 0);

  const hasData = avgMin > 0 || avgMax > 0 || totalArrival > 0;

  return {
    hasData,
    product: targetProduct,
    byproduct: targetByproduct,
    mostOccurringRateType,
    otherRateTypesCount: Math.max(0, distinctRateTypes.length - 1),
    allRateTypes: distinctRateTypes,
    avgMin,
    avgMax,
    totalArrival,
    markets,
    specialAttr,
  };
}
