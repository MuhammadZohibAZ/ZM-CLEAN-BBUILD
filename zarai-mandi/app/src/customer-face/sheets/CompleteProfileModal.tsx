import { useState } from "react";
import {
  getPackagesForMonth,
  getVarietyIcon,
  MONTH_KEYS,
  MONTH_NAMES_EN,
  MONTH_NAMES_UR,
  SEASON_PACKAGES,
} from "../../data/seasonProductData";

import { DURATION_MONTHS_BILLING, getMonthlyDiscount } from "../shared/data/billing";
import { VERTICALS } from "../shared/data/catalog";
import { ICON_PATHS, PRODUCTS_PATH } from "../shared/data/icons";
import { toUrduDigits, URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { type AppProps, type ProfileSetupData } from "../shared/types";

export function getSeasonPackageBasePrice(pkgOrProd: string): number {
  const k = (pkgOrProd || "").toLowerCase().trim();
  const pkg = SEASON_PACKAGES.find(
    (p) =>
      p.id === k ||
      p.name.toLowerCase() === k ||
      p.name.toLowerCase().includes(k) ||
      k.includes(p.name.toLowerCase())
  );
  if (pkg) return pkg.pricePerMonth;
  return 600;
}

export function getSeasonPackageIconSrc(pkgOrProd: string, _fallbackVertical?: string): string {
  const k = (pkgOrProd || "").toLowerCase().trim();
  const pkg = SEASON_PACKAGES.find(
    (p) =>
      p.id === k ||
      p.name.toLowerCase() === k ||
      p.name.toLowerCase().includes(k) ||
      k.includes(p.name.toLowerCase())
  );
  if (pkg) return pkg.icon;
  return ICON_PATHS.wheat || `${PRODUCTS_PATH}/wheat200.png`;
}

export function CompleteProfileModal({
  data,
  onUpdateData,
  onClose,
  onComplete,
  initialUserData,
}: {
  data: ProfileSetupData;
  onUpdateData: (partial: Partial<ProfileSetupData>) => void;
  onClose: () => void;
  onComplete: (
    selectedProducts: string[],
    locationData?: { province: string; district: string; city: string },
  ) => void;
  initialUserData?: AppProps["initialUserData"];
}) {
  const { lang, tc, tm } = useLang();

  // Step mapping: 3 steps (1: Interested Products, 2: Choose Plan, 3: Payment)
  const totalSteps = 3;
  const currentStep = Math.min(Math.max(data.step || 1, 1), totalSteps);

  const activeStepKey: "products" | "plan" | "payment" =
    currentStep === 1
      ? "products"
      : currentStep === 2
        ? "plan"
        : "payment";

  // MPIN Dialog State for Mobile Wallet
  const [mpinModalOpen, setMpinModalOpen] = useState(false);
  const [mpin, setMpin] = useState(["", "", "", ""]);
  const [mpinError, setMpinError] = useState("");
  const [isProcessingMpin, setIsProcessingMpin] = useState(false);
  const [mpinSuccess, setMpinSuccess] = useState(false);

  // Demonstration month index (0=Jan ... 8=Sep ... 11=Dec) - default to September (8)
  const [demoMonthIdx, setDemoMonthIdx] = useState(8);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [expandedPkgId, setExpandedPkgId] = useState<string | null>("fruits");
  const [allVarietiesModalPkg, setAllVarietiesModalPkg] = useState<any | null>(null);

  const monthlyTotal = data.selectedProds.reduce(
    (sum, p) => sum + getSeasonPackageBasePrice(p),
    0,
  );

  const { months, discount, regularTotal, discountAmt, finalTotal } =
    data.customMode
      ? (() => {
        const m = data.customMonths || 1;
        const d = getMonthlyDiscount(m);
        const reg = monthlyTotal * m;
        const da = Math.round(reg * d);
        return {
          months: m,
          discount: d,
          regularTotal: reg,
          discountAmt: da,
          finalTotal: reg - da,
        };
      })()
      : (() => {
        const m = DURATION_MONTHS_BILLING[data.dur] || 1;
        const d = getMonthlyDiscount(m);
        const reg = monthlyTotal * m;
        const da = Math.round(reg * d);
        return {
          months: m,
          discount: d,
          regularTotal: reg,
          discountAmt: da,
          finalTotal: reg - da,
        };
      })();

  const walletProviders = [
    {
      id: "jazzcash",
      label: "JazzCash",
      color: "#E83D2B",
      iconSrc: "/src/icons/jazz.png",
      sub: "Instant mobile MPIN prompt",
    },
    {
      id: "easypaisa",
      label: "EasyPaisa",
      color: "#4CAF50",
      iconSrc: "/src/icons/easypaisa.png",
      sub: "Instant approval MPIN",
    },
    {
      id: "sadapay",
      label: "SadaPay",
      color: "#00A389",
      iconSrc: "/src/icons/sadapay.png",
      sub: "In-app transfer request",
    },
    {
      id: "nayapay",
      label: "NayaPay",
      color: "#FF6F00",
      iconSrc: "/src/icons/nayapay.png",
      sub: "Fast wallet checkout",
    },
    {
      id: "upaisa",
      label: "UPaisa",
      color: "#F57F17",
      iconSrc: "/src/icons/upaisa.png",
      sub: "USSD / Mobile prompt",
    },
  ] as const;

  const directMethods = [
    {
      id: "jazzcash",
      label: "JazzCash Manual",
      color: "#E83D2B",
      iconSrc: "/src/icons/jazz.png",
      sub: "Send to Till / Account",
    },
    {
      id: "easypaisa",
      label: "EasyPaisa Manual",
      color: "#4CAF50",
      iconSrc: "/src/icons/easypaisa.png",
      sub: "Send to EasyPaisa Account",
    },
    {
      id: "bank",
      label: "Bank Transfer",
      color: "#1565C0",
      iconSrc: "/src/icons/banktransfer.png",
      sub: "Direct IBFT transfer",
    },
  ] as const;

  const directDetails: Record<string, { rows: [string, string][] }> = {
    jazzcash: {
      rows: [
        ["Account", "03058107777"],
        ["Account Name", "Muhammad Ghasharib Ali Shaukat"],
        ["Amount", `PKR ${finalTotal.toLocaleString()}`],
      ],
    },
    easypaisa: {
      rows: [
        ["Account", "03048107777"],
        ["Account Name", "Abdul Raafey Shaukat"],
        ["Amount", `PKR ${finalTotal.toLocaleString()}`],
      ],
    },
    bank: {
      rows: [
        ["Bank", "HBL"],
        ["Account Title", "Zarai Mandi Private Limited"],
        ["Account No.", "5000-7909-9814-03"],
        ["IBAN", "PK04HABB05000079089814030"],
        ["Amount", `PKR ${finalTotal.toLocaleString()}`],
      ],
    },
  };

  function formatCardNumber(v: string) {
    return v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  }
  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2
      ? digits.slice(0, 2) + "/" + digits.slice(2)
      : digits;
  }
  function formatPhoneInput(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 4) return digits;
    return digits.slice(0, 4) + " " + digits.slice(4);
  }

  const toggleProd = (name: string) => {
    const updated = data.selectedProds.includes(name)
      ? data.selectedProds.filter((p) => p !== name)
      : [...data.selectedProds, name];
    // Keep at least 1 product
    onUpdateData({ selectedProds: updated.length > 0 ? updated : [name] });
  };

  const getVerticalForModalProduct = (productName: string) => {
    return (
      Object.entries(VERTICALS).find(
        ([, vd]) => vd.products[productName],
      )?.[0] || "Grains"
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      onUpdateData({
        step: nextStep,
        furthestStep: Math.max(data.furthestStep || 1, nextStep),
      });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      onUpdateData({ step: currentStep - 1 });
    }
  };

  const handleFinish = () => {
    onComplete(data.selectedProds, {
      province: data.province || "Punjab",
      district: data.district || "Pakpattan",
      city: data.city || "Pakpattan Mandi",
    });
  };

  const handlePaymentConfirmClick = () => {
    if (data.paymentType === "wallet") {
      setMpin(["", "", "", ""]);
      setMpinError("");
      setMpinSuccess(false);
      setMpinModalOpen(true);
    } else {
      handleFinish();
    }
  };

  const handleMpinSubmit = () => {
    const pinStr = mpin.join("");
    if (pinStr.length < 4) {
      setMpinError("Please enter complete 4-digit MPIN");
      return;
    }
    setMpinError("");
    setIsProcessingMpin(true);
    setTimeout(() => {
      setIsProcessingMpin(false);
      setMpinSuccess(true);
      setTimeout(() => {
        setMpinModalOpen(false);
        handleFinish();
      }, 700);
    }, 800);
  };

  const selectedWp = walletProviders.find(
    (wp) => wp.id === (data.walletProvider || "jazzcash"),
  ) || walletProviders[0];

  return (
    <div
      className="zm-sheet-overlay"
      style={{
        zIndex: 350,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="zm-sheet-high"
        style={{
          background: "#F4FAF7",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "28px 28px 0 0",
          boxShadow: "0 -10px 40px rgba(6,77,64,0.22)",
          transition: "all 0.25s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 pt-4 pb-3 flex-shrink-0 bg-white"
          style={{ borderBottom: "1px solid #D5E2DD" }}
        >
          <div
            className="w-10 h-1 rounded-full mx-auto mb-3"
            style={{ background: "#C7D6D0" }}
          />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={currentStep > 1 ? handlePrev : onClose}
                className="tap-target w-8 h-8 rounded-full bg-[#E8EFEC] flex items-center justify-center text-[#183B34] font-bold text-sm hover:bg-[#D8E4E0] active:scale-95 transition"
                title={currentStep > 1 ? "Back" : "Close"}
              >
                ←
              </button>
              <div>
                <p
                  className="font-black text-base sm:text-lg"
                  style={{ color: "#143B33", fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                >
                  {lang === "ur"
                    ? "پروفائل مکمل کریں"
                    : "Complete Your Profile"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="tap-target text-sm font-semibold px-2.5 py-1 rounded-full text-[#52635F] hover:bg-[#E8EFEC]"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Step Subtitle: Step 1 of 3: Interested Products */}
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="text-[12px] font-bold text-[#183B34]"
              style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
            >
              {lang === "ur"
                ? `مرحلہ ${toUrduDigits(currentStep)} از ${toUrduDigits(totalSteps)}: ${activeStepKey === "products"
                  ? "دلچسپی کی مصنوعات"
                  : activeStepKey === "plan"
                    ? "سبسکرپشن پلان"
                    : "ادائیگی کی تفصیلات"
                }`
                : `Step ${currentStep} of ${totalSteps}: ${activeStepKey === "products"
                  ? "Interested Products"
                  : activeStepKey === "plan"
                    ? "Subscription Plan"
                    : "Card & Payment"
                }`}
            </span>
          </div>

          {/* Full-width 3-segment Progress Bar */}
          <div className="flex gap-2 w-full">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 999,
                  background: s <= currentStep ? "#087F63" : "#D5E2DD",
                  transition: "background 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* STEP 1: INTERESTED PRODUCTS / PACKAGES */}
          {activeStepKey === "products" && (() => {
            const availablePackages = getPackagesForMonth(MONTH_KEYS[demoMonthIdx]);
            const currentMonthNameEn = MONTH_NAMES_EN[demoMonthIdx];

            // Find expanded vertical package if one is currently expanded
            const expandedPkg = availablePackages.find(
              (p) => p.id === expandedPkgId && p.type === "vertical"
            );

            // Filter the rest for the 2-column grid
            const gridPackages = availablePackages.filter(
              (p) => !(expandedPkg && p.id === expandedPkg.id)
            );

            return (
              <div className="flex flex-col gap-3 pb-2">
                {/* Title & Subtitle + Subtle Demo Month Switcher on Top Right */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2
                      className="font-black text-[20px] sm:text-[22px] text-[#143B33] leading-tight"
                      style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                    >
                      {lang === "ur"
                        ? "اپنی مصنوعات منتخب کریں"
                        : "Select Your Products"}
                    </h2>
                    <p
                      className="text-[12px] font-medium text-[#52635F] mt-0.5"
                      style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                    >
                      {lang === "ur"
                        ? "اپنی سبسکرپشن مصنوعات منتخب کریں۔"
                        : "Choose your subscription products."}
                    </p>
                  </div>

                  {/* Subtle Demo Month Switcher */}
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                      className="tap-target flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#D5E2DD] text-[#52635F] hover:border-[#087F63] hover:text-[#087F63] transition-all shadow-2xs"
                      title="Change demonstration month"
                    >
                      <span className="text-[11px] font-bold">
                        Demo: <span className="text-[#087F63] font-black">{currentMonthNameEn}</span>
                      </span>
                      <span className="text-[10px] text-[#9CA3AF]">▾</span>
                    </button>

                    {/* Floating Dropdown Month Menu */}
                    {isMonthPickerOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40 bg-transparent"
                          onClick={() => setIsMonthPickerOpen(false)}
                        />
                        <div
                          className="absolute right-0 top-8 z-50 bg-white rounded-2xl p-2 shadow-2xl border border-[#E2E8F0] grid grid-cols-3 gap-1 w-[240px] animate-fadeIn"
                          style={{ boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}
                        >
                          {MONTH_NAMES_EN.map((mName, mIdx) => {
                            const isCur = demoMonthIdx === mIdx;
                            return (
                              <button
                                key={mName}
                                type="button"
                                onClick={() => {
                                  setDemoMonthIdx(mIdx);
                                  setIsMonthPickerOpen(false);
                                }}
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition text-center ${isCur
                                  ? "bg-[#087F63] text-white"
                                  : "text-[#374151] hover:bg-[#F3F4F6]"
                                  }`}
                              >
                                {mName.slice(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 1. EXPANDED VERTICAL CARD (FULL WIDTH) */}
                {expandedPkg && (() => {
                  const isSelected = data.selectedProds.includes(expandedPkg.name) || data.selectedProds.includes(expandedPkg.id);
                  return (
                    <div
                      key={expandedPkg.id}
                      className="rounded-2xl border border-[#D5E2DD] bg-white p-3 shadow-xs transition-all flex flex-col gap-2.5"
                    >
                      {/* Top Row: Icon + Title + Chevron Up + Radio */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <img
                            src={expandedPkg.icon}
                            alt={expandedPkg.name}
                            className="w-9 h-9 object-contain flex-shrink-0"
                          />
                          <span
                            className="font-black text-[15px] text-[#143B33] truncate"
                            style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                          >
                            {lang === "ur" ? expandedPkg.nameUr : expandedPkg.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          {/* Chevron Up */}
                          <button
                            type="button"
                            onClick={() => setExpandedPkgId(null)}
                            className="tap-target text-[#6B7280] hover:text-[#087F63] p-1"
                            title="Collapse"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="18 15 12 9 6 15" />
                            </svg>
                          </button>

                          {/* Radio circle */}
                          <button
                            type="button"
                            onClick={() => toggleProd(expandedPkg.name)}
                            className="tap-target focus:outline-none"
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                ? "border-[#087F63] bg-[#087F63] text-white"
                                : "border-[#9CA3AF] bg-white hover:border-[#087F63]"
                                }`}
                            >
                              {isSelected && <span className="text-[10px] font-black">✓</span>}
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Content Row: 3 Variety preview cards on left + View all link on right */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {expandedPkg.activeVarieties.slice(0, 3).map((v) => (
                            <div
                              key={v.name}
                              className="flex-1 bg-[#F8FAF9] border border-[#E5EBE8] rounded-xl p-1.5 flex flex-col items-center justify-center text-center gap-1 min-w-0"
                            >
                              <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center">
                                <img
                                  src={getVarietyIcon(expandedPkg.id, v.name)}
                                  alt={v.name}
                                  className="w-7 h-7 object-contain rounded-md"
                                />
                              </div>
                              <span
                                className="text-[10px] font-bold text-[#183B34] truncate w-full"
                                style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                              >
                                {lang === "ur" ? (v.nameUr || v.name) : v.name}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* View All button on the right */}
                        <button
                          type="button"
                          onClick={() => setAllVarietiesModalPkg(expandedPkg as any)}
                          className="tap-target flex items-center gap-1 text-[#087F63] font-bold text-[12px] px-2 py-3 rounded-xl hover:bg-[#E8F8F3] transition flex-shrink-0"
                          style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                        >
                          <span>{lang === "ur" ? "تمام دیکھیں" : "View all"}</span>
                          <span className="text-[14px] leading-none">›</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. 2-COLUMN GRID FOR ALL OTHER PACKAGES AND PRODUCTS */}
                <div className="grid grid-cols-2 gap-2.5">
                  {gridPackages.map((pkg) => {
                    const isSelected = data.selectedProds.includes(pkg.name) || data.selectedProds.includes(pkg.id);
                    const isVertical = pkg.type === "vertical";

                    return (
                      <div
                        key={pkg.id}
                        onClick={() => {
                          if (!isVertical) {
                            toggleProd(pkg.name);
                          }
                        }}
                        className={`rounded-2xl p-2.5 flex items-center justify-between gap-1.5 transition-all cursor-pointer ${isSelected
                          ? "border-2 border-[#087F63] bg-[#E8F8F3] shadow-xs"
                          : "border border-[#D5E2DD] bg-white hover:border-[#B5CEC5]"
                          }`}
                      >
                        {/* Icon + Title */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <img
                            src={pkg.icon}
                            alt={pkg.name}
                            className="w-8 h-8 object-contain flex-shrink-0"
                          />
                          <span
                            className={`text-[13px] font-bold truncate ${isSelected ? "text-[#087F63]" : "text-[#183B34]"
                              }`}
                            style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                          >
                            {lang === "ur" ? pkg.nameUr : pkg.name}
                          </span>
                        </div>

                        {/* Right side: Chevron for Verticals + Radio for all */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isVertical && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedPkgId(pkg.id);
                              }}
                              className="tap-target text-[#9CA3AF] hover:text-[#087F63] p-0.5"
                              title="Expand varieties"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProd(pkg.name);
                            }}
                            className="tap-target focus:outline-none"
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                ? "border-[#087F63] bg-[#087F63] text-white"
                                : "border-[#9CA3AF] bg-white hover:border-[#087F63]"
                                }`}
                            >
                              {isSelected && <span className="text-[10px] font-black">✓</span>}
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* STEP 2: SUBSCRIPTION PLAN */}
          {activeStepKey === "plan" && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#183B34" }}>
                  {lang === "ur"
                    ? "اپنا سبسکرپشن پلان منتخب کریں"
                    : "Choose Your ZM Plan"}
                </h2>
              </div>

              {/* Standard Duration Tabs */}
              <div
                style={{
                  display: "flex",
                  background: "rgba(15,138,95,0.07)",
                  borderRadius: 12,
                  padding: 4,
                  gap: 3,
                  marginBottom: 10,
                }}
              >
                {[
                  { label: "1 Mo", durIdx: 0, badge: "Standard" },
                  { label: "3 Mos", durIdx: 1, badge: "10% off" },
                  { label: "6 Mos", durIdx: 2, badge: "15% off" },
                  { label: "12 Mos", durIdx: 3, badge: "25% off" },
                ].map((item) => {
                  const active = !data.customMode && data.dur === item.durIdx;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`dur-tab${active ? " active" : ""}`}
                      onClick={() => {
                        onUpdateData({ customMode: false, dur: item.durIdx });
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 2px",
                        borderRadius: 10,
                        border: "none",
                        background: active ? "#087F63" : "transparent",
                        color: active ? "#fff" : "#183B34",
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <span>{item.label}</span>
                      <span
                        style={{
                          fontSize: 8.5,
                          opacity: active ? 0.95 : 0.65,
                          fontWeight: 800,
                        }}
                      >
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Customize Mode Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  onUpdateData({
                    customMode: !data.customMode,
                    customMonths: data.customMonths || 3,
                  });
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: data.customMode
                    ? "2px solid #087F63"
                    : "1.5px dashed #D5E2DD",
                  background: data.customMode ? "#E4F2EC" : "#fff",
                  color: data.customMode ? "#087F63" : "#52635F",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span>
                    {lang === "ur"
                      ? "اپنی مرضی کے مہینے منتخب کریں (1 تا 12)"
                      : "Customize Specific Months"}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: data.customMode ? "#087F63" : "#80918B",
                  }}
                >
                  {data.customMode ? "Hide Picker ▴" : "Show Picker ▾"}
                </span>
              </button>

              {/* Custom Duration Fluid Month Picker */}
              {data.customMode && (
                <div
                  style={{
                    border: "1.5px solid #087F63",
                    borderRadius: 16,
                    padding: "14px",
                    marginBottom: 12,
                    background: "#fff",
                    boxShadow: "0 2px 10px rgba(8,127,99,0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#183B34",
                      }}
                    >
                      {data.customMonths} Month
                      {data.customMonths > 1 ? "s" : ""} Plan
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#16A34A",
                        background: "rgba(22,163,74,0.12)",
                        borderRadius: 20,
                        padding: "2px 9px",
                      }}
                    >
                      {getMonthlyDiscount(data.customMonths) > 0
                        ? `${Math.round(getMonthlyDiscount(data.customMonths) * 100)}% Discount`
                        : "Regular Rate"}
                    </span>
                  </div>

                  {/* 12 Months Grid Chips */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 6,
                      marginBottom: 12,
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                      const sel = data.customMonths === m;
                      const disc = getMonthlyDiscount(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => onUpdateData({ customMonths: m })}
                          style={{
                            padding: "6px 2px",
                            borderRadius: 8,
                            border: sel
                              ? "2px solid #087F63"
                              : "1.5px solid #D5E2DD",
                            background: sel ? "#087F63" : "#F4FAF7",
                            color: sel ? "#fff" : "#183B34",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <span style={{ fontSize: 11.5, fontWeight: 800 }}>
                            {m} mo
                          </span>
                          <span
                            style={{
                              fontSize: 8.5,
                              fontWeight: 700,
                              color: sel
                                ? "#D1FAE5"
                                : disc > 0
                                  ? "#16A34A"
                                  : "#80918B",
                            }}
                          >
                            {disc > 0 ? `-${disc * 100}%` : "0%"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product Pricing Breakdown Card */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 16,
                  border: "1.4px solid #D5E2DD",
                  marginBottom: 12,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "8px 14px 6px",
                    borderBottom: "1px solid #D5E2DD",
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#B9822E",
                    fontWeight: 700,
                  }}
                >
                  Selected products ({data.selectedProds.length} items)
                </div>
                <div style={{ maxHeight: 110, overflowY: "auto" }}>
                  {data.selectedProds.map((pName) => {
                    const iconSrc = getSeasonPackageIconSrc(pName);
                    const price = getSeasonPackageBasePrice(pName);
                    return (
                      <div
                        key={pName}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 14px",
                          borderBottom: "1px solid rgba(15,138,95,0.06)",
                          fontSize: 12,
                          color: "#52635F",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                          }}
                        >
                          <img
                            src={iconSrc}
                            alt=""
                            style={{
                              width: 20,
                              height: 20,
                              objectFit: "contain",
                            }}
                          />
                          {tc(pName)}
                        </span>
                        <span style={{ fontWeight: 600, color: "#183B34" }}>
                          PKR {price.toLocaleString()}/mo
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div
                  style={{
                    borderTop: "1.5px solid rgba(15,138,95,0.1)",
                    background: "#E4F2EC",
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "#52635F",
                      marginBottom: 4,
                    }}
                  >
                    <span>
                      Total/mo × {months} month{months > 1 ? "s" : ""}
                    </span>
                    <span>PKR {regularTotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "#16A34A",
                        fontWeight: 700,
                        marginBottom: 6,
                      }}
                    >
                      <span>Discount ({discount * 100}% off)</span>
                      <span>− PKR {discountAmt.toLocaleString()}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: 6,
                      borderTop: "1px solid rgba(15,138,95,0.1)",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13.5,
                        color: "#183B34",
                      }}
                    >
                      Your Total
                    </span>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 900,
                          color: "#087F63",
                        }}
                      >
                        PKR {finalTotal.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 10.5, color: "#52635F" }}>
                        PKR {Math.round(finalTotal / months).toLocaleString()}
                        /mo
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT SCREEN */}
          {activeStepKey === "payment" && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#183B34" }}>
                  {lang === "ur"
                    ? "ادائیگی مکمل کریں"
                    : "Complete Your Payment"}
                </h2>

              </div>

              {/* 3 Payment Type Selector Buttons */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {[
                  {
                    id: "wallet",
                    iconSrc: "/src/icons/mobilewallet.png",
                    label: "Mobile Wallet",
                    sub: "JazzCash, EasyPaisa",
                  },
                  {
                    id: "card",
                    iconSrc: "/src/icons/cardpayment.png",
                    label: "Card Payment",
                    sub: "Debit / Credit",
                  },
                  {
                    id: "direct",
                    iconSrc: "/src/icons/directtransfer.png",
                    label: "Direct Transfer",
                    sub: "Bank IBFT",
                  },
                ].map((opt) => {
                  const active = (data.paymentType || "wallet") === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        onUpdateData({ paymentType: opt.id as any })
                      }
                      style={{
                        padding: "10px 6px",
                        borderRadius: 14,
                        border: active
                          ? "2px solid #087F63"
                          : "1.5px solid #D5E2DD",
                        background: active ? "#E4F2EC" : "#fff",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: 24,
                          marginBottom: 4,
                        }}
                      >
                        <img
                          src={opt.iconSrc}
                          alt=""
                          style={{
                            width: 22,
                            height: 22,
                            objectFit: "contain",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: active ? "#087F63" : "#183B34",
                          lineHeight: 1.2,
                        }}
                      >
                        {opt.label}
                      </div>
                      <div
                        style={{
                          fontSize: 8.5,
                          color: "#52635F",
                          marginTop: 2,
                        }}
                      >
                        {opt.sub}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Option 1: Mobile Wallet Form */}
              {(data.paymentType || "wallet") === "wallet" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#52635F",
                        textTransform: "uppercase",
                        marginBottom: 6,
                      }}
                    >
                      Select Wallet Provider
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      {walletProviders.map((wp) => {
                        const sel =
                          (data.walletProvider || "jazzcash") === wp.id;
                        return (
                          <button
                            key={wp.id}
                            type="button"
                            onClick={() =>
                              onUpdateData({
                                walletProvider: wp.id as any,
                              })
                            }
                            style={{
                              padding: "8px 4px",
                              borderRadius: 10,
                              border: sel
                                ? `2px solid ${wp.color}`
                                : "1.5px solid #D5E2DD",
                              background: sel ? `${wp.color}15` : "#FFFFFF",
                              cursor: "pointer",
                              textAlign: "center",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <img
                              src={wp.iconSrc}
                              alt=""
                              style={{
                                width: 20,
                                height: 20,
                                objectFit: "contain",
                              }}
                            />
                            <div
                              style={{
                                fontSize: 10.5,
                                fontWeight: 800,
                                color: sel ? wp.color : "#183B34",
                              }}
                            >
                              {wp.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#52635F",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Mobile Wallet Number *
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="0300 1234567"
                      value={data.walletNumber || "0300 1234567"}
                      onChange={(e) =>
                        onUpdateData({
                          walletNumber: formatPhoneInput(e.target.value),
                        })
                      }
                      style={{
                        width: "100%",
                        height: 42,
                        padding: "0 12px",
                        border: "1.5px solid #D5E2DD",
                        borderRadius: 10,
                        fontSize: 13.5,
                        color: "#183B34",
                        background: "#fff",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#52635F",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Muhammad Arif / 123456"
                      value={data.walletCnic || ""}
                      onChange={(e) =>
                        onUpdateData({ walletCnic: e.target.value })
                      }
                      style={{
                        width: "100%",
                        height: 42,
                        padding: "0 12px",
                        border: "1.5px solid #D5E2DD",
                        borderRadius: 10,
                        fontSize: 13.5,
                        color: "#183B34",
                        background: "#fff",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Option 2: Card Form */}
              {data.paymentType === "card" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 9 }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#52635F",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Card Number
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      value={data.cardNumber}
                      onChange={(e) =>
                        onUpdateData({
                          cardNumber: formatCardNumber(e.target.value),
                        })
                      }
                      style={{
                        width: "100%",
                        height: 42,
                        padding: "0 12px",
                        border: "1.5px solid #D5E2DD",
                        borderRadius: 10,
                        fontSize: 13.5,
                        color: "#183B34",
                        background: "#fff",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#52635F",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        Expiry Date
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="MM/YY"
                        value={data.cardExpiry}
                        onChange={(e) =>
                          onUpdateData({
                            cardExpiry: formatExpiry(e.target.value),
                          })
                        }
                        style={{
                          width: "100%",
                          height: 42,
                          padding: "0 12px",
                          border: "1.5px solid #D5E2DD",
                          borderRadius: 10,
                          fontSize: 13.5,
                          color: "#183B34",
                          background: "#fff",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#52635F",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        Security Code
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="CVV"
                        maxLength={4}
                        value={data.cardCvv}
                        onChange={(e) =>
                          onUpdateData({
                            cardCvv: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 4),
                          })
                        }
                        style={{
                          width: "100%",
                          height: 42,
                          padding: "0 12px",
                          border: "1.5px solid #D5E2DD",
                          borderRadius: 10,
                          fontSize: 13.5,
                          color: "#183B34",
                          background: "#fff",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#52635F",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="Name on card"
                      value={data.cardHolder}
                      onChange={(e) =>
                        onUpdateData({ cardHolder: e.target.value })
                      }
                      style={{
                        width: "100%",
                        height: 42,
                        padding: "0 12px",
                        border: "1.5px solid #D5E2DD",
                        borderRadius: 10,
                        fontSize: 13.5,
                        color: "#183B34",
                        background: "#fff",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 10px",
                      background: "#E4F2EC",
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ fontSize: 12 }}>🔒</span>
                    <span style={{ fontSize: 11, color: "#52635F" }}>
                      Your card details are encrypted and never stored.
                    </span>
                  </div>
                </div>
              )}

              {/* Option 3: Direct Transfer */}
              {data.paymentType === "direct" && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#52635F",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Choose Method
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 7,
                      marginBottom: 10,
                    }}
                  >
                    {directMethods.map((m) => (
                      <div
                        key={m.id}
                        onClick={() =>
                          onUpdateData({ directMethod: m.id as any })
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          borderRadius: 12,
                          border:
                            data.directMethod === m.id
                              ? "2px solid #087F63"
                              : "1.5px solid #D5E2DD",
                          background:
                            data.directMethod === m.id ? "#E4F2EC" : "#fff",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            background: `${m.color}18`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={m.iconSrc}
                            alt={m.label}
                            style={{
                              width: 24,
                              height: 24,
                              objectFit: "contain",
                            }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: "#183B34",
                            }}
                          >
                            {m.label}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#52635F" }}>
                            {m.sub}
                          </div>
                        </div>
                        {data.directMethod === m.id && (
                          <span
                            style={{
                              color: "#087F63",
                              fontWeight: 900,
                              fontSize: 13,
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Direct Details Box */}
                  <div
                    style={{
                      background: "#fff",
                      border: "1.5px solid #D5E2DD",
                      borderRadius: 12,
                      padding: "10px 12px",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        color: "#B9822E",
                        fontWeight: 700,
                        marginBottom: 6,
                      }}
                    >
                      Payment Details
                    </div>
                    {directDetails[data.directMethod]?.rows.map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11.5,
                          padding: "3px 0",
                          borderBottom: "1px solid #F1F7F4",
                        }}
                      >
                        <span style={{ color: "#52635F" }}>{k}</span>
                        <strong
                          style={{
                            color: "#183B34",
                            fontFamily:
                              k === "IBAN" || k === "Account No."
                                ? "monospace"
                                : "inherit",
                          }}
                        >
                          {v}
                        </strong>
                      </div>
                    ))}
                  </div>

                  {/* Upload Screenshot */}
                  <div
                    onClick={() =>
                      onUpdateData({ hasReceipt: !data.hasReceipt })
                    }
                    style={{
                      padding: "10px",
                      borderRadius: 12,
                      border: "1.5px dashed #087F63",
                      background: data.hasReceipt ? "#E4F2EC" : "#fff",
                      textAlign: "center",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#087F63",
                    }}
                  >
                    <span>{data.hasReceipt ? "✅" : "📎"}</span>
                    <span>
                      {data.hasReceipt
                        ? "Screenshot attached (Tap to change)"
                        : "Tap to upload payment screenshot"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="px-5 pt-3 pb-5 flex-shrink-0 bg-white"
          style={{ borderTop: "1px solid #D5E2DD" }}
        >
          {activeStepKey === "products" ? (
            <div className="flex items-center justify-between gap-3">
              <span
                className="font-black text-[13.5px] text-[#143B33]"
                style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
              >
                {lang === "ur"
                  ? `${toUrduDigits(data.selectedProds.length)} مصنوعات منتخب`
                  : `${data.selectedProds.length} product${data.selectedProds.length === 1 ? "" : "s"} selected`}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={data.selectedProds.length === 0}
                className={`tap-target px-5 py-3 rounded-2xl font-black text-sm text-white flex items-center gap-1.5 transition-all ${data.selectedProds.length === 0
                  ? "bg-[#9CA3AF] opacity-60 cursor-not-allowed"
                  : "bg-[#087F63] hover:bg-[#066A52] active:scale-95 shadow-md shadow-[#087F63]/25"
                  }`}
                style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
              >
                <span>{lang === "ur" ? "پلان منتخب کریں" : "Choose Plan"}</span>
                <span>›</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="tap-target py-3 px-4 rounded-2xl font-bold text-xs"
                  style={{ background: "#E8EFEC", color: "#183B34" }}
                >
                  ← {lang === "ur" ? "پیچھے" : "Back"}
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="tap-target flex-1 py-3 rounded-2xl font-extrabold text-sm text-white"
                  style={{
                    background: "#087F63",
                    boxShadow: "0 4px 14px rgba(8,127,99,0.3)",
                  }}
                >
                  {lang === "ur" ? "ادائیگی کی طرف جائیں →" : "Continue to Payment →"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePaymentConfirmClick}
                  className="tap-target flex-1 py-3 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #087F63, #064D40)",
                    boxShadow: "0 4px 16px rgba(8,127,99,0.4)",
                  }}
                >
                  <span>
                    {lang === "ur"
                      ? `ادائیگی کی تصدیق کریں — PKR ${finalTotal.toLocaleString()}`
                      : `Confirm Payment — PKR ${finalTotal.toLocaleString()}`}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* All Varieties Modal Sheet */}
      {allVarietiesModalPkg && (
        <div
          className="fixed inset-0 z-[400] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
          onClick={() => setAllVarietiesModalPkg(null)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl max-h-[80vh] w-full max-w-md flex flex-col overflow-hidden shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAF9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E2EBE6] p-1 flex items-center justify-center shadow-xs">
                  <img src={allVarietiesModalPkg.icon} alt="" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h3
                    className="font-black text-base text-[#143B33]"
                    style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                  >
                    {lang === "ur" ? allVarietiesModalPkg.nameUr : allVarietiesModalPkg.name}
                  </h3>
                  <p
                    className="text-xs text-[#52635F]"
                    style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                  >
                    {lang === "ur"
                      ? `${MONTH_NAMES_UR[demoMonthIdx]} میں تمام ${toUrduDigits(allVarietiesModalPkg.varietyCount)} اقسام`
                      : `All ${allVarietiesModalPkg.varietyCount} varieties in ${MONTH_NAMES_EN[demoMonthIdx]}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAllVarietiesModalPkg(null)}
                className="tap-target w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center text-sm font-bold text-[#374151]"
              >
                ✕
              </button>
            </div>

            {/* Varieties List */}
            <div
              className="p-4 overflow-y-auto flex-1 flex flex-col gap-2"
              style={{ scrollbarWidth: "thin" }}
            >
              {allVarietiesModalPkg.activeVarieties.map((v: any) => (
                <div
                  key={v.name}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#F8FAF9] border border-[#E5EBE8] hover:bg-white hover:border-[#BDE7D9] transition-all"
                >
                  <img
                    src={getVarietyIcon(allVarietiesModalPkg.id, v.name)}
                    alt={v.name}
                    className="w-8 h-8 object-contain rounded-xl flex-shrink-0"
                  />
                  <span
                    className="font-bold text-[14px] text-[#183B34] truncate"
                    style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
                  >
                    {lang === "ur" ? (v.nameUr || v.name) : v.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#E5E7EB] bg-[#F8FAF9] flex justify-end">
              <button
                type="button"
                onClick={() => setAllVarietiesModalPkg(null)}
                className="px-5 py-2 rounded-xl bg-[#087F63] text-white font-bold text-sm shadow-sm hover:bg-[#066A52]"
                style={{ fontFamily: lang === "ur" ? URDU_FONT : "inherit" }}
              >
                {lang === "ur" ? "ٹھیک ہے" : "Done"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MPIN Entry Modal for Mobile Wallet */}
      {mpinModalOpen && (
        <div
          className="zm-sheet-overlay"
          style={{
            zIndex: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(6, 45, 36, 0.75)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => {
            if (!isProcessingMpin) setMpinModalOpen(false);
          }}
        >
          <div
            className="screen-enter"
            style={{
              width: "100%",
              maxWidth: 360,
              background: "#FFFFFF",
              borderRadius: 24,
              padding: "24px 20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              textAlign: "center",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Wallet Icon Badge */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: `${selectedWp.color}15`,
                border: `2px solid ${selectedWp.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <img
                src={selectedWp.iconSrc}
                alt=""
                style={{ width: 34, height: 34, objectFit: "contain" }}
              />
            </div>

            <h3
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#183B34",
                marginBottom: 4,
              }}
            >
              {lang === "ur"
                ? `${selectedWp.label} کا MPIN درج کریں`
                : `Enter ${selectedWp.label} MPIN`}
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "#52635F",
                marginBottom: 16,
                lineHeight: 1.4,
              }}
            >
              Authorize payment of{" "}
              <strong style={{ color: "#087F63" }}>
                PKR {finalTotal.toLocaleString()}
              </strong>{" "}
              for Zarai Mandi subscription.
            </p>

            {/* 4 Digit PIN Inputs */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  id={`mpin-box-${idx}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={mpin[idx]}
                  autoFocus={idx === 0}
                  disabled={isProcessingMpin || mpinSuccess}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const updated = [...mpin];
                    updated[idx] = val ? val.slice(-1) : "";
                    setMpin(updated);
                    setMpinError("");
                    if (val && idx < 3) {
                      const nextInput = document.getElementById(
                        `mpin-box-${idx + 1}`,
                      );
                      nextInput?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !mpin[idx] && idx > 0) {
                      const prevInput = document.getElementById(
                        `mpin-box-${idx - 1}`,
                      );
                      prevInput?.focus();
                    }
                  }}
                  style={{
                    width: 48,
                    height: 52,
                    textAlign: "center",
                    fontSize: 24,
                    fontWeight: 900,
                    color: "#183B34",
                    border: mpin[idx]
                      ? "2px solid #087F63"
                      : "1.5px solid #D5E2DD",
                    borderRadius: 12,
                    background: mpin[idx] ? "#E4F2EC" : "#FAFCFB",
                    outline: "none",
                    boxShadow: mpin[idx]
                      ? "0 2px 8px rgba(8,127,99,0.15)"
                      : "none",
                  }}
                />
              ))}
            </div>

            {mpinError && (
              <div
                style={{
                  fontSize: 11.5,
                  color: "#D95A51",
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                {mpinError}
              </div>
            )}

            {mpinSuccess ? (
              <div
                style={{
                  background: "#E8F5E9",
                  border: "1.5px solid #81C784",
                  borderRadius: 14,
                  padding: "12px",
                  color: "#1B5E20",
                  fontWeight: 800,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <span>✅</span>
                <span>Payment Authorized Successfully!</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleMpinSubmit}
                  disabled={isProcessingMpin}
                  className="tap-target w-full py-3 rounded-2xl font-extrabold text-sm text-white"
                  style={{
                    background: isProcessingMpin
                      ? "#80918B"
                      : "linear-gradient(135deg, #087F63, #064D40)",
                    boxShadow: "0 4px 14px rgba(8,127,99,0.3)",
                    cursor: isProcessingMpin ? "not-allowed" : "pointer",
                  }}
                >
                  {isProcessingMpin
                    ? "Authorizing Payment..."
                    : `Authorize PKR ${finalTotal.toLocaleString()}`}
                </button>
                <button
                  type="button"
                  onClick={() => setMpinModalOpen(false)}
                  disabled={isProcessingMpin}
                  className="tap-target py-2 text-xs font-bold"
                  style={{ color: "#80918B", background: "none", border: "none" }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
