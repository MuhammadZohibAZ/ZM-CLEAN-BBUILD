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

import { pool } from "./db.js";

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
      select distinct on (province, district, station, record_date)
        province, district, station, record_date, arrival_weight_kg
      from eligible
      order by province, district, station, record_date, row_num desc
    ),
    market_total as (
      select province, district, station, sum(arrival_weight_kg) as market_kg
      from market_day
      group by province, district, station
    ),
    price_locations as (
      select count(distinct (province, district, station)) as n
      from price_records
      where product = $1 and by_product = $2 and price_valid
        and province is not null and district is not null and station is not null
        ${attrSql}
    )
    select
      coalesce(sum(mt.market_kg), 0) as total_kg,
      count(mt.*) as arrival_market_count,
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
  const label = locationLabel.replace(/\s*mandi$/i, "").trim();
  if (!label) return "";
  params.push(label);
  const idx = params.length;
  if (locationKind === "province") return `and lower(province) = lower($${idx})`;
  if (locationKind === "district") return `and lower(district) = lower($${idx})`;
  if (locationKind === "mandi") return `and lower(station) = lower($${idx})`;
  params.pop();
  return "";
}

const SPECIAL_ATTR_PRIORITY = [
  ["moisture", "moisture_raw"],
  ["newOld", "new_old"],
  ["color", "color"],
  ["variety", "variety"],
  ["spec", "specification"],
  ["origin", "origin"],
];

/**
 * One card's worth of stats for a single by-product, matching the
 * frontend's `ByproductNationalStats` shape (see
 * app/src/CustomerFaceApp.tsx `calculateByproductSummary`). `specialAttr`
 * is returned as {type, value} only -- the frontend already owns the
 * bilingual label/dot-color mapping for each type and should keep using
 * it, rather than duplicating that table here.
 */
async function computeCardStats(row, targetDate, locationKind, locationLabel) {
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
    specialAttr: null,
  };
  if (!row.has_data || !row.matched_by_product) return base;

  const rtParams = [row.product, row.matched_by_product];
  const rtLocClause = buildLocationFilter(locationKind, locationLabel, rtParams);
  const { rows: rtRows } = await pool.query(
    `select coalesce(price_type, 'Mandi Rate') as rt, count(*) as n
     from price_records
     where product = $1 and by_product = $2 ${rtLocClause}
     group by rt order by n desc`,
    rtParams
  );
  if (rtRows.length === 0) return base;

  const mostOccurringRateType = rtRows[0].rt;
  const allRateTypes = rtRows.map((r) => r.rt);
  const otherRateTypesCount = Math.max(0, allRateTypes.length - 1);

  const priceParams = [row.product, row.matched_by_product, mostOccurringRateType];
  const priceLocClause = buildLocationFilter(locationKind, locationLabel, priceParams);
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
         ${priceDateSql} ${priceLocClause}
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
  const avgMin = Number(priceRows[0].avg_min);
  const avgMax = Number(priceRows[0].avg_max);

  const arrParams = [row.product, row.matched_by_product];
  const arrLocClause = buildLocationFilter(locationKind, locationLabel, arrParams);
  let arrDateSql = "";
  if (targetDate) {
    arrParams.push(targetDate);
    arrDateSql = `and record_date = $${arrParams.length}`;
  }

  const { rows: arrRows } = await pool.query(
    `select coalesce(sum(arrivals) filter (where arrivals > 0), 0) as total_arrival,
            count(distinct station) as markets
     from price_records
     where product = $1 and by_product = $2 ${arrDateSql} ${arrLocClause}`,
    arrParams
  );
  const totalArrival = Number(arrRows[0].total_arrival);
  const markets = Number(arrRows[0].markets);

  let specialAttr = null;
  if (row.moisture_rule_band) {
    // business-declared (D) rule wins over any observed value, per policy section 6
    specialAttr = { type: "moisture", value: `${row.moisture_rule_band}%`, isDeclaredRule: true };
  } else {
    const attrParams2 = [row.product, row.matched_by_product, mostOccurringRateType];
    const attrLocClause2 = buildLocationFilter(locationKind, locationLabel, attrParams2);
    const { rows: modeRows } = await pool.query(
      `select
         mode() within group (order by moisture_raw) filter (where moisture_raw is not null) as moisture_raw,
         mode() within group (order by new_old) filter (where new_old is not null) as new_old,
         mode() within group (order by color) filter (where color is not null) as color,
         mode() within group (order by variety) filter (where variety is not null) as variety,
         mode() within group (order by specification) filter (where specification is not null) as specification,
         mode() within group (order by origin) filter (where origin is not null) as origin
       from price_records
       where product = $1 and by_product = $2 and price_type = $3 ${attrLocClause2}`,
      attrParams2
    );
    const modes = modeRows[0] || {};
    for (const [type, col] of SPECIAL_ATTR_PRIORITY) {
      const value = modes[col];
      if (value) {
        specialAttr = { type, value };
        break;
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
    specialAttr,
  };
}

/**
 * Card stats for every catalog entry in a division (frontend "product"),
 * including entries with no data this month (hasData: false), so the
 * frontend can render its existing "No Data Available" overlay exactly
 * as it does today.
 */
export async function getVerticalCardStats(division, options = {}) {
  const { date, locationKind, locationLabel } = options;

  const { rows: catalogRows } = await pool.query(
    `select id, division, by_product, product, matched_by_product, has_data, moisture_rule_band
     from by_products where division = $1 order by id`,
    [division]
  );

  return Promise.all(
    catalogRows.map((row) => computeCardStats(row, date || null, locationKind, locationLabel))
  );
}
