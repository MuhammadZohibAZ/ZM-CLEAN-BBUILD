"""Build the app's product list from data/Verticals-Products-ByProducts-UpdatedPricing.xlsx.

The sheet (English + Urdu tabs) is the final list of verticals, products (each a
subscription, with its price) and by-products. The app fetches rates by the
data's own by-product names (api by_products), so each sheet by-product is
matched to its data name here, and the sheet's English / Urdu names are written
as display names.

Writes app/src/customer-face/shared/data/productSheet.json:
  groups   [{id, en, ur}]                          View All / Complete Profile groups
  products [{name, en, ur, group, division, price, byproducts}]
           name: the app's key for the product (unique); byproducts: data names
  names    {dataName: {en, ur}}                    display names for by-products
  noData   {product: [sheet names]}                listed in the sheet, no rates yet

Run: python data/build_product_sheet.py   (from zarai-mandi/)
"""
import json
import os
import re
import sqlite3
import sys

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
SHEET = os.path.join(HERE, "Verticals-Products-ByProducts-UpdatedPricing.xlsx")
DB = os.path.join(HERE, "..", "api", "db", "zarai_mandi.sqlite")
OUT = os.path.join(HERE, "..", "app", "src", "customer-face", "shared", "data", "productSheet.json")

# Sheet vertical -> app group. Fertilizer and Pesticides are one vertical: Agri-Inputs.
GROUPS = [
    ("Grains", "crops", "Grains", "اناج"),
    ("Vegetables", "vegetables", "Vegetables", None),
    ("Fruits", "fruits", "Fruits", None),
    ("Dry Fruits", "dry-fruits", "Dry Fruits", None),
    ("Herbals", "herbs", "Herbals", None),
    ("Spices", "spices", "Spices", None),
    ("Edible Oils", "edible-oils", "Edible Oils", None),
    ("Grocery", "kiryana", "Grocery", None),
    ("Fertilizer", "agri-inputs", "Agri-Inputs", "زرعی مداخل"),
    ("Pesticides", "agri-inputs", "Agri-Inputs", "زرعی مداخل"),
]

# Where a product's rates are in the data (api division).
def division_for(vertical, product):
    if vertical == "Grains":
        if product in ("Pulses", "Kidney Beans", "Mung Bean", "Moongi"):
            return "Pulses"                 # these share the data's Pulses division
        return product                      # crops: the division is the product (Wheat, Rice, ...)
    if vertical == "Dry Fruits" and product == "Dates":
        return "Dates"
    if vertical == "Edible Oils" and product == "Mustard":
        return "Mustard"
    if product in ("Egg Tray", "Quinoa"):
        return "Classification pending"
    return {
        "Vegetables": "Vegetable", "Fruits": "Fruits", "Dry Fruits": "Dry Fruit", "Herbals": "Herbs",
        "Pulses": "Pulses", "Spices": "Spices", "Edible Oils": "Edible Oil", "Grocery": "Kiryana",
        "Fertilizer": "Fertilizer", "Pesticides": "Fertilizer",
    }[vertical]

DATA_DIVISION = {"Sugar": "Sugarcane/Sugar"}  # app division -> sqlite division name

# Product names that appear in two verticals get a distinct key.
RENAME_PRODUCT = {("Dry Fruits", "Apricot"): ("Dried Apricot", "خشک خوبانی")}

# Sheet name -> data name, where the wording differs (checked against the data).
ALIASES = {
    "Seed Cotton Grade A": "Phutti Grade A", "Seed Cotton Grade B": "Phutti Grade B", "Seed Cotton Grade C": "Phutti Grade C",
    "Cottonseed": "Banola", "Cottonseed Cake": "Banola Khal", "Cottonseed Oil": "Banola Oil",
    "Basmati (386) New": "386 Basmati-New", "Basmati (386) Old": "386 Basmati-Old", "Rice Irri 6": "Irri 6",
    "Rice Irri 9": "Irri 9", "1121 Punia (1)": "Punia 1121-1", "1121 Punia (2)": "Punia 1121-2",
    "Punia Basmati": "Punia Basmati-1", "1121 Sila (1)": "Sella 1121-1", "Basmati Toota": "Tota Basmati",
    "Sabut Irri 6 (Thick)": "Irri 6 Sabut-1", "Sila (386)": "Sella 386", "Sila Punjab": "Sella Punjab",
    "Irri Toota": "Irri Tota", "Short Grain (Toota)": "Short Grain (Tota)", "1509 Sila": "1509 Sella",
    "Round Brinjal": "Gol Brinjal", "Red Local Chilli": "Red Desi Chilli", "Red Hybrid Chilli": "Hybird Chilli",
    "Red Longi Chilli": "Longi Chilli", "Red Rich Star Chilli": "Rich Star Chilli", "Red Shingri Chilli": "Shingri Chilli",
    "Local Garlic": "Desi Garlic", "Harnai Garlic": "Galic Harni", "Cluster Beans": "Guar", "Lemon Local": "Desi Lemon",
    "Seed Potato Grade A": "Potato Beej Grade A", "Seed Potato Grade B": "Potato Beej Grade B", "Seed Potato Grade C": "Potato Beej Grade C",
    "Sapodilla": "Cheeku", "Mandarin Orange": "Mandrin Orange", "Sweet Orange": "Mausambi",
    "Indian Sherbet Berry": "Falsa", "Muskmelon": "Kharbooza", "Pear": "Nashpati",
    "Dried Dates": "Aseel Chuara", "Black Dried Dates": "Black Aseel Chuara", "Dhaki Dates": "Dhaki Dry Dates",
    "Nar Dates": "Nar Chuara", "Rangkat Dhaki Dates": "Rangkat Dhaki Dry Dates", "Rangkat Nar Dates": "Rangkat Nar Chuara",
    "Rangkat Black Dried Dates": "Rangkat Black Aseel Dry Dates", "Munnaqqa": "Large Raisins",
    "Asafoetida": "Hing", "Basil Seed": "Tukh Malanga", "Black Seed": "Kalonji", "Black Seed Oil": "Kalonji Oil",
    "Carom Seed": "Ajwain", "Fennel Seed": "Saunf", "Psyllium Seed": "Ispaghol", "Psyllium Husk": "Ispaghol Husk",
    "Saffron": "Zafran", "Salep (Round Tuber)": "Salab Misri", "Salep (Palmate Tuber)": "Salab Panja",
    "Split Gram-Thick AS": "Gram Pulse-Thick AS", "Split Gram-Thin AS": "Gram Pulse-Thin AS",
    "White Kidney Beans-Thick": "White Lubya-Thick", "White Kidney Beans-Thin": "White Lubya-Thin",
    "Red Kidney Beans-1": "Red Lubya-1", "Red Kidney Beans-2": "Red Lubya-2",
    "Black Gram Whole-2": "Mash Sabut-2", "Black Gram Shell-Thick": "Mash Shell-Thick", "Black Gram Shell-Thin-2": "Mash Shell Thin",
    "Black Gram Washed-Thick": "Mash Washed-Thick", "Black Gram Washed-Thin": "Mash Washed-Thin",
    "Whole Lentil-1": "Masoor Sabut-1", "Whole Lentil-2": "Masoor Sabut-2", "Split Red Lentil": "Masoor Pulse Red",
    "Mung Bean Whole-1": "Moong Sabut-1", "Mung Bean Whole-2": "Moong Sabut-2", "Mung Bean Shell-1": "Moong Shell-1",
    "Mung Bean Washed-1": "Moong Washed-1", "Mung Bean Washed-2": "Moong Washed-2", "Nutmeg": "Jaifal",
    "Mustard Cake": "Sarson Khal", "Mustard Seed": "Sarson Seed", "Mustard Oil": "Sarson Oil",
    "Rocket Seed": "Taara Meera Seed", "Rocket Seed Oil": "Taara Meera-Oil",
    "Ammonium Sulphate (FMC)": "FMC Ammonium Sulphate", "SOP - Granular (FMC)": "FMC SOP - Granular", "WS-SOP (Posh)": "Posh WS-SOP",
    "Lint Cotton": "Lint Cotton (Rui)", "White Sugar": "Cheeni", "Powdered Jaggery": "Shakar", "Refined Flour": "Maida",
    "Wheat Straw": "Straw", "Wheat Porridge": "Wheat Daliya", "Sorghum": "Sorgham", "Semolina": "Samolina",
}

# Data by-products with rates that the sheet doesn't list: kept under their
# product so no rates are lost, with a display name in the sheet's style.
EXTRAS = {
    ("Vegetables", "Potato"): [("Potato (Beej)", "Seed Potato", "آلو بیج"), ("Potato (Goli)", "Small Potato", "آلو گولی"),
                               ("Potato (Laal)", "Red Potato", "آلو لال"), ("Potato (Sufaid)", "White Potato", "آلو سفید"),
                               ("Potato (Lr)", "Potato LR", "آلو ایل آر"), ("Potato (Mozika)", "Potato Mozika", "آلو موزیکا"),
                               ("Potato (Santa)", "Potato Santa", "آلو سانتا"), ("Potato (Raveera)", "Potato Raveera", "آلو رویرا"),
                               ("Potato (Stone)", "Potato Stone", "آلو اسٹون")],
    ("Vegetables", "Chilli"): [("Desi Chilli", "Local Chilli", "دیسی مرچ")],
    ("Dry Fruits", "Dates"): [("Amber Dates", "Amber Dates", "امبر کھجور"), ("Rangkat Aseel Chuara", "Rangkat Dried Dates", "رنگکٹ چھوارا")],
    ("Grains", "Pulses"): [("Mash Washed-1", "Black Gram Washed-1", "ماش دھلی 1"), ("Mash Washed-2", "Black Gram Washed-2", "ماش دھلی 2"),
                           ("Gram Pulse-Thick", "Split Gram-Thick", "چنے کی دال موٹی"), ("Gram Pulse-Thin", "Split Gram-Thin", "چنے کی دال باریک")],
    ("Spices", "Red Chilli"): [("Red Hybird Chilli", "Red Hybrid Chilli", "لال ہائبرڈ مرچ"), ("Red Longi Chilli", "Red Longi Chilli", "لال لونگی مرچ"),
                               ("Red Rich Star Chilli", "Red Rich Star Chilli", "لال رچ اسٹار مرچ"), ("Red Shingri Chilli", "Red Shingri Chilli", "لال شنگری مرچ"),
                               ("Red Summer Queen Chilli", "Red Summer Queen Chilli", "لال سمر کوئین مرچ")],
    ("Grains", "Rice"): [("Sella 1121-2", "1121 Sila (2)", "1121 سیلا (2)")],
    ("Grains", "Sugar"): [("sugar(mill)", "Sugar (Mill)", "چینی (مل)")],
}

norm = lambda s: re.sub(r"[^a-z0-9]", "", str(s).lower())


def read_tab(ws):
    merged = {}
    for m in ws.merged_cells.ranges:
        v = ws.cell(m.min_row, m.min_col).value
        for r in range(m.min_row, m.max_row + 1):
            for c in range(m.min_col, m.max_col + 1):
                merged[(r, c)] = v
    rows = []
    for r in range(2, ws.max_row + 1):
        row = [merged.get((r, c), ws.cell(r, c).value) for c in range(1, 5)]
        if row[0] and row[1] and row[2]:
            rows.append((r, [str(x).strip() if isinstance(x, str) else x for x in row]))
    return rows


def main():
    wb = openpyxl.load_workbook(SHEET)
    en, ur = read_tab(wb["English"]), read_tab(wb["Urdu"])
    assert [r for r, _ in en] == [r for r, _ in ur], "English and Urdu tabs are not row-aligned"
    db = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    data = {}
    for div, bp, has in db.execute("select division, by_product, has_data from by_products"):
        data.setdefault(div, {})[norm(bp)] = (bp, bool(has))

    vert_ur = {}
    products, names, no_data, problems = {}, {}, {}, []
    for (_, (v, p, b, price)), (_, (vu, pu, bu, _)) in zip(en, ur):
        vert_ur.setdefault(v, vu)
        key, key_ur = RENAME_PRODUCT.get((v, p), (p, pu))
        div = division_for(v, p)
        P = products.setdefault(key, {"name": key, "en": key, "ur": key_ur, "vertical": v, "division": div,
                                      "price": None, "byproducts": [], "_sheet": (v, p)})
        if isinstance(price, (int, float)):
            P["price"] = int(price)
        pool = data.get(DATA_DIVISION.get(div, div), {})
        hit = pool.get(norm(b)) or pool.get(norm(ALIASES.get(b, "")))
        if hit:
            dname = hit[0]
            if dname not in P["byproducts"]:
                P["byproducts"].append(dname)
            prev = names.get(dname)
            if prev and prev != {"en": b, "ur": bu}:
                problems.append(f"{dname}: shown as {prev['en']} and {b}")
            names.setdefault(dname, {"en": b, "ur": bu})
            if not hit[1]:
                no_data.setdefault(key, []).append(b)
        else:
            no_data.setdefault(key, []).append(b)
            P["byproducts"].append(b)               # listed, no rates yet (card stays hidden)
            names.setdefault(b, {"en": b, "ur": bu})

    for (v, p), extra in EXTRAS.items():
        P = products[RENAME_PRODUCT.get((v, p), (p,))[0]]
        pool = data.get(DATA_DIVISION.get(P["division"], P["division"]), {})
        for dname, en_name, ur_name in extra:
            assert norm(dname) in pool, f"{dname} not in data division {P['division']}"
            if dname not in P["byproducts"]:
                P["byproducts"].append(dname)
            names.setdefault(dname, {"en": en_name, "ur": ur_name})

    # A display name must not rename a product's own name (they share one lookup).
    product_keys = set(products)
    for k in list(names):
        if k in product_keys and names[k]["en"] != k:
            problems.append(f"by-product '{k}' is also a product name; kept as '{k}' (sheet says '{names[k]['en']}')")
            names[k] = {"en": k, "ur": products[k]["ur"]}
    for k in product_keys:
        names.setdefault(k, {"en": k, "ur": products[k]["ur"]})
        names[k]["ur"] = products[k]["ur"]

    groups, seen = [], set()
    for v, gid, gen, gur in GROUPS:
        if gid in seen:
            continue
        seen.add(gid)
        groups.append({"id": gid, "en": gen, "ur": gur or vert_ur.get(v, gen)})
    gid_of = {v: gid for v, gid, *_ in GROUPS}
    out_products = []
    for P in products.values():
        v = P.pop("vertical")
        P.pop("_sheet")
        P["group"] = gid_of[v]
        out_products.append(P)
    order = {g["id"]: i for i, g in enumerate(groups)}
    out_products.sort(key=lambda P: order[P["group"]])  # stable: sheet order inside a group

    json.dump({"_comment": "Generated by data/build_product_sheet.py from Verticals-Products-ByProducts-UpdatedPricing.xlsx. Do not edit by hand.",
               "groups": groups, "products": out_products, "names": dict(sorted(names.items())), "noData": no_data},
              open(OUT, "w", encoding="utf8"), ensure_ascii=False, indent=1)

    sys.stdout.reconfigure(encoding="utf8")
    n_bp = sum(len(P["byproducts"]) for P in out_products)
    print(f"groups {len(groups)}, products {len(out_products)}, by-products {n_bp}, without rates {sum(map(len, no_data.values()))}")
    print("prices:", sorted({P['price'] for P in out_products}))
    for p in problems:
        print("NOTE:", p)


if __name__ == "__main__":
    main()
