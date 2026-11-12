"""Moisture% cleanup shared by the import (etl_sqlite.py) and the one-off fix of
the existing data (data/clean_moisture_values.py).

Data-entry slips in the export's Moisture% column:
  - ranges typed high-to-low:            "20-12"  -> "12-20"
  - one reading typed as a range:        "10-10"  -> "10"
  - ranges Excel turned into dates:      "30-Oct" -> "10-30"  (10-30 read as 30 October)
Anything else is returned as it was.
"""
import re

_RANGE_RE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*$")
_MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], start=1)}
# "30-Oct" (day-month, as these exports show it) and "Oct-30".
_DAY_MONTH_RE = re.compile(r"^\s*(\d{1,2})\s*-\s*([A-Za-z]{3})\s*$")
_MONTH_DAY_RE = re.compile(r"^\s*([A-Za-z]{3})\s*-\s*(\d{1,2})\s*$")


def _undate(raw):
    """"30-Oct" -> "10-30": the range Excel had turned into a date (month = first number)."""
    m = _DAY_MONTH_RE.match(raw)
    if m and m.group(2).lower() in _MONTHS:
        return f"{_MONTHS[m.group(2).lower()]}-{int(m.group(1))}"
    m = _MONTH_DAY_RE.match(raw)
    if m and m.group(1).lower() in _MONTHS:
        return f"{_MONTHS[m.group(1).lower()]}-{int(m.group(2))}"
    return raw


def clean_moisture(raw):
    """The Moisture% text as it should read: low-high range, or one number."""
    if raw is None:
        return None
    text = str(raw).strip()
    if not text:
        return raw
    text = _undate(text)
    m = _RANGE_RE.match(text)
    if not m:
        return text if text != str(raw).strip() else raw
    lo_s, hi_s = m.group(1), m.group(2)
    lo, hi = float(lo_s), float(hi_s)
    if lo == hi:
        return lo_s
    if lo > hi:
        lo_s, hi_s = hi_s, lo_s
    return f"{lo_s}-{hi_s}"
