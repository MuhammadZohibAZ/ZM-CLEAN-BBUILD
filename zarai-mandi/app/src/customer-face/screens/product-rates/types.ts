import type { LocationScope, RateItem, Screen } from "../../shared/types";

/** One API record, normalised for this screen. */
export type MarketRow = {
  id: string;
  date: string; // YYYY-MM-DD
  rateType: string;
  mandiName: string; // "Okara Mandi"
  district: string;
  province: string;
  min: number;
  max: number;
  arrival: number;
  arrivalUnit: string;
  variety?: string;
  color?: string;
  origin?: string;
  spec?: string;
  newOld?: string;
  quality?: string;
  moisture?: string;
  /** "HH:MM" the report came in, when the source records it. */
  reportedAt?: string;
};

export type AttrKey = "newOld" | "variety" | "moisture" | "color" | "spec" | "origin" | "quality";
export type AttrFilters = Partial<Record<AttrKey, string>>;

export type ChangeInterval = 1 | 3 | 7 | 30;
/** "none" = the reports' own order (nothing selected). */
export type SortKey = "none" | "nameAZ" | "nameZA" | "priceHigh" | "priceLow" | "arrivalHigh" | "arrivalLow" | "arrival" | "change";

export type ProductRatesProps = {
  vertical: string;
  product: string;
  byproduct: string;
  onBack: () => void;
  push?: (s: Screen) => void;
  isPickedBP?: (item: RateItem) => boolean;
  togglePickBP?: (item: RateItem) => void;
  locationScope?: LocationScope;
  onOpenLocation?: () => void;
  initialRateType?: string;
  initialMandi?: string;
  initialVariety?: string;
  initialNewOld?: string;
  initialColor?: string;
  initialSpec?: string;
  initialCondition?: string;
  initialOrigin?: string;
  initialMoisture?: string;
  initialStatDate?: string;
  initialAvgMin?: number;
  initialAvgMax?: number;
  initialTotalArrival?: number;
  initialMarkets?: number;
};
