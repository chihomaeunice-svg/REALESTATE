/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_THEME?: "meridian" | "terracotta" | "coastal" | "forest" | "monochrome";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
