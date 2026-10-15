import { useRef } from "react";

import farmHeroBg from "../../../../assets/farm_hero_bg.png";
import { URDU_FONT, useLang } from "../../../shared/i18n/LangProvider";
import type { AppProps } from "../../../shared/types";
import { speakText } from "../../../shared/voice";
import { SearchProfilePanel, type SearchEntry } from "./SearchProfilePanel";

/**
 * Home header shared by both Home screens: the farm photo with language and
 * voice switches, notification bell, profile avatar (double tap switches to
 * the rep account), the user's name with an edit button and their number,
 * and the search + "Complete profile" bar on its bottom edge.
 */
export function HomeHero({
  height,
  profileName,
  profilePhone,
  initialUserData,
  profileCompleted,
  currentStepNum,
  totalSteps,
  activeRole,
  hasRepAccount,
  onSwitchRole,
  voiceGuideActive,
  toast,
  onToast,
  onOpenAccount,
  onEditProfile,
  onOpenCompleteProfile,
  searchEntries,
  onSearchPick,
  onLockedPick,
}: {
  /** CSS height of the photo header (the alternative Home is a little shorter). */
  height: string;
  profileName: string;
  profilePhone: string;
  initialUserData?: AppProps["initialUserData"];
  profileCompleted: boolean;
  currentStepNum: number;
  totalSteps: number;
  activeRole?: "customer" | "representative";
  hasRepAccount?: boolean;
  onSwitchRole?: (role: "customer" | "representative") => void;
  voiceGuideActive?: boolean;
  /** Small confirmation shown under the header ("Notifications", role switch, ...). */
  toast: string | null;
  onToast: (msg: string | null) => void;
  /** Avatar tap: the account menu. */
  onOpenAccount: () => void;
  /** Pencil beside the name: edit name / number / city. */
  onEditProfile: () => void;
  onOpenCompleteProfile: () => void;
  searchEntries: SearchEntry[];
  onSearchPick: (entry: SearchEntry, final: boolean) => void;
  onLockedPick: (entry: SearchEntry) => void;
}) {
  const { lang, setLang, t, tn, voiceEnabled: homeVoiceEnabled, setVoiceEnabled: homeSetVoiceEnabled } = useLang();
  const lastProfileTapRef = useRef<number>(0);

  return (
    <>
  {/* =====================================================
      HERO BANNER (Refined aesthetic with sunset farm image)
      ===================================================== */}

  <div
    className="relative flex-shrink-0 w-full"
    style={{
      margin: 0,
      height,
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
              onToast(
                lang === "ur"
                  ? "تمام منڈی الرٹس اور نوٹیفکیشنز فعال ہیں"
                  : "Market alerts & notifications active",
              );
              setTimeout(() => onToast(null), 2500);
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
                onToast(
                  targetRole === "representative"
                    ? lang === "ur"
                      ? "نمائندہ ڈیش بورڈ پر تبدیل ہو گئے"
                      : "Switched to Rep Dashboard"
                    : lang === "ur"
                      ? "کسٹمر ڈیش بورڈ پر تبدیل ہو گئے"
                      : "Switched to Customer App",
                );
                setTimeout(() => onToast(null), 2500);
              } else {
                onOpenAccount();
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
      {toast && (
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
          ✓ {toast}
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
              {tn(profileName || "Muhammad Arif")}
            </h1>

            {/* Edit Button right in header */}
            <button
              type="button"
              onClick={() => {
                if (homeVoiceEnabled) {
                  speakText(lang === "ur" ? "پروفائل ترمیم" : "Edit Profile");
                }
                onEditProfile();
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
              // A phone number reads left-to-right even in Urdu ("0300 1234567").
              dir="ltr"
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

    {/* Search + Complete Your Profile, sitting on the hero's bottom edge */}
    <SearchProfilePanel
      entries={searchEntries}
      onPick={onSearchPick}
      onLockedPick={onLockedPick}
      showProfile={!profileCompleted}
      step={currentStepNum}
      totalSteps={totalSteps}
      onOpenProfile={onOpenCompleteProfile}
    />
  </div>
    </>
  );
}
