export function TrendBadge({
  trend,
  pct,
  compact,
}: {
  trend: "up" | "down" | "stable";
  pct: number;
  compact?: boolean;
}) {
  const displayPct = Math.abs(pct || 2.4).toFixed(1);
  if (trend === "up")
    return (
      <span
        style={{
          background: "#E4F2EC",
          color: "#087F63",
          border: "1px solid #B8DCCF",
        }}
        className={
          compact
            ? "text-[10px] font-extrabold px-1.5 py-0.5 rounded-full flex-shrink-0 inline-flex items-center gap-0.5"
            : "text-xs font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 inline-flex items-center gap-0.5"
        }
      >
        <span>▲</span>
        <span>+{displayPct}%</span>
      </span>
    );
  if (trend === "down")
    return (
      <span
        style={{
          background: "#FCE8E6",
          color: "#C94A43",
          border: "1px solid #F5C2BE",
        }}
        className={
          compact
            ? "text-[10px] font-extrabold px-1.5 py-0.5 rounded-full flex-shrink-0 inline-flex items-center gap-0.5"
            : "text-xs font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 inline-flex items-center gap-0.5"
        }
      >
        <span>▼</span>
        <span>-{displayPct}%</span>
      </span>
    );
  return (
    <span
      style={{
        background: "#EDF2EF",
        color: "#52635F",
        border: "1px solid #D5E2DD",
      }}
      className={
        compact
          ? "text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
          : "text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
      }
    >
      0.0%
    </span>
  );
}
