#!/usr/bin/env python3
"""Load the commodity price XLSX into SQLite and build the derived catalog.

Usage:
    python etl_sqlite.py
"""
import csv
import os
import re
import sqlite3
import openpyxl

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
XLSX_PATH = os.path.join(BASE_DIR, "..", "..", "data", "All Commodity Prices - 15-Aug-2026 to 14-Sept-2026.xlsx")
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


def main():
    print(f"Opening {SQLITE_PATH}")
    if os.path.exists(SQLITE_PATH):
        os.remove(SQLITE_PATH)

    conn = sqlite3.connect(SQLITE_PATH)
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

    print(f"Reading XLSX: {XLSX_PATH}")
    wb = openpyxl.load_workbook(XLSX_PATH, read_only=True, data_only=True)
    ws = wb["Commodity Prices"]
    rows = ws.iter_rows(min_row=7, values_only=True)
    headers = [str(h).strip() if h is not None else "" for h in next(rows)]
    col_idx = {h: i for i, h in enumerate(headers)}

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
    for row_num, row in enumerate(rows, start=8):
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

    print("Creating indexes...")
    cur.executescript("""
        CREATE INDEX idx_pr_prod_bp ON price_records(product, by_product);
        CREATE INDEX idx_pr_date ON price_records(record_date);
        CREATE INDEX idx_pr_ptype ON price_records(price_type);
        CREATE INDEX idx_pr_station ON price_records(station);
        CREATE INDEX idx_pr_district ON price_records(district);
        CREATE INDEX idx_pr_province ON price_records(province);
        CREATE INDEX idx_pr_pvalid ON price_records(price_valid);
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

    cur.close()
    conn.close()
    print("Done generating zarai_mandi.sqlite.")


if __name__ == "__main__":
    main()
