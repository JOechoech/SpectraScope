/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALPHA_VANTAGE_KEY: string;
  readonly VITE_POLYGON_KEY: string;
  readonly VITE_DEFAULT_AI_PROVIDER: string;
  readonly VITE_ENABLE_REAL_TIME: string;
  readonly VITE_ENABLE_SOCIAL_SENTIMENT: string;
  readonly VITE_MOCK_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
