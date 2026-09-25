import { useState } from "react";

import { SpriteIcon } from "../components/ProductIcon";
import { ScrollRow } from "../components/ScrollRow";
import { ZMMessageCard } from "../components/ZMMessage";
import { VERTICALS } from "../shared/data/catalog";
import { FEED_MESSAGES } from "../shared/data/mandis";
import { type FeedFilter } from "../shared/types";
import { MandiPickerSheet } from "./MandiPickerSheet";
import { PriceTypeSheet } from "./PriceTypeSheet";

export function FeedModal({
  initialFilter,
  onClose,
}: {
  initialFilter?: Partial<FeedFilter>;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<FeedFilter>({
    products: initialFilter?.products || [],
    byproducts: initialFilter?.byproducts || [],
    stations: initialFilter?.stations || [],
    rateTypes: initialFilter?.rateTypes || [],
  });
  const [sheet, setSheet] = useState<
    "product" | "byproduct" | "location" | "price" | null
  >(null);
  const [comVertical, setComVertical] = useState<string | null>(null);

  const displayed = FEED_MESSAGES.filter(
    (m) =>
      (filter.products.length === 0 || filter.products.includes(m.product)) &&
      (filter.byproducts.length === 0 ||
        filter.byproducts.includes(m.byproduct)) &&
      (filter.stations.length === 0 ||
        filter.stations.includes(m.station) ||
        filter.stations.some((s) => m.province === s)) &&
      (filter.rateTypes.length === 0 || filter.rateTypes.includes(m.rateType)),
  );

  const totalActive =
    filter.products.length +
    filter.byproducts.length +
    filter.stations.length +
    filter.rateTypes.length;

  const uniqueBPs = [
    ...new Set(
      Object.entries(VERTICALS).flatMap(([, vd]) =>
        Object.entries(vd.products)
          .filter(
            ([c]) =>
              filter.products.length === 0 || filter.products.includes(c),
          )
          .flatMap(([, bps]) => bps),
      ),
    ),
  ];

  const chipLabel = (items: string[], placeholder: string) =>
    items.length === 0
      ? placeholder
      : items.length === 1
        ? items[0]
        : `${items.length} ${placeholder}s`;

  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col"
      style={{ background: "#e5ddd5" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pt-10 pb-3 flex-shrink-0"
        style={{ background: "#075E4F" }}
      >
        <button
          onClick={onClose}
          className="tap-target text-white text-2xl w-10 h-10 flex items-center justify-center"
        >
          ←
        </button>
        <div className="flex-1">
          <p className="text-white font-bold text-base">ZM Rates Feed</p>
          <p className="text-green-200 text-xs">
            {displayed.length} of {FEED_MESSAGES.length} messages
            {totalActive > 0
              ? ` · ${totalActive} filter${totalActive > 1 ? "s" : ""} active`
              : ""}
          </p>
        </div>
        {totalActive > 0 && (
          <button
            onClick={() =>
              setFilter({
                products: [],
                byproducts: [],
                stations: [],
                rateTypes: [],
              })
            }
            className="tap-target px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "rgba(239,68,68,0.8)", color: "#fff" }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* 4 Filter picker buttons — horizontally scrollable with clickable arrow */}
      <ScrollRow bg="#0B7F70" style={{ background: "#0B7F70" }}>
        <button
          onClick={() => setSheet("product")}
          className="tap-target flex-shrink-0 flex items-center gap-1.5 rounded-full font-bold"
          style={{
            fontSize: 13,
            padding: "10px 14px",
            background: filter.products.length > 0 ? "#087F63" : "#E8EFEC",
            color: filter.products.length > 0 ? "#fff" : "#183B34",
          }}
        >
          {chipLabel(filter.products, "product")}
          {filter.products.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFilter((f) => ({ ...f, products: [], byproducts: [] }));
              }}
              className="tap-target opacity-70 ml-1"
            ></button>
          )}
        </button>
        <button
          onClick={() => {
            if (filter.products.length > 0) setSheet("byproduct");
          }}
          className="tap-target flex-shrink-0 flex items-center gap-1.5 rounded-full font-bold"
          style={{
            fontSize: 13,
            padding: "10px 14px",
            background:
              filter.byproducts.length > 0
                ? "#147D72"
                : filter.products.length === 0
                  ? "rgba(255,255,255,0.18)"
                  : "#E8EFEC",
            color:
              filter.byproducts.length > 0
                ? "#fff"
                : filter.products.length === 0
                  ? "rgba(255,255,255,0.45)"
                  : "#183B34",
            opacity: filter.products.length === 0 ? 0.6 : 1,
          }}
        >
          {chipLabel(filter.byproducts, "Byproduct")}
          {filter.byproducts.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFilter((f) => ({ ...f, byproducts: [] }));
              }}
              className="tap-target opacity-70 ml-1"
            ></button>
          )}
        </button>
        <button
          onClick={() => setSheet("location")}
          className="tap-target flex-shrink-0 flex items-center gap-1.5 rounded-full font-bold"
          style={{
            fontSize: 13,
            padding: "10px 14px",
            background: filter.stations.length > 0 ? "#168A76" : "#E8EFEC",
            color: filter.stations.length > 0 ? "#fff" : "#183B34",
          }}
        >
          {chipLabel(filter.stations, "Location")}
          {filter.stations.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFilter((f) => ({ ...f, stations: [] }));
              }}
              className="tap-target opacity-70 ml-1"
            ></button>
          )}
        </button>
        <button
          onClick={() => setSheet("price")}
          className="tap-target flex-shrink-0 flex items-center gap-1.5 rounded-full font-bold"
          style={{
            fontSize: 13,
            padding: "10px 14px",
            background: filter.rateTypes.length > 0 ? "#A96F18" : "#E8EFEC",
            color: filter.rateTypes.length > 0 ? "#fff" : "#183B34",
          }}
        >
          {chipLabel(filter.rateTypes, "Price Type")}
          {filter.rateTypes.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFilter((f) => ({ ...f, rateTypes: [] }));
              }}
              className="tap-target opacity-70 ml-1"
            ></button>
          )}
        </button>
      </ScrollRow>

      {/* Active filter pills row — horizontally scrollable, each removable */}
      {totalActive > 0 && (
        <ScrollRow bg="transparent" style={{ background: "rgba(0,0,0,0.18)" }}>
          {filter.products.map((c) => (
            <span
              key={c}
              className="flex-shrink-0 flex items-center gap-1 font-bold rounded-full"
              style={{
                fontSize: 12,
                padding: "7px 11px",
                background: "#087F63",
                color: "#fff",
              }}
            >
              {c}{" "}
              <button
                onClick={() =>
                  setFilter((f) => ({
                    ...f,
                    products: f.products.filter((x) => x !== c),
                  }))
                }
                className="tap-target opacity-70"
              ></button>
            </span>
          ))}
          {filter.byproducts.map((b) => (
            <span
              key={b}
              className="flex-shrink-0 flex items-center gap-1 font-bold rounded-full"
              style={{
                fontSize: 12,
                padding: "7px 11px",
                background: "#147D72",
                color: "#fff",
              }}
            >
              {b}{" "}
              <button
                onClick={() =>
                  setFilter((f) => ({
                    ...f,
                    byproducts: f.byproducts.filter((x) => x !== b),
                  }))
                }
                className="tap-target opacity-70"
              ></button>
            </span>
          ))}
          {filter.stations.map((s) => (
            <span
              key={s}
              className="flex-shrink-0 flex items-center gap-1 font-bold rounded-full"
              style={{
                fontSize: 12,
                padding: "7px 11px",
                background: "#168A76",
                color: "#fff",
              }}
            >
              {s}{" "}
              <button
                onClick={() =>
                  setFilter((f) => ({
                    ...f,
                    stations: f.stations.filter((x) => x !== s),
                  }))
                }
                className="tap-target opacity-70"
              ></button>
            </span>
          ))}
          {filter.rateTypes.map((rt) => (
            <span
              key={rt}
              className="flex-shrink-0 flex items-center gap-1 font-bold rounded-full"
              style={{
                fontSize: 12,
                padding: "7px 11px",
                background: "#A96F18",
                color: "#fff",
              }}
            >
              {rt}{" "}
              <button
                onClick={() =>
                  setFilter((f) => ({
                    ...f,
                    rateTypes: f.rateTypes.filter((x) => x !== rt),
                  }))
                }
                className="tap-target opacity-70"
              ></button>
            </span>
          ))}
        </ScrollRow>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <span style={{ fontSize: 48 }}></span>
            <p className="font-semibold mt-2 text-center">
              No messages match these filters
            </p>
            <button
              onClick={() =>
                setFilter({
                  products: [],
                  byproducts: [],
                  stations: [],
                  rateTypes: [],
                })
              }
              className="tap-target mt-4 px-4 py-2 rounded-2xl text-sm font-bold"
              style={{ background: "#087F63", color: "#fff" }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          displayed.map((msg) => (
            <div key={msg.id} className="flex justify-start">
              <ZMMessageCard msg={msg} />
            </div>
          ))
        )}
      </div>

      {/* product sheet — multi-select with vertical drill + Select All per vertical */}
      {sheet === "product" && (
        <div
          className="zm-sheet-overlay"
          style={{ zIndex: 210 }}
          onClick={() => setSheet(null)}
        >
          <div
            className="zm-sheet-high"
            style={{ background: "#F4FAF7", maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 border-b border-[#DCE8E3] flex-shrink-0 flex items-center gap-3">
              <div
                className="w-10 h-1 rounded-full mx-auto mb-3 absolute top-3 left-1/2 -translate-x-1/2"
                style={{ background: "#C7D6D0" }}
              />
              {comVertical && (
                <button
                  className="tap-target text-xl w-8 flex-shrink-0"
                  onClick={() => setComVertical(null)}
                >
                  ←
                </button>
              )}
              <p className="font-bold text-lg flex-1">
                {comVertical || "product"}
              </p>
              {filter.products.length > 0 && (
                <button
                  onClick={() =>
                    setFilter((f) => ({
                      ...f,
                      products: [],
                      byproducts: [],
                    }))
                  }
                  className="tap-target text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
                  style={{ background: "#F9E1DE", color: "#A83B37" }}
                >
                  Clear {filter.products.length}
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-2">
              {!comVertical ? (
                Object.entries(VERTICALS).map(([v, vd]) => {
                  const comms = Object.keys(vd.products);
                  const selCount = comms.filter((c) =>
                    filter.products.includes(c),
                  ).length;
                  const allSel = selCount === comms.length && comms.length > 0;
                  return (
                    <div
                      key={v}
                      className="rounded-2xl overflow-hidden"
                      style={{
                        border: `1.5px solid ${selCount > 0 ? "#087F63" : "#D5E2DD"
                          }`,
                      }}
                    >
                      <button
                        onClick={() => setComVertical(v)}
                        className="tap-target w-full px-4 flex items-center gap-3"
                        style={{
                          background: selCount > 0 ? "#F1F7F4" : "#F1F7F4",
                          minHeight: 58,
                        }}
                      >
                        <SpriteIcon
                          spriteKey={VERTICALS[v]?.icon || "grains"}
                          size={30}
                          style={{ flexShrink: 0 }}
                        />
                        <div className="flex-1 text-left">
                          <p className="font-bold text-sm">{v}</p>
                          <p className="text-xs" style={{ color: "#52635F" }}>
                            {comms.length} products
                            {selCount > 0 ? ` · ${selCount} selected` : ""}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (allSel)
                              setFilter((f) => ({
                                ...f,
                                products: f.products.filter(
                                  (c) => !comms.includes(c),
                                ),
                              }));
                            else
                              setFilter((f) => ({
                                ...f,
                                products: [
                                  ...f.products.filter(
                                    (c) => !comms.includes(c),
                                  ),
                                  ...comms,
                                ],
                              }));
                          }}
                          className="tap-target flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
                          style={{
                            background: allSel ? "#087F63" : "#fff",
                            border: "1.5px solid #087F63",
                            marginRight: 6,
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded flex items-center justify-center"
                            style={{
                              background: allSel ? "#fff" : "transparent",
                              border: allSel ? "none" : "1.5px solid #087F63",
                            }}
                          >
                            {allSel && (
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
                              color: allSel ? "#fff" : "#087F63",
                            }}
                          >
                            All
                          </span>
                        </button>
                        <span style={{ color: "#52635F" }}>›</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <>
                  {(() => {
                    const comms = Object.keys(VERTICALS[comVertical].products);
                    const selCount = comms.filter((c) =>
                      filter.products.includes(c),
                    ).length;
                    const allSel =
                      selCount === comms.length && comms.length > 0;
                    return (
                      <button
                        onClick={() => {
                          if (allSel)
                            setFilter((f) => ({
                              ...f,
                              products: f.products.filter(
                                (c) => !comms.includes(c),
                              ),
                            }));
                          else
                            setFilter((f) => ({
                              ...f,
                              products: [
                                ...f.products.filter((c) => !comms.includes(c)),
                                ...comms,
                              ],
                            }));
                        }}
                        className="tap-target w-full rounded-2xl px-4 py-3 flex items-center justify-center gap-2 mb-1"
                        style={{
                          background: allSel ? "#087F63" : "#F1F7F4",
                          border: "1.5px solid #087F63",
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center"
                          style={{
                            background: allSel ? "#fff" : "transparent",
                            border: allSel ? "none" : "1.5px solid #087F63",
                          }}
                        >
                          {allSel && (
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
                          className="font-bold text-sm"
                          style={{ color: allSel ? "#fff" : "#087F63" }}
                        >
                          {allSel
                            ? `Deselect All ${comms.length}`
                            : `Select All ${comms.length} in ${comVertical}`}
                        </span>
                      </button>
                    );
                  })()}
                  {Object.keys(VERTICALS[comVertical].products).map((c) => {
                    const sel = filter.products.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() =>
                          setFilter((f) => ({
                            ...f,
                            products: sel
                              ? f.products.filter((x) => x !== c)
                              : [...f.products, c],
                          }))
                        }
                        className="tap-target rounded-2xl px-4 flex items-center gap-3"
                        style={{
                          background: sel ? "#F1F7F4" : "#F1F7F4",
                          border: `1.5px solid ${sel ? "#087F63" : "#D5E2DD"}`,
                          minHeight: 48,
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                          style={{ background: sel ? "#087F63" : "#E8EFEC" }}
                        >
                          {sel && (
                            <span
                              className="text-white font-bold"
                              style={{ fontSize: 10 }}
                            ></span>
                          )}
                        </div>
                        <span className="font-semibold text-sm flex-1 text-left">
                          {c}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
            <div className="px-4 pb-6 pt-3 flex-shrink-0 border-t border-[#DCE8E3]">
              <button
                onClick={() => setSheet(null)}
                className="tap-target w-full rounded-2xl py-4 font-bold text-white text-base"
                style={{ background: "#087F63" }}
              >
                {filter.products.length > 0
                  ? `Done · ${filter.products.length} selected`
                  : "Done"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Byproduct sheet — multi-select with Select All */}
      {sheet === "byproduct" && filter.products.length > 0 && (
        <div
          className="zm-sheet-overlay"
          style={{ zIndex: 210 }}
          onClick={() => setSheet(null)}
        >
          <div
            className="zm-sheet-high"
            style={{ background: "#F4FAF7", maxHeight: "82vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 border-b border-[#DCE8E3] flex-shrink-0 flex items-center gap-3">
              <p className="font-bold text-lg flex-1">Byproduct</p>
              {filter.byproducts.length > 0 && (
                <button
                  onClick={() => setFilter((f) => ({ ...f, byproducts: [] }))}
                  className="tap-target text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: "#F9E1DE", color: "#A83B37" }}
                >
                  Clear {filter.byproducts.length}
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-2">
              {uniqueBPs.length > 0 &&
                (() => {
                  const allSel =
                    uniqueBPs.length > 0 &&
                    uniqueBPs.every((b) => filter.byproducts.includes(b));
                  return (
                    <button
                      onClick={() => {
                        if (allSel)
                          setFilter((f) => ({ ...f, byproducts: [] }));
                        else
                          setFilter((f) => ({
                            ...f,
                            byproducts: [...uniqueBPs],
                          }));
                      }}
                      className="tap-target w-full rounded-2xl px-4 py-3 flex items-center justify-center gap-2 mb-1"
                      style={{
                        background: allSel ? "#147D72" : "#EAF5F1",
                        border: "1.5px solid #249985",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center"
                        style={{
                          background: allSel ? "#fff" : "transparent",
                          border: allSel ? "none" : "1.5px solid #249985",
                        }}
                      >
                        {allSel && (
                          <span
                            style={{
                              fontSize: 9,
                              color: "#249985",
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                          ></span>
                        )}
                      </div>
                      <span
                        className="font-bold text-sm"
                        style={{ color: allSel ? "#fff" : "#147D72" }}
                      >
                        {allSel
                          ? "Deselect All"
                          : `Select All ${uniqueBPs.length} Byproducts`}
                      </span>
                    </button>
                  );
                })()}
              {uniqueBPs.map((b) => {
                const sel = filter.byproducts.includes(b);
                return (
                  <button
                    key={b}
                    onClick={() =>
                      setFilter((f) => ({
                        ...f,
                        byproducts: sel
                          ? f.byproducts.filter((x) => x !== b)
                          : [...f.byproducts, b],
                      }))
                    }
                    className="tap-target rounded-2xl px-4 flex items-center gap-3"
                    style={{
                      background: sel ? "#EAF5F1" : "#F1F7F4",
                      border: `1.5px solid ${sel ? "#147D72" : "#D5E2DD"}`,
                      minHeight: 48,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: sel ? "#147D72" : "#E8EFEC" }}
                    >
                      {sel && (
                        <span
                          className="text-white font-bold"
                          style={{ fontSize: 10 }}
                        ></span>
                      )}
                    </div>
                    <span className="font-semibold text-sm flex-1 text-left">
                      {b}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="px-4 pb-6 pt-3 flex-shrink-0 border-t border-[#DCE8E3]">
              <button
                onClick={() => setSheet(null)}
                className="tap-target w-full rounded-2xl py-4 font-bold text-white text-base"
                style={{ background: "#147D72" }}
              >
                {filter.byproducts.length > 0
                  ? `Done · ${filter.byproducts.length} selected`
                  : "Done"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location sheet — MandiPickerSheet: province → district → multi-mandi with Select All */}
      {sheet === "location" && (
        <MandiPickerSheet
          selected={filter.stations}
          onApply={(s) => {
            setFilter((f) => ({ ...f, stations: s }));
          }}
          onClose={() => setSheet(null)}
        />
      )}

      {/* Price type sheet */}
      {sheet === "price" && (
        <PriceTypeSheet
          selected={filter.rateTypes}
          onApply={(ts) => {
            setFilter((f) => ({ ...f, rateTypes: ts }));
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}
