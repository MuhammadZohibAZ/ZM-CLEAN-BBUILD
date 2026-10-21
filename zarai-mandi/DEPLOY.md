# Deploying Zarai Mandi on Vercel

Two Vercel projects in the **final-yappers** team:

| Project | Folder | Live URL |
|---|---|---|
| `zarai-mandi-app` (the website) | `zarai-mandi/app` | https://zarai-mandi-app.vercel.app |
| `zarai-mandi-api` (rates, trends, map data) | `zarai-mandi/api` | https://zarai-mandi-api.vercel.app (`/api/health`) |

The app reads the API address from the `VITE_MARKET_API_URL` environment
variable (set on `zarai-mandi-app` for Production, Preview and Development).
Without it the app calls `http://localhost:8090`, which on a phone is the phone
itself, so every card, trend and map would be empty.

## Deploying changes (one command)

From `zarai-mandi/`:

```bash
npm run deploy           # check → deploy API if it changed → deploy app → test live
npm run deploy:check     # only the checks, nothing deployed
npm run deploy -- --api  # force an API redeploy
```

(`npm run deploy` inside `app/` or `api/` runs the same thing.)

`scripts/deploy.mjs` deploys **nothing** unless every check passes, so a broken
change never reaches the live site:

1. the app type-checks (`tsc`) and builds (`vite build`, icons copied);
2. the API, started locally on the current database, returns data for the
   endpoints the app uses (health, dataset, verticals, Wheat / Rice /
   Fertilizer cards);
3. the API is redeployed whenever its code, database or config changed since
   the last deploy (so the app and API never drift apart), then tested live;
4. the app is deployed and the live site is checked (built with the API
   address, icons served, live API answering).

A Vercel "unexpected internal error" is retried automatically. The Vercel CLI
must be logged in to the account that owns final-yappers; each folder is linked
to its project (`.vercel/`, not committed). Push to GitHub as usual as well.

## How the API runs on Vercel

- `api/api/index.js` is the only function; `api/vercel.json` sends every path to
  it and bundles `db/zarai_mandi.sqlite` and `db/specialAttributes.json`.
- On a cold start the ~91 MB database is copied to `/tmp` (SQLite needs a
  writable folder), so the first request after a quiet period is slower.
- Node 24 (`node:sqlite`), see `api/package.json`.
- `api/.vercelignore` keeps the upload to the code + live database.
- `db/specialAttributes.json` is a copy of
  `app/src/customer-face/shared/data/specialAttributes.json` (the app's copy is
  the source). `npm run deploy` refreshes it; locally the API reads the app's copy.

## How the app is built

- Icons are referenced by path (`/src/icons/...`). The build copies
  `src/icons` into `dist/src/icons` (`copySrcIcons` in `vite.config.ts`) so the
  images also load on Vercel, not only in `npm run dev`.

## Updating the data

```bash
cd zarai-mandi/api
python db/etl_sqlite.py     # commodity export + data/Fast uni.xlsx (fertilizer)
cd .. && npm run deploy
```

Then commit + push. The build keeps the database under GitHub's 100 MB limit
(currently ~91 MB) by keeping only the indexes the API uses.

Fertilizer (`api/db/fertilizer.py`): each brand product ("Sona Urea") is a
by-product of Fertilizer, priced per 50 kg bag, rate type Dealer, location
"All Pakistan" (the file has no stations), limited to the commodity export's
dates. It also writes `app/src/customer-face/shared/data/fertilizerBrands.json`
(by-product → company), which the cards show as **Company**.

## Urdu voice

The voice pack is plain files in `app/public/voice_pack/`, so it deploys with the
app; there is no speech server. To add speech, see "Urdu voice" in `README.md`,
then deploy as above.
