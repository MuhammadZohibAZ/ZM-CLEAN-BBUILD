import React, { useState, useRef, useEffect } from "react";
import farmHeroBg from "../../assets/farm_hero_bg.png";
import homeBgMint from "../../assets/home_bg_mint.jpg";
import agriForegroundImg from "../../assets/agri_foreground.png";

import { ProductIcon, SpriteIcon } from "../components/ProductIcon";
import { LockIconSVG } from "../components/icons";
import {
  getProductSelectionsForDivision,
  PRODUCT_DIVISIONS,
  PRODUCT_ID_TO_NAME,
  SUBSCRIBED_PRODUCTS,
  TODAY_ONLY_PRODUCTS,
  VERTICALS,
} from "../shared/data/catalog";
import { getproductIconSrc } from "../shared/data/icons";
import { FLAT_ALL_MANDI_ROWS } from "../shared/data/mandis";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import {
  type AppProps,
  type ProfileSetupData,
  type RateItem,
  type RichRow,
  type Screen,
} from "../shared/types";
import { speakText, stopSpeaking } from "../shared/voice";
import { CompleteProfileModal } from "../sheets/CompleteProfileModal";
import { AccountCenter, type AccountView } from "../account/AccountCenter";

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
  const {
    lang,
    setLang,
    t,
    tc,
    tm,
    voiceEnabled: homeVoiceEnabled,
    setVoiceEnabled: homeSetVoiceEnabled,
  } = useLang();

  const [notifOpen, setNotifOpen] = useState(false);
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

  const [favLockModalOpen, setFavLockModalOpen] = useState(false);
  const [todayOnlyUnlocked, setTodayOnlyUnlocked] = useState<string[]>([]);
  const favScrollRef = useRef<HTMLDivElement>(null);
  const [favPageIndex, setFavPageIndex] = useState(0);

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
  const [profileName, setProfileName] = useState(
    initialUserData?.name || (lang === "ur" ? "محمد عارف" : "Muhammad Arif"),
  );
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
  const lastProfileTapRef = useRef<number>(0);

  // Calculate dynamic progress percentage
  const currentStepNum = profileSetupData.step;
  const furthestStepNum = profileSetupData.furthestStep;
  const progressPct = profileCompleted
    ? 100
    : Math.min(Math.round(((furthestStepNum) / totalSteps) * 100), 99);

  // Your Picks sheet
  const [picksFavSheet, setPicksFavSheet] = useState(false);
  const [picksSearch, setPicksSearch] = useState("");
  const [picksVertical, setPicksVertical] = useState<string>(
    Object.keys(VERTICALS)[0],
  );

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

  const allMandiRows: RichRow[] = FLAT_ALL_MANDI_ROWS;

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

  const isTodayOnly = (name: string) => {
    if (profileCompleted) return false;
    return (
      (TODAY_ONLY_PRODUCTS.has(name) || todayOnlyUnlocked.includes(name)) &&
      !SUBSCRIBED_PRODUCTS.has(name)
    );
  };

  const activeProducts = PRODUCT_DIVISIONS.filter((d) => isAccessible(d.name));
  const lockedProducts = PRODUCT_DIVISIONS.filter(
    (d) => !isAccessible(d.name),
  );

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

  const getFavoriteImage = (bp: string) => {
    return getproductIconSrc(bp, "Grains");
  };

  // ---------------------------------------------------------
  // PICKED BYPRODUCT DATA
  // ---------------------------------------------------------

  const picksRowsRaw: RichRow[] =
    pickedByproducts.length > 0
      ? pickedByproducts.map((item) => {
        const found = allMandiRows.find(
          (r) => r.product === item.product && r.byproduct === item.byproduct,
        );

        return (
          found || {
            vertical: item.vertical,
            product: item.product,
            byproduct: item.byproduct,
            emoji: "",
            rateType: "Mill Rate",
            arrival: "—",
            min: 0,
            max: 0,
            trend: "stable" as const,
            trendPct: 0,
            mandiName: "—",
            mandiCity: "—",
            province: "—",
          }
        );
      })
      : allMandiRows.slice(0, 8);

  const seenPickKeys = new Set<string>();

  const picksRows: RichRow[] = picksRowsRaw.filter((r) => {
    const key = `${r.product}|${r.byproduct}`;

    if (seenPickKeys.has(key)) return false;

    seenPickKeys.add(key);
    return true;
  });

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
      {/* =====================================================
          HERO BANNER (Refined aesthetic with sunset farm image)
          ===================================================== */}

      <div
        className="relative flex-shrink-0 w-full"
        style={{
          margin: 0,
          height: "calc(172px + var(--zm-bleed-top))",
          borderRadius: "0 0 24px 24px",
          position: "relative",
          zIndex: 20,
        }}
      >
        {/* Rounded Image Container */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "0 0 24px 24px",
            overflow: "hidden",
          }}
        >
          <img
            src={farmHeroBg}
            alt="Agriculture Farm"
            className="w-full h-full object-cover"
            style={{
              objectPosition: "center 42%",
              transform: "scale(1.02)",
            }}
          />
          {/* Subtle natural lighting overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.65) 100%)",
            }}
          />
        </div>

        {/* Content Layer */}
        <div
          className="relative h-full flex flex-col justify-between px-4 pb-7 z-10"
          style={{ paddingTop: "calc(14px + var(--zm-bleed-top))" }}
        >
          {/* Top Row: Language, Voice, Notifications, Profile */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Language Switch */}
              <button
                type="button"
                onClick={() => {
                  const nextLang = lang === "ur" ? "en" : "ur";
                  setLang(nextLang);
                  if (homeVoiceEnabled) {
                    speakText(nextLang === "ur" ? "اردو" : "English");
                  }
                }}
                className="tap-target zm-beam-border zm-beam-border-white flex items-center justify-center rounded-full px-3 py-1 transition active:scale-95"
                style={{
                  background: "rgba(255, 255, 255, 0.22)",
                  border: "1.2px solid rgba(255, 255, 255, 0.45)",
                  color: "#FFFFFF",
                  fontSize: lang === "ur" ? 13.5 : 12,
                  fontWeight: 800,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                {lang === "ur" ? "English" : "اردو"}
              </button>

              {/* Voice Toggle */}
              <button
                onClick={() => {
                  const nextVoice = !homeVoiceEnabled;
                  homeSetVoiceEnabled(nextVoice);
                  if (nextVoice) {
                    speakText(lang === "ur" ? "آواز فعال ہے" : "Voice On");
                  }
                }}
                className="tap-target zm-beam-border zm-beam-border-white flex items-center gap-1.5 rounded-full px-2.5 py-1 transition active:scale-95"
                style={{
                  background: "rgba(255, 255, 255, 0.22)",
                  border: "1.2px solid rgba(255, 255, 255, 0.45)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: homeVoiceEnabled ? "#10B981" : "#EF4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {homeVoiceEnabled ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  )}
                </span>
                <span
                  style={{
                    color: "#FFFFFF",
                    fontSize: lang === "ur" ? 13 : 11.5,
                    fontWeight: 700,
                    fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                  }}
                >
                  {homeVoiceEnabled ? t("Voice On") : t("Voice Off")}
                </span>
              </button>
            </div>

            {/* Top Right: Notification Bell + Profile */}
            <div className="flex items-center gap-2">
              {/* Notification Button */}
              <button
                type="button"
                onClick={() => {
                  if (homeVoiceEnabled) {
                    speakText(lang === "ur" ? "نوٹیفکیشنز" : "Notifications");
                  }
                  setShowSwitchToast(
                    lang === "ur"
                      ? "تمام منڈی الرٹس اور نوٹیفکیشنز فعال ہیں"
                      : "Market alerts & notifications active",
                  );
                  setTimeout(() => setShowSwitchToast(null), 2500);
                }}
                className="tap-target zm-beam-border zm-beam-border-white relative flex items-center justify-center rounded-full transition active:scale-95"
                style={{
                  width: 36,
                  height: 36,
                  background: "rgba(255, 255, 255, 0.22)",
                  border: "1.2px solid rgba(255, 255, 255, 0.45)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
                title={lang === "ur" ? "نوٹیفکیشنز" : "Notifications"}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span
                  style={{
                    position: "absolute",
                    top: 5,
                    right: 6,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#F97316",
                    border: "1.5px solid #FFFFFF",
                  }}
                />
              </button>

              {/* Profile Avatar Button with Double-Tap Switching */}
              <button
                onClick={() => {
                  if (homeVoiceEnabled) {
                    speakText(lang === "ur" ? "پروفائل" : "Profile");
                  }
                  const now = Date.now();
                  if (now - lastProfileTapRef.current < 350 && hasRepAccount) {
                    const targetRole =
                      activeRole === "representative"
                        ? "customer"
                        : "representative";
                    onSwitchRole?.(targetRole);
                    setShowSwitchToast(
                      targetRole === "representative"
                        ? lang === "ur"
                          ? "نمائندہ ڈیش بورڈ پر تبدیل ہو گئے"
                          : "Switched to Rep Dashboard"
                        : lang === "ur"
                          ? "کسٹمر ڈیش بورڈ پر تبدیل ہو گئے"
                          : "Switched to Customer App",
                    );
                    setTimeout(() => setShowSwitchToast(null), 2500);
                  } else {
                    setAccountView("menu");
                  }
                  lastProfileTapRef.current = now;
                }}
                className="tap-target zm-beam-border zm-beam-border-white relative flex items-center justify-center rounded-full transition active:scale-95"
                style={{
                  width: 36,
                  height: 36,
                  background: "rgba(255, 255, 255, 0.22)",
                  border: "1.2px solid rgba(255, 255, 255, 0.45)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  zIndex: voiceGuideActive ? 45 : undefined,
                }}
                title={
                  hasRepAccount
                    ? "Tap for Profile • Double tap to switch dashboard"
                    : "Tap for Profile"
                }
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                {hasRepAccount && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -2,
                      background: "#087F63",
                      color: "#fff",
                      fontSize: 7.5,
                      fontWeight: 900,
                      padding: "1px 4px",
                      borderRadius: 999,
                      border: "1.5px solid #fff",
                      lineHeight: 1.1,
                    }}
                  >
                    {activeRole === "representative" ? "REP" : "CUST"}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Switch Toast Notification */}
          {showSwitchToast && (
            <div
              style={{
                position: "absolute",
                top: 48,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(6, 45, 36, 0.95)",
                color: "#B4E6D2",
                padding: "5px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                zIndex: 999,
                border: "1px solid #2FAE68",
                animation: "screenEnter 0.2s ease-out",
                whiteSpace: "nowrap",
              }}
            >
              ✓ {showSwitchToast}
            </div>
          )}

          {/* User information with Direct Edit Option and Phone/Email instead of Location */}
          <div className="mt-auto flex items-end justify-between" style={{ paddingBottom: 6 }}>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  style={{
                    color: "#FFFFFF",
                    fontSize: 20,
                    lineHeight: 1.15,
                    fontWeight: 800,
                    fontFamily:
                      lang === "ur"
                        ? URDU_FONT
                        : "'Poppins', sans-serif",
                    textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                  }}
                >
                  {profileName || (lang === "ur" ? "محمد عارف" : "Muhammad Arif")}
                </h1>

                {/* Edit Button right in header */}
                <button
                  type="button"
                  onClick={() => {
                    if (homeVoiceEnabled) {
                      speakText(lang === "ur" ? "پروفائل ترمیم" : "Edit Profile");
                    }
                    setAccountView("edit");
                  }}
                  className="tap-target zm-beam-border zm-beam-border-white flex items-center gap-1 px-2.5 py-0.5 rounded-full transition active:scale-95"
                  style={{
                    background: "rgba(255, 255, 255, 0.24)",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 800,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                  }}
                  title={lang === "ur" ? "نام اور مقام تبدیل کریں" : "Edit Name & Location"}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>

                </button>
              </div>

              {/* Number or Email of user below name instead of location */}
              <div className="flex items-center gap-1.5 mt-1">
                {(profilePhone || "0300 1234567").includes("@") ? (
                  <svg
                    width="12.5"
                    height="12.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))",
                      flexShrink: 0,
                    }}
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                ) : (
                  <svg
                    width="12.5"
                    height="12.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))",
                      flexShrink: 0,
                    }}
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                )}
                <p
                  style={{
                    color: "#FFFFFF",
                    fontSize: 12.5,
                    fontWeight: 600,
                    textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                    fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                    letterSpacing: "0.02em",
                  }}
                >
                  {profilePhone || initialUserData?.phone || initialUserData?.contact || "0300 1234567"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Search Bar */}
        <button
          onClick={() =>
            handleOrientationTap("search", lang === "ur" ? "تلاش" : "Search", () =>
              push({ id: "search" }),
            )
          }
          className={`tap-target zm-beam-border flex items-center gap-2.5 ${lang === "ur" ? "text-right" : "text-left"
            }`}
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: -23,
            height: 46,
            paddingLeft: 18,
            paddingRight: 18,
            borderRadius: 9999,
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
            zIndex: 30,
          }}
        >
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none">
            <circle
              cx="11"
              cy="11"
              r="6.5"
              stroke="#087F63"
              strokeWidth="2.4"
            />
            <path
              d="M16 16L21 21"
              stroke="#087F63"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          <span
            className="flex-1"
            style={{
              fontSize: 13,
              color: "#6B7C77",
              fontFamily:
                lang === "ur"
                  ? URDU_FONT
                  : "'Inter', sans-serif",
              fontWeight: 600,
            }}
          >
            {t("home.search")}
          </span>
        </button>
      </div>

      {/* =====================================================
          MAIN HOME CONTENT (Mint waves botanical ambient background)
          ===================================================== */}

      <div
        className="flex-1 min-h-0 overflow-y-auto relative flex flex-col"
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
          {/* ===================================================
              COMPLETE YOUR PROFILE PROGRESS CARD (Wavy Organic Contour Banner)
              (Only visible when profile is NOT yet completed)
              =================================================== */}
          {!profileCompleted && (
            <div className="px-4 pt-8">
              <div
                onClick={() => setCompleteProfileOpen(true)}
                className="tap-target zm-beam-border zm-beam-border-card cursor-pointer transition active:scale-[0.99] relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(240, 252, 246, 0.94) 52%, rgba(220, 248, 238, 0.92) 100%)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  border: "1.5px solid rgba(255, 255, 255, 0.95)",
                  borderRadius: 24,
                  padding: "13px 15px",
                  boxShadow: "0 8px 24px rgba(6, 77, 64, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95)",
                }}
              >
                {/* Organic curved waves on right side flowing into screen background */}
                <svg
                  className="absolute right-0 top-0 bottom-0 h-full pointer-events-none"
                  style={{ width: "48%", minWidth: 150 }}
                  viewBox="0 0 160 100"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <path
                    d="M 25,0 C 70,22 35,70 80,100 L 160,100 L 160,0 Z"
                    fill="rgba(167, 243, 208, 0.45)"
                  />
                  <path
                    d="M 55,0 C 100,18 68,78 115,100 L 160,100 L 160,0 Z"
                    fill="rgba(110, 231, 183, 0.55)"
                  />
                  <path
                    d="M 90,0 C 130,22 105,82 145,100 L 160,100 L 160,0 Z"
                    fill="rgba(52, 211, 153, 0.45)"
                  />
                </svg>

                <div className="flex items-center justify-between gap-3 relative z-10">
                  {/* Left: Leaf / Plant Icon */}
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center zm-beam-border"
                    style={{
                      background: "rgba(8, 127, 99, 0.12)",
                      border: "1px solid rgba(8, 127, 99, 0.2)",
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#087F63"
                      strokeWidth="2.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                    </svg>
                  </div>

                  {/* Center: Title, Subtitle, and Progress */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-extrabold text-[#183B34] leading-tight"
                      style={{
                        fontSize: lang === "ur" ? 16 : 14.5,
                        fontFamily:
                          lang === "ur"
                            ? URDU_FONT
                            : "'Poppins', sans-serif",
                      }}
                    >
                      {lang === "ur"
                        ? "پروفائل مکمل کریں"
                        : "Complete Your Profile"}
                    </h3>
                    <p
                      className="text-[#475F57] leading-snug mt-0.5"
                      style={{
                        fontSize: lang === "ur" ? 11.5 : 10,
                        fontFamily:
                          lang === "ur"
                            ? URDU_FONT
                            : "inherit",
                      }}
                    >
                      {lang === "ur"
                        ? `مرحلہ ${currentStepNum} از ${totalSteps} — تازہ ترین ریٹس اور رجحانات حاصل کریں۔`
                        : `Step ${currentStepNum} of ${totalSteps} — Subscribe to get latest rates & trends.`}
                    </p>

                    {/* Progress track */}
                    <div
                      className="w-full mt-1.5"
                      style={{
                        height: 4.5,
                        background: "rgba(8, 127, 99, 0.14)",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPct}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #F59E0B, #087F63)",
                          borderRadius: 999,
                          transition: "width 0.4s ease-in-out",
                        }}
                      />
                    </div>
                  </div>

                  {/* Right: Round Action Button with Arrow */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompleteProfileOpen(true);
                    }}
                    className="tap-target zm-beam-border zm-beam-border-white flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition active:scale-90"
                    style={{
                      background: "#087F63",
                      color: "#FFFFFF",
                      boxShadow: "0 4px 14px rgba(8, 127, 99, 0.4)",
                    }}
                    title={lang === "ur" ? "پروفائل مکمل کریں" : "Complete Profile"}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points={lang === "ur" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================
              MY PRODUCTS (Harmoniously sized to fill vertical space)
              =================================================== */}

          <section
            style={{
              paddingTop: profileCompleted
                ? "clamp(34px, 4.2vh, 48px)"
                : "clamp(12px, 1.8vh, 18px)",
              paddingBottom: "clamp(4px, 1vh, 10px)",
            }}
          >
            <div className="px-4 flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">

                <p
                  style={{
                    fontSize: profileCompleted ? 20 : 18,
                    fontWeight: 800,
                    color: "#183B34",
                    letterSpacing: lang === "ur" ? "0" : "0.02em",
                    fontFamily:
                      lang === "ur"
                        ? URDU_FONT
                        : "inherit",
                  }}
                >
                  {t("Products")}
                </p>
              </div>

              {/* View All Button -- opens the full category grid (all ~20
                  products, active + locked), not a jump into Wheat */}
              <button
                onClick={() =>
                  handleOrientationTap(
                    "all-products",
                    lang === "ur" ? "تمام مصنوعات" : "All Products",
                    () => setShowAllProducts(true),
                  )
                }
                className="tap-target zm-beam-border flex items-center justify-center rounded-full px-3 py-1 transition active:scale-95"
                style={{
                  background: "rgba(255, 255, 255, 0.65)",
                  border: "1.2px solid rgba(16, 185, 129, 0.35)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  color: "#087F63",
                  fontSize: "12px",
                  fontWeight: 700,
                  gap: "4px",
                  fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                }}
              >
                <span>{lang === "ur" ? "سب دیکھیں" : "View All"}</span>
                <span style={{ fontSize: "12px", fontWeight: 800 }}>
                  {lang === "ur" ? "←" : "›"}
                </span>
              </button>
            </div>

            <div
              className="flex items-start overflow-x-auto px-4 pb-1.5"
              style={{
                scrollbarWidth: "none",
                gap: profileCompleted
                  ? "clamp(16px, 4.5vw, 22px)"
                  : "clamp(14px, 3.8vw, 18px)",
              }}
            >
              {activeProducts.map((div) => {
                const verticalFor = getVerticalForProduct(div.name);

                return (
                  <button
                    key={div.name}
                    onClick={() =>
                      handleOrientationTap("product", tc(div.name), () => {
                        const selProducts = getProductSelectionsForDivision(div.name);
                        push({
                          id: "byproduct-combined",
                          products: selProducts,
                          active: 0,
                        });
                      })
                    }
                    className="flex-shrink-0 flex flex-col items-center tap-target"
                    style={{
                      width: profileCompleted
                        ? "clamp(102px, 26vw, 122px)"
                        : "clamp(96px, 24vw, 112px)",
                      zIndex: voiceGuideActive ? 45 : undefined,
                    }}
                  >
                    {/* Active Circle - Grown to fill space luxuriously */}
                    <div
                      className="zm-beam-border zm-beam-border-white"
                      style={{
                        width: profileCompleted
                          ? "clamp(100px, 13vh, 116px)"
                          : "clamp(92px, 12.2vh, 104px)",
                        height: profileCompleted
                          ? "clamp(100px, 13vh, 116px)"
                          : "clamp(92px, 12.2vh, 104px)",
                        borderRadius: "50%",
                        border: "3px solid #087F63",
                        background: "#F4FAF7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        boxShadow: "0 6px 18px rgba(8,127,99,0.22)",
                      }}
                    >
                      <img
                        src={getproductIconSrc(div.name, verticalFor)}
                        alt={div.name}
                        style={{
                          width: "80%",
                          height: "80%",
                          objectFit: "contain",
                        }}
                      />

                      {/* Active check badge */}
                      <span
                        style={{
                          position: "absolute",
                          bottom: 2,
                          right: 2,
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "#087F63",
                          color: "#fff",
                          border: "2px solid #EEF7F2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 900,
                        }}
                      >
                        ✓
                      </span>
                    </div>

                    {/* Name */}
                    <span
                      style={{
                        marginTop: 6,
                        fontSize: profileCompleted ? 15 : 14,
                        fontWeight: 800,
                        color: "#183B34",
                        fontFamily:
                          lang === "ur"
                            ? URDU_FONT
                            : "inherit",
                        lineHeight: 1.15,
                      }}
                    >
                      {tc(div.name)}
                    </span>

                    {/* Active Badge */}
                    <span
                      className="zm-beam-border zm-beam-border-white"
                      style={{
                        marginTop: 3,
                        padding: "2.5px 11px",
                        borderRadius: 9999,
                        background: "linear-gradient(135deg, rgba(8, 127, 99, 0.95), rgba(5, 150, 105, 0.9))",
                        border: "1px solid rgba(255, 255, 255, 0.5)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                        boxShadow: "0 2px 8px rgba(8, 127, 99, 0.25)",
                        color: "#fff",
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                        fontFamily:
                          lang === "ur"
                            ? URDU_FONT
                            : "inherit",
                      }}
                    >
                      {t("ACTIVE")}
                    </span>
                  </button>
                );
              })}

              {/* Locked Products */}
              {lockedProducts.map((div) => {
                const verticalFor = getVerticalForProduct(div.name);
                const iconSrc = getproductIconSrc(div.name, verticalFor);

                return (
                  <button
                    key={div.name}
                    onClick={() =>
                      handleLockedProductClick(div.name, verticalFor)
                    }
                    className="flex-shrink-0 flex flex-col items-center tap-target"
                    style={{
                      width: profileCompleted
                        ? "clamp(74px, 18vw, 86px)"
                        : "clamp(68px, 16vw, 78px)",
                    }}
                  >
                    {/* Locked circle */}
                    <div
                      className="zm-beam-border zm-beam-border-green"
                      style={{
                        width: profileCompleted
                          ? "clamp(68px, 8.8vh, 80px)"
                          : "clamp(62px, 8vh, 74px)",
                        height: profileCompleted
                          ? "clamp(68px, 8.8vh, 80px)"
                          : "clamp(62px, 8vh, 74px)",
                        marginTop: profileCompleted ? 18 : 14,
                        borderRadius: "50%",
                        background: "#E4EFE9",
                        border: "1.5px solid #BDD9CD",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "0 2px 6px rgba(18,65,48,0.06)",
                      }}
                    >
                      <img
                        src={iconSrc}
                        alt={div.name}
                        style={{
                          width: "75%",
                          height: "75%",
                          objectFit: "contain",
                          filter: "blur(2px) grayscale(20%)",
                          opacity: 0.55,
                          position: "absolute",
                        }}
                      />

                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: "rgba(255, 255, 255, 0.85)",
                          backdropFilter: "blur(2px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          zIndex: 2,
                          border: "1px solid rgba(255, 255, 255, 0.9)",
                        }}
                      >
                        <LockIconSVG
                          size={12}
                          color="#2A483E"
                        />
                      </div>
                    </div>

                    <span
                      style={{
                        marginTop: 4,
                        fontSize: profileCompleted ? 13 : 11.5,
                        color: "#475F57",
                        fontWeight: 700,
                        textAlign: "center",
                        lineHeight: 1.15,
                        maxWidth: 76,
                        fontFamily:
                          lang === "ur"
                            ? URDU_FONT
                            : "inherit",
                      }}
                    >
                      {tc(div.name)}
                    </span>

                    <span
                      className="zm-beam-border zm-beam-border-green"
                      style={{
                        marginTop: 2,
                        padding: "2px 8px",
                        borderRadius: 9999,
                        background: "rgba(228, 240, 234, 0.75)",
                        border: "1px solid rgba(16, 185, 129, 0.35)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                        boxShadow: "0 1.5px 4px rgba(8, 127, 99, 0.08)",
                        color: "#35594C",
                        fontSize: 9,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        fontFamily:
                          lang === "ur"
                            ? URDU_FONT
                            : "inherit",
                      }}
                    >
                      {t("Subscribe")}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ===================================================
              FAVORITES (Balanced vertical spacing)
              =================================================== */}

          <section
            className="px-4"
            style={{
              position: "relative",
              zIndex: voiceGuideActive ? 45 : 10,
              paddingTop: profileCompleted ? "10px" : "4px",
            }}
          >
            {/* Favorites heading */}
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <p
                    style={{
                      fontSize: profileCompleted
                        ? "clamp(18px, 2.5vh, 22px)"
                        : "clamp(16px, 2.2vh, 19px)",
                      fontWeight: 800,
                      color: "#183B34",
                      lineHeight: 1.2,
                      fontFamily:
                        lang === "ur"
                          ? URDU_FONT
                          : "inherit",
                    }}
                  >
                    {t("Favorites")}
                  </p>

                </div>
              </div>

              {/* See All Button */}
              <button
                onClick={() => {
                  handleOrientationTap(
                    "favorites-all",
                    lang === "ur" ? "پسندیدہ ریٹس" : "Favorite Rates",
                    () => {
                      push({
                        id: "byproduct-combined",
                        products: [
                          {
                            vertical: "Grains",
                            product: "Wheat",
                          },
                        ],
                        active: 0,
                      });
                    },
                  );
                }}
                className="tap-target zm-beam-border flex items-center justify-center rounded-full px-3 py-1 transition active:scale-95"
                style={{
                  background: "rgba(255, 255, 255, 0.65)",
                  border: "1.2px solid rgba(16, 185, 129, 0.35)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  color: "#087F63",
                  fontSize: "12px",
                  fontWeight: 700,
                  gap: "4px",
                  fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                }}
              >
                <span>{lang === "ur" ? "سب دیکھیں" : "See All"}</span>
                <span style={{ fontSize: "12px", fontWeight: 800 }}>
                  {lang === "ur" ? "←" : "›"}
                </span>
              </button>
            </div>

            {/* Favorite cards — 3 cards visible at a time with page swipe and curved layout */}
            {(() => {
              const defaultMandiName =
                profileCity || initialUserData?.city || "Pakpattan Mandi";
              const favoriteCardsList =
                pickedByproducts && pickedByproducts.length > 0
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

              // Group into pages of 3 cards each
              const favPages: (typeof favoriteCardsList)[] = [];
              for (let i = 0; i < favoriteCardsList.length; i += 3) {
                favPages.push(favoriteCardsList.slice(i, i + 3));
              }

              const handleFavScroll = (e: React.UIEvent<HTMLDivElement>) => {
                const el = e.currentTarget;
                if (!el.clientWidth) return;
                const scrollPos = Math.abs(el.scrollLeft);
                const pIdx = Math.round(scrollPos / el.clientWidth);
                if (pIdx !== favPageIndex && pIdx >= 0 && pIdx < favPages.length) {
                  setFavPageIndex(pIdx);
                }
              };

              const scrollFavToPage = (idx: number) => {
                if (!favScrollRef.current) return;
                const el = favScrollRef.current;
                const targetX = idx * el.clientWidth;
                el.scrollTo({
                  left: lang === "ur" ? -targetX : targetX,
                  behavior: "smooth",
                });
                setFavPageIndex(idx);
              };

              return (
                <>
                  <div
                    ref={favScrollRef}
                    onScroll={handleFavScroll}
                    className="flex overflow-x-auto w-full"
                    style={{
                      scrollbarWidth: "none",
                      scrollSnapType: "x mandatory",
                      paddingTop: "6px",
                      paddingBottom: "8px",
                    }}
                  >
                    {favPages.map((pageCards, pageIdx) => {
                      return (
                        <div
                          key={`fav-page-${pageIdx}`}
                          className="w-full flex-shrink-0 flex items-center justify-between gap-2 px-0.5"
                          style={{
                            scrollSnapAlign: "start",
                            scrollSnapStop: "always",
                            minWidth: "100%",
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        >
                          {pageCards.map((item, inPageIdx) => {
                            const imgSrc = getFavoriteImage(item.byproduct);
                            const cleanMandi = item.mandiName
                              .replace(/\s*Mandi\s*/i, "")
                              .replace(/\s*منڈی\s*/g, "")
                              .trim();

                            // Curved fan/arc transformation across the 3 visible cards
                            const cardRot = inPageIdx === 0
                              ? (lang === "ur" ? 4 : -4)
                              : inPageIdx === 2
                                ? (lang === "ur" ? -4 : 4)
                                : 0;
                            const cardY = inPageIdx === 1 ? 0 : 4;

                            return (
                              <button
                                key={`${item.byproduct}-${item.mandiName}-${pageIdx * 3 + inPageIdx}`}
                                onClick={() => {
                                  const spokenName =
                                    lang === "ur"
                                      ? `${tc(item.byproduct)} ${tm(item.mandiName)}`
                                      : `${item.byproduct} ${item.mandiName}`;
                                  handleOrientationTap("favorite-card", spokenName, () => {
                                    push({
                                      id: "product-rates",
                                      vertical: item.vertical,
                                      product: item.product,
                                      byproduct: item.byproduct,
                                      initialMandi: item.mandiName,
                                      initialRateType: item.rateType,
                                    });
                                  });
                                }}
                                className="flex-shrink-0 zm-beam-border zm-beam-border-card flex flex-col items-center relative tap-target"
                                style={{
                                  width: "calc((100% - 16px) / 3)",
                                  minWidth: "calc((100% - 16px) / 3)",
                                  maxWidth: "calc((100% - 16px) / 3)",
                                  height: "clamp(152px, 19.5vh, 176px)",
                                  padding: "6px 5px 8px",
                                  borderRadius: 18,
                                  background: "#FFFFFF",
                                  border: "1.2px solid #D5E5DE",
                                  boxShadow: "0 4px 14px rgba(18,65,48,0.08)",
                                  transform: `translateY(${cardY}px) rotate(${cardRot}deg)`,
                                  transformOrigin: "center bottom",
                                  transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease",
                                }}
                              >
                                {/* Inner Image Frame */}
                                <div
                                  style={{
                                    width: "100%",
                                    height: "clamp(74px, 9.6vh, 88px)",
                                    borderRadius: 13,
                                    background: "#F2F7F4",
                                    border: "1px solid #E1ECE6",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    position: "relative",
                                    overflow: "hidden",
                                  }}
                                >
                                  {/* Heart Badge in Top Corner */}
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: 4,
                                      right: lang === "ur" ? "auto" : 4,
                                      left: lang === "ur" ? 4 : "auto",
                                      width: 19,
                                      height: 19,
                                      borderRadius: "50%",
                                      background: "rgba(255, 255, 255, 0.95)",
                                      backdropFilter: "blur(4px)",
                                      boxShadow: "0 1.5px 4px rgba(0,0,0,0.12)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      zIndex: 3,
                                    }}
                                  >
                                    <svg
                                      width="11"
                                      height="11"
                                      viewBox="0 0 24 24"
                                      fill="#E11D48"
                                      stroke="#E11D48"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                  </div>

                                  {/* By-product Icon/Image */}
                                  {imgSrc ? (
                                    <img
                                      src={imgSrc}
                                      alt={item.byproduct}
                                      loading="lazy"
                                      style={{
                                        width: "78%",
                                        height: "78%",
                                        objectFit: "contain",
                                        display: "block",
                                        filter: "none",
                                        opacity: 1,
                                      }}
                                    />
                                  ) : (
                                    <ProductIcon
                                      name={item.byproduct}
                                      vertical={item.vertical || "Grains"}
                                      size={44}
                                      style={{
                                        filter: "none",
                                        opacity: 1,
                                      }}
                                    />
                                  )}
                                </div>

                                {/* Name: By-product & Mandi Badge */}
                                <div className="mt-auto w-full px-0.5 flex flex-col items-center justify-center pt-1">
                                  <span
                                    className="text-center font-extrabold truncate w-full text-[#183B34]"
                                    style={{
                                      fontSize: "clamp(11.5px, 1.5vh, 13.5px)",
                                      lineHeight: 1.2,
                                      fontFamily:
                                        lang === "ur"
                                          ? URDU_FONT
                                          : "'Poppins', sans-serif",
                                    }}
                                    title={lang === "ur" ? tc(item.byproduct) : item.byproduct}
                                  >
                                    {lang === "ur" ? tc(item.byproduct) : item.byproduct}
                                  </span>

                                  {/* Mandi Location Badge */}
                                  <div
                                    className="flex items-center justify-center gap-1 mt-1 px-1.5 py-0.5 rounded-full"
                                    style={{
                                      background: "#EAF5F0",
                                      border: "1px solid #C7E8D8",
                                      maxWidth: "100%",
                                    }}
                                    title={lang === "ur" ? tm(cleanMandi) : cleanMandi}
                                  >
                                    <svg
                                      width="8"
                                      height="8"
                                      viewBox="0 0 24 24"
                                      fill="#087F63"
                                      className="flex-shrink-0"
                                    >
                                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                      <circle cx="12" cy="9" r="2.5" fill="#EAF5F0" />
                                    </svg>
                                    <span
                                      className="font-bold text-[9px] text-[#075E4F] truncate"
                                      style={{
                                        lineHeight: 1.15,
                                        fontFamily:
                                          lang === "ur"
                                            ? URDU_FONT
                                            : "inherit",
                                      }}
                                    >
                                      {lang === "ur" ? tm(cleanMandi) : cleanMandi}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Dots Indicator — 3 swipe pages */}
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    {favPages.map((_, pIdx) => {
                      const isActive = (favPageIndex % favPages.length) === pIdx;
                      return (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => scrollFavToPage(pIdx)}
                          aria-label={`Page ${pIdx + 1}`}
                          className="transition-all duration-300 tap-target"
                          style={{
                            width: isActive ? 18 : 5.5,
                            height: 3.5,
                            borderRadius: 999,
                            background: isActive ? "#087F63" : "#C6DFD4",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                          }}
                        />
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </section>
        </div>

        {/* Agricultural Foreground Foliage Layer (Leaves anchored at bottom) */}
        <img
          src={agriForegroundImg}
          alt="Agricultural Foliage Foreground"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            width: "100%",
            height: "auto",
            maxHeight: "clamp(55px, 8.5vh, 78px)",
            objectFit: "fill",
            pointerEvents: "none",
            zIndex: 1,
            opacity: 0.95,
          }}
        />

        {/* ===================================================
            YOUR PICKS SHEET
            =================================================== */}

        {picksFavSheet && (
          <div
            className="zm-sheet-overlay"
            style={{ zIndex: 200 }}
            onClick={() => setPicksFavSheet(false)}
          >
            <div
              className="zm-sheet-high"
              style={{
                background: "#F4FAF7",
                height: "88vh",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="px-5 pt-5 pb-3 flex-shrink-0"
                style={{
                  borderBottom: "1px solid #D5E2DD",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-lg">Select Your Picks</p>

                    <p
                      className="text-xs mt-0.5"
                      style={{
                        color: "#52635F",
                      }}
                    >
                      Choose byproducts to track on your home screen
                    </p>
                  </div>

                  {pickedByproducts.length > 0 && (
                    <button
                      onClick={() => setPickedByproducts([])}
                      className="tap-target text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{
                        background: "#F9E1DE",
                        color: "#A83B37",
                      }}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Search */}
                <div
                  className="flex items-center gap-2 rounded-xl px-3"
                  style={{
                    height: 40,
                    background: "#F1F7F4",
                    border: "1px solid #D5E2DD",
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                    }}
                  >
                    ⌕
                  </span>

                  <input
                    value={picksSearch}
                    onChange={(e) => setPicksSearch(e.target.value)}
                    placeholder="Search byproducts…"
                    className="flex-1 text-sm bg-transparent outline-none"
                    style={{
                      color: "#183B34",
                    }}
                  />
                </div>

                {/* Vertical tabs */}
                <div
                  className="flex gap-2 mt-2 overflow-x-auto pb-1"
                  style={{
                    scrollbarWidth: "none",
                  }}
                >
                  {Object.entries(VERTICALS).map(([v, vd]) => (
                    <button
                      key={v}
                      onClick={() => setPicksVertical(v)}
                      className="tap-target flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{
                        background: picksVertical === v ? "#087F63" : "#F1F7F4",
                        color: picksVertical === v ? "#fff" : "#52635F",
                        border: `1px solid ${picksVertical === v ? "#087F63" : "#D5E2DD"
                          }`,
                      }}
                    >
                      <SpriteIcon
                        spriteKey={vd.icon}
                        size={14}
                        style={{
                          filter:
                            picksVertical === v
                              ? "brightness(0) invert(1)"
                              : "none",
                        }}
                      />

                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Byproducts */}
              <div className="overflow-y-auto flex-1 min-h-0 px-4 pt-3 pb-2 flex flex-col gap-2">
                {Object.entries(
                  VERTICALS[picksVertical]?.products || {},
                ).flatMap(([product, byproducts]) =>
                  byproducts
                    .filter(
                      (bp) =>
                        !picksSearch ||
                        bp.toLowerCase().includes(picksSearch.toLowerCase()) ||
                        product
                          .toLowerCase()
                          .includes(picksSearch.toLowerCase()),
                    )
                    .map((bp) => {
                      const item: RateItem = {
                        vertical: picksVertical,
                        product,
                        byproduct: bp,
                      };

                      const selected = isPickedBP(item);

                      return (
                        <button
                          key={`${product}|${bp}`}
                          onClick={() => togglePickBP(item)}
                          className="tap-target flex-shrink-0 rounded-2xl overflow-hidden flex items-center"
                          style={{
                            height: 64,
                            background: selected ? "#E4F2EC" : "#fff",
                            border: `1.5px solid ${selected ? "#087F63" : "#D5E2DD"
                              }`,
                          }}
                        >
                          <div
                            className="flex-shrink-0 flex items-center justify-center"
                            style={{
                              width: 56,
                              height: 64,
                              background: selected ? "#D9EEE4" : "#F1F7F4",
                            }}
                          >
                            <ProductIcon
                              name={bp}
                              vertical={picksVertical}
                              size={36}
                            />
                          </div>

                          <div className="flex-1 px-3 text-left">
                            <p
                              className="font-bold text-sm"
                              style={{
                                color: selected ? "#087F63" : "#183B34",
                              }}
                            >
                              {bp}
                            </p>

                            <p
                              className="text-[10px]"
                              style={{
                                color: "#52635F",
                              }}
                            >
                              {product} · {picksVertical}
                            </p>
                          </div>

                          <div
                            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mr-3"
                            style={{
                              background: selected ? "#087F63" : "#D5E2DD",
                            }}
                          >
                            <span
                              style={{
                                color: "#fff",
                                fontSize: 14,
                                fontWeight: 800,
                              }}
                            >
                              {selected ? "✓" : "+"}
                            </span>
                          </div>
                        </button>
                      );
                    }),
                )}
              </div>

              {/* Footer */}
              <div
                className="px-4 pb-6 pt-3 flex-shrink-0"
                style={{
                  borderTop: "1px solid #D5E2DD",
                }}
              >
                <button
                  onClick={() => setPicksFavSheet(false)}
                  className="tap-target w-full rounded-2xl py-4 font-bold text-white text-base"
                  style={{
                    background: "#087F63",
                  }}
                >
                  {pickedByproducts.length > 0
                    ? `Show ${pickedByproducts.length} Pick${pickedByproducts.length > 1 ? "s" : ""
                    }`
                    : "Done · Show All"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom breathing space */}
        <div style={{ height: 8 }} />
      </div>

      {/* =====================================================
          NOTIFICATIONS
          ===================================================== */}

      {/* =====================================================
          ACCOUNT & PROFILE (see ../account/AccountCenter.tsx)
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

      {/* "View All" product-category grid -- every division (active +
          locked), tap an unlocked one to open it, tap a locked one to start
          the subscribe flow, same as the homepage row's tiles. */}
      {showAllProducts && (
        <div
          className="fixed inset-0 flex flex-col screen-enter"
          style={{ zIndex: 340, background: "#F1F7F4" }}
        >
          <header
            className="flex-shrink-0 flex items-center gap-2 px-4 pb-3"
            style={{
              paddingTop: "max(36px, calc(var(--zm-bleed-top) + 10px))",
              background: "rgba(244, 250, 247, 0.95)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderBottom: "1px solid rgba(213, 226, 221, 0.8)",
            }}
          >
            <button
              onClick={() => setShowAllProducts(false)}
              className="tap-target zm-beam-border w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 text-[#183B34] transition active:scale-95"
              style={{
                background: "rgba(255, 255, 255, 0.7)",
                border: "1.2px solid rgba(16, 185, 129, 0.4)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              {lang === "ur" ? "→" : "←"}
            </button>
            <h2
              className="text-[16px] font-black text-[#143B33]"
              style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
            >
              {lang === "ur" ? "تمام مصنوعات" : "All Products"}
            </h2>
          </header>

          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
            <div
              className="grid gap-x-2 gap-y-5"
              style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
            >
              {[...activeProducts, ...lockedProducts].map((div) => {
                const verticalFor = getVerticalForProduct(div.name);
                const unlocked = isAccessible(div.name);
                return (
                  <button
                    key={div.name}
                    onClick={() => {
                      setShowAllProducts(false);
                      if (unlocked) {
                        const selProducts = getProductSelectionsForDivision(div.name);
                        push({ id: "byproduct-combined", products: selProducts, active: 0 });
                      } else {
                        handleLockedProductClick(div.name, verticalFor);
                      }
                    }}
                    className="flex flex-col items-center tap-target"
                  >
                    <div
                      className={unlocked ? "zm-beam-border zm-beam-border-white" : "zm-beam-border zm-beam-border-green"}
                      style={{
                        width: "clamp(78px, 22vw, 92px)",
                        height: "clamp(78px, 22vw, 92px)",
                        borderRadius: "50%",
                        border: unlocked ? "3px solid #087F63" : "1.5px solid #BDD9CD",
                        background: unlocked ? "#F4FAF7" : "#E4EFE9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        boxShadow: unlocked ? "0 6px 18px rgba(8,127,99,0.22)" : "0 2px 6px rgba(18,65,48,0.06)",
                      }}
                    >
                      <img
                        src={getproductIconSrc(div.name, verticalFor)}
                        alt={div.name}
                        style={{
                          width: "72%",
                          height: "72%",
                          objectFit: "contain",
                          opacity: unlocked ? 1 : 0.55,
                        }}
                      />
                      {!unlocked && (
                        <span
                          style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "#7A8D85",
                            color: "#fff",
                            border: "2px solid #F1F7F4",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                          }}
                        >
                          🔒
                        </span>
                      )}
                    </div>
                    <span
                      className="text-center"
                      style={{
                        marginTop: 6,
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: unlocked ? "#183B34" : "#6B7C76",
                        fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                        lineHeight: 1.15,
                      }}
                    >
                      {tc(div.name)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Favorites Subscription Prompt Modal */}
      {favLockModalOpen && (
        <div
          className="zm-sheet-overlay"
          style={{
            zIndex: 360,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setFavLockModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center"
            style={{
              animation: "screenEnter 0.2s ease-out",
              border: "1.5px solid #D5E2DD",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#E4F2EC",
                color: "#087F63",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                margin: "0 auto 12px",
              }}
            >
              🔒
            </div>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#183B34",
                marginBottom: 6,
              }}
            >
              {lang === "ur"
                ? "پسندیدہ اشیاء شامل کرنے کے لیے سبسکرائب کریں"
                : "Subscribe to Add Favorites"}
            </h3>
            <p
              style={{
                fontSize: 12.5,
                color: "#52635F",
                lineHeight: 1.5,
                marginBottom: 18,
              }}
            >
              {lang === "ur"
                ? "اپنی پسندیدہ زرعی اجناس کو محفوظ کرنے، لائیو منڈی ریٹ الرٹس اور روزانہ تجزیاتی رپورٹس حاصل کرنے کے لیے اپنا پروفائل سیٹ اپ یا سبسکرپشن پلان مکمل کریں۔"
                : "Complete your profile setup and subscribe to customize your favorite products."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setFavLockModalOpen(false);
                  setCompleteProfileOpen(true);
                }}
                className="tap-target w-full py-3 rounded-2xl font-extrabold text-sm text-white"
                style={{
                  background: "#087F63",
                  boxShadow: "0 4px 14px rgba(8,127,99,0.3)",
                }}
              >
                {lang === "ur"
                  ? "پروفائل مکمل کریں اور سبسکرائب کریں →"
                  : "Complete Profile →"}
              </button>
              <button
                type="button"
                onClick={() => setFavLockModalOpen(false)}
                className="tap-target w-full py-2.5 rounded-2xl font-bold text-xs"
                style={{ background: "#F1F7F4", color: "#52635F" }}
              >
                {lang === "ur" ? "بعد میں" : "Not Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {notifOpen && (
        <div
          className="zm-sheet-overlay"
          style={{ zIndex: 300 }}
          onClick={() => setNotifOpen(false)}
        >
          <div
            className="zm-sheet-high"
            style={{
              background: "#F4FAF7",
              maxHeight: "80vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-5 pt-4 pb-3 flex-shrink-0"
              style={{
                borderBottom: "1px solid #D5E2DD",
              }}
            >
              <div
                className="w-10 h-1 rounded-full mx-auto mb-3"
                style={{
                  background: "#C7D6D0",
                }}
              />

              <div className="flex items-center justify-between">
                <p className="font-bold text-lg">Notifications</p>

                <button
                  onClick={() => setNotifOpen(false)}
                  className="tap-target text-sm font-semibold px-3 py-1 rounded-full"
                  style={{
                    background: "#E8EFEC",
                    color: "#52635F",
                  }}
                >
                  Done
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {pickedByproducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <span
                    style={{
                      fontSize: 36,
                    }}
                  >
                    🔔
                  </span>

                  <p
                    className="font-bold mt-3"
                    style={{
                      color: "#183B34",
                    }}
                  >
                    No Picks Yet
                  </p>

                  <p
                    className="text-sm mt-1"
                    style={{
                      color: "#52635F",
                    }}
                  >
                    Star a by-product to get rate alerts here.
                  </p>
                </div>
              ) : (
                pickedByproducts.map((item, i) => {
                  const row = allMandiRows.find(
                    (r) =>
                      r.product === item.product &&
                      r.byproduct === item.byproduct,
                  );

                  const hoursAgo = [2, 5, 1, 8, 3, 6, 12, 4][i % 8];

                  const trendRow = row?.trend || "stable";

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-5 py-3.5"
                      style={{
                        borderBottom: "1px solid #E8EFEC",
                      }}
                    >
                      {/* Trend icon */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                            trendRow === "up"
                              ? "#E4F2EC"
                              : trendRow === "down"
                                ? "#F9E1DE"
                                : "#E8EFEC",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 18,
                            color:
                              trendRow === "up"
                                ? "#087F63"
                                : trendRow === "down"
                                  ? "#A83B37"
                                  : "#52635F",
                          }}
                        >
                          {trendRow === "up"
                            ? "↗"
                            : trendRow === "down"
                              ? "↘"
                              : "→"}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className="font-bold text-sm truncate"
                          style={{
                            color: "#183B34",
                          }}
                        >
                          {item.byproduct || item.product}
                        </p>

                        <p
                          className="text-xs"
                          style={{
                            color:
                              trendRow === "up"
                                ? "#075E4F"
                                : trendRow === "down"
                                  ? "#A83B37"
                                  : "#52635F",
                          }}
                        >
                          {row
                            ? `Rate updated · Rs.${row.min.toLocaleString()}–${row.max.toLocaleString()} / 40 kg`
                            : "Rate updated"}
                        </p>
                      </div>

                      <span
                        className="text-[11px] flex-shrink-0"
                        style={{
                          color: "#80918B",
                        }}
                      >
                        {hoursAgo}h ago
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
