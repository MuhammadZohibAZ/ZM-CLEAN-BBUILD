// Onboarding: pick your city (and district / province).

import { useState } from "react";
import { CITIES, PROVINCES } from "../data";
import { Divider, Progress } from "../parts";

// ─── Screen 6 – Location ──────────────────────────────────────────────────────
export function LocationScreen({
  onNext,
  onBack,
}: {
  onNext: (city: string, district: string, province: string) => void;
  onBack: () => void;
}) {
  const [selectedProvince, setSelectedProvince] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<(typeof CITIES)[0] | null>(null);

  const citiesInProvince = selectedProvince
    ? CITIES.filter((c) => c.province === selectedProvince)
    : CITIES;
  const filtered = citiesInProvince.filter((c) =>
    c.city.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSelect(c: (typeof CITIES)[0]) {
    setSelected(c);
    onNext(c.city, c.district, c.province);
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
              className={`occ-option${
                selectedProvince === prov ? " selected" : ""
              }`}
              onClick={() => {
                setSelectedProvince(prov);
                setSelected(null);
                setSearch("");
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
                  className={`occ-option${
                    selected?.city === c.city ? " selected" : ""
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
  );
}
