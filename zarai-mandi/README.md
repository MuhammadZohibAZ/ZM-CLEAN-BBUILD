# Zarai Mandi App

Commodity prices from Pakistan's mandis, in Urdu and English, with an Urdu voice.

## Structure

- `app/` — the React + Vite website. Entry point: `src/main.tsx` →
  `src/App.tsx` → `src/OnboardingFlow.tsx` / `src/CustomerFaceApp.tsx`.
  Prices, trends and maps come from `api/` via `src/lib/api.ts`
  (`VITE_MARKET_API_URL`, default `http://localhost:8090`). See `app/CODEMAP.md`.
- `api/` — the market data REST API (Node/Express on SQLite,
  `db/zarai_mandi.sqlite`): Avg Min/Max, arrival and special-attribute rules from
  `docs/Zarai_Mandi_Mandatory_Optional_Attributes_and_Card_Policy.pdf`.
  See `api/README.md` for loading data and the endpoint reference.
- `tts/` — makes the Urdu voice pack (Uzma's voice) the app speaks from; see
  "Urdu voice" below.
- `data/` — source spreadsheets for `api/db/etl_sqlite.py`: a year of prices
  (`prices_2025-09-23_to_2026-09-23 (1).xlsx`, prepared by
  `prepare_year_prices.py`), fertilizer brands (`Fast uni.xlsx`) and the
  verticals sheet behind `sync_special_attributes.py`.
- `docs/` — the card policy, verticals field sheet and brand colours.
- `scripts/deploy.mjs` — the checked deploy to Vercel (`DEPLOY.md`).

## Running it

```bash
npm install          # installs the orchestrator (concurrently)
npm run dev          # market API (:8090) + website (:8445) together
```

Or one at a time:

```bash
cd api && npm install && npm start      # market API (:8090)
cd app && npm install && npm run dev    # website (:8445)
```

## Urdu voice

The app speaks Urdu from pre-made clips in `app/public/voice_pack/` (MP3s plus
`manifest.json`), played in the browser by `app/src/lib/voicePack.ts`, so the
voice works anywhere the site is hosted. A sentence is spoken with the fewest
clips that cover it (whole phrases where they exist, single words and number
words otherwise); text the pack can't fully say falls back to the device's own
voice. `app/src/lib/urduText.ts` and `tts/urdu_text.py` hold the same text rules
and must stay in step.

Adding or updating speech (needs `pip install edge-tts soundfile numpy`):

```bash
node tts/extract_phrases.mjs > tts/phrases.json   # after adding Urdu text to the app
python tts/generate_pack_edge.py                  # makes only the missing clips
python tts/generate_pack_edge.py --only "نیا جملہ" # add or redo one phrase
```

Then commit and deploy (`npm run deploy`, see `DEPLOY.md`).

## Still on bundled sample data

`app/src/data/realCommodityData.ts` (13 MB) is the old one-month sample
dataset. Most screens use the live API, but these still read it: the
favourites carousel on the alternative home screen (`calculateByproductSummary`),
the market feed sheet (`FEED_MESSAGES`), and the by-product list helpers in
`shared/data/byproductCards.ts`. Moving them to the API would let the file go.
