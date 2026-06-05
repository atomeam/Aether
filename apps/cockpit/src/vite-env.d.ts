/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COCKPIT_API: string
  readonly VITE_COCKPIT_WS: string
  readonly VITE_COCKPIT_TOKEN: string
  readonly VITE_COCKPIT_VIEWER_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}