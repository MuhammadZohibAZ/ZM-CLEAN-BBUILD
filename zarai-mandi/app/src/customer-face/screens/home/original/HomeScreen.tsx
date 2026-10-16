import React, { useState, useEffect, useMemo, useRef } from "react";
import farmHeroBg from "../../../../assets/farm_hero_bg.png";
import homeBgMint from "../../../../assets/home_bg_mint.jpg";

import { LockIconSVG } from "../../../components/icons";
import {
  
  PRODUCT_DIVISIONS,
  PRODUCT_ID_TO_NAME,
  SUBSCRIBED_PRODUCTS,
  TODAY_ONLY_PRODUCTS,
  VERTICALS,
} from "../../../shared/data/catalog";
import { getproductIconSrc } from "../../../shared/data/icons";
import { useLang } from "../../../shared/i18n/LangProvider";
import {
  type AppProps,
  type ProfileSetupData,
  
  type RateItem,
  
  type Screen,
} from "../../../shared/types";
import { speakText, stopSpeaking } from "../../../shared/voice";
import { CompleteProfileModal } from "../../../sheets/complete-profile/CompleteProfileModal";
import { AccountCenter, type AccountView } from "../../../account/AccountCenter";
import { fetchByProducts, type ByProductCatalogRow } from "../../../../lib/api";
import type { SearchEntry } from "../shared/SearchProfilePanel";
import { HomeHero } from "../shared/HomeHero";
import { HomeFavoritesSection } from "./HomeFavoritesSection";
import { HomeProductsSection } from "./HomeProductsSection";
import { ProductCategoriesSheet } from "./ProductCategoriesSheet";
import { FavoriteCardsRow } from "../../../components/FavoriteCardsRow";

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────

export function HomeScreen({
  push,
  setFeedOpen,
  pickedByproducts,
  togglePickBP = () => { },
  isPickedBP = () => false,
  setPickedByproducts,
  voiceGuideActive = false,
  onVoiceGuideClose,
  initialUserData,
  activeRole = "customer",
  hasRepAccount = false,
  onSwitchRole,
  onStartRepOnboarding,
  onRestartOnboarding,
  profileCompleted: parentProfileCompleted = false,
  setProfileCompleted: parentSetProfileCompleted,
  completeProfileOpen: parentCompleteProfileOpen = false,
  setCompleteProfileOpen: parentSetCompleteProfileOpen,
  profileSetupData: parentProfileSetupData,
  updateProfileSetupData: parentUpdateProfileSetupData,
  onCompleteProfileSubmit: parentOnCompleteProfileSubmit,
  userSubscribedList: parentUserSubscribedList,
  setUserSubscribedList: parentSetUserSubscribedList,
}: {
  push: (s: Screen) => void;
  setFeedOpen: (v: boolean) => void;
  pickedByproducts: RateItem[];
  togglePickBP: (item: RateItem) => void;
  isPickedBP: (item: RateItem) => boolean;
  setPickedByproducts: React.Dispatch<React.SetStateAction<RateItem[]>>;
  voiceGuideActive?: boolean;
  onVoiceGuideClose?: () => void;
  initialUserData?: AppProps["initialUserData"];
  activeRole?: "customer" | "representative";
  hasRepAccount?: boolean;
  onSwitchRole?: (role: "customer" | "representative") => void;
  onStartRepOnboarding?: () => void;
  onRestartOnboarding?: (mode?: "register" | "signin") => void;
  profileCompleted?: boolean;
  setProfileCompleted?: React.Dispatch<React.SetStateAction<boolean>>;
  completeProfileOpen?: boolean;
  setCompleteProfileOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  profileSetupData?: ProfileSetupData;
  updateProfileSetupData?: (partial: Partial<ProfileSetupData>) => void;
  onCompleteProfileSubmit?: (
    selected: string[],
    locationData?: { province: string; district: string; city: string },
  ) => void;
  userSubscribedList?: string[];
  setUserSubscribedList?: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const { lang, tc, voiceEnabled: homeVoiceEnabled } = useLang();

  const [localProfileCompleted, setLocalProfileCompleted] = useState(false);
  const profileCompleted = parentProfileCompleted ?? localProfileCompleted;
  const setProfileCompleted =
    parentSetProfileCompleted || setLocalProfileCompleted;

  const [localCompleteProfileOpen, setLocalCompleteProfileOpen] =
    useState(false);
  const completeProfileOpen =
    parentCompleteProfileOpen ?? localCompleteProfileOpen;
  const setCompleteProfileOpen =
    parentSetCompleteProfileOpen || setLocalCompleteProfileOpen;


  // Persistent Profile Setup Data
  const totalSteps = 3;

  const [localProfileSetupData, setLocalProfileSetupData] =
    useState<ProfileSetupData>(() => ({
      step: 1,
      furthestStep: 1,
      province: initialUserData?.province || "Punjab",
      district:
        initialUserData?.district || initialUserData?.city || "Pakpattan",
      city: initialUserData?.city || "Pakpattan Mandi",
      selectedMandis: [initialUserData?.city || "Pakpattan Mandi"],
      selectedProds: ["Wheat"],
      dur: 0,
      customMode: false,
      customMonths: 3,
      paymentType: "wallet",
      walletProvider: "jazzcash",
      walletNumber: initialUserData?.phone || "0300 1234567",
      walletCnic: "",
      walletPromptSent: false,
      directMethod: "jazzcash",
      hasReceipt: false,
      cardNumber: "",
      cardExpiry: "",
      cardCvv: "",
      cardHolder: initialUserData?.name || "Muhammad Arif",
    }));

  const profileSetupData = parentProfileSetupData || localProfileSetupData;
  const updateProfileSetupData = (partial: Partial<ProfileSetupData>) => {
    if (parentUpdateProfileSetupData) parentUpdateProfileSetupData(partial);
    else setLocalProfileSetupData((prev) => ({ ...prev, ...partial }));
  };

  // Saved profile shown in the header and edited via AccountCenter
  // Saved as typed; shown through tn() so it follows the language switch.
  const [profileName, setProfileName] = useState(initialUserData?.name || "Muhammad Arif");
  const [profilePhone, setProfilePhone] = useState(
    initialUserData?.phone || "0300 1234567",
  );
  const [profileProvince, setProfileProvince] = useState(
    initialUserData?.province || "Punjab",
  );
  const [profileCity, setProfileCity] = useState(
    initialUserData?.city || "Pakpattan Mandi",
  );

  // Which account sheet is open (null = closed)
  const [accountView, setAccountView] = useState<AccountView | null>(null);
  const [showSwitchToast, setShowSwitchToast] = useState<string | null>(null);

  // Calculate dynamic progress percentage
  const currentStepNum = profileSetupData.step;
  const furthestStepNum = profileSetupData.furthestStep;
  const progressPct = profileCompleted
    ? 100
    : Math.min(Math.round(((furthestStepNum) / totalSteps) * 100), 99);

  // Your Picks sheet

  // ---------------------------------------------------------
  // ORIENTATION / VOICE
  // ---------------------------------------------------------

  useEffect(() => {
    if (!homeVoiceEnabled) {
      stopSpeaking();
    }
  }, [homeVoiceEnabled]);

  const handleOrientationTap = (
    _key: string,
    speakMsg: string,
    navigateFn: () => void,
  ) => {
    if (voiceGuideActive) {
      speakText(speakMsg);
      return;
    }

    if (homeVoiceEnabled) {
      speakText(speakMsg);
      setTimeout(() => {
        navigateFn();
      }, 850);
      return;
    }

    navigateFn();
  };

  // ---------------------------------------------------------
  // MANDI DATA FOR NOTIFICATIONS
  // ---------------------------------------------------------


  // ---------------------------------------------------------
  // PRODUCT HELPERS & SUBSCRIPTION LOCKING
  // ---------------------------------------------------------

  const [localUserSubscribedList, setLocalUserSubscribedList] = useState<string[]>(() => {
    const raw = initialUserData?.products;
    if (raw && raw.length > 0) {
      return raw.map((p) => PRODUCT_ID_TO_NAME[p.toLowerCase()] || p);
    }
    return ["Wheat"];
  });
  // "View All" overlay: every product category (active + locked), grid form,
  // same tap-to-open / tap-to-unlock behavior as the homepage row below.
  const [showAllProducts, setShowAllProducts] = useState(false);

  const userSubscribedList = parentUserSubscribedList ?? localUserSubscribedList;
  const setUserSubscribedList = parentSetUserSubscribedList || setLocalUserSubscribedList;

  const getVerticalForProduct = (productName: string) => {
    return (
      Object.entries(VERTICALS).find(
        ([, vd]) => vd.products[productName],
      )?.[0] || "Grains"
    );
  };

  const isAccessible = (name: string) => {
    if (profileCompleted) {
      return userSubscribedList.includes(name);
    }
    return true; // All accessible during Free Trial
  };


  const activeProducts = PRODUCT_DIVISIONS.filter((d) => isAccessible(d.name));
  const lockedProducts = PRODUCT_DIVISIONS.filter(
    (d) => !isAccessible(d.name),
  );

  // Search: every catalog by-product (one cached API call); picking one opens its rates.
  const [catalogAll, setCatalogAll] = useState<ByProductCatalogRow[]>([]);
  useEffect(() => {
    fetchByProducts()
      .then(setCatalogAll)
      .catch(() => setCatalogAll([]));
  }, []);
  // Products (Home row) and every catalog by-product, so both can be searched.
  const searchEntries: SearchEntry[] = useMemo(
    () => [
      ...PRODUCT_DIVISIONS.map((d) => ({
        kind: "product" as const,
        product: d.name,
        byproduct: d.name,
        label: tc(d.name),
        productLabel: tc(d.name),
        iconSrc: getproductIconSrc(d.name, getVerticalForProduct(d.name)),
        locked: false,
        hasData: true,
      })),
      ...catalogAll
        .filter((r) => PRODUCT_DIVISIONS.some((d) => d.name === r.division))
        .map((r) => ({
          kind: "byproduct" as const,
          product: r.division,
          byproduct: r.by_product,
          label: tc(r.display_name || r.by_product),
          productLabel: tc(r.division),
          iconSrc: getproductIconSrc(r.by_product, getVerticalForProduct(r.division)),
          locked: !isAccessible(r.division),
          hasData: Boolean(r.has_data),
        })),
    ],
    [catalogAll, lang, profileCompleted, userSubscribedList], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Search → product: scroll the Products row to it and ring it for a moment.
  const [highlightProduct, setHighlightProduct] = useState<string | null>(null);
  const highlightTimer = useRef<number | undefined>(undefined);
  const showProduct = (name: string) => {
    document.querySelector(`[data-home-product="${CSS.escape(name)}"]`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setHighlightProduct(name);
    window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlightProduct(null), 2200);
  };

  const handleLockedProductClick = (divName: string, _verticalFor?: string) => {
    const mapped = PRODUCT_ID_TO_NAME[divName.toLowerCase()] || divName;
    updateProfileSetupData({
      selectedProds: [mapped],
      step: 2,
      furthestStep: Math.max(profileSetupData.furthestStep || 1, 2),
    });
    setCompleteProfileOpen(true);
  };

  const handleCompleteProfileSubmit = (
    selected: string[],
    locationData?: { province: string; district: string; city: string },
  ) => {
    if (parentOnCompleteProfileSubmit) {
      parentOnCompleteProfileSubmit(selected, locationData);
      return;
    }
    const mapped = selected.map((p) => PRODUCT_ID_TO_NAME[p.toLowerCase()] || p);
    const incoming = mapped.length > 0 ? mapped : ["Wheat"];
    const merged = profileCompleted
      ? Array.from(new Set([...userSubscribedList, ...incoming]))
      : incoming;
    merged.forEach((p) => {
      SUBSCRIBED_PRODUCTS.add(p);
      TODAY_ONLY_PRODUCTS.add(p);
    });
    setUserSubscribedList(merged);
    if (locationData && initialUserData) {
      initialUserData.province = locationData.province;
      initialUserData.district = locationData.district;
      initialUserData.city = locationData.city;
    }
    setProfileCompleted(true);
    setCompleteProfileOpen(false);
  };

  // ---------------------------------------------------------
  // FAVORITES
  // ---------------------------------------------------------


  // ---------------------------------------------------------
  // PICKED BYPRODUCT DATA
  // ---------------------------------------------------------




  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: "#F1F7F4",
      }}
    >
      {/* Header: photo, name, number, search + complete profile (home/HomeHero.tsx) */}
      <HomeHero
        height="calc(clamp(136px, 20.34vh, 172px) + var(--zm-bleed-top))"
        profileName={profileName}
        profilePhone={profilePhone}
        initialUserData={initialUserData}
        profileCompleted={profileCompleted}
        currentStepNum={currentStepNum}
        totalSteps={totalSteps}
        activeRole={activeRole}
        hasRepAccount={hasRepAccount}
        onSwitchRole={onSwitchRole}
        voiceGuideActive={voiceGuideActive}
        toast={showSwitchToast}
        onToast={setShowSwitchToast}
        onOpenAccount={() => setAccountView("menu")}
        onEditProfile={() => setAccountView("edit")}
        onOpenCompleteProfile={() => setCompleteProfileOpen(true)}
        searchEntries={searchEntries}
        searchMode="list"
        onSearchPick={(e, final) => {
          if (!final) return;
          if (homeVoiceEnabled) speakText(e.label);
          if (e.kind === "product") {
            // A product: bring its circle into view in the Products row.
            showProduct(e.product);
            return;
          }
          push({ id: "product-rates", vertical: getVerticalForProduct(e.product), product: e.product, byproduct: e.byproduct });
        }}
        onLockedPick={(e) => handleLockedProductClick(e.product, getVerticalForProduct(e.product))}
      />

      {/* =====================================================
          MAIN HOME CONTENT (Mint waves botanical ambient background)
          ===================================================== */}

      <div
        className="flex-1 min-h-0 overflow-hidden relative flex flex-col"
        style={{
          background: "linear-gradient(180deg, #EAF6F0 0%, #F4FAF7 45%, #EEF7F2 100%)",
          position: "relative",
          scrollbarWidth: "none",
        }}
      >
        {/* Soft Mint Waves Ambient Layer */}
        <img
          src={homeBgMint}
          alt="Ambient Botanical Background"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            pointerEvents: "none",
            zIndex: 0,
            opacity: 0.45,
          }}
        />

        <div
          className="relative z-10 flex-1 flex flex-col justify-start gap-2"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
          }}
        >
          {/* Products row (home/HomeProductsSection.tsx) */}
          <HomeProductsSection
            activeProducts={activeProducts}
            lockedProducts={lockedProducts}
            getVerticalForProduct={getVerticalForProduct}
            handleOrientationTap={handleOrientationTap}
            handleLockedProductClick={handleLockedProductClick}
            onViewAll={() => setShowAllProducts(true)}
            push={push}
            voiceGuideActive={voiceGuideActive}
            highlight={highlightProduct}
          />

          {/* Favorites (home/HomeFavoritesSection.tsx) */}
          <HomeFavoritesSection
            pickedByproducts={pickedByproducts}
            push={push}
            voiceGuideActive={voiceGuideActive}
          />
        </div>

        {/* Bottom breathing space */}
        <div style={{ height: 8 }} />
      </div>

      {/* =====================================================
          ACCOUNT & PROFILE (see customer-face/account/AccountCenter.tsx)
          ===================================================== */}
      <AccountCenter
        view={accountView}
        onViewChange={setAccountView}
        profile={{
          name: profileName,
          phone: profilePhone,
          province: profileProvince,
          city: profileCity,
        }}
        onProfileSave={(next) => {
          setProfileName(next.name);
          setProfilePhone(next.phone);
          setProfileProvince(next.province);
          setProfileCity(next.city);
          if (initialUserData) {
            initialUserData.name = next.name;
            initialUserData.phone = next.phone;
            initialUserData.contact = next.phone;
            initialUserData.province = next.province;
            initialUserData.city = next.city;
            initialUserData.district = next.city;
          }
        }}
        onToast={(msg) => {
          setShowSwitchToast(msg);
          setTimeout(() => setShowSwitchToast(null), 2500);
        }}
        profileCompleted={profileCompleted}
        progressPct={progressPct}
        currentStep={currentStepNum}
        totalSteps={totalSteps}
        userSubscribedList={userSubscribedList}
        getVerticalForProduct={getVerticalForProduct}
        hasRepAccount={hasRepAccount}
        onSwitchRole={onSwitchRole}
        onStartRepOnboarding={onStartRepOnboarding}
        onRestartOnboarding={onRestartOnboarding}
        onOpenCompleteProfile={() => setCompleteProfileOpen(true)}
        onOpenBilling={(product, vertical) =>
          push({ id: "billing", product, vertical })
        }
      />

      {completeProfileOpen && (
        <CompleteProfileModal
          data={profileSetupData}
          onUpdateData={updateProfileSetupData}
          onClose={() => setCompleteProfileOpen(false)}
          onComplete={handleCompleteProfileSubmit}
          initialUserData={initialUserData}
        />
      )}

      {/* "View All" product categories (home/ProductCategoriesSheet.tsx) */}
      {showAllProducts && (
        <ProductCategoriesSheet
          activeProducts={activeProducts}
          lockedProducts={lockedProducts}
          isAccessible={isAccessible}
          getVerticalForProduct={getVerticalForProduct}
          handleLockedProductClick={handleLockedProductClick}
          onClose={() => setShowAllProducts(false)}
          push={push}
        />
      )}
    </div>
  );
}
