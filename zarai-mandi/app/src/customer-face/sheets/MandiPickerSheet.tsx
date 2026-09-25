import React, { useState } from "react";

import { ALL_MANDI_NAMES, LOCATIONS } from "../shared/data/mandis";

export function MandiPickerSheet({
  selected,
  onApply,
  onClose,
}: {
  selected: string[];
  onApply: (names: string[]) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<string[]>(selected);
  const [province, setProvince] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");

  const toggle = (name: string) =>
    setLocal((p) =>
      p.includes(name) ? p.filter((x) => x !== name) : [...p, name],
    );
  const searchResults =
    searchQ.length >= 2
      ? ALL_MANDI_NAMES.filter((n) =>
        n.toLowerCase().includes(searchQ.toLowerCase()),
      )
      : [];
  const back = () => {
    if (district) setDistrict(null);
    else if (province) setProvince(null);
  };

  return (
    <div className="zm-sheet-overlay" style={{ zIndex: 200 }} onClick={onClose}>
      <div
        className="zm-sheet-high"
        style={{ maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-3 border-b border-[#DCE8E3] flex-shrink-0">
          <div className="zm-drag-handle" />
          <div className="flex items-center gap-3 mb-3">
            {(province || district) && (
              <button
                className="tap-target text-xl w-9 h-9 flex items-center justify-center rounded-xl"
                style={{ background: "#E8EFEC" }}
                onClick={back}
              >
                ←
              </button>
            )}
            <div className="flex-1">
              <p className="font-bold text-lg">
                {!province
                  ? "Select Mandi"
                  : !district
                    ? province
                    : `${province} › ${district}`}
              </p>
              <p className="text-xs" style={{ color: "#52635F" }}>
                {!province
                  ? "Province or search"
                  : !district
                    ? "Select district"
                    : "Select mandi"}
              </p>
            </div>
            {local.length > 0 && (
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: "#087F63", color: "#fff" }}
              >
                {local.length}
              </span>
            )}
          </div>
          <div
            className="flex items-center gap-2 rounded-2xl px-3"
            style={{ background: "#E8EFEC", height: 44 }}
          >
            <span></span>
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search mandi name…"
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ fontFamily: "Poppins,sans-serif" }}
            />
            {searchQ && (
              <button
                onClick={() => setSearchQ("")}
                className="tap-target text-[#80918B]"
              ></button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0 p-4 flex flex-col gap-2">
          {searchQ.length >= 2 ? (
            searchResults.length > 0 ? (
              searchResults.map((name) => (
                <button
                  key={name}
                  onClick={() => toggle(name)}
                  className="tap-target flex-shrink-0 rounded-2xl px-4 flex items-center gap-3"
                  style={{
                    background: local.includes(name) ? "#F1F7F4" : "#F1F7F4",
                    border: `1.5px solid ${local.includes(name) ? "#087F63" : "#D5E2DD"
                      }`,
                    height: 60,
                  }}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                    style={{
                      background: local.includes(name) ? "#087F63" : "#E8EFEC",
                    }}
                  >
                    {local.includes(name) && (
                      <span
                        className="text-white font-bold"
                        style={{ fontSize: 10 }}
                      ></span>
                    )}
                  </div>
                  <span className="font-semibold text-sm flex-1 text-left">
                    {name}
                  </span>
                </button>
              ))
            ) : (
              <div className="text-center py-10 opacity-40">
                <span style={{ fontSize: 36 }}></span>
                <p className="text-sm mt-2">No mandi found</p>
              </div>
            )
          ) : !province ? (
            Object.keys(LOCATIONS).map((p) => {
              const allProvMandis = Object.values(LOCATIONS[p]).flat();
              const provSelCount = allProvMandis.filter((m) =>
                local.includes(m),
              ).length;
              const provAllSel = provSelCount === allProvMandis.length;
              const toggleProv = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (provAllSel)
                  setLocal((l) => l.filter((x) => !allProvMandis.includes(x)));
                else
                  setLocal((l) => [
                    ...l.filter((x) => !allProvMandis.includes(x)),
                    ...allProvMandis,
                  ]);
              };
              return (
                <div
                  key={p}
                  className="flex-shrink-0 rounded-2xl overflow-hidden"
                  style={{
                    border: `1.5px solid ${provSelCount > 0 ? "#087F63" : "#D5E2DD"
                      }`,
                  }}
                >
                  <button
                    onClick={() => {
                      setProvince(p);
                      setDistrict(null);
                    }}
                    className="tap-target w-full px-4 flex items-center justify-between"
                    style={{
                      background: provSelCount > 0 ? "#F1F7F4" : "#F1F7F4",
                      height: 64,
                    }}
                  >
                    <div className="text-left">
                      <p className="font-bold text-base">{p}</p>
                      <p className="text-xs" style={{ color: "#52635F" }}>
                        {Object.keys(LOCATIONS[p]).length} districts ·{" "}
                        {allProvMandis.length} mandis
                        {provSelCount > 0 ? ` · ${provSelCount} selected` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleProv}
                        className="tap-target flex items-center gap-1 rounded-xl px-2 py-1.5"
                        style={{
                          background: provAllSel ? "#087F63" : "#fff",
                          border: `1.5px solid #087F63`,
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center"
                          style={{
                            background: provAllSel ? "#fff" : "transparent",
                            border: provAllSel ? "none" : "1.5px solid #087F63",
                          }}
                        >
                          {provAllSel && (
                            <span
                              style={{
                                fontSize: 9,
                                color: "#087F63",
                                fontWeight: 700,
                                lineHeight: 1,
                              }}
                            ></span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: provAllSel ? "#fff" : "#087F63",
                          }}
                        >
                          All
                        </span>
                      </button>
                      <span style={{ color: "#52635F" }}>›</span>
                    </div>
                  </button>
                </div>
              );
            })
          ) : !district ? (
            Object.keys(LOCATIONS[province]).map((d) => {
              const distMandis = LOCATIONS[province][d];
              const distSelCount = distMandis.filter((m) =>
                local.includes(m),
              ).length;
              const distAllSel = distSelCount === distMandis.length;
              const toggleDist = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (distAllSel)
                  setLocal((l) => l.filter((x) => !distMandis.includes(x)));
                else
                  setLocal((l) => [
                    ...l.filter((x) => !distMandis.includes(x)),
                    ...distMandis,
                  ]);
              };
              return (
                <div
                  key={d}
                  className="flex-shrink-0 rounded-2xl overflow-hidden"
                  style={{
                    border: `1.5px solid ${distSelCount > 0 ? "#087F63" : "#D5E2DD"
                      }`,
                  }}
                >
                  <button
                    onClick={() => setDistrict(d)}
                    className="tap-target w-full px-4 flex items-center justify-between"
                    style={{
                      background: distSelCount > 0 ? "#F1F7F4" : "#F1F7F4",
                      height: 60,
                    }}
                  >
                    <div className="text-left">
                      <p className="font-semibold text-sm">{d}</p>
                      <p className="text-xs" style={{ color: "#52635F" }}>
                        {distMandis.length} mandis
                        {distSelCount > 0 ? ` · ${distSelCount} selected` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleDist}
                        className="tap-target flex items-center gap-1 rounded-xl px-2 py-1.5"
                        style={{
                          background: distAllSel ? "#087F63" : "#fff",
                          border: `1.5px solid #087F63`,
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center"
                          style={{
                            background: distAllSel ? "#fff" : "transparent",
                            border: distAllSel ? "none" : "1.5px solid #087F63",
                          }}
                        >
                          {distAllSel && (
                            <span
                              style={{
                                fontSize: 9,
                                color: "#087F63",
                                fontWeight: 700,
                                lineHeight: 1,
                              }}
                            ></span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: distAllSel ? "#fff" : "#087F63",
                          }}
                        >
                          All
                        </span>
                      </button>
                      <span style={{ color: "#52635F" }}>›</span>
                    </div>
                  </button>
                </div>
              );
            })
          ) : (
            LOCATIONS[province][district].map((name) => (
              <button
                key={name}
                onClick={() => toggle(name)}
                className="tap-target flex-shrink-0 rounded-2xl px-4 flex items-center gap-3"
                style={{
                  background: local.includes(name) ? "#F1F7F4" : "#F1F7F4",
                  border: `1.5px solid ${local.includes(name) ? "#087F63" : "#D5E2DD"
                    }`,
                  height: 60,
                }}
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    background: local.includes(name) ? "#087F63" : "#E8EFEC",
                  }}
                >
                  {local.includes(name) && (
                    <span
                      className="text-white font-bold"
                      style={{ fontSize: 10 }}
                    ></span>
                  )}
                </div>
                <span className="font-semibold text-sm flex-1 text-left">
                  {name}
                </span>
              </button>
            ))
          )}
        </div>
        {local.length > 0 && (
          <div className="px-4 py-2 overflow-x-auto flex gap-2 flex-shrink-0 border-t border-[#DCE8E3]">
            {local.map((n) => (
              <span
                key={n}
                className="flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: "#087F63", color: "#fff" }}
              >
                {n}{" "}
                <button
                  onClick={() => toggle(n)}
                  className="opacity-70 tap-target"
                ></button>
              </span>
            ))}
          </div>
        )}
        <div
          className="px-4 pb-6 pt-3 flex-shrink-0"
          style={{ background: "#F4FAF7", borderTop: "1px solid #D5E2DD" }}
        >
          <button
            onClick={() => {
              onApply(local);
              onClose();
            }}
            className="tap-target w-full rounded-2xl py-4 font-bold text-white text-base"
            style={{ background: "#087F63" }}
          >
            {local.length > 0
              ? `Show Rates · ${local.length} Mandi${local.length > 1 ? "s" : ""
              }`
              : "Show All Mandis"}
          </button>
        </div>
      </div>
    </div>
  );
}
