// Onboarding step 3: sign up / sign in with phone, email or Google, OTP and profile.

import { useState } from "react";
import {
  type ContactInputTab,
  GOOGLE_SAMPLE_ACCOUNTS,
  isValidEmail,
  isValidPhone,
  normalizePhone,
  type Role,
} from "../data";
import {
  ContactField,
  Divider,
  OtpBoxes,
  ProfileFields,
  Progress,
  SocialIcon,
  TermsToggle,
} from "../parts";
import { useObLang } from "../i18n";

// ─── Screen 3 – Registration / Sign In / OTP / Profile ────────────────────────
export function AccountScreen({
  role,
  mode = "register",
  onNext,
  onBack,
  onSwitchMode,
}: {
  role: Role;
  mode?: "register" | "signin";
  onNext: (data: {
    name: string;
    contact: string;
    location: string;
    profession: string;
  }) => void;
  onBack: () => void;
  onSwitchMode?: (mode: "register" | "signin") => void;
}) {
  const { L } = useObLang();
  const [tab, setTab] = useState<ContactInputTab>("phone");
  const [phoneValue, setPhoneValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [countryCode, setCountryCode] = useState("+92");
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [location, setLocation] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Google picker state
  const [googleStage, setGoogleStage] = useState<
    "closed" | "picker" | "consent"
  >("closed");
  const [pickedAccount, setPickedAccount] = useState<
    (typeof GOOGLE_SAMPLE_ACCOUNTS)[0] | null
  >(null);
  const [customEmail, setCustomEmail] = useState("");
  const [customEmailErr, setCustomEmailErr] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const isSignIn = mode === "signin";
  const phoneValid = isValidPhone(phoneValue, countryCode);
  const emailValid = isValidEmail(emailValue);
  const currentValid = tab === "phone" ? phoneValid : emailValid;

  // What gets shown in the OTP banner and stored as contact
  const contactDisplay =
    tab === "phone"
      ? normalizePhone(phoneValue, countryCode)
      : emailValue.trim();

  // For customer: only Name is compulsory. For representative: Name and Location are compulsory.
  const profileComplete =
    name.trim().length >= 1 &&
    (role === "customer" || location.trim().length >= 1) &&
    agreedTerms;

  function nameFromEmail(email: string) {
    return (
      (email.split("@")[0] || "Google User")
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim() || "Google User"
    );
  }

  function handlePhoneChange(v: string) {
    setPhoneValue(v);
    // Autofill WhatsApp profile name if user hasn't typed a custom name yet
    const digits = v.replace(/\D/g, "");
    if (!name || name === "Ahmed Khan" || name === "Muhammad Arif") {
      if (digits.length >= 7) {
        setName("Ahmed Khan");
      }
    }
  }

  function handleSendOtp() {
    if (tab === "phone" && !name) {
      setName("Ahmed Khan");
    }
    setOtpSent(true);
  }

  function handleVerified() {
    setVerified(true);
    if (!name) {
      setName(tab === "phone" ? "Ahmed Khan" : "Muhammad Arif");
    }
    if (isSignIn) {
      // In sign in mode, verifying OTP completes sign in directly
      onNext({
        name:
          name.trim() ||
          pickedAccount?.name ||
          (tab === "phone" ? "Ahmed Khan" : "Muhammad Arif"),
        contact: contactDisplay || "0300 1234567",
        location: location || "Pakpattan",
        profession,
      });
    }
  }

  function handleChangeContact() {
    setOtpSent(false);
  }

  // Google picker helpers
  function openGoogle() {
    setShowCustomInput(false);
    setCustomEmail("");
    setCustomEmailErr("");
    setGoogleStage("picker");
  }

  function pickAccount(acc: (typeof GOOGLE_SAMPLE_ACCOUNTS)[0]) {
    setPickedAccount(acc);
    setGoogleStage("consent");
  }

  function handleCustomEmailSubmit() {
    const v = customEmail.trim().toLowerCase();
    if (!isValidEmail(v)) {
      setCustomEmailErr(L("Enter a valid email address", "درست ای میل ایڈریس لکھیں"));
      return;
    }
    const synthetic = {
      email: v,
      name: nameFromEmail(v),
      initials: nameFromEmail(v).slice(0, 2).toUpperCase(),
      color: "#1a73e8",
    };
    pickAccount(synthetic);
  }

  function agreeToGoogle() {
    if (!pickedAccount) return;
    setEmailValue(pickedAccount.email);
    setName(pickedAccount.name);
    setTab("email");
    setOtpSent(false);
    setVerified(true);
    setGoogleStage("closed");
    if (isSignIn) {
      onNext({
        name: pickedAccount.name || "Muhammad Arif",
        contact: pickedAccount.email,
        location: "Pakpattan",
        profession: "",
      });
    }
  }

  return (
    <div
      className="screen-scroll s-enter"
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "55px 16px 32px",
      }}
    >
      <div className="auth-card" style={{ maxHeight: "none" }}>
        <Progress total={2} current={1} />
        <div className="eyebrow">
          {isSignIn ? L("Welcome Back", "خوش آمدید") : L("Step 2 of 2", "مرحلہ 2 از 2")}
        </div>
        <div className="headline">
          {isSignIn
            ? L("Sign In", "سائن اِن")
            : role === "customer"
              ? L("Customer Registration", "کسٹمر رجسٹریشن")
              : L("Representative Registration", "نمائندہ رجسٹریشن")}
        </div>
        <div className="subline">
          {!otpSent && !verified
            ? isSignIn
              ? L("Sign in with your mobile number or email to access your account.", "اپنے اکاؤنٹ میں جانے کے لیے موبائل نمبر یا ای میل سے سائن اِن کریں۔")
              : L("How would you like to sign up?", "آپ کس طرح سائن اَپ کرنا چاہیں گے؟")
            : otpSent && !verified
              ? L("Enter the OTP we sent you.", "ہمارا بھیجا ہوا OTP لکھیں۔")
              : L("Complete your profile to continue.", "جاری رکھنے کے لیے اپنی پروفائل مکمل کریں۔")}
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
              {tab === "email" ? L("Send Email OTP →", "ای میل پر OTP بھیجیں ←") : L("Send WhatsApp OTP →", "واٹس ایپ پر OTP بھیجیں ←")}
            </button>

            <Divider label={L("or", "یا")} />

            <button
              type="button"
              className="google-signup-btn"
              onClick={openGoogle}
            >
              {SocialIcon.google}
              <span>
                {isSignIn ? L("Sign in with Google", "گوگل سے سائن اِن کریں") : L("Continue with Google", "گوگل کے ساتھ جاری رکھیں")}
              </span>
            </button>

            {/* Switch between Sign In and Register */}
            <div style={{ textAlign: "center", marginTop: 18 }}>
              <span style={{ fontSize: 13, color: "var(--zm-muted)" }}>
                {isSignIn
                  ? L("Don't have an account? ", "اکاؤنٹ نہیں ہے؟ ")
                  : L("Already have an account? ", "پہلے سے اکاؤنٹ ہے؟ ")}
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
                {isSignIn ? L("Register / Sign Up", "رجسٹر / سائن اَپ") : L("Sign In", "سائن اِن")}
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
              {tab === "phone" ? L("← Change number", "نمبر تبدیل کریں →") : L("← Change email", "ای میل تبدیل کریں →")}
            </button>
          </>
        )}

        {/* ── Step 3: profile fields (Registration only) ── */}
        {verified && !isSignIn && (
          <>
            <ProfileFields
              name={name}
              setName={setName}
              profession={profession}
              setProfession={setProfession}
              location={location}
              setLocation={setLocation}
              showLocation={role === "representative"}
            />
            <TermsToggle agreed={agreedTerms} onChange={setAgreedTerms} />
            <button
              className="btn-primary"
              disabled={!profileComplete}
              onClick={() => {
                onNext({
                  name:
                    name.trim() ||
                    pickedAccount?.name ||
                    (tab === "phone" ? "Ahmed Khan" : "Muhammad Arif"),
                  contact:
                    contactDisplay || pickedAccount?.email || "0300 1234567",
                  location,
                  profession,
                });
              }}
            >
              {L("Continue to Zarai Mandi →", "زرعی منڈی پر جائیں ←")}
            </button>
          </>
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
          {L("← Back", "واپس →")}
        </button>
      </div>

      {/* ── Google account picker / consent modal ── */}
      {googleStage !== "closed" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={
            googleStage === "picker"
              ? L("Choose a Google account", "گوگل اکاؤنٹ منتخب کریں")
              : L("Sign in with Google", "گوگل سے سائن اِن کریں")
          }
          onClick={(e) => {
            if (e.target === e.currentTarget) setGoogleStage("closed");
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.38)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {/* ── Picker ── */}
          {googleStage === "picker" && (
            <div
              style={{
                width: "100%",
                maxWidth: 400,
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
                overflow: "hidden",
                color: "#202124",
              }}
            >
              {/* Header */}
              <div style={{ padding: "22px 22px 10px", textAlign: "center" }}>
                {SocialIcon.google}
                <div style={{ fontSize: 17, fontWeight: 500, marginTop: 10 }}>
                  {L("Choose an account", "اکاؤنٹ منتخب کریں")}
                </div>
                <div style={{ fontSize: 13, color: "#5f6368", marginTop: 2 }}>
                  {L("to continue to", "جاری رکھنے کے لیے:")} <strong>{L("Zarai Mandi", "زرعی منڈی")}</strong>
                </div>
              </div>
              <div style={{ borderTop: "1px solid #e8eaed" }}>
                {/* Sample accounts */}
                {GOOGLE_SAMPLE_ACCOUNTS.map((acc, idx) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => pickAccount(acc)}
                    style={{
                      width: "100%",
                      border: 0,
                      borderBottom:
                        idx < GOOGLE_SAMPLE_ACCOUNTS.length - 1
                          ? "1px solid #f1f3f4"
                          : "none",
                      background: "#fff",
                      padding: "12px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      textAlign: "left",
                      cursor: "pointer",
                      fontFamily: "Arial, sans-serif",
                      transition: "background .12s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f8f9fa")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#fff")
                    }
                  >
                    <span
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: acc.color,
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {acc.initials}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: "block",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#202124",
                        }}
                      >
                        {acc.name}
                      </span>
                      <span
                        style={{
                          display: "block",
                          fontSize: 12,
                          color: "#5f6368",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {acc.email}
                      </span>
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
                        width: "100%",
                        border: 0,
                        background: "#fff",
                        padding: "14px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        textAlign: "left",
                        cursor: "pointer",
                        color: "#3c4043",
                        fontSize: 14,
                        fontFamily: "Arial, sans-serif",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f8f9fa")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#fff")
                      }
                    >
                      <span
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          border: "2px solid #dadce0",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 22,
                          color: "#5f6368",
                        }}
                      >
                        +
                      </span>
                      <span>{L("Use another account", "دوسرا اکاؤنٹ استعمال کریں")}</span>
                    </button>
                  ) : (
                    <div style={{ padding: "12px 20px 16px" }}>
                      <input
                        autoFocus
                        type="email"
                        placeholder={L("Enter Google email", "گوگل ای میل لکھیں")}
                        value={customEmail}
                        onChange={(e) => {
                          setCustomEmail(e.target.value);
                          setCustomEmailErr("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCustomEmailSubmit();
                        }}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          border: customEmailErr
                            ? "1.5px solid #d93025"
                            : "1.5px solid #dadce0",
                          borderRadius: 6,
                          padding: "10px 12px",
                          fontSize: 14,
                          color: "#202124",
                          outline: "none",
                          fontFamily: "Arial, sans-serif",
                        }}
                      />
                      {customEmailErr && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#d93025",
                            marginTop: 4,
                          }}
                        >
                          {customEmailErr}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 8,
                          marginTop: 10,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomInput(false);
                            setCustomEmail("");
                            setCustomEmailErr("");
                          }}
                          style={{
                            border: 0,
                            background: "transparent",
                            color: "#1a73e8",
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                            padding: "8px 10px",
                            fontFamily: "Arial, sans-serif",
                          }}
                        >
                          {L("Cancel", "منسوخ")}
                        </button>
                        <button
                          type="button"
                          onClick={handleCustomEmailSubmit}
                          style={{
                            border: 0,
                            borderRadius: 4,
                            background: "#1a73e8",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                            padding: "8px 14px",
                            fontFamily: "Arial, sans-serif",
                          }}
                        >
                          {L("Next", "اگلا")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div
                style={{
                  padding: "10px 20px",
                  background: "#f8f9fa",
                  borderTop: "1px solid #e8eaed",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setGoogleStage("closed")}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "#1a73e8",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    padding: "6px 0",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {L("Cancel", "منسوخ")}
                </button>
              </div>
            </div>
          )}

          {/* ── Consent ── */}
          {googleStage === "consent" && pickedAccount && (
            <div
              style={{
                width: "100%",
                maxWidth: 380,
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
                padding: "28px 24px 20px",
                color: "#202124",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                {SocialIcon.google}
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>
                  {L("Sign in with Google", "گوگل سے سائن اِن کریں")}
                </div>
              </div>
              {/* Account chip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "1px solid #dadce0",
                  borderRadius: 24,
                  padding: "8px 14px",
                  marginBottom: 20,
                  width: "fit-content",
                  maxWidth: "100%",
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: pickedAccount.color,
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {pickedAccount.initials}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: "#3c4043",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {pickedAccount.name} · {pickedAccount.email}
                </span>
              </div>
              <p
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: "#3c4043",
                  margin: "0 0 12px",
                }}
              >
                {L("By continuing, Google will share your name, email and profile picture with Zarai Mandi.", "جاری رکھنے پر گوگل آپ کا نام، ای میل اور پروفائل تصویر زرعی منڈی کے ساتھ شیئر کرے گا۔")}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "#5f6368",
                  margin: "0 0 24px",
                  lineHeight: 1.5,
                }}
              >
                {L("You can manage Sign in with Google in your Google Account settings.", "آپ گوگل اکاؤنٹ کی سیٹنگز میں \"گوگل سے سائن اِن\" کا انتظام کر سکتے ہیں۔")}
              </p>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  type="button"
                  onClick={() => setGoogleStage("picker")}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "#1a73e8",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "10px 12px",
                    fontSize: 13.5,
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {L("Cancel", "منسوخ")}
                </button>
                <button
                  type="button"
                  onClick={agreeToGoogle}
                  style={{
                    border: 0,
                    borderRadius: 6,
                    background: "#1a73e8",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "10px 18px",
                    fontSize: 13.5,
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {L("Agree and continue", "متفق ہوں اور جاری رکھیں")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
