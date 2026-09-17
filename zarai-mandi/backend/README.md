# Zarai Mandi Urdu Neural TTS Backend

Dedicated, high-fidelity Urdu Text-to-Speech API powered by Meta's [`facebook/mms-tts-urd`](https://huggingface.co/facebook/mms-tts-urd) (VITS) model producing actual high-quality audio waveforms.

---

## 🚀 Quick Start (Windows)

### Option 1: Direct Batch Runner (Easiest)
Simply double click:
```cmd
run_backend.bat
```

### Option 2: Manual Terminal Commands
```powershell
# 1. Navigate to backend directory
cd urdu-tts-backend

# 2. Activate virtual environment
..\FULL APP\.venv\Scripts\activate

# 3. Run FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 📡 API Endpoints

### 1. Synthesize Urdu Speech
- **Endpoint**: `POST /api/tts` (or `POST /tts`)
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "text": "آج پاکپتن منڈی میں گندم کا ریٹ ۳۸۰۰ روپے ہے",
  "language": "ur"
}
```
- **Response**: Binary `audio/wav` stream with automatic browser caching headers.

### 2. Health & Status
- **Endpoint**: `GET /health`
- **Response**:
```json
{
  "status": "online",
  "service": "Urdu Neural TTS API",
  "model": "facebook/mms-tts-urd",
  "device": "cpu",
  "cached_phrases": 12
}
```

---

## ⚡ Performance Features
- **In-Memory LRU Audio Cache**: Repeated phrases (mandi names, crop rates, navigation labels) return in `< 5ms`.
- **Pre-warmed Model**: Model initializes on server launch for zero initial delay during user browsing.
- **Frontend Fallback**: The React app in `CustomerFaceApp.tsx` and `VoiceAssistant.tsx` will seamlessly use the backend when running and gracefully fallback to browser voice if offline.
