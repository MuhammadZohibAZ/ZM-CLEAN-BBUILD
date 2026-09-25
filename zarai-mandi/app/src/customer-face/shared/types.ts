//  TYPES

export type RateItem = {
  vertical: string;
  product: string;
  byproduct: string;
  mandiName?: string;
  rateType?: string;
};
export type Screen =
  | { id: "home" }
  | { id: "search" }
  | { id: "mandi-list" }
  | {
    id: "mandi-detail";
    mandiId: string;
  }
  | { id: "product-select" }
  | { id: "byproduct-select" }
  | {
    id: "rates-result";
    items: RateItem[];
    source: "product" | "byproduct";
  }
  | {
    id: "byproduct-combined";
    products: { vertical: string; product: string }[];
    active: number;
  }
  | {
    id: "product-rates";
    vertical: string;
    product: string;
    byproduct: string;
    initialRateType?: string;
    initialMandi?: string;
    initialVariety?: string;
    initialNewOld?: string;
    initialColor?: string;
    initialSpec?: string;
    initialCondition?: string;
    initialMoisture?: string;
    initialStatDate?: string;
  }
  | { id: "compare" }
  | { id: "news" }
  | {
    id: "live-market";
  }
  | {
    id: "billing";
    product: string;
    vertical?: string;
  };

export type LocationScope = {
  kind: "district" | "province" | "pakistan" | "mandi";
  label: string;
};

export type NavTab = "home" | "compare" | "news" | "voice";
export type TimeRange = "day" | "week" | "month" | "year";

export type FeedMsg = {
  id: number;
  time: string;
  vertical: string;
  productUrdu: string;
  product: string;
  byproduct: string;
  stationUrdu: string;
  station: string;
  province: string;
  priceMin: number;
  priceMax: number;
  unit: string;
  arrivalCount: string;
  arrivalUnit: string;
  arrivalUnitUrdu: string;
  colorUrdu: string;
  color: string;
  rateType: string;
  specUrdu: string;
  spec: string;
  qualityUrdu: string;
  quality: string;
  qualityTypeUrdu: string;
  qualityType: string;
  trend?: "up" | "down" | "stable";
  trendPct?: number;
};

//  PRODUCT DIVISIONS

export type ProdDiv = {
  name: string;
  type: "product" | "vertical";
  img?: string;
  byproducts?: string[];
  products?: Record<string, string[]>;
};

export type AppProps = {
  initialUserData?: {
    name?: string;
    phone?: string;
    profession?: string;
    contact?: string;
    role?: "customer" | "representative";
    products?: string[];
    city?: string;
    district?: string;
    province?: string;
  };
  activeRole?: "customer" | "representative";
  hasRepAccount?: boolean;
  onSwitchRole?: (role: "customer" | "representative") => void;
  onStartRepOnboarding?: () => void;
  onRestartOnboarding?: (mode?: "register" | "signin") => void;
};

//  FEED MODAL — 4-dimension filter

export type FeedFilter = {
  products: string[];
  byproducts: string[];
  stations: string[];
  rateTypes: string[];
};

//  product (PRODUCT) SELECT

export type ProductSel = { vertical: string; product: string };

// ─── CATALOG ATTRIBUTE POLICY & HIGH PERFORMANCE CALCULATION ENGINE ─────────

export interface SpecialAttrItem {
  type: 'moisture' | 'newOld' | 'color' | 'variety' | 'spec' | 'origin' | 'quality' | 'multi';
  labelEn: string;
  labelUr: string;
  valueEn: string;
  valueUr: string;
  dotColor?: string;
  filterFn: (r: RichRow) => boolean;
}

export interface SpecialAttrInfo {
  type: 'moisture' | 'newOld' | 'color' | 'variety' | 'spec' | 'origin' | 'quality' | 'multi';
  labelEn: string;
  labelUr: string;
  valueEn: string;
  valueUr: string;
  dotColor?: string;
  filterFn?: (r: RichRow) => boolean;
}

export interface ByproductNationalStats {
  hasData: boolean;
  catalogId?: number;
  product: string;
  byproduct: string;
  mostOccurringRateType: string;
  otherRateTypesCount: number;
  allRateTypes: string[];
  avgMin: number;
  avgMax: number;
  totalArrival: number;
  markets: number;
  arrivalCoverage?: number;
  specialAttr: SpecialAttrInfo | null;
  specialAttrs?: SpecialAttrInfo[];
}

export type RichRow = {
  product: string;
  byproduct: string;
  emoji: string;
  rateType: string;
  arrival: string;
  min: number;
  max: number;
  trend: "up" | "down" | "stable";
  trendPct: number;
  mandiName: string;
  mandiCity: string;
  province: string;
  vertical?: string;
  variety?: string;
  color?: string;
  spec?: string;
  condition?: string;
  newOld?: string;
  quality?: string;
  moisture?: string;
  origin?: string;
  area?: string;
  date?: string;
  arrivalUnit?: string;
};

// ─── COMPLETE YOUR PROFILE MODAL & STATE ──────────────────────────────────────

export interface ProfileSetupData {
  step: number;
  furthestStep: number;
  province: string;
  district: string;
  city: string;
  selectedMandis?: string[];
  selectedProds: string[];
  dur: number;
  customMode: boolean;
  customMonths: number;
  paymentType: "card" | "wallet" | "direct";
  walletProvider: "jazzcash" | "easypaisa" | "sadapay" | "nayapay" | "upaisa";
  walletNumber: string;
  walletCnic: string;
  walletPromptSent?: boolean;
  directMethod: "jazzcash" | "easypaisa" | "bank";
  hasReceipt: boolean;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardHolder: string;
}

// CustomerFaceProps alias
export type CustomerFaceProps = AppProps;
