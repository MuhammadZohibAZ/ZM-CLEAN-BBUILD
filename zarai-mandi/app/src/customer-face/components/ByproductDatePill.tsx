import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { firstDatasetDate, latestDatasetDate, latestDatasetDay } from "../shared/data/datasetDates";

import { toUrduDigits, URDU_FONT, useLang } from "../shared/i18n/LangProvider";

// Gregorian + Hijri date pill with its calendar picker, used above by-product
// cards (Home carousel and ByProductCombinedScreen). Days with data and the
// latest day come from the dataset (datasetDates.ts).

export function ByproductDatePill({
  selectedDate,
  onSelectDate,
  compact = false,
}: {
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  /** Plain one-line date (Home) instead of the two-line pill. */
  compact?: boolean;
}) {
  const { lang } = useLang();
  const [isDateCalOpen, setIsDateCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState<Date>(selectedDate || latestDatasetDay());
  const setSelectedDate = onSelectDate;
  const curDate = selectedDate || latestDatasetDay();

  // Gregorian + Lunar Islamic Date Object (2-line layout with dash)
  const dateInfo = useMemo(() => {
    const d = curDate;
    const islamic = getIslamicDate(d, lang);
    const monthsUr = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const day = d.getDate();
    const mIdx = d.getMonth();
    const gregDayMonth = lang === 'ur' ? `${toUrduDigits(day)} ${monthsUr[mIdx]}` : `${day} ${monthsEn[mIdx]}`;
    const gregYear = lang === 'ur' ? toUrduDigits(d.getFullYear()) : String(d.getFullYear());

    return {
      gregDayMonth,
      gregYear,
      hijriDayMonth: lang === 'ur' ? `${toUrduDigits(islamic.day)} ${islamic.monthName}` : `${islamic.day} ${islamic.monthName}`,
      hijriYear: lang === 'ur' ? `${toUrduDigits(islamic.year)} ھ` : `${islamic.year} A.H`,
    };
  }, [curDate, lang]);

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setIsDateCalOpen(true)}
          className="tap-target flex items-center gap-2 transition active:scale-95"
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            color: '#183B34',
            fontSize: lang === 'ur' ? 15 : 14.5,
            fontWeight: 700,
            fontFamily: lang === 'ur' ? URDU_FONT : 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#183B34" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{dateInfo.gregDayMonth} · {dateInfo.hijriDayMonth}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#183B34" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      ) : (
        <>
          {/* Gregorian + Lunar Islamic Date Pill (Clickable Date Filter) */}
          <button
            type="button"
            onClick={() => setIsDateCalOpen(true)}
            className="tap-target flex items-center gap-1 px-2 py-0.5 rounded-2xl flex-shrink-0 cursor-pointer transition active:scale-95 text-left"
            style={{
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1.2px solid rgba(16, 185, 129, 0.45)',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.12)',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#075E4F"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>

            <div
              className="flex items-center gap-1 text-[#075E4F]"
              style={{ fontFamily: lang === 'ur' ? URDU_FONT : 'inherit' }}
            >
              {/* Left Column: Gregorian Date & Year */}
              <div className="flex flex-col items-center leading-none">
                <span className="text-[9.5px] font-extrabold whitespace-nowrap">
                  {dateInfo.gregDayMonth}
                </span>
                <span className="text-[8px] font-bold text-[#087F63]/80 tracking-wide mt-0.5 whitespace-nowrap">
                  {dateInfo.gregYear}
                </span>
              </div>

              {/* Divider (a "-" renders like a kashida in the Urdu font) */}
              <span className="w-px h-5 bg-[#10B981]/45 mx-0.5 flex-shrink-0" aria-hidden="true" />

              {/* Right Column: Hijri Date & Year */}
              <div className="flex flex-col items-center leading-none">
                <span className="text-[9.5px] font-extrabold whitespace-nowrap">
                  {dateInfo.hijriDayMonth}
                </span>
                <span className="text-[8px] font-bold text-[#087F63]/80 tracking-wide mt-0.5 whitespace-nowrap">
                  {dateInfo.hijriYear}
                </span>
              </div>
            </div>

            <span className="text-[8.5px] text-[#075E4F] font-bold opacity-70 ml-0.5">▾</span>
          </button>
        </>
      )}

      {/* Date Calendar Modal */}
      {isDateCalOpen && (() => {
        const mn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const mnUr = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];
        const sdYear = calMonth.getFullYear();
        const sdMonthIdx = calMonth.getMonth();
        const sdMonthName = lang === "ur"
          ? `${mnUr[sdMonthIdx]} ${toUrduDigits(sdYear)}`
          : calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const sdFirstDow = new Date(sdYear, sdMonthIdx, 1).getDay();
        const sdDaysInMonth = new Date(sdYear, sdMonthIdx + 1, 0).getDate();
        const sdCalDays: (number | null)[] = [
          ...Array(sdFirstDow).fill(null),
          ...Array.from({ length: sdDaysInMonth }, (_, i) => i + 1),
        ];
        while (sdCalDays.length % 7 !== 0) sdCalDays.push(null);
        const sdIsSame = (a: Date, b: Date) =>
          a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
        const sdIsRef = (d: Date) => sdIsSame(d, latestDatasetDay());

        if (typeof document === "undefined") return null;

        return createPortal(
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setIsDateCalOpen(false)}
          >
            <div
              className="rounded-2xl overflow-hidden shadow-2xl w-[280px] sm:w-[300px] screen-enter"
              style={{ background: "#F4FAF7", border: "1.5px solid #10B981" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 pt-3.5 pb-3">
                <div className="flex items-center justify-between mb-2.5">
                  <button
                    onClick={() => setCalMonth(new Date(sdYear, sdMonthIdx - 1, 1))}
                    className="tap-target w-8 h-8 rounded-full flex items-center justify-center font-bold transition active:scale-90"
                    style={{ background: "#E8EFEC", color: "#2F4A43", fontSize: 16 }}
                  >
                    ‹
                  </button>
                  <p
                    className="font-extrabold text-[#183B34]"
                    style={{
                      fontSize: lang === "ur" ? 16 : 14,
                      fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                    }}
                  >
                    {sdMonthName}
                  </p>
                  <button
                    onClick={() => setCalMonth(new Date(sdYear, sdMonthIdx + 1, 1))}
                    className="tap-target w-8 h-8 rounded-full flex items-center justify-center font-bold transition active:scale-90"
                    style={{ background: "#E8EFEC", color: "#2F4A43", fontSize: 16 }}
                  >
                    ›
                  </button>
                </div>

                {selectedDate && (
                  <div className="flex justify-end mb-1.5">
                    <button
                      onClick={() => {
                        setSelectedDate(latestDatasetDay());
                        setIsDateCalOpen(false);
                      }}
                      className="font-bold px-2 py-0.5 rounded-full transition active:scale-95 shadow-sm"
                      style={{
                        background: "#E0F2FE",
                        color: "#0369A1",
                        fontSize: lang === "ur" ? 12 : 10,
                        fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                      }}
                    >
                      {(() => {
                        const d = latestDatasetDay();
                        const mon = (lang === "ur" ? mnUr : mn)[d.getMonth()];
                        return lang === "ur" ? `${d.getDate()} ${mon} (تازہ ترین)` : `${d.getDate()} ${mon} (Latest)`;
                      })()}
                    </button>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
                  {(lang === "ur"
                    ? ["ات", "پی", "من", "بد", "جم", "جم", "ہف"]
                    : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
                  ).map((d, i) => (
                    <div
                      key={i}
                      className="text-center font-bold text-[10px]"
                      style={{
                        color: "#80918B",
                        paddingBottom: 2,
                        fontFamily: lang === "ur" ? URDU_FONT : "inherit",
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                  {sdCalDays.map((day, idx) => {
                    if (!day) return <div key={idx} />;
                    const d = new Date(sdYear, sdMonthIdx, day);
                    const selected = selectedDate ? sdIsSame(d, selectedDate) : false;
                    const isRef = sdIsRef(d);
                    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    const inRange = dStr >= firstDatasetDate() && dStr <= latestDatasetDate();

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedDate(d);
                          setIsDateCalOpen(false);
                        }}
                        className="tap-target flex items-center justify-center rounded-full font-bold text-xs mx-auto transition active:scale-90"
                        style={{
                          width: 32,
                          height: 32,
                          background: selected
                            ? "#087F63"
                            : isRef
                              ? "#E4F2EC"
                              : inRange
                                ? "rgba(16, 185, 129, 0.08)"
                                : "transparent",
                          color: selected
                            ? "#fff"
                            : isRef
                              ? "#075E4F"
                              : inRange
                                ? "#143B33"
                                : "#94A3B8",
                          border: isRef && !selected
                            ? "1.5px solid #087F63"
                            : selected
                              ? "none"
                              : inRange
                                ? "1px solid rgba(16, 185, 129, 0.25)"
                                : "none",
                        }}
                      >
                        {lang === "ur" ? toUrduDigits(day) : day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </>
  );
}

// ─── Islamic / Lunar Calendar Helper ──────────────────────────
export function getIslamicDate(
  gregorianDate: Date,
  lang: string,
): { day: number; monthName: string; fullText: string; year: number } {
  const islamicMonthsEn = [
    "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
    "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
    "Ramadan", "Shawwal", "Dhul Qada", "Dhul Hijja",
  ];
  const islamicMonthsUr = [
    "محرم", "صفر", "ربیع الاول", "ربیع الثانی",
    "جمادی الاول", "جمادی الثانی", "رجب", "شعبان",
    "رمضان", "شوال", "ذیقعد", "ذی الحجہ",
  ];

  // Tabular Islamic calendar approximation
  const jd = Math.floor(
    (gregorianDate.getTime() / 86400000) + 2440587.5,
  ) + 1;
  const epoch = 1948440;
  const z = jd - epoch;
  const cycle = Math.floor(z / 10631);
  const rem = z % 10631;
  const year = cycle * 30 + Math.floor((rem * 30 + 29) / 10631) + 1;
  const dayOfYear = jd - Math.floor(epoch + ((year - 1) * 354.3670)) + 1;
  const monthApprox = Math.min(
    Math.floor((jd - (epoch + Math.floor((year - 1) * 354.3670))) / 29.53),
    11,
  );
  const month = Math.max(0, Math.min(11, monthApprox));
  const monthStart = epoch + Math.floor((year - 1) * 354.3670) + Math.floor(month * 29.53);
  const day = Math.max(1, Math.min(30, jd - Math.floor(monthStart) + 1));

  const monthName = lang === "ur" ? islamicMonthsUr[month] : islamicMonthsEn[month];
  const dayStr = lang === "ur" ? toUrduDigits(day) : String(day);
  const fullText = lang === "ur" ? `${dayStr} ${monthName}` : `${dayStr} ${monthName}`;

  return { day, monthName, fullText, year };
}
