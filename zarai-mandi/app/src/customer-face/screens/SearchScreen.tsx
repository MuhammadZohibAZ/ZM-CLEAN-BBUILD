import { useState, useRef, useEffect } from "react";

import { CircleTile } from "../components/CircleTile";
import { VERTICALS } from "../shared/data/catalog";
import { URDU_FONT, useLang } from "../shared/i18n/LangProvider";
import { type Screen } from "../shared/types";

//  SEARCH SCREEN

export function SearchScreen({
  push,
  onBack,
}: {
  push: (s: Screen) => void;
  onBack: () => void;
}) {
  const { lang, t, tc } = useLang();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build flat search index: all products + byproducts
  const allItems = Object.entries(VERTICALS).flatMap(([vertical, vd]) =>
    Object.entries(vd.products).flatMap(([product, byproducts]) => [
      {
        vertical,
        product,
        byproduct: product,
        label: product,
        isComm: true,
      },
      ...byproducts
        .filter((bp) => bp !== product)
        .map((bp) => ({
          vertical,
          product,
          byproduct: bp,
          label: bp,
          isComm: false,
        })),
    ]),
  );

  const results =
    q.length >= 1
      ? allItems
        .filter((it) => it.label.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 30)
      : [];

  return (
    <div
      className="flex flex-col h-full screen-enter"
      style={{ background: "#F1F7F4" }}
    >
      <div
        className="px-4 pt-12 pb-3 flex-shrink-0"
        style={{ background: "#F4FAF7", borderBottom: "1px solid #D5E2DD" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="tap-target w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "#E8EFEC" }}
          >
            {lang === "ur" ? "→" : "←"}
          </button>
          <div
            className="flex-1 flex items-center gap-2 rounded-2xl px-4"
            style={{
              height: lang === "ur" ? 60 : 52,
              background: "#F1F7F4",
              border: "1.5px solid #D5E2DD",
            }}
          >
            {" "}
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("home.search")}
              className="flex-1 bg-transparent outline-none font-bold"
              style={{
                color: "#183B34",
                fontSize: lang === "ur" ? 19 : 14,
                fontFamily:
                  lang === "ur"
                    ? URDU_FONT
                    : "'Inter', sans-serif",
                direction: lang === "ur" ? "rtl" : "ltr",
              }}
            />
            {q ? (
              <button
                onClick={() => setQ("")}
                className="tap-target font-bold flex-shrink-0"
                style={{ color: "#52635F", fontSize: 16 }}
              >
                ✕
              </button>
            ) : (
              <span
                className="flex-shrink-0"
                style={{ fontSize: 16, opacity: 0.5 }}
              ></span>
            )}
          </div>
        </div>
      </div>

      {results.length === 0 && q.length < 1 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <p
            className="text-center font-bold"
            style={{
              color: "#52635F",
              fontSize: lang === "ur" ? 20 : 14,
              lineHeight: 1.5,
              fontFamily:
                lang === "ur"
                  ? URDU_FONT
                  : "inherit",
            }}
          >
            {lang === "ur"
              ? "کوئی بھی جنس یا ضمنی مصنوع تلاش کریں — گندم، باسمتی، چوکر…"
              : "Search for any product or byproduct — wheat, basmati, bran, tomato…"}
          </p>
        </div>
      )}

      {q.length >= 1 && results.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-60">
          <span style={{ fontSize: 48 }}>🔎</span>
          <p
            className="font-bold"
            style={{
              fontSize: lang === "ur" ? 20 : 14,
              fontFamily:
                lang === "ur"
                  ? URDU_FONT
                  : "inherit",
            }}
          >
            {lang === "ur"
              ? `"${q}" کا کوئی نتیجہ نہیں ملا`
              : `No results for "${q}"`}
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="flex-1 overflow-y-auto min-h-0 px-4 pt-5 pb-6">
          <div className="flex flex-wrap gap-x-4 gap-y-5 justify-start">
            {results.map((it, i) => (
              <CircleTile
                key={i}
                product={it.byproduct}
                vertical={it.vertical}
                alt={it.label}
                label={tc(it.label)}
                size={72}
                onPress={() =>
                  push({
                    id: "product-rates",
                    vertical: it.vertical,
                    product: it.product,
                    byproduct: it.byproduct,
                  })
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
