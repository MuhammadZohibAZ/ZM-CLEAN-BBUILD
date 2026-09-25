import { useState, useRef } from "react";
import farmHeroBg from "../../assets/farm_hero_bg.png";

import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { type AppProps, type Screen } from "../shared/types";

{/* ─── REPRESENTATIVE DASHBOARD SCREEN ─────────────────────────────────── */ }
export function RepDashboardScreen({
  push,
  initialUserData,
  onSwitchRole,
  hasRepAccount,
}: {
  push: (s: Screen) => void;
  initialUserData?: AppProps["initialUserData"];
  onSwitchRole?: (role: "customer" | "representative") => void;
  hasRepAccount?: boolean;
}) {
  const { lang, setLang, t, voiceEnabled, setVoiceEnabled } = useLang();
  const [showSwitchToast, setShowSwitchToast] = useState<string | null>(null);
  const lastProfileTapRef = useRef<number>(0);
  const [submittedModalOpen, setSubmittedModalOpen] = useState(false);

  const repName = initialUserData?.name || (lang === "ur" ? "محمد عارف" : "Muhammad Arif");
  const repCity = initialUserData?.city || "Pakpattan Mandi";
  const repProvince = initialUserData?.province || "Punjab";

  return (
    <div className="flex-1 overflow-y-auto bg-[#F1F7F4] flex flex-col">
      {/* ─── Identical Top Header ─── */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{
          background: "linear-gradient(170deg, #04362C 0%, #064D40 50%, #087F63 100%)",
          padding: "16px 16px 36px",
          minHeight: 180,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          boxShadow: "0 8px 30px rgba(4,54,44,0.3)",
        }}
      >
        {/* Background farm hero */}
        <img
          src={farmHeroBg}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.18,
            pointerEvents: "none",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between" style={{ minHeight: 140 }}>
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            {/* Lang & Voice buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLang(lang === "ur" ? "en" : "ur")}
                className="tap-target px-2.5 py-1 rounded-full text-white font-extrabold text-xs"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.35)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {lang === "ur" ? "English" : "اردو"}
              </button>
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="tap-target flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white font-extrabold text-xs"
                style={{
                  background: voiceEnabled ? "rgba(47, 174, 104, 0.45)" : "rgba(255,255,255,0.18)",
                  border: voiceEnabled ? "1.2px solid #2FAE68" : "1px solid rgba(255,255,255,0.35)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
                <span>{voiceEnabled ? t("Voice On") : t("Voice Off")}</span>
              </button>
            </div>

            {/* Profile Avatar with double tap and REP badge */}
            <button
              onClick={() => {
                const now = Date.now();
                if (now - lastProfileTapRef.current < 350) {
                  onSwitchRole?.("customer");
                  setShowSwitchToast(lang === "ur" ? "کسٹمر ڈیش بورڈ پر تبدیل ہو گئے" : "Switched to Customer App");
                  setTimeout(() => setShowSwitchToast(null), 2500);
                } else {
                  onSwitchRole?.("customer");
                }
                lastProfileTapRef.current = now;
              }}
              className="tap-target relative flex items-center justify-center rounded-full"
              style={{
                width: 38,
                height: 38,
                background: "rgba(15, 138, 95, 0.45)",
                border: "1.5px solid #2FAE68",
                backdropFilter: "blur(8px)",
              }}
              title="Tap or double tap to switch to Customer face"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <span
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  background: "#2FAE68",
                  color: "#fff",
                  fontSize: 8,
                  fontWeight: 900,
                  padding: "1px 3px",
                  borderRadius: 6,
                  border: "1px solid #fff",
                  lineHeight: 1,
                }}
              >
                REP
              </span>
            </button>
          </div>

          {/* Switch Toast */}
          {showSwitchToast && (
            <div
              style={{
                position: "absolute",
                top: 54,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(6, 45, 36, 0.95)",
                color: "#B4E6D2",
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                zIndex: 999,
                border: "1px solid #2FAE68",
                whiteSpace: "nowrap",
              }}
            >
              ✓ {showSwitchToast}
            </div>
          )}

          {/* Rep Greeting */}
          <div className="mt-auto" style={{ paddingBottom: 6 }}>
            <h1
              style={{
                color: "#fff",
                fontSize: 20,
                lineHeight: 1.2,
                fontWeight: 800,
                fontFamily: lang === "ur" ? URDU_FONT : "'Poppins', sans-serif",
                textShadow: "0 2px 6px rgba(0,0,0,0.3)",
              }}
            >
              {repName}
            </h1>
            <p
              style={{
                color: "#B4E6D2",
                fontSize: 12,
                fontWeight: 600,
                marginTop: 2,
                textShadow: "0 1px 3px rgba(0,0,0,0.4)",
              }}
            >
              📍 {repCity} ({repProvince}) · {lang === "ur" ? "باضابطہ منڈی نمائندہ" : "Verified Mandi Representative"}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Representative Workspace Body ─── */}
      <div className="p-4 space-y-4 flex-1">
        {/* Switch to Customer Face Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#D5E2DD] shadow-sm">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-[#E4F2EC] text-[#087F63] px-2 py-0.5 rounded-md">
              {lang === "ur" ? "نمائندہ موڈ فعال" : "Representative Mode Active"}
            </span>
            <p className="text-xs font-bold text-[#183B34] mt-1">
              {lang === "ur" ? "کسٹمر ایپ پر واپس جائیں" : "Switch to Customer Face"}
            </p>
          </div>
          <button
            onClick={() => onSwitchRole?.("customer")}
            className="px-3.5 py-2 rounded-xl bg-[#087F63] text-white font-extrabold text-xs shadow hover:bg-[#064D40] transition"
          >
            {lang === "ur" ? "کسٹمر ایپ ➔" : "Customer App ➔"}
          </button>
        </div>

        {/* Mandi KPI Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-white border border-[#D5E2DD] shadow-sm space-y-1">
            <span className="text-[10.5px] font-bold text-[#52635F]">
              {lang === "ur" ? "منسلک ممبران" : "Active Members"}
            </span>
            <h3 className="text-xl font-black text-[#183B34]">18</h3>
            <span className="text-[10px] text-[#087F63] font-bold bg-[#E8F5EF] px-1.5 py-0.5 rounded">
              {lang === "ur" ? "کسان اور بیوپاری" : "Farmers & Traders"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#D5E2DD] shadow-sm space-y-1">
            <span className="text-[10.5px] font-bold text-[#52635F]">
              {lang === "ur" ? "ماہانہ کمیشن" : "Monthly Commission"}
            </span>
            <h3 className="text-xl font-black text-[#087F63]">PKR 14,200</h3>
            <span className="text-[10px] text-[#52635F] font-semibold">
              {lang === "ur" ? "۱۵ فیصد ریونیو شیئر" : "15% Revenue Share"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#D5E2DD] shadow-sm space-y-1">
            <span className="text-[10.5px] font-bold text-[#52635F]">
              {lang === "ur" ? "بنیادی منڈی" : "Assigned Mandi"}
            </span>
            <h3 className="text-sm font-black text-[#183B34] truncate">{repCity}</h3>
            <span className="text-[10px] text-[#52635F] font-semibold">{repProvince}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#D5E2DD] shadow-sm space-y-1">
            <span className="text-[10.5px] font-bold text-[#52635F]">
              {lang === "ur" ? "ریٹس رپورٹنگ" : "Rates Reporting"}
            </span>
            <h3 className="text-sm font-black text-[#2FAE68]">
              {lang === "ur" ? "آج فعال ہے" : "Active Today"}
            </h3>
            <span className="text-[10px] text-[#52635F] font-semibold">14 Sep 2026</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold text-[#183B34] uppercase tracking-wider">
            {lang === "ur" ? "نمائندہ فوری اقدامات" : "Representative Actions"}
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setSubmittedModalOpen(true)}
              className="p-3 rounded-xl bg-white border border-[#D5E2DD] text-left hover:border-[#087F63] transition shadow-sm space-y-1"
            >
              <div className="w-8 h-8 rounded-lg bg-[#E8F5EF] flex items-center justify-center text-[#087F63]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <p className="text-xs font-bold text-[#183B34]">
                {lang === "ur" ? "منڈی ریٹ جمع کروائیں" : "Submit Mandi Rate"}
              </p>
              <p className="text-[10px] text-[#52635F]">
                {lang === "ur" ? "آج کی آمد اور ریٹ" : "Daily arrivals & rate"}
              </p>
            </button>

            <button
              onClick={() => setSubmittedModalOpen(true)}
              className="p-3 rounded-xl bg-white border border-[#D5E2DD] text-left hover:border-[#087F63] transition shadow-sm space-y-1"
            >
              <div className="w-8 h-8 rounded-lg bg-[#E8F5EF] flex items-center justify-center text-[#087F63]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className="text-xs font-bold text-[#183B34]">
                {lang === "ur" ? "نیا ممبر شامل کریں" : "Onboard Member"}
              </p>
              <p className="text-[10px] text-[#52635F]">
                {lang === "ur" ? "۱۵ فیصد کمیشن کمائیں" : "Earn 15% commission"}
              </p>
            </button>
          </div>
        </div>

        {/* Recent Rate Submissions */}
        <div className="p-4 rounded-2xl bg-white border border-[#D5E2DD] shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-extrabold text-[#183B34] uppercase tracking-wider">
              {lang === "ur" ? "حالیہ تصدیق شدہ ریٹس" : "Recent Rate Submissions"}
            </h4>
            <span className="text-[10px] text-[#087F63] font-extrabold">14 Sep 2026</span>
          </div>
          <div className="space-y-2">
            {[
              { crop: "Wheat (گندم)", mandi: "Pakpattan Mandi", rate: "PKR 4,100", arrival: "1,200 Bags" },
              { crop: "Rice (باسمتی)", mandi: "Pakpattan Mandi", rate: "PKR 9,500", arrival: "450 Bags" },
              { crop: "Maize (مکئی)", mandi: "Pakpattan Mandi", rate: "PKR 2,850", arrival: "800 Bags" },
            ].map((sub, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-[#F1F7F4] last:border-b-0 text-xs">
                <div>
                  <p className="font-bold text-[#183B34]">{sub.crop}</p>
                  <p className="text-[10.5px] text-[#52635F]">{sub.mandi} · {sub.arrival}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-[#087F63]">{sub.rate}</p>
                  <span className="text-[9.5px] font-bold text-[#2FAE68] bg-[#E8F5EF] px-1.5 py-0.5 rounded">
                    Verified ✓
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {submittedModalOpen && (
        <div className="zm-sheet-overlay" style={{ zIndex: 400 }} onClick={() => setSubmittedModalOpen(false)}>
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl m-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-[#E4F2EC] text-[#087F63] flex items-center justify-center text-2xl mx-auto mb-3">
              ✓
            </div>
            <h3 className="text-base font-black text-[#183B34] mb-1">
              {lang === "ur" ? "نمائندہ پورٹل فعال ہے" : "Representative Workspace Active"}
            </h3>
            <p className="text-xs text-[#52635F] mb-4 leading-relaxed">
              {lang === "ur"
                ? "آپ کا نمائندہ اکاؤنٹ کامیابی سے کام کر رہا ہے۔ آپ کسی بھی وقت ڈبل ٹیپ کر کے کسٹمر فیس پر سوئچ کر سکتے ہیں۔"
                : "Your mandi representative workspace is fully synchronized. Double tap your profile icon anytime to toggle to Customer face."}
            </p>
            <button
              onClick={() => setSubmittedModalOpen(false)}
              className="w-full py-3 rounded-xl bg-[#087F63] text-white font-bold text-xs"
            >
              {lang === "ur" ? "ٹھیک ہے" : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
