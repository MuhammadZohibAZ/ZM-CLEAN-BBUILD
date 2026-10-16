import React, { useState, useEffect, useMemo } from "react";
import farmHeroBg from "../../../../assets/farm_hero_bg.png";
import homeBgMint from "../../../../assets/home_bg_mint.jpg";

import { ProductIcon } from "../../../components/ProductIcon";
import {
  PRODUCT_DIVISIONS,
  PRODUCT_ID_TO_NAME,
  SUBSCRIBED_PRODUCTS,
  TODAY_ONLY_PRODUCTS,
  VERTICALS,
} from "../../../shared/data/catalog";
import { getproductIconSrc } from "../../../shared/data/icons";
import { LOCATIONS } from "../../../shared/data/mandis";
import { URDU_FONT, useLang } from "../../../shared/i18n/LangProvider";
import {
  type AppProps,
  type LocationScope,
  type ProfileSetupData,
  type RateItem,

  type Screen,
} from "../../../shared/types";
import { speakText, stopSpeaking } from "../../../shared/voice";
import { CompleteProfileModal } from "../../../sheets/complete-profile/CompleteProfileModal";
import { HomeByproductCarousel, type FavoriteItem } from "./HomeByproductCarousel";
import { homeMemory, type HomeSelection } from "../homeMemory";
import { ProductRail } from "./ProductRail";
import { panelHeight, type SearchEntry } from "../shared/SearchProfilePanel";
import { HomeHero } from "../shared/HomeHero";
import { fetchByProducts, type ByProductCatalogRow } from "../../../../lib/api";

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────

export function AlternativeHomeScreen({
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
  locationScope = { kind: "pakistan", label: "All Pakistan" },
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
  locationScope?: LocationScope;
}) {
  const {
    lang,
    setLang,

    tc,


    voiceEnabled: homeVoiceEnabled,
    setVoiceEnabled: homeSetVoiceEnabled,
  } = useLang();

  const [profileOpen, setProfileOpen] = useState(false);
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
  const [profileDistrict] = useState(
    initialUserData?.district || initialUserData?.city || "Pakpattan",
  );
  const [profileCity, setProfileCity] = useState(
    initialUserData?.city || "Pakpattan Mandi",
  );

  // Edit Profile Form State & OTP Verification
  const [editName, setEditName] = useState(profileName);
  const [editPhone, setEditPhone] = useState(profilePhone);
  const [editProvince, setEditProvince] = useState(profileProvince);
  const [editCity, setEditCity] = useState(profileCity);
  const [showContactVerify, setShowContactVerify] = useState(false);
  const [contactOtp, setContactOtp] = useState(["", "", "", ""]);
  const [contactOtpError, setContactOtpError] = useState("");
  const [contactOtpSuccess, setContactOtpSuccess] = useState(false);

  // Account Modals State
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [locationPrefOpen, setLocationPrefOpen] = useState(false);
  const [subsModalOpen, setSubsModalOpen] = useState(false);
  const [voiceLangModalOpen, setVoiceLangModalOpen] = useState(false);
  const [historicalModalOpen, setHistoricalModalOpen] = useState(false);
  const [repConfirmModalOpen, setRepConfirmModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [showSwitchToast, setShowSwitchToast] = useState<string | null>(null);

  // Settings & Preferences State
  const [weightUnit, setWeightUnit] = useState<"maund" | "kg100" | "ton">(
    "maund",
  );
  const [alertSms, setAlertSms] = useState(true);
  const [alertWhatsApp, setAlertWhatsApp] = useState(true);
  const [alertMorningBell, setAlertMorningBell] = useState(true);
  const [speechRate, setSpeechRate] = useState<"1.0x" | "0.8x" | "1.2x">(
    "1.0x",
  );

  // Representative Form State

  // Feedback form state
  const [supportFeedback, setSupportFeedback] = useState("");
  const [supportSent, setSupportSent] = useState(false);
  const [faqExpanded, setFaqExpanded] = useState<number | null>(0);

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

  // Product whose by-products fill the Home carousel (or ♥ Favorites).
  // Remembered across visits; falls back to the first unlocked product if the
  // remembered one is locked (e.g. after subscribing to a different product).
  const [homeSelectionState, setHomeSelectionState] = useState<HomeSelection>(
    () => homeMemory.selection ?? { kind: "product", name: activeProducts[0]?.name ?? "Wheat" },
  );
  const homeSelection: HomeSelection =
    homeSelectionState.kind === "product" && !isAccessible(homeSelectionState.name)
      ? activeProducts[0]
        ? { kind: "product", name: activeProducts[0].name }
        : { kind: "favorites" }
      : homeSelectionState;
  const selectHome = (sel: HomeSelection) => {
    homeMemory.selection = sel;
    setHomeSelectionState(sel);
  };

  // Inline search: every catalog by-product (one cached API call), searched on
  // Home itself. Picking one selects its product and spins the ring to it.
  const [catalogAll, setCatalogAll] = useState<ByProductCatalogRow[]>([]);
  useEffect(() => {
    fetchByProducts()
      .then(setCatalogAll)
      .catch(() => setCatalogAll([]));
  }, []);
  const searchEntries: SearchEntry[] = useMemo(
    () =>
      catalogAll
        .filter((r) => PRODUCT_DIVISIONS.some((d) => d.name === r.division))
        .map((r) => ({
          product: r.division,
          byproduct: r.by_product,
          label: tc(r.display_name || r.by_product),
          productLabel: tc(r.division),
          iconSrc: getproductIconSrc(r.by_product, getVerticalForProduct(r.division)),
          locked: !isAccessible(r.division),
          hasData: Boolean(r.has_data),
        })),
    [catalogAll, lang, profileCompleted, userSubscribedList],
  );
  const [jumpRequest, setJumpRequest] = useState<{ name: string; nonce: number } | null>(null);
  const showSearchResult = (e: SearchEntry, final: boolean) => {
    selectHome({ kind: "product", name: e.product });
    setJumpRequest({ name: e.byproduct, nonce: Date.now() });
    if (final && homeVoiceEnabled) speakText(e.label);
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

  const FAVE_BPS = [
    "Wheat",
    "Fine Flour",
    "Flour",
    "Bran",
    "Semolina",
    "Straw",
    "Sorghum",
    "Barley",
    "Special Flour",
  ];

  const favoriteItems: FavoriteItem[] = useMemo(() => {
    const defaultMandiName =
      profileCity || initialUserData?.city || "Pakpattan Mandi";
    return pickedByproducts && pickedByproducts.length > 0
      ? pickedByproducts.map((p) => ({
        vertical: p.vertical || "Grains",
        product: p.product || "Wheat",
        byproduct: p.byproduct,
        mandiName: p.mandiName || defaultMandiName,
        rateType: p.rateType || "Mill",
      }))
      : FAVE_BPS.map((bp) => ({
        vertical: "Grains",
        product: "Wheat",
        byproduct: bp,
        mandiName: defaultMandiName,
        rateType: "Mill",
      }));
  }, [pickedByproducts, profileCity, initialUserData?.city]);

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
        height="calc(148px + var(--zm-bleed-top))"
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
        onOpenAccount={() => setProfileOpen(true)}
        onEditProfile={() => {
          setEditName(profileName || (lang === "ur" ? "محمد عارف" : "Muhammad Arif"));
          setEditPhone(profilePhone || "0300 1234567");
          setEditProvince(profileProvince || "Punjab");
          setEditCity(profileCity || "Pakpattan Mandi");
          setShowContactVerify(false);
          setContactOtp(["", "", "", ""]);
          setContactOtpError("");
          setContactOtpSuccess(false);
          setEditProfileOpen(true);
        }}
        onOpenCompleteProfile={() => setCompleteProfileOpen(true)}
        searchEntries={searchEntries}
        onSearchPick={showSearchResult}
        onLockedPick={(e) => handleLockedProductClick(e.product, getVerticalForProduct(e.product))}
      />

      {/* =====================================================
          MAIN HOME CONTENT (Mint waves botanical ambient background)
          ===================================================== */}

      <div
        className="flex-1 min-h-0 overflow-hidden relative flex flex-col justify-between"
        style={{
          background: "linear-gradient(180deg, #EAF6F0 0%, #F4FAF7 45%, #EEF7F2 100%)",
          position: "relative",
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

        {/* Fixed, non-scrolling layout: the ring shrinks to fit the space. */}
        <div
          className="relative z-10 flex-1 min-h-0 flex flex-col"
          // Background runs behind the floating nav; content stays above it.
          style={{ paddingTop: panelHeight(!profileCompleted) - 24 + 6, paddingBottom: "var(--zm-nav-space)" }}
        >
          {/* ===================================================
              DATE · PRODUCT PICKER · BY-PRODUCT RING
              =================================================== */}
          <HomeByproductCarousel
            selection={homeSelection}
            favorites={favoriteItems}
            favoritesAreSuggestions={pickedByproducts.length === 0}
            jumpRequest={jumpRequest}
            locationScope={locationScope}
            push={push}
            onOpen={(spoken, navigate) =>
              handleOrientationTap("byproduct-card", spoken, navigate)
            }
            rail={
              <ProductRail
                activeProducts={activeProducts}
                lockedProducts={lockedProducts}
                selected={homeSelection}
                favoritesCount={pickedByproducts.length}
                getVertical={getVerticalForProduct}
                raised={voiceGuideActive}
                onSelect={(sel) =>
                  handleOrientationTap(
                    "product",
                    sel.kind === "favorites"
                      ? lang === "ur" ? "پسندیدہ" : "Favorites"
                      : tc(sel.name),
                    () => selectHome(sel),
                  )
                }
                onLockedClick={handleLockedProductClick}
              />
            }
          />
        </div>




        {/* Bottom breathing space */}
        <div style={{ height: 8 }} />
      </div>

      {/* =====================================================
          NOTIFICATIONS
          ===================================================== */}

      {/* =====================================================
          PROFILE MODAL (DRAWER & ACCOUNT MANAGEMENT)
          ===================================================== */}
      {profileOpen && (
        <div
          className="zm-sheet-overlay"
          style={{ zIndex: 310 }}
          onClick={() => setProfileOpen(false)}
        >
          <div
            className="zm-sheet-high"
            style={{ background: "#F4FAF7", maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-5 pt-4 pb-3 flex-shrink-0"
              style={{ borderBottom: "1px solid #D5E2DD" }}
            >
              <div
                className="w-10 h-1 rounded-full mx-auto mb-3"
                style={{ background: "#C7D6D0" }}
              />
              <div className="flex items-center justify-between">
                <p
                  className="font-bold text-lg"
                  style={{
                    color: "#183B34",
                    fontFamily:
                      lang === "ur"
                        ? URDU_FONT
                        : "inherit",
                  }}
                >
                  {lang === "ur" ? "اکاؤنٹ اور پروفائل" : "Account & Profile"}
                </p>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="tap-target text-sm font-semibold px-3.5 py-1.5 rounded-full"
                  style={{ background: "#E8EFEC", color: "#52635F" }}
                >
                  {lang === "ur" ? "بند کریں" : "Done"}
                </button>
              </div>
            </div>

            {/* Profile content */}
            <div className="flex-1 overflow-y-auto">
              {/* Avatar + name */}
              <div
                className="flex flex-col items-center py-5 px-5"
                style={{ borderBottom: "1px solid #E8EFEC" }}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-3 shadow-md relative"
                  style={{
                    background: "linear-gradient(135deg, #087F63, #064D40)",
                  }}
                >
                  <svg
                    width="38"
                    height="38"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setEditName(profileName);
                      setEditPhone(profilePhone);
                      setShowContactVerify(false);
                      setContactOtp(["", "", "", ""]);
                      setContactOtpError("");
                      setContactOtpSuccess(false);
                      setEditProfileOpen(true);
                    }}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#2FAE68] text-white flex items-center justify-center border-2 border-white shadow"
                    title="Edit Profile"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>
                </div>
                <p
                  className="font-extrabold text-xl"
                  style={{
                    color: "#183B34",
                    fontFamily:
                      lang === "ur"
                        ? URDU_FONT
                        : "inherit",
                  }}
                >
                  {profileName}
                </p>
                {profilePhone && (
                  <p className="text-xs font-semibold mt-1 text-[#52635F]">
                    {profilePhone}
                  </p>
                )}
              </div>

              {/* Profile Completion Bar in Drawer (only shown while incomplete) */}
              {!profileCompleted && (
                <div
                  style={{
                    margin: "14px 18px 8px",
                    padding: "14px 16px",
                    background: "#FFF8EB",
                    border: "1.5px solid #F59E0B",
                    borderRadius: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#92400E",
                      }}
                    >
                      {lang === "ur"
                        ? `پروفائل مکمل کریں`
                        : `Complete Profile`}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#D97706",
                      }}
                    >
                      {`${progressPct}%`}
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: 8,
                      background: "#E5E7EB",
                      borderRadius: 999,
                      overflow: "hidden",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: `${progressPct}%`,
                        height: "100%",
                        background: "#F59E0B",
                        borderRadius: 999,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setCompleteProfileOpen(true);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "#087F63",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      marginTop: 4,
                    }}
                  >
                    {lang === "ur"
                      ? `سیٹ اپ جاری رکھیں (مرحلہ ${currentStepNum}) →`
                      : `Continue Setup (Step ${currentStepNum} of ${totalSteps}) →`}
                  </button>
                </div>
              )}

              {/* Menu items */}
              {[
                {
                  id: "edit",
                  label: lang === "ur" ? "پروفائل ترمیم کریں" : "Edit Profile",
                  sub: lang === "ur" ? "نام، فون نمبر / ای میل" : "Name, phone number / email",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#087F63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  ),
                  action: () => {
                    setProfileOpen(false);
                    setEditName(profileName);
                    setEditPhone(profilePhone);
                    setShowContactVerify(false);
                    setContactOtp(["", "", "", ""]);
                    setContactOtpError("");
                    setContactOtpSuccess(false);
                    setEditProfileOpen(true);
                  },
                },
                {
                  id: "subs",
                  label: lang === "ur" ? "میری سبسکرپشنز" : "My Subscriptions",
                  sub: profileCompleted
                    ? (lang === "ur" ? "فعال زرعی منڈی پرو پلان" : "Active Zarai Mandi Pro Plan")
                    : (lang === "ur" ? "مفت ٹرائل جاری ہے (۲ دن)" : "Free Trial Active (2 Days)"),
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#087F63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  ),
                  action: () => {
                    setProfileOpen(false);
                    setSubsModalOpen(true);
                  },
                },
                {
                  id: "voice",
                  label: lang === "ur" ? "آواز اور زبان" : "Voice & Language",
                  sub: `${lang === "ur" ? "اردو" : "English"} · ${homeVoiceEnabled ? (lang === "ur" ? "آواز فعال" : "Voice On") : (lang === "ur" ? "آواز بند" : "Voice Off")}`,
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#087F63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  ),
                  action: () => {
                    setProfileOpen(false);
                    setVoiceLangModalOpen(true);
                  },
                },
                {
                  id: "historical",
                  label: lang === "ur" ? "تاریخی ڈیٹا کی ضرورت ہے" : "Need Historical Data",
                  sub:
                    lang === "ur"
                      ? "سائن اپ سے پہلے کی تاریخوں کا ڈیٹا حاصل کریں"
                      : "Access data prior to your subscription",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#087F63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  ),
                  action: () => {
                    setProfileOpen(false);
                    setHistoricalModalOpen(true);
                  },
                },
                {
                  id: "rep",
                  label: hasRepAccount
                    ? (lang === "ur" ? "نمائندہ ڈیش بورڈ پر جائیں" : "Switch to Representative Dashboard")
                    : (lang === "ur" ? "نمائندہ بنیں (پارٹنر)" : "Become a Representative"),
                  sub: hasRepAccount
                    ? (lang === "ur" ? "اکاؤنٹ تبدیل کریں" : "Switch accounts")
                    : (lang === "ur" ? "منڈی کے لیے نمائندہ اکاؤنٹ بنائیں" : "Set up your representative account"),
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#087F63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                  action: () => {
                    setProfileOpen(false);
                    if (hasRepAccount) {
                      onSwitchRole?.("representative");
                    } else {
                      setRepConfirmModalOpen(true);
                    }
                  },
                },
                {
                  id: "help",
                  label: lang === "ur" ? "مدد اور کسٹمر سپورٹ" : "Help & Support",
                  sub: lang === "ur" ? "24/7 واٹس ایپ اور ہیلپ لائن" : "24/7 WhatsApp & Helpline",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#087F63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  ),
                  action: () => {
                    setProfileOpen(false);
                    setHelpModalOpen(true);
                  },
                },
                {
                  id: "logout",
                  label: lang === "ur" ? "لاگ آؤٹ" : "Log Out",
                  sub: lang === "ur" ? "سائن آؤٹ کریں اور محفوظ رہیں" : "Sign out of your account",
                  danger: true,
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  ),
                  action: () => {
                    setProfileOpen(false);
                    setLogoutModalOpen(true);
                  },
                },
              ].map((item, i) => (
                <button
                  key={i}
                  className="tap-target w-full flex items-center gap-3.5 px-5 py-3.5"
                  style={{
                    borderBottom: "1px solid #F1F7F4",
                    background: "#fff",
                    textAlign: lang === "ur" ? "right" : "left",
                  }}
                  onClick={item.action}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: item.danger ? "#FEE2E2" : "#E8F5EF",
                    }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bold text-sm leading-tight"
                      style={{
                        color: item.danger ? "#DC2626" : "#183B34",
                        fontFamily:
                          lang === "ur"
                            ? "'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif"
                            : "inherit",
                        fontSize: lang === "ur" ? 16 : 14,
                      }}
                    >
                      {item.label}
                    </p>
                    {item.sub && (
                      <p className="text-xs text-[#52635F] mt-0.5 truncate">
                        {item.sub}
                      </p>
                    )}
                  </div>
                  <span style={{ color: "#A0CEBC", fontSize: 18 }}>
                    {lang === "ur" ? "‹" : "›"}
                  </span>
                </button>
              ))}
              <div style={{ height: 24 }} />
            </div>
          </div>
        </div>
      )}

      {/* ─── 1. EDIT PROFILE MODAL ────────────────────────────────────── */}
      {editProfileOpen && (
        <div
          className="zm-sheet-overlay"
          style={{ zIndex: 350 }}
          onClick={() => {
            if (!showContactVerify) setEditProfileOpen(false);
          }}
        >
          <div
            className="zm-sheet-high"
            style={{ background: "#F4FAF7", maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#D5E2DD]">
              <h3 className="font-bold text-lg text-[#183B34]">
                {lang === "ur" ? "پروفائل ترمیم کریں" : "Edit Profile"}
              </h3>
              <button
                onClick={() => setEditProfileOpen(false)}
                className="text-sm font-semibold px-3 py-1 rounded-full bg-[#E8EFEC] text-[#52635F]"
              >
                ✕
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {!showContactVerify ? (
                <>
                  <div>
                    <label className="block text-xs font-extrabold text-[#183B34] mb-1.5">
                      {lang === "ur" ? "نام" : "Name"}
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl border border-[#C7D6D0] bg-white text-sm font-semibold text-[#183B34] focus:border-[#087F63] outline-none"
                      placeholder="e.g. Muhammad Arif"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#183B34] mb-1.5">
                      {lang === "ur" ? "فون نمبر / ای میل" : "Phone Number / Email"}
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl border border-[#C7D6D0] bg-white text-sm font-semibold text-[#183B34] focus:border-[#087F63] outline-none"
                      placeholder="0300 1234567 or email@domain.com"
                    />
                    <p className="text-[11px] text-[#52635F] mt-1.5">
                      {lang === "ur"
                        ? "فون یا ای میل تبدیل کرنے کی صورت میں OTP تصدیق ضروری ہوگی۔"
                        : "Changing phone or email will require OTP verification."}
                    </p>
                  </div>

                  {/* Province Selection */}
                  <div>
                    <label className="block text-xs font-extrabold text-[#183B34] mb-1.5">
                      {lang === "ur" ? "صوبہ منتخب کریں" : "Select Province"}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(LOCATIONS).map((prov) => (
                        <button
                          key={prov}
                          type="button"
                          onClick={() => {
                            setEditProvince(prov);
                            const firstMandi = LOCATIONS[prov]
                              ? Object.values(LOCATIONS[prov]).flat()[0] || "Pakpattan Mandi"
                              : "Pakpattan Mandi";
                            setEditCity(firstMandi);
                          }}
                          className="py-2 px-3 rounded-xl text-xs font-bold border transition text-center"
                          style={{
                            background: editProvince === prov ? "#087F63" : "#fff",
                            color: editProvince === prov ? "#fff" : "#183B34",
                            borderColor: editProvince === prov ? "#087F63" : "#D5E2DD",
                          }}
                        >
                          {prov}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary Mandi Selection */}
                  <div>
                    <label className="block text-xs font-extrabold text-[#183B34] mb-1.5">
                      {lang === "ur" ? "منڈی / مقام منتخب کریں" : "Select Primary Mandi / Location"}
                    </label>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {(
                        LOCATIONS[editProvince]
                          ? Object.values(LOCATIONS[editProvince]).flat()
                          : [
                            "Pakpattan Mandi",
                            "Arifwala Mandi",
                            "Lahore Grain Market",
                            "Multan Mandi",
                            "Faisalabad Mandi",
                            "Okara Mandi",
                          ]
                      ).map((mandi) => (
                        <button
                          key={mandi}
                          type="button"
                          onClick={() => setEditCity(mandi)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl border transition text-left bg-white"
                          style={{
                            borderColor: editCity === mandi ? "#087F63" : "#D5E2DD",
                            background: editCity === mandi ? "#E8F5EF" : "#fff",
                          }}
                        >
                          <span className="text-xs font-bold text-[#183B34]">{mandi}</span>
                          {editCity === mandi && (
                            <span className="text-xs font-extrabold text-[#087F63]">✓ Active</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (editPhone.trim() !== profilePhone.trim()) {
                        setShowContactVerify(true);
                        setContactOtp(["", "", "", ""]);
                        setContactOtpError("");
                        setContactOtpSuccess(false);
                      } else {
                        setProfileName(editName);
                        setProfileProvince(editProvince);
                        setProfileCity(editCity);
                        if (initialUserData) {
                          initialUserData.name = editName;
                          initialUserData.province = editProvince;
                          initialUserData.city = editCity;
                          initialUserData.district = editCity;
                        }
                        setEditProfileOpen(false);
                        setShowSwitchToast(
                          lang === "ur"
                            ? "پروفائل اور مقام کامیابی سے تبدیل ہو گیا"
                            : "Profile & Location updated successfully"
                        );
                        setTimeout(() => setShowSwitchToast(null), 2500);
                      }
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#087F63] text-white font-extrabold text-sm shadow-md mt-4 transition active:scale-[0.99]"
                  >
                    {lang === "ur" ? "تبدیلیاں محفوظ کریں" : "Save Changes"}
                  </button>
                </>
              ) : (
                /* OTP Verification Step when Phone/Email is changed */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white border border-[#D5E2DD] space-y-2.5">
                    <h4 className="text-xs font-extrabold text-[#183B34] uppercase tracking-wider">
                      {lang === "ur" ? "فون نمبر / ای میل کی تبدیلی کی تصدیق" : "Verify Contact Change"}
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-[#F1F7F4]">
                        <span className="text-[#52635F] font-medium">
                          {lang === "ur" ? "سابقہ نمبر / ای میل:" : "Current Contact:"}
                        </span>
                        <span className="font-bold text-[#183B34]">{profilePhone}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-[#087F63] font-medium">
                          {lang === "ur" ? "نیا نمبر / ای میل:" : "New Contact:"}
                        </span>
                        <span className="font-extrabold text-[#087F63]">{editPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#183B34] mb-2 text-center">
                      {lang === "ur" ? "۴ ہندسوں کا OTP کوڈ درج کریں" : "Enter 4-Digit Verification OTP"}
                    </label>
                    <div className="flex justify-center gap-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <input
                          key={idx}
                          id={`otp-box-${idx}`}
                          type="text"
                          maxLength={1}
                          value={contactOtp[idx] || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            const next = [...contactOtp];
                            next[idx] = val;
                            setContactOtp(next);
                            if (val && idx < 3) {
                              const nextInput = document.getElementById(`otp-box-${idx + 1}`);
                              nextInput?.focus();
                            }
                          }}
                          className="w-12 h-12 text-center text-lg font-black rounded-xl border border-[#C7D6D0] bg-white text-[#183B34] focus:border-[#087F63] outline-none"
                        />
                      ))}
                    </div>
                    {contactOtpError && (
                      <p className="text-xs text-red-600 font-bold text-center mt-2">
                        {contactOtpError}
                      </p>
                    )}
                    {contactOtpSuccess && (
                      <p className="text-xs text-[#087F63] font-bold text-center mt-2">
                        ✓ {lang === "ur" ? "کامیابی سے تصدیق ہو گئی!" : "Verified successfully!"}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const entered = contactOtp.join("");
                      if (entered.length < 4) {
                        setContactOtpError(
                          lang === "ur"
                            ? "براہ کرم مکمل ۴ ہندسوں کا کوڈ درج کریں (جیسے ۱۲۳۴)"
                            : "Please enter the full 4-digit code (e.g. 1234)"
                        );
                        return;
                      }
                      setContactOtpSuccess(true);
                      setTimeout(() => {
                        setProfileName(editName);
                        setProfilePhone(editPhone);
                        setProfileProvince(editProvince);
                        setProfileCity(editCity);
                        if (initialUserData) {
                          initialUserData.name = editName;
                          initialUserData.phone = editPhone;
                          initialUserData.contact = editPhone;
                          initialUserData.province = editProvince;
                          initialUserData.city = editCity;
                          initialUserData.district = editCity;
                        }
                        setShowContactVerify(false);
                        setEditProfileOpen(false);
                        setShowSwitchToast(
                          lang === "ur"
                            ? "پروفائل اور مقام کامیابی سے تبدیل ہو گیا"
                            : "Profile & Location updated successfully"
                        );
                        setTimeout(() => setShowSwitchToast(null), 2500);
                      }, 500);
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#087F63] text-white font-extrabold text-sm shadow-md transition active:scale-[0.99]"
                  >
                    {lang === "ur" ? "OTP تصدیق اور محفوظ کریں" : "Verify OTP & Save"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowContactVerify(false)}
                    className="w-full py-2.5 rounded-xl bg-[#E8EFEC] text-[#52635F] font-bold text-xs"
                  >
                    {lang === "ur" ? "← واپس جائیں" : "← Back"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. LOCATION PREFERENCES MODAL ────────────────────────────── */}
      {locationPrefOpen && (
        <div
          className="zm-sheet-overlay"
          style={{ zIndex: 350 }}
          onClick={() => setLocationPrefOpen(false)}
        >
          <div
            className="zm-sheet-high"
            style={{ background: "#F4FAF7", maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#D5E2DD]">
              <h3 className="font-bold text-lg text-[#183B34]">
                {lang === "ur" ? "مقام اور منڈی کا انتخاب" : "Location & Mandi Preferences"}
              </h3>
              <button
                onClick={() => setLocationPrefOpen(false)}
                className="text-sm font-semibold px-3 py-1 rounded-full bg-[#E8EFEC] text-[#52635F]"
              >
                ✕
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[#183B34] mb-1.5">
                  {lang === "ur" ? "صوبہ منتخب کریں" : "Select Province"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(LOCATIONS).map((p) => (
                    <button
                      key={p}
                      onClick={() => setProfileProvince(p)}
                      className="py-2.5 px-3 rounded-xl text-xs font-bold border transition text-left"
                      style={{
                        background: profileProvince === p ? "#087F63" : "#fff",
                        color: profileProvince === p ? "#fff" : "#183B34",
                        borderColor: profileProvince === p ? "#087F63" : "#D5E2DD",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[#183B34] mb-1.5">
                  {lang === "ur" ? "بنیادی منڈی منتخب کریں" : "Primary Mandi"}
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(
                    LOCATIONS[profileProvince]?.[profileDistrict] || [
                      "Pakpattan Mandi",
                      "Lahore Grain Market",
                      "Multan Grain Market",
                      "Faisalabad Mandi",
                      "Bahawalpur Mandi",
                      "Okara Mandi",
                    ]
                  ).map((mandi) => (
                    <button
                      key={mandi}
                      onClick={() => setProfileCity(mandi)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border transition text-left bg-white"
                      style={{
                        borderColor: profileCity === mandi ? "#087F63" : "#D5E2DD",
                        background: profileCity === mandi ? "#E8F5EF" : "#fff",
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-[#183B34]">
                          {mandi}
                        </span>
                      </div>
                      {profileCity === mandi && (
                        <span className="text-xs font-extrabold text-[#087F63]">
                          ✓ Active
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLocationPrefOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-[#087F63] text-white font-extrabold text-sm shadow-md mt-4"
              >
                {lang === "ur" ? "منڈی محفوظ کریں" : "Apply Mandi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. MY SUBSCRIPTIONS MODAL ────────────────────────────────── */}
      {subsModalOpen && (
        <div
          className="zm-sheet-overlay"
          style={{ zIndex: 350 }}
          onClick={() => setSubsModalOpen(false)}
        >
          <div
            className="zm-sheet-high"
            style={{ background: "#F4FAF7", maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#D5E2DD]">
              <h3 className="font-bold text-lg text-[#183B34]">
                {lang === "ur" ? "میری سبسکرپشنز" : "My Subscriptions"}
              </h3>
              <button
                onClick={() => setSubsModalOpen(false)}
                className="text-sm font-semibold px-3 py-1 rounded-full bg-[#E8EFEC] text-[#52635F]"
              >
                ✕
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {!profileCompleted ? (
                /* FREE TRIAL STATE */
                <>
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#064D40] to-[#087F63] text-white shadow-md space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-[#B4E6D2]">
                        FREE TRIAL
                      </span>
                      <span className="text-xs bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full font-extrabold shadow-sm">
                        {lang === "ur" ? "۲ دن باقی" : "2 Days Left"}
                      </span>
                    </div>
                    <h4 className="text-lg font-black">
                      {lang === "ur" ? "مفت ٹرائل ایکسپلوریشن پاس" : "Free Trial Exploration Pass"}
                    </h4>
                  </div>

                  <div>
                    <h5 className="text-xs font-extrabold text-[#183B34] uppercase tracking-wider mb-2.5">
                      {lang === "ur" ? "سبسکرائب شدہ اجناس (ٹرائل ایکسس)" : "Subscribed Commodities (Trial Access)"}
                    </h5>
                    <div className="grid grid-cols-2 gap-2.5">
                      {Array.from(SUBSCRIBED_PRODUCTS).slice(0, 8).map((p) => (
                        <div
                          key={p}
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#D5E2DD] shadow-sm"
                        >
                          <ProductIcon name={p} vertical="Grains" size={26} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#183B34] truncate">
                              {tc(p)}
                            </p>
                            <span className="inline-block text-[9.5px] text-[#087F63] font-bold bg-[#E4F2EC] px-1.5 py-0.5 rounded-md mt-0.5">
                              {lang === "ur" ? "ٹرائل میں فعال" : "Trial Unlocked"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setSubsModalOpen(false);
                        setCompleteProfileOpen(true);
                      }}
                      className="w-full py-3.5 rounded-2xl bg-[#087F63] text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2"
                    >
                      <span>{lang === "ur" ? "پروفائل مکمل کریں اور مستقل سبسکرائب کریں →" : "Complete Profile & Subscribe →"}</span>
                    </button>
                  </div>
                </>
              ) : (
                /* SUBSCRIBED STATE (profileCompleted = true) */
                <>
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#064D40] to-[#087F63] text-white shadow-md space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-[#B4E6D2]">
                        ZARAI MANDI PRO
                      </span>
                      <span className="text-xs bg-[#2FAE68] text-white px-2.5 py-0.5 rounded-full font-extrabold shadow-sm">
                        {lang === "ur" ? "فعال ممبر" : "Active Member"}
                      </span>
                    </div>
                    <h4 className="text-lg font-black">
                      {lang === "ur" ? "فعال زرعی منڈی پرو پلان" : "Active Pro Subscription"}
                    </h4>
                    {/* <p className="text-xs text-[#E4F2EC]">
                      {lang === "ur"
                        ? "تمام فعال اجناس کے لائیو اور تاریخی ریٹس تک رسائی"
                        : "Live mandi rates, full historical archives & daily SMS alerts"}
                    </p> */}
                  </div>

                  {/* Subscribed Commodities with Reg and Expiry Date */}
                  <div>
                    <h5 className="text-xs font-extrabold text-[#183B34] uppercase tracking-wider mb-2.5">
                      {lang === "ur" ? "آپ کی فعال سبسکرائب شدہ اجناس" : "Your Subscribed Commodities"}
                    </h5>
                    <div className="space-y-2">
                      {userSubscribedList.map((p) => (
                        <div
                          key={p}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#D5E2DD] shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <ProductIcon name={p} vertical={getVerticalForProduct(p)} size={32} />
                            <div>
                              <p className="text-xs font-extrabold text-[#183B34]">
                                {tc(p)}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-[#52635F]">
                                <span>{lang === "ur" ? "رجسٹریشن:" : "Reg:"} 14 Sep 2026</span>
                                <span>•</span>
                                <span className="text-[#087F63] font-semibold">
                                  {lang === "ur" ? "تجدید:" : "Expires:"} 21 Sep 2026
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold text-[#087F63] bg-[#E8F5EF] px-2.5 py-1 rounded-full border border-[#A0CEBC]">
                            Active
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Unlock Other Commodities (Shows all other commodities) */}
                  <div className="pt-1">
                    <h5 className="text-xs font-extrabold text-[#183B34] uppercase tracking-wider mb-2.5">
                      {lang === "ur" ? "دیگر اجناس ان لاک کریں" : "Unlock Other Commodities"}
                    </h5>
                    <div className="space-y-2">
                      {PRODUCT_DIVISIONS.filter(
                        (div) => !userSubscribedList.includes(div.name),
                      ).map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D5E2DD] shadow-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <ProductIcon name={item.name} vertical={getVerticalForProduct(item.name)} size={28} />
                            <div>
                              <p className="text-xs font-bold text-[#183B34]">{tc(item.name)}</p>
                              <p className="text-[10.5px] text-[#52635F]">PKR 3,000 / mo</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSubsModalOpen(false);
                              push({
                                id: "billing",
                                product: item.name,
                                vertical: getVerticalForProduct(item.name),
                              });
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[#087F63] text-white font-extrabold text-xs shadow-sm hover:bg-[#064D40] transition"
                          >
                            {lang === "ur" ? `ان لاک کریں →` : `Unlock →`}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Subtle Multiple Commodities Unlock Link */}
                    <div className="mt-4 pt-3 border-t border-[#D5E2DD] text-center">
                      <button
                        onClick={() => {
                          setSubsModalOpen(false);
                          setCompleteProfileOpen(true);
                        }}
                        className="text-xs font-bold text-[#087F63] hover:underline px-3 py-1.5 rounded-lg bg-[#E8F5EF] border border-[#A0CEBC]"
                      >
                        {lang === "ur" ? "ایک ساتھ متعدد اجناس ان لاک کریں →" : "Unlock Multiple Commodities at Once →"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. VOICE & LANGUAGE MODAL ───────────────────────────────── */}
      {voiceLangModalOpen && (
        <div
          className="zm-sheet-overlay"
          style={{ zIndex: 350 }}
          onClick={() => setVoiceLangModalOpen(false)}
        >
          <div
            className="zm-sheet-high"
            style={{ background: "#F4FAF7", maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#D5E2DD]">
              <h3 className="font-bold text-lg text-[#183B34]">
                {lang === "ur" ? "آواز اور زبان کی سیٹنگز" : "Voice & Language Settings"}
              </h3>
              <button
                onClick={() => setVoiceLangModalOpen(false)}
                className="text-sm font-semibold px-3 py-1 rounded-full bg-[#E8EFEC] text-[#52635F]"
              >
                ✕
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[#183B34] mb-2">
                  {lang === "ur" ? "ایپ کی زبان منتخب کریں" : "Select Language"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setLang("ur")}
                    className="p-4 rounded-2xl border text-center transition font-bold"
                    style={{
                      background: lang === "ur" ? "#087F63" : "#fff",
                      color: lang === "ur" ? "#fff" : "#183B34",
                      borderColor: lang === "ur" ? "#087F63" : "#D5E2DD",
                      fontFamily: "'Noto Nastaliq Urdu', serif",
                    }}
                  >
                    اردو (Urdu)
                  </button>
                  <button
                    onClick={() => setLang("en")}
                    className="p-4 rounded-2xl border text-center transition font-bold"
                    style={{
                      background: lang === "en" ? "#087F63" : "#fff",
                      color: lang === "en" ? "#fff" : "#183B34",
                      borderColor: lang === "en" ? "#087F63" : "#D5E2DD",
                    }}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#D5E2DD] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-[#183B34]">
                      {lang === "ur" ? "آواز کا معاون (Voice Assistant)" : "Voice Assistance"}
                    </p>
                    <p className="text-xs text-[#52635F]">
                      {lang === "ur"
                        ? "منڈی کے ریٹس پر کلک کرنے پر بول کر بتائیں"
                        : "Read out rates when tapping cards"}
                    </p>
                  </div>
                  <button
                    onClick={() => homeSetVoiceEnabled(!homeVoiceEnabled)}
                    className="w-12 h-6 rounded-full transition relative"
                    style={{ background: homeVoiceEnabled ? "#087F63" : "#D1D5DB" }}
                  >
                    <span
                      className="w-5 h-5 rounded-full bg-white block absolute top-0.5 transition"
                      style={{ left: homeVoiceEnabled ? "26px" : "2px" }}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#52635F] mb-1.5">
                    {lang === "ur" ? "بولنے کی رفتار" : "Speech Speed"}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["0.8x", "1.0x", "1.2x"] as const).map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setSpeechRate(spd)}
                        className="py-1.5 rounded-lg text-xs font-bold border"
                        style={{
                          background: speechRate === spd ? "#087F63" : "#F4FAF7",
                          color: speechRate === spd ? "#fff" : "#183B34",
                          borderColor: speechRate === spd ? "#087F63" : "#D5E2DD",
                        }}
                      >
                        {spd}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    speakText(
                      lang === "ur"
                        ? "زرعی منڈی میں خوش آمدید۔ آواز کا نظام بالکل ٹھیک کام کر رہا ہے۔"
                        : "Welcome to ZaraiMandi. The voice assistance system is functioning properly.",
                    );
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#E8F5EF] text-[#087F63] font-bold text-xs flex items-center justify-center gap-2 border border-[#A0CEBC]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#087F63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  <span>{lang === "ur" ? "آواز کا نمونہ سنیں" : "Test Voice Audio"}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setVoiceLangModalOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-[#087F63] text-white font-extrabold text-sm shadow-md"
              >
                {lang === "ur" ? "سیٹنگز محفوظ کریں" : "Save Preferences"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. BECOME A REPRESENTATIVE CONFIRMATION DIALOGUE MODAL ─ */}
      {repConfirmModalOpen && (
        <div
          className="zm-sheet-overlay"
          style={{ zIndex: 350 }}
          onClick={() => setRepConfirmModalOpen(false)}
        >
          <div
            className="zm-sheet-high"
            style={{ background: "#F4FAF7", maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#D5E2DD]">
              <h3 className="font-bold text-lg text-[#183B34]">
                {lang === "ur" ? "زرعی منڈی کے باضابطہ نمائندہ بنیں" : "Become a Representative"}
              </h3>
              <button
                onClick={() => setRepConfirmModalOpen(false)}
                className="text-sm font-semibold px-3 py-1 rounded-full bg-[#E8EFEC] text-[#52635F]"
              >
                ✕
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F5EF] text-[#087F63] flex items-center justify-center mx-auto border border-[#A0CEBC]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#087F63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base font-black text-[#183B34]">
                  {lang === "ur" ? "منڈی پارٹنر اور نمائندہ اکاؤنٹ" : "Mandi Representative Account"}
                </h4>
                {/* <p className="text-xs text-[#52635F] leading-relaxed max-w-sm mx-auto">
                  {lang === "ur"
                    ? "اپنے علاقے کی منڈی کے لیے نمائندہ اکاؤنٹ رجسٹر کریں۔ رجسٹریشن کے بعد آپ ایک ہی اکاؤنٹ سے کسٹمر اور نمائندہ ڈیش بورڈ کے درمیان کسی بھی وقت سوئچ کر سکتے ہیں۔"
                    : "Register as an authorized representative for your local mandi. Once set up under this phone/email, you can seamlessly switch between Customer and Representative dashboards anytime."}
                </p> */}
              </div>

              {/* <div className="p-3.5 rounded-xl bg-white border border-[#D5E2DD] text-xs text-[#183B34] font-semibold text-left space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[#087F63] font-bold">✓</span>
                  <span>15% recurring mandi commission</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#087F63] font-bold">✓</span>
                  <span>Dual account switching with double-tap on profile icon</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#087F63] font-bold">✓</span>
                  <span>Direct mandi daily rate submissions</span>
                </div>
              </div> */}

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setRepConfirmModalOpen(false);
                    onStartRepOnboarding?.();
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[#087F63] text-white font-extrabold text-sm shadow-md"
                >
                  {lang === "ur" ? "رجسٹریشن شروع کریں →" : "Continue to Registration →"}
                </button>
                <button
                  type="button"
                  onClick={() => setRepConfirmModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#E8EFEC] text-[#52635F] font-bold text-xs"
                >
                  {lang === "ur" ? "منسوخ کریں" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5.5. HISTORICAL DATA REQUEST MODAL ─────────────────────────── */}
      {historicalModalOpen && (
        <div
          className="zm-sheet-overlay"
          style={{ zIndex: 350 }}
          onClick={() => setHistoricalModalOpen(false)}
        >
          <div
            className="zm-sheet-high"
            style={{ background: "#F4FAF7", maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#D5E2DD]">
              <h3 className="font-bold text-lg text-[#183B34]">
                {lang === "ur" ? "تاریخی منڈی ڈیٹا آرکائیو" : "Historical Mandi Archives"}
              </h3>
              <button
                onClick={() => setHistoricalModalOpen(false)}
                className="text-sm font-semibold px-3 py-1 rounded-full bg-[#E8EFEC] text-[#52635F]"
              >
                ✕
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F5EF] text-[#087F63] flex items-center justify-center mx-auto border border-[#A0CEBC]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#087F63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-black text-[#183B34]">
                  {lang === "ur" ? "سائن اپ سے پہلے کی تاریخوں کا ریکارڈ" : "Data Prior to Your Subscription"}
                </h4>
                <p className="text-xs text-[#52635F] leading-relaxed max-w-sm mx-auto">
                  {lang === "ur"
                    ? "ایپ میں آپ کے سائن اپ ہونے کی تاریخ کے بعد کا مکمل ڈیٹا خودکار طور پر محفوظ اور دستیاب ہے۔ اگر آپ کو اپنے سبسکرائب کرنے سے پہلے کی تاریخوں یا پرانے مہینوں کا تفصیلی تاریخی ڈیٹا درکار ہے، تو براہِ کرم ہماری سپورٹ ٹیم سے رابطہ کریں۔"
                    : "The app provides active rate cards and daily analytics from your signup date onward. If you require historical records or past seasonal data from dates before you subscribed, our data operations team can provide customized historical exports."}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#D5E2DD] text-left space-y-2.5 shadow-sm">
                <a
                  href="https://wa.me/923048107777?text=Hello%20Zarai%20Mandi%20Team%2C%20I%20need%20historical%20data%20prior%20to%20my%20subscription"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#E8F8F0] border border-[#2FAE68]/40 hover:bg-[#D4F4E4] transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div>
                      <p className="text-xs font-bold text-[#064D40]">WhatsApp Support</p>
                      <p className="text-[11px] text-[#2F4A43] font-mono">0304-8107777</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#087F63]">Chat →</span>
                </a>

                <a
                  href="mailto:support@zaraimandi.com?subject=Request%20for%20Prior%20Historical%20Data&body=Hello%20Zarai%20Mandi%20Team%2C%0A%0AI%20need%20historical%20data%20prior%20to%20my%20subscription%20date.%20Please%20assist."
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F4FAF7] border border-[#D5E2DD] hover:bg-[#E8EFEC] transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div>
                      <p className="text-xs font-bold text-[#183B34]">Email Support</p>
                      <p className="text-[11px] text-[#52635F]">support@zaraimandi.com</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#087F63]">Send Email →</span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setHistoricalModalOpen(false)}
                  className="w-full py-3 rounded-2xl bg-[#087F63] text-white font-extrabold text-sm shadow-md"
                >
                  {lang === "ur" ? "سمجھ آ گیا" : "Got It"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. SETTINGS MODAL ───────────────────────────────────────── */}
      {settingsModalOpen && (
        <div
          className="zm-sheet-overlay"
          style={{ zIndex: 350 }}
          onClick={() => setSettingsModalOpen(false)}
        >
          <div
            className="zm-sheet-high"
            style={{ background: "#F4FAF7", maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#D5E2DD]">
              <h3 className="font-bold text-lg text-[#183B34]">
                {lang === "ur" ? "ایپ سیٹنگز اور الرٹس" : "App Settings & Alerts"}
              </h3>
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="text-sm font-semibold px-3 py-1 rounded-full bg-[#E8EFEC] text-[#52635F]"
              >
                ✕
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[#183B34] mb-2">
                  {lang === "ur" ? "وزن اور قیمت کی اکائی" : "Rate & Weight Unit"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "maund", label: lang === "ur" ? "من (40kg)" : "40kg Maund" },
                    { id: "kg100", label: "100 kg" },
                    { id: "ton", label: lang === "ur" ? "ٹن (Metric Ton)" : "Metric Ton" },
                  ].map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setWeightUnit(u.id as any)}
                      className="py-2 px-2 rounded-xl text-xs font-bold border text-center transition"
                      style={{
                        background: weightUnit === u.id ? "#087F63" : "#fff",
                        color: weightUnit === u.id ? "#fff" : "#183B34",
                        borderColor: weightUnit === u.id ? "#087F63" : "#D5E2DD",
                      }}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#D5E2DD] space-y-3">
                <h4 className="text-xs font-extrabold text-[#183B34] uppercase tracking-wider">
                  {lang === "ur" ? "الرٹس اور اطلاعات" : "Alert Channels"}
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#183B34]">WhatsApp Rate Alerts</p>
                    <p className="text-[11px] text-[#52635F]">
                      {lang === "ur" ? "صبح اور شام واٹس ایپ پر ریٹس حاصل کریں" : "Daily rates on WhatsApp"}
                    </p>
                  </div>
                  <button
                    onClick={() => setAlertWhatsApp(!alertWhatsApp)}
                    className="w-10 h-5 rounded-full transition relative"
                    style={{ background: alertWhatsApp ? "#087F63" : "#D1D5DB" }}
                  >
                    <span
                      className="w-4 h-4 rounded-full bg-white block absolute top-0.5 transition"
                      style={{ left: alertWhatsApp ? "22px" : "2px" }}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between border-t border-[#F1F7F4] pt-2">
                  <div>
                    <p className="text-xs font-bold text-[#183B34]">SMS Summary Alerts</p>
                    <p className="text-[11px] text-[#52635F]">
                      {lang === "ur" ? "بغیر انٹرنیٹ ایس ایم ایس ریٹس" : "Offline SMS daily closing"}
                    </p>
                  </div>
                  <button
                    onClick={() => setAlertSms(!alertSms)}
                    className="w-10 h-5 rounded-full transition relative"
                    style={{ background: alertSms ? "#087F63" : "#D1D5DB" }}
                  >
                    <span
                      className="w-4 h-4 rounded-full bg-white block absolute top-0.5 transition"
                      style={{ left: alertSms ? "22px" : "2px" }}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between border-t border-[#F1F7F4] pt-2">
                  <div>
                    <p className="text-xs font-bold text-[#183B34]">Morning Mandi Bell</p>
                    <p className="text-[11px] text-[#52635F]">
                      {lang === "ur" ? "صبح منڈی کھلنے پر نوٹیفکیشن" : "Notify when trading begins"}
                    </p>
                  </div>
                  <button
                    onClick={() => setAlertMorningBell(!alertMorningBell)}
                    className="w-10 h-5 rounded-full transition relative"
                    style={{ background: alertMorningBell ? "#087F63" : "#D1D5DB" }}
                  >
                    <span
                      className="w-4 h-4 rounded-full bg-white block absolute top-0.5 transition"
                      style={{ left: alertMorningBell ? "22px" : "2px" }}
                    />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-[#087F63] text-white font-extrabold text-sm shadow-md"
              >
                {lang === "ur" ? "سیٹنگز محفوظ کریں" : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 7. HELP & SUPPORT MODAL ─────────────────────────────────── */}
      {helpModalOpen && (
        <div
          className="zm-sheet-overlay"
          style={{ zIndex: 350 }}
          onClick={() => setHelpModalOpen(false)}
        >
          <div
            className="zm-sheet-high"
            style={{ background: "#F4FAF7", maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#D5E2DD]">
              <h3 className="font-bold text-lg text-[#183B34]">
                {lang === "ur" ? "مدد اور کسٹمر سپورٹ" : "Help & Customer Support"}
              </h3>
              <button
                onClick={() => setHelpModalOpen(false)}
                className="text-sm font-semibold px-3 py-1 rounded-full bg-[#E8EFEC] text-[#52635F]"
              >
                ✕
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://wa.me/923001234567"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 rounded-2xl bg-[#25D366] text-white font-bold text-xs flex flex-col items-center justify-center text-center shadow gap-1"
                >
                  <span className="text-xl">💬</span>
                  <span>{lang === "ur" ? "واٹس ایپ سپورٹ" : "WhatsApp Chat"}</span>
                  <span className="text-[10px] opacity-90">0300 1234567</span>
                </a>
                <a
                  href="tel:080092724"
                  className="p-3.5 rounded-2xl bg-[#087F63] text-white font-bold text-xs flex flex-col items-center justify-center text-center shadow gap-1"
                >
                  <span className="text-xl">📞</span>
                  <span>{lang === "ur" ? "ٹول فری ہیلپ لائن" : "Toll-Free Call"}</span>
                  <span className="text-[10px] opacity-90">0800-ZARAI (92724)</span>
                </a>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-[#183B34] uppercase tracking-wider mb-2">
                  {lang === "ur" ? "اکثر پوچھے گئے سوالات (FAQ)" : "Frequently Asked Questions"}
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      q: lang === "ur" ? "منڈی کے ریٹس کتنی بار اپ ڈیٹ ہوتے ہیں؟" : "How often are mandi rates updated?",
                      a: lang === "ur" ? "صبح 8 بجے سے شام 6 بجے تک ہر 15 منٹ بعد لائیو ریٹس منڈیوں سے براہ راست اپ ڈیٹ کیے جاتے ہیں۔" : "Rates are updated live every 15 minutes during active trading hours (8:00 AM to 6:00 PM).",
                    },
                    {
                      q: lang === "ur" ? "کیا میں اپنے پسندیدہ اجناس منتخب کر سکتا ہوں؟" : "Can I customize my favorite commodities?",
                      a: lang === "ur" ? "جی ہاں، آپ کسی بھی وقت اپنی پسندیدہ اجناس اور منڈیاں تبدیل کر سکتے ہیں۔" : "Yes, you can customize your tracked commodities and mandis in the app anytime.",
                    },
                    {
                      q: lang === "ur" ? "ادائیگی کے کون سے طریقے دستیاب ہیں؟" : "What payment methods are supported?",
                      a: lang === "ur" ? "JazzCash، EasyPaisa، SadaPay، NayaPay اور تمام پاکستانی بینک ٹرانسفرز دستیاب ہیں۔" : "JazzCash, EasyPaisa, SadaPay, NayaPay, and direct 1Link Bank Transfers are supported.",
                    },
                  ].map((faq, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#D5E2DD] bg-white overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setFaqExpanded(faqExpanded === idx ? null : idx)
                        }
                        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left font-bold text-xs text-[#183B34]"
                      >
                        <span>{faq.q}</span>
                        <span>{faqExpanded === idx ? "▲" : "▼"}</span>
                      </button>
                      {faqExpanded === idx && (
                        <p className="px-3.5 pb-3 text-xs text-[#52635F] leading-relaxed border-t border-[#F1F7F4] pt-2">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-[#183B34] uppercase tracking-wider mb-1.5">
                  {lang === "ur" ? "رائے یا شکایت درج کریں" : "Send Feedback / Report Issue"}
                </h4>
                {supportSent ? (
                  <div className="p-3 rounded-xl bg-[#E8F5EF] text-[#087F63] text-xs font-bold text-center">
                    {lang === "ur" ? "شکریہ! آپ کا پیغام موصول ہو گیا ہے۔" : "Thank you! Your feedback has been sent."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={supportFeedback}
                      onChange={(e) => setSupportFeedback(e.target.value)}
                      placeholder={lang === "ur" ? "اپنا پیغام یہاں لکھیں..." : "Type your message or issue..."}
                      className="w-full p-3 rounded-xl border border-[#C7D6D0] bg-white text-xs text-[#183B34] outline-none resize-none"
                    />
                    <button
                      onClick={() => {
                        if (supportFeedback.trim()) {
                          setSupportSent(true);
                          setSupportFeedback("");
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#087F63] text-white font-bold text-xs shadow"
                    >
                      {lang === "ur" ? "پیغام بھیجیں" : "Submit Feedback"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 8. ABOUT ZARAIMANDI MODAL ──────────────────────────────── */}
      {aboutModalOpen && (
        <div
          className="zm-sheet-overlay"
          style={{ zIndex: 350 }}
          onClick={() => setAboutModalOpen(false)}
        >
          <div
            className="zm-sheet-high"
            style={{ background: "#F4FAF7", maxHeight: "88vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#D5E2DD]">
              <h3 className="font-bold text-lg text-[#183B34]">
                {lang === "ur" ? "زرعی منڈی کے بارے میں" : "About ZaraiMandi"}
              </h3>
              <button
                onClick={() => setAboutModalOpen(false)}
                className="text-sm font-semibold px-3 py-1 rounded-full bg-[#E8EFEC] text-[#52635F]"
              >
                ✕
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#064D40] to-[#2FAE68] text-white flex items-center justify-center text-3xl mx-auto shadow-md">
                🌾
              </div>
              <div>
                <h4 className="text-xl font-black text-[#183B34]">ZaraiMandi</h4>
                <p className="text-xs font-bold text-[#087F63]">
                  v2.4.0 (Live Mandi Network Engine)
                </p>
              </div>
              <p className="text-xs text-[#52635F] leading-relaxed max-w-sm mx-auto">
                {lang === "ur"
                  ? "زرعی منڈی پاکستان کے تمام کسانوں، بیوپاریوں، آڑھتیوں اور مل مالکان کے لیے ایک جدید ترین ڈیجیٹل مارکیٹ پلیٹ فارم ہے جہاں روزانہ کے ریٹس، آمد کے اعداد و شمار اور منڈی رپورٹس براہ راست دستیاب ہیں۔"
                  : "ZaraiMandi is Pakistan's premier digital grain & agri-product market network, providing live mandi rates, transparent price discovery, and trade analytics for farmers, traders, and millers."}
              </p>
              <div className="p-3.5 rounded-xl bg-white border border-[#D5E2DD] text-xs text-[#52635F] space-y-1 text-left">
                <p>• <strong>{lang === "ur" ? "ڈیٹا سورس" : "Data Coverage"}:</strong> 120+ Mandis across Punjab, Sindh, KPK, Balochistan</p>
                <p>• <strong>{lang === "ur" ? "سپورٹڈ اجناس" : "Commodities"}:</strong> Wheat, Rice, Maize, Cotton, Pulses, Mustard, Oilseeds</p>
                <p>• <strong>{lang === "ur" ? "لائسنس" : "License"}:</strong> ZaraiMandi Technologies Pakistan</p>
              </div>
              <button
                onClick={() => setAboutModalOpen(false)}
                className="w-full py-3 rounded-xl bg-[#087F63] text-white font-bold text-xs"
              >
                {lang === "ur" ? "بند کریں" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 9. LOG OUT CONFIRMATION MODAL ──────────────────────────── */}
      {logoutModalOpen && (
        <div
          className="zm-sheet-overlay"
          style={{
            zIndex: 360,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setLogoutModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center"
            style={{
              animation: "screenEnter 0.2s ease-out",
              border: "1.5px solid #D5E2DD",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-extrabold text-[#183B34] mb-1.5">
              {lang === "ur" ? "کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟" : "Are you sure you want to log out?"}
            </h3>
            <div className="flex gap-2.5">
              <button
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-[#F1F7F4] text-[#52635F] font-bold text-xs"
              >
                {lang === "ur" ? "منسوخ کریں" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  setLogoutModalOpen(false);
                  if (onRestartOnboarding) onRestartOnboarding("signin");
                }}
                className="flex-1 py-3 rounded-xl bg-[#DC2626] text-white font-extrabold text-xs shadow"
              >
                {lang === "ur" ? "لاگ آؤٹ کریں" : "Yes, Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {completeProfileOpen && (
        <CompleteProfileModal
          data={profileSetupData}
          onUpdateData={updateProfileSetupData}
          onClose={() => setCompleteProfileOpen(false)}
          onComplete={handleCompleteProfileSubmit}
          initialUserData={initialUserData}
        />
      )}



    </div>
  );
}
