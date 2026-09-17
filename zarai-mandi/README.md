# Zarai Mandi App (cleaned build)

This is a pruned copy of the Zarai Mandi project (source: `Rayyan-624/ZM_Revamping`,
folder `FULL APP/` + `urdu-tts-backend/`), keeping only the files actually loaded
when the app runs.

## Structure

- `app/` — the React + Vite frontend (was `FULL APP/`). Entry point:
  `src/main.tsx` → `src/App.tsx` → `src/OnboardingFlow.tsx` / `src/CustomerFaceApp.tsx`.
  Commodity price data is fetched live from `api/` via `src/lib/api.ts`
  (`VITE_MARKET_API_URL`, default `http://localhost:8090`).
- `api/` — the Postgres-backed market data REST API (Node/Express). Loads
  the real 40,959-record commodity price export and the 468-entry
  customer-facing catalog, and implements the Avg Min/Max, arrival and
  special-attribute aggregation rules from
  `docs/Zarai_Mandi_Mandatory_Optional_Attributes_and_Card_Policy.pdf`.
  See `api/README.md` for setup, schema, and the full endpoint reference.
- `backend/` — the Urdu neural TTS FastAPI service (was `urdu-tts-backend/`),
  called by `app/src/components/VoiceAssistant.tsx` at `/api/tts`.
- `data/` — the source commodity price workbook
  (`All Commodity Prices - 15-Aug-2026 to 14-Sept-2026.xlsx`, sheet 2 has
  **40,966** data rows) and `mandis.json` (structured mandi list, not yet
  wired into the map view).
- `docs/` — the policy/spec PDFs `api/` implements:
  `Zarai_Mandi_Mandatory_Optional_Attributes_and_Card_Policy.pdf`,
  `Zarai_Mandi_Leadership_Card_Evidence_5_Pages.pdf` (the 468-entry
  catalog source), `Verticals Fields sheet - Verticals.pdf`,
  `ZM_latest_colors.pdf`.

## Running it

```bash
npm install          # installs the root orchestrator (concurrently)
npm run dev           # runs TTS backend (:8000) + market API (:8090) + frontend (:8445) together
```

The market API needs Postgres set up once first -- see `api/README.md`
("Setup") for creating the database and loading the data; `npm run dev`
only starts the already-configured `api/` server, it doesn't provision
Postgres for you.

Or run each piece on its own:

```bash
cd app && npm install && npm run dev      # frontend only (:8445)
cd api && npm install && npm start        # market API only (:8090), after api/README.md's Setup
```

## What was removed from the original project

Traced the real dependency graph from `main.tsx` (static imports, the
`react-native-responsive-screen` → `src/responsive.ts` Vite alias, and the
dynamic `/src/icons/...` runtime paths used by `CustomerFaceApp.tsx`'s
`PRODUCTS_PATH` / `BYPRODUCTS_PATH` icon maps) and dropped everything not
reachable from it:

- `dist/` — stale build output (regenerate with `npm run build`, not source).
- `src/demos/` and the duplicate `src/components/ui/{ExpandableMandiMapCard,
  VoiceAssistant,ZaraiMandiMap,expand-map}.tsx` — superseded copies; the real
  ones used by the app live directly under `src/components/`.
- `src/imports/pasted_text/*.md`, `data_hierarch_V1.html`, `template.html`,
  coordinate JSONs, wireframe/screenshot PNGs, and ~35 one-off `image-N.png`
  files — Figma Make design-chat scratch files, never imported by the app.
- Duplicate/unused image variants in `src/assets/`, `public/assets/
  backgrounds/`, and `public/videos/` (the app imports the `src/videos/*.mp4`
  copies, not the `public/videos/` ones; `bg_pakistan.png` vs `.jpg`, etc.).
- `src/icons/products/` and `src/icons/by-products/` were kept **in full** —
  they look unused by static analysis (referenced only via runtime string
  paths, not `import` statements) but are in fact wired up through the
  `PRODUCTS_PATH`/`BYPRODUCTS_PATH` lookup tables in `CustomerFaceApp.tsx`.
- Reference PDFs/xlsx that lived inside `src/` (not imported by any code)
  were moved to `docs/` and `data/` instead of being deleted, since they're
  the spec for the next phase (Postgres schema + data import).

Verified by running `npm run build` and `npm run dev` against this pruned
tree and confirming both the static imports and the `/src/icons/...` runtime
paths resolve (HTTP 200), so no runtime asset was cut.

## Phase 2: real data

`app/src/data/realCommodityData.ts`'s bundled mock timeline/mandi-row
constants are being replaced screen by screen with live calls to `api/`.
Wired so far (verified in-browser, screenshots taken against the running
app):

- The by-product card grid (`ByProductCombinedScreen` /
  `ByProductNationalCard`) — Avg Min/Max, arrival, markets, special
  attribute (including the Maize moisture D-rule bands), and the
  "No Data Available" overlay for catalog entries with zero records this
  month.
- The by-product detail screen (`ProductRatesScreen`)'s Overview tab —
  every real mandi row, grouped/filterable exactly as before.
- The by-product detail screen's Trends tab — both the Price Trend and
  Arrival Trend charts, for every observed price type, with real
  reporting gaps carried forward rather than shown as a fake price crash
  to zero.

Not yet wired (still on the old bundled mock data): `AnalyticsScreen`,
`LiveMarketScreen`, and the per-mandi-row inline expand graph inside
`ProductRatesScreen`'s table (`getRealMandiInlineGraphData`). `getExcelTimeline`,
`getRowsForProducts` and `calculateByproductSummary` are left in place
(unused by the two screens above, but still called from those
not-yet-wired screens) rather than deleted, to avoid widening this pass.
