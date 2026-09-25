import React, { useState, useRef, useEffect } from "react";

import {
  type ReelComment,
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
  const [feedTab, setFeedTab] = useState<"forYou" | "following" | "saved">("forYou");
  const [mainCategory, setMainCategory] = useState<VideoMainCategory>("products");
  const [selectedProductSub, setSelectedProductSub] = useState<string>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false); // Default sound OPEN (unmuted)
  const [likedReelIds, setLikedReelIds] = useState<Set<string>>(
    new Set(["reel-1", "reel-4"]),
  );
  const [savedReelIds, setSavedReelIds] = useState<Set<string>>(new Set(["reel-2"]));
  const [followedAuthors, setFollowedAuthors] = useState<Set<string>>(
    new Set(["Ahmad Khan (Mandi Rep)"]),
  );
  const [commentsDrawerReel, setCommentsDrawerReel] = useState<ZaraiReel | null>(
    null,
  );
  const [commentsMap, setCommentsMap] = useState<Record<string, ReelComment[]>>(() => {
    const map: Record<string, ReelComment[]> = {};
    ZARAI_REELS.forEach((r) => {
      map[r.id] = r.comments;
    });
    return map;
  });
  const [newCommentText, setNewCommentText] = useState("");
  const [flyingHearts, setFlyingHearts] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const [isPlayingMap, setIsPlayingMap] = useState<Record<string, boolean>>({});
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({
    time: 0,
    x: 0,
    y: 0,
  });

  const tabFilteredReels =
    feedTab === "following"
      ? ZARAI_REELS.filter((r) => followedAuthors.has(r.author))
      : feedTab === "saved"
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

  const toggleFollow = (author: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowedAuthors((prev) => {
      const next = new Set(prev);
      if (next.has(author)) {
        next.delete(author);
      } else {
        next.add(author);
      }
      return next;
    });
  };

  const handleAddComment = (reelId: string, textOverride?: string) => {
    const textToPost = (textOverride || newCommentText).trim();
    if (!textToPost) return;
    const newC: ReelComment = {
      id: "cm-" + Date.now(),
      author: "You (Trader)",
      authorUrdu: "آپ (کسان ساتھی)",
      avatar: "YOU",
      time: "Just now",
      timeUrdu: "ابھی",
      text: textToPost,
      textUrdu: textToPost,
      likes: 0,
    };
    setCommentsMap((prev) => ({
      ...prev,
      [reelId]: [newC, ...(prev[reelId] || [])],
    }));
    if (!textOverride) {
      setNewCommentText("");
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
      {/* Top Header: Minimize Button, Tabs (Following, For You, Saved), Mute Toggle */}
      <header
        className="absolute top-0 left-0 right-0 z-40 px-3.5 pt-9 pb-1.5 flex items-center justify-between pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)",
        }}
      >
        {/* Minimize button to picture-in-picture mini-player */}
        <button
          onClick={() => {
            const curReel = displayedReels[activeIndex] || ZARAI_REELS[0];
            const isP = isPlayingMap[curReel.id] ?? true;
            onMinimize?.(curReel, isP, isMuted);
          }}
          className="tap-target w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20 text-white pointer-events-auto shadow-md hover:scale-105 active:scale-95 transition"
          title={lang === "ur" ? "ویڈیو نیچے کریں" : "Minimize to mini player"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Following / For You / Saved feed tabs */}
        <div className="flex items-center gap-3.5 text-xs font-extrabold drop-shadow pointer-events-auto">
          <button
            onClick={() => setFeedTab("following")}
            className={`tap-target transition-all ${feedTab === "following"
              ? "text-white scale-105 border-b-2 border-[#32BA46] pb-0.5 font-black"
              : "text-white/60 hover:text-white"
              }`}
          >
            {lang === "ur" ? "فالونگ" : "Following"}
          </button>
          <button
            onClick={() => setFeedTab("forYou")}
            className={`tap-target transition-all ${feedTab === "forYou"
              ? "text-white scale-105 border-b-2 border-[#32BA46] pb-0.5 font-black"
              : "text-white/60 hover:text-white"
              }`}
          >
            {lang === "ur" ? "آپ کے لیے" : "For You"}
          </button>
          <button
            onClick={() => setFeedTab("saved")}
            className={`tap-target transition-all ${feedTab === "saved"
              ? "text-white scale-105 border-b-2 border-[#32BA46] pb-0.5 font-black"
              : "text-white/60 hover:text-white"
              }`}
          >
            {lang === "ur" ? "محفوظ شدہ" : "Saved"}
          </button>
        </div>

        {/* Sound mute/unmute button */}
        <button
          onClick={toggleMute}
          className="tap-target w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20 text-white pointer-events-auto shadow-md"
          title={isMuted ? "Unmute Voice" : "Mute Voice"}
        >
          {isMuted ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.73 4.73H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>
      </header>

      {/* 3 Main Category Option Tabs: Products | General Info | Harvesting */}
      <div
        className="absolute top-[68px] left-0 right-0 z-40 px-3 py-1 flex flex-col gap-1.5 pointer-events-auto"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 75%, rgba(0,0,0,0) 100%)",
        }}
      >
        {/* Main 3 Options Bar (Fixed 3 grid columns) */}
        <div className="grid grid-cols-3 gap-1.5 bg-black/45 backdrop-blur-md p-1 rounded-2xl border border-white/20">
          {VIDEO_MAIN_CATEGORIES.map((cat) => {
            const isSelected = mainCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setMainCategory(cat.id);
                  setActiveIndex(0);
                  if (containerRef.current) {
                    containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold tap-target transition-all flex items-center justify-center gap-1 ${isSelected
                  ? "bg-[#32BA46] text-[#07332F] font-black shadow-md scale-[1.02]"
                  : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
              >
                <span className="text-xs">{cat.icon}</span>
                <span className="truncate">{lang === "ur" ? cat.labelUrdu : cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-product Horizontal Filter (Shown when Products is selected) */}
        {mainCategory === "products" && (
          <div
            className="flex items-center gap-1.5 overflow-x-auto py-0.5 animate-in fade-in duration-150"
            style={{ scrollbarWidth: "none" }}
          >
            {VIDEO_PRODUCT_OPTIONS.map((prod) => {
              const isSelected = selectedProductSub === prod.id;
              return (
                <button
                  key={prod.id}
                  onClick={() => {
                    setSelectedProductSub(prod.id);
                    setActiveIndex(0);
                    if (containerRef.current) {
                      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap tap-target transition-all flex items-center gap-1 flex-shrink-0 ${isSelected
                    ? "bg-white text-[#07332F] font-black shadow-md scale-105"
                    : "bg-black/55 text-white/80 backdrop-blur-md border border-white/15 hover:bg-black/75 hover:text-white"
                    }`}
                >
                  <span>{lang === "ur" ? prod.labelUrdu : prod.label}</span>
                </button>
              );
            })}
          </div>
        )}
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
        className="reels-snap-container w-full h-full"
        style={{
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
            const isFollowing = followedAuthors.has(reel.author);
            const isPlaying = isPlayingMap[reel.id] ?? false;
            const commentsList = commentsMap[reel.id] || reel.comments;

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
                <div className="absolute right-3.5 bottom-16 z-30 flex flex-col items-center gap-5 pointer-events-auto">
                  <div className="relative mb-1">
                    <div
                      className="rounded-full bg-[#087F63] border-2 border-white flex items-center justify-center text-sm font-black text-white shadow-2xl overflow-hidden"
                      style={{ width: 48, height: 48 }}
                    >
                      {reel.avatar}
                    </div>
                    <button
                      onClick={(e) => toggleFollow(reel.author, e)}
                      className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full font-black flex items-center justify-center shadow-lg tap-target border-2 border-white transition-transform duration-150 ${isFollowing
                        ? "bg-[#064D40] text-white hover:bg-rose-600 scale-95 text-[11px]"
                        : "bg-[#32BA46] text-[#07332F] hover:scale-110 text-xs font-extrabold"
                        }`}
                      style={{ width: 22, height: 22 }}
                      title={
                        isFollowing
                          ? lang === "ur"
                            ? "ان فالو کرنے کے لیے کلک کریں"
                            : "Click to unfollow"
                          : lang === "ur"
                            ? "فالو کریں"
                            : "Follow"
                      }
                    >
                      {isFollowing ? "✓" : "+"}
                    </button>
                  </div>
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCommentsDrawerReel(reel);
                    }}
                    className="flex flex-col items-center tap-target"
                  >
                    <div
                      className="rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-lg active:scale-125 transition-transform"
                      style={{ width: 46, height: 46 }}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-black text-white mt-1 drop-shadow">
                      {commentsList.length}
                    </span>
                  </button>
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
                </div>
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
      {commentsDrawerReel && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/65 backdrop-blur-sm"
          onClick={() => setCommentsDrawerReel(null)}
        >
          <div
            className="w-full max-w-[480px] mx-auto rounded-t-3xl flex flex-col shadow-2xl border-t border-[#D5E2DD] animate-in slide-in-from-bottom duration-200 overflow-hidden"
            style={{
              background: "#FFFFFF",
              height: "72vh",
              maxHeight: "85vh",
              color: "#183B34",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#E8EFEC] flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-[#183B34]">
                  {lang === "ur" ? "تبصرے" : "Comments"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#E4F2EC] text-[#087F63] text-xs font-black">
                  {(commentsMap[commentsDrawerReel.id] || []).length}
                </span>
              </div>
              <button
                onClick={() => setCommentsDrawerReel(null)}
                className="w-8 h-8 rounded-full bg-[#F1F7F4] flex items-center justify-center text-[#52635F] tap-target text-sm font-bold hover:bg-[#E4F2EC]"
              >
                ✕
              </button>
            </div>
            {!profileCompleted ? (
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#E8F8F0] border border-[#C7E8D8] flex items-center justify-center text-2xl shadow-inner">
                  🔒
                </div>
                <div className="space-y-1 max-w-xs">
                  <p className="text-sm font-extrabold text-[#183B34]">
                    {lang === "ur"
                      ? "تبصرے دیکھنے اور کرنے کے لیے پروفائل مکمل کریں"
                      : "Complete Profile & Subscribe"}
                  </p>
                  <p className="text-xs text-[#52635F] leading-relaxed">
                    {lang === "ur"
                      ? "منڈی کے کسانوں، بیوپاریوں اور نمائندوں کے تبصرے دیکھنے اور اپنی رائے دینے کے لیے پروفائل مکمل کریں۔"
                      : "Complete your profile and subscribe to view all mandi community discussions and post your own comments."}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCommentsDrawerReel(null);
                    onOpenCompleteProfile?.();
                  }}
                  className="mt-2 px-6 py-2.5 rounded-full bg-[#087F63] text-white text-xs font-extrabold shadow-md hover:bg-[#065E49] tap-target transition-all"
                >
                  {lang === "ur" ? "پروفائل مکمل کریں →" : "Complete Profile & Subscribe →"}
                </button>
              </div>
            ) : (
              <>
                {/* Comments List (High contrast, clean, theme-friendly) */}
                <div className="flex-1 overflow-y-auto min-h-0 px-5 py-3.5 flex flex-col gap-3">
                  {(commentsMap[commentsDrawerReel.id] || []).map((c) => (
                    <div key={c.id} className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#087F63] border border-[#C7E8D8] flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 shadow-sm">
                        {c.avatar}
                      </div>
                      <div className="flex-1 bg-[#F4FAF7] px-3 py-2 rounded-2xl border border-[#D5E2DD]">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-[#183B34]">
                            {lang === "ur" ? c.authorUrdu || c.author : c.author}
                          </span>
                          <span className="text-[10px] text-[#80918B]">
                            {lang === "ur" ? c.timeUrdu || c.time : c.time}
                          </span>
                        </div>
                        <p
                          className="text-xs text-[#2F4A43] font-medium leading-relaxed"
                          style={{
                            fontFamily:
                              lang === "ur"
                                ? "'Noto Nastaliq Urdu', serif"
                                : "inherit",
                          }}
                        >
                          {lang === "ur" ? c.textUrdu || c.text : c.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comment Input Bar (Pinned at bottom for subscribed user) */}
                <div className="flex-shrink-0 p-3 border-t border-[#E8EFEC] bg-[#FFFFFF] flex items-center gap-2 shadow-sm">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddComment(commentsDrawerReel.id);
                      }
                    }}
                    placeholder={
                      lang === "ur"
                        ? "اپنی رائے یا تبصرہ لکھیں..."
                        : "Write a comment..."
                    }
                    className="flex-1 bg-[#F4FAF7] border border-[#D5E2DD] rounded-full px-4 py-2.5 text-xs text-[#183B34] placeholder-[#80918B] outline-none focus:border-[#087F63] focus:bg-white transition-colors"
                    style={{
                      fontFamily:
                        lang === "ur"
                          ? "'Noto Nastaliq Urdu', serif"
                          : "inherit",
                    }}
                  />
                  <button
                    onClick={() => handleAddComment(commentsDrawerReel.id)}
                    className="w-10 h-10 rounded-full bg-[#087F63] text-white font-extrabold flex items-center justify-center shadow-md tap-target flex-shrink-0 text-sm hover:bg-[#065E49] active:scale-95 transition-all"
                    title={lang === "ur" ? "پوسٹ کریں" : "Post comment"}
                  >
                    ➤
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Alias for seamless routing
export const NewsVideosScreen = ZaraiReelsScreen;
