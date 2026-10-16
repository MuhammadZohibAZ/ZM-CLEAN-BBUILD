// Onboarding step 1: choose English / Urdu.

import logoImg from "@/imports/zmlogodark-removebg-preview.png";
import { LANGUAGES } from "../data";

// ─── Screen 1 – Language ──────────────────────────────────────────────────────
export function LangScreen({ onNext }: { onNext: (code: string) => void }) {
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
            onClick={() => onNext(lng.code)}
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
  );
}
