// Endpoints backing the app's Compare tab (app/src/components/compare/).
//
// The compare module aggregates on the client with exact decimal arithmetic,
// so it needs raw price observations rather than pre-averaged summaries:
//   GET /api/compare/catalog          divisions -> by-products (with data), locations
//   GET /api/compare/records?ids=1,2  every valid observation for those by-products
// Records are sent column-oriented to keep the payload small.

import { pool } from "./db.js";
import { ATTR_TYPE_TO_COL, getProductSpecialAttrType } from "./aggregate.js";

const ATTRIBUTE_KEYS = ["origin", "variety", "color", "new_old", "specification", "quality", "moisture"];
const MAX_IDS = 80;

export function registerCompareRoutes(app) {
  app.get("/api/compare/catalog", async (_req, res) => {
    const [{ rows: byProducts }, { rows: stats }, { rows: locations }, { rows: range }] = await Promise.all([
      pool.query(`
        select id, division, display_name, by_product, matched_by_product, record_count
        from by_products
        where has_data and division <> 'Classification pending'
        order by division, display_name`),
      pool.query(`
        select by_product_id, attribute_name, fill_rate, classification
        from by_product_attribute_stats
        where filled_count > 0`),
      pool.query(`
        select distinct province, district, station
        from price_records
        where price_valid and province is not null and district is not null and station is not null
        order by province, district, station`),
      pool.query("select min(record_date) as first, max(record_date) as last from price_records where price_valid"),
    ]);

    const attributesById = new Map();
    for (const s of stats) {
      if (!ATTRIBUTE_KEYS.includes(s.attribute_name)) continue;
      const list = attributesById.get(s.by_product_id) ?? [];
      list.push({ key: s.attribute_name, fillRate: Number(s.fill_rate), classification: s.classification });
      attributesById.set(s.by_product_id, list);
    }

    const divisions = new Map();
    for (const b of byProducts) {
      const list = divisions.get(b.division) ?? [];
      // The one "special attribute" per by-product (same rule as the home cards).
      const specialType = getProductSpecialAttrType(b.by_product, b.matched_by_product);
      const specialKey = specialType === "moisture" ? "moisture" : ATTR_TYPE_TO_COL[specialType] ?? null;
      list.push({
        id: b.id,
        name: b.display_name,
        records: Number(b.record_count),
        attributes: attributesById.get(b.id) ?? [],
        special: specialKey ? { key: specialKey, type: specialType } : null,
      });
      divisions.set(b.division, list);
    }

    res.json({
      divisions: [...divisions].map(([name, items]) => ({ name, byProducts: items })),
      locations,
      dateRange: range[0] ?? null,
    });
  });

  app.get("/api/compare/records", async (req, res) => {
    const ids = String(req.query.ids ?? "")
      .split(",")
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0);
    const unique = [...new Set(ids)];
    if (!unique.length) return res.status(400).json({ error: "ids_required" });
    if (unique.length > MAX_IDS) return res.status(400).json({ error: "too_many_ids", max: MAX_IDS });

    const placeholders = unique.map((_, i) => `$${i + 1}`).join(", ");
    const { rows } = await pool.query(
      `select r.id, b.id as by_product_id, r.record_date, r.price_type, r.province, r.district, r.station,
              r.minimum, r.maximum, r.arrival_weight_kg,
              r.origin, r.variety, r.color, r.new_old, r.specification, r.quality, r.moisture_raw
       from price_records r
       join by_products b on r.product = b.product and r.by_product = b.matched_by_product
       where b.id in (${placeholders}) and r.price_valid
         and r.price_type is not null and r.price_type <> ''
         and r.province is not null and r.district is not null and r.station is not null
       order by r.record_date, r.id`,
      unique
    );

    const fields = [
      "id", "byProductId", "date", "priceType", "province", "district", "station",
      "min", "max", "arrivalKg", "origin", "variety", "color", "new_old", "specification", "quality", "moisture",
    ];
    res.json({
      fields,
      rows: rows.map((r) => [
        r.id, r.by_product_id, r.record_date, r.price_type, r.province, r.district, r.station,
        r.minimum, r.maximum, r.arrival_weight_kg,
        r.origin, r.variety, r.color, r.new_old, r.specification, r.quality, r.moisture_raw,
      ]),
    });
  });
}
