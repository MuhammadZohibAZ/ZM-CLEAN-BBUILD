// Onboarding: "setting up your account" loader.

import { useEffect, useState } from "react";
import logoImg from "@/imports/zmlogodark-removebg-preview.png";

// ─── Loading ──────────────────────────────────────────────────────────────────
export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const dotId = setInterval(
      () => setDots((d) => (d.length >= 3 ? "" : d + ".")),
      480,
    );
    const navId = setTimeout(onDone, 3000);
    return () => {
      clearInterval(dotId);
      clearTimeout(navId);
    };
  }, []);

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
  );
}
