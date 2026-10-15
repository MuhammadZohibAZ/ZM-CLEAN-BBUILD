// Onboarding step 2: customer or representative.

import { useState } from "react";
import { type Role } from "../data";
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
  const [role, setRole] = useState<Role | "">(initialRole || "");

  const roles: { id: Role; label: string }[] = [
    { id: "customer", label: "Customer" },
    { id: "representative", label: "Representative" },
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
  );
}
