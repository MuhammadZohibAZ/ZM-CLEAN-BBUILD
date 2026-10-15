import { useEffect, useState } from "react";
import { CITIES, type Role, type Screen } from "./data";
import { LangScreen } from "./steps/LangScreen";
import { RoleScreen } from "./steps/RoleScreen";
import { AccountScreen } from "./steps/AccountScreen";
import { ZM_OB_THEME } from "./theme";
import { OB_URDU_CSS, useObLang } from "./i18n";
import { RepPendingScreen } from "./steps/RepPendingScreen";

// ─── Exported Types ───────────────────────────────────────────────────────────
export interface OnboardingUserData {
  name: string;
  phone: string;
  profession?: string;
  contact?: string;
  role: Role;
  products: string[];
  city: string;
  district: string;
  province: string;
}

export default function OnboardingFlow({
  onComplete,
  initialMode = "register",
  initialRole = "customer",
}: {
  onComplete: (data: OnboardingUserData) => void;
  initialMode?: "register" | "signin";
  initialRole?: Role;
}) {
  const { dir, setLang } = useObLang();
  const [authMode, setAuthMode] = useState<"register" | "signin">(initialMode);
  const [screen, setScreen] = useState<Screen>(
    initialRole === "representative"
      ? "role"
      : initialMode === "signin"
        ? "account"
        : "lang",
  );
  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profession, setProfession] = useState("");
  const [products] = useState<string[]>(["wheat"]);
  const [city, setCity] = useState("Pakpattan");
  const [district, setDistrict] = useState("Pakpattan");
  const [province, setProvince] = useState("Punjab");

  useEffect(() => {
    setAuthMode(initialMode);
    setRole(initialRole);
    if (initialRole === "representative") {
      setScreen("role");
    } else if (initialMode === "signin") {
      setScreen("account");
    }
  }, [initialMode, initialRole]);

  function go(s: Screen) {
    setScreen(s);
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
    });
  };

  return (
    <>
      <style>{ZM_OB_THEME}</style>
      <style>{OB_URDU_CSS}</style>
      {/* dir="rtl" + Urdu font once Urdu is picked on the first screen */}
      <div className="phone-shell" dir={dir}>
        {screen === "lang" && (
          <LangScreen
            onNext={(code) => {
              setLang(code === "ur" ? "ur" : "en");
              go("role");
            }}
          />
        )}

        {screen === "role" && (
          <RoleScreen
            initialRole={role || initialRole}
            onNext={(r) => {
              setRole(r);
              setAuthMode("register");
              go("account");
            }}
            onBack={() => go("lang")}
            onSignIn={() => {
              setRole("customer");
              setAuthMode("signin");
              go("account");
            }}
          />
        )}

        {screen === "account" && (
          <AccountScreen
            role={role}
            mode={authMode}
            onSwitchMode={(newMode) => {
              setAuthMode(newMode);
            }}
            onNext={({
              name: n,
              contact,
              location: repLocation,
              profession: prof,
            }) => {
              setName(n);
              setPhone(contact);
              setProfession(prof);
              if (role === "representative") {
                if (repLocation) {
                  const match = CITIES.find((c) => c.city === repLocation);
                  if (match) {
                    setCity(match.city);
                    setDistrict(match.district);
                    setProvince(match.province);
                  }
                }
                go("rep-pending");
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
                });
              }
            }}
            onBack={() => {
              if (authMode === "signin") {
                go("role");
              } else {
                go("role");
              }
            }}
          />
        )}

        {screen === "rep-pending" && (
          <RepPendingScreen name={name} onProceed={() => handleDone()} />
        )}
      </div>
    </>
  );
}
