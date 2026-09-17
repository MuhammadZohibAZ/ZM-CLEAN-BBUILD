import io
import os
import hashlib
import logging
from typing import Optional
import numpy as np
import scipy.io.wavfile
import torch
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, VitsModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("urdu-tts")

app = FastAPI(
    title="Zarai Mandi Urdu TTS Backend",
    description="Dedicated Urdu Neural Text-to-Speech API powered by facebook/mms-tts-urd (VITS)",
    version="1.0.0",
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = os.getenv("TTS_MODEL_NAME", "facebook/mms-tts-urd-script_arabic")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

model: Optional[VitsModel] = None
tokenizer: Optional[AutoTokenizer] = None

# In-memory LRU audio cache for ultra-fast response on frequent phrases
audio_cache: dict[str, bytes] = {}
MAX_CACHE_ENTRIES = 500


def get_model_and_tokenizer():
    global model, tokenizer
    if model is None or tokenizer is None:
        logger.info(f"Loading Urdu TTS model '{MODEL_NAME}' on {DEVICE}...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        model = VitsModel.from_pretrained(MODEL_NAME)
        model.to(DEVICE)
        model.eval()
        logger.info("Urdu TTS model loaded successfully!")
    return model, tokenizer


class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "ur"
    speed: Optional[float] = 1.0


def synthesize_urdu_wav(text: str) -> bytes:
    cleaned = text.strip()
    if not cleaned:
        raise ValueError("Empty text provided")

    cache_key = hashlib.sha256(cleaned.encode("utf-8")).hexdigest()
    if cache_key in audio_cache:
        return audio_cache[cache_key]

    tts_model, tts_tokenizer = get_model_and_tokenizer()

    inputs = tts_tokenizer(cleaned, return_tensors="pt")
    input_ids = inputs["input_ids"].to(DEVICE)

    with torch.no_grad():
        output = tts_model(input_ids=input_ids).waveform

    waveform = output.squeeze().cpu().numpy()

    # Normalize and convert to 16-bit PCM for universal browser audio compatibility
    max_val = np.max(np.abs(waveform))
    if max_val > 0:
        waveform = waveform / max_val
    waveform = (waveform * 32767).astype(np.int16)

    buffer = io.BytesIO()
    sampling_rate = getattr(tts_model.config, "sampling_rate", 16000)
    scipy.io.wavfile.write(buffer, rate=sampling_rate, data=waveform)
    wav_bytes = buffer.getvalue()

    if len(audio_cache) < MAX_CACHE_ENTRIES:
        audio_cache[cache_key] = wav_bytes

    return wav_bytes


@app.on_event("startup")
async def startup_event():
    try:
        logger.info("Pre-warming Urdu TTS model on startup...")
        get_model_and_tokenizer()
        synthesize_urdu_wav("خوش آمدید")
        logger.info("Startup warmup complete. Ready to serve audio!")
    except Exception as e:
        logger.warning(f"Deferred model loading to first request: {e}")


@app.get("/health")
@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "Urdu Neural TTS API",
        "model": MODEL_NAME,
        "device": DEVICE,
        "cached_phrases": len(audio_cache),
    }


@app.post("/api/tts")
@app.post("/tts")
def generate_speech_post(req: TTSRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text field cannot be empty.")
    try:
        wav_bytes = synthesize_urdu_wav(req.text)
        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": 'inline; filename="urdu_speech.wav"',
                "Cache-Control": "public, max-age=86400",
                "Accept-Ranges": "bytes",
            },
        )
    except Exception as e:
        logger.error(f"TTS Synthesis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")


@app.get("/api/tts")
def generate_speech_get(text: str = Query(..., description="Urdu text to speak")):
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text parameter cannot be empty.")
    try:
        wav_bytes = synthesize_urdu_wav(text)
        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": 'inline; filename="urdu_speech.wav"',
                "Cache-Control": "public, max-age=86400",
            },
        )
    except Exception as e:
        logger.error(f"TTS Synthesis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    logger.info(f"Starting Urdu TTS Server on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=False)
