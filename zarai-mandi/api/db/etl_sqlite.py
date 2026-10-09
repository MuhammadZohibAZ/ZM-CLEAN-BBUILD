#!/usr/bin/env python3
"""Load a commodity price XLSX export into SQLite and build the derived catalog.

Usage:
    python3 db/etl_sqlite.py [path/to/export.xlsx] [--out path.sqlite] [--allow-missing-locations]

Accepts both export layouts:
  - 1-month export: sheet "Commodity Prices", header on row 7 (after a title block)
  - 1-year export:  sheet "Prices", header on row 1
The sheet and header row are detected automatically (the row whose first cell
is "Date").

Data-quality gate: before replacing anything, the load reports how filled the
columns the app depends on are. If Province/District/Station are (almost)
empty -- the map, location filters and market counts would have nothing to
show -- it stops unless --allow-missing-locations is given.

The database is built in a temporary file and swapped in only after a
successful load, so a failed load never leaves the API without data.
Restart the API afterwards (it keeps the old file open).
"""
import argparse
import csv
import os
import re
import sqlite3
import sys
import openpyxl

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# The year of prices the app serves (prepared by data/prepare_year_prices.py:
# price types filled in, names matched to the app).
DEFAULT_XLSX = os.path.join(BASE_DIR, "..", "..", "data", "prices_2025-09-23_to_2026-09-23_prepared.xlsx")
SQLITE_PATH = os.path.join(BASE_DIR, "zarai_mandi.sqlite")
CATALOG_PATH = os.path.join(BASE_DIR, "catalog_459.csv")
ALIASES_PATH = os.path.join(BASE_DIR, "catalog_aliases.csv")

MOISTURE_RANGE_RE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*$")
MOISTURE_SINGLE_RE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*$")

MAIZE_MOISTURE_BANDS = {
    # Keys must match catalog_459.csv's by_product spelling exactly (the
    # Excel spelling, since Excel wins on any name mismatch).
    "Maize - Grade A": "11-14",
    "Maize - Grade B": "14-16",
    "Maize - Grade C": "16-18",
    "Maize Grade D": "18-20",
    "Feed / Maize Grade A": "11-14",
    "Feed / Maize Grade B": "14-16",
    "Feed / Maize Grade C": "16-18",
}


def norm(s):
    if s is None:
        return None
    s = str(s).strip()
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


def normalize_key(s):
    s = str(s).lower()
    s = s.replace(" - ", " ")
    s = re.sub(r"[/]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


REQUIRED_HEADERS = {"Date", "Product", "By_Product", "Minimum", "Maximum"}
# Columns the app's location features and rate-type tabs depend on.
GATED_COLUMNS = ("Province", "District", "Station", "Price_Type")
MIN_LOCATION_FILL = 0.5


def open_export(xlsx_path):
    """Find the sheet + header row in either export layout; return (rows_iter, headers, header_row)."""
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    for name in ("Prices", "Commodity Prices", *wb.sheetnames):
        if name not in wb.sheetnames:
            continue
        ws = wb[name]
        for header_row, row in enumerate(ws.iter_rows(min_row=1, max_row=20, values_only=True), start=1):
            headers = [str(h).strip() if h is not None else "" for h in row]
            if REQUIRED_HEADERS.issubset(headers):
                print(f"Sheet '{name}', header on row {header_row}")
                return ws.iter_rows(min_row=header_row + 1, values_only=True), headers, header_row
    sys.exit(f"No sheet with a header row containing {sorted(REQUIRED_HEADERS)} in {xlsx_path}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("xlsx", nargs="?", default=DEFAULT_XLSX, help="export to load")
    ap.add_argument("--out", default=SQLITE_PATH, help="SQLite file to (re)build")
    ap.add_argument("--allow-missing-locations", action="store_true",
                    help="load even if Province/District/Station are mostly empty")
    args = ap.parse_args()
    xlsx_path, out_path = os.path.abspath(args.xlsx), os.path.abspath(args.out)

    tmp_path = out_path + ".building"
    for p in (tmp_path, tmp_path + "-wal", tmp_path + "-shm"):
        if os.path.exists(p):
            os.remove(p)
    print(f"Building {tmp_path}")

    conn = sqlite3.connect(tmp_path)
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE catalog_entries (
        id INTEGER PRIMARY KEY,
        division TEXT NOT NULL,
        by_product TEXT NOT NULL,
        normalized_key TEXT NOT NULL
    );

    CREATE TABLE catalog_aliases (
        catalog_id INTEGER NOT NULL,
        raw_product TEXT NOT NULL,
        raw_by_product TEXT NOT NULL
    );

    CREATE TABLE price_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        row_num INTEGER NOT NULL UNIQUE,
        record_date TEXT NOT NULL,
        price_type TEXT,
        product TEXT NOT NULL,
        by_product TEXT NOT NULL,
        province TEXT,
        district TEXT,
        station TEXT,
        area TEXT,
        origin TEXT,
        variety TEXT,
        color TEXT,
        minimum REAL NOT NULL,
        maximum REAL NOT NULL,
        arrivals REAL,
        arrivals_unit REAL,
        moisture_raw TEXT,
        moisture_min REAL,
        moisture_max REAL,
        new_old TEXT,
        specification TEXT,
        quality TEXT,
        price_valid INTEGER GENERATED ALWAYS AS (
            minimum IS NOT NULL AND maximum IS NOT NULL
            AND minimum > 0 AND maximum > 0 AND minimum <= maximum
        ) STORED,
        arrival_reported INTEGER GENERATED ALWAYS AS (
            arrivals IS NOT NULL AND arrivals > 0
        ) STORED,
        arrival_weight_known INTEGER GENERATED ALWAYS AS (
            arrivals IS NOT NULL AND arrivals > 0
            AND arrivals_unit IS NOT NULL AND arrivals_unit > 0
        ) STORED,
        arrival_weight_kg REAL GENERATED ALWAYS AS (
            CASE WHEN arrivals IS NOT NULL AND arrivals > 0
                 AND arrivals_unit IS NOT NULL AND arrivals_unit > 0
            THEN arrivals * arrivals_unit ELSE NULL END
        ) STORED
    );

    CREATE TABLE by_products (
        id INTEGER PRIMARY KEY,
        division TEXT NOT NULL,
        by_product TEXT NOT NULL,
        product TEXT,
        matched_by_product TEXT,
        display_name TEXT NOT NULL,
        icon_key TEXT,
        record_count INTEGER NOT NULL DEFAULT 0,
        day_count INTEGER NOT NULL DEFAULT 0,
        small_sample INTEGER NOT NULL DEFAULT 0,
        has_data INTEGER NOT NULL DEFAULT 0,
        moisture_rule_band TEXT
    );

    CREATE TABLE by_product_attribute_stats (
        by_product_id INTEGER NOT NULL,
        attribute_name TEXT NOT NULL,
        filled_count INTEGER NOT NULL,
        total_count INTEGER NOT NULL,
        fill_rate REAL NOT NULL,
        classification TEXT NOT NULL
    );
    """)

    print("Loading 459-entry catalog...")
    with open(CATALOG_PATH, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            cur.execute(
                "INSERT INTO catalog_entries (id, division, by_product, normalized_key) VALUES (?, ?, ?, ?)",
                (int(row["id"]), row["division"], row["by_product"], normalize_key(row["by_product"])),
            )

    print("Loading catalog aliases...")
    with open(ALIASES_PATH, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            cur.execute(
                "INSERT INTO catalog_aliases (catalog_id, raw_product, raw_by_product) VALUES (?, ?, ?)",
                (int(row["catalog_id"]), row["raw_product"], row["raw_by_product"]),
            )

    print(f"Reading XLSX: {xlsx_path}")
    rows, headers, header_row = open_export(xlsx_path)
    col_idx = {h: i for i, h in enumerate(headers)}
    filled = {c: 0 for c in GATED_COLUMNS}
    seen = 0
    skipped_unnamed = 0

    insert_sql = """
        INSERT INTO price_records (
            row_num, record_date, price_type, product, by_product,
            province, district, station, area, origin, variety, color,
            minimum, maximum, arrivals, arrivals_unit,
            moisture_raw, moisture_min, moisture_max, new_old, specification, quality
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    batch = []
    n = 0
    width = len(headers)
    for row_num, row in enumerate(rows, start=header_row + 1):
        # Rows can come back shorter than the header when their last cells are empty.
        if len(row) < width:
            row = tuple(row) + (None,) * (width - len(row))
        if row[0] is None and all(v in (None, "") for v in row):
            continue
        date_val = row[col_idx.get("Date", 0)]
        if not date_val:
            continue
        if hasattr(date_val, "strftime"):
            record_date = date_val.strftime("%Y-%m-%d")
        else:
            record_date = str(date_val).split(" ")[0].strip()

        moisture_str = norm(row[col_idx.get("Moisture%", 15)]) if "Moisture%" in col_idx else None
        moisture_min, moisture_max = parse_moisture(moisture_str)

        min_val = to_decimal(row[col_idx.get("Minimum", 11)])
        max_val = to_decimal(row[col_idx.get("Maximum", 12)])
        if min_val is None or max_val is None:
            continue
        if not norm(row[col_idx.get("Product", 2)]) or not norm(row[col_idx.get("By_Product", 3)]):
            skipped_unnamed += 1
            continue

        seen += 1
        for c in GATED_COLUMNS:
            if c in col_idx and norm(row[col_idx[c]]):
                filled[c] += 1

        batch.append((
            row_num,
            record_date,
            norm(row[col_idx.get("Price_Type", 1)]),
            norm(row[col_idx.get("Product", 2)]),
            norm(row[col_idx.get("By_Product", 3)]),
            norm(row[col_idx.get("Province", 4)]),
            norm(row[col_idx.get("District", 5)]),
            norm(row[col_idx.get("Station", 6)]),
            norm(row[col_idx.get("Area", 7)]),
            norm(row[col_idx.get("Origin", 8)]),
            norm(row[col_idx.get("Variety", 9)]),
            norm(row[col_idx.get("Color", 10)]),
            min_val,
            max_val,
            to_decimal(row[col_idx.get("Arrivals", 13)]),
            to_decimal(row[col_idx.get("Arrivalsunit", 14)]),
            moisture_str,
            moisture_min,
            moisture_max,
            norm_new_old(row[col_idx.get("New_Old", 16)]),
            norm(row[col_idx.get("Specification", 17)]),
            norm(row[col_idx.get("Quality", 18)]),
        ))
        n += 1
        if len(batch) >= 2000:
            cur.executemany(insert_sql, batch)
            batch = []

    if batch:
        cur.executemany(insert_sql, batch)
    conn.commit()
    print(f"Loaded {n} price records")
    if skipped_unnamed:
        print(f"Skipped {skipped_unnamed} rows with no Product or By_Product")

    cur.execute("SELECT min(record_date), max(record_date), count(distinct record_date) FROM price_records")
    first, last, days = cur.fetchone()
    print(f"Date range: {first} .. {last} ({days} days)")
    print("Column fill rates (rows with valid min/max):")
    for c in GATED_COLUMNS:
        print(f"  {c:12s} {filled[c] / max(seen, 1):7.1%}")
    location_fill = min(filled[c] for c in ("Province", "District", "Station")) / max(seen, 1)
    if location_fill < MIN_LOCATION_FILL and not args.allow_missing_locations:
        conn.close()
        for p in (tmp_path, tmp_path + "-wal", tmp_path + "-shm"):
            if os.path.exists(p):
                os.remove(p)
        sys.exit(
            f"\nSTOPPED: Province/District/Station are only {location_fill:.1%} filled. The map, location "
            "filters and market counts need them. Re-export with location columns, or pass "
            "--allow-missing-locations to load anyway. The existing database was left untouched."
        )

    print("Creating indexes...")
    cur.executescript("""
        CREATE INDEX idx_pr_prod_bp ON price_records(product, by_product);
        CREATE INDEX idx_pr_date ON price_records(record_date);
        CREATE INDEX idx_pr_ptype ON price_records(price_type);
        CREATE INDEX idx_pr_station ON price_records(station);
        CREATE INDEX idx_pr_district ON price_records(district);
        CREATE INDEX idx_pr_province ON price_records(province);
        CREATE INDEX idx_pr_pvalid ON price_records(price_valid);
        -- A year of data (~300k rows): per-by-product queries filter on
        -- product + by_product and then by date / rate type.
        CREATE INDEX idx_pr_prod_bp_date ON price_records(product, by_product, record_date);
        CREATE INDEX idx_pr_prod_bp_ptype ON price_records(product, by_product, price_type, record_date);
    """)
    conn.commit()

    print("Matching catalog entries to observed price_records...")
    cur.execute("SELECT DISTINCT product, by_product FROM price_records WHERE product IS NOT NULL AND by_product IS NOT NULL")
    source_combos = cur.fetchall()

    cur.execute("SELECT id, normalized_key FROM catalog_entries")
    by_norm_key = {}
    for cid, key in cur.fetchall():
        by_norm_key.setdefault(key, cid)

    cur.execute("SELECT raw_product, raw_by_product, catalog_id FROM catalog_aliases")
    alias_map = {(p, b): cid for p, b, cid in cur.fetchall()}

    matches = {}
    for product, by_product in source_combos:
        cid = alias_map.get((product, by_product))
        if cid is None:
            cid = by_norm_key.get(normalize_key(by_product))
        if cid is not None:
            matches[cid] = (product, by_product)

    print(f"Matched {len(matches)} catalog entries to real data")

    cur.execute("SELECT id, division, by_product FROM catalog_entries ORDER BY id")
    catalog_rows = cur.fetchall()
    for cid, division, catalog_by_product in catalog_rows:
        matched = matches.get(cid)
        if matched:
            product, raw_by_product = matched
            cur.execute("""
                SELECT count(*), count(distinct record_date)
                FROM price_records WHERE product = ? AND by_product = ?
            """, (product, raw_by_product))
            record_count, day_count = cur.fetchone()
        else:
            product, raw_by_product, record_count, day_count = None, None, 0, 0

        display_name = catalog_by_product
        band = MAIZE_MOISTURE_BANDS.get(display_name)
        cur.execute("""
            INSERT INTO by_products (
                id, division, by_product, product, matched_by_product,
                display_name, record_count, day_count, small_sample, has_data, moisture_rule_band
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cid, division, catalog_by_product, product, raw_by_product,
            display_name, record_count, day_count, 1 if 0 < record_count < 30 else 0,
            1 if record_count > 0 else 0, band,
        ))
    conn.commit()

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
            INSERT INTO by_product_attribute_stats (by_product_id, attribute_name, filled_count, total_count, fill_rate, classification)
            SELECT
                bp.id,
                ?,
                count({col}),
                count(*),
                round(cast(count({col}) as real) / count(*), 4),
                CASE
                    WHEN count({col}) = count(*) THEN 'core'
                    WHEN cast(count({col}) as real) / count(*) >= 0.8 THEN 'strong'
                    ELSE 'selective'
                END
            FROM price_records pr
            JOIN by_products bp ON bp.product = pr.product AND bp.matched_by_product = pr.by_product
            WHERE bp.has_data = 1
            GROUP BY bp.id
        """, (attr_name,))
    conn.commit()

    cur.execute("SELECT count(*) FROM price_records")
    print("price_records:", cur.fetchone()[0])
    cur.execute("SELECT count(*) FROM by_products")
    print("by_products:", cur.fetchone()[0])

    cur.execute("ANALYZE")
    conn.commit()
    cur.close()
    conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    conn.close()

    # Swap the new database in only now that the load has succeeded.
    for p in (out_path + "-wal", out_path + "-shm"):
        if os.path.exists(p):
            os.remove(p)
    os.replace(tmp_path, out_path)
    for p in (tmp_path + "-wal", tmp_path + "-shm"):
        if os.path.exists(p):
            os.remove(p)
    print(f"Done: {out_path}. Restart the API to serve the new data.")


if __name__ == "__main__":
    main()
