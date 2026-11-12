#!/usr/bin/env python3
"""One-off fix of the Moisture% column with the import's own cleanup rules
(api/db/moisture.py): reversed ranges to low-high, "10-10" to "10", and Excel
dates back to ranges ("30-Oct" -> "10-30").

Fixes, in place:
  - the price exports in data/ (only the Moisture% cells are touched; every
    other byte of the sheet is kept), and
  - the app's database api/db/zarai_mandi.sqlite (moisture_raw / _min / _max).

Usage:  python data/clean_moisture_values.py [--dry-run]
New imports clean the column themselves (etl_sqlite.py), so this is needed once.
"""
import argparse
import os
import re
import sqlite3
import sys
import zipfile
from collections import Counter
from html import escape, unescape

HERE = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(HERE, "..", "api", "db")
sys.path.insert(0, DB_DIR)
from moisture import clean_moisture  # noqa: E402

EXPORTS = [
    os.path.join(HERE, "prices_2025-09-23_to_2026-09-23 (1).xlsx"),
    os.path.join(HERE, "prices_2025-09-23_to_2026-09-23_prepared.xlsx"),
]
SQLITE_PATH = os.path.join(DB_DIR, "zarai_mandi.sqlite")
SHEET = "xl/worksheets/sheet1.xml"
SHARED = "xl/sharedStrings.xml"
HEADER = "Moisture%"

CELL_RE = re.compile(r'<c r="([A-Z]+)(\d+)"([^>]*?)(/>|>(.*?)</c>)', re.S)
SI_RE = re.compile(r"<si>(.*?)</si>", re.S)
T_RE = re.compile(r"<t(?:\s[^>]*)?>(.*?)</t>", re.S)


def si_text(si):
    return unescape("".join(T_RE.findall(si)))


def fix_export(path, dry_run):
    with zipfile.ZipFile(path) as z:
        infos = z.infolist()
        data = {i.filename: z.read(i.filename) for i in infos}
    sheet = data[SHEET].decode("utf-8")
    shared_xml = data[SHARED].decode("utf-8") if SHARED in data else None
    shared = [si_text(s) for s in SI_RE.findall(shared_xml)] if shared_xml else []
    index_of = {}
    for i, s in enumerate(shared):
        index_of.setdefault(s, i)
    added = []

    def text_of(attrs, inner):
        if inner is None:
            return None
        if 't="s"' in attrs:
            m = re.search(r"<v>(\d+)</v>", inner)
            return shared[int(m.group(1))] if m else None
        if 't="inlineStr"' in attrs:
            return si_text(inner)
        if 't="str"' in attrs:
            m = re.search(r"<v>(.*?)</v>", inner, re.S)
            return unescape(m.group(1)) if m else None
        return None  # numbers: nothing to clean

    # The Moisture% column, from the header row.
    col = None
    for m in CELL_RE.finditer(sheet):
        if m.group(2) != "1":
            break
        if text_of(m.group(3), m.group(5)) == HEADER:
            col = m.group(1)
    if not col:
        sys.exit(f"No {HEADER} column in {path}")

    changes = Counter()

    def repl(m):
        letter, row, attrs, _, inner = m.groups()
        if letter != col or row == "1":
            return m.group(0)
        old = text_of(attrs, inner)
        if old is None:
            return m.group(0)
        new = clean_moisture(old)
        if new == old:
            return m.group(0)
        changes[(old, new)] += 1
        if 't="s"' in attrs:
            if new not in index_of:
                index_of[new] = len(shared) + len(added)
                added.append(new)
            body = f"<v>{index_of[new]}</v>"
        else:
            body = f"<is><t>{escape(new, quote=False)}</t></is>"
            attrs = re.sub(r'\st="[^"]*"', "", attrs) + ' t="inlineStr"'
        return f'<c r="{letter}{row}"{attrs}>{body}</c>'

    sheet = CELL_RE.sub(repl, sheet)
    total = sum(changes.values())
    print(f"{os.path.basename(path)}: column {col}, {total} cells cleaned")
    for (old, new), n in changes.most_common():
        print(f"    {old!r:>10} -> {new!r:<8} x{n}")
    if dry_run or not total:
        return

    data[SHEET] = sheet.encode("utf-8")
    if added:
        unique = len(shared) + len(added)
        extra = "".join(f"<si><t>{escape(s, quote=False)}</t></si>" for s in added)
        shared_xml = shared_xml.replace("</sst>", extra + "</sst>")
        shared_xml = re.sub(r'uniqueCount="\d+"', f'uniqueCount="{unique}"', shared_xml, count=1)
        data[SHARED] = shared_xml.encode("utf-8")
    tmp = path + ".tmp"
    with zipfile.ZipFile(tmp, "w") as out:
        for i in infos:
            out.writestr(i, data[i.filename], compress_type=i.compress_type or zipfile.ZIP_DEFLATED)
    os.replace(tmp, path)


def fix_database(dry_run):
    con = sqlite3.connect(SQLITE_PATH)
    rows = con.execute("select distinct moisture_raw from price_records where moisture_raw is not null").fetchall()
    changes = {raw: clean_moisture(raw) for (raw,) in rows if clean_moisture(raw) != raw}
    total = 0
    for old, new in sorted(changes.items()):
        n = con.execute("select count(*) from price_records where moisture_raw = ?", (old,)).fetchone()[0]
        total += n
        print(f"    {old!r:>10} -> {new!r:<8} x{n}")
        if not dry_run:
            m = re.match(r"^(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?$", new)
            lo, hi = (float(m.group(1)), float(m.group(2) or m.group(1))) if m else (None, None)
            con.execute(
                "update price_records set moisture_raw = ?, moisture_min = ?, moisture_max = ? where moisture_raw = ?",
                (new, lo, hi, old),
            )
    print(f"zarai_mandi.sqlite: {total} rows cleaned")
    if not dry_run:
        con.commit()
        # Fold the change into the main file (the deploy ships only the .sqlite).
        con.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    con.close()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true", help="only report what would change")
    args = ap.parse_args()
    for path in EXPORTS:
        if os.path.exists(path):
            fix_export(path, args.dry_run)
    fix_database(args.dry_run)


if __name__ == "__main__":
    main()
