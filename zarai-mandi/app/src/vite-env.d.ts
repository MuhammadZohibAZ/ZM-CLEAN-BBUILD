/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_SPEECH_KEY?: string;
  readonly VITE_AZURE_REGION?: string;
  readonly VITE_MARKET_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
