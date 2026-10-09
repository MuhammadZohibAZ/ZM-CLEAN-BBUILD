import { useMemo } from "react";

import {
  SPECIAL_ATTR_META,
  specialAttrValueUr,
} from "../../components/ByProductNationalCard";
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

// Tester variant of the by-product screen: one card per by-product and special
// attribute value (e.g. Wheat · Crop New and Wheat · Crop Old), so a card's
// average never mixes values. The chip bar filters the cards by that value.

const NO_ATTRIBUTE = "__none__";

// Filter value = attribute type + value, so e.g. "White" as a Color and as an
// Origin stay separate chips.
function filterValueOf(c: SplitCard): string {
  return c.splitValue !== null && c.stats.specialAttr
    ? `${c.stats.specialAttr.type}|${c.splitValue}`
    : NO_ATTRIBUTE;
}

export function ByProductAttributeFilterScreen(props: TesterBodyProps) {
  const { lang, tc } = useLang();
  const { cards, loading, error } = useSplitCards("attribute", props);

  const options = useMemo<FilterOption[]>(() => {
    const byValue = new Map<string, FilterOption>();
    for (const c of cards) {
      const value = filterValueOf(c);
      const existing = byValue.get(value);
      if (existing) {
        existing.count += 1;
        continue;
      }
      const attr = c.stats.specialAttr;
      if (value === NO_ATTRIBUTE || !attr) {
        byValue.set(value, {
          value,
          label: lang === "ur" ? "بغیر وصف" : "No attribute",
          count: 1,
        });
      } else {
        const meta = SPECIAL_ATTR_META[attr.type];
        byValue.set(value, {
          value,
          caption: lang === "ur" ? meta?.labelUr : meta?.labelEn,
          label: lang === "ur" ? specialAttrValueUr(attr, tc) : attr.valueEn,
          count: 1,
        });
      }
    }
    // Most common values first; "No attribute" always last.
    return [...byValue.values()].sort(
      (a, b) =>
        Number(a.value === NO_ATTRIBUTE) - Number(b.value === NO_ATTRIBUTE) ||
        b.count - a.count,
    );
  }, [cards, lang, tc]);

  const filter = useMultiFilter(options);
  const visible = cards.filter((c) => filter.matches(filterValueOf(c)));
  // Products whose by-products have no special attribute get no filter at all.
  const hasAttributes = options.some((o) => o.value !== NO_ATTRIBUTE);

  return (
    <>
      {hasAttributes && (
        <FilterChipBar
          title={
            lang === "ur" ? "خصوصی وصف کے لحاظ سے" : "By special attribute"
          }
          options={options}
          selected={filter.active}
          onToggle={filter.toggle}
          totalCount={cards.length}
          visibleCount={visible.length}
        />
      )}
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
