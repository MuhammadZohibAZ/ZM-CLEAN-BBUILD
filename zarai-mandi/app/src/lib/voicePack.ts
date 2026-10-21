// Speaks Urdu from the pre-generated voice pack in public/voice_pack/
// (made by zarai-mandi/tts/generate_pack_edge.py), right in the browser, so it
// works wherever the app is hosted. Joining rules (as the old speech server's
// voice_pack.py): each chunk is spelled with the fewest clips (whole phrases
// where they exist, single words and number words otherwise), joined with short
// gaps. Text with any word the pack lacks returns null, so callers can fall back.

import { chunks, cover } from "./urduText";

const PACK_URL = `${import.meta.env.BASE_URL}voice_pack/`;
const WORD_GAP = 0.07; // seconds between clips inside a chunk
const CHUNK_GAP = 0.28; // seconds at punctuation

let manifest: Promise<Map<string, string>> | null = null;
let maxLen = 0;
let context: AudioContext | null = null;
const clips = new Map<string, Promise<AudioBuffer>>();

function loadManifest(): Promise<Map<string, string>> {
  manifest ??= fetch(`${PACK_URL}manifest.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`voice pack manifest: ${r.status}`);
      return r.json() as Promise<Record<string, string>>;
    })
    .then((files) => {
      maxLen = Math.max(0, ...Object.keys(files).map((t) => t.split(" ").length));
      return new Map(Object.entries(files));
    })
    .catch((err) => {
      manifest = null; // try again next time
      throw err;
    });
  return manifest;
}

/**
 * The shared AudioContext, resumed. Call it while handling a tap: phones only
 * let audio start from a user gesture, and a context resumed then stays usable.
 */
export function audioContext(): AudioContext {
  if (!context) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    context = new Ctx();
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

function loadClip(file: string): Promise<AudioBuffer> {
  let clip = clips.get(file);
  if (!clip) {
    clip = fetch(`${PACK_URL}clips/${file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`voice clip ${file}: ${r.status}`);
        return r.arrayBuffer();
      })
      .then((data) => audioContext().decodeAudioData(data));
    clip.catch(() => clips.delete(file));
    clips.set(file, clip);
  }
  return clip;
}

/** The clips that would speak `text`, chunk by chunk, or null if any word is missing. */
export async function planSpeech(text: string): Promise<string[][] | null> {
  const files = await loadManifest();
  const planned: string[][] = [];
  for (const words of chunks(text)) {
    const pieces = cover(words, files, maxLen);
    if (!pieces) return null;
    planned.push(pieces);
  }
  return planned.length ? planned : null;
}

/** Fetch the manifest early (e.g. when Urdu is chosen) so the first tap speaks without delay. */
export function preloadVoicePack(): void {
  void loadManifest().catch(() => {});
}

export interface PackSpeech {
  /** Resolves when playback finishes or is stopped. */
  done: Promise<void>;
  stop: () => void;
}

/** Plays `text` from the pack, or returns null when the pack can't say all of it. */
export async function speakFromPack(text: string, signal?: AbortSignal): Promise<PackSpeech | null> {
  const ctx = audioContext();
  const planned = await planSpeech(text);
  if (!planned) return null;
  const files = await loadManifest();
  const buffers = await Promise.all(planned.map((pieces) => Promise.all(pieces.map((p) => loadClip(files.get(p)!)))));
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const rate = buffers[0][0].sampleRate;
  let length = 0;
  buffers.forEach((chunk, c) => {
    if (c) length += Math.round(CHUNK_GAP * rate);
    chunk.forEach((b, p) => {
      if (p) length += Math.round(WORD_GAP * rate);
      length += b.length;
    });
  });
  const joined = ctx.createBuffer(1, length, rate);
  const out = joined.getChannelData(0);
  let at = 0;
  buffers.forEach((chunk, c) => {
    if (c) at += Math.round(CHUNK_GAP * rate);
    chunk.forEach((b, p) => {
      if (p) at += Math.round(WORD_GAP * rate);
      out.set(b.getChannelData(0), at);
      at += b.length;
    });
  });

  const source = ctx.createBufferSource();
  source.buffer = joined;
  source.connect(ctx.destination);
  let finish: () => void = () => {};
  const done = new Promise<void>((resolve) => (finish = resolve));
  source.onended = () => finish();
  const stop = () => {
    try {
      source.stop();
    } catch {
      // already stopped
    }
    finish();
  };
  signal?.addEventListener("abort", stop, { once: true });
  source.start();
  return { done, stop };
}
