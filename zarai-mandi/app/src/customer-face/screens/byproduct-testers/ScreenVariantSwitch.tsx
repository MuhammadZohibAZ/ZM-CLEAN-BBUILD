import { useStoredVariant, VariantSwitch, type VariantOption } from "../../components/VariantSwitch";

// Testing switch on the by-product screen between the original card grid and
// the two tester variants (see ../../components/VariantSwitch).

export type ByproductScreenVariant = "original" | "attribute" | "rateType";

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
