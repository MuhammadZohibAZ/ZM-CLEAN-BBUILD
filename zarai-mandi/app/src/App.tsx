import { useState } from "react"
import OnboardingFlow, { type OnboardingUserData } from "./OnboardingFlow"
import CustomerFaceApp from "./CustomerFaceApp"

export default function App() {
  const [stage, setStage] = useState<"onboarding" | "customer_face">("onboarding")
  const [authMode, setAuthMode] = useState<"register" | "signin">("register")
  const [initialRole, setInitialRole] = useState<"customer" | "representative">("customer")
  const [activeRole, setActiveRole] = useState<"customer" | "representative">("customer")
  const [hasRepAccount, setHasRepAccount] = useState(false)
  const [userData, setUserData] = useState<OnboardingUserData | null>(null)

  const handleOnboardingComplete = (data: OnboardingUserData) => {
    console.log("Onboarding completed with user data:", data)
    setUserData(data)
    if (data.role === "representative") {
      setHasRepAccount(true)
      setActiveRole("representative")
    } else {
      setActiveRole("customer")
    }
    setStage("customer_face")
  }

  const handleRestartOnboarding = (mode: "register" | "signin" = "signin") => {
    setAuthMode(mode)
    setInitialRole("customer")
    setStage("onboarding")
  }

  const handleStartRepOnboarding = () => {
    setAuthMode("register")
    setInitialRole("representative")
    setStage("onboarding")
  }

  const handleSwitchRole = (newRole: "customer" | "representative") => {
    setActiveRole(newRole)
  }

  return (
    <main
      className="w-full h-full min-h-screen flex justify-center bg-[#F1F7F4] overflow-hidden"
      style={{
        width: "100vw",
        height: "100dvh",
        margin: 0,
        padding: 0,
        background: "#F1F7F4",
      }}
    >
      {/* Floating Mode Toggle Pill for Testing & Role Switching */}
      <div
        style={{
          position: "fixed",
          top: 10,
          right: 14,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(6, 45, 36, 0.92)",
          backdropFilter: "blur(12px)",
          padding: "4px 10px",
          borderRadius: 24,
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: "#B4E6D2",
            letterSpacing: "0.03em",
          }}
        >
          {stage === "onboarding"
            ? initialRole === "representative"
              ? "Rep Onboarding"
              : authMode === "signin"
                ? "Sign In"
                : "Onboarding"
            : activeRole === "representative"
              ? "Rep Dashboard"
              : "Customer App"}
        </span>
        <button
          onClick={() => {
            if (stage === "onboarding") {
              setStage("customer_face")
            } else {
              setAuthMode("register")
              setInitialRole("customer")
              setStage("onboarding")
            }
          }}
          className="tap-target"
          style={{
            background: "#2FAE68",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "2px 8px",
            fontSize: 9.5,
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
          }}
          title={stage === "onboarding" ? "Skip to Customer App" : "Restart Onboarding"}
        >
          {stage === "onboarding" ? "Skip ➔" : "↺ Reset"}
        </button>
      </div>

      {/* Responsive Mobile Container — fits any screen width/height */}
      <div
        className="w-full h-full flex flex-col mx-auto relative overflow-hidden"
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "100dvh",
          background: "#F1F7F4",
        }}
      >
        {stage === "onboarding" ? (
          <OnboardingFlow
            initialMode={authMode}
            initialRole={initialRole}
            onComplete={handleOnboardingComplete}
          />
        ) : (
          <CustomerFaceApp
            initialUserData={userData || undefined}
            activeRole={activeRole}
            hasRepAccount={hasRepAccount}
            onSwitchRole={handleSwitchRole}
            onStartRepOnboarding={handleStartRepOnboarding}
            onRestartOnboarding={handleRestartOnboarding}
          />
        )}
      </div>
    </main>
  )
}