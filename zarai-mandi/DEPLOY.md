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

## Deploying changes

Both projects are deployed from this computer with the Vercel CLI (logged in
as the account that owns final-yappers). Each folder is linked to its project
(`.vercel/`, not committed).

```bash
# Website (after app changes)
cd zarai-mandi/app
npm run deploy

# API (after API or data changes)
cd zarai-mandi/api
npm run deploy      # first copies the app's specialAttributes.json into db/
```

`npm run deploy` runs `vercel deploy --prod --yes --scope final-yappers`. If
it reports "An unexpected internal error occurred", run it again (a Vercel-side
hiccup).

Also push to GitHub as usual so the code stays in sync.

## How the API runs on Vercel

- `api/api/index.js` is the only function; `api/vercel.json` sends every path to
  it and bundles `db/zarai_mandi.sqlite` and `db/specialAttributes.json`.
- On a cold start the 98 MB database is copied to `/tmp` (SQLite needs a
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

Rebuild `api/db/zarai_mandi.sqlite` (see `api/README.md`), then
`cd api && npm run deploy`, and commit + push. GitHub rejects files over
100 MB; the current database is about 98 MB.

## Not on Vercel

- The text-to-speech backend (`backend/`, Python) is not deployed. The app's
  spoken read-outs use the phone's own speech, so they keep working; only the
  `VoiceAssistant` component calls that backend (`VITE_TTS_API_URL`).
