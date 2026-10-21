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
// Ahead of images in the download queue: a tap's speech shouldn't wait behind them.
const URGENT = { priority: "high" } as RequestInit;

let manifest: Promise<Map<string, string>> | null = null;
let maxLen = 0;
let context: AudioContext | null = null;
const clips = new Map<string, Promise<AudioBuffer>>();

async function fetchManifest(): Promise<Record<string, string>> {
  // One retry: a dropped request on a weak mobile connection shouldn't cost the voice.
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await fetch(`${PACK_URL}manifest.json`, URGENT);
      if (!r.ok) throw new Error(`voice pack manifest: ${r.status}`);
      return (await r.json()) as Record<string, string>;
    } catch (err) {
      if (attempt >= 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
}

function loadManifest(): Promise<Map<string, string>> {
  manifest ??= fetchManifest()
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

// Decodes the MP3 clips (no sound goes through it, so it needn't be resumed).
function audioContext(): AudioContext {
  if (!context) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    context = new Ctx();
  }
  return context;
}

// Speech plays through one shared <audio> element, not Web Audio: iPhones mute
// Web Audio when the ring/silent switch is on, but media playback still sounds.
let player: HTMLAudioElement | null = null;
let playerUrl: string | null = null;
let unlocked = false;
// 0.01 s of silence, played during the first tap so later plays are allowed.
const SILENCE = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA";

/**
 * Call while handling a tap: phones only let audio start from a user gesture,
 * and the element started then may play again later (after the clips load).
 */
export function unlockAudio(): void {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) session.type = "playback"; // Safari 16.4+: sound even in silent mode
  if (!player) {
    player = new Audio();
    player.setAttribute("playsinline", "");
    player.preload = "auto";
  }
  // Until a play has succeeded (it fails outside a tap), try again on each call.
  if (!unlocked && player.paused) {
    player.src = SILENCE;
    player.play().then(() => (unlocked = true), () => {});
  }
}

/** 16-bit mono WAV, which every browser's <audio> plays. */
function wavBlob(samples: Float32Array, rate: number): Blob {
  const data = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const text = (at: number, s: string) => [...s].forEach((c, i) => data.setUint8(at + i, c.charCodeAt(0)));
  text(0, "RIFF");
  data.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVEfmt ");
  data.setUint32(16, 16, true);
  data.setUint16(20, 1, true); // PCM
  data.setUint16(22, 1, true); // mono
  data.setUint32(24, rate, true);
  data.setUint32(28, rate * 2, true);
  data.setUint16(32, 2, true);
  data.setUint16(34, 16, true);
  text(36, "data");
  data.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    data.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true);
  }
  return new Blob([data], { type: "audio/wav" });
}

function loadClip(file: string): Promise<AudioBuffer> {
  let clip = clips.get(file);
  if (!clip) {
    clip = fetch(`${PACK_URL}clips/${file}`, URGENT)
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

/** `work`, or an AbortError as soon as `signal` aborts (without waiting for `work`). */
function untilAborted<T>(work: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return work;
  const abortError = () => new DOMException("Aborted", "AbortError");
  if (signal.aborted) return Promise.reject(abortError());
  return Promise.race([
    work,
    new Promise<never>((_, reject) => signal.addEventListener("abort", () => reject(abortError()), { once: true })),
  ]);
}

/** Plays `text` from the pack, or returns null when the pack can't say all of it. */
export async function speakFromPack(text: string, signal?: AbortSignal): Promise<PackSpeech | null> {
  unlockAudio();
  const planned = await untilAborted(planSpeech(text), signal);
  if (!planned) return null;
  const files = await loadManifest();
  const buffers = await untilAborted(
    Promise.all(planned.map((pieces) => Promise.all(pieces.map((p) => loadClip(files.get(p)!))))),
    signal,
  );

  const rate = buffers[0][0].sampleRate;
  let length = 0;
  buffers.forEach((chunk, c) => {
    if (c) length += Math.round(CHUNK_GAP * rate);
    chunk.forEach((b, p) => {
      if (p) length += Math.round(WORD_GAP * rate);
      length += b.length;
    });
  });
  const out = new Float32Array(length);
  let at = 0;
  buffers.forEach((chunk, c) => {
    if (c) at += Math.round(CHUNK_GAP * rate);
    chunk.forEach((b, p) => {
      if (p) at += Math.round(WORD_GAP * rate);
      out.set(b.getChannelData(0), at);
      at += b.length;
    });
  });

  const audio = player!;
  if (playerUrl) URL.revokeObjectURL(playerUrl);
  playerUrl = URL.createObjectURL(wavBlob(out, rate));
  let finish: () => void = () => {};
  const done = new Promise<void>((resolve) => (finish = resolve));
  const onEnd = () => finish();
  audio.addEventListener("ended", onEnd, { once: true });
  audio.addEventListener("error", onEnd, { once: true });
  const stop = () => {
    audio.pause();
    audio.removeEventListener("ended", onEnd);
    finish();
  };
  signal?.addEventListener("abort", stop, { once: true });
  audio.src = playerUrl;
  await audio.play();
  unlocked = true;
  return { done, stop };
}
