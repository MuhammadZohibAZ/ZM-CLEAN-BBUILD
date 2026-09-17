-- Zarai Mandi commodity price database
--
-- Source: "All Commodity Prices - 15-Aug-2026 to 14-Sept-2026.xlsx", sheet
-- "Commodity Prices", header row 7, data rows 8-40966 (40,959 records).
--
-- Design note: the source export has no stable quote ID, revision
-- timestamp, source ID or arrival-event ID (see
-- docs/Zarai_Mandi_Mandatory_Optional_Attributes_and_Card_Policy.pdf,
-- section 2). We cannot certify true duplicate-quote or duplicate-arrival
-- detection from this export alone. Where the policy calls for identity we
-- don't have, we fall back to the row's ingestion order (row_num) as a
-- "latest wins" tiebreaker and document every such fallback in api/README.md.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- Raw, typed, one-row-per-source-row table. Never mutated after load.
-- ---------------------------------------------------------------------
create table if not exists price_records (
  id                bigserial primary key,
  row_num           integer not null unique,          -- source xlsx row (8-40966)
  record_date       date not null,
  price_type        text,                              -- null = blank in source (50 rows)
  product           text not null,                     -- e.g. "Wheat"
  by_product        text not null,                     -- e.g. "Wheat", "Seed Cotton - Grade A"
  province          text,
  district           text,
  station           text,
  area              text,
  origin            text,
  variety           text,
  color             text,
  minimum           numeric(12, 2) not null,
  maximum           numeric(12, 2) not null,
  arrivals          numeric(12, 2),                    -- null = blank (349 rows)
  arrivals_unit     numeric(10, 2),                     -- kg per arrival unit; 0/blank = unit not verified
  moisture_raw      text,                               -- raw string, e.g. "10-15", ""
  moisture_min      numeric(5, 2),                      -- parsed low end (null if unparseable/blank)
  moisture_max      numeric(5, 2),                      -- parsed high end
  new_old           text,                               -- normalized 'New' | 'Old' | null
  specification     text,
  quality           text,
  -- price validity per policy section 2 "Price validity" gate
  price_valid       boolean generated always as (
                      minimum is not null and maximum is not null
                      and minimum > 0 and maximum > 0 and minimum <= maximum
                    ) stored,
  -- arrival gates per policy section 4
  arrival_reported       boolean generated always as (arrivals is not null and arrivals > 0) stored,
  arrival_weight_known    boolean generated always as (
                      arrivals is not null and arrivals > 0
                      and arrivals_unit is not null and arrivals_unit > 0
                    ) stored,
  arrival_weight_kg  numeric generated always as (
                      case when arrivals is not null and arrivals > 0
                            and arrivals_unit is not null and arrivals_unit > 0
                           then arrivals * arrivals_unit
                           else null end
                    ) stored,
  created_at        timestamptz not null default now()
);

create index if not exists idx_price_records_product_byproduct on price_records (product, by_product);
create index if not exists idx_price_records_by_product_trgm on price_records using gin (by_product gin_trgm_ops);
create index if not exists idx_price_records_date on price_records (record_date);
create index if not exists idx_price_records_price_type on price_records (price_type);
create index if not exists idx_price_records_market on price_records (province, district, station);
create index if not exists idx_price_records_attrs on price_records (product, by_product, color, new_old, origin, variety, specification, quality);

-- ---------------------------------------------------------------------
-- The 459-entry customer-facing catalog (api/db/catalog_459.csv),
-- reconciled from docs/Zarai_Mandi_Leadership_Card_Evidence_5_Pages.pdf:
-- 230 by-products matched to this month's xlsx (pages 2-4 of the brief,
-- by_product spelled exactly as the xlsx has it -- Excel spelling wins on
-- any name mismatch) + 229 catalog-only entries with no matching xlsx item
-- this month (page 5). Catalog IDs are the PDF's own IDs. This is the
-- authoritative division/by-product list -- independent of whether this
-- month's export has any matching records for an entry, so "no data this
-- month" entries still appear (see policy PDF: "no-data entries are
-- unassessed, not inapplicable").
-- ---------------------------------------------------------------------
create table if not exists catalog_entries (
  id                integer primary key,   -- catalog ID from the leadership brief (1-459)
  division          text not null,         -- customer-facing division, e.g. "Wheat", "Vegetable"
  by_product        text not null,         -- catalog's English by-product label
  normalized_key    text not null
);

create index if not exists idx_catalog_entries_division on catalog_entries (division);
create index if not exists idx_catalog_entries_normalized_key on catalog_entries (normalized_key);

-- ---------------------------------------------------------------------
-- Manual aliases for source rows whose raw Product/By_Product spelling
-- doesn't normalize to match its catalog entry. Empty as of the 459-entry
-- catalog: every matched by_product in catalog_459.csv is transcribed
-- exactly as the xlsx spells it, so normalized_key matching alone is
-- sufficient. Kept as an escape hatch for a future month's export whose
-- spelling drifts from the catalog. Rows with no catalog match at all are
-- deliberately left unmatched -- see policy PDF section 9 ("Identity
-- exceptions"): "not silently assigned to a catalog entry."
-- ---------------------------------------------------------------------
create table if not exists catalog_aliases (
  catalog_id        integer not null references catalog_entries (id),
  raw_product       text not null,
  raw_by_product    text not null,
  primary key (raw_product, raw_by_product)
);

-- ---------------------------------------------------------------------
-- Catalog entries joined to this month's observed price_records, i.e.
-- the "by-product" the frontend renders a card/screen for. Self-updates
-- whenever price_records or catalog_entries changes; see
-- api/db/etl_load.py.
-- ---------------------------------------------------------------------
create table if not exists by_products (
  id                integer primary key references catalog_entries (id),
  division          text not null,
  by_product        text not null,         -- catalog label (what the frontend already displays)
  product           text,                  -- raw source Product column for matched rows (null if no data)
  matched_by_product text,                 -- raw source By_Product column for matched rows (null if no data)
  display_name      text not null,
  icon_key          text,                  -- key into the frontend's ICON_PATHS map, nullable until mapped
  record_count      integer not null default 0,
  day_count         integer not null default 0,
  small_sample      boolean not null default false,  -- n < 30, per policy caution flag
  has_data          boolean not null default false,
  moisture_rule_band text                  -- e.g. '11-14' for Maize Grade A; null unless business-declared (D rule)
);

create index if not exists idx_by_products_division on by_products (division);
create index if not exists idx_by_products_has_data on by_products (has_data);

-- ---------------------------------------------------------------------
-- Attribute completeness per by-product, computed from this month's data.
-- classification: 'core' (100% filled), 'strong' (80-99.9%), 'selective' (<80%)
-- This mirrors the policy's E-candidate logic generically, so it
-- recomputes correctly on any future data load instead of being frozen
-- to this month's hand-audited list.
-- ---------------------------------------------------------------------
create table if not exists by_product_attribute_stats (
  by_product_id     integer not null references by_products (id) on delete cascade,
  attribute_name    text not null,   -- 'color' | 'new_old' | 'origin' | 'variety' | 'specification' | 'quality' | 'moisture'
  filled_count      integer not null,
  total_count       integer not null,
  fill_rate         numeric(6, 4) not null,
  classification    text not null,   -- 'core' | 'strong' | 'selective'
  primary key (by_product_id, attribute_name)
);
