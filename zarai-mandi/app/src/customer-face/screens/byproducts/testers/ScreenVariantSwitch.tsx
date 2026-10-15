import { useStoredVariant, VariantSwitch, type VariantOption } from "../../../components/VariantSwitch";

// Testing switch on the by-product screen between the original card grid and
// the tester variants (see customer-face/components/VariantSwitch).

export type ByproductScreenVariant = "original" | "attribute" | "rateType" | "filterBar" | "sidebar";

const STORAGE_KEY = "zm.byproductScreenVariant";

const OPTIONS: VariantOption<ByproductScreenVariant>[] = [
  { id: "original", en: "Original", ur: "اصل", hintEn: "One card per by-product", hintUr: "ہر ضمنی مصنوع کا ایک کارڈ" },
  {
    id: "attribute",
    en: "Special attribute filter",
    ur: "خصوصی وصف فلٹر",
    hintEn: "A card per attribute value",
    hintUr: "ہر وصف کی قدر کا الگ کارڈ",
  },
  {
    id: "rateType",
    en: "Rate type filter",
    ur: "ریٹ کی قسم فلٹر",
    hintEn: "A card per rate type",
    hintUr: "ہر ریٹ کی قسم کا الگ کارڈ",
  },
  {
    id: "filterBar",
    en: "Filter bar",
    ur: "فلٹر بار",
    hintEn: "Rate + attribute bar, like the rates screen",
    hintUr: "ریٹ اور وصف کی بار، ریٹس اسکرین جیسی",
  },
  {
    id: "sidebar",
    en: "Filter sidebar",
    ur: "فلٹر سائیڈ بار",
    hintEn: "Filters in a side panel, cards beside it",
    hintUr: "فلٹر ایک طرف، کارڈز ساتھ",
  },
];
const VARIANTS = OPTIONS.map((o) => o.id);

export function useByproductScreenVariant() {
  return useStoredVariant(STORAGE_KEY, VARIANTS);
}

export function ScreenVariantSwitch({
  variant,
  onChange,
}: {
  variant: ByproductScreenVariant;
  onChange: (v: ByproductScreenVariant) => void;
}) {
  return <VariantSwitch options={OPTIONS} variant={variant} onChange={onChange} />;
}
