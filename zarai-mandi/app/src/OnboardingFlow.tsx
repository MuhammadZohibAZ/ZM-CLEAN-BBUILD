import { useState, useRef, useEffect } from "react"
import logoImg from "@/imports/zmlogodark-removebg-preview.png"

// ─── Product Icons ─────────────────────────────────────────────────────────────
import cotton200 from "./cotton200.png"
import dates200 from "./dates200.png"
import dryfruits200 from "./dryfruits200.png"
import edible200 from "./edible200.png"
import fertilizers200 from "./fertilizers200.png"
import fruits200 from "./fruits200.png"
import herbals200 from "./herbals200.png"
import maize200 from "./maize200.png"
import millet200 from "./millet200.png"
import mustard200 from "./mustard200.png"
import paddy200 from "./paddy200.png"
import pulses200 from "./pulses200.png"
import rice200 from "./rice200.png"
import sesame200 from "./sesame200.png"
import spices200 from "./spices200.png"
import sugar200 from "./sugar200.png"
import vegetables200 from "./vegetables200.png"
import wheat200 from "./wheat200.png"
import kiryana200 from "./kiryana200.png"
import livestock200 from "./livestock200.png"
import livemarket200 from "./livemarket200.png"

// Maps each product id used in PRODUCTS / REP_PRODUCTS to its icon
const ICONS: Record<string, string> = {
  wheat: wheat200,
  rice: rice200,
  cotton: cotton200,
  maize: maize200,
  sugar: sugar200,
  pulses: pulses200,
  mustard: mustard200,
  sesame: sesame200,
  millet: millet200,
  paddy: paddy200,
  dates: dates200,
  spices: spices200,
  dryfruit: dryfruits200,
  livemarket: livemarket200,
  fruits: fruits200,
  vegetables: vegetables200,
  livestock: livestock200,
  fertilizer: fertilizers200,
  edibleoil: edible200,
  kiryana: kiryana200,
  herbs: herbals200,
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = "lang" | "role" | "account" | "interests" | "location" | "subscription" | "payment" | "loading" | "rep-pending" | "dashboard"
type Role = "customer" | "representative"

// ─── Data ─────────────────────────────────────────────────────────────────────
const CITIES: { city: string; district: string; province: string }[] = [
  { city: "Lahore", district: "Lahore", province: "Punjab" },
  { city: "Faisalabad", district: "Faisalabad", province: "Punjab" },
  { city: "Rawalpindi", district: "Rawalpindi", province: "Punjab" },
  { city: "Multan", district: "Multan", province: "Punjab" },
  { city: "Gujranwala", district: "Gujranwala", province: "Punjab" },
  { city: "Sialkot", district: "Sialkot", province: "Punjab" },
  { city: "Bahawalpur", district: "Bahawalpur", province: "Punjab" },
  { city: "Okara", district: "Okara", province: "Punjab" },
  { city: "Sahiwal", district: "Sahiwal", province: "Punjab" },
  { city: "Sargodha", district: "Sargodha", province: "Punjab" },
  { city: "Sheikhupura", district: "Sheikhupura", province: "Punjab" },
  { city: "Rahim Yar Khan", district: "Rahim Yar Khan", province: "Punjab" },
  { city: "Jhang", district: "Jhang", province: "Punjab" },
  { city: "Gujrat", district: "Gujrat", province: "Punjab" },
  { city: "Kasur", district: "Kasur", province: "Punjab" },
  { city: "Chiniot", district: "Chiniot", province: "Punjab" },
  { city: "Khanewal", district: "Khanewal", province: "Punjab" },
  { city: "Mandi Bahauddin", district: "Mandi Bahauddin", province: "Punjab" },
  { city: "Pakpattan", district: "Pakpattan", province: "Punjab" },
  { city: "Vehari", district: "Vehari", province: "Punjab" },
  { city: "Muzaffargarh", district: "Muzaffargarh", province: "Punjab" },
  { city: "Lodhran", district: "Lodhran", province: "Punjab" },
  { city: "Chakwal", district: "Chakwal", province: "Punjab" },
  { city: "Attock", district: "Attock", province: "Punjab" },
  { city: "Jhelum", district: "Jhelum", province: "Punjab" },
  { city: "Karachi", district: "Karachi", province: "Sindh" },
  { city: "Hyderabad", district: "Hyderabad", province: "Sindh" },
  { city: "Sukkur", district: "Sukkur", province: "Sindh" },
  { city: "Larkana", district: "Larkana", province: "Sindh" },
  { city: "Nawabshah", district: "Nawabshah", province: "Sindh" },
  { city: "Mirpurkhas", district: "Mirpurkhas", province: "Sindh" },
  { city: "Jacobabad", district: "Jacobabad", province: "Sindh" },
  { city: "Shikarpur", district: "Shikarpur", province: "Sindh" },
  { city: "Khairpur", district: "Khairpur", province: "Sindh" },
  { city: "Dadu", district: "Dadu", province: "Sindh" },
  { city: "Umerkot", district: "Umerkot", province: "Sindh" },
  { city: "Tharparkar", district: "Tharparkar", province: "Sindh" },
  { city: "Peshawar", district: "Peshawar", province: "KPK" },
  { city: "Mardan", district: "Mardan", province: "KPK" },
  { city: "Abbottabad", district: "Abbottabad", province: "KPK" },
  { city: "Swat", district: "Swat", province: "KPK" },
  { city: "Nowshera", district: "Nowshera", province: "KPK" },
  { city: "Charsadda", district: "Charsadda", province: "KPK" },
  { city: "Kohat", district: "Kohat", province: "KPK" },
  { city: "Mansehra", district: "Mansehra", province: "KPK" },
  { city: "Dera Ismail Khan", district: "D.I. Khan", province: "KPK" },
  { city: "Haripur", district: "Haripur", province: "KPK" },
  { city: "Quetta", district: "Quetta", province: "Balochistan" },
  { city: "Gwadar", district: "Gwadar", province: "Balochistan" },
  { city: "Khuzdar", district: "Khuzdar", province: "Balochistan" },
  { city: "Hub", district: "Lasbela", province: "Balochistan" },
  { city: "Turbat", district: "Kech", province: "Balochistan" },
  { city: "Chaman", district: "Qilla Abdullah", province: "Balochistan" },
  { city: "Zhob", district: "Zhob", province: "Balochistan" },
  { city: "Muzaffarabad", district: "Muzaffarabad", province: "AJK" },
  { city: "Mirpur", district: "Mirpur", province: "AJK" },
  { city: "Rawalakot", district: "Poonch", province: "AJK" },
  { city: "Gilgit", district: "Gilgit", province: "Gilgit-Baltistan" },
  { city: "Skardu", district: "Skardu", province: "Gilgit-Baltistan" },
]

const PROVINCES = [
  "Punjab",
  "Sindh",
  "KPK",
  "Balochistan",
]

const PRODUCTS = [
  { id: "wheat", label: "Wheat", price: 3000 },
  { id: "maize", label: "Maize", price: 3000 },
  { id: "sesame", label: "Sesame", price: 3000 },
  { id: "millet", label: "Millet", price: 3000 },
  { id: "cotton", label: "Cotton", price: 3000 },
  { id: "paddy", label: "Paddy", price: 3000 },
  { id: "rice", label: "Rice", price: 3000 },
  { id: "edibleoil", label: "Edible Oil", price: 5000 },
  { id: "fertilizer", label: "Fertilizer", price: 5000 },
  { id: "livestock", label: "Livestock", price: 5000 },
  { id: "livemarket", label: "Live Market", price: 3000 },
  { id: "dates", label: "Dates", price: 3000 },
  { id: "mustard", label: "Mustard", price: 3000 },
  { id: "spices", label: "Spices", price: 3000 },
  { id: "pulses", label: "Pulses", price: 3000 },
  { id: "kiryana", label: "Kiryana", price: 5000 },
  { id: "sugar", label: "Sugarcane/Sugar", price: 3000 },
  { id: "fruits", label: "Fruits", price: 5000 },
  { id: "vegetables", label: "Vegetable", price: 5000 },
  { id: "dryfruit", label: "Dry Fruit", price: 3000 },
  { id: "herbs", label: "Herbs", price: 3000 },
]

// Rep products in the specified order with updated labels
const REP_PRODUCTS = [
  { id: "wheat", label: "Wheat" },
  { id: "maize", label: "Maize" },
  { id: "sesame", label: "Sesame" },
  { id: "millet", label: "Millet" },
  { id: "cotton", label: "Cotton" },
  { id: "paddy", label: "Paddy" },
  { id: "rice", label: "Rice" },
  { id: "edibleoil", label: "Edible Oil" },
  { id: "fertilizer", label: "Fertilizer" },
  { id: "livestock", label: "Livestock" },
  { id: "livemarket", label: "Live Market" },
  { id: "dates", label: "Dates" },
  { id: "mustard", label: "Mustard" },
  { id: "spices", label: "Spices" },
  { id: "pulses", label: "Pulses" },
  { id: "kiryana", label: "Kiryana" },
  { id: "sugar", label: "Sugar" },
  { id: "fruits", label: "Fruits" },
  { id: "vegetables", label: "Vegetable" },
  { id: "dryfruit", label: "Dry Fruit" },
  { id: "herbs", label: "Herbs" },
]

const REP_PROFESSIONS = [
  "Farmer",
  "Stockist",
  "Broker",
  "Commission Agent",
  "Dealer",
  "Wholesaler",
  "Retailer",
  "Exporter",
  "Importer",
  "Miller",
  "Indenting Agents",
  "Commodity Brokerage House",
  "Commodity Data Provider / Data & Information Company",
  "Other",
]

const LANGUAGES = [
  { code: "en", native: "English", urdu: false },
  { code: "ur", native: "اردو", urdu: true },
  // { code: "pa", native: "پنجابی", urdu: true },
  // { code: "sd", native: "سنڌي", urdu: true },
  // { code: "bl", native: "بلوچی", urdu: true },
  // { code: "ps", native: "پښتو", urdu: true },
  // { code: "sk", native: "سرائیکی", urdu: true, centered: true },
]

const DURATION_MONTHS = [1, 3, 6, 12]
const DURATION_LABELS = ["1 Month", "3 Months", "6 Months", "1 Year"]
const DISCOUNTS = [0, 0.1, 0.15, 0.25]

function calcPricing(selectedIds: string[], durIdx: number) {
  const monthlyTotal = selectedIds.reduce((sum, id) => {
    const p = PRODUCTS.find((x) => x.id === id)
    return sum + (p?.price ?? 0)
  }, 0)
  const months = DURATION_MONTHS[durIdx]
  const discount = DISCOUNTS[durIdx]
  const regularTotal = monthlyTotal * months
  const discountAmt = Math.round(regularTotal * discount)
  const finalTotal = regularTotal - discountAmt
  return {
    monthlyTotal,
    months,
    discount,
    regularTotal,
    discountAmt,
    finalTotal,
  }
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Progress({ total, current }: { total: number; current: number }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 5,
        justifyContent: "center",
        marginBottom: 18,
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`progress-dot${i === current ? " active" : ""}`}
        />
      ))}
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "14px 0",
      }}
    >
      <div style={{ flex: 1, height: 1, background: "var(--zm-border)" }} />
      <span
        style={{
          fontSize: 11.5,
          color: "var(--zm-muted)",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--zm-border)" }} />
    </div>
  )
}

function TermsToggle({
  agreed,
  onChange,
}: {
  agreed: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        margin: "6px 0 14px",
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={() => onChange(!agreed)}
    >
      <div
        className={`toggle-track${agreed ? " on" : ""}`}
        style={{ marginTop: 2, flexShrink: 0 }}
      >
        <div className="toggle-thumb" />
      </div>
      <span
        style={{
          fontSize: 12.5,
          color: "var(--zm-muted)",
          lineHeight: 1.5,
          flex: 1,
        }}
      >
        I agree to the{" "}
        <span
          style={{
            color: "var(--zm-green)",
            fontWeight: 600,
            textDecoration: "underline",
          }}
          onClick={(e) => {
            e.stopPropagation()
            onChange(!agreed)
          }}
        >
          Terms &amp; Conditions
        </span>{" "}
        and{" "}
        <span
          style={{
            color: "var(--zm-green)",
            fontWeight: 600,
            textDecoration: "underline",
          }}
          onClick={(e) => {
            e.stopPropagation()
            onChange(!agreed)
          }}
        >
          Privacy Policy
        </span>
      </span>
    </div>
  )
}

const SocialIcon = {
  google: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
    </svg>
  ),
}

// ─── Screen 1 – Language ──────────────────────────────────────────────────────
function LangScreen({ onNext }: { onNext: () => void }) {
  return (
    <div
      className="screen-scroll s-enter"
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "52px 20px 32px",
        gap: 28,
      }}
    >
      <img
        src={logoImg}
        alt="Zarai Mandi"
        className="logo-anim"
        style={{ height: 80 }}
      />
      <div style={{ textAlign: "center" }}>
        <div className="headline" style={{ textAlign: "center", fontSize: 22 }}>
          Choose Language
        </div>
        <div
          style={{
            fontFamily: "'Noto Nastaliq Urdu', serif",
            fontSize: 15,
            color: "var(--zm-muted)",
            marginTop: 4,
          }}
        >
          زبان منتخب کریں
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          width: "100%",
          maxWidth: 320,
        }}
      >
        {LANGUAGES.map((lng) => (
          <button
            key={lng.code}
            className={`lang-btn${lng.urdu ? " regional" : ""}`}
            onClick={onNext}
            style={
              (lng as any).centered
                ? {
                  gridColumn: "1 / -1",
                  justifySelf: "center",
                  width: "calc(50% - 5px)",
                }
                : { width: "100%" }
            }
          >
            <span className="btn-txt">{lng.native}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Screen 2 – Who Are You? (simplified — no descriptions, no sub-options) ──
function RoleScreen({
  initialRole,
  onNext,
  onBack,
  onSignIn,
}: {
  initialRole?: Role
  onNext: (role: Role) => void
  onBack: () => void
  onSignIn?: () => void
}) {
  const [role, setRole] = useState<Role | "">(initialRole || "")

  const roles: { id: Role; label: string }[] = [
    { id: "customer", label: "Customer" },
    { id: "representative", label: "Representative" },
  ]

  return (
    <div
      className="screen-scroll s-enter"
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "72px 20px 32px",
      }}
    >
      <div className="auth-card">
        <Progress total={2} current={0} />
        <div className="eyebrow">Step 1 of 2</div>
        <div className="headline">Who are you?</div>
        <div className="subline">
          Select your role to personalise Zarai Mandi.
        </div>

        <div className="radio-group-container" style={{ marginBottom: 8 }}>
          {roles.map((r) => (
            <label key={r.id} className="radio-label">
              <input
                type="radio"
                name="role"
                value={r.id}
                className="radio-input"
                checked={role === r.id}
                onChange={() => setRole(r.id)}
              />
              <span className="radio-custom" />
              <span className="radio-text">{r.label}</span>
            </label>
          ))}
        </div>

        <button
          className="btn-primary"
          disabled={!role}
          onClick={() => onNext(role as Role)}
        >
          Continue →
        </button>

        {onSignIn && (
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <span style={{ fontSize: 13, color: "var(--zm-muted)" }}>
              Already have an account?{" "}
            </span>
            <button
              type="button"
              onClick={onSignIn}
              style={{
                background: "none",
                border: "none",
                color: "var(--zm-green)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Sign In
            </button>
          </div>
        )}

        <button
          className="btn-ghost"
          style={{
            margin: "10px auto 0",
            display: "flex",
            fontSize: 14,
            padding: "8px 16px",
          }}
          onClick={onBack}
        >
          ← Change Language / زبان
        </button>
      </div>
    </div>
  )
}

// ─── Shared registration helpers ────────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: "+92", flag: "🇵🇰", country: "Pakistan", digits: 10, hint: "03XX XXXXXXX" },
  { code: "+91", flag: "🇮🇳", country: "India", digits: 10, hint: "XXXXXXXXXX" },
  { code: "+971", flag: "🇦🇪", country: "UAE", digits: 9, hint: "XX XXX XXXX" },
  { code: "+966", flag: "🇸🇦", country: "Saudi Arabia", digits: 9, hint: "XX XXX XXXX" },
  { code: "+44", flag: "🇬🇧", country: "UK", digits: 10, hint: "XXXX XXXXXX" },
  { code: "+1", flag: "🇺🇸", country: "USA / Canada", digits: 10, hint: "XXX XXX XXXX" },
]

// Sample Google accounts for the picker
const GOOGLE_SAMPLE_ACCOUNTS = [
  { email: "ahmed.khan@gmail.com", name: "Ahmed Khan", initials: "AK", color: "#1a73e8" },
  { email: "fatima.ali@gmail.com", name: "Fatima Ali", initials: "FA", color: "#e34c26" },
  { email: "zm.user@gmail.com", name: "ZM User", initials: "ZU", color: "#34a853" },
]

const PROFESSIONS = REP_PROFESSIONS

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

function getPhoneDigits(value: string) {
  return value.replace(/\D/g, "")
}

function normalizePhone(value: string, countryCode: string) {
  const digits = getPhoneDigits(value)
  const trimmed = digits.startsWith("0") ? digits.slice(1) : digits
  return `${countryCode}${trimmed}`
}

function isValidPhone(value: string, countryCode = "+92") {
  const cc = COUNTRY_CODES.find((c) => c.code === countryCode)
  if (!cc) return false
  const digits = getPhoneDigits(value)
  const trimmed = digits.startsWith("0") ? digits.slice(1) : digits
  return trimmed.length === cc.digits
}

// ─── Tabbed contact input: Phone tab + Email tab ──────────────────────────────
type ContactInputTab = "phone" | "email"

function ContactField({
  phoneValue,
  emailValue,
  countryCode,
  tab,
  mode = "register",
  onPhoneChange,
  onEmailChange,
  onCountryChange,
  onTabChange,
  disabled,
}: {
  phoneValue: string
  emailValue: string
  countryCode: string
  tab: ContactInputTab
  mode?: "register" | "signin"
  onPhoneChange: (v: string) => void
  onEmailChange: (v: string) => void
  onCountryChange: (v: string) => void
  onTabChange: (t: ContactInputTab) => void
  disabled?: boolean
}) {
  const cc = COUNTRY_CODES.find((c) => c.code === countryCode) ?? COUNTRY_CODES[0]
  const phoneValid = isValidPhone(phoneValue, countryCode)
  const emailValid = isValidEmail(emailValue)

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Phone input — always shown first, unless email mode */}
      {tab === "phone" && (
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--zm-muted)", marginBottom: 6 }}>
            WhatsApp / Mobile Number *
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <select
                value={countryCode}
                onChange={(e) => onCountryChange(e.target.value)}
                disabled={disabled}
                style={{
                  height: 48,
                  padding: "0 24px 0 10px",
                  border: "1.5px solid var(--zm-border)",
                  borderRadius: 12,
                  background: "var(--zm-surface)",
                  color: "var(--zm-text)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: disabled ? "not-allowed" : "pointer",
                  appearance: "none",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <span style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "var(--zm-muted)", pointerEvents: "none" }}>▾</span>
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                className={`fl-input${phoneValue ? " filled" : ""}`}
                type="tel"
                inputMode="tel"
                placeholder={cc.hint}
                value={phoneValue}
                onChange={(e) => onPhoneChange(e.target.value.replace(/[^\d\s-]/g, ""))}
                disabled={disabled}
                style={{
                  width: "100%",
                  height: 48,
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingLeft: 14,
                  paddingRight: phoneValid ? 38 : 14,
                  border: `1.5px solid ${phoneValue && !phoneValid ? "#e67e22" : phoneValue && phoneValid ? "var(--zm-green)" : "var(--zm-border)"}`,
                  borderRadius: 12,
                  fontSize: 15,
                  letterSpacing: "0.02em",
                  outline: "none",
                  transition: "border-color .15s",
                }}
              />
              {phoneValid && (
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--zm-green)", fontWeight: 800, fontSize: 17 }}>✓</span>
              )}
            </div>
          </div>
          <div style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.5 }}>
            {!phoneValue && <span style={{ color: "var(--zm-muted)" }}>Pakistan: enter 03XX XXXXXXX or just 10 digits</span>}
            {phoneValue && !phoneValid && <span style={{ color: "#b45309" }}>Enter {cc.digits}-digit number for {cc.country} (e.g. {cc.hint})</span>}
            {phoneValid && <span style={{ color: "var(--zm-green)" }}>OTP will be sent via WhatsApp to {normalizePhone(phoneValue, countryCode)}</span>}
          </div>
          {/* Inline link to switch to email */}
          {!disabled && (
            <button
              type="button"
              onClick={() => onTabChange("email")}
              style={{
                marginTop: 12,
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 13,
                color: "var(--zm-green)",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              {mode === "signin" ? "Sign in with Email instead" : "Sign up with Email instead"}
            </button>
          )}
        </div>
      )}

      {/* Email input — shown when tab === "email" */}
      {tab === "email" && (
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--zm-muted)", marginBottom: 6 }}>
            Email Address *
          </div>
          <div style={{ position: "relative" }}>
            <input
              className={`fl-input${emailValue ? " filled" : ""}`}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={emailValue}
              onChange={(e) => onEmailChange(e.target.value)}
              disabled={disabled}
              style={{
                width: "100%",
                height: 48,
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 14,
                paddingRight: emailValid ? 38 : 14,
                border: `1.5px solid ${emailValue && !emailValid ? "#e67e22" : emailValue && emailValid ? "var(--zm-green)" : "var(--zm-border)"}`,
                borderRadius: 12,
                fontSize: 15,
                outline: "none",
                transition: "border-color .15s",
              }}
            />
            {emailValid && (
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--zm-green)", fontWeight: 800, fontSize: 17 }}>✓</span>
            )}
          </div>
          {emailValue && !emailValid && <div style={{ fontSize: 11.5, color: "#b45309", marginTop: 6 }}>Enter a valid email (e.g. name@gmail.com)</div>}
          {emailValid && <div style={{ fontSize: 11.5, color: "var(--zm-green)", marginTop: 6 }}>OTP will be sent to {emailValue.trim()}</div>}
          {/* Link back to phone */}
          {!disabled && (
            <button
              type="button"
              onClick={() => onTabChange("phone")}
              style={{
                marginTop: 12,
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 13,
                color: "var(--zm-green)",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              {mode === "signin" ? "Sign in with Mobile Number instead" : "Sign up with Phone instead"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function OtpBoxes({ onVerified, sentTo }: { onVerified: () => void; sentTo: string }) {
  const [vals, setVals] = useState(["", "", "", "", "", ""])
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null))

  useEffect(() => {
    refs[0].current?.focus()
  }, [])

  function handleChange(i: number, v: string) {
    const digits = v.replace(/\D/g, "")
    if (!digits) return
    const next = [...vals]
    digits.split("").slice(0, 6 - i).forEach((d, offset) => { next[i + offset] = d })
    setVals(next)
    refs[Math.min(i + digits.length, 5)].current?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (vals[i]) {
        const next = [...vals]; next[i] = ""; setVals(next)
      } else if (i > 0) {
        const next = [...vals]; next[i - 1] = ""; setVals(next)
        refs[i - 1].current?.focus()
      }
    }
  }

  const allFilled = vals.every(Boolean)

  return (
    <>
      {sentTo && (
        <div style={{ background: "var(--zm-light)", borderRadius: 10, padding: "10px 12px", fontSize: 12.5, color: "var(--zm-dark)", textAlign: "center", marginBottom: 14, lineHeight: 1.5 }}>
          6-digit OTP sent to <strong>{sentTo}</strong>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "4px 0 14px" }}>
        {refs.map((r, i) => (
          <input
            key={i} ref={r}
            className={`otp-box${vals[i] ? " filled" : ""}`}
            type="tel" inputMode="numeric" maxLength={1}
            value={vals[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
          />
        ))}
      </div>
      <button className="btn-primary" disabled={!allFilled} onClick={onVerified}>Verify OTP →</button>
    </>
  )
}

function ProfileFields({
  name, setName, profession, setProfession, location, setLocation, showLocation,
}: {
  name: string; setName: (v: string) => void
  profession: string; setProfession: (v: string) => void
  location: string; setLocation: (v: string) => void
  showLocation: boolean
}) {
  const [professionSearch, setProfessionSearch] = useState("")
  const [professionOpen, setProfessionOpen] = useState(false)
  const [locationSearch, setLocationSearch] = useState("")
  const [locationOpen, setLocationOpen] = useState(false)
  const filteredProfessions = PROFESSIONS.filter((p) => p.toLowerCase().includes(professionSearch.toLowerCase()))
  const filteredLocations = CITIES.filter((c) => `${c.city} ${c.district} ${c.province}`.toLowerCase().includes(locationSearch.toLowerCase()))

  return (
    <>
      <div className="field">
        <div className="role-sub-label">Name *</div>
        <input
          className="profile-input"
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field">
        <div className="role-sub-label">Profession <span style={{ fontSize: 11, fontWeight: "normal", color: "var(--zm-muted)", textTransform: "none", letterSpacing: "normal" }}>(Optional)</span></div>
        <button type="button" className="profile-select" onClick={() => setProfessionOpen((v) => !v)}>
          <span style={{ color: profession ? "var(--zm-text)" : "var(--zm-muted)" }}>{profession || "Select profession (optional)"}</span>
          <span>⌄</span>
        </button>
        {professionOpen && (
          <div className="dropdown-panel">
            <input className="dropdown-search" placeholder="Search profession…" value={professionSearch} onChange={(e) => setProfessionSearch(e.target.value)} autoFocus />
            <div className="dropdown-list">
              {filteredProfessions.map((p) => (
                <div key={p} className={`occ-option${profession === p ? " selected" : ""}`} onClick={() => { setProfession(p); setProfessionOpen(false) }}>
                  <span className="occ-dot" />
                  <span>{p}</span>
                </div>
              ))}
              {!filteredProfessions.length && <div className="dropdown-empty">No professions found</div>}
            </div>
          </div>
        )}
      </div>
      {showLocation && (
        <div className="field">
          <div className="role-sub-label">Location *</div>
          <button type="button" className="profile-select" onClick={() => setLocationOpen((v) => !v)}>
            <span style={{ color: location ? "var(--zm-text)" : "var(--zm-muted)" }}>{location || "Select location"}</span>
            <span>⌄</span>
          </button>
          {locationOpen && (
            <div className="dropdown-panel">
              <input className="dropdown-search" placeholder="Search city, district or province…" value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} autoFocus />
              <div className="dropdown-list">
                {filteredLocations.map((c) => (
                  <div key={`${c.city}-${c.province}`} className={`occ-option${location === c.city ? " selected" : ""}`} onClick={() => { setLocation(c.city); setLocationOpen(false) }}>
                    <span className="occ-dot" />
                    <div>
                      <div>{c.city}</div>
                      <span style={{ fontSize: 11, color: "var(--zm-muted)" }}>{c.district}, {c.province}</span>
                    </div>
                  </div>
                ))}
                {!filteredLocations.length && <div className="dropdown-empty">No locations found</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ─── Screen 3 – Registration / Sign In / OTP / Profile ────────────────────────
function AccountScreen({
  role,
  mode = "register",
  onNext,
  onBack,
  onSwitchMode,
}: {
  role: Role
  mode?: "register" | "signin"
  onNext: (data: { name: string; contact: string; location: string; profession: string }) => void
  onBack: () => void
  onSwitchMode?: (mode: "register" | "signin") => void
}) {
  const [tab, setTab] = useState<ContactInputTab>("phone")
  const [phoneValue, setPhoneValue] = useState("")
  const [emailValue, setEmailValue] = useState("")
  const [countryCode, setCountryCode] = useState("+92")
  const [otpSent, setOtpSent] = useState(false)
  const [verified, setVerified] = useState(false)
  const [name, setName] = useState("")
  const [profession, setProfession] = useState("")
  const [location, setLocation] = useState("")
  const [agreedTerms, setAgreedTerms] = useState(true)

  // Google picker state
  const [googleStage, setGoogleStage] = useState<"closed" | "picker" | "consent">("closed")
  const [pickedAccount, setPickedAccount] = useState<typeof GOOGLE_SAMPLE_ACCOUNTS[0] | null>(null)
  const [customEmail, setCustomEmail] = useState("")
  const [customEmailErr, setCustomEmailErr] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)

  const isSignIn = mode === "signin"
  const phoneValid = isValidPhone(phoneValue, countryCode)
  const emailValid = isValidEmail(emailValue)
  const currentValid = tab === "phone" ? phoneValid : emailValid

  // What gets shown in the OTP banner and stored as contact
  const contactDisplay = tab === "phone"
    ? normalizePhone(phoneValue, countryCode)
    : emailValue.trim()

  // For customer: only Name is compulsory. For representative: Name and Location are compulsory.
  const profileComplete = name.trim().length >= 1 && (role === "customer" || location.trim().length >= 1) && agreedTerms

  function nameFromEmail(email: string) {
    return (email.split("@")[0] || "Google User")
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || "Google User"
  }

  function handlePhoneChange(v: string) {
    setPhoneValue(v)
    // Autofill WhatsApp profile name if user hasn't typed a custom name yet
    const digits = v.replace(/\D/g, "")
    if (!name || name === "Ahmed Khan" || name === "Muhammad Arif") {
      if (digits.length >= 7) {
        setName("Ahmed Khan")
      }
    }
  }

  function handleSendOtp() {
    if (tab === "phone" && !name) {
      setName("Ahmed Khan")
    }
    setOtpSent(true)
  }

  function handleVerified() {
    setVerified(true)
    if (!name) {
      setName(tab === "phone" ? "Ahmed Khan" : "Muhammad Arif")
    }
    if (isSignIn) {
      // In sign in mode, verifying OTP completes sign in directly
      onNext({
        name: name.trim() || (pickedAccount?.name || (tab === "phone" ? "Ahmed Khan" : "Muhammad Arif")),
        contact: contactDisplay || "0300 1234567",
        location: location || "Pakpattan",
        profession,
      })
    }
  }

  function handleChangeContact() {
    setOtpSent(false)
  }

  // Google picker helpers
  function openGoogle() {
    setShowCustomInput(false)
    setCustomEmail("")
    setCustomEmailErr("")
    setGoogleStage("picker")
  }

  function pickAccount(acc: typeof GOOGLE_SAMPLE_ACCOUNTS[0]) {
    setPickedAccount(acc)
    setGoogleStage("consent")
  }

  function handleCustomEmailSubmit() {
    const v = customEmail.trim().toLowerCase()
    if (!isValidEmail(v)) { setCustomEmailErr("Enter a valid email address"); return }
    const synthetic = { email: v, name: nameFromEmail(v), initials: nameFromEmail(v).slice(0, 2).toUpperCase(), color: "#1a73e8" }
    pickAccount(synthetic)
  }

  function agreeToGoogle() {
    if (!pickedAccount) return
    setEmailValue(pickedAccount.email)
    setName(pickedAccount.name)
    setTab("email")
    setOtpSent(false)
    setVerified(true)
    setGoogleStage("closed")
    if (isSignIn) {
      onNext({
        name: pickedAccount.name || "Muhammad Arif",
        contact: pickedAccount.email,
        location: "Pakpattan",
        profession: "",
      })
    }
  }

  return (
    <div className="screen-scroll s-enter" style={{ alignItems: "center", justifyContent: "center", padding: "55px 16px 32px" }}>
      <div className="auth-card" style={{ maxHeight: "none" }}>
        <Progress total={2} current={1} />
        <div className="eyebrow">
          {isSignIn ? "Welcome Back" : "Step 2 of 2"}
        </div>
        <div className="headline">
          {isSignIn
            ? "Sign In"
            : role === "customer"
              ? "Customer Registration"
              : "Representative Registration"}
        </div>
        <div className="subline">
          {!otpSent && !verified
            ? (isSignIn ? "Sign in with your mobile number or email to access your account." : "How would you like to sign up?")
            : otpSent && !verified
              ? "Enter the OTP we sent you."
              : "Complete your profile to continue."}
        </div>

        {/* ── Step 1: contact entry ── */}
        {!verified && !otpSent && (
          <>
            <ContactField
              phoneValue={phoneValue}
              emailValue={emailValue}
              countryCode={countryCode}
              tab={tab}
              mode={mode}
              onPhoneChange={handlePhoneChange}
              onEmailChange={setEmailValue}
              onCountryChange={setCountryCode}
              onTabChange={setTab}
            />
            <button
              className="btn-primary"
              disabled={!currentValid}
              onClick={handleSendOtp}
            >
              Send {tab === "email" ? "Email" : "WhatsApp"} OTP →
            </button>

            <Divider label="or" />

            <button type="button" className="google-signup-btn" onClick={openGoogle}>
              {SocialIcon.google}
              <span>{isSignIn ? "Sign in with Google" : "Continue with Google"}</span>
            </button>

            {/* Switch between Sign In and Register */}
            <div style={{ textAlign: "center", marginTop: 18 }}>
              <span style={{ fontSize: 13, color: "var(--zm-muted)" }}>
                {isSignIn ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={() => onSwitchMode?.(isSignIn ? "register" : "signin")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--zm-green)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                {isSignIn ? "Register / Sign Up" : "Sign In"}
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: OTP entry ── */}
        {!verified && otpSent && (
          <>
            <OtpBoxes onVerified={handleVerified} sentTo={contactDisplay} />
            <button
              className="btn-ghost"
              style={{ margin: "10px auto 0", display: "flex", fontSize: 13 }}
              onClick={handleChangeContact}
            >
              ← Change {tab === "phone" ? "number" : "email"}
            </button>
          </>
        )}

        {/* ── Step 3: profile fields (Registration only) ── */}
        {verified && !isSignIn && (
          <>
            <ProfileFields
              name={name} setName={setName}
              profession={profession} setProfession={setProfession}
              location={location} setLocation={setLocation}
              showLocation={role === "representative"}
            />
            <TermsToggle agreed={agreedTerms} onChange={setAgreedTerms} />
            <button
              className="btn-primary"
              disabled={!profileComplete}
              onClick={() => {
                onNext({
                  name: name.trim() || (pickedAccount?.name || (tab === "phone" ? "Ahmed Khan" : "Muhammad Arif")),
                  contact: contactDisplay || (pickedAccount?.email || "0300 1234567"),
                  location,
                  profession,
                })
              }}
            >
              Continue to Zarai Mandi →
            </button>
          </>
        )}

        <button
          className="btn-ghost"
          style={{ margin: "10px auto 0", display: "flex", fontSize: 14, padding: "8px 16px" }}
          onClick={onBack}
        >
          ← Back
        </button>
      </div>

      {/* ── Google account picker / consent modal ── */}
      {googleStage !== "closed" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={googleStage === "picker" ? "Choose a Google account" : "Sign in with Google"}
          onClick={(e) => { if (e.target === e.currentTarget) setGoogleStage("closed") }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.38)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px", fontFamily: "Arial, sans-serif",
          }}
        >
          {/* ── Picker ── */}
          {googleStage === "picker" && (
            <div style={{
              width: "100%", maxWidth: 400, background: "#fff",
              borderRadius: 12, boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
              overflow: "hidden", color: "#202124",
            }}>
              {/* Header */}
              <div style={{ padding: "22px 22px 10px", textAlign: "center" }}>
                {SocialIcon.google}
                <div style={{ fontSize: 17, fontWeight: 500, marginTop: 10 }}>Choose an account</div>
                <div style={{ fontSize: 13, color: "#5f6368", marginTop: 2 }}>to continue to <strong>Zarai Mandi</strong></div>
              </div>
              <div style={{ borderTop: "1px solid #e8eaed" }}>
                {/* Sample accounts */}
                {GOOGLE_SAMPLE_ACCOUNTS.map((acc, idx) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => pickAccount(acc)}
                    style={{
                      width: "100%", border: 0,
                      borderBottom: idx < GOOGLE_SAMPLE_ACCOUNTS.length - 1 ? "1px solid #f1f3f4" : "none",
                      background: "#fff", padding: "12px 20px",
                      display: "flex", alignItems: "center", gap: 14,
                      textAlign: "left", cursor: "pointer", fontFamily: "Arial, sans-serif",
                      transition: "background .12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                  >
                    <span style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: acc.color, color: "#fff",
                      display: "grid", placeItems: "center",
                      fontWeight: 700, fontSize: 14, flexShrink: 0,
                    }}>{acc.initials}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#202124" }}>{acc.name}</span>
                      <span style={{ display: "block", fontSize: 12, color: "#5f6368", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{acc.email}</span>
                    </span>
                    <span style={{ color: "#80868b", fontSize: 18 }}>›</span>
                  </button>
                ))}
                <div style={{ borderTop: "1px solid #e8eaed" }}>
                  {/* Use another account */}
                  {!showCustomInput ? (
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(true)}
                      style={{
                        width: "100%", border: 0, background: "#fff",
                        padding: "14px 20px", display: "flex", alignItems: "center",
                        gap: 14, textAlign: "left", cursor: "pointer",
                        color: "#3c4043", fontSize: 14, fontFamily: "Arial, sans-serif",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                    >
                      <span style={{
                        width: 38, height: 38, borderRadius: "50%",
                        border: "2px solid #dadce0", display: "grid",
                        placeItems: "center", fontSize: 22, color: "#5f6368",
                      }}>+</span>
                      <span>Use another account</span>
                    </button>
                  ) : (
                    <div style={{ padding: "12px 20px 16px" }}>
                      <input
                        autoFocus
                        type="email"
                        placeholder="Enter Google email"
                        value={customEmail}
                        onChange={(e) => { setCustomEmail(e.target.value); setCustomEmailErr("") }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleCustomEmailSubmit() }}
                        style={{
                          width: "100%", boxSizing: "border-box",
                          border: customEmailErr ? "1.5px solid #d93025" : "1.5px solid #dadce0",
                          borderRadius: 6, padding: "10px 12px",
                          fontSize: 14, color: "#202124", outline: "none",
                          fontFamily: "Arial, sans-serif",
                        }}
                      />
                      {customEmailErr && <div style={{ fontSize: 12, color: "#d93025", marginTop: 4 }}>{customEmailErr}</div>}
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => { setShowCustomInput(false); setCustomEmail(""); setCustomEmailErr("") }}
                          style={{ border: 0, background: "transparent", color: "#1a73e8", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: "8px 10px", fontFamily: "Arial, sans-serif" }}
                        >Cancel</button>
                        <button
                          type="button"
                          onClick={handleCustomEmailSubmit}
                          style={{ border: 0, borderRadius: 4, background: "#1a73e8", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: "8px 14px", fontFamily: "Arial, sans-serif" }}
                        >Next</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: "10px 20px", background: "#f8f9fa", borderTop: "1px solid #e8eaed", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setGoogleStage("closed")}
                  style={{ border: 0, background: "transparent", color: "#1a73e8", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: "6px 0", fontFamily: "Arial, sans-serif" }}
                >Cancel</button>
              </div>
            </div>
          )}

          {/* ── Consent ── */}
          {googleStage === "consent" && pickedAccount && (
            <div style={{
              width: "100%", maxWidth: 380, background: "#fff",
              borderRadius: 12, boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
              padding: "28px 24px 20px", color: "#202124",
            }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                {SocialIcon.google}
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>Sign in with Google</div>
              </div>
              {/* Account chip */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                border: "1px solid #dadce0", borderRadius: 24,
                padding: "8px 14px", marginBottom: 20, width: "fit-content", maxWidth: "100%",
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: pickedAccount.color, color: "#fff",
                  display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}>{pickedAccount.initials}</span>
                <span style={{ fontSize: 13, color: "#3c4043", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {pickedAccount.name} · {pickedAccount.email}
                </span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#3c4043", margin: "0 0 12px" }}>
                By continuing, Google will share your <strong>name</strong>, <strong>email</strong>, and <strong>profile picture</strong> with Zarai Mandi.
              </p>
              <p style={{ fontSize: 12, color: "#5f6368", margin: "0 0 24px", lineHeight: 1.5 }}>
                You can manage Sign in with Google in your Google Account settings.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setGoogleStage("picker")}
                  style={{ border: 0, background: "transparent", color: "#1a73e8", fontWeight: 600, cursor: "pointer", padding: "10px 12px", fontSize: 13.5, fontFamily: "Arial, sans-serif" }}
                >Cancel</button>
                <button
                  type="button"
                  onClick={agreeToGoogle}
                  style={{ border: 0, borderRadius: 6, background: "#1a73e8", color: "#fff", fontWeight: 600, cursor: "pointer", padding: "10px 18px", fontSize: 13.5, fontFamily: "Arial, sans-serif" }}
                >Agree and continue</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Screen 5 – Product Interests ────────────────────────────────────────────
function InterestsScreen({
  onNext,
  onBack,
}: {
  onNext: (prods: string[]) => void
  onBack: () => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState("")

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const filtered = PRODUCTS.filter((p) =>
    p.label.toLowerCase().includes(search.toLowerCase()),
  )
  const selectedItems = PRODUCTS.filter((p) => selected.includes(p.id))
  const monthlyTotal = selected.reduce(
    (s, id) => s + (PRODUCTS.find((p) => p.id === id)?.price ?? 0),
    0,
  )

  return (
    <div
      className="screen-scroll s-enter"
      style={{ alignItems: "center", padding: "32px 16px 35px" }}
    >
      <div className="auth-card" style={{ maxHeight: "none" }}>
        <Progress total={6} current={3} />
        <div className="eyebrow">Step 4 of 6</div>
        <div className="headline">What are you interested in?</div>
        <div className="subline">Select your favorite products</div>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            className="fl-input filled"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            style={{ paddingTop: 13, paddingBottom: 13 }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            marginBottom: 14,
            maxHeight: 340,
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
        >
          {filtered.map((p) => (
            <div
              key={p.id}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => toggle(p.id)}
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  border: selected.includes(p.id)
                    ? "2.5px solid var(--zm-green)"
                    : "2px solid var(--zm-border)",
                  background: selected.includes(p.id)
                    ? "var(--zm-light)"
                    : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 8,
                  transition: "border-color 0.18s, background 0.18s",
                  flexShrink: 0,
                }}
              >
                <img
                  src={ICONS[p.id]}
                  alt={p.label}
                  style={{ width: "80%", height: "80%", objectFit: "contain" }}
                />
              </button>
              {selected.includes(p.id) && (
                <div className="item-check" style={{ top: 0, right: "8%" }}>
                  ✓
                </div>
              )}
              <span
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  fontWeight: selected.includes(p.id) ? 700 : 500,
                  color: selected.includes(p.id)
                    ? "var(--zm-dark)"
                    : "var(--zm-muted)",
                  textAlign: "center",
                  lineHeight: 1.2,
                  maxWidth: 62,
                }}
              >
                {p.label}
              </span>
            </div>
          ))}
        </div>

        {selectedItems.length > 0 && (
          <div
            style={{
              background: "var(--zm-light)",
              borderRadius: 14,
              border: "1px solid rgba(15,138,95,0.18)",
              padding: "12px 14px",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--zm-gold)",
                  fontWeight: 700,
                }}
              >
                Your Selection ({selectedItems.length})
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--zm-dark)",
                }}
              >
                PKR {monthlyTotal.toLocaleString()}/mo
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {selectedItems.map((p) => (
                <div
                  key={p.id}
                  className="sel-tag"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <img
                    src={ICONS[p.id]}
                    alt=""
                    style={{ width: 24, height: 24, objectFit: "contain" }}
                  />
                  {p.label}
                  <button onClick={() => toggle(p.id)}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="btn-primary"
          disabled={selected.length === 0}
          onClick={() => onNext(selected)}
        >
          Continue →
        </button>
        <button
          className="btn-ghost"
          style={{
            margin: "10px auto 0",
            display: "flex",
            fontSize: 14,
            padding: "8px 16px",
          }}
          onClick={onBack}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}

// ─── Screen 6 – Location ──────────────────────────────────────────────────────
function LocationScreen({
  onNext,
  onBack,
}: {
  onNext: (city: string, district: string, province: string) => void
  onBack: () => void
}) {
  const [selectedProvince, setSelectedProvince] = useState("")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<typeof CITIES[0] | null>(null)

  const citiesInProvince = selectedProvince
    ? CITIES.filter((c) => c.province === selectedProvince)
    : CITIES
  const filtered = citiesInProvince.filter((c) =>
    c.city.toLowerCase().includes(search.toLowerCase()),
  )

  function handleSelect(c: typeof CITIES[0]) {
    setSelected(c)
    onNext(c.city, c.district, c.province)
  }

  return (
    <div
      className="screen-scroll s-enter"
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "55px 20px",
      }}
    >
      <div className="auth-card">
        <Progress total={6} current={4} />
        <div className="eyebrow">Step 5 of 6</div>
        <div className="headline">Where are your markets?</div>
        <div className="subline">
          Select your province and city. District is identified automatically.
        </div>

        <button
          onClick={() =>
            handleSelect({
              city: "Lahore",
              district: "Lahore",
              province: "Punjab",
            })
          }
          style={{
            width: "100%",
            padding: "13px 16px",
            border: "1.5px solid var(--zm-border)",
            borderRadius: 14,
            background: "white",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            marginBottom: 14,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--zm-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              flexShrink: 0,
            }}
          >
            📍
          </div>
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--zm-text)",
              }}
            >
              Use My Current Location
            </div>
            <div
              style={{ fontSize: 11.5, color: "var(--zm-muted)", marginTop: 1 }}
            >
              Detect automatically via GPS
            </div>
          </div>
        </button>

        <Divider label="or select manually" />

        <div className="role-sub-label" style={{ marginBottom: 6 }}>
          Province
        </div>
        <div
          className="occ-scroll-box"
          style={{ maxHeight: 150, marginBottom: 14 }}
        >
          {PROVINCES.map((prov) => (
            <div
              key={prov}
              className={`occ-option${selectedProvince === prov ? " selected" : ""
                }`}
              onClick={() => {
                setSelectedProvince(prov)
                setSelected(null)
                setSearch("")
              }}
            >
              <span className="occ-dot" />
              <span
                style={{ fontWeight: selectedProvince === prov ? 700 : 500 }}
              >
                {prov}
              </span>
            </div>
          ))}
        </div>

        {selectedProvince && (
          <>
            <div className="role-sub-label" style={{ marginBottom: 6 }}>
              City
            </div>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <input
                className="fl-input filled"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city…"
                style={{ paddingTop: 13, paddingBottom: 13 }}
              />
            </div>
            <div className="occ-scroll-box" style={{ maxHeight: 200 }}>
              {filtered.map((c) => (
                <div
                  key={`${c.city}-${c.province}`}
                  className={`occ-option${selected?.city === c.city ? " selected" : ""
                    }`}
                  onClick={() => handleSelect(c)}
                >
                  <span className="occ-dot" />
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontWeight: selected?.city === c.city ? 700 : 500,
                      }}
                    >
                      {c.city}
                    </span>
                    {c.district !== c.city && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--zm-muted)",
                          marginLeft: 6,
                          opacity: 0.7,
                        }}
                      >
                        {c.district}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--zm-muted)",
                  }}
                >
                  No cities found
                </div>
              )}
            </div>
          </>
        )}

        <button
          className="btn-ghost"
          style={{
            margin: "14px auto 0",
            display: "flex",
            fontSize: 14,
            padding: "8px 16px",
          }}
          onClick={onBack}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}

// ─── Screen 7 – Subscription ──────────────────────────────────────────────────
function SubscriptionScreen({
  products,
  city,
  province,
  onTrial,
  onPay,
  onBack,
}: {
  products: string[]
  city: string
  province: string
  onTrial: () => void
  onPay: (amount: number, dur: number) => void
  onBack: () => void
}) {
  const [dur, setDur] = useState(0)
  const [customMode, setCustomMode] = useState(false)
  const [customMonths, setCustomMonths] = useState<number | null>(null)

  const selectedItems = PRODUCTS.filter((p) => products.includes(p.id))
  const monthlyTotal = products.reduce((sum, id) => {
    const p = PRODUCTS.find((x) => x.id === id)
    return sum + (p?.price ?? 0)
  }, 0)

  // Custom discount tiers
  function getCustomDiscount(months: number): number {
    if (months === 2) return 0.05
    if (months === 4 || months === 5) return 0.125
    if (months === 7 || months === 8) return 0.175
    if (months === 9 || months === 10 || months === 11) return 0.20
    return 0
  }

  function getCustomDiscountLabel(months: number): string {
    if (months === 2) return "5% off"
    if (months === 4 || months === 5) return "12.5% off"
    if (months === 7 || months === 8) return "17.5% off"
    if (months === 9 || months === 10 || months === 11) return "20% off"
    return ""
  }

  // Pricing for standard tabs
  const { months, discount, regularTotal, discountAmt, finalTotal } =
    customMode
      ? (() => {
        const m = customMonths ?? 1
        const d = getCustomDiscount(m)
        const reg = monthlyTotal * m
        const da = Math.round(reg * d)
        return { months: m, discount: d, regularTotal: reg, discountAmt: da, finalTotal: reg - da }
      })()
      : calcPricing(products, dur)

  const CUSTOM_MONTH_OPTIONS = [2, 4, 5, 7, 8, 9, 10, 11]

  return (
    <div
      className="screen-scroll s-enter"
      style={{ alignItems: "center", padding: "36px 16px 32px" }}
    >
      <div className="auth-card" style={{ maxHeight: "none" }}>
        <Progress total={6} current={5} />
        <div className="eyebrow">Step 6 of 6</div>
        <div className="headline">Choose your ZM plan</div>
        <div className="subline">Prices are based on your selected products.</div>

        {/* ── Duration tabs row 1: standard 4 options ── */}
        <div
          style={{
            display: "flex",
            background: "rgba(15,138,95,0.07)",
            borderRadius: 12,
            padding: 4,
            gap: 3,
            marginBottom: 8,
          }}
        >
          {DURATION_LABELS.map((d, i) => (
            <button
              key={d}
              className={`dur-tab${!customMode && dur === i ? " active" : ""}`}
              onClick={() => { setCustomMode(false); setDur(i); setCustomMonths(null) }}
            >
              {d}
            </button>
          ))}
        </div>

        {/* ── Customize button ── */}
        <button
          onClick={() => { setCustomMode(true); setCustomMonths(null) }}
          style={{
            width: "100%",
            padding: "11px 14px",
            borderRadius: 12,
            border: customMode
              ? "2px solid var(--zm-green)"
              : "1.5px dashed var(--zm-border)",
            background: customMode ? "var(--zm-light)" : "#fff",
            color: customMode ? "var(--zm-green)" : "var(--zm-muted)",
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            marginBottom: 16,
            transition: "border-color 0.15s, background 0.15s, color 0.15s",
          }}
        >
          <span style={{ fontSize: 15 }}>✦</span>
          Customize my own plan
        </button>

        {/* ── Custom month picker ── */}
        {customMode && (
          <div
            style={{
              border: "1.5px solid var(--zm-border)",
              borderRadius: 14,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            {[
              { label: "2 months", months: [2], discount: "5% off", disc: 0.05 },
              { label: "4 – 5 months", months: [4, 5], discount: "12.5% off", disc: 0.125 },
              { label: "7 – 8 months", months: [7, 8], discount: "17.5% off", disc: 0.175 },
              { label: "9 – 11 months", months: [9, 10, 11], discount: "20% off", disc: 0.20 },
            ].map((tier, ti) => {
              const tierSelected = customMonths !== null && tier.months.includes(customMonths)
              return (
                <div
                  key={ti}
                  style={{
                    borderBottom: ti < 3 ? "1px solid var(--zm-border)" : "none",
                    background: tierSelected ? "var(--zm-light)" : "#fff",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Tier header row — always visible, clickable */}
                  <div
                    onClick={() => {
                      // If single-month tier, select immediately; else pick first
                      if (tier.months.length === 1) {
                        setCustomMonths(tier.months[0])
                      } else {
                        setCustomMonths(tierSelected ? customMonths : tier.months[0])
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "13px 16px",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* Radio circle */}
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: `2px solid ${tierSelected ? "var(--zm-green)" : "var(--zm-border)"}`,
                          flexShrink: 0,
                          position: "relative",
                          transition: "border-color 0.15s",
                        }}
                      >
                        {tierSelected && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 3,
                              borderRadius: "50%",
                              background: "var(--zm-green)",
                            }}
                          />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: tierSelected ? 700 : 500,
                          color: tierSelected ? "var(--zm-dark)" : "var(--zm-muted)",
                        }}
                      >
                        {tier.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#16A34A",
                        background: "rgba(22,163,74,0.10)",
                        borderRadius: 20,
                        padding: "3px 10px",
                      }}
                    >
                      {tier.discount}
                    </span>
                  </div>

                  {/* Month chips — only when this tier is selected AND has multiple months */}
                  {tierSelected && tier.months.length > 1 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 7,
                        padding: "0 16px 13px",
                      }}
                    >
                      {tier.months.map((m) => (
                        <button
                          key={m}
                          onClick={() => setCustomMonths(m)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: customMonths === m
                              ? "2px solid var(--zm-green)"
                              : "1.5px solid var(--zm-border)",
                            background: customMonths === m ? "var(--zm-green)" : "#fff",
                            color: customMonths === m ? "#fff" : "var(--zm-muted)",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                            transition: "all 0.12s",
                          }}
                        >
                          {m} mo
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Pricing breakdown — only show when month is determined ── */}
        {(!customMode || customMonths !== null) && (
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1.4px solid var(--zm-border)",
              marginBottom: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 16px 6px",
                borderBottom: "1px solid var(--zm-border)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--zm-gold)",
                  fontWeight: 700,
                }}
              >
                Product Pricing
              </div>
            </div>
            <div
              style={{ maxHeight: 140, overflowY: "auto", scrollbarWidth: "thin" }}
              className="thin-scroll"
            >
              {selectedItems.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 16px",
                    borderBottom:
                      i < selectedItems.length - 1
                        ? "1px solid rgba(15,138,95,0.06)"
                        : "none",
                    fontSize: 12.5,
                    color: "var(--zm-muted)",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <img src={ICONS[p.id]} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
                    {p.label}
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--zm-dark)" }}>
                    PKR {p.price.toLocaleString()}/mo
                  </span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1.5px solid rgba(15,138,95,0.1)", background: "var(--zm-light)" }}>
              <div className="price-row" style={{ padding: "10px 16px" }}>
                <span>Total/mo × {months} month{months > 1 ? "s" : ""}</span>
                <span>PKR {regularTotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="price-row" style={{ padding: "8px 16px", color: "#16A34A" }}>
                  <span style={{ fontWeight: 600 }}>
                    Discount ({discount === 0.125 ? "12.5" : discount === 0.175 ? "17.5" : Math.round(discount * 100)}% off)
                  </span>
                  <span style={{ fontWeight: 700 }}>− PKR {discountAmt.toLocaleString()}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderTop: "1px solid rgba(15,138,95,0.1)",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--zm-dark)" }}>Your Price</span>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 22,
                      fontWeight: 700,
                      color: "var(--zm-dark)",
                    }}
                  >
                    PKR {finalTotal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--zm-muted)" }}>
                    PKR {Math.round(finalTotal / months).toLocaleString()}/mo
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}



        <button
          className="btn-primary"
          disabled={customMode && customMonths === null}
          onClick={() => onPay(finalTotal, customMode ? -1 : dur)}
        >
          Pay &amp; Subscribe — PKR {(!customMode || customMonths !== null) ? finalTotal.toLocaleString() : "—"}
        </button>

        <button
          className="btn-ghost"
          style={{ margin: "10px auto 0", display: "flex", fontSize: 14, padding: "8px 16px" }}
          onClick={onBack}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}

// ─── Screen 8 – Payment Confirmation ─────────────────────────────────────────
function PaymentScreen({
  amount,
  durIdx,
  onConfirm,
  onBack,
}: {
  amount: number
  durIdx: number
  onConfirm: () => void
  onBack: () => void
}) {
  const [paymentType, setPaymentType] = useState<"card" | "direct" | "">("")
  const [directMethod, setDirectMethod] = useState<"jazzcash" | "easypaisa" | "bank" | "">("")
  const [hasFile, setHasFile] = useState(false)

  // Card fields
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [cardHolder, setCardHolder] = useState("")

  const planLabel = durIdx === -1 ? "Custom" : DURATION_LABELS[durIdx]

  const directMethods = [
    { id: "jazzcash", label: "JazzCash", color: "#E83D2B", iconSrc: "/src/icons/jazz.png", sub: "Send via JazzCash mobile wallet" },
    { id: "easypaisa", label: "EasyPaisa", color: "#4CAF50", iconSrc: "/src/icons/easypaisa.png", sub: "Send via EasyPaisa mobile wallet" },
    { id: "bank", label: "Bank Transfer", color: "#1565C0", iconSrc: "/src/icons/banktransfer.png", sub: "Direct bank / IBFT transfer" },
  ] as const

  const directDetails: Record<string, { rows: [string, string][] }> = {
    jazzcash: { rows: [["Account", "03058107777"], ["Account Name", "Muhammad Ghasharib Ali Shaukat"], ["Amount", `PKR ${amount.toLocaleString()}`]] },
    easypaisa: { rows: [["Account", "03048107777"], ["Account Name", "Abdul Raafey Shaukat"], ["Amount", `PKR ${amount.toLocaleString()}`]] },
    bank: { rows: [["Bank", "HBL"], ["Account Title", "Zarai Mandi Private Limited"], ["Account No.", "5000-7909-9814-03"], ["IBAN", "PK04HABB05000079089814030"], ["Amount", `PKR ${amount.toLocaleString()}`]] },
  }
  function formatCardNumber(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()
  }
  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4)
    return digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits
  }

  const cardValid =
    cardNumber.replace(/\s/g, "").length === 16 &&
    expiry.length === 5 &&
    cvv.length >= 3 &&
    cardHolder.trim().length > 1

  const directReady = directMethod !== "" && hasFile

  const canConfirm = paymentType === "card" ? cardValid : paymentType === "direct" ? directReady : false

  // Shared input style
  const inputStyle = (filled: boolean): React.CSSProperties => ({
    width: "100%",
    height: 48,
    padding: "0 14px",
    border: `1.5px solid ${filled ? "var(--zm-green)" : "var(--zm-border)"}`,
    borderRadius: 12,
    fontSize: 14,
    color: "var(--zm-text)",
    background: "#fff",
    outline: "none",
    fontFamily: "'Inter', sans-serif",
    transition: "border-color .15s",
    boxSizing: "border-box" as const,
  })

  return (
    <div className="screen-scroll s-enter" style={{ alignItems: "center", padding: "36px 16px 32px" }}>
      <div className="auth-card" style={{ maxHeight: "none" }}>
        <div className="eyebrow">Payment Confirmation</div>
        <div className="headline">Complete your payment</div>
        <div className="subline">
          Pay <strong style={{ color: "var(--zm-dark)" }}>PKR {amount.toLocaleString()}</strong> for the{" "}
          <strong style={{ color: "var(--zm-dark)" }}>{planLabel}</strong> plan.
        </div>

        {/* ── Payment type selector ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {([
            { id: "card", icon: "💳", label: "Card Payment", sub: "Debit or credit card" },
            { id: "direct", icon: "📲", label: "Direct Transfer", sub: "JazzCash, EasyPaisa, Bank" },
          ] as const).map((opt) => {
            const active = paymentType === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => { setPaymentType(opt.id); setDirectMethod(""); setHasFile(false) }}
                style={{
                  padding: "16px 10px",
                  borderRadius: 14,
                  border: active ? "2px solid var(--zm-green)" : "1.5px solid var(--zm-border)",
                  background: active ? "var(--zm-light)" : "#fff",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 6 }}>{opt.icon}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: active ? "var(--zm-green)" : "var(--zm-dark)", lineHeight: 1.2 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 10.5, color: "var(--zm-muted)", marginTop: 3, lineHeight: 1.3 }}>
                  {opt.sub}
                </div>
                {active && (
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--zm-green)" }} />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* ══ Card Payment ══ */}
        {paymentType === "card" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Card number */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--zm-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                Card Number
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  style={inputStyle(cardNumber.replace(/\s/g, "").length === 16)}
                />
                {/* Card type hint */}
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 18, opacity: 0.4 }}>
                  {cardNumber.startsWith("4") ? "💳" : cardNumber.startsWith("5") ? "💳" : "💳"}
                </span>
              </div>
            </div>

            {/* Expiry + CVV */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--zm-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                  Expiry Date
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  style={inputStyle(expiry.length === 5)}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--zm-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                  Security Code
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="CVV"
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  style={inputStyle(cvv.length >= 3)}
                />
              </div>
            </div>

            {/* Card holder */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--zm-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                Cardholder Name
              </div>
              <input
                type="text"
                placeholder="Name on card"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                style={inputStyle(cardHolder.trim().length > 1)}
              />
            </div>

            {/* Security note */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px", background: "var(--zm-surface)", borderRadius: 10, border: "1px solid var(--zm-border)" }}>
              <span style={{ fontSize: 14 }}>🔒</span>
              <span style={{ fontSize: 11.5, color: "var(--zm-muted)", lineHeight: 1.4 }}>
                Your card details are encrypted and never stored.
              </span>
            </div>
          </div>
        )}

        {/* ══ Direct Transfer ══ */}
        {paymentType === "direct" && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--zm-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              Choose Method
            </div>
            {directMethods.map((m) => (
              <div
                key={m.id}
                className={`pay-method${directMethod === m.id ? " selected" : ""}`}
                onClick={() => setDirectMethod(m.id)}
              >
                <div style={{ background: `${m.color}18`, display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 10, flexShrink: 0 }}>
                  <img src={m.iconSrc} alt={m.label} style={{ width: 30, height: 30, objectFit: "contain" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--zm-text)" }}>{m.label}</div>
                  <div style={{ fontSize: 11.5, color: "var(--zm-muted)", marginTop: 1 }}>{m.sub}</div>
                </div>
                {directMethod === m.id && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" fill="#0F8A5F" opacity="0.15" />
                    <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#0F8A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            ))}

            {/* Payment details box */}
            {directMethod && (
              <>
                <div className="pay-detail-box" style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--zm-gold)", fontWeight: 700, marginBottom: 10 }}>
                    Payment Details
                  </div>
                  {directDetails[directMethod].rows.map(([k, v]) => (
                    <div key={k} className="pay-detail-row">
                      <span>{k}</span>
                      <span style={{ fontFamily: k === "IBAN" || k === "Account No." ? "monospace" : "inherit", fontSize: k === "IBAN" ? 11 : 13 }}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Screenshot upload */}
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--zm-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                  Upload Payment Screenshot
                </div>
                <div
                  className={`upload-area${hasFile ? " has-file" : ""}`}
                  onClick={() => setHasFile(true)}
                >
                  {hasFile ? (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--zm-dark)" }}>Screenshot attached</div>
                      <div style={{ fontSize: 11.5, color: "var(--zm-muted)", marginTop: 3 }}>Tap to change</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>📎</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--zm-text)" }}>Tap to upload screenshot</div>
                      <div style={{ fontSize: 11.5, color: "var(--zm-muted)", marginTop: 3 }}>JPG, PNG — Max 10 MB</div>
                    </>
                  )}
                </div>
                {!hasFile && (
                  <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--zm-muted)", marginTop: 4 }}>
                    Upload your screenshot to confirm.
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Confirm button ── */}
        {paymentType && (
          <button
            className="btn-primary"
            disabled={!canConfirm}
            onClick={onConfirm}
            style={{ marginTop: 16 }}
          >
            Confirm &amp; Pay — PKR {amount.toLocaleString()} →
          </button>
        )}

        <button
          className="btn-ghost"
          style={{ margin: "12px auto 0", display: "flex", fontSize: 14, padding: "8px 16px" }}
          onClick={onBack}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}

// ─── Loading ──────────────────────────────────────────────────────────────────
function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const dotId = setInterval(
      () => setDots((d) => (d.length >= 3 ? "" : d + ".")),
      480,
    )
    const navId = setTimeout(onDone, 3000)
    return () => {
      clearInterval(dotId)
      clearTimeout(navId)
    }
  }, [])

  return (
    <div
      className="s-enter"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        background: "var(--zm-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={logoImg}
        alt="Zarai Mandi"
        className="logo-anim"
        style={{ width: 160, marginBottom: 36 }}
      />
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--zm-dark)",
          textAlign: "center",
        }}
      >
        VERIFYING &amp; LOADING ZARAI MANDI{dots}
      </div>
      <div
        style={{
          marginTop: 28,
          width: 180,
          height: 3,
          borderRadius: 2,
          background: "rgba(15,138,95,0.12)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 2,
            background: "var(--zm-green)",
            animation: "loadBar 3s linear forwards",
          }}
        />
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({
  name,
  city,
  province,
  onBack,
}: {
  name: string
  city: string
  province: string
  onBack: () => void
}) {
  const prices = [
    { label: "Wheat", price: "4,200", change: "+2.1%", up: true },
    { label: "Rice", price: "6,800", change: "+0.8%", up: true },
    { label: "Cotton", price: "9,500", change: "-1.3%", up: false },
    { label: "Maize", price: "2,900", change: "+3.5%", up: true },
  ]

  return (
    <div className="screen-scroll s-enter" style={{ padding: "0 0 24px" }}>
      <div
        style={{
          padding: "48px 20px 22px",
          position: "relative",
          background:
            "linear-gradient(160deg, var(--zm-dark), var(--zm-green))",
          color: "white",
        }}
      >
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: 14,
            left: 16,
            background: "rgba(255,255,255,0.14)",
            border: "none",
            borderRadius: 20,
            padding: "5px 14px",
            color: "white",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          ← Back
        </button>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.65,
            marginBottom: 3,
            marginTop: 14,
          }}
        >
          Good morning
        </div>
        <div
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {name || "Customer"}
        </div>
        <div style={{ fontSize: 12, opacity: 0.65, marginTop: 3 }}>
          {city || "Lahore"}, {province || "Punjab"} — 3-Day Trial Active
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ marginTop: 20, marginBottom: 10 }}>
          <div className="eyebrow">Live Mandi Prices</div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 18,
          }}
        >
          {prices.map((c) => (
            <div
              key={c.label}
              style={{
                background: "white",
                borderRadius: 16,
                padding: "14px",
                border: "1px solid var(--zm-border)",
                boxShadow: "0 2px 12px rgba(10,94,67,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--zm-muted)",
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                {c.label}
              </div>
              <div
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: 17,
                  color: "var(--zm-dark)",
                }}
              >
                PKR {c.price}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  marginTop: 3,
                  color: c.up ? "#16A34A" : "#DC2626",
                }}
              >
                {c.change} today
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "var(--zm-gold-lt)",
            border: "1px solid rgba(185,130,46,0.22)",
            borderRadius: 14,
            padding: "13px 15px",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--zm-gold)",
              marginTop: 5,
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: "var(--zm-dark)",
                marginBottom: 1,
              }}
            >
              Market Alert
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--zm-muted)",
                lineHeight: 1.4,
              }}
            >
              Cotton prices down in Multan Mandi — check rates
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {["Prices", "Market", "Alerts", "Profile"].map((tab, i) => (
            <button
              key={tab}
              style={{
                flex: 1,
                padding: "10px 4px",
                border: "none",
                borderRadius: 10,
                background:
                  i === 0 ? "var(--zm-green)" : "rgba(15,138,95,0.07)",
                color: i === 0 ? "white" : "var(--zm-muted)",
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Exported Types ───────────────────────────────────────────────────────────
export interface OnboardingUserData {
  name: string
  phone: string
  profession?: string
  contact?: string
  role: Role
  products: string[]
  city: string
  district: string
  province: string
}

// ─── Theme CSS (matches CustomerFaceApp colors/fonts) ─────────────────────────
const ZM_OB_THEME = `
  :root {
    --zm-green: #087F63;
    --zm-deep: #064D40;
    --zm-bright: #2FAE68;
    --zm-dark: #183B34;
    --zm-text: #183B34;
    --zm-muted: #52635F;
    --zm-border: #D5E2DD;
    --zm-light: #E4F2EC;
    --zm-bg: #F1F7F4;
    --zm-surface: #F4FAF7;
    --zm-card: #FFFFFF;
    --zm-gold: #B9822E;
    --zm-gold-lt: #FFF8E1;
  }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  .phone-shell {
    width: 100%;
    height: 100dvh;
    max-width: 448px;
    margin: 0 auto;
    background: var(--zm-bg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    font-family: 'Inter', 'Poppins', sans-serif;
    box-shadow: 0 0 80px rgba(0,0,0,0.18);
  }
  .screen-scroll {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    scrollbar-width: none;
  }
  .screen-scroll::-webkit-scrollbar { display: none; }
  .auth-card {
    background: #fff;
    border-radius: 24px;
    padding: 24px 20px 20px;
    box-shadow: 0 4px 24px rgba(6,77,64,0.1);
    border: 1px solid var(--zm-border);
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }
  .eyebrow {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #087F63;
    margin-bottom: 4px;
    font-family: 'Inter', sans-serif;
  }
  .headline {
    font-family: 'Poppins', 'Inter', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: #183B34;
    margin-bottom: 4px;
    line-height: 1.2;
  }
  .subline {
    font-size: 13.5px;
    color: #52635F;
    margin-bottom: 18px;
    line-height: 1.5;
  }
  .progress-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--zm-border);
    transition: background 0.2s, transform 0.2s;
  }
  .progress-dot.active {
    background: #087F63;
    transform: scale(1.3);
  }
  .btn-primary {
    width: 100%;
    padding: 15px;
    border-radius: 14px;
    background: linear-gradient(135deg, #087F63, #064D40);
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    margin-top: 8px;
    transition: opacity 0.15s;
    font-family: 'Inter', sans-serif;
  }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
  .google-signup-btn {
    width: 100%;
    padding: 13px 14px;
    border-radius: 14px;
    background: #fff;
    color: var(--zm-text);
    font-size: 14px;
    font-weight: 600;
    border: 1.5px solid var(--zm-border);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .google-signup-btn:hover {
    border-color: #C8D7D2;
    background: #FAFCFB;
    box-shadow: 0 2px 8px rgba(6,77,64,0.06);
  }
  .google-signup-btn:active {
    transform: translateY(1px);
  }
  .btn-secondary {
    width: 100%;
    padding: 14px;
    border-radius: 14px;
    background: var(--zm-light);
    color: #087F63;
    font-size: 14px;
    font-weight: 700;
    border: 1.5px solid #087F63;
    cursor: pointer;
    margin-top: 8px;
    font-family: 'Inter', sans-serif;
  }
  .btn-ghost {
    background: none;
    border: none;
    color: var(--zm-muted);
    cursor: pointer;
    font-size: 14px;
    font-family: 'Inter', sans-serif;
  }
  .lang-btn {
    padding: 14px 12px;
    border-radius: 14px;
    background: #fff;
    border: 1.5px solid var(--zm-border);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    color: var(--zm-text);
    transition: border-color 0.15s, background 0.15s;
    font-family: 'Inter', sans-serif;
  }
  .lang-btn.regional { font-family: 'Noto Nastaliq Urdu', serif; font-size: 16px; }
  .lang-btn:hover { border-color: #087F63; background: var(--zm-light); }
  .radio-group-container { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
  .radio-label { display: flex; align-items: center; gap: 12px; padding: 13px 16px; border-radius: 14px; border: 1.5px solid var(--zm-border); background: #fff; cursor: pointer; transition: border-color 0.15s; }
  .radio-label:has(.radio-input:checked) { border-color: #087F63; background: var(--zm-light); }
  .radio-input { display: none; }
  .radio-custom { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--zm-border); flex-shrink: 0; position: relative; transition: border-color 0.15s; }
  .radio-label:has(.radio-input:checked) .radio-custom { border-color: #087F63; }
  .radio-label:has(.radio-input:checked) .radio-custom::after { content: ''; position: absolute; top: 3px; left: 3px; width: 8px; height: 8px; border-radius: 50%; background: #087F63; }
  .radio-text { font-size: 14px; font-weight: 600; color: var(--zm-text); }
  .field { margin-bottom: 14px; }
  .fl-input { width: 100%; padding: 16px 14px 6px; border: none; border-bottom: 2px solid var(--zm-border); background: transparent; font-size: 14px; color: var(--zm-text); outline: none; font-family: 'Inter', sans-serif; transition: border-color 0.15s; }
  .fl-input:focus { border-bottom-color: #087F63; }
  .fl-label { position: absolute; top: 14px; left: 14px; font-size: 13px; color: var(--zm-muted); pointer-events: none; transition: 0.15s; }
  .fl-input.filled ~ .fl-label, .fl-input:focus ~ .fl-label { top: 5px; font-size: 16px; color: #000000; }
  .fl-underline { height: 2px; background: #087F63; transform: scaleX(0); transition: transform 0.2s; }
  .fl-input:focus ~ .fl-underline { transform: scaleX(1); }
  .field-row { display: flex; gap: 10px; align-items: flex-end; }
  .cc-wrap { width: 80px; flex-shrink: 0; }
  .cc-select { width: 100%; padding: 10px 8px; border: 1.5px solid var(--zm-border); border-radius: 10px; background: #fff; font-size: 13px; font-weight: 600; color: var(--zm-text); cursor: pointer; }
  .input-wrap { flex: 1; position: relative; }
  .input-wrap input { width: 100%; padding: 14px 12px 6px; border: none; border-bottom: 2px solid var(--zm-border); background: transparent; font-size: 14px; color: var(--zm-text); outline: none; font-family: 'Inter', sans-serif; }
  .input-wrap label { position: absolute; top: 12px; left: 12px; font-size: 13px; color: var(--zm-muted); pointer-events: none; transition: 0.15s; }
  .input-wrap input.filled ~ label, .input-wrap input:focus ~ label { top: 2px; font-size: 10px; color: #087F63; }
  .input-underline { height: 2px; background: #087F63; transform: scaleX(0); transition: transform 0.2s; }
  .input-wrap input:focus ~ .input-underline { transform: scaleX(1); }
  .wa-panel { border-radius: 14px; border: 1.5px solid var(--zm-border); overflow: hidden; }
  .wa-panel-header { display: flex; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; background: #fff; }
  .wa-panel-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
  .wa-panel-body.open { max-height: 400px; }
  .wa-panel-inner { padding: 0 14px 14px; }
  .toggle-track { width: 40px; height: 22px; border-radius: 11px; background: var(--zm-border); cursor: pointer; position: relative; transition: background 0.2s; }
  .toggle-track.on { background: #087F63; }
  .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
  .toggle-track.on .toggle-thumb { transform: translateX(18px); }
  .occ-scroll-box { overflow-y: auto; border-radius: 12px; border: 1.5px solid var(--zm-border); scrollbar-width: thin; }
  .occ-option { display: flex; align-items: center; gap: 10px; padding: 11px 14px; cursor: pointer; border-bottom: 1px solid var(--zm-border); font-size: 13.5px; color: var(--zm-text); background: #fff; transition: background 0.12s; }
  .occ-option:last-child { border-bottom: none; }
  .occ-option.selected { background: var(--zm-light); }
  .occ-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--zm-border); flex-shrink: 0; }
  .occ-option.selected .occ-dot { background: #087F63; }
  .role-sub-label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--zm-muted); margin-bottom: 8px; }
  .dur-tab { flex: 1; padding: 8px 4px; border: none; border-radius: 9px; background: transparent; font-size: 12px; font-weight: 700; cursor: pointer; color: var(--zm-muted); transition: background 0.15s, color 0.15s; font-family: 'Inter', sans-serif; }
  .dur-tab.active { background: #fff; color: #087F63; box-shadow: 0 2px 8px rgba(6,77,64,0.1); }
  .price-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--zm-muted); }
  .pay-method { display: flex; align-items: center; gap: 14px; padding: 13px 16px; border-radius: 14px; border: 1.5px solid var(--zm-border); background: #fff; cursor: pointer; margin-bottom: 10px; transition: border-color 0.15s, background 0.15s; }
  .pay-method.selected { border-color: #087F63; background: var(--zm-light); }
  .pay-method-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .pay-detail-box { background: var(--zm-surface); border-radius: 14px; border: 1px solid var(--zm-border); padding: 14px 16px; margin-bottom: 14px; }
  .pay-detail-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--zm-muted); padding: 6px 0; border-bottom: 1px solid rgba(6,77,64,0.07); }
  .pay-detail-row:last-child { border-bottom: none; font-weight: 700; color: var(--zm-dark); }
  .upload-area { border: 2px dashed var(--zm-border); border-radius: 14px; padding: 22px; text-align: center; cursor: pointer; margin-bottom: 14px; transition: border-color 0.15s; }
  .upload-area.has-file { border-color: #087F63; background: var(--zm-light); }
  .item-check { position: absolute; width: 18px; height: 18px; border-radius: 50%; background: #087F63; color: #fff; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .sel-tag { background: var(--zm-light); border-radius: 20px; padding: 4px 10px; font-size: 12px; font-weight: 600; color: #087F63; border: 1px solid rgba(8,127,99,0.2); }
  .sel-tag button { background: none; border: none; cursor: pointer; font-size: 14px; color: var(--zm-muted); padding: 0 0 0 2px; }
  .logo-anim { animation: logoFade 0.6s ease; }
  .s-enter { animation: screenEnter 0.3s ease; }
  .thin-scroll::-webkit-scrollbar { width: 4px; }
  .thin-scroll::-webkit-scrollbar-track { background: transparent; }
  .thin-scroll::-webkit-scrollbar-thumb { background: var(--zm-border); border-radius: 4px; }
  @keyframes logoFade { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes screenEnter { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes loadBar { from { width: 0%; } to { width: 100%; } }
  .btn-txt { font-weight: 700; }
  .profile-input { width: 100%; padding: 13px 14px; border: 1.5px solid var(--zm-border); border-radius: 12px; background: #fff; color: var(--zm-text); font: 14px 'Inter', sans-serif; text-align: left; outline: none; box-sizing: border-box; }
  .profile-input:focus { outline: 2px solid rgba(8,127,99,0.16); border-color: #087F63; }
  .profile-input::placeholder { color: var(--zm-muted); }
  .profile-select { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 13px 14px; border: 1.5px solid var(--zm-border); border-radius: 12px; background: #fff; color: var(--zm-text); font: 14px 'Inter', sans-serif; cursor: pointer; text-align: left; }
  .profile-select:focus { outline: 2px solid rgba(8,127,99,0.16); border-color: #087F63; }
  .dropdown-panel { margin-top: 6px; border: 1.5px solid var(--zm-border); border-radius: 12px; background: #fff; overflow: hidden; box-shadow: 0 8px 22px rgba(6,77,64,0.10); }
  .dropdown-search { width: 100%; border: none; border-bottom: 1px solid var(--zm-border); padding: 12px 14px; font: 13px 'Inter', sans-serif; outline: none; color: var(--zm-text); }
  .dropdown-list { max-height: 190px; overflow-y: auto; }
  .dropdown-empty { padding: 15px; text-align: center; color: var(--zm-muted); font-size: 12.5px; }
  .dropdown-panel .occ-option { border-bottom: 1px solid var(--zm-border); }
  .dropdown-panel .occ-option:last-child { border-bottom: none; }
  .field-row { display: flex; gap: 10px; align-items: flex-end; }
  .field-row > div:last-child { flex: 1; }
`

// ─── App ─────────────────────────────────────────────────────────────────────
// ─── Rep Pending Screen ───────────────────────────────────────────────────────
function RepPendingScreen({ name, onProceed }: { name: string; onProceed: () => void }) {
  return (
    <div
      className="screen-scroll s-enter"
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px 40px",
      }}
    >
      <div className="auth-card" style={{ textAlign: "center" }}>
        {/* Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--zm-light)",
            border: "2px solid rgba(8,127,99,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            margin: "0 auto 20px",
          }}
        >
          🕐
        </div>

        <div className="eyebrow" style={{ textAlign: "center" }}>Application Received</div>
        <div className="headline" style={{ textAlign: "center", fontSize: 20, marginBottom: 10 }}>
          We'll be in touch soon
        </div>

        <div
          style={{
            fontSize: 13.5,
            color: "var(--zm-muted)",
            lineHeight: 1.7,
            marginBottom: 24,
          }}
        >
          Thank you, <strong style={{ color: "var(--zm-dark)" }}>{name || "there"}</strong>. Your representative
          application has been submitted. Our operations team will review your
          details and verify your account within <strong style={{ color: "var(--zm-dark)" }}>24–48 hours</strong>.
        </div>

        {/* Horizontal Status Progress Card */}
        <div
          style={{
            background: "linear-gradient(135deg, #FFFFFF, #F6FBF8)",
            border: "1.5px solid #B8DCCF",
            borderRadius: 16,
            padding: "16px 14px",
            boxShadow: "0 4px 16px rgba(6,77,64,0.06)",
            marginBottom: 20,
            textAlign: "left",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#183B34", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Application Status
              </span>
            </div>
          </div>

          {/* Animated Horizontal Progress Bar */}
          <div
            style={{
              width: "100%",
              height: 6,
              background: "#E2EFE9",
              borderRadius: 999,
              overflow: "hidden",
              margin: "6px 0 14px",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "50%",
                height: "100%",
                background: "linear-gradient(90deg, #087F63, #2FAE68)",
                borderRadius: 999,
                transition: "width 0.4s ease-in-out",
              }}
            />
          </div>

          {/* 3-Stage Horizontal Stepper */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {/* Step 1: Submitted */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#087F63",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 900,
                  marginBottom: 4,
                  boxShadow: "0 2px 6px rgba(8,127,99,0.25)",
                }}
              >
                ✓
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#087F63", lineHeight: 1.15 }}>
                Submitted
              </span>
            </div>

            {/* Step 2: Ops Review (Active) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#E4F2EC",
                  border: "2px solid #087F63",
                  color: "#087F63",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  marginBottom: 4,
                  boxShadow: "0 0 0 3px rgba(8,127,99,0.15)",
                }}
              >
                ⏳
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#087F63", lineHeight: 1.15 }}>
                Ops Review
              </span>
            </div>

            {/* Step 3: Active */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#F1F7F4",
                  border: "1.5px solid #D5E2DD",
                  color: "#80918B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                🚀
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#80918B", lineHeight: 1.15 }}>
                Verified
              </span>
            </div>
          </div>
        </div>

        {/* Action button to proceed to Zarai Mandi app */}
        <button
          type="button"
          className="btn-primary"
          onClick={onProceed}
          style={{
            marginBottom: 16,
            background: "linear-gradient(135deg, #087F63, #064D40)",
            boxShadow: "0 4px 16px rgba(8,127,99,0.35)",
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          Proceed to Zarai Mandi App →
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 14px",
            background: "var(--zm-gold-lt)",
            border: "1px solid rgba(185,130,46,0.22)",
            borderRadius: 12,
            fontSize: 12.5,
            color: "var(--zm-muted)",
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>💬</span>
          <span>
            Questions? WhatsApp us at{" "}
            <strong style={{ color: "var(--zm-dark)" }}>0300-0000000</strong>
          </span>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingFlow({
  onComplete,
  initialMode = "register",
  initialRole = "customer",
}: {
  onComplete: (data: OnboardingUserData) => void
  initialMode?: "register" | "signin"
  initialRole?: Role
}) {
  const [authMode, setAuthMode] = useState<"register" | "signin">(initialMode)
  const [screen, setScreen] = useState<Screen>(
    initialRole === "representative"
      ? "role"
      : initialMode === "signin"
        ? "account"
        : "lang"
  )
  const [role, setRole] = useState<Role>(initialRole)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [profession, setProfession] = useState("")
  const [products, setProducts] = useState<string[]>(["wheat"])
  const [city, setCity] = useState("Pakpattan")
  const [district, setDistrict] = useState("Pakpattan")
  const [province, setProvince] = useState("Punjab")
  const [payAmount, setPayAmount] = useState(0)
  const [payDur, setPayDur] = useState(0)

  useEffect(() => {
    setAuthMode(initialMode)
    setRole(initialRole)
    if (initialRole === "representative") {
      setScreen("role")
    } else if (initialMode === "signin") {
      setScreen("account")
    }
  }, [initialMode, initialRole])

  function go(s: Screen) {
    setScreen(s)
  }

  const handleDone = () => {
    onComplete({
      name: name || "Muhammad Arif",
      phone,
      profession,
      contact: phone,
      role,
      products: products.length ? products : ["wheat"],
      city: city || "Pakpattan",
      district: district || "Pakpattan",
      province: province || "Punjab",
    })
  }

  return (
    <>
      <style>{ZM_OB_THEME}</style>
      <div className="phone-shell">
        {screen === "lang" && <LangScreen onNext={() => go("role")} />}

        {screen === "role" && (
          <RoleScreen
            initialRole={role || initialRole}
            onNext={(r) => {
              setRole(r)
              setAuthMode("register")
              go("account")
            }}
            onBack={() => go("lang")}
            onSignIn={() => {
              setRole("customer")
              setAuthMode("signin")
              go("account")
            }}
          />
        )}

        {screen === "account" && (
          <AccountScreen
            role={role}
            mode={authMode}
            onSwitchMode={(newMode) => {
              setAuthMode(newMode)
            }}
            onNext={({ name: n, contact, location: repLocation, profession: prof }) => {
              setName(n)
              setPhone(contact)
              setProfession(prof)
              if (role === "representative") {
                if (repLocation) {
                  const match = CITIES.find((c) => c.city === repLocation)
                  if (match) {
                    setCity(match.city)
                    setDistrict(match.district)
                    setProvince(match.province)
                  }
                }
                go("rep-pending")
              } else {
                // Customer is directly taken to the home screen with 1 default product (Wheat)!
                onComplete({
                  name: n || "Muhammad Arif",
                  phone: contact,
                  profession: prof,
                  contact,
                  role: "customer",
                  products: ["wheat"],
                  city: "Pakpattan",
                  district: "Pakpattan",
                  province: "Punjab",
                })
              }
            }}
            onBack={() => {
              if (authMode === "signin") {
                go("role")
              } else {
                go("role")
              }
            }}
          />
        )}

        {screen === "interests" && (
          <InterestsScreen
            onNext={(prods) => {
              setProducts(prods)
              go("location")
            }}
            onBack={() => go("account")}
          />
        )}

        {screen === "location" && (
          <LocationScreen
            onNext={(c, d, p) => {
              setCity(c)
              setDistrict(d)
              setProvince(p)
              go("subscription")
            }}
            onBack={() => go("interests")}
          />
        )}

        {screen === "subscription" && (
          <SubscriptionScreen
            products={products}
            city={city}
            province={province}
            onTrial={() => handleDone()}
            onPay={(amt, dur) => {
              setPayAmount(amt)
              setPayDur(dur)
              go("payment")
            }}
            onBack={() => go("location")}
          />
        )}

        {screen === "payment" && (
          <PaymentScreen
            amount={payAmount}
            durIdx={payDur}
            onConfirm={() => go("loading")}
            onBack={() => go("subscription")}
          />
        )}

        {screen === "loading" && <LoadingScreen onDone={() => handleDone()} />}
        {screen === "rep-pending" && (
          <RepPendingScreen
            name={name}
            onProceed={() => handleDone()}
          />
        )}
      </div>
    </>
  )
}