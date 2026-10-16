# Deploying Zarai Mandi on Vercel

The app needs two Vercel projects from the same GitHub repo: the **app**
(the website) and the **Market API** (the rates, trends and map data). Without
the API the site loads, but every card, trend and map says "no data", because
the app calls `http://localhost:8090`, and on a phone that address is the phone
itself.

## 1. Market API project (once)

1. Vercel → **Add New… → Project** → import `ZM-CLEAN-BBUILD`.
2. **Root Directory:** `zarai-mandi/api`
3. Framework preset: **Other**. Leave build/output settings empty.
4. Deploy. `api/vercel.json` sends every path to one function (`api/index.js`),
   which bundles `db/zarai_mandi.sqlite` (Node 22, `node:sqlite`).
5. Check it: open `https://<api-project>.vercel.app/api/health`, which should show
   `{"ok":true,"priceRecords":…}`.

The first request after a pause takes a few seconds (it copies the 98 MB
database to `/tmp`); after that it is fast.

## 2. App project

1. In the existing app project → **Settings → Environment Variables**, add:
   - `VITE_MARKET_API_URL` = `https://<api-project>.vercel.app` (no trailing `/`)
   - for Production, Preview and Development.
2. **Redeploy** (Deployments → ⋯ → Redeploy). `VITE_` variables are baked in at
   build time, so a redeploy is needed after changing them.

Root Directory for the app is `zarai-mandi` (uses `zarai-mandi/vercel.json`) or
`zarai-mandi/app` (uses `app/vercel.json`); both work.

## 3. Getting new changes onto the site

Vercel builds what is **pushed to GitHub**. Local edits do not appear until they
are committed and pushed:

```bash
git add -A
git commit -m "…"
git push
```

Check **Settings → Git → Production Branch**: it must be the branch you push
to (currently `claude/laughing-cannon-00qist`), otherwise pushes only create
Preview deployments, not the main link.

## Updating the data

Rebuild `api/db/zarai_mandi.sqlite` (see `api/README.md`), commit, push. The API
project redeploys with the new database. GitHub rejects files over 100 MB; the
current database is about 98 MB.

## Not on Vercel

- The text-to-speech backend (`backend/`, Python) is not deployed. The app's
  spoken read-outs use the phone's own speech, so they keep working; only the
  `VoiceAssistant` component calls that backend (`VITE_TTS_API_URL`).
