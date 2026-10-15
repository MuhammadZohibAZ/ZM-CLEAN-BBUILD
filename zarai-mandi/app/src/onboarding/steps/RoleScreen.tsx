// Onboarding step 2: customer or representative.

import { useState } from "react";
import { type Role } from "../data";
import { useObLang } from "../i18n";
import { Progress } from "../parts";

// ─── Screen 2 – Who Are You? (simplified — no descriptions, no sub-options) ──
export function RoleScreen({
  initialRole,
  onNext,
  onBack,
  onSignIn,
}: {
  initialRole?: Role;
  onNext: (role: Role) => void;
  onBack: () => void;
  onSignIn?: () => void;
}) {
  const { L } = useObLang();
  const [role, setRole] = useState<Role | "">(initialRole || "");

  const roles: { id: Role; label: string }[] = [
    { id: "customer", label: L("Customer", "کسٹمر") },
    { id: "representative", label: L("Representative", "نمائندہ") },
  ];

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
        <div className="eyebrow">{L("Step 1 of 2", "مرحلہ 1 از 2")}</div>
        <div className="headline">{L("Who are you?", "آپ کون ہیں؟")}</div>
        <div className="subline">
          {L("Select your role to personalise Zarai Mandi.", "زرعی منڈی کو اپنے لیے موزوں بنانے کے لیے اپنا کردار منتخب کریں۔")}
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
          {L("Continue →", "جاری رکھیں ←")}
        </button>

        {onSignIn && (
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <span style={{ fontSize: 13, color: "var(--zm-muted)" }}>
              {L("Already have an account?", "پہلے سے اکاؤنٹ ہے؟")}{" "}
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
              {L("Sign In", "سائن اِن")}
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
          {L("← Change Language / زبان", "زبان تبدیل کریں / Language →")}
        </button>
      </div>
    </div>
  );
}
