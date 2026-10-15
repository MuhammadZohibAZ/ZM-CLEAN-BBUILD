// Small pieces shared by the onboarding steps: progress bar, divider, terms toggle,
// social icons, phone/email field, OTP boxes and the name/profile fields.

import { useEffect, useRef, useState } from "react";
import {
  CITIES,
  type ContactInputTab,
  COUNTRY_CODES,
  isValidEmail,
  isValidPhone,
  normalizePhone,
  professionLabel,
  PROFESSIONS,
} from "./data";
import { useLang } from "../customer-face/shared/i18n/LangProvider";
import { useObLang } from "./i18n";

// ─── Shared UI ────────────────────────────────────────────────────────────────
export function Progress({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
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
  );
}

export function Divider({ label }: { label: string }) {
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
  );
}

export function TermsToggle({
  agreed,
  onChange,
}: {
  agreed: boolean;
  onChange: (v: boolean) => void;
}) {
  const { L } = useObLang();
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
        {L("I agree to the", "میں")}{" "}
        <span
          style={{
            color: "var(--zm-green)",
            fontWeight: 600,
            textDecoration: "underline",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onChange(!agreed);
          }}
        >
          {L("Terms & Conditions", "شرائط و ضوابط")}
        </span>{" "}
        {L("and", "اور")}{" "}
        <span
          style={{
            color: "var(--zm-green)",
            fontWeight: 600,
            textDecoration: "underline",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onChange(!agreed);
          }}
        >
          {L("Privacy Policy", "رازداری کی پالیسی")}
        </span>
        {L("", " سے متفق ہوں")}
      </span>
    </div>
  );
}

export const SocialIcon = {
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
};

export function ContactField({
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
  phoneValue: string;
  emailValue: string;
  countryCode: string;
  tab: ContactInputTab;
  mode?: "register" | "signin";
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onCountryChange: (v: string) => void;
  onTabChange: (t: ContactInputTab) => void;
  disabled?: boolean;
}) {
  const { L } = useObLang();
  const { tm } = useLang();
  const cc =
    COUNTRY_CODES.find((c) => c.code === countryCode) ?? COUNTRY_CODES[0];
  const phoneValid = isValidPhone(phoneValue, countryCode);
  const emailValid = isValidEmail(emailValue);

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Phone input — always shown first, unless email mode */}
      {tab === "phone" && (
        <div>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--zm-muted)",
              marginBottom: 6,
            }}
          >
            {L("WhatsApp / Mobile Number *", "واٹس ایپ / موبائل نمبر *")}
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
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <span
                style={{
                  position: "absolute",
                  right: 7,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 10,
                  color: "var(--zm-muted)",
                  pointerEvents: "none",
                }}
              >
                ▾
              </span>
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                className={`fl-input${phoneValue ? " filled" : ""}`}
                type="tel"
                inputMode="tel"
                placeholder={cc.hint}
                value={phoneValue}
                onChange={(e) =>
                  onPhoneChange(e.target.value.replace(/[^\d\s-]/g, ""))
                }
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
                <span
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--zm-green)",
                    fontWeight: 800,
                    fontSize: 17,
                  }}
                >
                  ✓
                </span>
              )}
            </div>
          </div>
          <div style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.5 }}>
            {!phoneValue && (
              <span style={{ color: "var(--zm-muted)" }}>
                {L("Pakistan: enter 03XX XXXXXXX or just 10 digits", "پاکستان: 03XX XXXXXXX یا صرف 10 ہندسے لکھیں")}
              </span>
            )}
            {phoneValue && !phoneValid && (
              <span style={{ color: "#b45309" }}>
                {L(`Enter ${cc.digits}-digit number for ${cc.country} (e.g. ${cc.hint})`, `${tm(cc.country)} کے لیے ${cc.digits} ہندسوں کا نمبر لکھیں (مثلاً ${cc.hint})`)}
              </span>
            )}
            {phoneValid && (
              <span style={{ color: "var(--zm-green)" }}>
                {L("OTP will be sent via WhatsApp to", "OTP واٹس ایپ پر بھیجا جائے گا:")}{" "}
                <span className="ltr">{normalizePhone(phoneValue, countryCode)}</span>
              </span>
            )}
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
              {mode === "signin"
                ? L("Sign in with Email instead", "اس کے بجائے ای میل سے سائن اِن کریں")
                : L("Sign up with Email instead", "اس کے بجائے ای میل سے سائن اَپ کریں")}
            </button>
          )}
        </div>
      )}

      {/* Email input — shown when tab === "email" */}
      {tab === "email" && (
        <div>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--zm-muted)",
              marginBottom: 6,
            }}
          >
            {L("Email Address *", "ای میل ایڈریس *")}
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
              <span
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--zm-green)",
                  fontWeight: 800,
                  fontSize: 17,
                }}
              >
                ✓
              </span>
            )}
          </div>
          {emailValue && !emailValid && (
            <div style={{ fontSize: 11.5, color: "#b45309", marginTop: 6 }}>
              {L("Enter a valid email (e.g. name@gmail.com)", "درست ای میل لکھیں (مثلاً name@gmail.com)")}
            </div>
          )}
          {emailValid && (
            <div
              style={{ fontSize: 11.5, color: "var(--zm-green)", marginTop: 6 }}
            >
              {L("OTP will be sent to", "OTP یہاں بھیجا جائے گا:")} <span className="ltr">{emailValue.trim()}</span>
            </div>
          )}
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
              {mode === "signin"
                ? L("Sign in with Mobile Number instead", "اس کے بجائے موبائل نمبر سے سائن اِن کریں")
                : L("Sign up with Phone instead", "اس کے بجائے فون سے سائن اَپ کریں")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function OtpBoxes({
  onVerified,
  sentTo,
}: {
  onVerified: () => void;
  sentTo: string;
}) {
  const { L } = useObLang();
  const [vals, setVals] = useState(["", "", "", "", "", ""]);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  useEffect(() => {
    refs[0].current?.focus();
  }, []);

  function handleChange(i: number, v: string) {
    const digits = v.replace(/\D/g, "");
    if (!digits) return;
    const next = [...vals];
    digits
      .split("")
      .slice(0, 6 - i)
      .forEach((d, offset) => {
        next[i + offset] = d;
      });
    setVals(next);
    refs[Math.min(i + digits.length, 5)].current?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (vals[i]) {
        const next = [...vals];
        next[i] = "";
        setVals(next);
      } else if (i > 0) {
        const next = [...vals];
        next[i - 1] = "";
        setVals(next);
        refs[i - 1].current?.focus();
      }
    }
  }

  const allFilled = vals.every(Boolean);

  return (
    <>
      {sentTo && (
        <div
          style={{
            background: "var(--zm-light)",
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 12.5,
            color: "var(--zm-dark)",
            textAlign: "center",
            marginBottom: 14,
            lineHeight: 1.5,
          }}
        >
          {L("6-digit OTP sent to", "6 ہندسوں کا OTP بھیجا گیا:")} <strong className="ltr">{sentTo}</strong>
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          margin: "4px 0 14px",
        }}
      >
        {refs.map((r, i) => (
          <input
            key={i}
            ref={r}
            className={`otp-box${vals[i] ? " filled" : ""}`}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={vals[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
          />
        ))}
      </div>
      <button
        className="btn-primary"
        disabled={!allFilled}
        onClick={onVerified}
      >
        {L("Verify OTP →", "OTP کی تصدیق کریں ←")}
      </button>
    </>
  );
}

export function ProfileFields({
  name,
  setName,
  profession,
  setProfession,
  location,
  setLocation,
  showLocation,
}: {
  name: string;
  setName: (v: string) => void;
  profession: string;
  setProfession: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  showLocation: boolean;
}) {
  const { L, isUr } = useObLang();
  const { tm } = useLang();
  const [professionSearch, setProfessionSearch] = useState("");
  const [professionOpen, setProfessionOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const filteredProfessions = PROFESSIONS.filter((p) =>
    `${p} ${professionLabel(p, true)}`.toLowerCase().includes(professionSearch.toLowerCase()),
  );
  const filteredLocations = CITIES.filter((c) =>
    `${c.city} ${c.district} ${c.province}`
      .toLowerCase()
      .includes(locationSearch.toLowerCase()),
  );

  return (
    <>
      <div className="field">
        <div className="role-sub-label">{L("Name *", "نام *")}</div>
        <input
          className="profile-input"
          type="text"
          placeholder={L("Enter your name", "اپنا نام لکھیں")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field">
        <div className="role-sub-label">
          {L("Profession", "پیشہ")}{" "}
          <span
            style={{
              fontSize: 11,
              fontWeight: "normal",
              color: "var(--zm-muted)",
              textTransform: "none",
              letterSpacing: "normal",
            }}
          >
            {L("(Optional)", "(اختیاری)")}
          </span>
        </div>
        <button
          type="button"
          className="profile-select"
          onClick={() => setProfessionOpen((v) => !v)}
        >
          <span
            style={{ color: profession ? "var(--zm-text)" : "var(--zm-muted)" }}
          >
            {profession ? professionLabel(profession, isUr) : L("Select profession (optional)", "پیشہ منتخب کریں (اختیاری)")}
          </span>
          <span aria-hidden="true">▾</span>
        </button>
        {professionOpen && (
          <div className="dropdown-panel">
            <input
              className="dropdown-search"
              placeholder={L("Search profession…", "پیشہ تلاش کریں…")}
              value={professionSearch}
              onChange={(e) => setProfessionSearch(e.target.value)}
              autoFocus
            />
            <div className="dropdown-list">
              {filteredProfessions.map((p) => (
                <div
                  key={p}
                  className={`occ-option${profession === p ? " selected" : ""}`}
                  onClick={() => {
                    setProfession(p);
                    setProfessionOpen(false);
                  }}
                >
                  <span className="occ-dot" />
                  <span>{professionLabel(p, isUr)}</span>
                </div>
              ))}
              {!filteredProfessions.length && (
                <div className="dropdown-empty">{L("No professions found", "کوئی پیشہ نہیں ملا")}</div>
              )}
            </div>
          </div>
        )}
      </div>
      {showLocation && (
        <div className="field">
          <div className="role-sub-label">{L("Location *", "مقام *")}</div>
          <button
            type="button"
            className="profile-select"
            onClick={() => setLocationOpen((v) => !v)}
          >
            <span
              style={{ color: location ? "var(--zm-text)" : "var(--zm-muted)" }}
            >
              {location ? tm(location) : L("Select location", "مقام منتخب کریں")}
            </span>
            <span aria-hidden="true">▾</span>
          </button>
          {locationOpen && (
            <div className="dropdown-panel">
              <input
                className="dropdown-search"
                placeholder={L("Search city, district or province…", "شہر، ضلع یا صوبہ تلاش کریں…")}
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                autoFocus
              />
              <div className="dropdown-list">
                {filteredLocations.map((c) => (
                  <div
                    key={`${c.city}-${c.province}`}
                    className={`occ-option${location === c.city ? " selected" : ""}`}
                    onClick={() => {
                      setLocation(c.city);
                      setLocationOpen(false);
                    }}
                  >
                    <span className="occ-dot" />
                    <div>
                      <div>{tm(c.city)}</div>
                      <span style={{ fontSize: 11, color: "var(--zm-muted)" }}>
                        {tm(c.district)}، {tm(c.province)}
                      </span>
                    </div>
                  </div>
                ))}
                {!filteredLocations.length && (
                  <div className="dropdown-empty">{L("No locations found", "کوئی مقام نہیں ملا")}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
