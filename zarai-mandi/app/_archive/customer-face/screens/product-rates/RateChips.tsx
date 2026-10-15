import { ALL_RATE_TYPES } from "../../shared/data/rates";
import { shortRate, type Fmt } from "./format";
import { ALL_RATES } from "./selectors";
import { C } from "./theme";
import { Chip, HScroll } from "./ui";

/** Rate type is the most important split in mandi data, so every option is
 * visible (was hidden in a popover). Types with no reports are greyed. */
export function RateChips({
  f,
  tr,
  value,
  onChange,
  available,
  counts,
}: {
  f: Fmt;
  tr: (s: string) => string;
  value: string;
  onChange: (rt: string) => void;
  available: Set<string>;
  counts?: Record<string, number>;
}) {
  const ordered = [...ALL_RATE_TYPES].sort((a, b) => Number(available.has(b)) - Number(available.has(a)));
  return (
    <div style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}>
    <HScroll pad="0 16px 12px 16px">
      <Chip on={value === ALL_RATES} color={C.brand} font={f.font} onClick={() => onChange(ALL_RATES)}>
        {f.tx("All rates", "تمام ریٹ")}
      </Chip>
      {ordered.map((rt) => (
        <Chip
          key={rt}
          on={value === rt}
          color={C.brand}
          font={f.font}
          disabled={!available.has(rt) && value !== rt}
          onClick={() => onChange(rt)}
        >
          {shortRate(tr(rt))}
          {counts && counts[rt] ? <span style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.75 }}>{f.digits(counts[rt])}</span> : null}
        </Chip>
      ))}
    </HScroll>
    </div>
  );
}
