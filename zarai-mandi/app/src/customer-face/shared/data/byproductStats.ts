import { REAL_DATES_TIMELINE, getExcelTimeline } from "../../../data/realCommodityData";

import { getRowsForProducts, isMatchByproduct } from "./mandis";
import { toUrduDigits } from "../i18n/LangProvider";
import { type ByproductNationalStats, type LocationScope, type SpecialAttrInfo } from "../types";

// User-designated special attribute mapping per product/byproduct.
// Maps normalized (lowercase, alphanumeric only) product or byproduct names
// to one of: 'origin', 'newOld', 'color', 'variety', 'spec', 'quality', 'moisture', or null.
export const SPECIAL_PRODUCT_ATTRIBUTES: Record<string, SpecialAttrInfo['type'] | null> = {
  // VEGETABLE
  "bittergourd": "origin",
  "bottlegourd": "origin",
  "brinjalgol": "origin",
  "brinjallamba": "origin",
  "broccoli": "origin",
  "cabbage": "origin",
  "capsicum": "origin",
  "carrot": "origin",
  "cauliflower": "origin",
  "cucumber": "origin",
  "garlicchina": "origin",
  "garlicdesi": "origin",
  "ginger": "origin",
  "guar": "origin",
  "lemonchina": "origin",
  "lemondesi": "origin",
  "okra": "origin",
  "oniongradea": "newOld",
  "oniongradeb": "newOld",
  "oniongradec": "newOld",
  "pea": "origin",
  "potatobeej": "origin",
  "potatobeejgradea": "origin",
  "potatobeejgradeb": "origin",
  "potatobeejgradec": "origin",
  "potatogoli": "origin",
  "potatolr": "origin",
  "potatolaal": "newOld",
  "potatomozika": "newOld",
  "potatoraveera": "origin",
  "potatoraveeragradea": "origin",
  "potatoraveeragradeb": "origin",
  "potatoraveeragradec": "origin",
  "potatosanta": "origin",
  "potatostone": "origin",
  "potatostonegradea": "origin",
  "potatostonegradeb": "origin",
  "potatostonegradec": "origin",
  "potatosufaid": "origin",
  "ridgegourd": "origin",
  "roundgourd": "origin",
  "saladleaves": "origin",
  "shakarqandi": null,
  "spinach": "origin",
  "sweetpotato": "color",
  "tomatogradea": "origin",
  "tomatogradeb": "origin",
  "tomatogradec": "origin",
  "turnip": "origin",

  // WHEAT
  "chokar": null,
  "flour": null,
  "flourspecial": null,
  "refinedflour": null,
  "sooji": null,
  "sorghum": "color",
  "straw": null,
  "wheat": "newOld",
  "wheatbran": null,

  // EDIBLE OIL
  "canola": null,
  "canolameal": null,
  "canolaoil": null,
  "canolaseed": "newOld",
  "mustardcake": null,
  "mustardoil": null,
  "mustardseed": "newOld",
  "sarsokhal": null,
  "sarsooil": null,
  "soybean": null,
  "soybeanmeal": null,
  "soybeanoil": null,
  "soybeanoilwashed": null,
  "sunflower": null,
  "sunfloweroil": null,
  "sunflowerseed": null,
  "taarameera": null,
  "taarameeraoil": null,

  // PULSES (All None identified)
  "gramblackthick": null,
  "gramblackthin": null,
  "grampulsethick": null,
  "grampulsethickas": null,
  "grampulsethin": null,
  "grampulsethinas": null,
  "gramwhite7mm": null,
  "gramwhite9mm": null,
  "mashsabut2": null,
  "mashshellthick": null,
  "mashshellthin": null,
  "mashwashed1": null,
  "mashwashed2": null,
  "masoorpulsered": null,
  "masoorsabut1": null,
  "masoorsabut2": null,
  "moongsabut1": null,
  "moongsabut2": null,
  "moongshell1": null,
  "moongwashed1": null,
  "moongwashed2": null,
  "pigeonpeathick": null,
  "pigeonpeathin": null,
  "redlubya1": null,
  "redlubya2": null,
  "whitelubyathick": null,

  // RICE / PADDY
  "paddy1509": "newOld",
  "paddy1692": "newOld",
  "paddy1718": "newOld",
  "paddy1847": "newOld",
  "paddy86": "newOld",
  "paddyc9": "newOld",
  "paddyirri6": "newOld",
  "paddyirri9": "newOld",
  "paddyirrifine": "newOld",
  "paddykainat1121": "newOld",
  "paddylp18": "newOld",
  "paddypp7": "newOld",
  "paddysuper": "newOld",
  "paddysuper515": "newOld",
  "paddysupri": "newOld",

  // FRUITS
  "apple": "origin",
  "apricot": "origin",
  "banana": "origin",
  "cherry": "origin",
  "falsa": "origin",
  "fruiter": "origin",
  "grapefruit": "origin",
  "grapes": "origin",
  "kalakulluapple": "origin",
  "kharbooza": "origin",
  "mangoalmas": "origin",
  "mangoanwerratul": "origin",
  "mangoblackchunsa": "origin",
  "mangodasheri": "origin",
  "mangofajri": "origin",
  "mangosaroli": "origin",
  "mangosindhri": "origin",
  "mangowhitechunsa": "origin",
  "mausambi": "origin",
  "oranges": null,
  "papaya": "origin",
  "peach": "origin",
  "plum": "origin",
  "pomegranate": "origin",
  "sweetlime": "origin",
  "watermelon": "origin",

  // MILLED RICE
  "1121basmati1": null,
  "1121basmati2": "origin",
  "1121kacha": null,
  "1121steam": null,
  "1121white": null,
  "1509kacha": null,
  "1509sella": "origin",
  "1509steam": "origin",
  "1509steambasmati": null,
  "1509steamsila": null,
  "1509white": null,
  "1718kacha": null,
  "1718steam": null,
  "1847kacha": null,
  "1847steam": null,
  "386basmatinew": "origin",
  "386basmatiold": "origin",
  "c9basmati": null,
  "c9sila": "newOld",
  "c9steam": "newOld",
  "c9white": "newOld",
  "irri6": null,
  "irri6sabut1": "origin",
  "irri6white": null,
  "irri9": "newOld",
  "irritota": "origin",
  "kainatdoublesteam": null,
  "lal386new": "origin",
  "lal386old": "origin",
  "punia11211": "origin",
  "punia11212": "origin",
  "puniabasmati1": "origin",
  "ricehusk": null,
  "sella11211": "origin",
  "sella386": "newOld",
  "sellapunjab": "origin",
  "shortgraintota": null,
  "silky": "origin",
  "silkysortex": "origin",
  "superbasmatisindh": "origin",
  "superkernel": null,
  "suprinew": "origin",
  "supriold": null,
  "suprisila": "origin",
  "totabasmati": "origin",

  // MAIZE
  "cornsilage": null,
  "cornstarch": null,
  "maizegradea": "newOld",
  "maizegradeb": "newOld",
  "maizegradec": "newOld",
  "popcorn": "newOld",

  // COTTON
  "cottonseed": null,
  "cottonseedcake": null,
  "cottonseedoil": null,
  "seedcottongradea": "color",
  "seedcottongradeb": "color",
  "seedcottongradec": "color",
  "banola": null,
  "banolakhal": null,
  "banolaoil": null,
  "phuttia": null,
  "phuttib": null,
  "phuttic": null,

  // SPICES
  "blackpepper": null,
  "blackpepperpowder": null,
  "cinnamon": null,
  "clove": null,
  "corianderseed": null,
  "corianderseedpowder": null,
  "cuminblack": null,
  "cuminwhite": null,
  "fennel": null,
  "jaifal": null,
  "largeblackcardamom": null,
  "redchillipowder": null,
  "redchilliwhole": null,
  "smallcardamom": null,
  "turmeric": null,

  // SESAME
  "sesamegradea": "color",
  "sesamegradeb": "newOld",
  "sesamegradec": "newOld",

  // CHILLIES
  "desichilli": null,
  "greenchillilarge": "variety",
  "greenchillimedium": "variety",
  "greenchillismall": null,
  "hybirdchilli": "spec",
  "longichilli": "spec",
  "reddesichilli": "spec",
  "redhybirdchilli": "spec",
  "redlongichilli": "spec",
  "redrichstarchilli": "spec",
  "redshingrichilli": "spec",
  "redsummerqueenchilli": "spec",
  "richstarchilli": "newOld",
  "shingrichilli": null,

  // DRY-FRUITS
  "almondamerican": null,
  "almondaustralian": null,
  "almonddesi": null,
  "cashew": null,
  "fig": null,
  "largeraisins": null,
  "pistachio": null,
  "walnut": null,

  // OTHER VARIETIES
  "barley": null,
  "barseem": null,
  "camelina": null,
  "castorbean": null,
  "eggtray": "spec",
  "moongi": null,
  "oat": null,
  "quinoa": null,

  // DATES
  "ajwadates": null,
  "amberdates": null,
  "aseelchuara": null,
  "aseeldates": "origin",
  "begumjangidates": null,
  "blackaseelchuara": null,
  "dhakidrydates": null,
  "jamsordates": null,
  "karbaladates": null,
  "kupradates": null,
  "mazafatidates": null,
  "narchuara": null,
  "rabbidates": null,
  "rangkataseelchuara": null,
  "rangkatblackaseeldrydates": null,
  "rangkatdhakidrydates": null,
  "rangkatnarchuara": null,
  "zahididates": null,

  // MILLET
  "milletgradea": "color",
  "milletgradeb": "color",
  "milletgradec": "color",

  // SUGAR
  "jaggery": null,
  "refinedsugar": null,
  "shakkar": null,
  "millgate": null,
  "sugarmills": null,

  // HERBALS
  "chiaseed": null,
  "drylemon": null,
  "hing": null,
  "ispaghol": null,
  "ispagholhusk": null,
  "kalonji": null,
  "kalonjioil": null,
  "salabmisri": null,
  "salebpanja": null,
  "tukhmalanga": null,
  "zafran": null,

  // FODDER
  "alfalfa": null,
  "rhodegrass": null,

  // CLARIFIED BUTTER
  "asiaghee": null,
  "daldaghee": null,
  "kashmirghee": null,
  "khyberghee": null,
  "sufighee": null,
};

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
          valueUr: topVal.includes('٪') ? toUrduDigits(topVal) : toUrduDigits(topVal) + '٪',
          dotColor: '#38BDF8',
          filterFn: (r) => (r.moisture || '').trim() === topVal,
        };
      } else if (targetAttrType === 'newOld') {
        const isNew = topVal.toLowerCase().includes('new');
        specialAttr = {
          type: 'newOld',
          labelEn: 'Type',
          labelUr: 'معیار',
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

  // Exact Excel Timeline indexing for 100% calculation consistency across all screens
  const timeline = getExcelTimeline({
    product: targetProduct,
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
