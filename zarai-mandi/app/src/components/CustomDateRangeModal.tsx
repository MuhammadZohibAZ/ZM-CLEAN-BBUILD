import React, { useState, useEffect } from "react";
import { latestDatasetDate } from "../customer-face/shared/data/datasetDates";

export interface CustomDateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
  currentRange?: { start: string; end: string };
  onApply: (newRange: { start: string; end: string }) => void;
}

export function CustomDateRangeModal({
  isOpen,
  onClose,
  lang = "en",
  currentRange,
  onApply,
}: CustomDateRangeModalProps) {
  const [start, setStart] = useState(currentRange?.start || "2026-09-01");
  const [end, setEnd] = useState(currentRange?.end || latestDatasetDate());

  useEffect(() => {
    if (currentRange) {
      if (currentRange.start) setStart(currentRange.start);
      if (currentRange.end) setEnd(currentRange.end);
    }
  }, [currentRange, isOpen]);

  if (!isOpen) return null;

  const urduFont = "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', Tahoma, sans-serif";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl p-4 w-full max-w-xs shadow-2xl border border-[#D5E2DD] flex flex-col gap-3 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-[#EEF3F0] pb-2">
          <span
            className="font-extrabold text-sm text-[#143B33]"
            style={{ fontFamily: lang === "ur" ? urduFont : "inherit" }}
          >
            {lang === "ur" ? "مخصوص مدت کا انتخاب" : "Select Date Range"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-[#F1F5F3] text-[#52635F] flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2 text-xs font-bold text-[#52635F]">
          <label className="flex flex-col gap-1">
            <span>{lang === "ur" ? "شروع کی تاریخ:" : "Start Date:"}</span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="border border-[#CBD5E1] rounded-lg p-2 text-xs font-bold text-[#0F172A]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>{lang === "ur" ? "آخری تاریخ:" : "End Date:"}</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="border border-[#CBD5E1] rounded-lg p-2 text-xs font-bold text-[#0F172A]"
            />
          </label>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#F1F5F3] text-[#52635F]"
          >
            {lang === "ur" ? "منسوخ" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => {
              onApply({ start, end });
              onClose();
            }}
            className="flex-1 py-2 rounded-xl text-xs font-black bg-[#087F63] text-white shadow-sm"
          >
            {lang === "ur" ? "لاگو کریں" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomDateRangeModal;
