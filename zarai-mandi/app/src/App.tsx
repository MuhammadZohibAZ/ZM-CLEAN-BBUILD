import { useEffect, useRef, useState } from "react"
import { TEST_MODE } from "./lib/testMode"
import { preloadFonts } from "./lib/fonts"
import { onDevCommand, publishDevControls } from "./lib/device-bridge"
import OnboardingFlow, { type OnboardingUserData } from "./onboarding/OnboardingFlow"
import CustomerFaceApp from "./CustomerFaceApp"
import { LangProvider } from "./customer-face/shared/i18n/LangProvider"

export default function App() {
  // The test link (?test=1) opens straight into the app, skipping sign-up.
  const [stage, setStage] = useState<"onboarding" | "customer_face">(() =>
    new URLSearchParams(window.location.search).get("test") === "1" ? "customer_face" : "onboarding",
  )
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

  // Testing pill: label + Skip/Reset, in test mode only and only beside the
  // desktop phone mockup (DevicePreview). On a phone it covered the app's own
  // buttons; the test link skips sign-up instead.
  const devLabel =
    stage === "onboarding"
      ? initialRole === "representative"
        ? "Rep Onboarding"
        : authMode === "signin"
          ? "Sign In"
          : "Onboarding"
      : activeRole === "representative"
        ? "Rep Dashboard"
        : "Customer App"
  const devAction = stage === "onboarding" ? "Skip ➔" : "↺ Reset"
  const devTitle = stage === "onboarding" ? "Skip to Customer App" : "Restart Onboarding"
  const handleDevAction = () => {
    if (stage === "onboarding") {
      setStage("customer_face")
    } else {
      setAuthMode("register")
      setInitialRole("customer")
      setStage("onboarding")
    }
  }
  const devActionRef = useRef(handleDevAction)
  devActionRef.current = handleDevAction

  useEffect(() => {
    if (TEST_MODE) publishDevControls({ label: devLabel, action: devAction, title: devTitle })
  }, [devLabel, devAction, devTitle])
  useEffect(() => (TEST_MODE ? onDevCommand(() => devActionRef.current()) : undefined), [])

  // Once this first screen is up, fetch the other screens' fonts, so none of them
  // first draws in a fallback font (and they don't slow this screen's start).
  useEffect(() => {
    const t = window.setTimeout(preloadFonts, 0)
    return () => window.clearTimeout(t)
  }, [])

  return (
    // One language for onboarding and the app (theme CSS comes with CustomerFaceApp).
    <LangProvider injectTheme={false}>
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

        {/* Responsive Mobile Container — fits any screen width/height */}
        <div
          className="zm-shell w-full h-full flex flex-col mx-auto relative overflow-hidden"
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
    </LangProvider>
  )
}