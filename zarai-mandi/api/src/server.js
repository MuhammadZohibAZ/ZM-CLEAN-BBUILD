import cors from "cors";
import express from "express";
import { pool } from "./db.js";
import {
  getAllRecords,
  getArrivalSummary,
  getMoistureSummary,
  getObservedAttributeTuples,
  getPriceSummary,
  getRecords,
  getTrend,
  getTrendAllRateTypes,
  getVerticalCardStats,
  getVerticalSplitCardStats,
  getVerticalAttributeValues,
} from "./aggregate.js";
import { registerCompareRoutes } from "./compare.js";

const app = express();
app.use(cors());
app.use(express.json());

function attrFiltersFromQuery(q) {
  return {
    priceType: q.priceType,
    color: q.color,
    newOld: q.newOld,
    origin: q.origin,
    variety: q.variety,
    specification: q.specification,
    quality: q.quality,
  };
}

app.get("/api/health", async (_req, res) => {
  const { rows } = await pool.query("select count(*) as n from price_records");
  res.json({ ok: true, priceRecords: Number(rows[0].n) });
});

// Top-level customer-facing divisions (the 468-entry catalog's grouping,
// e.g. Wheat/Rice/Paddy/Fertilizer/Livestock/Kiryana) for the home screen.
// First and last report day in the database (the app's date range).
app.get("/api/dataset", async (_req, res) => {
  const { rows } = await pool.query("select min(record_date) as first, max(record_date) as last from price_records");
  res.json({ first: rows[0]?.first ?? null, last: rows[0]?.last ?? null });
});

app.get("/api/verticals", async (_req, res) => {
  const { rows } = await pool.query(`
    select division as name,
           count(*) as by_product_count,
           count(*) filter (where has_data) as by_product_with_data_count,
           sum(record_count) as record_count
    from by_products
    group by division
    order by division
  `);
  res.json(rows);
});

// By-products within a division, with data-availability flags. Includes
// catalog entries with zero records this month (has_data: false) so the
// frontend can render its existing "No Data Available" card state.
app.get("/api/by-products", async (req, res) => {
  const { division } = req.query;
  const params = [];
  let where = "";
  if (division) {
    params.push(division);
    where = "where division = $1";
  }
  const { rows } = await pool.query(
    `select id, division, by_product, product, matched_by_product, display_name,
            icon_key, record_count, day_count, small_sample, has_data, moisture_rule_band
     from by_products
     ${where}
     order by id`,
    params
  );
  res.json(rows);
});

// One batch call returning every by-product card's stats for a division
// (avg min/max, arrival, markets, special attribute), in the exact shape
// app/src/CustomerFaceApp.tsx's ByproductNationalStats expects.
// attrs = "type|value,..." (special-attribute filter); rates = "catalogId[~value]:Rate Type,..." (a card's chosen rate).
app.get("/api/verticals/:division/card-stats", async (req, res) => {
  const { division } = req.params;
  const { date, locationKind, locationLabel } = req.query;
  const list = (v) => (typeof v === "string" && v ? v.split(",").map((x) => x.trim()).filter(Boolean) : []);
  const attrs = list(req.query.attrs);
  const rates = {};
  for (const pair of list(req.query.rates)) {
    const i = pair.lastIndexOf(":");
    if (i > 0) rates[pair.slice(0, i)] = pair.slice(i + 1);
  }
  const results = await getVerticalCardStats(division, { date, locationKind, locationLabel, attrs, rates });
  res.json(results);
});

// Special-attribute values per by-product (the by-product screen's filter chips).
app.get("/api/verticals/:division/attribute-values", async (req, res) => {
  const { division } = req.params;
  const { locationKind, locationLabel } = req.query;
  res.json(await getVerticalAttributeValues(division, { locationKind, locationLabel }));
});

// Tester screens: one card per by-product x special-attribute value (by=attribute)
// or per by-product x rate type (by=rateType).
app.get("/api/verticals/:division/card-stats-split", async (req, res) => {
  const { division } = req.params;
  const { date, locationKind, locationLabel, by } = req.query;
  if (by !== "attribute" && by !== "rateType") {
    return res.status(400).json({ error: "by must be 'attribute' or 'rateType'" });
  }
  const results = await getVerticalSplitCardStats(division, { date, locationKind, locationLabel, by });
  res.json(results);
});

app.get("/api/by-products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await pool.query("select * from by_products where id = $1", [id]);
  if (!rows[0]) return res.status(404).json({ error: "not_found" });

  const { rows: stats } = await pool.query(
    "select attribute_name, filled_count, total_count, fill_rate, classification from by_product_attribute_stats where by_product_id = $1",
    [id]
  );
  const tuples = await getObservedAttributeTuples(id);

  res.json({ ...rows[0], attributeStats: stats, observedAttributeTuples: tuples });
});

app.get("/api/by-products/:id/summary", async (req, res) => {
  const id = Number(req.params.id);
  const filters = attrFiltersFromQuery(req.query);
  const [price, arrival, moisture] = await Promise.all([
    getPriceSummary(id, filters),
    getArrivalSummary(id, filters),
    getMoistureSummary(id, filters),
  ]);
  if (!price) return res.status(404).json({ error: "not_found" });
  res.json({ price, arrival, moisture });
});

app.get("/api/by-products/:id/all-records", async (req, res) => {
  const id = Number(req.params.id);
  const filters = attrFiltersFromQuery(req.query);
  const result = await getAllRecords(id, filters);
  if (!result) return res.status(404).json({ error: "not_found" });
  res.json(result);
});

app.get("/api/by-products/:id/records", async (req, res) => {
  const id = Number(req.params.id);
  const filters = attrFiltersFromQuery(req.query);
  const page = Number(req.query.page) || 1;
  const pageSize = Math.min(Number(req.query.pageSize) || 50, 200);
  const result = await getRecords(id, filters, page, pageSize);
  if (!result) return res.status(404).json({ error: "not_found" });
  res.json(result);
});

app.get("/api/by-products/:id/trend", async (req, res) => {
  const id = Number(req.params.id);
  const filters = attrFiltersFromQuery(req.query);
  const result = await getTrend(id, filters);
  if (!result) return res.status(404).json({ error: "not_found" });
  res.json(result);
});

app.get("/api/by-products/:id/trend-all", async (req, res) => {
  const id = Number(req.params.id);
  const filters = attrFiltersFromQuery(req.query);
  const { locationKind, locationLabel } = req.query;
  const result = await getTrendAllRateTypes(id, filters, { locationKind, locationLabel });
  if (!result) return res.status(404).json({ error: "not_found" });
  res.json(result);
});

registerCompareRoutes(app);

const PORT = process.env.PORT || 8090;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Zarai Mandi API listening on :${PORT}`);
});
