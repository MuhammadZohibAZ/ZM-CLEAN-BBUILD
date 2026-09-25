import { SpriteIcon } from "./ProductIcon";
import { RATE_TYPE_URDU } from "../shared/data/rates";
import { type FeedMsg } from "../shared/types";

//  ZM MESSAGE CARD & MODAL

export function ZMMessageCard({ msg }: { msg: FeedMsg }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#F4FAF7",
        border: "1px solid #D5E2DD",
        maxWidth: 340,
      }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ background: "#075E4F" }}
      >
        <SpriteIcon
          spriteKey="herbals"
          size={22}
          style={{ filter: "brightness(0) invert(1)", flexShrink: 0 }}
        />
        <div className="flex-1">
          <p className="text-white text-xs font-bold">
            زرعی منڈی ڈیلی ریٹس سروس
          </p>
          <p className="text-green-200 text-[10px]">
            Zarai Mandi Daily Rates Service
          </p>
        </div>
        <span className="text-green-200 text-[10px] flex-shrink-0">
          {msg.time}
        </span>
      </div>
      <div className="px-4 py-3">
        <div
          className="urdu text-sm mb-3 leading-loose border-b border-[#DCE8E3] pb-2"
          style={{ color: "#17352F", fontSize: 13 }}
        >
          <p>تاریخ : 03-08-2026</p>
          <p>
            اجناس : <strong>{msg.productUrdu}</strong> ({msg.byproduct})
          </p>
          <p>
            مقام : <strong>{msg.stationUrdu}</strong>، ({msg.province})
          </p>
          <p>
            ریٹ : {msg.priceMin.toLocaleString("en-PK")}–
            {msg.priceMax.toLocaleString("en-PK")} روپے / ({msg.unit})
          </p>
          <p>
            آمد : {msg.arrivalCount} {msg.arrivalUnitUrdu}
          </p>
          <p>رنگت : {msg.colorUrdu}</p>
          <p>قیمت کی قسم : {RATE_TYPE_URDU[msg.rateType] || msg.rateType}</p>
        </div>
        <div className="text-xs leading-relaxed" style={{ color: "#183B34" }}>
          <p>
            product : <strong>{msg.product}</strong> · {msg.byproduct}
          </p>
          <p>
            Station : <strong>{msg.station}</strong> ({msg.province})
          </p>
          <p className="font-semibold" style={{ color: "#087F63" }}>
            Rate : Rs {msg.priceMin.toLocaleString()}–
            {msg.priceMax.toLocaleString()} / {msg.unit}
          </p>
          <p>
            Arrival : {msg.arrivalCount} {msg.arrivalUnit} · {msg.rateType}
          </p>
          <p>
            Color : {msg.color} · {msg.spec} · {msg.quality}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ZMMessageModal({
  msg,
  onClose,
}: {
  msg: FeedMsg;
  onClose: () => void;
}) {
  return (
    <div className="zm-sheet-overlay" style={{ zIndex: 300 }} onClick={onClose}>
      <div className="zm-sheet" onClick={(e) => e.stopPropagation()}>
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ background: "#075E4F" }}
        >
          <div>
            <p className="text-white font-bold">ZM Rate Report</p>
            <p className="text-green-200 text-xs">
              {msg.product} · {msg.byproduct} · {msg.station}
            </p>
          </div>
          <button
            onClick={onClose}
            className="tap-target text-white text-xl w-10 h-10 flex items-center justify-center"
          ></button>
        </div>
        <div
          className="overflow-y-auto"
          style={{ maxHeight: "78vh", background: "#e5ddd5" }}
        >
          <div className="p-4">
            <ZMMessageCard msg={msg} />
          </div>
        </div>
      </div>
    </div>
  );
}
