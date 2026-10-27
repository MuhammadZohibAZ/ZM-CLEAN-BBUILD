import type { ComponentProps } from "react";

import { useStoredVariant, VariantSwitch, type VariantOption } from "../../components/VariantSwitch";
import { HomeScreen } from "./original/HomeScreen";
import { AlternativeHomeScreen } from "./alternative/AlternativeHomeScreen";

// Testing switch on the home screen between the original home (home → by-product
// cards → detail) and the alternative home (product rail + by-product carousel).

type HomeVariant = "original" | "alternative";

const STORAGE_KEY = "zm.homeScreenVariant";

const OPTIONS: VariantOption<HomeVariant>[] = [
  {
    id: "original",
    en: "Original",
    ur: "اصل",
    hintEn: "Home, then by-product cards, then detail",
    hintUr: "ہوم، پھر ضمنی مصنوعات کے کارڈ، پھر تفصیل",
  },
  {
    id: "alternative",
    en: "Alternative home",
    ur: "متبادل ہوم",
    hintEn: "Product rail with a by-product carousel",
    hintUr: "مصنوعات کی پٹی اور ضمنی مصنوعات کا کیروسل",
  },
];
const VARIANTS = OPTIONS.map((o) => o.id);

type Props = ComponentProps<typeof AlternativeHomeScreen>;

export function HomeScreenSwitch({ locationScope, ...props }: Props) {
  const [variant, setVariant] = useStoredVariant(STORAGE_KEY, VARIANTS);
  return (
    <>
      {variant === "alternative"
        ? <AlternativeHomeScreen {...props} locationScope={locationScope} />
        : <HomeScreen {...props} />}
      <VariantSwitch options={OPTIONS} variant={variant} onChange={setVariant} />
    </>
  );
}
