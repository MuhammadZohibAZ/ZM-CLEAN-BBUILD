import { useRef, useEffect } from "react";

import { type ZaraiReel } from "../shared/data/reels";
import { useLang } from "../shared/i18n/LangProvider";

export function FloatingMiniPlayer({
  video,
  onExpand,
  onClose,
  onTogglePlay,
}: {
  video: { reel: ZaraiReel; isPlaying: boolean; isMuted: boolean };
  onExpand: () => void;
  onClose: () => void;
  onTogglePlay: () => void;
}) {
  const { lang } = useLang();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = video.isMuted;
    if (video.isPlaying) {
      videoRef.current.play().catch(() => { });
    } else {
      videoRef.current.pause();
    }
  }, [video.isPlaying, video.isMuted]);

  return (
    <div
      onClick={onExpand}
      className="absolute bottom-[66px] right-3 z-40 w-44 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/25 bg-black cursor-pointer group animate-in fade-in zoom-in-95 duration-200"
      style={{
        boxShadow: "0 10px 30px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.15)",
      }}
    >
      <video
        ref={videoRef}
        src={video.reel.videoPath}
        playsInline
        loop
        className="w-full h-full object-cover"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none" />

      {/* Top action bar: Close button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 backdrop-blur-md text-white flex items-center justify-center border border-white/25 text-[11px] font-black hover:bg-black/90 active:scale-95 transition shadow tap-target"
        title={lang === "ur" ? "بند کریں" : "Close mini player"}
      >
        ✕
      </button>

      {/* Center play / pause overlay button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/65 backdrop-blur-md text-white flex items-center justify-center border border-white/25 shadow-lg active:scale-90 transition hover:bg-black/85 tap-target"
      >
        {video.isPlaying ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>

      {/* Bottom title & author ticker */}
      <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between text-left pointer-events-none">
        <div className="truncate pr-1">
          <p className="text-[10px] font-black text-white truncate drop-shadow">
            {lang === "ur" ? video.reel.titleUrdu : video.reel.title}
          </p>
          <p className="text-[8.5px] text-[#32BA46] font-extrabold truncate">
            {lang === "ur" ? video.reel.authorUrdu : video.reel.author}
          </p>
        </div>
      </div>
    </div>
  );
}
