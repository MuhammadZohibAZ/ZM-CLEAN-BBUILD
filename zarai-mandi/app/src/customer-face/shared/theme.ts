export const ZM_THEME_CSS = `
  /* 4-Sided Clockwise Racetrack Frame Animations */
  @keyframes marqueeClockwiseL2R {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0%); }
  }
  @keyframes marqueeClockwiseR2L {
    0% { transform: translateX(0%); }
    100% { transform: translateX(-50%); }
  }
  .racetrack-track-l2r {
    display: flex;
    white-space: nowrap;
    width: max-content;
    animation: marqueeClockwiseL2R 50s linear infinite;
  }
  .racetrack-track-r2l {
    display: flex;
    white-space: nowrap;
    width: max-content;
    animation: marqueeClockwiseR2L 50s linear infinite;
  }
  @font-face {
    font-family: 'Jameel Noori Nastaleeq';
    src: url('/fonts/JameelNooriNastaleeq.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
  /* Explicitly Visible Scrollbars for Horizontal & Vertical Table Navigation */
  .zm-table-scroll-container {
    scrollbar-width: thin !important;
    scrollbar-color: #087F63 #E4F2EC !important;
    -webkit-overflow-scrolling: touch;
    overflow-x: auto !important;
    overflow-y: auto !important;
  }
  .zm-table-scroll-container::-webkit-scrollbar {
    width: 7px !important;
    height: 7px !important;
    display: block !important;
    -webkit-appearance: none !important;
  }
  .zm-table-scroll-container::-webkit-scrollbar-track {
    background: #EAF5F0 !important;
    border-radius: 6px !important;
    border: 1px solid #D5E2DD !important;
  }
  .zm-table-scroll-container::-webkit-scrollbar-thumb {
    background: #087F63 !important;
    border-radius: 6px !important;
    border: 1px solid #055C48 !important;
  }
  .zm-table-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #064D40 !important;
  }
  .zm-table-scroll-container::-webkit-scrollbar-corner {
    background: #EAF5F0 !important;
  }
  :root {
    --zm-deep: #064D40;
    --zm-primary: #087F63;
    --zm-teal: #0B7F70;
    --zm-bright: #2FAE68;
    --zm-mint: #E4F2EC;
    --zm-surface: #F1F7F4;
    --zm-card: #F4FAF7;
    --zm-border: #D5E2DD;
    --zm-muted: #52635F;
  }
  * { -webkit-tap-highlight-color: transparent; }
  body { background: #E8F2EE; color: #183B34; }
  input, select, textarea { color: #183B34; }
  input::placeholder { color: #80918B; }
  .urdu, [dir="rtl"], .lang-ur {
    font-family: 'Noto Sans Arabic', 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', sans-serif !important;
  }
  [dir="rtl"] {
    text-align: right;
  }
  [dir="rtl"] * {
    letter-spacing: 0 !important;
  }
  [dir="rtl"] p, [dir="rtl"] span, [dir="rtl"] button {
    line-height: 1.45;
  }
  @property --beam-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes zmAngleSpin {
    to {
      --beam-angle: 360deg;
    }
  }
  .zm-beam-border {
    position: relative;
    isolation: isolate;
  }
  .zm-beam-border::after {
    content: "";
    position: absolute;
    inset: -1.5px;
    border-radius: inherit;
    padding: 1.5px;
    background: conic-gradient(
      from var(--beam-angle, 0deg) at 50% 50%,
      transparent 0deg,
      transparent 255deg,
      rgba(16, 185, 129, 0.25) 285deg,
      rgba(52, 211, 153, 0.95) 330deg,
      rgba(16, 185, 129, 1) 360deg
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    animation: zmAngleSpin 4s linear infinite;
    pointer-events: none;
    z-index: 3;
  }
  .zm-beam-border-white::after {
    background: conic-gradient(
      from var(--beam-angle, 0deg) at 50% 50%,
      transparent 0deg,
      transparent 255deg,
      rgba(255, 255, 255, 0.2) 285deg,
      rgba(255, 255, 255, 0.9) 330deg,
      rgba(255, 255, 255, 1) 360deg
    );
    animation: zmAngleSpin 4.5s linear infinite;
  }
  .zm-beam-border-pink::after {
    background: conic-gradient(
      from var(--beam-angle, 0deg) at 50% 50%,
      transparent 0deg,
      transparent 250deg,
      rgba(251, 113, 133, 0.3) 280deg,
      rgba(244, 63, 94, 0.95) 330deg,
      rgba(225, 29, 72, 1) 360deg
    ) !important;
    animation: zmAngleSpin 4s linear infinite;
  }
  .zm-beam-border-green::after {
    background: conic-gradient(
      from var(--beam-angle, 0deg) at 50% 50%,
      transparent 0deg,
      transparent 255deg,
      rgba(16, 185, 129, 0.25) 285deg,
      rgba(52, 211, 153, 0.95) 330deg,
      rgba(16, 185, 129, 1) 360deg
    ) !important;
    animation: zmAngleSpin 4s linear infinite;
  }
  .zm-beam-border-card::after {
    padding: 2px;
    inset: -2px;
    background: conic-gradient(
      from var(--beam-angle, 0deg) at 50% 50%,
      transparent 0deg,
      transparent 260deg,
      rgba(16, 185, 129, 0.3) 290deg,
      rgba(245, 158, 11, 0.9) 330deg,
      rgba(16, 185, 129, 1) 360deg
    );
    animation: zmAngleSpin 5.5s linear infinite;
  }
  /* Search: sky blue */
  .zm-beam-border-search::after {
    background: conic-gradient(
      from var(--beam-angle, 0deg) at 50% 50%,
      transparent 0deg,
      transparent 250deg,
      rgba(56, 189, 248, 0.3) 285deg,
      rgba(14, 165, 233, 0.95) 330deg,
      rgba(2, 132, 199, 1) 360deg
    ) !important;
    animation: zmAngleSpin 3.5s linear infinite;
  }
  /* Complete Your Profile: amber / gold (attention, progress) */
  .zm-beam-border-gold::after {
    padding: 2px;
    inset: -2px;
    background: conic-gradient(
      from var(--beam-angle, 0deg) at 50% 50%,
      transparent 0deg,
      transparent 240deg,
      rgba(251, 191, 36, 0.35) 280deg,
      rgba(245, 158, 11, 0.95) 330deg,
      rgba(217, 119, 6, 1) 360deg
    ) !important;
    animation: zmAngleSpin 3s linear infinite;
  }
  /* Product circles: a thicker white beam with a faint green edge so it
     reads on the light background. */
  .zm-beam-border-white-strong::after {
    padding: 2.5px;
    inset: -2.5px;
    background: conic-gradient(
      from var(--beam-angle, 0deg) at 50% 50%,
      transparent 0deg,
      transparent 220deg,
      rgba(255, 255, 255, 0.4) 270deg,
      rgba(255, 255, 255, 0.95) 325deg,
      rgba(255, 255, 255, 1) 360deg
    ) !important;
    filter: drop-shadow(0 0 1.5px rgba(8, 127, 99, 0.55));
    animation: zmAngleSpin 3.2s linear infinite;
  }

  /* Complete Your Profile: gentle motion without moving the row */
  @keyframes zmShimmer {
    from { transform: translateX(-120%); }
    to { transform: translateX(260%); }
  }
  @keyframes zmRingGlow {
    0%, 100% { filter: drop-shadow(0 0 0 rgba(245, 158, 11, 0)); }
    50% { filter: drop-shadow(0 0 5px rgba(245, 158, 11, 0.55)); }
  }
  @keyframes zmLeafSway {
    0%, 100% { transform: rotate(-8deg); }
    50% { transform: rotate(8deg); }
  }
  @keyframes zmNudge {
    0%, 60%, 100% { transform: translateX(0); }
    30% { transform: translateX(4px); }
  }
  .zm-shimmer { position: relative; overflow: hidden; }
  .zm-shimmer::after {
    content: "";
    position: absolute;
    inset: 0;
    width: 40%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent);
    animation: zmShimmer 2.2s ease-in-out infinite;
  }
  .zm-ring-glow { animation: zmRingGlow 2.4s ease-in-out infinite; }
  .zm-leaf-sway { animation: zmLeafSway 3s ease-in-out infinite; transform-origin: 50% 90%; }
  .zm-nudge { animation: zmNudge 1.8s ease-in-out infinite; }
  @keyframes zmNudgeRtl {
    0%, 60%, 100% { transform: translateX(0); }
    30% { transform: translateX(-4px); }
  }
  [dir="rtl"] .zm-nudge { animation-name: zmNudgeRtl; }
  /* Complete Your Profile prompt: a ping from the step ring, a popping "!"
     and a short nudge every few seconds. */
  @keyframes zmPing {
    0% { transform: scale(1); opacity: 0.75; }
    70%, 100% { transform: scale(1.75); opacity: 0; }
  }
  @keyframes zmWiggle {
    0%, 78%, 100% { transform: rotate(0deg); }
    81% { transform: rotate(-3deg); }
    84% { transform: rotate(3deg); }
    87% { transform: rotate(-2deg); }
    90% { transform: rotate(2deg); }
    93% { transform: rotate(0deg); }
  }
  @keyframes zmBadgePop {
    0%, 70%, 100% { transform: scale(1); }
    78% { transform: scale(1.3); }
    86% { transform: scale(0.95); }
  }
  .zm-ping { animation: zmPing 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
  .zm-attention-wiggle { animation: zmWiggle 5s ease-in-out infinite; transform-origin: 50% 50%; }
  .zm-badge-pop { animation: zmBadgePop 2.5s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .zm-shimmer::after, .zm-ring-glow, .zm-leaf-sway, .zm-nudge, .zm-ping, .zm-attention-wiggle, .zm-badge-pop { animation: none; }
  }

  [dir="rtl"] .ltr-only {
    direction: ltr;
    text-align: left;
  }
  .zm-landscape-expanded-table {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    width: 100dvw !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    z-index: 99999 !important;
    background: #F4FAF7 !important;
    border-radius: 0 !important;
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.4) !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  }
  @media screen and (orientation: portrait) and (max-width: 820px) {
    .zm-landscape-expanded-table.zm-force-landscape {
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      width: 100dvh !important;
      height: 100dvw !important;
      max-width: 100dvh !important;
      max-height: 100dvw !important;
      transform: translate(-50%, -50%) rotate(90deg) !important;
      transform-origin: center center !important;
      z-index: 99999 !important;
      border-radius: 0 !important;
    }
  }
`;
