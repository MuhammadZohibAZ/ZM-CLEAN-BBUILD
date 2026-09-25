import { useState } from "react";

import { HOME_ICONS } from "../shared/data/icons";
import { INITIAL_MANDIS, type MandiItem } from "../shared/data/mandis";
import { useLang } from "../shared/i18n/LangProvider";
import { type LocationScope, type Screen } from "../shared/types";
import { MultiLocSheet } from "../sheets/MultiLocSheet";

//  MANDI LIST

export function MandiListScreen({
  push,
  onBack,
}: {
  push: (s: Screen) => void;
  onBack: () => void;
}) {
  const { lang, tm } = useLang();
  const [tab, setTab] = useState<"fav" | "nearby" | "browse">("fav");
  const [mandis, setMandis] = useState<MandiItem[]>(INITIAL_MANDIS);
  const [locPickerOpen, setLocPickerOpen] = useState(false);
  const [locSelections, setLocSelections] = useState<
    {
      kind: LocationScope["kind"];
      label: string;
    }[]
  >([]);

  const toggleFav = (id: string) =>
    setMandis((p) => p.map((m) => (m.id === id ? { ...m, fav: !m.fav } : m)));
  const favMandis = mandis.filter((m) => m.fav);
  const nearbyMandis = [...mandis].sort(
    (a, b) => parseFloat(a.distance) - parseFloat(b.distance),
  );

  const MandiCard = ({ m }: { m: MandiItem }) => (
    <div
      className="flex-shrink-0 rounded-2xl overflow-hidden"
      style={{
        background: "#F4FAF7",
        border: `1.5px solid ${m.fav ? "#E4F2EC" : "#D5E2DD"}`,
      }}
    >
      <div
        className="w-full flex items-center gap-3 p-4 text-left"
        style={{ height: 76, cursor: "pointer" }}
        onClick={() => push({ id: "mandi-detail", mandiId: m.id })}
      >
        <img
          src={HOME_ICONS.mandi}
          alt="Mandi"
          style={{ width: 40, height: 40, objectFit: "contain", flexShrink: 0 }}
        />
        <div className="flex-1">
          <p className="font-bold text-base">{tm(m.name)}</p>
          <p className="text-xs mt-0.5" style={{ color: "#52635F" }}>
            {tm(m.province)} · {m.distance}
          </p>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            toggleFav(m.id);
          }}
          onKeyDown={(e) =>
            e.key === "Enter" && (e.stopPropagation(), toggleFav(m.id))
          }
          className="tap-target text-xl"
          style={{ color: m.fav ? "#D79A2B" : "#C7D6D0", cursor: "pointer" }}
        >
          {m.fav ? "" : ""}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="flex flex-col h-full screen-enter"
      style={{ background: "#F1F7F4" }}
    >
      <header
        className="px-4 pt-10 pb-3 flex-shrink-0"
        style={{ background: "#F4FAF7", borderBottom: "1px solid #D5E2DD" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="tap-target w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "#E8EFEC" }}
          >
            {lang === "ur" ? "→" : "←"}
          </button>
          <div>
            <h1 className="font-extrabold text-xl">
              {lang === "ur" ? "منڈیاں" : "Mandis"}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          {(["fav", "nearby", "browse"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="tap-target flex-1 rounded-2xl font-bold text-xs"
              style={{
                height: 44,
                background: tab === t ? "#087F63" : "#E8EFEC",
                color: tab === t ? "#fff" : "#183B34",
              }}
            >
              {t === "fav"
                ? lang === "ur"
                  ? "پسندیدہ"
                  : " Favourites"
                : t === "nearby"
                  ? lang === "ur"
                    ? "قریب"
                    : " Nearby"
                  : lang === "ur"
                    ? "براؤز"
                    : " Browse"}
            </button>
          ))}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pt-3 pb-4 flex flex-col gap-2">
        {tab === "fav" &&
          (favMandis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-50">
              <span style={{ fontSize: 48 }}></span>
              <p className="font-semibold text-center">
                {lang === "ur" ? "کوئی پسندیدہ نہیں۔" : "No favourites yet."}
                <br />
                {lang === "ur"
                  ? "منڈی پن کرنے کے لیے ٹیپ کریں۔"
                  : "Tap to pin a mandi."}
              </p>
            </div>
          ) : (
            favMandis.map((m) => <MandiCard key={m.id} m={m} />)
          ))}
        {tab === "nearby" &&
          nearbyMandis.map((m) => <MandiCard key={m.id} m={m} />)}
        {tab === "browse" && (
          <>
            <button
              onClick={() => setLocPickerOpen(true)}
              className="tap-target rounded-2xl flex items-center gap-3 px-4"
              style={{
                height: 56,
                background: "#F4FAF7",
                border: "1.5px dashed #C7D6D0",
              }}
            >
              <span className="text-xl"></span>
              <span
                className="font-semibold text-sm"
                style={{ color: "#52635F" }}
              >
                {locSelections.length > 0
                  ? locSelections.map((s) => s.label).join(", ")
                  : "Select Location — Province · District · Mandi"}
              </span>
              {locSelections.length > 0 && (
                <span
                  className="ml-auto text-xs font-bold rounded-full px-2 py-0.5"
                  style={{ background: "#E4F2EC", color: "#087F63" }}
                >
                  {locSelections.length}
                </span>
              )}
            </button>
            {(() => {
              const browseMandis =
                locSelections.length === 0
                  ? INITIAL_MANDIS
                  : INITIAL_MANDIS.filter((m) =>
                    locSelections.some((sel) => {
                      if (sel.kind === "pakistan") return true;
                      if (sel.kind === "province")
                        return m.province === sel.label;
                      if (sel.kind === "district")
                        return m.city === sel.label;
                      if (sel.kind === "mandi") return m.name === sel.label;
                      return false;
                    }),
                  );
              return browseMandis.map((m) => <MandiCard key={m.id} m={m} />);
            })()}
          </>
        )}
      </div>
      {locPickerOpen && (
        <MultiLocSheet
          selected={locSelections}
          onApply={(locs) => {
            setLocSelections(locs);
            setLocPickerOpen(false);
          }}
          onClose={() => setLocPickerOpen(false)}
        />
      )}
    </div>
  );
}
