// Collects every Urdu string the app can speak, for pre-generating the voice pack.
//
// Sources: the Urdu dictionaries (UI labels, products, by-products, places) and
// every Urdu string or template piece in files that call speakText/speakUrdu.
// Template literals are split at their ${...} holes, so `ضلع ${d} کی منڈیاں`
// yields "ضلع" and "کی منڈیاں"; the holes are names (already in the
// dictionaries) or numbers (spoken from number clips).
//
// Usage: node tts/extract_phrases.mjs > tts/phrases.json

import { readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "app", "src");
const ts = createRequire(join(root, "app", "package.json"))("typescript");

const URDU = /[؀-ۿ]/;
const DICTIONARIES = [
  "customer-face/shared/i18n/urduDictionary.ts",
  "customer-face/shared/i18n/dataNamesUrdu.ts",
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}

const files = walk(src).filter((f) => {
  if (DICTIONARIES.includes(relative(src, f))) return true;
  return /\b(speakText|speakUrdu|onListen)\s*\(/.test(readFileSync(f, "utf8"));
});

const phrases = new Map(); // text -> first source file

function add(text, file) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t && URDU.test(t) && !phrases.has(t)) phrases.set(t, relative(src, file));
}

for (const file of files) {
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node)) {
      add(node.text, file);
    } else if (ts.isTemplateExpression(node)) {
      add(node.head.text, file);
      for (const span of node.templateSpans) add(span.literal.text, file);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

const out = [...phrases].map(([text, source]) => ({ text, source }));
process.stdout.write(JSON.stringify({ count: out.length, files: files.map((f) => relative(src, f)), phrases: out }, null, 1));
