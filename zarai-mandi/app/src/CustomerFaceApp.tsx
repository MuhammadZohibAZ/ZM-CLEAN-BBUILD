import { lazy, Suspense, useState, useRef, useEffect } from "react";
import { PageCurtain, usePageCurtain } from "./components/ui/page-curtain";

import { FloatingMiniPlayer } from "./customer-face/components/FloatingMiniPlayer";
import { BottomNav } from "./customer-face/navigation/BottomNav";
import { VoiceQueryOverlay } from "./customer-face/navigation/VoiceQueryOverlay";
import { BillingScreen } from "./customer-face/screens/BillingScreen";
import { ByProductCombinedScreen } from "./customer-face/screens/ByProductCombinedScreen";
import { ByProductSelectScreen } from "./customer-face/screens/ByProductSelectScreen";
import { HomeScreen } from "./customer-face/screens/HomeScreen";
import { LiveMarketScreen } from "./customer-face/screens/LiveMarketScreen";
import { MandiDetailScreen } from "./customer-face/screens/MandiDetailScreen";
import { MandiListScreen } from "./customer-face/screens/MandiListScreen";
import { ProductRatesScreen } from "./customer-face/screens/ProductRatesScreen";
import { ProductSelectScreen } from "./customer-face/screens/ProductSelectScreen";
import { RatesResultScreen } from "./customer-face/screens/RatesResultScreen";
import { RepDashboardScreen } from "./customer-face/screens/RepDashboardScreen";
import { SearchScreen } from "./customer-face/screens/SearchScreen";
import { NewsVideosScreen } from "./customer-face/screens/ZaraiReelsScreen";
import {
  PRODUCT_ID_TO_NAME,
  SUBSCRIBED_PRODUCTS,
  TODAY_ONLY_PRODUCTS,
} from "./customer-face/shared/data/catalog";
import { getproductIconSrc } from "./customer-face/shared/data/icons";
import { ZARAI_REELS, type ZaraiReel } from "./customer-face/shared/data/reels";
import { LangProvider, useLang } from "./customer-face/shared/i18n/LangProvider";
import {
  type AppProps,
  type FeedFilter,
  type LocationScope,
  type NavTab,
  type ProfileSetupData,
  type RateItem,
  type Screen,
} from "./customer-face/shared/types";
import { speakText } from "./customer-face/shared/voice";
import { CompleteProfileModal } from "./customer-face/sheets/CompleteProfileModal";
import { FeedModal } from "./customer-face/sheets/FeedModal";
import { LocationScopeSheet } from "./customer-face/sheets/LocationScopeSheet";
import { MultiLocSheet } from "./customer-face/sheets/MultiLocSheet";

// Compare (with its live-data adapter) is split out of the main bundle.
const CompareScreen = lazy(() => import("./components/compare/CompareScreen"));

const NAV_ORDER: Record<NavTab, number> = { home: 0, compare: 1, news: 2, voice: 3 };
const NAV_CURTAIN: Partial<Record<NavTab, { en: string; ur: string; color: string }>> = {
  home: { en: "Home", ur: "ہوم", color: "#087F63" },
  compare: { en: "Compare", ur: "موازنہ", color: "#07332F" },
  news: { en: "Reels", ur: "ویڈیوز", color: "#B9822E" },
};

function AppInner({
  initialUserData,
  activeRole = "customer",
  hasRepAccount = false,
  onSwitchRole,
  onStartRepOnboarding,
  onRestartOnboarding,
}: AppProps) {
  useEffect(() => {
    if (initialUserData?.products && Array.isArray(initialUserData.products)) {
      initialUserData.products.forEach((p) => {
        const mapped = PRODUCT_ID_TO_NAME[p.toLowerCase()] || p;
        SUBSCRIBED_PRODUCTS.add(mapped);
      });
    }
  }, [initialUserData]);

  const { lang, voiceEnabled } = useLang();
  const [stack, setStack] = useState<Screen[]>([{ id: "home" }]);
  const [activeNav, setActiveNav] = useState<NavTab>("home");
  const [feedOpen, setFeedOpen] = useState(false);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>({
    products: [],
    byproducts: [],
    stations: [],
    rateTypes: [],
  });

  // Lifted Profile & Subscription state shared across screens
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [completeProfileOpen, setCompleteProfileOpen] = useState(false);
  const [userSubscribedList, setUserSubscribedList] = useState<string[]>(() => {
    const raw = initialUserData?.products;
    if (raw && raw.length > 0) {
      return raw.map((p) => PRODUCT_ID_TO_NAME[p.toLowerCase()] || p);
    }
    return ["Wheat"];
  });

  const [profileSetupData, setProfileSetupData] = useState<ProfileSetupData>(
    () => ({
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
    }),
  );

  const updateProfileSetupData = (partial: Partial<ProfileSetupData>) => {
    setProfileSetupData((prev) => ({ ...prev, ...partial }));
  };

  const handleCompleteProfileSubmit = (
    selected: string[],
    locationData?: { province: string; district: string; city: string },
  ) => {
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
    updateProfileSetupData({ selectedProds: merged });
    if (locationData && initialUserData) {
      initialUserData.province = locationData.province;
      initialUserData.district = locationData.district;
      initialUserData.city = locationData.city;
    }
    setProfileCompleted(true);
    setCompleteProfileOpen(false);
  };

  const handleSubscribeProduct = (productName: string) => {
    const mapped = PRODUCT_ID_TO_NAME[productName.toLowerCase()] || productName;
    SUBSCRIBED_PRODUCTS.add(mapped);
    TODAY_ONLY_PRODUCTS.add(mapped);
    setUserSubscribedList((prev) => {
      if (prev.includes(mapped)) return prev;
      return [...prev, mapped];
    });
    updateProfileSetupData({
      selectedProds: Array.from(new Set([...profileSetupData.selectedProds, mapped])),
    });
    setProfileCompleted(true);
  };

  // Your Picks — user-favourited byproducts, shared app-wide
  const [pickedByproducts, setPickedByproducts] = useState<RateItem[]>([]);
  const togglePickBP = (item: RateItem) =>
    setPickedByproducts((prev) => {
      const key = `${item.vertical}|${item.product}|${item.byproduct}`;
      const exists = prev.some(
        (p) => `${p.vertical}|${p.product}|${p.byproduct}` === key,
      );
      return exists
        ? prev.filter(
          (p) => `${p.vertical}|${p.product}|${p.byproduct}` !== key,
        )
        : [...prev, item];
    });
  const isPickedBP = (item: RateItem) =>
    pickedByproducts.some(
      (p) =>
        p.vertical === item.vertical &&
        p.product === item.product &&
        p.byproduct === item.byproduct,
    );

  // Contextual location scope, shared across the product/detail flow
  const [locationScope, setLocationScope] = useState<LocationScope>({
    kind: "pakistan",
    label: "All Pakistan",
  });
  const [locSheet, setLocSheet] = useState(false);

  // Floating mini-player state (YouTube style when navigating away from video feed)
  const [floatingVideo, setFloatingVideo] = useState<{
    reel: ZaraiReel;
    isPlaying: boolean;
    isMuted: boolean;
  } | null>(null);
  const currentVideoStateRef = useRef<{
    reel: ZaraiReel;
    isPlaying: boolean;
    isMuted: boolean;
  }>({
    reel: ZARAI_REELS[0],
    isPlaying: true,
    isMuted: false,
  });

  const current = stack[stack.length - 1];
  const push = (s: Screen) => {
    if (activeNav === "news" || current.id === "news") {
      setFloatingVideo({ ...currentVideoStateRef.current });
    }
    setStack((p) => [...p, s]);
  };
  const pop = () => {
    const doPop = () => setStack((p) => (p.length > 1 ? p.slice(0, -1) : p));
    if (voiceEnabled) {
      speakText(lang === "ur" ? "واپس" : "Back");
      setTimeout(doPop, 850);
      return;
    }
    doPop();
  };
  const replace = (s: Screen) => setStack((p) => [...p.slice(0, -1), s]);

  const curtain = usePageCurtain();

  const handleNav = (tab: NavTab) => {
    if (curtain.isPending) return;
    setVoicePhase("idle");
    const doNav = () => {
      if (activeNav === "news" && tab !== "news") {
        // User navigated away from video section -> minimize to floating mini player
        setFloatingVideo({ ...currentVideoStateRef.current });
      } else if (tab === "news") {
        // User entered video section -> clear floating mini player
        setFloatingVideo(null);
      }
      setActiveNav(tab);
      if (tab === "home" || tab === "compare" || tab === "news") {
        setStack([{ id: tab }]);
      }
    };

    // Curtain names the destination, then the page swaps while it is covered.
    const curtainInfo = NAV_CURTAIN[tab];
    const alreadyThere = tab === activeNav && stack.length === 1;
    const navigate = () => {
      if (!curtainInfo || alreadyThere) {
        doNav();
        return;
      }
      curtain.play(
        {
          title: lang === "ur" ? curtainInfo.ur : curtainInfo.en,
          subtitle: lang === "ur" ? curtainInfo.en : curtainInfo.ur,
          color: curtainInfo.color,
          direction: NAV_ORDER[tab] > NAV_ORDER[navActive] ? 1 : -1,
        },
        doNav,
      );
    };

    if (voiceEnabled) {
      let speech = "";
      if (tab === "home") speech = lang === "ur" ? "مرکزی صفحہ" : "Home";
      else if (tab === "compare") speech = lang === "ur" ? "موازنہ" : "Compare";
      else if (tab === "news") speech = lang === "ur" ? "ویڈیوز" : "Videos";
      if (speech) speakText(speech);
      setTimeout(navigate, 850);
      return;
    }
    navigate();
  };

  const openFeed = (filter?: Partial<FeedFilter>) => {
    setFeedFilter({
      products: [],
      byproducts: [],
      stations: [],
      rateTypes: [],
      ...filter,
    });
    setFeedOpen(true);
  };

  type RatesScr = Extract<Screen, { id: "rates-result" }>;
  type MandiScr = Extract<Screen, { id: "mandi-detail" }>;
  type ComRatesScr = Extract<Screen, { id: "product-rates" }>;
  type CombinedScr = Extract<Screen, { id: "byproduct-combined" }>;
  type BillingScr = Extract<Screen, { id: "billing" }>;

  const [voicePhase, setVoicePhase] = useState<
    "idle" | "orientation" | "query"
  >("idle");

  const handleVoiceTap = () => {
    if (voicePhase !== "idle") {
      setVoicePhase("idle");
      return;
    }
    // Orientation guide only makes sense on home screen
    if (current.id === "home") setVoicePhase("orientation");
  };
  const handleVoiceHold = () => {
    setVoicePhase("query");
  };

  const navActive: NavTab =
    (["compare", "news"] as NavTab[]).includes(activeNav) &&
      stack.length === 1
      ? activeNav
      : "home";

  return (
    <div
      className={`flex justify-center items-stretch ${lang === "ur" ? "lang-ur" : ""}`}
      dir={lang === "ur" ? "rtl" : "ltr"}
      style={{
        background: "#C7D6D0",
        height: "100dvh",
        fontFamily:
          lang === "ur"
            ? "'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', -apple-system, sans-serif"
            : "'Inter', 'Poppins', sans-serif",
      }}
    >
      <div
        className="zm-shell relative flex flex-col w-full max-w-md overflow-hidden"
        style={{
          height: "100dvh",
          background: "#F1F7F4",
          boxShadow: "0 0 80px rgba(0,0,0,0.18)",
        }}
      >
        <div
          className="relative flex-1 overflow-hidden flex flex-col"
          style={{ minHeight: 0 }}
        >
          <PageCurtain controller={curtain} />
          {current.id === "home" && (
            activeRole === "representative" ? (
              <RepDashboardScreen
                push={push}
                initialUserData={initialUserData}
                onSwitchRole={onSwitchRole}
                hasRepAccount={hasRepAccount}
              />
            ) : (
              <HomeScreen
                push={push}
                setFeedOpen={(v) => {
                  if (v) openFeed({});
                  else setFeedOpen(false);
                }}
                pickedByproducts={pickedByproducts}
                togglePickBP={togglePickBP}
                isPickedBP={isPickedBP}
                setPickedByproducts={setPickedByproducts}
                voiceGuideActive={voicePhase === "orientation"}
                onVoiceGuideClose={() => setVoicePhase("idle")}
                initialUserData={initialUserData}
                activeRole={activeRole}
                hasRepAccount={hasRepAccount}
                onSwitchRole={onSwitchRole}
                onStartRepOnboarding={onStartRepOnboarding}
                onRestartOnboarding={onRestartOnboarding}
                profileCompleted={profileCompleted}
                setProfileCompleted={setProfileCompleted}
                completeProfileOpen={completeProfileOpen}
                setCompleteProfileOpen={setCompleteProfileOpen}
                profileSetupData={profileSetupData}
                updateProfileSetupData={updateProfileSetupData}
                onCompleteProfileSubmit={handleCompleteProfileSubmit}
                userSubscribedList={userSubscribedList}
                setUserSubscribedList={setUserSubscribedList}
              />
            )
          )}
          {current.id === "search" && <SearchScreen push={push} onBack={pop} />}
          {current.id === "product-select" && (
            <ProductSelectScreen push={push} onBack={pop} />
          )}
          {current.id === "byproduct-select" && (
            <ByProductSelectScreen push={push} onBack={pop} />
          )}
          {current.id === "byproduct-combined" && (
            <ByProductCombinedScreen
              products={(current as CombinedScr).products}
              active={(current as CombinedScr).active}
              push={push}
              replace={replace}
              onBack={pop}
              isPickedBP={isPickedBP}
              togglePickBP={togglePickBP}
              locationScope={locationScope}
              onOpenLocation={() => setLocSheet(true)}
              onSelectLocation={(s) => setLocationScope(s)}
              profileCompleted={profileCompleted}
              onOpenSubscribe={() => setCompleteProfileOpen(true)}
            />
          )}
          {current.id === "rates-result" && (
            <RatesResultScreen
              items={(current as RatesScr).items}
              source={(current as RatesScr).source}
              onBack={pop}
            />
          )}
          {current.id === "mandi-list" && (
            <MandiListScreen push={push} onBack={pop} />
          )}
          {current.id === "mandi-detail" && (
            <MandiDetailScreen
              mandiId={(current as MandiScr).mandiId}
              onBack={pop}
              push={push}
            />
          )}
          {current.id === "product-rates" && (
            <ProductRatesScreen
              vertical={(current as ComRatesScr).vertical}
              product={(current as ComRatesScr).product}
              byproduct={(current as ComRatesScr).byproduct}
              onBack={pop}
              push={push}
              isPickedBP={isPickedBP}
              togglePickBP={togglePickBP}
              locationScope={locationScope}
              onOpenLocation={() => setLocSheet(true)}
              initialRateType={(current as ComRatesScr).initialRateType}
              initialMandi={(current as ComRatesScr).initialMandi}
              initialVariety={(current as ComRatesScr).initialVariety}
              initialNewOld={(current as ComRatesScr).initialNewOld}
              initialColor={(current as ComRatesScr).initialColor}
              initialSpec={(current as ComRatesScr).initialSpec}
              initialCondition={(current as ComRatesScr).initialCondition}
              initialMoisture={(current as ComRatesScr).initialMoisture}
              initialStatDate={(current as ComRatesScr).initialStatDate}
            />
          )}
          {current.id === "live-market" && <LiveMarketScreen onBack={pop} />}
          {current.id === "compare" && (
            <Suspense fallback={<div className="flex-1" style={{ background: "#F1F7F4" }} />}>
              <CompareScreen
                productIcon={(division) => getproductIconSrc(division)}
                // Free trial: every product can be compared; afterwards only paid ones.
                ownedProducts={profileCompleted ? userSubscribedList : undefined}
                renderLocationPicker={(picker) => (
                  <MultiLocSheet
                    multiProvince
                    selected={picker.selected}
                    dataMandiNames={picker.dataNames}
                    onApply={picker.onApply}
                    onClose={picker.onClose}
                  />
                )}
              />
            </Suspense>
          )}
          {current.id === "news" && (
            <NewsVideosScreen
              profileCompleted={profileCompleted}
              onOpenCompleteProfile={() => setCompleteProfileOpen(true)}
              onActiveReelChange={(reel, isPlaying, isMuted) => {
                currentVideoStateRef.current = { reel, isPlaying, isMuted };
              }}
              onMinimize={(reel, isPlaying, isMuted) => {
                setFloatingVideo({ reel, isPlaying, isMuted });
                handleNav("home");
              }}
            />
          )}
          {current.id === "billing" && (
            <BillingScreen
              product={(current as BillingScr).product}
              vertical={(current as BillingScr).vertical}
              onBack={pop}
              push={push}
              onSubscribeSuccess={handleSubscribeProduct}
            />
          )}
        </div>
        {floatingVideo && current.id !== "news" && (
          <FloatingMiniPlayer
            video={floatingVideo}
            onExpand={() => {
              handleNav("news");
              setFloatingVideo(null);
            }}
            onClose={() => setFloatingVideo(null)}
            onTogglePlay={() => {
              setFloatingVideo((prev) =>
                prev ? { ...prev, isPlaying: !prev.isPlaying } : null,
              );
            }}
          />
        )}
        <BottomNav
          active={navActive}
          onNav={handleNav}
          onVoiceTap={handleVoiceTap}
          onVoiceHold={handleVoiceHold}
          voiceActive={voicePhase !== "idle"}
        />
        {voicePhase === "query" && (
          <VoiceQueryOverlay
            onClose={() => setVoicePhase("idle")}
            onNavigate={(s) => {
              setVoicePhase("idle");
              setActiveNav("home");
              setStack([{ id: "home" }, s]);
            }}
          />
        )}
        {feedOpen && (
          <FeedModal
            initialFilter={feedFilter}
            onClose={() => setFeedOpen(false)}
          />
        )}
        {locSheet && (
          <LocationScopeSheet
            scope={locationScope}
            onSelect={(s) => {
              setLocationScope(s);
              setLocSheet(false);
            }}
            onClose={() => setLocSheet(false)}
          />
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
    </div>
  );
}

export default function CustomerFaceApp(props: AppProps) {
  return (
    <LangProvider>
      <AppInner {...props} />
    </LangProvider>
  );
}

