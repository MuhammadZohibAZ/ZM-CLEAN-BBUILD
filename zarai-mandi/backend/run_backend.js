import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check possible python locations
const candidates = [
  path.join(__dirname, ".venv", "bin", "python"),
  path.join(__dirname, ".venv", "bin", "python3"),
  path.join(__dirname, ".venv", "Scripts", "python.exe"),
  path.join(__dirname, "..", "FULL APP", ".venv", "Scripts", "python.exe"),
  process.platform === "win32" ? "python" : "python3",
  "python"
];

let pythonCmd = null;
for (const cand of candidates) {
  if (path.isAbsolute(cand)) {
    if (fs.existsSync(cand)) {
      pythonCmd = cand;
      break;
    }
  } else {
    pythonCmd = cand;
    break;
  }
}

console.log("[TTS] Attempting to start Urdu TTS backend with " + pythonCmd + "...");

const proc = spawn(pythonCmd, ["-u", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"], {
  cwd: __dirname,
  stdio: "inherit"
});

proc.on("error", (err) => {
  console.log("[TTS] Note: Python TTS backend not available (" + err.message + ").");
  console.log("[TTS] VoiceAssistant will use browser speech synthesis fallback.");
  // keep process alive so concurrently doesn't kill frontend/api
  setInterval(() => {}, 1000 * 60 * 60);
});

proc.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.log(`[TTS] Backend process exited (code ${code}).`);
    console.log("[TTS] VoiceAssistant will use browser speech synthesis fallback.");
    setInterval(() => {}, 1000 * 60 * 60);
  }
});
