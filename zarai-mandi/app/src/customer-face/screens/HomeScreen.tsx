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
import { FLAT_ALL_MANDI_ROWS, LOCATIONS } from "../shared/data/mandis";
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

  const [favLockModalOpen, setFavLockModalOpen] = useState(false);
  const [todayOnlyUnlocked, setTodayOnlyUnlocked] = useState<string[]>([]);

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

  // User Profile State (allows interactive editing and reflects across the screen)
  const [profileName, setProfileName] = useState(
    initialUserData?.name || (lang === "ur" ? "محمد عارف" : "Muhammad Arif"),
  );
  const [profilePhone, setProfilePhone] = useState(
    initialUserData?.phone || "0300 1234567",
  );
  const [profileRole, setProfileRole] = useState("Trader / بیوپاری");
  const [profileBusiness, setProfileBusiness] = useState(
    "Arif Grain Trading Co.",
  );
  const [profileProvince, setProfileProvince] = useState(
    initialUserData?.province || "Punjab",
  );
  const [profileDistrict, setProfileDistrict] = useState(
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
  const [repModalOpen, setRepModalOpen] = useState(false);
  const [repConfirmModalOpen, setRepConfirmModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [showSwitchToast, setShowSwitchToast] = useState<string | null>(null);
  const lastProfileTapRef = useRef<number>(0);

  // Settings & Preferences State
  const [weightUnit, setWeightUnit] = useState<"maund" | "kg100" | "ton">(
    "maund",
  );
  const [alertSms, setAlertSms] = useState(true);
  const [alertWhatsApp, setAlertWhatsApp] = useState(true);
  const [alertMorningBell, setAlertMorningBell] = useState(true);
  const [autoRefreshRates, setAutoRefreshRates] = useState(true);
  const [speechRate, setSpeechRate] = useState<"1.0x" | "0.8x" | "1.2x">(
    "1.0x",
  );

  // Representative Form State
  const [repFullName, setRepFullName] = useState(profileName);
  const [repPhone, setRepPhone] = useState(profilePhone);
  const [repMandi, setRepMandi] = useState(profileCity);
  const [repExperience, setRepExperience] = useState(
    "5+ Years (تجربہ کار)",
  );
  const [repSubmitted, setRepSubmitted] = useState(false);

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
          height: 172,
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
        <div className="relative h-full flex flex-col justify-between px-4 pt-3.5 pb-7 z-10">
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
                    setProfileOpen(true);
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

        <div
          className={`relative z-10 flex-1 flex flex-col ${profileCompleted ? "justify-around" : "justify-between"
            }`}
          style={{
            paddingBottom: profileCompleted
              ? "clamp(8px, 1.6vh, 16px)"
              : "clamp(8px, 1.8vh, 20px)",
          }}
        >
          {/* ===================================================
              COMPLETE YOUR PROFILE PROGRESS CARD (Wavy Organic Contour Banner)
              (Only visible when profile is NOT yet completed)
              =================================================== */}
          {!profileCompleted && (
            <div className="px-4 pt-7">
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

            {/* Favorite cards — 3 cards visible at a time with swipe */}
            <div
              className="flex gap-2 overflow-x-auto"
              style={{
                scrollbarWidth: "none",
                scrollSnapType: "x mandatory",
                paddingTop: "6px",
                paddingBottom: "8px",
                paddingLeft: "2px",
                paddingRight: "2px",
              }}
            >
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

                const rotAngles =
                  lang === "ur"
                    ? [4, 0, -4]
                    : [-4, 0, 4];
                const yOffsets = [4, 0, 4];

                return favoriteCardsList.map((item, idx) => {
                  const imgSrc = getFavoriteImage(item.byproduct);
                  const cleanMandi = item.mandiName
                    .replace(/\s*Mandi\s*/i, "")
                    .replace(/\s*منڈی\s*/g, "")
                    .trim();

                  const cardRot = rotAngles[idx % 3];
                  const cardY = yOffsets[idx % 3];

                  return (
                    <button
                      key={`${item.byproduct}-${item.mandiName}-${idx}`}
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
                        scrollSnapAlign: "start",
                        transform: `translateY(${cardY}px) rotate(${cardRot}deg)`,
                        transformOrigin: "center bottom",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
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
                });
              })()}
            </div>

            {/* Pagination Dots Indicator — 3 swipe pages */}
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <div
                style={{
                  width: 18,
                  height: 3.5,
                  borderRadius: 999,
                  background: "#087F63",
                }}
              />
              <div
                style={{
                  width: 5.5,
                  height: 3.5,
                  borderRadius: 999,
                  background: "#C6DFD4",
                }}
              />
              <div
                style={{
                  width: 5.5,
                  height: 3.5,
                  borderRadius: 999,
                  background: "#C6DFD4",
                }}
              />
            </div>
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

      {/* "View All" product-category grid -- every division (active +
          locked), tap an unlocked one to open it, tap a locked one to start
          the subscribe flow, same as the homepage row's tiles. */}
      {showAllProducts && (
        <div
          className="fixed inset-0 flex flex-col screen-enter"
          style={{ zIndex: 340, background: "#F1F7F4" }}
        >
          <header
            className="flex-shrink-0 flex items-center gap-2 px-4 pt-9 pb-3"
            style={{
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
