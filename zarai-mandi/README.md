# Zarai Mandi App (cleaned build)

This is a pruned copy of the Zarai Mandi project (source: `Rayyan-624/ZM_Revamping`,
folder `FULL APP/` + `urdu-tts-backend/`), keeping only the files actually loaded
when the app runs.

## Structure

- `app/` — the React + Vite frontend (was `FULL APP/`). Entry point:
  `src/main.tsx` → `src/App.tsx` → `src/OnboardingFlow.tsx` / `src/CustomerFaceApp.tsx`.
- `backend/` — the Urdu neural TTS FastAPI service (was `urdu-tts-backend/`),
  called by `app/src/components/VoiceAssistant.tsx` at `/api/tts`.
- `data/` — reference data for the upcoming PostgreSQL backend:
  - `All Commodity Prices - 15-Aug-2026 to 14-Sept-2026.xlsx` — the commodity
    price sheet (sheet 2 has **40,966** data rows) that will be imported into
    Postgres to back the live-market screens.
  - `mandis.json` — structured list of mandis (name/province/district/type)
    for seeding a mandis table / the map view.
- `docs/` — PDFs used as the schema/design reference for the data model:
  `Verticals Fields sheet - Verticals.pdf`,
  `Zarai_Mandi_Mandatory_Optional_Attributes_and_Card_Policy.pdf`,
  `ZM_latest_colors.pdf`.

## Running it

```bash
npm install          # installs the root orchestrator (concurrently)
npm run dev           # runs backend (FastAPI, :8000) + frontend (Vite, :8445) together
```

Or just the frontend:

```bash
cd app
npm install
npm run dev
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
