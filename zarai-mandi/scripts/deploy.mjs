#!/usr/bin/env node
// Safe deploy for the two Vercel projects (see DEPLOY.md):
//
//   npm run deploy            check → deploy API (only if it changed) → deploy app → test live
//   npm run deploy -- --api   also redeploy the API even if nothing changed
//   npm run deploy -- --check run the checks only (nothing is deployed)
//
// Nothing is deployed unless every check passes, so a broken change never
// reaches the live site:
//   1. app type-check (tsc) and production build (vite build)
//   2. the API, started locally on the current database, answers the
//      endpoints the app needs (with data)
//   3. after deploying, the live API and site are tested the same way
// The API is redeployed whenever its code, data or config changed since the
// last deploy (hash in api/.vercel/deployed-hash), so app ↔ API stay in step.

import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.join(ROOT, "app");
const API = path.join(ROOT, "api");
const SCOPE = "final-yappers";
const LIVE_API = "https://zarai-mandi-api.vercel.app";
const LIVE_APP = "https://zarai-mandi-app.vercel.app";
const HASH_FILE = path.join(API, ".vercel", "deployed-hash");
const args = new Set(process.argv.slice(2));

const step = (s) => console.log(`\n▶ ${s}`);
const fail = (s) => {
  console.error(`\n✖ ${s}\nNothing more was deployed.`);
  process.exit(1);
};
function run(cmd, cwd, { quiet = false } = {}) {
  const r = spawnSync(cmd, { cwd, shell: true, encoding: "utf8", stdio: quiet ? "pipe" : "inherit" });
  return { ok: r.status === 0, out: `${r.stdout || ""}${r.stderr || ""}` };
}
async function getJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (res.ok) return await res.json();
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

// What the app needs from the API, with real data.
async function testApi(base) {
  const problems = [];
  const health = await getJson(`${base}/api/health`);
  if (!health?.ok || !(health.priceRecords > 0)) problems.push("/api/health has no price records");
  const dataset = await getJson(`${base}/api/dataset`);
  if (!dataset?.first || !dataset?.last) problems.push("/api/dataset has no date range");
  const verticals = await getJson(`${base}/api/verticals`);
  if (!Array.isArray(verticals) || verticals.length === 0) problems.push("/api/verticals is empty");
  for (const division of ["Wheat", "Rice", "Fertilizer"]) {
    const cards = await getJson(`${base}/api/verticals/${division}/card-stats`);
    if (!Array.isArray(cards) || !cards.some((c) => c.hasData && c.avgMax > 0)) problems.push(`${division} cards have no prices`);
  }
  return { problems, records: health?.priceRecords, last: dataset?.last };
}

function hashApi() {
  const h = crypto.createHash("sha256");
  const add = (p) => {
    const st = fs.statSync(p);
    if (st.isDirectory()) for (const f of fs.readdirSync(p).sort()) add(path.join(p, f));
    else if (p.endsWith(".sqlite")) h.update(`${path.relative(API, p)}:${st.size}:${st.mtimeMs}`);
    else h.update(`${path.relative(API, p)}:`).update(fs.readFileSync(p));
  };
  for (const p of ["src", "api", "db/zarai_mandi.sqlite", "db/specialAttributes.json", "package.json", "vercel.json", ".vercelignore"]) {
    const full = path.join(API, p);
    if (fs.existsSync(full)) add(full);
  }
  return h.digest("hex");
}

function vercelDeploy(cwd) {
  // Vercel sometimes answers "An unexpected internal error occurred": try again.
  for (let i = 1; i <= 3; i++) {
    const r = run(`npx --yes vercel@latest deploy --prod --yes --scope ${SCOPE}`, cwd, { quiet: true });
    if (r.ok && /ready|Production URL/i.test(r.out)) return true;
    console.log(`  deploy attempt ${i} failed${i < 3 ? ", retrying…" : ""}`);
    if (i === 3) console.log(r.out.split("\n").filter((l) => /error|message/i.test(l)).slice(0, 8).join("\n"));
  }
  return false;
}

// ── 1. App checks ──
step("App: type-check");
if (!run("npx tsc --noEmit -p .", APP).ok) fail("TypeScript errors (see above).");
step("App: production build");
if (!run("npx vite build", APP, { quiet: true }).ok) fail("vite build failed — run `npx vite build` in app/ to see why.");
if (!fs.existsSync(path.join(APP, "dist", "src", "icons"))) fail("The build did not copy src/icons (icons would be missing on the site).");

// ── 2. API checks (local server on the current database) ──
step("API: sync specialAttributes.json from the app");
fs.copyFileSync(path.join(APP, "src/customer-face/shared/data/specialAttributes.json"), path.join(API, "db/specialAttributes.json"));
step("API: start locally and test");
const port = 8790 + Math.floor(Math.random() * 100);
const server = spawn(process.execPath, ["src/server.js"], { cwd: API, env: { ...process.env, PORT: String(port) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3500));
const local = await testApi(`http://127.0.0.1:${port}`);
server.kill();
if (local.problems.length) fail(`Local API: ${local.problems.join("; ")}`);
console.log(`  ok: ${local.records} price records, latest day ${local.last}`);

if (args.has("--check")) {
  console.log("\n✔ All checks passed (--check: nothing deployed).");
  process.exit(0);
}

// ── 3. Deploy ──
const apiHash = hashApi();
const deployedHash = fs.existsSync(HASH_FILE) ? fs.readFileSync(HASH_FILE, "utf8").trim() : "";
if (args.has("--api") || apiHash !== deployedHash) {
  step("API changed: deploying zarai-mandi-api");
  if (!vercelDeploy(API)) fail("API deploy failed.");
  const live = await testApi(LIVE_API);
  if (live.problems.length) fail(`Live API: ${live.problems.join("; ")}`);
  fs.mkdirSync(path.dirname(HASH_FILE), { recursive: true });
  fs.writeFileSync(HASH_FILE, apiHash);
  console.log(`  live API ok: ${live.records} price records, latest day ${live.last}`);
} else {
  step("API unchanged since the last deploy: skipped");
}

step("Deploying zarai-mandi-app");
if (!vercelDeploy(APP)) fail("App deploy failed.");

// ── 4. Live site test ──
step("Testing the live site");
const html = await fetch(LIVE_APP).then((r) => (r.ok ? r.text() : ""), () => "");
const js = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
const bundle = js ? await fetch(LIVE_APP + js).then((r) => r.text(), () => "") : "";
if (!bundle.includes("zarai-mandi-api.vercel.app")) fail("The live site is not built with the API address (VITE_MARKET_API_URL).");
const icon = await fetch(`${LIVE_APP}/src/icons/products/wheat200.png`).then((r) => r.status, () => 0);
if (icon !== 200) console.warn(`  warning: a product icon returned ${icon}`);
const liveApi = await testApi(LIVE_API);
if (liveApi.problems.length) fail(`Live API: ${liveApi.problems.join("; ")}`);

console.log(`\n✔ Deployed and tested.\n  Site: ${LIVE_APP}\n  API:  ${LIVE_API}/api/health`);
