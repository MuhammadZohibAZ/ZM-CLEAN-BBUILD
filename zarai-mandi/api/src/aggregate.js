// Core price/arrival aggregation, implementing
// docs/Zarai_Mandi_Mandatory_Optional_Attributes_and_Card_Policy.pdf.
//
// Known, documented deviations from the policy (the source export doesn't
// carry what the policy asks for — see policy section 2's own note: "no
// stable quote ID, revision timestamp, source ID, independent price unit
// or arrival-event ID"):
//   - "Quote identity / revisions": we cannot prove two same-market-day
//     rows are duplicates vs. distinct reporters, so every valid row is
//     averaged as a distinct observation (policy: "do not guess that same
//     market/day/rate means duplicate").
//   - "Arrival unique identity": same limitation: we sum one arrival
//     weight per (market, day, attribute-tuple), taking the row with the
//     highest row_num as an ingestion-order "latest" proxy, and always
//     label the result as an approximation with its contributing-market
//     count alongside it.

import fs from "node:fs";

import { pool } from "./db.js";

// Card field qualification (the ">=80% filled -> show it" rule) and the
// dominant price type are computed live from by_product_attribute_stats /
// price_records on every request, not transcribed from a point-in-time PDF
// brief. That table is rebuilt by api/db/etl_sqlite.py from the current
// month's xlsx, so this stays correct for every catalog entry (not just a
// hand-curated subset) and never drifts when the catalog's IDs change.
const ATTR_DB_TO_TYPE = {
  moisture: "moisture",
  new_old: "newOld",
  color: "color",
  variety: "variety",
  specification: "spec",
  origin: "origin",
  quality: "quality",
};


const ATTRIBUTE_COLUMNS = {
  color: "color",
  newOld: "new_old",
  origin: "origin",
  variety: "variety",
  specification: "specification",
  quality: "quality",
};

function buildAttributeFilter(filters, params) {
  const clauses = [];
  for (const [key, column] of Object.entries(ATTRIBUTE_COLUMNS)) {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== "") {
      params.push(value);
      clauses.push(`${column} = $${params.length}`);
    }
  }
  return clauses;
}

async function resolveByProduct(byProductId) {
  const { rows } = await pool.query(
    `select id, product, matched_by_product as by_product, display_name,
            moisture_rule_band, has_data
     from by_products where id = $1`,
    [byProductId]
  );
  return rows[0] || null;
}

async function defaultPriceType(product, byProduct, filters) {
  const params = [product, byProduct];
  const attrClauses = buildAttributeFilter(filters, params);
  const { rows } = await pool.query(
    `select price_type, count(*) as n
     from price_records
     where product = $1 and by_product = $2 and price_valid
       ${attrClauses.length ? "and " + attrClauses.join(" and ") : ""}
       and price_type is not null
     group by price_type
     order by n desc
     limit 1`,
    params
  );
  return rows[0]?.price_type ?? null;
}

/**
 * Market-balanced Avg Min / Avg Max per policy section 3:
 * quote -> market-day average -> market average (over its valid days) ->
 * card average (equal weight per market).
 */
export async function getPriceSummary(byProductId, filters = {}) {
  const byProduct = await resolveByProduct(byProductId);
  if (!byProduct) return null;

  let priceType = filters.priceType || null;
  let priceTypeWasDefaulted = false;
  if (!priceType) {
    priceType = await defaultPriceType(byProduct.product, byProduct.by_product, filters);
    priceTypeWasDefaulted = true;
  }

  if (!priceType) {
    return {
      byProductId,
      displayName: byProduct.display_name,
      priceType: null,
      priceTypeWasDefaulted: false,
      avgMin: null,
      avgMax: null,
      priceMarketCount: 0,
      eligibleRecordCount: 0,
      noData: true,
      reason: "no_eligible_prices",
    };
  }

  const params = [byProduct.product, byProduct.by_product, priceType];
  const attrClauses = buildAttributeFilter(filters, params);
  const attrSql = attrClauses.length ? "and " + attrClauses.join(" and ") : "";

  const sql = `
    with eligible as (
      select * from price_records
      where product = $1 and by_product = $2 and price_valid
        and price_type = $3
        and province is not null and district is not null and station is not null
        ${attrSql}
    ),
    market_day as (
      select province, district, station, record_date,
             avg(minimum) as md_min, avg(maximum) as md_max, count(*) as quote_count
      from eligible
      group by province, district, station, record_date
    ),
    market as (
      select province, district, station,
             avg(md_min) as m_min, avg(md_max) as m_max, count(*) as day_count
      from market_day
      group by province, district, station
    )
    select
      (select count(*) from eligible) as eligible_record_count,
      (select count(distinct record_date) from eligible) as coverage_days,
      round(avg(m_min)::numeric, 2) as card_avg_min,
      round(avg(m_max)::numeric, 2) as card_avg_max,
      count(*) as price_market_count
    from market
  `;

  const { rows } = await pool.query(sql, params);
  const row = rows[0];
  const priceMarketCount = Number(row.price_market_count);

  if (priceMarketCount === 0) {
    return {
      byProductId,
      displayName: byProduct.display_name,
      priceType,
      priceTypeWasDefaulted,
      avgMin: null,
      avgMax: null,
      priceMarketCount: 0,
      eligibleRecordCount: 0,
      coverageDays: 0,
      noData: true,
      reason: "no_eligible_prices",
    };
  }

  return {
    byProductId,
    displayName: byProduct.display_name,
    priceType,
    priceTypeWasDefaulted,
    avgMin: Number(row.card_avg_min),
    avgMax: Number(row.card_avg_max),
    priceMarketCount,
    eligibleRecordCount: Number(row.eligible_record_count),
    coverageDays: Number(row.coverage_days),
    noData: false,
  };
}

/**
 * Arrival summary per policy section 4. Prices and arrivals are
 * different observation pools — this ignores the selected price_type and
 * only applies the selected special-attribute tuple.
 */
export async function getArrivalSummary(byProductId, filters = {}) {
  const byProduct = await resolveByProduct(byProductId);
  if (!byProduct) return null;

  const params = [byProduct.product, byProduct.by_product];
  const attrClauses = buildAttributeFilter(filters, params);
  const attrSql = attrClauses.length ? "and " + attrClauses.join(" and ") : "";

  // one arrival figure per (market, day) using the highest row_num as an
  // ingestion-order "latest accepted total" proxy (see module docstring).
  const sql = `
    with eligible as (
      select * from price_records
      where product = $1 and by_product = $2
        and arrival_weight_known
        and province is not null and district is not null and station is not null
        ${attrSql}
    ),
    market_day as (
      select province, district, station, record_date, arrival_weight_kg
      from (
        select province, district, station, record_date, arrival_weight_kg,
               row_number() over (partition by province, district, station, record_date order by row_num desc) as rn
        from eligible
      )
      where rn = 1
    ),
    market_total as (
      select province, district, station, sum(arrival_weight_kg) as market_kg
      from market_day
      group by province, district, station
    ),
    price_locations as (
      select count(distinct (province || char(31) || district || char(31) || station)) as n
      from price_records
      where product = $1 and by_product = $2 and price_valid
        and province is not null and district is not null and station is not null
        ${attrSql}
    )
    select
      coalesce(sum(mt.market_kg), 0) as total_kg,
      count(*) as arrival_market_count,
      (select n from price_locations) as price_location_count
    from market_total mt
  `;

  const { rows } = await pool.query(sql, params);
  const row = rows[0];
  const arrivalMarketCount = Number(row.arrival_market_count);
  const priceLocationCount = Number(row.price_location_count);
  const totalKg = Number(row.total_kg);

  const coverageRatio = priceLocationCount > 0 ? arrivalMarketCount / priceLocationCount : 0;

  if (arrivalMarketCount === 0) {
    return {
      byProductId,
      reportedArrivalTonnes: null,
      arrivalMarketCount: 0,
      priceLocationCount,
      coverageLabel: `Arrival not reported (${priceLocationCount} contributing price markets)`,
      preferLocationCount: true,
    };
  }

  return {
    byProductId,
    reportedArrivalTonnes: Math.round((totalKg / 1000) * 100) / 100,
    arrivalMarketCount,
    priceLocationCount,
    coverageLabel: `Reported arrival (approx.) · ${arrivalMarketCount} contributing markets`,
    preferLocationCount: coverageRatio < 0.8,
  };
}

/** Moisture summary honoring the business-declared (D) band when one exists. */
export async function getMoistureSummary(byProductId, filters = {}) {
  const byProduct = await resolveByProduct(byProductId);
  if (!byProduct) return null;

  const params = [byProduct.product, byProduct.by_product];
  const attrClauses = buildAttributeFilter(filters, params);
  const attrSql = attrClauses.length ? "and " + attrClauses.join(" and ") : "";

  const band = byProduct.moisture_rule_band; // e.g. '11-14'
  let bandSql = "";
  if (band) {
    const [bandLow, bandHigh] = band.split("-").map(Number);
    params.push(bandLow, bandHigh);
    bandSql = `and moisture_min >= $${params.length - 1} and moisture_max <= $${params.length}`;
  }

  const sql = `
    select
      count(*) filter (where moisture_min is not null) as filled_count,
      count(*) as total_count,
      count(*) filter (where moisture_min is not null ${bandSql}) as in_band_count,
      min(moisture_min) filter (where moisture_min is not null ${bandSql}) as observed_low,
      max(moisture_max) filter (where moisture_min is not null ${bandSql}) as observed_high
    from price_records
    where product = $1 and by_product = $2
      ${attrSql}
  `;
  const { rows } = await pool.query(sql, params);
  const row = rows[0];

  return {
    byProductId,
    ruleBand: band,
    filledCount: Number(row.filled_count),
    totalCount: Number(row.total_count),
    inBandCount: Number(row.in_band_count),
    observedLow: row.observed_low !== null ? Number(row.observed_low) : null,
    observedHigh: row.observed_high !== null ? Number(row.observed_high) : null,
  };
}

/** Distinct attribute tuples actually observed for this by-product (never a Cartesian product). */
export async function getObservedAttributeTuples(byProductId) {
  const byProduct = await resolveByProduct(byProductId);
  if (!byProduct) return null;

  const { rows } = await pool.query(
    `select distinct color, new_old as "newOld", origin, variety, specification, quality, count(*) over (
       partition by color, new_old, origin, variety, specification, quality
     ) as n
     from price_records
     where product = $1 and by_product = $2
     order by n desc`,
    [byProduct.product, byProduct.by_product]
  );
  return rows;
}

/** Paginated raw rows for the "view all records" table screen. */
export async function getRecords(byProductId, filters = {}, page = 1, pageSize = 50) {
  const byProduct = await resolveByProduct(byProductId);
  if (!byProduct) return null;

  const params = [byProduct.product, byProduct.by_product];
  const attrClauses = buildAttributeFilter(filters, params);
  let attrSql = attrClauses.length ? "and " + attrClauses.join(" and ") : "";

  if (filters.priceType) {
    params.push(filters.priceType);
    attrSql += ` and price_type = $${params.length}`;
  }

  const offset = (Math.max(1, page) - 1) * pageSize;
  params.push(pageSize, offset);

  const { rows } = await pool.query(
    `select id, record_date, price_type, province, district, station, origin, variety,
            color, minimum, maximum, arrivals, arrivals_unit, arrival_weight_kg,
            moisture_raw, new_old, specification, quality
     from price_records
     where product = $1 and by_product = $2 and price_valid
       ${attrSql}
     order by record_date desc, id desc
     limit $${params.length - 1} offset $${params.length}`,
    params
  );

  const { rows: countRows } = await pool.query(
    `select count(*) as n from price_records
     where product = $1 and by_product = $2 and price_valid ${attrSql}`,
    params.slice(0, params.length - 2)
  );

  return { rows, total: Number(countRows[0].n), page, pageSize };
}

/**
 * Every valid row for a by-product (no pagination), for screens that do
 * their own client-side grouping/filtering (mandi/district/province
 * tables, attribute sheets). The dataset is a single-month snapshot
 * capped at a few thousand rows per by-product, so this is cheap.
 */
export async function getAllRecords(byProductId, filters = {}) {
  const byProduct = await resolveByProduct(byProductId);
  if (!byProduct) return null;
  if (!byProduct.by_product) return { rows: [], total: 0 };

  const params = [byProduct.product, byProduct.by_product];
  const attrClauses = buildAttributeFilter(filters, params);
  let attrSql = attrClauses.length ? "and " + attrClauses.join(" and ") : "";

  if (filters.priceType) {
    params.push(filters.priceType);
    attrSql += ` and price_type = $${params.length}`;
  }

  const { rows } = await pool.query(
    `select id, record_date, price_type, province, district, station, origin, variety,
            color, minimum, maximum, arrivals, arrivals_unit, arrival_weight_kg,
            moisture_raw, new_old, specification, quality
     from price_records
     where product = $1 and by_product = $2 and price_valid
       ${attrSql}
     order by record_date desc, id desc`,
    params
  );

  return { rows, total: rows.length };
}

/**
 * Daily market-balanced avg min/max + raw arrival total, for EVERY price
 * type observed for this by-product in one query (used to drive a
 * rate-type switcher / compare-rates chart without N round trips).
 */
export async function getTrendAllRateTypes(byProductId, filters = {}, location = {}) {
  const byProduct = await resolveByProduct(byProductId);
  if (!byProduct) return null;
  if (!byProduct.by_product) return { byProductId, byRateType: {} };

  const params = [byProduct.product, byProduct.by_product];
  const attrClauses = buildAttributeFilter(filters, params);
  const locClause = buildLocationFilter(location.locationKind, location.locationLabel, params);
  const attrSql = attrClauses.length ? "and " + attrClauses.join(" and ") : "";

  const sql = `
    with eligible as (
      select * from price_records
      where product = $1 and by_product = $2 and price_valid
        and price_type is not null
        and province is not null and district is not null and station is not null
        ${attrSql} ${locClause}
    ),
    market_day as (
      select price_type, province, district, station, record_date,
             avg(minimum) as md_min, avg(maximum) as md_max
      from eligible
      group by price_type, province, district, station, record_date
    ),
    price_by_day as (
      select price_type, record_date,
             round(avg(md_min)::numeric, 2) as avg_min,
             round(avg(md_max)::numeric, 2) as avg_max,
             count(*) as market_count
      from market_day
      group by price_type, record_date
    ),
    arrivals_by_day as (
      select price_type, record_date,
             coalesce(sum(arrivals) filter (where arrivals > 0), 0) as total_arrival
      from eligible
      group by price_type, record_date
    )
    select p.price_type, p.record_date, p.avg_min, p.avg_max, p.market_count,
           coalesce(a.total_arrival, 0) as total_arrival
    from price_by_day p
    left join arrivals_by_day a using (price_type, record_date)
    order by p.price_type, p.record_date
  `;
  const { rows } = await pool.query(sql, params);

  const byRateType = {};
  for (const r of rows) {
    if (!byRateType[r.price_type]) byRateType[r.price_type] = [];
    byRateType[r.price_type].push({
      date: r.record_date,
      avgMin: Number(r.avg_min),
      avgMax: Number(r.avg_max),
      marketCount: Number(r.market_count),
      totalArrival: Number(r.total_arrival),
    });
  }
  return { byProductId, byRateType };
}

/** Daily market-balanced avg min/max series, for a price-trend chart. */
export async function getTrend(byProductId, filters = {}) {
  const byProduct = await resolveByProduct(byProductId);
  if (!byProduct) return null;

  let priceType = filters.priceType || null;
  if (!priceType) {
    priceType = await defaultPriceType(byProduct.product, byProduct.by_product, filters);
  }
  if (!priceType) return { byProductId, priceType: null, points: [] };

  const params = [byProduct.product, byProduct.by_product, priceType];
  const attrClauses = buildAttributeFilter(filters, params);
  const attrSql = attrClauses.length ? "and " + attrClauses.join(" and ") : "";

  const sql = `
    with eligible as (
      select * from price_records
      where product = $1 and by_product = $2 and price_valid
        and price_type = $3
        and province is not null and district is not null and station is not null
        ${attrSql}
    ),
    market_day as (
      select province, district, station, record_date,
             avg(minimum) as md_min, avg(maximum) as md_max
      from eligible
      group by province, district, station, record_date
    )
    select record_date,
           round(avg(md_min)::numeric, 2) as avg_min,
           round(avg(md_max)::numeric, 2) as avg_max,
           count(*) as market_count
    from market_day
    group by record_date
    order by record_date
  `;
  const { rows } = await pool.query(sql, params);
  return {
    byProductId,
    priceType,
    points: rows.map((r) => ({
      date: r.record_date,
      avgMin: Number(r.avg_min),
      avgMax: Number(r.avg_max),
      marketCount: Number(r.market_count),
    })),
  };
}

function buildLocationFilter(locationKind, locationLabel, params) {
  if (!locationKind || locationKind === "pakistan" || !locationLabel) return "";
  const label = locationLabel.replace(/\s*(mandi|منڈی)$/i, "").trim();
  if (!label) return "";
  params.push(label);
  const idx = params.length;
  if (locationKind === "province") return `and (lower(province) = lower($${idx}) or lower(province) like lower($${idx} || '%'))`;
  if (locationKind === "district") return `and (lower(district) = lower($${idx}) or lower(station) = lower($${idx}) or lower(district) like lower($${idx} || '%'))`;
  if (locationKind === "mandi") return `and (lower(station) = lower($${idx}) or lower(station) = lower($${idx} || ' mandi') or lower(station) like lower($${idx} || '%'))`;
  params.pop();
  return "";
}

// Moisture is handled separately above (computeCardStats): it's a
// continuous measurement, not a category, so "most common raw string"
// was never the right summary for it -- a computed average is.
// User-designated special attribute per product/by-product. Shared with the
// app (byproductStats.ts) so the API and the cards always agree; keys are
// normalized names (lowercase, alphanumeric only).
const SPECIAL_ATTRIBUTES_PATH = new URL(
  "../../app/src/customer-face/shared/data/specialAttributes.json",
  import.meta.url
);
const SPECIAL_PRODUCT_ATTRIBUTES = Object.assign(
  {},
  ...Object.entries(JSON.parse(fs.readFileSync(SPECIAL_ATTRIBUTES_PATH, "utf8")))
    .filter(([section]) => !section.startsWith("_"))
    .map(([, entries]) => entries)
);

export const ATTR_TYPE_TO_COL = {
  newOld: "new_old",
  color: "color",
  variety: "variety",
  spec: "specification",
  quality: "quality",
  origin: "origin",
};

export function getProductSpecialAttrType(byproduct, matchedByproduct) {
  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const k1 = norm(byproduct);
  const k2 = norm(matchedByproduct);
  if (k1 in SPECIAL_PRODUCT_ATTRIBUTES) return SPECIAL_PRODUCT_ATTRIBUTES[k1];
  if (k2 in SPECIAL_PRODUCT_ATTRIBUTES) return SPECIAL_PRODUCT_ATTRIBUTES[k2];
  return null;
}

/**
 * One card's worth of stats for a single by-product, matching the
 * frontend's `ByproductNationalStats` shape (see
 * app/src/CustomerFaceApp.tsx `calculateByproductSummary`). `specialAttr`
 * is returned as {type, value} only -- the frontend already owns the
 * bilingual label/dot-color mapping for each type and should keep using
 * it, rather than duplicating that table here.
 */
// Extra filter for one split card (tester screens): one special-attribute value
// (`attrCol`/`attrValue`) or one forced rate type (`rateType`).
function splitAttrClause(split, params) {
  if (!split?.attrCol) return "";
  // One value (split cards) or several (the by-product screen's attribute filter).
  const values = split.attrValues?.length ? split.attrValues : [split.attrValue];
  const marks = values.map((v) => {
    params.push(v);
    return `$${params.length}`;
  });
  return `and trim(${split.attrCol}) in (${marks.join(", ")})`;
}

async function computeCardStats(row, targetDate, locationKind, locationLabel, split = null) {
  const base = {
    catalogId: row.id,
    hasData: false,
    product: row.division,
    byproduct: row.by_product,
    mostOccurringRateType: "Mandi Rate",
    otherRateTypesCount: 0,
    allRateTypes: ["Mandi Rate"],
    avgMin: 0,
    avgMax: 0,
    totalArrival: 0,
    markets: 0,
    arrivalCoverage: 0,
    specialAttr: null,
    specialAttrs: [],
  };
  if (!row.has_data || !row.matched_by_product) return base;

  const rtParams = [row.product, row.matched_by_product];
  const rtLocClause = buildLocationFilter(locationKind, locationLabel, rtParams);
  const rtSplitClause = splitAttrClause(split, rtParams);
  const { rows: rtRows } = await pool.query(
    `select coalesce(price_type, 'Mandi Rate') as rt, count(*) as n
     from price_records
     where product = $1 and by_product = $2 ${rtLocClause} ${rtSplitClause}
     group by rt order by n desc`,
    rtParams
  );
  if (rtRows.length === 0) return base;

  const allRateTypes = rtRows.map((r) => r.rt);
  // rtRows is already ordered by record count desc, so its head is the
  // live-computed dominant (most-occurring) price type for this by-product.
  // A chosen rate type with no reports here (e.g. under an attribute filter)
  // falls back to the most-reported one.
  let defaultRateType = rtRows[0].rt;
  // A card for one attribute value (e.g. Wheat · New) takes the rate type most
  // reported for that value in the 30 days up to the day, so it shows a current
  // rate rather than one that was common months ago.
  if (split?.attrCol && targetDate) {
    const from = new Date(`${String(targetDate).slice(0, 10)}T00:00:00Z`);
    from.setUTCDate(from.getUTCDate() - 30);
    const recentParams = [row.product, row.matched_by_product];
    const recentLoc = buildLocationFilter(locationKind, locationLabel, recentParams) + " " + splitAttrClause(split, recentParams);
    recentParams.push(from.toISOString().slice(0, 10), String(targetDate).slice(0, 10));
    const { rows: recent } = await pool.query(
      `select coalesce(price_type, 'Mandi Rate') as rt, count(*) as n
       from price_records
       where product = $1 and by_product = $2 ${recentLoc}
         and record_date >= $${recentParams.length - 1} and record_date <= $${recentParams.length}
       group by rt order by n desc limit 1`,
      recentParams
    );
    if (recent[0]?.rt) defaultRateType = recent[0].rt;
  }
  const mostOccurringRateType = split?.rateType && allRateTypes.includes(split.rateType) ? split.rateType : defaultRateType;
  const otherRateTypesCount = Math.max(0, allRateTypes.length - 1);

  const priceParams = [row.product, row.matched_by_product, mostOccurringRateType];
  const priceLocClause = buildLocationFilter(locationKind, locationLabel, priceParams);
  const priceSplitClause = splitAttrClause(split, priceParams);
  let priceDateSql = "";
  if (targetDate) {
    priceParams.push(targetDate);
    priceDateSql = `and record_date = $${priceParams.length}`;
  }

  const { rows: priceRows } = await pool.query(
    `with eligible as (
       select * from price_records
       where product = $1 and by_product = $2 and price_valid and price_type = $3
         and province is not null and district is not null and station is not null
         ${priceDateSql} ${priceLocClause} ${priceSplitClause}
     ),
     market as (
       select province, district, station, avg(minimum) mn, avg(maximum) mx
       from eligible group by province, district, station
     )
     select coalesce(round(avg(mn)::numeric, 2), 0) as avg_min,
            coalesce(round(avg(mx)::numeric, 2), 0) as avg_max
     from market`,
    priceParams
  );
  let avgMin = Number(priceRows[0].avg_min);
  let avgMax = Number(priceRows[0].avg_max);
  // Day the card describes: the selected day, or the latest report day before
  // it when the by-product wasn't reported that day (see fallback below).
  let statsDate = targetDate;

  if (targetDate && avgMin === 0 && avgMax === 0) {
    const fbParams = [row.product, row.matched_by_product, mostOccurringRateType];
    const fbLoc = buildLocationFilter(locationKind, locationLabel, fbParams) + " " + splitAttrClause(split, fbParams);
    fbParams.push(targetDate);
    const onOrBefore = `$${fbParams.length}`;
    const { rows: fbRows } = await pool.query(
      `with latest_date as (
         select max(record_date) as md from price_records
         where product = $1 and by_product = $2 and price_valid and price_type = $3 ${fbLoc}
           and record_date <= ${onOrBefore}
       ),
       eligible as (
         select * from price_records
         where product = $1 and by_product = $2 and price_valid and price_type = $3
           and record_date = (select md from latest_date)
           and province is not null and district is not null and station is not null
           ${fbLoc}
       ),
       market as (
         select province, district, station, avg(minimum) mn, avg(maximum) mx
         from eligible group by province, district, station
       )
       select coalesce(round(avg(mn)::numeric, 2), 0) as avg_min,
              coalesce(round(avg(mx)::numeric, 2), 0) as avg_max,
              (select md from latest_date) as md
       from market`,
      fbParams
    );
    if (fbRows[0] && Number(fbRows[0].avg_min) > 0) {
      avgMin = Number(fbRows[0].avg_min);
      avgMax = Number(fbRows[0].avg_max);
      statsDate = fbRows[0].md || targetDate;
    }
  }

  const arrParams = [row.product, row.matched_by_product];
  let arrLocClause = buildLocationFilter(locationKind, locationLabel, arrParams);
  arrLocClause += " " + splitAttrClause(split, arrParams);
  // Split / filtered cards: arrivals and mandis for the card's own rate type,
  // as the rates screen counts them for the rate + attribute it opens with.
  if (split?.rateType || split?.attrCol) {
    arrParams.push(mostOccurringRateType);
    arrLocClause += ` and price_type = $${arrParams.length}`;
  }
  let arrDateSql = "";
  if (statsDate) {
    arrParams.push(statsDate);
    arrDateSql = `and record_date = $${arrParams.length}`;
  }

  const { rows: arrRows } = await pool.query(
    `select coalesce(sum(arrivals) filter (where arrivals > 0), 0) as total_arrival,
            count(distinct station) as markets,
            count(*) as total_rows,
            count(*) filter (where arrival_weight_known and arrivals > 0) as valid_arrival_rows
     from price_records
     where product = $1 and by_product = $2 ${arrDateSql} ${arrLocClause}`,
    arrParams
  );
  const totalArrival = Number(arrRows[0].total_arrival);
  let markets = Number(arrRows[0].markets);
  if (markets === 0 && avgMin > 0) {
    const mktParams = [row.product, row.matched_by_product, mostOccurringRateType];
    const mktLoc = buildLocationFilter(locationKind, locationLabel, mktParams) + " " + splitAttrClause(split, mktParams);
    const { rows: mktRows } = await pool.query(
      `select count(distinct station) as m
       from price_records
       where product = $1 and by_product = $2 and price_type = $3 ${mktLoc}`,
      mktParams
    );
    markets = Number(mktRows[0]?.m || 1);
  }
  const totalRows = Number(arrRows[0].total_rows || 0);
  const validArrivalRows = Number(arrRows[0].valid_arrival_rows || 0);
  const arrivalCoverage = totalRows > 0 ? validArrivalRows / totalRows : 0;

  let specialAttr = null;
  const specialAttrs = [];
  const targetAttrType = getProductSpecialAttrType(row.by_product, row.matched_by_product);

  if (split?.attrCol) {
    // A split / filtered card is defined by its attribute value(s), so they are the card's chip.
    const values = split.attrValues?.length ? split.attrValues : [split.attrValue];
    const show = (v) => (split.attrType === "moisture" ? `${v}%` : v);
    for (const v of values) specialAttrs.push({ type: split.attrType, value: show(v) });
    specialAttr = { type: split.attrType, value: values.map(show).join(" / ") };
  } else if (targetAttrType === "moisture") {
    if (row.moisture_rule_band) {
      specialAttr = { type: "moisture", value: `${row.moisture_rule_band}%`, isDeclaredRule: true };
      specialAttrs.push(specialAttr);
    } else {
      const { rows: moistRows } = await pool.query(
        `select
           count(*) as total,
           count(*) filter (where moisture_min is not null and moisture_max is not null) as filled,
           avg((moisture_min + moisture_max) / 2.0) filter (where moisture_min is not null and moisture_max is not null) as avg_mid
         from price_records
         where product = $1 and by_product = $2`,
        [row.product, row.matched_by_product]
      );
      const mAvg = moistRows[0]?.avg_mid !== null && moistRows[0]?.avg_mid !== undefined ? Number(moistRows[0].avg_mid) : null;
      if (mAvg !== null) {
        specialAttr = { type: "moisture", value: `${Math.round(mAvg * 10) / 10}%`, isDeclaredRule: false };
        specialAttrs.push(specialAttr);
      }
    }
  } else if (targetAttrType) {
    const col = ATTR_TYPE_TO_COL[targetAttrType];
    if (col) {
      // Most common value among the card's rate type, on the day the card shows
      // first, so the rate + attribute the card opens the rates screen with
      // actually have reports together (e.g. Wheat Stock Rate is all "Old").
      const modeFor = async (onDate) => {
        const attrParams2 = [row.product, row.matched_by_product, mostOccurringRateType];
        let attrLocClause2 = buildLocationFilter(locationKind, locationLabel, attrParams2);
        if (onDate) {
          attrParams2.push(onDate);
          attrLocClause2 += ` and record_date = $${attrParams2.length}`;
        }
        const { rows } = await pool.query(
          `select ${col} as val, count(*) as c
           from price_records
           where product = $1 and by_product = $2 and price_type = $3 ${attrLocClause2}
             and ${col} is not null and trim(${col}) != '' and lower(trim(${col})) != 'null'
           group by ${col} order by count(*) desc limit 1`,
          attrParams2
        );
        return rows;
      };
      let modeRows = statsDate ? await modeFor(statsDate) : [];
      if (!modeRows[0]?.val) modeRows = await modeFor(null);
      if (!modeRows[0]?.val) {
        const attrParamsFallback = [row.product, row.matched_by_product];
        const attrLocClauseFallback = buildLocationFilter(locationKind, locationLabel, attrParamsFallback);
        const { rows: fallbackRows } = await pool.query(
          `select ${col} as val, count(*) as c
           from price_records
           where product = $1 and by_product = $2 ${attrLocClauseFallback}
             and ${col} is not null and trim(${col}) != '' and lower(trim(${col})) != 'null'
           group by ${col} order by count(*) desc limit 1`,
          attrParamsFallback
        );
        modeRows = fallbackRows;
      }
      const val = modeRows[0]?.val;
      if (val && val !== "null" && String(val).trim() !== "") {
        specialAttr = { type: targetAttrType, value: String(val).trim() };
        specialAttrs.push(specialAttr);
        // The card opens the rates screen filtered to this rate + attribute, so
        // its price and mandi count are for that pair too (same numbers there).
        if (statsDate && avgMin > 0) {
          const pairParams = [row.product, row.matched_by_product, mostOccurringRateType, statsDate, specialAttr.value];
          const pairLoc = buildLocationFilter(locationKind, locationLabel, pairParams);
          const { rows: pairRows } = await pool.query(
            `with eligible as (
               select * from price_records
               where product = $1 and by_product = $2 and price_valid and price_type = $3
                 and record_date = $4 and trim(${col}) = $5
                 and province is not null and district is not null and station is not null
                 ${pairLoc}
             ),
             market as (
               select province, district, station, avg(minimum) mn, avg(maximum) mx
               from eligible group by province, district, station
             )
             select coalesce(round(avg(mn)::numeric, 2), 0) as avg_min,
                    coalesce(round(avg(mx)::numeric, 2), 0) as avg_max,
                    count(*) as markets
             from market`,
            pairParams
          );
          if (pairRows[0] && Number(pairRows[0].avg_min) > 0) {
            avgMin = Number(pairRows[0].avg_min);
            avgMax = Number(pairRows[0].avg_max);
            markets = Number(pairRows[0].markets);
          }
        }
      }
    }
  }

  return {
    catalogId: row.id,
    hasData: avgMin > 0 || avgMax > 0 || totalArrival > 0,
    product: row.division,
    byproduct: row.by_product,
    mostOccurringRateType,
    otherRateTypesCount,
    allRateTypes,
    avgMin,
    avgMax,
    totalArrival,
    markets,
    arrivalCoverage,
    specialAttr,
    specialAttrs,
    split: split ? { by: split.by, value: split.value } : null,
    // The report day the numbers are from (the latest day before the asked one
    // when the by-product wasn't reported that day).
    statsDate: statsDate || null,
  };
}

/**
 * Card stats for every catalog entry in a division (frontend "product"),
 * including entries with no data this month (hasData: false), so the
 * frontend can render its existing "No Data Available" overlay exactly
 * as it does today.
 */
/** The column a by-product's special attribute is stored in (null = nothing to filter on). */
function attributeColumn(row) {
  const attrType = getProductSpecialAttrType(row.by_product, row.matched_by_product);
  if (!attrType) return null;
  // Maize grades have one declared moisture band; nothing to filter on.
  if (attrType === "moisture" && row.moisture_rule_band) return null;
  const col = attrType === "moisture" ? "moisture_raw" : ATTR_TYPE_TO_COL[attrType];
  return col ? { attrType, col } : null;
}

/**
 * One card per by-product. Options for the by-product screen:
 * - `attrs`: selected special-attribute values as "type|value". A by-product
 *   whose attribute type has selected values gets stats for those values only;
 *   one whose type has none is returned as `{ filteredOut: true }`.
 * - `rates`: { key: rateType } — a card's chosen rate type, keyed by catalog id
 *   ("12") or, for a by-product's card of one attribute value, "12~Old".
 * With several values selected, a by-product gets one card per value (each its
 * own average), tagged `split: { by: "attribute", value }`.
 */
export async function getVerticalCardStats(division, options = {}) {
  const { date, locationKind, locationLabel, attrs = [], rates = {} } = options;

  const { rows: catalogRows } = await pool.query(
    `select id, division, by_product, product, matched_by_product, has_data, moisture_rule_band
     from by_products where division = $1 order by id`,
    [division]
  );

  const wanted = new Map(); // attrType -> values
  for (const a of attrs) {
    const i = a.indexOf("|");
    if (i <= 0) continue;
    const type = a.slice(0, i);
    wanted.set(type, [...(wanted.get(type) || []), a.slice(i + 1)]);
  }

  const perRow = await Promise.all(
    catalogRows.map(async (row) => {
      if (!wanted.size) {
        const rateType = rates[row.id] || null;
        const split = rateType ? { by: "rateType", value: rateType, rateType } : null;
        return [{ ...(await computeCardStats(row, date || null, locationKind, locationLabel, split)), split: null }];
      }
      const attr = attributeColumn(row);
      const values = attr ? wanted.get(attr.attrType) : null;
      if (!values?.length) {
        return [{ catalogId: row.id, product: row.division, byproduct: row.by_product, hasData: false, filteredOut: true }];
      }
      const cards = await Promise.all(
        values.map(async (value) => {
          const rateType = rates[`${row.id}~${value}`] || null;
          const split = { by: "attribute", value, attrType: attr.attrType, attrCol: attr.col, attrValue: value, ...(rateType ? { rateType } : {}) };
          return { ...(await computeCardStats(row, date || null, locationKind, locationLabel, split)), split: { by: "attribute", value } };
        })
      );
      // A value this by-product never reported (up to that day) isn't a card.
      const reported = cards.filter((c) => c.hasData);
      return reported.length ? reported : [{ catalogId: row.id, product: row.division, byproduct: row.by_product, hasData: false, filteredOut: true }];
    })
  );
  return perRow.flat();
}

/**
 * Special-attribute values reported for each by-product of a division (for
 * the by-product screen's filter chips): [{ catalogId, byproduct, type, value, count }].
 */
export async function getVerticalAttributeValues(division, options = {}) {
  const { locationKind, locationLabel } = options;
  const { rows: catalogRows } = await pool.query(
    `select id, division, by_product, product, matched_by_product, has_data, moisture_rule_band
     from by_products where division = $1 order by id`,
    [division]
  );
  const perRow = await Promise.all(
    catalogRows.map(async (row) => {
      if (!row.has_data || !row.matched_by_product) return [];
      const attr = attributeColumn(row);
      if (!attr) return [];
      const params = [row.product, row.matched_by_product];
      const loc = buildLocationFilter(locationKind, locationLabel, params);
      const { rows } = await pool.query(
        `select trim(${attr.col}) as v, count(*) as n
         from price_records
         where product = $1 and by_product = $2 ${loc}
           and ${attr.col} is not null and trim(${attr.col}) != '' and lower(trim(${attr.col})) != 'null'
         group by trim(${attr.col}) order by n desc`,
        params
      );
      return rows.map((r) => ({ catalogId: row.id, byproduct: row.by_product, type: attr.attrType, value: r.v, count: Number(r.n) }));
    })
  );
  return perRow.flat();
}

/**
 * Card stats split into one card per by-product and special-attribute value
 * (`by: "attribute"`, e.g. Wheat Crop New / Old) or per by-product and rate
 * type (`by: "rateType"`). Split values are those reported for the location
 * over the whole dataset, so the set of cards doesn't change with the date.
 * By-products with nothing to split on return their normal single card.
 */
export async function getVerticalSplitCardStats(division, options = {}) {
  const { date, locationKind, locationLabel, by } = options;
  const { rows: catalogRows } = await pool.query(
    `select id, division, by_product, product, matched_by_product, has_data, moisture_rule_band
     from by_products where division = $1 order by id`,
    [division]
  );

  const cardsPerRow = await Promise.all(
    catalogRows.map(async (row) => {
      const single = async () => [await computeCardStats(row, date || null, locationKind, locationLabel)];
      if (!row.has_data || !row.matched_by_product) return single();

      if (by === "rateType") {
        const params = [row.product, row.matched_by_product];
        const loc = buildLocationFilter(locationKind, locationLabel, params);
        const { rows } = await pool.query(
          `select coalesce(price_type, 'Mandi Rate') as v, count(*) as n
           from price_records where product = $1 and by_product = $2 ${loc}
           group by v order by n desc`,
          params
        );
        if (rows.length === 0) return single();
        return Promise.all(
          rows.map((r) =>
            computeCardStats(row, date || null, locationKind, locationLabel, { by, value: r.v, rateType: r.v })
          )
        );
      }

      const attrType = getProductSpecialAttrType(row.by_product, row.matched_by_product);
      // Maize grades have one declared moisture band; nothing to split on.
      if (attrType === "moisture" && row.moisture_rule_band) return single();
      const col = attrType === "moisture" ? "moisture_raw" : ATTR_TYPE_TO_COL[attrType];
      if (!col) return single();
      const params = [row.product, row.matched_by_product];
      const loc = buildLocationFilter(locationKind, locationLabel, params);
      const { rows } = await pool.query(
        `select trim(${col}) as v, count(*) as n
         from price_records
         where product = $1 and by_product = $2 ${loc}
           and ${col} is not null and trim(${col}) != '' and lower(trim(${col})) != 'null'
         group by trim(${col}) order by n desc`,
        params
      );
      if (rows.length === 0) return single();
      return Promise.all(
        rows.map((r) =>
          computeCardStats(row, date || null, locationKind, locationLabel, {
            by,
            value: r.v,
            attrType,
            attrCol: col,
            attrValue: r.v,
          })
        )
      );
    })
  );
  return cardsPerRow.flat();
}
