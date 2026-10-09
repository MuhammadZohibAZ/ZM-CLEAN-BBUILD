"""Apply the special attribute per by-product from the verticals workbook to the
app/API map (app/src/customer-face/shared/data/specialAttributes.json).

Source: data/Verticals-Product-ByProducts - Copy.xlsx — one sheet per vertical,
columns "Product" and "Special Attribute". "Price Type", "---" and blanks mean
no special attribute (null).

Existing keys get the workbook's value; workbook names not in the map yet are
added to a "Verticals workbook" section. Keys are normalized names (lowercase,
a-z0-9 only), the same lookup the app and API use.

Usage: python data/sync_special_attributes.py [--dry]
"""
import json
import os
import re
import sys

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
WORKBOOK = os.path.join(HERE, "Verticals-Product-ByProducts - Copy.xlsx")
MAP = os.path.join(HERE, "..", "app", "src", "customer-face", "shared", "data", "specialAttributes.json")
SHEETS = ["Grains", "Vegetables", "Fruits", "Dry Fruits", "Herbals", "Pulses", "Spices", "Chillies",
          "Edible Oils", "Ghee", "Mills", "Live Stock", "Slaughter House", "Dairy", "Fertilizer"]

ATTRS = {
    "quality": "quality", "phutti quality": "quality", "new_old": "newOld", "new/old": "newOld",
    "color": "color", "moisture": "moisture", "origin": "origin", "variety": "variety",
    "specification": "spec",
}
# The workbook's spelling -> also the app's spelling where they differ.
ALIASES = {"samolina": ["semolina"], "sorgham": ["sorghum"], "samolinasuji": ["semolinasuji"],
           "sorghamjowar": ["sorghumjowar"], "sugercane": ["sugarcane"], "banolaseed": ["banola"],
           "lintcottonrui": ["lintcotton"], "grapefruit": ["grapefruit"]}

norm = lambda s: re.sub(r"[^a-z0-9]", "", (s or "").lower())


def names(product):
    """One workbook product cell -> the by-product names it stands for."""
    p = re.sub(r"\s*\([^)]*[؀-ۿ][^)]*\)", "", str(product)).strip()  # drop "(Urdu)"
    m = re.match(r"(.*?)\s*\(\s*grade\s*([a-d](?:\s*[|/]\s*[a-d])*)\s*\)\s*$", p, re.I) or \
        re.match(r"(.*?)\s+grade\s*\(\s*([a-d](?:\s*[|/]\s*[a-d])*)\s*\)\s*$", p, re.I)
    if m:
        return [f"{m.group(1)} Grade {g.upper()}" for g in re.split(r"\s*[|/]\s*", m.group(2))]
    return [p]


def main():
    wb = openpyxl.load_workbook(WORKBOOK, read_only=True)
    sheet_map = {}
    for name in SHEETS:
        rows = [r for r in wb[name].iter_rows(values_only=True) if any(v not in (None, "") for v in r)]
        hdr = [str(h).strip() if h else "" for h in rows[2]]
        pi, ai = hdr.index("Product"), hdr.index("Special Attribute")
        for r in rows[3:]:
            product, attr = r[pi], r[ai]
            if not product or not str(r[0] or "").strip() or not re.match(r"^[\d.]+$", str(r[0]).strip()):
                continue  # section headings
            value = ATTRS.get(str(attr or "").strip().lower())  # Price Type / --- / blank -> None
            for n in names(product):
                for key in [norm(n)] + ALIASES.get(norm(n), []):
                    sheet_map[key] = value

    doc = json.load(open(MAP, encoding="utf8"))
    current = {k: (sec, v) for sec, d in doc.items() if not sec.startswith("_") for k, v in d.items()}
    changed, added = [], []
    for key, value in sheet_map.items():
        if key in current:
            sec, old = current[key]
            if old != value:
                changed.append((key, old, value))
                doc[sec][key] = value
        else:
            added.append((key, value))
            doc.setdefault("Verticals workbook", {})[key] = value
    print(f"workbook entries: {len(sheet_map)}; changed: {len(changed)}; added: {len(added)}")
    for c in changed: print("  changed", c)
    for a in added: print("  added", a)
    if "--dry" not in sys.argv:
        with open(MAP, "w", encoding="utf8", newline="\n") as f:
            json.dump(doc, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print("saved", MAP)


if __name__ == "__main__":
    main()
