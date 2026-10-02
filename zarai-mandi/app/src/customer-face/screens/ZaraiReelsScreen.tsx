import React, { useState, useRef, useEffect } from "react";

import {
  VIDEO_MAIN_CATEGORIES,
  VIDEO_PRODUCT_OPTIONS,
  type VideoMainCategory,
  ZARAI_REELS,
  type ZaraiReel,
} from "../shared/data/reels";
import { useLang } from "../shared/i18n/LangProvider";

export function ZaraiReelsScreen({
  profileCompleted = false,
  onOpenCompleteProfile,
  onActiveReelChange,
  onMinimize,
}: {
  profileCompleted?: boolean;
  onOpenCompleteProfile?: () => void;
  onActiveReelChange?: (reel: ZaraiReel, isPlaying: boolean, isMuted: boolean) => void;
  onMinimize?: (reel: ZaraiReel, isPlaying: boolean, isMuted: boolean) => void;
}) {
  const { lang } = useLang();
  const [feedTab, setFeedTab] = useState<"forYou" | "saved">("forYou");
  const [mainCategory, setMainCategory] = useState<VideoMainCategory>("products");
  const [selectedProductSub, setSelectedProductSub] = useState<string>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false); // Default sound OPEN (unmuted)
  const [likedReelIds, setLikedReelIds] = useState<Set<string>>(
    new Set(["reel-1", "reel-4"]),
  );
  const [savedReelIds, setSavedReelIds] = useState<Set<string>>(new Set(["reel-2"]));
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [flyingHearts, setFlyingHearts] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const [isPlayingMap, setIsPlayingMap] = useState<Record<string, boolean>>({});
  const [, setVideoErrors] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({
    time: 0,
    x: 0,
    y: 0,
  });

  const tabFilteredReels =
    feedTab === "saved"
      ? ZARAI_REELS.filter((r) => savedReelIds.has(r.id))
      : ZARAI_REELS;

  const displayedReels = tabFilteredReels.filter((r) => {
    if (mainCategory === "general") {
      return (
        r.id === "reel-4" ||
        r.id === "reel-10" ||
        r.product.toLowerCase().includes("rafay") ||
        r.product.toLowerCase().includes("auction")
      );
    }
    if (mainCategory === "harvesting") {
      return (
        r.id === "reel-9" ||
        r.id === "reel-11" ||
        r.product.toLowerCase().includes("harvest")
      );
    }
    // mainCategory === "products"
    if (selectedProductSub === "all") {
      return (
        r.id !== "reel-4" &&
        r.id !== "reel-9" &&
        r.id !== "reel-10" &&
        r.id !== "reel-11"
      );
    }
    const target = selectedProductSub.toLowerCase();
    return (
      r.product.toLowerCase().includes(target) ||
      r.category.toLowerCase().includes(target) ||
      r.title.toLowerCase().includes(target)
    );
  });

  // Sync active reel state to parent for mini-player
  useEffect(() => {
    if (displayedReels[activeIndex]) {
      onActiveReelChange?.(
        displayedReels[activeIndex],
        isPlayingMap[displayedReels[activeIndex].id] ?? true,
        isMuted,
      );
    }
  }, [activeIndex, displayedReels, isPlayingMap, isMuted, onActiveReelChange]);

  // Handle intersection / scroll snap active index
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const index = Math.round(scrollTop / (clientHeight || 1));
    if (index !== activeIndex && index >= 0 && index < displayedReels.length) {
      setActiveIndex(index);
    }
  };

  // Play active video with sound, pause others (automatic playback on tab switch)
  useEffect(() => {
    const timer = setTimeout(() => {
      videoRefs.current.forEach((v, idx) => {
        if (!v) return;
        v.muted = isMuted;
        v.volume = 1.0;
        if (idx === activeIndex) {
          const playPromise = v.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlayingMap((prev) => ({
                  ...prev,
                  [displayedReels[idx]?.id || ""]: true,
                }));
              })
              .catch(() => {
                // If browser blocks unmuted autoplay, fallback immediately to muted autoplay
                v.muted = true;
                v.play()
                  .then(() => {
                    setIsPlayingMap((prev) => ({
                      ...prev,
                      [displayedReels[idx]?.id || ""]: true,
                    }));
                  })
                  .catch(() => { });
              });
          }
        } else {
          v.pause();
          setIsPlayingMap((prev) => ({
            ...prev,
            [displayedReels[idx]?.id || ""]: false,
          }));
        }
      });
    }, 60);

    return () => clearTimeout(timer);
  }, [activeIndex, displayedReels, isMuted]);

  const togglePlayPause = (reelId: string, idx: number) => {
    const v = videoRefs.current[idx];
    if (!v) return;
    v.muted = isMuted;
    v.volume = 1.0;
    if (v.paused) {
      v.play()
        .then(() => setIsPlayingMap((prev) => ({ ...prev, [reelId]: true })))
        .catch(() => { });
    } else {
      v.pause();
      setIsPlayingMap((prev) => ({ ...prev, [reelId]: false }));
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRefs.current.forEach((v) => {
      if (v) {
        v.muted = nextMuted;
        v.volume = 1.0;
      }
    });
  };

  const triggerHeartAnimation = (clientX: number, clientY: number) => {
    const newHeart = {
      id: Date.now() + Math.random(),
      x: clientX,
      y: clientY,
    };
    setFlyingHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setFlyingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 950);
  };

  const handleReelTouch = (
    e: React.MouseEvent | React.TouchEvent,
    reel: ZaraiReel,
    idx: number,
  ) => {
    const v = videoRefs.current[idx];
    if (v) {
      v.muted = isMuted;
      v.volume = 1.0;
    }

    const now = Date.now();
    let x = 160;
    let y = 300;

    if ("clientX" in e) {
      x = e.clientX;
      y = e.clientY;
    } else if (e.touches && e.touches[0]) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }

    if (now - lastTapRef.current.time < 300) {
      // Double tap -> Like & float heart!
      setLikedReelIds((prev) => {
        const next = new Set(prev);
        next.add(reel.id);
        return next;
      });
      triggerHeartAnimation(x, y);
      lastTapRef.current = { time: 0, x: 0, y: 0 };
    } else {
      lastTapRef.current = { time: now, x, y };
      setTimeout(() => {
        if (Date.now() - lastTapRef.current.time >= 280 && lastTapRef.current.time > 0) {
          togglePlayPause(reel.id, idx);
        }
      }, 290);
    }
  };

  const toggleLike = (reelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedReelIds((prev) => {
      const next = new Set(prev);
      if (next.has(reelId)) next.delete(reelId);
      else {
        next.add(reelId);
        triggerHeartAnimation(window.innerWidth / 2, window.innerHeight / 2);
      }
      return next;
    });
  };

  const toggleSave = (reelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedReelIds((prev) => {
      const next = new Set(prev);
      if (next.has(reelId)) next.delete(reelId);
      else next.add(reelId);
      return next;
    });
  };

  const handleExportReel = async (reel: ZaraiReel, e: React.MouseEvent) => {
    e.stopPropagation();
    const title = lang === "ur" ? reel.titleUrdu : reel.title;
    const author = lang === "ur" ? reel.authorUrdu : reel.author;

    try {
      if (navigator.share) {
        try {
          await navigator.share({
            title: title,
            text: `${title} - ${author} | Zarai Mandi`,
            url: window.location.href,
          });
          setExportToast(lang === "ur" ? "شیئر مکمل ہوا" : "Shared successfully!");
          setTimeout(() => setExportToast(null), 3000);
          return;
        } catch (err: any) {
          if (err?.name === "AbortError") return;
        }
      }

      // Download file fallback
      const link = document.createElement("a");
      link.href = reel.videoPath;
      link.download = `zarai_${reel.product.toLowerCase().replace(/\s+/g, "_")}_${reel.id}.mp4`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportToast(lang === "ur" ? "ویڈیو ایکسپورٹ ہو گئی ہے!" : "Reel exported successfully!");
      setTimeout(() => setExportToast(null), 3000);
    } catch {
      const link = document.createElement("a");
      link.href = reel.videoPath;
      link.download = `zarai_reel_${reel.id}.mp4`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportToast(lang === "ur" ? "ویڈیو ڈاؤنلوڈ ہو رہی ہے..." : "Downloading reel...");
      setTimeout(() => setExportToast(null), 3000);
    }
  };

  const scrollNext = (direction: "up" | "down") => {
    if (!containerRef.current) return;
    const h = containerRef.current.clientHeight;
    containerRef.current.scrollBy({
      top: direction === "down" ? h : -h,
      behavior: "smooth",
    });
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: "#000",
        color: "#fff",
      }}
    >
      {/* Toast Notification */}
      {exportToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#087F63]/95 backdrop-blur-md text-white text-xs font-bold shadow-2xl border border-white/20 animate-in fade-in zoom-in-95 flex items-center gap-2 pointer-events-none">
          <span>✓</span>
          <span>{exportToast}</span>
        </div>
      )}

      {/* Top overlay, TikTok style: floats over the full-screen video with a
          soft scrim instead of solid bars.
          Row 1: minimise · content type (Products / General Info / Baithak) · sound.
          Row 2: feed (For You / Saved) · product filter. */}
      <div
        className="absolute top-0 left-0 right-0 z-40 pointer-events-none"
        style={{
          paddingTop: "max(10px, env(safe-area-inset-top, 0px), calc(var(--zm-bleed-top) + 2px))",
          paddingBottom: 28,
          background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 55%, rgba(0,0,0,0) 100%)",
        }}
      >
        <div className="flex items-center justify-between px-3" style={{ height: 40 }}>
          <button
            onClick={() => {
              const curReel = displayedReels[activeIndex] || ZARAI_REELS[0];
              const isP = isPlayingMap[curReel.id] ?? true;
              onMinimize?.(curReel, isP, isMuted);
            }}
            className="tap-target w-9 h-9 rounded-full flex items-center justify-center text-white pointer-events-auto active:scale-90 transition"
            style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
            title={lang === "ur" ? "ویڈیو نیچے کریں" : "Minimize to mini player"}
            aria-label={lang === "ur" ? "ویڈیو نیچے کریں" : "Minimize to mini player"}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div className="flex items-center gap-4 pointer-events-auto" role="tablist">
            {VIDEO_MAIN_CATEGORIES.map((cat) => {
              const on = mainCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setMainCategory(cat.id);
                    setActiveIndex(0);
                    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="tap-target relative flex flex-col items-center transition-colors"
                  style={{
                    fontSize: lang === "ur" ? 16 : 15.5,
                    fontWeight: on ? 800 : 600,
                    color: on ? "#FFFFFF" : "rgba(255,255,255,0.62)",
                    textShadow: "0 1px 4px rgba(0,0,0,0.55)",
                    letterSpacing: "-0.01em",
                    paddingBottom: 6,
                  }}
                >
                  {lang === "ur" ? cat.labelUrdu : cat.label}
                  <span
                    className="absolute bottom-0 rounded-full transition-all"
                    style={{ height: 3, width: on ? 22 : 0, background: "#FFFFFF", opacity: on ? 1 : 0 }}
                  />
                </button>
              );
            })}
          </div>

          <button
            onClick={toggleMute}
            className="tap-target w-9 h-9 rounded-full flex items-center justify-center text-white pointer-events-auto active:scale-90 transition"
            style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.73 4.73H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-1.5 px-3 overflow-x-auto pointer-events-auto" style={{ scrollbarWidth: "none" }}>
          {/* Feed: For You / Saved */}
          <div className="flex-shrink-0 flex items-center rounded-full p-0.5" style={{ background: "rgba(0,0,0,0.28)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.16)" }}>
            {(["forYou", "saved"] as const).map((tab) => {
              const on = feedTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setFeedTab(tab)}
                  aria-pressed={on}
                  className="tap-target flex items-center gap-1 rounded-full transition-all"
                  style={{
                    height: 26,
                    padding: "0 10px",
                    fontSize: 12,
                    fontWeight: on ? 800 : 600,
                    background: on ? "rgba(255,255,255,0.22)" : "transparent",
                    color: on ? "#FFFFFF" : "rgba(255,255,255,0.7)",
                  }}
                >
                  {tab === "saved" && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  )}
                  {tab === "forYou" ? (lang === "ur" ? "آپ کے لیے" : "For You") : lang === "ur" ? "محفوظ" : "Saved"}
                </button>
              );
            })}
          </div>

          {/* Product filter (Products only) */}
          {mainCategory === "products" && (
            <>
              <span className="flex-shrink-0" style={{ width: 1, height: 18, background: "rgba(255,255,255,0.3)", margin: "0 2px" }} />
              {VIDEO_PRODUCT_OPTIONS.map((prod) => {
                const on = selectedProductSub === prod.id;
                return (
                  <button
                    key={prod.id}
                    onClick={() => {
                      setSelectedProductSub(prod.id);
                      setActiveIndex(0);
                      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    aria-pressed={on}
                    className="tap-target flex-shrink-0 rounded-full whitespace-nowrap transition-all"
                    style={{
                      height: 28,
                      padding: "0 12px",
                      fontSize: 12.5,
                      fontWeight: on ? 800 : 600,
                      background: on ? "#FFFFFF" : "rgba(0,0,0,0.28)",
                      color: on ? "#07332F" : "rgba(255,255,255,0.9)",
                      border: on ? "1px solid #FFFFFF" : "1px solid rgba(255,255,255,0.16)",
                      backdropFilter: on ? undefined : "blur(10px)",
                      WebkitBackdropFilter: on ? undefined : "blur(10px)",
                    }}
                  >
                    {lang === "ur" ? prod.labelUrdu : prod.label}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2.5 opacity-50 hover:opacity-100 transition-opacity pointer-events-auto">
        {activeIndex > 0 && (
          <button
            onClick={() => scrollNext("up")}
            className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 tap-target text-[10px] font-bold"
            title="Previous"
          >
            ▲
          </button>
        )}
        {activeIndex < displayedReels.length - 1 && (
          <button
            onClick={() => scrollNext("down")}
            className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 tap-target text-[10px] font-bold"
            title="Next"
          >
            ▼
          </button>
        )}
      </div>

      {flyingHearts.map((h) => (
        <div
          key={h.id}
          className="pointer-events-none fixed z-50 animate-float-heart"
          style={{
            left: h.x - 24,
            top: h.y - 24,
            fontSize: 44,
            filter: "drop-shadow(0 4px 12px rgba(255,50,80,0.6))",
          }}
        >
          ❤️
        </div>
      ))}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="reels-snap-container w-full"
        style={{
          // Full-screen from the top (under the floating tabs, TikTok style)
          // down to the bottom nav, never underneath it.
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: "var(--zm-nav-space)",
          scrollSnapType: "y mandatory",
        }}
      >
        {displayedReels.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white text-2xl mb-3 border border-white/15">
              {feedTab === "saved" ? "🔖" : "🌾"}
            </div>
            <p className="font-bold text-sm text-white">
              {feedTab === "saved"
                ? lang === "ur"
                  ? "کوئی محفوظ شدہ ویڈیو نہیں ہے"
                  : "No Saved Videos Yet"
                : lang === "ur"
                  ? "اس پراڈکٹ کی کوئی ویڈیو دستیاب نہیں"
                  : "No videos for this product yet"}
            </p>
            <p className="text-white/60 text-xs mt-1 max-w-[240px]">
              {feedTab === "saved"
                ? lang === "ur"
                  ? "ویڈیو کے ساتھ محفوظ کریں (Save) کا بٹن دبا کر ویڈیوز یہاں دیکھیں"
                  : "Tap the bookmark/save button on any video to see it here"
                : lang === "ur"
                  ? "تمام ویڈیوز دیکھنے کے لیے 'تمام' منتخب کریں"
                  : "Select 'All' to explore all crop and mandi videos"}
            </p>
            <button
              onClick={() => {
                setFeedTab("forYou");
                setSelectedProductSub("all");
              }}
              className="mt-4 px-5 py-2.5 rounded-full bg-[#087F63] text-white font-extrabold text-xs tap-target shadow-lg"
            >
              {lang === "ur" ? "تمام ویڈیوز دیکھیں" : "Explore All Videos"}
            </button>
          </div>
        ) : (
          displayedReels.map((reel, idx) => {
            const isLiked = likedReelIds.has(reel.id);
            const isSaved = savedReelIds.has(reel.id);
            const isPlaying = isPlayingMap[reel.id] ?? false;

            return (
              <div
                key={reel.id}
                className="reel-snap-item relative w-full h-full flex items-center justify-center overflow-hidden"
                style={{
                  height: "100%",
                  scrollSnapAlign: "start",
                }}
                onClick={(e) => handleReelTouch(e, reel, idx)}
              >
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    background: reel.gradient,
                  }}
                >
                  <video
                    ref={(el) => {
                      videoRefs.current[idx] = el;
                      if (el && idx === activeIndex && el.paused) {
                        el.play().catch(() => {
                          el.muted = true;
                          el.play().catch(() => { });
                        });
                      }
                    }}
                    src={reel.videoPath}
                    playsInline
                    autoPlay={idx === activeIndex}
                    loop
                    preload="auto"
                    className="w-full h-full object-cover"
                    onLoadedData={(e) => {
                      if (idx === activeIndex) {
                        e.currentTarget.play().catch(() => {
                          e.currentTarget.muted = true;
                          e.currentTarget.play().catch(() => { });
                        });
                      }
                    }}
                    onError={() => {
                      setVideoErrors((prev) => ({ ...prev, [reel.id]: true }));
                    }}
                    onPlay={() => {
                      setIsPlayingMap((prev) => ({ ...prev, [reel.id]: true }));
                    }}
                    onPause={() => {
                      setIsPlayingMap((prev) => ({ ...prev, [reel.id]: false }));
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85 pointer-events-none" />
                </div>

                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/90 border border-white/20 shadow-2xl animate-pulse">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Right Action Bar: Like, Save, Export */}
                <div className="absolute right-3.5 bottom-16 z-30 flex flex-col items-center gap-5 pointer-events-auto">
                  {/* Like Button */}
                  <button
                    onClick={(e) => toggleLike(reel.id, e)}
                    className="flex flex-col items-center tap-target group"
                  >
                    <div
                      className={`rounded-full flex items-center justify-center transition-transform active:scale-125 shadow-lg ${isLiked
                        ? "bg-[#FF2B54]/25 text-[#FF2B54] border border-[#FF2B54]/40"
                        : "bg-black/45 text-white backdrop-blur-md border border-white/20"
                        }`}
                      style={{ width: 46, height: 46 }}
                    >
                      <svg
                        width="25"
                        height="25"
                        viewBox="0 0 24 24"
                        fill={isLiked ? "#FF2B54" : "none"}
                        stroke={isLiked ? "#FF2B54" : "currentColor"}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-black text-white mt-1 drop-shadow">
                      {Math.floor((reel.likesCount + (isLiked ? 1 : 0)) / 1000)}k
                    </span>
                  </button>

                  {/* Save Button */}
                  <button
                    onClick={(e) => toggleSave(reel.id, e)}
                    className="flex flex-col items-center tap-target"
                  >
                    <div
                      className={`rounded-full flex items-center justify-center transition-transform active:scale-125 shadow-lg ${isSaved
                        ? "bg-[#F59E0B]/25 text-[#F59E0B] border border-[#F59E0B]/40"
                        : "bg-black/45 text-white backdrop-blur-md border border-white/20"
                        }`}
                      style={{ width: 46, height: 46 }}
                    >
                      <svg
                        width="23"
                        height="23"
                        viewBox="0 0 24 24"
                        fill={isSaved ? "#F59E0B" : "none"}
                        stroke={isSaved ? "#F59E0B" : "currentColor"}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-black text-white mt-1 drop-shadow">
                      {lang === "ur" ? "محفوظ" : "Save"}
                    </span>
                  </button>

                  {/* Export Button */}
                  <button
                    onClick={(e) => handleExportReel(reel, e)}
                    className="flex flex-col items-center tap-target"
                    title={lang === "ur" ? "ایکسپورٹ کریں" : "Export Reel"}
                  >
                    <div
                      className="rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-lg active:scale-125 transition-transform"
                      style={{ width: 46, height: 46 }}
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-black text-white mt-1 drop-shadow">
                      {lang === "ur" ? "ایکسپورٹ" : "Export"}
                    </span>
                  </button>
                </div>

                {/* Bottom author and caption info */}
                <div className="absolute left-4 right-20 bottom-6 z-30 flex flex-col gap-0.5 text-left pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[15px] text-white drop-shadow-md">
                      {lang === "ur" ? reel.authorUrdu : reel.author}
                    </span>
                    {reel.isVerified && (
                      <span
                        className="w-4 h-4 rounded-full bg-[#32BA46] text-[#07332F] text-[10px] font-black flex items-center justify-center shadow"
                        title="Verified Representative"
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <p
                    className="text-white/95 text-xs font-semibold drop-shadow-md line-clamp-1"
                    style={{
                      fontFamily:
                        lang === "ur"
                          ? "'Noto Nastaliq Urdu', serif"
                          : "inherit",
                    }}
                  >
                    {lang === "ur" ? reel.titleUrdu : reel.title}
                  </p>
                </div>

                {/* Bottom playback progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/20 z-30">
                  <div
                    className="h-full bg-[#32BA46] transition-all duration-300"
                    style={{
                      width: isPlaying ? "100%" : "35%",
                      transitionDuration: isPlaying ? "15s" : "0.3s",
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Alias for seamless routing
export const NewsVideosScreen = ZaraiReelsScreen;
