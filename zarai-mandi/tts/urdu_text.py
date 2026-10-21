"""Urdu text rules for the voice pack (generate_pack_edge.py names clips by them).
app/src/lib/urduText.ts is the browser copy and must agree with this file, or
app text won't match clip names.

normalize() turns app text into what the voice reads: one spelling per letter,
no diacritics, and numbers as Urdu words. chunks() splits normalized text at punctuation into
word lists; cover() finds the fewest pre-generated clips that spell a chunk.
"""

from __future__ import annotations

import re
import unicodedata

ONES = (
    "صفر ایک دو تین چار پانچ چھ سات آٹھ نو "
    "دس گیارہ بارہ تیرہ چودہ پندرہ سولہ سترہ اٹھارہ انیس "
    "بیس اکیس بائیس تئیس چوبیس پچیس چھبیس ستائیس اٹھائیس انتیس "
    "تیس اکتیس بتیس تینتیس چونتیس پینتیس چھتیس سینتیس اڑتیس انتالیس "
    "چالیس اکتالیس بیالیس تینتالیس چوالیس پینتالیس چھیالیس سینتالیس اڑتالیس انچاس "
    "پچاس اکیاون باون ترپن چون پچپن چھپن ستاون اٹھاون انسٹھ "
    "ساٹھ اکسٹھ باسٹھ تریسٹھ چونسٹھ پینسٹھ چھیاسٹھ سڑسٹھ اڑسٹھ انہتر "
    "ستر اکہتر بہتر تہتر چوہتر پچھتر چھہتر ستتر اٹھتر اناسی "
    "اسی اکیاسی بیاسی تراسی چوراسی پچاسی چھیاسی ستاسی اٹھاسی نواسی "
    "نوے اکیانوے بانوے ترانوے چورانوے پچانوے چھیانوے ستانوے اٹھانوے ننانوے"
).split()
assert len(ONES) == 100

HUNDRED, THOUSAND, LAKH, CRORE = "سو", "ہزار", "لاکھ", "کروڑ"
POINT, PERCENT = "اعشاریہ", "فیصد"

# Words the number reader and common templates need as clips of their own.
CORE_WORDS = ONES[1:] + [ONES[0], HUNDRED, THOUSAND, LAKH, CRORE, POINT, PERCENT, "روپے", "فی", "من", "کلو"]


def number_words(n: int) -> str:
    """Pakistani reading of a whole number: 2850 -> دو ہزار آٹھ سو پچاس, 1121 -> گیارہ سو اکیس."""
    if n < 100:
        return ONES[n]
    if 1100 <= n <= 1999:  # read as hundreds, like years, variety codes and most prices in this range
        rest = n % 100
        return f"{ONES[n // 100]} {HUNDRED}" + (f" {ONES[rest]}" if rest else "")
    parts = []
    for size, word in ((10**7, CRORE), (10**5, LAKH), (1000, THOUSAND), (100, HUNDRED)):
        if n >= size:
            parts.append(f"{number_words(n // size)} {word}")
            n %= size
    if n:
        parts.append(ONES[n])
    return " ".join(parts)


def _read_number(match: re.Match) -> str:
    whole, frac = match.group(1).replace(",", ""), match.group(2)
    words = number_words(int(whole))
    if frac:
        words += f" {POINT} " + " ".join(ONES[int(d)] for d in frac)
    return f" {words} "


# Arabic code points the app's data sometimes uses for Urdu letters.
LETTERS = str.maketrans({
    "ي": "ی",  # ي -> ی
    "ى": "ی",  # ى -> ی
    "ك": "ک",  # ك -> ک
    "ه": "ہ",  # ه -> ہ
    "ۀ": "ۂ",  # ۀ
    **{chr(0x06F0 + i): str(i) for i in range(10)},  # ۰-۹
    **{chr(0x0660 + i): str(i) for i in range(10)},  # ٠-٩
})
DIACRITICS = re.compile("[ً-ٰٟۖ-ۭ]")
CURRENCY = re.compile(r"\b(?:Rs\.?|PKR)\s*(\d[\d,]*(?:\.\d+)?)?", re.IGNORECASE)
NUMBER = re.compile(r"(\d{1,3}(?:,\d{2,3})+|\d+)(?:\.(\d+))?")
# Anything that ends a spoken chunk; the voice pauses there.
BREAK = re.compile(r"[،۔؟!?.,:;؛()\[\]{}\"“”'‘’/=·•|\-–—\n]+")
JUNK = re.compile(r"[^\w\s؀-ۿ]+")


def normalize(text: str) -> str:
    t = unicodedata.normalize("NFC", text).translate(LETTERS)
    t = DIACRITICS.sub("", t).replace("‌", " ").replace("‍", "")
    t = t.replace("%", f" {PERCENT} ")
    t = CURRENCY.sub(lambda m: f" {m.group(1) or ''} روپے ", t)  # Rs 3,450 -> 3,450 روپے
    t = NUMBER.sub(_read_number, t)
    return re.sub(r"[ \t]+", " ", t).strip()


def chunks(text: str) -> list[list[str]]:
    """Normalized text -> word lists, one per stretch between punctuation."""
    out = []
    for part in BREAK.split(normalize(text)):
        words = JUNK.sub(" ", part).split()
        if words:
            out.append(words)
    return out


def key(words: list[str]) -> str:
    return " ".join(words)


def cover(words: list[str], known: set[str], max_len: int) -> list[str] | None:
    """Fewest known phrases that spell `words` in order, or None if a word is unknown."""
    n = len(words)
    best: list[list[str] | None] = [None] * (n + 1)
    best[0] = []
    for i in range(n):
        if best[i] is None:
            continue
        for j in range(min(n, i + max_len), i, -1):
            k = key(words[i:j])
            if k in known and (best[j] is None or len(best[i]) + 1 < len(best[j])):
                best[j] = best[i] + [k]
    return best[n]
