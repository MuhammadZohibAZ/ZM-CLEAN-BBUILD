// Clean Bell Icon with notification badge
export function BellIconSVG({
  size = 20,
  color = "#fff",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// Clean Lock Icon
export function LockIconSVG({
  size = 18,
  color = "#4A6258",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1.5" fill={color} />
    </svg>
  );
}

// Clean Voice Off / Voice On Badge Icon
export function VoiceBadgeIconSVG({
  active = false,
  size = 14,
}: {
  active?: boolean;
  size?: number;
}) {
  return (
    <span
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: active ? "#2FAE68" : "#E24D44",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {active ? (
        <svg
          width={size - 4}
          height={size - 4}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
        </svg>
      ) : (
        <svg
          width={size - 4}
          height={size - 4}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a6.97 6.97 0 0 1-.7 3" />
          <line x1="12" y1="19" x2="12" y2="23" />
        </svg>
      )}
    </span>
  );
}

// Clean Pin Icon
export function PinIconSVG({
  size = 13,
  color = "#85E2B8",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size + 3}
      viewBox="0 0 10 13"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M5 0C2.794 0 1 1.794 1 4c0 3 4 9 4 9s4-6 4-9c0-2.206-1.794-4-4-4z"
        fill={color}
      />
      <circle cx="5" cy="4" r="1.5" fill="rgba(255,255,255,0.85)" />
    </svg>
  );
}

// VOICE ASSISTANT SYSTEM

export function MicSVG({
  size = 24,
  color = "#fff",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="11" rx="3" fill={color} />
      <path
        d="M5 11a7 7 0 0014 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <line
        x1="12"
        y1="18"
        x2="12"
        y2="22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="22"
        x2="16"
        y2="22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
