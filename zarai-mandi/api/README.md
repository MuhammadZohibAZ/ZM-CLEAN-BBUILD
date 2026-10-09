# Zarai Mandi Market API

A small Postgres-backed REST API that replaces the old build-time-bundled
mock dataset (`app/src/data/realCommodityData.ts`) with live queries over
the real commodity price export, implementing the aggregation rules in
`../docs/Zarai_Mandi_Mandatory_Optional_Attributes_and_Card_Policy.pdf`.

## Setup

The API runs on SQLite (`node:sqlite`, Node 22+), from `db/zarai_mandi.sqlite`.
`db/etl_sqlite.py` builds that file from a commodity price export.
(`db/etl_load.py` + `db/schema.sql` are the older Postgres loader; the
running API no longer uses them.)

```bash
# 1. One-off: Python with openpyxl
python3 -m pip install openpyxl

# 2. Prepare the year of prices (fills missing price types, matches names to
#    the app) and load it (default: data/prices_2025-09-23_to_2026-09-23_prepared.xlsx)
python3 data/prepare_year_prices.py
cd api
python3 db/etl_sqlite.py

# 3. Run the API
npm install
npm start            # -> listening on :8090
```

The frontend (`../app`) talks to this via `VITE_MARKET_API_URL` (default
`http://localhost:8090`, see `../app/src/lib/api.ts`).

### Loading a new export (e.g. the 1-year data)

1. Stop the API.
2. `python3 db/etl_sqlite.py "../data/<new export>.xlsx"`
3. Start the API.

The loader:

- reads both export layouts: the 1-month file (sheet "Commodity Prices",
  header on row 7) and the 1-year file (sheet "Prices", header on row 1);
- prints the date range and how filled Province/District/Station/Price_Type are;
- **stops without touching the current database if Province/District/Station
  are under 50% filled**, because the map, location filters, market counts,
  trend graphs and Compare only count prices from an identifiable market
  (province + district + station) with a rate type. Pass
  `--allow-missing-locations` to load such an export anyway;
- skips rows with no Product/By_Product (and says how many);
- builds into `zarai_mandi.sqlite.building` and swaps it in only after a
  successful load, so a failed load never leaves the API without data.

`--out other.sqlite` builds somewhere else; `SQLITE_PATH=other.sqlite npm start`
runs the API against it (handy for trying a new export on a second port with
`PORT=8091`).

Everything date-related in the API is derived from the data (latest day =
`max(record_date)`, compare range = min/max date), so a longer export needs no
code changes.

## Data model

- **`price_records`** -- every source row (40,959 in the 1-month export, ~298k in the 1-year export), typed and indexed,
  with generated validity columns (`price_valid`, `arrival_weight_known`,
  `arrival_weight_kg`). Never mutated after load.
- **`catalog_entries`** -- the 468-entry customer-facing catalog
  (division + by-product name + catalog ID), transcribed from
  `../docs/Zarai_Mandi_Leadership_Card_Evidence_5_Pages.pdf`. This is the
  authoritative division list, independent of whether this month's export
  has any matching rows for an entry -- so "no data this month" entries
  still show up (policy: "no-data entries are unassessed, not
  inapplicable").
- **`catalog_aliases`** -- ~40 manual overrides for source rows whose raw
  `Product`/`By_Product` spelling doesn't normalize to match its catalog
  entry (`"Cottonseed"` vs `"Cotton Seed"`, `"Sooji"` vs `"Semolina"`,
  typos like `"Mango Anwer Ratul"` vs `"Mango Anwar Ratol"`, etc).
- **`by_products`** -- `catalog_entries` LEFT JOINed to this month's
  `price_records` via normalized-name match or alias. **217 of 468**
  entries matched real data this month (the leadership brief reports
  218/468 from its own, slightly different, audited matrix -- a ~0.2%
  transcription-tolerance gap, documented rather than force-reconciled).
  Ten source combos are deliberately left **unmatched** rather than
  guessed at, mirroring the policy PDF's own "identity exceptions": three
  ungraded `Potato (...)` variants beyond the six already excluded,
  `Quinoa`, `Egg Tray`, and two `Taara Meera` (wild mustard) rows that
  have no catalog entry at all. See `db/catalog_aliases.csv` for the full
  alias table and `db/etl_load.py`'s log output for what's left
  unmatched on each load.
- **`by_product_attribute_stats`** -- per by-product, per attribute
  (`color`, `new_old`, `origin`, `variety`, `specification`, `quality`,
  `moisture`), fill-rate and a generic `core` (100%) / `strong` (80-99.9%)
  / `selective` (<80%) classification -- computed from *this month's*
  data every load, rather than frozen to the leadership brief's hand-audit,
  so it self-corrects on future data (policy section 1: "A field missing
  next month should trigger a data-quality exception rather than
  disappearing automatically from the mandatory list").

## Aggregation rules and documented deviations

`src/aggregate.js` implements the policy PDF section by section:

- **Avg Min / Avg Max** (section 3): within a market (province + district
  + station), average every valid quote; within a market-day, average
  across days; across markets, average with equal weight per market --
  the exact three-level average from the worked example in the PDF
  (verified: Market A `{100-120, 110-130}` + Market B `{150-170}` ->
  Avg Min 127.50 / Avg Max 147.50).
- **Moisture D-rule** (section 6): Maize Grades A-D get their declared
  11-14% / 14-16% / 16-18% / 18-20% band hard-coded
  (`MAIZE_MOISTURE_BANDS` in `db/etl_load.py`) and it always wins over
  any observed value, regardless of fill rate.
- **Arrivals**: the export has no `arrival_event_id`, revision timestamp,
  or quote ID (policy section 2 says so explicitly), so we can't prove
  true duplicate detection. Two deviations, both documented in
  `aggregate.js`'s module docstring and reflected in the API response
  (`coverageLabel`, `preferLocationCount`):
  - **Price rows**: averaged as distinct observations rather than deduped
    by (market, day) collision, since a same-day collision is "not proof
    of duplicates" per the policy.
  - **Arrival totals** (`getArrivalSummary`): one figure per (market,
    day), taking the highest `row_num` as an ingestion-order "latest"
    proxy; the by-product **card** stats (`computeCardStats`) instead sum
    the raw `Arrivals` column directly (bag/lot counts) to match what the
    frontend UI already labels "Bags" -- documented as an approximation,
    never silently converted to a false-precision weight.
- **"No eligible prices"**: every summary function returns an explicit
  `noData: true` / `hasData: false` rather than falling back to 0 or a
  neighboring slide's value (policy section 3 and 5).
- **Trend chart gaps** (`app/src/CustomerFaceApp.tsx`
  `buildTimelineResultFromApi`): a day with no report carries the last
  reported min/max forward instead of dropping to 0, so a sparse
  reporting day doesn't render as a fake price crash.

## API reference

All endpoints are `GET`, JSON. Attribute filters (`color`, `newOld`,
`origin`, `variety`, `specification`, `quality`) and `priceType` are
optional query params on the per-by-product endpoints.

| Endpoint | Purpose |
|---|---|
| `/api/health` | row count sanity check |
| `/api/verticals` | divisions (Wheat, Rice, Paddy, Fertilizer, ...) with counts |
| `/api/by-products?division=X` | catalog rows for a division (includes zero-data entries) |
| `/api/by-products/:id` | one catalog row + attribute completeness + observed attribute tuples |
| `/api/verticals/:division/card-stats?date=&locationKind=&locationLabel=` | one call, every by-product's card stats (Avg Min/Max, arrival, markets, special attribute) -- batches what the by-product grid screen needs |
| `/api/by-products/:id/summary` | price/arrival/moisture summary for one by-product |
| `/api/by-products/:id/records?page=&pageSize=` | paginated raw rows |
| `/api/by-products/:id/all-records` | every valid row, unpaginated (for screens doing their own client-side grouping) |
| `/api/by-products/:id/trend` | daily avg min/max for one price type |
| `/api/by-products/:id/trend-all?locationKind=&locationLabel=` | daily avg min/max + arrivals for every observed price type in one call |

## Performance

The whole dataset is 40,959 rows -- trivial for Postgres. With the
indexes in `db/schema.sql`, every endpoint above responds in single-digit
to low-tens of milliseconds locally (measured: card-stats batch for a
10-entry division ~60ms including 4 queries per card; single-by-product
summary/records/trend ~20-30ms). The frontend additionally caches GET
responses client-side for the session (`app/src/lib/api.ts`), so revisiting
a screen within the same session is instant with zero network round trip.
