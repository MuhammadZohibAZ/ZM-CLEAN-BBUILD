"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import ZaraiMandiMap from "./ZaraiMandiMap";
import pakistanMapBg from "../assets/pakistan_map_btn_bg.png";

export interface ExpandableMandiMapCardProps {
  mandiName: string;
  provinceName?: string;
  commodityName?: string;
  rateInfo?: {
    cropName?: string;
    mandiName?: string;
    minPrice?: number;
    maxPrice?: number;
    rateType?: string;
    trend?: "up" | "down" | "flat" | "stable";
    trendPct?: number;
    arrival?: string;
    quality?: string;
    variety?: string;
    color?: string;
    condition?: string;
    spec?: string;
  };
  lang?: "ur" | "en";
  urduFont?: string;
  onSpeak?: (text: string) => void;
  className?: string;
}

export const ExpandableMandiMapCard: React.FC<ExpandableMandiMapCardProps> = ({
  mandiName,
  provinceName = "Punjab",
  commodityName = "Wheat",
  rateInfo,
  lang = "en",
  urduFont,
  onSpeak,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-40, 40], [6, -6]);
  const rotateY = useTransform(mouseX, [-150, 150], [-6, 6]);

  const springRotateX = useSpring(rotateX, { stiffness: 320, damping: 28 });
  const springRotateY = useSpring(rotateY, { stiffness: 320, damping: 28 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const handleCardClick = () => {
    setIsExpanded(true);
    if (onSpeak) {
      onSpeak(
        lang === "ur"
          ? `${mandiName} میں ${commodityName} کا نقشہ کھل گیا`
          : `Opened ${commodityName} map for ${mandiName}`
      );
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsExpanded(false);
  };

  return (
    <>
      {/* ── Compact 3D Spring Card with Animated Boundary & Custom Background ── */}
      <motion.div
        ref={containerRef}
        className={`relative cursor-pointer select-none w-full mb-2.5 ${className}`}
        style={{ perspective: 1000 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        whileTap={{ scale: 0.985 }}
      >
        {/* Continuous Animated Racetrack / Boundary Glow Frame */}
        <div className="absolute -inset-[2px] rounded-[20px] overflow-hidden pointer-events-none z-0">
          <div
            className="absolute -inset-[150%] animate-[spin_4s_linear_infinite]"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, #059669 60deg, #10B981 120deg, #34D399 180deg, transparent 240deg, transparent 360deg)",
              opacity: isHovered ? 0.95 : 0.65,
              transition: "opacity 0.3s ease",
            }}
          />
        </div>

        {/* Main Button Container */}
        <motion.div
          className="relative z-10 overflow-hidden flex items-center justify-between px-4 py-2"
          style={{
            height: 76,
            borderRadius: 18,
            backgroundImage: `url(${pakistanMapBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "#F4FAF7",
            boxShadow: isHovered
              ? "0 10px 28px rgba(8,127,99,0.22)"
              : "0 2px 14px rgba(8,127,99,0.12)",
            rotateX: springRotateX,
            rotateY: springRotateY,
            transformStyle: "preserve-3d",
            transform: isHovered ? "translateZ(12px)" : "translateZ(0px)",
            transition: "box-shadow 0.25s ease",
          }}
        >
          {/* Subtle Frosted Tint Overlay so text remains ultra-legible */}
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px] pointer-events-none" />

          {/* Left space offset for the map graphic embedded in background */}
          <div className="w-16 flex-shrink-0" />

          {/* Mandi & Commodity Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center px-2 z-10">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-800/90">
                {commodityName} Market
              </span>
            </div>
            <span
              className="font-black text-[14px] leading-tight truncate text-emerald-950 mt-0.5"
              style={{
                fontFamily: lang === "ur" ? urduFont : "inherit",
              }}
            >
              {mandiName}
            </span>
            <motion.div
              className="h-0.5 rounded-full mt-1 bg-emerald-600"
              initial={{ width: 28 }}
              animate={{ width: isHovered ? 48 : 28 }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Map View Pill Badge */}
          <div className="flex-shrink-0 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-emerald-300 shadow-md backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-extrabold text-[11px] text-emerald-950">
              {lang === "ur" ? "نقشہ دیکھیں" : "Map View"}
            </span>
          </div>
        </motion.div>

        {/* Hover Micro-Hint */}
        <AnimatePresence>
          {isHovered && !isExpanded && (
            <motion.p
              className="absolute -bottom-4 left-1/2 text-[10px] font-bold text-emerald-800 whitespace-nowrap pointer-events-none"
              style={{ x: "-50%" }}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.18 }}
            >
              {lang === "ur" ? "نقشہ اور گراف دیکھنے کے لیے دبائیں" : "Click to view map & rate graph"}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Expanded Fullscreen Map Overlay (Loaded on same screen) ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 z-[250] flex flex-col items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => handleClose()}
          >
            {/* Cross Button OUTSIDE the parameter of the map card */}
            <div className="w-full max-w-[428px] flex justify-end px-1 pb-2 pt-1 pointer-events-auto">
              <button
                onClick={(e) => handleClose(e)}
                className="tap-target flex items-center justify-center w-9 h-9 rounded-full bg-white text-emerald-950 shadow-2xl border border-emerald-100 hover:bg-emerald-50 active:scale-95 transition-all"
                aria-label="Close Map"
                title={lang === "ur" ? "بند کریں" : "Close map"}
              >
                <X size={19} strokeWidth={2.5} color="#166534" />
              </button>
            </div>

            {/* Expanded Modal Box - Floating Rounded Rectangular Box */}
            <motion.div
              className="w-full max-w-[428px] h-[88vh] max-h-[760px] rounded-[26px] overflow-hidden bg-white shadow-2xl relative flex flex-col pointer-events-auto border-2 border-emerald-200/90 ring-1 ring-black/5"
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 32,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <ZaraiMandiMap
                onClose={() => handleClose()}
                initialMandiName={mandiName}
                initialProvinceName={provinceName}
                activeCommodity={commodityName}
                rateInfo={rateInfo}
                lang={lang}
                urduFont={urduFont}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ExpandableMandiMapCard;
