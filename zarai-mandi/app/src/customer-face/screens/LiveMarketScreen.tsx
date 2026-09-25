import React from "react";

import { useLang } from "../shared/i18n/LangProvider";

//  ROOT APP

//  LIVE MARKET

export type LMproductRow = {
  name: string;
  change: number;
  lTrade: string;
  dir: "up" | "down" | "flat";
  high: number;
  low: number;
  volume: number;
  oInt: number;
};

export type LMForexRow = {
  name: string;
  change: number;
  lTrade: number;
  dir: "up" | "down" | "flat";
  high: number;
  low: number;
  ask: number;
  bid: number;
};

export const LM_product_DATA: LMproductRow[] = [
  {
    name: "CT 2610",
    change: +0.37,
    lTrade: "83.09B",
    dir: "flat",
    high: 82.95,
    low: 82.53,
    volume: 9,
    oInt: 161,
  },
  {
    name: "CT 2612",
    change: +0.17,
    lTrade: "84.56A",
    dir: "down",
    high: 84.6,
    low: 84.0,
    volume: 22372,
    oInt: 199813,
  },
  {
    name: "CT 2703",
    change: +0.22,
    lTrade: "86.46",
    dir: "up",
    high: 86.5,
    low: 85.97,
    volume: 9779,
    oInt: 75046,
  },
  {
    name: "CT 2705",
    change: +0.18,
    lTrade: "87.55",
    dir: "up",
    high: 87.59,
    low: 87.1,
    volume: 3586,
    oInt: 29123,
  },
  {
    name: "CT 2707",
    change: +0.15,
    lTrade: "86.89",
    dir: "up",
    high: 86.94,
    low: 86.57,
    volume: 2559,
    oInt: 16259,
  },
  {
    name: "KPO 2608",
    change: -62,
    lTrade: "4500",
    dir: "down",
    high: 4530,
    low: 4500,
    volume: 77,
    oInt: 1607,
  },
  {
    name: "KPO 2609",
    change: -57,
    lTrade: "4591",
    dir: "up",
    high: 4632,
    low: 4588,
    volume: 4305,
    oInt: 27742,
  },
  {
    name: "KPO 2610",
    change: -53,
    lTrade: "4695",
    dir: "down",
    high: 4734,
    low: 4691,
    volume: 18243,
    oInt: 91172,
  },
  {
    name: "KPO 2611",
    change: -45,
    lTrade: "4775A",
    dir: "up",
    high: 4807,
    low: 4768,
    volume: 12844,
    oInt: 60510,
  },
  {
    name: "WHITE SUGAR 2610",
    change: 0,
    lTrade: "511.90",
    dir: "flat",
    high: 512.0,
    low: 504.0,
    volume: 0,
    oInt: 78924,
  },
  {
    name: "WHITE SUGAR 2612",
    change: 0,
    lTrade: "509.90",
    dir: "flat",
    high: 511.0,
    low: 504.3,
    volume: 0,
    oInt: 48592,
  },
  {
    name: "WHITE SUGAR 2703",
    change: 0,
    lTrade: "510.70",
    dir: "flat",
    high: 513.0,
    low: 507.0,
    volume: 0,
    oInt: 29826,
  },
  {
    name: "SE 2607",
    change: +0.05,
    lTrade: "14.34",
    dir: "flat",
    high: 14.34,
    low: 14.34,
    volume: 1809,
    oInt: 15678,
  },
  {
    name: "SE 2610",
    change: +0.26,
    lTrade: "16.73",
    dir: "flat",
    high: 16.75,
    low: 16.33,
    volume: 150591,
    oInt: 507630,
  },
  {
    name: "SE 2703",
    change: +0.27,
    lTrade: "17.71B",
    dir: "flat",
    high: 17.73,
    low: 17.31,
    volume: 95182,
    oInt: 317463,
  },
  {
    name: "WHEAT 2607",
    change: +11.6,
    lTrade: "687.00",
    dir: "down",
    high: 687.2,
    low: 675.0,
    volume: 301,
    oInt: 24556,
  },
  {
    name: "WHEAT 2609",
    change: +13.6,
    lTrade: "644.00",
    dir: "down",
    high: 644.4,
    low: 631.4,
    volume: 8993,
    oInt: 138216,
  },
  {
    name: "WHEAT 2612",
    change: +13.2,
    lTrade: "661.40",
    dir: "down",
    high: 662.0,
    low: 649.0,
    volume: 7874,
    oInt: 202702,
  },
  {
    name: "WHEAT 2703",
    change: +13,
    lTrade: "678.40",
    dir: "down",
    high: 679.0,
    low: 666.0,
    volume: 2777,
    oInt: 78735,
  },
  {
    name: "CORN 2607",
    change: +2.75,
    lTrade: "493.50",
    dir: "up",
    high: 493.5,
    low: 490.25,
    volume: 1210,
    oInt: 83621,
  },
  {
    name: "CORN 2609",
    change: +3,
    lTrade: "439.75",
    dir: "up",
    high: 439.75,
    low: 436.0,
    volume: 3018,
    oInt: 354650,
  },
  {
    name: "CORN 2612",
    change: +2.75,
    lTrade: "463.25",
    dir: "up",
    high: 463.5,
    low: 459.5,
    volume: 9782,
    oInt: 827726,
  },
  {
    name: "CORN 2703",
    change: +3.25,
    lTrade: "479.25",
    dir: "up",
    high: 479.25,
    low: 475.5,
    volume: 2023,
    oInt: 219084,
  },
  {
    name: "SOYBEANS 2607",
    change: +6.75,
    lTrade: "1214.0",
    dir: "down",
    high: 1214.75,
    low: 1206.25,
    volume: 865,
    oInt: 46227,
  },
  {
    name: "SOYBEANS 2609",
    change: +6.75,
    lTrade: "1158.2",
    dir: "up",
    high: 1159.25,
    low: 1150.25,
    volume: 1313,
    oInt: 53729,
  },
  {
    name: "SOY OIL 2607",
    change: +0.24,
    lTrade: "67.89A",
    dir: "up",
    high: 67.89,
    low: 67.62,
    volume: 91,
    oInt: 25354,
  },
  {
    name: "SOY OIL 2609",
    change: +0.39,
    lTrade: "68.96B",
    dir: "up",
    high: 69.1,
    low: 68.6,
    volume: 865,
    oInt: 106241,
  },
  {
    name: "SOY MEAL 2607",
    change: +1.4,
    lTrade: "325.00",
    dir: "down",
    high: 325.0,
    low: 323.6,
    volume: 119,
    oInt: 17531,
  },
  {
    name: "SOY MEAL 2609",
    change: +2.1,
    lTrade: "307.10",
    dir: "down",
    high: 307.1,
    low: 305.3,
    volume: 1067,
    oInt: 74529,
  },
];

export const LM_FOREX_DATA: LMForexRow[] = [
  {
    name: "PAKISTANI RUPEE",
    change: +0.0,
    lTrade: 277.75,
    dir: "flat",
    high: 277.75,
    low: 277.75,
    ask: 282.0,
    bid: 277.75,
  },
  {
    name: "JAPAN YEN",
    change: +0.11,
    lTrade: 159.36,
    dir: "down",
    high: 159.46,
    low: 159.19,
    ask: 159.38,
    bid: 159.36,
  },
  {
    name: "E.U.R.",
    change: -0.0005,
    lTrade: 1.1535,
    dir: "down",
    high: 1.1545,
    low: 1.1532,
    ask: 1.1535,
    bid: 1.1535,
  },
  {
    name: "GB POUND",
    change: -0.0003,
    lTrade: 1.3502,
    dir: "down",
    high: 1.3511,
    low: 1.3497,
    ask: 1.3509,
    bid: 1.3502,
  },
  {
    name: "CNY SPOT",
    change: +0.0007,
    lTrade: 6.7463,
    dir: "up",
    high: 6.747,
    low: 6.7454,
    ask: 6.7464,
    bid: 6.7463,
  },
  {
    name: "L.CRUDE OIL 1ST",
    change: +0.73,
    lTrade: 83.93,
    dir: "down",
    high: 84.35,
    low: 83.35,
    ask: 83.93,
    bid: 83.92,
  },
  {
    name: "LOCO GOLD",
    change: +19.45,
    lTrade: 4389.2,
    dir: "down",
    high: 4415.25,
    low: 4362.05,
    ask: 4389.85,
    bid: 4389.25,
  },
  {
    name: "LOCOSILVER",
    change: +0.692,
    lTrade: 65.353,
    dir: "up",
    high: 65.75,
    low: 64.659,
    ask: 65.398,
    bid: 65.353,
  },
];

export function LiveMarketScreen({ onBack }: { onBack: () => void }) {
  const { lang } = useLang();
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = now.toLocaleDateString("en-GB").replace(/\//g, "/");
  const dayStr = now.toLocaleDateString("en-US", { weekday: "long" });
  const timestamp = `${timeStr} · ${dateStr} · ${dayStr}`;

  const fmtNum = (n: number, decimals = 2) =>
    n === 0
      ? "—"
      : n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

  const fmtChange = (n: number) => {
    const s = n > 0 ? `+${n}` : `${n}`;
    return s;
  };

  const DirArrow = ({ dir }: { dir: "up" | "down" | "flat" }) => {
    if (dir === "up")
      return <span style={{ color: "#159447", fontSize: 11 }}></span>;
    if (dir === "down")
      return <span style={{ color: "#C94A43", fontSize: 11 }}></span>;
    return null;
  };

  const changeColor = (n: number) =>
    n > 0 ? "#159447" : n < 0 ? "#C94A43" : "#52635F";

  const TH_STYLE: React.CSSProperties = {
    padding: "8px 10px",
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    textAlign: "right",
    whiteSpace: "nowrap",
    background: "#075E4F",
  };
  const TD_STYLE: React.CSSProperties = {
    padding: "7px 10px",
    fontSize: 11,
    textAlign: "right",
    whiteSpace: "nowrap",
    color: "#183B34",
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#EFF8F3" }}>
      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
        style={{
          background: "#075E4F",
          paddingTop: "max(52px, env(safe-area-inset-top, 52px))",
        }}
      >
        <button
          onClick={onBack}
          className="tap-target w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
        >
          <span style={{ fontSize: 20 }}>{lang === "ur" ? "→" : "←"}</span>
        </button>
        <div className="flex-1 min-w-0">
          <h1
            className="font-extrabold text-base text-white leading-tight"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {lang === "ur"
              ? "لائیو مارکیٹ انٹرنیشنل ریٹ"
              : "Live Market International Rate"}
          </h1>
          <p
            className="text-xs mt-0.5"
            style={{ color: "rgba(255,255,255,0.72)" }}
          >
            {timestamp}
          </p>
        </div>
        {/* Live badge */}
        <span
          className="flex-shrink-0 rounded-full font-bold text-[10px] px-2.5 py-1 flex items-center gap-1"
          style={{
            background: "#C94A43",
            color: "#fff",
            letterSpacing: "0.04em",
          }}
        >
          <span
            className="inline-block rounded-full"
            style={{
              width: 6,
              height: 6,
              background: "#F4FAF7",
              opacity: 0.9,
              animation: "pulse 1.5s infinite",
            }}
          />
          LIVE
        </span>
      </header>

      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 16 }}>
        {/*  Section 1: product Futures  */}
        <div className="px-3 pt-4 pb-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="font-extrabold text-sm"
              style={{ color: "#075E4F", fontFamily: "'Poppins', sans-serif" }}
            >
              product Futures
            </span>
            <span
              className="text-[10px] font-semibold rounded-full px-2 py-0.5"
              style={{ background: "#DDF3E7", color: "#147A3F" }}
            >
              {LM_product_DATA.length} instruments
            </span>
          </div>
        </div>

        <div className="px-3">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: "1px solid #C7E8D8",
              boxShadow: "0 2px 8px rgba(10,94,67,0.08)",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  minWidth: 520,
                }}
              >
                <thead>
                  <tr>
                    {/* Sticky Name header */}
                    <th
                      style={{
                        ...TH_STYLE,
                        textAlign: "left",
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        minWidth: 130,
                        background: "#075E4F",
                      }}
                    >
                      Name
                    </th>
                    <th style={{ ...TH_STYLE, color: "#8AD7B1" }}>+/- $</th>
                    <th style={TH_STYLE}>L.Trade</th>
                    <th style={TH_STYLE}>High</th>
                    <th style={TH_STYLE}>Low</th>
                    <th style={TH_STYLE}>Volume</th>
                    <th style={TH_STYLE}>O.Int</th>
                  </tr>
                </thead>
                <tbody>
                  {LM_product_DATA.map((row, i) => (
                    <tr
                      key={row.name}
                      style={{ background: i % 2 === 0 ? "#fff" : "#EFF8F3" }}
                    >
                      <td
                        style={{
                          ...TD_STYLE,
                          textAlign: "left",
                          position: "sticky",
                          left: 0,
                          zIndex: 1,
                          fontWeight: 700,
                          color: "#075E4F",
                          background: i % 2 === 0 ? "#fff" : "#EFF8F3",
                          borderRight: "1px solid #C7E8D8",
                        }}
                      >
                        {row.name}
                      </td>
                      <td
                        style={{
                          ...TD_STYLE,
                          fontWeight: 700,
                          color: changeColor(row.change),
                        }}
                      >
                        {fmtChange(row.change)}
                      </td>
                      <td style={{ ...TD_STYLE, fontWeight: 600 }}>
                        <span style={{ marginRight: 3 }}>{row.lTrade}</span>
                        <DirArrow dir={row.dir} />
                      </td>
                      <td style={TD_STYLE}>{row.high}</td>
                      <td style={TD_STYLE}>{row.low}</td>
                      <td style={{ ...TD_STYLE, color: "#52635F" }}>
                        {row.volume === 0 ? "—" : row.volume.toLocaleString()}
                      </td>
                      <td style={{ ...TD_STYLE, color: "#52635F" }}>
                        {row.oInt === 0 ? "—" : row.oInt.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/*  Section 2: Global / Forex  */}
        <div className="px-3 pt-5 pb-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="font-extrabold text-sm"
              style={{ color: "#075E4F", fontFamily: "'Poppins', sans-serif" }}
            >
              Global / International Markets
            </span>
            <span
              className="text-[10px] font-semibold rounded-full px-2 py-0.5"
              style={{ background: "#DDF3E7", color: "#147A3F" }}
            >
              {LM_FOREX_DATA.length} instruments
            </span>
          </div>
        </div>

        <div className="px-3">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: "1px solid #C7E8D8",
              boxShadow: "0 2px 8px rgba(10,94,67,0.08)",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  minWidth: 520,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        ...TH_STYLE,
                        textAlign: "left",
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        minWidth: 150,
                        background: "#075E4F",
                      }}
                    >
                      Name
                    </th>
                    <th style={{ ...TH_STYLE, color: "#8AD7B1" }}>+/- $</th>
                    <th style={TH_STYLE}>L.Trade</th>
                    <th style={TH_STYLE}>High</th>
                    <th style={TH_STYLE}>Low</th>
                    <th style={TH_STYLE}>Ask</th>
                    <th style={TH_STYLE}>Bid</th>
                  </tr>
                </thead>
                <tbody>
                  {LM_FOREX_DATA.map((row, i) => (
                    <tr
                      key={row.name}
                      style={{ background: i % 2 === 0 ? "#fff" : "#EFF8F3" }}
                    >
                      <td
                        style={{
                          ...TD_STYLE,
                          textAlign: "left",
                          position: "sticky",
                          left: 0,
                          zIndex: 1,
                          fontWeight: 700,
                          color: "#075E4F",
                          background: i % 2 === 0 ? "#fff" : "#EFF8F3",
                          borderRight: "1px solid #C7E8D8",
                        }}
                      >
                        {row.name}
                      </td>
                      <td
                        style={{
                          ...TD_STYLE,
                          fontWeight: 700,
                          color: changeColor(row.change),
                        }}
                      >
                        {fmtChange(row.change)}
                      </td>
                      <td style={{ ...TD_STYLE, fontWeight: 600 }}>
                        <span style={{ marginRight: 3 }}>{row.lTrade}</span>
                        <DirArrow dir={row.dir} />
                      </td>
                      <td style={TD_STYLE}>{fmtNum(row.high, 3)}</td>
                      <td style={TD_STYLE}>{fmtNum(row.low, 3)}</td>
                      <td
                        style={{
                          ...TD_STYLE,
                          color: "#159447",
                          fontWeight: 600,
                        }}
                      >
                        {fmtNum(row.ask, 3)}
                        {row.dir === "up" && (
                          <span
                            style={{
                              color: "#159447",
                              marginLeft: 2,
                              fontSize: 10,
                            }}
                          ></span>
                        )}
                      </td>
                      <td
                        style={{
                          ...TD_STYLE,
                          color: row.change < 0 ? "#C94A43" : "#183B34",
                          fontWeight: 600,
                        }}
                      >
                        {fmtNum(row.bid, 3)}
                        {row.dir === "down" && (
                          <span
                            style={{
                              color: "#C94A43",
                              marginLeft: 2,
                              fontSize: 10,
                            }}
                          ></span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p
          className="text-center text-[10px] px-6 mt-4"
          style={{ color: "#80918B" }}
        >
          Data reflects the latest update received from the external market
          feed. Last updated: {timestamp}
        </p>
      </div>
    </div>
  );
}
