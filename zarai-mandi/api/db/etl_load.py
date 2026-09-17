#!/usr/bin/env python3
"""Load the commodity price CSV into Postgres and build the derived catalog.

Usage:
    python3 etl_load.py [path/to/commodity_prices.csv]

Idempotent: truncates price_records/by_products/by_product_attribute_stats
and reloads from scratch, so it's safe to re-run whenever the source xlsx
changes (see ../../data/All Commodity Prices - *.xlsx -> csv export step
in README.md).
"""
import csv
import os
import re
import sys

import psycopg2
import psycopg2.extras

DB_DSN = os.environ.get(
    "DATABASE_URL", "postgresql://zarai_mandi:zarai_mandi_dev@localhost:5432/zarai_mandi"
)

CSV_PATH = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(__file__), "..", "..", "data", "commodity_prices.csv"
)
CATALOG_PATH = os.path.join(os.path.dirname(__file__), "catalog_468.csv")
ALIASES_PATH = os.path.join(os.path.dirname(__file__), "catalog_aliases.csv")

MOISTURE_RANGE_RE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*$")
MOISTURE_SINGLE_RE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*$")

# Business-declared (D) maize moisture grade rule, from
# docs/Zarai_Mandi_Mandatory_Optional_Attributes_and_Card_Policy.pdf section 6.
# Applies regardless of completeness; out-of-band values are excluded from
# the verified-grade moisture slide, never relabelled.
MAIZE_MOISTURE_BANDS = {
    "Maize Grade A": "11-14",
    "Maize Grade B": "14-16",
    "Maize Grade C": "16-18",
    "Maize Grade D": "18-20",
    "Feed Maize Grade A": "11-14",
    "Feed Maize Grade B": "14-16",
    "Feed Maize Grade C": "16-18",
}


def norm(s):
    if s is None:
        return None
    s = s.strip()
    return s if s else None


def norm_new_old(s):
    s = norm(s)
    if s is None:
        return None
    low = s.lower()
    if low == "new":
        return "New"
    if low == "old":
        return "Old"
    return s


def parse_moisture(raw):
    raw = norm(raw)
    if raw is None:
        return None, None
    m = MOISTURE_RANGE_RE.match(raw)
    if m:
        lo, hi = float(m.group(1)), float(m.group(2))
        return (lo, hi) if lo <= hi else (hi, lo)
    m = MOISTURE_SINGLE_RE.match(raw)
    if m:
        v = float(m.group(1))
        return v, v
    return None, None


def to_decimal(s):
    s = norm(s)
    if s is None:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def clean_display_name(product, by_product):
    # "Seed Cotton - Grade A" -> "Seed Cotton Grade A"; "Sesame - Grade A" -> "Sesame Grade A"
    name = by_product.replace(" - ", " ").strip()
    name = re.sub(r"\s+", " ", name)
    return name


def normalize_key(s):
    s = s.lower()
    s = s.replace(" - ", " ")
    s = re.sub(r"[/]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def load_rows(path):
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=8):  # source row numbers start at 8
            yield i, row


def main():
    print(f"Reading {CSV_PATH}")
    conn = psycopg2.connect(DB_DSN)
    conn.autocommit = False
    cur = conn.cursor()

    print("Truncating existing tables...")
    cur.execute(
        "truncate table by_product_attribute_stats, by_products, catalog_aliases, catalog_entries, price_records restart identity cascade"
    )

    print("Loading 468-entry catalog...")
    with open(CATALOG_PATH, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            cur.execute(
                "insert into catalog_entries (id, division, by_product, normalized_key) values (%s, %s, %s, %s)",
                (int(row["id"]), row["division"], row["by_product"], normalize_key(row["by_product"])),
            )
    conn.commit()

    print("Loading catalog aliases...")
    with open(ALIASES_PATH, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            cur.execute(
                "insert into catalog_aliases (catalog_id, raw_product, raw_by_product) values (%s, %s, %s)",
                (int(row["catalog_id"]), row["raw_product"], row["raw_by_product"]),
            )
    conn.commit()

    print("Loading price_records...")
    insert_sql = """
        insert into price_records (
            row_num, record_date, price_type, product, by_product,
            province, district, station, area, origin, variety, color,
            minimum, maximum, arrivals, arrivals_unit,
            moisture_raw, moisture_min, moisture_max, new_old, specification, quality
        ) values %s
    """
    batch = []
    n = 0
    for row_num, row in load_rows(CSV_PATH):
        date_raw = row["Date"]
        if not date_raw:
            continue
        record_date = date_raw.split(" ")[0]  # "2026-08-15 00:00:00" -> "2026-08-15"
        moisture_min, moisture_max = parse_moisture(row.get("Moisture%"))
        batch.append((
            row_num,
            record_date,
            norm(row.get("Price_Type")),
            norm(row.get("Product")),
            norm(row.get("By_Product")),
            norm(row.get("Province")),
            norm(row.get("District")),
            norm(row.get("Station")),
            norm(row.get("Area")),
            norm(row.get("Origin")),
            norm(row.get("Variety")),
            norm(row.get("Color")),
            to_decimal(row.get("Minimum")),
            to_decimal(row.get("Maximum")),
            to_decimal(row.get("Arrivals")),
            to_decimal(row.get("Arrivalsunit")),
            norm(row.get("Moisture%")),
            moisture_min,
            moisture_max,
            norm_new_old(row.get("New_Old")),
            norm(row.get("Specification")),
            norm(row.get("Quality")),
        ))
        n += 1
        if len(batch) >= 2000:
            psycopg2.extras.execute_values(cur, insert_sql, batch)
            batch = []
    if batch:
        psycopg2.extras.execute_values(cur, insert_sql, batch)
    print(f"Loaded {n} price records")

    print("Matching catalog entries to observed price_records...")
    # Match each source (product, by_product) combo to a catalog entry, by
    # normalized-name match first, then by explicit alias. Combos matching
    # neither stay unmatched -- these are the "identity exceptions" the
    # policy PDF says must not be silently mapped (ungraded Potato,
    # Quinoa, Egg Tray, ...).
    cur.execute("""
        select distinct product, by_product from price_records
        where product is not null and by_product is not null
    """)
    source_combos = cur.fetchall()

    cur.execute("select id, normalized_key from catalog_entries")
    by_norm_key = {}
    for cid, key in cur.fetchall():
        by_norm_key.setdefault(key, cid)  # first catalog id wins on collision

    cur.execute("select raw_product, raw_by_product, catalog_id from catalog_aliases")
    alias_map = {(p, b): cid for p, b, cid in cur.fetchall()}

    matches = {}  # catalog_id -> (product, by_product)
    unmatched_sources = []
    for product, by_product in source_combos:
        cid = alias_map.get((product, by_product))
        if cid is None:
            cid = by_norm_key.get(normalize_key(by_product))
        if cid is not None:
            matches[cid] = (product, by_product)
        else:
            unmatched_sources.append((product, by_product))

    if unmatched_sources:
        print(f"  {len(unmatched_sources)} source combos left unmatched (no catalog id, by design):")
        for p, b in unmatched_sources:
            print(f"    {p} / {b}")

    print("Building by_products (all 468 catalog entries, matched ones get real stats)...")
    cur.execute("select id, division, by_product from catalog_entries order by id")
    catalog_rows = cur.fetchall()
    for cid, division, catalog_by_product in catalog_rows:
        matched = matches.get(cid)
        if matched:
            product, raw_by_product = matched
            cur.execute("""
                select count(*), count(distinct record_date)
                from price_records where product = %s and by_product = %s
            """, (product, raw_by_product))
            record_count, day_count = cur.fetchone()
        else:
            product, raw_by_product, record_count, day_count = None, None, 0, 0

        display_name = catalog_by_product
        band = MAIZE_MOISTURE_BANDS.get(display_name)
        cur.execute("""
            insert into by_products (
                id, division, by_product, product, matched_by_product,
                display_name, record_count, day_count, small_sample, has_data, moisture_rule_band
            ) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            cid, division, catalog_by_product, product, raw_by_product,
            display_name, record_count, day_count, 0 < record_count < 30, record_count > 0, band,
        ))
    conn.commit()
    print(f"Matched {len(matches)}/{len(catalog_rows)} catalog entries to real data this month")

    print("Computing attribute completeness stats...")
    attrs = {
        "color": "color",
        "new_old": "new_old",
        "origin": "origin",
        "variety": "variety",
        "specification": "specification",
        "quality": "quality",
        "moisture": "moisture_raw",
    }
    for attr_name, col in attrs.items():
        cur.execute(f"""
            insert into by_product_attribute_stats (by_product_id, attribute_name, filled_count, total_count, fill_rate, classification)
            select
                bp.id,
                %s,
                count({col}) filter (where {col} is not null),
                count(*),
                round(count({col}) filter (where {col} is not null)::numeric / count(*), 4),
                case
                    when count({col}) filter (where {col} is not null) = count(*) then 'core'
                    when count({col}) filter (where {col} is not null)::numeric / count(*) >= 0.8 then 'strong'
                    else 'selective'
                end
            from price_records pr
            join by_products bp on bp.product = pr.product and bp.matched_by_product = pr.by_product
            where bp.has_data
            group by bp.id
        """, (attr_name,))
    conn.commit()
    print("Attribute stats computed")

    cur.execute("select count(*) from price_records")
    print("price_records:", cur.fetchone()[0])
    cur.execute("select count(*) from by_products")
    print("by_products:", cur.fetchone()[0])

    cur.close()
    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
