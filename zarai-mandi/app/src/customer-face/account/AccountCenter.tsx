import React, { useEffect, useState } from "react";

import { ProductIcon } from "../components/ProductIcon";
import { PRODUCT_DIVISIONS, SUBSCRIBED_PRODUCTS } from "../shared/data/catalog";
import { LOCATIONS } from "../shared/data/mandis";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { speakText } from "../shared/voice";

// ─── ACCOUNT CENTER ───────────────────────────────────────────────────────────
// Everything behind the profile button on the home screen: the account menu
// and each sheet it opens (edit profile, subscriptions, voice & language,
// representative, contact us — incl. historical data requests — log out). HomeScreen only holds
// which view is open and the saved profile; all form state lives here.

// Contact details — edit here to change them everywhere in this section.
export const ZM_CONTACT = {
  whatsappIntl: "923048107777",
  whatsappDisplay: "0304-8107777",
  helplineTel: "080092724",
  helplineDisplay: "0800-ZARAI (92724)",
  email: "support@zaraimandi.com",
};

const waLink = (text: string) =>
  `https://wa.me/${ZM_CONTACT.whatsappIntl}?text=${encodeURIComponent(text)}`;

// Palette shared with the rest of the customer app (see shared/theme.ts).
const C = {
  deep: "#064D40",
  primary: "#087F63",
  bright: "#2FAE68",
  mint: "#E8F5EF",
  mintBorder: "#A0CEBC",
  surface: "#F4FAF7",
  card: "#FFFFFF",
  border: "#D5E2DD",
  divider: "#EDF3F0",
  ink: "#183B34",
  muted: "#52635F",
  danger: "#DC2626",
  dangerBg: "#FDECEC",
};

export type AccountView =
  | "menu"
  | "edit"
  | "subs"
  | "voice"
  | "rep"
  | "help"
  | "logout";

export interface AccountProfile {
  name: string;
  phone: string;
  province: string;
  city: string;
}

// ─── ICONS ────────────────────────────────────────────────────────────────────

const ICON_PATHS: Record<string, React.ReactNode> = {
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  headset: (
    <>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </>
  ),
  close: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  chevron: <polyline points="9 18 15 12 9 6" />,
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  check: <polyline points="20 6 9 17 4 12" />,
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  mail: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </>
  ),
  whatsapp: (
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  speaker: (
    <>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </>
  ),
  arrowLeft: (
    <>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </>
  ),
};

function Icon({
  name,
  size = 18,
  color = "currentColor",
  strokeWidth = 2,
  style,
}: {
  name: keyof typeof ICON_PATHS;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────

function Sheet({
  title,
  subtitle,
  onClose,
  zIndex = 350,
  maxHeight = "90vh",
  dismissable = true,
  isUr,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  zIndex?: number;
  maxHeight?: string;
  dismissable?: boolean;
  isUr: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="zm-sheet-overlay"
      style={{ zIndex }}
      onClick={() => dismissable && onClose()}
    >
      <div
        className="zm-sheet-high"
        dir={isUr ? "rtl" : "ltr"}
        style={{ background: C.surface, maxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 pt-3 pb-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}
        >
          <div
            className="w-10 h-1 rounded-full mx-auto mb-3"
            style={{ background: "#C7D6D0" }}
          />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p
                className="font-bold truncate"
                style={{
                  color: C.ink,
                  fontSize: isUr ? 19 : 17,
                  fontFamily: isUr ? URDU_FONT : "inherit",
                }}
              >
                {title}
              </p>
              {subtitle && (
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="tap-target w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#EEF3F1", color: C.muted }}
            >
              <Icon name="close" size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">{children}</div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-bold uppercase tracking-wider mb-2 px-1"
      style={{ color: C.muted }}
    >
      {children}
    </p>
  );
}

function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{ background: C.card, border: `1px solid ${C.border}`, ...style }}
    >
      {children}
    </div>
  );
}

function IconTile({
  name,
  danger,
  tone = "mint",
}: {
  name: keyof typeof ICON_PATHS;
  danger?: boolean;
  tone?: "mint" | "solid";
}) {
  const solid = tone === "solid";
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{
        background: danger ? C.dangerBg : solid ? C.primary : C.mint,
      }}
    >
      <Icon
        name={name}
        size={18}
        color={danger ? C.danger : solid ? "#fff" : C.primary}
      />
    </div>
  );
}

function Row({
  icon,
  label,
  sub,
  onClick,
  href,
  danger,
  isUr,
  trailing,
  last,
}: {
  icon: keyof typeof ICON_PATHS;
  label: string;
  sub?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  isUr: boolean;
  trailing?: React.ReactNode;
  last?: boolean;
}) {
  const content = (
    <>
      <IconTile name={icon} danger={danger} />
      <div className="flex-1 min-w-0" style={{ textAlign: isUr ? "right" : "left" }}>
        <p
          className="font-semibold leading-tight"
          style={{
            color: danger ? C.danger : C.ink,
            fontFamily: isUr ? URDU_FONT : "inherit",
            fontSize: isUr ? 15 : 14,
          }}
        >
          {label}
        </p>
        {sub && (
          <p className="text-xs mt-0.5 truncate" style={{ color: C.muted }}>
            {sub}
          </p>
        )}
      </div>
      {trailing ?? (
        <Icon
          name="chevron"
          size={16}
          color="#9BB5AC"
          style={{ transform: isUr ? "scaleX(-1)" : undefined }}
        />
      )}
    </>
  );
  const className =
    "tap-target w-full flex items-center gap-3 px-4 py-3 transition active:bg-[#F4FAF7]";
  const style: React.CSSProperties = {
    borderBottom: last ? "none" : `1px solid ${C.divider}`,
    background: C.card,
  };
  return href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      className={className}
      style={style}
    >
      {content}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={className} style={style}>
      {content}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
}) {
  const styles = {
    primary: { background: C.primary, color: "#fff" },
    secondary: { background: "#EEF3F1", color: C.muted },
    danger: { background: C.danger, color: "#fff" },
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap-target w-full py-3 rounded-xl font-bold text-sm transition active:scale-[0.99]"
      style={styles}
    >
      {children}
    </button>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="w-11 h-6 rounded-full transition relative flex-shrink-0"
      style={{ background: on ? C.primary : "#CBD5D1" }}
    >
      <span
        className="w-5 h-5 rounded-full bg-white block absolute top-0.5 transition-all shadow-sm"
        style={{ left: on ? 22 : 2 }}
      />
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
  style,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="py-2.5 px-3 rounded-xl text-xs font-semibold border transition text-center"
      style={{
        background: active ? C.primary : C.card,
        color: active ? "#fff" : C.ink,
        borderColor: active ? C.primary : C.border,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

const Ltr = ({ children }: { children: React.ReactNode }) => (
  <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
    {children}
  </span>
);

const inputClass =
  "w-full px-3.5 py-3 rounded-xl border border-[#D5E2DD] bg-white text-sm font-medium text-[#183B34] focus:border-[#087F63] outline-none";

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function AccountCenter({
  view,
  onViewChange,
  profile,
  onProfileSave,
  onToast,
  profileCompleted,
  progressPct,
  currentStep,
  totalSteps,
  userSubscribedList,
  getVerticalForProduct,
  hasRepAccount,
  onSwitchRole,
  onStartRepOnboarding,
  onRestartOnboarding,
  onOpenCompleteProfile,
  onOpenBilling,
}: {
  view: AccountView | null;
  onViewChange: (v: AccountView | null) => void;
  profile: AccountProfile;
  onProfileSave: (next: AccountProfile) => void;
  onToast: (msg: string) => void;
  profileCompleted: boolean;
  progressPct: number;
  currentStep: number;
  totalSteps: number;
  userSubscribedList: string[];
  getVerticalForProduct: (name: string) => string;
  hasRepAccount: boolean;
  onSwitchRole?: (role: "customer" | "representative") => void;
  onStartRepOnboarding?: () => void;
  onRestartOnboarding?: (mode?: "register" | "signin") => void;
  onOpenCompleteProfile: () => void;
  onOpenBilling: (product: string, vertical: string) => void;
}) {
  const { lang, setLang, tc, tn, voiceEnabled, setVoiceEnabled } = useLang();
  const isUr = lang === "ur";
  const L = (en: string, ur: string) => (isUr ? ur : en);

  const close = () => onViewChange(null);

  // Edit-profile form + contact OTP step
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editProvince, setEditProvince] = useState(profile.province);
  const [editCity, setEditCity] = useState(profile.city);
  const [verifyStep, setVerifyStep] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);

  // Contact-us feedback + FAQ
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Reset the edit form from the saved profile each time it opens.
  useEffect(() => {
    if (view !== "edit") return;
    setEditName(profile.name);
    setEditPhone(profile.phone);
    setEditProvince(profile.province);
    setEditCity(profile.city);
    setVerifyStep(false);
    setOtp(["", "", "", ""]);
    setOtpError("");
    setOtpSuccess(false);
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!view) return null;

  const savedToast = L(
    "Profile & location updated",
    "پروفائل اور مقام کامیابی سے تبدیل ہو گیا",
  );

  const saveProfile = (phone: string) => {
    onProfileSave({
      name: editName,
      phone,
      province: editProvince,
      city: editCity,
    });
    onViewChange(null);
    onToast(savedToast);
  };

  const planLabel = profileCompleted
    ? L("Zarai Mandi Pro", "زرعی منڈی پرو")
    : L("Free Trial · 2 days left", "مفت ٹرائل · 2 دن باقی");

  const initials =
    profile.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "ZM";

  // ── MENU ────────────────────────────────────────────────────────────────────
  if (view === "menu") {
    return (
      <Sheet
        title={L("Account", "اکاؤنٹ")}
        onClose={close}
        zIndex={310}
        maxHeight="92vh"
        isUr={isUr}
      >
        {/* Profile summary — tap to edit */}
        <button
          type="button"
          onClick={() => onViewChange("edit")}
          className="tap-target w-full flex items-center gap-3.5 p-4 rounded-2xl transition active:scale-[0.99]"
          style={{
            background: `linear-gradient(135deg, ${C.deep}, ${C.primary})`,
            textAlign: isUr ? "right" : "left",
          }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg"
            style={{
              background: "rgba(255,255,255,0.16)",
              border: "1.5px solid rgba(255,255,255,0.4)",
              color: "#fff",
            }}
          >
            {/^[A-Za-z]/.test(initials) ? initials : <Icon name="user" size={26} color="#fff" />}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="font-bold text-white truncate"
              style={{ fontSize: isUr ? 18 : 16, fontFamily: isUr ? URDU_FONT : "inherit" }}
            >
              {tn(profile.name)}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "#CDEBDF" }}>
              <Ltr>{profile.phone}</Ltr>
            </p>
            <span
              className="inline-block mt-1.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.16)", color: "#E4F2EC" }}
            >
              {planLabel}
            </span>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.16)" }}
          >
            <Icon name="edit" size={14} color="#fff" />
          </div>
        </button>

        {/* Setup progress (only while incomplete) */}
        {!profileCompleted && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color: C.ink }}>
                {L("Complete your profile", "پروفائل مکمل کریں")}
              </p>
              <span className="text-xs font-bold" style={{ color: C.primary }}>
                {progressPct}%
              </span>
            </div>
            <div
              className="w-full h-1.5 rounded-full overflow-hidden mb-3"
              style={{ background: C.mint }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPct}%`,
                  background: C.bright,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <PrimaryButton
              onClick={() => {
                close();
                onOpenCompleteProfile();
              }}
            >
              {L(
                `Continue setup · Step ${currentStep} of ${totalSteps}`,
                `سیٹ اپ جاری رکھیں · مرحلہ ${currentStep}`,
              )}
            </PrimaryButton>
          </Card>
        )}

        <div>
          <SectionLabel>{L("Account", "اکاؤنٹ")}</SectionLabel>
          <Card>
            <Row
              isUr={isUr}
              icon="briefcase"
              label={L("My Subscriptions", "میری سبسکرپشنز")}
              sub={planLabel}
              onClick={() => onViewChange("subs")}
            />
            <Row
              isUr={isUr}
              icon="users"
              label={
                hasRepAccount
                  ? L("Switch to Representative", "نمائندہ ڈیش بورڈ پر جائیں")
                  : L("Become a Representative", "نمائندہ بنیں")
              }
              sub={
                hasRepAccount
                  ? L("Open your representative dashboard", "اکاؤنٹ تبدیل کریں")
                  : L("Register for your local mandi", "منڈی کے لیے نمائندہ اکاؤنٹ بنائیں")
              }
              onClick={() => {
                if (hasRepAccount) {
                  close();
                  onSwitchRole?.("representative");
                } else {
                  onViewChange("rep");
                }
              }}
              last
            />
          </Card>
        </div>

        <div>
          <SectionLabel>{L("Preferences", "ترجیحات")}</SectionLabel>
          <Card>
            <Row
              isUr={isUr}
              icon="globe"
              label={L("Voice & Language", "آواز اور زبان")}
              sub={`${isUr ? "اردو" : "English"} · ${voiceEnabled ? L("Voice on", "آواز فعال") : L("Voice off", "آواز بند")
                }`}
              onClick={() => onViewChange("voice")}
              last
            />
          </Card>
        </div>

        <div>
          <SectionLabel>{L("Support", "مدد")}</SectionLabel>
          <Card>
            <Row
              isUr={isUr}
              icon="headset"
              label={L("Contact Us", "ہم سے رابطہ کریں")}
              sub={L(
                "Mandi updates, trade directory, international rates, historical data & FAQs",
                "منڈی اپڈیٹس، تجارتی ڈائریکٹری، بین الاقوامی ریٹس، تاریخی ڈیٹا",
              )}
              onClick={() => onViewChange("help")}
              last
            />
          </Card>
        </div>

        <Card>
          <Row
            isUr={isUr}
            icon="logout"
            danger
            label={L("Log Out", "لاگ آؤٹ")}
            onClick={() => onViewChange("logout")}
            trailing={<span />}
            last
          />
        </Card>
        <div className="h-2" />
      </Sheet>
    );
  }

  // ── EDIT PROFILE ────────────────────────────────────────────────────────────
  if (view === "edit") {
    const mandis = LOCATIONS[editProvince]
      ? Object.values(LOCATIONS[editProvince]).flat()
      : ["Pakpattan Mandi", "Arifwala Mandi", "Lahore Grain Market", "Multan Mandi"];

    return (
      <Sheet
        title={verifyStep ? L("Verify Contact", "رابطے کی تصدیق") : L("Edit Profile", "پروفائل ترمیم کریں")}
        onClose={close}
        maxHeight="92vh"
        dismissable={!verifyStep}
        isUr={isUr}
      >
        {!verifyStep ? (
          <>
            <div className="space-y-4">
              <div>
                <SectionLabel>{L("Name", "نام")}</SectionLabel>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Muhammad Arif"
                />
              </div>
              <div>
                <SectionLabel>{L("Phone number / Email", "فون نمبر / ای میل")}</SectionLabel>
                <input
                  type="text"
                  dir="ltr"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className={inputClass}
                  placeholder="0300 1234567 or email@domain.com"
                />
                <p className="text-[11px] mt-1.5 px-1" style={{ color: C.muted }}>
                  {L(
                    "Changing your phone or email requires OTP verification.",
                    "فون یا ای میل تبدیل کرنے کی صورت میں OTP تصدیق ضروری ہوگی۔",
                  )}
                </p>
              </div>
              <div>
                <SectionLabel>{L("Province", "صوبہ")}</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(LOCATIONS).map((prov) => (
                    <Chip
                      key={prov}
                      active={editProvince === prov}
                      onClick={() => {
                        setEditProvince(prov);
                        const first = LOCATIONS[prov]
                          ? Object.values(LOCATIONS[prov]).flat()[0]
                          : undefined;
                        setEditCity(first || "Pakpattan Mandi");
                      }}
                    >
                      {prov}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel>{L("Primary mandi", "بنیادی منڈی")}</SectionLabel>
                <Card style={{ maxHeight: 208, overflowY: "auto" }}>
                  {mandis.map((mandi, i) => {
                    const active = editCity === mandi;
                    return (
                      <button
                        key={mandi}
                        type="button"
                        onClick={() => setEditCity(mandi)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
                        style={{
                          background: active ? C.mint : C.card,
                          borderBottom:
                            i === mandis.length - 1 ? "none" : `1px solid ${C.divider}`,
                        }}
                      >
                        <span
                          className="text-sm"
                          style={{ color: C.ink, fontWeight: active ? 600 : 500 }}
                        >
                          {mandi}
                        </span>
                        {active && <Icon name="check" size={16} color={C.primary} strokeWidth={2.6} />}
                      </button>
                    );
                  })}
                </Card>
              </div>
            </div>
            <PrimaryButton
              onClick={() => {
                if (editPhone.trim() !== profile.phone.trim()) {
                  setVerifyStep(true);
                  setOtp(["", "", "", ""]);
                  setOtpError("");
                  setOtpSuccess(false);
                } else {
                  saveProfile(profile.phone);
                }
              }}
            >
              {L("Save Changes", "تبدیلیاں محفوظ کریں")}
            </PrimaryButton>
          </>
        ) : (
          <>
            <Card>
              <div
                className="flex justify-between items-center px-4 py-3 text-sm"
                style={{ borderBottom: `1px solid ${C.divider}` }}
              >
                <span style={{ color: C.muted }}>{L("Current", "موجودہ")}</span>
                <span className="font-semibold" style={{ color: C.ink }}>
                  <Ltr>{profile.phone}</Ltr>
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 text-sm">
                <span style={{ color: C.primary }}>{L("New", "نیا")}</span>
                <span className="font-bold" style={{ color: C.primary }}>
                  <Ltr>{editPhone}</Ltr>
                </span>
              </div>
            </Card>

            <div>
              <p className="text-sm font-semibold text-center mb-3" style={{ color: C.ink }}>
                {L("Enter the 4-digit code we sent you", "4 ہندسوں کا OTP کوڈ درج کریں")}
              </p>
              <div className="flex justify-center gap-3" dir="ltr">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    id={`otp-box-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[idx] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      const next = [...otp];
                      next[idx] = val;
                      setOtp(next);
                      if (val && idx < 3) document.getElementById(`otp-box-${idx + 1}`)?.focus();
                    }}
                    className="w-12 h-12 text-center text-lg font-bold rounded-xl border border-[#D5E2DD] bg-white text-[#183B34] focus:border-[#087F63] outline-none"
                  />
                ))}
              </div>
              {otpError && (
                <p className="text-xs font-semibold text-center mt-2" style={{ color: C.danger }}>
                  {otpError}
                </p>
              )}
              {otpSuccess && (
                <p
                  className="text-xs font-semibold text-center mt-2 flex items-center justify-center gap-1"
                  style={{ color: C.primary }}
                >
                  <Icon name="check" size={14} color={C.primary} strokeWidth={2.6} />
                  {L("Verified", "کامیابی سے تصدیق ہو گئی")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <PrimaryButton
                onClick={() => {
                  if (otp.join("").length < 4) {
                    setOtpError(
                      L(
                        "Please enter the full 4-digit code",
                        "براہ کرم مکمل 4 ہندسوں کا کوڈ درج کریں",
                      ),
                    );
                    return;
                  }
                  setOtpSuccess(true);
                  setTimeout(() => saveProfile(editPhone), 500);
                }}
              >
                {L("Verify & Save", "تصدیق کریں اور محفوظ کریں")}
              </PrimaryButton>
              <PrimaryButton variant="secondary" onClick={() => setVerifyStep(false)}>
                {L("Back", "واپس جائیں")}
              </PrimaryButton>
            </div>
          </>
        )}
      </Sheet>
    );
  }

  // ── SUBSCRIPTIONS ───────────────────────────────────────────────────────────
  if (view === "subs") {
    const subscribed = profileCompleted
      ? userSubscribedList
      : Array.from(SUBSCRIBED_PRODUCTS).slice(0, 8);
    const others = PRODUCT_DIVISIONS.filter((d) => !userSubscribedList.includes(d.name));

    return (
      <Sheet title={L("My Subscriptions", "میری سبسکرپشنز")} onClose={close} maxHeight="92vh" isUr={isUr}>
        <div
          className="p-4 rounded-2xl text-white"
          style={{ background: `linear-gradient(135deg, ${C.deep}, ${C.primary})` }}
        >
          <div className="flex justify-between items-center gap-2">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: "#B4E6D2" }}>
              {profileCompleted ? L("Current plan", "موجودہ پلان") : L("Free trial", "مفت ٹرائل")}
            </span>
            <span
              className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.18)" }}
            >
              {profileCompleted ? L("Active", "فعال") : L("2 days left", "2 دن باقی")}
            </span>
          </div>
          <p className="text-lg font-bold mt-1.5">
            {profileCompleted ? L("Zarai Mandi Pro", "زرعی منڈی پرو") : L("Trial access", "ٹرائل رسائی")}
          </p>
        </div>

        <div>
          <SectionLabel>{L("Subscribed commodities", "سبسکرائب شدہ اجناس")}</SectionLabel>
          <Card>
            {subscribed.map((p, i) => (
              <div
                key={p}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i === subscribed.length - 1 ? "none" : `1px solid ${C.divider}` }}
              >
                <ProductIcon name={p} vertical={getVerticalForProduct(p)} size={30} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: C.ink }}>
                    {tc(p)}
                  </p>
                  {profileCompleted && (
                    <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                      {L("Renews", "تجدید")} 21 Sep 2026
                    </p>
                  )}
                </div>
                <span
                  className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: C.mint, color: C.primary }}
                >
                  {profileCompleted ? L("Active", "فعال") : L("Trial", "ٹرائل")}
                </span>
              </div>
            ))}
          </Card>
        </div>

        {profileCompleted && others.length > 0 && (
          <div>
            <SectionLabel>{L("Add commodities", "مزید اجناس")}</SectionLabel>
            <Card>
              {others.map((item, i) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i === others.length - 1 ? "none" : `1px solid ${C.divider}` }}
                >
                  <ProductIcon name={item.name} vertical={getVerticalForProduct(item.name)} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: C.ink }}>
                      {tc(item.name)}
                    </p>
                    <p className="text-[11px]" style={{ color: C.muted }}>
                      PKR 3,000 / {L("month", "ماہ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      onOpenBilling(item.name, getVerticalForProduct(item.name));
                    }}
                    className="tap-target px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: C.mint, color: C.primary, border: `1px solid ${C.mintBorder}` }}
                  >
                    {L("Unlock", "ان لاک کریں")}
                  </button>
                </div>
              ))}
            </Card>
          </div>
        )}

        <PrimaryButton
          onClick={() => {
            close();
            onOpenCompleteProfile();
          }}
        >
          {profileCompleted
            ? L("Unlock multiple commodities", "ایک ساتھ متعدد اجناس ان لاک کریں")
            : L("Complete profile & subscribe", "پروفائل مکمل کریں اور سبسکرائب کریں")}
        </PrimaryButton>
      </Sheet>
    );
  }

  // ── VOICE & LANGUAGE ────────────────────────────────────────────────────────
  if (view === "voice") {
    return (
      <Sheet title={L("Voice & Language", "آواز اور زبان")} onClose={close} isUr={isUr}>
        <div>
          <SectionLabel>{L("App language", "ایپ کی زبان")}</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <Chip active={isUr} onClick={() => setLang("ur")} style={{ fontFamily: URDU_FONT, fontSize: 14 }}>
              اردو
            </Chip>
            <Chip active={!isUr} onClick={() => setLang("en")} style={{ fontSize: 13 }}>
              English
            </Chip>
          </div>
        </div>

        <div>
          <SectionLabel>{L("Voice assistance", "آواز کا معاون")}</SectionLabel>
          <Card>
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${C.divider}` }}>
              <IconTile name="speaker" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: C.ink }}>
                  {L("Read rates aloud", "ریٹس بول کر سنائیں")}
                </p>
                <p className="text-xs" style={{ color: C.muted }}>
                  {L("Speaks when you tap cards", "کارڈ پر کلک کرنے پر بول کر بتائیں")}
                </p>
              </div>
              <Toggle on={voiceEnabled} onChange={setVoiceEnabled} />
            </div>
            <Row
              isUr={isUr}
              icon="speaker"
              label={L("Test voice", "آواز کا نمونہ سنیں")}
              onClick={() =>
                speakText(
                  L(
                    "Welcome to ZaraiMandi. The voice assistance system is functioning properly.",
                    "زرعی منڈی میں خوش آمدید۔ آواز کا نظام بالکل ٹھیک کام کر رہا ہے۔",
                  ),
                )
              }
              last
            />
          </Card>
        </div>

        <PrimaryButton onClick={close}>{L("Done", "ٹھیک ہے")}</PrimaryButton>
      </Sheet>
    );
  }

  // ── BECOME A REPRESENTATIVE ─────────────────────────────────────────────────
  if (view === "rep") {
    return (
      <Sheet title={L("Become a Representative", "نمائندہ بنیں")} onClose={close} maxHeight="85vh" isUr={isUr}>
        <div className="flex flex-col items-center text-center gap-3 pt-1">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: C.mint, border: `1px solid ${C.mintBorder}` }}
          >
            <Icon name="users" size={26} color={C.primary} />
          </div>
          <p className="text-base font-bold" style={{ color: C.ink }}>
            {L("Mandi Representative Account", "منڈی نمائندہ اکاؤنٹ")}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
            {L(
              "Submit daily rates for your mandi. You can switch between customer and representative dashboards from the same account.",
              "اپنی منڈی کے روزانہ ریٹس جمع کروائیں۔ آپ ایک ہی اکاؤنٹ سے کسٹمر اور نمائندہ ڈیش بورڈ کے درمیان تبدیل کر سکتے ہیں۔",
            )}
          </p>
        </div>
        <div className="space-y-2">
          <PrimaryButton
            onClick={() => {
              close();
              onStartRepOnboarding?.();
            }}
          >
            {L("Continue to Registration", "رجسٹریشن شروع کریں")}
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={close}>
            {L("Cancel", "منسوخ کریں")}
          </PrimaryButton>
        </div>
      </Sheet>
    );
  }

  // ── CONTACT US ──────────────────────────────────────────────────────────────
  if (view === "help") {
    // What the team can provide on WhatsApp; one button opens one chat for all of it.
    const whatsappServices: { icon: keyof typeof ICON_PATHS; title: string }[] = [
      { icon: "bell", title: L("Ghalla Mandi updates", "غلہ منڈی اپڈیٹس") },
      { icon: "users", title: L("Trade directory", "تجارتی ڈائریکٹری") },
      { icon: "globe", title: L("International rates", "بین الاقوامی ریٹس") },
      { icon: "calendar", title: L("Historical data", "تاریخی ڈیٹا") },
    ];

    const faqs = [
      {
        q: L("How often are mandi rates updated?", "منڈی کے ریٹس کتنی بار اپ ڈیٹ ہوتے ہیں؟"),
        a: L(
          "Rates are updated every 15 minutes during trading hours (8:00 AM – 6:00 PM).",
          "صبح 8 بجے سے شام 6 بجے تک ہر 15 منٹ بعد ریٹس اپ ڈیٹ کیے جاتے ہیں۔",
        ),
      },
      {
        q: L("Can I change my tracked commodities?", "کیا میں اپنی اجناس تبدیل کر سکتا ہوں؟"),
        a: L(
          "Yes, you can change your commodities and mandis at any time.",
          "جی ہاں، آپ کسی بھی وقت اپنی اجناس اور منڈیاں تبدیل کر سکتے ہیں۔",
        ),
      },
      {
        q: L("How far back does the data in the app go?", "ایپ میں کتنا پرانا ڈیٹا موجود ہے؟"),
        a: L(
          "Rates and analytics are available from your signup date onward. For earlier records, message us on WhatsApp above and our team will prepare a custom export.",
          "ایپ میں آپ کے سائن اپ کی تاریخ کے بعد کا مکمل ڈیٹا دستیاب ہے۔ اس سے پہلے کا ڈیٹا چاہیے تو اوپر واٹس ایپ پر رابطہ کریں، ہماری ٹیم آپ کو فراہم کرے گی۔",
        ),
      },
      {
        q: L("Which payment methods are supported?", "ادائیگی کے کون سے طریقے دستیاب ہیں؟"),
        a: L(
          "JazzCash, EasyPaisa, SadaPay, NayaPay and 1Link bank transfers.",
          "JazzCash، EasyPaisa، SadaPay، NayaPay اور تمام بینک ٹرانسفرز۔",
        ),
      },
    ];

    return (
      <Sheet title={L("Contact Us", "ہم سے رابطہ کریں")} onClose={close} maxHeight="92vh" isUr={isUr}>
        {/* One WhatsApp entry point for everything the team provides */}
        <div
          className="p-4 rounded-2xl"
          style={{ background: `linear-gradient(135deg, ${C.deep}, ${C.primary})` }}
        >
          <p
            className="font-bold text-white"
            style={{ fontSize: isUr ? 16 : 15, fontFamily: isUr ? URDU_FONT : "inherit" }}
          >
            {L("Get more on WhatsApp", "واٹس ایپ پر مزید حاصل کریں")}
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3">
            {whatsappServices.map((item) => (
              <span key={item.icon} className="flex items-center gap-2 min-w-0">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.16)" }}
                >
                  <Icon name={item.icon} size={15} color="#fff" />
                </span>
                <span
                  className="text-[12.5px] font-semibold leading-tight text-white"
                  style={{ fontFamily: isUr ? URDU_FONT : "inherit" }}
                >
                  {item.title}
                </span>
              </span>
            ))}
          </div>
          <a
            href={waLink(
              `Assalam-o-Alaikum Zarai Mandi Team, I would like information on Ghalla Mandi updates, the trade directory, international rates or historical data. Name: ${profile.name}`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target mt-4 w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.99]"
            style={{ background: "#fff", color: C.deep }}
          >
            <Icon name="whatsapp" size={16} color={C.primary} />
            {L("Chat on WhatsApp", "واٹس ایپ پر بات کریں")}
            <span className="font-semibold" style={{ color: C.muted }}>
              · <Ltr>{ZM_CONTACT.whatsappDisplay}</Ltr>
            </span>
          </a>
        </div>

        <div>
          <SectionLabel>{L("Talk to us", "ہم سے بات کریں")}</SectionLabel>
          <Card>
            <Row
              isUr={isUr}
              icon="phone"
              label={L("Toll-free helpline", "ٹول فری ہیلپ لائن")}
              sub={<Ltr>{ZM_CONTACT.helplineDisplay}</Ltr>}
              href={`tel:${ZM_CONTACT.helplineTel}`}
            />
            <Row
              isUr={isUr}
              icon="mail"
              label={L("Email", "ای میل")}
              sub={ZM_CONTACT.email}
              href={`mailto:${ZM_CONTACT.email}`}
              last
            />
          </Card>
        </div>

        <div>
          <SectionLabel>{L("Frequently asked", "اکثر پوچھے گئے سوالات")}</SectionLabel>
          <Card>
            {faqs.map((faq, idx) => {
              const open = faqOpen === idx;
              return (
                <div
                  key={idx}
                  style={{ borderBottom: idx === faqs.length - 1 ? "none" : `1px solid ${C.divider}` }}
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpen(open ? null : idx)}
                    className="w-full px-4 py-3 flex items-center justify-between gap-3 text-sm font-semibold"
                    style={{ color: C.ink, textAlign: isUr ? "right" : "left" }}
                  >
                    <span>{faq.q}</span>
                    <Icon
                      name="chevronDown"
                      size={16}
                      color="#9BB5AC"
                      style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }}
                    />
                  </button>
                  {open && (
                    <p className="px-4 pb-3 text-xs leading-relaxed" style={{ color: C.muted }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </Card>
        </div>

        <div>
          <SectionLabel>{L("Send feedback", "رائے بھیجیں")}</SectionLabel>
          {feedbackSent ? (
            <div
              className="p-3 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-1.5"
              style={{ background: C.mint, color: C.primary }}
            >
              <Icon name="check" size={16} color={C.primary} strokeWidth={2.6} />
              {L("Thanks — your feedback has been sent.", "شکریہ! آپ کا پیغام موصول ہو گیا ہے۔")}
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={L("Type your message or issue...", "اپنا پیغام یہاں لکھیں...")}
                className="w-full p-3 rounded-xl border border-[#D5E2DD] bg-white text-sm text-[#183B34] outline-none resize-none focus:border-[#087F63]"
              />
              <PrimaryButton
                onClick={() => {
                  if (feedback.trim()) {
                    setFeedbackSent(true);
                    setFeedback("");
                  }
                }}
              >
                {L("Send", "پیغام بھیجیں")}
              </PrimaryButton>
            </div>
          )}
        </div>
        <div className="h-2" />
      </Sheet>
    );
  }

  // ── LOG OUT ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="zm-sheet-overlay"
      style={{ zIndex: 360, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={close}
    >
      <div
        className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center"
        dir={isUr ? "rtl" : "ltr"}
        style={{ animation: "screenEnter 0.2s ease-out", border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: C.dangerBg }}
        >
          <Icon name="logout" size={22} color={C.danger} />
        </div>
        <h3 className="text-base font-bold mb-1" style={{ color: C.ink }}>
          {L("Log out?", "لاگ آؤٹ کریں؟")}
        </h3>
        <p className="text-sm mb-5" style={{ color: C.muted }}>
          {L("You can sign back in anytime.", "آپ کسی بھی وقت دوبارہ سائن ان کر سکتے ہیں۔")}
        </p>
        <div className="flex gap-2.5">
          <PrimaryButton variant="secondary" onClick={close}>
            {L("Cancel", "منسوخ کریں")}
          </PrimaryButton>
          <PrimaryButton
            variant="danger"
            onClick={() => {
              close();
              onRestartOnboarding?.("signin");
            }}
          >
            {L("Log Out", "لاگ آؤٹ")}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
