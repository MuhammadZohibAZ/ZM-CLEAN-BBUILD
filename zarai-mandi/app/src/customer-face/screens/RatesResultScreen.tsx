import { useState, useMemo } from "react";

import { RateCard } from "../components/RateCard";
import { ScrollRow } from "../components/ScrollRow";
import { ZMMessageModal } from "../components/ZMMessage";
import { getVerticalIcon } from "../shared/data/icons";
import {
  FEED_MESSAGES,
  getRowsForProducts,
  INITIAL_MANDIS,
  isMatchByproduct,
  isMatchProduct,
} from "../shared/data/mandis";
import { type FeedMsg, type RateItem, type RichRow } from "../shared/types";
import { MandiPickerSheet } from "../sheets/MandiPickerSheet";
import { PriceTypeSheet } from "../sheets/PriceTypeSheet";

//  RATES RESULT


export function RatesResultScreen({
  items,
  source,
  onBack,
}: {
  items: RateItem[];
  source: "product" | "byproduct";
  onBack: () => void;
}) {
  const [selectedMandis, setSelectedMandis] = useState<string[]>([]);
  const [selectedRateTypes, setSelectedRateTypes] = useState<string[]>([]);
  const [mandiSheet, setMandiSheet] = useState(false);
  const [rateSheet, setRateSheet] = useState(false);
  const [msgModal, setMsgModal] = useState<FeedMsg | null>(null);

  //  Spotlight: tap a chip in any row to "focus" on just that value
  // null = show all selected; set = show only rows matching that spotlight
  const [spotproduct, setSpotproduct] = useState<string | null>(null);
  const [spotMandi, setSpotMandi] = useState<string | null>(null);
  const [spotRateType, setSpotRateType] = useState<string | null>(null);

  // unique product labels from items
  const itemproducts = [...new Set(items.map((i) => i.product))];
  // active mandi set — if none selected show all from MANDI_ROWS
  const activeMandis =
    selectedMandis.length > 0
      ? selectedMandis
      : INITIAL_MANDIS.map((m) => m.name);

  const baseRows: RichRow[] = useMemo(() => {
    const pNames = items.map((it) => it.product);
    const pRows = getRowsForProducts(pNames);
    return pRows.filter((r) => {
      const matchItem = items.some(
        (it) =>
          isMatchProduct(r.product, it.product) &&
          (it.byproduct === "" || isMatchByproduct(r.byproduct, it.byproduct)),
      );
      const matchRate =
        selectedRateTypes.length === 0 || selectedRateTypes.includes(r.rateType);
      const matchMandi =
        selectedMandis.length === 0 || selectedMandis.includes(r.mandiName);
      return matchItem && matchRate && matchMandi;
    });
  }, [items, selectedRateTypes, selectedMandis]);

  const feedAsFallback: RichRow[] = FEED_MESSAGES.filter((m) => {
    const matchItem = items.some(
      (item) =>
        m.product === item.product &&
        (item.byproduct === "" || m.byproduct === item.byproduct),
    );
    const matchRate =
      selectedRateTypes.length === 0 || selectedRateTypes.includes(m.rateType);
    return matchItem && matchRate;
  }).map((m) => ({
    product: m.product,
    byproduct: m.byproduct,
    emoji: getVerticalIcon(m.vertical),
    rateType: m.rateType,
    arrival: m.arrivalCount || "",
    min: m.priceMin,
    max: m.priceMax,
    trend: m.trend || "stable",
    trendPct: m.trendPct || 0,
    mandiName: m.station,
    mandiCity: m.station,
    province: m.province,
    vertical: m.vertical,
  }));

  const sourceRows = baseRows.length > 0 ? baseRows : feedAsFallback;

  // Apply spotlight filters on top
  const displayed = sourceRows.filter((r) => {
    if (spotproduct && r.product !== spotproduct) return false;
    if (spotMandi && r.mandiName !== spotMandi) return false;
    if (spotRateType && r.rateType !== spotRateType) return false;
    return true;
  });

  const rowToMsg = (r: RichRow): FeedMsg => {
    const ex = FEED_MESSAGES.find(
      (m) => m.product === r.product && m.station === r.mandiName,
    );
    if (ex) return ex;
    return {
      id: Date.now(),
      time: "Today",
      vertical: r.vertical || "Grains",
      productUrdu: r.product,
      product: r.product,
      byproduct: r.byproduct,
      stationUrdu: r.mandiCity,
      station: r.mandiName,
      province: r.province,
      priceMin: r.min,
      priceMax: r.max,
      unit: "40 kg",
      arrivalCount: r.arrival,
      arrivalUnit: "",
      arrivalUnitUrdu: "",
      colorUrdu: "سفید",
      color: "White",
      rateType: r.rateType,
      specUrdu: "خشک",
      spec: "Dry",
      qualityUrdu: "نئی",
      quality: "New",
      qualityTypeUrdu: "تجارتی",
      qualityType: "Trade",
      trend: r.trend,
      trendPct: r.trendPct,
    };
  };

  const anySpotlight = !!(spotproduct || spotMandi || spotRateType);

  // Distinct values available in base rows for spotlight
  const availRateTypes = [...new Set(sourceRows.map((r) => r.rateType))];

  // SpotChip: tap = spotlight, tap again = deselect spotlight
  function SpotChip({
    label,
    active,
    color,
    onToggle,
  }: {
    label: string;
    active: boolean;
    color: string;
    onToggle: () => void;
  }) {
    return (
      <button
        onClick={onToggle}
        className="tap-target flex-shrink-0 flex items-center gap-1.5 rounded-full font-bold"
        style={{
          padding: "9px 15px",
          fontSize: 13,
          background: active ? color : "#fff",
          color: active ? "#fff" : color,
          border: `1.5px solid ${color}`,
          transition: "all 0.15s",
        }}
      >
        {label}
        {active && <span style={{ fontSize: 11, opacity: 0.75 }}></span>}
      </button>
    );
  }

  return (
    <div
      className="flex flex-col h-full screen-enter"
      style={{ background: "#F1F7F4" }}
    >
      {/*  Header  */}
      <div
        className="flex-shrink-0"
        style={{ background: "#F4FAF7", borderBottom: "1px solid #D5E2DD" }}
      >
        {/* Title bar */}
        <div className="px-4 pt-10 pb-2 flex items-center gap-3">
          <button
            onClick={onBack}
            className="tap-target w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "#E8EFEC" }}
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-xl">Rates</h1>
            <p className="text-xs" style={{ color: "#52635F" }}>
              {displayed.length} results · tap a chip to compare
            </p>
          </div>
          {anySpotlight && (
            <button
              onClick={() => {
                setSpotproduct(null);
                setSpotMandi(null);
                setSpotRateType(null);
              }}
              className="tap-target flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: "#F9E1DE",
                color: "#A83B37",
                border: "1.5px solid #E7AAA4",
              }}
            >
              ↺ Show All
            </button>
          )}
        </div>

        {/*  Picker row (Row 1): always visible — add/change Mandi & Price Type  */}
        <div
          className="flex gap-2 px-4 pb-2 pt-1"
          style={{ borderTop: "1px solid #E8EFEC" }}
        >
          <button
            onClick={() => setMandiSheet(true)}
            className="tap-target flex-1 flex items-center justify-center gap-1.5 rounded-2xl font-bold text-xs"
            style={{
              height: 38,
              background: selectedMandis.length > 0 ? "#147D72" : "#EAF5F1",
              color: selectedMandis.length > 0 ? "#fff" : "#147D72",
              border: "1.5px solid #C8E5DD",
            }}
          >
            {selectedMandis.length === 0
              ? "All Mandis"
              : selectedMandis.length === 1
                ? selectedMandis[0]
                : `${selectedMandis.length} Mandis`}

            {selectedMandis.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMandis([]);
                  setSpotMandi(null);
                }}
                style={{ opacity: 0.7, marginLeft: 2 }}
              ></button>
            )}
          </button>
          <button
            onClick={() => setRateSheet(true)}
            className="tap-target flex-1 flex items-center justify-center gap-1.5 rounded-2xl font-bold text-xs"
            style={{
              height: 38,
              background: selectedRateTypes.length > 0 ? "#168A76" : "#EAF5F1",
              color: selectedRateTypes.length > 0 ? "#fff" : "#168A76",
              border: "1.5px solid #C8E3DA",
            }}
          >
            {selectedRateTypes.length === 0
              ? "All Price Types"
              : selectedRateTypes.length === 1
                ? selectedRateTypes[0]
                : `${selectedRateTypes.length} Types`}

            {selectedRateTypes.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRateTypes([]);
                  setSpotRateType(null);
                }}
                style={{ opacity: 0.7, marginLeft: 2 }}
              ></button>
            )}
          </button>
        </div>

        {/*  Row 2: Items — always shown, each chip spotlights  */}
        <ScrollRow bg="#fff" style={{ borderTop: "1px solid #EFF8F3" }}>
          <span
            className="flex-shrink-0 text-[11px] font-extrabold uppercase tracking-wider"
            style={{ color: "#52635F", minWidth: 30 }}
          >
            Item
          </span>
          {itemproducts.map((c) => {
            const v = items.find((i) => i.product === c)?.vertical || "";
            const bps = items.filter((i) => i.product === c && i.byproduct);
            return bps.length > 0 ? (
              bps.map((bp) => (
                <SpotChip
                  key={`${c}-${bp.byproduct}`}
                  label={bp.byproduct}
                  active={spotproduct === c}
                  color="#087F63"
                  onToggle={() => setSpotproduct((p) => (p === c ? null : c))}
                />
              ))
            ) : (
              <SpotChip
                key={c}
                label={c}
                active={spotproduct === c}
                color="#087F63"
                onToggle={() => setSpotproduct((p) => (p === c ? null : c))}
              />
            );
          })}
        </ScrollRow>

        {/*  Row 3: Mandis — shown when mandis are selected  */}
        {selectedMandis.length > 0 && (
          <ScrollRow bg="#EAF5F1" style={{ borderTop: "1px solid #EAF5F1" }}>
            <span
              className="flex-shrink-0 text-[11px] font-extrabold uppercase tracking-wider"
              style={{ color: "#52635F", minWidth: 38 }}
            >
              Mandi
            </span>
            {selectedMandis.map((m) => (
              <SpotChip
                key={m}
                label={m}
                active={spotMandi === m}
                color="#147D72"
                onToggle={() => setSpotMandi((p) => (p === m ? null : m))}
              />
            ))}
          </ScrollRow>
        )}

        {/*  Row 4: Price Types — shown when price types are selected  */}
        {selectedRateTypes.length > 0 && (
          <ScrollRow bg="#EAF5F1" style={{ borderTop: "1px solid #EAF5F1" }}>
            <span
              className="flex-shrink-0 text-[11px] font-extrabold uppercase tracking-wider"
              style={{ color: "#52635F", minWidth: 36 }}
            >
              Price
            </span>
            {selectedRateTypes.map((rt) => (
              <SpotChip
                key={rt}
                label={rt}
                active={spotRateType === rt}
                color="#168A76"
                onToggle={() => setSpotRateType((p) => (p === rt ? null : rt))}
              />
            ))}
          </ScrollRow>
        )}
      </div>

      {/*  Results  */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
        <div className="flex flex-col gap-3">
          {displayed.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 opacity-50">
              <span style={{ fontSize: 48 }}></span>
              <p className="font-semibold mt-2">
                No results for this combination
              </p>
              <button
                onClick={() => {
                  setSpotproduct(null);
                  setSpotMandi(null);
                  setSpotRateType(null);
                }}
                className="tap-target mt-3 px-4 py-2 rounded-2xl text-sm font-bold"
                style={{ background: "#087F63", color: "#fff" }}
              >
                Show All
              </button>
            </div>
          )}
          {displayed.map((r, i) => (
            <RateCard key={i} r={r} onClick={() => setMsgModal(rowToMsg(r))} />
          ))}
        </div>
      </div>

      {mandiSheet && (
        <MandiPickerSheet
          selected={selectedMandis}
          onApply={(s) => {
            setSelectedMandis(s);
            setSpotMandi(null);
          }}
          onClose={() => setMandiSheet(false)}
        />
      )}
      {rateSheet && (
        <PriceTypeSheet
          selected={selectedRateTypes}
          onApply={(s) => {
            setSelectedRateTypes(s);
            setSpotRateType(null);
          }}
          onClose={() => setRateSheet(false)}
        />
      )}
      {msgModal && (
        <ZMMessageModal msg={msgModal} onClose={() => setMsgModal(null)} />
      )}
    </div>
  );
}
