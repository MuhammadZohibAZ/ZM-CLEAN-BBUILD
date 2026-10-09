"""Prepare the year export for the backend.

Input : data/prices_2025-09-23_to_2026-09-23 (1).xlsx   (left unchanged)
Output: data/prices_2025-09-23_to_2026-09-23_prepared.xlsx

- Price_Type: most rows before Aug 2026 have none. Each missing series
  (station + product + by-product) gets one price type picked at random
  (seeded, so re-runs give the same result) from PRICE_TYPES, used for all of
  that series' missing days so its price history stays continuous.
- Names: products and by-products are renamed to the names the app uses
  (snake_case export names like "canola_oil" become "Canola Oil", and every
  name takes the catalog's exact spelling, so "wheat" and "Wheat" are one)
  (app/src/customer-face/shared/data/specialAttributes.json / catalog), e.g.
  "Seed Cotton - Grade A" and "phutti_a" -> "Phutti Grade A".
- Rows with no product and no by-product are dropped.

Usage: python data/prepare_year_prices.py
"""
import collections
import csv
import os
import random
import re

import openpyxl
from openpyxl.cell.cell import WriteOnlyCell
from openpyxl.styles import NamedStyle

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "prices_2025-09-23_to_2026-09-23 (1).xlsx")
OUT = os.path.join(HERE, "prices_2025-09-23_to_2026-09-23_prepared.xlsx")
CATALOG = os.path.join(HERE, "..", "api", "db", "catalog_459.csv")
SEED = 20260923

PRICE_TYPES = ["Mandi Rate", "Broker Rate", "Wholesale Rate", "Retail Rate",
               "Dealer Rate", "Stock Rate", "Ex-Mill Rate", "Export Rate"]

PRODUCT_RENAMES = {"Milled-Rice": "Milled Rice"}

# Export spelling -> name used in the app (keys compared case-insensitively).
BYPRODUCT_RENAMES = {
    "seed cotton - grade a": "Phutti Grade A", "phutti_a": "Phutti Grade A",
    "seed cotton - grade b": "Phutti Grade B", "phutti_b": "Phutti Grade B",
    "seed cotton - grade c": "Phutti Grade C", "phutti_c": "Phutti Grade C",
    "cottonseed": "Banola", "cottonseed cake": "Banola Khal", "cottonseed oil": "Banola Oil",
    "mustard seed": "Sarson Seed", "mustard oil": "Sarson Oil", "sarso_oil": "Sarson Oil",
    "mustard cake": "Sarson Khal", "sarso khal": "Sarson Khal", "sarso_khal": "Sarson Khal",
    "canola": "Canola Seed", "sunflower": "Sunflower Seed", "soybean": "Soyabean Seed",
    "soybean meal": "Soyabean Meal", "soybean oil": "Soyabean Oil", "soybean_oil": "Soyabean Oil",
    "soybean oil - washed": "Soyabean Oil - Washed", "taara meera": "Taara Meera Seed",
    "rhode grass": "Rhodes Grass",
    "mango anwer ratul": "Mango Anwar Ratol", "mango black chunsa": "Mango Black Chausa",
    "mango white chunsa": "Mango White Chausa", "mango dasheri": "Mango Daseri", "oranges": "Orange",
    "refined sugar": "Cheeni", "shakkar": "Shakar", "mill_gate": "sugar(mill)", "sugar_mills": "sugar(mill)",
    "brinjal gol": "Gol Brinjal", "brinjal lamba": "Long Brinjal", "garlic desi": "Desi Garlic",
    "lemon desi": "Desi Lemon", "salad leaves": "Salad Leaf", "shakar qandi": "Sweet Potato",
    "chokar": "Wheat Bran", "flour special": "Special Flour", "refined flour": "Maida", "sooji": "Semolina",
    "pk-386": "386 Basmati-New", "tomato (grade c)": "Tomato Grade C",
}


def app_byproduct_name(bp):
    """Export spelling -> app name. Unlisted snake_case names ("canola_oil") become "Canola Oil"."""
    if bp.lower() in BYPRODUCT_RENAMES:
        return BYPRODUCT_RENAMES[bp.lower()]
    if "_" in bp:
        return " ".join(w[:1].upper() + w[1:] for w in bp.replace("_", " ").split())
    return bp


def catalog_key(name):
    """Same name key as api/db/etl_sqlite.py normalize_key."""
    s = str(name).lower().replace(" - ", " ")
    return re.sub(r"\s+", " ", re.sub(r"[/]", " ", s)).strip()


def main():
    # Exact catalog spelling for each name, so case variants ("wheat", "Gram White 7mm")
    # don't split one by-product's rows.
    with open(CATALOG, encoding="utf8") as f:
        catalog_names = {catalog_key(r["by_product"]): r["by_product"] for r in csv.DictReader(f)}

    wb = openpyxl.load_workbook(SRC, read_only=True)
    ws = wb["Prices"]
    rows = ws.iter_rows(values_only=True)
    header = list(next(rows))
    col = {h: i for i, h in enumerate(header)}
    data, dropped = [], 0
    for r in rows:
        if not r or r[0] is None:
            continue
        r = list(r)
        product = (r[col["Product"]] or "").strip()
        bp = (r[col["By_Product"]] or "").strip()
        if not product and not bp:
            dropped += 1
            continue
        r[col["Product"]] = PRODUCT_RENAMES.get(product, product)
        name = app_byproduct_name(bp)
        r[col["By_Product"]] = catalog_names.get(catalog_key(name), name)
        data.append(r)

    # One random price type per series that has missing ones.
    rng = random.Random(SEED)
    series_type = {}
    filled = collections.Counter()
    for r in data:
        if (r[col["Price_Type"]] or "").strip():
            continue
        key = (r[col["Station"]], r[col["Product"]], r[col["By_Product"]])
        if key not in series_type:
            series_type[key] = rng.choice(PRICE_TYPES)
        r[col["Price_Type"]] = series_type[key]
        filled[series_type[key]] += 1

    out = openpyxl.Workbook(write_only=True)
    sheet = out.create_sheet("Prices")
    date_style = NamedStyle(name="zm_date", number_format="yyyy-mm-dd")
    out.add_named_style(date_style)
    sheet.append(header)
    for r in data:
        cells = list(r)
        d = WriteOnlyCell(sheet, value=cells[0])
        d.style = "zm_date"
        cells[0] = d
        sheet.append(cells)
    out.save(OUT)

    print(f"rows written: {len(data)} (dropped {dropped} with no product/by-product)")
    print(f"price types filled: {sum(filled.values())} rows across {len(series_type)} series")
    for t, n in filled.most_common():
        print(f"  {t}: {n}")
    print("saved", OUT)


if __name__ == "__main__":
    main()
