// Themed loading screen for the mandi map. Kept tiny (no MapLibre, no
// geodata) because it also shows while the map's code is downloading.
// Pakistan's outline draws itself, mandi pins pop in, then the map fades in.

const PK_PATH =
  "M170.3 0.0 L162.2 3.5 L159.7 2.1 L145.0 3.1 L140.0 4.6 L138.0 6.9 L134.6 8.1 L134.6 9.6 L132.5 8.5 L131.8 10.6 L127.1 14.7 L129.4 16.0 L131.4 19.2 L130.8 20.6 L132.8 23.3 L131.3 25.2 L133.0 26.7 L124.8 36.2 L126.8 38.7 L125.7 43.0 L118.4 44.7 L111.2 43.3 L110.6 45.0 L112.4 47.7 L114.1 47.8 L114.5 50.8 L116.4 53.4 L112.6 56.2 L107.2 56.7 L106.2 57.9 L106.8 59.9 L104.8 61.4 L105.6 63.0 L103.0 65.9 L104.1 73.5 L98.9 78.2 L94.8 74.8 L93.1 75.8 L94.4 76.5 L89.8 74.8 L87.5 77.5 L82.4 79.3 L83.3 81.1 L85.1 81.0 L84.9 82.1 L78.8 83.9 L74.9 82.3 L72.1 83.7 L70.2 87.1 L67.9 87.6 L66.5 92.9 L67.6 95.0 L65.9 100.0 L67.7 101.4 L66.2 103.2 L51.6 107.7 L45.2 106.9 L40.7 108.4 L39.9 109.9 L33.3 108.4 L19.7 109.7 L0.0 103.0 L6.0 109.9 L7.5 115.0 L12.8 121.5 L18.7 123.4 L21.2 126.0 L23.6 125.6 L24.3 137.3 L23.4 140.3 L28.6 140.2 L30.3 142.2 L29.3 142.6 L28.6 148.9 L19.4 150.1 L17.6 150.9 L16.5 154.3 L14.3 153.4 L12.6 154.4 L11.6 158.6 L12.5 159.8 L9.8 163.2 L9.2 169.9 L11.5 169.7 L10.5 172.0 L15.0 171.0 L14.6 169.9 L15.9 169.3 L18.5 171.1 L18.2 169.9 L20.5 168.6 L32.3 169.5 L31.7 167.9 L34.5 166.8 L39.2 167.7 L37.5 166.5 L38.5 165.4 L41.3 165.8 L39.4 166.9 L39.7 167.8 L45.4 168.7 L45.8 170.2 L47.6 167.9 L66.6 165.8 L69.5 166.7 L69.5 165.4 L67.4 164.7 L64.2 165.9 L67.7 163.5 L69.9 164.7 L69.8 167.2 L72.3 169.8 L71.3 174.9 L75.2 175.5 L73.7 174.4 L75.1 174.3 L76.4 176.1 L76.6 175.0 L82.7 176.1 L81.1 176.9 L81.2 179.0 L80.2 178.7 L83.0 181.7 L81.0 184.7 L82.7 185.0 L81.4 186.2 L84.2 186.1 L85.0 184.0 L86.3 183.6 L86.4 184.8 L87.3 183.2 L87.8 185.1 L90.4 183.3 L91.0 185.6 L92.5 184.1 L93.1 185.0 L96.3 181.1 L99.9 183.1 L107.4 182.5 L109.5 184.3 L112.7 184.3 L113.8 182.3 L120.5 179.8 L119.4 181.8 L120.5 183.3 L126.2 181.0 L124.6 179.9 L124.4 178.0 L125.9 176.9 L123.3 170.3 L120.6 166.8 L120.5 162.4 L115.7 162.2 L113.6 159.0 L114.5 150.3 L111.0 150.1 L106.3 147.5 L107.3 141.3 L116.9 129.4 L119.6 129.5 L121.4 133.3 L123.1 133.8 L135.7 130.2 L141.8 118.6 L148.6 114.9 L152.8 107.1 L154.2 101.8 L161.3 98.2 L160.1 95.9 L160.8 94.4 L166.9 87.6 L170.2 85.6 L167.9 84.8 L168.4 81.5 L169.7 80.7 L167.4 76.4 L169.0 74.1 L172.4 71.7 L176.8 71.2 L178.6 69.2 L174.9 65.6 L170.1 65.5 L170.3 60.4 L169.4 61.7 L167.2 61.3 L165.6 57.7 L161.8 55.3 L163.9 51.7 L161.1 47.8 L164.8 44.2 L163.1 43.1 L160.6 43.7 L161.3 40.1 L158.5 39.0 L161.0 34.3 L166.2 32.4 L183.1 36.5 L192.0 32.5 L194.6 33.0 L195.4 30.6 L198.5 30.5 L200.0 28.7 L198.4 24.5 L195.6 22.2 L195.8 20.2 L193.4 18.5 L193.4 16.5 L188.3 17.9 L187.5 15.1 L185.7 14.6 L185.4 13.4 L187.0 12.1 L186.6 9.5 L184.5 5.7 L181.8 4.3 L179.5 5.0 L178.8 1.7 L175.6 0.6 L172.7 2.0 L171.9 0.2 L170.3 0.0 Z";

// A few well-known mandis, projected like the outline (200×186 drawing space).
const PINS: [number, number][] = [
  [166, 79], // Lahore
  [150, 81], // Faisalabad
  [130, 98], // Multan
  [133, 110], // Bahawalpur
  [98, 134], // Sukkur
  [75, 175], // Karachi
  [75, 99], // Quetta
  [132, 44], // Peshawar
];

export default function MapLoader({ title, subtitle, lang = "en" }: { title?: string; subtitle?: string; lang?: "en" | "ur" }) {
  const isUr = lang === "ur";
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(180deg, #EAF6F0 0%, #F4FAF7 55%, #EEF7F2 100%)", zIndex: 20 }}
    >
      <style>{LOADER_CSS}</style>
      <svg viewBox="-6 -6 212 198" width="190" height="178" aria-hidden>
        <path d={PK_PATH} className="zm-mapload-fill" />
        <path d={PK_PATH} className="zm-mapload-line" pathLength={1} />
        {PINS.map(([x, y], i) => (
          <g key={i} className="zm-mapload-pin" style={{ animationDelay: `${0.9 + i * 0.18}s` }}>
            <circle cx={x} cy={y} r={7} fill="#0B5E4A" opacity={0.18} />
            <circle cx={x} cy={y} r={3.6} fill="#0B5E4A" stroke="#FFFFFF" strokeWidth={1.5} />
          </g>
        ))}
      </svg>
      <p style={{ marginTop: 18, fontSize: isUr ? 18 : 16, fontWeight: 800, color: "#143B33" }}>
        {title ?? (isUr ? "نقشہ لوڈ ہو رہا ہے" : "Loading map")}
      </p>
      <p style={{ marginTop: 4, fontSize: isUr ? 13 : 12.5, fontWeight: 600, color: "#52635F" }}>
        {subtitle ?? (isUr ? "منڈیاں اور سرحدیں تیار ہو رہی ہیں" : "Placing mandis and borders")}
      </p>
      <div className="zm-mapload-bar" aria-hidden>
        <span />
      </div>
    </div>
  );
}

const LOADER_CSS = `
.zm-mapload-fill { fill: #0B5E4A; opacity: 0.06; }
.zm-mapload-line { fill: none; stroke: #0B5E4A; stroke-width: 2; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 1; animation: zmMapDraw 1.6s ease-in-out forwards; }
.zm-mapload-pin { opacity: 0; transform-box: fill-box; transform-origin: center; animation: zmMapPin 0.45s cubic-bezier(.34,1.56,.64,1) forwards; }
.zm-mapload-bar { margin-top: 16px; width: 132px; height: 4px; border-radius: 4px; background: #D5E7DF; overflow: hidden; }
.zm-mapload-bar span { display: block; width: 40%; height: 100%; border-radius: 4px; background: #0B5E4A; animation: zmMapBar 1.1s ease-in-out infinite; }
@keyframes zmMapDraw { to { stroke-dashoffset: 0; } }
@keyframes zmMapPin { from { opacity: 0; transform: scale(0.2); } to { opacity: 1; transform: scale(1); } }
@keyframes zmMapBar { 0% { transform: translateX(-110%); } 100% { transform: translateX(260%); } }
@media (prefers-reduced-motion: reduce) {
  .zm-mapload-line { animation: none; stroke-dashoffset: 0; }
  .zm-mapload-pin { animation: none; opacity: 1; }
  .zm-mapload-bar span { animation: none; }
}
`;
