import { useMemo } from "react";

import { useLang } from "../../shared/i18n/LangProvider";
import {
  FilterChipBar,
  SplitCardGrid,
  useMultiFilter,
  useSplitCards,
  type FilterOption,
  type SplitCard,
  type TesterBodyProps,
} from "./splitCards";

// Tester variant of the by-product screen: one card per by-product and rate
// type (Mandi, Wholesale, Broker, ...), so a card's average only uses prices of
// one rate type. The chip bar filters the cards by rate type.

const NO_DATA = "__none__";
// Shown right after All; the other rate types follow by card count.
const PRIORITY_RATE = "Mandi Rate";

function filterValueOf(c: SplitCard): string {
  return c.splitValue ?? NO_DATA;
}

export function ByProductRateTypeFilterScreen(props: TesterBodyProps) {
  const { lang, tr } = useLang();
  const { cards, loading, error } = useSplitCards("rateType", props);

  const options = useMemo<FilterOption[]>(() => {
    const counts = new Map<string, number>();
    for (const c of cards) counts.set(filterValueOf(c), (counts.get(filterValueOf(c)) || 0) + 1);
    return [...counts.entries()]
      .map(([value, count]) => ({
        value,
        // By-products with no records this month have no rate type to split on.
        label: value === NO_DATA ? (lang === "ur" ? "ڈیٹا نہیں" : "No data") : tr(value),
        count,
      }))
      .sort(
        (a, b) =>
          Number(b.value === PRIORITY_RATE) - Number(a.value === PRIORITY_RATE) ||
          Number(a.value === NO_DATA) - Number(b.value === NO_DATA) ||
          b.count - a.count
      );
  }, [cards, lang, tr]);

  const filter = useMultiFilter(options);
  const visible = cards.filter((c) => filter.matches(filterValueOf(c)));

  return (
    <>
      <FilterChipBar
        title={lang === "ur" ? "ریٹ کی قسم کے لحاظ سے" : "By rate type"}
        options={options}
        selected={filter.active}
        onToggle={filter.toggle}
        totalCount={cards.length}
        visibleCount={visible.length}
      />
      <SplitCardGrid
        cards={visible}
        loading={loading}
        error={error}
        curDate={props.curDate}
        curDateStr={props.curDateStr}
        push={props.push}
      />
    </>
  );
}
