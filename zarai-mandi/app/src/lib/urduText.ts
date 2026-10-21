// Urdu text rules for the voice pack: a TypeScript copy of
// zarai-mandi/tts/urdu_text.py, which the pack generator (tts/) uses to
// name clips. The two must agree, or app text won't match clip names.
//
// normalize() turns app text into what was recorded: one spelling per letter,
// no diacritics, numbers as Urdu words. chunks() splits it at punctuation into
// word lists; cover() finds the fewest clips that spell a chunk.

const ONES = (
  "صفر ایک دو تین چار پانچ چھ سات آٹھ نو " +
  "دس گیارہ بارہ تیرہ چودہ پندرہ سولہ سترہ اٹھارہ انیس " +
  "بیس اکیس بائیس تئیس چوبیس پچیس چھبیس ستائیس اٹھائیس انتیس " +
  "تیس اکتیس بتیس تینتیس چونتیس پینتیس چھتیس سینتیس اڑتیس انتالیس " +
  "چالیس اکتالیس بیالیس تینتالیس چوالیس پینتالیس چھیالیس سینتالیس اڑتالیس انچاس " +
  "پچاس اکیاون باون ترپن چون پچپن چھپن ستاون اٹھاون انسٹھ " +
  "ساٹھ اکسٹھ باسٹھ تریسٹھ چونسٹھ پینسٹھ چھیاسٹھ سڑسٹھ اڑسٹھ انہتر " +
  "ستر اکہتر بہتر تہتر چوہتر پچھتر چھہتر ستتر اٹھتر اناسی " +
  "اسی اکیاسی بیاسی تراسی چوراسی پچاسی چھیاسی ستاسی اٹھاسی نواسی " +
  "نوے اکیانوے بانوے ترانوے چورانوے پچانوے چھیانوے ستانوے اٹھانوے ننانوے"
).split(" ");

const HUNDRED = "سو";
const THOUSAND = "ہزار";
const LAKH = "لاکھ";
const CRORE = "کروڑ";
const POINT = "اعشاریہ";
const PERCENT = "فیصد";

/** Pakistani reading of a whole number: 2850 -> دو ہزار آٹھ سو پچاس, 1121 -> گیارہ سو اکیس. */
export function numberWords(n: number): string {
  if (n < 100) return ONES[n];
  if (n >= 1100 && n <= 1999) {
    // read as hundreds, like years, variety codes and most prices in this range
    const rest = n % 100;
    return `${ONES[Math.floor(n / 100)]} ${HUNDRED}` + (rest ? ` ${ONES[rest]}` : "");
  }
  const parts: string[] = [];
  for (const [size, word] of [[1e7, CRORE], [1e5, LAKH], [1000, THOUSAND], [100, HUNDRED]] as const) {
    if (n >= size) {
      parts.push(`${numberWords(Math.floor(n / size))} ${word}`);
      n %= size;
    }
  }
  if (n) parts.push(ONES[n]);
  return parts.join(" ");
}

// Arabic code points the app's data sometimes uses for Urdu letters, and Urdu/Arabic digits.
const LETTERS: Record<string, string> = { "ي": "ی", "ى": "ی", "ك": "ک", "ه": "ہ", "ۀ": "ۂ" };
for (let i = 0; i < 10; i++) {
  LETTERS[String.fromCharCode(0x06f0 + i)] = String(i);
  LETTERS[String.fromCharCode(0x0660 + i)] = String(i);
}
const LETTER_RE = new RegExp(`[${Object.keys(LETTERS).join("")}]`, "g");
const DIACRITICS = /[ً-ٰٟۖ-ۭ]/g;
const CURRENCY = /(?<![\p{L}\p{N}_])(?:Rs\.?|PKR)\s*(\d[\d,]*(?:\.\d+)?)?/giu;
const NUMBER = /(\d{1,3}(?:,\d{2,3})+|\d+)(?:\.(\d+))?/g;
// Anything that ends a spoken chunk; the voice pauses there.
const BREAK = /[،۔؟!?.,:;؛()[\]{}"“”'‘’/=·•|\-–—\n]+/;
const JUNK = /[^\p{L}\p{N}_\s؀-ۿ]+/gu;

export function normalize(text: string): string {
  let t = text.normalize("NFC").replace(LETTER_RE, (c) => LETTERS[c]);
  t = t.replace(DIACRITICS, "").replace(/‌/g, " ").replace(/‍/g, "");
  t = t.replace(/%/g, ` ${PERCENT} `);
  t = t.replace(CURRENCY, (_m, num?: string) => ` ${num ?? ""} روپے `); // Rs 3,450 -> 3,450 روپے
  t = t.replace(NUMBER, (_m, whole: string, frac?: string) => {
    let words = numberWords(parseInt(whole.replace(/,/g, ""), 10));
    if (frac) words += ` ${POINT} ` + [...frac].map((d) => ONES[Number(d)]).join(" ");
    return ` ${words} `;
  });
  return t.replace(/[ \t]+/g, " ").trim();
}

/** Normalized text -> word lists, one per stretch between punctuation. */
export function chunks(text: string): string[][] {
  const out: string[][] = [];
  for (const part of normalize(text).split(BREAK)) {
    const words = part.replace(JUNK, " ").split(/\s+/).filter(Boolean);
    if (words.length) out.push(words);
  }
  return out;
}

/** Fewest known phrases that spell `words` in order, or null if a word is unknown. */
export function cover(words: string[], known: Set<string> | Map<string, unknown>, maxLen: number): string[] | null {
  const n = words.length;
  const best: (string[] | null)[] = new Array(n + 1).fill(null);
  best[0] = [];
  for (let i = 0; i < n; i++) {
    const here = best[i];
    if (!here) continue;
    for (let j = Math.min(n, i + maxLen); j > i; j--) {
      const k = words.slice(i, j).join(" ");
      const there = best[j];
      if (known.has(k) && (!there || here.length + 1 < there.length)) best[j] = [...here, k];
    }
  }
  return best[n];
}
