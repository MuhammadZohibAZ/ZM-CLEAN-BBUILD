import { useState } from "react";

import { ProductIcon } from "../components/ProductIcon";
import { RateCard } from "../components/RateCard";
import { ScrollRow } from "../components/ScrollRow";
import { ZMMessageModal } from "../components/ZMMessage";
import { VERTICALS } from "../shared/data/catalog";
import {
  FEED_MESSAGES,
  INITIAL_MANDIS,
  MANDI_ATTR_AVAILABLE,
  MANDI_ROWS,
} from "../shared/data/mandis";
import { ALL_RATE_TYPES } from "../shared/data/rates";
import { type FeedMsg, type Screen } from "../shared/types";
import { PriceTypeSheet } from "../sheets/PriceTypeSheet";

export function MandiDetailScreen({
  mandiId,
  onBack,
  push,
}: {
  mandiId: string;
  onBack: () => void;
  push: (s: Screen) => void;
}) {
  const mandi = INITIAL_MANDIS.find((m) => m.id === mandiId) || {
    id: mandiId,
    name: MANDI_ROWS[mandiId]?.[0]?.mandiName || mandiId,
    city: MANDI_ROWS[mandiId]?.[0]?.mandiCity || mandiId,
    province: MANDI_ROWS[mandiId]?.[0]?.province || "Punjab",
  };
  const rows = MANDI_ROWS[mandiId] || [];
  const [rateFilter, setRateFilter] = useState("");
  const [rateSheet, setRateSheet] = useState(false);
  const [msgModal, setMsgModal] = useState<FeedMsg | null>(null);
  const [selectedproduct, setSelectedproduct] = useState<string | null>(null);
  const [selectedBP, setSelectedBP] = useState<string | null>(null);
  const [selectedRateTypes, setSelectedRateTypes] = useState<string[]>([]);

  const mandiproducts = [...new Set(rows.map((r) => r.product))];
  const mandiByproducts = [
    ...new Set(
      rows
        .filter((r) => !selectedproduct || r.product === selectedproduct)
        .map((r) => r.byproduct),
    ),
  ];

  const displayed = rows.filter((r) => {
    if (selectedproduct && r.product !== selectedproduct) return false;
    if (selectedBP && r.byproduct !== selectedBP) return false;
    if (selectedRateTypes.length > 0 && !selectedRateTypes.includes(r.rateType))
      return false;
    if (rateFilter && r.rateType !== rateFilter) return false;
    return true;
  });

  // Find vertical for a product
  const getVertical = (product: string): string => {
    for (const [v, vData] of Object.entries(VERTICALS)) {
      if (Object.keys(vData.products || {}).includes(product)) return v;
    }
    return "Grains";
  };

  const rowToMsg = (r: (typeof rows)[0]): FeedMsg => {
    const ex = FEED_MESSAGES.find(
      (m) => m.product === r.product && m.station === mandi.name,
    );
    if (ex) return ex;
    return {
      id: Date.now(),
      time: "Today",
      vertical: "Grains",
      productUrdu: r.product,
      product: r.product,
      byproduct: r.byproduct,
      stationUrdu: mandi.city,
      station: mandi.name,
      province: mandi.province,
      priceMin: r.min,
      priceMax: r.max,
      unit: "40 kg",
      arrivalCount: r.arrival,
      arrivalUnit: "",
      arrivalUnitUrdu: "",
      colorUrdu: "—",
      color: "—",
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

  return (
    <div
      className="flex flex-col h-full screen-enter"
      style={{ background: "#F1F7F4" }}
    >
      <header
        className="px-4 pt-10 pb-3 flex-shrink-0"
        style={{ background: "#F4FAF7", borderBottom: "1px solid #D5E2DD" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="tap-target w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "#E8EFEC" }}
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-xl">{mandi.name}</h1>
            <p className="text-xs" style={{ color: "#52635F" }}>
              {mandi.province}
            </p>
          </div>
        </div>
        {/* Row 1: Product chips */}
        <ScrollRow bg="#fff" style={{ borderTop: "1px solid #E8EFEC" }}>
          <span
            className="flex-shrink-0 text-[10px] font-extrabold uppercase tracking-wider mr-1"
            style={{ color: "#80918B", minWidth: 32 }}
          >
            Prod
          </span>
          <button
            onClick={() => {
              setSelectedproduct(null);
              setSelectedBP(null);
            }}
            className="tap-target flex-shrink-0 rounded-full font-semibold text-xs px-3 py-2"
            style={{
              background: !selectedproduct ? "#087F63" : "#E8EFEC",
              color: !selectedproduct ? "#fff" : "#52635F",
              border: !selectedproduct ? "none" : "1px solid #D5E2DD",
            }}
          >
            All
          </button>
          {mandiproducts.map((c) => (
            <button
              key={c}
              onClick={() => {
                setSelectedproduct(selectedproduct === c ? null : c);
                setSelectedBP(null);
              }}
              className="tap-target flex-shrink-0 flex items-center gap-1.5 rounded-full font-semibold text-xs px-3 py-2"
              style={{
                background: selectedproduct === c ? "#087F63" : "#E8EFEC",
                color: selectedproduct === c ? "#fff" : "#52635F",
                border: selectedproduct === c ? "none" : "1px solid #D5E2DD",
              }}
            >
              <ProductIcon
                name={c}
                vertical={
                  Object.entries(VERTICALS).find(
                    ([, vd]) => vd.products[c],
                  )?.[0]
                }
                size={13}
                style={{
                  filter:
                    selectedproduct === c ? "brightness(0) invert(1)" : "none",
                  flexShrink: 0,
                }}
              />
              {c}
            </button>
          ))}
        </ScrollRow>
        {/* Row 2: By-product chips */}
        <ScrollRow bg="#fff" style={{ borderTop: "1px solid #E8EFEC" }}>
          <span
            className="flex-shrink-0 text-[10px] font-extrabold uppercase tracking-wider mr-1"
            style={{ color: "#80918B", minWidth: 32 }}
          >
            ByP
          </span>
          <button
            onClick={() => setSelectedBP(null)}
            className="tap-target flex-shrink-0 rounded-full font-semibold text-xs px-3 py-2"
            style={{
              background: !selectedBP ? "#087F63" : "#E8EFEC",
              color: !selectedBP ? "#fff" : "#52635F",
              border: !selectedBP ? "none" : "1px solid #D5E2DD",
            }}
          >
            All
          </button>
          {mandiByproducts.map((bp) => (
            <button
              key={bp}
              onClick={() => setSelectedBP(selectedBP === bp ? null : bp)}
              className="tap-target flex-shrink-0 flex items-center gap-1.5 rounded-full font-semibold text-xs px-3 py-2"
              style={{
                background: selectedBP === bp ? "#087F63" : "#E8EFEC",
                color: selectedBP === bp ? "#fff" : "#52635F",
                border: selectedBP === bp ? "none" : "1px solid #D5E2DD",
              }}
            >
              <ProductIcon
                name={bp}
                vertical={
                  selectedproduct
                    ? Object.entries(VERTICALS).find(
                      ([, vd]) => vd.products[selectedproduct],
                    )?.[0]
                    : undefined
                }
                size={13}
                style={{
                  filter:
                    selectedBP === bp ? "brightness(0) invert(1)" : "none",
                  flexShrink: 0,
                }}
              />
              {bp}
            </button>
          ))}
        </ScrollRow>
        {/* Row 3: Price type chips */}
        <ScrollRow bg="#fff" style={{ borderTop: "1px solid #E8EFEC" }}>
          <span
            className="flex-shrink-0 text-[10px] font-extrabold uppercase tracking-wider mr-1"
            style={{ color: "#80918B", minWidth: 32 }}
          >
            Price
          </span>
          <button
            onClick={() => setSelectedRateTypes([])}
            className="tap-target flex-shrink-0 rounded-full font-semibold text-xs px-3 py-2"
            style={{
              background:
                selectedRateTypes.length === 0 ? "#087F63" : "#E8EFEC",
              color: selectedRateTypes.length === 0 ? "#fff" : "#52635F",
              border:
                selectedRateTypes.length === 0 ? "none" : "1px solid #D5E2DD",
            }}
          >
            All
          </button>
          {ALL_RATE_TYPES.map((rt) => {
            const on = selectedRateTypes.includes(rt);
            return (
              <button
                key={rt}
                onClick={() =>
                  setSelectedRateTypes((p) =>
                    p.includes(rt) ? p.filter((x) => x !== rt) : [...p, rt],
                  )
                }
                className="tap-target flex-shrink-0 rounded-full font-semibold text-xs px-3 py-2"
                style={{
                  background: on ? "#087F63" : "#E8EFEC",
                  color: on ? "#fff" : "#80918B",
                  border: on ? "none" : "1px solid #D5E2DD",
                }}
              >
                {rt.replace(" Rate", "")}
              </button>
            );
          })}
        </ScrollRow>
      </header>
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pt-3 pb-4 flex flex-col gap-3">
        {displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 opacity-50">
            <span style={{ fontSize: 40 }}></span>
            <p className="font-semibold mt-2">No results</p>
          </div>
        )}
        {displayed.map((r, i) => (
          <div key={i} className="flex-shrink-0">
            <RateCard
              r={{
                ...r,
                mandiName: mandi.name,
                mandiCity: mandi.city,
                province: mandi.province,
              }}
              onClick={() => {
                const ma = MANDI_ATTR_AVAILABLE[mandi.name];
                push({
                  id: "product-rates",
                  vertical: getVertical(r.product),
                  product: r.product,
                  byproduct: r.byproduct,
                  initialRateType: r.rateType,
                  initialMandi: mandi.name,
                  initialVariety: ma?.variety?.[0],
                  initialNewOld: ma?.newold?.[0],
                  initialColor: ma?.color?.[0],
                  initialSpec: ma?.spec?.[0],
                  initialCondition: ma?.condition?.[0],
                });
              }}
            />
          </div>
        ))}
      </div>
      {rateSheet && (
        <PriceTypeSheet
          selected={rateFilter ? [rateFilter] : []}
          onApply={(ts) => setRateFilter(ts[0] || "")}
          onClose={() => setRateSheet(false)}
        />
      )}
      {msgModal && (
        <ZMMessageModal msg={msgModal} onClose={() => setMsgModal(null)} />
      )}
    </div>
  );
}
