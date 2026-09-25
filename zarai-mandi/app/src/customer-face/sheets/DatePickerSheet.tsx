//  DATE PICKER SHEET

export function DatePickerSheet({
  selected,
  onSelect,
  onClose,
}: {
  selected: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const fmt2 = (d: Date) =>
    d.toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const quick = ["Today", "Yesterday"];

  return (
    <div className="zm-sheet-overlay" style={{ zIndex: 200 }} onClick={onClose}>
      <div
        className="zm-sheet"
        style={{ background: "#F4FAF7", maxHeight: "60vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-3 border-b border-[#DCE8E3]">
          <div
            className="w-10 h-1 rounded-full mx-auto mb-3"
            style={{ background: "#C7D6D0" }}
          />
          <p className="font-bold text-lg">Select Date</p>
          <p className="text-xs" style={{ color: "#52635F" }}>
            Choose the date for price data
          </p>
        </div>
        <div className="p-4 flex flex-col gap-2">
          {quick.map((label) => (
            <button
              key={label}
              onClick={() => onSelect(label)}
              className="tap-target rounded-2xl px-4 flex items-center gap-3"
              style={{
                background: selected === label ? "#E4F2EC" : "#F1F7F4",
                border:
                  selected === label
                    ? "2px solid #087F63"
                    : "1px solid #D5E2DD",
                minHeight: 52,
              }}
            >
              <span style={{ fontSize: 20 }}></span>
              <span
                className="flex-1 text-left font-bold text-sm"
                style={{ color: selected === label ? "#075E4F" : "#183B34" }}
              >
                {label}
              </span>
              {selected === label && (
                <span style={{ color: "#087F63", fontWeight: 800 }}></span>
              )}
            </button>
          ))}
          <button
            onClick={() => {
              const d = prompt("Enter date (DD/MM/YYYY)");
              if (d) onSelect(d);
            }}
            className="tap-target rounded-2xl px-4 flex items-center gap-3"
            style={{
              background: "#F1F7F4",
              border: "1px solid #D5E2DD",
              minHeight: 52,
            }}
          >
            <span style={{ fontSize: 20 }}></span>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm">Select Date</p>
              <p className="text-xs" style={{ color: "#52635F" }}>
                Pick a specific date
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
