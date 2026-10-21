"""Generates the Urdu voice pack with Microsoft's Uzma neural voice (ur-PK-UzmaNeural).

Every distinct chunk of every app phrase (tts/phrases.json) plus the number
words, one clip each, in app/public/voice_pack/clips/*.mp3 (24 kHz mono). The
app plays them itself (app/src/lib/voicePack.ts), so they deploy to Vercel with
the rest of the app.
<out>/manifest.jsonl logs every clip made; <out>/manifest.json (text -> file)
is what the app loads. Speech comes from the edge-tts package (the read-aloud
service built into Microsoft Edge), so no Azure account is needed. Resumable:
clips already in the manifest are skipped.

  python tts/generate_pack_edge.py                       # everything new in phrases.json
  python tts/generate_pack_edge.py --only "نیا جملہ"      # add (or redo) one phrase
  python tts/generate_pack_edge.py --limit 5             # try a few

Then deploy the app as usual and the new clips go live.

Needs: pip install edge-tts soundfile numpy
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import io
import json
import sys
from pathlib import Path

import edge_tts
import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from urdu_text import CORE_WORDS, chunks, key  # noqa: E402

SAMPLE_RATE = 24000  # edge-tts sends 24 kHz MP3
# The Urdu voice returns no audio for text in Latin letters only; say these in Urdu script.
SPOKEN = {"EasyPaisa": "ایزی پیسہ", "JazzCash": "جاز کیش", "SadaPay": "سادہ پے"}


def clip_name(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:16] + ".mp3"


def build_units(phrases_path: Path) -> list[str]:
    """Core words first (numbers make every price speakable), then short to long."""
    phrases = json.loads(phrases_path.read_text("utf-8"))["phrases"]
    units = {key(c) for p in phrases for c in chunks(p["text"])}
    core = list(dict.fromkeys(CORE_WORDS))
    return core + sorted(units - set(core), key=lambda u: (len(u.split()), u))


def trim_and_level(wav: np.ndarray, threshold: float = 0.02, pad: int = 1200) -> np.ndarray:
    """Cut leading/trailing silence and bring the clip to a common loudness."""
    loud = np.flatnonzero(np.abs(wav) > threshold * max(np.abs(wav).max(), 1e-6))
    if loud.size:
        wav = wav[max(0, loud[0] - pad): loud[-1] + pad]
    rms = np.sqrt(np.mean(wav**2)) or 1.0
    wav = wav * (0.08 / rms)
    peak = np.abs(wav).max()
    return wav / peak * 0.95 if peak > 0.95 else wav


async def speak(text: str, voice: str, rate: str) -> np.ndarray:
    mp3 = bytearray()
    async for part in edge_tts.Communicate(text, voice, rate=rate).stream():
        if part["type"] == "audio":
            mp3.extend(part["data"])
    if not mp3:
        raise RuntimeError("no audio returned")
    wav, sr = sf.read(io.BytesIO(bytes(mp3)), dtype="float32")
    if wav.ndim > 1:
        wav = wav.mean(axis=1)
    if sr != SAMPLE_RATE:
        n = int(len(wav) * SAMPLE_RATE / sr)
        wav = np.interp(np.linspace(0, len(wav) - 1, n), np.arange(len(wav)), wav).astype(np.float32)
    return trim_and_level(wav)


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--phrases", type=Path, default=HERE / "phrases.json")
    ap.add_argument("--out", type=Path, default=HERE.parent / "app" / "public" / "voice_pack")
    ap.add_argument("--voice", default="ur-PK-UzmaNeural")
    ap.add_argument("--rate", default="-5%", help="speaking speed, e.g. -10% (slower) or +0%")
    ap.add_argument("--parallel", type=int, default=4)
    ap.add_argument("--limit", type=int, default=0, help="stop after this many new clips")
    ap.add_argument("--only", nargs="*", default=None, help="generate (or redo) just these texts")
    args = ap.parse_args()

    clips = args.out / "clips"
    clips.mkdir(parents=True, exist_ok=True)
    manifest = args.out / "manifest.jsonl"
    done = set()
    if manifest.exists():
        done = {json.loads(line)["text"] for line in manifest.read_text("utf-8").splitlines() if line.strip()}
    if args.only is not None:
        todo = list(dict.fromkeys(key(c) for t in args.only for c in chunks(t)))
    else:
        todo = [u for u in build_units(args.phrases) if u not in done]
    if args.limit:
        todo = todo[: args.limit]
    print(f"{len(done)} clips already made, {len(todo)} to generate with {args.voice}", flush=True)

    gate = asyncio.Semaphore(args.parallel)
    failed: list[str] = []
    made = 0

    async def one(text: str, log) -> None:
        nonlocal made
        async with gate:
            for attempt in range(4):
                try:
                    wav = await speak(SPOKEN.get(text, text), args.voice, args.rate)
                    break
                except Exception as e:  # network hiccups / throttling: back off and retry
                    if attempt == 3:
                        failed.append(text)
                        print(f"FAILED  {text}  ({e})", flush=True)
                        return
                    await asyncio.sleep(2 * (attempt + 1))
        name = clip_name(text)
        sf.write(clips / name, wav, SAMPLE_RATE, format="MP3")
        log.write(json.dumps({"text": text, "file": name, "seconds": round(len(wav) / SAMPLE_RATE, 2),
                              "voice": args.voice, "rate": args.rate}, ensure_ascii=False) + "\n")
        log.flush()
        made += 1
        if made % 50 == 0 or made == len(todo):
            print(f"[{made}/{len(todo)}]  {text}", flush=True)

    with manifest.open("a", encoding="utf-8") as log:
        await asyncio.gather(*(one(t, log) for t in todo))
    write_index(args.out)
    print(f"made {made}, failed {len(failed)}" + (" (run again to retry them)" if failed else ""))


def write_index(out: Path) -> None:
    """manifest.json for the app: {text: file}, the latest clip per text."""
    files = {}
    for line in (out / "manifest.jsonl").read_text("utf-8").splitlines():
        if line.strip():
            entry = json.loads(line)
            files[entry["text"]] = entry["file"]
    (out / "manifest.json").write_text(json.dumps(files, ensure_ascii=False, separators=(",", ":")), "utf-8")
    print(f"{out / 'manifest.json'}: {len(files)} clips")


if __name__ == "__main__":
    asyncio.run(main())
